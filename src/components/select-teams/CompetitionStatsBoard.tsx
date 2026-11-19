import React, { useMemo, useState } from "react";
import {
  Search,
  Trophy,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import { Client, Counterparty, TrainingGroup } from "../../types";
import {
  getAllPlayersCompetitionLeaderboard,
  getTeamMatchSummary,
  MATCH_OUTCOME_META,
  POSITION_META,
} from "../../utils/selectTeamIntelligence";

interface CompetitionStatsBoardProps {
  selectTeams: TrainingGroup[];
  allGroups: TrainingGroup[];
  clients: Client[];
  counterparties: Counterparty[];
  initialTeamId?: string | null;
}

export const CompetitionStatsBoard: React.FC<CompetitionStatsBoardProps> = ({
  selectTeams,
  allGroups,
  clients,
  counterparties,
}) => {
  const [scopeTeamId, setScopeTeamId] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const scopedTeams = useMemo(
    () =>
      scopeTeamId === "all"
        ? selectTeams
        : selectTeams.filter((t) => t.id === scopeTeamId),
    [selectTeams, scopeTeamId],
  );

  // Overall aggregate across scoped teams
  const overallTeamTotals = useMemo(() => {
    let played = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let podiums = 0;

    for (const t of scopedTeams) {
      const s = getTeamMatchSummary(t);
      played += s.played;
      wins += s.wins;
      draws += s.draws;
      losses += s.losses;
      goalsFor += s.goalsFor;
      goalsAgainst += s.goalsAgainst;
      if (t.competitionPlace && t.competitionPlace >= 1 && t.competitionPlace <= 3) {
        podiums++;
      }
    }
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
    return { played, wins, draws, losses, goalsFor, goalsAgainst, podiums, winRate };
  }, [scopedTeams]);

  const leaderboard = useMemo(
    () =>
      getAllPlayersCompetitionLeaderboard(
        clients,
        allGroups,
        counterparties,
        scopeTeamId === "all" ? undefined : scopeTeamId,
      ),
    [clients, allGroups, counterparties, scopeTeamId],
  );

  const branches = useMemo(() => {
    const set = new Set<string>();
    leaderboard.forEach((r) => set.add(r.branch));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [leaderboard]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leaderboard.filter(({ client, branch }) => {
      if (branchFilter !== "all" && branch !== branchFilter) return false;
      if (q) {
        const hay =
          `${client.childSurname} ${client.childName} ${branch} ${client.childBirthYear}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leaderboard, branchFilter, searchQuery]);

  return (
    <div className="space-y-4 text-left">
      {/* KPI SUMMARY ACROSS COMPETITIONS */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 divide-x divide-slate-100">
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            Сыграно матчей
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-950 tabular-nums">
            {overallTeamTotals.played}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">Побед</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
            {overallTeamTotals.wins}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">Ничьих</div>
          <div className="mt-1 text-2xl font-bold text-amber-700 tabular-nums">
            {overallTeamTotals.draws}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">Поражений</div>
          <div className="mt-1 text-2xl font-bold text-red-700 tabular-nums">
            {overallTeamTotals.losses}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            Процент побед
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-950 tabular-nums">
            {overallTeamTotals.winRate}%
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            Призовые места (1–3)
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600 tabular-nums">
            {overallTeamTotals.podiums}
          </div>
        </div>
      </div>

      {/* FILTERS & PLAYER STATS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск игрока по фамилии, филиалу или году..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
            />
          </div>

          <select
            value={scopeTeamId}
            onChange={(e) => setScopeTeamId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-600"
          >
            <option value="all">
              Все сборные и соревнования ({selectTeams.length})
            </option>
            {selectTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.targetCompetition ? ` — ${t.targetCompetition}` : ""}
              </option>
            ))}
          </select>

          {branches.length > 1 && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600"
            >
              <option value="all">Все филиалы</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <div className="text-sm font-bold text-slate-800">
              Пока нет зафиксированных выступлений и матчей
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Откройте вкладку «Итоги и матчи», отметьте фактически игравших
              ребят («Был») и внесите счёт игр — здесь автоматически соберётся
              полная статистика каждого воспитанника.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 pl-4 pr-3">Игрок и филиал</th>
                  <th className="py-3 px-3 text-right">Турниров</th>
                  <th className="py-3 px-3 text-right">Сыграно игр</th>
                  <th className="py-3 px-3 text-right">Побед</th>
                  <th className="py-3 px-3 text-right">Ничьих</th>
                  <th className="py-3 px-3 text-right">Поражений</th>
                  <th className="py-3 px-3 text-right">% побед</th>
                  <th className="py-3 px-3 text-right">Призовые / Голы</th>
                  <th className="py-3 pl-2 pr-4 text-right">История</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRows.map(({ client, branch, stats }) => {
                  const isOpen = expandedClientId === client.id;
                  return (
                    <React.Fragment key={client.id}>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="py-3 pl-4 pr-3">
                          <div className="font-bold text-slate-900">
                            {client.childSurname} {client.childName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {branch}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {client.childBirthYear} г.р.
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-800 tabular-nums">
                          {stats.tournamentsCount}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-950 tabular-nums">
                          {stats.gamesPlayed}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700 tabular-nums">
                          {stats.wins}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-700 tabular-nums">
                          {stats.draws}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-700 tabular-nums">
                          {stats.losses}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-700 tabular-nums">
                          {stats.gamesPlayed > 0 ? `${stats.winRate}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 tabular-nums">
                          {stats.bestPlace ? (
                            <span className="font-semibold text-amber-700">
                              Лучш.: {stats.bestPlace} место
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {stats.goalsScored > 0 && (
                            <span className="text-slate-500">
                              {" "}
                              · {stats.goalsScored} гол.
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-2 pr-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedClientId(isOpen ? null : client.id)
                            }
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Матчи</span>
                            {isOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={9} className="px-6 py-4 space-y-3">
                            {stats.tournaments.map((tr) => (
                              <div
                                key={tr.teamId}
                                className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="text-xs font-bold text-slate-900">
                                      {tr.competitionName}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      ({tr.teamName})
                                    </span>
                                    {tr.date && (
                                      <span className="text-[11px] text-slate-400 tabular-nums">
                                        · {tr.date.split("-").reverse().join(".")}
                                      </span>
                                    )}
                                    {tr.playerPosition && (
                                      <span className="text-[11px] text-slate-600">
                                        ·{" "}
                                        {tr.playerSubRole ||
                                          POSITION_META[tr.playerPosition].label}
                                      </span>
                                    )}
                                  </div>
                                  {tr.resultLabel && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                                      <Trophy className="w-3.5 h-3.5" />
                                      {tr.resultLabel}
                                    </span>
                                  )}
                                </div>

                                {tr.matches.length > 0 ? (
                                  <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
                                    {tr.matches.map((m) => (
                                      <div
                                        key={m.id}
                                        className="py-1.5 flex items-center justify-between text-xs"
                                      >
                                        <span className="text-slate-800">
                                          Амкар Юниор{" "}
                                          <strong className="tabular-nums">
                                            {m.ourScore}:{m.opponentScore}
                                          </strong>{" "}
                                          {m.opponent}
                                          {m.stage ? (
                                            <span className="text-slate-400">
                                              {" "}
                                              · {m.stage}
                                            </span>
                                          ) : null}
                                          {m.playerGoals > 0 ? (
                                            <span className="text-emerald-700 font-semibold">
                                              {" "}
                                              · Голы: {m.playerGoals}
                                            </span>
                                          ) : null}
                                        </span>
                                        <span
                                          className={`font-semibold ${MATCH_OUTCOME_META[m.outcome].textClass}`}
                                        >
                                          {MATCH_OUTCOME_META[m.outcome].label}
                                          {m.decidedByPenalties ? " (пен.)" : ""}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400">
                                    Участие в турнире зафиксировано (детальные
                                    счета матчей не добавлены).
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
