import React, { useMemo, useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  UserPlus,
  Sparkles,
  Copy,
  Check,
  Edit2,
  Trash2,
  Search,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Banknote,
  Building2,
  UserMinus,
  ChevronDown,
  ChevronUp,
  Layers,
  Shield,
  Calendar,
  MapPin,
  FileCheck2,
  Wallet,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import { HeaderDescription } from "./HeaderDescription";
import {
  MatchFormat,
  PlayerPosition,
  SelectTeamMatch,
  SelectTeamMember,
  SelectTeamParticipationStatus,
  SelectTeamPaymentStatus,
  TrainingGroup,
} from "../types";
import {
  analyzePlayerRoleFit,
  analyzeSquadReadiness,
  FormationSlot,
  formatCompetitionPlaceLabel,
  formatSelectTeamShareText,
  getFormationById,
  getTeamMatchSummary,
  PARTICIPATION_META,
  PAYMENT_META,
  POSITION_META,
  resolveClientBranch,
  smartAssignTeamRoles,
} from "../utils/selectTeamIntelligence";
import { SelectTeamFormModal } from "./select-teams/SelectTeamFormModal";
import { SelectTeamScoutModal } from "./select-teams/SelectTeamScoutModal";
import { TacticalPitchView } from "./select-teams/TacticalPitchView";
import { CompetitionResultsView } from "./select-teams/CompetitionResultsView";
import { CompetitionStatsBoard } from "./select-teams/CompetitionStatsBoard";
import {
  UniformKitControl,
  UniformFilterValue,
  matchesUniformFilter,
} from "./UniformKitControl";

const ROLE_LABELS_RU: Record<string, string> = {
  admin: "Администратор",
  director: "Директор",
  manager: "Менеджер",
  trainer: "Тренер",
};

const TEAM_STATUS_LABELS: Record<string, { label: string; textClass: string }> = {
  forming: { label: "Идёт набор", textClass: "text-amber-700" },
  ready: { label: "Состав утверждён", textClass: "text-emerald-700" },
  completed: { label: "Турнир завершён", textClass: "text-slate-500" },
};

function formatDateRu(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return iso;
}

export const SelectTeamsModule: React.FC = () => {
  const {
    groups,
    clients,
    coaches,
    accounts,
    counterparties,
    trainingSessions,
    currentRole,
    userProfile,
    createSelectTeam,
    updateGroup,
    deleteGroup,
    removeClientFromSelectTeam,
    updateSelectTeamMember,
    batchUpdateSelectTeamRoster,
    recordSelectTeamFeePayment,
    updateClient,
  } = useCRM();
  const { appUser } = useAuth();

  const selectTeams = useMemo(
    () =>
      groups
        .filter((g) => Boolean(g.isSelectTeam))
        .sort((a, b) => {
          // Active/forming teams first, then by competition date or birth year
          const aDone = a.selectTeamStatus === "completed" ? 1 : 0;
          const bDone = b.selectTeamStatus === "completed" ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          return (b.birthYearFrom || b.year || 0) - (a.birthYearFrom || a.year || 0);
        }),
    [groups],
  );

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    "roster" | "tactics" | "fees" | "results" | "stats"
  >("roster");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TrainingGroup | null>(null);
  const [isScoutModalOpen, setIsScoutModalOpen] = useState(false);
  const [confirmDeleteTeam, setConfirmDeleteTeam] =
    useState<TrainingGroup | null>(null);

  // Roster Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterParticipation, setFilterParticipation] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterUniform, setFilterUniform] =
    useState<UniformFilterValue>("all");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Fee tab controls
  const [selectedFinanceAccountId, setSelectedFinanceAccountId] = useState<string>("");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    if (!selectedFinanceAccountId && accounts.length > 0) {
      setSelectedFinanceAccountId(accounts[0].id);
    }
  }, [accounts, selectedFinanceAccountId]);

  useEffect(() => {
    if (selectTeams.length === 0) {
      setSelectedTeamId(null);
      return;
    }
    if (!selectedTeamId || !selectTeams.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(selectTeams[0].id);
    }
  }, [selectTeams, selectedTeamId]);

  const activeTeam = useMemo(
    () => selectTeams.find((t) => t.id === selectedTeamId) || null,
    [selectTeams, selectedTeamId],
  );

  const actorName = appUser?.fullName || userProfile.name || "Сотрудник";
  const actorRole: "admin" | "director" | "manager" | "trainer" =
    currentRole === "parent" ? "trainer" : currentRole;
  const canDeleteTeam =
    currentRole === "admin" ||
    currentRole === "director" ||
    currentRole === "manager";

  // Build enriched member rows for the active select team
  const teamMembers = useMemo(() => {
    if (!activeTeam) return [];
    const clientMap = new Map<string, (typeof clients)[number]>(
      clients.map((c) => [c.id, c]),
    );
    const roster = activeTeam.selectTeamRoster || {};
    const ids = (activeTeam.selectedClientIds || []).filter((id) =>
      clientMap.has(id),
    );

    const statusOrder: Record<SelectTeamParticipationStatus, number> = {
      confirmed: 0,
      pending: 1,
      reserve: 2,
      declined: 3,
    };

    return ids
      .map((cid) => {
        const client = clientMap.get(cid)!;
        const member: SelectTeamMember = roster[cid] || {
          clientId: cid,
          participationStatus: "pending",
          paymentStatus: "unpaid",
        };
        const branch = resolveClientBranch(client, groups, counterparties);
        const analysis = analyzePlayerRoleFit(
          client,
          groups,
          trainingSessions,
          activeTeam.id,
        );
        return { client, member, branch, analysis };
      })
      .sort((a, b) => {
        const sDiff =
          statusOrder[a.member.participationStatus] -
          statusOrder[b.member.participationStatus];
        if (sDiff !== 0) return sDiff;
        return `${a.client.childSurname} ${a.client.childName}`.localeCompare(
          `${b.client.childSurname} ${b.client.childName}`,
          "ru",
        );
      });
  }, [activeTeam, clients, groups, counterparties, trainingSessions]);

  const branchBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of teamMembers) {
      counts.set(item.branch, (counts.get(item.branch) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [teamMembers]);

  const activeFormation = useMemo(() => {
    if (!activeTeam) return getFormationById("5x5_diamond", "5x5");
    return getFormationById(
      activeTeam.formationId,
      activeTeam.matchFormat || "5x5",
    );
  }, [activeTeam]);

  const readiness = useMemo(() => {
    if (!activeTeam) return null;
    return analyzeSquadReadiness(activeTeam, clients, activeFormation);
  }, [activeTeam, clients, activeFormation]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teamMembers.filter(({ client, member, branch }) => {
      if (
        filterParticipation !== "all" &&
        member.participationStatus !== filterParticipation
      ) {
        return false;
      }
      if (filterPayment !== "all" && member.paymentStatus !== filterPayment) {
        return false;
      }
      if (filterPosition !== "all") {
        if (filterPosition === "NONE" && member.position) return false;
        if (filterPosition !== "NONE" && member.position !== filterPosition)
          return false;
      }
      if (filterBranch !== "all" && branch !== filterBranch) {
        return false;
      }
      if (!matchesUniformFilter(client, filterUniform)) {
        return false;
      }
      if (q) {
        const hay =
          `${client.childSurname} ${client.childName} ${client.parentName} ${branch} ${member.subRole || ""} ${member.note || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    teamMembers,
    searchQuery,
    filterParticipation,
    filterPayment,
    filterPosition,
    filterBranch,
    filterUniform,
  ]);

  // Handlers
  const handleSaveTeam = async (data: {
    name: string;
    birthYearFrom: number;
    birthYearTo: number;
    coachId: string;
    coachName: string;
    assistantCoachId?: string;
    assistantCoachName?: string;
    targetCompetition: string;
    competitionDate?: string;
    competitionEndDate?: string;
    competitionLocation?: string;
    competitionFee: number;
    matchFormat: MatchFormat;
    formationId: string;
    selectTeamStatus: "forming" | "ready" | "completed";
    selectTeamNotes?: string;
  }) => {
    if (editingTeam) {
      await updateGroup(editingTeam.id, {
        name: data.name,
        year: data.birthYearFrom,
        birthYearFrom: data.birthYearFrom,
        birthYearTo: data.birthYearTo,
        coachId: data.coachId,
        coachName: data.coachName,
        assistantCoachId: data.assistantCoachId,
        assistantCoachName: data.assistantCoachName,
        targetCompetition: data.targetCompetition,
        competitionDate: data.competitionDate,
        competitionEndDate: data.competitionEndDate,
        competitionLocation: data.competitionLocation,
        competitionFee: data.competitionFee,
        matchFormat: data.matchFormat,
        formationId: data.formationId,
        selectTeamStatus: data.selectTeamStatus,
        selectTeamNotes: data.selectTeamNotes,
        isSelectTeam: true,
      });
      showToast(`Сборная «${data.name}» обновлена`);
    } else {
      const created = await createSelectTeam(data);
      setSelectedTeamId(created.id);
      showToast(`Создана сборная «${created.name}»`);
    }
    setEditingTeam(null);
  };

  const handleDuplicateForNextTournament = async (team: TrainingGroup) => {
    const existingIds = team.selectedClientIds || [];
    const oldRoster = team.selectTeamRoster || {};
    const freshRoster: Record<string, SelectTeamMember> = {};

    for (const cid of existingIds) {
      const prev = oldRoster[cid];
      freshRoster[cid] = {
        clientId: cid,
        participationStatus: "pending",
        paymentStatus: "unpaid",
        position: prev?.position,
        subRole: prev?.subRole,
        jerseyNumber: prev?.jerseyNumber,
        isCaptain: prev?.isCaptain,
        lineupStatus: prev?.lineupStatus,
        pitchSlotId: prev?.pitchSlotId,
        updatedAt: new Date().toISOString(),
        updatedBy: actorName,
        updatedByRole: actorRole,
      };
    }

    const created = await createSelectTeam({
      name: `${team.name} (новый турнир)`.slice(0, 100),
      birthYearFrom: team.birthYearFrom || team.year || 2018,
      birthYearTo: team.birthYearTo || team.year || 2018,
      coachId: team.coachId,
      coachName: team.coachName,
      assistantCoachId: team.assistantCoachId,
      assistantCoachName: team.assistantCoachName,
      targetCompetition: "",
      competitionFee: team.competitionFee || 0,
      matchFormat: team.matchFormat || "5x5",
      formationId: team.formationId || "5x5_diamond",
      selectTeamStatus: "forming",
      selectedClientIds: existingIds,
      selectTeamRoster: freshRoster,
    });
    setSelectedTeamId(created.id);
    setEditingTeam(created);
    setIsFormModalOpen(true);
    showToast("Состав скопирован на новый турнир (отметки и оплаты сброшены)");
  };

  const handleAddPlayersFromScout = async (
    selectedIds: string[],
    options: { autoAssignSuggestedRoles: boolean },
  ) => {
    if (!activeTeam || selectedIds.length === 0) return;
    const existingIds = activeTeam.selectedClientIds || [];
    const mergedIds = Array.from(new Set([...existingIds, ...selectedIds]));
    const nextRoster: Record<string, SelectTeamMember> = {
      ...(activeTeam.selectTeamRoster || {}),
    };
    const nowIso = new Date().toISOString();

    for (const cid of selectedIds) {
      if (nextRoster[cid]) continue;
      const client = clients.find((c) => c.id === cid);
      const analysis = client
        ? analyzePlayerRoleFit(client, groups, trainingSessions, activeTeam.id)
        : null;

      nextRoster[cid] = {
        clientId: cid,
        participationStatus: "pending",
        paymentStatus: "unpaid",
        position: options.autoAssignSuggestedRoles
          ? analysis?.recommendedPosition
          : client?.preferredPosition,
        subRole: options.autoAssignSuggestedRoles
          ? analysis?.recommendedSubRole
          : undefined,
        jerseyNumber: client?.jerseyNumber,
        lineupStatus: "bench",
        updatedAt: nowIso,
        updatedBy: actorName,
        updatedByRole: actorRole,
      };
    }

    await batchUpdateSelectTeamRoster(activeTeam.id, nextRoster, mergedIds);
    showToast(`Добавлено в сборную: ${selectedIds.length} чел.`);
  };

  const handleSmartAutoAssign = async (
    mode: "unassigned_only" | "rebalance_all",
  ) => {
    if (!activeTeam) return;
    const memberIds = activeTeam.selectedClientIds || [];
    if (memberIds.length === 0) return;

    const nextRoster = smartAssignTeamRoles({
      roster: activeTeam.selectTeamRoster || {},
      memberIds,
      clients,
      formation: activeFormation,
      allGroups: groups,
      trainingSessions,
      teamId: activeTeam.id,
      mode,
      autoPickCaptain: true,
      actorName,
      actorRole,
    });

    await batchUpdateSelectTeamRoster(activeTeam.id, nextRoster, memberIds);
    showToast(
      mode === "rebalance_all"
        ? "Умная расстановка выполнена для всей сборной"
        : "Неназначенные роли и пустые позиции заполнены",
    );
  };

  const handleParticipationChange = async (
    clientId: string,
    status: SelectTeamParticipationStatus,
  ) => {
    if (!activeTeam) return;
    await updateSelectTeamMember(activeTeam.id, clientId, {
      participationStatus: status,
      ...(status === "declined"
        ? { pitchSlotId: undefined, lineupStatus: "bench" }
        : {}),
      updatedBy: actorName,
      updatedByRole: actorRole,
    });
  };

  const handleQuickPaymentStatusChange = async (
    clientId: string,
    status: SelectTeamPaymentStatus,
  ) => {
    if (!activeTeam) return;
    const defaultFee = Number(activeTeam.competitionFee || 0);
    const todayStr = new Date().toISOString().split("T")[0];
    await updateSelectTeamMember(activeTeam.id, clientId, {
      paymentStatus: status,
      paidAmount:
        status === "paid"
          ? defaultFee
          : status === "unpaid" || status === "exempt"
            ? 0
            : activeTeam.selectTeamRoster?.[clientId]?.paidAmount || 0,
      paidAt: status === "paid" || status === "partial" ? todayStr : undefined,
      updatedBy: actorName,
      updatedByRole: actorRole,
    });
  };

  const handlePositionChange = async (
    clientId: string,
    position: PlayerPosition | "",
    syncToProfile = false,
  ) => {
    if (!activeTeam) return;
    const pos = position || undefined;
    const defaultSubRole = pos ? POSITION_META[pos].subRoles[0] : undefined;
    await updateSelectTeamMember(
      activeTeam.id,
      clientId,
      {
        position: pos,
        subRole: defaultSubRole,
        updatedBy: actorName,
        updatedByRole: actorRole,
      },
      { syncPreferredPosition: syncToProfile },
    );
  };

  const handleAssignPitchSlot = async (
    clientId: string,
    slot: FormationSlot,
  ) => {
    if (!activeTeam) return;
    await updateSelectTeamMember(activeTeam.id, clientId, {
      position: slot.position,
      subRole: slot.subRole,
      lineupStatus: "starter",
      pitchSlotId: slot.id,
      updatedBy: actorName,
      updatedByRole: actorRole,
    });
  };

  const handleClearPitchSlot = async (clientId: string) => {
    if (!activeTeam) return;
    await updateSelectTeamMember(activeTeam.id, clientId, {
      lineupStatus: "bench",
      pitchSlotId: undefined,
      updatedBy: actorName,
      updatedByRole: actorRole,
    });
  };

  const handleCopyShareList = async () => {
    if (!activeTeam) return;
    const text = formatSelectTeamShareText(
      activeTeam,
      clients,
      groups,
      counterparties,
    );
    try {
      await navigator.clipboard.writeText(text);
      showToast("Заявка скопирована — можно вставить в чат Telegram или WhatsApp");
    } catch {
      showToast("Не удалось скопировать в буфер обмена");
    }
  };

  const handleConfirmDeleteTeam = async () => {
    if (!confirmDeleteTeam) return;
    const name = confirmDeleteTeam.name;
    await deleteGroup(confirmDeleteTeam.id);
    setConfirmDeleteTeam(null);
    showToast(`Сборная «${name}» удалена`);
  };

  const handleUpdateTeamResults = async (updates: Partial<TrainingGroup>) => {
    if (!activeTeam) return;
    await updateGroup(activeTeam.id, updates);
  };

  const handleTogglePlayerAttended = async (
    clientId: string,
    attended: boolean,
  ) => {
    if (!activeTeam) return;
    await updateSelectTeamMember(activeTeam.id, clientId, {
      attendedCompetition: attended,
      updatedBy: actorName,
      updatedByRole: actorRole,
    });
  };

  const handleMarkAllConfirmedAttended = async () => {
    if (!activeTeam) return;
    const memberIds = activeTeam.selectedClientIds || [];
    const roster = activeTeam.selectTeamRoster || {};
    const nextRoster: Record<string, SelectTeamMember> = { ...roster };
    const nowIso = new Date().toISOString();
    let markedCount = 0;

    for (const cid of memberIds) {
      const existing = nextRoster[cid];
      if (existing?.participationStatus === "confirmed") {
        nextRoster[cid] = {
          ...existing,
          attendedCompetition: true,
          updatedAt: nowIso,
          updatedBy: actorName,
          updatedByRole: actorRole,
        };
        markedCount += 1;
      }
    }

    if (markedCount === 0) {
      showToast("Нет игроков со статусом «Подтверждён»");
      return;
    }

    await batchUpdateSelectTeamRoster(activeTeam.id, nextRoster, memberIds);
    showToast(`Отмечено участие на турнире: ${markedCount} чел.`);
  };

  const handleSaveMatches = async (matches: SelectTeamMatch[]) => {
    if (!activeTeam) return;
    await updateGroup(activeTeam.id, { competitionMatches: matches });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="px-4 md:px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              Сборные команды
            </h1>
            <HeaderDescription
              text={
                <>
                  Формирование межфилиальных сборных на соревнования, учёт
                  участия и взносов, умное распределение ролей и тактическая
                  расстановка. Доступно директору, администратору и тренеру.
                </>
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTeam(null);
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Создать сборную</span>
        </button>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        {/* EMPTY STATE WHEN NO SELECT TEAMS EXIST */}
        {selectTeams.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h2 className="text-base font-bold text-slate-900">
                Сборные команды пока не созданы
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Создайте первую сборную (например, «Сборная 2018»), выберите
                игроков из разных филиалов школы, отмечайте готовность к выезду,
                сдачу турнирных взносов и назначайте роли на поле.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingTeam(null);
                setIsFormModalOpen(true);
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Создать первую сборную</span>
            </button>
          </div>
        ) : (
          <>
            {/* TEAM SWITCHER STRIP */}
            <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
              {selectTeams.map((team) => {
                const isActive = team.id === activeTeam?.id;
                const fmt = getFormationById(
                  team.formationId,
                  team.matchFormat || "5x5",
                );
                const stats = analyzeSquadReadiness(team, clients, fmt).counts;
                const statusInfo =
                  TEAM_STATUS_LABELS[team.selectTeamStatus || "forming"] ||
                  TEAM_STATUS_LABELS.forming;
                const matchSummary = getTeamMatchSummary(team);
                const placeLabel = formatCompetitionPlaceLabel(
                  team.competitionPlace,
                  team.competitionTotalTeams,
                  team.competitionResultLabel,
                );

                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setExpandedClientId(null);
                    }}
                    className={`min-w-[240px] max-w-[300px] shrink-0 text-left px-4 py-3 rounded-xl border transition cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold truncate">
                        {team.name}
                      </span>
                      <span
                        className={`text-[11px] font-semibold shrink-0 tabular-nums ${
                          isActive ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {team.matchFormat || "5x5"}
                      </span>
                    </div>
                    <div
                      className={`text-xs truncate mt-0.5 ${
                        isActive ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {team.targetCompetition || "Турнир не указан"}
                    </div>
                    <div
                      className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 text-[11px] tabular-nums ${
                        isActive
                          ? "border-slate-700 text-slate-300"
                          : "border-slate-100 text-slate-500"
                      }`}
                    >
                      <span>
                        {matchSummary.played > 0 ? (
                          <>
                            Игры:{" "}
                            <strong
                              className={
                                isActive ? "text-white" : "text-slate-900"
                              }
                            >
                              {matchSummary.wins}В-{matchSummary.draws}Н-
                              {matchSummary.losses}П
                            </strong>
                          </>
                        ) : (
                          <>
                            Идут:{" "}
                            <strong
                              className={
                                isActive ? "text-white" : "text-slate-900"
                              }
                            >
                              {stats.confirmed}
                            </strong>
                            /{stats.total}
                          </>
                        )}
                      </span>
                      <span
                        className={`truncate ${
                          placeLabel
                            ? isActive
                              ? "text-amber-300 font-semibold"
                              : "text-amber-700 font-semibold"
                            : isActive
                              ? "text-emerald-300"
                              : statusInfo.textClass
                        }`}
                      >
                        {placeLabel || statusInfo.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeTeam && readiness && (
              <>
                {/* ACTIVE TEAM SUMMARY HEADER */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100">
                    <div className="text-left space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h2 className="text-lg font-bold text-slate-950 tracking-tight">
                          {activeTeam.name}
                        </h2>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            (
                              TEAM_STATUS_LABELS[
                                activeTeam.selectTeamStatus || "forming"
                              ] || TEAM_STATUS_LABELS.forming
                            ).textClass
                          }`}
                        >
                          {
                            (
                              TEAM_STATUS_LABELS[
                                activeTeam.selectTeamStatus || "forming"
                              ] || TEAM_STATUS_LABELS.forming
                            ).label
                          }
                        </span>
                        {(() => {
                          const placeStr = formatCompetitionPlaceLabel(
                            activeTeam.competitionPlace,
                            activeTeam.competitionTotalTeams,
                            activeTeam.competitionResultLabel,
                          );
                          const mSum = getTeamMatchSummary(activeTeam);
                          if (!placeStr && mSum.played === 0) return null;
                          return (
                            <>
                              {placeStr && (
                                <>
                                  <span
                                    className="text-slate-300"
                                    aria-hidden="true"
                                  >
                                    ·
                                  </span>
                                  <span className="text-xs font-bold text-amber-700 tabular-nums">
                                    {placeStr}
                                  </span>
                                </>
                              )}
                              {mSum.played > 0 && (
                                <>
                                  <span
                                    className="text-slate-300"
                                    aria-hidden="true"
                                  >
                                    ·
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                                    Матчи: {mSum.played} (В{mSum.wins} Н
                                    {mSum.draws} П{mSum.losses})
                                  </span>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="tabular-nums">
                          {activeTeam.birthYearFrom &&
                          activeTeam.birthYearTo &&
                          activeTeam.birthYearFrom !== activeTeam.birthYearTo
                            ? `${activeTeam.birthYearFrom}–${activeTeam.birthYearTo} г.р.`
                            : `${activeTeam.birthYearFrom || activeTeam.year} г.р.`}
                        </span>
                        {activeTeam.targetCompetition && (
                          <>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-semibold text-slate-800">
                              {activeTeam.targetCompetition}
                            </span>
                          </>
                        )}
                        {activeTeam.competitionDate && (
                          <>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDateRu(activeTeam.competitionDate)}
                              {activeTeam.competitionEndDate
                                ? ` – ${formatDateRu(activeTeam.competitionEndDate)}`
                                : ""}
                            </span>
                          </>
                        )}
                        {activeTeam.competitionLocation && (
                          <>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {activeTeam.competitionLocation}
                            </span>
                          </>
                        )}
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span>
                          Тренер:{" "}
                          <strong className="text-slate-800">
                            {activeTeam.coachName || "Не назначен"}
                          </strong>
                          {activeTeam.assistantCoachName
                            ? ` / ${activeTeam.assistantCoachName}`
                            : ""}
                        </span>
                      </div>

                      {activeTeam.selectTeamNotes && (
                        <p className="text-xs text-slate-500 pt-0.5 max-w-3xl">
                          {activeTeam.selectTeamNotes}
                        </p>
                      )}
                    </div>

                    {/* Team Command Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsScoutModalOpen(true)}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Добавить из филиалов</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyShareList}
                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Скопировать список сборной для чата Telegram / WhatsApp"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Для чата</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateForNextTournament(activeTeam)}
                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Скопировать состав и роли на новый турнир со сбросом отметок и оплат"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>На новый турнир</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeam(activeTeam);
                          setIsFormModalOpen(true);
                        }}
                        className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition cursor-pointer"
                        title="Редактировать параметры сборной"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {canDeleteTeam && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTeam(activeTeam)}
                          className="p-2 bg-white border border-slate-300 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-lg transition cursor-pointer"
                          title="Удалить сборную"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4-COLUMN KPI STRIP */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-100 text-left">
                    <div className="p-4">
                      <div className="text-xs text-slate-500 font-medium">
                        Подтвердили участие
                      </div>
                      <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                        <span className="text-2xl font-bold text-slate-950">
                          {readiness.counts.confirmed}
                        </span>
                        <span className="text-xs text-slate-500">
                          из {readiness.counts.total} в заявке (старт:{" "}
                          {activeFormation.startersCount})
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 tabular-nums">
                        Ждём: {readiness.counts.pending} · Резерв:{" "}
                        {readiness.counts.reserve} · Нет:{" "}
                        {readiness.counts.declined}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-slate-500 font-medium">
                        Собрано взносов
                      </div>
                      <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                        <span className="text-2xl font-bold text-emerald-700">
                          {readiness.counts.collectedFeeTotal.toLocaleString(
                            "ru-RU",
                          )}{" "}
                          ₽
                        </span>
                        {readiness.counts.expectedFeeTotal > 0 && (
                          <span className="text-xs text-slate-500">
                            /{" "}
                            {readiness.counts.expectedFeeTotal.toLocaleString(
                              "ru-RU",
                            )}{" "}
                            ₽
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 tabular-nums">
                        Взнос:{" "}
                        {(activeTeam.competitionFee || 0).toLocaleString(
                          "ru-RU",
                        )}{" "}
                        ₽ · Сдали: {readiness.counts.paid} · Должников:{" "}
                        <span
                          className={
                            readiness.counts.unpaidConfirmed > 0
                              ? "text-red-600 font-semibold"
                              : "text-slate-700"
                          }
                        >
                          {readiness.counts.unpaidConfirmed}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-slate-500 font-medium">
                        Распределение ролей ({activeFormation.format})
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900 tabular-nums flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                        <span
                          className={
                            readiness.counts.byPosition.GK === 0
                              ? "text-red-600"
                              : "text-amber-700"
                          }
                        >
                          ВР {readiness.counts.byPosition.GK}
                        </span>
                        <span className="text-blue-700">
                          ЗЩ {readiness.counts.byPosition.DEF}
                        </span>
                        <span className="text-emerald-700">
                          ПЗ {readiness.counts.byPosition.MID}
                        </span>
                        <span className="text-red-700">
                          НП {readiness.counts.byPosition.FWD}
                        </span>
                        {readiness.counts.byPosition.UNI > 0 && (
                          <span className="text-slate-600">
                            УН {readiness.counts.byPosition.UNI}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
                        {readiness.counts.byPosition.NONE > 0
                          ? `Без роли: ${readiness.counts.byPosition.NONE} чел.`
                          : `Схема ${activeFormation.code} · все роли заданы`}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-xs text-slate-500 font-medium">
                        Филиалы в составе
                      </div>
                      <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                        <span className="text-2xl font-bold text-slate-950">
                          {branchBreakdown.length}
                        </span>
                        <span className="text-xs text-slate-500">
                          {branchBreakdown.length === 1
                            ? "филиал"
                            : branchBreakdown.length >= 2 &&
                                branchBreakdown.length <= 4
                              ? "филиала"
                              : "филиалов"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 truncate">
                        {branchBreakdown.length > 0
                          ? branchBreakdown
                              .slice(0, 3)
                              .map(([b, cnt]) => `${b} (${cnt})`)
                              .join(" · ")
                          : "Нет игроков"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* LIVE DIAGNOSTICS / READINESS NOTICES */}
                {readiness.diagnostics.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {readiness.diagnostics.slice(0, 4).map((diag, idx) => (
                      <div
                        key={idx}
                        className={`px-4 py-3 rounded-xl border flex items-start gap-3 text-left ${
                          diag.level === "warning"
                            ? "bg-amber-50/70 border-amber-200 text-amber-950"
                            : diag.level === "success"
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                              : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        {diag.level === "warning" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : diag.level === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-snug">
                            {diag.title}
                          </div>
                          <div className="text-xs opacity-80 mt-0.5 leading-snug">
                            {diag.detail}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* WORKSPACE SUB-TABS & SMART ROLE TRIGGER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="inline-flex flex-wrap items-center p-1 bg-slate-200/75 rounded-lg self-start gap-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab("roster")}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        activeSubTab === "roster"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Заявка, отметки и роли
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab("tactics")}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        activeSubTab === "tactics"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Тактика и поле ({activeFormation.format})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab("fees")}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        activeSubTab === "fees"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Взносы и оплата
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab("results")}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap tabular-nums ${
                        activeSubTab === "results"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Итоги и матчи
                      {(activeTeam.competitionMatches?.length || 0) > 0
                        ? ` (${activeTeam.competitionMatches!.length})`
                        : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab("stats")}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        activeSubTab === "stats"
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Статистика игр
                    </button>
                  </div>

                  {activeSubTab === "roster" && teamMembers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSmartAutoAssign("unassigned_only")}
                        className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-red-600" />
                        <span>Подобрать роли неназначенным</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSmartAutoAssign("rebalance_all")}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Пересобрать баланс ролей</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ====================================================== */}
                {/* TAB 1: ROSTER, PARTICIPATION, FEES & ROLES MATRIX      */}
                {/* ====================================================== */}
                {activeSubTab === "roster" && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* Filters Toolbar */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск игрока, филиала или заметки..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <select
                        value={filterParticipation}
                        onChange={(e) => setFilterParticipation(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                      >
                        <option value="all">Участие: все</option>
                        <option value="confirmed">Участвует</option>
                        <option value="pending">Ждём ответа</option>
                        <option value="reserve">Резерв</option>
                        <option value="declined">Не сможет</option>
                      </select>

                      <select
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                      >
                        <option value="all">Оплата: все</option>
                        <option value="paid">Сдал взнос</option>
                        <option value="partial">Частично</option>
                        <option value="unpaid">Не сдал</option>
                        <option value="exempt">Льгота</option>
                      </select>

                      <select
                        value={filterPosition}
                        onChange={(e) => setFilterPosition(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                      >
                        <option value="all">Роль: все</option>
                        <option value="GK">Вратарь (ВР)</option>
                        <option value="DEF">Защитник (ЗЩ)</option>
                        <option value="MID">Полузащитник (ПЗ)</option>
                        <option value="FWD">Нападающий (НП)</option>
                        <option value="UNI">Универсал (УН)</option>
                        <option value="NONE">Без роли</option>
                      </select>

                      {branchBreakdown.length > 1 && (
                        <select
                          value={filterBranch}
                          onChange={(e) => setFilterBranch(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                        >
                          <option value="all">Все филиалы</option>
                          {branchBreakdown.map(([b, cnt]) => (
                            <option key={b} value={b}>
                              {b} ({cnt})
                            </option>
                          ))}
                        </select>
                      )}

                      <select
                        value={filterUniform}
                        onChange={(e) =>
                          setFilterUniform(e.target.value as UniformFilterValue)
                        }
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
                      >
                        <option value="all">Форма: все</option>
                        <option value="has_any">Есть форма</option>
                        <option value="red_black">Красно-чёрная</option>
                        <option value="white">Белая</option>
                        <option value="both">Обе (К-Ч + Белая)</option>
                        <option value="none">Нет формы</option>
                      </select>
                    </div>

                    {/* Roster Table */}
                    {teamMembers.length === 0 ? (
                      <div className="py-14 px-6 text-center space-y-3">
                        <div className="text-sm font-bold text-slate-900">
                          В сборной «{activeTeam.name}» пока нет игроков
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Нажмите «Добавить из филиалов», чтобы выбрать ребят{" "}
                          {activeTeam.birthYearFrom || activeTeam.year} года
                          рождения из всех тренировочных групп школы.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsScoutModalOpen(true)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Добавить игроков из филиалов</span>
                        </button>
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="py-12 px-6 text-center text-xs text-slate-500">
                        Нет игроков, соответствующих выбранным фильтрам.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1060px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
                              <th className="py-3 pl-4 pr-2 w-12">№</th>
                              <th className="py-3 px-3">Игрок и филиал</th>
                              <th className="py-3 px-3">Форма</th>
                              <th className="py-3 px-3">Участие</th>
                              <th className="py-3 px-3">Взнос на турнир</th>
                              <th className="py-3 px-3">Роль в сборной</th>
                              <th className="py-3 px-3">Умный подбор</th>
                              <th className="py-3 pl-2 pr-4 text-right">Действия</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredMembers.map(
                              ({ client, member, branch, analysis }) => {
                                const isExpanded =
                                  expandedClientId === client.id;
                                const posMeta = member.position
                                  ? POSITION_META[member.position]
                                  : null;
                                const recMeta =
                                  POSITION_META[analysis.recommendedPosition];
                                const differsFromSmart =
                                  !member.position ||
                                  member.position !==
                                    analysis.recommendedPosition;

                                return (
                                  <React.Fragment key={client.id}>
                                    <tr
                                      className={`transition ${
                                        member.participationStatus === "declined"
                                          ? "bg-slate-50/60 opacity-65"
                                          : "hover:bg-slate-50/80"
                                      }`}
                                    >
                                      {/* Jersey Number & Captain */}
                                      <td className="py-3 pl-4 pr-2 align-middle">
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min={1}
                                            max={99}
                                            value={member.jerseyNumber ?? ""}
                                            onChange={(e) => {
                                              const raw = e.target.value;
                                              const num = raw
                                                ? Math.min(
                                                    99,
                                                    Math.max(1, Number(raw)),
                                                  )
                                                : undefined;
                                              updateSelectTeamMember(
                                                activeTeam.id,
                                                client.id,
                                                {
                                                  jerseyNumber: num,
                                                  updatedBy: actorName,
                                                  updatedByRole: actorRole,
                                                },
                                              );
                                            }}
                                            placeholder="№"
                                            className="w-10 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 tabular-nums focus:outline-none focus:bg-white focus:border-red-600"
                                            title="Игровой номер"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateSelectTeamMember(
                                                activeTeam.id,
                                                client.id,
                                                {
                                                  isCaptain: !member.isCaptain,
                                                  updatedBy: actorName,
                                                  updatedByRole: actorRole,
                                                },
                                              )
                                            }
                                            title={
                                              member.isCaptain
                                                ? "Капитан команды (нажмите, чтобы снять)"
                                                : "Назначить капитаном"
                                            }
                                            className={`p-1 rounded transition cursor-pointer ${
                                              member.isCaptain
                                                ? "text-amber-500"
                                                : "text-slate-300 hover:text-amber-500"
                                            }`}
                                          >
                                            <Crown className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>

                                      {/* Player & Branch */}
                                      <td className="py-3 px-3 align-middle">
                                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                          <span>
                                            {client.childSurname}{" "}
                                            {client.childName}
                                          </span>
                                          {member.lineupStatus === "starter" &&
                                            member.pitchSlotId && (
                                              <span className="text-[10px] font-semibold text-emerald-700">
                                                · Старт
                                              </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5 mt-0.5">
                                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                            <Building2 className="w-3 h-3 text-slate-400" />
                                            {branch}
                                          </span>
                                          <span aria-hidden="true">·</span>
                                          <span className="tabular-nums">
                                            {client.childBirthYear} г.р.
                                          </span>
                                          {!analysis.hasMedicalCert && (
                                            <>
                                              <span aria-hidden="true">·</span>
                                              <span className="text-amber-700 font-medium">
                                                Нет справки
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        {member.note && (
                                          <div className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-[240px]">
                                            {member.note}
                                          </div>
                                        )}
                                      </td>

                                      {/* Uniform Kit Quick Toggle */}
                                      <td className="py-3 px-3 align-middle">
                                        <UniformKitControl
                                          variant="compact"
                                          hasUniform={client.hasUniform}
                                          uniformKits={client.uniformKits}
                                          onChange={(next) =>
                                            updateClient(client.id, {
                                              hasUniform: next.hasUniform,
                                              uniformKits: next.uniformKits,
                                            })
                                          }
                                        />
                                      </td>

                                      {/* Participation Quick Toggle */}
                                      <td className="py-3 px-3 align-middle">
                                        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70">
                                          {(
                                            [
                                              "confirmed",
                                              "pending",
                                              "reserve",
                                              "declined",
                                            ] as SelectTeamParticipationStatus[]
                                          ).map((st) => {
                                            const active =
                                              member.participationStatus === st;
                                            const meta = PARTICIPATION_META[st];
                                            return (
                                              <button
                                                key={st}
                                                type="button"
                                                onClick={() =>
                                                  handleParticipationChange(
                                                    client.id,
                                                    st,
                                                  )
                                                }
                                                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                                                  active
                                                    ? meta.activeBg
                                                    : "text-slate-600 hover:text-slate-900"
                                                }`}
                                                title={meta.label}
                                              >
                                                {meta.shortLabel}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </td>

                                      {/* Competition Fee Quick Toggle */}
                                      <td className="py-3 px-3 align-middle">
                                        <div className="space-y-1">
                                          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70">
                                            {(
                                              [
                                                "paid",
                                                "partial",
                                                "unpaid",
                                                "exempt",
                                              ] as SelectTeamPaymentStatus[]
                                            ).map((pst) => {
                                              const active =
                                                member.paymentStatus === pst;
                                              const meta = PAYMENT_META[pst];
                                              return (
                                                <button
                                                  key={pst}
                                                  type="button"
                                                  onClick={() =>
                                                    handleQuickPaymentStatusChange(
                                                      client.id,
                                                      pst,
                                                    )
                                                  }
                                                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                                                    active
                                                      ? meta.activeBg
                                                      : "text-slate-600 hover:text-slate-900"
                                                  }`}
                                                  title={meta.label}
                                                >
                                                  {meta.shortLabel}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          {(member.paidAmount || 0) > 0 && (
                                            <div className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1.5">
                                              <span>
                                                {(
                                                  member.paidAmount || 0
                                                ).toLocaleString("ru-RU")}{" "}
                                                ₽
                                              </span>
                                              {member.financeRecordId && (
                                                <span className="text-emerald-700 font-medium">
                                                  · В Финансах
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Role & Sub-Role Selectors */}
                                      <td className="py-3 px-3 align-middle">
                                        <div className="flex flex-col gap-1 min-w-[165px]">
                                          <select
                                            value={member.position || ""}
                                            onChange={(e) =>
                                              handlePositionChange(
                                                client.id,
                                                e.target.value as
                                                  | PlayerPosition
                                                  | "",
                                              )
                                            }
                                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:border-red-600 ${
                                              posMeta
                                                ? `${posMeta.accentBg} ${posMeta.accentText} ${posMeta.accentBorder}`
                                                : "bg-white border-slate-300 text-slate-600"
                                            }`}
                                          >
                                            <option value="">
                                              — Не назначена —
                                            </option>
                                            <option value="GK">
                                              Вратарь (ВР)
                                            </option>
                                            <option value="DEF">
                                              Защитник (ЗЩ)
                                            </option>
                                            <option value="MID">
                                              Полузащитник (ПЗ)
                                            </option>
                                            <option value="FWD">
                                              Нападающий (НП)
                                            </option>
                                            <option value="UNI">
                                              Универсал (УН)
                                            </option>
                                          </select>

                                          {member.position && (
                                            <select
                                              value={member.subRole || ""}
                                              onChange={(e) =>
                                                updateSelectTeamMember(
                                                  activeTeam.id,
                                                  client.id,
                                                  {
                                                    subRole:
                                                      e.target.value ||
                                                      undefined,
                                                    updatedBy: actorName,
                                                    updatedByRole: actorRole,
                                                  },
                                                )
                                              }
                                              className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600 focus:outline-none focus:border-red-600"
                                            >
                                              {POSITION_META[
                                                member.position
                                              ].subRoles.map((sr) => (
                                                <option key={sr} value={sr}>
                                                  {sr}
                                                </option>
                                              ))}
                                            </select>
                                          )}
                                        </div>
                                      </td>

                                      {/* Smart Role Suggestion */}
                                      <td className="py-3 px-3 align-middle">
                                        <div className="space-y-1 max-w-[200px]">
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`text-xs font-semibold ${recMeta.accentText}`}
                                            >
                                              {recMeta.label}
                                            </span>
                                            {differsFromSmart ? (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  updateSelectTeamMember(
                                                    activeTeam.id,
                                                    client.id,
                                                    {
                                                      position:
                                                        analysis.recommendedPosition,
                                                      subRole:
                                                        analysis.recommendedSubRole,
                                                      updatedBy: actorName,
                                                      updatedByRole: actorRole,
                                                    },
                                                  )
                                                }
                                                className="text-[11px] font-semibold text-red-600 hover:text-red-700 underline cursor-pointer whitespace-nowrap"
                                              >
                                                Применить
                                              </button>
                                            ) : (
                                              <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-0.5">
                                                <Check className="w-3 h-3" />
                                                Совпадает
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-slate-500 truncate">
                                            {analysis.reasons[0]}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Row Actions */}
                                      <td className="py-3 pl-2 pr-4 align-middle text-right">
                                        <div className="inline-flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedClientId(
                                                isExpanded ? null : client.id,
                                              )
                                            }
                                            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                            title="Подробнее о профиле, заметке и обосновании роли"
                                          >
                                            <span>Профиль</span>
                                            {isExpanded ? (
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeClientFromSelectTeam(
                                                client.id,
                                                activeTeam.id,
                                              )
                                            }
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                            title="Исключить игрока из сборной"
                                          >
                                            <UserMinus className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* EXPANDED SMART ROLE & PLAYER NOTE DRAWER */}
                                    {isExpanded && (
                                      <tr className="bg-slate-50/90">
                                        <td colSpan={8} className="px-6 py-4">
                                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
                                            {/* Role Fit Breakdown */}
                                            <div className="lg:col-span-5 space-y-2.5">
                                              <div className="text-xs font-bold text-slate-900">
                                                Умный анализ амплуа ·{" "}
                                                {client.childSurname}{" "}
                                                {client.childName}
                                              </div>
                                              <div className="grid grid-cols-4 gap-2 tabular-nums">
                                                {(
                                                  [
                                                    "GK",
                                                    "DEF",
                                                    "MID",
                                                    "FWD",
                                                  ] as const
                                                ).map((pKey) => {
                                                  const sc =
                                                    analysis.scores[pKey];
                                                  const pm =
                                                    POSITION_META[pKey];
                                                  const isBest =
                                                    analysis.recommendedPosition ===
                                                    pKey;
                                                  return (
                                                    <div
                                                      key={pKey}
                                                      className={`p-2 rounded-lg border text-center ${
                                                        isBest
                                                          ? `${pm.accentBg} ${pm.accentBorder}`
                                                          : "bg-white border-slate-200"
                                                      }`}
                                                    >
                                                      <div className="text-[11px] font-semibold text-slate-500">
                                                        {pm.shortLabel}
                                                      </div>
                                                      <div
                                                        className={`text-sm font-bold mt-0.5 ${
                                                          isBest
                                                            ? pm.accentText
                                                            : "text-slate-900"
                                                        }`}
                                                      >
                                                        {sc}%
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                              <ul className="space-y-1 text-xs text-slate-600 list-disc pl-4">
                                                {analysis.reasons.map(
                                                  (r, i) => (
                                                    <li key={i}>{r}</li>
                                                  ),
                                                )}
                                                <li>
                                                  Средняя оценка навыков:{" "}
                                                  <strong className="tabular-nums text-slate-800">
                                                    {analysis.avgSkill.toFixed(
                                                      1,
                                                    )}
                                                    /5
                                                  </strong>{" "}
                                                  · Посещаемость:{" "}
                                                  <strong className="tabular-nums text-slate-800">
                                                    {analysis.attendancePct}%
                                                  </strong>{" "}
                                                  · Индекс капитана:{" "}
                                                  <strong className="tabular-nums text-slate-800">
                                                    {analysis.captainScore}%
                                                  </strong>
                                                </li>
                                              </ul>
                                            </div>

                                            {/* Persistent Player Football Profile */}
                                            <div className="lg:col-span-3 space-y-2.5">
                                              <div className="text-xs font-bold text-slate-900">
                                                Постоянный профиль игрока
                                              </div>
                                              <div>
                                                <label className="block text-[11px] text-slate-500 mb-1">
                                                  Ведущая нога
                                                </label>
                                                <div className="inline-flex p-0.5 bg-white border border-slate-200 rounded-lg">
                                                  {(
                                                    [
                                                      {
                                                        v: "right",
                                                        l: "Правая",
                                                      },
                                                      {
                                                        v: "left",
                                                        l: "Левая",
                                                      },
                                                      { v: "both", l: "Обе" },
                                                    ] as const
                                                  ).map((ft) => (
                                                    <button
                                                      key={ft.v}
                                                      type="button"
                                                      onClick={() =>
                                                        updateClient(
                                                          client.id,
                                                          {
                                                            dominantFoot: ft.v,
                                                          },
                                                        )
                                                      }
                                                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                                                        (client.dominantFoot ||
                                                          "right") === ft.v
                                                          ? "bg-slate-900 text-white"
                                                          : "text-slate-600 hover:text-slate-900"
                                                      }`}
                                                    >
                                                      {ft.l}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>

                                              {member.position && (
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    await updateClient(
                                                      client.id,
                                                      {
                                                        preferredPosition:
                                                          member.position,
                                                        ...(member.jerseyNumber
                                                          ? {
                                                              jerseyNumber:
                                                                member.jerseyNumber,
                                                            }
                                                          : {}),
                                                      },
                                                    );
                                                    showToast(
                                                      `Основное амплуа (${POSITION_META[member.position!].label}) сохранено в карточку игрока`,
                                                    );
                                                  }}
                                                  className="text-xs font-semibold text-red-600 hover:text-red-700 underline cursor-pointer block pt-1"
                                                >
                                                  Закрепить «
                                                  {
                                                    POSITION_META[
                                                      member.position
                                                    ].label
                                                  }
                                                  » в профиле ученика
                                                </button>
                                              )}

                                              <div className="text-[11px] text-slate-500 pt-1">
                                                Родитель: {client.parentName} ·{" "}
                                                {client.parentPhone}
                                              </div>
                                            </div>

                                            {/* Tournament Note & Audit Trail */}
                                            <div className="lg:col-span-4 space-y-2">
                                              <label className="block text-xs font-bold text-slate-900">
                                                Комментарий по турниру (причина
                                                отказа, дорога, форма)
                                              </label>
                                              <input
                                                type="text"
                                                defaultValue={member.note || ""}
                                                onBlur={(e) => {
                                                  const val =
                                                    e.target.value.trim();
                                                  if (
                                                    val !== (member.note || "")
                                                  ) {
                                                    updateSelectTeamMember(
                                                      activeTeam.id,
                                                      client.id,
                                                      {
                                                        note: val || undefined,
                                                        updatedBy: actorName,
                                                        updatedByRole:
                                                          actorRole,
                                                      },
                                                    );
                                                  }
                                                }}
                                                placeholder="Например: едет с родителями, сдаст взнос в пятницу"
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                                              />
                                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                                <span>
                                                  Справка:{" "}
                                                  <strong
                                                    className={
                                                      analysis.hasMedicalCert
                                                        ? "text-emerald-700"
                                                        : "text-amber-700"
                                                    }
                                                  >
                                                    {analysis.hasMedicalCert
                                                      ? "Есть"
                                                      : "Нет"}
                                                  </strong>{" "}
                                                  · Страховка:{" "}
                                                  <strong
                                                    className={
                                                      analysis.hasInsurance
                                                        ? "text-emerald-700"
                                                        : "text-amber-700"
                                                    }
                                                  >
                                                    {analysis.hasInsurance
                                                      ? "Есть"
                                                      : "Нет"}
                                                  </strong>
                                                </span>
                                              </div>
                                              {member.updatedBy && (
                                                <div className="text-[11px] text-slate-400">
                                                  Обновил:{" "}
                                                  {ROLE_LABELS_RU[
                                                    member.updatedByRole || ""
                                                  ] || ""}{" "}
                                                  {member.updatedBy}
                                                  {member.updatedAt
                                                    ? ` · ${new Date(
                                                        member.updatedAt,
                                                      ).toLocaleDateString(
                                                        "ru-RU",
                                                      )}`
                                                    : ""}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ====================================================== */}
                {/* TAB 2: TACTICAL PITCH & SMART ROLE STUDIO              */}
                {/* ====================================================== */}
                {activeSubTab === "tactics" && (
                  <TacticalPitchView
                    team={activeTeam}
                    members={teamMembers}
                    groups={groups}
                    counterparties={counterparties}
                    trainingSessions={trainingSessions}
                    onChangeFormation={async (fmt, formationId) => {
                      await updateGroup(activeTeam.id, {
                        matchFormat: fmt,
                        formationId,
                      });
                    }}
                    onAssignSlot={handleAssignPitchSlot}
                    onClearSlot={handleClearPitchSlot}
                    onSmartAutoAssign={handleSmartAutoAssign}
                    onToggleCaptain={async (cid, isCaptain) => {
                      await updateSelectTeamMember(activeTeam.id, cid, {
                        isCaptain,
                        updatedBy: actorName,
                        updatedByRole: actorRole,
                      });
                    }}
                  />
                )}

                {/* ====================================================== */}
                {/* TAB 3: TOURNAMENT FEES & FINANCE TRACKER               */}
                {/* ====================================================== */}
                {activeSubTab === "fees" && (
                  <div className="space-y-4">
                    {/* Account & Fee Settings Bar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          <span>
                            Сбор взносов на участие · базовый взнос{" "}
                            <span className="tabular-nums">
                              {(activeTeam.competitionFee || 0).toLocaleString(
                                "ru-RU",
                              )}{" "}
                              ₽
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Можно быстро отметить сдачу денег тренеру или сразу
                          провести поступление в раздел «Финансы» по статье
                          «Турниры и соревнования».
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          Счёт зачисления:
                        </span>
                        <select
                          value={selectedFinanceAccountId}
                          onChange={(e) =>
                            setSelectedFinanceAccountId(e.target.value)
                          }
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-600"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fee Checklist Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {teamMembers.length === 0 ? (
                        <div className="p-10 text-center text-xs text-slate-500">
                          Добавьте игроков в сборную, чтобы вести учёт сдачи
                          денег на соревнование.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[820px]">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
                                <th className="py-3 pl-4 pr-3">Игрок и филиал</th>
                                <th className="py-3 px-3">Участие</th>
                                <th className="py-3 px-3">Статус оплаты</th>
                                <th className="py-3 px-3 text-right">Сумма (₽)</th>
                                <th className="py-3 px-3">Учёт в Финансах</th>
                                <th className="py-3 pl-3 pr-4 text-right">
                                  Быстрые действия
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {teamMembers.map(({ client, member, branch }) => {
                                const defaultFee = Number(
                                  activeTeam.competitionFee || 0,
                                );
                                const inputAmountStr =
                                  customAmounts[client.id] !== undefined
                                    ? customAmounts[client.id]
                                    : String(
                                        member.paidAmount !== undefined &&
                                          member.paidAmount > 0
                                          ? member.paidAmount
                                          : defaultFee,
                                      );
                                const parsedAmt = Math.max(
                                  0,
                                  Number(inputAmountStr) || 0,
                                );
                                const pMeta =
                                  PARTICIPATION_META[
                                    member.participationStatus
                                  ];
                                const payMeta =
                                  PAYMENT_META[member.paymentStatus];

                                return (
                                  <tr
                                    key={client.id}
                                    className="hover:bg-slate-50/70 transition"
                                  >
                                    <td className="py-3 pl-4 pr-3">
                                      <div className="font-bold text-slate-900">
                                        {client.childSurname} {client.childName}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        {branch} · {client.parentName} (
                                        {client.parentPhone})
                                      </div>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span
                                        className={`font-semibold ${pMeta.textClass}`}
                                      >
                                        {pMeta.label}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span
                                        className={`font-semibold ${payMeta.textClass}`}
                                      >
                                        {payMeta.label}
                                      </span>
                                      {member.paidAt && (
                                        <div className="text-[11px] text-slate-400 tabular-nums">
                                          {formatDateRu(member.paidAt)}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <input
                                        type="number"
                                        min={0}
                                        step={50}
                                        value={inputAmountStr}
                                        onChange={(e) =>
                                          setCustomAmounts((prev) => ({
                                            ...prev,
                                            [client.id]: e.target.value,
                                          }))
                                        }
                                        className="w-24 px-2.5 py-1.5 text-right bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-red-600"
                                      />
                                    </td>
                                    <td className="py-3 px-3">
                                      {member.financeRecordId ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                          <FileCheck2 className="w-3.5 h-3.5" />
                                          Проведено в Финансы
                                        </span>
                                      ) : member.paymentStatus === "paid" ||
                                        member.paymentStatus === "partial" ? (
                                        <span className="text-slate-500">
                                          Только отметка (не в кассе)
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">—</span>
                                      )}
                                    </td>
                                    <td className="py-3 pl-3 pr-4 text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        {member.paymentStatus !== "paid" && (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              await recordSelectTeamFeePayment({
                                                groupId: activeTeam.id,
                                                clientId: client.id,
                                                amount: parsedAmt,
                                                accountId:
                                                  selectedFinanceAccountId,
                                                postToFinance: false,
                                                paymentStatus:
                                                  defaultFee > 0 &&
                                                  parsedAmt > 0 &&
                                                  parsedAmt < defaultFee
                                                    ? "partial"
                                                    : "paid",
                                                actorName,
                                                actorRole,
                                              });
                                              showToast(
                                                `Отмечена сдача взноса: ${client.childSurname} (${parsedAmt.toLocaleString("ru-RU")} ₽)`,
                                              );
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                                          >
                                            Отметить сдачу
                                          </button>
                                        )}

                                        {!member.financeRecordId &&
                                          parsedAmt > 0 && (
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                await recordSelectTeamFeePayment(
                                                  {
                                                    groupId: activeTeam.id,
                                                    clientId: client.id,
                                                    amount: parsedAmt,
                                                    accountId:
                                                      selectedFinanceAccountId,
                                                    postToFinance: true,
                                                    paymentStatus:
                                                      defaultFee > 0 &&
                                                      parsedAmt < defaultFee
                                                        ? "partial"
                                                        : "paid",
                                                    actorName,
                                                    actorRole,
                                                  },
                                                );
                                                showToast(
                                                  `Взнос ${parsedAmt.toLocaleString("ru-RU")} ₽ проведён в Финансы`,
                                                );
                                              }}
                                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                            >
                                              <Banknote className="w-3.5 h-3.5" />
                                              <span>В Финансы</span>
                                            </button>
                                          )}

                                        {member.paymentStatus !== "unpaid" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleQuickPaymentStatusChange(
                                                client.id,
                                                "unpaid",
                                              )
                                            }
                                            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                          >
                                            Сброс
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ====================================================== */}
                {/* TAB 4: POST-COMPETITION RESULTS, MATCHES & ATTENDANCE  */}
                {/* ====================================================== */}
                {activeSubTab === "results" && (
                  <CompetitionResultsView
                    team={activeTeam}
                    members={teamMembers.map(({ client, member, branch }) => ({
                      client,
                      member,
                      branch,
                    }))}
                    actorName={actorName}
                    actorRole={actorRole}
                    onUpdateTeamResults={handleUpdateTeamResults}
                    onTogglePlayerAttended={handleTogglePlayerAttended}
                    onMarkAllConfirmedAttended={handleMarkAllConfirmedAttended}
                    onSaveMatches={handleSaveMatches}
                    onNotify={showToast}
                  />
                )}

                {/* ====================================================== */}
                {/* TAB 5: CUMULATIVE MATCH STATISTICS BOARD               */}
                {/* ====================================================== */}
                {activeSubTab === "stats" && (
                  <CompetitionStatsBoard
                    selectTeams={selectTeams}
                    allGroups={groups}
                    clients={clients}
                    counterparties={counterparties}
                    initialTeamId={activeTeam.id}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      <SelectTeamFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTeam(null);
        }}
        coaches={coaches}
        editingTeam={editingTeam}
        onSave={handleSaveTeam}
      />

      {activeTeam && (
        <SelectTeamScoutModal
          isOpen={isScoutModalOpen}
          onClose={() => setIsScoutModalOpen(false)}
          team={activeTeam}
          clients={clients}
          groups={groups}
          counterparties={counterparties}
          trainingSessions={trainingSessions}
          onAddPlayers={handleAddPlayersFromScout}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDeleteTeam && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-left space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Удалить сборную «{confirmDeleteTeam.name}»?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Список заявленных игроков, отметки участия и расстановка этой
              сборной будут удалены. Основные учебные группы и профили учеников
              останутся без изменений.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTeam(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTeam}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer"
              >
                Удалить сборную
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
