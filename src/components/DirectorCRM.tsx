import React, { useState, useMemo } from "react";
import { HeaderDescription } from "./HeaderDescription";
import { useCRM } from "../context/CRMContext";
import {
  Users,
  CreditCard,
  Share2,
  ClipboardList,
  CheckSquare,
  TrendingUp,
  Activity,
  Check,
  Calendar,
  ArrowUpRight,
  Trophy,
  Trash2,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Info,
  Sparkles,
  FolderDown,
  Save,
  X,
  Camera,
  Star,
  UserPlus,
  PhoneCall,
  CalendarCheck,
  Target,
  Crown,
  Flag,
  MessageCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  DollarSign,
  AlertTriangle,
  XCircle,
  Ban,
  Building,
  Phone,
  Clock,
  Receipt,
  ChevronRight,
  PieChart,
  Filter,
  CheckCircle,
  UserX,
  HelpCircle,
  Edit2,
} from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { BirthdaysBanner } from "./BirthdaysBanner";
import { calculateAge, formatSessionDateDisplay } from "../utils/dateUtils";

// Mini Sparkline component for KPI top summary cards
const MiniSparklineChart = ({
  data,
  color,
  gradientId,
  height = 34,
}: {
  data: number[];
  color: string;
  gradientId: string;
  height?: number;
}) => {
  const chartData = data.map((v, i) => ({ x: i, y: v }));
  return (
    <div className="w-full mt-2" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Circular Gauge Ring component for Club Health Index
const CircularGauge = ({
  value,
  label,
  max = 100,
  color = "#10b981",
  suffix = "%",
}: {
  value: number;
  label: string;
  max?: number;
  color?: string;
  suffix?: string;
}) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

  return (
    <div className="flex flex-col items-center text-center space-y-1">
      <div className="relative w-11 h-11 flex items-center justify-center">
        <svg className="w-11 h-11 transform -rotate-90">
          <circle cx="22" cy="22" r={radius} stroke="#f1f5f9" strokeWidth="3.5" fill="transparent" />
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke={color}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-[9.5px] font-black font-mono text-slate-800">
          {value}{suffix}
        </span>
      </div>
      <span className="text-[8.5px] font-semibold text-slate-500 leading-tight max-w-[65px] truncate" title={label}>
        {label}
      </span>
    </div>
  );
};

// CRM Schema Definitions for Field Mapping
const FIELD_DEFINITIONS = {
  clients: [
    {
      key: "childSurname",
      label: "Фамилия ученика (ребенка) *",
      required: true,
      default: "Иванов",
    },
    {
      key: "childName",
      label: "Имя ученика (ребенка) *",
      required: true,
      default: "Иван",
    },
    {
      key: "childBirthYear",
      label: "Год рождения ребенка",
      default: 2016,
      isNum: true,
    },
    { key: "childAge", label: "Возраст ребенка", default: 10, isNum: true },
    { key: "parentName", label: "ФИО родителя", default: "Иванова Мария" },
    {
      key: "parentPhone",
      label: "Телефон родителя",
      default: "+7 (999) 111-22-33",
    },
    { key: "parentEmail", label: "Email родителя", default: "parent@mail.ru" },
    { key: "groupName", label: "Название группы", default: "Без группы" },
    { key: "abonement", label: "Тип абонемента", default: "12_sessions" },
    { key: "abonementStatus", label: "Оплата абонемента", default: "Оплачено" },
    {
      key: "notes",
      label: "Примечания / Заметки",
      default: "Импортирован из таблиц",
    },
  ],
  leads: [
    {
      key: "childName",
      label: "Имя ребенка *",
      required: true,
      default: "Данил",
    },
    { key: "childSurname", label: "Фамилия ребенка", default: "Смирнов" },
    { key: "childAge", label: "Возраст ребенка", default: 8, isNum: true },
    {
      key: "parentName",
      label: "ФИО родителя *",
      required: true,
      default: "Смирнов Алексей",
    },
    {
      key: "parentPhone",
      label: "Телефон родителя *",
      required: true,
      default: "+7 (912) 333-44-55",
    },
    { key: "parentEmail", label: "Email родителя", default: "lead@client.ru" },
    {
      key: "source",
      label: "Источник (MAX/telegram/vk/листовка/рекомендация)",
      default: "telegram",
    },
    {
      key: "note",
      label: "Примечание / Пожелания",
      default: "Новая заявка из таблицы",
    },
  ],
  finances: [
    {
      key: "date",
      label: "Дата транзакции (ГГГГ-ММ-ДД)",
      default: () => (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
    },
    {
      key: "type",
      label: "Тип (income/доход, expense/расход) *",
      required: true,
      default: "income",
    },
    {
      key: "category",
      label: "Категория (Абонементы, Аренда, Зарплата) *",
      required: true,
      default: "Абонементы",
    },
    {
      key: "amount",
      label: "Сумма (₽) *",
      required: true,
      default: 3500,
      isNum: true,
    },
    {
      key: "description",
      label: "Описание / Назначение платежа",
      default: "Массовый платеж",
    },
    { key: "groupName", label: "Для группы", default: "" },
  ],
  coaches: [
    {
      key: "name",
      label: "ФИО тренера *",
      required: true,
      default: "Иванов Иван",
    },
    {
      key: "role",
      label: "Должность (Старший тренер, Тренер вратарей) *",
      required: true,
      default: "Тренер",
    },
    {
      key: "joinedYear",
      label: "Год начала работы",
      default: 2024,
      isNum: true,
    },
    {
      key: "workload",
      label: "Нагрузка (% от нормы)",
      default: 80,
      isNum: true,
    },
    {
      key: "rating",
      label: "Рейтинг тренера (от 1.0 до 5.0)",
      default: 4.8,
      isNum: true,
    },
    {
      key: "status",
      label: "Статус (Активен, На испытательном сроке, Неактивен)",
      default: "Активен",
    },
  ],
};

interface DirectorCRMProps {
  setActiveTab?: (tab: string) => void;
}

export const DirectorCRM: React.FC<DirectorCRMProps> = ({ setActiveTab }) => {
  const {
    clients,
    leads,
    tasks,
    finances,
    coaches,
    groups,
    trainingSessions,
    deleteTrainingSession,
    completeTask,
    addTask,
    deleteTask,
    reorderTasks,
    overwriteClients,
    overwriteLeads,
    overwriteFinances,
    overwriteCoaches,
    appendClients,
    appendLeads,
    appendFinances,
    appendCoaches,
    currentRole,
    accounts,
    counterparties,
    cancelledSessions,
    addCancelledSession,
    deleteCancelledSession,
  } = useCRM();
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const currentMonthStr = `${yyyy}-${mm}`;
  const todayISO = `${yyyy}-${mm}-${dd}`;

  // Interactive Modals State
  const [showTodayPaymentsModal, setShowTodayPaymentsModal] = useState(false);
  const [showDebtorsModal, setShowDebtorsModal] = useState(false);
  const [showAddCancellationModal, setShowAddCancellationModal] = useState(false);
  const [cancellationScope, setCancellationScope] = useState<"month" | "all">("month");

  // Goals State
  const [targetChildrenGoal, setTargetChildrenGoal] = useState<number>(() => {
    return Number(localStorage.getItem("amkar_target_children_goal")) || 120;
  });
  const [targetRevenueGoal, setTargetRevenueGoal] = useState<number>(() => {
    return Number(localStorage.getItem("amkar_target_revenue_goal")) || 600000;
  });
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [tempChildrenGoal, setTempChildrenGoal] = useState(targetChildrenGoal);
  const [tempRevenueGoal, setTempRevenueGoal] = useState(targetRevenueGoal);

  // New Cancel Form State
  const [newCancelGroup, setNewCancelGroup] = useState("");
  const [newCancelDate, setNewCancelDate] = useState(todayISO);
  const [newCancelReason, setNewCancelReason] = useState<
    "Болезнь тренера" | "Занятость зала" | "Погодные условия" | "Мало участников" | "Праздничный день" | "Другое"
  >("Болезнь тренера");
  const [newCancelNotes, setNewCancelNotes] = useState("");
  const [newCancelCoach, setNewCancelCoach] = useState("");

  const handleSaveGoals = () => {
    setTargetChildrenGoal(tempChildrenGoal);
    setTargetRevenueGoal(tempRevenueGoal);
    localStorage.setItem("amkar_target_children_goal", String(tempChildrenGoal));
    localStorage.setItem("amkar_target_revenue_goal", String(tempRevenueGoal));
    setIsEditingGoals(false);
  };

  const handleAddCancellationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCancelGroup) {
      alert("Пожалуйста, выберите или укажите группу");
      return;
    }
    await addCancelledSession({
      groupName: newCancelGroup,
      date: newCancelDate,
      reason: newCancelReason,
      notes: newCancelNotes,
      coachName: newCancelCoach,
    });
    setShowAddCancellationModal(false);
    setNewCancelNotes("");
  };

  // Today Income Records & Sum
  const todayIncomeRecords = useMemo(() => {
    return finances.filter((f) => f.type === "income" && f.date === todayISO);
  }, [finances, todayISO]);

  const todayIncomeSum = useMemo(() => {
    return todayIncomeRecords.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  }, [todayIncomeRecords]);

  // Debts / Debtors list
  const debtorsList = useMemo(() => {
    return clients.filter(
      (c) =>
        c.abonementStatus === "Не оплачено" ||
        c.abonementStatus === "Ожидает оплаты" ||
        (c.bonusBalance && c.bonusBalance < 0) ||
        ((c as any).debtAmount && (c as any).debtAmount > 0)
    );
  }, [clients]);

  const totalDebtSum = useMemo(() => {
    return debtorsList.reduce((sum, c) => {
      const explicitDebt = (c as any).debtAmount || 0;
      if (explicitDebt > 0) return sum + explicitDebt;
      const abCost =
        c.abonement === "12_sessions"
          ? 12000
          : c.abonement === "8_sessions"
            ? 8000
            : c.abonement === "4_sessions"
              ? 4500
              : 3500;
      return sum + abCost;
    }, 0);
  }, [debtorsList]);

  // Accrued Rent for current month
  const monthlyRentRecords = useMemo(() => {
    return finances.filter(
      (f) =>
        f.category === "Аренда" &&
        f.type === "expense" &&
        (f.targetMonth === currentMonthStr || f.date.substring(0, 7) === currentMonthStr)
    );
  }, [finances, currentMonthStr]);

  const monthlyRentSum = useMemo(() => {
    return monthlyRentRecords.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  }, [monthlyRentRecords]);

  // Accrued Salaries for current month
  const monthlySalaryRecords = useMemo(() => {
    return finances.filter(
      (f) =>
        f.category === "Зарплата" &&
        f.type === "expense" &&
        (f.targetMonth === currentMonthStr || f.date.substring(0, 7) === currentMonthStr)
    );
  }, [finances, currentMonthStr]);

  const monthlySalarySum = useMemo(() => {
    return monthlySalaryRecords.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  }, [monthlySalaryRecords]);

  // Expiring Subscriptions (1 or 2 sessions left)
  const expiringSubscriptionClients = useMemo(() => {
    return clients.filter(
      (c) =>
        c.status === "active" &&
        typeof c.abonementSessionsLeft === "number" &&
        c.abonementSessionsLeft <= 2
    );
  }, [clients]);

  // Scheduled sessions without trainer report
  const missingTrainerReports = useMemo(() => {
    const missing: Array<{
      id: string;
      groupName: string;
      coachName: string;
      dateStr: string;
      slot: string;
    }> = [];
    const checkDays = 7;
    for (let i = 1; i <= checkDays; i++) {
      const pDate = new Date();
      pDate.setDate(pDate.getDate() - i);
      const dateStr = pDate.toISOString().substring(0, 10);
      const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
      const dayAbbr = dayNames[pDate.getDay()];

      groups.forEach((g) => {
        const hasSlot = (g.scheduleDays || []).some((s) => s.startsWith(dayAbbr));
        if (hasSlot) {
          const hasReport = trainingSessions.some(
            (ts) =>
              ts.groupId === g.id &&
              (ts.date === dateStr || ts.dateString?.includes(dateStr))
          );
          if (!hasReport) {
            const slot =
              (g.scheduleDays || []).find((s) => s.startsWith(dayAbbr)) ||
              `${dayAbbr} 18:00`;
            missing.push({
              id: `${g.id}_${dateStr}`,
              groupName: g.name,
              coachName: g.coachName || "Тренер не назначен",
              dateStr,
              slot,
            });
          }
        }
      });
    }
    return missing.slice(0, 6);
  }, [groups, trainingSessions]);

  // Filtered Cancelled Sessions
  const filteredCancelledSessions = useMemo(() => {
    if (cancellationScope === "month") {
      return cancelledSessions.filter(
        (cs) => cs.date.substring(0, 7) === currentMonthStr
      );
    }
    return cancelledSessions;
  }, [cancelledSessions, cancellationScope, currentMonthStr]);

  const cancelledByReason = useMemo(() => {
    const counts: Record<string, number> = {
      "Болезнь тренера": 0,
      "Занятость зала": 0,
      "Погодные условия": 0,
      "Мало участников": 0,
      "Праздничный день": 0,
      "Другое": 0,
    };
    filteredCancelledSessions.forEach((cs) => {
      counts[cs.reason] = (counts[cs.reason] || 0) + 1;
    });
    return counts;
  }, [filteredCancelledSessions]);

  // Venue / Site Rating Breakdown
  const venueRatings = useMemo(() => {
    const venueMap: Record<
      string,
      { name: string; childrenCount: number; groupsCount: number; rentAccrued: number }
    > = {};

    groups.forEach((g) => {
      const venueName = g.venueId
        ? counterparties.find((cp) => cp.id === g.venueId)?.name ||
          g.name.split("(")[1]?.replace(")", "") ||
          "Зал школы"
        : g.name.split("(")[1]?.replace(")", "") || "Манеж / Школа";
      if (!venueMap[venueName]) {
        venueMap[venueName] = {
          name: venueName,
          childrenCount: 0,
          groupsCount: 0,
          rentAccrued: 0,
        };
      }
      venueMap[venueName].groupsCount += 1;
      const grpClients = clients.filter((c) => c.groupName === g.name);
      venueMap[venueName].childrenCount += grpClients.length;
    });

    finances.forEach((f) => {
      if (f.category === "Аренда" && f.groupName) {
        const matchingVenue = Object.keys(venueMap).find((vKey) =>
          f.groupName?.includes(vKey)
        );
        if (matchingVenue) {
          venueMap[matchingVenue].rentAccrued += Number(f.amount || 0);
        }
      }
    });

    const totalChildren = clients.length || 1;
    return Object.values(venueMap)
      .map((v) => ({
        ...v,
        percent: Math.round((v.childrenCount / totalChildren) * 100),
      }))
      .sort((a, b) => b.childrenCount - a.childrenCount);
  }, [groups, clients, counterparties, finances]);


  const totalBalance = useMemo(() => {
    const calculatedAccountsMap = new Map<
      string,
      (typeof accounts)[0] & { actualBalance: number }
    >();
    accounts.forEach((acc) =>
      calculatedAccountsMap.set(acc.id, {
        ...acc,
        actualBalance: acc.balance || 0,
      }),
    );

    finances.forEach((f) => {
      if (f.accountId && calculatedAccountsMap.has(f.accountId)) {
        const acc = calculatedAccountsMap.get(f.accountId)!;
        if (f.type === "income") acc.actualBalance += Number(f.amount || 0);
        else if (f.type === "expense" && f.paymentStatus !== "accrued")
          acc.actualBalance -= Number(f.amount || 0);
      }
    });

    const calculatedAccounts = Array.from(calculatedAccountsMap.values());
    return calculatedAccounts.reduce((sum, acc) => sum + acc.actualBalance, 0);
  }, [accounts, finances]);

  const activeClients = clients.filter((c) => c.status === "active");
  const trialClients = clients.filter((c) => c.status === "trial");
  const todayLeadsCount = useMemo(() => {
    return leads.filter((l) => l.createdAt && l.createdAt.slice(0, 10) === todayISO).length;
  }, [leads, todayISO]);
  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed").length;
  }, [tasks]);
  const directorTasks = tasks.filter(
    (t) =>
      t.assignedTo === "director" &&
      !t.title.toLowerCase().includes("посещаемост") &&
      !t.description?.toLowerCase().includes("посещаемост") &&
      !t.id.includes("_att")
  );

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const reorderDirectorTasks = (draggedId: string, targetId: string) => {
    const currentDirectorIds = directorTasks.map((t) => t.id);
    const draggedIndex = currentDirectorIds.indexOf(draggedId);
    const targetIndex = currentDirectorIds.indexOf(targetId);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const newDirectorTasks = [...directorTasks];
    const [removed] = newDirectorTasks.splice(draggedIndex, 1);
    newDirectorTasks.splice(targetIndex, 0, removed);

    const newDirectorTaskIds = new Set(newDirectorTasks.map((t) => t.id));
    const newTasks = [];
    let directorPtr = 0;

    for (const t of tasks) {
      if (newDirectorTaskIds.has(t.id)) {
        if (directorPtr < newDirectorTasks.length) {
          newTasks.push(newDirectorTasks[directorPtr++]);
        }
      } else {
        newTasks.push(t);
      }
    }
    reorderTasks(newTasks);
  };

  const moveDirectorTask = (id: string, direction: "up" | "down") => {
    const currentIndex = directorTasks.findIndex((t) => t.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= directorTasks.length) return;

    const targetId = directorTasks[targetIndex].id;
    reorderDirectorTasks(id, targetId);
  };

  // Dynamic statistics calculations
  const leaderboardToDisplay = [...clients]
    .filter((c) => c.status === "active")
    .map((c) => {
      const avgScore =
        ((c.progress?.technique || 0) +
          (c.progress?.tactics || 0) +
          (c.progress?.physical || 0) +
          (c.progress?.discipline || 0)) /
          4 || 0;

      const attendance = c.attendance || [];
      const presentCount = attendance.filter(
        (a) => a.status === "present",
      ).length;
      const attendanceScore =
        attendance.length > 0 ? (presentCount / attendance.length) * 5 : 0;

      // If progress is empty, use attendance as a partial fallback for rating, but prioritize actual progress
      const finalScore = avgScore > 0 ? avgScore : attendanceScore;

      return {
        id: c.id,
        name: `${c.childSurname} ${c.childName}`,
        group: c.groupName || "Без группы",
        rating: finalScore.toFixed(1),
        medals: `${c.achievements?.length || 0} ${
          c.achievements?.length === 1
            ? "награда"
            : c.achievements?.length >= 2 && c.achievements?.length <= 4
              ? "награды"
              : "наград"
        }`,
        avatar: c.childName ? c.childName[0] : "У",
        score: finalScore,
        avgScore: avgScore,
        attendanceScore: attendanceScore,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const upcomingSessions = (groups || [])
    .flatMap((g) => {
      return (g.scheduleDays || []).map((dayTime) => {
        const parts = dayTime.split(" ");
        const day = parts[0] || "";
        const time = parts[1] || "";
        const dayNames: { [key: string]: string } = {
          Пн: "Понедельник",
          Вт: "Вторник",
          Ср: "Среда",
          Чт: "Четверг",
          Пт: "Пятница",
          Сб: "Суббота",
          Вс: "Воскресенье",
        };
        return {
          title: g.name,
          time: `${dayNames[day] || day}, ${time}`,
          loc: "Манеж Спартак",
          coach: g.coachName || "Не назначен",
        };
      });
    })
    .slice(0, 4);

  const totalLeadsFunnel = leads.length + clients.length;
  const contactedLeadsFunnel =
    leads.filter((l) => l.status !== "new").length + clients.length;
  const trialsBookedFunnel =
    leads.filter((l) => l.status === "trial_assigned").length + clients.length;
  const trialsCompletedFunnel = clients.filter(
    (c) =>
      c.status === "trial" || c.status === "active" || c.status === "inactive",
  ).length;
  const payingClientsFunnel = clients.filter(
    (c) => c.status === "active" || c.status === "inactive",
  ).length;

  const funnelData = [
    {
      stage: "Новые заявки",
      count: totalLeadsFunnel,
      percent: totalLeadsFunnel > 0 ? 100 : 0,
      color: "from-slate-700 to-slate-900",
      bgMain: "bg-slate-900",
      lightBg: "bg-slate-100",
      icon: <UserPlus className="w-4 h-4" />,
      conversionFromPrev: null,
    },
    {
      stage: "В работе (связались)",
      count: contactedLeadsFunnel,
      percent:
        totalLeadsFunnel > 0
          ? Math.round((contactedLeadsFunnel / totalLeadsFunnel) * 100)
          : 0,
      color: "from-blue-500 to-indigo-600",
      bgMain: "bg-indigo-600",
      lightBg: "bg-indigo-50",
      icon: <MessageCircle className="w-4 h-4" />,
      conversionFromPrev:
        totalLeadsFunnel > 0
          ? Math.round((contactedLeadsFunnel / totalLeadsFunnel) * 100)
          : 0,
    },
    {
      stage: "Назначена тренировка",
      count: trialsBookedFunnel,
      percent:
        totalLeadsFunnel > 0
          ? Math.round((trialsBookedFunnel / totalLeadsFunnel) * 100)
          : 0,
      color: "from-cyan-400 to-teal-500",
      bgMain: "bg-teal-500",
      lightBg: "bg-teal-50",
      icon: <CalendarCheck className="w-4 h-4" />,
      conversionFromPrev:
        contactedLeadsFunnel > 0
          ? Math.round((trialsBookedFunnel / contactedLeadsFunnel) * 100)
          : 0,
    },
    {
      stage: "Тренировка пройдена",
      count: trialsCompletedFunnel,
      percent:
        totalLeadsFunnel > 0
          ? Math.round((trialsCompletedFunnel / totalLeadsFunnel) * 100)
          : 0,
      color: "from-emerald-400 to-emerald-600",
      bgMain: "bg-emerald-600",
      lightBg: "bg-emerald-50",
      icon: <Activity className="w-4 h-4" />,
      conversionFromPrev:
        trialsBookedFunnel > 0
          ? Math.round((trialsCompletedFunnel / trialsBookedFunnel) * 100)
          : 0,
    },
    {
      stage: "Резиденты клуба",
      count: payingClientsFunnel,
      percent:
        totalLeadsFunnel > 0
          ? Math.min(
              Math.round((payingClientsFunnel / totalLeadsFunnel) * 100),
              100,
            )
          : 0,
      color: "from-amber-400 to-orange-500",
      bgMain: "bg-orange-500",
      lightBg: "bg-orange-50",
      icon: <Crown className="w-4 h-4" />,
      conversionFromPrev:
        trialsCompletedFunnel > 0
          ? Math.round((payingClientsFunnel / trialsCompletedFunnel) * 100)
          : 0,
    },
  ];

  const dynamicAttendanceByDay = {
    Пн: { total: 0, present: 0 },
    Вт: { total: 0, present: 0 },
    Ср: { total: 0, present: 0 },
    Чт: { total: 0, present: 0 },
    Пт: { total: 0, present: 0 },
    Сб: { total: 0, present: 0 },
    Вс: { total: 0, present: 0 },
  };

  clients.forEach((c) => {
    (c.attendance || []).forEach((att) => {
      if (att.date) {
        const d = new Date(att.date);
        const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
        const dayName = days[d.getDay()];
        if (dayName in dynamicAttendanceByDay) {
          dynamicAttendanceByDay[
            dayName as keyof typeof dynamicAttendanceByDay
          ].total += 1;
          if (att.status === "present") {
            dynamicAttendanceByDay[
              dayName as keyof typeof dynamicAttendanceByDay
            ].present += 1;
          }
        }
      }
    });
  });

  const attendanceChartData = Object.entries(dynamicAttendanceByDay).map(
    ([day, stats]) => {
      let rate = 0;
      if (stats.total > 0) {
        rate = Math.round((stats.present / stats.total) * 100);
      } else {
        // Look at groups that train on this day to get a more accurate realistic estimate
        const dayFullForms: Record<string, string> = {
          Пн: "Понедельник",
          Вт: "Вторник",
          Ср: "Среда",
          Чт: "Четверг",
          Пт: "Пятница",
          Сб: "Суббота",
          Вс: "Воскресенье",
        };
        const groupsOnThisDay = groups.filter((g) =>
          g.schedule?.some((s) => s.day === dayFullForms[day] || s.day === day),
        );
        if (groupsOnThisDay.length > 0) {
          rate = Math.round(
            groupsOnThisDay.reduce(
              (sum, g) => sum + (g.attendanceRate || 85),
              0,
            ) / groupsOnThisDay.length,
          );
        }
      }
      return { day, rate };
    },
  );

  const validRates = attendanceChartData.filter((d) => d.rate > 0);
  const avgAttendanceRate =
    validRates.length > 0
      ? Math.round(
          validRates.reduce((sum, d) => sum + d.rate, 0) / validRates.length,
        )
      : 88;

  // Finance block states & calculations
  const [financePeriod, setFinancePeriod] = useState<string>("today");

  const monthRevenue = useMemo(() => {
    return finances
      .filter((f) => f.type === "income" && f.date.substring(0, 7) === currentMonthStr)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [finances, currentMonthStr]);

  const availableFinanceMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonthStr);

    finances.forEach((f) => {
      if (f.date && f.date.length >= 7) {
        const ym = f.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          monthSet.add(ym);
        }
      }
    });

    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const pastD = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const y = pastD.getFullYear();
      const m = String(pastD.getMonth() + 1).padStart(2, "0");
      monthSet.add(`${y}-${m}`);
    }

    return Array.from(monthSet).sort().reverse();
  }, [finances, currentMonthStr]);

  const getMonthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    const monthIdx = parseInt(m, 10) - 1;
    const monthsRu = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    const name = monthsRu[monthIdx] || ym;
    if (ym === currentMonthStr) {
      return `${name} ${y} (Текущий)`;
    }
    return `${name} ${y}`;
  };

  const incomeVal = useMemo(() => {
    if (financePeriod === "today") {
      return todayIncomeSum;
    }
    const targetMonth = financePeriod === "month" ? currentMonthStr : financePeriod;
    return finances
      .filter((f) => f.type === "income" && f.date.substring(0, 7) === targetMonth)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [financePeriod, todayIncomeSum, finances, currentMonthStr]);

  const expenseVal = useMemo(() => {
    if (financePeriod === "today") {
      return finances
        .filter((f) => f.type === "expense" && f.date === todayISO)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }
    const targetMonth = financePeriod === "month" ? currentMonthStr : financePeriod;
    return finances
      .filter((f) => f.type === "expense" && f.date.substring(0, 7) === targetMonth)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [financePeriod, finances, todayISO, currentMonthStr]);

  const financePieData = useMemo(() => {
    if (incomeVal === 0 && expenseVal === 0) {
      return [{ name: "Нет данных", value: 1, color: "#e2e8f0" }];
    }
    return [
      { name: "Поступления", value: incomeVal, color: "#32cd32" },
      { name: "Расходы", value: expenseVal, color: "#ff0000" },
    ];
  }, [incomeVal, expenseVal]);

  // New Staging States for Data Loader
  const [activeSection, setActiveSection] = useState<
    "metrics" | "import" | "training_sessions"
  >("metrics");
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<
    any | null
  >(null);
  const [importType, setImportType] = useState<
    "clients" | "leads" | "finances" | "coaches"
  >("clients");
  const [rawText, setRawText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shouldClearFirst, setShouldClearFirst] = useState(false);

  // New Interactive Column Mapper States
  const [isHeaderFirstLine, setIsHeaderFirstLine] = useState<boolean>(true);
  const [rawGrid, setRawGrid] = useState<string[][]>([]);
  const [colMappings, setColMappings] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);
  const [newDirectorTask, setNewDirectorTask] = useState("");

  const handleAddDirectorTask = () => {
    if (!newDirectorTask.trim()) return;

    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();

    const newTask = {
      title: newDirectorTask.trim(),
      description: "Добавлено с дашборда",
      dueDate: `${d}.${m}.${y}`,
      assignedTo: "director" as const,
    };
    addTask(newTask);
    setNewDirectorTask("");
  };

  // Split raw text into clean grid of cells (supporting Tabs, Semicolons, and Commas)
  const parseTextToGrid = (text: string): string[][] => {
    const lines = text.split("\n");
    const grid: string[][] = [];
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(";")) {
        parts = line.split(";");
      } else {
        parts = line.split(",");
      }
      parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ""));
      grid.push(parts);
    });
    return grid;
  };

  // Extract student profile card blocks from other CRMs like AkratoPRIME/etc.
  const parseAkratoBlocks = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const blocks: any[] = [];

    // Check if a line is formatted like a person's Full Name (FIO: 2-4 Cyrillic words, no numbers, no `@` or system terms)
    const isNameLine = (str: string) => {
      if (!str) return false;
      const s = str.trim();
      const words = s.split(/\s+/);
      const hasDigit = /\d/.test(s);
      const lc = s.toLowerCase();
      const isSystemWord =
        lc.includes("родител") || lc.includes("в базе") || lc.includes("@");
      return (
        words.length >= 2 && words.length <= 4 && !hasDigit && !isSystemWord
      );
    };

    const isBirthdateLine = (str: string) => {
      if (!str) return false;
      return /\d/.test(str) || str.includes("(") || str.includes(")");
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (
        isNameLine(line) &&
        i + 1 < lines.length &&
        isBirthdateLine(lines[i + 1])
      ) {
        const childNameFull = line;
        const birthdateLine = lines[i + 1];

        // Split child full name into Surname / Name
        const nameParts = childNameFull.split(/\s+/);
        const childSurname = nameParts[0] || "";
        const childName = nameParts.slice(1).join(" ") || "";

        let birthYear = 2016;
        let age = 10;
        const yearMatch = birthdateLine.match(/\b\d{4}\b/);
        if (yearMatch) {
          birthYear = parseInt(yearMatch[0]);
        }
        const ageMatch = birthdateLine.match(/\((\d+)\)/);
        if (ageMatch) {
          age = parseInt(ageMatch[1]);
        } else {
          age = new Date().getFullYear() - birthYear;
        }

        let parentName = "";
        let parentPhone = "";
        let parentEmail = "";
        const notesParts: string[] = [];

        let j = i + 2;
        while (j < lines.length) {
          const nextLine = lines[j];

          // Stop parsing this block if we hit another student profile start
          if (
            isNameLine(nextLine) &&
            j + 1 < lines.length &&
            isBirthdateLine(lines[j + 1])
          ) {
            break;
          }

          const lcNext = nextLine.toLowerCase();
          if (lcNext === "родители") {
            j++;
            continue;
          }

          // If looks like a valid Parent FIO
          if (!parentName && isNameLine(nextLine)) {
            parentName = nextLine;
            j++;
            continue;
          }

          // Email check
          if (nextLine.includes("@")) {
            parentEmail = nextLine;
            j++;
            continue;
          }

          // Phone pattern check (usually start with 7/8/+, or contains 10-11 numbers)
          const cleanPh = nextLine.replace(/[\s\-\(\)\+]/g, "");
          if (/^\+?\d{9,15}$/.test(cleanPh)) {
            parentPhone = nextLine;
            j++;
            continue;
          }

          notesParts.push(nextLine);
          j++;
        }

        blocks.push({
          childSurname,
          childName,
          childBirthYear: birthYear,
          childAge: age,
          parentName,
          parentPhone,
          parentEmail,
          notes:
            notesParts.join(" | ") ||
            "Скопировано из веб-карточки личного кабинета",
        });

        i = j;
      } else {
        i++;
      }
    }

    return blocks;
  };

  // Guess columns mappings dynamically by checking terms in first rows
  const guessColMappings = (
    grid: string[][],
    type: "clients" | "leads" | "finances" | "coaches",
    hasHeader: boolean,
  ) => {
    if (grid.length === 0) return [];
    const maxCols = Math.max(...grid.map((row) => row.length));
    const guessed: string[] = Array(maxCols).fill("skip");

    const positionalDefaults = {
      clients: [
        "childSurname",
        "childName",
        "childBirthYear",
        "parentName",
        "parentPhone",
        "parentEmail",
        "groupName",
        "notes",
      ],
      leads: [
        "childName",
        "childSurname",
        "childAge",
        "parentName",
        "parentPhone",
        "source",
        "parentEmail",
        "note",
      ],
      finances: [
        "date",
        "type",
        "category",
        "amount",
        "description",
        "groupName",
      ],
      coaches: ["name", "role", "joinedYear", "workload", "rating", "status"],
    };

    const headerRow = hasHeader ? grid[0] : null;

    for (let c = 0; c < maxCols; c++) {
      let cellText = "";
      if (headerRow && headerRow[c]) {
        cellText = headerRow[c].toLowerCase();
      } else {
        const sampleRow = hasHeader ? grid[1] : grid[0];
        if (sampleRow && sampleRow[c]) {
          cellText = sampleRow[c].toLowerCase();
        }
      }

      if (!cellText) {
        guessed[c] = positionalDefaults[type][c] || "skip";
        continue;
      }

      if (
        cellText.includes("фамил") ||
        cellText.includes("surname") ||
        cellText.includes("last")
      ) {
        guessed[c] =
          type === "clients"
            ? "childSurname"
            : type === "leads"
              ? "childSurname"
              : "skip";
      } else if (
        cellText.includes("имя") ||
        cellText.includes("name") ||
        cellText.includes("first")
      ) {
        guessed[c] =
          type === "coaches"
            ? "name"
            : type === "clients"
              ? "childName"
              : type === "leads"
                ? "childName"
                : "skip";
      } else if (
        cellText.includes("тел") ||
        cellText.includes("phone") ||
        cellText.includes("номер")
      ) {
        guessed[c] =
          type === "clients"
            ? "parentPhone"
            : type === "leads"
              ? "parentPhone"
              : "skip";
      } else if (
        cellText.includes("род") ||
        cellText.includes("родител") ||
        cellText.includes("мама") ||
        cellText.includes("папа") ||
        cellText.includes("fio") ||
        cellText.includes("фио")
      ) {
        guessed[c] =
          type === "coaches"
            ? "name"
            : type === "clients"
              ? "parentName"
              : type === "leads"
                ? "parentName"
                : "skip";
      } else if (
        cellText.includes("email") ||
        cellText.includes("mail") ||
        cellText.includes("почт")
      ) {
        guessed[c] =
          type === "clients"
            ? "parentEmail"
            : type === "leads"
              ? "parentEmail"
              : "skip";
      } else if (
        cellText.includes("год") ||
        cellText.includes("рожд") ||
        cellText.includes("birth")
      ) {
        guessed[c] =
          type === "clients"
            ? "childBirthYear"
            : type === "coaches"
              ? "joinedYear"
              : "skip";
      } else if (
        cellText.includes("возр") ||
        cellText.includes("age") ||
        cellText.includes("лет")
      ) {
        guessed[c] =
          type === "leads"
            ? "childAge"
            : type === "clients"
              ? "childAge"
              : "skip";
      } else if (
        cellText.includes("груп") ||
        cellText.includes("group") ||
        cellText.includes("класс")
      ) {
        guessed[c] =
          type === "clients"
            ? "groupName"
            : type === "finances"
              ? "groupName"
              : "skip";
      } else if (
        cellText.includes("абон") ||
        cellText.includes("тариф") ||
        cellText.includes("оплат")
      ) {
        guessed[c] = "abonement";
      } else if (
        cellText.includes("опис") ||
        cellText.includes("desc") ||
        cellText.includes("коммент") ||
        cellText.includes("назв") ||
        cellText.includes("comment")
      ) {
        guessed[c] =
          type === "finances"
            ? "description"
            : type === "clients"
              ? "notes"
              : type === "leads"
                ? "note"
                : "skip";
      } else if (
        cellText.includes("кат") ||
        cellText.includes("тип") ||
        cellText.includes("вид") ||
        cellText.includes("катег")
      ) {
        guessed[c] =
          type === "finances"
            ? "category"
            : type === "coaches"
              ? "role"
              : "skip";
      } else if (
        cellText.includes("сумм") ||
        cellText.includes("amount") ||
        cellText.includes("цена") ||
        cellText.includes("руб") ||
        cellText.includes("стоим")
      ) {
        guessed[c] =
          type === "finances"
            ? "amount"
            : type === "coaches"
              ? "workload"
              : "skip";
      } else if (
        cellText.includes("дат") ||
        cellText.includes("date") ||
        cellText.includes("число")
      ) {
        guessed[c] = type === "finances" ? "date" : "skip";
      } else {
        guessed[c] = positionalDefaults[type][c] || "skip";
      }
    }
    return guessed;
  };

  // Convert Excel row indices dynamically into correct CRM shapes
  const applyMappings = (
    grid: string[][],
    mappings: string[],
    hasHeader: boolean,
    type: "clients" | "leads" | "finances" | "coaches",
  ) => {
    const dataRows = hasHeader ? grid.slice(1) : grid;
    const loaded: any[] = [];

    dataRows.forEach((row, idx) => {
      const rowDict: any = {};
      row.forEach((val, cIdx) => {
        const key = mappings[cIdx];
        if (key && key !== "skip") {
          rowDict[key] = val;
        }
      });

      const uniqueSuffix = `${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`;

      if (type === "clients") {
        const birthYear = parseInt(rowDict.childBirthYear) || 2016;
        let childSurname = (rowDict.childSurname || "").trim();
        let childName = (rowDict.childName || "").trim();

        // Smart FIO split if only one column of name is mapped but contains spaces
        if (childSurname && !childName) {
          const parts = childSurname.split(/\s+/);
          if (parts.length > 1) {
            childSurname = parts[0];
            childName = parts.slice(1).join(" ");
          }
        } else if (!childSurname && childName) {
          const parts = childName.split(/\s+/);
          if (parts.length > 1) {
            childSurname = parts[0];
            childName = parts.slice(1).join(" ");
          }
        }

        // If completely empty, make a generic but clean name
        if (!childSurname && !childName) {
          childSurname = "Ученик";
          childName = `№${idx + 1}`;
        }

        loaded.push({
          id: rowDict.id || `cl_loaded_${uniqueSuffix}`,
          childSurname,
          childName,
          childBirthYear: birthYear,
          childAge: rowDict.childAge
            ? parseInt(rowDict.childAge)
            : new Date().getFullYear() - birthYear,
          parentName: rowDict.parentName || "",
          parentPhone: rowDict.parentPhone || "",
          parentEmail: rowDict.parentEmail || "",
          groupName: rowDict.groupName || null,
          status: (rowDict.status || "active") as any,
          abonement: (rowDict.abonement || "12_sessions") as any,
          abonementStatus: (rowDict.abonementStatus || "Оплачено") as any,
          abonementSessionsLeft: rowDict.abonementSessionsLeft
            ? parseInt(rowDict.abonementSessionsLeft)
            : 12,
          coachId: rowDict.coachId || null,
          coachName: rowDict.coachName || null,
          medicalCertificateUrl: null,
          insuranceUrl: null,
          payments: [],
          attendance: [],
          progress: {
            technique: 4.5,
            tactics: 4.2,
            physical: 4.4,
            discipline: 4.5,
          },
          achievements: [],
          notes:
            rowDict.notes || "Загружен массовым импортом директором школы.",
        });
      } else if (type === "leads") {
        let childSurname = (rowDict.childSurname || "").trim();
        let childName = (rowDict.childName || "").trim();

        // Smart FIO split for leads as well
        if (childSurname && !childName) {
          const parts = childSurname.split(/\s+/);
          if (parts.length > 1) {
            childSurname = parts[0];
            childName = parts.slice(1).join(" ");
          }
        } else if (!childSurname && childName) {
          const parts = childName.split(/\s+/);
          if (parts.length > 1) {
            childSurname = parts[0];
            childName = parts.slice(1).join(" ");
          }
        }

        if (!childSurname && !childName) {
          childSurname = "Лид";
          childName = `№${idx + 1}`;
        }

        loaded.push({
          id: rowDict.id || `l_loaded_${uniqueSuffix}`,
          childName,
          childSurname,
          childAge: parseInt(rowDict.childAge) || 8,
          parentName: rowDict.parentName || "",
          parentPhone: rowDict.parentPhone || "",
          parentEmail: rowDict.parentEmail || "",
          source: (rowDict.source || "telegram") as any,
          createdAt: new Date().toISOString(),
          timeString: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "new",
          note: rowDict.note || "Заявка из импортированной таблицы",
        });
      } else if (type === "finances") {
        loaded.push({
          id: rowDict.id || `f_loaded_${uniqueSuffix}`,
          date: rowDict.date || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
          type: (rowDict.type === "expense" || rowDict.type === "расход"
            ? "expense"
            : "income") as "income" | "expense",
          category: rowDict.category || "Абонементы",
          amount: parseFloat(rowDict.amount) || 1000,
          description: rowDict.description || "Массовый финансовый импорт",
        });
      } else if (type === "coaches") {
        loaded.push({
          id: rowDict.id || `co_loaded_${uniqueSuffix}`,
          name: rowDict.name || "Петров Иван",
          role: rowDict.role || "Тренер",
          joinedYear: parseInt(rowDict.joinedYear) || 2024,
          groupsCount: parseInt(rowDict.groupsCount) || 1,
          kidsCount: parseInt(rowDict.kidsCount) || 12,
          workload: parseInt(rowDict.workload) || 80,
          rating: parseFloat(rowDict.rating) || 4.7,
          status: (rowDict.status || "Активен") as any,
          feedback: {
            discipline: 4.7,
            communication: 4.8,
            professionalism: 4.8,
            results: 4.5,
          },
        });
      }
    });

    setParsedData(loaded);
  };

  // Interactive callbacks on Column remapping
  const handleMapColumn = (colIdx: number, fieldKey: string) => {
    const updated = [...colMappings];
    updated[colIdx] = fieldKey;
    setColMappings(updated);
    applyMappings(rawGrid, updated, isHeaderFirstLine, importType);
  };

  // Toggle Header skip row
  const handleToggleHeader = (hasHeader: boolean) => {
    setIsHeaderFirstLine(hasHeader);
    const guessed = guessColMappings(rawGrid, importType, hasHeader);
    setColMappings(guessed);
    applyMappings(rawGrid, guessed, hasHeader, importType);
  };

  // Auto-parsing demo datasets for rapid client onboarding and showcase
  const demoPresets = {
    clients: `Смирнов\tКирилл\t2016\tСмирнова Анна\t+7 (953) 456-78-90\tanna.sm@mail.ru\tГруппа 2016
Зайцев\tАртем\t2014\tЗайцева Вера\t+7 (909) 333-22-11\tvera@zaitsev.ru\tГруппа 2014
Мельников\tИлья\t2015\tМельников Юрий\t+7 (911) 222-33-44\tyur@melnikov.su\tГруппа 2015`,

    leads: `Максим\tИванов\t10\tИванова Светлана\t+7 (912) 555-44-33\ttelegram
Артур\tДавыдов\t7\tДавыдов Егор\t+7 (921) 777-88-99\tvk
Тимофей\tСергеев\t9\tСергеева Ольга\t+7 (905) 111-22-33\tMAX`,

    finances: `2026-05-23\tincome\tАбонементы\t15600\tОплата абонементов за Июнь
2026-05-22\texpense\tИнвентарь\t8400\tЗакупка тренировочных конусов и ворот
2026-05-21\tincome\tОдежда\t24000\tПокупка брендированной экипировки РФС`,

    coaches: `Петров Андрей\tСтарший тренер\t2021\t90\t4.9\tАктивен
Смирнов Дмитрий\tТренер\t2022\t85\t4.8\tАктивен
Кузнецов Михаил\tТренер\t2023\t75\t4.7\tАктивен`,
  };

  const handleApplyPreset = (
    type: "clients" | "leads" | "finances" | "coaches",
  ) => {
    setImportType(type);
    const text = demoPresets[type];
    setRawText(text);

    const grid = parseTextToGrid(text);
    setRawGrid(grid);
    setIsHeaderFirstLine(false);

    const guessed = guessColMappings(grid, type, false);
    setColMappings(guessed);

    applyMappings(grid, guessed, false, type);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          setRawText(text);
          parseData(text, importType);
        }
      };
      reader.readAsText(file);
    }
  };

  const parseData = (
    text: string,
    type: "clients" | "leads" | "finances" | "coaches" = importType,
  ) => {
    const trimmed = (text || "").trim();
    if (!trimmed) {
      setErrorMessage(
        "Входной буфер пуст. Пожалуйста, введите данные или загрузите пример.",
      );
      return;
    }

    try {
      // Auto-detect isAkratoFormat
      const isAkratoFormat =
        trimmed.toLowerCase().includes("родители") ||
        trimmed.toLowerCase().includes("в базе с:") ||
        trimmed.toLowerCase().includes("в базе с");

      if (isAkratoFormat) {
        setImportType("clients");
        const blocks = parseAkratoBlocks(trimmed);
        if (blocks.length === 0) {
          setErrorMessage(
            "Обнаружен структурированный формат карточек CRM, но не удалось распознать ни одного профиля. Проверьте пример формата в инструкции.",
          );
          return;
        }

        const grid = blocks.map((b) => [
          b.childSurname,
          b.childName,
          String(b.childBirthYear),
          String(b.childAge),
          b.parentName,
          b.parentPhone,
          b.parentEmail,
          b.notes,
        ]);

        setRawGrid(grid);
        setIsHeaderFirstLine(false);

        const mappings = [
          "childSurname",
          "childName",
          "childBirthYear",
          "childAge",
          "parentName",
          "parentPhone",
          "parentEmail",
          "notes",
        ];
        setColMappings(mappings);

        applyMappings(grid, mappings, false, "clients");
        setErrorMessage(null);
        setSuccessMessage(
          `✨ Формат карточек AkratoPRIME успешно распознан и разобран! Импортировано учеников: ${blocks.length}.`,
        );
        setTimeout(() => setSuccessMessage(null), 5000);
        return;
      }

      const grid = parseTextToGrid(trimmed);
      setRawGrid(grid);

      const guessed = guessColMappings(grid, type, isHeaderFirstLine);
      setColMappings(guessed);

      applyMappings(grid, guessed, isHeaderFirstLine, type);
      setErrorMessage(null);
      setSuccessMessage(
        "Таблица успешно разобрана! Проверьте соответствие колонок ниже.",
      );
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(`Ошибка разбора: ${err.message}`);
    }
  };

  const handleDeleteRow = (idxToDelete: number) => {
    const updatedGrid = rawGrid.filter((_, idx) => {
      if (isHeaderFirstLine) {
        return idx !== idxToDelete + 1;
      }
      return idx !== idxToDelete;
    });
    setRawGrid(updatedGrid);
    applyMappings(updatedGrid, colMappings, isHeaderFirstLine, importType);
  };

  const handleClearBuffer = () => {
    setParsedData([]);
    setRawGrid([]);
    setColMappings([]);
    setRawText("");
    setErrorMessage(null);
    setSuccessMessage("Входной буфер и таблица очищены.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleWipeCRM = () => {
    const targetNames = {
      clients: "Ученики / Клиенты",
      leads: "Новые заявки / Лиды",
      finances: "Финансовые транзакции",
      coaches: "Работа Тренеров / Сотрудники",
    };

    const confirm1 = window.confirm(
      `⚠️ ВНИМАНИЕ: Вы действительно хотите ПОЛНОСТЬЮ СТЕРЕТЬ все существующие записи в CRM по разделу "${targetNames[importType]}"?`,
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      `ОПАСНО: Подтвердите окончательно. Все текущие ${targetNames[importType]} будут безвозвратно удалены! Стираем раздел?`,
    );
    if (!confirm2) return;

    if (importType === "clients") overwriteClients([]);
    else if (importType === "leads") overwriteLeads([]);
    else if (importType === "finances") overwriteFinances([]);
    else if (importType === "coaches") overwriteCoaches([]);

    setSuccessMessage(
      `Раздел "${targetNames[importType]}" в CRM базе был успешно удален (очищен)!`,
    );
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSaveToCRM = () => {
    if (parsedData.length === 0) {
      setErrorMessage(
        "Данные отсутствуют в буфере. Пожалуйста, вставьте и распознайте таблицу перед сохранением.",
      );
      return;
    }

    const targetNames = {
      clients: "Ученики / Клиенты",
      leads: "Новые заявки / Лиды",
      finances: "Финансовые транзакции",
      coaches: "Работа Тренеров / Сотрудники",
    };

    if (importType === "clients") {
      if (shouldClearFirst) {
        overwriteClients(parsedData);
      } else {
        appendClients(parsedData);
      }
    } else if (importType === "leads") {
      if (shouldClearFirst) {
        overwriteLeads(parsedData);
      } else {
        appendLeads(parsedData);
      }
    } else if (importType === "finances") {
      if (shouldClearFirst) {
        overwriteFinances(parsedData);
      } else {
        appendFinances(parsedData);
      }
    } else if (importType === "coaches") {
      if (shouldClearFirst) {
        overwriteCoaches(parsedData);
      } else {
        appendCoaches(parsedData);
      }
    }

    setSuccessMessage(
      `Данные успешно импортированы в базу CRM! Добавлено записей: ${parsedData.length}`,
    );
    setTimeout(() => {
      setSuccessMessage(null);
      setActiveSection("metrics");
    }, 3500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 ">
      {/* Tab Header Navigation Panel */}
      <div className="bg-white border-b border-gray-150 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm w-full">
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2.5 bg-red-50 text-red-650 rounded-xl shrink-0">
            <Activity className="w-5 h-5 text-red-650 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center"><h1 className="text-sm md:text-base font-black text-slate-905 tracking-tight uppercase truncate">
              Аналитический Кабинет
            </h1><HeaderDescription text={<>Сводная аналитика и импорт данных</>} /></div>
          </div>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 border overflow-x-auto no-scrollbar w-full md:w-auto shrink-0 flex-nowrap">
          <button
            onClick={() => setActiveSection("metrics")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition duration-150 whitespace-nowrap shrink-0 ${
              activeSection === "metrics"
                ? "bg-white text-slate-900 shadow-3xs border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Аналитика</span>
          </button>
          <button
            onClick={() => setActiveSection("training_sessions")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition duration-150 whitespace-nowrap shrink-0 ${
              activeSection === "training_sessions"
                ? "bg-white text-slate-900 shadow-3xs border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Тренировки</span>
          </button>
          {currentRole !== "manager" && (
            <button
              onClick={() => setActiveSection("import")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition duration-150 whitespace-nowrap shrink-0 ${
                activeSection === "import"
                  ? "bg-white text-slate-900 shadow-3xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Импорт</span>
            </button>
          )}
        </div>
      </div>

      {activeSection === "metrics" ? (
        // METRICS DASHBOARD VIEW
        <div
          id="metrics-dashboard"
          className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6"
        >
          <BirthdaysBanner clients={clients} />

          {/* Top summary cards header row with dynamic colorful sparkline charts */}
          {currentRole === "manager" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 md:gap-4">
              {/* 1. Активные дети */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-left relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                      Активные дети
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      86% от плана
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {activeClients.length}
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, activeClients.length - 15),
                    Math.max(1, activeClients.length - 11),
                    Math.max(1, activeClients.length - 8),
                    Math.max(1, activeClients.length - 5),
                    Math.max(1, activeClients.length - 2),
                    activeClients.length,
                  ]}
                  color="#3b82f6"
                  gradientId="mgrSparkClients"
                />
              </div>

              {/* 2. Новые заявки */}
              <div
                onClick={() => setActiveTab && setActiveTab("hq_leads")}
                className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs text-left relative overflow-hidden cursor-pointer hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between min-h-[145px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide leading-tight">
                      Новые заявки
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100/80 text-amber-800 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {todayLeadsCount > 0 ? `${todayLeadsCount} сегодня` : "3 сегодня"}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-2 tracking-tight">
                    {leads.filter((l) => l.status === "new").length}
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, leads.length - 12),
                    Math.max(1, leads.length - 9),
                    Math.max(1, leads.length - 6),
                    Math.max(1, leads.length - 4),
                    Math.max(1, leads.length - 1),
                    leads.length,
                  ]}
                  color="#f59e0b"
                  gradientId="mgrSparkLeads"
                />
              </div>

              {/* 3. Задачи в работе */}
              <div
                onClick={() => setActiveTab && setActiveTab("hq_tasks")}
                className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs text-left relative overflow-hidden cursor-pointer hover:border-indigo-300 hover:shadow-md transition group flex flex-col justify-between min-h-[145px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wide leading-tight">
                      Задачи в работе
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {pendingTasksCount} активных
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-indigo-700 mt-2 tracking-tight">
                    {pendingTasksCount}
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, pendingTasksCount + 4),
                    Math.max(1, pendingTasksCount + 2),
                    Math.max(1, pendingTasksCount + 3),
                    Math.max(1, pendingTasksCount + 1),
                    Math.max(1, pendingTasksCount),
                    pendingTasksCount,
                  ]}
                  color="#6366f1"
                  gradientId="mgrSparkTasks"
                />
              </div>

              {/* 4. Заканчивается абонемент */}
              <div
                onClick={() => setActiveTab && setActiveTab("hq_finances")}
                className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs text-left relative overflow-hidden cursor-pointer hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between min-h-[145px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide leading-tight">
                      Продление абонемента
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {expiringSubscriptionClients.length} чел.
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-800 mt-2 tracking-tight">
                    {expiringSubscriptionClients.length}
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, expiringSubscriptionClients.length + 3),
                    Math.max(1, expiringSubscriptionClients.length + 1),
                    Math.max(1, expiringSubscriptionClients.length + 2),
                    Math.max(1, expiringSubscriptionClients.length),
                    expiringSubscriptionClients.length,
                  ]}
                  color="#d97706"
                  gradientId="mgrSparkExpiring"
                />
              </div>

              {/* 5. Посещаемость */}
              <div
                onClick={() => setActiveTab && setActiveTab("hq_attendance")}
                className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs text-left relative overflow-hidden flex flex-col justify-between min-h-[145px] cursor-pointer hover:border-emerald-300 hover:shadow-md transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide leading-tight">
                      Посещаемость
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {avgAttendanceRate}% ср.
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-2 tracking-tight">
                    {avgAttendanceRate}%
                  </div>
                </div>
                <MiniSparklineChart
                  data={[82, 85, 87, 86, 89, 91, avgAttendanceRate]}
                  color="#10b981"
                  gradientId="mgrSparkAtt"
                />
              </div>

              {/* 6. Всего групп */}
              <div
                onClick={() => setActiveTab && setActiveTab("hq_groups")}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-left relative overflow-hidden cursor-pointer hover:border-slate-300 hover:shadow-md transition group flex flex-col justify-between min-h-[145px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                      Группы клуба
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {groups.length} групп
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {groups.length}
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, groups.length - 3),
                    Math.max(1, groups.length - 2),
                    Math.max(1, groups.length - 1),
                    groups.length,
                  ]}
                  color="#8b5cf6"
                  gradientId="mgrSparkGroups"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 md:gap-4">
              {/* Деньги на счетах */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-left relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                      Деньги на счетах
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap flex items-center gap-0.5">
                      +18 300 ₽
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {totalBalance.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, totalBalance - 23400),
                    Math.max(1, totalBalance - 19800),
                    Math.max(1, totalBalance - 18200),
                    Math.max(1, totalBalance - 12000),
                    Math.max(1, totalBalance - 8500),
                    Math.max(1, totalBalance - 3200),
                    totalBalance,
                  ]}
                  color="#10b981"
                  gradientId="sparkBal"
                />
              </div>

              {/* Поступления сегодня (Clickable) */}
              <div
                onClick={() => setShowTodayPaymentsModal(true)}
                className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs text-left relative overflow-hidden cursor-pointer hover:border-emerald-300 hover:shadow-md transition group flex flex-col justify-between min-h-[145px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide leading-tight">
                      Поступления сегодня
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {todayIncomeRecords.length} оплат
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-2 tracking-tight">
                    {todayIncomeSum.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    0,
                    Math.round(todayIncomeSum * 0.15),
                    Math.round(todayIncomeSum * 0.35),
                    Math.round(todayIncomeSum * 0.5),
                    Math.round(todayIncomeSum * 0.72),
                    Math.round(todayIncomeSum * 0.88),
                    todayIncomeSum,
                  ]}
                  color="#059669"
                  gradientId="sparkToday"
                />
              </div>

              {/* Прибыль / Выручка за месяц */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-left relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                      Прибыль месяца
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      Рентабельность 26%
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {monthRevenue.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.round(monthRevenue * 0.15),
                    Math.round(monthRevenue * 0.32),
                    Math.round(monthRevenue * 0.52),
                    Math.round(monthRevenue * 0.7),
                    Math.round(monthRevenue * 0.85),
                    monthRevenue,
                  ]}
                  color="#8b5cf6"
                  gradientId="sparkRev"
                />
              </div>

              {/* Активные дети */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-left relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                      Активные дети
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      86% от плана
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {activeClients.length}
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, activeClients.length - 15),
                    Math.max(1, activeClients.length - 11),
                    Math.max(1, activeClients.length - 8),
                    Math.max(1, activeClients.length - 5),
                    Math.max(1, activeClients.length - 2),
                    activeClients.length,
                  ]}
                  color="#3b82f6"
                  gradientId="sparkClients"
                />
              </div>

              {/* Новые заявки */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-left relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                      Новые заявки
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {todayLeadsCount > 0 ? `${todayLeadsCount} сегодня` : "3 сегодня"}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {leads.filter((l) => l.status === "new").length}
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    Math.max(1, leads.length - 12),
                    Math.max(1, leads.length - 9),
                    Math.max(1, leads.length - 6),
                    Math.max(1, leads.length - 4),
                    Math.max(1, leads.length - 1),
                    leads.length,
                  ]}
                  color="#f59e0b"
                  gradientId="sparkLeads"
                />
              </div>

              {/* Долги родителей (Clickable) */}
              <div
                onClick={() => setShowDebtorsModal(true)}
                className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs text-left relative overflow-hidden cursor-pointer hover:border-rose-300 hover:shadow-md transition group flex flex-col justify-between min-h-[145px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wide leading-tight">
                      Долги родителей
                    </span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10.5px] rounded-full shrink-0 whitespace-nowrap">
                      {debtorsList.length} должн.
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-2 tracking-tight">
                    {totalDebtSum.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <MiniSparklineChart
                  data={[
                    totalDebtSum + 18000,
                    totalDebtSum + 14000,
                    totalDebtSum + 9000,
                    totalDebtSum + 5000,
                    totalDebtSum + 2000,
                    totalDebtSum,
                  ]}
                  color="#f43f5e"
                  gradientId="sparkDebts"
                />
              </div>
            </div>
          )}

          {/* Блок "Требует внимания" */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 shadow-2xs text-left space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-amber-950 text-sm">
                    {currentRole === "manager"
                      ? "Требует внимания менеджера"
                      : "Требует внимания управляющего директора"}
                  </h3>
                  <p className="text-[11px] text-amber-800/80">
                    {currentRole === "manager"
                      ? "Оперативные задачи: окончания абонементов, новые заявки, отчеты тренеров"
                      : "Оперативные риски: окончания абонементов, долги, отсутствие отчетов тренеров"}
                  </p>
                </div>
              </div>
              <span className="bg-amber-200/80 text-amber-900 font-extrabold text-xs px-2.5 py-1 rounded-lg font-mono">
                {currentRole === "manager"
                  ? expiringSubscriptionClients.length + leads.filter((l) => l.status === "new").length + missingTrainerReports.length
                  : expiringSubscriptionClients.length +
                    debtorsList.length +
                    missingTrainerReports.length}{" "}
                задач
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Заканчивается абонемент */}
              <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Заканчивается абонемент (1-2 зан.)
                  </span>
                  <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2 py-0.5 rounded-full">
                    {expiringSubscriptionClients.length}
                  </span>
                </div>
                {expiringSubscriptionClients.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic py-2">
                    Нет клиентов с истекающим абонементом
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {expiringSubscriptionClients.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            {c.childSurname} {c.childName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {c.groupName || "Без группы"} • {c.parentPhone}
                          </div>
                        </div>
                        <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-1.5 py-0.5 rounded">
                          {c.abonementSessionsLeft} зан.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: For Manager -> Новые необработанные заявки; For Director -> Неоплаченные абонементы / Долги */}
              {currentRole === "manager" ? (
                <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4 text-amber-600" />
                      Новые необработанные заявки
                    </span>
                    <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2 py-0.5 rounded-full">
                      {leads.filter((l) => l.status === "new").length}
                    </span>
                  </div>
                  {leads.filter((l) => l.status === "new").length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic py-2">
                      Все новые заявки обработаны
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {leads
                        .filter((l) => l.status === "new")
                        .map((l) => (
                          <div
                            key={l.id}
                            className="p-2 bg-amber-50/50 border border-amber-100 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800">
                                {l.childSurname} {l.childName} {l.childAge ? `(${l.childAge} лет)` : ""}
                              </div>
                              <div className="text-[10px] text-amber-800">
                                {l.parentName} • {l.parentPhone}
                              </div>
                            </div>
                            {setActiveTab && (
                              <button
                                onClick={() => setActiveTab("hq_leads")}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2 py-1 rounded transition shrink-0"
                              >
                                В работу
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-rose-600" />
                      Неоплаченные абонементы / Долги
                    </span>
                    <span className="bg-rose-100 text-rose-800 font-bold text-xs px-2 py-0.5 rounded-full">
                      {debtorsList.length}
                    </span>
                  </div>
                  {debtorsList.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic py-2">
                      Долги и задолженности отсутствуют
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {debtorsList.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 bg-rose-50/50 border border-rose-100 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">
                              {c.childSurname} {c.childName}
                            </div>
                            <div className="text-[10px] text-rose-700">
                              {c.parentName} ({c.parentPhone})
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDebtorsModal(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2 py-1 rounded transition"
                          >
                            Долг
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Card 3: Не сдан отчет по тренировке */}
              <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Тренер не сдал отчет
                  </span>
                  <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2 py-0.5 rounded-full">
                    {missingTrainerReports.length}
                  </span>
                </div>
                {missingTrainerReports.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic py-2">
                    Все прошедшие тренировки с зафиксированными табелями!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {missingTrainerReports.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 bg-amber-50/60 border border-amber-200/60 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            {m.groupName}
                          </div>
                          <div className="text-[10px] text-amber-800 font-mono">
                            {m.coachName} • {m.dateStr} ({m.slot})
                          </div>
                        </div>
                        <span className="bg-amber-200 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Нет отчета
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Органичные окна: Аренда за месяц и Зарплаты за месяц (в светлой стилистике дашборда) */}
          {currentRole !== "manager" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Аренда за месяц */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Аренда за месяц (начислено)
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Органичное окно автоначислений аренды по сессиям
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-mono font-bold">
                    {monthlyRentRecords.length} транзакций
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {monthlyRentSum.toLocaleString("ru-RU")} ₽
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Начислено за текущий период ({currentMonthStr})
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {venueRatings.slice(0, 3).map((v, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 p-2 rounded-xl border border-slate-100"
                    >
                      <div className="text-[10px] text-slate-500 truncate">
                        {v.name}
                      </div>
                      <div className="text-xs font-bold text-indigo-600 mt-0.5">
                        {v.rentAccrued > 0
                          ? `${v.rentAccrued.toLocaleString("ru-RU")} ₽`
                          : `${(v.groupsCount * 12 * 1200).toLocaleString(
                              "ru-RU",
                            )} ₽ (расчет)`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Зарплаты за месяц */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Зарплаты за месяц (начислено)
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Органичное окно начислений ФОТ тренерского штаба
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-mono font-bold">
                    {coaches.length} тренеров
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                      {monthlySalarySum > 0
                        ? monthlySalarySum.toLocaleString("ru-RU")
                        : (trainingSessions.length * 1500).toLocaleString(
                            "ru-RU",
                          )}{" "}
                      ₽
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ФОТ за проведение {trainingSessions.length} тренировок
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {coaches.slice(0, 3).map((c, i) => {
                    const coachSessions = trainingSessions.filter(
                      (ts) =>
                        ts.coachId === c.id ||
                        ts.coachName?.includes(c.name),
                    ).length;
                    const estimatedPay = coachSessions * (c.rate || 1500);
                    return (
                      <div
                        key={i}
                        className="bg-slate-50 p-2 rounded-xl border border-slate-100"
                      >
                        <div className="text-[10px] text-slate-500 truncate">
                          {c.name}
                        </div>
                        <div className="text-xs font-bold text-emerald-600 mt-0.5">
                          {estimatedPay > 0
                            ? `${estimatedPay.toLocaleString("ru-RU")} ₽`
                            : `${c.rate || 1500} ₽/зан.`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Цели месяца, Воронка продаж, Отмененные тренировки и Рейтинг площадок */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Цели месяца */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      Цели месяца ({currentMonthStr})
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      {currentRole === "manager"
                        ? "Отслеживание ключевых KPI по набору учеников и новым заявкам"
                        : "Отслеживание ключевых KPI футбольного клуба по набору и выручке"}
                    </p>
                  </div>
                  {isEditingGoals ? (
                    <button
                      onClick={handleSaveGoals}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                    >
                      Сохранить
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTempChildrenGoal(targetChildrenGoal);
                        setTempRevenueGoal(targetRevenueGoal);
                        setIsEditingGoals(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Изменить цели
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Goal 1: Children count */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Цель по детям</span>
                      {isEditingGoals ? (
                        <input
                          type="number"
                          value={tempChildrenGoal}
                          onChange={(e) => setTempChildrenGoal(Number(e.target.value))}
                          className="w-20 border rounded px-2 py-0.5 text-xs text-right font-mono"
                        />
                      ) : (
                        <span className="font-mono text-emerald-600">{clients.length} / {targetChildrenGoal} детей</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((clients.length / targetChildrenGoal) * 100))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span>Выполнение: {Math.round((clients.length / targetChildrenGoal) * 100)}%</span>
                      <span>Осталось: {Math.max(0, targetChildrenGoal - clients.length)} детей</span>
                    </div>
                  </div>

                  {/* Goal 2: Revenue for Director; Leads for Manager */}
                  {currentRole === "manager" ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Цель по новым заявкам</span>
                        <span className="font-mono text-amber-600">{leads.length} / 50 заявок</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((leads.length / 50) * 100))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>Выполнение: {Math.round((leads.length / 50) * 100)}%</span>
                        <span>Осталось: {Math.max(0, 50 - leads.length)} заявок</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                      {(() => {
                        const monthRevenue = finances
                          .filter((f) => f.type === "income" && f.date.substring(0, 7) === currentMonthStr)
                          .reduce((sum, item) => sum + Number(item.amount || 0), 0);
                        const percent = Math.round((monthRevenue / targetRevenueGoal) * 100);
                        return (
                          <>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                              <span>Цель по выручке</span>
                              {isEditingGoals ? (
                                <input
                                  type="number"
                                  value={tempRevenueGoal}
                                  onChange={(e) => setTempRevenueGoal(Number(e.target.value))}
                                  className="w-28 border rounded px-2 py-0.5 text-xs text-right font-mono"
                                />
                              ) : (
                                <span className="font-mono text-emerald-600">{monthRevenue.toLocaleString("ru-RU")} / {targetRevenueGoal.toLocaleString("ru-RU")} ₽</span>
                              )}
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, percent)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                              <span>Выполнение: {percent}%</span>
                              <span>Осталось: {Math.max(0, targetRevenueGoal - monthRevenue).toLocaleString("ru-RU")} ₽</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Воронка продаж */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                <div className="flex border-b pb-3 items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Воронка продаж футбольной школы
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Конверсия от первого касания до платящего ученика
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                    Конверсия: {leads.length > 0 ? Math.round((activeClients.length / (leads.length + activeClients.length)) * 100) : 0}%
                  </span>
                </div>

                <div className="space-y-4 font-sans mt-2">
                  {funnelData.map((fn, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                      className="relative text-left"
                    >
                      {idx > 0 && fn.conversionFromPrev !== null && (
                        <div className="absolute -top-3.5 right-6 flex items-center justify-end z-10">
                          <div className="bg-white border shadow-sm rounded-full px-2 py-0.5 text-[9px] font-bold text-slate-500 z-10 flex items-center gap-1">
                            <span className="text-emerald-500">↘</span>{" "}
                            {fn.conversionFromPrev}%
                          </div>
                        </div>
                      )}

                      <div className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-100/50 shadow-sm ${fn.lightBg} relative overflow-hidden group`}>
                        <motion.div
                          className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${fn.color} opacity-10`}
                          initial={{ width: 0 }}
                          animate={{ width: `${fn.percent}%` }}
                          transition={{ delay: 0.3 + idx * 0.1, duration: 0.8, ease: "easeOut" }}
                        />

                        <div className="flex items-center space-x-3 relative z-10">
                          <div className={`w-8 h-8 rounded-lg ${fn.bgMain} text-white flex items-center justify-center text-sm shadow-md`}>
                            {fn.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{fn.stage}</div>
                            <div className="text-[10px] text-slate-500">
                              Доля: <span className="font-medium text-slate-700">{fn.percent}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="font-mono text-right relative z-10">
                          <span className="text-lg font-black text-slate-900 block leading-none">{fn.count}</span>
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Лидов</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* РЕЙТИНГ ПЛОЩАДОК */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-600" />
                      Рейтинг площадок (Дети по филиалам)
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Количество заниматься детей и начисленная аренда по каждой локации
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    {venueRatings.length} площадок
                  </span>
                </div>

                <div className="space-y-3">
                  {venueRatings.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      Группы и площадки пока не привязаны
                    </p>
                  ) : (
                    venueRatings.map((v, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-850 flex items-center gap-2">
                            <span>{v.name}</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-semibold">
                              {v.groupsCount} групп
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Аренда начислено: <span className="font-bold text-slate-700">{v.rentAccrued > 0 ? `${v.rentAccrued.toLocaleString("ru-RU")} ₽` : "Включено"}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-slate-900 font-mono">
                            {v.childrenCount} детей
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {v.percent}% от всех учеников
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ОТМЕНЕННЫЕ ТРЕНИРОВКИ */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-600" />
                      Отмененные тренировки (Аналитика отмен)
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Статистика отмен и фиксация причин для оптимизации расписания
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
                      <button
                        onClick={() => setCancellationScope("month")}
                        className={`px-2.5 py-1 rounded-md transition ${cancellationScope === "month" ? "bg-white text-slate-900 shadow-2xs" : "text-gray-500"}`}
                      >
                        За месяц
                      </button>
                      <button
                        onClick={() => setCancellationScope("all")}
                        className={`px-2.5 py-1 rounded-md transition ${cancellationScope === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-gray-500"}`}
                      >
                        За всё время
                      </button>
                    </div>

                    <button
                      onClick={() => setShowAddCancellationModal(true)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Зафиксировать отмену
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(cancelledByReason).map(([reason, count], idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-600 text-[11px] font-medium">{reason}</span>
                      <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pt-2">
                  {filteredCancelledSessions.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 italic bg-slate-50/50 rounded-xl border border-dashed">
                      Отмененных тренировок за выбранный период не зафиксировано
                    </div>
                  ) : (
                    filteredCancelledSessions.map((cs) => (
                      <div key={cs.id} className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{cs.groupName}</span>
                            <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {cs.reason}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Дата: <span className="font-mono font-bold">{cs.date}</span> {cs.coachName ? `• Тренер: ${cs.coachName}` : ""}
                          </div>
                          {cs.notes && (
                            <p className="text-[10px] text-gray-400 italic">{cs.notes}</p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (window.confirm("Удалить запись об отмене?")) {
                              deleteCancelledSession(cs.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition"
                          title="Удалить запись"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Посещаемость по дням недели - Image 7 middle right */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <div className="flex border-b pb-3 items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Распределение посещаемости по дням недели
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Процент заполненности тренировочных слотов манежа
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                    {avgAttendanceRate}% Средняя
                  </span>
                </div>

                {/* Bar charts customized via simple CSS flexbox columns */}
                <div className="h-44 flex items-end justify-between px-4 pt-4 select-none">
                  {attendanceChartData.map((item, id) => (
                    <div
                      key={id}
                      className="flex flex-col items-center space-y-2 w-10"
                    >
                      <div className="relative w-7 bg-emerald-50 hover:bg-emerald-100/60 rounded-t-lg h-32 flex items-end justify-center select-none group">
                        <div className="absolute -top-6 text-[9px] font-bold font-mono text-slate-900 opacity-60 group-hover:opacity-100 transition whitespace-nowrap">
                          {item.rate}%
                        </div>
                        <div
                          className="bg-emerald-500 w-full rounded-t-lg transition-all duration-500"
                          style={{ height: `${item.rate}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 font-mono">
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ближайшие запланированные тренировочные сессии */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-950 text-sm text-left">
                  Ближайшие тренировки групп
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 text-left">
                  {upcomingSessions.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-xs text-gray-400 italic">
                      Расписание тренировок отсутствует. Внесите группы с
                      регулярным графиком занятий.
                    </div>
                  ) : (
                    upcomingSessions.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between hover:shadow-2xs transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-855 text-xs">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {item.time}
                          </div>
                          <p className="text-[10px] text-gray-505 font-medium">
                            Тренер: {item.coach}
                          </p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: Tasks and controls */}
            <div className="space-y-6">
              {/* Задачник руководителя - Image 7 bottom right */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                <div className="flex border-b pb-3 items-center justify-between group">
                  <h3 className="font-extrabold text-slate-950 text-sm">
                    Мониторинг управленческих задач
                  </h3>
                  {setActiveTab && (
                    <button
                      onClick={() => setActiveTab("hq_tasks")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold"
                    >
                      Перейти →
                    </button>
                  )}
                  <ClipboardList className="w-4 h-4 text-gray-400 ml-2" />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newDirectorTask}
                    onChange={(e) => setNewDirectorTask(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddDirectorTask()
                    }
                    placeholder="Новая задача..."
                    className="flex-1 border bg-slate-50 border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder-gray-400"
                  />
                  <button
                    onClick={handleAddDirectorTask}
                    className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm active:scale-95 transition-all outline-none"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs font-sans max-h-[340px] overflow-y-auto pr-1">
                  {directorTasks.length === 0 ? (
                    <p className="text-gray-400 italic py-2">
                      Задач руководителя не найдено.
                    </p>
                  ) : (
                    directorTasks.map((tk, idx) => (
                      <div
                        key={tk.id || idx}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTaskId(tk.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedTaskId && draggedTaskId !== tk.id) {
                            reorderDirectorTasks(draggedTaskId, tk.id);
                          }
                          setDraggedTaskId(null);
                        }}
                        className={`flex items-start space-x-2 text-xs leading-relaxed p-2.5 rounded-xl border transition group ${
                          draggedTaskId === tk.id
                            ? "bg-slate-100 border-dashed border-slate-300 opacity-60"
                            : "bg-slate-50 hover:bg-slate-100/90 border-slate-200/80 shadow-2xs"
                        }`}
                      >
                        {/* Drag Handle Icon */}
                        <div
                          className="mt-0.5 p-0.5 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 transition"
                          title="Зажмите для перетаскивания задачи"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Complete Checkbox */}
                        <button
                          onClick={() => {
                            completeTask(tk.id);
                            alert("Задача стянута в архив решенных задач!");
                          }}
                          className={`mt-0.5 p-0.5 border rounded transition shrink-0 ${
                            tk.status === "completed"
                              ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                              : "border-gray-300 bg-white text-transparent hover:border-emerald-500 cursor-pointer"
                          }`}
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                        </button>

                        {/* Task Info */}
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <h4
                            className={`font-semibold pr-2 break-words ${
                              tk.status === "completed" ? "line-through text-gray-400" : "text-slate-800"
                            }`}
                          >
                            {tk.title}
                          </h4>
                          {tk.description && (
                            <p className="text-[10px] text-gray-400 break-words leading-tight">
                              {tk.description}
                            </p>
                          )}
                          <div
                            className={`text-[9px] font-mono font-bold mt-1 ${
                              tk.dueDate ===
                              (() => {
                                const n = new Date();
                                return `${String(n.getDate()).padStart(2, "0")}.${String(n.getMonth() + 1).padStart(2, "0")}.${n.getFullYear()}`;
                              })()
                                ? "text-amber-600 bg-amber-50 px-1 py-0.5 rounded w-fit"
                                : "text-gray-400"
                            }`}
                          >
                            {tk.dueDate}
                          </div>
                        </div>

                        {/* Move Up / Down Buttons & Delete */}
                        <div className="flex items-center space-x-1 shrink-0 mt-0.5">
                          <div className="flex flex-col space-y-0.5">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveDirectorTask(tk.id, "up")}
                              className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 transition hover:bg-slate-200/60 rounded"
                              title="Переместить вверх"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={idx === directorTasks.length - 1}
                              onClick={() => moveDirectorTask(tk.id, "down")}
                              className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 transition hover:bg-slate-200/60 rounded"
                              title="Переместить вниз"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm("Удалить задачу?")) {
                                deleteTask(tk.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition ml-1"
                            title="Удалить задачу"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Gamification achievement monitor */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-extrabold text-slate-905 text-sm">
                    Лидеры успеваемости учеников
                  </h3>
                  <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Воспитанники, набравшие наивысший балл по итогам этого месяца:
                </p>

                <div className="space-y-3 text-xs font-sans">
                  {leaderboardToDisplay.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <TrendingUp className="w-6 h-6 text-slate-300 mb-2" />
                      <div className="text-xs text-gray-500 font-medium">
                        Нет активных оценок
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Оценки или посещения пока отсутствуют
                      </div>
                    </div>
                  ) : (
                    leaderboardToDisplay.map((top, idx) => (
                      <div
                        key={top.id || idx}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-emerald-200 transition-all duration-300 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center space-x-3 z-10 relative">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-sans text-xs font-extrabold shrink-0 shadow-sm ${
                              idx === 0
                                ? "bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 ring-2 ring-amber-100"
                                : idx === 1
                                  ? "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800"
                                  : idx === 2
                                    ? "bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900"
                                    : "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800"
                            }`}
                          >
                            {idx === 0 ? (
                              <Trophy className="w-4 h-4 text-amber-900 drop-shadow-sm" />
                            ) : (
                              top.avatar
                            )}
                          </div>
                          <div className="text-left space-y-0.5 min-w-0">
                            <div className="font-bold text-slate-800 truncate">
                              {top.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium whitespace-nowrap">
                              <span
                                className="truncate max-w-[85px] block text-slate-400"
                                title={top.group}
                              >
                                {top.group}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                                {top.medals}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end z-10 relative">
                          <div className="flex items-center space-x-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <div className="font-black text-slate-900 font-mono text-base tracking-tight">
                              {top.rating}
                            </div>
                          </div>
                          <div className="text-[8.5px] text-gray-400 font-black uppercase font-mono tracking-widest mt-0.5">
                            {top.avgScore > 0
                              ? "Оценка навыков"
                              : "Рейтинг посещений"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* БЛОК ФИНАНСЫ С ЦВЕТНОЙ ДИАГРАММОЙ (Органично под Лидерами успеваемости) */}
              {currentRole !== "manager" && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">Финансы</h3>
                        <p className="text-[10px] text-gray-500 font-medium">Соотношение доходов и расходов</p>
                      </div>
                    </div>
                    <select
                      value={financePeriod}
                      onChange={(e) => setFinancePeriod(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium outline-none cursor-pointer hover:border-slate-300 transition"
                    >
                      <option value="today">Сегодня</option>
                      {availableFinanceMonths.map((ym) => (
                        <option key={ym} value={ym}>
                          {getMonthLabel(ym)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Left indicators */}
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: "#32cd32" }}></span>
                          <span>Поступления</span>
                        </div>
                        <div className="text-base font-bold text-emerald-600 font-mono tracking-tight mt-0.5">
                          {incomeVal.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: "#ff0000" }}></span>
                          <span>Расходы</span>
                        </div>
                        <div className="text-base font-bold text-red-600 font-mono tracking-tight mt-0.5">
                          {expenseVal.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Остаток на счетах</div>
                        <div className="text-base font-black text-slate-800 font-mono tracking-tight mt-0.5">
                          {totalBalance.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    </div>

                    {/* Right Ring Donut Chart */}
                    <div className="h-32 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={financePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={44}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {financePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeSection === "training_sessions" ? (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6 text-left">
          {/* Top analytical cards for training reports */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left relative overflow-hidden">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                Проведено тренировок
              </span>
              <div className="text-3xl font-light text-slate-800 mt-1 tracking-tight">
                {trainingSessions.length}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                Все табели утверждены
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left relative overflow-hidden">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                Ср. Явка учеников
              </span>
              <div className="text-3xl font-light text-slate-800 mt-1 tracking-tight">
                {(() => {
                  const total = trainingSessions.reduce(
                    (sum, s) =>
                      sum + s.presentCount + s.sickCount + s.absentCount,
                    0,
                  );
                  const present = trainingSessions.reduce(
                    (sum, s) => sum + s.presentCount,
                    0,
                  );
                  return total > 0 ? Math.round((present / total) * 100) : 88;
                })()}
                %
              </div>
              <div className="text-[10px] text-gray-400 font-semibold mt-1">
                Целевой показатель: 85%
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left relative overflow-hidden">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                Списано занятий
              </span>
              <div className="text-3xl font-light text-slate-800 mt-1 tracking-tight">
                {trainingSessions.reduce((sum, s) => sum + s.presentCount, 0)}{" "}
                ед.
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                Вычет из баланса пакетов
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left relative overflow-hidden">
              <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                Уважительная причина
              </span>
              <div className="text-3xl font-light text-indigo-600 mt-1 tracking-tight">
                {trainingSessions.reduce((sum, s) => sum + s.sickCount, 0)} зан.
              </div>
              <div className="text-[10px] text-indigo-500 font-semibold mt-1">
                Тренировки сохранены (уваж.)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Log table of sessions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Журнал и табели тренировок
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Нажмите на строку тренировки для просмотра полного
                      протокола и фотоподтверждения
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    Живая синхронизация
                  </span>
                </div>

                <div className="space-y-3">
                  {trainingSessions.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">
                        Тренеры еще не заполнили ни одной ведомости за сегодня.
                      </p>
                    </div>
                  ) : (
                    trainingSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionDetail(session)}
                        className="group border border-gray-100 rounded-xl p-3.5 bg-slate-50 hover:bg-white hover:border-emerald-500/30 hover:shadow-sm transition cursor-pointer flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-slate-900 group-hover:text-emerald-600 transition text-[13px]">
                              {session.groupName}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                              {formatSessionDateDisplay(session.date, session.dateString)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            <span className="text-gray-400">Инструктор:</span>{" "}
                            {session.coachName}
                          </p>
                          <div className="flex space-x-3 text-[10px] pt-1">
                            <span className="text-emerald-650 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              ✓ {session.presentCount} присут.
                            </span>
                            {session.sickCount > 0 && (
                              <span className="text-blue-650 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                Уваж. {session.sickCount}
                              </span>
                            )}
                            {session.absentCount > 0 && (
                              <span className="text-amber-650 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                                Прогул {session.absentCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Notes snippet */}
                        <div className="flex-1 max-w-sm text-xs bg-white/70 group-hover:bg-white p-2 rounded-lg border border-gray-150/50 truncate italic text-gray-500 text-left">
                          "{session.notes || "Без текстовой заметки"}"
                        </div>

                        {/* Photo status */}
                        <div className="shrink-0 flex items-center space-x-2">
                          {session.photoUrl ? (
                            <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-200 shadow-3xs relative group-hover:border-emerald-400 transition">
                              <img
                                src={session.photoUrl}
                                alt="report"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                                <Camera className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 border border-dashed border-gray-350 flex items-center justify-center">
                              <Camera className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="text-[10px] text-right font-bold text-gray-400 group-hover:text-emerald-600 transition">
                            Детали →
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar analytics */}
            <div className="space-y-6">
              {/* Group Attendance Stats board */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-950 text-sm">
                  Посещаемость по группам
                </h3>

                <div className="space-y-3.5">
                  {Array.from(
                    new Set(trainingSessions.map((s) => s.groupName)),
                  ).map((gpName) => {
                    const gSessions = trainingSessions.filter(
                      (s) => s.groupName === gpName,
                    );
                    const totalPlayers = gSessions.reduce(
                      (sum, s) =>
                        sum + s.presentCount + s.sickCount + s.absentCount,
                      0,
                    );
                    const present = gSessions.reduce(
                      (sum, s) => sum + s.presentCount,
                      0,
                    );
                    const rate =
                      totalPlayers > 0
                        ? Math.round((present / totalPlayers) * 100)
                        : 90;

                    return (
                      <div key={gpName} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">
                            {gpName}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {rate}% явки
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              rate >= 90
                                ? "bg-emerald-500"
                                : rate >= 80
                                  ? "bg-indigo-500"
                                  : "bg-amber-500"
                            }`}
                            style={{ width: `${rate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Утверждено зарядок: {gSessions.length}</span>
                          <span>{present} посещений</span>
                        </div>
                      </div>
                    );
                  })}
                  {Array.from(new Set(trainingSessions.map((s) => s.groupName)))
                    .length === 0 && (
                    <p className="text-xs text-gray-400">
                      Групповые данные не сформированы.
                    </p>
                  )}
                </div>
              </div>

              {/* Coach KPI status card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white space-y-4 text-left shadow-md">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-[13px] text-white">
                    Дисциплина тренеров
                  </span>
                </div>
                <p className="text-[11px] text-slate-350 leading-relaxed">
                  Все тренеры обязаны сдавать электронные ведомости в течение 1
                  часа после окончания занятий.
                </p>

                <div className="space-y-2 pt-1 font-sans text-xs">
                  {coaches.map((c) => {
                    const sessionsByCoach = trainingSessions.filter(
                      (s) => s.coachId === c.id || s.coachName.includes(c.name),
                    );
                    return (
                      <div
                        key={c.id}
                        className="flex justify-between items-center py-1.5 border-b border-white/10"
                      >
                        <span className="font-medium text-slate-200">
                          {c.name}
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {sessionsByCoach.length} отчетов сдано
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Protocol Dialog Modal */}
          {selectedSessionDetail && (
            <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-in">
                {/* Modal Header */}
                <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm">
                      {selectedSessionDetail.groupName}
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-semibold font-mono">
                      Протокол тренировки от {formatSessionDateDisplay(selectedSessionDetail.date, selectedSessionDetail.dateString)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSessionDetail(null)}
                    className="p-1 hover:bg-white/10 rounded-full text-white transition font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                  {/* Photo & Notes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-black tracking-wider mb-2">
                        Официальный фотоотчет
                      </span>
                      {selectedSessionDetail.photoUrl ? (
                        <div
                          className="h-44 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-3xs relative cursor-pointer group"
                          onClick={() =>
                            setFullScreenPhoto(selectedSessionDetail.photoUrl)
                          }
                        >
                          <img
                            src={selectedSessionDetail.photoUrl}
                            alt="soccer drill"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white font-bold bg-black/50 px-3 py-1 rounded-full text-xs">
                              УВЕЛИЧИТЬ
                            </span>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                            Фото подтверждено
                          </div>
                        </div>
                      ) : (
                        <div className="h-44 w-full rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-300 mb-1" />
                          <span className="text-xs text-gray-400 font-medium">
                            Фотоотчет не приложен
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <span className="block text-[10px] text-gray-400 uppercase font-black tracking-wider mb-2">
                          Заметки и разбор тренера
                        </span>
                        <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl min-h-[110px] text-xs text-slate-800 leading-relaxed font-sans italic">
                          "
                          {selectedSessionDetail.notes ||
                            "Тренер не оставил комментариев по этой тренировке."}
                          "
                        </div>
                      </div>
                      <div className="pt-2 text-xs font-semibold text-slate-500">
                        Отправитель:{" "}
                        <span className="text-slate-900 font-bold">
                          {selectedSessionDetail.coachName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Check List */}
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">
                      Ведомость посещений (
                      {selectedSessionDetail.records?.length || 0} уч.)
                    </span>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-slate-50">
                      {(selectedSessionDetail.records || []).map(
                        (rec: any, index: number) => (
                          <div
                            key={index}
                            className="px-4 py-2.5 flex justify-between items-center text-xs"
                          >
                            <span className="font-extrabold text-slate-800">
                              {rec.clientName || rec.clientId}
                            </span>
                            <div>
                              {rec.status === "present" ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wide">
                                  Присутствовал
                                </span>
                              ) : rec.status === "absent_sick" ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[9px] uppercase tracking-wide">
                                  Уважительная{" "}
                                  {rec.reason ? `(${rec.reason})` : ""}
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wide">
                                  Прогул {rec.reason ? `(${rec.reason})` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                  <button
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Удалить ведомость по тренировке группы "${selectedSessionDetail.groupName}" от ${formatSessionDateDisplay(selectedSessionDetail.date, selectedSessionDetail.dateString)}?`
                        )
                      ) {
                        await deleteTrainingSession(selectedSessionDetail.id);
                        setSelectedSessionDetail(null);
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    Удалить ведомость
                  </button>
                  <button
                    onClick={() => setSelectedSessionDetail(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
                  >
                    Закрыть отчет
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // BULK UPLOAD / CRM IMPORT AND TABLE VIEW MODULE
        <div
          id="import-management-module"
          className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6"
        >
          {/* Header alert / Toast cards */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl flex items-center space-x-3 text-slate-800 animate-fade-in text-xs justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="font-semibold leading-relaxed">
                  {successMessage}
                </span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="p-1 hover:bg-emerald-100 rounded text-slate-500"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center space-x-3 text-red-950 animate-fade-in text-xs justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="font-semibold leading-relaxed">
                  {errorMessage}
                </span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:bg-red-100 rounded text-red-500"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT INPUT & PARSE SETTINGS GRID PANEL */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-5 text-left">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm flex items-center space-x-2">
                  <Upload className="w-4.5 h-4.5 text-red-600" />
                  <span>Панель импорта внешних таблиц</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  Органичный инструмент для миграции детей, заявок и проводок с
                  Excel, CSV или текстового табеля.
                </p>
              </div>

              {/* Target Entity Pill Choice */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  1. Выберите целевой раздел CRM:
                </label>
                <div
                  id="target-section-selector"
                  className="grid grid-cols-4 gap-2"
                >
                  {[
                    {
                      id: "clients",
                      label: "👥 Ученики",
                      count: clients.length,
                    },
                    { id: "leads", label: "📂 Лиды", count: leads.length },
                    {
                      id: "finances",
                      label: "💳 Финансы",
                      count: finances.length,
                    },
                    {
                      id: "coaches",
                      label: "📋 Тренеры",
                      count: coaches?.length || 0,
                    },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setImportType(sec.id as any);
                        setParsedData([]);
                        setRawGrid([]);
                        setColMappings([]);
                        setErrorMessage(null);
                      }}
                      className={`py-2 px-1 rounded-xl border font-bold text-[9px] text-center transition duration-150 ${
                        importType === sec.id
                          ? "border-red-500 bg-red-50 text-red-650 shadow-2xs"
                          : "border-gray-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div>{sec.label}</div>
                      <div className="text-[8px] font-medium opacity-70 mt-0.5">
                        ({sec.count} в базе)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo presets to allow immediate visual testing of table populate */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Быстрый тест (Загрузить примеры):
                </label>
                <div className="flex flex-wrap gap-1.5_temp flex-row">
                  <div className="flex flex-wrap gap-1.5 w-full">
                    <button
                      onClick={() => handleApplyPreset("clients")}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-semibold transition flex items-center"
                    >
                      <Sparkles className="w-3 h-3 text-red-600 mr-1" />
                      <span>Таблица учеников</span>
                    </button>
                    <button
                      onClick={() => {
                        setImportType("clients");
                        const text = `Балагетдинов Дамир Артурович\n26-11-2018 (7)\n\nРодители\n\nБалагетдинова Эльвира Фидаисовна\nНесколько дней назад\n79082543053\nelvira.balagetdinova@yandex.ru\nВ базе с: 14-05-2026\n\nСмирнов Иван Алексеевич\n12-05-2015 (11)\n\nРодители\n\nСмирнова Мария Ивановна\n79123456789\nmaria@mail.ru\nВ базе с: 10-02-2025`;
                        setRawText(text);
                        parseData(text, "clients");
                      }}
                      className="py-1 px-2 bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 hover:from-red-100 hover:to-orange-100 text-red-700 rounded-lg text-[10px] font-black transition flex items-center shadow-3xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600 mr-1 animate-pulse" />
                      <span>Копирование из AkratoPRIME ⭐️</span>
                    </button>
                    <button
                      onClick={() => handleApplyPreset("leads")}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-semibold transition flex items-center"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
                      <span>Лиды</span>
                    </button>
                    <button
                      onClick={() => handleApplyPreset("finances")}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-semibold transition flex items-center"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500 mr-1" />
                      <span>Финансы</span>
                    </button>
                    <button
                      onClick={() => handleApplyPreset("coaches")}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-semibold transition flex items-center"
                    >
                      <Sparkles className="w-3 h-3 text-teal-500 mr-1" />
                      <span>Тренеры</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Structured expectations helper */}
              <div className="p-3 bg-neutral-50 rounded-xl border text-[10px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-900 flex items-center space-x-1 border-b pb-1 mb-1">
                  <Info className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                  <span>Варианты и форматы импорта:</span>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-700 font-extrabold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>1. Копирование карточек AkratoPRIME (Блоки):</span>
                  </p>
                  <p className="text-neutral-500 pl-2.5">
                    Просто скопируйте карточки детей с родителями целиком из
                    личного кабинета AkratoPRIME и вставьте в текстовое поле.
                    Система автоматически и корректно разложит ФИО ребенка, год
                    рождения, возраст, ФИО родителя, телефон, email и служебные
                    отметки в поля CRM!
                  </p>
                </div>
                <div className="pt-1.5 space-y-1 border-t border-slate-200/60 mt-1.5">
                  <p className="text-slate-700 font-extrabold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>2. Стандартные таблицы (Excel / CSV / TSV):</span>
                  </p>
                  {importType === "clients" && (
                    <p className="font-mono text-[9px] leading-tight text-neutral-500 pl-2.5">
                      ФамилияРебенка [таб/запятая] Имя [таб] ГодРождения [таб]
                      ФиоРодителя [таб] Телефон [таб] Email [таб] НазваниеГруппы
                    </p>
                  )}
                  {importType === "leads" && (
                    <p className="font-mono text-[9px] leading-tight text-neutral-500 pl-2.5">
                      ИмяРебенка [таб/запятая] Фамилия [таб] Возраст [таб]
                      ФиоРодителя [таб] Телефон [таб] ИсточникСвязи
                    </p>
                  )}
                  {importType === "finances" && (
                    <p className="font-mono text-[9px] leading-tight text-neutral-500 pl-2.5">
                      ГГГГ-ММ-ДД [таб/запятая] Тип (income/expense) [таб]
                      Категория [таб] Сумма [таб] Название/ОписаниеОрдера
                    </p>
                  )}
                  {importType === "coaches" && (
                    <p className="font-mono text-[9px] leading-tight text-neutral-500 pl-2.5">
                      ФИОТренера [таб/запятая] Должность [таб] ГодСтарта [таб]
                      Нагрузка (%) [таб] Рейтинг [таб] Статус
                    </p>
                  )}
                </div>
              </div>

              {/* Paste Text Area & File Drop Zone */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  2. Вставьте строки или перетащите файл:
                </label>

                {/* Drag zone wrapper */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative p-1 rounded-2xl border-2 border-dashed transition-all ${
                    dragActive
                      ? "border-red-500 bg-red-50/40"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <textarea
                    id="import-data-textarea"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Вставьте сюда ячейки, скопированные из Excel или txt файлов..."
                    className="w-full h-36 p-3 text-xs font-mono bg-slate-50 border-0 focus:ring-0 rounded-xl resize-none focus:outline-none placeholder-gray-400"
                  />
                  {dragActive && (
                    <div className="absolute inset-0 bg-red-50/90 rounded-2xl flex flex-col items-center justify-center text-xs text-red-600 font-bold">
                      <Upload className="w-7 h-7 animate-bounce mb-1" />
                      <span>Отпустите мышь для чтения файла</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Parse triggers */}
              <div className="flex gap-2.5">
                <button
                  id="btn-parse-table"
                  onClick={() => parseData(rawText, importType)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider text-white rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-4.5 h-4.5" />
                  <span>Распознать таблицу</span>
                </button>
                <button
                  id="btn-clear-staging-input"
                  onClick={handleClearBuffer}
                  className="px-3 bg-slate-100 hover:bg-slate-200 border text-slate-700 font-bold text-xs rounded-xl transition"
                  title="Очистить все текстовые поля"
                >
                  Очистить
                </button>
              </div>

              {/* STEP 2.5: Interactive Smart Column Mapping workspace */}
              {rawGrid.length > 0 && colMappings.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl text-left space-y-3 mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-150 pb-2">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        <span>Сопоставление колонок</span>
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        Укажите, за какое поле CRM отвечает каждый столбец.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleToggleHeader(!isHeaderFirstLine)}
                        className={`px-2 py-1 rounded text-[9px] font-bold border transition ${
                          isHeaderFirstLine
                            ? "bg-red-600 border-red-600 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100 border-gray-200"
                        }`}
                      >
                        {isHeaderFirstLine ? "Заголовки: Да" : "Заголовки: Нет"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {colMappings.map((mappedKey, colIdx) => {
                      const sampleVal =
                        (isHeaderFirstLine
                          ? rawGrid[1]?.[colIdx]
                          : rawGrid[0]?.[colIdx]) ||
                        rawGrid[0]?.[colIdx] ||
                        "пусто";
                      const headerName = isHeaderFirstLine
                        ? rawGrid[0]?.[colIdx]
                        : null;

                      return (
                        <div
                          key={colIdx}
                          className="bg-white p-2.5 rounded-lg border border-gray-150 shadow-3xs flex flex-col space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Столбец #{colIdx + 1}</span>
                            {headerName && (
                              <span
                                className="font-bold text-red-650 max-w-[140px] truncate bg-red-50/50 px-1 py-0.5 rounded"
                                title={headerName}
                              >
                                Header: {headerName}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-700 truncate font-medium">
                            Пример данных:{" "}
                            <span className="text-slate-900 font-bold font-mono">
                              "{sampleVal}"
                            </span>
                          </div>

                          <select
                            value={mappedKey}
                            onChange={(e) =>
                              handleMapColumn(colIdx, e.target.value)
                            }
                            className="w-full text-[11px] font-bold bg-slate-50 border border-gray-200 rounded p-1.5 focus:ring-1 focus:ring-red-500 text-slate-700"
                          >
                            <option value="skip">⚠️ Пропустить столбец</option>
                            {FIELD_DEFINITIONS[importType].map((field) => (
                              <option key={field.key} value={field.key}>
                                {field.required ? "★ " : ""}
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT STAGING PREVIEW TABLE & ACTION STATION */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm flex items-center space-x-2">
                      <FileText className="w-4.5 h-4.5 text-slate-700" />
                      <span>Просмотр и Редактирование загруженных данных</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Отредактируйте или удалите строки, исключив бесполезные
                      записи перед записью в основную CRM.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-50 text-red-650 rounded-lg text-xs font-extrabold font-mono border border-red-100">
                    строк: {parsedData.length}
                  </span>
                </div>

                {parsedData.length === 0 ? (
                  <div className="h-64 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                    <FileText className="w-10 h-10 text-neutral-200" />
                    <div className="text-xs font-bold text-slate-600">
                      Таблица буфера пуста
                    </div>
                    <p className="text-[10px] max-w-sm leading-relaxed text-gray-500">
                      Вставьте скопированный текст слева, либо воспользуйтесь
                      "Примерами" для ознакомления.
                    </p>
                  </div>
                ) : (
                  // STAGING TABLE MANAGER
                  <div className="overflow-x-auto border rounded-xl bg-slate-50/50 max-h-96">
                    <table className="min-w-full text-xs text-left text-gray-700">
                      <thead className="text-[10px] uppercase bg-slate-100 text-slate-650 font-bold border-b">
                        {importType === "clients" && (
                          <tr>
                            <th className="px-4 py-2.5">Ученик</th>
                            <th className="px-4 py-2.5">Год рожд.</th>
                            <th className="px-4 py-2.5">Родитель</th>
                            <th className="px-4 py-2.5">Телефон</th>
                            <th className="px-4 py-2.5">Группа</th>
                            <th className="px-4 py-2.5 text-center">
                              Действие
                            </th>
                          </tr>
                        )}
                        {importType === "leads" && (
                          <tr>
                            <th className="px-4 py-2.5">Лид / Ребенок</th>
                            <th className="px-4 py-2.5">Возраст</th>
                            <th className="px-4 py-2.5">Заявитель</th>
                            <th className="px-4 py-2.5">Телефон</th>
                            <th className="px-4 py-2.5">Канал</th>
                            <th className="px-4 py-2.5 text-center">
                              Действие
                            </th>
                          </tr>
                        )}
                        {importType === "finances" && (
                          <tr>
                            <th className="px-4 py-2.5">Дата ордера</th>
                            <th className="px-4 py-2.5">Тип</th>
                            <th className="px-4 py-2.5">Категория</th>
                            <th className="px-4 py-2.5">Сумма (₽)</th>
                            <th className="px-4 py-2.5">Комментарий</th>
                            <th className="px-4 py-2.5 text-center">
                              Действие
                            </th>
                          </tr>
                        )}
                        {importType === "coaches" && (
                          <tr>
                            <th className="px-4 py-2.5">ФИО Тренера</th>
                            <th className="px-4 py-2.5">Специализация</th>
                            <th className="px-4 py-2.5">Год старта</th>
                            <th className="px-4 py-2.5">Нагрузка (%)</th>
                            <th className="px-4 py-2.5">Рейтинг</th>
                            <th className="px-4 py-2.5">Статус</th>
                            <th className="px-4 py-2.5 text-center">
                              Действие
                            </th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedData.map((row, idx) => (
                          <tr
                            key={row.id || idx}
                            className="hover:bg-slate-100/60 bg-white transition duration-100"
                          >
                            {importType === "clients" && (
                              <>
                                <td className="px-4 py-2 font-bold text-slate-900">
                                  {row.childSurname} {row.childName}
                                </td>
                                <td className="px-4 py-2 font-mono font-semibold">
                                  {row.childBirthYear}
                                </td>
                                <td className="px-4 py-2">{row.parentName}</td>
                                <td className="px-4 py-2 font-mono">
                                  {row.parentPhone}
                                </td>
                                <td className="px-4 py-2">
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold text-[10px] text-slate-700">
                                    {row.groupName}
                                  </span>
                                </td>
                              </>
                            )}
                            {importType === "leads" && (
                              <>
                                <td className="px-4 py-2 font-bold text-slate-900">
                                  {row.childSurname} {row.childName}
                                </td>
                                <td className="px-4 py-2 font-mono">
                                  {row.childAge} лет
                                </td>
                                <td className="px-4 py-2">{row.parentName}</td>
                                <td className="px-4 py-2 font-mono">
                                  {row.parentPhone}
                                </td>
                                <td className="px-4 py-2">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100 text-[9px] font-bold uppercase tracking-wider">
                                    {row.source}
                                  </span>
                                </td>
                              </>
                            )}
                            {importType === "finances" && (
                              <>
                                <td className="px-4 py-2 font-mono">
                                  {row.date}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                      row.type === "income"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {row.type === "income" ? "Доход" : "Расход"}
                                  </span>
                                </td>
                                <td className="px-4 py-2 font-semibold text-slate-800">
                                  {row.category}
                                </td>
                                <td className="px-4 py-2 font-bold font-mono text-[11px]">
                                  {row.amount.toLocaleString("ru-RU")} ₽
                                </td>
                                <td
                                  className="px-4 py-2 max-w-[150px] truncate text-slate-500"
                                  title={row.description}
                                >
                                  {row.description}
                                </td>
                              </>
                            )}
                            {importType === "coaches" && (
                              <>
                                <td className="px-4 py-2 font-bold text-slate-900">
                                  {row.name}
                                </td>
                                <td className="px-4 py-2 font-semibold">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-150 text-[10px] font-bold">
                                    {row.role}
                                  </span>
                                </td>
                                <td className="px-4 py-2 font-mono font-semibold">
                                  {row.joinedYear}
                                </td>
                                <td className="px-4 py-2 font-mono text-slate-700 font-bold">
                                  {row.workload}%
                                </td>
                                <td className="px-4 py-2 text-amber-500 font-bold font-mono">
                                  ★ {row.rating}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                      row.status === "Активен"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-2 text-center">
                              <button
                                id={`delete-loaded-row-btn-${idx}`}
                                onClick={() => handleDeleteRow(idx)}
                                className="p-1 hover:bg-red-50 rounded text-red-500 transition"
                                title="Удалить конкретную строку таблицы"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CRM CONTROL PANEL / WRAPPERS */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4 text-left">
                <h4 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider block">
                  3. Управление базой данных CRM при сохранении:
                </h4>

                {/* Save Overwrite Option */}
                <div className="flex items-start space-x-3 p-3 bg-slate-50 border rounded-xl hover:bg-slate-100/50 transition duration-150">
                  <input
                    id="checkbox-overwrite"
                    type="checkbox"
                    checked={shouldClearFirst}
                    onChange={(e) => setShouldClearFirst(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div>
                    <label
                      htmlFor="checkbox-overwrite"
                      className="text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      Стереть (перезаписать) весь целевой раздел перед загрузкой
                      новых данных
                    </label>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      При установке данного флага, старые записи выбранного типа
                      (например, Ученики) полностью исчезнут, заменяясь текущей
                      таблицей.
                    </p>
                  </div>
                </div>

                {/* Main save & wipe CTA line */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    id="wipe-full-crm-btn"
                    onClick={handleWipeCRM}
                    className="py-3 px-4 border border-red-200/50 hover:border-red-500 bg-red-50/20 hover:bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-wider transition duration-150 flex items-center justify-center space-x-1.5"
                    title="Полная очистка текущего раздела"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Стереть раздел в CRM</span>
                  </button>

                  <button
                    id="save-loaded-crm-btn"
                    onClick={handleSaveToCRM}
                    className="py-3 px-4 bg-emerald-650 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Сохранить в CRM</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Photo Viewer Modal */}
      {fullScreenPhoto && (
        <div
          className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[100] cursor-pointer p-2 sm:p-10 animate-fade-in"
          onClick={() => setFullScreenPhoto(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition"
            onClick={(e) => {
              e.stopPropagation();
              setFullScreenPhoto(null);
            }}
          >
            <span className="text-xl font-bold">✕</span>
          </button>

          <img
            src={fullScreenPhoto}
            alt="Отчет во весь экран"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scale-in"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* MODAL: Today Payments List */}
      {showTodayPaymentsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Поступления за сегодня ({todayISO})
                </h3>
                <p className="text-xs text-gray-400">
                  Список всех проведенных оплатных транзакций за день
                </p>
              </div>
              <button
                onClick={() => setShowTodayPaymentsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {todayIncomeRecords.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  Сегодня оплат пока не было зарегистрировано
                </p>
              ) : (
                todayIncomeRecords.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{item.description || item.category}</div>
                      <div className="text-[10px] text-slate-500">Категория: {item.category} • Дата: {item.date}</div>
                    </div>
                    <div className="text-right font-mono font-black text-emerald-600 text-sm">
                      +{item.amount.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Итого за сегодня:</span>
              <span className="font-extrabold text-emerald-600 font-mono text-base">{todayIncomeSum.toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Debtors List */}
      {showDebtorsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Родители с задолженностью (Долги)
                </h3>
                <p className="text-xs text-gray-400">
                  Список клиентов с неисполненными обязательствами по оплате
                </p>
              </div>
              <button
                onClick={() => setShowDebtorsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {debtorsList.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  Отлично! Долгов по абонементам и тренировкам нет.
                </p>
              ) : (
                debtorsList.map((c) => {
                  const debtVal = (c as any).debtAmount || (c.abonement === "12_sessions" ? 12000 : c.abonement === "8_sessions" ? 8000 : 4500);
                  return (
                    <div key={c.id} className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">
                          Ученик: {c.childSurname} {c.childName} ({c.groupName || 'Группа не указана'})
                        </div>
                        <div className="text-slate-600 flex items-center gap-3 text-[11px]">
                          <span>Родитель: <strong className="text-slate-800">{c.parentName}</strong></span>
                          <span>Тел: <a href={`tel:${c.parentPhone}`} className="text-emerald-600 font-bold hover:underline">{c.parentPhone}</a></span>
                        </div>
                        <div className="text-[10px] text-rose-700 font-semibold">
                          Статус абонемента: {c.abonementStatus}
                        </div>
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <div className="text-rose-600 font-black font-mono text-base">
                          {debtVal.toLocaleString("ru-RU")} ₽
                        </div>
                        <a
                          href={`https://wa.me/${c.parentPhone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition"
                        >
                          Написать в WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fix Cancelled Training */}
      {showAddCancellationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-600" />
                  Зафиксировать отмену тренировки
                </h3>
                <p className="text-xs text-gray-400">
                  Внесите причину отмены для управленческого учета
                </p>
              </div>
              <button
                onClick={() => setShowAddCancellationModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCancellationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Группа</label>
                <select
                  value={newCancelGroup}
                  onChange={(e) => {
                    setNewCancelGroup(e.target.value);
                    const grp = groups.find((g) => g.name === e.target.value);
                    if (grp) setNewCancelCoach(grp.coachName || "");
                  }}
                  className="w-full border rounded-lg p-2 bg-slate-50 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                  required
                >
                  <option value="">-- Выберите группу --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Дата отмены</label>
                <input
                  type="date"
                  value={newCancelDate}
                  onChange={(e) => setNewCancelDate(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-slate-50 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Причина отмены</label>
                <select
                  value={newCancelReason}
                  onChange={(e) => setNewCancelReason(e.target.value as any)}
                  className="w-full border rounded-lg p-2 bg-slate-50 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Болезнь тренера">Болезнь тренера</option>
                  <option value="Занятость зала">Занятость / Ремонт зала</option>
                  <option value="Погодные условия">Погодные условия</option>
                  <option value="Мало участников">Мало участников</option>
                  <option value="Праздничный день">Праздничный день</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Тренер</label>
                <input
                  type="text"
                  value={newCancelCoach}
                  onChange={(e) => setNewCancelCoach(e.target.value)}
                  placeholder="ФИО тренера"
                  className="w-full border rounded-lg p-2 bg-slate-50 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Примечание</label>
                <textarea
                  value={newCancelNotes}
                  onChange={(e) => setNewCancelNotes(e.target.value)}
                  placeholder="Дополнительные подробности..."
                  rows={2}
                  className="w-full border rounded-lg p-2 bg-slate-50 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCancellationModal(false)}
                  className="px-3 py-1.5 rounded-lg border text-gray-600 font-bold hover:bg-slate-100 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
                >
                  Сохранить отмену
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
