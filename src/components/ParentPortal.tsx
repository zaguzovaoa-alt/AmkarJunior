import React, { useState, useRef } from "react";
import { useCRM } from "../context/CRMContext";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { parseScheduleString, RU_WEEKDAYS_MAP } from "../utils/scheduleParser";
import {
  Calendar,
  Check,
  User,
  AlertCircle,
  TrendingUp,
  CreditCard,
  MessageSquare,
  BookOpen,
  Download,
  HelpCircle,
  Trophy,
  ArrowRight,
  Upload,
  Clock,
  Phone,
  Send,
  Eye,
  Edit2,
  Trash,
  ShoppingCart,
  ShoppingBag,
  Tag,
  FileText,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import amkarUniform from "../assets/images/amkar_uniform.jpg";
import { isBirthdayToday } from "../utils/dateUtils";
import { PaymentModal } from "./PaymentModal";
import { Product } from "../types";

interface ParentPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const {
    clients,
    messages,
    addChatMessage,
    updateChatMessage,
    deleteChatMessage,
    uploadDocument,
    groups,
    userProfile,
    tasks,
    viewingClientId,
    setViewingClientId,
    products,
    storeOrders,
    homeworks,
    homeworkSubmissions,
    createOrder,
    submitHomework,
    crmConfig,
  } = useCRM();
  
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [storeStatus, setStoreStatus] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !myClient) return;
    const items = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));
    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    createOrder({
      clientId: myClient.id,
      clientName: `${myClient.childSurname} ${myClient.childName}`,
      items,
      totalAmount,
      status: 'new'
    });
    setCart([]);
    setStoreStatus("Заказ успешно оформлен! Ожидайте уведомления.");
    setTimeout(() => setStoreStatus(null), 3000);
  };
  
  const handleCopyReferral = () => {
    if (myClient) {
      const code = myClient.referralCode || myClient.id;
      const refLink = `${window.location.origin}/register?ref=${code}`;
      navigator.clipboard.writeText(refLink);
      setStoreStatus("Реферальная ссылка скопирована!");
      setTimeout(() => setStoreStatus(null), 3000);
    }
  };
  const [chatInput, setChatInput] = useState("");
  const [chatVisibility, setChatVisibility] = useState<
    ("manager" | "trainer" | "parent" | "director" | "admin")[]
  >(["manager", "trainer", "director", "admin"]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState<
    "medical" | "insurance" | null
  >(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<
    string | null
  >(null);

  const medicalInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  // Find ALL children associated with the currently logged-in parent
  const myChildren = clients.filter(
    (c) =>
      (userProfile?.phone && c.parentPhone === userProfile.phone) ||
      (userProfile?.email &&
        c.parentEmail?.toLowerCase() === userProfile.email.toLowerCase()) ||
      (userProfile?.name && c.parentName === userProfile.name)
  );

  // Determine the active child to display
  const myClientRaw = viewingClientId
    ? clients.find((c) => c.id === viewingClientId)
    : myChildren.length > 0
      ? myChildren[0]
      : clients.find((c) => c.id === "cl2") || clients[0];

  const myClient = Object.assign({}, myClientRaw || {});
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const myGroup = groups.find((g) => g.name === myClient.groupName);
  const mySelectTeams = groups.filter(
    (g) => g.isSelectTeam && g.selectedClientIds?.includes(myClient.id),
  );

  // Calculate next training
  const today = new Date();
  const optionsMonth: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };
  const currentMonthStr = today.toLocaleDateString("ru-RU", optionsMonth);
  const currentDay = today.getDate();
  const currentWeekDay = today.toLocaleDateString("ru-RU", {
    weekday: "short",
  });

  // Use the first schedule day of the group or fallback
  const fallbackSchedule = "Пн 19:00";
  const nextTrainingSchedule = myGroup?.scheduleDays?.[0] || fallbackSchedule;
  const nextTime = nextTrainingSchedule.split(" ")[1] || "17:00";
  const endTimeParts = nextTime.split(":");
  const endHour = parseInt(endTimeParts[0]) + 1;
  const endTime =
    endTimeParts.length > 1 ? `${endHour}:${endTimeParts[1]}` : "18:30";

  const currentMonthNum = today.getMonth();
  const currentYear = today.getFullYear();

  // Calculate attendance stats for the current month
  const attendanceThisMonth = myClient.attendance || [];
  const presentCount = attendanceThisMonth.filter(
    (a) => a.status === "present",
  ).length;
  const absentSickCount = attendanceThisMonth.filter(
    (a) => a.status === "absent_sick",
  ).length;
  const absentCount = attendanceThisMonth.filter(
    (a) => a.status === "absent",
  ).length;

  // Calendar logic
  const firstDayOfMonth = new Date(currentYear, currentMonthNum, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonthNum + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  const emptyDaysPre = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Align to Monday
  const daysInMonth = lastDayOfMonth.getDate();

  // Create an array mapping days to their attendance status
  const attendanceMap = new Map<number, "present" | "absent_sick" | "absent">();
  attendanceThisMonth.forEach((record) => {
    // Basic date parser assuming 'DD.MM' or similar local dates
    const dateParts = record.date.split(".");
    if (dateParts.length >= 2) {
      // Very naive matching, assuming dates are valid and for this month for demo
      const recordDay = parseInt(dateParts[0], 10);
      if (!isNaN(recordDay)) {
        attendanceMap.set(recordDay, record.status);
      }
    }
  });

  const nextThreeDates = React.useMemo(() => {
    const list: Array<{
      day: string;
      month: string;
      title: string;
      time: string;
      loc: string;
      dateObj: Date;
      type?: string;
    }> = [];
    if (!myGroup) return list;

    // Load custom events from localStorage
    let customEvents: any[] = [];
    try {
      const cached = localStorage.getItem("amkar_custom_events");
      if (cached) customEvents = JSON.parse(cached);
    } catch {}

    // Check next 21 days
    for (let i = 1; i <= 21; i++) {
      const td = new Date(today.getTime() + 1000 * 60 * 60 * 24 * i);
      const dayAbbrId = td.getDay();
      const dateStr = td.toLocaleDateString("en-CA"); // YYYY-MM-DD

      // 1. Regular schedule
      if (myGroup.scheduleDays) {
        myGroup.scheduleDays.forEach((sched: string) => {
          const slots = parseScheduleString(sched);
          slots.forEach((slot) => {
            if (RU_WEEKDAYS_MAP[slot.day] === dayAbbrId) {
              list.push({
                dateObj: td,
                day: td.getDate().toString(),
                month: td
                  .toLocaleDateString("ru-RU", { month: "short" })
                  .replace(".", ""),
                title: "Тренировка",
                time: slot.time,
                loc: slot.location || myClient.branch || "Основное поле",
                type: "regular",
              });
            }
          });
        });
      }

      // 2. Custom Events matching this group or 'all'
      customEvents.forEach((ev) => {
        if (
          ev.date === dateStr &&
          (ev.groupId === "all" || ev.groupId === myGroup.id)
        ) {
          list.push({
            dateObj: td,
            day: td.getDate().toString(),
            month: td
              .toLocaleDateString("ru-RU", { month: "short" })
              .replace(".", ""),
            title: ev.title,
            time: ev.time,
            loc: ev.location,
            type: ev.type,
          });
        }
      });

      // 3. Trainer Tasks matching this group
      tasks.forEach((t) => {
        if (t.assignedTo === "trainer" && t.dueDate === dateStr) {
          // Check if task mentions my group
          if (t.title.includes(myGroup.name)) {
            const isRisk = t.title.includes("Удержание:");
            list.push({
              dateObj: td,
              day: td.getDate().toString(),
              month: td
                .toLocaleDateString("ru-RU", { month: "short" })
                .replace(".", ""),
              title: t.title,
              time: "00:00",
              loc: t.description || "Не указано",
              type: isRisk ? "match" : "meeting",
            });
          }
        }
      });
    }

    // Sort by Date + Time
    list.sort((a, b) => {
      const dDiff = a.dateObj.getTime() - b.dateObj.getTime();
      if (dDiff !== 0) return dDiff;
      return a.time.localeCompare(b.time);
    });

    // Deduplicate by date and title
    const uniqueList: typeof list = [];
    const seen = new Set();
    list.forEach((item) => {
      const key = `${item.dateObj.getTime()}_${item.title}_${item.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      }
    });

    return uniqueList.slice(0, 3);
  }, [myGroup, today, myClient.branch, tasks]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    addChatMessage({
      senderRole: "parent",
      senderName: `${myClient.parentName} (Родитель: ${myClient.childName})`,
      text: chatInput,
      visibleTo: chatVisibility,
    });
    setChatInput("");
  };

  const visibleMessages = messages.filter(
    (m) =>
      !m.visibleTo ||
      m.visibleTo.includes("parent") ||
      m.senderRole === "parent",
  );

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "medical" | "insurance",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(type);
    setTimeout(() => {
      uploadDocument(myClient.id, type, file.name);
      setUploadingDoc(null);
      setUploadSuccessMessage(
        type === "medical"
          ? `Медицинская справка "${file.name}" успешно загружена!`
          : `Страховой полис "${file.name}" успешно загружен!`,
      );
      setTimeout(() => setUploadSuccessMessage(null), 4500);
      e.target.value = ""; // Reset input to allow re-upload of same file
    }, 1200);
  };

  // Knowledge base mock articles matching Image 1
  const kbArticles = [
    {
      id: "art1",
      title: "Что нужно взять с собой на тренировку?",
      category: "Тренировки",
      views: 1256,
      content:
        "Все просто, но важно ничего не упустить! Вашему будущему чемпиону понадобится фирменная черная экипировка АМКАР ЮНИОР, футбольные бутсы (или многошиповки для зала/манежа), защитные щитки (обязательно для безопасности берцовой кости), чистые гетры, и индивидуальная брендированная бутылка для питьевой негазированной воды. Также рекомендуем положить маленькое полотенце.",
    },
    {
      id: "art2",
      title: "Как происходит оплата абонемента?",
      category: "Оплата и абонементы",
      views: 987,
      content:
        "Оплата абонемента происходит в безналичном формате через платежную систему ЮKassa. Ссылка на оплату формируется менеджером CRM после успешного прохождения пробной тренировки и высылается вам в Личный кабинет. Вы можете оплатить картами любых банков РФ, СБП или СберПей. После оплаты чеки автоматически регистрируются в ФНС, а абонемент активируется.",
    },
    {
      id: "art3",
      title: "Можно ли пропустить тренировку?",
      category: "Родителям",
      views: 765,
      content:
        "Пропускать тренировки без уважительной причины не рекомендуется, так как ребенок выбивается из тренировочного цикла. Однако в случае болезни (при наличии медицинской справки), либо предупреждения тренера или менеджера не менее чем за 5 часов до начала, занятие сохраняется на балансе. Просим своевременно отмечать статус в приложении.",
    },
    {
      id: "art4",
      title: "Как записаться на турнир или сборы?",
      category: "Тренировки",
      views: 654,
      content:
        'Все выездные мероприятия, лагеря и турниры отображаются во вкладке "Ближайшие события" вашего кабинета. Для бронирования участия вам достаточно нажать кнопку "Подать заявку", после чего менеджер вызовер вас для утверждения логистики и меддопусков.',
    },
    {
      id: "art5",
      title: "Требования к игровой форме",
      category: "Форма и экипировка",
      views: 543,
      content:
        "Игровая форма школы АМКАР ЮНИОР разработана с учетом анатомии юных спортсменов из гипоаллергенной дышащей ткани. В комплект входят футболка, шорты и брендированные гетры. Стирать форму рекомендуется при температуре не более 30 градусов без агрессивных отбеливателей.",
    },
  ];

  if (!myClient || !myClient.id) {
    return (
      <div className="p-8 text-center bg-gray-50 text-gray-400">
        Загрузка данных личного кабинета...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen relative">
      <AnimatePresence>
        {uploadSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white rounded-2xl px-5 py-3.5 shadow-xl flex items-center space-x-3 text-xs font-semibold max-w-sm border border-slate-800"
          >
            <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="leading-tight">{uploadSuccessMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar matching exact screenshots */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            {activeTab === "parent_knowledge"
              ? "База знаний"
              : `Добрый день, ${myClient.parentName ? myClient.parentName.split(" ")[1] || myClient.parentName.split(" ")[0] || "Родитель" : "Родитель"}!`}
          </h1>
          <p className="text-gray-500 text-sm">
            {activeTab === "parent_knowledge"
              ? "Полезные статьи, инструкции и ответы на частые вопросы для заботливых родителей."
              : "Вы находитесь в удобном интерактивном кабинете родителя школы АМКАР ЮНИОР."}
          </p>
        </div>

        {/* Top Profile Pickers exactly like picture */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2.5 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-gray-200 w-full relative">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              {myChildren.length > 1 ? (
                <select
                  value={myClient.id}
                  onChange={(e) => setViewingClientId(e.target.value)}
                  className="bg-transparent border-none appearance-none focus:outline-none text-xs font-semibold text-gray-800 p-0 block w-full cursor-pointer pr-4"
                >
                  {myChildren.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.childSurname} {c.childName} • {c.groupName || "Без группы"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-left">
                  <div className="font-semibold text-gray-800">
                    {myClient.childSurname} {myClient.childName}
                  </div>
                  <div className="text-gray-500 font-mono text-[10px]">
                    {myClient.groupName || "Группа не назначена"}
                  </div>
                </div>
              )}
              {myChildren.length > 1 && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              )}
            </div>
            {mySelectTeams.map((st) => (
              <div
                key={st.id}
                className="flex items-center space-x-2.5 bg-red-50 text-red-700 px-3.5 py-1.5 rounded-xl border border-red-200 w-full"
                title={st.targetCompetition || undefined}
              >
                <Trophy className="w-3 h-3 text-red-500 shrink-0" />
                <div className="text-xs text-left">
                  <div className="font-semibold text-red-800">
                    Сборная команда
                  </div>
                  <div className="text-red-600 font-mono text-[10px] truncate">
                    {st.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-600">
              {myClient.parentName[0]}
            </div>
            <div className="text-xs hidden sm:block text-left">
              <div className="font-bold text-gray-800">
                {myClient.parentName}
              </div>
              <div className="text-gray-500 text-[10px]">Родитель</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {/* 1. HOME DASHBOARD TAB (МАТЧИТ ИЗОБРАЖЕНИЕ №2) */}
          {activeTab === "parent_home" && (
            <motion.div
              id="parent-dashboard-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {isBirthdayToday(myClient.childBirthDate) && (
                <div className="relative overflow-hidden bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-8 shadow-xl text-white transform transition-all hover:scale-[1.01]">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 pointer-events-none">
                    <svg
                      width="200"
                      height="200"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shrink-0 shadow-lg">
                      <Trophy className="w-8 h-8 text-white drop-shadow" />
                    </div>
                    <div className="text-center md:text-left">
                      <h2 className="text-3xl font-black tracking-tight drop-shadow-md pb-1">
                        С Днём Рождения, {myClient.childName}! 🎉
                      </h2>
                      <p className="text-orange-50 font-medium text-sm md:text-base max-w-2xl mt-1 leading-relaxed drop-shadow">
                        Команда «АМКАР ЮНИОР» от всей души поздравляет юного
                        чемпиона с днём рождения! Желаем крепкого здоровья,
                        ярких побед, красивых голов и отличного настроения.
                        Пусть футбол приносит только радость! ⚽🏆
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {myClient.abonementSessionsLeft === 1 &&
                myClient.abonement !== "none" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-900 text-sm">
                          Внимание! Абонемент заканчивается или ожидает оплаты.
                        </h4>
                        <p className="text-xs text-red-700 mt-0.5">
                          Осталось оплаченных занятий:{" "}
                          <span className="font-bold text-red-900 text-sm">
                            {myClient.abonementSessionsLeft}
                          </span>
                          . Пожалуйста, продлите абонемент, чтобы не прерывать
                          тренировки.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 flex-shrink-0 whitespace-nowrap"
                    >
                      Продлить абонемент
                    </button>
                  </div>
                )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMN 1 & 2: Main Dashboard Widgets */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Blijaishya Trenirovka Card */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="space-y-3.5 z-10">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-600 font-bold text-[10px] uppercase font-mono tracking-wide">
                          Тренировка
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Рекомендуется прийти за 15 минут
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-4xl font-extrabold text-slate-900">
                          {currentDay}
                        </span>
                        <div className="text-xs leading-tight text-gray-500">
                          <div className="capitalize">
                            Сегодня, {currentWeekDay}
                          </div>
                          <div className="font-semibold text-slate-800 capitalize">
                            {currentMonthStr}
                          </div>
                        </div>
                        <div className="h-10 w-[1px] bg-gray-200 mx-1"></div>
                        <div className="space-y-0.5">
                          <div className="text-lg font-bold text-slate-800">
                            {nextTime} – {endTime}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {myClient.branch || "Манеж «Спартак»"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          Тренер:{" "}
                          <strong className="font-semibold text-slate-800">
                            {myClient.coachName}
                          </strong>
                        </span>
                      </div>
                      <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl text-xs flex items-center space-x-2 border border-blue-100">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          Не забудьте сменную форму, гетры, бутсы, защитные
                          щитки и бутылочку воды. 💧
                        </span>
                      </div>
                    </div>

                    {/* Graphic representation of team football jersey */}
                    <div className="h-40 w-48 sm:h-48 sm:w-56 flex-shrink-0 -mr-4 -my-4 group bg-transparent">
                      <img
                        src={amkarUniform}
                        alt="Экипировка"
                        className="w-full h-full object-contain"
                        style={{
                          mixBlendMode: "multiply",
                          filter: "contrast(1.1) brightness(1.05)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment & Abonement widget */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <CreditCard className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-900 text-sm">
                            Платежи и абонементы
                          </h3>
                          <p className="text-xs text-gray-500">
                            Баланс активных занятий в клубе
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
                          myClient.abonementSessionsLeft > 0
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>
                          {myClient.abonementSessionsLeft > 0
                            ? "Абонемент активен"
                            : "Требуется оплата"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-xs text-gray-400 font-medium">
                          Оплаченный пакет
                        </div>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">
                          {myClient.abonement === "12_sessions"
                            ? 'Пакет "Базовый 12 занятий"'
                            : myClient.abonement === "8_sessions"
                              ? 'Пакет "Стандарт 8 занятий"'
                              : myClient.abonement === "4_sessions"
                                ? 'Пакет "Выходной 4 занятия"'
                                : "Нет абонемента"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Истекает:{" "}
                          {myClient.abonementExpirationDate || "Нет даты"}
                        </div>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-between">
                        <div>
                          <div className="text-xs text-gray-400 font-medium">
                            Остаток тренировок
                          </div>
                          <div className="text-2xl font-black text-slate-900 mt-0.5">
                            {myClient.abonementSessionsLeft}{" "}
                            <span className="text-xs text-gray-500 font-medium">
                              из{" "}
                              {(() => {
                                const baseTotal =
                                  myClient.abonement === "12_sessions"
                                    ? 12
                                    : myClient.abonement === "8_sessions"
                                      ? 8
                                      : myClient.abonement === "4_sessions"
                                        ? 4
                                        : myClient.abonement === "1_session"
                                          ? 1
                                          : 0;
                                return Math.max(
                                  baseTotal,
                                  myClient.abonementSessionsLeft || 0,
                                );
                              })()}
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${(() => {
                                  const baseTotal =
                                    myClient.abonement === "12_sessions"
                                      ? 12
                                      : myClient.abonement === "8_sessions"
                                        ? 8
                                        : myClient.abonement === "4_sessions"
                                          ? 4
                                          : myClient.abonement === "1_session"
                                            ? 1
                                            : 0;
                                  const maxTotal =
                                    baseTotal > 0
                                      ? Math.max(
                                          baseTotal,
                                          myClient.abonementSessionsLeft || 0,
                                        )
                                      : 1;
                                  const used =
                                    maxTotal -
                                    (myClient.abonementSessionsLeft || 0);
                                  return Math.min(
                                    100,
                                    Math.max(0, (used / maxTotal) * 100),
                                  );
                                })()}%`,
                              }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            Использовано:{" "}
                            {(() => {
                              const baseTotal =
                                myClient.abonement === "12_sessions"
                                  ? 12
                                  : myClient.abonement === "8_sessions"
                                    ? 8
                                    : myClient.abonement === "4_sessions"
                                      ? 4
                                      : myClient.abonement === "1_session"
                                        ? 1
                                        : 0;
                              const maxTotal = Math.max(
                                baseTotal,
                                myClient.abonementSessionsLeft || 0,
                              );
                              return (
                                maxTotal - (myClient.abonementSessionsLeft || 0)
                              );
                            })()}{" "}
                            занятий
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* History */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2.5">
                        История платежей
                      </h4>
                      <div className="space-y-2">
                        {myClient.payments.map((p, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-50 transition border border-transparent"
                          >
                            <span className="text-slate-700 font-medium">
                              {p.item}
                            </span>
                            <span className="text-gray-400 font-mono text-[11px]">
                              {p.date}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-slate-900">
                                {p.amount} Р
                              </span>
                              <span className="px-1.5 py-0.5 text-[9px] rounded font-semibold bg-emerald-100 text-emerald-800">
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Document uploads */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 text-sm">
                          Документы и меддопуски
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          Загрузка обязательных медицинских справок
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-normal">
                      Для проведения полноценных спаррингов и спортивных
                      турниров, правилами школы и Минспортом РФ предписано
                      обязательное предоставление справки формата 086/у о
                      допуске к физическим нагрузкам, а также наличие спортивной
                      страховки.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2 flex flex-col justify-between">
                        <input
                          type="file"
                          ref={medicalInputRef}
                          onChange={(e) => handleFileChange(e, "medical")}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                        <div className="flex items-start justify-between">
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">
                              Справка-допуск спортивная
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              Формат 086/у или свободный (допуск)
                            </div>
                          </div>
                          {myClient.medicalCertificateUrl ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-800">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-amber-100 text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                            {uploadingDoc === "medical"
                              ? "Загрузка..."
                              : myClient.medicalCertificateUrl || "Не загружен"}
                          </span>
                          <button
                            onClick={() => medicalInputRef.current?.click()}
                            disabled={uploadingDoc === "medical"}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-650 text-white rounded text-[10px] font-bold transition flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                          >
                            {uploadingDoc === "medical" ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            <span>
                              {uploadingDoc === "medical"
                                ? "Загрузка..."
                                : myClient.medicalCertificateUrl
                                  ? "Заменить"
                                  : "Загрузить"}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2 flex flex-col justify-between">
                        <input
                          type="file"
                          ref={insuranceInputRef}
                          onChange={(e) => handleFileChange(e, "insurance")}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                        <div className="flex items-start justify-between">
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">
                              Полис страхования
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              Спортивная страховка (футбол)
                            </div>
                          </div>
                          {myClient.insuranceUrl ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-800">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-amber-100 text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                            {uploadingDoc === "insurance"
                              ? "Загрузка..."
                              : myClient.insuranceUrl || "Не загружен"}
                          </span>
                          <button
                            onClick={() => insuranceInputRef.current?.click()}
                            disabled={uploadingDoc === "insurance"}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-650 text-white rounded text-[10px] font-bold transition flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                          >
                            {uploadingDoc === "insurance" ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            <span>
                              {uploadingDoc === "insurance"
                                ? "Загрузка..."
                                : myClient.insuranceUrl
                                  ? "Заменить"
                                  : "Загрузить"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: Right side panels */}
                <div className="space-y-6">
                  {/* Performance metrics */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-sm">
                        Прогресс ребенка
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700">
                        Оценка клуба
                      </span>
                    </div>

                    {/* Circular rating ring */}
                    <div className="flex flex-col items-center py-2.5">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#f1f5f9"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#10b981"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2.5 * Math.PI * 40}`}
                            strokeDashoffset={`${2.5 * Math.PI * 40 * (1 - 4.6 / 5)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900 font-sans">
                            4.6
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                            из 5
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center space-x-1">
                        <span>↑ +0,3 к прошлому месяцу</span>
                      </div>
                    </div>

                    {/* Progress bars matching screenshot exactly */}
                    <div className="space-y-3 pt-2">
                      {[
                        {
                          name: "Техника",
                          score: myClient.progress?.technique || 0,
                          color: "bg-emerald-500",
                        },
                        {
                          name: "Тактика",
                          score: myClient.progress?.tactics || 0,
                          color: "bg-indigo-500",
                        },
                        {
                          name: "Физ. подготовка",
                          score: myClient.progress?.physical || 0,
                          color: "bg-amber-500",
                        },
                        {
                          name: "Дисциплина",
                          score: myClient.progress?.discipline || 0,
                          color: "bg-orange-500",
                        },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">
                              {item.name}
                            </span>
                            <span className="font-bold text-slate-800">
                              {item.score}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`${item.color} h-full rounded-full`}
                              style={{ width: `${(item.score / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar/Attendance Grid */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Посещаемость
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Журнал тренировок
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono text-gray-600 bg-slate-100 px-2 py-0.5 rounded capitalize">
                        {currentMonthStr}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 px-1 text-center bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {presentCount}
                        </div>
                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                          Посещено
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-600">
                          {absentSickCount}
                        </div>
                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                          Уважительная
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-500">
                          {absentCount}
                        </div>
                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                          Прогул
                        </div>
                      </div>
                    </div>

                    {/* Dynamic styled Monthly Calendar layout */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                      {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(
                        (d, i) => (
                          <div key={i} className="text-gray-400 font-bold py-1">
                            {d}
                          </div>
                        ),
                      )}

                      {Array.from({ length: emptyDaysPre }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="text-transparent py-1 font-mono"
                        >
                          -
                        </div>
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNumber = i + 1;
                        const isToday = dayNumber === currentDay;
                        const status = attendanceMap.get(dayNumber);

                        let baseClass =
                          "py-1 font-bold rounded-lg border border-transparent font-mono flex items-center justify-center ";
                        if (status === "present") {
                          baseClass += "bg-emerald-500 text-white rounded-full";
                        } else if (status === "absent_sick") {
                          baseClass +=
                            "bg-amber-100 text-amber-800 rounded-full";
                        } else if (status === "absent") {
                          baseClass +=
                            "bg-slate-200 text-slate-600 rounded-full";
                        } else {
                          baseClass += "text-slate-800";
                        }

                        if (isToday) {
                          baseClass += " ring-2 ring-emerald-200";
                        }

                        return (
                          <div key={dayNumber} className={baseClass}>
                            {dayNumber}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-center space-x-3 text-[10px] text-gray-500 border-t border-gray-100 pt-2.5">
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Был</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        <span>Уважительная</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                        <span>Прогул</span>
                      </div>
                    </div>
                  </div>

                  {/* Referral Widget */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-3">
                      <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 text-sm">
                          Реферальная программа
                        </h3>
                        <p className="text-xs text-gray-500">
                          Приглашайте друзей и получайте бонусы!
                        </p>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">Ваши бонусы</span>
                         <span className="text-xl font-black text-orange-600">{myClient.bonusBalance || 0} ₽</span>
                      </div>
                      <p className="text-[11px] text-orange-700 leading-relaxed mb-3">
                        Отправьте ссылку другу. Если он запишется и купит абонемент, вы получите <strong className="font-bold">{crmConfig?.referralBonusAmount || 500} {crmConfig?.referralBonusType === 'rubles' ? 'рублей' : 'баллов'}</strong> на баланс!
                      </p>
                      <button 
                        onClick={handleCopyReferral}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase transition"
                      >
                         Копировать ссылку
                      </button>
                    </div>
                  </div>

                  {/* Upcoming calendar events dynamically built */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-sm">
                        Ближайшие события
                      </h3>
                      <button
                        onClick={() => setActiveTab("parent_schedule")}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition"
                      >
                        Все события
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {nextThreeDates.length > 0 ? (
                        nextThreeDates.map((evt, id) => {
                          let bgC =
                            "bg-emerald-50 border-emerald-100/40 text-emerald-600";
                          let monthC = "text-emerald-500";
                          if (evt.type === "match") {
                            bgC = "bg-red-50 border-red-100 text-red-600";
                            monthC = "text-red-500";
                          }
                          if (evt.type === "competition") {
                            bgC =
                              "bg-fuchsia-50 border-fuchsia-100 text-fuchsia-600";
                            monthC = "text-fuchsia-500";
                          }
                          if (evt.type === "masterclass") {
                            bgC = "bg-amber-50 border-amber-100 text-amber-600";
                            monthC = "text-amber-500";
                          }
                          if (evt.type === "meeting") {
                            bgC =
                              "bg-indigo-50 border-indigo-100 text-indigo-600";
                            monthC = "text-indigo-500";
                          }

                          return (
                            <div
                              key={id}
                              className="flex items-start space-x-3 text-xs"
                            >
                              <div
                                className={`flex-shrink-0 w-11 h-11 rounded-lg text-center flex flex-col justify-center border ${bgC}`}
                              >
                                <span className="text-base font-black font-mono leading-none">
                                  {evt.day}
                                </span>
                                <span
                                  className={`text-[8px] font-bold tracking-tight uppercase ${monthC}`}
                                >
                                  {evt.month}
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                                  <span>{evt.title}</span>
                                  {evt.type === "competition" && (
                                    <span className="px-1.5 py-0.5 bg-fuchsia-100 text-fuchsia-800 text-[8px] rounded uppercase">
                                      Турнир
                                    </span>
                                  )}
                                  {evt.type === "match" && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[8px] rounded uppercase">
                                      Матч
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono flex items-center space-x-1.5 line-clamp-1">
                                  <span>
                                    {evt.time === "00:00" ? "" : evt.time}
                                  </span>
                                  {evt.time !== "00:00" && <span>•</span>}
                                  <span>{evt.loc}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                          Ближайших регулярных тренировок не запланировано.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. CALENDAR TAB */}
          {activeTab === "parent_schedule" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-0 border border-slate-200 overflow-hidden shadow-sm"
            >
              <ScheduleCalendar filteredGroupId={myGroup?.id || "none"} />
            </motion.div>
          )}

          {/* 3. ATTENDANCE HISTORIC */}
          {activeTab === "parent_attendance" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Исторический журнал посещений: {myClient.childName}
                </h3>
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
                  {myClient?.groupName || "Группа не назначена"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-gray-400 font-semibold uppercase tracking-wider border-b">
                      <th className="p-3">Дата тренировки</th>
                      <th className="p-3">Статус присутствия</th>
                      <th className="p-3">
                        Причина отсутствия / Примечание тренера
                      </th>
                      <th className="p-3">Визуальный фотоотчет</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {myClient.attendance.map((att, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold">{att.date}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              att.status === "present"
                                ? "bg-emerald-100 text-emerald-800"
                                : att.status === "absent_sick"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {att.status === "present"
                              ? "Присутствовал"
                              : att.status === "absent_sick"
                                ? "Уважительная"
                                : "Прогул"}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          {att.reason ||
                            "Занятие пройдено успешно, замечаний по поведению нет."}
                        </td>
                        <td className="p-3 text-gray-400">
                          {att.status === "present"
                            ? "📸 Присутствует в групповом фото"
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 4. REZULATTY & ACHIEVEMENTS */}
          {activeTab === "parent_gamification" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Gamification progress dashboard elements */}
              <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span className="text-xs uppercase font-bold text-indigo-300 font-mono tracking-widest">
                      Академия достижений АМКАР
                    </span>
                  </div>
                  <h3 className="text-xl font-black font-sans leading-tight">
                    Поддерживаем мотивацию будущего чемпиона!
                  </h3>
                  <p className="text-xs text-indigo-200 leading-relaxed max-w-xl">
                    За каждую продуктивную тренировку, высокие спортивные оценки
                    от тренера и стабильную дисциплину ребенок получает
                    наградные значки-медали в своем Личном кабинете. Соберите 5
                    достижений за сезон для получения специального подарка от
                    клуба!
                  </p>
                </div>
                <div className="h-28 w-28 rounded-full border-4 border-amber-400/40 flex flex-col items-center justify-center bg-slate-800 flex-shrink-0">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">
                    3 / 5
                  </span>
                  <span className="text-[10px] font-semibold text-slate-300">
                    Наград
                  </span>
                </div>
              </div>

              {/* Achievements collection list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {myClient.achievements.map((ach, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex items-center space-x-4 font-sans text-xs"
                  >
                    <div className="h-16 w-16 rounded-xl bg-orange-50 text-3xl flex items-center justify-center border border-orange-100 flex-shrink-0 shadow-inner">
                      {ach.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-800 text-sm">
                        {ach.title}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal">
                        {ach.description}
                      </p>
                      <div className="text-[9px] font-mono text-gray-400 font-semibold uppercase">
                        Получен: {ach.earnedAt}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Unearned achievement placeholders */}
                <div className="bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center space-x-4 opacity-60">
                  <div className="h-16 w-16 rounded-xl bg-slate-200 text-3xl flex items-center justify-center border flex-shrink-0 grayscale">
                    🎯
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="font-extrabold text-gray-400 text-sm">
                      Железный АМКАРОВЕЦ
                    </div>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Посетите 12 тренировок в одном билинговом цикле.
                    </p>
                    <div className="text-[9px] font-mono text-orange-500 font-bold uppercase">
                      В процессе (8/12)
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center space-x-4 opacity-60">
                  <div className="h-16 w-16 rounded-xl bg-slate-200 text-3xl flex items-center justify-center border flex-shrink-0 grayscale">
                    ❤️
                  </div>
                  <div className="space-y-1">
                    <div className="font-extrabold text-gray-400 text-sm">
                      Снайпер Академии
                    </div>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Заработайте наивысший бал 4.8+ за точность ударов.
                    </p>
                    <div className="text-[9px] font-mono text-indigo-500 font-bold uppercase">
                      Новая планка
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. PAYMENTS HISTORY */}
          {activeTab === "parent_payments" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Детализированная история транзакций
                </h3>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Оплатить абонемент</span>
                </button>
              </div>

              <div className="space-y-3">
                {myClient.payments.map((p, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-50 border border-gray-200 rounded-xl gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
                        <Check className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {p.item}
                        </div>
                        <div className="text-xs text-gray-400 font-mono font-medium">
                          {p.date} • Транзакция #TX_{Date.now() - i * 100000}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center sm:justify-end gap-3">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {p.amount} ₽
                      </span>
                      <span className="px-3 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        успешно
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 6. MESSAGES CHAT (С МУЛЬТИМЕДИА) */}
          {activeTab === "parent_messages" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[520px] overflow-hidden"
            >
              {/* Active channel info */}
              <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-600">
                    A
                  </div>
                  <div className="text-left py-0.5">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Чат обратной связи школы
                    </h3>
                    <p className="text-[10px] text-gray-500 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>
                        Дежурный менеджер & тренер {myClient.coachName} на связи
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">Часовой пояс: МСК</div>
              </div>

              {/* Chat log with custom scroll */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4 text-xs font-sans">
                {visibleMessages.map((msg, idx) => {
                  const isMe = msg.senderRole === "parent";
                  return (
                    <div
                      key={idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md p-3 rounded-2xl group ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1 text-[9px] font-bold opacity-80">
                          <span>{msg.senderName}</span>
                          <div className="flex items-center space-x-2">
                            {isMe && (
                              <div className="hidden group-hover:flex items-center space-x-1 mr-2 bg-black/10 rounded px-1">
                                <button
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditMessageText(msg.text);
                                  }}
                                  className="p-1 hover:text-white transition"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteChatMessage(msg.id)}
                                  className="p-1 hover:text-rose-200 transition"
                                >
                                  <Trash className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                            <span className="font-mono">{msg.timestamp}</span>
                          </div>
                        </div>

                        {editingMessageId === msg.id ? (
                          <div className="flex flex-col space-y-2 mt-2">
                            <input
                              type="text"
                              className="text-xs px-2 py-1 bg-white text-gray-800 rounded outline-none w-full"
                              value={editMessageText}
                              onChange={(e) =>
                                setEditMessageText(e.target.value)
                              }
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
                                  updateChatMessage(msg.id, editMessageText);
                                  setEditingMessageId(null);
                                }}
                                className="text-[10px] bg-white text-emerald-600 font-bold px-2 py-1 rounded"
                              >
                                Сохр.
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-line">
                            {msg.text}
                          </p>
                        )}

                        {isMe && msg.visibleTo && (
                          <div className="mt-1 text-[8px] opacity-60">
                            Видно:{" "}
                            {msg.visibleTo
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

              {/* Chat write panel */}
              <div className="bg-white border-t">
                <div className="px-3 py-2 flex items-center space-x-3 text-[10px] text-slate-500 border-b border-gray-50 overflow-x-auto">
                  <span className="font-semibold shrink-0">
                    Видят сообщение:
                  </span>
                  {(["manager", "trainer", "director"] as const).map((role) => (
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
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>
                        {role === "manager"
                          ? "Менеджеры"
                          : role === "trainer"
                            ? "Тренеры"
                            : "Директор"}
                      </span>
                    </label>
                  ))}
                </div>
                <form
                  onSubmit={handleSendChat}
                  className="p-3 flex items-center space-x-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const sampleFiles = [
                        "заявление_болеем.pdf",
                        "медицинский_чек.png",
                        "тренировка.jpeg",
                      ];
                      const picked =
                        sampleFiles[
                          Math.floor(Math.random() * sampleFiles.length)
                        ];
                      addChatMessage({
                        senderRole: "parent",
                        senderName: `${myClient.parentName} (Родитель: ${myClient.childName})`,
                        text: `[Прикреплен файл]: ${picked}`,
                        visibleTo: chatVisibility,
                      });
                    }}
                    title="Прикрепить файл/фото"
                    className="p-2.5 bg-slate-150 hover:bg-slate-200 rounded-xl text-gray-500 hover:text-gray-700 transition"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Напишите сообщение..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 focus:bg-white border focus:border-emerald-500 rounded-xl text-xs text-gray-800 outline-none transition"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* 7. KNOWLEDGE BASE TAB (МАТЧИТ ИЗОБРАЖЕНИЕ №1) */}
          {activeTab === "parent_knowledge" && (
            <motion.div
              id="knowledge-base-root"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Popular Categories Grid from photo */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  {
                    cat: "Тренировки",
                    desc: "Все о тренировочном процессе, формах, выездах",
                    count: 12,
                    bg: "bg-orange-50 text-orange-600 border-orange-100/40",
                  },
                  {
                    cat: "Оплата и абонементы",
                    desc: "Информация об оплате, пакетах и тарифах",
                    count: 8,
                    bg: "bg-emerald-50 text-emerald-600 border-emerald-100/40",
                  },
                  {
                    cat: "Форма и экипировка",
                    desc: "Требования к форме, гетрам, конусам",
                    count: 6,
                    bg: "bg-blue-50 text-blue-600 border-blue-100/40",
                  },
                  {
                    cat: "Родителям",
                    desc: "Рекомендации, правила клуба и памятки",
                    count: 15,
                    bg: "bg-amber-50 text-amber-600 border-amber-100/40",
                  },
                  {
                    cat: "Здоровье и безопасность",
                    desc: "Безопасность суставов, справки, допуски",
                    count: 7,
                    bg: "bg-indigo-50 text-indigo-700 border-indigo-100/40",
                  },
                ].map((category, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border ${category.bg} shadow-xs flex flex-col justify-between h-36 border-transparent hover:scale-[1.02] transition duration-200`}
                  >
                    <div className="space-y-1 text-left">
                      <BookOpen className="w-4.5 h-4.5 mb-1" />
                      <div className="font-extrabold text-[12px] leading-snug">
                        {category.cat}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        {category.desc}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600">
                      {category.count} статей →
                    </div>
                  </div>
                ))}
              </div>

              {/* Main row split - Popular Articles list vs side info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Popular Articles column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-900 border-b pb-1.5 text-sm">
                      Популярные статьи базы
                    </h3>

                    <div className="divide-y divide-gray-100">
                      {kbArticles.map((art, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedArticle(art)}
                          className="py-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition -mx-2"
                        >
                          <div className="space-y-0.5 text-left">
                            <h4 className="font-bold text-xs text-slate-800 hover:text-emerald-500 transition">
                              {art.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono font-medium">
                              {art.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-[10px] text-gray-400">
                            <span className="flex items-center space-x-1 font-mono">
                              <Eye className="w-3 h-3" />
                              <span>{art.views}</span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Useful materials list column (Photo 1 right) */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-900 border-b pb-1.5 text-sm">
                      Полезные материалы
                    </h3>

                    {[
                      {
                        title: "Памятка/Правила Клуба",
                        desc: "Ценности и культура нашей школы.",
                        file: "Скачать PDF",
                      },
                      {
                        title: "Календарь Сезона 2025/2026",
                        desc: "Даты турниров, выездов и вех.",
                        file: "Смотреть график",
                      },
                      {
                        title: "Инструкция по питанию игроков",
                        desc: "Рацион питания для спортсменов 4-12 лет.",
                        file: "Открыть PDF",
                      },
                      {
                        title: "Контакты тренеров и медицина",
                        desc: "Телефоны дежурной помощи клиники.",
                        file: "Показать контакты",
                      },
                    ].map((mat, id) => (
                      <div
                        key={id}
                        className="p-3 bg-slate-50 border rounded-xl hover:shadow-xs transition text-left space-y-1.5"
                      >
                        <div className="font-bold text-xs text-slate-800">
                          {mat.title}
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                          {mat.desc}
                        </p>
                        <button className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>{mat.file}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Read Popup Dialog */}
              {selectedArticle && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
                  <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden border shadow-xl">
                    <div className="p-5 border-b flex justify-between items-start shrink-0 bg-slate-50">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                          {selectedArticle.category}
                        </span>
                        <h4 className="font-black text-slate-900 mt-1 max-w-md text-sm">
                          {selectedArticle.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 font-bold ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-5 sm:p-6 text-xs text-slate-700 leading-relaxed whitespace-pre-line text-left overflow-y-auto flex-1">
                      {selectedArticle.content}
                    </div>
                    <div className="p-4 sm:p-5 bg-slate-50 border-t flex justify-between items-center shrink-0">
                      <span className="text-[11px] text-gray-400">
                        Просмотров: {selectedArticle.views}
                      </span>
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        Закрыть статью
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STORE TAB */}
          {activeTab === "parent_store" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-left"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-emerald-500" />
                    Клубный магазин
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Фирменная экипировка и аксессуары АМКАР ЮНИОР
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                  <div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center font-bold text-xs text-slate-700">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {cart.reduce((s, i) => s + i.quantity, 0)} шт / {cart.reduce((s, i) => s + (i.product.price * i.quantity), 0)} ₽
                  </div>
                  {cart.length > 0 && (
                    <button onClick={handleCheckout} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm">
                      Оформить
                    </button>
                  )}
                </div>
              </div>

              {storeStatus && (
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm text-center border border-emerald-100">
                  {storeStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.length === 0 ? (
                   <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                     Каталог товаров пока пуст. Администрация скоро добавит новые позиции!
                   </div>
                ) : (
                  products.map(p => {
                    const inCart = cart.find(i => i.product.id === p.id);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                         {p.photoUrl ? (
                           <img src={p.photoUrl} alt={p.name} className="w-full h-40 object-cover rounded-xl mb-3" />
                         ) : (
                           <div className="w-full h-40 bg-slate-100 rounded-xl mb-3 flex items-center justify-center">
                             <Tag className="w-8 h-8 text-gray-300" />
                           </div>
                         )}
                         <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{p.category}</div>
                            <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2">{p.name}</h3>
                            <div className="text-lg font-black text-slate-900 mb-3">{p.price.toLocaleString()} ₽</div>
                         </div>
                         {inCart ? (
                            <div className="flex items-center justify-between bg-slate-50 border p-1 rounded-xl">
                              <button onClick={() => handleRemoveFromCart(p.id)} className="w-8 h-8 bg-white border rounded shadow-sm text-red-500 font-bold hover:bg-red-50">-</button>
                              <span className="font-bold text-sm px-2 text-slate-800">{inCart.quantity} шт</span>
                              <button onClick={() => handleAddToCart(p)} className="w-8 h-8 bg-white border rounded shadow-sm text-emerald-500 font-bold hover:bg-emerald-50">+</button>
                            </div>
                         ) : (
                            <button onClick={() => handleAddToCart(p)} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition">
                              В корзину
                            </button>
                         )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* HOMEWORKS TAB */}
          {activeTab === "parent_homeworks" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-800 flex items-center mb-1">
                  <FileText className="w-5 h-5 mr-2 text-emerald-500" />
                  Мои домашние задания
                </h2>
                <p className="text-xs text-gray-500">
                  Выполняйте задания тренера дома для улучшения индивидуальных навыков
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {homeworks.filter(hw => hw.groupId === myClient.groupName || !myClient.groupName).length === 0 ? (
                   <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                     У вашего ребенка пока нет активных домашних заданий. Тренер добавит их по мере необходимости.
                   </div>
                 ) : (
                   homeworks.filter(hw => hw.groupId === myClient.groupName || hw.groupName === myClient.groupName || !hw.groupId).map(hw => {
                     const isDone = homeworkSubmissions.some(s => s.homeworkId === hw.id && s.clientId === myClient.id);
                     return (
                       <div key={hw.id} className={`p-5 rounded-2xl border transition shadow-sm ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-200'}`}>
                         <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-slate-800 text-sm whitespace-pre-wrap">{hw.title}</h3>
                            {isDone ? (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center shrink-0 ml-2">
                                <Check className="w-3 h-3 mr-1" /> Выполнено
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2">
                                Ожидает
                              </span>
                            )}
                         </div>
                         <p className="text-xs text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">{hw.description}</p>
                         
                         {hw.videoUrl && (
                           <div className="mb-4">
                             <a href={hw.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center">
                               Смотреть обучающее видео <ArrowRight className="w-3 h-3 ml-1" />
                             </a>
                           </div>
                         )}
                         <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-2">
                            <div className="text-[10px] text-gray-400 font-medium">
                              Срок сдачи: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('ru-RU') : 'Не указан'}
                            </div>
                            {!isDone && (
                              <button onClick={() => submitHomework(hw.id, myClient.id)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center transition shadow-sm">
                                <FileCheck className="w-4 h-4 mr-2" />
                                Отметить выполненным
                              </button>
                            )}
                         </div>
                       </div>
                     );
                   })
                 )}
              </div>
            </motion.div>
          )}

          {/* 8. SETTINGS */}
          {activeTab === "parent_settings" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-lg mx-auto text-left space-y-6"
            >
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">
                Настройки профиля родителя
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Имя законного представителя (Родителя)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                    value={myClient.parentName}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Телефон для экстренной связи
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-mono"
                    value={myClient.parentPhone}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Контактный Email
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                    value={myClient.parentEmail}
                    readOnly
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                  <div className="font-bold text-slate-800 text-xs">
                    Уведомления в Telegram
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Хотите получать автоматические отчеты по тренировочным
                    оценкам, напоминания об оплатах и посещаемости прямо в
                    мессенджер Telegram? Подключите нашего бота-ассистента.
                  </p>
                  <button
                    onClick={() => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="py-1.5 px-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-2"
                  >
                    {!copiedLink && (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
                         <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.304-.346-.11l-6.4 4.024-2.76-.86c-.6-.185-.61-.595.125-.89l10.82-4.172c.504-.197.942.115.807.94z"/>
                      </svg>
                    )}
                    <span>
                      {copiedLink
                        ? "Ссылка скопирована! ✅"
                        : "Подключить Telegram бот"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={true}
          onClose={() => setIsPaymentModalOpen(false)}
          clientId={myClient.id}
        />
      )}
    </div>
  );
};
