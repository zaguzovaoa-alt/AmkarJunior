import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  User,
  Users,
  Clock,
  CheckCircle,
  Camera,
  X,
  Edit3,
  Trash2,
  Save,
  Upload,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  FileText,
  Ban,
  Layers,
} from "lucide-react";
import { TrainingSessionProtocol } from "../types";
import { HeaderDescription } from "./HeaderDescription";
import { toYearMonthString, formatSessionDateDisplay } from "../utils/dateUtils";
import { formatGroupNameDisplay } from "../utils/formatters";
import { compressImage } from "../utils/image";
import { TrainerCancelModal } from "./TrainerCancelModal";

export const TrainerSessions: React.FC = () => {
  const {
    trainingSessions,
    cancelledSessions,
    deleteCancelledSession,
    coaches,
    groups,
    clients,
    currentRole,
    deleteTrainingSession,
    updateTrainingSessionProtocol,
  } = useCRM();
  const { appUser } = useAuth();

  const myCoach =
    coaches.find(
      (c) =>
        c.name.toLowerCase() === appUser?.fullName?.toLowerCase() ||
        (c.phone && appUser?.phone && c.phone === appUser?.phone),
    ) || coaches[0];

  const [selectedSession, setSelectedSession] = useState<TrainingSessionProtocol | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<TrainingSessionProtocol | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [selectedCoachId, setSelectedCoachId] = useState<string>("all");

  const isPrivileged = currentRole === "admin" || currentRole === "director";

  const targetCoach =
    isPrivileged && selectedCoachId !== "all"
      ? coaches.find((c) => c.id === selectedCoachId)
      : myCoach;

  const isAllCoachesMode = isPrivileged && selectedCoachId === "all";

  const [sessionTab, setSessionTab] = useState<"completed" | "cancelled">("completed");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalMode, setCancelModalMode] = useState<"single" | "batch" | "unreported">("batch");
  const [confirmDeleteCancelId, setConfirmDeleteCancelId] = useState<string | null>(null);
  const [filterLessonPlan, setFilterLessonPlan] = useState<"all" | "with_plan" | "without_plan">("all");

  const myCancelledSessions = (cancelledSessions || [])
    .filter((cs) => {
      // 1. Filter by month
      if (cs.date && cs.date.substring(0, 7) !== filterMonth) return false;

      // 2. If director/admin in "All coaches" mode:
      if (isAllCoachesMode) return true;

      // 3. For specific coach:
      const cId = targetCoach?.id;
      const cName = targetCoach?.name || "";
      return (
        cs.coachId === cId ||
        (cName && cs.coachName?.toLowerCase().includes(cName.toLowerCase())) ||
        groups.some(
          (g) =>
            (g.name === cs.groupName || g.id === cs.groupId) &&
            (g.coachId === cId || (cName && g.coachName?.toLowerCase().includes(cName.toLowerCase())))
        )
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const mySessions = (trainingSessions || [])
    .filter((s) => {
      // 1. Filter by month
      if (toYearMonthString(s.dateString, s.date) !== filterMonth) return false;

      // 2. If director/admin in "All coaches" mode:
      if (isAllCoachesMode) return true;

      // 3. For specific coach:
      const cId = targetCoach?.id;
      const cName = targetCoach?.name || "";
      return (
        s.coachId === cId ||
        (cName && s.coachName?.toLowerCase().includes(cName.toLowerCase())) ||
        s.assistantId === cId ||
        (cName && s.assistantName?.toLowerCase().includes(cName.toLowerCase()))
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalCount = mySessions.length;

  const countWithPlan = mySessions.filter(
    (s) => Boolean(s.hasLessonPlan || s.lessonPlanText || s.lessonPlanPhotoUrl)
  ).length;

  const countWithoutPlan = mySessions.filter(
    (s) => !Boolean(s.hasLessonPlan || s.lessonPlanText || s.lessonPlanPhotoUrl)
  ).length;

  const displayedSessions = mySessions.filter((s) => {
    const hasPlan = Boolean(s.hasLessonPlan || s.lessonPlanText || s.lessonPlanPhotoUrl);
    if (filterLessonPlan === "with_plan") return hasPlan;
    if (filterLessonPlan === "without_plan") return !hasPlan;
    return true;
  });

  const countMain = isAllCoachesMode
    ? mySessions.filter((s) => Boolean(s.coachName && s.coachName !== "Неизвестный тренер")).length
    : mySessions.filter(
        (s) =>
          s.coachId === targetCoach?.id ||
          Boolean(targetCoach?.name && s.coachName?.toLowerCase().includes(targetCoach.name.toLowerCase())),
      ).length;

  const countAssistant = isAllCoachesMode
    ? mySessions.filter((s) => Boolean(s.assistantId || s.assistantName)).length
    : mySessions.filter(
        (s) =>
          (s.assistantId === targetCoach?.id ||
            Boolean(targetCoach?.name && s.assistantName?.toLowerCase().includes(targetCoach.name.toLowerCase()))) &&
          s.coachId !== targetCoach?.id,
      ).length;

  const openSessionDetail = (session: TrainingSessionProtocol) => {
    setSelectedSession(session);
    setIsEditing(false);
    setEditForm(null);
  };

  const startEditing = (session: TrainingSessionProtocol) => {
    setSelectedSession(session);
    const clone: TrainingSessionProtocol = JSON.parse(JSON.stringify(session));
    if (typeof clone.presentPaidCount !== "number" || typeof clone.presentUnpaidCount !== "number") {
      let paid = 0;
      let unpaid = 0;
      (clone.records || []).forEach((r) => {
        if (r.status === "present") {
          const cl = clients.find((c) => c.id === r.clientId);
          if (cl?.abonement && cl.abonement !== "none" && (cl.abonementSessionsLeft || 0) > 0) {
            paid++;
          } else {
            unpaid++;
          }
        } else if (r.status === "trial_free") {
          unpaid++;
        }
      });
      clone.presentPaidCount = paid;
      clone.presentUnpaidCount = unpaid;
      clone.presentCount = paid + unpaid;
    }
    if (clone.hasLessonPlan === undefined) {
      clone.hasLessonPlan = Boolean(clone.lessonPlanText || clone.lessonPlanPhotoUrl);
    }
    setEditForm(clone);
    setIsEditing(true);
  };

  const handleStatusChange = (
    clientId: string,
    newStatus: "present" | "absent_sick" | "absent" | "trial_free",
  ) => {
    if (!editForm) return;
    const updatedRecords = (editForm.records || []).map((r) =>
      r.clientId === clientId ? { ...r, status: newStatus } : r,
    );
    setEditForm({ ...editForm, records: updatedRecords });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      compressImage(file, (base64) => {
        setEditForm((prev) => (prev ? { ...prev, photoUrl: base64 } : null));
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setIsSaving(true);
    try {
      const paid = Math.max(0, Number(editForm.presentPaidCount) || 0);
      const unpaid = Math.max(0, Number(editForm.presentUnpaidCount) || 0);
      const toSave: TrainingSessionProtocol = {
        ...editForm,
        presentPaidCount: paid,
        presentUnpaidCount: unpaid,
        presentCount: paid + unpaid,
        hasLessonPlan: Boolean(editForm.hasLessonPlan),
        lessonPlanText: editForm.hasLessonPlan ? (editForm.lessonPlanText || "") : "",
        lessonPlanPhotoUrl: editForm.hasLessonPlan ? (editForm.lessonPlanPhotoUrl || "") : "",
      };
      await updateTrainingSessionProtocol(toSave);
      setSelectedSession(toSave);
      setIsEditing(false);
      setEditForm(null);
    } catch (err) {
      console.error("Failed to update session:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteTrainingSession(id);
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        setIsEditing(false);
        setEditForm(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              Учет тренировок
            </h1>
            <HeaderDescription
              text={
                <>
                  {isPrivileged
                    ? "Журнал всех проведенных тренировок и возможность их редактирования."
                    : "Мониторинг, корректировка и удаление отчетов по проведенным тренировкам."}
                </>
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Coach selector for Director / Admin */}
            {isPrivileged && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="outline-none bg-transparent text-xs sm:text-sm font-bold text-slate-700 cursor-pointer max-w-[190px] sm:max-w-xs truncate"
                >
                  <option value="all">Все тренеры школы</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-max">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="outline-none bg-transparent text-xs sm:text-sm font-bold text-slate-700 cursor-pointer"
              />
            </div>

            {/* Button to record cancellation */}
            <button
              type="button"
              onClick={() => {
                setCancelModalMode("batch");
                setShowCancelModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs"
            >
              <Ban className="w-4 h-4" />
              <span>Зафиксировать отмену</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100/50">
            <div className="text-emerald-600 mb-1 font-bold text-xs uppercase tracking-wide">Всего тренировок</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">{totalCount}</div>
            <div className="text-[11px] text-emerald-600/70 mt-1 font-medium truncate">
              {isAllCoachesMode
                ? "За выбранный месяц в школе"
                : `Тренировок ${targetCoach?.name || ""}`}
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100/50">
            <div className="text-blue-600 mb-1 font-bold text-xs uppercase tracking-wide">
              {isAllCoachesMode ? "С главным" : "Основной"}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700">{countMain}</div>
            <div className="text-[11px] text-blue-600/70 mt-1 font-medium truncate">
              {isAllCoachesMode ? "Назначен главный" : "Провел как главный"}
            </div>
          </div>
          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200/60">
            <div className="text-emerald-700 mb-1 font-bold text-xs uppercase tracking-wide flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              С конспектом
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800">{countWithPlan}</div>
            <div className="text-[11px] text-emerald-700/70 mt-1 font-medium truncate">
              Конспект прикреплен
            </div>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <div className="text-rose-600 mb-1 font-bold text-xs uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Без конспекта
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700">{countWithoutPlan}</div>
            <div className="text-[11px] text-rose-600/70 mt-1 font-medium truncate">
              Отметка «Нет конспекта»
            </div>
          </div>
          <div
            onClick={() => setSessionTab("cancelled")}
            className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/80 cursor-pointer hover:bg-amber-100/80 transition"
          >
            <div className="text-amber-800 mb-1 font-bold text-xs uppercase tracking-wide flex items-center gap-1">
              <Ban className="w-3.5 h-3.5 text-amber-600" />
              Отменено
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900">{myCancelledSessions.length}</div>
            <div className="text-[11px] text-amber-800/70 mt-1 font-medium truncate">
              {myCancelledSessions.length === 0 ? "Отмен нет" : "Нажмите для просмотра"}
            </div>
          </div>
        </div>

        {/* Tab switcher: Completed vs Cancelled */}
        <div className="flex border-b border-gray-200 mb-5 gap-6">
          <button
            type="button"
            onClick={() => setSessionTab("completed")}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              sessionTab === "completed"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-slate-800"
            }`}
          >
            <span>Проведенные тренировки</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              sessionTab === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
            }`}>
              {displayedSessions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSessionTab("cancelled")}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              sessionTab === "cancelled"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-gray-500 hover:text-slate-800"
            }`}
          >
            <Ban className="w-4 h-4 text-rose-600" />
            <span>Отмененные занятия</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              sessionTab === "cancelled" ? "bg-rose-100 text-rose-800" : "bg-gray-100 text-gray-600"
            }`}>
              {myCancelledSessions.length}
            </span>
          </button>
        </div>

        {sessionTab === "completed" ? (
          <>
            {/* Lesson Plan Quick Filter & Counter */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterLessonPlan("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterLessonPlan === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Все ({mySessions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLessonPlan("with_plan")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    filterLessonPlan === "with_plan"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-emerald-700"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  С конспектом ({countWithPlan})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLessonPlan("without_plan")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    filterLessonPlan === "without_plan"
                      ? "bg-white text-rose-700 shadow-xs"
                      : "text-slate-600 hover:text-rose-700"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Без конспекта ({countWithoutPlan})
                </button>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Показано {displayedSessions.length} из {mySessions.length}
              </span>
            </div>

            {displayedSessions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-xs sm:text-sm">
                  {mySessions.length === 0
                    ? "За выбранный месяц тренировок не найдено."
                    : "Нет тренировок, соответствующих выбранному фильтру конспекта."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
            {displayedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-100 hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-normal text-slate-800">{formatGroupNameDisplay(session.groupName)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                      {formatSessionDateDisplay(session.date, session.dateString)}
                    </span>
                    {/* Lesson plan status badge */}
                    {session.hasLessonPlan || session.lessonPlanText || session.lessonPlanPhotoUrl ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        <FileText className="w-3 h-3 text-emerald-600" />
                        Конспект есть
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Нет конспекта
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {session.coachName ? (
                        <>
                          <strong className="text-slate-800 font-semibold">{session.coachName}</strong>{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            {session.coachId === myCoach?.id ? "(Вы • Основной)" : "(Основной)"}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Основной тренер не указан</span>
                      )}
                      {session.assistantName && (
                        <span className="ml-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1">
                          Ассистент: {session.assistantName}
                          {session.assistantId === myCoach?.id && " (Вы)"}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  {session.photoUrl && (
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                      onClick={() => openSessionDetail(session)}
                    >
                      <img
                        src={session.photoUrl}
                        alt="Фото"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 border-r pr-4 border-slate-200">
                    <div className="text-center">
                      <div className="text-lg font-black text-emerald-600">
                        {session.presentCount}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">
                        Были
                      </div>
                      {(session.presentPaidCount !== undefined || session.presentUnpaidCount !== undefined) && (
                        <div className="text-[9px] text-slate-500 font-medium whitespace-nowrap mt-0.5">
                          {session.presentPaidCount ?? 0} опл. / {session.presentUnpaidCount ?? 0} б/о
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-rose-500">
                        {session.absentCount + session.sickCount}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">
                        Пропуск
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openSessionDetail(session)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition"
                    >
                      Подробнее
                    </button>
                    <button
                      onClick={() => startEditing(session)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                      title="Корректировать ведомость"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(session.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                      title="Удалить ведомость"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    ) : (
      /* Cancelled sessions view */
      <div className="space-y-4">
        {myCancelledSessions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Ban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-xs sm:text-sm">
              В выбранном месяце нет отмененных тренировок.
            </p>
            <button
              type="button"
              onClick={() => {
                setCancelModalMode("batch");
                setShowCancelModal(true);
              }}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Зафиксировать отмену тренировки</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myCancelledSessions.map((cs) => {
              const reasonStyles: Record<string, string> = {
                "Болезнь тренера": "bg-rose-100 text-rose-800 border-rose-200",
                "Занятость зала": "bg-amber-100 text-amber-800 border-amber-200",
                "Погодные условия": "bg-sky-100 text-sky-800 border-sky-200",
                "Мало участников": "bg-purple-100 text-purple-800 border-purple-200",
                "Праздничный день": "bg-emerald-100 text-emerald-800 border-emerald-200",
                "Соревнования / турнир": "bg-indigo-100 text-indigo-800 border-indigo-200",
                "Карантин / санитарный день": "bg-orange-100 text-orange-800 border-orange-200",
                "Другое": "bg-slate-100 text-slate-800 border-slate-200",
              };
              const badgeCls = reasonStyles[cs.reason] || "bg-slate-100 text-slate-800 border-slate-200";

              return (
                <div
                  key={cs.id}
                  className="bg-white border border-rose-100/70 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-rose-300 transition-all text-left"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">
                        {formatGroupNameDisplay(cs.groupName)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        {cs.date}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeCls} flex items-center gap-1`}>
                        <Ban className="w-3 h-3" />
                        <span>{cs.reason}</span>
                      </span>
                      {cs.isRescheduled && cs.rescheduleDate && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                          Перенос на {cs.rescheduleDate}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                      <span>Тренер: <strong className="text-slate-700">{cs.coachName || "Не указан"}</strong></span>
                      {cs.notes && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="italic text-slate-600">«{cs.notes}»</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCancelId(cs.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition border border-rose-200 flex items-center gap-1"
                      title="Отозвать отмену (тренировка состоялась или была отменена по ошибке)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить отмену</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
      </div>

      {/* Detail / Edit Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {isEditing ? "Редактирование ведомости" : "Отчет по тренировке"}
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  {selectedSession.groupName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => startEditing(selectedSession)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Изм.</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(selectedSession.id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedSession(null);
                    setIsEditing(false);
                    setEditForm(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              {!isEditing ? (
                /* READ-ONLY VIEW */
                <>
                  {selectedSession.photoUrl ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50 flex items-center justify-center min-h-[200px]">
                      <img
                        src={selectedSession.photoUrl}
                        alt="Фотоотчет"
                        className="w-full object-contain max-h-[35vh]"
                      />
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400 bg-slate-50 rounded-xl border border-dashed">
                      <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span>Фотоотчет не прикреплен</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Группа
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {selectedSession.groupName}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Дата и время
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {formatSessionDateDisplay(selectedSession.date, selectedSession.dateString)}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Основной тренер
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {selectedSession.coachName}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Ассистент
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {selectedSession.assistantName || "Не указан"}
                      </div>
                    </div>
                  </div>

                  {selectedSession.notes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-amber-700 mb-1">
                        Заметки тренера
                      </div>
                      <p className="text-xs text-slate-800 italic">
                        "{selectedSession.notes}"
                      </p>
                    </div>
                  )}

                  {/* Конспект тренировки */}
                  <div
                    className={`p-4 rounded-xl border ${
                      selectedSession.hasLessonPlan ||
                      selectedSession.lessonPlanText ||
                      selectedSession.lessonPlanPhotoUrl
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-rose-50/70 border-rose-200 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`w-4 h-4 ${
                            selectedSession.hasLessonPlan ||
                            selectedSession.lessonPlanText ||
                            selectedSession.lessonPlanPhotoUrl
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        />
                        <span className="font-extrabold text-xs uppercase tracking-wide">
                          Конспект тренировки
                        </span>
                      </div>
                      {selectedSession.hasLessonPlan ||
                      selectedSession.lessonPlanText ||
                      selectedSession.lessonPlanPhotoUrl ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-800 border border-emerald-300">
                          Конспект прикреплен
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-200/80 text-rose-800 border border-rose-300">
                          Нет конспекта
                        </span>
                      )}
                    </div>

                    {selectedSession.lessonPlanText && (
                      <div className="bg-white p-3 rounded-lg border border-emerald-200/60 text-xs text-slate-800 whitespace-pre-wrap mt-2">
                        {selectedSession.lessonPlanText}
                      </div>
                    )}

                    {selectedSession.lessonPlanPhotoUrl && (
                      <div className="mt-3">
                        <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          Фотография конспекта
                        </div>
                        <a
                          href={selectedSession.lessonPlanPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full max-w-xs rounded-xl overflow-hidden border border-emerald-200 shadow-xs hover:opacity-95 transition"
                        >
                          <img
                            src={selectedSession.lessonPlanPhotoUrl}
                            alt="Конспект"
                            className="w-full object-cover max-h-48"
                          />
                        </a>
                      </div>
                    )}

                    {!selectedSession.hasLessonPlan &&
                      !selectedSession.lessonPlanText &&
                      !selectedSession.lessonPlanPhotoUrl && (
                        <p className="text-xs text-rose-700 italic mt-1">
                          Тренер зафиксировал отметку «Нет конспекта» при отправке протокола.
                        </p>
                      )}
                  </div>

                  <div className="p-4 border rounded-xl space-y-3">
                    <h4 className="font-bold text-sm text-slate-900">
                      Ведомость посещаемости
                    </h4>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span className="text-emerald-600 font-bold">
                        Присутствовали: {selectedSession.presentCount} чел.
                        {(selectedSession.presentPaidCount !== undefined || selectedSession.presentUnpaidCount !== undefined) && (
                          <span className="font-medium text-slate-600 ml-1.5">
                            (с оплатой: <strong className="text-emerald-700">{selectedSession.presentPaidCount ?? 0}</strong>, без оплаты: <strong className="text-amber-700">{selectedSession.presentUnpaidCount ?? 0}</strong>)
                          </span>
                        )}
                      </span>
                      <span className="text-rose-600 font-bold">
                        Пропустили:{" "}
                        {selectedSession.absentCount + selectedSession.sickCount}
                      </span>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      {selectedSession.records &&
                        selectedSession.records.map((rec) => (
                          <div
                            key={rec.clientId}
                            className="flex justify-between items-center py-1.5 border-b last:border-0 border-gray-100 text-xs"
                          >
                            <span className="font-bold text-slate-800">
                              {rec.clientName}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                rec.status === "present"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : rec.status === "absent_sick"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : rec.status === "trial_free"
                                  ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {rec.status === "present"
                                ? "Был"
                                : rec.status === "absent_sick"
                                ? "Болел"
                                : rec.status === "trial_free"
                                ? "Пробная"
                                : "Пропуск"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : editForm ? (
                /* EDITING FORM */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Дата проведения (ДД.ММ.ГГГГ)
                      </label>
                      <input
                        type="text"
                        value={editForm.dateString}
                        onChange={(e) =>
                          setEditForm({ ...editForm, dateString: e.target.value })
                        }
                        className="w-full text-xs font-semibold p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Время / Краткая дата
                      </label>
                      <input
                        type="text"
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm({ ...editForm, date: e.target.value })
                        }
                        className="w-full text-xs font-semibold p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Основной тренер
                      </label>
                      <select
                        value={editForm.coachId || ""}
                        onChange={(e) => {
                          const coach = coaches.find((c) => c.id === e.target.value);
                          setEditForm({
                            ...editForm,
                            coachId: e.target.value,
                            coachName: coach ? coach.name : editForm.coachName,
                          });
                        }}
                        className="w-full text-xs font-semibold p-2.5 border rounded-xl outline-none focus:border-emerald-500 bg-white"
                      >
                        <option value="">
                          {editForm.coachName || "Не выбран тренер"}
                        </option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ассистент (при наличии)
                      </label>
                      <select
                        value={editForm.assistantId || ""}
                        onChange={(e) => {
                          const coach = coaches.find((c) => c.id === e.target.value);
                          setEditForm({
                            ...editForm,
                            assistantId: e.target.value,
                            assistantName: coach ? coach.name : "",
                          });
                        }}
                        className="w-full text-xs font-semibold p-2.5 border rounded-xl outline-none focus:border-emerald-500 bg-white"
                      >
                        <option value="">Без ассистента</option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Заметки и разбор тренера
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.notes || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      placeholder="Комментарий о проведенной тренировке..."
                      className="w-full text-xs font-medium p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Фотоотчет с тренировки
                    </label>
                    {editForm.photoUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-16 rounded-xl overflow-hidden border">
                          <img
                            src={editForm.photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition">
                          Заменить фото
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition text-xs font-bold text-slate-600">
                        <Upload className="w-4 h-4" />
                        <span>Прикрепить новое фото</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Конспект тренировки (редактирование) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Конспект тренировки
                      </label>
                      <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, hasLessonPlan: true })}
                          className={`px-2.5 py-1 rounded-md transition ${
                            editForm.hasLessonPlan
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Есть конспект
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, hasLessonPlan: false })}
                          className={`px-2.5 py-1 rounded-md transition ${
                            !editForm.hasLessonPlan
                              ? "bg-rose-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Нет конспекта
                        </button>
                      </div>
                    </div>

                    {editForm.hasLessonPlan ? (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Текст или план упражнений
                          </label>
                          <textarea
                            rows={3}
                            value={editForm.lessonPlanText || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, lessonPlanText: e.target.value })
                            }
                            placeholder="Опишите план, упражнения или задачи тренировки..."
                            className="w-full text-xs font-medium p-2.5 border rounded-xl outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Фотография конспекта
                          </label>
                          {editForm.lessonPlanPhotoUrl ? (
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-16 rounded-xl overflow-hidden border">
                                <img
                                  src={editForm.lessonPlanPhotoUrl}
                                  alt="Конспект"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition">
                                  Заменить фото
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        compressImage(file, (base64) => {
                                          setEditForm((prev) =>
                                            prev ? { ...prev, lessonPlanPhotoUrl: base64 } : null
                                          );
                                        });
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditForm({ ...editForm, lessonPlanPhotoUrl: "" })
                                  }
                                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition font-semibold"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed rounded-xl cursor-pointer hover:bg-white transition text-xs font-bold text-slate-600 bg-slate-100/50">
                              <Upload className="w-4 h-4 text-slate-400" />
                              <span>Прикрепить фото конспекта</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    compressImage(file, (base64) => {
                                      setEditForm((prev) =>
                                        prev ? { ...prev, lessonPlanPhotoUrl: base64 } : null
                                      );
                                    });
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-600 font-medium">
                        Установлена отметка «Нет конспекта». Директор увидит статус отсутствия плана.
                      </p>
                    )}
                  </div>

                  {/* Ручной ввод присутствующих: 2 графы (с оплатой и без оплаты) + автоподсчёт итого */}
                  <div className="p-3.5 bg-slate-900 rounded-2xl text-white space-y-2.5 border border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          Количество присутствующих учеников (ручной ввод)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          2 графы: с оплатой и без оплаты. Итого рассчитывается автоматически.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          let paid = 0;
                          let unpaid = 0;
                          (editForm.records || []).forEach((r) => {
                            if (r.status === "present") {
                              const cl = clients.find((c) => c.id === r.clientId);
                              if (cl?.abonement && cl.abonement !== "none" && (cl.abonementSessionsLeft || 0) > 0) {
                                paid++;
                              } else {
                                unpaid++;
                              }
                            } else if (r.status === "trial_free") {
                              unpaid++;
                            }
                          });
                          setEditForm({
                            ...editForm,
                            presentPaidCount: paid,
                            presentUnpaidCount: unpaid,
                            presentCount: paid + unpaid,
                          });
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1 shrink-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                        По списку
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch">
                      {/* Графа 1: С оплатой */}
                      <div className="bg-white/10 rounded-xl p-2.5 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-emerald-300 mb-1">
                          1. С оплатой
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Math.max(0, Number(editForm.presentPaidCount) || 0);
                              const unpaid = Math.max(0, Number(editForm.presentUnpaidCount) || 0);
                              const nextVal = Math.max(0, cur - 1);
                              setEditForm({
                                ...editForm,
                                presentPaidCount: nextVal,
                                presentCount: nextVal + unpaid,
                              });
                            }}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition shrink-0"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={editForm.presentPaidCount ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              const unpaid = Math.max(0, Number(editForm.presentUnpaidCount) || 0);
                              setEditForm({
                                ...editForm,
                                presentPaidCount: val,
                                presentCount: val + unpaid,
                              });
                            }}
                            className="w-full text-center font-black text-lg bg-black/40 border border-emerald-500/40 rounded-lg py-1 text-emerald-400 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Math.max(0, Number(editForm.presentPaidCount) || 0);
                              const unpaid = Math.max(0, Number(editForm.presentUnpaidCount) || 0);
                              const nextVal = cur + 1;
                              setEditForm({
                                ...editForm,
                                presentPaidCount: nextVal,
                                presentCount: nextVal + unpaid,
                              });
                            }}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Графа 2: Без оплаты */}
                      <div className="bg-white/10 rounded-xl p-2.5 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-amber-300 mb-1">
                          2. Без оплаты
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const paid = Math.max(0, Number(editForm.presentPaidCount) || 0);
                              const cur = Math.max(0, Number(editForm.presentUnpaidCount) || 0);
                              const nextVal = Math.max(0, cur - 1);
                              setEditForm({
                                ...editForm,
                                presentUnpaidCount: nextVal,
                                presentCount: paid + nextVal,
                              });
                            }}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition shrink-0"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={editForm.presentUnpaidCount ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              const paid = Math.max(0, Number(editForm.presentPaidCount) || 0);
                              setEditForm({
                                ...editForm,
                                presentUnpaidCount: val,
                                presentCount: paid + val,
                              });
                            }}
                            className="w-full text-center font-black text-lg bg-black/40 border border-amber-500/40 rounded-lg py-1 text-amber-400 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const paid = Math.max(0, Number(editForm.presentPaidCount) || 0);
                              const cur = Math.max(0, Number(editForm.presentUnpaidCount) || 0);
                              const nextVal = cur + 1;
                              setEditForm({
                                ...editForm,
                                presentUnpaidCount: nextVal,
                                presentCount: paid + nextVal,
                              });
                            }}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Итого */}
                      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex flex-col justify-between text-center">
                        <span className="text-[10px] font-bold text-emerald-300 uppercase">
                          Итого человек
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 my-0.5">
                          {(Number(editForm.presentPaidCount) || 0) + (Number(editForm.presentUnpaidCount) || 0)}
                          <span className="text-xs font-semibold text-emerald-300 ml-1">чел.</span>
                        </div>
                        <div className="text-[9px] text-emerald-200/80">
                          {Number(editForm.presentPaidCount) || 0} опл. + {Number(editForm.presentUnpaidCount) || 0} б/о
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      Посещаемость игроков в ведомости
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {(editForm.records || []).map((rec) => (
                        <div
                          key={rec.clientId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50 border rounded-xl gap-2 text-xs"
                        >
                          <span className="font-bold text-slate-900">
                            {rec.clientName || rec.clientId}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "present")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "present"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50"
                              }`}
                            >
                              + Был
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "absent_sick")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "absent_sick"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50"
                              }`}
                            >
                              Б Болел
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "absent")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "absent"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50"
                              }`}
                            >
                              - Пропуск
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "trial_free")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "trial_free"
                                  ? "bg-fuchsia-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-fuchsia-50"
                              }`}
                            >
                              П Пробная
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? "Сохранение..." : "Сохранить изменения"}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-scale-in space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Удаление ведомости
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Вы действительно хотите безвозвратно удалить заполненную ведомость по этой
              тренировке из истории и базы данных?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteSession(confirmDeleteId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                Удалить ведомость
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Smart Trainer Cancel Modal */}
      <TrainerCancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        defaultCoachName={targetCoach?.name || myCoach?.name || ""}
        initialMode={cancelModalMode}
        coachGroups={isPrivileged && selectedCoachId === "all" ? groups : (targetCoach ? groups.filter(g => g.coachId === targetCoach.id) : groups)}
        coachName={targetCoach?.name || myCoach?.name || ""}
        coachId={targetCoach?.id || myCoach?.id || ""}
      />

      {/* Confirmation Delete Cancellation Dialog */}
      {confirmDeleteCancelId && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-scale-in space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Удаление фиксации отмены
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Вы уверены, что хотите отменить эту запись? Если тренировка на самом деле состоялась, вы сможете заполнить по ней обычный табель.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteCancelId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmDeleteCancelId) {
                    await deleteCancelledSession(confirmDeleteCancelId);
                    setConfirmDeleteCancelId(null);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                Удалить отмену
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
