import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Plus,
  Check,
  X,
  Trash2,
  Edit2,
  Award,
  CheckCircle2,
  Users,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Client,
  MatchOutcome,
  SelectTeamMatch,
  SelectTeamMember,
  TrainingGroup,
} from "../../types";
import {
  computeMatchOutcome,
  formatCompetitionPlaceLabel,
  getTeamMatchSummary,
  MATCH_OUTCOME_META,
  PARTICIPATION_META,
  POSITION_META,
} from "../../utils/selectTeamIntelligence";

interface CompetitionResultsViewProps {
  team: TrainingGroup;
  members: {
    client: Client;
    member: SelectTeamMember;
    branch: string;
  }[];
  actorName: string;
  actorRole: "admin" | "director" | "manager" | "trainer";
  onUpdateTeamResults: (updates: Partial<TrainingGroup>) => Promise<void>;
  onTogglePlayerAttended: (
    clientId: string,
    attended: boolean,
  ) => Promise<void>;
  onMarkAllConfirmedAttended: () => Promise<void>;
  onSaveMatches: (matches: SelectTeamMatch[]) => Promise<void>;
  onNotify: (msg: string) => void;
}

const STAGE_PRESETS = [
  "Групповой этап",
  "1/4 финала",
  "1/2 финала",
  "Матч за 3 место",
  "Финал",
  "Товарищеский матч",
];

const PLACE_PRESETS = [
  { place: 1, label: "1 место (Золото)" },
  { place: 2, label: "2 место (Серебро)" },
  { place: 3, label: "3 место (Бронза)" },
  { place: 4, label: "4 место" },
  { place: 0, label: "Участие в турнире" },
];

export const CompetitionResultsView: React.FC<CompetitionResultsViewProps> = ({
  team,
  members,
  actorName,
  onUpdateTeamResults,
  onTogglePlayerAttended,
  onMarkAllConfirmedAttended,
  onSaveMatches,
  onNotify,
}) => {
  // Tournament overall result form state
  const [placeStr, setPlaceStr] = useState<string>("");
  const [totalTeamsStr, setTotalTeamsStr] = useState<string>("");
  const [resultLabel, setResultLabel] = useState<string>("");
  const [resultNotes, setResultNotes] = useState<string>("");
  const [markCompleted, setMarkCompleted] = useState<boolean>(true);
  const [isSavingResult, setIsSavingResult] = useState(false);

  // Match editor state
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState("");
  const [stage, setStage] = useState("Групповой этап");
  const [matchDate, setMatchDate] = useState("");
  const [ourScoreStr, setOurScoreStr] = useState("0");
  const [oppScoreStr, setOppScoreStr] = useState("0");
  const [penaltyWinner, setPenaltyWinner] = useState<
    "none" | "our" | "opponent"
  >("none");
  const [matchNotes, setMatchNotes] = useState("");
  const [useAllAttended, setUseAllAttended] = useState(true);
  const [customParticipantIds, setCustomParticipantIds] = useState<Set<string>>(
    new Set(),
  );
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);
  const [goalsByClientId, setGoalsByClientId] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    setPlaceStr(
      team.competitionPlace && team.competitionPlace > 0
        ? String(team.competitionPlace)
        : "",
    );
    setTotalTeamsStr(
      team.competitionTotalTeams && team.competitionTotalTeams > 0
        ? String(team.competitionTotalTeams)
        : "",
    );
    setResultLabel(team.competitionResultLabel || "");
    setResultNotes(team.competitionResultNotes || "");
    setMarkCompleted(team.selectTeamStatus === "completed" || true);
    setShowMatchForm(false);
    setEditingMatchId(null);
  }, [
    team.id,
    team.competitionPlace,
    team.competitionTotalTeams,
    team.competitionResultLabel,
    team.competitionResultNotes,
    team.selectTeamStatus,
  ]);

  const matches = useMemo(
    () => team.competitionMatches || [],
    [team.competitionMatches],
  );

  const summary = useMemo(() => getTeamMatchSummary(team), [team]);

  const attendedMembers = useMemo(
    () => members.filter((m) => m.member.attendedCompetition === true),
    [members],
  );

  const confirmedNotMarkedCount = useMemo(
    () =>
      members.filter(
        (m) =>
          m.member.participationStatus === "confirmed" &&
          m.member.attendedCompetition !== true,
      ).length,
    [members],
  );

  const handleSaveOverallResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingResult) return;
    setIsSavingResult(true);
    try {
      const parsedPlace = parseInt(placeStr, 10);
      const parsedTotal = parseInt(totalTeamsStr, 10);
      const cleanPlace =
        !isNaN(parsedPlace) && parsedPlace > 0 ? parsedPlace : undefined;
      const cleanTotal =
        !isNaN(parsedTotal) && parsedTotal > 0 ? parsedTotal : undefined;

      await onUpdateTeamResults({
        competitionPlace: cleanPlace,
        competitionTotalTeams: cleanTotal,
        competitionResultLabel: resultLabel.trim() || undefined,
        competitionResultNotes: resultNotes.trim() || undefined,
        ...(markCompleted ? { selectTeamStatus: "completed" } : {}),
      });
      onNotify("Итоги соревнования сохранены и доступны родителям участников");
    } finally {
      setIsSavingResult(false);
    }
  };

  const openNewMatchForm = () => {
    setEditingMatchId(null);
    setOpponent("");
    setStage("Групповой этап");
    setMatchDate(team.competitionDate || new Date().toISOString().split("T")[0]);
    setOurScoreStr("0");
    setOppScoreStr("0");
    setPenaltyWinner("none");
    setMatchNotes("");
    setUseAllAttended(true);
    setCustomParticipantIds(new Set(attendedMembers.map((m) => m.client.id)));
    setGoalsByClientId({});
    setShowGoalsEditor(false);
    setShowMatchForm(true);
  };

  const openEditMatchForm = (m: SelectTeamMatch) => {
    setEditingMatchId(m.id);
    setOpponent(m.opponent);
    setStage(m.stage || "Групповой этап");
    setMatchDate(m.date || team.competitionDate || "");
    setOurScoreStr(String(m.ourScore));
    setOppScoreStr(String(m.opponentScore));
    if (m.decidedByPenalties && m.ourScore === m.opponentScore) {
      setPenaltyWinner(m.outcome === "win" ? "our" : "opponent");
    } else {
      setPenaltyWinner("none");
    }
    setMatchNotes(m.notes || "");
    const isAutoAll = !m.participantClientIds || m.participantClientIds.length === 0;
    setUseAllAttended(isAutoAll);
    setCustomParticipantIds(
      new Set(
        isAutoAll
          ? attendedMembers.map((item) => item.client.id)
          : m.participantClientIds,
      ),
    );
    setGoalsByClientId({ ...(m.goalsByClientId || {}) });
    setShowGoalsEditor(
      Boolean(m.goalsByClientId && Object.keys(m.goalsByClientId).length > 0),
    );
    setShowMatchForm(true);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOpponent = opponent.trim();
    if (!cleanOpponent) return;

    const ourScore = Math.max(0, parseInt(ourScoreStr, 10) || 0);
    const opponentScore = Math.max(0, parseInt(oppScoreStr, 10) || 0);
    const isTie = ourScore === opponentScore;
    const outcome: MatchOutcome = computeMatchOutcome(
      ourScore,
      opponentScore,
      isTie ? penaltyWinner : "none",
    );

    const cleanGoals: Record<string, number> = {};
    for (const [cid, rawVal] of Object.entries(goalsByClientId)) {
      const val = Number(rawVal);
      if (val > 0) cleanGoals[cid] = val;
    }

    const matchRecord: SelectTeamMatch = {
      id:
        editingMatchId ||
        `m_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      date: matchDate || team.competitionDate || undefined,
      stage: stage.trim() || undefined,
      opponent: cleanOpponent,
      ourScore,
      opponentScore,
      outcome,
      decidedByPenalties: isTie && penaltyWinner !== "none" ? true : undefined,
      // Empty array means "automatically counts for all players marked as attendedCompetition"
      participantClientIds: useAllAttended
        ? []
        : Array.from(customParticipantIds),
      goalsByClientId:
        Object.keys(cleanGoals).length > 0 ? cleanGoals : undefined,
      notes: matchNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    const nextMatches = editingMatchId
      ? matches.map((m) => (m.id === editingMatchId ? matchRecord : m))
      : [...matches, matchRecord];

    await onSaveMatches(nextMatches);
    setShowMatchForm(false);
    setEditingMatchId(null);
    onNotify(
      editingMatchId
        ? `Матч с «${cleanOpponent}» обновлён`
        : `Записан счёт: Амкар Юниор ${ourScore}:${opponentScore} ${cleanOpponent}`,
    );
  };

  const handleDeleteMatch = async (matchId: string) => {
    const nextMatches = matches.filter((m) => m.id !== matchId);
    await onSaveMatches(nextMatches);
    onNotify("Матч удалён из протокола");
  };

  const previewOutcome: MatchOutcome = computeMatchOutcome(
    Math.max(0, parseInt(ourScoreStr, 10) || 0),
    Math.max(0, parseInt(oppScoreStr, 10) || 0),
    (parseInt(ourScoreStr, 10) || 0) === (parseInt(oppScoreStr, 10) || 0)
      ? penaltyWinner
      : "none",
  );

  const currentPlaceDisplay = formatCompetitionPlaceLabel(
    team.competitionPlace,
    team.competitionTotalTeams,
    team.competitionResultLabel,
  );

  return (
    <div className="space-y-5 text-left">
      {/* LIVE SUMMARY BAR FOR THIS COMPETITION */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 divide-x divide-slate-100">
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            Итоговое место
          </div>
          <div className="mt-1 text-base font-bold text-slate-950 truncate">
            {currentPlaceDisplay || "Не указано"}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            Фактически были
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950 tabular-nums">
            {summary.attendedPlayersCount}{" "}
            <span className="text-xs font-normal text-slate-500">
              из {members.length}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            Матчей сыграно
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950 tabular-nums">
            {summary.played}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            В / Н / П
          </div>
          <div className="mt-1 text-base font-bold tabular-nums flex items-center gap-2 pt-0.5">
            <span className="text-emerald-700">{summary.wins} В</span>
            <span className="text-slate-300">·</span>
            <span className="text-amber-700">{summary.draws} Н</span>
            <span className="text-slate-300">·</span>
            <span className="text-red-700">{summary.losses} П</span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 font-medium">
            Разница мячей
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950 tabular-nums">
            {summary.goalsFor} : {summary.goalsAgainst}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): MATCHES & OVERALL RESULT */}
        <div className="lg:col-span-7 space-y-5">
          {/* SECTION 1: MATCHES & SCORES */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Игры и счёт сборной ({matches.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Счёт и результаты матчей автоматически засчитываются всем
                  отмеченным участникам и отображаются у их родителей.
                </p>
              </div>
              {!showMatchForm && (
                <button
                  type="button"
                  onClick={openNewMatchForm}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить игру</span>
                </button>
              )}
            </div>

            {/* INLINE MATCH FORM */}
            {showMatchForm && (
              <form
                onSubmit={handleSaveMatch}
                className="p-5 bg-slate-50 border-b border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">
                    {editingMatchId
                      ? "Редактирование матча"
                      : "Новая игра сборной"}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMatchForm(false);
                      setEditingMatchId(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Соперник *
                    </label>
                    <input
                      type="text"
                      value={opponent}
                      onChange={(e) => setOpponent(e.target.value)}
                      placeholder="Например: ДЮСШ-3 или Спартак"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Этап / стадия
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                    >
                      {STAGE_PRESETS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Дата игры
                    </label>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 tabular-nums focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Scoreline Row */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-slate-800 whitespace-nowrap">
                      Амкар Юниор
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={ourScoreStr}
                      onChange={(e) => setOurScoreStr(e.target.value)}
                      className="w-16 px-2 py-2 text-center bg-slate-50 border border-slate-300 rounded-lg text-lg font-extrabold text-slate-950 tabular-nums focus:outline-none focus:bg-white focus:border-red-600"
                    />
                    <span className="text-lg font-bold text-slate-400">:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={oppScoreStr}
                      onChange={(e) => setOppScoreStr(e.target.value)}
                      className="w-16 px-2 py-2 text-center bg-slate-50 border border-slate-300 rounded-lg text-lg font-extrabold text-slate-950 tabular-nums focus:outline-none focus:bg-white focus:border-red-600"
                    />
                    <div className="text-xs font-semibold text-slate-600 truncate max-w-[140px]">
                      {opponent.trim() || "Соперник"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold ${MATCH_OUTCOME_META[previewOutcome].textClass}`}
                    >
                      Итог: {MATCH_OUTCOME_META[previewOutcome].label}
                    </span>
                  </div>
                </div>

                {/* Optional Penalty Shootout if Tied */}
                {(parseInt(ourScoreStr, 10) || 0) ===
                  (parseInt(oppScoreStr, 10) || 0) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-600 font-medium">
                      Серия пенальти:
                    </span>
                    {(
                      [
                        { id: "none", label: "Ничья (без пенальти)" },
                        { id: "our", label: "Победа по пенальти" },
                        { id: "opponent", label: "Поражение по пенальти" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPenaltyWinner(opt.id)}
                        className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition cursor-pointer ${
                          penaltyWinner === opt.id
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Participants Scope */}
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useAllAttended}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseAllAttended(checked);
                          if (!checked && customParticipantIds.size === 0) {
                            setCustomParticipantIds(
                              new Set(attendedMembers.map((m) => m.client.id)),
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span>
                        Засчитать всем игрокам с отметкой «Был на турнире» (
                        {attendedMembers.length} чел.)
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowGoalsEditor((p) => !p)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Кто забил голы (опционально)</span>
                      {showGoalsEditor ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {!useAllAttended && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {members.map(({ client }) => {
                        const checked = customParticipantIds.has(client.id);
                        return (
                          <label
                            key={client.id}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setCustomParticipantIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(client.id))
                                    next.delete(client.id);
                                  else next.add(client.id);
                                  return next;
                                });
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-red-600"
                            />
                            <span className="truncate">
                              {client.childSurname} {client.childName}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {showGoalsEditor && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto space-y-1.5">
                      <div className="text-[11px] text-slate-500 mb-1">
                        Укажите количество забитых голов для отличившихся игроков:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(attendedMembers.length > 0
                          ? attendedMembers
                          : members
                        ).map(({ client }) => {
                          const gVal = goalsByClientId[client.id] || 0;
                          return (
                            <div
                              key={client.id}
                              className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded bg-slate-50"
                            >
                              <span className="truncate text-slate-800">
                                {client.childSurname} {client.childName}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGoalsByClientId((prev) => ({
                                      ...prev,
                                      [client.id]: Math.max(0, gVal - 1),
                                    }))
                                  }
                                  className="w-6 h-6 rounded border border-slate-300 bg-white text-slate-700 font-bold cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center font-bold tabular-nums">
                                  {gVal}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGoalsByClientId((prev) => ({
                                      ...prev,
                                      [client.id]: gVal + 1,
                                    }))
                                  }
                                  className="w-6 h-6 rounded border border-slate-300 bg-white text-slate-700 font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    placeholder="Краткий комментарий по игре (опционально)..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMatchForm(false);
                      setEditingMatchId(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                  >
                    {editingMatchId ? "Сохранить матч" : "Записать счёт"}
                  </button>
                </div>
              </form>
            )}

            {/* MATCHES LIST */}
            {matches.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="text-sm font-semibold text-slate-800">
                  Матчи этого соревнования ещё не записаны
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Добавьте сыгранные матчи и счёт — система автоматически
                  посчитает победы, ничьи и поражения для всей сборной и каждого
                  участвовавшего игрока.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {matches.map((m, idx) => {
                  const oMeta = MATCH_OUTCOME_META[m.outcome];
                  const partCount =
                    m.participantClientIds && m.participantClientIds.length > 0
                      ? m.participantClientIds.length
                      : attendedMembers.length;

                  const scorerNames = m.goalsByClientId
                    ? Object.entries(m.goalsByClientId)
                        .map(([cid, rawCnt]) => [cid, Number(rawCnt)] as const)
                        .filter(([, cnt]) => cnt > 0)
                        .map(([cid, cnt]) => {
                          const c = members.find(
                            (item) => item.client.id === cid,
                          )?.client;
                          return c
                            ? `${c.childSurname}${cnt > 1 ? ` (${cnt})` : ""}`
                            : null;
                        })
                        .filter(Boolean)
                    : [];

                  return (
                    <div
                      key={m.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="text-xs text-slate-400 font-semibold tabular-nums">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-950">
                            Амкар Юниор{" "}
                            <span className="tabular-nums px-1.5 py-0.5 rounded bg-slate-100 mx-0.5">
                              {m.ourScore} : {m.opponentScore}
                            </span>{" "}
                            {m.opponent}
                          </span>
                          <span className={`text-xs font-bold ${oMeta.textClass}`}>
                            {oMeta.label}
                            {m.decidedByPenalties ? " (пен.)" : ""}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                          {m.stage && <span>{m.stage}</span>}
                          {m.date && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Calendar className="w-3 h-3" />
                                {m.date.split("-").reverse().join(".")}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Users className="w-3 h-3" />
                            Участников: {partCount}
                            {!m.participantClientIds ||
                            m.participantClientIds.length === 0
                              ? " (все кто был)"
                              : ""}
                          </span>
                        </div>

                        {scorerNames.length > 0 && (
                          <div className="text-[11px] text-slate-600">
                            Голы: {scorerNames.join(", ")}
                          </div>
                        )}
                        {m.notes && (
                          <div className="text-[11px] text-slate-500 italic">
                            {m.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditMatchForm(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Редактировать матч"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Удалить матч"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: FINAL TOURNAMENT PLACEMENT / RESULT */}
          <form
            onSubmit={handleSaveOverallResult}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Итоговое место и результат по итогам соревнований
              </h3>
            </div>

            {/* Quick Place Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PLACE_PRESETS.map((preset) => {
                const isSelected =
                  (preset.place > 0 && String(preset.place) === placeStr) ||
                  (preset.place === 0 &&
                    !placeStr &&
                    resultLabel === preset.label);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPlaceStr(preset.place > 0 ? String(preset.place) : "");
                      setResultLabel(preset.label);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Место (число)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={placeStr}
                  onChange={(e) => {
                    setPlaceStr(e.target.value);
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n > 0) {
                      setResultLabel(
                        totalTeamsStr
                          ? `${n} место из ${totalTeamsStr}`
                          : `${n} место`,
                      );
                    }
                  }}
                  placeholder="1"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 tabular-nums focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Всего команд
                </label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={totalTeamsStr}
                  onChange={(e) => setTotalTeamsStr(e.target.value)}
                  placeholder="8"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 tabular-nums focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Формулировка итога (увидят родители)
                </label>
                <input
                  type="text"
                  value={resultLabel}
                  onChange={(e) => setResultLabel(e.target.value)}
                  placeholder="Например: 1 место (Золото) или Финалисты кубка"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Итоговый комментарий тренера для родителей и истории клуба
              </label>
              <textarea
                rows={2}
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                placeholder="Ребята показали характер, отлично сыграли в обороне и заслуженно взяли призовое место!"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-red-600 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markCompleted}
                  onChange={(e) => setMarkCompleted(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-red-600"
                />
                <span>Перевести статус сборной в «Турнир завершён»</span>
              </label>

              <button
                type="submit"
                disabled={isSavingResult}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isSavingResult ? "Сохранение..." : "Сохранить итоги турнира"}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN (5 cols): FACTUAL PLAYER ATTENDANCE ON COMPETITION */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Фактическое участие на соревновании
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Отметьте игроков, которые реально были на турнире. Их
                  родителям автоматически откроются итоги, счёт и статистика.
                </p>
              </div>
            </div>

            {confirmedNotMarkedCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllConfirmedAttended}
                className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Отметить всех подтверждённых как «Был» (+
                  {confirmedNotMarkedCount})
                </span>
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Сначала добавьте игроков в сборную на вкладке «Заявка, отметки и
              роли».
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
              {members.map(({ client, member, branch }) => {
                const isAttended = member.attendedCompetition === true;
                const isExplicitAbsent = member.attendedCompetition === false;
                const pMeta = PARTICIPATION_META[member.participationStatus];
                const posLabel = member.position
                  ? POSITION_META[member.position].shortLabel
                  : null;

                return (
                  <div
                    key={client.id}
                    className={`px-4 py-3 flex items-center justify-between gap-3 transition ${
                      isAttended ? "bg-emerald-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <span>
                          {client.childSurname} {client.childName}
                        </span>
                        {posLabel && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            · {posLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{branch}</span>
                        <span aria-hidden="true">·</span>
                        <span className={pMeta.textClass}>
                          Заявка: {pMeta.shortLabel}
                        </span>
                      </div>
                      {isAttended && (
                        <div className="text-[10px] text-emerald-700 font-medium inline-flex items-center gap-1 mt-0.5">
                          <Eye className="w-3 h-3" />
                          <span>Видно в кабинете родителя</span>
                        </div>
                      )}
                    </div>

                    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 shrink-0">
                      <button
                        type="button"
                        onClick={() => onTogglePlayerAttended(client.id, true)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 ${
                          isAttended
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Был</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePlayerAttended(client.id, false)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                          isExplicitAbsent
                            ? "bg-slate-700 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Не был
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
