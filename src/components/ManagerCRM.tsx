import React, { useState, useMemo } from "react";
import { HeaderDescription } from "./HeaderDescription";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Mail,
  Phone,
  Calendar,
  Trash2,
  CreditCard,
  ChevronRight,
  Edit2,
  Check,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Save,
  Camera,
  Upload,
  Volume2,
  MicOff,
  PhoneOff,
  Mic,
  Loader2,
  BookOpen,
  Timer,
  TrendingDown,
  FileText,
  Settings,
  Shield,
  Send,
  Link,
  X,
} from "lucide-react";
import { Client, Lead, ClientStatus, CRMTask } from "../types";
import { calculateAge, isBirthdayToday } from "../utils/dateUtils";
import { compressImage } from "../utils/image";
import { ConfirmModal } from "./ConfirmModal";
import { BirthdaysBanner } from "./BirthdaysBanner";

const formatBirthDate = (dateString?: string, fallbackYear?: number) => {
  if (!dateString) return fallbackYear ? `${fallbackYear} г.р.` : "";
  if (dateString.includes("-")) {
    const [y, m, d] = dateString.split("-");
    return `${d}.${m}.${y}`;
  }
  return dateString;
};


interface ManagerCRMProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ManagerCRM: React.FC<ManagerCRMProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { logout } = useAuth();
  const {
    clients,
    leads,
    tasks,
    addLead,
    addClient,
    bookTrial,
    addTask,
    completeTask,
    deleteClient,
    deleteLead,
    updateClientNotes,
    updateClient,
    schoolName,
    groups,
    coaches,
    assignClientToGroup,
    crmConfig,
    messages,
    userProfile,
    updateUserProfile,
    setViewingClientId,
    setCurrentRole,
    setCurrentTab,
    currentRole,
    addFinanceRecord,
    accounts,
    finances,
  } = useCRM();

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
      if (
        f.accountId &&
        calculatedAccountsMap.has(f.accountId) &&
        f.status !== "accrued" &&
        f.paymentStatus !== "pending"
      ) {
        const acc = calculatedAccountsMap.get(f.accountId)!;
        if (f.type === "income") acc.actualBalance += Number(f.amount || 0);
        else if (f.type === "expense")
          acc.actualBalance -= Number(f.amount || 0);
      }
    });

    const calculatedAccounts = Array.from(calculatedAccountsMap.values());
    return calculatedAccounts.reduce((sum, acc) => sum + acc.actualBalance, 0);
  }, [accounts, finances]);

  const { newClientsThisMonth, newClientsLastMonthDiff, newClientsThisWeek } = useMemo(() => {
    const now = new Date();
    
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();

    const getClientCreatedAt = (c: any) => {
      if (c.registeredAt) {
        return new Date(c.registeredAt).getTime();
      }
      const match = c.id.match(/^cl_(\d+)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return 0; // fallback
    };

    let newThisMonth = 0;
    let newLastMonth = 0;
    let newThisWeek = 0;

    clients.forEach(c => {
      const createdAt = getClientCreatedAt(c);
      if (createdAt >= currentMonthStart) newThisMonth++;
      if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) newLastMonth++;
      if (createdAt >= oneWeekAgo) newThisWeek++;
    });

    return {
      newClientsThisMonth: newThisMonth,
      newClientsLastMonthDiff: newThisMonth - newLastMonth,
      newClientsThisWeek: newThisWeek
    };
  }, [clients]);

  const [deleteLeadModal, setDeleteLeadModal] = useState<{
    isOpen: boolean;
    leadId: string;
    leadName: string;
  } | null>(null);
  const [deleteClientModal, setDeleteClientModal] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
  } | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // all, active, trial, paused, completed
  const [filterGroup, setFilterGroup] = useState<string>("all");

  // Selected client for detail drawer (matches right panel on photo 4)
  const [selectedClientId, setSelectedClientIdState] = useState<string>("cl1");
  const setSelectedClientId = (id: string) => {
    setSelectedClientIdState(id);
    if (setViewingClientId) setViewingClientId(id);
  };
  const [isEditingRightCard, setIsEditingRightCard] = useState<boolean>(false);
  const [clientDetailTab, setClientDetailTab] = useState<
    "info" | "abos" | "visits" | "payments" | "history"
  >("info");
  const [clientNotes, setClientNotes] = useState<{ [key: string]: string }>({});

  // Manual payment entry state variables
  const [manualPaymentDate, setManualPaymentDate] = useState<string>(() =>
    (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
  );
  const [manualPaymentType, setManualPaymentType] = useState<
    "12_sessions" | "8_sessions" | "4_sessions" | "1_session"
  >("12_sessions");
  const [manualPaymentAmount, setManualPaymentAmount] = useState<number>(0);
  const [manualPaymentExpires, setManualPaymentExpires] = useState<string>("");
  const [manualPaymentAccountId, setManualPaymentAccountId] =
    useState<string>("");
  const [manualPaymentLoading, setManualPaymentLoading] = useState(false);
  const [manualPaymentError, setManualPaymentError] = useState<string | null>(
    null,
  );
  const [manualPaymentSuccess, setManualPaymentSuccess] = useState<
    string | null
  >(null);

  // Auto-calculate payment amount when subscription type changes
  React.useEffect(() => {
    if (!crmConfig) return;
    let baseAmount = 0;
    switch (manualPaymentType) {
      case "12_sessions":
        baseAmount = crmConfig.price12 || 0;
        break;
      case "8_sessions":
        baseAmount = crmConfig.price8 || 0;
        break;
      case "4_sessions":
        baseAmount = crmConfig.price4 || 0;
        break;
      case "1_session":
        baseAmount = crmConfig.price1 || 0;
        break;
    }
    setManualPaymentAmount(baseAmount);
  }, [manualPaymentType, crmConfig]);

  // Auto-calculate expiration date (30 days from payment date)
  React.useEffect(() => {
    if (!manualPaymentDate) return;
    const dateObj = new Date(manualPaymentDate);
    if (isNaN(dateObj.getTime())) return;
    dateObj.setDate(dateObj.getDate() + 30);
    setManualPaymentExpires(dateObj.toISOString().substring(0, 10));
  }, [manualPaymentDate]);

  // Client form modal state
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set(),
  );

  // Trial booking modal state
  const [bookingTrialLead, setBookingTrialLead] = useState<Lead | null>(null);
  const [trialCoachId, setTrialCoachId] = useState("");
  const [trialGroupId, setTrialGroupId] = useState("");
  const [trialDate, setTrialDate] = useState("");
  const [trialTime, setTrialTime] = useState("");

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddDirectClientOpen, setIsAddDirectClientOpen] = useState(false);
  const [newParentName, setNewParentName] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [newChildSurname, setNewChildSurname] = useState("");
  const [newChildBirthDate, setNewChildBirthDate] = useState("");
  const [newPhone, setNewPhone] = useState("+7 ");
  const [newSource, setNewSource] = useState<
    "MAX" | "telegram" | "vk" | "листовка" | "рекомендация"
  >("MAX");

  // Direct Client Form States
  const [newDirectParentName, setNewDirectParentName] = useState("");
  const [newDirectChildName, setNewDirectChildName] = useState("");
  const [newDirectChildSurname, setNewDirectChildSurname] = useState("");
  const [newDirectChildBirthDate, setNewDirectChildBirthDate] = useState("");
  const [newDirectPhone, setNewDirectPhone] = useState("+7 ");
  const [newDirectEmail, setNewDirectEmail] = useState("");
  const [newDirectGroup, setNewDirectGroup] = useState("");
  const [newDirectStatus, setNewDirectStatus] =
    useState<Client["status"]>("active");
  const [newDirectAbonement, setNewDirectAbonement] =
    useState<Client["abonement"]>("none");

  // Edit Client modal state
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editClientId, setEditClientId] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editChildName, setEditChildName] = useState("");
  const [editChildSurname, setEditChildSurname] = useState("");
  const [editChildBirthDate, setEditChildBirthDate] = useState("");
  const [editChildAge, setEditChildAge] = useState(0);
  const [editChildYear, setEditChildYear] = useState(new Date().getFullYear());
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState<ClientStatus>("active");
  const [editAbonement, setEditAbonement] =
    useState<Client["abonement"]>("none");
  const [editAbonementSessions, setEditAbonementSessions] = useState(0);
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  const [editGroup, setEditGroup] = useState<string>("");
  const [editRelationshipRisk, setEditRelationshipRisk] = useState<
    "none" | "low" | "high"
  >("none");
  const [editRelationshipNotes, setEditRelationshipNotes] = useState("");
  const [editRiskType, setEditRiskType] = useState<
    "none" | "conflict" | "absences"
  >("none");
  const [editRiskDetails, setEditRiskDetails] = useState("");
  const [editRiskUrgency, setEditRiskUrgency] = useState<
    "none" | "intervene" | "urgent"
  >("none");
  const [editRiskResolution, setEditRiskResolution] = useState<
    | "none"
    | "left"
    | "thinking"
    | "renewed"
    | "refused"
    | "resolved"
    | "reconciled"
  >("none");
  const [editRiskComment, setEditRiskComment] = useState("");
  const [editManagerBonus, setEditManagerBonus] = useState(0);

  // Dynamic set of all active/school groups present in DB or default presets (trimmed to avoid duplicates)
  const availableGroups = Array.from(
    new Set([
      ...(groups || []).map((g) => g.name?.trim()),
      ...((clients || [])
        .map((c) => c.groupName?.trim())
        .filter(Boolean) as string[]),
    ]),
  ).sort();

  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);
  const hasUnreadTasks = tasks.some(
    (t) => t.assignedTo === "manager" && t.status === "new",
  );
  const [
    notificationsHasUnreadLocallyCleared,
    setNotificationsHasUnreadLocallyCleared,
  ] = useState(false);
  const showNotificationDot =
    hasUnreadTasks && !notificationsHasUnreadLocallyCleared;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Profile Form States
  const [tempProfileName, setTempProfileName] = useState("");
  const [tempProfileRole, setTempProfileRole] = useState("");
  const [tempProfileAvatar, setTempProfileAvatar] = useState("");
  const [tempProfilePhone, setTempProfilePhone] = useState("");
  const [tempProfileEmail, setTempProfileEmail] = useState("");

  // Permissions Form States
  const [permissions, setPermissions] = useState({
    canEditClients: true,
    canDeleteClients: false,
    canViewFinances: true,
    canEditFinances: false,
    canManageGroups: true,
    canManageCoaches: false,
  });

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [filterAbonement, setFilterAbonement] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");

  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleOpenMaxChat = (phone: string | undefined) => {
    if (!phone) {
      alert("Не указан номер телефона");
      return;
    }
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    const wantsApp = window.confirm(
      "Запустить приложение MAX, если оно установлено?\nНажмите Отмена, чтобы использовать Web-версию.",
    );
    if (wantsApp) {
      // Try to open using a generic deep link approach. Usually just the web URL will redirect if Universal Links are set up.
      // But we can also try to use a custom scheme if we had one.
      const appUrl = `max://chat?phone=${encodeURIComponent(cleanPhone)}`;
      window.location.href = appUrl;
      setTimeout(() => {
        window.open(
          `https://web.max.ru/?phone=${encodeURIComponent(cleanPhone)}`,
          "_blank",
        );
      }, 1500);
    } else {
      window.open(
        `https://web.max.ru/?phone=${encodeURIComponent(cleanPhone)}`,
        "_blank",
      );
    }
  };

  const handleStartEditClient = (client: Client) => {
    setEditClientId(client.id);
    setEditParentName(client.parentName || "");
    setEditChildName(client.childName || "");
    setEditChildSurname(client.childSurname || "");
    setEditChildBirthDate(
      client.childBirthDate || `${client.childBirthYear}-01-01`,
    );
    setEditChildAge(client.childAge || 0);
    setEditChildYear(client.childBirthYear || new Date().getFullYear());
    setEditPhone(client.parentPhone || "");
    setEditEmail(client.parentEmail || "");
    setEditStatus(client.status || "active");
    setEditAbonement(client.abonement || "none");
    setEditAbonementSessions(client.abonementSessionsLeft || 0);
    setEditAvatarUrl(client.avatarUrl || "");
    setEditGroup(client.groupName || "");
    setEditRelationshipRisk(client.relationshipRisk || "none");
    setEditRelationshipNotes(client.relationshipNotes || "");
    setEditRiskType(client.riskType || "none");
    setEditRiskDetails(client.riskDetails || "");
    setEditRiskUrgency(client.riskUrgency || "none");
    setEditRiskResolution(client.riskResolution || "none");
    setEditRiskComment(client.riskComment || "");
    setEditManagerBonus(client.managerBonusAccrued || 0);
    setIsEditClientOpen(true);
  };

  const handleSaveClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientId) return;
    try {
      await updateClient(editClientId, {
        parentName: editParentName,
        childName: editChildName,
        childSurname: editChildSurname,
        childBirthDate: editChildBirthDate || undefined,
        childBirthYear: editChildBirthDate
          ? parseInt(editChildBirthDate.split("-")[0])
          : 2018,
        childAge: calculateAge(editChildBirthDate, 2018),
        parentPhone: editPhone,
        parentEmail: editEmail,
        status: editStatus,
        abonement: editAbonement,
        abonementSessionsLeft: editAbonementSessions,
        avatarUrl: editAvatarUrl,
        relationshipRisk: editRelationshipRisk,
        relationshipNotes: editRelationshipNotes,
        riskType: editRiskType,
        riskDetails: editRiskDetails,
        riskUrgency: editRiskUrgency,
        riskResolution: editRiskResolution,
        riskComment: editRiskComment,
        managerBonusAccrued: editManagerBonus,
      });
      // also assign client to selected group effectively
      await assignClientToGroup(editClientId, editGroup || null);

      setIsEditClientOpen(false);
      alert("Данные ученика успешно обновлены!");
    } catch (err: any) {
      alert("Ошибка при обновлении данных: " + err.message);
    }
  };

  const handleSaveInlineEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await updateClient(selectedClient.id, {
        parentName: editParentName,
        childName: editChildName,
        childSurname: editChildSurname,
        childAge: editChildAge,
        childBirthYear: editChildYear,
        parentPhone: editPhone,
        parentEmail: editEmail,
        status: editStatus,
        abonement: editAbonement,
        abonementSessionsLeft: editAbonementSessions,
        avatarUrl: editAvatarUrl,
        relationshipNotes: editRelationshipNotes,
        relationshipRisk: editRelationshipRisk,
        riskType: editRiskType,
        riskDetails: editRiskDetails,
        riskUrgency: editRiskUrgency,
        riskResolution: editRiskResolution,
        riskComment: editRiskComment,
        managerBonusAccrued: editManagerBonus,
      });
      // also assign client to selected group effectively
      await assignClientToGroup(selectedClient.id, editGroup || null);

      setIsEditingRightCard(false);
    } catch (err: any) {
      alert("Ошибка при сохранении: " + err.message);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file, (base64) => setEditAvatarUrl(base64));
  };

  const PRESET_AVATARS = [
    { emoji: "⚽", bg: "bg-emerald-500 text-white" },
    { emoji: "👟", bg: "bg-amber-500 text-white" },
    { emoji: "🏆", bg: "bg-blue-500 text-white" },
    { emoji: "⭐", bg: "bg-indigo-500 text-white" },
    { emoji: "🔥", bg: "bg-rose-500 text-white" },
    { emoji: "🦁", bg: "bg-teal-500 text-white" },
  ];

  // Helper to construct SVG/base64 avatar from emoji
  const selectPresetAvatar = (preset: (typeof PRESET_AVATARS)[0]) => {
    // Generate an SVG data url with the preset
    const svgCode = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100%" height="100%" fill="${preset.bg.includes("emerald") ? "#10b981" : preset.bg.includes("amber") ? "#f59e0b" : preset.bg.includes("blue") ? "#3b82f6" : preset.bg.includes("indigo") ? "#6366f1" : preset.bg.includes("rose") ? "#f43f5e" : "#14b8a6"}"/>
        <text x="50%" y="65%" font-size="50" text-anchor="middle" dominant-baseline="middle">${preset.emoji}</text>
      </svg>
    `;
    const base64Svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;
    setEditAvatarUrl(base64Svg);
  };

  const selectedClient =
    clients.find((c) => c.id === selectedClientId) || clients[0];

  React.useEffect(() => {
    if (selectedClient) {
      setClientNotes((prev) => {
        if (prev[selectedClient.id] === undefined) {
          return {
            ...prev,
            [selectedClient.id]: selectedClient.notes || "",
          };
        }
        return prev;
      });
    }
  }, [selectedClient]);

  const handleSaveManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      setManualPaymentError("Клиент не выбран.");
      return;
    }
    setManualPaymentLoading(true);
    setManualPaymentError(null);
    setManualPaymentSuccess(null);

    try {
      const type = manualPaymentType;
      const amount = Number(manualPaymentAmount) || 0;
      const paymentDate = manualPaymentDate;
      const expiresDate = manualPaymentExpires;

      const sessionsMap = {
        "12_sessions": 12,
        "8_sessions": 8,
        "4_sessions": 4,
        "1_session": 1,
      };
      const sessions = sessionsMap[type];

      // Calculate total sessions left
      const updatedSessionsLeft =
        (selectedClient.abonementSessionsLeft || 0) + sessions;

      const itemLabel =
        type === "1_session"
          ? `Разовая тренировка (Вручную)`
          : `Абонемент на ${sessions} занятий (Вручную)`;

      const newPayment = {
        id: `p_manual_${Date.now()}`,
        date: paymentDate,
        amount,
        item: itemLabel,
        status: "Оплачено" as const,
      };

      const updatedPayments = [newPayment, ...(selectedClient.payments || [])];

      const clientUpdates = {
        abonement: type,
        abonementStatus: "Оплачено" as const,
        abonementTotalSessions: updatedSessionsLeft,
        abonementSessionsLeft: updatedSessionsLeft,
        abonementExpirationDate: expiresDate,
        payments: updatedPayments,
      };

      // Call context function to update client locally & in firestore db
      await updateClient(selectedClient.id, clientUpdates);

      // Save finance record automatically in backend/firestore
      const categoryName =
        type === "1_session" ? "Разовые тренировки" : "Абонементы";
      await addFinanceRecord({
        type: "income",
        category: categoryName,
        amount,
        date: paymentDate,
        description: `Ручное внесение: ${itemLabel} (${selectedClient.childSurname} ${selectedClient.childName})`,
        accountId: manualPaymentAccountId || "acc_bank",
        isFixed: false,
      });

      setManualPaymentSuccess("Платёж успешно занесён вручную и сохранён!");
    } catch (err: any) {
      console.error(err);
      setManualPaymentError(err?.message || "Не удалось занести платёж.");
    } finally {
      setManualPaymentLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!selectedClient) return;
    if (!window.confirm("Удалить этот платёж? Действие нельзя отменить."))
      return;

    try {
      const updatedPayments = (selectedClient.payments || []).filter(
        (p) => p.id !== paymentId,
      );
      await updateClient(selectedClient.id, { payments: updatedPayments });
    } catch (err) {
      console.error("Ошибка при удалении платежа:", err);
      alert("Не удалось удалить платёж.");
    }
  };

  const handleClearSubscription = async () => {
    if (!selectedClient) return;
    if (
      !window.confirm(
        "Вы уверены, что хотите обнулить абонемент у клиента? Остаток занятий сбросится на 0.",
      )
    )
      return;

    try {
      await updateClient(selectedClient.id, {
        abonement: "none",
        abonementStatus: "Нет абонемента",
        abonementSessionsLeft: 0,
        abonementTotalSessions: 0,
        abonementExpirationDate: "",
      });
    } catch (err) {
      console.error("Ошибка при удалении абонемента:", err);
      alert("Не удалось обнулить абонемент.");
    }
  };

  const handleSaveNotes = async (id: string, text: string) => {
    setClientNotes((prev) => ({
      ...prev,
      [id]: text,
    }));
    try {
      await updateClientNotes(id, text);
      alert("Заметка о клиенте успешно сохранена в базе данных!");
    } catch (e: any) {
      alert("Ошибка при сохранении заметки: " + (e.message || String(e)));
    }
  };

  const [addLeadError, setAddLeadError] = useState<string | null>(null);

  const handleAddNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLeadError(null);
    try {
      if (!newParentName)
        throw new Error("Пожалуйста, заполните поле 'ФИО Родителя'.");
      if (!newChildName)
        throw new Error("Пожалуйста, заполните поле 'Имя ученика'.");
      if (!newPhone || newPhone.replace(/\D/g, "").length < 11)
        throw new Error("Пожалуйста, корректно заполните поле 'Телефон'.");

      await addLead({
        parentName: newParentName,
        parentPhone: newPhone || "+7 (900) 123-45-67",
        parentEmail: "client@amkar-junior.ru",
        childName: newChildName,
        childSurname: newChildSurname || "Иванов",
        childBirthDate: newChildBirthDate || undefined,
        childBirthYear: newChildBirthDate
          ? parseInt(newChildBirthDate.split("-")[0])
          : 2018,
        childAge: calculateAge(newChildBirthDate, 2018),
        source: newSource,
      });
      alert(
        'Новая входящая заявка успешно зарегистрирована во вкладке "Заявки" и добавлена в задачник руководителя и менеджера!',
      );
      setIsAddLeadOpen(false);
      // clean forms
      setNewParentName("");
      setNewChildName("");
      setNewChildSurname("");
      setNewPhone("+7 ");
    } catch (err: any) {
      setAddLeadError(
        "Ошибка при регистрации лида: " + (err.message || String(err)),
      );
    }
  };

  const formatPhoneAndSet = (val: string, setter: (v: string) => void) => {
    let raw = val.replace(/\D/g, "");
    if (raw.startsWith("7") || raw.startsWith("8")) raw = raw.substring(1);
    raw = raw.substring(0, 10);
    let formatted = "";
    if (raw.length > 0) formatted += "(" + raw.substring(0, 3);
    if (raw.length > 3) formatted += ") " + raw.substring(3, 6);
    if (raw.length > 6) formatted += "-" + raw.substring(6, 8);
    if (raw.length > 8) formatted += "-" + raw.substring(8, 10);
    setter("+7 " + formatted);
  };

  const [addClientError, setAddClientError] = useState<string | null>(null);

  const handleAddNewDirectClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddClientError(null);
    try {
      if (!newDirectParentName)
        throw new Error("Пожалуйста, заполните поле 'ФИО Родителя'");
      if (!newDirectChildName)
        throw new Error("Пожалуйста, заполните поле 'Имя ученика'");
      if (!newDirectChildSurname)
        throw new Error("Пожалуйста, заполните поле 'Фамилия ученика'");
      if (!newDirectChildBirthDate)
        throw new Error("Пожалуйста, заполните поле 'Дата рождения'");
      if (!newDirectPhone || newDirectPhone.replace(/\D/g, "").length < 11)
        throw new Error("Пожалуйста, корректно заполните поле 'Телефон'");

      await addClient({
        parentName: newDirectParentName,
        parentPhone: newDirectPhone || "+7 (000) 000-00-00",
        parentEmail: newDirectEmail || undefined,
        childName: newDirectChildName,
        childSurname: newDirectChildSurname,
        childBirthDate: newDirectChildBirthDate || undefined,
        childBirthYear: newDirectChildBirthDate
          ? parseInt(newDirectChildBirthDate.split("-")[0])
          : new Date().getFullYear(),
        childAge: calculateAge(
          newDirectChildBirthDate,
          new Date().getFullYear(),
        ),
        status: newDirectStatus,
        abonement: newDirectAbonement,
        abonementStatus:
          newDirectAbonement !== "none" ? "Ожидает оплаты" : "Не требуется",
        abonementSessionsLeft:
          newDirectAbonement === "1_session"
            ? 1
            : newDirectAbonement === "4_sessions"
              ? 4
              : newDirectAbonement === "8_sessions"
                ? 8
                : newDirectAbonement === "12_sessions"
                  ? 12
                  : 0,
        abonementTotalSessions:
          newDirectAbonement === "1_session"
            ? 1
            : newDirectAbonement === "4_sessions"
              ? 4
              : newDirectAbonement === "8_sessions"
                ? 8
                : newDirectAbonement === "12_sessions"
                  ? 12
                  : 0,
        groupName: newDirectGroup || undefined,
        managerBonusAccrued: 0,
        notes: "Добавлен менеджером вручную из CRM",
      });
      alert("Новый ученик успешно добавлен!");
      setIsAddDirectClientOpen(false);
      // clean forms
      setNewDirectParentName("");
      setNewDirectChildName("");
      setNewDirectChildSurname("");
      setNewDirectPhone("+7 ");
      setNewDirectEmail("");
      setNewDirectGroup("");
    } catch (err: any) {
      setAddClientError(
        "Ошибка при добавлении ученика: " + (err.message || String(err)),
      );
    }
  };

  const handleOpenBookTrial = (lead: Lead) => {
    setBookingTrialLead(lead);
    setTrialDate((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })());
    setTrialTime("17:00");
    setTrialCoachId("");
    setTrialGroupId("");
  };

  const handleBookTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !bookingTrialLead ||
      !trialCoachId ||
      !trialGroupId ||
      !trialDate ||
      !trialTime
    ) {
      alert("Пожалуйста, заполните все поля.");
      return;
    }

    const groupName =
      groups.find((g) => g.id === trialGroupId)?.name || "Без группы";
    const coach = coaches.find((c) => c.id === trialCoachId);
    bookTrial(
      bookingTrialLead.id,
      trialCoachId,
      groupName,
      trialDate,
      trialTime,
    );
    alert(
      `Заявка переведена в статус "Забронирована пробная"!\nРебенок добавлен в "Пробный период" клиентов.\nТренеру ${coach ? `"${coach.name}" ` : ""}отправлено автоматическое задание на пробное занятие.`,
    );
    setBookingTrialLead(null);
  };

  const handleSendBilling = (
    client: Client,
    packageTitle: string,
    amount: number,
  ) => {
    alert(
      `Ссылка на оплату тарифа "${packageTitle}" (${amount} руб) сформирована через YooKassa и отправлена родителю ${client.parentName} в Личный кабинет!`,
    );
  };

  // Filter clients logically
  const filteredClients = clients
    .filter((c) => {
      const matchesSearch =
        c.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.childSurname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.parentPhone && c.parentPhone.includes(searchTerm));

      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      const matchesGroup =
        filterGroup === "all" ||
        (c.groupName &&
          filterGroup &&
          c.groupName.trim().toLowerCase() ===
            filterGroup.trim().toLowerCase());

      const matchesAbonement =
        filterAbonement === "all" ||
        (filterAbonement === "unpaid" && c.abonementStatus !== "Оплачено") ||
        (filterAbonement === "paid" && c.abonementStatus === "Оплачено") ||
        (filterAbonement === "none" && c.abonement === "none");

      const matchesBranch =
        filterBranch === "all" || (c.branch && c.branch === filterBranch);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesGroup &&
        matchesAbonement &&
        matchesBranch
      );
    })
    .sort((a, b) => {
      const nameA = `${a.childSurname} ${a.childName}`.trim().toLowerCase();
      const nameB = `${b.childSurname} ${b.childName}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, "ru");
    });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const expiringAbonements = clients.filter(
    (c) =>
      c.status === "active" &&
      c.abonement &&
      c.abonement !== "none" &&
      (c.abonementSessionsLeft <= 2 || c.abonementStatus === "Ожидает оплаты"),
  ).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 ">
      {/* Dynamic Header bar */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center"><h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            {activeTab === "hq_leads"
              ? "Входящие Лиды и Заявки"
              : "База Клиентов школы"}
          </h1><HeaderDescription text={<>Управление цепочкой лидов, распределение по возрастным группам и
            контроль абонементов.</>} /></div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {crmConfig?.yandexFormUrl && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(crmConfig.yandexFormUrl || "");
                alert("Ссылка на форму скопирована в буфер обмена!");
              }}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center space-x-2 border border-indigo-200"
            >
              <Link className="w-4 h-4" />
              <span>Ссылка на форму</span>
            </button>
          )}

          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-100"
          >
            <UserPlus className="w-4 h-4" />
            <span>Новая заявка (Лид)</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* LEADS BOARD INTERACTIVE (МАТЧИТ ИЗОБРАЖЕНИЕ №4) */}
        {activeTab === "hq_leads" && (
          <div className="space-y-6">
            {/* Quick stats grid */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-white flex flex-wrap gap-6 items-center justify-between">
              <div className="text-left space-y-1">
                <div className="text-2xl font-black text-emerald-500">
                  {leads.length}
                </div>
                <div className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                  Поступило заявок всего
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-800"></div>
              <div className="text-left space-y-1">
                <div className="text-xl font-black text-slate-200">
                  {(() => {
                    const sources: { [key: string]: number } = {};
                    leads.forEach((l) => {
                      const src = (l.source || "Другое").toUpperCase();
                      sources[src] = (sources[src] || 0) + 1;
                    });
                    const entries = Object.entries(sources);
                    return entries.length > 0
                      ? entries
                          .map(([src, count]) => `${src}: ${count}`)
                          .join(" • ")
                      : "Нет активных заявок";
                  })()}
                </div>
                <div className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                  Распределение по рекламе
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-800"></div>
              <div className="text-xs text-slate-300 max-w-sm">
                Заявки автоматически регистрируются в CRM по API и добавляются в
                задачник менеджерам.
              </div>
            </div>

            {/* Leads list table/grid */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm text-left">
                Входящие обращения (на модерации звонка)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-gray-400 font-semibold uppercase tracking-wider border-b">
                      <th className="p-3">Родитель</th>
                      <th className="p-3">Ребенок</th>
                      <th className="p-3">Возраст</th>
                      <th className="p-3">Источник рекламы</th>
                      <th className="p-3">Дата обращения</th>
                      <th className="p-3">Текущий статус</th>
                      <th className="p-3 text-right">Экспресс-действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">
                            {lead.parentName}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {lead.parentPhone}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {lead.childSurname} {lead.childName}
                        </td>
                        <td className="p-3 font-medium">
                          {lead.childAge} лет{" "}
                          <span className="text-[10px] text-gray-400">
                            ({lead.childBirthYear} г.р.)
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.source === "MAX"
                                ? "bg-orange-100 text-orange-800"
                                : lead.source === "telegram"
                                  ? "bg-sky-100 text-sky-800"
                                  : lead.source === "vk"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {lead.source}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold">{lead.timeString}</div>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {new Date(
                              lead.createdAt || Date.now(),
                            ).toLocaleDateString("ru-RU")}
                          </p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              lead.status === "new"
                                ? "bg-orange-100 text-orange-800 font-black"
                                : lead.status === "trial_booked"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {lead.status === "new"
                              ? "Новая заявка"
                              : lead.status === "trial_booked"
                                ? "Пробная забронирована"
                                : "Отработано"}
                          </span>
                          {(lead.status === "trial_booked" ||
                            lead.status === "trial_completed") &&
                            lead.trialDate && (
                              <div className="mt-1 text-[10px] text-slate-600 bg-slate-100 p-1 rounded-md">
                                <span className="font-semibold block">
                                  {lead.trialDate} в {lead.trialTime}
                                </span>
                                <span
                                  className="block truncate max-w-[150px]"
                                  title={
                                    coaches.find(
                                      (c) => c.id === lead.trialCoachId,
                                    )?.name
                                  }
                                >
                                  Тренер:{" "}
                                  {coaches.find(
                                    (c) => c.id === lead.trialCoachId,
                                  )?.name || "Не указан"}
                                </span>
                                {lead.trainerFeedback && (
                                  <span
                                    className="block text-emerald-700 italic truncate max-w-[150px]"
                                    title={lead.trainerFeedback}
                                  >
                                    Итог: {lead.trainerFeedback}
                                  </span>
                                )}
                              </div>
                            )}
                        </td>
                        <td className="p-3 text-right flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenMaxChat(lead.parentPhone)}
                            className="p-1.5 text-[#7551FF] hover:bg-[#7551FF]/10 rounded-lg transition hover:scale-105 border border-transparent hover:border-[#7551FF]/20"
                            title="Чат MAX с родителем"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="w-4 h-4 fill-current drop-shadow-sm"
                            >
                              <defs>
                                <linearGradient
                                  id="maxGradLead"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop offset="0%" stopColor="#2BC1FF" />
                                  <stop offset="50%" stopColor="#7551FF" />
                                  <stop offset="100%" stopColor="#9D38FF" />
                                </linearGradient>
                              </defs>
                              <path
                                fill="url(#maxGradLead)"
                                d="M12 2C6.477 2 2 6.477 2 12c0 1.905.534 3.684 1.464 5.203.208.337.262.748.118 1.112l-1.246 3.165a.6.6 0 00.776.776l3.164-1.246a1.18 1.18 0 011.112.118C8.91 21.936 10.418 22.5 12 22.5c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 15.5c-3.037 0-5.5-2.463-5.5-5.5S8.963 6.5 12 6.5s5.5 2.463 5.5 5.5-2.463 5.5-5.5 5.5z"
                              />
                            </svg>
                          </button>
                          {lead.status === "new" ||
                          lead.status === "contacted" ? (
                            <button
                              onClick={() => handleOpenBookTrial(lead)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] transition"
                            >
                              Пригласить на пробную
                            </button>
                          ) : lead.status === "trial_completed" ? (
                            <span className="text-[11px] text-emerald-600 font-bold">
                              Ожидает покупки
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold">
                              ✓ Отработан успешно
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setDeleteLeadModal({
                                isOpen: true,
                                leadId: lead.id,
                                leadName: `${lead.parentName} (${lead.childName})`,
                              });
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                            title="Удалить заявку"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CLIENTS DIRECTORY VIEW (МАТЧИТ ИЗОБРАЖЕНИЕ №4) */}
        {activeTab === "hq_clients" && (
          <div className="space-y-6">
            {/* Custom Top Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm relative z-10 -mx-4 md:-mx-6 -mt-4 md:-mt-6 rounded-b-none mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  Клиенты
                </h1>
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  Главная <ChevronRight className="w-3 h-3 inline pb-0.5" />{" "}
                  Клиенты
                </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-auto flex-1 min-w-0">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск клиента..."
                    className="pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-medium border-none focus:ring-0 outline-none w-full sm:w-52 transition-colors text-gray-700"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={() => setIsAddDirectClientOpen(true)}
                    className="flex-1 sm:flex-none bg-black hover:bg-gray-800 text-white px-3 md:px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md shadow-gray-200 whitespace-nowrap text-center justify-center"
                  >
                    <span className="-ml-1 mr-1.5">+</span> Добавить клиента
                  </button>
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
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md shadow-emerald-200 whitespace-nowrap text-center justify-center"
                    title="Скопировать ссылку-приглашение для родителей"
                  >
                    🔗 Пригласить
                  </button>
                </div>
                <div className="relative sm:ml-auto xl:ml-2 flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
                  <div
                    className="relative cursor-pointer hover:bg-gray-50 p-2 rounded-full transition-colors ml-2"
                    onClick={() => {
                      setIsNotificationsMenuOpen(!isNotificationsMenuOpen);
                      setNotificationsHasUnreadLocallyCleared(true);
                      setIsProfileMenuOpen(false);
                    }}
                  >
                    {(showNotificationDot || expiringAbonements > 0) && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-2 right-2 ring-2 ring-white"></span>
                    )}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  {isNotificationsMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                      <h4 className="font-bold text-gray-800 mb-2 border-b pb-2 text-sm">
                        Уведомления
                      </h4>
                      {tasks
                        .filter(
                          (t) =>
                            t.assignedTo === "manager" &&
                            t.status !== "completed",
                        )
                        .slice(0, 5)
                        .map((task) => (
                          <p
                            key={task.id}
                            className="text-xs text-slate-600 py-1.5 border-b last:border-none border-gray-50"
                          >
                            {task.title}
                          </p>
                        ))}
                      {expiringAbonements > 0 && (
                        <div
                          className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded mt-2 cursor-pointer"
                          onClick={() => {
                            setFilterAbonement("unpaid");
                            setIsNotificationsMenuOpen(false);
                          }}
                        >
                          Внимание! {expiringAbonements} абонементов истекают
                          или требуют оплаты.
                        </div>
                      )}
                      {tasks.filter(
                        (t) =>
                          t.assignedTo === "manager" &&
                          t.status !== "completed",
                      ).length === 0 &&
                        expiringAbonements === 0 && (
                          <p className="text-xs text-gray-400 py-1 italic">
                            Нет новых уведомлений
                          </p>
                        )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div
                    className="flex items-center space-x-2.5 pl-2 cursor-pointer border-l border-gray-100"
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsNotificationsMenuOpen(false);
                    }}
                  >
                    <img
                      src={userProfile.avatarUrl}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover bg-gray-100 border border-gray-200"
                    />
                    <div className="text-left hidden md:block">
                      <div className="font-bold text-gray-900 text-xs">
                        {userProfile.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[120px]">
                        {userProfile.role}
                      </div>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400 hidden md:block"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700 flex items-center space-x-2"
                        onClick={() => {
                          setTempProfileName(userProfile.name);
                          setTempProfileRole(userProfile.role);
                          setTempProfileAvatar(userProfile.avatarUrl);
                          setTempProfilePhone(userProfile.phone);
                          setTempProfileEmail(userProfile.email);
                          setIsProfileMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span>Настройки профиля</span>
                      </div>
                      <div
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700 flex items-center space-x-2"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsPermissionsModalOpen(true);
                        }}
                      >
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span>Разграничение прав</span>
                      </div>
                      <div className="border-t my-1"></div>
                      <div
                        className="px-4 py-2 hover:bg-red-50 hover:text-red-600 cursor-pointer text-sm font-bold text-rose-600"
                        onClick={logout}
                      >
                        Выйти
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <BirthdaysBanner clients={clients} />

            {/* Dashboard / Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    Всего клиентов
                  </span>
                  <div className="w-6 h-6 rounded-md bg-gray-50 text-gray-400 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {clients.length}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold mt-1 tracking-wide">
                    {newClientsThisWeek > 0 ? `+${newClientsThisWeek} за неделю` : (newClientsThisWeek === 0 ? "0 за неделю" : `${newClientsThisWeek} за неделю`)}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    Активные
                  </span>
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {clients.filter((c) => c.status === "active").length}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold mt-1 tracking-wide">
                    {clients.length
                      ? Math.round(
                          (clients.filter((c) => c.status === "active").length /
                            clients.length) *
                            100,
                        )
                      : 0}
                    % от всех
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    Новые за месяц
                  </span>
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">{newClientsThisMonth}</div>
                  <div className={`text-[10px] font-bold mt-1 tracking-wide ${newClientsLastMonthDiff >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {newClientsLastMonthDiff > 0 ? "+" : ""}{newClientsLastMonthDiff} к прошлому месяцу
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    На пробном периоде
                  </span>
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Timer className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {clients.filter((c) => c.status === "trial").length}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold mt-1 tracking-wide">
                    {clients.length
                      ? Math.round(
                          (clients.filter((c) => c.status === "trial").length /
                            clients.length) *
                            100,
                        )
                      : 0}
                    % от всех
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    Отток / Завершили
                  </span>
                  <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {
                      clients.filter(
                        (c) => c.status === "left" || c.status === "inactive",
                      ).length
                    }
                  </div>
                  <div className="text-[10px] text-rose-500 font-bold mt-1 tracking-wide">
                    -8 к прошлому месяцу
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left table directory (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center space-x-2 text-[10px] font-bold font-sans overflow-x-auto pb-2 scrollbar-hide">
                  <span className="text-gray-900 mr-2 text-sm font-extrabold pr-2">
                    Список клиентов
                  </span>
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-3 py-1.5 rounded-full shrink-0 transition-colors ${filterStatus === "all" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    Все{" "}
                    <span
                      className={`font-medium ml-1 ${filterStatus === "all" ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {clients.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFilterStatus("active")}
                    className={`px-3 py-1.5 rounded-full shrink-0 transition-colors ${filterStatus === "active" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    Активные{" "}
                    <span
                      className={`font-medium ml-1 ${filterStatus === "active" ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {clients.filter((c) => c.status === "active").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFilterStatus("paused")}
                    className={`px-3 py-1.5 rounded-full shrink-0 transition-colors ${filterStatus === "paused" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    На паузе{" "}
                    <span
                      className={`font-medium ml-1 ${filterStatus === "paused" ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {clients.filter((c) => c.status === "paused").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFilterStatus("left")}
                    className={`px-3 py-1.5 rounded-full shrink-0 transition-colors ${filterStatus === "left" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    Завершили{" "}
                    <span
                      className={`font-medium ml-1 ${filterStatus === "left" ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {clients.filter((c) => c.status === "left").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFilterStatus("trial")}
                    className={`px-3 py-1.5 rounded-full shrink-0 transition-colors ${filterStatus === "trial" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    Пробный период{" "}
                    <span
                      className={`font-medium ml-1 ${filterStatus === "trial" ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {clients.filter((c) => c.status === "trial").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFilterStatus("inactive")}
                    className={`px-3 py-1.5 rounded-full shrink-0 transition-colors ${filterStatus === "inactive" ? "bg-black text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    Отвал{" "}
                    <span
                      className={`font-medium ml-1 ${filterStatus === "inactive" ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {clients.filter((c) => c.status === "inactive").length}
                    </span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4 px-5 border border-gray-100 shadow-sm space-y-4">
                  {/* Search & filtering row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-none pb-0">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Поиск по имени, телефону..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 focus:bg-white text-xs border-none font-medium hover:bg-gray-100 rounded-full outline-none transition-colors"
                      />
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="py-2 pl-3 pr-8 bg-white border-none font-medium text-gray-500 text-[11px] rounded-full outline-none appearance-none cursor-pointer hover:bg-gray-50"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 10px center",
                        }}
                      >
                        <option value="all">Группа: Все</option>
                        {availableGroups.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="py-2 pl-3 pr-8 bg-white border-none font-medium text-gray-500 text-[11px] rounded-full outline-none appearance-none cursor-pointer hover:bg-gray-50"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 10px center",
                        }}
                      >
                        <option value="all">Статус: Все</option>
                        <option value="active">Активные</option>
                        <option value="inactive">Неактивные</option>
                        <option value="trial">На пробном периоде</option>
                        <option value="paused">На паузе</option>
                        <option value="left">Ушли / Выпускники</option>
                      </select>

                      <button
                        onClick={() =>
                          setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)
                        }
                        className={`flex items-center space-x-1 py-2 px-3 text-[11px] font-bold rounded-full transition-colors ml-1 ${isAdvancedFiltersOpen ? "bg-black text-white hover:bg-gray-800" : "text-gray-600 hover:text-black hover:bg-gray-50"}`}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>
                          {isAdvancedFiltersOpen
                            ? "Скрыть фильтры"
                            : "Все фильтры"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Advanced filters area */}
                  {isAdvancedFiltersOpen && (
                    <div className="grid md:grid-cols-3 gap-4 pt-3 pb-2 border-t border-gray-100">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">
                          Статус оплаты абонемента
                        </label>
                        <select
                          value={filterAbonement}
                          onChange={(e) => setFilterAbonement(e.target.value)}
                          className="w-full py-2 px-3 bg-gray-50 border border-transparent rounded-lg text-xs font-medium focus:ring-2 focus:ring-black outline-none"
                        >
                          <option value="all">Все</option>
                          <option value="paid">Оплачено</option>
                          <option value="unpaid">
                            Должники (Ожидает оплаты)
                          </option>
                          <option value="none">Нет абонемента</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Main Client list */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead>
                        <tr className="text-gray-400 font-medium uppercase tracking-wide border-b border-gray-100 text-[9px]">
                          <th className="p-2 md:p-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="rounded text-black focus:ring-black border-gray-300 mr-1"
                              checked={
                                filteredClients.length > 0 &&
                                selectedClientIds.size ===
                                  filteredClients.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClientIds(
                                    new Set(filteredClients.map((c) => c.id)),
                                  );
                                } else {
                                  setSelectedClientIds(new Set());
                                }
                              }}
                            />{" "}
                            Аватар
                          </th>
                          <th className="p-2 md:p-3">Данные ребёнка</th>
                          <th className="p-2 md:p-3 hidden sm:table-cell">
                            Данные родителя
                          </th>
                          <th className="p-2 md:p-3 hidden md:table-cell">
                            Группа
                          </th>
                          <th className="p-2 md:p-3 hidden sm:table-cell">
                            Статус
                          </th>
                          <th className="p-2 md:p-3 hidden lg:table-cell">
                            Абонемент
                          </th>
                          <th className="p-2 md:p-3 hidden sm:table-cell">
                            Оплата
                          </th>
                          <th className="p-2 md:p-3">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedClients.map((client, idx) => {
                          const isSelected = selectedClientId === client.id;
                          return (
                            <tr
                              key={idx}
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setIsEditingRightCard(false);

                                // sync editing states immediately
                                setEditClientId(client.id);
                                setEditParentName(client.parentName || "");
                                setEditChildName(client.childName || "");
                                setEditChildSurname(client.childSurname || "");
                                setEditChildAge(client.childAge || 0);
                                setEditChildYear(client.childBirthYear || 2018);
                                setEditPhone(client.parentPhone || "");
                                setEditEmail(client.parentEmail || "");
                                setEditStatus(client.status || "active");
                                setEditAbonement(client.abonement || "none");
                                setEditAbonementSessions(
                                  client.abonementSessionsLeft || 0,
                                );
                                setEditAvatarUrl(client.avatarUrl || "");
                                setEditGroup(client.groupName || "");
                                setEditRelationshipRisk(
                                  client.relationshipRisk || "none",
                                );
                                setEditRelationshipNotes(
                                  client.relationshipNotes || "",
                                );
                                setEditRiskType(client.riskType || "none");
                                setEditRiskDetails(client.riskDetails || "");
                                setEditRiskUrgency(
                                  client.riskUrgency || "none",
                                );
                                setEditRiskResolution(
                                  client.riskResolution || "none",
                                );
                                setEditRiskComment(client.riskComment || "");
                                setEditManagerBonus(
                                  client.managerBonusAccrued || 0,
                                );

                                // prefill note
                                if (!clientNotes[client.id]) {
                                  setClientNotes((prev) => ({
                                    ...prev,
                                    [client.id]: client.notes,
                                  }));
                                }
                              }}
                              className={`cursor-pointer transition border-b border-gray-100 last:border-none ${
                                isSelected
                                  ? "bg-gray-50/80 shadow-sm"
                                  : "hover:bg-gray-50/50"
                              }`}
                            >
                              <td className="p-2 md:p-3 align-middle">
                                <div className="flex items-center space-x-2.5">
                                  <input
                                    type="checkbox"
                                    className="rounded text-black focus:ring-black border-gray-300"
                                    checked={selectedClientIds.has(client.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const newSet = new Set(selectedClientIds);
                                      if (e.target.checked) {
                                        newSet.add(client.id);
                                      } else {
                                        newSet.delete(client.id);
                                      }
                                      setSelectedClientIds(newSet);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="h-8 w-8 rounded-full bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                                    {client.avatarUrl ? (
                                      <img
                                        src={client.avatarUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      client.childName?.[0] || "?"
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-2 md:p-3 align-middle">
                                <div className="font-bold text-gray-900 text-[11px] leading-tight">
                                  {client.childSurname} {client.childName}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                                  {client.childAge} лет ({formatBirthDate(client.childBirthDate, client.childBirthYear)})
                                </div>
                              </td>
                              <td className="p-2 md:p-3 hidden sm:table-cell align-middle">
                                <div className="font-bold text-gray-900 text-[11px] leading-tight">
                                  {client.parentName}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                                  {client.parentPhone}
                                </div>
                              </td>
                              <td className="p-2 md:p-3 hidden md:table-cell align-middle">
                                <div className="font-bold text-gray-900 text-[11px] leading-tight">
                                  {client.groupName || "Без группы"}
                                </div>
                                {client.coachName && (
                                  <div className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                                    Тренер: {client.coachName}
                                  </div>
                                )}
                              </td>
                              <td className="p-2 md:p-3 hidden sm:table-cell align-middle">
                                <div className="flex flex-col gap-1 items-start">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide capitalize ${
                                      client.status === "active"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : client.status === "left"
                                          ? "bg-red-50 text-red-600"
                                          : client.status === "inactive"
                                            ? "bg-gray-100 text-gray-500"
                                            : client.status === "trial"
                                              ? "bg-blue-50 text-blue-600"
                                              : "bg-amber-50 text-amber-600"
                                    }`}
                                  >
                                    {client.status === "active"
                                      ? "Активный"
                                      : client.status === "left"
                                        ? "Завершил"
                                        : client.status === "inactive"
                                          ? "Отвал"
                                          : client.status === "trial"
                                            ? "Пробный период"
                                            : "На паузе"}
                                  </span>
                                  {client.relationshipRisk &&
                                    client.relationshipRisk !== "none" && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide flex items-center shadow-sm ${client.relationshipRisk === "high" ? "bg-red-500 text-white animate-pulse" : "bg-orange-100 border border-orange-200 text-orange-700"}`}
                                      >
                                        <span className="mr-0.5">!</span> Риск
                                        оттока
                                      </span>
                                    )}
                                </div>
                              </td>
                              <td className="p-2 md:p-3 hidden lg:table-cell align-middle">
                                <div className="font-bold text-gray-900 text-[11px] truncate max-w-[100px]">
                                  {client.abonement === "none"
                                    ? "-"
                                    : client.abonement === "12_sessions"
                                      ? "12 занятий"
                                      : client.abonement === "8_sessions"
                                        ? "8 занятий"
                                        : client.abonement === "4_sessions"
                                          ? "4 занятия"
                                          : client.abonement === "1_session"
                                            ? "Разовое"
                                            : client.abonement}
                                </div>
                                {client.status === "paused" ? (
                                  <div className="text-[10px] text-amber-500 font-medium">
                                    заморожен
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-gray-500 font-medium">
                                    {client.abonementExpirationDate
                                      ? `до ${new Date(client.abonementExpirationDate).toLocaleDateString("ru-RU")}`
                                      : "нет данных"}
                                  </div>
                                )}
                              </td>
                              <td className="p-2 md:p-3 hidden sm:table-cell align-middle">
                                <span
                                  className={`text-[10px] ${
                                    client.abonementStatus === "Оплачено"
                                      ? "text-emerald-500 font-medium"
                                      : "text-amber-500 font-medium"
                                  }`}
                                >
                                  {client.abonementStatus || "Не оплачено"}
                                </span>
                                <div className="text-[9px] text-gray-400 mt-0.5">
                                  {client.abonementSessionsLeft !==
                                  undefined ? (
                                    <>
                                      Остаток: {client.abonementSessionsLeft} из{" "}
                                      {(() => {
                                        const baseTotal =
                                          client.abonement === "12_sessions"
                                            ? 12
                                            : client.abonement === "8_sessions"
                                              ? 8
                                              : client.abonement ===
                                                  "4_sessions"
                                                ? 4
                                                : client.abonement ===
                                                    "1_session"
                                                  ? 1
                                                  : 0;
                                        return Math.max(
                                          baseTotal,
                                          client.abonementSessionsLeft || 0,
                                        );
                                      })()}
                                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                                        <div
                                          className="bg-emerald-400 h-1 rounded-full text-[0px]"
                                          style={{
                                            width: `${(() => {
                                              const baseTotal =
                                                client.abonement ===
                                                "12_sessions"
                                                  ? 12
                                                  : client.abonement ===
                                                      "8_sessions"
                                                    ? 8
                                                    : client.abonement ===
                                                        "4_sessions"
                                                      ? 4
                                                      : client.abonement ===
                                                          "1_session"
                                                        ? 1
                                                        : 0;
                                              const maxTotal =
                                                baseTotal > 0
                                                  ? Math.max(
                                                      baseTotal,
                                                      client.abonementSessionsLeft ||
                                                        0,
                                                    )
                                                  : 1;
                                              const used =
                                                maxTotal -
                                                (client.abonementSessionsLeft ||
                                                  0);
                                              return Math.min(
                                                100,
                                                Math.max(
                                                  0,
                                                  (used / maxTotal) * 100,
                                                ),
                                              );
                                            })()}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </>
                                  ) : (
                                    ""
                                  )}
                                </div>
                              </td>
                              <td className="p-2 md:p-3 align-middle flex justify-end space-x-1">
                                <button
                                  className="text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="Редактировать карточку"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClientId(client.id);

                                    // Sync edit states
                                    setEditClientId(client.id);
                                    setEditParentName(client.parentName || "");
                                    setEditChildName(client.childName || "");
                                    setEditChildSurname(
                                      client.childSurname || "",
                                    );
                                    setEditChildAge(client.childAge || 0);
                                    setEditChildYear(
                                      client.childBirthYear || 2018,
                                    );
                                    setEditPhone(client.parentPhone || "");
                                    setEditEmail(client.parentEmail || "");
                                    setEditStatus(client.status || "active");
                                    setEditAbonement(
                                      client.abonement || "none",
                                    );
                                    setEditAbonementSessions(
                                      client.abonementSessionsLeft || 0,
                                    );
                                    setEditAvatarUrl(client.avatarUrl || "");
                                    setEditGroup(client.groupName || "");
                                    setEditRelationshipRisk(
                                      client.relationshipRisk || "none",
                                    );
                                    setEditRelationshipNotes(
                                      client.relationshipNotes || "",
                                    );
                                    setEditRiskType(client.riskType || "none");
                                    setEditRiskDetails(
                                      client.riskDetails || "",
                                    );
                                    setEditRiskUrgency(
                                      client.riskUrgency || "none",
                                    );
                                    setEditRiskResolution(
                                      client.riskResolution || "none",
                                    );
                                    setEditRiskComment(
                                      client.riskComment || "",
                                    );
                                    setEditManagerBonus(
                                      client.managerBonusAccrued || 0,
                                    );

                                    setIsEditingRightCard(true);
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination stub matching image bottom */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-gray-400 font-medium">
                      Показано{" "}
                      {filteredClients.length === 0
                        ? 0
                        : (currentPage - 1) * itemsPerPage + 1}
                      -
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredClients.length,
                      )}{" "}
                      из {filteredClients.length} клиентов
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 rounded text-[11px] font-medium text-gray-600 transition disabled:opacity-30"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold shadow-sm transition ${currentPage === i + 1 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 rounded text-[11px] font-medium text-gray-600 transition disabled:opacity-30"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <div className="ml-4 flex items-center space-x-1 border-l border-gray-100 pl-4 py-1">
                        <span className="text-[11px] text-gray-400 font-medium hidden sm:inline-block">
                          На странице:
                        </span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="text-[11px] font-bold text-gray-700 bg-transparent border border-gray-100 rounded px-2 appearance-none outline-none cursor-pointer pr-4 hover:border-gray-200 transition"
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 4px center",
                          }}
                        >
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right details box - Drawer layout exactly matching Image 4 right */}
              <div className="space-y-4 lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left sticky top-4">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => {
                        if (isEditingRightCard) {
                          setIsEditingRightCard(false);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 text-[11px] font-bold flex items-center transition-colors hover:scale-105"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                      Назад
                    </button>
                    {isEditingRightCard ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingRightCard(false)}
                        className="text-gray-400 hover:text-red-500 text-[11px] font-bold flex items-center transition-colors hover:scale-105"
                      >
                        Отмена
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleStartEditClient(selectedClient as any);
                          setIsEditingRightCard(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-[11px] font-bold flex items-center transition-colors hover:scale-105"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Редактировать
                      </button>
                    )}
                  </div>

                  {selectedClient ? (
                    isEditingRightCard ? (
                      <form
                        onSubmit={handleSaveInlineEdit}
                        className="space-y-4 pt-1 text-xs"
                      >
                        <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                          Профиль ученика
                        </div>

                        {/* Avatar Preset Section */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-xl bg-white border flex items-center justify-center text-slate-700 text-lg font-extrabold overflow-hidden shrink-0 shadow-inner">
                            {editAvatarUrl ? (
                              <img
                                src={editAvatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              editChildName?.[0] || "?"
                            )}
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                              Быстрые стикеры:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {PRESET_AVATARS.map((ps, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    const svgCode = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100%" height="100%" fill="${ps.bg.includes("emerald") ? "%2310b981" : ps.bg.includes("amber") ? "%23f59e0b" : ps.bg.includes("blue") ? "%233b82f6" : ps.bg.includes("indigo") ? "%236366f1" : ps.bg.includes("rose") ? "%23f43f5e" : "%2314b8a6"}"/><text x="50%" y="65%" font-size="50" text-anchor="middle" dominant-baseline="middle">${ps.emoji}</text></svg>`;
                                    setEditAvatarUrl(svgCode);
                                  }}
                                  className={`h-6 w-6 rounded-full ${ps.bg} border flex items-center justify-center text-xs hover:scale-105 active:scale-95 transition shadow-sm`}
                                >
                                  {ps.emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Child Fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Фамилия ребенка
                            </label>
                            <input
                              required
                              type="text"
                              value={editChildSurname}
                              onChange={(e) =>
                                setEditChildSurname(e.target.value)
                              }
                              className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-semibold text-slate-900 border"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Имя ребенка
                            </label>
                            <input
                              required
                              type="text"
                              value={editChildName}
                              onChange={(e) => setEditChildName(e.target.value)}
                              className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-semibold text-slate-900 border"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Возраст (лет)
                            </label>
                            <input
                              required
                              type="number"
                              min="3"
                              max="18"
                              value={editChildAge}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 0;
                                setEditChildAge(v);
                                setEditChildYear(new Date().getFullYear() - v);
                              }}
                              className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-semibold text-slate-900 border"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Год рождения
                            </label>
                            <input
                              required
                              type="number"
                              min="2000"
                              max={new Date().getFullYear()}
                              value={editChildYear}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 2018;
                                setEditChildYear(v);
                                setEditChildAge(new Date().getFullYear() - v);
                              }}
                              className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-semibold text-slate-800 border"
                            />
                          </div>
                        </div>

                        {/* Parent details */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                            ФИО представителя (Родителя)
                          </label>
                          <input
                            required
                            type="text"
                            value={editParentName}
                            onChange={(e) => setEditParentName(e.target.value)}
                            className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-semibold text-slate-900 border"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Телефон родителя
                            </label>
                            <input
                              required
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-mono font-semibold text-slate-900 border"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Email родителя
                            </label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-mono font-semibold text-slate-900 border"
                            />
                          </div>
                        </div>

                        {/* Management Details */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Группа
                            </label>
                            <select
                              value={editGroup}
                              onChange={(e) => setEditGroup(e.target.value)}
                              className="w-full p-2 bg-slate-50 border rounded-lg outline-none text-[11px] font-semibold text-slate-705 appearance-none cursor-pointer"
                              style={{
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 8px center",
                              }}
                            >
                              <option value="">-- Без группы --</option>
                              {availableGroups.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Статус
                            </label>
                            <select
                              value={editStatus}
                              onChange={(e: any) =>
                                setEditStatus(e.target.value)
                              }
                              className="w-full p-2 bg-slate-50 border rounded-lg outline-none text-[11px] font-semibold text-slate-705 appearance-none cursor-pointer"
                              style={{
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 8px center",
                              }}
                            >
                              <option value="active">Активный</option>
                              <option value="inactive">Отвал</option>
                              <option value="trial">Пробное</option>
                              <option value="paused">На паузе</option>
                              <option value="left">Завершил</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Абонемент
                            </label>
                            <select
                              value={editAbonement}
                              onChange={(e: any) =>
                                setEditAbonement(e.target.value)
                              }
                              className="w-full p-2 bg-slate-50 border rounded-lg outline-none text-[11px] font-semibold text-slate-705 appearance-none cursor-pointer"
                              style={{
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 8px center",
                              }}
                            >
                              <option value="none">Нет пакета</option>
                              <option value="basic">Базовый</option>
                              <option value="standard">Стандарт</option>
                              <option value="premium">Премиум</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Баланс занятий
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editAbonementSessions}
                              onChange={(e) =>
                                setEditAbonementSessions(
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full p-2 bg-slate-50 rounded-lg outline-none focus:bg-white text-[11px] font-semibold text-slate-900 border"
                            />
                          </div>
                        </div>

                        {/* Risk Management dropdowns in sidebar */}
                        <div className="grid grid-cols-2 gap-2 border-t pt-2 mt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Анализ риска
                            </label>
                            <select
                              value={editRelationshipRisk}
                              onChange={(e: any) =>
                                setEditRelationshipRisk(e.target.value)
                              }
                              className="w-full p-2 bg-slate-50 border rounded-lg outline-none text-[11px] font-semibold text-slate-705 appearance-none cursor-pointer"
                              style={{
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 8px center",
                              }}
                            >
                              <option value="none">
                                Идеально (Нет рисков)
                              </option>
                              <option value="low">
                                Низкий (Есть пропуски)
                              </option>
                              <option value="high">Высокий риски</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                              Тип риска
                            </label>
                            <select
                              value={editRiskType}
                              onChange={(e: any) =>
                                setEditRiskType(e.target.value)
                              }
                              className="w-full p-2 bg-slate-50 border rounded-lg outline-none text-[11px] font-semibold text-slate-705 appearance-none cursor-pointer"
                              style={{
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 8px center",
                              }}
                            >
                              <option value="none">Норма / Без жалоб</option>
                              <option value="conflict">Конфликт</option>
                              <option value="absences">Пропуски занятий</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-3 flex gap-2">
                          <button
                            type="submit"
                            className="flex-grow py-2.5 bg-black hover:bg-gray-800 text-white font-extrabold text-xs rounded-full transition shadow-md shadow-gray-200"
                          >
                            Сохранить изменения
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingRightCard(false)}
                            className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full transition"
                          >
                            Отмена
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start space-x-4 border-b border-gray-100 pb-5">
                          <div className="h-14 w-14 rounded-full bg-slate-100 font-bold text-slate-700 text-lg flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                            {selectedClient.avatarUrl ? (
                              <img
                                src={selectedClient.avatarUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              selectedClient.childName?.[0] || "?"
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-gray-900 text-base leading-none">
                              {selectedClient.childSurname}{" "}
                              {selectedClient.childName}
                            </h3>
                            <div className="text-xs text-gray-500 font-medium pb-1.5 flex flex-wrap gap-1 items-center">
                              <span>{selectedClient.childAge} лет</span>
                              <span>({formatBirthDate(selectedClient.childBirthDate, selectedClient.childBirthYear)})</span>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide capitalize ${
                                selectedClient.status === "active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : selectedClient.status === "left"
                                    ? "bg-red-50 text-red-600"
                                    : selectedClient.status === "inactive"
                                      ? "bg-gray-100 text-gray-500"
                                      : selectedClient.status === "trial"
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {selectedClient.status === "active"
                                ? "Активный"
                                : selectedClient.status === "left"
                                  ? "Завершил"
                                  : selectedClient.status === "inactive"
                                    ? "Отвал"
                                    : selectedClient.status === "trial"
                                      ? "Пробный период"
                                      : "На паузе"}
                            </span>
                          </div>
                        </div>

                        {/* Summary Info */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[11px]">
                          <div>
                            <div className="text-gray-400 font-medium mb-1">
                              Родитель
                            </div>
                            <div className="font-bold text-gray-900">
                              {selectedClient.parentName}
                            </div>
                            <div className="text-gray-500 font-medium mt-0.5">
                              {selectedClient.parentPhone}
                            </div>
                            <div className="flex items-center space-x-2 mt-1.5">
                              <button className="text-emerald-500 hover:text-emerald-600 transition-colors">
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button className="text-blue-500 hover:text-blue-600 transition-colors">
                                <span className="font-bold cursor-pointer text-xs">
                                  💬
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setViewingClientId(selectedClient.id);
                                  setCurrentRole("parent");
                                  setCurrentTab("parent_home");
                                }}
                                className="ml-2 px-2 py-0.5 bg-slate-100/50 hover:bg-slate-200 text-[10px] font-bold text-slate-500 rounded border border-slate-200 transition-colors"
                                title="Войти в кабинет от имени этого родителя"
                              >
                                В кабинет ↗
                              </button>
                            </div>
                          </div>
                          <div className="space-y-4 text-[11px]">
                            <div>
                              <div className="text-gray-400 font-medium mb-1">
                                Группа
                              </div>
                              <div className="font-bold text-gray-900">
                                {selectedClient.groupName || "Без группы"}
                              </div>
                              {selectedClient.coachName && (
                                <div className="text-gray-500 font-medium mt-0.5 text-[10px]">
                                  Тренер: {selectedClient.coachName}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Explicit Risk Display area below Summary Info */}
                        {selectedClient.relationshipRisk &&
                          selectedClient.relationshipRisk !== "none" && (
                            <div
                              className={`my-4 p-3 rounded-xl border flex flex-col space-y-1.5 shadow-sm text-[11px] ${selectedClient.relationshipRisk === "high" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}
                            >
                              <div className="flex justify-between items-center w-full pb-1 border-b border-white/40">
                                <span
                                  className={`font-bold flex items-center space-x-1.5 ${selectedClient.relationshipRisk === "high" ? "text-red-700" : "text-orange-700"}`}
                                >
                                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white font-extrabold text-[9px] shadow-sm">
                                    !
                                  </span>
                                  <span>Учёт риска оттока</span>
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedClient.relationshipRisk === "high" ? "bg-red-600 text-white animate-pulse" : "bg-orange-200 text-orange-900"}`}
                                >
                                  {selectedClient.relationshipRisk === "high"
                                    ? "Высокий риск"
                                    : "Низкий риск"}
                                </span>
                              </div>
                              {selectedClient.riskType &&
                                selectedClient.riskType !== "none" && (
                                  <div className="flex justify-between pt-1">
                                    <span className="text-gray-500 font-medium">
                                      Тип риска:
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      {selectedClient.riskType === "conflict"
                                        ? "Взаимоотношения/Конфликт"
                                        : "Пропуски занятий"}
                                    </span>
                                  </div>
                                )}
                              {selectedClient.riskComment && (
                                <div className="mt-1 pb-1 text-[11px] text-gray-700 leading-snug italic">
                                  "{selectedClient.riskComment}"
                                </div>
                              )}
                            </div>
                          )}

                        {/* Quick navigation indicators tabs */}
                        <div className="flex space-x-4 border-b border-gray-100 overflow-x-auto pb-[1px]">
                          {[
                            { id: "info", label: "Информация" },
                            { id: "abos", label: "Абонементы" },
                            { id: "visits", label: "Посещения" },
                            { id: "payments", label: "Платежи" },
                            { id: "history", label: "История" },
                          ].map((tb) => (
                            <button
                              key={tb.id}
                              type="button"
                              onClick={() => setClientDetailTab(tb.id as any)}
                              className={`pb-3 font-semibold text-[11px] whitespace-nowrap border-b-2 transition-colors ${
                                clientDetailTab === tb.id
                                  ? "border-gray-900 text-gray-900"
                                  : "border-transparent text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              {tb.label}
                            </button>
                          ))}
                        </div>

                        {/* Detail views */}
                        <div className="text-[11px] text-gray-700 min-h-[140px] pt-1">
                          {(clientDetailTab === "info" ||
                            clientDetailTab === "history") && (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium w-1/2 flex items-center">
                                  <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />{" "}
                                  Дата зачисления
                                </span>
                                <span className="font-bold text-gray-900 flex-1 ml-4 text-right">
                                  По умолчанию
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium w-1/2 flex items-center">
                                  <span className="w-3.5 mr-2 flex justify-center text-gray-400 font-bold">
                                    C
                                  </span>{" "}
                                  Статус
                                </span>
                                <span className="font-bold text-emerald-600 flex-1 ml-4 text-right">
                                  {selectedClient.status === "active"
                                    ? "Активный"
                                    : selectedClient.status === "paused"
                                      ? "На паузе"
                                      : "Уточнить"}
                                </span>
                              </div>
                              <div className="flex justify-between items-start pt-1">
                                <span className="text-gray-500 font-medium w-1/2 flex items-center mt-0.5">
                                  <BookOpen className="w-3.5 h-3.5 mr-2 text-gray-400" />{" "}
                                  Абонемент
                                </span>
                                <div className="flex-1 ml-4 text-right">
                                  <span className="font-bold text-gray-900 block">
                                    {selectedClient.abonement === "none"
                                      ? "Нет пакета"
                                      : selectedClient.abonement === "basic"
                                        ? "Базовый"
                                        : "Стандарт"}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-medium">
                                    {selectedClient.abonementExpirationDate
                                      ? `до ${new Date(selectedClient.abonementExpirationDate).toLocaleDateString("ru-RU")}`
                                      : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-500 font-medium w-1/2 flex items-center">
                                  <span className="w-3.5 mr-2 flex justify-center text-gray-400 font-bold">
                                    $
                                  </span>{" "}
                                  Оплата
                                </span>
                                <div className="flex flex-1 justify-end items-center ml-4">
                                  <span className="font-bold text-emerald-500">
                                    {selectedClient.abonementStatus ||
                                      "Не оплачено"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium w-1/2 flex items-center">
                                  <span className="w-3.5 mr-2 flex justify-center text-gray-400 font-bold">
                                    ⏸️
                                  </span>{" "}
                                  Заморозки
                                </span>
                                <span className="font-bold text-gray-900 flex-1 ml-4 text-right">
                                  {selectedClient.status === "paused"
                                    ? "Да"
                                    : "Нет"}
                                </span>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex items-start mt-4">
                                <span className="text-gray-500 font-medium w-1/3 flex items-center mt-0.5">
                                  <FileText className="w-3.5 h-3.5 mr-2 text-gray-400" />{" "}
                                  Примечание
                                </span>
                                <div className="flex-1 text-right text-gray-900 font-medium">
                                  {selectedClient.notes || (
                                    <span className="text-gray-400 italic">
                                      Нет примечаний.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {clientDetailTab === "abos" && (
                            <div className="space-y-4">
                              <div className="bg-white p-3 rounded-xl border">
                                <div className="mb-2">
                                  <strong>Абонемент:</strong>{" "}
                                  {selectedClient.abonement === "none"
                                    ? "Нет"
                                    : selectedClient.abonement}
                                </div>
                                <div className="flex justify-between items-end mb-1 text-xs">
                                  <span>
                                    <strong>Баланс:</strong>{" "}
                                    {selectedClient.abonementSessionsLeft} из{" "}
                                    {(() => {
                                      const baseTotal =
                                        selectedClient.abonement ===
                                        "12_sessions"
                                          ? 12
                                          : selectedClient.abonement ===
                                              "8_sessions"
                                            ? 8
                                            : selectedClient.abonement ===
                                                "4_sessions"
                                              ? 4
                                              : selectedClient.abonement ===
                                                  "1_session"
                                                ? 1
                                                : 0;
                                      return Math.max(
                                        baseTotal,
                                        selectedClient.abonementSessionsLeft ||
                                          0,
                                      );
                                    })()}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    Использовано:{" "}
                                    {(() => {
                                      const baseTotal =
                                        selectedClient.abonement ===
                                        "12_sessions"
                                          ? 12
                                          : selectedClient.abonement ===
                                              "8_sessions"
                                            ? 8
                                            : selectedClient.abonement ===
                                                "4_sessions"
                                              ? 4
                                              : selectedClient.abonement ===
                                                  "1_session"
                                                ? 1
                                                : 0;
                                      const maxTotal = Math.max(
                                        baseTotal,
                                        selectedClient.abonementSessionsLeft ||
                                          0,
                                      );
                                      return (
                                        maxTotal -
                                        (selectedClient.abonementSessionsLeft ||
                                          0)
                                      );
                                    })()}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                    style={{
                                      width: `${(() => {
                                        const baseTotal =
                                          selectedClient.abonement ===
                                          "12_sessions"
                                            ? 12
                                            : selectedClient.abonement ===
                                                "8_sessions"
                                              ? 8
                                              : selectedClient.abonement ===
                                                  "4_sessions"
                                                ? 4
                                                : selectedClient.abonement ===
                                                    "1_session"
                                                  ? 1
                                                  : 0;
                                        const maxTotal =
                                          baseTotal > 0
                                            ? Math.max(
                                                baseTotal,
                                                selectedClient.abonementSessionsLeft ||
                                                  0,
                                              )
                                            : 1;
                                        const used =
                                          maxTotal -
                                          (selectedClient.abonementSessionsLeft ||
                                            0);
                                        return Math.min(
                                          100,
                                          Math.max(0, (used / maxTotal) * 100),
                                        );
                                      })()}%`,
                                    }}
                                  ></div>
                                </div>
                                <div>
                                  <strong>Срок действия:</strong>{" "}
                                  {selectedClient.abonementExpirationDate ||
                                    "—"}
                                </div>
                              </div>

                              {selectedClient.status === "trial" && (
                                <div className="p-3.5 bg-orange-50 text-orange-850 rounded-xl space-y-2 mt-2 border border-orange-150">
                                  <h5 className="font-bold">
                                    Выставить счет на оплату
                                  </h5>
                                  <p className="text-[10px] leading-relaxed">
                                    Отправьте платежную форму ЮKassa родителю в
                                    Личный кабинет:
                                  </p>
                                  <div className="grid grid-cols-2 gap-1 px-1">
                                    <button
                                      onClick={() =>
                                        handleSendBilling(
                                          selectedClient,
                                          "Абонемент 12 зан.",
                                          crmConfig.price12,
                                        )
                                      }
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-1 rounded font-mono text-[9px] transition"
                                    >
                                      12 зан. — {crmConfig.price12}Р
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSendBilling(
                                          selectedClient,
                                          "Абонемент 8 зан.",
                                          crmConfig.price8,
                                        )
                                      }
                                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold p-1 rounded font-mono text-[9px] transition"
                                    >
                                      8 зан. — {crmConfig.price8}Р
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Manual subscription reset for Administrator, Director and Manager */}
                              {(currentRole === "admin" ||
                                currentRole === "director" ||
                                currentRole === "manager") &&
                                selectedClient.abonement !== "none" && (
                                  <button
                                    onClick={handleClearSubscription}
                                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-100 transition flex justify-center items-center mt-2 group"
                                  >
                                    <span className="group-hover:hidden">
                                      Обнулить абонемент
                                    </span>
                                    <span className="hidden group-hover:inline">
                                      Подтвердить обнуление (x)
                                    </span>
                                  </button>
                                )}
                            </div>
                          )}

                          {clientDetailTab === "visits" && (
                            <div className="space-y-1">
                              <strong>Последняя активность:</strong>
                              {!selectedClient.attendance || selectedClient.attendance.length === 0 ? (
                                <p className="text-gray-400 italic">
                                  Нет зарегистрированных посещений.
                                </p>
                              ) : (
                                selectedClient.attendance.map((t, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center bg-slate-50 p-1.5 rounded text-[11px]"
                                  >
                                    <span className="font-mono font-bold">
                                      {t.date}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        t.status === "present"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-orange-100 text-orange-800"
                                      }`}
                                    >
                                      {t.status === "present"
                                        ? "Был"
                                        : "Пропуск"}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {clientDetailTab === "payments" && (
                            <div className="space-y-4">
                              <div>
                                <strong className="text-xs text-slate-700 block mb-2">
                                  Детали платежных поручений:
                                </strong>
                                {selectedClient.payments &&
                                selectedClient.payments.length > 0 ? (
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {selectedClient.payments.map((p, i) => (
                                      <div
                                        key={p.id || i}
                                        className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] hover:bg-slate-100 transition"
                                      >
                                        <div className="flex flex-col flex-1">
                                          <span className="font-semibold text-slate-800">
                                            {p.item}
                                          </span>
                                          <span className="text-[9px] text-slate-400">
                                            {p.date}
                                          </span>
                                        </div>
                                        <div className="text-right flex items-center space-x-3">
                                          <div>
                                            <span className="font-mono font-bold text-emerald-600 block">
                                              +{p.amount} ₽
                                            </span>
                                            <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                                              {p.status || "Оплачено"}
                                            </span>
                                          </div>
                                          {(currentRole === "admin" ||
                                            currentRole === "director" ||
                                            currentRole === "manager") &&
                                            p.id && (
                                              <button
                                                onClick={() =>
                                                  handleDeletePayment(p.id!)
                                                }
                                                className="p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600 rounded transition"
                                                title="Удалить платёж"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-xs italic">
                                    Транзакций не обнаружено.
                                  </p>
                                )}
                              </div>

                              {/* Manual payment addition for Administrator, Director and Manager */}
                              {(currentRole === "admin" ||
                                currentRole === "director" ||
                                currentRole === "manager") && (
                                <div className="border-t pt-3 mt-2 space-y-3">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-lg">✍️</span>
                                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                                      Внести платёж вручную{" "}
                                      <span className="text-[10px] text-red-600 lowercase font-medium">
                                        ({currentRole})
                                      </span>
                                    </h4>
                                  </div>

                                  <form
                                    onSubmit={handleSaveManualPayment}
                                    className="space-y-3 p-3 bg-slate-50 border border-slate-150 rounded-xl"
                                  >
                                    {manualPaymentSuccess && (
                                      <div className="p-2 text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg font-medium">
                                        ✅ {manualPaymentSuccess}
                                      </div>
                                    )}
                                    {manualPaymentError && (
                                      <div className="p-2 text-[10px] bg-red-50 border border-red-100 text-red-800 rounded-lg font-medium">
                                        ❌ {manualPaymentError}
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                      {/* Subscription option */}
                                      <div className="col-span-2">
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                          Тип абонемента / Тренировки
                                        </label>
                                        <select
                                          value={manualPaymentType}
                                          onChange={(e) =>
                                            setManualPaymentType(
                                              e.target.value as any,
                                            )
                                          }
                                          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500 transition font-medium"
                                        >
                                          <option value="12_sessions">
                                            Абонемент на 12 занятий
                                          </option>
                                          <option value="8_sessions">
                                            Абонемент на 8 занятий
                                          </option>
                                          <option value="4_sessions">
                                            Абонемент на 4 занятия
                                          </option>
                                          <option value="1_session">
                                            Разовое занятие / Тренировка
                                          </option>
                                        </select>
                                      </div>

                                      {/* Date of Payment */}
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                          Дата платежа
                                        </label>
                                        <input
                                          type="date"
                                          value={manualPaymentDate}
                                          onChange={(e) =>
                                            setManualPaymentDate(e.target.value)
                                          }
                                          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500 transition font-mono"
                                          required
                                        />
                                      </div>

                                      {/* Subscription Expiration */}
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                          Срок действия до
                                        </label>
                                        <input
                                          type="date"
                                          value={manualPaymentExpires}
                                          onChange={(e) =>
                                            setManualPaymentExpires(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500 transition font-mono"
                                        />
                                      </div>

                                      {/* Amount */}
                                      <div className="col-span-2">
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                          Сумма к оплате (₽)
                                        </label>
                                        <input
                                          type="number"
                                          value={manualPaymentAmount}
                                          onChange={(e) =>
                                            setManualPaymentAmount(
                                              Number(e.target.value),
                                            )
                                          }
                                          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500 transition font-mono font-bold"
                                          placeholder="Напр. 4500"
                                          min="0"
                                          required
                                        />
                                      </div>
                                      {/* Account selector */}
                                      <div className="col-span-2">
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                                          Счет зачисления
                                        </label>
                                        <select
                                          value={manualPaymentAccountId}
                                          onChange={(e) =>
                                            setManualPaymentAccountId(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500 transition font-bold text-slate-700"
                                          required
                                        >
                                          <option value="" disabled>
                                            -- Выберите счет --
                                          </option>
                                          {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                              {acc.name} (текущий баланс:{" "}
                                              {acc.balance.toLocaleString(
                                                "ru-RU",
                                              )}{" "}
                                              ₽)
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <button
                                      type="submit"
                                      disabled={manualPaymentLoading}
                                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1"
                                    >
                                      {manualPaymentLoading ? (
                                        <span>Сохранение...</span>
                                      ) : (
                                        <span>Внести оплату вручную</span>
                                      )}
                                    </button>
                                  </form>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Text Area Note matches Image 4 exact right */}
                        <div className="space-y-2 border-t pt-3">
                          <label className="block text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                            Рабочая заметка менеджера:
                          </label>
                          <textarea
                            value={
                              clientNotes[selectedClient.id] !== undefined
                                ? clientNotes[selectedClient.id]
                                : selectedClient.notes || ""
                            }
                            onChange={(e) =>
                              setClientNotes((prev) => ({
                                ...prev,
                                [selectedClient.id]: e.target.value,
                              }))
                            }
                            className="w-full font-mono p-2.5 bg-slate-100 focus:bg-white text-[11px] border focus:border-emerald-500 rounded-xl outline-none min-h-[70px] resize-none text-slate-700 leading-normal"
                            placeholder="Например, левша, любит играть в защите..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleSaveNotes(
                                  selectedClient.id,
                                  clientNotes[selectedClient.id] !== undefined
                                    ? clientNotes[selectedClient.id]
                                    : selectedClient.notes || "",
                                )
                              }
                              className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1 transition"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Сохранить</span>
                            </button>
                            {selectedClient.notes ||
                            (clientNotes[selectedClient.id] &&
                              clientNotes[selectedClient.id].trim() !== "") ? (
                              <button
                                onClick={() => {
                                  setClientNotes((prev) => ({
                                    ...prev,
                                    [selectedClient.id]: "",
                                  }));
                                  handleSaveNotes(selectedClient.id, "");
                                }}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold text-xs rounded-lg flex items-center justify-center transition border border-red-200"
                                title="Удалить примечание"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* Help actions */}
                        <div className="flex gap-2 pt-1 border-t">
                          <button
                            onClick={() => {
                              const tgPhone =
                                selectedClient.parentPhone.replace(/\D/g, "");
                              const url = `https://t.me/+${tgPhone}`;
                              window.open(url, "_blank");
                            }}
                            className="flex-1 py-1.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-center rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 transition"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="w-4 h-4 fill-white flex-shrink-0"
                            >
                              <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.304-.346-.11l-6.4 4.024-2.76-.86c-.6-.185-.61-.595.125-.89l10.82-4.172c.504-.197.942.115.807.94z" />
                            </svg>
                            <span>Telegram</span>
                          </button>
                          <button
                            onClick={() => {
                              handleOpenMaxChat(selectedClient.parentPhone);
                            }}
                            className="flex-1 py-1.5 bg-gradient-to-r from-[#2BC1FF] via-[#7551FF] to-[#9D38FF] hover:from-[#21A8E3] hover:via-[#613CDC] hover:to-[#8B23E9] text-white text-center rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1.5 transition shadow-sm overflow-hidden relative group"
                          >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <svg
                              viewBox="0 0 24 24"
                              className="w-4 h-4 text-white flex-shrink-0 fill-current drop-shadow-sm relative z-10"
                            >
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.905.534 3.684 1.464 5.203.208.337.262.748.118 1.112l-1.246 3.165a.6.6 0 00.776.776l3.164-1.246a1.18 1.18 0 011.112.118C8.91 21.936 10.418 22.5 12 22.5c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 15.5c-3.037 0-5.5-2.463-5.5-5.5S8.963 6.5 12 6.5s5.5 2.463 5.5 5.5-2.463 5.5-5.5 5.5z" />
                              <circle
                                cx="12"
                                cy="12"
                                r="6"
                                fill="currentColor"
                                fillOpacity="0.2"
                              />
                            </svg>
                            <span className="relative z-10 tracking-wide">
                              Чат MAX
                            </span>
                          </button>
                        </div>

                        <div className="pt-2 border-t mt-1">
                          <button
                            onClick={() => {
                              setDeleteClientModal({
                                isOpen: true,
                                clientId: selectedClient.id,
                                clientName: `${selectedClient.childSurname} ${selectedClient.childName}`,
                              });
                            }}
                            className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[11px] rounded transition flex items-center justify-center space-x-1 border border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Удалить профиль ученика</span>
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      Выберите клиента для отображения подробного досье.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MANAGER ANALYTICS & BONUSES VIEW */}
        {activeTab === "hq_analytics" && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-white flex flex-wrap gap-6 items-center justify-between">
              <div className="text-left space-y-1">
                <div className="text-2xl font-black text-emerald-500">
                  {clients.reduce(
                    (acc, c) => acc + (c.managerBonusAccrued || 0),
                    0,
                  )}{" "}
                  ₽
                </div>
                <div className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                  Общая премия менеджера
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-800"></div>
              <div className="text-left space-y-1">
                <div className="text-xl font-black text-slate-200">
                  {
                    clients.filter(
                      (c) => c.status === "active" || c.status === "trial",
                    ).length
                  }
                </div>
                <div className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                  Активных клиентов в работе
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-105 shadow-sm space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm text-left">
                  Учет рисков взаимоотношений и лояльности клиентов
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded">
                  Контроль оттока
                </span>
              </div>
              <div className="overflow-x-auto text-left">
                <table className="w-full text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-gray-400 font-semibold uppercase tracking-wider border-b">
                      <th className="p-3">Клиент / Группа</th>
                      <th className="p-3">Текущий Анализ Риска</th>
                      <th className="p-3">Срочность решения</th>
                      <th className="p-3">Ход решения / Результат</th>
                      <th className="p-3">Начисленная Премия Менеджера</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clients.map((client, idx) => {
                      const hasActiveRisk =
                        client.riskType && client.riskType !== "none";

                      let riskTypeBadge = (
                        <span className="text-gray-400">Нет рисков</span>
                      );
                      if (client.riskType === "conflict") {
                        riskTypeBadge = (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-150 text-rose-800 rounded font-bold text-[10px]">
                              Конфликт
                            </span>
                            {client.riskDetails && (
                              <div className="text-[11px] font-medium text-slate-600">
                                С кем: {client.riskDetails}
                              </div>
                            )}
                          </div>
                        );
                      } else if (client.riskType === "absences") {
                        riskTypeBadge = (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-bold text-[10px]">
                              Пропуски (&gt;2)
                            </span>
                          </div>
                        );
                      }

                      let urgencyBadge = (
                        <span className="text-gray-450 text-[11px]">
                          Низкая
                        </span>
                      );
                      if (client.riskUrgency === "urgent") {
                        urgencyBadge = (
                          <span className="px-2 py-0.5 bg-red-500 text-white rounded font-bold text-[9px] uppercase tracking-wide animate-pulse">
                            СРОЧНО!
                          </span>
                        );
                      } else if (client.riskUrgency === "intervene") {
                        urgencyBadge = (
                          <span className="px-2 py-0.5 bg-orange-100 border border-orange-200 text-orange-800 rounded font-bold text-[9px] uppercase tracking-wide">
                            Вмешаться
                          </span>
                        );
                      }

                      let resolutionBadge = (
                        <span className="text-slate-400">-</span>
                      );
                      if (
                        client.riskResolution &&
                        client.riskResolution !== "none"
                      ) {
                        const labelsMap: any = {
                          left: "Уходит отток",
                          thinking: "Думает / сомнения",
                          renewed: "Абонемент продлен",
                          refused: "Отказ от занятий",
                          resolved: "Решено штатно",
                          reconciled: "Конфликт исчерпан",
                        };
                        const classMap: any = {
                          left: "bg-red-50 text-red-750 border-red-200",
                          thinking:
                            "bg-amber-50 text-amber-700 border-amber-200",
                          renewed:
                            "bg-emerald-50 text-emerald-700 border-emerald-150",
                          refused: "bg-rose-50 text-rose-700 border-rose-200",
                          resolved:
                            "bg-indigo-50 text-indigo-700 border-indigo-200",
                          reconciled:
                            "bg-teal-50 text-teal-700 border-teal-200",
                        };
                        resolutionBadge = (
                          <span
                            className={`px-2 py-0.5 border rounded font-bold text-[10px] ${classMap[client.riskResolution] || "bg-slate-100"}`}
                          >
                            {labelsMap[client.riskResolution] ||
                              client.riskResolution}
                          </span>
                        );
                      } else if (hasActiveRisk) {
                        resolutionBadge = (
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded font-bold text-[10px]">
                            В работе
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={idx}
                          onClick={() => handleStartEditClient(client)}
                          className="hover:bg-slate-50/50 transition duration-150 cursor-pointer"
                        >
                          <td className="p-3">
                            <div className="font-bold text-slate-800">
                              {client.childSurname} {client.childName}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {client.groupName || "Без группы"} •{" "}
                              {client.parentName}
                            </div>
                          </td>
                          <td className="p-3">
                            {riskTypeBadge}
                            {client.riskComment && (
                              <div className="mt-1 text-[10px] text-slate-500 italic max-w-[220px] bg-slate-50 p-1.5 rounded border border-slate-100 leading-normal">
                                {client.riskComment}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-semibold">{urgencyBadge}</td>
                          <td className="p-3">{resolutionBadge}</td>
                          <td className="p-3 font-semibold text-emerald-600">
                            {client.managerBonusAccrued
                              ? `+${client.managerBonusAccrued} ₽`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Trial Modal */}
      {bookingTrialLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-full flex flex-col overflow-hidden border shadow-xl">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center text-left shrink-0">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  Запись на пробную тренировку
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Ученик: {bookingTrialLead.childName}{" "}
                  {bookingTrialLead.childSurname}
                </p>
              </div>
              <button
                onClick={() => setBookingTrialLead(null)}
                className="text-white hover:text-slate-300 font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto w-full text-left bg-slate-50 flex-1">
              <form onSubmit={handleBookTrialSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Группа / Площадка
                  </label>
                  <select
                    value={trialGroupId}
                    onChange={(e) => setTrialGroupId(e.target.value)}
                    required
                    className="w-full border-gray-200 rounded-xl px-4 py-3 bg-white text-sm focus:border-emerald-500 focus:ring-emerald-500 font-medium"
                  >
                    <option value="" disabled>
                      Выберите группу...
                    </option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.venue || "Без площадки"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Тренер
                  </label>
                  <select
                    value={trialCoachId}
                    onChange={(e) => setTrialCoachId(e.target.value)}
                    required
                    className="w-full border-gray-200 rounded-xl px-4 py-3 bg-white text-sm focus:border-emerald-500 focus:ring-emerald-500 font-medium"
                  >
                    <option value="" disabled>
                      Выберите тренера...
                    </option>
                    {coaches
                      .filter((c) => c.status === "Активен" || c.status === "На испытательном сроке")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Дата тренировки
                    </label>
                    <input
                      type="date"
                      value={trialDate}
                      onChange={(e) => setTrialDate(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Время тренировки
                    </label>
                    <input
                      type="time"
                      value={trialTime}
                      onChange={(e) => setTrialTime(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t mt-4 flex justify-end space-x-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBookingTrialLead(null)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-xl text-xs transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
                  >
                    Подтвердить запись
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead modal drawer dialog */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-full flex flex-col overflow-hidden border shadow-xl">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center text-left shrink-0">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  Создание новой входящей заявки
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Ручной ввод лида при входящем звонке / визите.
                </p>
              </div>
              <button
                onClick={() => setIsAddLeadOpen(false)}
                className="text-white hover:text-slate-300 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleAddNewLead}
              className="p-5 sm:p-6 space-y-4 text-left font-sans text-xs overflow-y-auto"
            >
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                  ФИО Законного представителя (Родителя)
                </label>
                <input
                  required
                  type="text"
                  placeholder="Например, Иванова Мария"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Имя ребёнка
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Максим"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Фамилия ребёнка
                  </label>
                  <input
                    type="text"
                    placeholder="Иванов"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    value={newChildSurname}
                    onChange={(e) => setNewChildSurname(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Дата рождения ребёнка
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
                    value={newChildBirthDate}
                    onChange={(e) => {
                      setNewChildBirthDate(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                  Телефон для связи
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-black font-mono font-bold">
                    +7
                  </span>
                  <input
                    required
                    type="tel"
                    placeholder="(999) 000-00-00"
                    className="w-full pl-9 p-2.5 bg-slate-50 font-mono border rounded-xl"
                    value={newPhone.replace(/^\+7\s?/, "")}
                    onChange={(e) =>
                      formatPhoneAndSet(e.target.value, setNewPhone)
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                  Рекламный источник
                </label>
                <select
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  value={newSource}
                  onChange={(e: any) => setNewSource(e.target.value)}
                >
                  <option value="MAX">Рекламная кампания MAX</option>
                  <option value="telegram">Канал Telegram</option>
                  <option value="vk">Ретаргетинг ВКонтакте</option>
                  <option value="листовка">Листовки у школ/садов</option>
                  <option value="рекомендация">Рекомендация родителей</option>
                </select>
              </div>

              {addLeadError && (
                <div className="bg-red-50 border-s-4 border-red-500 text-red-700 px-3 py-2 text-xs font-semibold shadow-sm rounded-r-lg">
                  {addLeadError}
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Зарегистрировать лид
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Direct Client modal drawer dialog */}
      {isAddDirectClientOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-full flex flex-col overflow-hidden border shadow-xl">
            <div className="p-5 bg-black text-white flex justify-between items-center text-left shrink-0">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  Добавление нового ученика (Прямой ввод)
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Полное заполнение профиля без этапа пробной тренировки.
                </p>
              </div>
              <button
                onClick={() => setIsAddDirectClientOpen(false)}
                className="text-white hover:text-slate-300 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleAddNewDirectClient}
              className="p-5 sm:p-6 space-y-4 text-left font-sans text-xs overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Имя ребёнка *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Максим"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    value={newDirectChildName}
                    onChange={(e) => setNewDirectChildName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Фамилия ребёнка *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Иванов"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    value={newDirectChildSurname}
                    onChange={(e) => setNewDirectChildSurname(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                  Дата рождения ребёнка *
                </label>
                <input
                  required
                  type="date"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
                  value={newDirectChildBirthDate}
                  onChange={(e) => setNewDirectChildBirthDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                  ФИО Родителя *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Иванова Мария"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  value={newDirectParentName}
                  onChange={(e) => setNewDirectParentName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Телефон *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-black font-mono font-bold">
                      +7
                    </span>
                    <input
                      required
                      type="tel"
                      placeholder="(999) 000-00-00"
                      className="w-full pl-9 p-2.5 bg-slate-50 font-mono border rounded-xl"
                      value={newDirectPhone.replace(/^\+7\s?/, "")}
                      onChange={(e) =>
                        formatPhoneAndSet(e.target.value, setNewDirectPhone)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="mail@example.com"
                    className="w-full p-2.5 bg-slate-50 font-mono border rounded-xl"
                    value={newDirectEmail}
                    onChange={(e) => setNewDirectEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Группа
                  </label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    value={newDirectGroup}
                    onChange={(e) => setNewDirectGroup(e.target.value)}
                  >
                    <option value="">-- Выберите группу --</option>
                    {availableGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Статус
                  </label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    value={newDirectStatus}
                    onChange={(e: any) => setNewDirectStatus(e.target.value)}
                  >
                    <option value="active">Активен</option>
                    <option value="inactive">Неактивен</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                  Абонемент
                </label>
                <select
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  value={newDirectAbonement}
                  onChange={(e: any) => setNewDirectAbonement(e.target.value)}
                >
                  <option value="none">Без абонемента</option>
                  <option value="12_sessions">12 занятий</option>
                  <option value="8_sessions">8 занятий</option>
                  <option value="4_sessions">4 занятия</option>
                  <option value="1_session">Разовое</option>
                </select>
              </div>

              {addClientError && (
                <div className="bg-red-50 border-s-4 border-red-500 text-red-700 px-3 py-2 text-xs font-semibold shadow-sm rounded-r-lg">
                  {addClientError}
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition"
                >
                  Добавить ученика
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddDirectClientOpen(false)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client modal dialog */}
      {isEditClientOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col max-h-full overflow-hidden border shadow-xl">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center text-left shrink-0">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  Редактирование профиля ученика
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Полное обновление регистрационных данных и аватара футболиста.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditClientOpen(false)}
                className="text-white hover:text-slate-300 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveClientEdit}
              className="p-5 sm:p-6 space-y-4 text-left font-sans text-xs overflow-y-auto"
            >
              {/* Avatar Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5">
                <label className="block text-gray-500 font-bold uppercase tracking-wider">
                  Фото / Аватар футболиста
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative group h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 text-2xl font-extrabold overflow-hidden shrink-0 shadow-inner">
                    {editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt="Аватар"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      editChildName?.[0] || "?"
                    )}
                    <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer font-bold transition text-[10px] border border-emerald-200">
                        <Upload className="w-3 h-3 mr-1" />
                        Загрузить файл
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                      </label>
                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl("")}
                          className="px-2 py-1.5 text-[10px] text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Форматы: PNG, JPG, GIF. До 5МБ.
                    </p>
                  </div>
                </div>

                {/* Preset circles */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 text-left">
                  <span className="block text-[10px] font-semibold text-slate-400">
                    Или выберите быстрый футбольный стикер:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((ps, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectPresetAvatar(ps)}
                        className={`h-8 w-8 rounded-full ${ps.bg} border flex items-center justify-center text-base hover:scale-105 active:scale-95 transition shadow-sm`}
                        title="Нажмите, чтобы применить"
                      >
                        {ps.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Child Info Block */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Имя воспитанника *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Имя"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={editChildName}
                    onChange={(e) => setEditChildName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Фамилия воспитанника *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Фамилия"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={editChildSurname}
                    onChange={(e) => setEditChildSurname(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Дата рождения *
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full p-2.5 bg-slate-50 font-mono border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={editChildBirthDate}
                    onChange={(e) => {
                      setEditChildBirthDate(e.target.value);
                    }}
                  />
                </div>
              </div>

              {/* Parents details */}
              <div className="space-y-1">
                <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                  ФИО Законного представителя (Родителя) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Иванова Мария Петровна"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={editParentName}
                  onChange={(e) => setEditParentName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Телефон родителя *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="+7 (999) 111-22-33"
                    className="w-full p-2.5 bg-slate-50 font-mono border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Email родителя
                  </label>
                  <input
                    type="email"
                    placeholder="parent@mail.ru"
                    className="w-full p-2.5 bg-slate-50 font-mono border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* School management status and fields */}
              <div className="border-t pt-3.5 grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Статус обучения
                  </label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white outline-none animate-none"
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                  >
                    <option value="active">Активный ученик</option>
                    <option value="inactive">Неактивный</option>
                    <option value="trial">Пробное посещение</option>
                    <option value="paused">Заморожен / пауза</option>
                    <option value="left">Ушел / Выпускник</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Учебная группа
                  </label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white outline-none text-slate-700 font-medium animate-none"
                    value={editGroup}
                    onChange={(e) => setEditGroup(e.target.value)}
                  >
                    <option value="">-- Без группы --</option>
                    {availableGroups.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Abonement details */}
              <div className="grid grid-cols-2 gap-3.5 pb-2">
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Пакет занятий (абонемент)
                  </label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white outline-none"
                    value={editAbonement}
                    onChange={(e: any) => setEditAbonement(e.target.value)}
                  >
                    <option value="none">Нет активного пакета</option>
                    <option value="12_sessions">Пакет на 12 тренировок</option>
                    <option value="8_sessions">Пакет на 8 тренировок</option>
                    <option value="4_sessions">Пакет на 4 тренировки</option>
                    <option value="1_session">Разовое пробное занятие</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-500 font-semibold uppercase tracking-wider">
                    Баланс занятий (остаток)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2.5 bg-slate-50 font-mono border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={editAbonementSessions}
                    onChange={(e) =>
                      setEditAbonementSessions(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              {/* Relationship Risk details */}
              <div className="border-t border-slate-200/50 pt-3.5 space-y-4 pb-2 text-left">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Учет рисков взаимоотношений и конфликтов
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                      Тип возникающего риска
                    </label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white outline-none text-slate-700 font-medium text-xs"
                      value={editRiskType}
                      onChange={(e: any) => setEditRiskType(e.target.value)}
                    >
                      <option value="none">Нет рисков / Норма</option>
                      <option value="conflict">
                        Конфликт (указывается с кем)
                      </option>
                      <option value="absences">
                        Пропуски (более 2-х занятий)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                      Срочность вмешательства
                    </label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white outline-none text-slate-700 font-medium text-xs"
                      value={editRiskUrgency}
                      onChange={(e: any) => setEditRiskUrgency(e.target.value)}
                    >
                      <option value="none">Решение в штатном режиме</option>
                      <option value="intervene">Вмешаться</option>
                      <option value="urgent">СРОЧНО</option>
                    </select>
                  </div>
                </div>

                {editRiskType === "conflict" && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                      С кем конкретно возник конфликт?
                    </label>
                    <input
                      type="text"
                      placeholder="Например: с тренером Василием, с родителем другого ученика"
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white text-xs text-slate-800 outline-none"
                      value={editRiskDetails}
                      onChange={(e) => setEditRiskDetails(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                      Результат решения
                    </label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white outline-none text-slate-700 font-medium text-xs"
                      value={editRiskResolution}
                      onChange={(e: any) =>
                        setEditRiskResolution(e.target.value)
                      }
                    >
                      <option value="none">В процессе решения</option>
                      <option value="left">Уходит</option>
                      <option value="thinking">Думает</option>
                      <option value="renewed">Продлил</option>
                      <option value="refused">Отказ</option>
                      <option value="resolved">Решено</option>
                      <option value="reconciled">Помирились</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                      Уровень риска для аналитики
                    </label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white outline-none text-slate-700 font-medium text-xs"
                      value={editRelationshipRisk}
                      onChange={(e: any) =>
                        setEditRelationshipRisk(e.target.value)
                      }
                    >
                      <option value="none">Нормальный (Рисков нет)</option>
                      <option value="low">Низкий уровень риска</option>
                      <option value="high">Высокий уровень риска</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                    Премия менеджера (руб)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Например: 500"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none text-xs font-bold text-emerald-600"
                    value={editManagerBonus}
                    onChange={(e) =>
                      setEditManagerBonus(parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-550 font-bold uppercase tracking-wider text-[9px]">
                    Активный комментарий к ситуации
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Запишите ход переговоров, действия по решению ситуации и текущие заметки..."
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed text-xs text-slate-800 placeholder:text-gray-400"
                    value={editRiskComment}
                    onChange={(e) => setEditRiskComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-200/50">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить изменения</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditClientOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-750 font-semibold rounded-xl text-xs transition border"
                >
                  Выйти без сохранения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-full overflow-hidden transform transition-all relative">
            <div className="bg-slate-50 p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center relative shrink-0">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg tracking-tight">
                    Настройки профиля
                  </h3>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">
                    Личные данные и контакты
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 absolute right-4 top-6 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 text-left font-sans text-xs overflow-y-auto flex-1">
              <div className="flex items-center space-x-5">
                <div className="relative group h-20 w-20 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 font-bold overflow-hidden shadow-sm">
                  {tempProfileAvatar ? (
                    <img
                      src={tempProfileAvatar}
                      alt="Аватар профиля"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "?"
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                    <Camera className="w-6 h-6" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressImage(file, (base64) =>
                            setTempProfileAvatar(base64),
                          );
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 pb-1">
                    Аватар
                  </h4>
                  <p className="text-gray-500 text-[10px]">
                    JPG, PNG до 2MB. 1:1.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    ФИО
                  </label>
                  <input
                    type="text"
                    value={tempProfileName}
                    onChange={(e) => setTempProfileName(e.target.value)}
                    className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-indigo-500 focus:bg-white transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Должность
                  </label>
                  <input
                    type="text"
                    value={tempProfileRole}
                    onChange={(e) => setTempProfileRole(e.target.value)}
                    className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-indigo-500 focus:bg-white transition-colors outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Телефон
                    </label>
                    <input
                      type="text"
                      value={tempProfilePhone}
                      onChange={(e) => setTempProfilePhone(e.target.value)}
                      className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-indigo-500 focus:bg-white transition-colors outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={tempProfileEmail}
                      onChange={(e) => setTempProfileEmail(e.target.value)}
                      className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:border-indigo-500 focus:bg-white transition-colors outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-slate-50 border-t border-gray-100 flex justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                title="Сохранить изменения"
                type="button"
                onClick={() => {
                  updateUserProfile({
                    name: tempProfileName,
                    role: tempProfileRole,
                    avatarUrl: tempProfileAvatar,
                    phone: tempProfilePhone,
                    email: tempProfileEmail,
                  });
                  setIsProfileModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-all flex items-center space-x-2 shadow-md shadow-gray-200"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-full overflow-hidden transform transition-all relative">
            <div className="bg-slate-50 p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center relative shrink-0">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg tracking-tight">
                    Права доступа
                  </h3>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">
                    Ограничения вашего профиля
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 absolute right-4 top-6 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-left font-sans text-xs">
              <p className="text-gray-500 mb-4 pb-2 border-b">
                Ваш уровень:{" "}
                <span className="font-bold text-gray-800">
                  {userProfile.role}
                </span>
              </p>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <div className="font-bold text-gray-800">
                      Редактирование клиентов
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Создание, изменение данных клиентов
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canEditClients}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        canEditClients: e.target.checked,
                      })
                    }
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-gray-300"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <div className="font-bold text-gray-800">
                      Удаление клиентов
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Безвозвратное удаление карточек
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canDeleteClients}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        canDeleteClients: e.target.checked,
                      })
                    }
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-gray-300"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <div className="font-bold text-gray-800">
                      Доступ к финансам
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Просмотр отчетов и планов
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canViewFinances}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        canViewFinances: e.target.checked,
                      })
                    }
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-gray-300"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <div className="font-bold text-gray-800">
                      Редактирование финансов
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Внесение расходов/доходов
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canEditFinances}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        canEditFinances: e.target.checked,
                      })
                    }
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-gray-300"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <div className="font-bold text-gray-800">
                      Управление группами
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Создание, закрытие тренировочных групп
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canManageGroups}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        canManageGroups: e.target.checked,
                      })
                    }
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-gray-300"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition cursor-pointer">
                  <div>
                    <div className="font-bold text-gray-800">
                      Управление тренерами
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Назначение ставок и прием/увольнение
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.canManageCoaches}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        canManageCoaches: e.target.checked,
                      })
                    }
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-gray-300"
                  />
                </label>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-slate-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-all shadow-md shadow-gray-200"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteLeadModal !== null && deleteLeadModal.isOpen}
        onClose={() => setDeleteLeadModal(null)}
        onConfirm={async () => {
          if (deleteLeadModal?.leadId) {
            await deleteLead(deleteLeadModal.leadId);
          }
        }}
        title="Удалить заявку?"
        message={`Вы уверены, что хотите окончательно удалить заявку от родителя ${deleteLeadModal?.leadName || ""}? Это действие нельзя отменить.`}
        confirmText="Удалить"
      />

      <ConfirmModal
        isOpen={deleteClientModal !== null && deleteClientModal.isOpen}
        onClose={() => setDeleteClientModal(null)}
        onConfirm={async () => {
          if (deleteClientModal?.clientId) {
            const targetId = deleteClientModal.clientId;
            const remaining = clients.filter((c) => c.id !== targetId);
            await deleteClient(targetId);
            if (remaining.length > 0) {
              setSelectedClientId(remaining[0].id);
            } else {
              setSelectedClientId("");
            }
          }
        }}
        title="Удалить ученика?"
        message={`⚠️ ВНИМАНИЕ: Вы действительно хотите окончательно УДАЛИТЬ ученика "${deleteClientModal?.clientName || ""}" из базы данных школы? Это действие необратимо и удалит всю связанную историю, абонементы и платежи.`}
        confirmText="Удалить ученика"
      />
    </div>
  );
};
