import React, { useMemo, useState, useEffect } from "react";
import { X, Search, Check, UserPlus, Building2, Sparkles } from "lucide-react";
import {
  Client,
  Counterparty,
  PlayerPosition,
  TrainingGroup,
  TrainingSessionProtocol,
} from "../../types";
import {
  analyzePlayerRoleFit,
  POSITION_META,
  resolveClientBranch,
} from "../../utils/selectTeamIntelligence";
import { formatGroupNameDisplay } from "../../utils/formatters";

interface SelectTeamScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TrainingGroup;
  clients: Client[];
  groups: TrainingGroup[];
  counterparties: Counterparty[];
  trainingSessions: TrainingSessionProtocol[];
  onAddPlayers: (
    selectedIds: string[],
    options: { autoAssignSuggestedRoles: boolean },
  ) => Promise<void>;
}

type YearScope = "exact" | "plus_minus_1" | "all";

export const SelectTeamScoutModal: React.FC<SelectTeamScoutModalProps> = ({
  isOpen,
  onClose,
  team,
  clients,
  groups,
  counterparties,
  trainingSessions,
  onAddPlayers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearScope, setYearScope] = useState<YearScope>("exact");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoAssignRoles, setAutoAssignRoles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yearFrom = team.birthYearFrom || team.year || 2018;
  const yearTo = team.birthYearTo || team.year || yearFrom;

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setYearScope("exact");
      setBranchFilter("all");
      setPositionFilter("all");
      setSelectedIds(new Set());
      setAutoAssignRoles(true);
    }
  }, [isOpen, team.id]);

  const alreadyInTeam = useMemo(
    () => new Set(team.selectedClientIds || []),
    [team.selectedClientIds],
  );

  // Active students not yet in this select team
  const candidates = useMemo(() => {
    return clients
      .filter((c) => c.status !== "inactive" && !alreadyInTeam.has(c.id))
      .map((client) => {
        const branch = resolveClientBranch(client, groups, counterparties);
        const analysis = analyzePlayerRoleFit(
          client,
          groups,
          trainingSessions,
          team.id,
        );
        return { client, branch, analysis };
      });
  }, [clients, alreadyInTeam, groups, counterparties, trainingSessions, team.id]);

  // Available branches with counts matching current year scope
  const branchOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of candidates) {
      const yr = item.client.childBirthYear;
      const yearMatch =
        yearScope === "all" ||
        (yearScope === "exact"
          ? yr >= yearFrom && yr <= yearTo
          : yr >= yearFrom - 1 && yr <= yearTo + 1);
      if (!yearMatch) continue;
      counts.set(item.branch, (counts.get(item.branch) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "ru"),
    );
  }, [candidates, yearScope, yearFrom, yearTo]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidates
      .filter(({ client, branch, analysis }) => {
        const yr = client.childBirthYear;
        if (yearScope === "exact" && (yr < yearFrom || yr > yearTo)) {
          return false;
        }
        if (
          yearScope === "plus_minus_1" &&
          (yr < yearFrom - 1 || yr > yearTo + 1)
        ) {
          return false;
        }
        if (branchFilter !== "all" && branch !== branchFilter) {
          return false;
        }
        if (
          positionFilter !== "all" &&
          analysis.recommendedPosition !== positionFilter
        ) {
          return false;
        }
        if (q) {
          const hay =
            `${client.childSurname} ${client.childName} ${client.parentName} ${branch} ${client.groupName || ""} ${client.coachName || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Exact year matches first, then higher avgSkill, then surname
        const aExact =
          a.client.childBirthYear >= yearFrom &&
          a.client.childBirthYear <= yearTo
            ? 1
            : 0;
        const bExact =
          b.client.childBirthYear >= yearFrom &&
          b.client.childBirthYear <= yearTo
            ? 1
            : 0;
        if (bExact !== aExact) return bExact - aExact;
        if (b.analysis.avgSkill !== a.analysis.avgSkill) {
          return b.analysis.avgSkill - a.analysis.avgSkill;
        }
        return `${a.client.childSurname} ${a.client.childName}`.localeCompare(
          `${b.client.childSurname} ${b.client.childName}`,
          "ru",
        );
      });
  }, [
    candidates,
    searchQuery,
    yearScope,
    yearFrom,
    yearTo,
    branchFilter,
    positionFilter,
  ]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredCandidates.map((c) => c.client.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddPlayers(Array.from(selectedIds), {
        autoAssignSuggestedRoles: autoAssignRoles,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const yearLabel =
    yearFrom === yearTo ? `${yearFrom} г.р.` : `${yearFrom}–${yearTo} г.р.`;

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-left">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-red-600" />
              <span>Набор игроков из филиалов — {team.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Отбирайте воспитанников из разных филиалов школы. Игроки останутся в своих основных группах и одновременно войдут в сборную.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по фамилии, имени, филиалу или тренеру..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            {/* Year Scope Segmented Control */}
            <div className="flex items-center p-1 bg-slate-200/70 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setYearScope("exact")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  yearScope === "exact"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Только {yearLabel}
              </button>
              <button
                type="button"
                onClick={() => setYearScope("plus_minus_1")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  yearScope === "plus_minus_1"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ±1 год ({yearFrom - 1}–{yearTo + 1})
              </button>
              <button
                type="button"
                onClick={() => setYearScope("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  yearScope === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Вся школа
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Filter */}
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
              >
                <option value="all">
                  Все филиалы ({branchOptions.length})
                </option>
                {branchOptions.map(([branchName, count]) => (
                  <option key={branchName} value={branchName}>
                    {branchName} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Recommended Role Filter */}
            <div className="flex items-center gap-1 p-0.5 bg-white border border-slate-200 rounded-lg">
              {(
                [
                  { id: "all", label: "Все роли" },
                  { id: "GK", label: "ВР" },
                  { id: "DEF", label: "ЗЩ" },
                  { id: "MID", label: "ПЗ" },
                  { id: "FWD", label: "НП" },
                ] as const
              ).map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPositionFilter(pos.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    positionFilter === pos.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 tabular-nums">
              <span>Найдено: {filteredCandidates.length}</span>
              {filteredCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllVisible}
                  className="text-red-600 hover:text-red-700 font-semibold cursor-pointer whitespace-nowrap"
                >
                  {filteredCandidates.every((c) => selectedIds.has(c.client.id))
                    ? "Снять всех видимых"
                    : "Выбрать всех видимых"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredCandidates.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-2">
              <div className="text-sm font-semibold text-slate-800">
                Нет подходящих учеников по выбранным фильтрам
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Попробуйте расширить диапазон года рождения (например, «±1 год» или «Вся школа») или сбросить фильтр по филиалу.
              </p>
              {yearScope !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    setYearScope("all");
                    setBranchFilter("all");
                    setPositionFilter("all");
                  }}
                  className="mt-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Показать учеников всей школы
                </button>
              )}
            </div>
          ) : (
            filteredCandidates.map(({ client, branch, analysis }) => {
              const isSelected = selectedIds.has(client.id);
              const recPos = POSITION_META[analysis.recommendedPosition];
              const topFitScore =
                analysis.recommendedPosition === "UNI"
                  ? Math.max(
                      analysis.scores.DEF,
                      analysis.scores.MID,
                      analysis.scores.FWD,
                    )
                  : analysis.scores[analysis.recommendedPosition];

              return (
                <div
                  key={client.id}
                  onClick={() => toggleSelect(client.id)}
                  className={`px-6 py-3 flex items-center gap-4 cursor-pointer transition text-left ${
                    isSelected ? "bg-red-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  {/* Player Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {client.childSurname} {client.childName}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {client.childBirthYear} г.р.
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs font-medium text-slate-700 truncate">
                        {branch}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                      {client.groupName && (
                        <span>
                          Группа: {formatGroupNameDisplay(client.groupName)}
                        </span>
                      )}
                      {client.coachName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Тренер: {client.coachName}</span>
                        </>
                      )}
                      {analysis.reasons[0] && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600 truncate">
                            {analysis.reasons[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats & Smart Role Recommendation */}
                  <div className="hidden sm:flex items-center gap-5 shrink-0 text-right tabular-nums">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {analysis.avgSkill.toFixed(1)} / 5
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Посещ. {analysis.attendancePct}%
                      </div>
                    </div>

                    <div className="w-36 text-right">
                      <div className={`text-xs font-bold ${recPos.accentText}`}>
                        {recPos.label} · {topFitScore}%
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {analysis.recommendedSubRole}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAssignRoles}
              onChange={(e) => setAutoAssignRoles(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <Sparkles className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>
              Сразу подставить рекомендуемую роль каждому добавленному игроку
            </span>
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0 || isSubmitting}
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition cursor-pointer whitespace-nowrap tabular-nums"
            >
              {isSubmitting
                ? "Добавление..."
                : `Включить в сборную (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
