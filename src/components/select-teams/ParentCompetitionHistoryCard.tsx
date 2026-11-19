import React, { useMemo, useState } from "react";
import {
  Trophy,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Award,
} from "lucide-react";
import { TrainingGroup } from "../../types";
import {
  getPlayerCompetitionStats,
  MATCH_OUTCOME_META,
  POSITION_META,
} from "../../utils/selectTeamIntelligence";

interface ParentCompetitionHistoryCardProps {
  clientId: string;
  childName: string;
  groups: TrainingGroup[];
}

export const ParentCompetitionHistoryCard: React.FC<
  ParentCompetitionHistoryCardProps
> = ({ clientId, childName, groups }) => {
  const stats = useMemo(
    () => getPlayerCompetitionStats(clientId, groups),
    [clientId, groups],
  );
  const [showAllTournaments, setShowAllTournaments] = useState(false);

  // Only render when the child has actually participated in at least one competition
  if (stats.tournamentsCount === 0) return null;

  const visibleTournaments = showAllTournaments
    ? stats.tournaments
    : stats.tournaments.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-left">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Соревнования и статистика — {childName}
            </h3>
            <p className="text-xs text-slate-500">
              Турниры в составе сборных команды, счёт матчей и занятые места
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-500 tabular-nums shrink-0">
          Турниров: <strong className="text-slate-900">{stats.tournamentsCount}</strong>
          {stats.podiumsCount > 0 && (
            <>
              {" · "}Призовых мест:{" "}
              <strong className="text-amber-700">{stats.podiumsCount}</strong>
            </>
          )}
          {stats.goalsScored > 0 && (
            <>
              {" · "}Голов:{" "}
              <strong className="text-emerald-700">{stats.goalsScored}</strong>
            </>
          )}
        </div>
      </div>

      {/* 4-Column Personal Match Statistics Bar */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 bg-slate-50/70 border-b border-slate-100">
        <div className="p-3.5 text-center">
          <div className="text-[11px] text-slate-500 font-medium">
            Сыграно игр
          </div>
          <div className="text-xl font-extrabold text-slate-950 tabular-nums mt-0.5">
            {stats.gamesPlayed}
          </div>
        </div>
        <div className="p-3.5 text-center">
          <div className="text-[11px] text-slate-500 font-medium">Побед</div>
          <div className="text-xl font-extrabold text-emerald-700 tabular-nums mt-0.5">
            {stats.wins}
          </div>
        </div>
        <div className="p-3.5 text-center">
          <div className="text-[11px] text-slate-500 font-medium">Ничьих</div>
          <div className="text-xl font-extrabold text-amber-700 tabular-nums mt-0.5">
            {stats.draws}
          </div>
        </div>
        <div className="p-3.5 text-center">
          <div className="text-[11px] text-slate-500 font-medium">
            Поражений
          </div>
          <div className="text-xl font-extrabold text-red-700 tabular-nums mt-0.5">
            {stats.losses}
          </div>
        </div>
      </div>

      {/* Tournament Results & Match Scorelines */}
      <div className="divide-y divide-slate-100">
        {visibleTournaments.map((tr) => {
          const roleText = tr.playerPosition
            ? tr.playerSubRole || POSITION_META[tr.playerPosition].label
            : null;
          const isPodium = tr.place && tr.place >= 1 && tr.place <= 3;

          return (
            <div key={tr.teamId} className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {tr.competitionName}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {tr.teamName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">
                    {tr.date && (
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {tr.date.split("-").reverse().join(".")}
                      </span>
                    )}
                    {tr.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {tr.location}
                      </span>
                    )}
                    {roleText && (
                      <span className="text-slate-700 font-medium">
                        Амплуа: {roleText}
                        {tr.isCaptain ? " (Капитан)" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {tr.resultLabel && (
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-bold shrink-0 ${
                      isPodium ? "text-amber-700" : "text-slate-700"
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>{tr.resultLabel}</span>
                  </div>
                )}
              </div>

              {/* Match Scores List */}
              {tr.matches.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 divide-y divide-slate-100">
                  {tr.matches.map((m) => {
                    const oMeta = MATCH_OUTCOME_META[m.outcome];
                    return (
                      <div
                        key={m.id}
                        className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-slate-900">
                            Амкар Юниор{" "}
                            <span className="font-extrabold tabular-nums px-1">
                              {m.ourScore} : {m.opponentScore}
                            </span>{" "}
                            {m.opponent}
                          </span>
                          {m.stage && (
                            <span className="text-[11px] text-slate-500">
                              · {m.stage}
                            </span>
                          )}
                          {m.playerGoals > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-700">
                              · Забил голов: {m.playerGoals}
                            </span>
                          )}
                        </div>
                        <span className={`font-bold ${oMeta.textClass}`}>
                          {oMeta.label}
                          {m.decidedByPenalties ? " (пен.)" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {tr.resultNotes && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tr.resultNotes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {stats.tournaments.length > 3 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
          <button
            type="button"
            onClick={() => setShowAllTournaments((p) => !p)}
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1 cursor-pointer"
          >
            {showAllTournaments ? (
              <>
                <span>Свернуть историю</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Показать все соревнования ({stats.tournaments.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
