import React, { useState, useEffect } from "react";
import {
  Clock,
  Bookmark,
  Check,
  Trash2,
  Calendar,
  RotateCcw,
  Copy,
  X,
} from "lucide-react";
import {
  loadSavedScheduleTemplates,
  saveCustomScheduleTemplate,
  deleteCustomScheduleTemplate,
  ScheduleTemplate,
} from "./groupTemplates";
import { parseScheduleString } from "../../utils/scheduleParser";

interface ScheduleTimePickerProps {
  value: string; // e.g. "Пн 19:00 - 20:00, Ср 19:00 - 20:00, Пт 17:00 - 18:00"
  onChange: (newSchedule: string) => void;
  accentColor?: string;
}

interface DayTimeSlot {
  start: string;
  end: string;
  location?: string;
}

const WEEKDAYS = [
  { id: "Пн", label: "Понедельник", short: "Пн" },
  { id: "Вт", label: "Вторник", short: "Вт" },
  { id: "Ср", label: "Среда", short: "Ср" },
  { id: "Чт", label: "Четверг", short: "Чт" },
  { id: "Пт", label: "Пятница", short: "Пт" },
  { id: "Сб", label: "Суббота", short: "Сб" },
  { id: "Вс", label: "Воскресенье", short: "Вс" },
];

const POPULAR_TIME_SLOTS = [
  { start: "16:00", end: "17:00", label: "16:00 - 17:00" },
  { start: "17:00", end: "18:00", label: "17:00 - 18:00" },
  { start: "18:00", end: "19:00", label: "18:00 - 19:00" },
  { start: "18:30", end: "19:30", label: "18:30 - 19:30" },
  { start: "19:00", end: "20:00", label: "19:00 - 20:00" },
  { start: "19:30", end: "20:30", label: "19:30 - 20:30" },
  { start: "10:00", end: "11:30", label: "10:00 - 11:30" },
  { start: "11:30", end: "13:00", label: "11:30 - 13:00" },
];

function padHHMM(h: number, m: number): string {
  const clampedH = Math.max(0, Math.min(23, h));
  const clampedM = Math.max(0, Math.min(59, m));
  return `${String(clampedH).padStart(2, "0")}:${String(clampedM).padStart(2, "0")}`;
}

function toMinutes(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 18 * 60;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function fromMinutes(totalMins: number): string {
  const safe = Math.max(0, Math.min(23 * 60 + 59, totalMins));
  return padHHMM(Math.floor(safe / 60), safe % 60);
}

function parseSlotTimes(
  timeStr: string,
  fallbackStart: string,
  fallbackEnd: string,
): { start: string; end: string } {
  const clean = (timeStr || "").trim().replace(/\./g, ":");
  const rangeMatch = clean.match(
    /^(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?$/,
  );
  if (rangeMatch) {
    const sh = parseInt(rangeMatch[1], 10);
    const sm = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const eh = parseInt(rangeMatch[3], 10);
    const em = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
    return { start: padHHMM(sh, sm), end: padHHMM(eh, em) };
  }
  const singleMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (singleMatch) {
    const sh = parseInt(singleMatch[1], 10);
    const sm = singleMatch[2] ? parseInt(singleMatch[2], 10) : 0;
    const start = padHHMM(sh, sm);
    const end = fromMinutes(sh * 60 + sm + 60);
    return { start, end };
  }
  return { start: fallbackStart, end: fallbackEnd };
}

export const ScheduleTimePicker: React.FC<ScheduleTimePickerProps> = ({
  value,
  onChange,
}) => {
  const [defaultStart, setDefaultStart] = useState("18:00");
  const [defaultEnd, setDefaultEnd] = useState("19:00");
  const [savedTemplates, setSavedTemplates] = useState<ScheduleTemplate[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Parse current value into a day -> { start, end, location } map
  const parseScheduleMap = (rawStr: string): Record<string, DayTimeSlot> => {
    if (!rawStr) return {};
    const map: Record<string, DayTimeSlot> = {};
    const parsed = parseScheduleString(rawStr);
    parsed.forEach((slot) => {
      const { start, end } = parseSlotTimes(
        slot.time,
        defaultStart,
        defaultEnd,
      );
      map[slot.day] = {
        start,
        end,
        location: slot.location,
      };
    });
    return map;
  };

  const scheduleMap = parseScheduleMap(value);
  const activeDays = WEEKDAYS.filter((w) => Boolean(scheduleMap[w.id])).map(
    (w) => w.id,
  );

  // Check if all active days share the exact same time interval
  const allSameTime =
    activeDays.length > 0 &&
    activeDays.every(
      (d) =>
        scheduleMap[d].start === scheduleMap[activeDays[0]].start &&
        scheduleMap[d].end === scheduleMap[activeDays[0]].end,
    );

  useEffect(() => {
    setSavedTemplates(loadSavedScheduleTemplates());
  }, []);

  const emitNewSchedule = (newMap: Record<string, DayTimeSlot>) => {
    const orderedParts: string[] = [];
    WEEKDAYS.forEach((w) => {
      const slot = newMap[w.id];
      if (slot) {
        const timeRange = `${slot.start} - ${slot.end}`;
        orderedParts.push(
          slot.location
            ? `${slot.location}: ${w.id} ${timeRange}`
            : `${w.id} ${timeRange}`,
        );
      }
    });
    onChange(orderedParts.join(", "));
  };

  const toggleDay = (dayId: string) => {
    const nextMap = { ...scheduleMap };
    if (nextMap[dayId]) {
      delete nextMap[dayId];
    } else {
      // Inherit time from the first active day if one exists, otherwise defaultStart/defaultEnd
      const refSlot = activeDays.length > 0 ? scheduleMap[activeDays[0]] : null;
      nextMap[dayId] = {
        start: refSlot ? refSlot.start : defaultStart,
        end: refSlot ? refSlot.end : defaultEnd,
      };
    }
    emitNewSchedule(nextMap);
  };

  const updateDayStart = (dayId: string, newStart: string) => {
    if (!newStart) return;
    const current = scheduleMap[dayId];
    if (!current) return;
    // Preserve previous duration (default 60 min) when shifting start time
    const prevDuration = Math.max(
      30,
      toMinutes(current.end) - toMinutes(current.start),
    );
    const nextEnd = fromMinutes(toMinutes(newStart) + prevDuration);
    const nextMap = {
      ...scheduleMap,
      [dayId]: { ...current, start: newStart, end: nextEnd },
    };
    emitNewSchedule(nextMap);
  };

  const updateDayEnd = (dayId: string, newEnd: string) => {
    if (!newEnd) return;
    const current = scheduleMap[dayId];
    if (!current) return;
    const nextMap = {
      ...scheduleMap,
      [dayId]: { ...current, end: newEnd },
    };
    emitNewSchedule(nextMap);
  };

  const updateDayRange = (dayId: string, start: string, end: string) => {
    const current = scheduleMap[dayId];
    const nextMap = {
      ...scheduleMap,
      [dayId]: {
        start,
        end,
        location: current?.location,
      },
    };
    emitNewSchedule(nextMap);
  };

  const applyTimeToAllActiveDays = (start: string, end: string) => {
    setDefaultStart(start);
    setDefaultEnd(end);
    if (activeDays.length === 0) {
      emitNewSchedule({
        Пн: { start, end },
        Ср: { start, end },
      });
      return;
    }
    const nextMap: Record<string, DayTimeSlot> = {};
    activeDays.forEach((d) => {
      nextMap[d] = {
        start,
        end,
        location: scheduleMap[d]?.location,
      };
    });
    emitNewSchedule(nextMap);
  };

  const handleApplyTemplate = (tmpl: ScheduleTemplate) => {
    onChange(tmpl.rawSchedule);
    const parsed = parseScheduleString(tmpl.rawSchedule);
    if (parsed.length > 0) {
      const { start, end } = parseSlotTimes(parsed[0].time, "18:00", "19:00");
      setDefaultStart(start);
      setDefaultEnd(end);
    }
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!value.trim()) {
      setSaveErrorMsg("Сначала выберите дни и время тренировок");
      setTimeout(() => setSaveErrorMsg(null), 3000);
      return;
    }
    const label = customTemplateName.trim() || value;
    const updated = saveCustomScheduleTemplate(value, label);
    setSavedTemplates(updated);
    setCustomTemplateName("");
    setShowSaveForm(false);
    setSaveErrorMsg(null);
    setSaveSuccessMsg("График сохранен в шаблоны!");
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomScheduleTemplate(id);
    setSavedTemplates(updated);
  };

  return (
    <div className="space-y-3 bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
      {/* 1. SCHEDULE TEMPLATES HEADER & CAROUSEL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-red-600" />
            <span>Шаблоны расписания и времени</span>
          </label>
          <div className="flex items-center gap-2">
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[10px] text-slate-400 hover:text-red-500 transition cursor-pointer flex items-center gap-1"
                title="Очистить расписание"
              >
                <RotateCcw className="w-3 h-3" /> Очистить
              </button>
            )}
          </div>
        </div>

        {/* Templates Pills */}
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {savedTemplates.map((tmpl) => {
            const isSelected = value.trim() === tmpl.rawSchedule.trim();
            return (
              <div
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl)}
                className={`group text-[11px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-red-600 text-white border-red-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/30"
                }`}
              >
                <span className="truncate max-w-[240px]">{tmpl.label}</span>
                {tmpl.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-300 transition text-slate-400"
                    title="Удалить сохраненный шаблон"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DAYS OF WEEK TOGGLES */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700">
            Дни недели (нажмите, чтобы включить или убрать день):
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => {
            const daySlot = scheduleMap[w.id];
            const isSelected = Boolean(daySlot);
            return (
              <button
                type="button"
                key={w.id}
                onClick={() => toggleDay(w.id)}
                className={`py-2 px-0.5 rounded-xl text-xs font-black transition flex flex-col items-center justify-center cursor-pointer border ${
                  isSelected
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-red-200 hover:bg-red-50/40"
                }`}
              >
                <span>{w.short}</span>
                {isSelected && daySlot ? (
                  <span className="text-[9px] font-mono font-bold text-red-100 mt-0.5 leading-none">
                    {daySlot.start}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-300 mt-0.5 leading-none">
                    —
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. INDIVIDUAL PER-DAY TIME CONFIGURATION */}
      {activeDays.length > 0 && (
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-800 text-[11px]">
              Время по каждому дню (можно задать разное):
            </span>
            {!allSameTime && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Индивидуальный график
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {activeDays.map((dayId) => {
              const dayInfo = WEEKDAYS.find((w) => w.id === dayId);
              const slot = scheduleMap[dayId];
              if (!slot) return null;

              const currentPresetKey = `${slot.start}|${slot.end}`;
              const matchesPreset = POPULAR_TIME_SLOTS.some(
                (p) => `${p.start}|${p.end}` === currentPresetKey,
              );

              return (
                <div
                  key={dayId}
                  className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  {/* Day badge */}
                  <div className="flex items-center gap-2 min-w-[105px]">
                    <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {dayId}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {dayInfo?.label}
                    </span>
                  </div>

                  {/* Start - End time pickers */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateDayStart(dayId, e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500"
                      title={`Начало тренировки (${dayInfo?.label})`}
                    />
                    <span className="text-slate-400 text-xs font-bold">—</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateDayEnd(dayId, e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500"
                      title={`Окончание тренировки (${dayInfo?.label})`}
                    />
                  </div>

                  {/* Quick slot selector + actions */}
                  <div className="flex items-center gap-1 ml-auto">
                    <select
                      value={matchesPreset ? currentPresetKey : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const [s, en] = val.split("|");
                        updateDayRange(dayId, s, en);
                      }}
                      className="px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-600 focus:outline-none focus:border-red-500 cursor-pointer"
                      title="Быстро выбрать интервал для этого дня"
                    >
                      <option value="">Слот...</option>
                      {POPULAR_TIME_SLOTS.map((p) => (
                        <option key={p.label} value={`${p.start}|${p.end}`}>
                          {p.label}
                        </option>
                      ))}
                    </select>

                    {activeDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          applyTimeToAllActiveDays(slot.start, slot.end)
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
                        title={`Применить ${slot.start} - ${slot.end} ко всем выбранным дням`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleDay(dayId)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title={`Убрать ${dayInfo?.label}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. QUICK BULK TIME PRESETS (APPLY SAME TIME TO ALL DAYS) */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 text-[11px]">
            Быстро задать одинаковое время для всех дней:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {POPULAR_TIME_SLOTS.map((slot) => {
            const isMatch =
              allSameTime &&
              activeDays.length > 0 &&
              scheduleMap[activeDays[0]].start === slot.start &&
              scheduleMap[activeDays[0]].end === slot.end;
            return (
              <button
                type="button"
                key={slot.label}
                onClick={() => applyTimeToAllActiveDays(slot.start, slot.end)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition text-center cursor-pointer border ${
                  isMatch
                    ? "bg-red-50 text-red-700 border-red-300 font-black shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. CURRENT SCHEDULE PREVIEW & SAVE BUTTON */}
      {value ? (
        <div className="bg-red-50/60 border border-red-100 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-red-600 font-bold block">
                Итоговое расписание группы:
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono break-words">
                {value}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!showSaveForm ? (
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Сохранить этот график в шаблоны для быстрого использования"
              >
                <Bookmark className="w-3 h-3" /> Сохранить в шаблоны
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-red-200 shadow-xs">
                <input
                  type="text"
                  placeholder="Название шаблона..."
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                  className="px-2 py-0.5 text-xs border rounded font-sans focus:outline-none focus:border-red-500 w-36"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentAsTemplate}
                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition text-[10px] font-bold"
                  title="Подтвердить сохранение"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition text-[10px]"
                  title="Отмена"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-2 text-[11px] text-slate-400 italic">
          Выберите дни недели выше или нажмите готовый шаблон расписания.
        </div>
      )}

      {saveErrorMsg && (
        <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
          {saveErrorMsg}
        </div>
      )}

      {saveSuccessMsg && (
        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
