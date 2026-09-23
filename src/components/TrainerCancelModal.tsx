import React, { useState, useMemo, useEffect } from "react";
import {
  Ban,
  X,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
  CalendarRange,
  Info,
  Building2,
  User,
  ArrowRight,
  Check,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { TrainingGroup, CancellationReason, CancelledSession } from "../types";
import { formatGroupNameDisplay } from "../utils/formatters";
import {
  isGroupMatch,
  isDateMatch,
  isSessionOverdue,
  normalizeDateToYMD,
  getLocalTodayYMD,
} from "../utils/sessionMatching";

interface TrainerCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGroup?: string;
  defaultDate?: string;
  defaultCoachName?: string;
  initialMode?: "single" | "batch" | "unreported";
  coachGroups?: TrainingGroup[];
  coachName?: string;
  coachId?: string;
  onSuccess?: (count: number) => void;
  onFillAttendance?: (groupId: string, dateStr: string) => void;
}

const REASONS_LIST: { label: CancellationReason; icon: string }[] = [
  { label: "Занятость зала", icon: "🏫" },
  { label: "Болезнь тренера", icon: "🤒" },
  { label: "Соревнования / турнир", icon: "🏆" },
  { label: "Праздничный день", icon: "🎉" },
  { label: "Погодные условия", icon: "❄️" },
  { label: "Карантин / санитарный день", icon: "⚠️" },
  { label: "Мало участников", icon: "👥" },
  { label: "Другое", icon: "📝" },
];

const DAY_NAMES_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export const TrainerCancelModal: React.FC<TrainerCancelModalProps> = ({
  isOpen,
  onClose,
  defaultGroup = "",
  defaultDate,
  defaultCoachName = "",
  initialMode = "single",
  coachGroups,
  coachName,
  coachId,
  onSuccess,
  onFillAttendance,
}) => {
  const {
    groups,
    trainingSessions,
    cancelledSessions,
    addCancelledSession,
    addCancelledSessionsBatch,
  } = useCRM();

  // Determine available groups
  const availableGroups = useMemo(() => {
    if (coachGroups && coachGroups.length > 0) return coachGroups;
    if (coachName) {
      const filtered = groups.filter(
        (g) =>
          g.coachName?.toLowerCase().includes(coachName.toLowerCase()) ||
          (coachId && g.coachId === coachId)
      );
      if (filtered.length > 0) return filtered;
    }
    return groups;
  }, [coachGroups, coachName, coachId, groups]);

  // Tab mode
  const [mode, setMode] = useState<"single" | "batch" | "unreported">(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Single mode state
  const [singleGroup, setSingleGroup] = useState<string>("");
  const [singleDate, setSingleDate] = useState<string>("");
  const [singleReason, setSingleReason] = useState<CancellationReason>("Занятость зала");
  const [singleNotes, setSingleNotes] = useState<string>("");
  const [singleHasReschedule, setSingleHasReschedule] = useState<boolean>(false);
  const [singleRescheduleDate, setSingleRescheduleDate] = useState<string>("");

  // Initialize single mode fields on open or prop change
  useEffect(() => {
    if (isOpen) {
      if (defaultGroup) {
        setSingleGroup(defaultGroup);
      } else if (availableGroups.length > 0) {
        setSingleGroup(availableGroups[0].name);
      }
      if (defaultDate) {
        setSingleDate(defaultDate);
      } else {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        setSingleDate(`${y}-${m}-${d}`);
      }
      setSingleReason("Занятость зала");
      setSingleNotes("");
      setSingleHasReschedule(false);
      setSingleRescheduleDate("");
    }
  }, [isOpen, defaultGroup, defaultDate, availableGroups]);

  // Batch mode state
  const todayStr = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const [batchStartDate, setBatchStartDate] = useState<string>(todayStr);
  const [batchEndDate, setBatchEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [selectedBatchGroupIds, setSelectedBatchGroupIds] = useState<string[]>([]);
  const [batchReason, setBatchReason] = useState<CancellationReason>("Занятость зала");
  const [batchNotes, setBatchNotes] = useState<string>("");
  const [batchHasReschedule, setBatchHasReschedule] = useState<boolean>(false);
  const [batchRescheduleNote, setBatchRescheduleNote] = useState<string>("");

  // Select all groups by default when modal opens
  useEffect(() => {
    if (isOpen && availableGroups.length > 0) {
      setSelectedBatchGroupIds(availableGroups.map((g) => g.id));
    }
  }, [isOpen, availableGroups]);

  // Preset buttons handler
  const handleApplyPreset = (type: "today" | "next3" | "thisWeek" | "nextWeek") => {
    const now = new Date();
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    if (type === "today") {
      setBatchStartDate(formatDate(now));
      setBatchEndDate(formatDate(now));
    } else if (type === "next3") {
      setBatchStartDate(formatDate(now));
      const end = new Date(now);
      end.setDate(end.getDate() + 2);
      setBatchEndDate(formatDate(end));
    } else if (type === "thisWeek") {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(monday.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      setBatchStartDate(formatDate(monday));
      setBatchEndDate(formatDate(sunday));
    } else if (type === "nextWeek") {
      const day = now.getDay();
      const diffToNextMonday = day === 0 ? 1 : 8 - day;
      const nextMon = new Date(now);
      nextMon.setDate(nextMon.getDate() + diffToNextMonday);
      const nextSun = new Date(nextMon);
      nextSun.setDate(nextSun.getDate() + 6);
      setBatchStartDate(formatDate(nextMon));
      setBatchEndDate(formatDate(nextSun));
    }
  };

  // Calculate matching sessions for batch mode based on groups' schedules
  interface CalculatedSession {
    key: string;
    groupId: string;
    groupName: string;
    coachName: string;
    date: string;
    dayName: string;
    slot: string;
    selected: boolean;
  }

  const [selectedCalculatedKeys, setSelectedCalculatedKeys] = useState<Set<string>>(new Set());

  const calculatedBatchSessions = useMemo(() => {
    if (!batchStartDate || !batchEndDate) return [];
    const start = new Date(batchStartDate);
    const end = new Date(batchEndDate);
    if (start > end) return [];

    const result: CalculatedSession[] = [];
    const targetGroups = availableGroups.filter((g) =>
      selectedBatchGroupIds.includes(g.id)
    );

    // Limit search to 31 days max to prevent infinite loops
    const maxDays = 31;
    let curr = new Date(start);
    let count = 0;

    while (curr <= end && count < maxDays) {
      count++;
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const d = String(curr.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const ruDateStr = `${d}.${m}.${y}`;
      const dayOfWeek = DAY_NAMES_RU[curr.getDay()];

      targetGroups.forEach((g) => {
        // Respect schedule boundary dates
        if (g.scheduleStartDate && dateStr < g.scheduleStartDate) return;
        if (g.scheduleEndDate && dateStr > g.scheduleEndDate) return;

        const slot = (g.scheduleDays || []).find((s) => s.startsWith(dayOfWeek));
        if (!slot) return;

        // Skip if already has report in trainingSessions
        const hasReport = trainingSessions.some((ts) => {
          const groupMatch =
            (ts.groupId && ts.groupId === g.id) ||
            (ts.groupName && ts.groupName.trim().toLowerCase() === g.name.trim().toLowerCase());
          if (!groupMatch) return false;
          const tsIso = ts.date ? ts.date.substring(0, 10) : "";
          return (
            tsIso === dateStr ||
            (ts.date && ts.date.startsWith(dateStr)) ||
            (ts.dateString && (ts.dateString === ruDateStr || ts.dateString.includes(ruDateStr)))
          );
        });
        if (hasReport) return;

        // Skip if already recorded in cancelledSessions
        const alreadyCancelled = cancelledSessions.some((cs) => {
          const groupMatch =
            (cs.groupId && cs.groupId === g.id) ||
            (cs.groupName && cs.groupName.trim().toLowerCase() === g.name.trim().toLowerCase());
          if (!groupMatch) return false;
          return cs.date === dateStr || cs.date === ruDateStr || (cs.date && cs.date.startsWith(dateStr));
        });
        if (alreadyCancelled) return;

        const key = `${g.id}_${dateStr}`;
        result.push({
          key,
          groupId: g.id,
          groupName: g.name,
          coachName: g.coachName || coachName || "Тренер",
          date: dateStr,
          dayName: dayOfWeek,
          slot,
          selected: true,
        });
      });

      curr.setDate(curr.getDate() + 1);
    }

    return result;
  }, [
    batchStartDate,
    batchEndDate,
    availableGroups,
    selectedBatchGroupIds,
    trainingSessions,
    cancelledSessions,
    coachName,
  ]);

  // Sync selected keys when calculated sessions change
  useEffect(() => {
    setSelectedCalculatedKeys(new Set(calculatedBatchSessions.map((s) => s.key)));
  }, [calculatedBatchSessions]);

  // Calculate unreported past sessions for Tab 3 (last 14 days)
  // ONLY includes sessions that are overdue ("вовремя не заполнили")
  const unreportedPastSessions = useMemo(() => {
    const result: CalculatedSession[] = [];
    const checkDays = 14;

    for (let i = 0; i <= checkDays; i++) {
      const pDate = new Date();
      pDate.setDate(pDate.getDate() - i);
      const y = pDate.getFullYear();
      const m = String(pDate.getMonth() + 1).padStart(2, "0");
      const d = String(pDate.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const dayOfWeek = DAY_NAMES_RU[pDate.getDay()];

      availableGroups.forEach((g) => {
        if (g.scheduleStartDate && dateStr < g.scheduleStartDate) return;
        if (g.scheduleEndDate && dateStr > g.scheduleEndDate) return;

        const slot = (g.scheduleDays || []).find((s) => s.startsWith(dayOfWeek));
        if (!slot) return;

        // Check if report exists in trainingSessions
        const hasReport = trainingSessions.some((ts) => {
          return (
            isGroupMatch(ts.groupId, ts.groupName, g.id, g.name) &&
            isDateMatch(ts.date, ts.dateString, dateStr)
          );
        });
        if (hasReport) return;

        // Check if session was cancelled
        const alreadyCancelled = cancelledSessions.some((cs) => {
          return (
            isGroupMatch(cs.groupId, cs.groupName, g.id, g.name) &&
            isDateMatch(cs.date, undefined, dateStr)
          );
        });
        if (alreadyCancelled) return;

        // Check if session is overdue ("вовремя не заполнили").
        // On today, if session has not finished yet, do NOT flag it as unsubmitted/cancelled!
        const isOverdue = isSessionOverdue(dateStr, slot);
        if (!isOverdue) return;

        const key = `unrep_${g.id}_${dateStr}`;
        result.push({
          key,
          groupId: g.id,
          groupName: g.name,
          coachName: g.coachName || coachName || "Тренер",
          date: dateStr,
          dayName: dayOfWeek,
          slot,
          selected: true,
        });
      });
    }

    return result;
  }, [availableGroups, trainingSessions, cancelledSessions, coachName]);

  const [selectedUnreportedKeys, setSelectedUnreportedKeys] = useState<Set<string>>(new Set());
  const [unreportedReason, setUnreportedReason] = useState<CancellationReason>("Занятость зала");
  const [unreportedNotes, setUnreportedNotes] = useState<string>("");

  useEffect(() => {
    setSelectedUnreportedKeys(new Set(unreportedPastSessions.map((s) => s.key)));
  }, [unreportedPastSessions]);

  // Submission handling
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleGroup || !singleDate || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const selectedGroupObj = availableGroups.find((g) => g.name === singleGroup);
      const coach = selectedGroupObj?.coachName || defaultCoachName || coachName || "Тренер";

      let finalNotes = singleNotes.trim();
      if (singleHasReschedule && singleRescheduleDate) {
        finalNotes = finalNotes
          ? `${finalNotes} (Перенос на: ${singleRescheduleDate})`
          : `Перенос на: ${singleRescheduleDate}`;
      }

      await addCancelledSession({
        groupId: selectedGroupObj?.id,
        groupName: singleGroup,
        date: singleDate,
        reason: singleReason,
        notes: finalNotes,
        coachName: coach,
        coachId: selectedGroupObj?.coachId || coachId,
        rescheduleDate: singleHasReschedule ? singleRescheduleDate : undefined,
        isRescheduled: singleHasReschedule,
      });

      onSuccess?.(1);
      onClose();
    } catch (err) {
      console.error("Error submitting single cancellation:", err);
      alert("Не удалось зафиксировать отмену. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch submit
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const sessionsToCancel = calculatedBatchSessions.filter((s) =>
      selectedCalculatedKeys.has(s.key)
    );

    if (sessionsToCancel.length === 0) {
      alert("Не выбрано ни одной тренировки для отмены.");
      return;
    }

    setIsSubmitting(true);
    try {
      const batchId = `batch_${Date.now()}`;
      let finalNotes = batchNotes.trim();
      if (batchHasReschedule && batchRescheduleNote) {
        finalNotes = finalNotes
          ? `${finalNotes} (Отработка: ${batchRescheduleNote})`
          : `Отработка: ${batchRescheduleNote}`;
      }

      const payload: Omit<CancelledSession, "id">[] = sessionsToCancel.map((s) => ({
        groupId: s.groupId,
        groupName: s.groupName,
        date: s.date,
        reason: batchReason,
        notes: finalNotes,
        coachName: s.coachName,
        coachId,
        batchId,
        isRescheduled: batchHasReschedule,
        rescheduleDate: batchHasReschedule ? batchRescheduleNote : undefined,
      }));

      const count = await addCancelledSessionsBatch(payload);
      onSuccess?.(count);
      onClose();
    } catch (err) {
      console.error("Error submitting batch cancellations:", err);
      alert("Ошибка при сохранении пакета отмен. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unreported past submit
  const handleUnreportedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const sessionsToCancel = unreportedPastSessions.filter((s) =>
      selectedUnreportedKeys.has(s.key)
    );

    if (sessionsToCancel.length === 0) {
      alert("Не выбрано ни одной тренировки.");
      return;
    }

    setIsSubmitting(true);
    try {
      const batchId = `unrep_batch_${Date.now()}`;
      const payload: Omit<CancelledSession, "id">[] = sessionsToCancel.map((s) => ({
        groupId: s.groupId,
        groupName: s.groupName,
        date: s.date,
        reason: unreportedReason,
        notes: unreportedNotes.trim(),
        coachName: s.coachName,
        coachId,
        batchId,
      }));

      const count = await addCancelledSessionsBatch(payload);
      onSuccess?.(count);
      onClose();
    } catch (err) {
      console.error("Error submitting past cancellations:", err);
      alert("Ошибка при фиксации пропущенных тренировок.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-amber-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Отчёт о несостоявшейся тренировке
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Фиксация отмены одного занятия или целого периода
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/60 border-b border-slate-200/70 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              mode === "single"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Одно занятие</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              mode === "batch"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Несколько занятий / Период</span>
          </button>

          {unreportedPastSessions.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("unreported")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mode === "unreported"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Пропущенные без отчёта ({unreportedPastSessions.length})</span>
            </button>
          )}
        </div>

        {/* Body content based on tab */}
        <div className="p-6 text-left">
          {/* ===================== MODE 1: SINGLE SESSION ===================== */}
          {mode === "single" && (
            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Группа <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={singleGroup}
                    onChange={(e) => setSingleGroup(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {formatGroupNameDisplay(g.name)} ({g.playersCount} чел.)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Дата отмененной тренировки <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Причина отмены <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REASONS_LIST.map((r) => {
                    const isSelected = singleReason === r.label;
                    return (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setSingleReason(r.label)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/80 text-rose-900 font-bold shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <span className="text-sm">{r.icon}</span>
                        <span className="text-[11px] leading-snug truncate">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reschedule option */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={singleHasReschedule}
                    onChange={(e) => setSingleHasReschedule(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Будет проведена отработка / перенос занятия</span>
                </label>

                {singleHasReschedule && (
                  <div className="pt-2 pl-6">
                    <label className="block text-slate-600 font-medium mb-1">
                      Дата и время отработки (переноса):
                    </label>
                    <input
                      type="text"
                      value={singleRescheduleDate}
                      onChange={(e) => setSingleRescheduleDate(e.target.value)}
                      placeholder="Например: Суббота 26.09 в 12:00 или Суббота (зал 2)"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Подробный комментарий для руководства и родителей
                </label>
                <textarea
                  value={singleNotes}
                  onChange={(e) => setSingleNotes(e.target.value)}
                  placeholder="Например: Зал закрыт в связи с ремонтом освещения. Родители предупреждены в чате."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Сохранение отчёта...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Зафиксировать отмену</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===================== MODE 2: BATCH / PERIOD SESSIONS ===================== */}
          {mode === "batch" && (
            <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs">
              <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-rose-900 leading-relaxed">
                  <strong>Умная отмена на период:</strong> выберите даты закрытия зала, болезни или соревнований. Ситуация рассчитает все попадающие по расписанию тренировки ваших групп и зафиксирует отмену в один клик.
                </div>
              </div>

              {/* Date range with presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold">
                    Период отмены тренировок <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("today")}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                    >
                      Сегодня
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("next3")}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                    >
                      3 дня
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("thisWeek")}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                    >
                      Эта неделя
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("nextWeek")}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                    >
                      След. неделя
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium mb-1 block">Начало периода:</span>
                    <input
                      type="date"
                      value={batchStartDate}
                      onChange={(e) => setBatchStartDate(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium mb-1 block">Окончание периода:</span>
                    <input
                      type="date"
                      value={batchEndDate}
                      onChange={(e) => setBatchEndDate(e.target.value)}
                      required
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Groups selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold">
                    Какие группы отменяются:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedBatchGroupIds.length === availableGroups.length) {
                        setSelectedBatchGroupIds([]);
                      } else {
                        setSelectedBatchGroupIds(availableGroups.map((g) => g.id));
                      }
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-bold"
                  >
                    {selectedBatchGroupIds.length === availableGroups.length
                      ? "Снять все"
                      : "Выбрать все группы"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {availableGroups.map((g) => {
                    const isChecked = selectedBatchGroupIds.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-rose-100 border-rose-300 text-rose-900"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBatchGroupIds((prev) => [...prev, g.id]);
                            } else {
                              setSelectedBatchGroupIds((prev) => prev.filter((id) => id !== g.id));
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                        />
                        <span>{formatGroupNameDisplay(g.name)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Calculated Sessions Scanner Preview */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <CalendarRange className="w-4 h-4 text-rose-600" />
                    <span>
                      Тренировки по расписанию в этот период ({calculatedBatchSessions.length}):
                    </span>
                  </div>
                  {calculatedBatchSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCalculatedKeys.size === calculatedBatchSessions.length) {
                          setSelectedCalculatedKeys(new Set());
                        } else {
                          setSelectedCalculatedKeys(
                            new Set(calculatedBatchSessions.map((s) => s.key))
                          );
                        }
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      {selectedCalculatedKeys.size === calculatedBatchSessions.length
                        ? "Снять выбор"
                        : "Выбрать все"}
                    </button>
                  )}
                </div>

                {calculatedBatchSessions.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 font-medium text-xs">
                    В указанный период для выбранных групп нет тренировок по расписанию (или они уже проведены / отменены).
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {calculatedBatchSessions.map((s) => {
                      const isChecked = selectedCalculatedKeys.has(s.key);
                      return (
                        <div
                          key={s.key}
                          onClick={() => {
                            setSelectedCalculatedKeys((prev) => {
                              const next = new Set(prev);
                              if (next.has(s.key)) next.delete(s.key);
                              else next.add(s.key);
                              return next;
                            });
                          }}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                            isChecked
                              ? "bg-rose-50/70 border-rose-200 text-slate-900"
                              : "bg-slate-50 border-slate-100 text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                            />
                            <div>
                              <div className="font-bold text-slate-800">
                                {formatGroupNameDisplay(s.groupName)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {s.date} ({s.slot})
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/70 text-rose-900">
                            К отмене
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Common Reason */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Причина отмены всех занятий <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REASONS_LIST.map((r) => {
                    const isSelected = batchReason === r.label;
                    return (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setBatchReason(r.label)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/80 text-rose-900 font-bold shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <span className="text-sm">{r.icon}</span>
                        <span className="text-[11px] leading-snug truncate">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reschedule option */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={batchHasReschedule}
                    onChange={(e) => setBatchHasReschedule(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Предусмотрен перенос / отработка для этих тренировок</span>
                </label>

                {batchHasReschedule && (
                  <div className="pt-2 pl-6">
                    <input
                      type="text"
                      value={batchRescheduleNote}
                      onChange={(e) => setBatchRescheduleNote(e.target.value)}
                      placeholder="Например: Перенос на субботу 12:00 или занятия продлены на 1 неделю"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Общий комментарий к пакетной отмене
                </label>
                <textarea
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Например: Школьный спортивный зал закрыт на период выборов с 18 по 21 сентября. Занятия перенесены."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedCalculatedKeys.size === 0}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Фиксация пакета...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Отменить {selectedCalculatedKeys.size} тренировок</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===================== MODE 3: UNREPORTED PAST SESSIONS ===================== */}
          {mode === "unreported" && (
            <form onSubmit={handleUnreportedSubmit} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <strong>Занятия без отчёта за последние 14 дней:</strong> если эти тренировки не состоялись, зафиксируйте отмену сразу для всех выбранных, чтобы они не числились как задолженность тренера.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-900">
                    Найдено занятий без табеля ({unreportedPastSessions.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUnreportedKeys.size === unreportedPastSessions.length) {
                        setSelectedUnreportedKeys(new Set());
                      } else {
                        setSelectedUnreportedKeys(
                          new Set(unreportedPastSessions.map((s) => s.key))
                        );
                      }
                    }}
                    className="text-[10px] text-amber-700 hover:underline font-bold"
                  >
                    {selectedUnreportedKeys.size === unreportedPastSessions.length
                      ? "Снять выбор"
                      : "Выбрать все"}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {unreportedPastSessions.map((s) => {
                    const isChecked = selectedUnreportedKeys.has(s.key);
                    return (
                      <div
                        key={s.key}
                        onClick={() => {
                          setSelectedUnreportedKeys((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.key)) next.delete(s.key);
                            else next.add(s.key);
                            return next;
                          });
                        }}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                          isChecked
                            ? "bg-amber-50 border-amber-300 text-slate-900"
                            : "bg-slate-50 border-slate-100 text-slate-400 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                          />
                          <div>
                            <div className="font-bold text-slate-800">
                              {formatGroupNameDisplay(s.groupName)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {s.date} ({s.slot})
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {onFillAttendance && (
                            <button
                              type="button"
                              onClick={() => onFillAttendance(s.groupId, s.date)}
                              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] rounded-md transition shadow-2xs flex items-center gap-1"
                              title="Если эта тренировка состоялась — нажмите, чтобы заполнить табель"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Заполнить табель</span>
                            </button>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                            {s.date < getLocalTodayYMD() ? "Не сдан табель" : "Время вышло"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Причина отмены <span className="text-amber-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REASONS_LIST.map((r) => {
                    const isSelected = unreportedReason === r.label;
                    return (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setUnreportedReason(r.label)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition ${
                          isSelected
                            ? "border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <span className="text-sm">{r.icon}</span>
                        <span className="text-[11px] leading-snug truncate">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Примечание к отмене
                </label>
                <textarea
                  value={unreportedNotes}
                  onChange={(e) => setUnreportedNotes(e.target.value)}
                  placeholder="Например: Тренировки не проводились из-за занятости зала / соревнований."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedUnreportedKeys.size === 0}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Списать {selectedUnreportedKeys.size} пропущенных</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
