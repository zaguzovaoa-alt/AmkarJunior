import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import { ScheduleCalendar } from "./ScheduleCalendar";
import {
  Calendar,
  Check,
  User,
  AlertCircle,
  ChevronRight,
  CheckSquare,
  MessageSquare,
  Star,
  Plus,
  Download,
  ClipboardList,
  Camera,
  Upload,
  Send,
  Users,
  Edit2,
  Trash,
  CreditCard,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { compressImage } from "../utils/image";
import { calculateAge } from "../utils/dateUtils";
import { BirthdaysBanner } from "./BirthdaysBanner";
import { parseScheduleString } from "../utils/scheduleParser";
import { TrainingGroup } from "../types";

interface TrainerCRMProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TrainerCRM: React.FC<TrainerCRMProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const {
    clients,
    tasks,
    groups,
    coaches,
    leads,
    finances,
    messages,
    trainingSessions,
    addChatMessage,
    updateChatMessage,
    deleteChatMessage,
    markAttendance,
    completeTrialAndMarkAttendance,
    ratePlayer,
    completeTask,
    updateClient,
    currentRole,
    userProfile,
    homeworks,
    homeworkSubmissions,
    addHomework,
    deleteHomework,
  } = useCRM();
  const { appUser } = useAuth();

  // Try to find coach based on logged in user's full name, email, or phone.
  const myCoach = coaches.find(
    (c) =>
      c.name.toLowerCase() === appUser?.fullName?.toLowerCase() ||
      (c.phone && appUser?.phone && c.phone === appUser?.phone),
  ) ||
    coaches[0] || {
      id: "c1",
      name: "Пьянченко Василий Витальевич",
      role: "Старший тренер",
    };

  // Local states for interactive things
  const [selectedGroupForAttendance, setSelectedGroupForAttendance] = useState<
    string | null
  >(null);
  const [attendanceRecords, setAttendanceRecords] = useState<{
    [key: string]: {
      status: "present" | "absent_sick" | "absent" | "trial_free";
      reason: string;
    };
  }>({});
  const [uploadedAttendancePhoto, setUploadedAttendancePhoto] = useState<
    string | null
  >(null);
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // States for player rating
  const [selectedPlayerForRating, setSelectedPlayerForRating] = useState<
    string | null
  >(null);
  const [techniqueRating, setTechniqueRating] = useState(4.5);
  const [tacticsRating, setTacticsRating] = useState(4.5);
  const [physicalRating, setPhysicalRating] = useState(4.5);
  const [disciplineRating, setDisciplineRating] = useState(4.5);

  const [chatInput, setChatInput] = useState("");
  const [chatVisibility, setChatVisibility] = useState<
    ("manager" | "trainer" | "parent" | "director" | "admin")[]
  >(["manager", "director", "trainer", "admin"]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  // States for client relationship risk submission from trainer
  const [trainerSelectedClientId, setTrainerSelectedClientId] = useState<
    string | null
  >(null);
  const [trainerRiskType, setTrainerRiskType] = useState<
    "none" | "conflict" | "absences"
  >("none");
  const [trainerRiskDetails, setTrainerRiskDetails] = useState("");
  const [trainerRiskUrgency, setTrainerRiskUrgency] = useState<
    "none" | "intervene" | "urgent"
  >("none");
  const [trainerRiskComment, setTrainerRiskComment] = useState("");

  // States for group management
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerNotes, setEditPlayerNotes] = useState("");
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  const [isAddingHomework, setIsAddingHomework] = useState(false);
  const [newHomework, setNewHomework] = useState({
    title: '', description: '', videoUrl: '', groupId: '', groupName: '', dueDate: ''
  });
  const [addPlayerSearch, setAddPlayerSearch] = useState("");

  const handleTrainerSubmitRisk = async () => {
    if (!trainerSelectedClientId) return;
    try {
      await updateClient(trainerSelectedClientId, {
        riskType: trainerRiskType,
        riskDetails: trainerRiskDetails,
        riskUrgency: trainerRiskUrgency,
        riskComment: trainerRiskComment,
        relationshipRisk:
          trainerRiskUrgency === "urgent"
            ? "high"
            : trainerRiskUrgency === "intervene"
              ? "low"
              : "none",
      });
      alert(
        "Сигнал о риске ухода / конфликте успешно отправлен руководству школы! Для Вас и менеджера сгенерированы ответные задачи в календарь.",
      );
      // Reset
      setTrainerSelectedClientId(null);
      setTrainerRiskType("none");
      setTrainerRiskDetails("");
      setTrainerRiskUrgency("none");
      setTrainerRiskComment("");
    } catch (err: any) {
      alert("Ошибка добавления риска: " + err.message);
    }
  };

  const myGroups = groups.filter((g) => g.coachId === myCoach.id);
  const myClients = clients
    .filter(
      (c) =>
        myGroups.some(
          (g) =>
            g.name === c.groupName ||
            (g.isSelectTeam && g.selectedClientIds?.includes(c.id)),
        ) || c.coachId === myCoach.id,
    )
    .sort((a, b) => {
      const nameA = `${a.childSurname} ${a.childName}`.trim().toLowerCase();
      const nameB = `${b.childSurname} ${b.childName}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, "ru");
    });
  const coachTasks = tasks.filter((t) => t.assignedTo === "trainer");

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    let senderName = `Тренер ${myCoach.name}`;
    if (currentRole === "admin")
      senderName = userProfile.name
        ? `Администратор ${userProfile.name}`
        : "Администратор";
    else if (currentRole === "director")
      senderName = userProfile.name
        ? `Директор ${userProfile.name}`
        : "Директор";
    else if (currentRole === "manager")
      senderName = userProfile.name
        ? `Менеджер ${userProfile.name}`
        : "Менеджер";

    addChatMessage({
      senderRole: currentRole,
      senderName,
      text: chatInput,
      visibleTo: chatVisibility,
    });
    setChatInput("");
  };

  const visibleMessages = messages.filter(
    (m) =>
      !m.visibleTo ||
      m.visibleTo.includes(currentRole) ||
      m.senderRole === currentRole,
  );

  const startAttendanceMarking = (groupId: string) => {
    setActiveTab("trainer_attendance");
    const groupObj = groups.find((g) => g.id === groupId || g.name === groupId);
    const resolvedName = groupObj ? groupObj.name : groupId;
    setSelectedGroupForAttendance(resolvedName);
    // Pre-populate actual client players in that group using case-insensitive trimmed matching
    const groupPlayersBase: any[] = groupObj?.isSelectTeam
      ? myClients.filter((c) => groupObj.selectedClientIds?.includes(c.id))
      : myClients.filter(
          (c) =>
            c.groupName &&
            resolvedName &&
            c.groupName.trim().toLowerCase() ===
              resolvedName.trim().toLowerCase(),
        );
    const groupTrialLeads = (leads || [])
      .filter(
        (l) =>
          l.status === "trial_booked" &&
          l.trialGroupId &&
          l.trialGroupId === groupObj?.id &&
          l.trialDate === new Date().toISOString().split("T")[0], // Only show trial on the exact trialDate
      )
      .map((l) => ({
        id: l.id,
        childName: l.childName,
        childSurname: l.childSurname,
        status: "trial" as const,
        isLead: true,
      }));

    const groupPlayers = [...groupPlayersBase, ...groupTrialLeads];

    const initialRecs: any = {};
    groupPlayers.forEach((p) => {
      initialRecs[p.id] = { status: null, reason: "" }; // default to nothing
    });
    setAttendanceRecords(initialRecs);
    setUploadedAttendancePhoto(null);
    setSessionNotes("");
  };

  const handleAttendanceChange = (
    playerId: string,
    status: "present" | "absent_sick" | "absent",
    reason = "",
  ) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [playerId]: { status, reason },
    }));
  };

  const submitAttendanceToCRM = () => {
    if (!selectedGroupForAttendance) return;
    
    if (!uploadedAttendancePhoto || !uploadedAttendancePhoto.startsWith("data:image")) {
      alert("Для отправки отчета необходимо прикрепить фотоотчет с тренировки!");
      return;
    }
    
    const formattedDate = "Сегодня";

    const clientRecords: {
      clientId: string;
      status: "present" | "absent_sick" | "absent" | "trial_free";
      reason?: string;
    }[] = [];

    let hasUnmarked = false;

    Object.keys(attendanceRecords).forEach((pid) => {
      if (!attendanceRecords[pid].status) {
        hasUnmarked = true;
      }
      
      const isLead = leads?.find((l) => l.id === pid);
      if (isLead && attendanceRecords[pid].status) {
        completeTrialAndMarkAttendance(
          pid,
          attendanceRecords[pid].status === "present",
          attendanceRecords[pid].reason || sessionNotes || "Отзыв не оставлен",
          selectedGroupForAttendance,
          myCoach.name,
          uploadedAttendancePhoto || undefined,
        );
      } else if (attendanceRecords[pid].status) {
        clientRecords.push({
          clientId: pid,
          status: attendanceRecords[pid].status as any,
          reason: attendanceRecords[pid].reason,
        });
      }
    });

    if (hasUnmarked) {
      alert("Пожалуйста, отметьте статус всех учеников в списке.");
      return;
    }

    markAttendance(
      selectedGroupForAttendance,
      formattedDate,
      clientRecords,
      uploadedAttendancePhoto || "фотоотчет_тренировки_сп.jpg",
      sessionNotes,
      selectedAssistantId || undefined
    );
    alert(
      "Ведомость посещаемости успешно сохранена и передана в бухгалтерию администрации!",
    );
    setSelectedGroupForAttendance(null);
    setSelectedAssistantId("");
  };

  const submitPlayerRating = () => {
    if (!selectedPlayerForRating) return;
    ratePlayer(selectedPlayerForRating, {
      technique: techniqueRating,
      tactics: tacticsRating,
      physical: physicalRating,
      discipline: disciplineRating,
    });
    alert("Спортивный отчет игрока успешно обновлен в его личном кабинете!");
    setSelectedPlayerForRating(null);
  };

  // Get today's active scheduled groups
  const shortDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const todayVal = new Date().getDay();
  const todayShortDay = shortDays[todayVal];

  const todaysGroups = myGroups
    .map((g) => {
      let todayTime: string | null = null;
      let todayLocation: string | undefined = undefined;

      const allParsed = g.scheduleDays.flatMap((s) => parseScheduleString(s));
      const todaySlot = allParsed.find((p) => p.day === todayShortDay);

      if (todaySlot) {
        todayTime = todaySlot.time;
        todayLocation = todaySlot.location;
      }

      if (todayTime) {
        return { ...g, todayTime, todayLocation };
      }
      return null;
    })
    .filter(
      (g): g is TrainingGroup & { todayTime: string; todayLocation?: string } =>
        g !== null,
    )
    .sort((a, b) => a.todayTime.localeCompare(b.todayTime));

  // Get current week attendance stats
  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0, Sun=6
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const weekDates = getWeekDates();
  const weekChartDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const mySessions =
    trainingSessions?.filter(
      (s) => s.coachId === myCoach.id || s.coachName.includes(myCoach.name),
    ) || [];

  const dailyAttendance = weekDates.map((date, idx) => {
    const dateStr =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");

    const daySessions = mySessions.filter(
      (s) =>
        s.dateString?.includes(dateStr) ||
        s.date?.includes(dateStr) ||
        s.dateString?.includes(date.toLocaleDateString("ru-RU")) ||
        s.date?.includes(date.toLocaleDateString("ru-RU")),
    );

    let totalPlayers = 0;
    let presentPlayers = 0;
    let isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    let isToday = date.toDateString() === new Date().toDateString();

    daySessions.forEach((session) => {
      totalPlayers +=
        session.presentCount + session.absentCount + session.sickCount;
      presentPlayers += session.presentCount;
    });

    let percentage = 0;
    if (totalPlayers > 0) {
      percentage = Math.round((presentPlayers / totalPlayers) * 100);
    }

    return {
      label: weekChartDays[idx],
      percentage,
      hasData: totalPlayers > 0,
      isPast,
      isToday,
    };
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      {/* Header element */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            Добрый день,{" "}
            {(() => {
              const parts = myCoach.name.trim().split(/\s+/);
              if (
                myCoach.name.includes("Пьянченко") &&
                !myCoach.name.includes("Василий")
              ) {
                return "Василий Пьянченко";
              }
              if (parts.length >= 2) {
                return `${parts[1]} ${parts[0]}`; // Имя Фамилия
              }
              return myCoach.name;
            })()}
            !
          </h1>
          <p className="text-gray-500 text-sm">
            Панель управления тренера. Координируйте нагрузку и оценивайте
            результаты учеников.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-155 px-4 py-2 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <div className="text-xs text-left">
            <span className="font-extrabold text-emerald-700">
              {myCoach.role}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        <BirthdaysBanner clients={clients} />

        {/* TAB 1: DASHBOARD OVERVIEW (МАТЧИТ ИЗОБРАЖЕНИЕ №3) */}
        {activeTab === "trainer_home" && (
          <div id="trainer-main-dashboard" className="space-y-6">
            {/* Top stats boxes exactly like on Image 3 */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                  Мои группы
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {myGroups.length}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {myGroups.reduce((acc, g) => acc + g.playersCount, 0)} игроков
                  закреплено
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                  Тренировок в неделю
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {myGroups.reduce(
                    (acc, g) => acc + (g.scheduleDays?.length || 0),
                    0,
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  В соответствии с расписанием
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                  Ср. посещаемость
                </span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {(() => {
                    const mySessions = (trainingSessions || []).filter(
                      (s) =>
                        s.coachId === myCoach.id ||
                        s.coachName.includes(myCoach.name),
                    );
                    if (mySessions.length === 0) return "87%";
                    const totalPlayers = mySessions.reduce(
                      (sum, s) =>
                        sum + s.presentCount + s.sickCount + s.absentCount,
                      0,
                    );
                    const present = mySessions.reduce(
                      (sum, s) => sum + s.presentCount,
                      0,
                    );
                    return totalPlayers > 0
                      ? `${Math.round((present / totalPlayers) * 100)}%`
                      : "0%";
                  })()}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5 font-bold">
                  На основе{" "}
                  {trainingSessions?.filter(
                    (s) =>
                      s.coachId === myCoach.id ||
                      s.coachName.includes(myCoach.name),
                  ).length || 0}{" "}
                  табелей
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                  Оценка игроков
                </span>
                <div className="text-2xl font-black text-amber-500 mt-1">
                  {(() => {
                    const localMyClients = myClients.filter((c) =>
                      myGroups.some((g) => g.name === c.groupName),
                    );
                    if (localMyClients.length === 0) return "0.0";
                    let totalScore = 0;
                    localMyClients.forEach((c) => {
                      totalScore +=
                        ((c.progress?.technique || 0) +
                          (c.progress?.tactics || 0) +
                          (c.progress?.physical || 0) +
                          (c.progress?.discipline || 0)) /
                        4;
                    });
                    return (totalScore / localMyClients.length).toFixed(1);
                  })()}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Средний балл ваших групп
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs col-span-2 lg:col-span-1 text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                  Задачи на день
                </span>
                <div className="text-2xl font-black text-emerald-650 text-emerald-600 mt-1">
                  {coachTasks.filter((t) => t.status !== "completed").length}
                </div>
                <div className="text-[10px] text-orange-500 font-bold">
                  {
                    coachTasks.filter(
                      (t) =>
                        t.status !== "completed" &&
                        new Date(t.dueDate) < new Date(),
                    ).length
                  }{" "}
                  просрочено
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left col: Today Schedule, Attendance Chart, Tasks */}
              <div className="space-y-6">
                {/* Расписание на сегодня */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Расписание на сегодня
                    </h3>
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date().toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          weekday: "long",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {todaysGroups.length > 0 ? (
                      todaysGroups.map((g) => {
                        let endTimeStr = "18:30";
                        if (g.todayTime && g.todayTime.includes(":")) {
                          const [hh, mm] = g.todayTime.split(":");
                          const endH = (parseInt(hh, 10) + 1)
                            .toString()
                            .padStart(2, "0");
                          endTimeStr = `${endH}:${mm}`;
                        } else if (g.todayTime && g.todayTime.includes("-")) {
                          endTimeStr = g.todayTime.split("-")[1].trim();
                          g.todayTime = g.todayTime.split("-")[0].trim();
                        }
                        return (
                          <div
                            key={g.id}
                            className="p-0 border-b last:border-0 border-gray-100 flex items-center justify-between py-3"
                          >
                            <div className="w-24 text-left">
                              <div className="text-xs font-bold font-mono text-slate-800">
                                {g.todayTime} – {endTimeStr}
                              </div>
                              {g.todayLocation && (
                                <div className="text-[10px] text-gray-400 mt-1 truncate">
                                  {g.todayLocation}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 px-4 text-left">
                              <div className="font-bold text-slate-850 text-xs">
                                {g.name}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                Тренировка
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-bold text-slate-700">
                                {g.playersCount} игроков
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-400 font-semibold">
                        Нет назначенных групп или тренировок на сегодня.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => setActiveTab("trainer_schedule")}
                      className="flex items-center space-x-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Перейти к расписанию</span>
                    </button>
                  </div>
                </div>

                {/* Посещаемость на этой неделе (ЧАрт) */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="font-extrabold text-slate-950 text-sm mb-4">
                      Посещаемость на этой неделе
                    </h3>
                    <div className="flex items-end justify-between h-32 pl-2">
                      {dailyAttendance.map((day, i) => (
                        <div
                          key={i}
                          className="w-8 flex flex-col items-center gap-2"
                        >
                          <span
                            className={`text-[9px] font-bold ${!day.hasData && !day.isPast ? "text-transparent" : day.percentage > 0 ? (day.isToday ? "text-emerald-500" : "text-slate-600") : "text-gray-400"}`}
                          >
                            {day.hasData
                              ? `${day.percentage}%`
                              : day.isPast
                                ? "0%"
                                : "-"}
                          </span>
                          <div
                            className={`w-full rounded-t-sm transition-all duration-500 ${day.hasData ? (day.isToday ? "bg-emerald-500" : "bg-slate-700") : day.isPast ? "bg-gray-200" : "bg-gray-100"}`}
                            style={{
                              height: day.hasData
                                ? `${day.percentage}%`
                                : day.isPast
                                  ? "5%"
                                  : "50%",
                              opacity: !day.hasData && !day.isPast ? 0.3 : 1,
                            }}
                          ></div>
                          <span
                            className={`text-[10px] font-bold ${day.isToday ? "text-emerald-600" : "text-gray-500"}`}
                          >
                            {day.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-px bg-gray-100 hidden md:block"></div>
                  <div className="w-full md:w-32 flex flex-col justify-center space-y-4">
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        Ср. посещаемость (нед)
                      </div>
                      <div className="text-2xl font-black text-slate-900 leading-none">
                        {(() => {
                          const validDays = dailyAttendance.filter(
                            (d) => d.hasData,
                          );
                          if (validDays.length === 0) return "0%";
                          const avg =
                            validDays.reduce(
                              (sum, d) => sum + d.percentage,
                              0,
                            ) / validDays.length;
                          return `${Math.round(avg)}%`;
                        })()}
                      </div>
                      <div className="text-[9px] font-bold text-emerald-500 mt-1">
                        +5% к прошлой неделе
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        Всего тренировок
                      </div>
                      <div className="text-xl font-bold text-slate-800 leading-none">
                        6
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        Всего посещений
                      </div>
                      <div className="text-sm font-bold text-slate-800 leading-none">
                        92 из 106
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklists CRM Tasks */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Задачи
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {coachTasks.map((t, idx) => {
                      const isOverdue =
                        new Date(t.dueDate) < new Date() &&
                        t.status !== "completed";
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50 group"
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                completeTask(t.id);
                                alert(
                                  `Задача "${t.title}" отмечена решенной! Руководство получит сведения.`,
                                );
                              }}
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                t.status === "completed"
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {t.status === "completed" && (
                                <Check className="w-2.5 h-2.5" />
                              )}
                            </button>
                            <div className="space-y-0.5">
                              <div
                                className={`font-semibold ${t.status === "completed" ? "line-through text-gray-400" : "text-slate-800"}`}
                              >
                                {t.title}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                Группа {idx % 2 === 0 ? "2014" : "2015"}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`text-[10px] font-bold ${isOverdue ? "text-rose-500" : "text-gray-500"}`}
                          >
                            {isOverdue ? "Просрочено" : `До ${t.dueDate}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <span className="text-[11px] font-bold text-gray-500 hover:text-gray-800 cursor-pointer flex items-center">
                      Все задачи <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Right column: Groups, Ratings, Files */}
              <div className="space-y-6">
                {/* My Groups List - Image 3 right */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Мои группы
                    </h3>
                    <span
                      onClick={() => setActiveTab("trainer_groups")}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Все группы
                    </span>
                  </div>

                  <div className="space-y-2">
                    {myGroups.map((grp, idx) => {
                      const colors = [
                        "bg-emerald-100 text-emerald-800",
                        "bg-blue-100 text-blue-800",
                        "bg-amber-100 text-amber-800",
                        "bg-purple-100 text-purple-800",
                      ];
                      const badgeColor = colors[idx % colors.length];
                      return (
                        <div
                          key={idx}
                          className="py-3 border-b border-gray-50 last:border-0 flex justify-between items-center group cursor-pointer hover:bg-slate-50 transition px-2 rounded-lg -mx-2"
                        >
                          <div className="flex items-center space-x-3 text-left w-1/3">
                            <span
                              className={`px-2 py-1 rounded font-bold text-[10px] ${badgeColor}`}
                            >
                              {grp.year}
                            </span>
                            <div className="space-y-0.5 max-w-[120px]">
                              <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1">
                                {grp.isSelectTeam && (
                                  <Trophy className="w-3 h-3 text-orange-500 shrink-0" />
                                )}
                                <span className="truncate">{grp.name}</span>
                              </div>
                              <div className="text-[9px] text-gray-400">
                                Тренировка сегодня, 17:00
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-4 flex-1 justify-end items-center text-xs">
                            <div className="text-left w-12 hidden sm:block">
                              <div className="font-bold text-slate-800 text-[11px]">
                                {grp.playersCount}
                              </div>
                              <div className="text-[9px] text-gray-400">
                                Игроков
                              </div>
                            </div>
                            <div className="text-left w-20 hidden lg:block">
                              <div className="font-bold text-slate-800 text-[11px]">
                                {grp.attendanceRate}%
                              </div>
                              <div className="text-[9px] text-gray-400">
                                Посещаемость
                              </div>
                            </div>
                            <div className="text-left w-12">
                              <div className="font-bold text-slate-800 text-[11px]">
                                4.{8 - idx}
                              </div>
                              <div className="text-[9px] text-gray-400">
                                Оценка
                              </div>
                            </div>
                            <button className="text-gray-300 hover:text-gray-600 font-bold px-1">
                              ⋮
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 flex justify-center border-t border-gray-50">
                    <span
                      onClick={() => setActiveTab("trainer_groups")}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center mt-2"
                    >
                      Перейти ко всем группам{" "}
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </div>

                {/* Last ratings list */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Последние оценки игроков
                    </h3>
                    <span
                      onClick={() => setActiveTab("trainer_progress")}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Все игроки
                    </span>
                  </div>

                  <div className="space-y-1 text-left">
                    {myClients
                      .filter((c) => c.status === "active")
                      .slice(0, 3)
                      .map((item, id) => {
                        const avg = (
                          ((item.progress?.technique || 0) +
                            (item.progress?.tactics || 0) +
                            (item.progress?.physical || 0) +
                            (item.progress?.discipline || 0)) /
                          4
                        ).toFixed(1);
                        return (
                          <div
                            key={id}
                            className="py-2.5 px-2 -mx-2 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer border-b last:border-0 border-gray-50"
                            onClick={() => {
                              setActiveTab("trainer_progress");
                              setSelectedPlayerForRating(item.id);
                            }}
                          >
                            <div className="flex items-center space-x-3 w-1/3">
                              {item.avatarUrl ? (
                                <img
                                  src={item.avatarUrl}
                                  alt="avatar"
                                  className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold text-[10px] uppercase">
                                  {item.childSurname?.[0]}
                                  {item.childName?.[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-800 text-xs">
                                  {item.childSurname} {item.childName}
                                </div>
                                <div className="text-[9px] text-gray-400 font-medium">
                                  {item.groupName}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 w-10">
                              <span className="font-bold text-emerald-600 text-xs">
                                {avg}
                              </span>
                            </div>

                            <div className="hidden sm:flex text-[9px] text-gray-500 w-16">
                              {id === 0
                                ? "Дисциплина"
                                : id === 1
                                  ? "Техника"
                                  : "Тактика"}
                            </div>

                            <div className="flex items-center space-x-1 w-8">
                              <span className="font-bold text-slate-800 text-[11px]">
                                4.{8 - id}
                              </span>
                            </div>

                            <div className="hidden lg:flex text-[9px] text-gray-400 truncate w-24">
                              {id === 0
                                ? "Физ. подготовка"
                                : id === 1
                                  ? "Обход фишек"
                                  : "Игра в защите"}
                            </div>

                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Downloads library - Image 3 right bottom */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Последние файлы и материалы
                    </h3>
                    <span
                      onClick={() => setActiveTab("trainer_knowledge")}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Все материалы
                    </span>
                  </div>

                  <div className="space-y-4 w-full relative">
                    {[
                      {
                        name: "План тренировки 21.05.2025",
                        size: "PDF • 245 КБ",
                        date: "Загружено сегодня",
                      },
                      {
                        name: "Упражнения на владение мячом",
                        size: "PDF • 1.2 МБ",
                        date: "Загружено вчера",
                      },
                      {
                        name: "Методика для тренеров",
                        size: "PDF • 3.4 МБ",
                        date: "Загружено 18.05.2025",
                      },
                    ].map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 w-4/5 pb-2 border-b last:border-0 border-gray-50"
                      >
                        <div className="w-8 h-8 rounded bg-rose-50 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-black text-rose-600">
                            PDF
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div
                            className="font-bold text-slate-800 text-xs truncate"
                            title={file.name}
                          >
                            {file.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {file.size} • {file.date}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setActiveTab("trainer_knowledge")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-300/50 hover:bg-slate-300 flex items-center justify-center transition border-2 border-white shadow-lg"
                    >
                      <Upload className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === "trainer_schedule" && (
          <div className="bg-white rounded-2xl p-0 border border-slate-200 overflow-hidden shadow-sm">
            <ScheduleCalendar filteredCoachId={myCoach.id} />
          </div>
        )}

        {/* TAB 3: ATTENDANCE POPUP/WIDGET */}
        {activeTab === "trainer_attendance" && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">
              Ведомости присутствия на занятии
            </h3>

            {!selectedGroupForAttendance ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Выберите группу для составления электронного табеля
                  посещаемости за сегодня:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {myGroups.map((g, idx) => {
                    const colors = [
                      "border-emerald-100 hover:border-emerald-500/50 hover:bg-emerald-50",
                      "border-blue-100 hover:border-blue-500/50 hover:bg-blue-50",
                      "border-amber-100 hover:border-amber-500/50 hover:bg-amber-50",
                      "border-purple-100 hover:border-purple-500/50 hover:bg-purple-50",
                    ];
                    const colorClass = colors[idx % colors.length];
                    return (
                      <div
                        key={idx}
                        className={`p-5 bg-white border-2 rounded-2xl transition cursor-pointer flex flex-col justify-between ${colorClass}`}
                        onClick={() => startAttendanceMarking(g.id)}
                      >
                        <div className="mb-4">
                          <div className="font-black text-slate-900 text-lg">
                            {g.name}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            Обучается:{" "}
                            <span className="font-black text-slate-700">
                              {g.playersCount}
                            </span>{" "}
                            воспитанников
                          </p>
                        </div>
                        <button className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] uppercase tracking-wider transition">
                          Заполнить табель
                        </button>
                      </div>
                    );
                  })}
                  {myGroups.length === 0 && (
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 p-10 text-center bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">
                        Нет закрепленных групп
                      </h4>
                      <p className="text-xs text-gray-500">
                        У вас пока нет групп для проведения тренировок.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-150 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">
                    Вы зашли в табель {selectedGroupForAttendance} — Сегодня
                  </span>
                  <button
                    onClick={() => setSelectedGroupForAttendance(null)}
                    className="text-xs focus:underline text-slate-500 font-bold"
                  >
                    Вернуться назад
                  </button>
                </div>

                {/* Submitting attendance controls with real photo upload validation simulation */}
                <div className="p-5 bg-white border border-gray-150 rounded-2xl space-y-4 shadow-sm text-left">
                  <div className="font-extrabold text-slate-900 text-xs flex items-center space-x-2">
                    <Camera className="w-4.5 h-4.5 text-emerald-600" />
                    <span>
                      Фиксация достоверности (Фотоотчет проведенной тренировки)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Для автоматического подтверждения тренировки и формирования расчета аренды прикрепите снимок построения группы, сделанный на площадке:
                  </p>

                  {/* Upload File Option */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-center pt-2">
                    <label className="flex-1 w-full bg-slate-50 border border-gray-200 rounded-lg shrink-0 cursor-pointer hover:bg-slate-100 transition relative">
                      <div className="flex items-center px-4 py-3">
                        <Camera className="w-5 h-5 text-slate-400 mr-2" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">
                            Сделать или загрузить фото с устройства
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Только фото, подтверждающее присутствие группы
                          </span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImage(file, (base64) =>
                              setUploadedAttendancePhoto(base64),
                            );
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setUploadedAttendancePhoto(null)}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition shrink-0 h-full"
                    >
                      Сбросить фото
                    </button>
                  </div>

                  {uploadedAttendancePhoto &&
                    uploadedAttendancePhoto.startsWith("data:image") && (
                      <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={uploadedAttendancePhoto}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-bold">
                          ФОТО ЗАГРУЖЕНО
                        </div>
                      </div>
                    )}

                  <div className="text-xs font-mono text-gray-500 py-1 flex items-center justify-between">
                    <span>
                      {uploadedAttendancePhoto
                        ? "✅ Фото с тренировки загружено и прикреплено к отчету"
                        : "⚠️ Отчет не может быть отправлен без фотоподтверждения"}
                    </span>
                  </div>
                </div>

                {/* Players state check-sheet */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      Список воспитанников
                    </h4>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {(() => {
                      const groupObj = groups.find(
                        (g) => g.name === selectedGroupForAttendance,
                      );
                      const groupPlayersBase: any[] = groupObj?.isSelectTeam
                        ? myClients.filter((c) =>
                            groupObj.selectedClientIds?.includes(c.id),
                          )
                        : myClients.filter((c) => {
                            const cGroup = c.groupName?.trim().toLowerCase();
                            const sGroup = selectedGroupForAttendance
                              ?.trim()
                              .toLowerCase();
                            return !!cGroup && !!sGroup && cGroup === sGroup;
                          });
                      const groupTrialLeads = (leads || [])
                        .filter(
                          (l) =>
                            l.status === "trial_booked" &&
                            l.trialGroupId &&
                            l.trialGroupId === groupObj?.id &&
                            l.trialDate ===
                              new Date().toISOString().split("T")[0],
                        )
                        .map((l) => ({
                          id: l.id,
                          childName: l.childName,
                          childSurname: l.childSurname,
                          status: "trial" as const,
                          isLead: true,
                        }));
                      const allPlayers = [
                        ...groupPlayersBase,
                        ...groupTrialLeads,
                      ].sort((a, b) => {
                        const nameA = `${a.childSurname} ${a.childName}`
                          .trim()
                          .toLowerCase();
                        const nameB = `${b.childSurname} ${b.childName}`
                          .trim()
                          .toLowerCase();
                        return nameA.localeCompare(nameB, "ru");
                      });

                      const stats = {
                        present: Object.values(attendanceRecords).filter(
                          (r) => r.status === "present",
                        ).length,
                        sick: Object.values(attendanceRecords).filter(
                          (r) => r.status === "absent_sick",
                        ).length,
                        absent: Object.values(attendanceRecords).filter(
                          (r) => r.status === "absent",
                        ).length,
                        trial: Object.values(attendanceRecords).filter(
                          (r) => r.status === "trial_free",
                        ).length,
                      };

                      return (
                        <>
                          <div className="bg-slate-900 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between text-white border shadow-sm mb-2">
                            <div className="text-center bg-white/10 px-3 py-2 rounded-lg flex-1 min-w-[80px]">
                              <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                                Присутствуют
                              </div>
                              <div className="text-lg font-black">
                                {stats.present}
                              </div>
                            </div>
                            <div className="text-center bg-white/10 px-3 py-2 rounded-lg flex-1 min-w-[80px]">
                              <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                                Отсутствуют
                              </div>
                              <div className="text-lg font-black">
                                {stats.sick}
                              </div>
                            </div>
                            <div className="text-center bg-white/10 px-3 py-2 rounded-lg flex-1 min-w-[80px]">
                              <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                                Пробные
                              </div>
                              <div className="text-lg font-black">
                                {stats.trial}
                              </div>
                            </div>
                            <div className="text-center bg-red-500/20 px-3 py-2 rounded-lg flex-1 min-w-[80px]">
                              <div className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
                                Без причины
                              </div>
                              <div className="text-lg font-black text-red-400">
                                {stats.absent}
                              </div>
                            </div>
                          </div>

                          {allPlayers.map((p, i) => {
                            const isTrial = p.status === "trial";
                            return (
                              <div
                                key={i}
                                className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition"
                              >
                                <div className="flex items-center space-x-3 w-1/3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 flex items-center justify-center font-bold text-slate-400">
                                    {p.childSurname.charAt(0)}
                                    {p.childName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-850 text-sm">
                                      {p.childSurname} {p.childName}
                                    </div>
                                    {isTrial && (
                                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[9px] font-black uppercase tracking-wider">
                                        ПРОБНОЕ ЗАНЯТИЕ
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleAttendanceChange(p.id, "present")
                                    }
                                    className={`px-4 py-2 rounded-xl font-bold text-xs ring-1 transition ${
                                      attendanceRecords[p.id]?.status ===
                                      "present"
                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-500 shadow-sm"
                                        : "bg-white text-gray-500 ring-gray-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    Присутствовал
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAttendanceChange(
                                        p.id,
                                        "absent_sick",
                                      )
                                    }
                                    className={`px-4 py-2 rounded-xl font-bold text-xs ring-1 transition ${
                                      attendanceRecords[p.id]?.status ===
                                      "absent_sick"
                                        ? "bg-blue-50 text-blue-700 ring-blue-500 shadow-sm"
                                        : "bg-white text-gray-500 ring-gray-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    По болезни
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAttendanceChange(p.id, "absent")
                                    }
                                    className={`px-4 py-2 rounded-xl font-bold text-xs ring-1 transition ${
                                      attendanceRecords[p.id]?.status ===
                                      "absent"
                                        ? "bg-amber-50 text-amber-700 ring-amber-500 shadow-sm"
                                        : "bg-white text-gray-500 ring-gray-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    Неявка
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAttendanceChange(p.id, "trial_free")
                                    }
                                    className={`px-4 py-2 rounded-xl font-bold text-xs ring-1 transition ${
                                      attendanceRecords[p.id]?.status ===
                                      "trial_free"
                                        ? "bg-purple-50 text-purple-700 ring-purple-500 shadow-sm"
                                        : "bg-white text-gray-500 ring-gray-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    Пробное / БП
                                  </button>

                                  <AnimatePresence>
                                    {(attendanceRecords[p.id]?.status ===
                                      "absent" ||
                                      attendanceRecords[p.id]?.status ===
                                        "absent_sick") && (
                                      <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <input
                                          type="text"
                                          placeholder="Уточните причину или приложите ссылку на справку..."
                                          value={
                                            attendanceRecords[p.id]?.reason ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleAttendanceChange(
                                              p.id,
                                              attendanceRecords[p.id]
                                                ?.status as any,
                                              e.target.value,
                                            )
                                          }
                                          className="px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-[11px] w-48 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-shadow"
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-extrabold text-slate-800 text-sm text-left mt-4 border-t pt-6">
                    Ассистент на тренировке (если был)
                  </h4>
                  <select 
                    value={selectedAssistantId} 
                    onChange={e => setSelectedAssistantId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                  >
                    <option value="">Без ассистента</option>
                    {coaches.filter(c => c.id !== myCoach.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-extrabold text-slate-800 text-sm text-left mt-4 border-t pt-6">
                    Заметки о тренировке (для директора)
                  </h4>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Например: Отрабатывали удары по воротам. Все молодцы, Иванов И. отличился..."
                    className="w-full h-24 p-4 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none shadow-sm"
                  ></textarea>
                </div>

                <div className="flex space-x-3.5 pt-4">
                  <button
                    onClick={submitAttendanceToCRM}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition shadow-sm uppercase tracking-wider"
                  >
                    Завершить и отправить ведомость
                  </button>
                  <button
                    onClick={() => setSelectedGroupForAttendance(null)}
                    className="px-6 py-3 bg-white border border-gray-200 text-slate-600 hover:bg-slate-50 font-bold rounded-2xl text-xs uppercase tracking-wider transition"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PLAYER RATING */}
        {activeTab === "trainer_progress" && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">
              Оценка успеваемости и геймификация
            </h3>
            <p className="text-xs text-gray-505">
              Выберите ученика для внесения профессиональных оценок спортивных
              качеств:
            </p>

            {!selectedPlayerForRating ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {myClients
                  .filter((c) => c.status === "active")
                  .map((player, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPlayerForRating(player.id);
                        setTechniqueRating(player.progress?.technique || 4.5);
                        setTacticsRating(player.progress?.tactics || 4.5);
                        setPhysicalRating(player.progress?.physical || 4.5);
                        setDisciplineRating(player.progress?.discipline || 4.5);
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl cursor-pointer border text-left flex items-center justify-between transition group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 text-xs">
                          {player.childSurname} {player.childName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {player.groupName}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border rounded-xl max-w-xl mx-auto space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Панель оценки:{" "}
                    {
                      clients.find((c) => c.id === selectedPlayerForRating)
                        ?.childSurname
                    }{" "}
                    {
                      clients.find((c) => c.id === selectedPlayerForRating)
                        ?.childName
                    }
                  </h4>
                  <button
                    onClick={() => setSelectedPlayerForRating(null)}
                    className="text-xs text-gray-400 font-bold"
                  >
                    Закрыть
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {[
                    {
                      label:
                        "Технические навыки (дриблинг, ведение, пас, удар)",
                      value: techniqueRating,
                      setter: setTechniqueRating,
                    },
                    {
                      label:
                        "Тактическое понимание (выбор позиции, игра в пас)",
                      value: tacticsRating,
                      setter: setTacticsRating,
                    },
                    {
                      label:
                        "Физическая подготовка (выносливость, скорость, координация)",
                      value: physicalRating,
                      setter: setPhysicalRating,
                    },
                    {
                      label: "Дисциплина (соблюдение правил, слушает тренера)",
                      value: disciplineRating,
                      setter: setDisciplineRating,
                    },
                  ].map((field, id) => (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-600">{field.label}</span>
                        <span className="text-emerald-600 underline font-mono">
                          {field.value.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={field.value}
                        onChange={(e) =>
                          field.setter(parseFloat(e.target.value))
                        }
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3.5 pt-3.5 border-t">
                  <button
                    onClick={submitPlayerRating}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold"
                  >
                    Утвердить новые оценки
                  </button>
                  <button
                    onClick={() => setSelectedPlayerForRating(null)}
                    className="px-4 py-2 bg-slate-300 rounded-lg text-slate-700 font-bold"
                  >
                    Назад
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: MESSAGES CHAT */}
        {activeTab === "trainer_messages" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[520px] overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 border rounded-full flex items-center justify-center font-bold">
                  Ч
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Общий чат тренеров и администрации
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Безопасный корпоративный канал связи
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                В сети
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 text-xs">
              {visibleMessages.map((ms, id) => {
                const isMe = ms.senderRole === currentRole;
                return (
                  <div
                    key={id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md p-3 rounded-2xl group ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 border rounded-bl-none"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[9px] opacity-80 font-bold">
                        <span>{ms.senderName}</span>
                        <div className="flex items-center space-x-2">
                          {isMe && (
                            <div className="hidden group-hover:flex items-center space-x-1 mr-2 bg-indigo-500/50 rounded px-1">
                              <button
                                onClick={() => {
                                  setEditingMessageId(ms.id);
                                  setEditMessageText(ms.text);
                                }}
                                className="p-1 hover:text-white transition"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteChatMessage(ms.id)}
                                className="p-1 hover:text-rose-200 transition"
                              >
                                <Trash className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                          <span className="font-mono">{ms.timestamp}</span>
                        </div>
                      </div>

                      {editingMessageId === ms.id ? (
                        <div className="flex flex-col space-y-2 mt-2">
                          <input
                            type="text"
                            className="text-xs px-2 py-1 bg-white text-gray-800 rounded outline-none w-full"
                            value={editMessageText}
                            onChange={(e) => setEditMessageText(e.target.value)}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="text-[10px] bg-white/20 px-2 py-1 rounded"
                            >
                              Отмена
                            </button>
                            <button
                              onClick={() => {
                                updateChatMessage(ms.id, editMessageText);
                                setEditingMessageId(null);
                              }}
                              className="text-[10px] bg-white text-indigo-600 font-bold px-2 py-1 rounded"
                            >
                              Сохр.
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="leading-relaxed text-left">{ms.text}</p>
                      )}

                      {isMe && ms.visibleTo && (
                        <div className="mt-1 text-[8px] opacity-60 text-left">
                          Видно:{" "}
                          {ms.visibleTo
                            .map((r) =>
                              r === "director"
                                ? "Директор"
                                : r === "manager"
                                  ? "Менеджер"
                                  : r === "trainer"
                                    ? "Тренер"
                                    : r === "parent"
                                      ? "Родители"
                                      : r,
                            )
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border-t">
              <div className="px-3 py-2 flex items-center space-x-3 text-[10px] text-slate-500 border-b border-gray-50 overflow-x-auto">
                <span className="font-semibold shrink-0">Видят:</span>
                {(["manager", "parent", "director"] as const).map((role) => (
                  <label
                    key={role}
                    className="flex items-center space-x-1 cursor-pointer whitespace-nowrap"
                  >
                    <input
                      type="checkbox"
                      checked={chatVisibility.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setChatVisibility([...chatVisibility, role]);
                        else
                          setChatVisibility(
                            chatVisibility.filter((r) => r !== role),
                          );
                      }}
                      className="rounded text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>
                      {role === "manager"
                        ? "Менеджеры"
                        : role === "parent"
                          ? "Родители"
                          : "Директор"}
                    </span>
                  </label>
                ))}
              </div>
              <form
                onSubmit={handleSendChat}
                className="p-3 flex items-center space-x-2"
              >
                <input
                  type="text"
                  placeholder="Обсудить спортивные показатели, задолженности или планы тренировок..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-100 focus:bg-white border rounded-xl text-xs outline-none"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 9: TRAINER GROUPS */}
        {activeTab === "trainer_groups" && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left space-y-4">
            {!selectedGroupId ? (
              <>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Детальная информация о моих группах
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        window.location.origin + "/register",
                      );
                      alert(
                        "Ссылка для родителей скопирована: " +
                          window.location.origin +
                          "/register\nОтправьте её родителям для создания профиля.",
                      );
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all shadow-sm flex items-center space-x-1"
                    title="Скопировать ссылку-приглашение для родителей"
                  >
                    <span>🔗 Пригласить родителей</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGroups.map((grp, idx) => (
                    <div
                      key={idx}
                      className="p-5 border rounded-2xl bg-white shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-slate-900 text-lg mb-1 flex items-center gap-1.5">
                            {grp.isSelectTeam && (
                              <Trophy className="w-4 h-4 text-orange-500" />
                            )}
                            {grp.name}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            Год рождения: {grp.year}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                          Активна
                        </span>
                      </div>

                      <div className="space-y-3 pt-3 border-t text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Кол-во игроков:</span>
                          <span className="font-bold text-slate-800">
                            {grp.isSelectTeam
                              ? clients.filter((c) =>
                                  grp.selectedClientIds?.includes(c.id),
                                ).length
                              : clients.filter((c) => c.groupName === grp.name)
                                  .length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Посещаемость:</span>
                          <span className="font-bold text-emerald-600">
                            {grp.attendanceRate}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Расписание:</span>
                          <span className="font-bold text-slate-800">
                            {grp.scheduleDays.join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t flex space-x-2">
                        <button
                          onClick={() => setSelectedGroupId(grp.id)}
                          className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-xl hover:bg-slate-200 transition"
                        >
                          Состав группы
                        </button>
                        <button
                          onClick={() => startAttendanceMarking(grp.id)}
                          className="flex-1 bg-slate-900 text-white text-xs font-bold py-2 rounded-xl hover:bg-slate-800 transition"
                        >
                          Посещения
                        </button>
                      </div>
                    </div>
                  ))}
                  {myGroups.length === 0 && (
                    <div className="col-span-1 md:col-span-2 p-8 text-center bg-slate-50 rounded-2xl text-gray-500">
                      У вас пока нет закрепленных групп.
                    </div>
                  )}
                </div>
              </>
            ) : (
              (() => {
                const grp = myGroups.find((g) => g.id === selectedGroupId);
                if (!grp) return null;
                const groupPlayers = (
                  grp.isSelectTeam
                    ? clients.filter((c) =>
                        grp.selectedClientIds?.includes(c.id),
                      )
                    : clients.filter((c) => c.groupName === grp.name)
                ).sort((a, b) => {
                  const nameA = `${a.childSurname} ${a.childName}`
                    .trim()
                    .toLowerCase();
                  const nameB = `${b.childSurname} ${b.childName}`
                    .trim()
                    .toLowerCase();
                  return nameA.localeCompare(nameB, "ru");
                });

                return (
                  <div className="space-y-4">
                    <button
                      onClick={() => setSelectedGroupId(null)}
                      className="text-xs font-bold text-gray-500 hover:text-slate-900 transition flex items-center space-x-1"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span>Назад к списку групп</span>
                    </button>

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 gap-3">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          {grp.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Год рождения: {grp.year} &bull; Тренер: {myCoach.name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowAddPlayerModal(true)}
                          className="px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-650 hover:bg-emerald-100 font-bold text-[11px] rounded-xl transition flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Добавить ученика</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {groupPlayers.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-xs bg-slate-50 border rounded-2xl">
                          В этой группе пока нет учеников.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {groupPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3 relative"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex space-x-3 items-center">
                                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
                                    {player.childSurname[0]}
                                    {player.childName[0]}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm leading-tight">
                                      {player.childSurname} {player.childName}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                      {player.childAge} лет (
                                      {player.childBirthYear} г.р.)
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        `Вы уверены, что хотите исключить ${player.childName} из группы?`,
                                      )
                                    ) {
                                      await updateClient(player.id, {
                                        groupName: null,
                                      });
                                    }
                                  }}
                                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Исключить из группы"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>

                              {editingPlayerId === player.id ? (
                                <div className="bg-slate-50 rounded-xl p-3 border space-y-2 mt-2">
                                  <textarea
                                    className="w-full text-xs p-2.5 bg-white border rounded-xl resize-none outline-none focus:ring-1 focus:ring-emerald-500"
                                    rows={3}
                                    placeholder="Сделать заметку тренера..."
                                    value={editPlayerNotes}
                                    onChange={(e) =>
                                      setEditPlayerNotes(e.target.value)
                                    }
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => setEditingPlayerId(null)}
                                      className="px-3 py-1.5 bg-white border text-gray-500 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition"
                                    >
                                      Отмена
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await updateClient(player.id, {
                                          notes: editPlayerNotes,
                                        });
                                        setEditingPlayerId(null);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition"
                                    >
                                      Сохранить
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-600 bg-slate-50 hover:bg-slate-100/50 p-2.5 rounded-xl border flex justify-between items-start min-h-[60px] cursor-text">
                                  <span
                                    className={
                                      player.notes
                                        ? "leading-relaxed"
                                        : "text-gray-400 italic"
                                    }
                                  >
                                    {player.notes ||
                                      "Нет заметок по ученику. Нажмите, чтобы добавить."}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingPlayerId(player.id);
                                      setEditPlayerNotes(player.notes || "");
                                    }}
                                    className="p-1 text-gray-400 hover:text-emerald-600 transition flex-shrink-0"
                                    title="Редактировать заметки"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Modal for Adding players to Group */}
            <AnimatePresence>
              {showAddPlayerModal &&
                selectedGroupId &&
                (() => {
                  const grp = myGroups.find((g) => g.id === selectedGroupId);
                  // Potential players: without group or in other group.
                  const unassignedPlayers = clients
                    .filter(
                      (c) =>
                        c.groupName !== grp?.name &&
                        (c.childName
                          .toLowerCase()
                          .includes(addPlayerSearch.toLowerCase()) ||
                          c.childSurname
                            .toLowerCase()
                            .includes(addPlayerSearch.toLowerCase())),
                    )
                    .sort((a, b) => {
                      const nameA = `${a.childSurname} ${a.childName}`
                        .trim()
                        .toLowerCase();
                      const nameB = `${b.childSurname} ${b.childName}`
                        .trim()
                        .toLowerCase();
                      return nameA.localeCompare(nameB, "ru");
                    });

                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                      >
                        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                          <h3 className="font-extrabold text-slate-900 text-[13px] uppercase tracking-wider">
                            Добавить ученика в {grp?.name}
                          </h3>
                          <button
                            onClick={() => setShowAddPlayerModal(false)}
                            className="text-gray-400 hover:text-slate-900 transition"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              ></path>
                            </svg>
                          </button>
                        </div>

                        <div className="p-4 border-b">
                          <input
                            type="text"
                            placeholder="Поиск по имени или фамилии..."
                            className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                            value={addPlayerSearch}
                            onChange={(e) => setAddPlayerSearch(e.target.value)}
                          />
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                          {unassignedPlayers.length === 0 ? (
                            <p className="text-center text-xs text-gray-500 py-4">
                              Не найдено подходящих учеников
                            </p>
                          ) : (
                            unassignedPlayers.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200 text-xs">
                                    {p.childSurname[0]}
                                    {p.childName[0]}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 text-xs">
                                      {p.childSurname} {p.childName}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                      {p.groupName
                                        ? `В группе: ${p.groupName}`
                                        : "Без группы"}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    await updateClient(p.id, {
                                      groupName: grp?.name,
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-650 hover:bg-emerald-100 font-bold text-[10px] rounded-lg transition"
                                >
                                  Добавить
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })()}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 9: HOMEWORKS */}
        {activeTab === "trainer_homeworks" && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Домашние задания учеников
                </h3>
                <p className="text-xs text-gray-500">
                  Отправляйте задания группам и проверяйте их выполнение
                </p>
              </div>
              <button
                onClick={() => setIsAddingHomework(!isAddingHomework)}
                className="px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition flex items-center shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>{isAddingHomework ? "Отмена" : "Новое задание"}</span>
              </button>
            </div>

            {isAddingHomework && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-slate-800 mb-4 text-sm">Параметры задания</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Название задания</label>
                    <input type="text" className="w-full p-2.5 border rounded-xl outline-none" placeholder="Чеканка мяча, 50 раз..." value={newHomework.title} onChange={e => setNewHomework({...newHomework, title: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Группа</label>
                     <select className="w-full p-2.5 border rounded-xl outline-none" onChange={e => {
                        const grp = groups.find(g => g.id === e.target.value);
                        setNewHomework({...newHomework, groupId: e.target.value, groupName: grp ? grp.name : ''});
                     }}>
                       <option value="">(Все группы)</option>
                       {groups.filter(g => currentRole === 'trainer' ? g.coachId === myCoach.id : true).map(g => (
                         <option key={g.id} value={g.id}>{g.name}</option>
                       ))}
                     </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Срок выполнения (До)</label>
                    <input type="date" className="w-full p-2.5 border rounded-xl outline-none" value={newHomework.dueDate} onChange={e => setNewHomework({...newHomework, dueDate: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Описание / Критерии</label>
                    <textarea rows={3} className="w-full p-2.5 border rounded-xl outline-none" placeholder="Условия..." value={newHomework.description} onChange={e => setNewHomework({...newHomework, description: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Обучающее Видео (Ссылка YouTube и т.п.)</label>
                    <input type="text" className="w-full p-2.5 border rounded-xl outline-none" placeholder="https://..." value={newHomework.videoUrl} onChange={e => setNewHomework({...newHomework, videoUrl: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 text-right pt-2">
                     <button onClick={() => {
                        if (newHomework.title) {
                          addHomework(newHomework);
                          setIsAddingHomework(false);
                          setNewHomework({ title: '', description: '', videoUrl: '', groupId: '', groupName: '', dueDate: '' });
                        }
                     }} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider">Опубликовать</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {homeworks.filter(hw => currentRole === 'trainer' ? groups.find(g => g.id === hw.groupId)?.coachId === myCoach.id || !hw.groupId : true).map(hw => {
                 const submissions = homeworkSubmissions.filter(s => s.homeworkId === hw.id);
                 return (
                   <div key={hw.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{hw.groupName || 'Для всех групп'} {hw.dueDate ? `• до ${new Date(hw.dueDate).toLocaleDateString()}` : ''}</div>
                           <h4 className="font-bold text-slate-800 text-sm tracking-tight">{hw.title}</h4>
                        </div>
                        <button onClick={() => deleteHomework(hw.id)} className="text-gray-400 hover:text-red-500 transition p-1"><Trash className="w-4 h-4" /></button>
                     </div>
                     <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">{hw.description}</p>
                     
                     <div className="border-t pt-3">
                        <div className="text-[11px] font-bold text-slate-700 bg-emerald-50 text-emerald-800 inline-flex items-center px-2 py-1 rounded">
                           Выполнено: {submissions.length} чел.
                        </div>
                     </div>
                   </div>
                 );
              })}
              {homeworks.length === 0 && (
                <div className="py-8 text-center text-gray-400 border border-dashed rounded-2xl">
                   Пока нет домашних заданий
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 10: TRAINER KNOWLEDGE */}
        {activeTab === "trainer_knowledge" && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left space-y-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Учебно-методические материалы
              </h3>
              <button
                onClick={() =>
                  alert("Открывается окно загрузки нового файла...")
                }
                className="px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Загрузить методичку</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: "План тренировки 21.05.2025",
                  size: "PDF • 245 КБ",
                  date: "Загружено сегодня",
                },
                {
                  name: "Упражнения на владение мячом",
                  size: "PDF • 1.2 МБ",
                  date: "Загружено вчера",
                },
                {
                  name: "Методика ОФП для тренеров",
                  size: "PDF • 3.4 МБ",
                  date: "18 мая 2026",
                },
                {
                  name: "Правила проведения матчей ПФЛ",
                  size: "DOCX • 54 КБ",
                  date: "10 мая 2026",
                },
                {
                  name: "Презентация: Психология победителя",
                  size: "PPTX • 8.1 МБ",
                  date: "01 мая 2026",
                },
              ].map((file, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition"
                >
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4 border border-rose-100">
                    <span className="text-xs font-black text-rose-600 uppercase">
                      {file.name.split(".").pop()?.substring(0, 3) ||
                        file.size.split(" ")[0]}
                    </span>
                  </div>
                  <h4
                    className="font-bold text-slate-900 text-sm mb-1 line-clamp-2"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium mb-4">
                    {file.size} • {file.date}
                  </p>

                  <button
                    onClick={() =>
                      alert(`Начата симуляция скачивания файла: ${file.name}`)
                    }
                    className="w-full flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать файл</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
