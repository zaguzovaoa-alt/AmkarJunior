import React, { useState, useMemo, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { parseScheduleString, RU_WEEKDAYS_MAP } from "../utils/scheduleParser";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  User,
  Layers,
  Check,
  X,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Sliders,
  CheckSquare,
  Users,
  Trash,
  Trash2,
} from "lucide-react";

interface CustomEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  groupId: string;
  groupName: string;
  coachId: string;
  coachName: string;
  location: string;
  type: "regular" | "match" | "masterclass" | "meeting" | "competition";
  notes?: string;
}

const RU_WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const RU_MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const LOCATIONS = [
  "Манеж Спартак",
  "Импульс Арена",
  "Центральное поле",
  "Спортзал Школы №10",
];

export const ScheduleCalendar: React.FC<{
  filteredGroupId?: string;
  filteredCoachId?: string;
}> = ({ filteredGroupId, filteredCoachId }) => {
  const {
    groups,
    coaches,
    tasks,
    updateGroup,
    calendarSyncEnabled,
    toggleCalendarSync,
    calendarSyncLog,
    triggerManualCalendarSync,
    addNotification,
  } = useCRM();

  // Active view: 'month' | 'week' | 'list'
  const [view, setView] = useState<"month" | "week" | "list">("month");

  // Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter states
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedCoachId, setSelectedCoachId] = useState<string>(
    filteredCoachId || "all",
  );
  const [selectedType, setSelectedType] = useState<string>("all");

  // Interactive state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState<string | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] =
    useState<CustomEvent | null>(null);

  // New deletion & clean up controller states
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false);
  const [bypassDeleteConfirmation, setBypassDeleteConfirmation] =
    useState(false);
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for creating/editing custom events with local persistence
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(() => {
    const cached = localStorage.getItem("amkar_custom_events");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback to defaults
      }
    }
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() + 1);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 3);
    const d3 = new Date(today);
    d3.setDate(today.getDate() + 4);

    return [
      {
        id: "ce_1",
        title: "Товарищеский хоккей/футбик с ФК Импульс",
        date: d1.toLocaleDateString("en-CA"),
        time: "18:00",
        groupId: groups[0]?.id || "none",
        groupName: groups[0]?.name || "Без группы",
        coachId: coaches[0]?.id || "c_1",
        coachName: coaches[0]?.name || "Константин Бесков",
        location: "Импульс Арена",
        type: "match",
      },
      {
        id: "ce_2",
        title: "Мастер-класс: Финты и дриблинг 1-на-1",
        date: d2.toLocaleDateString("en-CA"),
        time: "19:30",
        groupId: groups.length > 1 ? groups[1]?.id : groups[0]?.id || "none",
        groupName:
          groups.length > 1 ? groups[1]?.name : groups[0]?.name || "Без группы",
        coachId: coaches[1]?.id || "c_2",
        coachName: coaches[1]?.name || "Олег Романцев",
        location: "Манеж Спартак",
        type: "masterclass",
      },
      {
        id: "ce_3",
        title: "Родительское собрание: Планы на летние сборы",
        date: d3.toLocaleDateString("en-CA"),
        time: "19:00",
        groupId: "all",
        groupName: "Все группы",
        coachId: coaches[0]?.id || "c_1",
        coachName: coaches[0]?.name || "Константин Бесков",
        location: "Конференц-зал Манежа",
        type: "meeting",
      },
    ];
  });

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem("amkar_custom_events", JSON.stringify(customEvents));
  }, [customEvents]);

  // Create form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("17:00");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventGroupId, setNewEventGroupId] = useState("all");
  const [newEventCoachId, setNewEventCoachId] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("Манеж Спартак");
  const [newEventType, setNewEventType] = useState<
    "regular" | "match" | "masterclass" | "meeting" | "competition"
  >("regular");
  const [newEventNotes, setNewEventNotes] = useState("");
  const [notificationTarget, setNotificationTarget] = useState<
    "none" | "all" | "group"
  >("none");

  // Trigger calendar sync event logger
  const [syncLoading, setSyncLoading] = useState(false);
  const triggerGoogleSync = () => {
    setSyncLoading(true);
    setTimeout(() => {
      triggerManualCalendarSync();
      setSyncLoading(false);
    }, 1000);
  };

  // Convert schedule days (with locations, times) into actual repeatable calendar events
  const repeatingScheduleEvents = useMemo(() => {
    const list: CustomEvent[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Run through each day of the current Month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // To identify duplicates and append a unique index suffix
    const seenCount = new Map<string, number>();

    groups.forEach((g) => {
      g.scheduleDays?.forEach((sched) => {
        // Parse day, time, and location using our unified scheduleParser helper
        const parsedSlots = parseScheduleString(sched);
        parsedSlots.forEach((slot) => {
          const targetDayOfWeek = RU_WEEKDAYS_MAP[slot.day];
          if (targetDayOfWeek === undefined) return;

          // Loop through all dates in selected month and see if they match this day of week
          for (let d = 1; d <= daysInMonth; d++) {
            const testDate = new Date(year, month, d);
            if (testDate.getDay() === targetDayOfWeek) {
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const activeCoach = coaches.find((c) => c.id === g.coachId);
              const coachName = activeCoach
                ? activeCoach.name
                : g.coachName || "Не указан";
              const idSafeTime = slot.time.replace(/[^0-9a-zA-Z]/g, "");
              const baseId = `rep_${g.id}_${dateStr}_${idSafeTime}`;

              const currentCount = seenCount.get(baseId) || 0;
              seenCount.set(baseId, currentCount + 1);
              const finalId = `${baseId}_${currentCount}`;

              list.push({
                id: finalId,
                title: `Регулярная тренировка: ${g.name}`,
                date: dateStr,
                time: slot.time,
                groupId: g.id,
                groupName: g.name,
                coachId: g.coachId || (activeCoach ? activeCoach.id : "all"),
                coachName: coachName,
                location: slot.location || "Манеж Спартак",
                type: "regular",
              });
            }
          }
        });
      });
    });

    return list;
  }, [groups, coaches, currentDate]);

  // Combine repeating schedules + custom events with deduplication, and dynamically insert pending risk tasks as event cards
  const allEvents = useMemo(() => {
    // Convert active tasks assigned to staff into calendar events
    const taskEvents: CustomEvent[] = (tasks || [])
      .filter((t) => t.status !== "completed")
      .map((t) => {
        const rawDate = t.dueDate;
        const todayStr = new Date().toLocaleDateString("en-CA");
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        const tmrwStr = tmrw.toLocaleDateString("en-CA");

        // Map 'Сегодня' or empty dates to today's date
        let resolvedDate =
          rawDate === "Сегодня" || !rawDate ? todayStr : rawDate;

        // If the date is not in standard YYYY-MM-DD format (e.g. 'Завтра')
        if (resolvedDate && !/^\d{4}-\d{2}-\d{2}$/.test(resolvedDate)) {
          if (resolvedDate.toLowerCase().includes("завтра")) {
            resolvedDate = tmrwStr;
          } else {
            resolvedDate = todayStr;
          }
        }

        const isRisk =
          t.title.toLowerCase().includes("риск") ||
          t.title.toLowerCase().includes("risk");

        return {
          id: t.id,
          title: t.title,
          date: resolvedDate,
          time: "12:00",
          groupId: t.relatedClientId || "task_event",
          groupName: "Поручение CRM",
          coachId: "staff",
          coachName: t.assignedTo === "manager" ? "Менеджер" : "Тренер",
          location: t.description,
          type: isRisk ? "match" : "meeting", // styled red for risk, indigo for default meeting
        } as CustomEvent;
      });

    // Put customEvents and tasks first so that any custom overrides keep priority
    const combined = [
      ...customEvents,
      ...taskEvents,
      ...repeatingScheduleEvents,
    ];
    const seenKeys = new Set<string>();
    const uniqueList: CustomEvent[] = [];

    combined.forEach((ev) => {
      // Create a unique key for matching group + date + time + type
      const key = `${ev.groupId || "all"}_${ev.date}_${ev.time}_${ev.type}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueList.push(ev);
      }
    });

    return uniqueList;
  }, [repeatingScheduleEvents, customEvents, tasks]);

  // Apply filters to combined events list
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // Force filter by filteredGroupId if it's provided by ParentPortal
      if (
        filteredGroupId &&
        ev.groupId !== filteredGroupId &&
        ev.groupId !== "all"
      ) {
        return false;
      }
      // Force filter by filteredCoachId if provided by TrainerCRM
      if (
        filteredCoachId &&
        ev.coachId !== filteredCoachId &&
        ev.coachId !== "all" &&
        ev.coachId !== "staff"
      ) {
        return false; // Show only events belonging to this coach, cross-coach events etc.
      }
      const matchGroup =
        selectedGroupId === "all" || ev.groupId === selectedGroupId;
      const matchCoach =
        selectedCoachId === "all" || ev.coachId === selectedCoachId;
      const matchType = selectedType === "all" || ev.type === selectedType;
      return matchGroup && matchCoach && matchType;
    });
  }, [
    allEvents,
    selectedGroupId,
    selectedCoachId,
    selectedType,
    filteredGroupId,
    filteredCoachId,
  ]);

  // Navigation handlers
  const handlePrev = () => {
    if (view === "month" || view === "list") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else if (view === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (view === "month" || view === "list") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else if (view === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build grid of days for the Month view
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysCount = lastDayOfMonth.getDate();

    // Get starting empty slots (offset) based on first day weekday (convert Sunday=0, Monday=1, ... to Monday-first offsets)
    // InJS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // Mon-first offsets: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    let startingOffset = firstDayOfMonth.getDay() - 1;
    if (startingOffset === -1) startingOffset = 6; // Sunday gets index 6

    const grid = [];

    // Prior month days for padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingOffset - 1; i >= 0; i--) {
      grid.push({
        dayNum: prevMonthLastDay - i,
        dateStr: null,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    const today = new Date();
    // Current month days
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday =
        year === today.getFullYear() &&
        month === today.getMonth() &&
        d === today.getDate();

      grid.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Pack remaining slots to fill full 6-row layout (42 cells) to keep height consistent
    const totalCells = 42;
    const remainingCount = totalCells - grid.length;
    for (let d = 1; d <= remainingCount; d++) {
      grid.push({
        dayNum: d,
        dateStr: null,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return grid;
  }, [currentDate]);

  // Week Grid generation (Monday to Sunday around currentDate)
  const weekDays = useMemo(() => {
    const list = [];
    // Find current Monday
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      list.push({
        dayName: RU_WEEKDAYS[d.getDay()],
        dayNum: d.getDate(),
        dateStr,
        isToday,
      });
    }
    return list;
  }, [currentDate]);

  // Open creation modal
  const handleOpenAddModal = (dateStr: string) => {
    setSelectedCellDate(dateStr);
    setNewEventDate(dateStr);
    setNewEventTitle("");
    setNewEventGroupId(groups[0]?.id || "all");
    setNewEventCoachId(coaches[0]?.id || "");
    setNewEventTime("17:00");
    setNewEventType("regular");
    setNewEventLocation("Манеж Спартак");
    setNewEventNotes("");
    setShowAddModal(true);
  };

  // Create event submission
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDate || (!newEventTitle && newEventType !== "regular")) return;

    const gObj = groups.find((g) => g.id === newEventGroupId);
    const cObj = coaches.find((c) => c.id === newEventCoachId);

    const generatedTitle =
      newEventType === "regular"
        ? `Регулярная тренировка: ${gObj?.name || "Вся футбольная база"}`
        : newEventTitle;

    const newEv: CustomEvent = {
      id: `custom_${Date.now()}`,
      title: generatedTitle,
      date: newEventDate,
      time: newEventTime,
      groupId: newEventGroupId,
      groupName: gObj?.name || "Все группы",
      coachId: newEventCoachId || cObj?.id || "all",
      coachName: cObj?.name || "Дежурный тренер",
      location: newEventLocation,
      type: newEventType,
      notes: newEventNotes,
    };

    if (notificationTarget !== "none") {
      const targetRole: ("parent" | "trainer" | "manager" | "director")[] = [
        "parent",
        "trainer",
        "manager",
      ];
      let bodyText = `Новое событие: ${generatedTitle} (${newEventDate} ${newEventTime}) в ${newEventLocation}`;
      if (notificationTarget === "group" && gObj) {
        bodyText += `. Для группы ${gObj.name}.`;
      }

      addNotification({
        title: "Обновление расписания",
        body: bodyText,
        type: "event",
        targetRole,
        targetGroupIds: notificationTarget === "group" && gObj ? [gObj.id] : [],
      });
    }

    // If regular, we also offer option to add as repeating schedule day to Group config!
    if (newEventType === "regular" && gObj) {
      // Find weekday of date, e.g. "Пн"
      const dateObj = new Date(newEventDate);
      const weekdayAbbr = RU_WEEKDAYS[dateObj.getDay()];

      const locPrefix =
        newEventLocation && newEventLocation !== "Манеж Спартак"
          ? `${newEventLocation}: `
          : "";
      const slotToAdd = `${locPrefix}${weekdayAbbr} ${newEventTime}`;

      if (!gObj.scheduleDays.includes(slotToAdd)) {
        const updatedSlots = [...gObj.scheduleDays, slotToAdd];
        updateGroup(gObj.id, { scheduleDays: updatedSlots });
      }
    }

    setCustomEvents((prev) => [...prev, newEv]);
    setShowAddModal(false);

    // Sync feedback
    if (calendarSyncEnabled) {
      // Alert sync log would update in CRMContext automatically
      triggerGoogleSync();
    }
  };

  // Delete event
  const handleDeleteEvent = (id: string, bypassPrompt = false) => {
    if (!bypassPrompt && !bypassDeleteConfirmation) {
      setDeleteConfirmId(id);
      return;
    }

    if (id.startsWith("rep_")) {
      // repeating event deletion, delete the matching scheduleDay string from the group's config
      const parts = id.split("_");
      const groupId = parts[1];
      const targetTime = parts[3];
      const gObj = groups.find((g) => g.id === groupId);
      if (gObj) {
        // match specific day of week
        const dateStr = parts[2];
        const dateObj = new Date(dateStr);
        const dayAbbr = RU_WEEKDAYS[dateObj.getDay()];

        const updatedSlots = gObj.scheduleDays.filter((s) => {
          const parsed = parseScheduleString(s);
          if (parsed.length === 0) return true;
          const hasMatch = parsed.some(
            (slot) =>
              slot.day === dayAbbr &&
              slot.time.replace(/[^0-9a-zA-Z]/g, "") === targetTime,
          );
          return !hasMatch;
        });
        updateGroup(groupId, { scheduleDays: updatedSlots });
      }
    } else {
      // custom calendar event deletion
      setCustomEvents((prev) => prev.filter((ev) => ev.id !== id));
    }

    setShowEventDetailsModal(null);
    setDeleteConfirmId(null);
    setSelectedEventIds((prev) => prev.filter((x) => x !== id));
    if (calendarSyncEnabled) {
      triggerGoogleSync();
    }
  };

  // Batch delete custom / repeating events
  const handleBatchDelete = (ids: string[]) => {
    // Separate custom events and repeating event strings
    const customIds = ids.filter((id) => !id.startsWith("rep_"));
    const repIds = ids.filter((id) => id.startsWith("rep_"));

    // Update custom events
    if (customIds.length > 0) {
      setCustomEvents((prev) =>
        prev.filter((ev) => !customIds.includes(ev.id)),
      );
    }

    // Update group schedules for repeating events
    repIds.forEach((id) => {
      const parts = id.split("_");
      const groupId = parts[1];
      const targetTime = parts[3];
      const gObj = groups.find((g) => g.id === groupId);
      if (gObj) {
        const dateStr = parts[2];
        const dateObj = new Date(dateStr);
        const dayAbbr = RU_WEEKDAYS[dateObj.getDay()];
        const updatedSlots = gObj.scheduleDays.filter((s) => {
          const parsed = parseScheduleString(s);
          if (parsed.length === 0) return true;
          const hasMatch = parsed.some(
            (slot) =>
              slot.day === dayAbbr &&
              slot.time.replace(/[^0-9a-zA-Z]/g, "") === targetTime,
          );
          return !hasMatch;
        });
        updateGroup(groupId, { scheduleDays: updatedSlots });
      }
    });

    setSelectedEventIds([]);
    setIsDeleteModeActive(false);
    setDeleteConfirmId(null);
    setShowEventDetailsModal(null);

    if (calendarSyncEnabled) {
      triggerGoogleSync();
    }
  };

  // Toggle selection for batch delete
  const toggleEventSelection = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Render event type label design helper
  const renderTypeBadge = (type: CustomEvent["type"]) => {
    switch (type) {
      case "competition":
        return (
          <span className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-800 font-extrabold text-[9px] uppercase rounded border border-fuchsia-200">
            Соревнование
          </span>
        );
      case "match":
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-extrabold text-[9px] uppercase rounded border border-red-200">
            Матч турнира
          </span>
        );
      case "masterclass":
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[9px] uppercase rounded border border-amber-200">
            Мастер-Класс
          </span>
        );
      case "meeting":
        return (
          <span className="px-2 py-0.5 bg-indigo-105 bg-indigo-100 text-indigo-800 font-extrabold text-[9px] uppercase rounded border border-indigo-200">
            Собрание
          </span>
        );
      case "regular":
      default:
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-extrabold text-[9px] uppercase rounded border border-emerald-100">
            Занятие по расписанию
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 ">
      {/* Header element */}
      <div className="p-6 bg-white border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black text-red-600 uppercase font-mono tracking-widest mb-1">
            <span>Календарь занятий</span>
            <span className="w-1 h-1 rounded-full bg-red-650"></span>
            <span>Google Sync Live</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
            Интерактивное расписание академии
          </h1>
          <p className="text-gray-500 text-sm">
            Удобное составление, перенос и отмена тренировок футбольных групп с
            синхронной автовыгрузкой в Google-календари.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const nextMode = !isDeleteModeActive;
              setIsDeleteModeActive(nextMode);
              if (!nextMode) {
                setSelectedEventIds([]);
              }
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition border cursor-pointer ${
              isDeleteModeActive
                ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-350"
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm"
            }`}
            title="Удаляйте записи быстро в один клик или пачкой"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isDeleteModeActive ? "Выйти из удаления" : "Пакетное удаление"}
            </span>
          </button>

          <button
            onClick={() =>
              handleOpenAddModal(currentDate.toISOString().split("T")[0])
            }
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition shadow-md shadow-red-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Добавить событие</span>
          </button>

          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 select-none">
            {(["month", "week", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition uppercase font-mono ${
                  view === v
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {v === "month" ? "Месяц" : v === "week" ? "Неделя" : "Список"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
        {/* Bulk Delete Controls Bar */}
        {isDeleteModeActive && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-150 shadow-sm relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
            <div className="space-y-1 z-10">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-650 animate-pulse" />
                <h4 className="font-extrabold text-xs text-red-950 uppercase tracking-tight font-mono">
                  Режим быстрого и пакетного удаления
                </h4>
              </div>
              <p className="text-[11px] text-red-800 leading-normal max-w-2xl">
                Отмечайте записи флажками на страницах календаря, либо удаляйте
                их мгновенно кнопкой{" "}
                <Trash className="w-3.5 h-3.5 inline text-red-600 mx-0.5" />.
                Выбрано занятий для стирания:{" "}
                <strong className="text-red-950 font-mono text-xs bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                  {selectedEventIds.length}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto z-10">
              <label className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-900 cursor-pointer hover:bg-red-50/50 transition self-stretch md:self-auto select-none">
                <input
                  type="checkbox"
                  checked={bypassDeleteConfirmation}
                  onChange={(e) =>
                    setBypassDeleteConfirmation(e.target.checked)
                  }
                  className="rounded text-red-600 focus:ring-red-600 w-3.5 h-3.5"
                />
                <span>Без подтверждений</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (selectedEventIds.length === 0) {
                    return;
                  }
                  if (bypassDeleteConfirmation) {
                    handleBatchDelete(selectedEventIds);
                  } else {
                    setDeleteConfirmId("batch");
                  }
                }}
                disabled={selectedEventIds.length === 0}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition shadow-md shadow-red-600/10 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить выбранные ({selectedEventIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Sync Settings Hub widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>

          <div className="flex items-start space-x-3.5 z-10">
            <div
              className={`p-3 rounded-2xl shrink-0 ${calendarSyncEnabled ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-orange-50 text-orange-600 border border-orange-100"}`}
            >
              <RefreshCw
                className={`w-5.5 h-5.5 ${syncLoading ? "animate-spin" : ""}`}
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Статус шлюза Google Calendar API
                </h3>
                <span
                  className={`w-2 h-2 rounded-full ${calendarSyncEnabled ? "bg-emerald-500 animate-pulse" : "bg-orange-500"}`}
                ></span>
              </div>
              <p className="text-xs text-slate-450 mt-1">
                {calendarSyncEnabled
                  ? "Сопряжено с аккаунтом: zaguzovaoa@gmail.com. Любые правки календаря занятий моментально дублируются в Google!"
                  : "Связь с Google Календарем деактивирована. Включите интеграцию для отправки графиков родителям."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0 w-full md:w-auto">
            <button
              onClick={toggleCalendarSync}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black uppercase rounded-xl transition border cursor-pointer ${
                calendarSyncEnabled
                  ? "bg-slate-50 border-slate-200 text-red-650 hover:bg-slate-100"
                  : "bg-red-600 text-white border-transparent hover:bg-red-700 shadow-xs"
              }`}
            >
              {calendarSyncEnabled
                ? "Отключить интеграцию"
                : "Активировать Google Sync"}
            </button>

            {calendarSyncEnabled && (
              <button
                onClick={triggerGoogleSync}
                disabled={syncLoading}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition border text-slate-700 shrink-0 cursor-pointer"
                title="Принудительно запустить синхронизацию"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncLoading ? "animate-spin" : ""}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Filters and Month/Week Navigator */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          {/* Navigator */}
          <div className="flex items-center justify-between lg:justify-start gap-4 select-none">
            <div className="flex items-center space-x-1 border p-1 rounded-xl bg-slate-50">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-white rounded-lg hover:shadow-xs transition text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-bold font-mono text-slate-800 hover:bg-white rounded-lg hover:shadow-xs transition"
              >
                СЕГОДНЯ
              </button>

              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-white rounded-lg hover:shadow-xs transition text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
              {view === "week" && weekDays.length > 0 ? (
                <>
                  {weekDays[0].dayNum} {RU_MONTHS[(new Date(weekDays[0].dateStr)).getMonth()].slice(0, 3)} - {weekDays[6].dayNum} {RU_MONTHS[(new Date(weekDays[6].dateStr)).getMonth()].slice(0, 3)} {currentDate.getFullYear()} г.
                </>
              ) : (
                <>
                  {RU_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()} г.
                </>
              )}
            </h2>
          </div>

          {/* Quick Filter dropdowns */}
          <div
            className={`grid grid-cols-1 ${filteredCoachId ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-2 flex-grow max-w-2xl lg:ml-auto`}
          >
            <div className="relative">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-2.5 py-2 pl-7 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
              >
                <option value="all">📁 Все футбольные группы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <Layers className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3 pointers-events-none" />
            </div>

            {!filteredCoachId && (
              <div className="relative">
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="w-full px-2.5 py-2 pl-7 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
                >
                  <option value="all">⚽ Все тренеры штаба</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3 pointers-events-none" />
              </div>
            )}

            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-2.5 py-2 pl-7 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
              >
                <option value="all">📝 Все категории событий</option>
                <option value="regular">Занятия по графику</option>
                <option value="match">Турниры / Матчи</option>
                <option value="masterclass">Мастер-Классы</option>
                <option value="meeting">Родительские собрания</option>
              </select>
              <Sliders className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3 pointers-events-none" />
            </div>
          </div>
        </div>

        {/* MONTH VIEW CALENDAR GRID */}
        {view === "month" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Weekdays indicator row */}
            <div className="grid grid-cols-7 bg-slate-950 text-white font-semibold font-mono text-[10px] uppercase py-3 border-b border-slate-200 select-none text-center tracking-wider">
              <div>Пн (Пн)</div>
              <div>Вт (Ма)</div>
              <div>Ср (Ме)</div>
              <div>Чт (Же)</div>
              <div>Пт (Пя)</div>
              <div className="text-red-400">Сб (Су)</div>
              <div className="text-red-400">Вс (Во)</div>
            </div>

            {/* Cells grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-left">
              {monthGridDays.map((cell, idx) => {
                const isCellActive = cell.isCurrentMonth;
                const cellEvents = cell.dateStr
                  ? filteredEvents.filter((ev) => ev.date === cell.dateStr)
                  : [];

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col justify-between group relative transition-colors ${
                      isCellActive
                        ? "bg-white hover:bg-slate-50/70"
                        : "bg-slate-50/40 text-gray-300"
                    } ${cell.isToday ? "bg-red-50/20 ring-1 ring-inset ring-red-550/30" : ""}`}
                  >
                    {/* Upper cell panel: day label and quick add */}
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          cell.isToday
                            ? "bg-red-600 text-white shadow-sm"
                            : isCellActive
                              ? "text-slate-800"
                              : "text-slate-350"
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Add Event shortcut */}
                      {isCellActive && cell.dateStr && (
                        <button
                          onClick={() => handleOpenAddModal(cell.dateStr!)}
                          className="opacity-0 group-hover:opacity-100 p-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition duration-150 absolute top-2 right-2 shadow-xs cursor-pointer"
                          title="Создать событие на этот день"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Events body container */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[75px] scrollbar-none pb-0.5">
                      {cellEvents.map((ev) => {
                        const isRegular = ev.type === "regular";
                        let bgTypeStyle =
                          "bg-emerald-50 text-emerald-800 border-emerald-100";
                        if (ev.type === "match")
                          bgTypeStyle = "bg-red-50 text-red-800 border-red-150";
                        if (ev.type === "masterclass")
                          bgTypeStyle =
                            "bg-amber-50 text-amber-900 border-amber-200";
                        if (ev.type === "meeting")
                          bgTypeStyle =
                            "bg-indigo-50 text-indigo-900 border-indigo-150";
                        if (ev.type === "competition")
                          bgTypeStyle =
                            "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200";

                        const isSelected = selectedEventIds.includes(ev.id);

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDeleteModeActive) {
                                toggleEventSelection(ev.id);
                              } else {
                                setShowEventDetailsModal(ev);
                              }
                            }}
                            className={`p-1 text-[10px] font-semibold border rounded-md cursor-pointer transition select-none hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-between group/ev ${bgTypeStyle} ${
                              isDeleteModeActive && isSelected
                                ? "ring-2 ring-red-500 bg-red-100 border-red-350"
                                : ""
                            }`}
                            title={`${ev.time} | ${ev.title}`}
                          >
                            <div className="flex flex-col min-w-0 flex-1 py-0.5 text-left leading-normal">
                              <div className="flex items-center space-x-1 min-w-0">
                                {isDeleteModeActive && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleEventSelection(ev.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-2.5 h-2.5 rounded text-red-650 focus:ring-0 shrink-0 cursor-pointer"
                                  />
                                )}
                                <span className="truncate font-sans font-bold text-[10px] text-slate-900">
                                  {ev.title.startsWith(
                                    "Регулярная тренировка: ",
                                  )
                                    ? ev.title.replace(
                                        "Регулярная тренировка: ",
                                        "",
                                      )
                                    : ev.title}
                                </span>
                              </div>
                              {ev.coachName && (
                                <div className="text-[8px] font-semibold text-slate-500/90 truncate flex items-center gap-0.5 mt-0.5 leading-none">
                                  <User className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                  <span className="truncate">
                                    {ev.coachName}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end justify-between shrink-0 ml-1.5 space-y-0.5 self-start pt-0.5">
                              <span className="text-[8px] font-black font-mono tracking-tighter bg-black/5 px-1 py-0.5 rounded text-slate-700 shrink-0">
                                {ev.time}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(ev.id);
                                }}
                                className="opacity-0 group-hover/ev:opacity-100 p-0.5 hover:bg-red-500 hover:text-white rounded text-red-600 transition shrink-0 cursor-pointer"
                                title="Удалить это занятие мгновенно"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW CALENDAR */}
        {view === "week" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
            <div className="grid grid-cols-7 bg-slate-950 text-white font-mono text-[10px] uppercase text-center font-semibold py-3 border-b">
              {weekDays.map((w, idx) => (
                <div key={idx} className={w.isToday ? "text-red-400" : ""}>
                  {w.dayName} {w.dayNum}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-slate-100 bg-white min-h-[400px]">
              {weekDays.map((w, idx) => {
                const dayEvents = filteredEvents.filter(
                  (ev) => ev.date === w.dateStr,
                );

                return (
                  <div
                    key={idx}
                    className={`p-3 space-y-2 flex flex-col justify-between ${w.isToday ? "bg-red-500/5" : ""}`}
                  >
                    {/* Day indicator */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase font-mono tracking-wider ${w.isToday ? "text-red-600" : "text-slate-400"}`}
                      >
                        {w.isToday ? "СЕГОДНЯ" : "ДЕНЬ"}
                      </span>
                      <button
                        onClick={() => handleOpenAddModal(w.dateStr)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                        title="Добавить занятие"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Week Day Events */}
                    <div className="flex-grow space-y-2">
                      {dayEvents.length === 0 ? (
                        <div className="text-[10px] italic text-slate-350 text-center py-10">
                          Нет записей
                        </div>
                      ) : (
                        dayEvents.map((ev) => {
                          const isReg = ev.type === "regular";
                          const isSelected = selectedEventIds.includes(ev.id);
                          return (
                            <div
                              key={ev.id}
                              onClick={() => {
                                if (isDeleteModeActive) {
                                  toggleEventSelection(ev.id);
                                } else {
                                  setShowEventDetailsModal(ev);
                                }
                              }}
                              className={`p-2.5 rounded-lg border text-left text-[10px] cursor-pointer hover:shadow-sm transition relative group/ev ${
                                ev.type === "match"
                                  ? "bg-red-50 hover:bg-red-105 text-red-900 border-red-200"
                                  : ev.type === "competition"
                                    ? "bg-fuchsia-50 hover:bg-fuchsia-105 text-fuchsia-900 border-fuchsia-200"
                                    : ev.type === "masterclass"
                                      ? "bg-amber-50 hover:bg-amber-105 text-amber-900 border-amber-200"
                                      : ev.type === "meeting"
                                        ? "bg-indigo-50 hover:bg-indigo-105 text-indigo-900 border-indigo-200"
                                        : "bg-emerald-50 hover:bg-emerald-105 text-emerald-990 border-emerald-150"
                              } ${isDeleteModeActive && isSelected ? "ring-2 ring-red-500 bg-red-100 border-red-350" : ""}`}
                            >
                              <div className="flex items-center justify-between font-mono font-bold text-[9px] text-slate-500 mb-1">
                                <span className="flex items-center gap-1">
                                  {isDeleteModeActive && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleEventSelection(ev.id);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-2.5 h-2.5 rounded text-red-650 focus:ring-0 shrink-0 cursor-pointer mr-1"
                                    />
                                  )}
                                  <Clock className="w-2.5 h-2.5 text-gray-400" />
                                  <span>{ev.time}</span>
                                </span>

                                <div className="flex items-center space-x-1">
                                  <span className="uppercase text-[8px]">
                                    {ev.type}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(ev.id);
                                    }}
                                    className="opacity-0 group-hover/ev:opacity-100 p-0.5 hover:bg-red-500 hover:text-white rounded text-red-600 transition shrink-0 cursor-pointer"
                                    title="Удалить это занятие мгновенно"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="font-extrabold line-clamp-2 leading-snug">
                                {ev.title}
                              </div>
                              <div className="text-[9px] text-gray-500 font-medium mt-1 truncate">
                                Группа: {ev.groupName}
                              </div>
                              <div className="text-[9px] text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                                <User className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{ev.coachName}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIST VIEW (TIMELINE) */}
        {view === "list" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-left space-y-4">
            <h3 className="font-extrabold text-slate-950 text-sm">
              Предстоящие тренировки и события в хронологическом порядке
            </h3>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-450 italic text-xs">
                Нет тренировок с выбранными параметрами в календаре.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredEvents
                  .sort(
                    (a, b) =>
                      a.date.localeCompare(b.date) ||
                      a.time.localeCompare(b.time),
                  )
                  .slice(0, 15)
                  .map((ev) => {
                    const todayStr = new Date().toLocaleDateString("en-CA"); // gets YYYY-MM-DD in local time
                    const isToday = ev.date === todayStr;
                    const isSelected = selectedEventIds.includes(ev.id);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (isDeleteModeActive) {
                            toggleEventSelection(ev.id);
                          } else {
                            setShowEventDetailsModal(ev);
                          }
                        }}
                        className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 px-3 -mx-3 rounded-xl transition group/ev ${
                          isToday ? "bg-red-500/5" : ""
                        } ${isDeleteModeActive && isSelected ? "bg-red-50 border-l-4 border-red-650" : ""}`}
                      >
                        <div className="flex items-start space-x-4">
                          {isDeleteModeActive && (
                            <div
                              className="pt-2 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleEventSelection(ev.id)}
                                className="w-4 h-4 rounded text-red-650 focus:ring-0 cursor-pointer"
                              />
                            </div>
                          )}

                          <div className="text-left shrink-0">
                            <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase tracking-wider">
                              ДАТА
                            </span>
                            <span className="text-sm font-extrabold text-slate-900 block font-mono leading-none mt-1">
                              {ev.date.split("-")[2]}.{ev.date.split("-")[1]}
                            </span>
                          </div>

                          <div className="space-y-1 scrollbar-none">
                            <div className="flex flex-wrap items-center gap-2">
                              {renderTypeBadge(ev.type)}
                              <span className="text-xs font-extrabold text-slate-800">
                                {ev.title}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-450 text-xs">
                              <span className="flex items-center space-x-1 font-semibold text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-mono">{ev.time}</span>
                              </span>
                              <span className="flex items-center space-x-1 font-medium">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span>
                                  Тренер: <strong>{ev.coachName}</strong>
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                          <span className="px-3 py-1 font-bold text-[10px] bg-slate-100 text-slate-800 rounded-lg">
                            {ev.groupName}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(ev.id);
                            }}
                            className="p-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-650 rounded-xl transition border border-red-100/50 cursor-pointer"
                            title="Отменить событие"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE NEW EVENT/SCHEDULE SLOT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 text-left select-none">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2 font-sans uppercase tracking-tight">
              <CalendarIcon className="w-5.5 h-5.5 text-red-650" />
              <span>Добавить событие</span>
            </h3>
            <p className="text-xs text-gray-450 mb-4">
              Создайте постоянную тренировку или разовое спортивное событие в
              общем календаре.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    Категория
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="w-full px-2.5 py-1.8 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                  >
                    <option value="regular">Тренировка (повторяемая)</option>
                    <option value="match">Официальный Матч</option>
                    <option value="masterclass">Платный Мастер-Класс</option>
                    <option value="meeting">Родительское собрание</option>
                    <option value="competition">Соревнование / Турнир</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    Футбольная группа
                  </label>
                  <select
                    value={newEventGroupId}
                    onChange={(e) => {
                      const gid = e.target.value;
                      setNewEventGroupId(gid);
                      const gObj = groups.find((g) => g.id === gid);
                      if (gObj && gObj.coachId) {
                        setNewEventCoachId(gObj.coachId);
                      }
                    }}
                    className="w-full px-2.5 py-1.8 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                  >
                    <option value="all">Для всех возрастов</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newEventType !== "regular" && (
                <div className="space-y-1 animate-in fade-in duration-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    Название события
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Напр. Турнир Кожаный Мяч"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    Дата события
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    Время начала
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="17:00 или 18:30"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold font-mono text-center focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    Тренер-куратор
                  </label>
                  <select
                    value={newEventCoachId}
                    onChange={(e) => setNewEventCoachId(e.target.value)}
                    className="w-full px-2.5 py-1.8 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">Дежурный тренер</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newEventType === "competition" && (
                <div className="space-y-1 animate-in fade-in duration-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                    Заметки / Инфо о соревновании (время сбора, детали)
                  </label>
                  <input
                    type="text"
                    placeholder="Напр. Сбор в 10:30 у входа, не забыть щитки"
                    value={newEventNotes}
                    onChange={(e) => setNewEventNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                  Push-уведомление (FCM)
                </label>
                <select
                  value={notificationTarget}
                  onChange={(e) => setNotificationTarget(e.target.value as any)}
                  className="w-full px-2.5 py-1.8 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
                >
                  <option value="none">Не отправлять уведомление</option>
                  <option value="group">
                    Уведомить детей выбранной группы
                  </option>
                  <option value="all">
                    Уведомить всех (родители, тренеры, менеджеры)
                  </option>
                </select>
              </div>

              {newEventType === "regular" && (
                <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-red-600 uppercase font-mono block">
                    РЕКУРРЕНТНОЕ СОБЫТИЕ:
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Поскольку выбрана категория регулярного занятия, этот день
                    недели автоматически добавится в повторяемый график группы в
                    CRM-системе.
                  </p>
                </div>
              )}

              {calendarSyncEnabled && (
                <div className="p-2.5 bg-emerald-50 text-emerald-850 rounded-xl border border-emerald-100 text-[10px] flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                  <span>
                    Google-выгрузка включена. Событие моментально появится в
                    календаре родителей и тренеров.
                  </span>
                </div>
              )}

              <div className="pt-4 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md shadow-red-600/10"
                >
                  Запланировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAILS VIEW MODAL */}
      {showEventDetailsModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 text-left">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowEventDetailsModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <div className="mb-2">
                  {renderTypeBadge(showEventDetailsModal.type)}
                </div>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {showEventDetailsModal.title}
                </h3>
                <span className="text-[11px] font-bold text-slate-450 block font-mono mt-0.5">
                  {showEventDetailsModal.groupName}
                </span>
              </div>

              <div className="pt-3 border-t space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4.5 h-4.5 text-gray-400" />
                  <div>
                    <span className="font-bold block text-slate-800 font-mono">
                      {showEventDetailsModal.date.split("-")[2]}.
                      {showEventDetailsModal.date.split("-")[1]}.
                      {showEventDetailsModal.date.split("-")[0]} в{" "}
                      {showEventDetailsModal.time}
                    </span>
                    <span className="text-[10px] text-gray-405 block font-medium">
                      Регулярность:{" "}
                      {showEventDetailsModal.type === "regular"
                        ? "Каждую неделю"
                        : "Разовое"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <User className="w-4.5 h-4.5 text-gray-400" />
                  <div>
                    <span className="font-semibold block text-slate-800">
                      {showEventDetailsModal.coachName}
                    </span>
                    <span className="text-[10px] text-gray-405 block font-medium">
                      Роль: Ведущий тренер занятия
                    </span>
                  </div>
                </div>
              </div>

              {showEventDetailsModal.notes && (
                <div className="p-3 bg-fuchsia-50/50 border border-fuchsia-100 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-fuchsia-800 uppercase font-mono block">
                    ЗАМЕТКИ К СОБЫТИЮ:
                  </span>
                  <p className="text-[11px] text-fuchsia-900/80 leading-normal font-semibold">
                    {showEventDetailsModal.notes}
                  </p>
                </div>
              )}

              {calendarSyncEnabled && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 text-[10px] text-slate-500">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Статус синхронизации:{" "}
                    <strong>Успешно экспортировано в Google</strong>
                  </span>
                </div>
              )}

              <div className="pt-4 border-t flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowEventDetailsModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase transition"
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(showEventDetailsModal.id)}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-105 text-red-600 hover:text-red-700 rounded-xl text-xs font-black uppercase transition border border-red-100"
                >
                  Отменить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PURE REACT EVENT DELETION CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[60] text-left select-none animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 relative animate-in zoom-in-95 duration-150">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-red-600">
                <Trash2 className="w-5.5 h-5.5 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-tight font-sans">
                  Подтверждение удаления
                </h3>
              </div>

              <p className="text-xs text-slate-650 leading-relaxed">
                {deleteConfirmId === "batch"
                  ? `Вы действительно хотите удалить все выбранные занятия (${selectedEventIds.length} шт.) из календаря и графика занятий?`
                  : "Вы действительно хотите отменить/удалить это занятие из календаря занятий и графика?"}
              </p>

              <div className="pt-3 border-t flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 w-full bg-slate-150 hover:bg-slate-205 text-slate-800 rounded-xl text-xs font-black uppercase transition"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmId === "batch") {
                      handleBatchDelete(selectedEventIds);
                    } else {
                      handleDeleteEvent(deleteConfirmId, true);
                    }
                  }}
                  className="flex-1 py-2 w-full bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md shadow-red-650/15 cursor-pointer"
                >
                  Да, удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
