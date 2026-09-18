import React, { useState, useEffect } from "react";
import {
  Clock,
  Bookmark,
  Check,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  loadSavedScheduleTemplates,
  saveCustomScheduleTemplate,
  deleteCustomScheduleTemplate,
  ScheduleTemplate,
} from "./groupTemplates";

interface ScheduleTimePickerProps {
  value: string; // e.g. "Пн 18:00 - 19:00, Ср 18:00 - 19:00"
  onChange: (newSchedule: string) => void;
  accentColor?: string;
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
  { start: "10:00", end: "11:30", label: "10:00 - 11:30 (утро)" },
  { start: "11:30", end: "13:00", label: "11:30 - 13:00 (утро)" },
];

export const ScheduleTimePicker: React.FC<ScheduleTimePickerProps> = ({
  value,
  onChange,
  accentColor = "red",
}) => {
  const [selectedTimeStart, setSelectedTimeStart] = useState("18:00");
  const [selectedTimeEnd, setSelectedTimeEnd] = useState("19:00");
  const [savedTemplates, setSavedTemplates] = useState<ScheduleTemplate[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Parse current value into a day -> time map
  // e.g. { "Пн": "18:00 - 19:00", "Ср": "18:00 - 19:00" }
  const parseScheduleMap = (rawStr: string): Record<string, string> => {
    if (!rawStr) return {};
    const map: Record<string, string> = {};
    const items = rawStr.split(",").map((s) => s.trim()).filter(Boolean);
    items.forEach((item) => {
      // Look for day prefix
      for (const w of WEEKDAYS) {
        if (item.startsWith(w.id)) {
          const timePart = item.replace(w.id, "").trim();
          map[w.id] = timePart || `${selectedTimeStart} - ${selectedTimeEnd}`;
          break;
        }
      }
    });
    return map;
  };

  const scheduleMap = parseScheduleMap(value);
  const activeDays = Object.keys(scheduleMap);

  useEffect(() => {
    setSavedTemplates(loadSavedScheduleTemplates());
  }, []);

  const emitNewSchedule = (newMap: Record<string, string>) => {
    // Keep standard weekday order
    const orderedParts: string[] = [];
    WEEKDAYS.forEach((w) => {
      if (newMap[w.id]) {
        orderedParts.push(`${w.id} ${newMap[w.id]}`);
      }
    });
    onChange(orderedParts.join(", "));
  };

  const toggleDay = (dayId: string) => {
    const nextMap = { ...scheduleMap };
    if (nextMap[dayId]) {
      delete nextMap[dayId];
    } else {
      nextMap[dayId] = `${selectedTimeStart} - ${selectedTimeEnd}`;
    }
    emitNewSchedule(nextMap);
  };

  const applyTimeToDay = (dayId: string, timeStr: string) => {
    const nextMap = { ...scheduleMap, [dayId]: timeStr };
    emitNewSchedule(nextMap);
  };

  const applyTimeToAllActiveDays = (start: string, end: string) => {
    const timeStr = `${start} - ${end}`;
    if (activeDays.length === 0) {
      // If no days selected yet, preselect Mon & Wed as standard
      emitNewSchedule({
        Пн: timeStr,
        Ср: timeStr,
      });
      return;
    }
    const nextMap: Record<string, string> = {};
    activeDays.forEach((d) => {
      nextMap[d] = timeStr;
    });
    emitNewSchedule(nextMap);
  };

  const handleSelectPopularSlot = (start: string, end: string) => {
    setSelectedTimeStart(start);
    setSelectedTimeEnd(end);
    applyTimeToAllActiveDays(start, end);
  };

  const handleApplyTemplate = (tmpl: ScheduleTemplate) => {
    onChange(tmpl.rawSchedule);
    // Also parse time to set inputs
    const parts = tmpl.rawSchedule.split(",");
    if (parts.length > 0) {
      const match = parts[0].match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (match) {
        setSelectedTimeStart(match[1]);
        setSelectedTimeEnd(match[2]);
      }
    }
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!value.trim()) {
      alert("Сначала выберите дни и время тренировок!");
      return;
    }
    const label = customTemplateName.trim() || value;
    const updated = saveCustomScheduleTemplate(value, label);
    setSavedTemplates(updated);
    setCustomTemplateName("");
    setShowSaveForm(false);
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
                <span className="truncate max-w-[200px]">{tmpl.label}</span>
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

      {/* 2. TIME SELECTOR (START - END) */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 text-[11px]">
            Время тренировки:
          </span>
          <span className="font-mono font-bold text-red-600 text-[11px]">
            {selectedTimeStart} – {selectedTimeEnd}
          </span>
        </div>

        {/* Popular Time Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {POPULAR_TIME_SLOTS.map((slot) => {
            const isMatch =
              selectedTimeStart === slot.start && selectedTimeEnd === slot.end;
            return (
              <button
                type="button"
                key={slot.label}
                onClick={() => handleSelectPopularSlot(slot.start, slot.end)}
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

        {/* Custom Exact Time Inputs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10px] text-slate-500 font-semibold shrink-0">
            Точное время:
          </span>
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="time"
              value={selectedTimeStart}
              onChange={(e) => {
                const newStart = e.target.value;
                setSelectedTimeStart(newStart);
                applyTimeToAllActiveDays(newStart, selectedTimeEnd);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-red-500"
            />
            <span className="text-slate-400 text-xs font-bold">—</span>
            <input
              type="time"
              value={selectedTimeEnd}
              onChange={(e) => {
                const newEnd = e.target.value;
                setSelectedTimeEnd(newEnd);
                applyTimeToAllActiveDays(selectedTimeStart, newEnd);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-red-500"
            />
          </div>
          {activeDays.length > 0 && (
            <button
              type="button"
              onClick={() =>
                applyTimeToAllActiveDays(selectedTimeStart, selectedTimeEnd)
              }
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition shrink-0"
              title="Применить это время ко всем выбранным дням"
            >
              Ко всем дням
            </button>
          )}
        </div>
      </div>

      {/* 3. DAYS OF WEEK TOGGLES */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-700 block">
          Дни недели:
        </span>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => {
            const isSelected = activeDays.includes(w.id);
            return (
              <button
                type="button"
                key={w.id}
                onClick={() => toggleDay(w.id)}
                className={`py-2 rounded-xl text-xs font-black transition flex flex-col items-center justify-center cursor-pointer border ${
                  isSelected
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-red-200 hover:bg-red-50/40"
                }`}
              >
                <span>{w.short}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-1"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CURRENT SCHEDULE PREVIEW & SAVE BUTTON */}
      {value ? (
        <div className="bg-red-50/60 border border-red-100 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar className="w-4 h-4 text-red-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] font-mono uppercase text-red-600 font-bold block">
                Итоговое расписание группы:
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {value}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!showSaveForm ? (
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                title="Сохранить этот график в шаблоны для быстрого использования"
              >
                <Bookmark className="w-3 h-3" /> Сохранить в шаблоны
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-red-200 shadow-xs">
                <input
                  type="text"
                  placeholder="Название (напр. Вт, Чт 18:00)"
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

      {saveSuccessMsg && (
        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
