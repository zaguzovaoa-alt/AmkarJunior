import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Crown,
  X,
  RefreshCw,
  ArrowRightLeft,
} from "lucide-react";
import {
  Client,
  Counterparty,
  MatchFormat,
  PlayerPosition,
  SelectTeamMember,
  TrainingGroup,
  TrainingSessionProtocol,
} from "../../types";
import {
  FormationSlot,
  getFormationById,
  getFormationsForFormat,
  PARTICIPATION_META,
  PlayerRoleAnalysis,
  POSITION_META,
  TacticalFormation,
} from "../../utils/selectTeamIntelligence";

interface TacticalPitchViewProps {
  team: TrainingGroup;
  members: {
    client: Client;
    member: SelectTeamMember;
    branch: string;
    analysis: PlayerRoleAnalysis;
  }[];
  onChangeFormation: (format: MatchFormat, formationId: string) => Promise<void>;
  onAssignSlot: (
    clientId: string,
    slot: FormationSlot,
  ) => Promise<void>;
  onClearSlot: (clientId: string) => Promise<void>;
  onSmartAutoAssign: (mode: "unassigned_only" | "rebalance_all") => Promise<void>;
  onToggleCaptain: (clientId: string, isCaptain: boolean) => Promise<void>;
  groups: TrainingGroup[];
  counterparties: Counterparty[];
  trainingSessions: TrainingSessionProtocol[];
}

const FORMAT_LIST: MatchFormat[] = ["5x5", "6x6", "7x7", "8x8", "11x11"];

export const TacticalPitchView: React.FC<TacticalPitchViewProps> = ({
  team,
  members,
  onChangeFormation,
  onAssignSlot,
  onClearSlot,
  onSmartAutoAssign,
  onToggleCaptain,
}) => {
  const activeFormat: MatchFormat = team.matchFormat || "5x5";
  const formation: TacticalFormation = getFormationById(
    team.formationId,
    activeFormat,
  );
  const availableFormations = getFormationsForFormat(activeFormat);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  // Map slots -> assigned member
  const slotAssignments = useMemo(() => {
    const map = new Map<
      string,
      {
        client: Client;
        member: SelectTeamMember;
        branch: string;
        analysis: PlayerRoleAnalysis;
      }
    >();
    for (const item of members) {
      if (
        item.member.pitchSlotId &&
        item.member.participationStatus !== "declined" &&
        formation.slots.some((s) => s.id === item.member.pitchSlotId)
      ) {
        map.set(item.member.pitchSlotId, item);
      }
    }
    return map;
  }, [members, formation.slots]);

  const starterClientIds = useMemo(() => {
    const ids = new Set<string>();
    slotAssignments.forEach((v) => ids.add(v.client.id));
    return ids;
  }, [slotAssignments]);

  const benchMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          !starterClientIds.has(m.client.id) &&
          m.member.participationStatus !== "declined",
      ),
    [members, starterClientIds],
  );

  const declinedMembers = useMemo(
    () => members.filter((m) => m.member.participationStatus === "declined"),
    [members],
  );

  const activeSlot = formation.slots.find((s) => s.id === selectedSlotId) || null;

  // Candidates for selected slot sorted by participation & fit score for THAT position
  const rankedSlotCandidates = useMemo(() => {
    if (!activeSlot) return [];
    const pWeight: Record<string, number> = {
      confirmed: 3,
      pending: 2,
      reserve: 1,
      declined: 0,
    };
    return [...members]
      .filter((m) => m.member.participationStatus !== "declined")
      .sort((a, b) => {
        const aIsCurrent = a.member.pitchSlotId === activeSlot.id ? 1 : 0;
        const bIsCurrent = b.member.pitchSlotId === activeSlot.id ? 1 : 0;
        if (bIsCurrent !== aIsCurrent) return bIsCurrent - aIsCurrent;

        const aBench = !starterClientIds.has(a.client.id) ? 1 : 0;
        const bBench = !starterClientIds.has(b.client.id) ? 1 : 0;
        if (bBench !== aBench) return bBench - aBench;

        const pDiff =
          pWeight[b.member.participationStatus] -
          pWeight[a.member.participationStatus];
        if (pDiff !== 0) return pDiff;

        return (
          b.analysis.scores[activeSlot.position] -
          a.analysis.scores[activeSlot.position]
        );
      });
  }, [activeSlot, members, starterClientIds]);

  // Line balance summary across active (non-declined) squad
  const lineSummary = useMemo(() => {
    const counts: Record<PlayerPosition, number> = {
      GK: 0,
      DEF: 0,
      MID: 0,
      FWD: 0,
      UNI: 0,
    };
    const required: Record<Exclude<PlayerPosition, "UNI">, number> = {
      GK: 0,
      DEF: 0,
      MID: 0,
      FWD: 0,
    };
    for (const s of formation.slots) {
      required[s.position]++;
    }
    for (const item of members) {
      if (item.member.participationStatus === "declined") continue;
      if (item.member.position) {
        counts[item.member.position]++;
      }
    }
    return { counts, required };
  }, [members, formation.slots]);

  const handleRunSmart = async (mode: "unassigned_only" | "rebalance_all") => {
    setIsAutoRunning(true);
    try {
      await onSmartAutoAssign(mode);
      setSelectedSlotId(null);
    } finally {
      setIsAutoRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Format, Formation & Smart Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {FORMAT_LIST.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => {
                  const defaultF = getFormationsForFormat(fmt)[0];
                  if (defaultF) onChangeFormation(fmt, defaultF.id);
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold tabular-nums transition cursor-pointer whitespace-nowrap ${
                  activeFormat === fmt
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Formation Select */}
          <select
            value={formation.id}
            onChange={(e) => onChangeFormation(activeFormat, e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-600"
          >
            {availableFormations.map((f) => (
              <option key={f.id} value={f.id}>
                Схема {f.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 hidden xl:inline">
            {formation.description}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isAutoRunning || members.length === 0}
            onClick={() => handleRunSmart("unassigned_only")}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Заполнит пустые позиции на поле и назначит роли тем, у кого они ещё не указаны"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Дополнить пустые позиции</span>
          </button>

          <button
            type="button"
            disabled={isAutoRunning || members.length === 0}
            onClick={() => handleRunSmart("rebalance_all")}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Оптимально распределит всех игроков сборной по линиям с учётом их навыков, заметок и подтверждений"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAutoRunning ? "animate-spin" : ""}`} />
            <span>Умная авторасстановка</span>
          </button>
        </div>
      </div>

      {/* Main Split: Interactive Pitch + Side Roster / Slot Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Tactical Football Pitch (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">
                Стартовый состав · {formation.code} ({activeFormat})
              </div>
              <div className="text-xs text-slate-500">
                Нажмите на любую позицию на поле, чтобы назначить или заменить игрока
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-700 tabular-nums">
              На поле: {slotAssignments.size} / {formation.startersCount}
            </div>
          </div>

          {/* Pitch Container */}
          <div
            className="relative w-full rounded-xl overflow-hidden border border-emerald-900/20 select-none"
            style={{
              aspectRatio: "4 / 4.7",
              background:
                "repeating-linear-gradient(180deg, #166534 0%, #166534 10%, #15803d 10%, #15803d 20%)",
            }}
          >
            {/* Pitch Markings SVG */}
            <svg
              viewBox="0 0 100 118"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Outer boundary */}
              <rect
                x="4"
                y="4"
                width="92"
                height="110"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
              {/* Halfway line */}
              <line
                x1="4"
                y1="59"
                x2="96"
                y2="59"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
              {/* Center circle */}
              <circle
                cx="50"
                cy="59"
                r="11"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
              <circle cx="50" cy="59" r="0.9" fill="rgba(255,255,255,0.7)" />
              {/* Top penalty area (Opponent Goal) */}
              <rect
                x="24"
                y="4"
                width="52"
                height="16"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
              <rect
                x="36"
                y="4"
                width="28"
                height="6"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
              {/* Bottom penalty area (Our Goal) */}
              <rect
                x="24"
                y="98"
                width="52"
                height="16"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
              <rect
                x="36"
                y="108"
                width="28"
                height="6"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.6"
              />
            </svg>

            {/* Direction labels */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white/60 tracking-wide pointer-events-none">
              Атака
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white/60 tracking-wide pointer-events-none">
              Свои ворота
            </div>

            {/* Interactive Formation Slots */}
            {formation.slots.map((slot) => {
              const assigned = slotAssignments.get(slot.id);
              const isSelected = selectedSlotId === slot.id;
              const posMeta = POSITION_META[slot.position];

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() =>
                    setSelectedSlotId(isSelected ? null : slot.id)
                  }
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer focus:outline-none z-10"
                >
                  {/* Jersey Circle */}
                  <div
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-transform duration-150 shadow-md ${
                      isSelected
                        ? "ring-4 ring-white scale-110"
                        : "group-hover:scale-105"
                    } ${
                      assigned
                        ? "text-white border-2 border-white"
                        : "bg-slate-900/55 border-2 border-dashed border-white/80 text-white/90"
                    }`}
                    style={
                      assigned
                        ? { backgroundColor: posMeta.pitchColor }
                        : undefined
                    }
                  >
                    {assigned ? (
                      <>
                        <span className="text-xs sm:text-sm font-extrabold leading-none tabular-nums">
                          {assigned.member.jerseyNumber || posMeta.shortLabel}
                        </span>
                        <span className="text-[9px] font-semibold opacity-90 mt-0.5 leading-none">
                          {slot.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold leading-none">
                          {slot.label}
                        </span>
                        <span className="text-[9px] opacity-80 mt-0.5 leading-none">
                          + Выбор
                        </span>
                      </>
                    )}

                    {/* Captain badge */}
                    {assigned?.member.isCaptain && (
                      <span
                        title="Капитан команды"
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center border border-white shadow-xs"
                      >
                        К
                      </span>
                    )}
                  </div>

                  {/* Player Nameplate */}
                  <div className="mt-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 text-white text-[11px] font-semibold max-w-[115px] truncate shadow-sm">
                    {assigned
                      ? `${assigned.client.childSurname} ${assigned.client.childName.charAt(0)}.`
                      : slot.subRole.split(" ")[0]}
                  </div>
                  {assigned && (
                    <div className="text-[10px] text-white/90 font-medium bg-slate-900/60 px-1.5 rounded mt-0.5 max-w-[115px] truncate">
                      {assigned.branch}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Contextual Slot Picker OR Line Balance + Bench (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activeSlot ? (
            /* SLOT PICKER PANEL */
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-left">
              <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Позиция: {activeSlot.subRole} ({activeSlot.label})
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Игроки отсортированы по совместимости с ролью «{POSITION_META[activeSlot.position].label}»
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlotId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {slotAssignments.get(activeSlot.id) && (
                <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200/70 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">
                    Сейчас на позиции:{" "}
                    <strong>
                      {slotAssignments.get(activeSlot.id)!.client.childSurname}{" "}
                      {slotAssignments.get(activeSlot.id)!.client.childName}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await onClearSlot(
                        slotAssignments.get(activeSlot.id)!.client.id,
                      );
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Снять в запас
                  </button>
                </div>
              )}

              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                {rankedSlotCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Добавьте игроков в сборную, чтобы расставить их на поле.
                  </div>
                ) : (
                  rankedSlotCandidates.map(
                    ({ client, member, branch, analysis }) => {
                      const fitScore = analysis.scores[activeSlot.position];
                      const isCurrent = member.pitchSlotId === activeSlot.id;
                      const isOtherStarter =
                        Boolean(member.pitchSlotId) && !isCurrent;
                      const pMeta =
                        PARTICIPATION_META[member.participationStatus];

                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={async () => {
                            await onAssignSlot(client.id, activeSlot);
                            setSelectedSlotId(null);
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition cursor-pointer ${
                            isCurrent
                              ? "bg-emerald-50/70"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {client.childSurname} {client.childName}
                              </span>
                              {member.isCaptain && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              {isCurrent && (
                                <span className="text-[11px] font-semibold text-emerald-700">
                                  Выбран
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5 mt-0.5">
                              <span>{branch}</span>
                              <span aria-hidden="true">·</span>
                              <span className={pMeta.textClass}>
                                {pMeta.label}
                              </span>
                              {isOtherStarter && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-700 flex items-center gap-0.5">
                                    <ArrowRightLeft className="w-3 h-3" />в старте на другой позиции
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 tabular-nums">
                            <div
                              className={`text-xs font-bold ${
                                fitScore >= 80
                                  ? "text-emerald-700"
                                  : fitScore >= 65
                                    ? "text-slate-800"
                                    : "text-slate-500"
                              }`}
                            >
                              {fitScore}%
                            </div>
                            <div className="text-[10px] text-slate-400">
                              подходит
                            </div>
                          </div>
                        </button>
                      );
                    },
                  )
                )}
              </div>
            </div>
          ) : (
            /* LINE BALANCE CARD */
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-3">
              <div className="text-sm font-bold text-slate-900">
                Баланс линий в заявке
              </div>
              <div className="space-y-2.5">
                {(["GK", "DEF", "MID", "FWD"] as const).map((pos) => {
                  const meta = POSITION_META[pos];
                  const have = lineSummary.counts[pos];
                  const need = lineSummary.required[pos];
                  const isShort = have < need;
                  const pct =
                    need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 100;

                  return (
                    <div key={pos} className="space-y-1">
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="font-semibold text-slate-800">
                          {meta.pluralLabel} ({meta.shortLabel})
                        </span>
                        <span
                          className={
                            isShort
                              ? "font-bold text-red-600"
                              : "font-semibold text-slate-700"
                          }
                        >
                          {have} в заявке · нужно минимум {need}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isShort
                              ? "#dc2626"
                              : meta.pitchColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {lineSummary.counts.UNI > 0 && (
                  <div className="text-xs text-slate-500 pt-1">
                    Универсалы (УН):{" "}
                    <strong className="text-slate-800 tabular-nums">
                      {lineSummary.counts.UNI}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bench & Reserves Panel */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                Скамейка запасных и резерв ({benchMembers.length})
              </div>
              <span className="text-[11px] text-slate-500">
                Клик по позиции на поле для замены
              </span>
            </div>

            {benchMembers.length === 0 ? (
              <div className="p-5 text-xs text-slate-500 text-center">
                Все активные игроки сборной уже расставлены в стартовом составе.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
                {benchMembers.map(({ client, member, branch, analysis }) => {
                  const posMeta = member.position
                    ? POSITION_META[member.position]
                    : null;
                  const pMeta = PARTICIPATION_META[member.participationStatus];
                  return (
                    <div
                      key={client.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {client.childSurname} {client.childName}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onToggleCaptain(client.id, !member.isCaptain)
                            }
                            title={
                              member.isCaptain
                                ? "Снять повязку капитана"
                                : "Назначить капитаном"
                            }
                            className={`cursor-pointer transition ${
                              member.isCaptain
                                ? "text-amber-500"
                                : "text-slate-300 hover:text-amber-500"
                            }`}
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="truncate">{branch}</span>
                          <span aria-hidden="true">·</span>
                          <span className={pMeta.textClass}>{pMeta.label}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {posMeta ? (
                          <div className={`text-xs font-bold ${posMeta.accentText}`}>
                            {posMeta.label}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">
                            Рек: {POSITION_META[analysis.recommendedPosition].shortLabel}
                          </div>
                        )}
                        {member.subRole && (
                          <div className="text-[10px] text-slate-500 max-w-[130px] truncate">
                            {member.subRole}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {declinedMembers.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Не смогут участвовать</span>
                <span className="font-semibold text-red-600 tabular-nums">
                  {declinedMembers.length} чел.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
