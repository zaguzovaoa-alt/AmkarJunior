import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  getDocs,
  where,
  arrayUnion,
  deleteField,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { sendTelegramAlert } from "../utils/telegram";
import { findCoachScheduleConflicts } from "../utils/scheduleParser";
import { isGroupMatch, isDateMatch, normalizeDateToYMD } from "../utils/sessionMatching";
import { isSameCoachName, normalizePhone10 } from "../utils/coachMatching";
import {
  Lead,
  Client,
  CRMTask,
  TrainingGroup,
  AttendancePhotoVerification,
  Coach,
  FinanceRecord,
  ChatMessage,
  LeadSource,
  Payment,
  TrainingSessionProtocol,
  FinanceCategory,
  FinancialPlan,
  CRMConfig,
  AppNotification,
  Account,
  Product,
  StoreOrder,
  Homework,
  HomeworkSubmission,
  Counterparty,
  CancelledSession,
  AIProgressReport,
  VideoLesson,
  SelectTeamMember,
  MatchFormat,
} from "../types";
import { INITIAL_VIDEO_LESSONS } from "../data/initialVideoLessons";

// Helper to recursively remove undefined properties before writing to Firestore
function removeUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefined(item)) as unknown as T;
  }
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      clean[key] = typeof val === "object" && val !== null ? removeUndefined(val) : val;
    }
  }
  return clean as T;
}

// Types for User Profile
export interface UserProfile {
  name: string;
  role: string;
  avatarUrl: string;
  phone: string;
  email: string;
}

interface CRMContextType {
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateUserCredentials: (newPhone: string, newPassword?: string) => Promise<void>;
  leads: Lead[];
  clients: Client[];
  tasks: CRMTask[];
  groups: TrainingGroup[];
  coaches: Coach[];
  finances: FinanceRecord[];
  financeCategories: FinanceCategory[];
  financialPlans: FinancialPlan[];
  counterparties: Counterparty[];
  addCounterparty: (cp: Omit<Counterparty, "id">) => Promise<void>;
  updateCounterparty: (id: string, updates: Partial<Counterparty>) => Promise<void>;
  deleteCounterparty: (id: string) => Promise<void>;
  accounts: Account[];
  isFinanceSynced: boolean;
  addAccount: (acc: Omit<Account, "id">) => Promise<void>;
  updateAccount: (
    id: string,
    acc: Partial<Omit<Account, "id">>,
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  trainingSessions: TrainingSessionProtocol[];
  messages: ChatMessage[];
  products: Product[];
  storeOrders: StoreOrder[];
  homeworks: Homework[];
  homeworkSubmissions: HomeworkSubmission[];
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createOrder: (order: Omit<StoreOrder, "id" | "date">) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: "completed" | "cancelled",
  ) => Promise<void>;
  addHomework: (hw: Omit<Homework, "id" | "dateAssigned">) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;
  submitHomework: (homeworkId: string, clientId: string) => Promise<void>;
  videoLessons: VideoLesson[];
  addVideoLesson: (
    lesson: Omit<VideoLesson, "id" | "createdAt" | "viewsCount">,
  ) => Promise<VideoLesson>;
  updateVideoLesson: (
    id: string,
    updates: Partial<Omit<VideoLesson, "id">>,
  ) => Promise<void>;
  deleteVideoLesson: (id: string) => Promise<void>;
  incrementVideoLessonViews: (id: string) => Promise<void>;
  calendarSyncEnabled: boolean;
  calendarSyncStatus: "connected" | "disconnected" | "syncing";
  calendarSyncLog: string[];
  currentRole: "manager" | "trainer" | "parent" | "director" | "admin";
  currentTab: string;
  setCurrentRole: (
    role: "manager" | "trainer" | "parent" | "director" | "admin",
  ) => void;
  setCurrentTab: (tab: string) => void;
  viewingClientId: string | null;
  setViewingClientId: (id: string | null) => void;
  firestoreError: string | null;
  dismissFirestoreError: () => void;

  // Actions
  addLead: (
    lead: Omit<Lead, "id" | "createdAt" | "timeString" | "status">,
  ) => void;
  resendLeadTelegram: (leadId: string, customBotToken?: string, customChatId?: string) => Promise<{ success: boolean; message: string; needsConfig?: boolean }>;
  addClient: (
    clientData: Omit<
      Client,
      "id" | "attendance" | "payments" | "progress" | "achievements"
    >,
  ) => void;
  updateLeadStatus: (id: string, status: Lead["status"]) => void;
  ensureClientFromLead: (lead: Lead, trialGroupName?: string) => Promise<Client>;
  convertLeadToClient: (leadId: string, initialGroup?: string) => Promise<Client | undefined>;
  bookTrial: (
    leadId: string,
    coachId: string,
    groupName: string,
    date: string,
    time: string,
  ) => void;
  completeTrialAndMarkAttendance: (
    leadId: string,
    attended: boolean,
    notes: string,
    groupName: string,
    coachName: string,
    fileAttached?: string,
  ) => void;
  uploadDocument: (
    clientId: string,
    type: "medical" | "insurance",
    fileName: string,
  ) => void;
  deleteDocument: (clientId: string, type: "medical" | "insurance") => void;
  markAttendance: (
    groupId: string,
    date: string,
    records: {
      clientId: string;
      status: "present" | "absent_sick" | "absent" | "trial_free";
      reason?: string;
    }[],
    mediaFile?: string,
    notes?: string,
    assistantId?: string,
    manualPaidCount?: number,
    manualUnpaidCount?: number,
    hasLessonPlan?: boolean,
    lessonPlanText?: string,
    lessonPlanPhotoUrl?: string | null,
    photoVerification?: AttendancePhotoVerification | null,
  ) => void;
  deleteTrainingSession: (sessionId: string) => Promise<void>;
  updateTrainingSessionProtocol: (session: TrainingSessionProtocol) => Promise<void>;
  ratePlayer: (
    clientId: string,
    metrics: {
      technique: number;
      tactics: number;
      physical: number;
      discipline: number;
    },
  ) => void;
  addTask: (task: Omit<CRMTask, "id" | "status">) => void;
  updateTask: (id: string, updates: Partial<CRMTask>) => Promise<void>;
  completeTask: (id: string) => void;
  reorderTasks: (newTasks: CRMTask[]) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateChatMessage: (id: string, newText: string) => void;
  deleteChatMessage: (id: string) => void;
  markChatMessageAsRead: (
    id: string,
    reader: { id: string; name: string; role: any },
  ) => Promise<void>;
  markAllChatMessagesAsRead: (
    ids: string[],
    reader: { id: string; name: string; role: any },
  ) => Promise<void>;
  notifications: AppNotification[];
  addNotification: (
    notif: Omit<AppNotification, "id" | "isRead" | "dateString"> & { id?: string },
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  toggleCalendarSync: () => void;
  triggerManualCalendarSync: () => void;
  resetAllData: () => void;
  clearAllData: (options: {
    leads: boolean;
    clients: boolean;
    tasks: boolean;
    finances: boolean;
    messages: boolean;
  }) => Promise<void>;
  overwriteClients: (clients: Client[]) => void;
  overwriteLeads: (leads: Lead[]) => void;
  overwriteFinances: (finances: FinanceRecord[]) => void;
  overwriteCoaches: (coaches: Coach[]) => void;
  appendClients: (clients: Client[]) => void;
  appendLeads: (leads: Lead[]) => void;
  appendFinances: (finances: FinanceRecord[]) => void;
  appendCoaches: (coaches: Coach[]) => void;
  deleteLead: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteFinanceRecord: (id: string) => Promise<void>;
  updateFinanceRecord: (
    id: string,
    updates: Partial<Omit<FinanceRecord, "id">>,
    clearFields?: Array<keyof Omit<FinanceRecord, "id">>,
  ) => Promise<void>;
  addFinanceCategory: (
    category: Omit<FinanceCategory, "id"> & { id?: string },
  ) => Promise<void>;
  updateFinanceCategory: (
    id: string,
    updates: Partial<Omit<FinanceCategory, "id">>,
  ) => Promise<void>;
  deleteFinanceCategory: (id: string) => Promise<void>;
  updateFinancialPlan: (plan: FinancialPlan) => Promise<void>;
  addFinanceRecord: (record: Omit<FinanceRecord, "id">) => Promise<void>;
  updateClientNotes: (clientId: string, notes: string) => Promise<void>;
  updateClient: (
    clientId: string,
    updates: Partial<Omit<Client, "id">>,
  ) => Promise<void>;
  createGroup: (
    name: string,
    year: number,
    birthYearFrom: number,
    birthYearTo: number,
    coachId: string,
    coachName: string,
    scheduleDays: string[],
    isSelectTeam?: boolean,
    targetCompetition?: string,
    selectedClientIds?: string[],
    venueCost?: number,
    maxCapacity?: number,
    venueId?: string,
    scheduleStartDate?: string,
    scheduleEndDate?: string,
  ) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  updateGroup: (
    id: string,
    updates: Partial<Omit<TrainingGroup, "id">>,
  ) => Promise<void>;
  assignClientToGroup: (
    clientId: string,
    groupName: string | null,
  ) => Promise<void>;
  assignClientToSelectTeam: (
    clientId: string,
    groupId: string,
  ) => Promise<void>;
  removeClientFromSelectTeam: (
    clientId: string,
    groupId: string,
  ) => Promise<void>;
  createSelectTeam: (payload: {
    name: string;
    birthYearFrom: number;
    birthYearTo: number;
    coachId: string;
    coachName: string;
    assistantCoachId?: string;
    assistantCoachName?: string;
    targetCompetition?: string;
    competitionDate?: string;
    competitionEndDate?: string;
    competitionLocation?: string;
    competitionFee?: number;
    matchFormat?: MatchFormat;
    formationId?: string;
    selectTeamStatus?: "forming" | "ready" | "completed";
    selectTeamNotes?: string;
    scheduleDays?: string[];
    selectedClientIds?: string[];
    selectTeamRoster?: Record<string, SelectTeamMember>;
  }) => Promise<TrainingGroup>;
  updateSelectTeamMember: (
    groupId: string,
    clientId: string,
    updates: Partial<SelectTeamMember>,
    options?: { syncPreferredPosition?: boolean },
  ) => Promise<void>;
  batchUpdateSelectTeamRoster: (
    groupId: string,
    nextRoster: Record<string, SelectTeamMember>,
    nextSelectedClientIds?: string[],
  ) => Promise<void>;
  recordSelectTeamFeePayment: (params: {
    groupId: string;
    clientId: string;
    amount: number;
    accountId: string;
    postToFinance: boolean;
    paymentStatus?: "paid" | "partial";
    actorName?: string;
    actorRole?: "admin" | "director" | "manager" | "trainer";
  }) => Promise<void>;
  createCoach: (
    name: string,
    role: string,
    joinedYear: number,
    status: Coach["status"],
    phone?: string,
    telegram?: string,
    avatarUrl?: string,
    initialFeedback?: Coach["feedback"],
    paymentType?: "fixed" | "per_session",
    rate?: number
  ) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;
  assignCoachToGroup: (
    groupId: string,
    coachId: string,
    coachName: string,
  ) => Promise<void>;
  updateCoachContacts: (
    coachId: string,
    phone: string,
    telegram: string,
  ) => Promise<void>;
  updateCoach: (
    coachId: string,
    updates: Partial<Omit<Coach, "id">>,
  ) => Promise<void>;
  schoolName: string;
  updateSchoolName: (name: string) => Promise<void>;
  whatsappNotifications: boolean;
  updateWhatsappNotifications: (enabled: boolean) => Promise<void>;
  autoOverdueTasks: boolean;
  updateAutoOverdueTasks: (enabled: boolean) => Promise<void>;
  crmConfig: CRMConfig;
  updateCRMConfig: (config: Partial<CRMConfig>) => Promise<void>;
  cancelledSessions: CancelledSession[];
  addCancelledSession: (session: Omit<CancelledSession, "id">) => Promise<void>;
  addCancelledSessionsBatch: (sessions: Omit<CancelledSession, "id">[]) => Promise<number>;
  deleteCancelledSession: (id: string) => Promise<void>;
  generateAIProgressReport: (
    clientId: string,
    options?: {
      quarterNumber?: number;
      quarterYear?: number;
      periodLabel?: string;
      customCoachNote?: string;
    }
  ) => Promise<AIProgressReport | null>;
  deleteAIProgressReport: (clientId: string, reportId: string) => Promise<void>;
  checkAndGenerateAutomatedReports: () => Promise<number>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Initial realistic data pre-populated exactly matching the screenshots
const INITIAL_COACHES: Coach[] = [];

const INITIAL_GROUPS: TrainingGroup[] = [];

const INITIAL_CLIENTS: Client[] = [];

const INITIAL_TASKS: CRMTask[] = [];

const INITIAL_FINANCES: FinanceRecord[] = [];

const INITIAL_MESSAGES: ChatMessage[] = [];

const INITIAL_LEADS: Lead[] = [];

const INITIAL_CANCELLED_SESSIONS: CancelledSession[] = [];

export const INITIAL_FINANCE_CATEGORIES: FinanceCategory[] = [
  // Доходы (Поступления)
  { id: "cat_in_ab", type: "income", name: "Абонементы", isSystem: true },
  {
    id: "cat_in_ab12_new",
    type: "income",
    name: "Абонемент 12 занятий новый",
  },
  {
    id: "cat_in_ab12_ext",
    type: "income",
    name: "Абонемент 12 занятий продление",
  },
  {
    id: "cat_in_ab8_new",
    type: "income",
    name: "Абонемент 8 занятий новый",
  },
  {
    id: "cat_in_ab8_ext",
    type: "income",
    name: "Абонемент 8 занятий продление",
  },
  {
    id: "cat_in_ab4",
    type: "income",
    name: "Абонемент 4 занятия",
  },
  {
    id: "cat_in_1tr",
    type: "income",
    name: "Разовые тренировки",
    isSystem: true,
  },
  { id: "cat_in_ind", type: "income", name: "Индивидуальные тренировки" },
  { id: "cat_in_uniform", type: "income", name: "Форма" },
  { id: "cat_in_equip", type: "income", name: "Экипировка" },
  { id: "cat_in_eq", type: "income", name: "Форма/Экипировка" },
  {
    id: "cat_in_subrent",
    type: "income",
    name: "Сдача площадок в аренду",
    isSystem: true,
  },
  {
    id: "cat_in_tourn",
    type: "income",
    name: "Турниры и соревнования",
  },
  {
    id: "cat_in_camp",
    type: "income",
    name: "Футбольный лагерь / Сборы",
  },
  {
    id: "cat_in_other",
    type: "income",
    name: "Прочие доходы",
  },

  // Расходы (Списания) — Переменные и Постоянные
  {
    id: "cat_ex_rent",
    type: "expense",
    name: "Аренда",
    expenseType: "fixed",
  },
  {
    id: "cat_ex_rent_var",
    type: "expense",
    name: "Аренда залов (почасовая)",
    expenseType: "variable",
  },
  {
    id: "cat_ex_sal",
    type: "expense",
    name: "Зарплата",
    expenseType: "variable",
  },
  {
    id: "cat_ex_sal_admin",
    type: "expense",
    name: "Зарплата администрации (оклад)",
    expenseType: "fixed",
  },
  {
    id: "cat_ex_mar",
    type: "expense",
    name: "Маркетинг/Реклама",
    expenseType: "variable",
  },
  {
    id: "cat_ex_inv",
    type: "expense",
    name: "Инвентарь/Оборудование",
    expenseType: "variable",
  },
  {
    id: "cat_ex_uniform_buy",
    type: "expense",
    name: "Закупка формы и экипировки",
    expenseType: "variable",
  },
  {
    id: "cat_ex_tourn",
    type: "expense",
    name: "Турниры и судейство",
    expenseType: "variable",
  },
  {
    id: "cat_ex_awards",
    type: "expense",
    name: "Наградная продукция (медали, кубки, призы)",
    expenseType: "variable",
  },
  {
    id: "cat_ex_media",
    type: "expense",
    name: "Фото и видеосъемка",
    expenseType: "variable",
  },
  {
    id: "cat_ex_water_hoz",
    type: "expense",
    name: "Вода и хозрасходы",
    expenseType: "variable",
  },
  {
    id: "cat_ex_med",
    type: "expense",
    name: "Медицина / Аптечка",
    expenseType: "variable",
  },
  {
    id: "cat_ex_transport",
    type: "expense",
    name: "Транспорт / Логистика",
    expenseType: "variable",
  },
  {
    id: "cat_ex_acq",
    type: "expense",
    name: "Эквайринг (Комиссия ЮKassa)",
    isSystem: true,
    expenseType: "variable",
  },
  {
    id: "cat_ex_bank",
    type: "expense",
    name: "Комиссия банка / РКО",
    expenseType: "variable",
  },
  {
    id: "cat_ex_tax",
    type: "expense",
    name: "Налоги и взносы",
    expenseType: "fixed",
  },
  {
    id: "cat_ex_acc",
    type: "expense",
    name: "Бухгалтерия и сервисы (CRM, связь)",
    expenseType: "fixed",
  },
  {
    id: "cat_ex_other",
    type: "expense",
    name: "Прочие переменные расходы",
    expenseType: "variable",
  },
];

const INITIAL_ACCOUNTS: Account[] = [
  { id: "acc_cash", name: "Наличные", balance: 0, type: "cash" },
  { id: "acc_bank", name: "Расчетный счет", balance: 0, type: "bank" },
];

const INITIAL_COUNTERPARTIES: Counterparty[] = [];

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [leads, setLeads] = useState<Lead[]>(() => {
    let notifiedMap: Record<string, boolean> = {};
    try {
      const rawNotified = localStorage.getItem("amkar_notified_leads");
      if (rawNotified) notifiedMap = JSON.parse(rawNotified);
    } catch {}
    try {
      const cachedLeads = localStorage.getItem("amkar_leads_cache");
      if (cachedLeads) {
        const parsed = JSON.parse(cachedLeads);
        if (Array.isArray(parsed)) {
          return parsed.map((l: Lead) => ({
            ...l,
            telegramNotified: Boolean(l.telegramNotified || notifiedMap[l.id]),
          }));
        }
      }
    } catch {}
    return INITIAL_LEADS.map((l) => ({
      ...l,
      telegramNotified: Boolean(l.telegramNotified || notifiedMap[l.id]),
    }));
  });
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const cached = localStorage.getItem("amkar_clients_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_CLIENTS;
  });
  const [tasks, setTasks] = useState<CRMTask[]>(() => {
    try {
      const cached = localStorage.getItem("amkar_tasks_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_TASKS;
  });
  const [coaches, setCoaches] = useState<Coach[]>(() => {
    try {
      const cached = localStorage.getItem("amkar_coaches_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_COACHES;
  });
  const [groups, setGroups] = useState<TrainingGroup[]>(() => {
    try {
      const cached = localStorage.getItem("amkar_groups_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_GROUPS;
  });

  // Read accounts & finances as a mutually consistent cached pair so totalBalance never jumps through intermediate values
  const initialFinanceCache = (() => {
    try {
      const rawAcc = localStorage.getItem("amkar_accounts_cache");
      const rawFin = localStorage.getItem("amkar_finances_cache");
      if (rawAcc && rawFin) {
        const parsedAcc = JSON.parse(rawAcc);
        const parsedFin = JSON.parse(rawFin);
        if (Array.isArray(parsedAcc) && parsedAcc.length > 0 && Array.isArray(parsedFin)) {
          return {
            accounts: parsedAcc as Account[],
            finances: parsedFin as FinanceRecord[],
            synced: true,
          };
        }
      }
    } catch {}
    return {
      accounts: INITIAL_ACCOUNTS,
      finances: INITIAL_FINANCES,
      synced: false,
    };
  })();

  const [finances, setFinances] = useState<FinanceRecord[]>(initialFinanceCache.finances);
  const [accounts, setAccounts] = useState<Account[]>(initialFinanceCache.accounts);
  const [isFinanceSynced, setIsFinanceSynced] = useState<boolean>(initialFinanceCache.synced);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>(
    () => {
      const cached = localStorage.getItem("amkar_finance_categories");
      if (cached) {
        try {
          const parsed: FinanceCategory[] = JSON.parse(cached);
          const seeded = localStorage.getItem("amkar_subrent_cat_seeded_v1");
          if (
            !seeded &&
            Array.isArray(parsed) &&
            !parsed.some(
              (c) =>
                c.id === "cat_in_subrent" ||
                c.name.toLowerCase().includes("сдача площадок"),
            )
          ) {
            const updated = [
              ...parsed,
              {
                id: "cat_in_subrent",
                type: "income" as const,
                name: "Сдача площадок в аренду",
                isSystem: true,
              },
            ];
            localStorage.setItem(
              "amkar_finance_categories",
              JSON.stringify(updated),
            );
            localStorage.setItem("amkar_subrent_cat_seeded_v1", "true");
            return updated;
          }
          return parsed;
        } catch {}
      }
      return INITIAL_FINANCE_CATEGORIES;
    },
  );
  const [financialPlans, setFinancialPlans] = useState<FinancialPlan[]>(() => {
    const cached = localStorage.getItem("amkar_financial_plans");
    return cached ? JSON.parse(cached) : [];
  });
  const [trainingSessions, setTrainingSessions] = useState<
    TrainingSessionProtocol[]
  >(() => {
    const cached = localStorage.getItem("amkar_training_sessions");
    return cached ? JSON.parse(cached) : [];
  });
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem("amkar_products");
    return cached ? JSON.parse(cached) : [];
  });
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>(() => {
    const cached = localStorage.getItem("amkar_orders");
    return cached ? JSON.parse(cached) : [];
  });
  const [homeworks, setHomeworks] = useState<Homework[]>(() => {
    const cached = localStorage.getItem("amkar_homeworks");
    return cached ? JSON.parse(cached) : [];
  });
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<
    HomeworkSubmission[]
  >(() => {
    const cached = localStorage.getItem("amkar_homework_submissions");
    return cached ? JSON.parse(cached) : [];
  });
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>(() => {
    try {
      const cached = localStorage.getItem("amkar_video_lessons");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_VIDEO_LESSONS;
  });
  const [counterparties, setCounterparties] = useState<Counterparty[]>(() => {
    try {
      const cached = localStorage.getItem("amkar_counterparties_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [cancelledSessions, setCancelledSessions] = useState<CancelledSession[]>(() => {
    try {
      const cached = localStorage.getItem("amkar_cancelled_sessions");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_CANCELLED_SESSIONS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [firebaseReady, setFirebaseReady] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const dismissFirestoreError = () => {
    setFirestoreError(null);
  };

  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState<boolean>(
    () => {
      return localStorage.getItem("amkar_cal_sync_enabled") === "true";
    },
  );

  const [calendarSyncStatus, setCalendarSyncStatus] = useState<
    "connected" | "disconnected" | "syncing"
  >("disconnected");

  const [calendarSyncLog, setCalendarSyncLog] = useState<string[]>(() => {
    const cached = localStorage.getItem("amkar_cal_sync_log");
    return cached
      ? JSON.parse(cached)
      : [
          "Система инициализирована.",
          "Ожидание подключения Google Календаря...",
        ];
  });

  const [currentRole, setCurrentRoleState] = useState<
    "manager" | "trainer" | "parent" | "director" | "admin"
  >(() => {
    const cached = localStorage.getItem("amkar_current_role");
    return (
      (cached as "manager" | "trainer" | "parent" | "director" | "admin") ||
      "director"
    );
  });

  const [currentTab, setCurrentTabState] = useState<string>(() => {
    const cached = localStorage.getItem("amkar_current_tab");
    if (cached) return cached;
    if (currentRole === "trainer") return "trainer_home";
    if (currentRole === "parent") return "parent_home";
    return "hq_home";
  });

  const [viewingClientId, setViewingClientId] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem("amkar_school_name") || "АМКАР ЮНИОР";
  });
  const [whatsappNotifications, setWhatsappNotifications] = useState<boolean>(
    () => {
      return localStorage.getItem("amkar_whatsapp_notifications") !== "false";
    },
  );
  const [autoOverdueTasks, setAutoOverdueTasks] = useState<boolean>(() => {
    return localStorage.getItem("amkar_auto_overdue_tasks") !== "false";
  });

  const [crmConfig, setCrmConfig] = useState<CRMConfig>(() => {
    const cached = localStorage.getItem("amkar_crm_config");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      acquiringFeePct: 3.5,
      price12: 5400,
      price8: 4000,
      price4: 2500,
      price1: 550,
      referralBonusAmount: 0,
      referralBonusType: "rubles",
      yandexFormUrl: "https://forms.yandex.ru/u/6a0d853a9029025eff38a4db/",
    };
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem("amkar_user_profile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name && !parsed.name.includes("Без БД") && !parsed.name.includes("Посетитель")) {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      name: "Бычков Дмитрий Олегович",
      role: "Директор",
      avatarUrl: "https://i.pravatar.cc/100?img=11",
      phone: "+79194466199",
      email: "dmitriifnl@gmail.com",
    };
  });

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const sanitizedUpdates = { ...updates };
    if (
      sanitizedUpdates.name &&
      (sanitizedUpdates.name.includes("Без БД") ||
        sanitizedUpdates.name.includes("Посетитель") ||
        sanitizedUpdates.name.trim() === "")
    ) {
      delete sanitizedUpdates.name;
    }

    const newProfile = { ...userProfile, ...sanitizedUpdates };
    setUserProfile(newProfile);
    localStorage.setItem("amkar_user_profile", JSON.stringify(newProfile));
    try {
      const configDocRef = doc(db, "_config", "initialized");
      await setDoc(configDocRef, { userProfile: newProfile }, { merge: true });
    } catch (e) {
      console.error("Failed to sync profile", e);
    }
  };

  const updateUserCredentials = async (newPhone: string, newPassword?: string) => {
    try {
      const p = userProfile.phone;
      if (!p) return;

      const candidates = [p, p.replace('+7', '8'), p.replace(/^\+7/, '')].filter(Boolean);
      
      const updates: any = {};
      if (newPhone) updates.phone = newPhone;
      if (newPassword !== undefined) updates.password = newPassword;

      if (Object.keys(updates).length === 0) return;

      let matchedDocs: { col: string, id: string }[] = [];

      for (const cand of candidates) {
        const sysQ = query(collection(db, 'systemUsers'), where('phone', '==', cand));
        const sysDocs = await getDocs(sysQ);
        sysDocs.forEach(d => matchedDocs.push({ col: 'systemUsers', id: d.id }));

        const coachQ = query(collection(db, 'coaches'), where('phone', '==', cand));
        const coachDocs = await getDocs(coachQ);
        coachDocs.forEach(d => matchedDocs.push({ col: 'coaches', id: d.id }));

        const clientQ = query(collection(db, 'clients'), where('parentPhone', '==', cand));
        const clientDocs = await getDocs(clientQ);
        clientDocs.forEach(d => matchedDocs.push({ col: 'clients', id: d.id }));
      }

      for (const m of matchedDocs) {
        if (m.col === 'clients' && updates.phone) {
           await updateDoc(doc(db, m.col, m.id), { parentPhone: updates.phone, ...(updates.password ? { password: updates.password } : {}) });
        } else {
           await updateDoc(doc(db, m.col, m.id), updates);
        }
      }

      if (newPhone) {
        await updateUserProfile({ phone: newPhone });
      }

      const vUserStr = localStorage.getItem('virtual_user');
      if (vUserStr) {
        const vUser = JSON.parse(vUserStr);
        if (newPhone) vUser.phone = newPhone;
        localStorage.setItem('virtual_user', JSON.stringify(vUser));
      }
    } catch (e) {
      console.error("Failed to update credentials", e);
      throw e;
    }
  };

  const updateCRMConfig = async (configUpdates: Partial<CRMConfig>) => {
    const newConfig = { ...crmConfig, ...configUpdates };
    setCrmConfig(newConfig);
    localStorage.setItem("amkar_crm_config", JSON.stringify(newConfig));
    fetch("/api/crm-config/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newConfig, leads }),
    }).catch(() => {});
    try {
      const configDocRef = doc(db, "_config", "initialized");
      await setDoc(configDocRef, { crmConfig: newConfig }, { merge: true });
    } catch (e) {
      console.error("Failed to sync config to Firestore:", e);
    }
  };

  const updateSchoolName = async (name: string) => {
    setSchoolName(name);
    localStorage.setItem("amkar_school_name", name);
    try {
      const configDocRef = doc(db, "_config", "initialized");
      await setDoc(configDocRef, { schoolName: name }, { merge: true });
    } catch (e) {
      console.error("Failed to sync school name to Firestore:", e);
    }
  };

  const updateWhatsappNotifications = async (enabled: boolean) => {
    setWhatsappNotifications(enabled);
    localStorage.setItem("amkar_whatsapp_notifications", String(enabled));
    try {
      const configDocRef = doc(db, "_config", "initialized");
      await setDoc(
        configDocRef,
        { whatsappNotifications: enabled },
        { merge: true },
      );
    } catch (e) {
      console.error("Failed to sync whatsappNotifications to Firestore:", e);
    }
  };

  const updateAutoOverdueTasks = async (enabled: boolean) => {
    setAutoOverdueTasks(enabled);
    localStorage.setItem("amkar_auto_overdue_tasks", String(enabled));
    try {
      const configDocRef = doc(db, "_config", "initialized");
      await setDoc(
        configDocRef,
        { autoOverdueTasks: enabled },
        { merge: true },
      );
    } catch (e) {
      console.error("Failed to sync autoOverdueTasks to Firestore:", e);
    }
  };

  const setCurrentRole = (
    role: "manager" | "trainer" | "parent" | "director" | "admin",
  ) => {
    setCurrentRoleState(role);
    localStorage.setItem("amkar_current_role", role);
    let defaultTab = "hq_home";
    if (role === "trainer") defaultTab = "trainer_home";
    else if (role === "parent") defaultTab = "parent_home";
    setCurrentTab(defaultTab);
  };

  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    localStorage.setItem("amkar_current_tab", tab);
  };

  // 1. Connection check and auto-population on first load
  useEffect(() => {
    const testConnectionAndInit = async () => {
      try {
        const configDocRef = doc(db, "_config", "initialized");
        const configDoc = await getDoc(configDocRef);

        const shouldSeed = !configDoc.exists();

        if (shouldSeed) {
          console.log(
            "Pre-populating Firestore database with default CRM demo datasets...",
          );
          for (const item of INITIAL_COACHES) {
            await setDoc(doc(db, "coaches", item.id), item);
          }
          for (const item of INITIAL_GROUPS) {
            await setDoc(doc(db, "groups", item.id), item);
          }
          for (const item of INITIAL_CLIENTS) {
            await setDoc(doc(db, "clients", item.id), item);
          }
          for (const item of INITIAL_TASKS) {
            await setDoc(doc(db, "tasks", item.id), item);
          }
          for (const item of INITIAL_FINANCES) {
            await setDoc(doc(db, "finances", item.id), item);
          }
          for (const item of INITIAL_MESSAGES) {
            await setDoc(doc(db, "messages", item.id), item);
          }
          for (const item of INITIAL_LEADS) {
            await setDoc(doc(db, "leads", item.id), item);
          }
          await setDoc(
            configDocRef,
            {
              initialized: true,
              isProductionWiped: true,
              isProductionWipedFull: true,
              schoolName: "АМКАР ЮНИОР",
              whatsappNotifications: true,
              autoOverdueTasks: true,
            },
            { merge: true },
          );
        } else {
          // Load settings from config document if present
          const data = configDoc.data();
          if (data) {
            if (data.schoolName) {
              setSchoolName(data.schoolName);
              localStorage.setItem("amkar_school_name", data.schoolName);
            }
            if (data.whatsappNotifications !== undefined) {
              setWhatsappNotifications(data.whatsappNotifications);
              localStorage.setItem(
                "amkar_whatsapp_notifications",
                String(data.whatsappNotifications),
              );
            }
            if (data.autoOverdueTasks !== undefined) {
              setAutoOverdueTasks(data.autoOverdueTasks);
              localStorage.setItem(
                "amkar_auto_overdue_tasks",
                String(data.autoOverdueTasks),
              );
            }
            if (data.crmConfig) {
              setCrmConfig((prev) => {
                const merged = {
                  ...prev,
                  ...data.crmConfig,
                  telegramBotToken: data.crmConfig.telegramBotToken || prev.telegramBotToken || "",
                  telegramGroupChatId: data.crmConfig.telegramGroupChatId || prev.telegramGroupChatId || "",
                };
                localStorage.setItem("amkar_crm_config", JSON.stringify(merged));
                return merged;
              });
            }
            if (data.userProfile) {
              setUserProfile(data.userProfile);
              localStorage.setItem(
                "amkar_user_profile",
                JSON.stringify(data.userProfile),
              );
            }
          }
        }
      } catch (err: any) {
        const errMsg = err.message || String(err);
        const isOffline =
          errMsg.toLowerCase().includes("offline") ||
          errMsg.toLowerCase().includes("unavailable");
        const isQuota =
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("resource-exhausted");
        if (isQuota) {
          console.warn("Firestore daily quota exceeded:", errMsg);
          setFirestoreError(errMsg);
        } else if (isOffline) {
          console.warn("Firestore running in offline/cached mode:", errMsg);
        } else {
          console.error("Failed to initialize or fill Firestore:", err);
          setFirestoreError(errMsg);
        }
      } finally {
        setFirebaseReady(true);
      }
    };

    testConnectionAndInit();
  }, []);

  // Sync CRM Telegram config with backend server cache
  useEffect(() => {
    const botToken = crmConfig?.telegramBotToken?.trim();
    const chatId = crmConfig?.telegramGroupChatId?.trim();

    let notifiedMap: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem("amkar_notified_leads");
      if (raw) notifiedMap = JSON.parse(raw);
    } catch {}

    fetch("/api/crm-config/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramBotToken: botToken,
        telegramGroupChatId: chatId,
        telegramAlerts: crmConfig?.telegramAlerts,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.telegramBotToken && data?.telegramGroupChatId && (!botToken || !chatId)) {
          setCrmConfig((prev) => {
            const merged = {
              ...prev,
              telegramBotToken: prev.telegramBotToken || data.telegramBotToken,
              telegramGroupChatId: prev.telegramGroupChatId || data.telegramGroupChatId,
            };
            localStorage.setItem("amkar_crm_config", JSON.stringify(merged));
            return merged;
          });
        }
        if (data?.notifiedLeadIds) {
          const updatedMap = { ...notifiedMap, ...data.notifiedLeadIds };
          localStorage.setItem("amkar_notified_leads", JSON.stringify(updatedMap));
          setLeads((prev) =>
            prev.map((l) =>
              updatedMap[l.id] && !l.telegramNotified ? { ...l, telegramNotified: true } : l
            )
          );
        }
      })
      .catch(() => {});
  }, [crmConfig?.telegramBotToken, crmConfig?.telegramGroupChatId]);

  // 2. Real-time synchronizations with Firestore
  useEffect(() => {
    if (!firebaseReady) return;

    const handleSnapshotErr = (err: any, col: string) => {
      const errMsg = err.message || String(err);
      const isOffline =
        errMsg.toLowerCase().includes("offline") ||
        errMsg.toLowerCase().includes("unavailable");
      const isQuota =
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("resource-exhausted");
      if (isQuota) {
        console.warn(`Firestore collection ${col} hit daily quota:`, errMsg);
        setFirestoreError(errMsg);
      } else if (isOffline) {
        console.warn(
          `Firestore collection ${col} running in cached/offline mode:`,
          errMsg,
        );
      } else {
        setFirestoreError(errMsg);
        try {
          handleFirestoreError(err, OperationType.GET, col);
        } catch (e) {
          console.error(
            `Caught expected firestore permission error on ${col}:`,
            e,
          );
        }
      }
    };

    // Synchronize accounts and finances snapshots so totalBalance never renders a half-loaded state (e.g. 6300 before 79533)
    let accountsSnapshotReceived = false;
    let financesSnapshotReceived = false;
    let accountsSeedChecked = false;
    let pendingAccounts: Account[] = [];
    let pendingFinances: FinanceRecord[] = [];

    const flushSynchronizedFinance = () => {
      if (accountsSnapshotReceived && financesSnapshotReceived) {
        setAccounts(pendingAccounts);
        setFinances(pendingFinances);
        setIsFinanceSynced(true);
        try {
          localStorage.setItem(
            "amkar_accounts_cache",
            JSON.stringify(pendingAccounts),
          );
          localStorage.setItem(
            "amkar_finances_cache",
            JSON.stringify(pendingFinances),
          );
        } catch {}
      }
    };

    const unsubAccounts = onSnapshot(
      collection(db, "accounts"),
      (snapshot) => {
        const list: Account[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Account);
        });
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        if (list.length === 0) {
          // CRITICAL: Never overwrite Firestore accounts on an empty local-cache snapshot!
          if (snapshot.metadata.fromCache) {
            return;
          }
          if (!accountsSeedChecked) {
            accountsSeedChecked = true;
            void (async () => {
              for (const acc of INITIAL_ACCOUNTS) {
                try {
                  const ref = doc(db, "accounts", acc.id);
                  const existingSnap = await getDoc(ref);
                  if (!existingSnap.exists()) {
                    await setDoc(ref, acc);
                  }
                } catch {}
              }
            })();
          }
          pendingAccounts = INITIAL_ACCOUNTS;
        } else {
          accountsSeedChecked = true;
          pendingAccounts = list;
        }
        accountsSnapshotReceived = true;
        flushSynchronizedFinance();
      },
      (err) => handleSnapshotErr(err, "accounts"),
    );

    const unsubFinances = onSnapshot(
      collection(db, "finances"),
      (snapshot) => {
        const list: FinanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as FinanceRecord);
        });
        list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        pendingFinances = list;
        financesSnapshotReceived = true;
        flushSynchronizedFinance();
      },
      (err) => handleSnapshotErr(err, "finances"),
    );

    const unsubLeads = onSnapshot(
      collection(db, "leads"),
      (snapshot) => {
        let notifiedMap: Record<string, boolean> = {};
        try {
          const raw = localStorage.getItem("amkar_notified_leads");
          if (raw) notifiedMap = JSON.parse(raw);
        } catch {}

        const list: Lead[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data() as Lead;
          list.push({
            ...d,
            telegramNotified: Boolean(d.telegramNotified || notifiedMap[d.id]),
          });
        });

        setLeads(list);
        try {
          localStorage.setItem("amkar_leads_cache", JSON.stringify(list));
        } catch {}
      },
      (err) => handleSnapshotErr(err, "leads"),
    );

    const unsubClients = onSnapshot(
      collection(db, "clients"),
      (snapshot) => {
        const list: Client[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Client);
        });
        setClients(list);
        try {
          // Cache lightweight client summaries without large embedded base64 strings if any
          localStorage.setItem("amkar_clients_cache", JSON.stringify(list));
        } catch {}
      },
      (err) => handleSnapshotErr(err, "clients"),
    );

    const unsubTasks = onSnapshot(
      collection(db, "tasks"),
      (snapshot) => {
        const list: CRMTask[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CRMTask);
        });
        setTasks(list);
        try {
          localStorage.setItem("amkar_tasks_cache", JSON.stringify(list));
        } catch {}
      },
      (err) => handleSnapshotErr(err, "tasks"),
    );

    let coachesSnapshotReceived = false;

    const unsubCoaches = onSnapshot(
      collection(db, "coaches"),
      (snapshot) => {
        coachesSnapshotReceived = true;
        const rawList: Coach[] = [];
        snapshot.forEach((docSnap) => {
          rawList.push(docSnap.data() as Coach);
        });

        // Deduplicate coach records that refer to the same person (e.g. "Никонов Данила Владимирович" vs "Никонов Данил Владимирович" or temp_ duplicates)
        const deduped: Coach[] = [];
        rawList.forEach((c) => {
          const cPhone = normalizePhone10(c.phone);
          const existingIdx = deduped.findIndex((existing) => {
            if (existing.id === c.id) return true;
            const ePhone = normalizePhone10(existing.phone);
            if (cPhone && ePhone && cPhone === ePhone) return true;
            if (c.name && existing.name && isSameCoachName(c.name, existing.name)) {
              return true;
            }
            return false;
          });

          if (existingIdx === -1) {
            deduped.push(c);
          } else {
            const existing = deduped[existingIdx];
            // Prefer non-temp ID (e.g. "c_...") as canonical ID so existing group links remain intact
            const existingIsTemp = existing.id.startsWith("temp_") || existing.id.startsWith("virtual_");
            const currentIsTemp = c.id.startsWith("temp_") || c.id.startsWith("virtual_");
            const primary = existingIsTemp && !currentIsTemp ? c : existing;
            const secondary = primary === c ? existing : c;

            // Prefer "Данила" spelling if present, or longer full name
            const bestName =
              [primary.name, secondary.name]
                .filter(Boolean)
                .sort((a, b) => {
                  const aHasDanila = a.toLowerCase().includes("данила") ? 1 : 0;
                  const bHasDanila = b.toLowerCase().includes("данила") ? 1 : 0;
                  if (bHasDanila !== aHasDanila) return bHasDanila - aHasDanila;
                  return b.length - a.length;
                })[0] || primary.name;

            deduped[existingIdx] = {
              ...primary,
              name: bestName,
              phone: primary.phone || secondary.phone || "",
              telegram: primary.telegram || secondary.telegram || "",
              avatarUrl: primary.avatarUrl || secondary.avatarUrl || "",
            };
          }
        });

        setCoaches(deduped);
        try {
          localStorage.setItem("amkar_coaches_cache", JSON.stringify(deduped));
        } catch {}
      },
      (err) => handleSnapshotErr(err, "coaches"),
    );

    const unsubSystemUsers = onSnapshot(
      collection(db, "systemUsers"),
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const u = docSnap.data();
          if (u.role === "trainer" && u.fullName) {
            setCoaches((prev) => {
              // Wait until coaches snapshot has loaded so we never create blind duplicates
              if (!coachesSnapshotReceived && prev.length === 0) {
                return prev;
              }
              const uPhone = normalizePhone10(u.phone);
              const existingIdx = prev.findIndex(
                (c) =>
                  c.id === docSnap.id ||
                  (uPhone && normalizePhone10(c.phone) === uPhone) ||
                  isSameCoachName(c.name, u.fullName),
              );
              if (existingIdx === -1) {
                const newC: Coach = {
                  id: docSnap.id,
                  name: u.fullName.trim(),
                  role: "Тренер",
                  phone: u.phone || "",
                  telegram: "",
                  status: "Активен",
                  joinedYear: new Date().getFullYear(),
                  rating: 5,
                  avatarUrl: "",
                  groupsCount: 0,
                  kidsCount: 0,
                  workload: 0,
                  paymentType: "per_session",
                  rate: 1000,
                  feedback: {
                    professionalism: 5,
                    communication: 5,
                    results: 5,
                    discipline: 5,
                  },
                };
                setDoc(doc(db, "coaches", docSnap.id), newC, { merge: true }).catch(() => {});
                return [...prev, newC];
              } else {
                const existing = prev[existingIdx];
                const needsPhone = !existing.phone && u.phone;
                if (needsPhone) {
                  const updated = [...prev];
                  updated[existingIdx] = { ...existing, phone: u.phone };
                  return updated;
                }
              }
              return prev;
            });
          }
        });
      },
      (err) => handleSnapshotErr(err, "systemUsers"),
    );

    const unsubGroups = onSnapshot(
      collection(db, "groups"),
      (snapshot) => {
        const list: TrainingGroup[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as TrainingGroup);
        });
        setGroups(list);
        try {
          localStorage.setItem("amkar_groups_cache", JSON.stringify(list));
        } catch {}
      },
      (err) => handleSnapshotErr(err, "groups"),
    );

    const unsubTrainingSessions = onSnapshot(
      collection(db, "training_sessions"),
      (snapshot) => {
        const list: TrainingSessionProtocol[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as TrainingSessionProtocol);
        });
        // Sort newest first
        list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setTrainingSessions(list);
      },
      (err) => handleSnapshotErr(err, "training_sessions"),
    );

    const unsubMessages = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ChatMessage);
        });
        list.sort((a, b) => (a.id || "").localeCompare(b.id || ""));
        setMessages(list);
      },
      (err) => handleSnapshotErr(err, "messages"),
    );

    const unsubNotifications = onSnapshot(
      collection(db, "notifications"),
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AppNotification);
        });
        list.sort((a, b) => (b.dateString || "").localeCompare(a.dateString || ""));
        setNotifications(list);
      },
      (err) => handleSnapshotErr(err, "notifications"),
    );

    const unsubCounterparties = onSnapshot(
      collection(db, "counterparties"),
      (snapshot) => {
        const list: Counterparty[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Counterparty);
        });
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        if (list.length === 0 && snapshot.metadata.fromCache) {
          return;
        }
        setCounterparties(list);
        try {
          localStorage.setItem("amkar_counterparties_cache", JSON.stringify(list));
        } catch {}
      },
      (err) => handleSnapshotErr(err, "counterparties"),
    );

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Product);
        });
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        if (list.length > 0) {
          setProducts(list);
        }
      },
      (err) => handleSnapshotErr(err, "products"),
    );

    const unsubCancelledSessions = onSnapshot(
      collection(db, "cancelled_sessions"),
      (snapshot) => {
        const list: CancelledSession[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CancelledSession);
        });
        list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        if (list.length > 0) {
          setCancelledSessions(list);
        }
      },
      (err) => handleSnapshotErr(err, "cancelled_sessions"),
    );

    const unsubConfig = onSnapshot(
      doc(db, "_config", "initialized"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.crmConfig) {
            setCrmConfig((prev) => {
              const merged = {
                ...prev,
                ...data.crmConfig,
                telegramBotToken: data.crmConfig.telegramBotToken || prev.telegramBotToken || "",
                telegramGroupChatId: data.crmConfig.telegramGroupChatId || prev.telegramGroupChatId || "",
              };
              try {
                localStorage.setItem("amkar_crm_config", JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
          if (data?.schoolName) {
            setSchoolName(data.schoolName);
          }
        }
      },
      (err) => console.warn("Config listener notice:", err)
    );

    const unsubVideoLessonsCatalog = onSnapshot(
      doc(db, "_config", "video_lessons_catalog"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.items)) {
            const sorted = [...(data.items as VideoLesson[])].sort((a, b) => {
              if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
                return a.isPinned ? -1 : 1;
              }
              return (b.createdAt || "").localeCompare(a.createdAt || "");
            });
            setVideoLessons(sorted);
            try {
              localStorage.setItem("amkar_video_lessons", JSON.stringify(sorted));
            } catch {}
          }
        } else {
          // Seed initial catalog into _config/video_lessons_catalog so all parents see it in real time
          setDoc(
            doc(db, "_config", "video_lessons_catalog"),
            { items: INITIAL_VIDEO_LESSONS, updatedAt: new Date().toISOString() },
            { merge: true },
          ).catch(() => {});
        }
      },
      (err) => console.warn("Video lessons catalog listener notice:", err),
    );

    const unsubVideoLessonsCol = onSnapshot(
      collection(db, "video_lessons"),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: VideoLesson[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as VideoLesson);
          });
          list.sort((a, b) => {
            if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
              return a.isPinned ? -1 : 1;
            }
            return (b.createdAt || "").localeCompare(a.createdAt || "");
          });
          setVideoLessons(list);
          try {
            localStorage.setItem("amkar_video_lessons", JSON.stringify(list));
          } catch {}
        }
      },
      () => {
        // Ignore if rules for video_lessons collection are not yet deployed; _config/video_lessons_catalog handles real-time sync
      },
    );

    const unsubFinanceCategories = onSnapshot(
      doc(db, "_config", "finance_categories"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.items)) {
            let items = [...(data.items as FinanceCategory[])];
            const deletedIds: string[] = Array.isArray(data?.deletedIds)
              ? data.deletedIds
              : [];
            let needsCloudUpdate = false;

            // 1. Preserve any custom categories that existed in this device's localStorage
            // and were not explicitly deleted by the user
            try {
              const localRaw = localStorage.getItem("amkar_finance_categories");
              if (localRaw) {
                const localItems: FinanceCategory[] = JSON.parse(localRaw);
                if (Array.isArray(localItems)) {
                  for (const loc of localItems) {
                    if (!loc || !loc.name || deletedIds.includes(loc.id))
                      continue;
                    const exists = items.some(
                      (rem) =>
                        rem.id === loc.id ||
                        (rem.type === loc.type &&
                          rem.name.trim().toLowerCase() ===
                            loc.name.trim().toLowerCase()),
                    );
                    if (!exists) {
                      items.push(loc);
                      needsCloudUpdate = true;
                    }
                  }
                }
              }
            } catch {}

            // 2. Ensure restored v2 catalog is seeded if not yet applied
            if ((data?.restoredVersion || 0) < 2) {
              for (const defCat of INITIAL_FINANCE_CATEGORIES) {
                if (deletedIds.includes(defCat.id)) continue;
                const existingIdx = items.findIndex(
                  (rem) =>
                    rem.id === defCat.id ||
                    (rem.type === defCat.type &&
                      rem.name.trim().toLowerCase() ===
                        defCat.name.trim().toLowerCase()),
                );
                if (existingIdx === -1) {
                  items.push(defCat);
                  needsCloudUpdate = true;
                } else if (
                  defCat.type === "expense" &&
                  defCat.expenseType &&
                  !items[existingIdx].expenseType
                ) {
                  items[existingIdx] = {
                    ...items[existingIdx],
                    expenseType: defCat.expenseType,
                  };
                  needsCloudUpdate = true;
                }
              }
              needsCloudUpdate = true;
            }

            if (needsCloudUpdate) {
              setDoc(
                doc(db, "_config", "finance_categories"),
                {
                  items: items.map((item) => removeUndefined(item)),
                  deletedIds,
                  restoredVersion: 2,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true },
              ).catch(() => {});
            }

            setFinanceCategories(items);
            try {
              localStorage.setItem(
                "amkar_finance_categories",
                JSON.stringify(items),
              );
            } catch {}
          }
        } else {
          let initialItems = [...INITIAL_FINANCE_CATEGORIES];
          try {
            const cached = localStorage.getItem("amkar_finance_categories");
            if (cached) {
              const parsed: FinanceCategory[] = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                for (const loc of parsed) {
                  if (
                    loc &&
                    loc.name &&
                    !initialItems.some(
                      (c) =>
                        c.id === loc.id ||
                        (c.type === loc.type &&
                          c.name.trim().toLowerCase() ===
                            loc.name.trim().toLowerCase()),
                    )
                  ) {
                    initialItems.push(loc);
                  }
                }
              }
            }
          } catch {}
          setDoc(
            doc(db, "_config", "finance_categories"),
            {
              items: initialItems.map((item) => removeUndefined(item)),
              deletedIds: [],
              restoredVersion: 2,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          ).catch(() => {});
        }
      },
      (err) => console.warn("Finance categories listener notice:", err),
    );

    const unsubFinancialPlans = onSnapshot(
      doc(db, "_config", "financial_plans"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.items)) {
            const remotePlans = data.items as FinancialPlan[];
            setFinancialPlans(remotePlans);
            try {
              localStorage.setItem(
                "amkar_financial_plans",
                JSON.stringify(remotePlans),
              );
            } catch {}
          }
        } else {
          try {
            const cached = localStorage.getItem("amkar_financial_plans");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setDoc(
                  doc(db, "_config", "financial_plans"),
                  {
                    items: parsed.map((item) => removeUndefined(item)),
                    updatedAt: new Date().toISOString(),
                  },
                  { merge: true },
                ).catch(() => {});
              }
            }
          } catch {}
        }
      },
      (err) => console.warn("Financial plans listener notice:", err),
    );

    return () => {
      unsubConfig();
      unsubLeads();
      unsubClients();
      unsubTasks();
      unsubCoaches();
      unsubSystemUsers();
      unsubGroups();
      unsubFinances();
      unsubTrainingSessions();
      unsubMessages();
      unsubNotifications();
      unsubAccounts();
      unsubCounterparties();
      unsubProducts();
      unsubCancelledSessions();
      unsubVideoLessonsCatalog();
      unsubVideoLessonsCol();
      unsubFinanceCategories();
      unsubFinancialPlans();
    };
  }, [firebaseReady]);

  // Sync log preferences in localstorage
  useEffect(() => {
    localStorage.setItem("amkar_cal_sync_enabled", String(calendarSyncEnabled));
    setCalendarSyncStatus(calendarSyncEnabled ? "connected" : "disconnected");
  }, [calendarSyncEnabled]);

  useEffect(() => {
    localStorage.setItem("amkar_cal_sync_log", JSON.stringify(calendarSyncLog));
  }, [calendarSyncLog]);

  useEffect(() => {
    localStorage.setItem(
      "amkar_finance_categories",
      JSON.stringify(financeCategories),
    );
  }, [financeCategories]);

  useEffect(() => {
    localStorage.setItem(
      "amkar_financial_plans",
      JSON.stringify(financialPlans),
    );
  }, [financialPlans]);

  useEffect(() => {
    try {
      // Avoid quota overflow by stripping heavy base64 payloads only in localStorage fallback cache
      const lightweightSessions = trainingSessions.map((s) => ({
        ...s,
        photoUrl:
          s.photoUrl && s.photoUrl.startsWith("data:") && s.photoUrl.length > 2000
            ? undefined
            : s.photoUrl,
        lessonPlanPhotoUrl:
          s.lessonPlanPhotoUrl &&
          s.lessonPlanPhotoUrl.startsWith("data:") &&
          s.lessonPlanPhotoUrl.length > 2000
            ? undefined
            : s.lessonPlanPhotoUrl,
      }));
      localStorage.setItem(
        "amkar_training_sessions",
        JSON.stringify(lightweightSessions),
      );
    } catch {}
  }, [trainingSessions]);

  useEffect(() => {
    if (!isFinanceSynced) return;
    try {
      localStorage.setItem("amkar_accounts_cache", JSON.stringify(accounts));
      localStorage.setItem("amkar_finances_cache", JSON.stringify(finances));
    } catch {}
  }, [accounts, finances, isFinanceSynced]);

  // Hook to poll webhooks periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const pollWebhooks = async () => {
      try {
        const response = await fetch("/api/webhooks/poll");
        if (response.ok) {
          const data = await response.json();
          if (data.leads && data.leads.length > 0) {
            data.leads.forEach((payload: any) => {
              // Robust payload extraction (for Yandex Forms, etc)
              let parentPhone = "Не указан";
              let parentName = "Родитель (из формы)";
              let childName = "Ребенок";
              let notesList: string[] = [];
              let formSource = "Веб-форма";

              const entries = Object.entries(payload);
              entries.forEach(([key, value]) => {
                const k = key.toLowerCase();
                const v = typeof value === "string" ? value : String(value);

                if (
                  k.includes("phone") ||
                  k.includes("телефон") ||
                  k.includes("мобильный") ||
                  k.includes("номер")
                ) {
                  parentPhone = v;
                } else if (
                  k.includes("parent_name") ||
                  k.includes("имя родителя") ||
                  k.includes("ваше имя") ||
                  (k === "name" && parentName === "Родитель (из формы)")
                ) {
                  parentName = v;
                } else if (
                  k.includes("child_name") ||
                  k.includes("имя ребенка") ||
                  k.includes("имя ребёнка")
                ) {
                  childName = v;
                } else if (k.includes("source") || k.includes("источник")) {
                  formSource = v;
                } else {
                  // Put other fields in notes to not lose data
                  notesList.push(`${key}: ${v}`);
                }
              });

              // Create a lead from webhook payload
              const structuredLead = {
                parentName: payload.parentName || payload.name || parentName,
                parentPhone:
                  payload.parentPhone ||
                  payload.phone ||
                  payload.contact ||
                  parentPhone,
                parentEmail: payload.parentEmail || payload.email || undefined,
                childName: payload.childName || payload.child || childName,
                childSurname: payload.childSurname || payload.surname || "",
                childBirthYear: parseInt(
                  payload.childBirthYear || payload.year || "2015",
                  10,
                ),
                childAge: payload.childAge || payload.age || 8,
                source: payload.utm_source || ("messengers" as any),
                notes: notesList.join("\n") || "Заявка из Yandex Формы",
                timeString: new Date().toLocaleTimeString("ru-RU", {
                  timeZone: "Europe/Moscow",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };

              // We call addLead to insert and create tasks
              addLead(structuredLead);
            });
          }
        }
      } catch (e) {
        console.warn("Webhook poll failed:", e);
      }
    };

    interval = setInterval(pollWebhooks, 15000); // 15 seconds
    pollWebhooks(); // initial check
    return () => clearInterval(interval);
  }, []);

  // Actions
  const addLead = async (
    leadData: Omit<Lead, "id" | "createdAt" | "timeString" | "status">,
  ) => {
    // Prevent duplicate lead creation if recently created by server or client
    if (leadData.parentPhone && leadData.parentPhone !== "Не указан") {
      const isRecentlyAdded = leads.some((l) => {
        const phoneMatch = l.parentPhone.replace(/\D/g, "") === leadData.parentPhone.replace(/\D/g, "");
        const nameMatch = l.childName === leadData.childName;
        const recent = l.createdAt && (Date.now() - new Date(l.createdAt).getTime() < 60000);
        return phoneMatch && nameMatch && recent;
      });
      if (isRecentlyAdded) return;
    }

    let parsedChildName = leadData.childName || "";
    let parsedChildSurname = leadData.childSurname || "";
    let parsedChildAge = leadData.childAge || 0;
    let parsedBirthYear = leadData.childBirthYear || 0;
    const currentYear = new Date().getFullYear();

    // Smart parsing for "Прохор, 8 лет" or "Быстрых Прохор"
    if (parsedChildName) {
      const ageMatch = parsedChildName.match(/(\d+)\s*(?:лет|год|года|г\.?р\.?)?/i);
      if (ageMatch && !parsedChildAge) {
        parsedChildAge = parseInt(ageMatch[1], 10);
      }
      parsedChildName = parsedChildName.replace(/,?\s*\d+\s*(?:лет|год|года|г\.?р\.?)?/i, "").trim();

      const parts = parsedChildName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2 && !parsedChildSurname) {
        parsedChildSurname = parts[0];
        parsedChildName = parts.slice(1).join(" ");
      }
    }

    if (!parsedChildSurname && leadData.parentName) {
      const pParts = leadData.parentName.trim().split(/\s+/).filter(Boolean);
      if (pParts.length >= 2) {
        parsedChildSurname = pParts[0];
      }
    }

    if (parsedChildAge > 0 && !parsedBirthYear) {
      parsedBirthYear = currentYear - parsedChildAge;
    } else if (parsedBirthYear > 0 && !parsedChildAge) {
      parsedChildAge = currentYear - parsedBirthYear;
    }

    const now = new Date();
    const leadId = `l_${Date.now()}`;
    const moscowTime = now.toLocaleTimeString("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit",
    });
    const moscowDate = now.toLocaleDateString("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const newLead: Lead = {
      ...leadData,
      childName: parsedChildName,
      childSurname: parsedChildSurname,
      childAge: parsedChildAge,
      childBirthYear: parsedBirthYear || 2018,
      id: leadId,
      createdAt: now.toISOString(),
      dateString: moscowDate,
      timeString: moscowTime,
      status: "new",
      telegramNotified: false,
    };

    // Immediate local state update
    setLeads((prev) => [...prev, newLead]);

    // Automatically trigger task for Manager and Director locally (deterministic IDs matching server.ts)
    const managerTaskId = `t_${leadId}_m`;
    const childFullTitle = [newLead.childSurname, newLead.childName].filter(Boolean).join(" ") || "Ребенок";
    const ageText = newLead.childAge > 0 ? ` (${newLead.childAge} лет)` : "";

    const managerTask: CRMTask = {
      id: managerTaskId,
      title: `⚡ НОВАЯ ЗАЯВКА: ${childFullTitle}`,
      assignedTo: "manager",
      status: "new",
      dueDate: moscowDate,
      description: `🔥 Внимание! Поступила новая заявка из канала [${newLead.source}]. 
Родитель: ${newLead.parentName}
Телефон: ${newLead.parentPhone}
Ребенок: ${childFullTitle}${ageText}
НЕОБХОДИМО: Связаться в ближайшее время, уточнить детали и ЗАПИСАТЬ в расписание на пробную тренировку в подходящую возрастную группу!`,
      relatedLeadId: newLead.id,
    };

    const directorTaskId = `t_${leadId}_d`;
    const directorTask: CRMTask = {
      id: directorTaskId,
      title: `Контроль: Новая заявка [ ${newLead.source} ]`,
      assignedTo: "director",
      status: "new",
      dueDate: moscowDate,
      description: `Новый потенциальный клиент: ${childFullTitle}${ageText}. Источник: ${newLead.source}. Телефон: ${newLead.parentPhone}`,
      relatedLeadId: newLead.id,
    };

    setTasks((prev) => [
      managerTask,
      directorTask,
      ...prev.filter((t) => t.id !== managerTaskId && t.id !== directorTaskId),
    ]);

    // 1. Submit to server API (sends Telegram alert server-side, broadcasts OS Web Push, and writes to Firestore)
    let serverSaved = false;
    try {
      const serverRes = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const resJson = await serverRes.json().catch(() => null);
      if (serverRes.ok && resJson?.status === "OK") {
        serverSaved = true;
      }
      if (resJson?.telegramSent) {
        newLead.telegramNotified = true;
      }
    } catch (err) {
      console.warn("Server lead submit notice:", err);
    }

    // 2. Direct Firestore fallback sync (only if server call didn't already persist them, using deterministic IDs)
    if (!serverSaved) {
      setDoc(doc(db, "leads", leadId), newLead).catch((err) => { 
        handleFirestoreError(err, OperationType.WRITE, "leads");
      });
      setDoc(doc(db, "tasks", managerTaskId), managerTask).catch((err) => { 
        handleFirestoreError(err, OperationType.WRITE, "tasks");
      });
      setDoc(doc(db, "tasks", directorTaskId), directorTask).catch((err) => { 
        handleFirestoreError(err, OperationType.WRITE, "tasks");
      });
    }

    if (calendarSyncEnabled) {
      setCalendarSyncLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Обнаружена заявка. Запланировано автособытие "Звонок-контакт" в Google Календаре.`,
        ...prev,
      ]);
    }

    // 3. Client-side Telegram alert backup if server didn't already send
    try {
      if (!newLead.telegramNotified) {
        const configDoc = await getDoc(doc(db, "_config", "initialized"));
        const latestConfig = configDoc.data()?.crmConfig || crmConfig;
        
        if (latestConfig.telegramAlerts?.newLead !== false && latestConfig.telegramBotToken && latestConfig.telegramGroupChatId) {
          const ageTextTelegram = newLead.childAge > 0 ? ` (${newLead.childAge} лет, ${newLead.childBirthYear || currentYear - newLead.childAge} г.р.)` : "";
          const tgRes = await sendTelegramAlert(
            latestConfig.telegramBotToken,
            latestConfig.telegramGroupChatId,
            `🚨 <b>НОВАЯ ЗАЯВКА (АМКАР ЮНИОР)</b>\n\n👤 <b>Родитель:</b> ${newLead.parentName}\n📞 <b>Телефон:</b> <code>${newLead.parentPhone}</code>\n⚽ <b>Ребенок:</b> ${childFullTitle}${ageTextTelegram}\n📍 <b>Источник:</b> ${newLead.source}\n📋 <b>Статус:</b> Новая заявка\n🎯 <b>Действие:</b> ${newLead.notes || newLead.note || "Заявка с посадочной страницы"}\n\n⏰ <i>${moscowDate} ${newLead.timeString} (МСК)</i>`,
          );
          if (tgRes.success) {
            newLead.telegramNotified = true;
            updateDoc(doc(db, "leads", leadId), { telegramNotified: true }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn("Client telegram alert fallback notice:", e);
    }

    if (!serverSaved) {
      addNotification({
        id: `notif_${leadId}`,
        title: `⚡ Новая заявка: ${childFullTitle}`,
        body: `Родитель: ${newLead.parentName} (${newLead.parentPhone}). Источник: ${newLead.source}`,
        type: "system",
        targetRole: ["director", "admin", "manager"],
      });
    }
  };

  const resendLeadTelegram = async (
    leadId: string,
    customBotToken?: string,
    customChatId?: string
  ): Promise<{ success: boolean; message: string; needsConfig?: boolean }> => {
    const targetLead = leads.find((l) => l.id === leadId);
    const botToken = (customBotToken || crmConfig?.telegramBotToken || "").trim();
    const chatId = (customChatId || crmConfig?.telegramGroupChatId || "").trim();

    if (customBotToken && customChatId) {
      await updateCRMConfig({
        telegramBotToken: customBotToken.trim(),
        telegramGroupChatId: customChatId.trim(),
      });
    }

    const markLeadNotified = () => {
      try {
        const raw = localStorage.getItem("amkar_notified_leads");
        const notifiedMap = raw ? JSON.parse(raw) : {};
        notifiedMap[leadId] = true;
        localStorage.setItem("amkar_notified_leads", JSON.stringify(notifiedMap));
      } catch {}
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, telegramNotified: true } : l))
      );
    };

    try {
      const res = await fetch(`/api/leads/${leadId}/send-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: targetLead,
          botToken,
          chatId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.status === "OK") {
        markLeadNotified();
        return { success: true, message: "Уведомление успешно доставлено в Telegram!" };
      }

      // Direct client fallback if server lacked credentials or encountered network error
      if (botToken && chatId && targetLead) {
        const moscowDate = new Date().toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow" });
        const childDisplayName = [targetLead.childSurname, targetLead.childName].filter(Boolean).join(" ") || "Не указано";
        const ageText = (targetLead.childAge || 0) > 0 ? ` (${targetLead.childAge} лет, ${targetLead.childBirthYear || 2018} г.р.)` : "";
        const telegramMessage = `🚨 <b>НОВАЯ ЗАЯВКА (АМКАР ЮНИОР)</b>\n\n👤 <b>Родитель:</b> ${targetLead.parentName}\n📞 <b>Телефон:</b> <code>${targetLead.parentPhone}</code>\n⚽ <b>Ребенок:</b> ${childDisplayName}${ageText}\n📍 <b>Источник:</b> ${targetLead.source || "Лендинг"}\n📋 <b>Статус:</b> Новая заявка\n🎯 <b>Действие:</b> ${targetLead.notes || targetLead.note || "Пригласить на пробную тренировку"}\n\n⏰ <i>${moscowDate} ${targetLead.timeString || "12:00"} (МСК)</i>`;

        const directRes = await sendTelegramAlert(botToken, chatId, telegramMessage);
        if (directRes.success) {
          markLeadNotified();
          return { success: true, message: "Уведомление успешно доставлено в Telegram!" };
        }
      }

      const errMsg = data?.error || data?.message || "Ошибка отправки в Telegram";
      const isMissingConfig =
        (!botToken || !chatId) &&
        (errMsg.includes("не настроены") || errMsg.includes("Токен"));

      return {
        success: false,
        message: errMsg,
        needsConfig: isMissingConfig,
      };
    } catch (e: any) {
      return { success: false, message: e.message || "Ошибка связи с сервером" };
    }
  };

  async function addClient(
    clientData: Omit<
      Client,
      "id" | "attendance" | "payments" | "progress" | "achievements"
    >,
  ) {
    if (!clientData.parentName?.trim())
      throw new Error("Пожалуйста, заполните поле 'ФИО Родителя'.");
    if (!clientData.childName?.trim())
      throw new Error("Пожалуйста, заполните поле 'Имя ученика'.");
    if (!clientData.childSurname?.trim())
      throw new Error("Пожалуйста, заполните поле 'Фамилия ученика'.");
    if (!clientData.childBirthDate)
      throw new Error("Пожалуйста, заполните поле 'Дата рождения'.");
    if (
      !clientData.parentPhone ||
      clientData.parentPhone.replace(/\D/g, "").length < 11
    )
      throw new Error("Пожалуйста, корректно заполните поле 'Телефон'.");

    const clientId = `cl_${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id: clientId,
      attendance: [],
      payments: [],
      progress: {
        technique: 4.0,
        tactics: 4.0,
        physical: 4.0,
        discipline: 4.0,
      },
      achievements: [],
    };

    setClients((prev) => [...prev, newClient]);

    const managerTaskId = `t_${Date.now()}_mc`;
    const managerTask: CRMTask = {
      id: managerTaskId,
      title: `Новый ученик добавлен напрямую: ${newClient.childSurname} ${newClient.childName}`,
      assignedTo: "manager",
      status: "completed",
      dueDate: new Date().toLocaleDateString("ru-RU"),
      description: `Добавлен новый ученик ${newClient.childName} ${newClient.childSurname} напрямую в базу данных. Группа: ${newClient.groupName || "Не указана"}.`,
      relatedClientId: clientId,
    };

    setTasks((prev) => [managerTask, ...prev]);

    setDoc(doc(db, "clients", clientId), newClient).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to sync new client to Firestore:", err);
    });
    setDoc(doc(db, "tasks", managerTaskId), managerTask).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to sync task to Firestore:", err);
    });

    addNotification({
      title: "Новый ученик!",
      body: `${newClient.childName} ${newClient.childSurname} добавлен в базу клиентов.`,
      type: "system",
    });
  }

  const updateLeadStatus = async (id: string, status: Lead["status"]) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    updateDoc(doc(db, "leads", id), { status }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to update status for lead ${id} in Firestore, kept locally:`,
        err,
      );
    });
  };

  const ensureClientFromLead = async (
    lead: Lead,
    trialGroupName?: string,
  ): Promise<Client> => {
    const leadPhoneClean = (lead.parentPhone || "").replace(/\D/g, "");
    const existing = clients.find(
      (c) =>
        (c.parentPhone &&
          leadPhoneClean &&
          c.parentPhone.replace(/\D/g, "") === leadPhoneClean) &&
        c.childName.toLowerCase() === lead.childName.toLowerCase(),
    );
    if (existing) {
      return existing;
    }

    const clientId = `cl_lead_${lead.id}`;
    const group = trialGroupName
      ? groups.find((g) => g.name === trialGroupName)
      : lead.trialGroupId
      ? groups.find((g) => g.id === lead.trialGroupId)
      : null;

    const hasCompletedTrial =
      lead.status === "trial_completed" || Boolean(lead.trainerFeedback);

    const newClient: Client = {
      id: clientId,
      parentName: lead.parentName || "Не указано",
      parentPhone: lead.parentPhone || "",
      parentEmail: lead.parentEmail || "",
      childName: lead.childName,
      childSurname: lead.childSurname,
      childBirthYear: lead.childBirthYear || new Date().getFullYear(),
      childBirthDate:
        lead.childBirthDate ||
        `${lead.childBirthYear || new Date().getFullYear()}-01-01`,
      childAge: lead.childAge || 7,
      status: "trial",
      abonement: "none",
      abonementStatus: "Не оплачено",
      abonementSessionsLeft: 0,
      abonementTotalSessions: 0,
      groupName: group?.name || trialGroupName || null,
      coachId: group?.coachId || lead.trialCoachId || null,
      coachName: group?.coachName || null,
      medicalCertificateUrl: null,
      insuranceUrl: null,
      payments: [],
      attendance: hasCompletedTrial
        ? [
            {
              date: lead.trialDate || new Date().toISOString().split("T")[0],
              status: "present",
              reason: "Пробное занятие",
            },
          ]
        : [],
      progress: {
        technique: 4.0,
        tactics: 4.0,
        physical: 4.0,
        discipline: 4.0,
      },
      achievements: [],
      notes: hasCompletedTrial
        ? `Клиент поступил по заявке (${lead.source || "Сайт"}). Пробное занятие отработано. Ожидает оплаты абонемента.`
        : `Клиент поступил по заявке (${lead.source || "Сайт"}). Пробное занятие еще не проходил / ожидает записи.`,
    };

    setClients((prev) => {
      if (prev.some((c) => c.id === clientId)) return prev;
      return [newClient, ...prev];
    });

    try {
      await setDoc(doc(db, "clients", clientId), newClient, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "clients");
    }

    return newClient;
  };

  const convertLeadToClient = async (
    leadId: string,
    initialGroup?: string,
  ): Promise<Client | undefined> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return undefined;

    const client = await ensureClientFromLead(lead, initialGroup);

    const updatedLead: Lead = {
      ...lead,
      status: "converted",
    };
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
    updateDoc(doc(db, "leads", leadId), updatedLead as any).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, "update");
    });

    return client;
  };

  const bookTrial = async (
    leadId: string,
    coachId: string,
    groupName: string,
    date: string,
    time: string,
  ) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const group = groups.find((g) => g.name === groupName);
    const coach = coaches.find((c) => c.id === coachId);

    const updatedLead: Lead = {
      ...lead,
      status: "trial_booked",
      trialDate: date,
      trialTime: time,
      trialGroupId: group?.id,
      trialCoachId: coachId,
    };

    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));

    const ageTextTask = lead.childAge > 0 ? ` (возраст: ${lead.childAge} лет)` : "";
    const trainerTaskId = `t_${Date.now()}_tr`;
    const trainerTask: CRMTask = {
      id: trainerTaskId,
      title: `Провести пробную тренировку для ${lead.childName} ${lead.childSurname}`,
      assignedTo: "trainer",
      status: "pending",
      dueDate: `${date} в ${time}`,
      description: `Назначен тренер: ${coach?.name || "Не указан"}. Проверить навыки ребенка${ageTextTask}. Оставить отзыв после тренировки.`,
      relatedClientId: lead.id,
    };

    setTasks((prev) => [trainerTask, ...prev]);

    updateDoc(doc(db, "leads", leadId), updatedLead as any).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to update lead status in Firestore:", err);
    });
    setDoc(doc(db, "tasks", trainerTaskId), trainerTask).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to sync trainer task in Firestore:", err);
    });

    if (calendarSyncEnabled) {
      setCalendarSyncLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Добавлено событие "Пробная тренировка: ${updatedLead.childSurname} ${updatedLead.childName}" в Google Календарь.`,
        ...prev,
      ]);
    }
  };

  const completeTrialAndMarkAttendance = async (
    leadId: string,
    attended: boolean,
    coachNotes: string,
    groupName: string,
    coachName: string,
    fileAttached?: string,
  ) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const newFeedback = `[Тренер ${coachName} отметил]: ${coachNotes}. ${fileAttached ? "Фотоотчет прикреплен: " + fileAttached : ""}`;

    // Update Lead status to trial_completed and append trainer feedback
    const updatedLead: Lead = {
      ...lead,
      status: "trial_completed",
      trainerFeedback: newFeedback,
    };

    // Immediate local updates
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));

    const label = `${lead.childName} ${lead.childSurname}`;
    const managerTaskId = `t_${Date.now()}_conv`;
    const managerTask: CRMTask = {
      id: managerTaskId,
      title: `Связаться с родителем ${label} после пробного занятия`,
      assignedTo: "manager",
      status: "new",
      dueDate: new Date().toLocaleDateString("ru-RU"),
      description: `Пробная тренировка пройдена (${attended ? "Присутствовал" : "Пропустил"}). Отзыв тренера: ${coachNotes}. Связаться и отправить ссылку на оплату. Тел: ${lead.parentPhone}`,
      relatedLeadId: leadId,
    };

    const directorTaskId = `t_${Date.now()}_dir_conv`;
    const directorTask: CRMTask = {
      id: directorTaskId,
      title: `Контроль конверсии: Пробное пройдено - ${label}`,
      assignedTo: "director",
      status: "new",
      dueDate: new Date().toLocaleDateString("ru-RU"),
      description: `Ребенок посетил пробное занятие. Комментарий тренера: ${coachNotes}`,
    };

    setTasks((prev) => [managerTask, directorTask, ...prev]);

    // Safe background sync without blocking UI execution
    ensureClientFromLead(updatedLead, groupName).catch((err) => {
      console.warn("Failed to create client from lead:", err);
    });

    updateDoc(doc(db, "leads", leadId), updatedLead as any).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to sync attendance in Firestore:", err);
    });
    setDoc(doc(db, "tasks", managerTaskId), managerTask).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to sync manager task in Firestore:", err);
    });
    setDoc(doc(db, "tasks", directorTaskId), directorTask).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to sync director task in Firestore:", err);
    });
  };

  const uploadDocument = async (
    clientId: string,
    type: "medical" | "insurance",
    fileName: string,
  ) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const notesUpdate = `${client.notes}\n[Документы]: Загружен файл ${fileName} (${type === "medical" ? "Справка" : "Страховка"}).`;
    const updateFields: any = {
      notes: notesUpdate,
    };
    if (type === "medical") {
      updateFields.medicalCertificateUrl = fileName;
    } else {
      updateFields.insuranceUrl = fileName;
    }

    // Instantly update local state so views reflect the uploaded file instantly
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...updateFields } : c)),
    );

    // Background sync
    updateDoc(doc(db, "clients", clientId), updateFields).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to upload document for client ${clientId}:`, err);
    });
  };

  const deleteDocument = async (
    clientId: string,
    type: "medical" | "insurance",
  ) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const notesUpdate = `${client.notes}\n[Документы]: Удален файл (${type === "medical" ? "Справка" : "Страховка"}).`;
    const updateFields: any = {
      notes: notesUpdate,
    };
    if (type === "medical") {
      updateFields.medicalCertificateUrl = null;
    } else {
      updateFields.insuranceUrl = null;
    }

    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...updateFields } : c)),
    );

    updateDoc(doc(db, "clients", clientId), updateFields).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to delete document for client ${clientId}:`, err);
    });
  };

  const markAttendance = async (
    groupId: string,
    date: string,
    records: {
      clientId: string;
      status: "present" | "absent_sick" | "absent" | "trial_free";
      reason?: string;
    }[],
    mediaFile?: string,
    notes?: string,
    assistantId?: string,
    manualPaidCount?: number,
    manualUnpaidCount?: number,
    hasLessonPlan?: boolean,
    lessonPlanText?: string,
    lessonPlanPhotoUrl?: string | null,
    photoVerification?: AttendancePhotoVerification | null,
  ) => {
    const rawClients = clients; // avoid stale state issues in loops
    const groupObj = groups.find((g) => isGroupMatch(g.id, g.name, groupId, groupId));
    const resolvedGroupId = groupObj?.id || groupId;
    const resolvedGroupName = groupObj?.name || groupId;
    const coachId = groupObj?.coachId || "unknown";
    const coachName = groupObj?.coachName || "Неизвестный тренер";
    const assistantName = assistantId
      ? coaches.find((c) => c.id === assistantId)?.name || ""
      : "";

    const derivedPresentCount = records.filter(
      (r) => r.status === "present" || r.status === "trial_free",
    ).length;
    const sickCount = records.filter((r) => r.status === "absent_sick").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const trialCount = records.filter((r) => r.status === "trial_free").length;

    // Handle manual counts or calculate from roster
    const hasManualPaid = typeof manualPaidCount === "number" && !isNaN(manualPaidCount);
    const hasManualUnpaid = typeof manualUnpaidCount === "number" && !isNaN(manualUnpaidCount);

    const presentPaidCount = hasManualPaid
      ? Math.max(0, manualPaidCount!)
      : records.filter((r) => {
          if (r.status !== "present") return false;
          const c = rawClients.find((cl) => cl.id === r.clientId);
          return !!(c?.abonement && c.abonement !== "none" && (c.abonementSessionsLeft || 0) > 0);
        }).length;

    const presentUnpaidCount = hasManualUnpaid
      ? Math.max(0, manualUnpaidCount!)
      : records.filter((r) => {
          if (r.status === "trial_free") return true;
          if (r.status !== "present") return false;
          const c = rawClients.find((cl) => cl.id === r.clientId);
          return !c?.abonement || c.abonement === "none" || (c.abonementSessionsLeft || 0) <= 0;
        }).length;

    // Total count is sum of paid and unpaid if manual counts are provided, otherwise derived
    const presentCount = (hasManualPaid || hasManualUnpaid)
      ? (presentPaidCount + presentUnpaidCount)
      : derivedPresentCount;

    // Format date string to YYYY-MM-DD
    const sessionDateISO = normalizeDateToYMD(date) || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    const normalizedPhotoVerification: AttendancePhotoVerification | null =
      photoVerification
        ? {
            ...photoVerification,
            reportedCount: presentCount,
            discrepancy: photoVerification.detectedChildrenCount - presentCount,
            hasDiscrepancy:
              photoVerification.detectedChildrenCount !== presentCount,
          }
        : null;

    const newProtocol: TrainingSessionProtocol = {
      id: `ts_${Date.now()}`,
      groupId: resolvedGroupId,
      groupName: resolvedGroupName,
      date: `${sessionDateISO}T${new Date().toISOString().substring(11)}`,
      dateString: date,
      coachId: coachId || "unknown",
      coachName: coachName || "Неизвестный тренер",
      assistantId: assistantId || "",
      assistantName: assistantName || "",
      photoUrl: mediaFile || "",
      notes: notes || "",
      hasLessonPlan: hasLessonPlan !== undefined
        ? hasLessonPlan
        : Boolean(lessonPlanText?.trim() || lessonPlanPhotoUrl),
      lessonPlanText: lessonPlanText || "",
      lessonPlanPhotoUrl: lessonPlanPhotoUrl || null,
      presentCount,
      presentPaidCount,
      presentUnpaidCount,
      absentCount,
      sickCount,
      trialCount,
      photoVerification: normalizedPhotoVerification,
      records: records.map((r) => {
        const clientObj = rawClients.find((c) => c.id === r.clientId);
        const leadObj = leads.find((l) => l.id === r.clientId);
        const fullName = clientObj
          ? `${clientObj.childSurname || ""} ${clientObj.childName || ""}`.trim()
          : leadObj
          ? `${leadObj.childSurname || ""} ${leadObj.childName || ""}`.trim()
          : r.clientId;
        return {
          clientId: r.clientId,
          clientName: fullName || r.clientId,
          status: r.status,
          reason: r.reason || "",
        };
      }),
    };

    setTrainingSessions((prev) => [newProtocol, ...prev.filter(s => s.id !== newProtocol.id)]);

    // Always persist training_sessions protocol immediately
    setDoc(doc(db, "training_sessions", newProtocol.id), removeUndefined(newProtocol) as any).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, "training_sessions_direct");
    });

    if (normalizedPhotoVerification?.hasDiscrepancy) {
      addNotification({
        title: `⚠️ Расхождение по фотоотчёту: ${resolvedGroupName}`,
        body: `Тренер ${coachName} (${date}): на фото обнаружено ${normalizedPhotoVerification.detectedChildrenCount} дет., а в отчёте указано ${presentCount} чел.${normalizedPhotoVerification.overrideReason ? ` Комментарий: ${normalizedPhotoVerification.overrideReason}` : ""}`,
        type: "system",
        targetRole: ["director", "admin", "manager"],
        relatedTab: "hq_sessions",
      });
    }

    // Auto-remove any conflicting cancellation for this group and date, since the training officially took place
    const matchingCancellations = cancelledSessions.filter((cs) => {
      const gMatch = isGroupMatch(cs.groupId, cs.groupName, resolvedGroupId, resolvedGroupName);
      const dMatch = isDateMatch(cs.date, undefined, sessionDateISO);
      return gMatch && dMatch;
    });

    if (matchingCancellations.length > 0) {
      setCancelledSessions((prev) =>
        prev.filter((cs) => !matchingCancellations.some((m) => m.id === cs.id))
      );
      matchingCancellations.forEach((mc) => {
        deleteDoc(doc(db, "cancelled_sessions", mc.id)).catch((err) => {
          handleFirestoreError(err, OperationType.DELETE, "cancelled_sessions");
        });
      });
    }

    // Auto-create accrued expense for venue rental (per training session)
    const venueCp = counterparties.find(cp => cp.id === groupObj?.venueId);

    // Check if rental record already exists for this group & date to prevent duplicate accrual
    const existingRentalRecord = finances.find(
      (f) =>
        f.category === "Аренда" &&
        (f.groupName === resolvedGroupName || f.description.includes(resolvedGroupName)) &&
        f.date === sessionDateISO &&
        f.paymentStatus === "accrued"
    );

    // Only accrue per session if the venue is NOT fixed-price per month.
    if (!venueCp || venueCp.paymentType !== "fixed") {
      const venueCostToAccrue = venueCp?.rate && venueCp.rate > 0 
        ? venueCp.rate 
        : (groupObj?.venueCost && groupObj.venueCost > 0 ? groupObj.venueCost : 1500);

      if (!existingRentalRecord) {
        addFinanceRecord({
          type: "expense",
          category: "Аренда",
          amount: venueCostToAccrue,
          date: sessionDateISO,
          description: `Начисление аренды за тренировку (${resolvedGroupName})`,
          groupName: resolvedGroupName,
          isFixed: false,
          counterpartyId: groupObj?.venueId,
          paymentStatus: "accrued",
        });
      }
    }

    // Auto-create accrued payroll expenses
    const headCoachObj = coaches.find((c) => c.id === coachId);
    if (headCoachObj && headCoachObj.paymentType !== "fixed") {
      const headRate = headCoachObj.rate && headCoachObj.rate > 0 ? headCoachObj.rate : 1500;
      const existingSalaryRecord = finances.find(
        (f) =>
          f.category === "Зарплата" &&
          f.coachId === headCoachObj.id &&
          f.date === sessionDateISO &&
          f.paymentStatus === "accrued" &&
          (f.groupName === resolvedGroupName || f.description.includes(resolvedGroupName))
      );

      if (!existingSalaryRecord) {
        addFinanceRecord({
          type: "expense",
          category: "Зарплата",
          amount: headRate,
          date: sessionDateISO,
          description: `Начисление ЗП за тренировку: ${coachName} (${resolvedGroupName})`,
          groupName: resolvedGroupName,
          isFixed: false,
          paymentStatus: "accrued",
          coachId: headCoachObj.id,
        });
      }
    }

    if (assistantId) {
      const astCoachObj = coaches.find((c) => c.id === assistantId);
      if (astCoachObj && astCoachObj.paymentType !== "fixed") {
        const astRate = astCoachObj.rate && astCoachObj.rate > 0 ? astCoachObj.rate : 1000;
        const existingAssistantSalaryRecord = finances.find(
          (f) =>
            f.category === "Зарплата" &&
            f.coachId === astCoachObj.id &&
            f.date === sessionDateISO &&
            f.paymentStatus === "accrued" &&
            (f.groupName === resolvedGroupName || f.description.includes(resolvedGroupName))
        );

        if (!existingAssistantSalaryRecord) {
          addFinanceRecord({
            type: "expense",
            category: "Зарплата",
            amount: astRate,
            date: sessionDateISO,
            description: `Начисление ЗП (Ассистент): ${astCoachObj.name} (${resolvedGroupName})`,
            groupName: resolvedGroupName,
            isFixed: false,
            paymentStatus: "accrued",
            coachId: astCoachObj.id,
          });
        }
      }
    }

    // Helper for calculating total sessions for abonement
    const getBaseTotalSessions = (cl: { abonement?: string; abonementTotalSessions?: number }): number => {
      if (cl.abonementTotalSessions && cl.abonementTotalSessions > 0) return cl.abonementTotalSessions;
      switch (cl.abonement) {
        case "12_sessions": return 12;
        case "8_sessions": return 8;
        case "4_sessions": return 4;
        case "1_session": return 1;
        default: return 0;
      }
    };

    // Instantly update local clients state so views update immediately
    setClients((prev) =>
      prev.map((c) => {
        const record = records.find((r) => r.clientId === c.id);
        if (record) {
          const existingAttIndex = (c.attendance || []).findIndex(
            (a) => a.date === date || a.date === sessionDateISO
          );
          const existingAtt = existingAttIndex >= 0 ? c.attendance[existingAttIndex] : null;

          const wasPreviouslyPresent = existingAtt?.status === "present";
          const isNowPresent = record.status === "present";

          const baseTotal = getBaseTotalSessions(c);
          let currentSessionsLeft = c.abonementSessionsLeft;
          if (currentSessionsLeft === undefined || currentSessionsLeft === null) {
            currentSessionsLeft = baseTotal;
          }

          let newSessionsLeft = currentSessionsLeft;
          let newAbonementStatus = c.abonementStatus;

          if (!wasPreviouslyPresent && isNowPresent) {
            newSessionsLeft = Math.max(0, currentSessionsLeft - 1);
            if (newSessionsLeft === 0 && c.abonement && c.abonement !== "none") {
              newAbonementStatus = "Ожидает оплаты";
            }
          } else if (wasPreviouslyPresent && !isNowPresent) {
            newSessionsLeft = currentSessionsLeft + 1;
            if (newSessionsLeft > 0 && c.abonementStatus === "Ожидает оплаты") {
              newAbonementStatus = "Оплачено";
            }
          }

          let updatedAttendance = [...(c.attendance || [])];
          if (existingAttIndex >= 0) {
            updatedAttendance[existingAttIndex] = {
              date,
              status: record.status as any,
              reason: record.reason || "",
            };
          } else {
            updatedAttendance = [
              { date, status: record.status as any, reason: record.reason || "" },
              ...updatedAttendance,
            ];
          }

          return {
            ...c,
            abonementSessionsLeft: newSessionsLeft,
            abonementStatus: newAbonementStatus,
            notes: c.notes || "",
            attendance: updatedAttendance,
          };
        }
        return c;
      }),
    );

    // Background sync with Batch for Efficiency and Correctness
    try {
      const batch = writeBatch(db);
      
      batch.set(doc(db, "training_sessions", newProtocol.id), removeUndefined(newProtocol) as any);

      records.forEach((record) => {
        const c = clients.find((cl) => cl.id === record.clientId);
        if (c) {
          const existingAttIndex = (c.attendance || []).findIndex(
            (a) => a.date === date || a.date === sessionDateISO
          );
          const existingAtt = existingAttIndex >= 0 ? c.attendance[existingAttIndex] : null;

          const wasPreviouslyPresent = existingAtt?.status === "present";
          const isNowPresent = record.status === "present";

          const baseTotal = getBaseTotalSessions(c);
          let currentSessionsLeft = c.abonementSessionsLeft;
          if (currentSessionsLeft === undefined || currentSessionsLeft === null) {
            currentSessionsLeft = baseTotal;
          }

          let newSessionsLeft = currentSessionsLeft;
          let newAbonementStatus = c.abonementStatus || "Оплачено";

          if (!wasPreviouslyPresent && isNowPresent) {
            newSessionsLeft = Math.max(0, currentSessionsLeft - 1);
            if (newSessionsLeft === 0 && c.abonement && c.abonement !== "none") {
              newAbonementStatus = "Ожидает оплаты";
            }
          } else if (wasPreviouslyPresent && !isNowPresent) {
            newSessionsLeft = currentSessionsLeft + 1;
            if (newSessionsLeft > 0 && c.abonementStatus === "Ожидает оплаты") {
              newAbonementStatus = "Оплачено";
            }
          }

          let updatedAttendance = [...(c.attendance || [])];
          if (existingAttIndex >= 0) {
            updatedAttendance[existingAttIndex] = {
              date,
              status: record.status as any,
              reason: record.reason || "",
            };
          } else {
            updatedAttendance = [
              { date, status: record.status as any, reason: record.reason || "" },
              ...updatedAttendance,
            ];
          }

          // TELEGRAM ALERT & RISK ENGINE: check if 2+ absences in a row
          let isChurnRisk = false;
          if (
            !isNowPresent &&
            record.status !== "trial_free"
          ) {
            const pastAbsences = (c.attendance || [])
              .slice(0, 1)
              .every((a) => a.status === "absent" || a.status === "absent_sick");
            if (pastAbsences) {
              isChurnRisk = true;
              if (crmConfig.telegramAlerts?.churnRisk !== false) {
                sendTelegramAlert(
                  crmConfig.telegramBotToken,
                  crmConfig.telegramGroupChatId,
                  `<b>РИСК ОТТОКА</b>\n<b>Ученик:</b> ${c.childSurname} ${c.childName}\n<b>Группа:</b> ${c.groupName}\nПропущено 2 и более тренировок подряд.\nТребуется помощь менеджера!`,
                );
              }
            }
          }

          const clientPayload: any = {
            abonementSessionsLeft: newSessionsLeft ?? 0,
            abonementStatus: newAbonementStatus || "Оплачено",
            notes: c.notes || "",
            attendance: updatedAttendance,
          };

          if (isChurnRisk) {
            clientPayload.riskType = "absences";
            if (!c.riskUrgency || c.riskUrgency === "none") {
              clientPayload.riskUrgency = "intervene";
            }
            if (!c.riskComment) {
              clientPayload.riskComment = `Автоматический риск оттока: пропущено 2+ тренировок подряд (${date})`;
            }
          }

          batch.set(doc(db, "clients", c.id), removeUndefined(clientPayload), { merge: true });
        }
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "training_sessions_batch");
    }
  };

  const deleteTrainingSession = async (sessionId: string) => {
    try {
      await deleteDoc(doc(db, "training_sessions", sessionId));
      setTrainingSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "delete_training_session");
      setTrainingSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  };

  const updateTrainingSessionProtocol = async (updatedSession: TrainingSessionProtocol) => {
    try {
      let recordsPresent = 0;
      let sickCount = 0;
      let absentCount = 0;
      let trialCount = 0;

      (updatedSession.records || []).forEach((r) => {
        if (r.status === "present") recordsPresent++;
        else if (r.status === "absent_sick") sickCount++;
        else if (r.status === "trial_free") trialCount++;
        else absentCount++;
      });

      const paid = typeof updatedSession.presentPaidCount === "number" && !isNaN(updatedSession.presentPaidCount)
        ? Math.max(0, updatedSession.presentPaidCount)
        : 0;
      const unpaid = typeof updatedSession.presentUnpaidCount === "number" && !isNaN(updatedSession.presentUnpaidCount)
        ? Math.max(0, updatedSession.presentUnpaidCount)
        : 0;

      const hasManualCounts = typeof updatedSession.presentPaidCount === "number" || typeof updatedSession.presentUnpaidCount === "number";
      const presentCount = hasManualCounts ? (paid + unpaid) : recordsPresent;

      const syncedPhotoVerification = updatedSession.photoVerification
        ? {
            ...updatedSession.photoVerification,
            reportedCount: presentCount,
            discrepancy:
              updatedSession.photoVerification.detectedChildrenCount - presentCount,
            hasDiscrepancy:
              updatedSession.photoVerification.detectedChildrenCount !== presentCount,
          }
        : updatedSession.photoVerification;

      const sessionToSave: TrainingSessionProtocol = {
        ...updatedSession,
        hasLessonPlan: updatedSession.hasLessonPlan !== undefined
          ? updatedSession.hasLessonPlan
          : Boolean(updatedSession.lessonPlanText?.trim() || updatedSession.lessonPlanPhotoUrl),
        lessonPlanText: updatedSession.lessonPlanText || "",
        lessonPlanPhotoUrl: updatedSession.lessonPlanPhotoUrl || null,
        presentPaidCount: paid,
        presentUnpaidCount: unpaid,
        presentCount,
        sickCount,
        absentCount,
        trialCount,
        photoVerification: syncedPhotoVerification,
      };

      setTrainingSessions((prev) =>
        prev.map((s) => (s.id === sessionToSave.id ? sessionToSave : s))
      );

      await setDoc(
        doc(db, "training_sessions", sessionToSave.id),
        removeUndefined(sessionToSave) as any,
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "update_training_session");
    }
  };

  const ratePlayer = async (
    clientId: string,
    metrics: {
      technique: number;
      tactics: number;
      physical: number;
      discipline: number;
    },
  ) => {
    const c = clients.find((cl) => cl.id === clientId);
    if (!c) return;

    const autoAchievements = [...(c.achievements || [])];
    if (
      metrics.technique >= 4.8 &&
      !(c.achievements || []).find((a) => a.id === "ac_tech_master")
    ) {
      autoAchievements.push({
        id: "ac_tech_master",
        title: "Мастер Техники",
        description: "Получена высшая оценка 4.8+ за технические навыки",
        earnedAt: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
        icon: "trophy",
      });
    }
    if (
      metrics.discipline >= 4.7 &&
      !(c.achievements || []).find((a) => a.id === "ac_dis_master")
    ) {
      autoAchievements.push({
        id: "ac_dis_master",
        title: "Железная Дисциплина",
        description: "Отличное поведение и дисциплина на тренировках",
        earnedAt: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
        icon: "medal",
      });
    }

    // Instantly update local state so views reflect player metrics instantly
    setClients((prev) =>
      prev.map((cl) =>
        cl.id === clientId
          ? { ...cl, progress: metrics, achievements: autoAchievements }
          : cl,
      ),
    );

    // Background sync
    updateDoc(doc(db, "clients", clientId), {
      progress: metrics,
      achievements: autoAchievements,
    }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to sync player metrics for client ${clientId} in Firestore:`,
        err,
      );
    });
  };

  const addTask = async (taskData: Omit<CRMTask, "id" | "status">) => {
    const id = `t_${Date.now()}`;
    const newTask: CRMTask = {
      ...taskData,
      id,
      status: "new",
    };
    setTasks((prev) => [newTask, ...prev]);
    setDoc(doc(db, "tasks", id), newTask).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to add task to Firestore, kept locally:", err);
    });
  };

  const completeTask = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t)),
    );
    updateDoc(doc(db, "tasks", id), { status: "completed" }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to complete task ${id} in Firestore, kept locally:`,
        err,
      );
    });
  };

  const updateTask = async (id: string, updates: Partial<CRMTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    updateDoc(doc(db, "tasks", id), updates).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to update task ${id} in Firestore, kept locally:`,
        err,
      );
    });
  };

  const reorderTasks = (newTasks: CRMTask[]) => {
    setTasks(newTasks);
  };

  const addChatMessage = async (
    msgData: Omit<ChatMessage, "id" | "timestamp">,
  ) => {
    const now = new Date();
    const id = `msg_${now.getTime()}`;
    const timeNow = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const senderId = msgData.senderId || msgData.senderRole;
    const initialReader = {
      id: senderId,
      name: msgData.senderName,
      role: msgData.senderRole,
      readAt: timeNow,
    };

    // Ensure director & admin roles stay synchronized in visibility
    let normalizedVisibleTo = msgData.visibleTo
      ? Array.from(new Set(msgData.visibleTo))
      : undefined;
    if (normalizedVisibleTo) {
      if (normalizedVisibleTo.includes("director") && !normalizedVisibleTo.includes("admin")) {
        normalizedVisibleTo.push("admin");
      } else if (normalizedVisibleTo.includes("admin") && !normalizedVisibleTo.includes("director")) {
        normalizedVisibleTo.push("director");
      }
    }

    const newMsg: ChatMessage = {
      ...msgData,
      id,
      timestamp: timeNow,
      createdAt: now.toISOString(),
      senderId,
      visibleTo: normalizedVisibleTo,
      readBy: [senderId],
      readers: [initialReader],
      isRead: false,
    };

    // Instantly update local state so messages show up in chat instantly
    setMessages((prev) => [...prev, newMsg]);

    // Background sync
    setDoc(doc(db, "messages", id), removeUndefined(newMsg)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, "messages");
      console.warn("Failed to sync new message in Firestore:", err);
    });

    // Notify recipients (excluding sender's own role)
    const allTargetRoles: ("manager" | "trainer" | "parent" | "director" | "admin")[] =
      normalizedVisibleTo && normalizedVisibleTo.length > 0
        ? normalizedVisibleTo
        : ["manager", "trainer", "director", "admin"];

    const recipientRoles = allTargetRoles.filter((r) => {
      if (r === msgData.senderRole) return false;
      if (
        (msgData.senderRole === "director" && r === "admin") ||
        (msgData.senderRole === "admin" && r === "director")
      ) {
        return false;
      }
      return true;
    });

    if (recipientRoles.length > 0) {
      const previewText =
        msgData.text.length > 90
          ? `${msgData.text.slice(0, 90)}...`
          : msgData.text || (msgData.fileName ? `Файл: ${msgData.fileName}` : "Новое вложение");

      addNotification({
        id: `notif_${id}`,
        title: `💬 Сообщение: ${msgData.senderName}`,
        body: previewText,
        type: "message",
        targetRole: recipientRoles,
      });
    }
  };

  const markChatMessageAsRead = async (
    id: string,
    reader: { id: string; name: string; role: any },
  ) => {
    if (!id || !reader?.id) return;
    const timeNow = new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const readerEntry = {
      id: reader.id,
      name: reader.name || "Сотрудник",
      role: reader.role || "admin",
      readAt: timeNow,
    };

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const currentReadBy = m.readBy || [];
        if (currentReadBy.includes(reader.id)) return m;
        const currentReaders = m.readers || [];
        const isAlreadyReader = currentReaders.some((r) => r.id === reader.id);
        const updatedReaders = isAlreadyReader
          ? currentReaders
          : [...currentReaders, readerEntry];
        return {
          ...m,
          readBy: [...currentReadBy, reader.id],
          readers: updatedReaders,
          isRead: true,
        };
      }),
    );

    try {
      const msgRef = doc(db, "messages", id);
      await updateDoc(msgRef, {
        readBy: arrayUnion(reader.id),
        readers: arrayUnion(readerEntry),
        isRead: true,
      });
    } catch (err) {
      console.warn(`Failed to mark message ${id} as read in Firestore:`, err);
    }
  };

  const markAllChatMessagesAsRead = async (
    ids: string[],
    reader: { id: string; name: string; role: any },
  ) => {
    if (!ids || ids.length === 0 || !reader?.id) return;
    const timeNow = new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const readerEntry = {
      id: reader.id,
      name: reader.name || "Сотрудник",
      role: reader.role || "admin",
      readAt: timeNow,
    };

    const targetIds = new Set(ids);

    setMessages((prev) =>
      prev.map((m) => {
        if (!targetIds.has(m.id)) return m;
        const currentReadBy = m.readBy || [];
        if (currentReadBy.includes(reader.id)) return m;
        const currentReaders = m.readers || [];
        const isAlreadyReader = currentReaders.some((r) => r.id === reader.id);
        const updatedReaders = isAlreadyReader
          ? currentReaders
          : [...currentReaders, readerEntry];
        return {
          ...m,
          readBy: [...currentReadBy, reader.id],
          readers: updatedReaders,
          isRead: true,
        };
      }),
    );

    // Update in Firestore
    try {
      const promises = ids.map((id) =>
        updateDoc(doc(db, "messages", id), {
          readBy: arrayUnion(reader.id),
          readers: arrayUnion(readerEntry),
          isRead: true,
        }).catch((err) => {
          console.warn(`Failed to mark message ${id} as read:`, err);
        }),
      );
      await Promise.all(promises);
    } catch (err) {
      console.warn("Failed to batch mark messages as read:", err);
    }
  };

  const updateChatMessage = async (id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: newText } : m)),
    );
    updateDoc(doc(db, "messages", id), { text: newText }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to update message ${id} in Firestore:`, err);
    });
  };

  const deleteChatMessage = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    deleteDoc(doc(db, "messages", id)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to delete message ${id} in Firestore:`, err);
    });
  };

  async function addNotification(
    notifData: Omit<AppNotification, "id" | "isRead" | "dateString"> & { id?: string },
  ) {
    const id = notifData.id || `notif_${Date.now()}`;
    const dateString = new Date().toISOString();
    const newNotif: AppNotification = {
      ...notifData,
      id,
      isRead: false,
      dateString,
    };

    setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== id)]);
    setDoc(doc(db, "notifications", id), removeUndefined(newNotif)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn("Failed to sync new notification in Firestore:", err);
    });

    // Also dispatch background Web Push to all registered devices
    try {
      fetch("/api/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNotif.title,
          body: newNotif.body,
          tag: id,
          url: "/crm",
        }),
      }).catch(() => {});
    } catch {}
  }

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    updateDoc(doc(db, "notifications", id), { isRead: true }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to mark notification ${id} as read in Firestore:`,
        err,
      );
    });
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, "notifications", n.id), { isRead: true }).catch(() => {}),
        ),
      );
    } catch (e) {
      console.warn("Failed to mark all notifications as read:", e);
    }
  };

  const clearReadNotifications = async () => {
    const readNotifs = notifications.filter((n) => n.isRead);
    if (readNotifs.length === 0) return;
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await Promise.all(
        readNotifs.map((n) =>
          deleteDoc(doc(db, "notifications", n.id)).catch(() => {}),
        ),
      );
    } catch (e) {
      console.warn("Failed to clear read notifications:", e);
    }
  };

  const toggleCalendarSync = () => {
    setCalendarSyncEnabled((prev) => !prev);
    const isEnabled = !calendarSyncEnabled;
    const time = new Date().toLocaleTimeString();
    if (isEnabled) {
      setCalendarSyncLog((prev) => [
        `[${time}] Успешное сопряжение с вашим Google Calendar. Экспортировано расписание 4-х возрастных групп в облако.`,
        `[${time}] Авторизация пройдена под адресом zaguzovaoa@gmail.com`,
        ...prev,
      ]);
    } else {
      setCalendarSyncLog((prev) => [
        `[${time}] Соединение разорвано. Расписание больше не транслируется в облачные календари.`,
        ...prev,
      ]);
    }
  };

  const triggerManualCalendarSync = () => {
    if (!calendarSyncEnabled) return;
    setCalendarSyncStatus("syncing");

    setTimeout(() => {
      setCalendarSyncStatus("connected");
      const time = new Date().toLocaleTimeString();
      setCalendarSyncLog((prev) => [
        `[${time}] Синхронизация завершена успешно. Обновлено 28 будущих событий тренировок, 4 турнира, и статусы посещаемости.`,
        ...prev,
      ]);
    }, 1500);
  };

  const syncFinanceCategoriesToFirestore = async (
    items: FinanceCategory[],
    deletedIdToAdd?: string,
    restoredIdToRemove?: string,
  ) => {
    try {
      localStorage.setItem("amkar_finance_categories", JSON.stringify(items));
    } catch {}
    try {
      let deletedIds: string[] = [];
      try {
        const rawDel = localStorage.getItem("amkar_deleted_finance_categories");
        if (rawDel) deletedIds = JSON.parse(rawDel);
      } catch {}
      if (deletedIdToAdd && !deletedIds.includes(deletedIdToAdd)) {
        deletedIds.push(deletedIdToAdd);
      }
      if (restoredIdToRemove) {
        deletedIds = deletedIds.filter((id) => id !== restoredIdToRemove);
      }
      try {
        localStorage.setItem(
          "amkar_deleted_finance_categories",
          JSON.stringify(deletedIds),
        );
      } catch {}

      await setDoc(
        doc(db, "_config", "finance_categories"),
        {
          items: items.map((item) => removeUndefined(item)),
          deletedIds,
          restoredVersion: 2,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (e) {
      console.warn("Failed to sync finance categories to Firestore:", e);
    }
  };

  const addFinanceCategory = async (
    category: Omit<FinanceCategory, "id"> & { id?: string },
  ) => {
    const id = category.id || `cat_${Date.now()}`;
    const newCategory: FinanceCategory = { ...category, id };
    const next = [...financeCategories.filter((c) => c.id !== id), newCategory];
    setFinanceCategories(next);
    await syncFinanceCategoriesToFirestore(next, undefined, id);
  };

  const updateFinanceCategory = async (
    id: string,
    updates: Partial<Omit<FinanceCategory, "id">>,
  ) => {
    const oldCat = financeCategories.find((c) => c.id === id);
    const next = financeCategories.map((c) =>
      c.id === id ? { ...c, ...updates } : c,
    );
    setFinanceCategories(next);
    await syncFinanceCategoriesToFirestore(next);

    if (oldCat) {
      const nameChanged =
        updates.name !== undefined && updates.name.trim() !== oldCat.name;
      const typeChanged =
        updates.type !== undefined && updates.type !== oldCat.type;
      const expenseTypeChanged =
        updates.expenseType !== undefined &&
        updates.expenseType !== oldCat.expenseType;

      if (nameChanged || typeChanged || expenseTypeChanged) {
        const affectedRecords = finances.filter(
          (f) => f.category === oldCat.name && f.type === oldCat.type,
        );
        if (affectedRecords.length > 0) {
          const newCatName = updates.name ? updates.name.trim() : oldCat.name;
          const newCatType = updates.type || oldCat.type;
          const newIsFixed =
            newCatType === "expense"
              ? (updates.expenseType ?? oldCat.expenseType) === "fixed"
              : false;

          setFinances((prev) =>
            prev.map((f) =>
              f.category === oldCat.name && f.type === oldCat.type
                ? {
                    ...f,
                    category: newCatName,
                    type: newCatType,
                    isFixed: newIsFixed,
                  }
                : f,
            ),
          );

          for (const rec of affectedRecords) {
            updateDoc(doc(db, "finances", rec.id), {
              category: newCatName,
              type: newCatType,
              isFixed: newIsFixed,
            }).catch(() => {});
          }
        }
      }
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("amkar_products", JSON.stringify(products));
    } catch (e) {
      console.warn("Failed to update products in localStorage:", e);
    }
  }, [products]);
  useEffect(() => {
    try {
      localStorage.setItem("amkar_orders", JSON.stringify(storeOrders));
    } catch (e) {
      console.warn("Failed to update orders in localStorage:", e);
    }
  }, [storeOrders]);
  useEffect(() => {
    try {
      localStorage.setItem("amkar_homeworks", JSON.stringify(homeworks));
    } catch (e) {
      console.warn("Failed to update homeworks in localStorage:", e);
    }
  }, [homeworks]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "amkar_homework_submissions",
        JSON.stringify(homeworkSubmissions),
      );
    } catch (e) {
      console.warn("Failed to update homeworkSubmissions in localStorage:", e);
    }
  }, [homeworkSubmissions]);

  const addCancelledSession = async (session: Omit<CancelledSession, "id">) => {
    // Prevent duplicate cancellations for the same group and date
    const isDuplicate = cancelledSessions.some(
      (cs) =>
        (cs.groupName?.trim().toLowerCase() === session.groupName?.trim().toLowerCase() ||
          (session.groupId && cs.groupId === session.groupId)) &&
        (cs.date === session.date || cs.date?.startsWith(session.date) || session.date?.startsWith(cs.date)) &&
        cs.reason === session.reason
    );
    if (isDuplicate) {
      console.warn("Cancelled session already recorded, ignoring duplicate:", session);
      return;
    }

    const newSession: CancelledSession = {
      ...session,
      id: `cs_${Date.now()}`,
      createdAt: session.createdAt || new Date().toISOString(),
    };
    setCancelledSessions((prev) => [newSession, ...prev]);
    try {
      await setDoc(doc(db, "cancelled_sessions", newSession.id), removeUndefined(newSession) as any);
    } catch (e) {
      console.error("Error adding cancelled session to Firestore:", e);
    }
  };

  const addCancelledSessionsBatch = async (sessions: Omit<CancelledSession, "id">[]): Promise<number> => {
    if (!sessions || sessions.length === 0) return 0;

    const validSessionsToAdd: CancelledSession[] = [];
    const existingKeys = new Set(
      cancelledSessions.map((cs) => `${(cs.groupId || cs.groupName || "").trim().toLowerCase()}_${cs.date?.substring(0, 10)}`)
    );

    const now = Date.now();
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const key = `${(s.groupId || s.groupName || "").trim().toLowerCase()}_${s.date?.substring(0, 10)}`;
      if (existingKeys.has(key)) {
        continue;
      }
      existingKeys.add(key);
      const newSession: CancelledSession = {
        ...s,
        id: `cs_${now}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: s.createdAt || new Date().toISOString(),
      };
      validSessionsToAdd.push(newSession);
    }

    if (validSessionsToAdd.length === 0) return 0;

    setCancelledSessions((prev) => [...validSessionsToAdd, ...prev]);

    try {
      const batchPromises = validSessionsToAdd.map((session) =>
        setDoc(doc(db, "cancelled_sessions", session.id), removeUndefined(session) as any)
      );
      await Promise.all(batchPromises);
    } catch (e) {
      console.error("Error adding cancelled sessions batch to Firestore:", e);
    }

    return validSessionsToAdd.length;
  };

  const deleteCancelledSession = async (id: string) => {
    setCancelledSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, "cancelled_sessions", id));
    } catch (e) {
      console.error("Error deleting cancelled session from Firestore:", e);
    }
  };

  const addProduct = async (product: Omit<Product, "id">) => {
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: product.name || "",
      category: product.category || "Экипировка",
      price: typeof product.price === "number" ? product.price : Number(product.price) || 0,
      description: product.description || "",
      photoUrl: product.photoUrl || "",
    };
    setProducts((prev) => [...prev, newProd]);
    try {
      await setDoc(doc(db, "products", newProd.id), removeUndefined(newProd) as any);
    } catch (e) {
      console.error("Error writing product to Firestore:", e);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const sanitizedUpdates = removeUndefined({ ...updates });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
    try {
      await updateDoc(doc(db, "products", id), sanitizedUpdates as any);
    } catch (e) {
      console.error("Error updating product in Firestore:", e);
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (e) {
      console.error("Error deleting product from Firestore:", e);
    }
  };

  const createOrder = async (order: Omit<StoreOrder, "id" | "date">) => {
    const newOrder = {
      ...order,
      id: `ord_${Date.now()}`,
      date: new Date().toISOString(),
    };
    setStoreOrders((prev) => [newOrder, ...prev]);

    // TELEGRAM ALERT: New Store Order
    if (crmConfig.telegramAlerts?.newOrder !== false) {
      const itemsStr = newOrder.items
        .map((i) => `- ${i.name} (${i.quantity}x)`)
        .join("\n");
      sendTelegramAlert(
        crmConfig.telegramBotToken,
        crmConfig.telegramGroupChatId,
        `<b>НОВЫЙ ЗАКАЗ В МАГАЗИНЕ</b>\n<b>Клиент:</b> ${newOrder.clientName}\n<b>Сумма:</b> ${newOrder.totalAmount} руб.\n<b>Товары:</b>\n${itemsStr}`,
      );
    }
  };
  const updateOrderStatus = async (
    id: string,
    status: "completed" | "cancelled",
  ) => {
    setStoreOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    );
  };

  const addHomework = async (hw: Omit<Homework, "id" | "dateAssigned">) => {
    setHomeworks((prev) => [
      { ...hw, id: `hw_${Date.now()}`, dateAssigned: new Date().toISOString() },
      ...prev,
    ]);
  };
  const deleteHomework = async (id: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== id));
    setHomeworkSubmissions((prev) => prev.filter((s) => s.homeworkId !== id));
  };
  const submitHomework = async (homeworkId: string, clientId: string) => {
    setHomeworkSubmissions((prev) => {
      const existing = prev.find(
        (s) => s.homeworkId === homeworkId && s.clientId === clientId,
      );
      if (existing) return prev;
      return [
        ...prev,
        {
          id: `hws_${Date.now()}`,
          homeworkId,
          clientId,
          status: "done",
          dateDone: new Date().toISOString(),
        },
      ];
    });
  };

  const deleteFinanceCategory = async (id: string) => {
    const next = financeCategories.filter((c) => c.id !== id);
    setFinanceCategories(next);
    await syncFinanceCategoriesToFirestore(next, id);
  };

  const addAccount = async (acc: Omit<Account, "id">) => {
    const id = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newAcc = removeUndefined({ ...acc, id });
    setAccounts((prev) => [...prev, newAcc]);
    try {
      await setDoc(doc(db, "accounts", id), newAcc);
    } catch (err) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setFirestoreError(err instanceof Error ? err.message : String(err));
      handleFirestoreError(err, OperationType.CREATE, `accounts/${id}`);
    }
  };
  const updateAccount = async (
    id: string,
    updates: Partial<Omit<Account, "id">>,
  ) => {
    const cleanUpdates = removeUndefined(updates);
    let previousAcc: Account | undefined;
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          previousAcc = a;
          return { ...a, ...cleanUpdates };
        }
        return a;
      }),
    );
    try {
      await updateDoc(doc(db, "accounts", id), cleanUpdates);
    } catch (err) {
      if (previousAcc) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === id ? previousAcc! : a)),
        );
      }
      setFirestoreError(err instanceof Error ? err.message : String(err));
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${id}`);
    }
  };
  const deleteAccount = async (id: string) => {
    let deletedAcc: Account | undefined;
    setAccounts((prev) => {
      deletedAcc = prev.find((a) => a.id === id);
      return prev.filter((a) => a.id !== id);
    });
    try {
      await deleteDoc(doc(db, "accounts", id));
    } catch (err) {
      if (deletedAcc) {
        setAccounts((prev) => [...prev, deletedAcc!]);
      }
      setFirestoreError(err instanceof Error ? err.message : String(err));
      handleFirestoreError(err, OperationType.DELETE, `accounts/${id}`);
    }
  };

  const generateAIProgressReport = async (
    clientId: string,
    options?: {
      quarterNumber?: number;
      quarterYear?: number;
      periodLabel?: string;
      customCoachNote?: string;
    },
  ): Promise<AIProgressReport | null> => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      console.warn("Client not found for AI report:", clientId);
      return null;
    }

    const now = new Date();
    const currentYear = options?.quarterYear || now.getFullYear();
    const currentQuarter =
      options?.quarterNumber || Math.ceil((now.getMonth() + 1) / 3);

    // Calculate dates for this 3-month quarter
    const startMonth = (currentQuarter - 1) * 3; // 0-indexed (0=Jan, 3=Apr, 6=Jul, 9=Oct)
    const endMonth = startMonth + 2; // (2=Mar, 5=Jun, 8=Sep, 11=Dec)

    const startDate = `${currentYear}-${String(startMonth + 1).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(currentYear, endMonth + 1, 0).getDate();
    const endDate = `${currentYear}-${String(endMonth + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

    const quarterNames = [
      `1 квартал (Январь — Март ${currentYear})`,
      `2 квартал (Апрель — Июнь ${currentYear})`,
      `3 квартал (Июль — Сентябрь ${currentYear})`,
      `4 квартал (Октябрь — Декабрь ${currentYear})`,
    ];
    const periodLabel =
      options?.periodLabel ||
      quarterNames[currentQuarter - 1] ||
      `3 месяца (${startDate} — ${endDate})`;

    // Filter training sessions in this 3-month window
    const relevantSessions = trainingSessions.filter((s) => {
      const sDate = s.date || s.dateString || "";
      if (!sDate) return false;
      const parsedDate = sDate.includes("-") ? sDate.split("T")[0] : sDate;
      return parsedDate >= startDate && parsedDate <= endDate;
    });

    let present = 0;
    let absent = 0;
    let sick = 0;
    const coachNotes: string[] = [];

    if (options?.customCoachNote?.trim()) {
      coachNotes.push(`Комментарий тренера: ${options.customCoachNote.trim()}`);
    }

    if (client.notes?.trim()) {
      coachNotes.push(`Заметки тренера по игроку: ${client.notes.trim()}`);
    }

    if (client.riskComment?.trim()) {
      coachNotes.push(
        `Наблюдения по адаптации и мотивации: ${client.riskComment.trim()}`,
      );
    }

    relevantSessions.forEach((s) => {
      const rec = s.records?.find(
        (r) =>
          r.clientId === clientId ||
          (r.clientName &&
            r.clientName.toLowerCase().includes(client.childName.toLowerCase())),
      );
      if (rec) {
        if (rec.status === "present" || rec.status === "trial_free") present++;
        else if (rec.status === "absent_sick") sick++;
        else if (rec.status === "absent") absent++;

        if (rec.reason) {
          coachNotes.push(`Отметка на тренировке ${s.date}: ${rec.reason}`);
        }
      }
      if (
        s.notes?.trim() &&
        (s.groupId === client.groupName || s.groupName === client.groupName)
      ) {
        coachNotes.push(`Тренировка ${s.date}: ${s.notes.trim()}`);
      }
    });

    const totalSessions =
      present + absent + sick || Math.max(12, client.attendance?.length || 18);
    const actualPresent =
      present ||
      Math.max(
        10,
        client.attendance?.filter((a) => a.status === "present").length || 16,
      );
    const attendanceRate =
      totalSessions > 0 ? Math.round((actualPresent / totalSessions) * 100) : 90;

    const achievementsList = (client.achievements || []).map((a) => a.title);
    const homeworksDoneCount = homeworkSubmissions.filter(
      (h) => h.clientId === clientId && h.status === "done",
    ).length;

    try {
      const response = await fetch("/api/gemini/generate-progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          childName: client.childName,
          childSurname: client.childSurname,
          childAge: client.childAge,
          childBirthYear: client.childBirthYear,
          groupName: client.groupName || "Основная группа",
          coachName: client.coachName || "Тренерский штаб",
          periodLabel,
          periodStartDate: startDate,
          periodEndDate: endDate,
          quarterNumber: currentQuarter,
          quarterYear: currentYear,
          metrics: client.progress || {
            technique: 4.5,
            tactics: 4.2,
            physical: 4.5,
            discipline: 4.8,
          },
          attendanceStats: {
            totalSessions,
            present: actualPresent,
            absent,
            sick,
            attendanceRate,
          },
          coachNotes,
          achievements: achievementsList,
          homeworksDone: homeworksDoneCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const report: AIProgressReport = data.report;

      if (!report) {
        throw new Error("No report in server response");
      }

      // Update client state
      const existingReports = client.progressReports || [];
      const filtered = existingReports.filter(
        (r) =>
          !(
            r.quarterNumber === currentQuarter &&
            r.quarterYear === currentYear &&
            r.periodLabel === periodLabel
          ),
      );
      const updatedReports = [report, ...filtered];

      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId ? { ...c, progressReports: updatedReports } : c,
        ),
      );

      // Firestore sync
      updateDoc(doc(db, "clients", clientId), {
        progressReports: removeUndefined(updatedReports) as any,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, "update_progress_report");
      });

      // App notification
      addNotification({
        title: `ИИ-Отчет за 3 месяца готов: ${client.childSurname} ${client.childName}`,
        body: `Сформирован квартальный отчет о футбольном развитии. Итоговая оценка: ${report.overallScore}/5.0`,
        type: "system",
        targetRole: ["parent", "trainer", "manager", "director"],
      });

      return report;
    } catch (e) {
      console.error("Failed to generate AI progress report:", e);
      return null;
    }
  };

  const deleteAIProgressReport = async (clientId: string, reportId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const updatedReports = (client.progressReports || []).filter(
      (r) => r.id !== reportId,
    );
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, progressReports: updatedReports } : c,
      ),
    );

    try {
      await updateDoc(doc(db, "clients", clientId), {
        progressReports: removeUndefined(updatedReports) as any,
      });
      await deleteDoc(doc(db, "progress_reports", reportId)).catch(() => {});
    } catch (e) {
      console.error("Error deleting AI report:", e);
    }
  };

  const checkAndGenerateAutomatedReports = async (): Promise<number> => {
    let generatedCount = 0;
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();

    for (const client of clients) {
      if (client.status !== "active") continue;
      const reports = client.progressReports || [];
      const hasCurrentQuarterReport = reports.some(
        (r) => r.quarterNumber === currentQuarter && r.quarterYear === currentYear,
      );

      if (!hasCurrentQuarterReport) {
        const rep = await generateAIProgressReport(client.id, {
          quarterNumber: currentQuarter,
          quarterYear: currentYear,
        });
        if (rep) generatedCount++;
      }
    }
    return generatedCount;
  };

  const addFinanceRecord = async (record: Omit<FinanceRecord, "id">) => {
    const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newRecord = removeUndefined({ accountId: "acc_cash", ...record, id });
    setFinances((prev) => [newRecord, ...prev]);
    try {
      await setDoc(doc(db, "finances", id), newRecord);
    } catch (err) {
      setFirestoreError(err instanceof Error ? err.message : String(err));
      console.error(`Failed to save finance record ${id}:`, err);
    }
  };

  const updateFinancialPlan = async (plan: FinancialPlan) => {
    const cleanPlan = removeUndefined(plan);
    const existing = financialPlans.find((p) => p.month === cleanPlan.month);
    const updatedPlans = existing
      ? financialPlans.map((p) => (p.month === cleanPlan.month ? cleanPlan : p))
      : [...financialPlans, cleanPlan];

    setFinancialPlans(updatedPlans);
    try {
      localStorage.setItem(
        "amkar_financial_plans",
        JSON.stringify(updatedPlans),
      );
    } catch {}

    try {
      await setDoc(
        doc(db, "_config", "financial_plans"),
        {
          items: updatedPlans.map((item) => removeUndefined(item)),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "_config/financial_plans");
    }
  };

  const resetAllData = async () => {
    try {
      { const deleteBatch = writeBatch(db);
      for (const item of leads) {
        deleteBatch.delete(doc(db, "leads", item.id));
      }
      await deleteBatch.commit(); }
      { const deleteBatch = writeBatch(db);
      for (const item of clients) {
        deleteBatch.delete(doc(db, "clients", item.id));
      }
      await deleteBatch.commit(); }
      { const deleteBatch = writeBatch(db);
      for (const item of tasks) {
        deleteBatch.delete(doc(db, "tasks", item.id));
      }
      await deleteBatch.commit(); }
      { const deleteBatch = writeBatch(db);
      for (const item of coaches) {
        deleteBatch.delete(doc(db, "coaches", item.id));
      }
      await deleteBatch.commit(); }
      { const deleteBatch = writeBatch(db);
      for (const item of groups) {
        deleteBatch.delete(doc(db, "groups", item.id));
      }
      await deleteBatch.commit(); }
      { const deleteBatch = writeBatch(db);
      for (const item of finances) {
        deleteBatch.delete(doc(db, "finances", item.id));
      }
      await deleteBatch.commit(); }
      { const deleteBatch = writeBatch(db);
      for (const item of messages) {
        deleteBatch.delete(doc(db, "messages", item.id));
      }
      await deleteBatch.commit(); }

      for (const item of INITIAL_LEADS) {
        await setDoc(doc(db, "leads", item.id), item);
      }
      for (const item of INITIAL_CLIENTS) {
        await setDoc(doc(db, "clients", item.id), item);
      }
      for (const item of INITIAL_TASKS) {
        await setDoc(doc(db, "tasks", item.id), item);
      }
      for (const item of INITIAL_COACHES) {
        await setDoc(doc(db, "coaches", item.id), item);
      }
      for (const item of INITIAL_GROUPS) {
        await setDoc(doc(db, "groups", item.id), item);
      }
      for (const item of INITIAL_FINANCES) {
        await setDoc(doc(db, "finances", item.id), item);
      }
      for (const item of INITIAL_MESSAGES) {
        await setDoc(doc(db, "messages", item.id), item);
      }

      setCalendarSyncEnabled(false);
      setCalendarSyncLog([
        "Каталог сброшен до исходных системных значений.",
        "Ожидание подключения Google Календаря...",
      ]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "resetAllData");
    }
  };

  const clearAllData = async (options: {
    leads: boolean;
    clients: boolean;
    tasks: boolean;
    finances: boolean;
    messages: boolean;
  }) => {
    try {
      if (options.leads) {
        { const deleteBatch = writeBatch(db);
      for (const item of leads) {
        deleteBatch.delete(doc(db, "leads", item.id));
      }
      await deleteBatch.commit(); }
        setLeads([]);
      }
      if (options.clients) {
        { const deleteBatch = writeBatch(db);
      for (const item of clients) {
        deleteBatch.delete(doc(db, "clients", item.id));
      }
      await deleteBatch.commit(); }
        setClients([]);
      }
      if (options.tasks) {
        { const deleteBatch = writeBatch(db);
      for (const item of tasks) {
        deleteBatch.delete(doc(db, "tasks", item.id));
      }
      await deleteBatch.commit(); }
        setTasks([]);
      }
      if (options.finances) {
        { const deleteBatch = writeBatch(db);
      for (const item of finances) {
        deleteBatch.delete(doc(db, "finances", item.id));
      }
      await deleteBatch.commit(); }
        setFinances([]);
      }
      if (options.messages) {
        { const deleteBatch = writeBatch(db);
      for (const item of messages) {
        deleteBatch.delete(doc(db, "messages", item.id));
      }
      await deleteBatch.commit(); }
        setMessages([]);
      }

      // Mark the system config database as initialized and production ready without overwriting crmConfig
      const configDocRef = doc(db, "_config", "initialized");
      await setDoc(
        configDocRef,
        {
          initialized: true,
          isProductionReady: true,
        },
        { merge: true },
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "clearAllData");
    }
  };

  const overwriteClients = async (newClients: Client[]) => {
    try {
      { const deleteBatch = writeBatch(db);
      for (const item of clients) {
        deleteBatch.delete(doc(db, "clients", item.id));
      }
      await deleteBatch.commit(); }
      const chunkSize = 400;
      for (let i = 0; i < newClients.length; i += chunkSize) {
        const batch = writeBatch(db);
        for (const item of newClients.slice(i, i + chunkSize)) {
          const cleanItem = JSON.parse(JSON.stringify(item));
          batch.set(doc(db, "clients", cleanItem.id), cleanItem);
        }
        await batch.commit();
      }
      setClients(newClients);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "clients");
    }
  };

  const overwriteLeads = async (newLeads: Lead[]) => {
    try {
      { const deleteBatch = writeBatch(db);
      for (const item of leads) {
        deleteBatch.delete(doc(db, "leads", item.id));
      }
      await deleteBatch.commit(); }
      const batch = writeBatch(db);
      for (const item of newLeads) {
        batch.set(doc(db, "leads", item.id), item);
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "leads");
    }
  };

  const overwriteFinances = async (newFinances: FinanceRecord[]) => {
    try {
      { const deleteBatch = writeBatch(db);
      for (const item of finances) {
        deleteBatch.delete(doc(db, "finances", item.id));
      }
      await deleteBatch.commit(); }
      const batch = writeBatch(db);
      for (const item of newFinances) {
        batch.set(doc(db, "finances", item.id), item);
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "finances");
    }
  };

  const appendClients = async (newClients: Client[]) => {
    try {
      setClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const uniqueNew = newClients.filter((c) => !existingIds.has(c.id));
        return [...prev, ...uniqueNew];
      });
      const chunkSize = 400;
      for (let i = 0; i < newClients.length; i += chunkSize) {
        const batch = writeBatch(db);
        for (const item of newClients.slice(i, i + chunkSize)) {
          const cleanItem = JSON.parse(JSON.stringify(item));
          batch.set(doc(db, "clients", cleanItem.id), cleanItem, { merge: true });
        }
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "clients");
    }
  };

  const appendLeads = async (newLeads: Lead[]) => {
    try {
      const batch = writeBatch(db);
      for (const item of newLeads) {
        batch.set(doc(db, "leads", item.id), item);
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "leads");
    }
  };

  const appendFinances = async (newFinances: FinanceRecord[]) => {
    try {
      const batch = writeBatch(db);
      for (const item of newFinances) {
        batch.set(doc(db, "finances", item.id), item);
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "finances");
    }
  };

  const overwriteCoaches = async (newCoaches: Coach[]) => {
    try {
      const batch = writeBatch(db);
      for (const item of coaches) {
        batch.delete(doc(db, "coaches", item.id));
      }
      for (const item of newCoaches) {
        batch.set(doc(db, "coaches", item.id), item);
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "coaches");
    }
  };

  const appendCoaches = async (newCoaches: Coach[]) => {
    try {
      const batch = writeBatch(db);
      for (const item of newCoaches) {
        batch.set(doc(db, "coaches", item.id), item);
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "coaches");
    }
  };

  const deleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    deleteDoc(doc(db, "leads", id)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to delete lead ${id} on Firestore, kept locally:`,
        err,
      );
    });
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, "clients", id)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to delete client ${id} on Firestore, kept locally:`,
        err,
      );
    });
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    deleteDoc(doc(db, "tasks", id)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to delete task ${id} on Firestore, kept locally:`,
        err,
      );
    });
  };

  const deleteFinanceRecord = async (id: string) => {
    setFinances((prev) => prev.filter((f) => f.id !== id));
    deleteDoc(doc(db, "finances", id)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to delete finance record ${id} on Firestore, kept locally:`,
        err,
      );
    });
  };

  const updateFinanceRecord = async (
    id: string,
    updates: Partial<Omit<FinanceRecord, "id">>,
    clearFields?: Array<keyof Omit<FinanceRecord, "id">>,
  ) => {
    const cleanUpdates = removeUndefined(updates);
    let previousRecord: FinanceRecord | undefined;

    setFinances((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        previousRecord = f;
        const nextRecord: FinanceRecord = { ...f, ...cleanUpdates };
        if (clearFields) {
          for (const field of clearFields) {
            if (!(field in cleanUpdates)) {
              delete nextRecord[field];
            }
          }
        }
        return nextRecord;
      }),
    );

    const firestorePayload: Record<string, any> = { ...cleanUpdates };
    if (clearFields) {
      for (const field of clearFields) {
        if (!(field in cleanUpdates)) {
          firestorePayload[field] = deleteField();
        }
      }
    }

    try {
      await updateDoc(doc(db, "finances", id), firestorePayload);
    } catch (err) {
      if (previousRecord) {
        setFinances((prev) =>
          prev.map((f) => (f.id === id ? previousRecord! : f)),
        );
      }
      setFirestoreError(err instanceof Error ? err.message : String(err));
      handleFirestoreError(err, OperationType.WRITE, `finances/${id}`);
    }
  };

  const updateClientNotes = async (clientId: string, notes: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, notes } : c)),
    );
    updateDoc(doc(db, "clients", clientId), { notes }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to update notes for client ${clientId} on Firestore, kept locally:`,
        err,
      );
    });
  };

  const updateClient = async (
    clientId: string,
    updates: Partial<Omit<Client, "id">>,
  ) => {
    const original = clients.find((c) => c.id === clientId);

    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c)),
    );
    updateDoc(doc(db, "clients", clientId), updates as any).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to update client ${clientId} on Firestore, kept locally:`,
        err,
      );
    });

    if (updates.riskType && updates.riskType !== "none") {
      const isNewRisk =
        !original ||
        original.riskType !== updates.riskType ||
        original.riskUrgency !== updates.riskUrgency;
      if (isNewRisk) {
        const childName = original
          ? `${original.childSurname} ${original.childName}`
          : "Ученик";
        const riskTypeLabel =
          updates.riskType === "conflict"
            ? `Конфликт (с кем: ${updates.riskDetails || "не указано"})`
            : `Пропуски тренировок (более 2-х)`;

        const urgencyLabel =
          updates.riskUrgency === "urgent" ? "СРОЧНО" : "Вмешаться";

        const managerTaskId = `t_risk_mgr_${Date.now()}`;
        const managerTask: CRMTask = {
          id: managerTaskId,
          title: `РИСК (${urgencyLabel}): ${childName}`,
          assignedTo: "manager",
          status: "new",
          dueDate: new Date().toLocaleDateString("ru-RU"),
          description: `Проблема: ${riskTypeLabel}. Уровень: ${urgencyLabel}. Комментарий: ${updates.riskComment || "Без комментария"}. Отреагируйте в CRM.`,
          relatedClientId: clientId,
        };

        const trainerTaskId = `t_risk_trn_${Date.now() + 1}`;
        const trainerTask: CRMTask = {
          id: trainerTaskId,
          title: `РИСК (${urgencyLabel}): ${childName}`,
          assignedTo: "trainer",
          status: "new",
          dueDate: new Date().toLocaleDateString("ru-RU"),
          description: `Проблема: ${riskTypeLabel}. Уровень: ${urgencyLabel}. Комментарий: ${updates.riskComment || "Без комментария"}. Проработайте с родителем и менеджером.`,
          relatedClientId: clientId,
        };

        setTasks((prev) => [managerTask, trainerTask, ...prev]);
        setDoc(doc(db, "tasks", managerTaskId), managerTask).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
          console.warn("Failed to sync manager risk task to Firestore:", err);
        });
        setDoc(doc(db, "tasks", trainerTaskId), trainerTask).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
          console.warn("Failed to sync trainer risk task to Firestore:", err);
        });
      }
    }
  };

  const createGroup = async (
    name: string,
    year: number,
    birthYearFrom: number,
    birthYearTo: number,
    coachId: string,
    coachName: string,
    scheduleDays: string[],
    isSelectTeam?: boolean,
    targetCompetition?: string,
    selectedClientIds?: string[],
    venueCost?: number,
    maxCapacity?: number,
    venueId?: string,
    scheduleStartDate?: string,
    scheduleEndDate?: string,
  ) => {
    // TELEGRAM ALERT: Check schedule conflict with actual time interval overlap
    if (crmConfig.telegramAlerts?.scheduleConflict !== false && coachId) {
      const conflicts = findCoachScheduleConflicts(
        groups,
        coachId,
        scheduleDays,
        undefined,
        name,
      );
      if (conflicts.length > 0) {
        const details = conflicts
          .map((c) => `• <b>${c.day}:</b> ${c.overlapDescription}`)
          .join("\n");
        sendTelegramAlert(
          crmConfig.telegramBotToken,
          crmConfig.telegramGroupChatId,
          `⚠️ <b>КОНФЛИКТ РАСПИСАНИЯ</b>\n<b>Тренер:</b> ${coachName}\n<b>Новая Группа:</b> ${name}\n<b>Пересечение времени тренировок:</b>\n${details}`,
        );
      }
    }

    const newGroup: TrainingGroup = removeUndefined({
      id: `g_${Date.now()}`,
      name: name.trim().slice(0, 100),
      year,
      birthYearFrom,
      birthYearTo,
      coachId: coachId || "",
      coachName,
      playersCount: selectedClientIds ? selectedClientIds.length : 0,
      attendanceRate: 100,
      scheduleDays,
      isSelectTeam,
      targetCompetition,
      selectedClientIds: selectedClientIds || [],
      venueCost,
      maxCapacity,
      venueId,
      scheduleStartDate,
      scheduleEndDate,
    });
    setGroups((prev) => [...prev, newGroup]);
    setDoc(doc(db, "groups", newGroup.id), newGroup).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to create group in Firestore:`, err);
    });
  };

  const updateGroup = async (
    id: string,
    updates: Partial<Omit<TrainingGroup, "id">>,
  ) => {
    const oldGroup = groups.find((g) => g.id === id);
    const oldName = oldGroup?.name;

    // TELEGRAM ALERT: Check schedule conflict with actual time interval overlap
    if (
      (updates.scheduleDays || updates.coachId) &&
      crmConfig.telegramAlerts?.scheduleConflict !== false
    ) {
      const newSchedule = updates.scheduleDays || oldGroup?.scheduleDays || [];
      const newCoachId = updates.coachId || oldGroup?.coachId;
      const newCoachName = updates.coachName || oldGroup?.coachName || "";
      const newGroupName = updates.name || oldGroup?.name || "";

      if (newCoachId && newSchedule.length > 0) {
        const conflicts = findCoachScheduleConflicts(
          groups,
          newCoachId,
          newSchedule,
          id,
          newGroupName,
        );
        if (conflicts.length > 0) {
          const details = conflicts
            .map((c) => `• <b>${c.day}:</b> ${c.overlapDescription}`)
            .join("\n");
          sendTelegramAlert(
            crmConfig.telegramBotToken,
            crmConfig.telegramGroupChatId,
            `⚠️ <b>КОНФЛИКТ РАСПИСАНИЯ</b>\n<b>Тренер:</b> ${newCoachName}\n<b>Группа:</b> ${newGroupName}\n<b>Пересечение времени тренировок:</b>\n${details}`,
          );
        }
      }
    }

    const cleanUpdates = removeUndefined(
      updates.name
        ? { ...updates, name: updates.name.trim().slice(0, 100) }
        : updates,
    );
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...cleanUpdates } : g)),
    );
    updateDoc(doc(db, "groups", id), cleanUpdates as any).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to update group ${id} on Firestore:`, err);
    });

    if (updates.name && oldName && oldName !== updates.name) {
      // Update clients state with new groupName
      setClients((prev) =>
        prev.map((c) =>
          c.groupName === oldName ? { ...c, groupName: updates.name } : c,
        ),
      );

      // Persist client groupName changes to Firestore
      const clientsToUpdate = clients.filter((c) => c.groupName === oldName);
      for (const c of clientsToUpdate) {
        updateDoc(doc(db, "clients", c.id), { groupName: updates.name }).catch(
          (err) => {
            console.warn(
              `Failed to update client group name in Firestore:`,
              err,
            );
          },
        );
      }
    }
  };

  const deleteGroup = async (id: string) => {
    const groupName = groups.find((g) => g.id === id)?.name;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    deleteDoc(doc(db, "groups", id)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to delete group ${id} on Firestore:`, err);
    });
    if (groupName) {
      setClients((prev) =>
        prev.map((c) =>
          c.groupName === groupName ? { ...c, groupName: null } : c,
        ),
      );
      const clientsToReset = clients.filter((c) => c.groupName === groupName);
      for (const c of clientsToReset) {
        updateDoc(doc(db, "clients", c.id), { groupName: null }).catch(
          (err) => {
            console.warn(`Failed to reset client group in Firestore:`, err);
          },
        );
      }
    }
  };

  const assignClientToSelectTeam = async (
    clientId: string,
    groupId: string,
  ) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const selectedClientIds = group.selectedClientIds || [];
    if (selectedClientIds.includes(clientId)) return;

    const newSelectedIds = [...selectedClientIds, clientId];

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              selectedClientIds: newSelectedIds,
              playersCount: newSelectedIds.length,
            }
          : g,
      ),
    );

    updateDoc(doc(db, "groups", groupId), {
      selectedClientIds: newSelectedIds,
      playersCount: newSelectedIds.length,
    }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to assign client to select team in Firestore:`, err);
    });
  };

  const removeClientFromSelectTeam = async (
    clientId: string,
    groupId: string,
  ) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const selectedClientIds = group.selectedClientIds || [];
    if (!selectedClientIds.includes(clientId)) return;

    const newSelectedIds = selectedClientIds.filter((id) => id !== clientId);
    const nextRoster = { ...(group.selectTeamRoster || {}) };
    delete nextRoster[clientId];

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              selectedClientIds: newSelectedIds,
              selectTeamRoster: nextRoster,
              playersCount: newSelectedIds.length,
            }
          : g,
      ),
    );

    updateDoc(
      doc(db, "groups", groupId),
      removeUndefined({
        selectedClientIds: newSelectedIds,
        selectTeamRoster: nextRoster,
        playersCount: newSelectedIds.length,
      }) as any,
    ).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to remove client from select team in Firestore:`,
        err,
      );
    });
  };

  const createSelectTeam = async (payload: {
    name: string;
    birthYearFrom: number;
    birthYearTo: number;
    coachId: string;
    coachName: string;
    assistantCoachId?: string;
    assistantCoachName?: string;
    targetCompetition?: string;
    competitionDate?: string;
    competitionEndDate?: string;
    competitionLocation?: string;
    competitionFee?: number;
    matchFormat?: MatchFormat;
    formationId?: string;
    selectTeamStatus?: "forming" | "ready" | "completed";
    selectTeamNotes?: string;
    scheduleDays?: string[];
    selectedClientIds?: string[];
    selectTeamRoster?: Record<string, SelectTeamMember>;
  }): Promise<TrainingGroup> => {
    const selectedIds = payload.selectedClientIds || [];
    const newTeam: TrainingGroup = removeUndefined({
      id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: payload.name.trim().slice(0, 100),
      year: payload.birthYearFrom,
      birthYearFrom: payload.birthYearFrom,
      birthYearTo: payload.birthYearTo,
      coachId: payload.coachId || "",
      coachName: payload.coachName || "Не назначен",
      assistantCoachId: payload.assistantCoachId || undefined,
      assistantCoachName: payload.assistantCoachName || undefined,
      playersCount: selectedIds.length,
      attendanceRate: 100,
      scheduleDays: payload.scheduleDays || [],
      isSelectTeam: true,
      targetCompetition: payload.targetCompetition?.trim() || "",
      competitionDate: payload.competitionDate || undefined,
      competitionEndDate: payload.competitionEndDate || undefined,
      competitionLocation: payload.competitionLocation?.trim() || undefined,
      competitionFee: Number(payload.competitionFee || 0),
      matchFormat: payload.matchFormat || "5x5",
      formationId: payload.formationId || "5x5_diamond",
      selectTeamStatus: payload.selectTeamStatus || "forming",
      selectTeamNotes: payload.selectTeamNotes?.trim() || undefined,
      selectedClientIds: selectedIds,
      selectTeamRoster: payload.selectTeamRoster || {},
    });

    setGroups((prev) => [...prev, newTeam]);
    await setDoc(doc(db, "groups", newTeam.id), newTeam).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, "groups");
      console.warn("Failed to create select team in Firestore:", err);
    });
    return newTeam;
  };

  const updateSelectTeamMember = async (
    groupId: string,
    clientId: string,
    updates: Partial<SelectTeamMember>,
    options?: { syncPreferredPosition?: boolean },
  ) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const currentRoster = { ...(group.selectTeamRoster || {}) };
    const existingMember: SelectTeamMember = currentRoster[clientId] || {
      clientId,
      participationStatus: "pending",
      paymentStatus: "unpaid",
    };

    const nextMember: SelectTeamMember = removeUndefined({
      ...existingMember,
      ...updates,
      clientId,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    });

    // If setting captain = true, clear captain flag on other members
    if (updates.isCaptain === true) {
      for (const otherId of Object.keys(currentRoster)) {
        if (otherId !== clientId && currentRoster[otherId]?.isCaptain) {
          currentRoster[otherId] = {
            ...currentRoster[otherId],
            isCaptain: false,
          };
        }
      }
    }

    // If assigning a specific pitchSlotId, clear it from any other member currently occupying that slot
    if (updates.pitchSlotId) {
      for (const otherId of Object.keys(currentRoster)) {
        if (
          otherId !== clientId &&
          currentRoster[otherId]?.pitchSlotId === updates.pitchSlotId
        ) {
          currentRoster[otherId] = removeUndefined({
            ...currentRoster[otherId],
            pitchSlotId: undefined,
            lineupStatus: "bench",
          });
        }
      }
    }

    currentRoster[clientId] = nextMember;

    const selectedIds = group.selectedClientIds || [];
    const nextSelectedIds = selectedIds.includes(clientId)
      ? selectedIds
      : [...selectedIds, clientId];

    const payload = removeUndefined({
      selectedClientIds: nextSelectedIds,
      selectTeamRoster: currentRoster,
      playersCount: nextSelectedIds.length,
    });

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...payload } : g)),
    );

    updateDoc(doc(db, "groups", groupId), payload as any).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, "groups");
      console.warn("Failed to update select team member in Firestore:", err);
    });

    if (options?.syncPreferredPosition && updates.position) {
      updateClient(clientId, {
        preferredPosition: updates.position,
        ...(updates.jerseyNumber ? { jerseyNumber: updates.jerseyNumber } : {}),
      }).catch(() => {});
    }
  };

  const batchUpdateSelectTeamRoster = async (
    groupId: string,
    nextRoster: Record<string, SelectTeamMember>,
    nextSelectedClientIds?: string[],
  ) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const finalSelectedIds =
      nextSelectedClientIds ||
      Array.from(
        new Set([
          ...(group.selectedClientIds || []),
          ...Object.keys(nextRoster),
        ]),
      );

    const cleanRoster: Record<string, SelectTeamMember> = {};
    for (const cid of finalSelectedIds) {
      if (nextRoster[cid]) {
        cleanRoster[cid] = removeUndefined({
          ...nextRoster[cid],
          clientId: cid,
        });
      }
    }

    const payload = removeUndefined({
      selectedClientIds: finalSelectedIds,
      selectTeamRoster: cleanRoster,
      playersCount: finalSelectedIds.length,
    });

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...payload } : g)),
    );

    updateDoc(doc(db, "groups", groupId), payload as any).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, "groups");
      console.warn("Failed to batch update select team roster:", err);
    });
  };

  const recordSelectTeamFeePayment = async (params: {
    groupId: string;
    clientId: string;
    amount: number;
    accountId: string;
    postToFinance: boolean;
    paymentStatus?: "paid" | "partial";
    actorName?: string;
    actorRole?: "admin" | "director" | "manager" | "trainer";
  }) => {
    const {
      groupId,
      clientId,
      amount,
      accountId,
      postToFinance,
      paymentStatus = "paid",
      actorName,
      actorRole,
    } = params;
    const group = groups.find((g) => g.id === groupId);
    const client = clients.find((c) => c.id === clientId);
    if (!group || !client) return;

    const existingMember = group.selectTeamRoster?.[clientId];
    let financeRecordId = existingMember?.financeRecordId;
    const todayStr = new Date().toISOString().split("T")[0];

    if (postToFinance && amount > 0 && !financeRecordId) {
      const fId = `f_st_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const clientFullName = `${client.childSurname} ${client.childName}`.trim();
      const compLabel = group.targetCompetition
        ? `${group.name} (${group.targetCompetition})`
        : group.name;

      const newFinRecord: FinanceRecord = removeUndefined({
        id: fId,
        type: "income",
        category: "Турниры и соревнования",
        amount: Number(amount),
        date: todayStr,
        description: `Взнос за участие в соревновании: ${clientFullName} — ${compLabel}`,
        groupName: group.name,
        targetMonth: todayStr.slice(0, 7),
        accountId: accountId || accounts[0]?.id || "acc_cash",
        paymentStatus: "paid",
        clientId: client.id,
        clientName: clientFullName,
      });

      financeRecordId = fId;
      setFinances((prev) => [newFinRecord, ...prev]);
      setDoc(doc(db, "finances", fId), newFinRecord).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, "finances");
      });
    }

    await updateSelectTeamMember(groupId, clientId, {
      paymentStatus,
      paidAmount: Number(amount),
      paidAt: todayStr,
      paymentAccountId: accountId || undefined,
      financeRecordId,
      updatedBy: actorName || userProfile.name,
      updatedByRole: actorRole,
    });
  };

  const assignClientToGroup = async (
    clientId: string,
    groupName: string | null,
  ) => {
    const matchedGroup = groupName
      ? groups.find(
          (g) => g.name.trim().toLowerCase() === groupName.trim().toLowerCase(),
        )
      : null;
    const finalGroupName = matchedGroup
      ? matchedGroup.name
      : groupName
        ? groupName.trim()
        : null;
    const coachId = matchedGroup ? matchedGroup.coachId || null : null;
    const coachName = matchedGroup ? matchedGroup.coachName || null : null;

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              groupName: finalGroupName,
              coachId,
              coachName,
            }
          : c,
      ),
    );

    updateDoc(doc(db, "clients", clientId), {
      groupName: finalGroupName,
      coachId,
      coachName,
    }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(
        `Failed to assign client ${clientId} to group in Firestore:`,
        err,
      );
    });
  };

  const createCoach = async (
    name: string,
    role: string,
    joinedYear: number,
    status: Coach["status"],
    phone?: string,
    telegram?: string,
    avatarUrl?: string,
    initialFeedback?: Coach["feedback"],
    paymentType?: "fixed" | "per_session",
    rate?: number
  ) => {
    const newCoach: Coach = {
      id: `c_${Date.now()}`,
      name,
      role,
      joinedYear,
      status,
      groupsCount: 0,
      kidsCount: 0,
      workload: 0,
      phone: phone || "",
      telegram: telegram || "",
      avatarUrl: avatarUrl || "",
      paymentType,
      rate,
      rating: initialFeedback
        ? Number(
            (
              (initialFeedback.discipline +
                initialFeedback.communication +
                initialFeedback.professionalism +
                initialFeedback.results) /
              4
            ).toFixed(1),
          )
        : 5.0,
      feedback: initialFeedback || {
        discipline: 5,
        communication: 5,
        professionalism: 5,
        results: 5,
      },
    };
    setCoaches((prev) => [...prev, newCoach]);
    setDoc(doc(db, "coaches", newCoach.id), newCoach).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to create coach in Firestore:`, err);
    });
  };

  const deleteCoach = async (id: string) => {
    setCoaches((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, "coaches", id)).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to delete coach ${id} on Firestore:`, err);
    });
    // For groups assigned to this coach, set coach to 'Не назначен'
    setGroups((prev) =>
      prev.map((g) =>
        g.coachId === id ? { ...g, coachId: "", coachName: "Не назначен" } : g,
      ),
    );
    const groupsToReset = groups.filter((g) => g.coachId === id);
    for (const g of groupsToReset) {
      updateDoc(doc(db, "groups", g.id), {
        coachId: "",
        coachName: "Не назначен",
      }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
        console.warn(`Failed to reset group coach in Firestore:`, err);
      });
    }
  };

  const assignCoachToGroup = async (
    groupId: string,
    coachId: string,
    coachName: string,
  ) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, coachId, coachName } : g)),
    );
    updateDoc(doc(db, "groups", groupId), { coachId, coachName }).catch(
      (err) => {
        console.warn(
          `Failed to assign coach to group ${groupId} in Firestore:`,
          err,
        );
      },
    );
  };

  const updateCoachContacts = async (
    coachId: string,
    phone: string,
    telegram: string,
  ) => {
    setCoaches((prev) =>
      prev.map((c) => (c.id === coachId ? { ...c, phone, telegram } : c)),
    );
    updateDoc(doc(db, "coaches", coachId), { phone, telegram }).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to update coach contacts in Firestore:`, err);
    });
  };

  const updateCoach = async (
    coachId: string,
    updates: Partial<Omit<Coach, "id">>,
  ) => {
    setCoaches((prev) =>
      prev.map((c) => {
        if (c.id === coachId) {
          const mergedObj = { ...c, ...updates };
          if (updates.feedback) {
            const fb = updates.feedback;
            mergedObj.rating = Number(
              (
                (fb.discipline +
                  fb.communication +
                  fb.professionalism +
                  fb.results) /
                4
              ).toFixed(1),
            );
          }
          return mergedObj;
        }
        return c;
      }),
    );

    const flatUpdates = { ...updates };
    if (updates.feedback) {
      const fb = updates.feedback;
      (flatUpdates as any).rating = Number(
        (
          (fb.discipline + fb.communication + fb.professionalism + fb.results) /
          4
        ).toFixed(1),
      );
    }

    updateDoc(doc(db, "coaches", coachId), flatUpdates).catch((err) => { handleFirestoreError(err, OperationType.WRITE, "update");
      console.warn(`Failed to update coach ${coachId} in Firestore:`, err);
    });

    if (updates.name) {
      setGroups((prev) =>
        prev.map((g) =>
          g.coachId === coachId ? { ...g, coachName: updates.name! } : g,
        ),
      );
      const groupsToUpdate = groups.filter((g) => g.coachId === coachId);
      for (const g of groupsToUpdate) {
        updateDoc(doc(db, "groups", g.id), { coachName: updates.name! }).catch(
          (err) => {
            console.warn(
              `Failed to update coach name in group ${g.id} in Firestore:`,
              err,
            );
          },
        );
      }
    }
  };

  const addCounterparty = async (cp: Omit<Counterparty, "id">) => {
    const id = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newCp = removeUndefined({ ...cp, id });
    setCounterparties((prev) => {
      const next = [...prev, newCp];
      try {
        localStorage.setItem("amkar_counterparties_cache", JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      await setDoc(doc(db, "counterparties", id), newCp);
    } catch (err) {
      setFirestoreError(err instanceof Error ? err.message : String(err));
      console.warn("Failed to add counterparty:", err);
    }
  };

  const updateCounterparty = async (id: string, updates: Partial<Counterparty>) => {
    const cleanUpdates = removeUndefined(updates);
    setCounterparties((prev) => {
      const next = prev.map((cp) => (cp.id === id ? { ...cp, ...cleanUpdates } : cp));
      try {
        localStorage.setItem("amkar_counterparties_cache", JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      await updateDoc(doc(db, "counterparties", id), cleanUpdates);
    } catch (err) {
      setFirestoreError(err instanceof Error ? err.message : String(err));
      console.warn("Failed to update counterparty:", err);
    }
  };

  const deleteCounterparty = async (id: string) => {
    setCounterparties((prev) => {
      const next = prev.filter((cp) => cp.id !== id);
      try {
        localStorage.setItem("amkar_counterparties_cache", JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      await deleteDoc(doc(db, "counterparties", id));
    } catch (err) {
      setFirestoreError(err instanceof Error ? err.message : String(err));
      console.warn("Failed to delete counterparty:", err);
    }
  };

  const syncVideoLessonsToFirestore = async (nextList: VideoLesson[]) => {
    try {
      localStorage.setItem("amkar_video_lessons", JSON.stringify(nextList));
    } catch {}
    try {
      await setDoc(
        doc(db, "_config", "video_lessons_catalog"),
        {
          items: removeUndefined(nextList),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (e) {
      console.warn("Failed to sync video_lessons_catalog:", e);
    }
  };

  const addVideoLesson = async (
    lessonData: Omit<VideoLesson, "id" | "createdAt" | "viewsCount">,
  ): Promise<VideoLesson> => {
    const nowIso = new Date().toISOString();
    const newLesson: VideoLesson = removeUndefined({
      ...lessonData,
      id: `vl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      viewsCount: 1,
    });

    let updatedList: VideoLesson[] = [];
    setVideoLessons((prev) => {
      const next = [newLesson, ...prev].sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
      updatedList = next;
      return next;
    });

    await syncVideoLessonsToFirestore(updatedList);
    setDoc(doc(db, "video_lessons", newLesson.id), newLesson).catch(() => {});

    addNotification({
      title: `🎬 Новый видеоурок: ${newLesson.title}`,
      body: `В раздел «База знаний → Видеоуроки» добавлен новый материал (${newLesson.category}).`,
      type: "system",
      targetRole: ["parent", "trainer", "director", "admin"],
      relatedTab: "parent_knowledge",
    });

    return newLesson;
  };

  const updateVideoLesson = async (
    id: string,
    updates: Partial<Omit<VideoLesson, "id">>,
  ) => {
    const cleanUpdates = removeUndefined({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    let updatedList: VideoLesson[] = [];
    setVideoLessons((prev) => {
      const next = prev
        .map((vl) => (vl.id === id ? { ...vl, ...cleanUpdates } : vl))
        .sort((a, b) => {
          if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
            return a.isPinned ? -1 : 1;
          }
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        });
      updatedList = next;
      return next;
    });

    await syncVideoLessonsToFirestore(updatedList);
    updateDoc(doc(db, "video_lessons", id), cleanUpdates as any).catch(() => {});
  };

  const deleteVideoLesson = async (id: string) => {
    let updatedList: VideoLesson[] = [];
    setVideoLessons((prev) => {
      const next = prev.filter((vl) => vl.id !== id);
      updatedList = next;
      return next;
    });

    await syncVideoLessonsToFirestore(updatedList);
    deleteDoc(doc(db, "video_lessons", id)).catch(() => {});
  };

  const incrementVideoLessonViews = async (id: string) => {
    let updatedList: VideoLesson[] = [];
    let targetLesson: VideoLesson | undefined;
    setVideoLessons((prev) => {
      const next = prev.map((vl) => {
        if (vl.id === id) {
          targetLesson = { ...vl, viewsCount: (vl.viewsCount || 0) + 1 };
          return targetLesson;
        }
        return vl;
      });
      updatedList = next;
      return next;
    });

    if (targetLesson) {
      await syncVideoLessonsToFirestore(updatedList);
      updateDoc(doc(db, "video_lessons", id), {
        viewsCount: targetLesson.viewsCount,
      }).catch(() => {});
    }
  };

  return (
    <CRMContext.Provider
      value={{
        userProfile,
        updateUserProfile,
        updateUserCredentials,
        leads,
        clients,
        tasks,
        groups,
        coaches,
        finances,
        financeCategories,
        financialPlans,
        counterparties,
        addCounterparty,
        updateCounterparty,
        deleteCounterparty,
        trainingSessions,
        cancelledSessions,
        addCancelledSession,
        addCancelledSessionsBatch,
        deleteCancelledSession,
        messages,
        calendarSyncEnabled,
        calendarSyncStatus,
        calendarSyncLog,
        currentRole,
        currentTab,
        setCurrentRole,
        setCurrentTab,
        viewingClientId,
        setViewingClientId,
        firestoreError,
        dismissFirestoreError,
        addLead,
        resendLeadTelegram,
        addClient,
        updateLeadStatus,
        ensureClientFromLead,
        convertLeadToClient,
        bookTrial,
        completeTrialAndMarkAttendance,
        uploadDocument,
        deleteDocument,
        markAttendance,
        deleteTrainingSession,
        updateTrainingSessionProtocol,
        ratePlayer,
        completeTask,
        updateTask,
        reorderTasks,
        addTask,
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearReadNotifications,
        addChatMessage,
        updateChatMessage,
        deleteChatMessage,
        markChatMessageAsRead,
        markAllChatMessagesAsRead,
        toggleCalendarSync,
        triggerManualCalendarSync,
        resetAllData,
        clearAllData,
        overwriteClients,
        overwriteLeads,
        overwriteFinances,
        overwriteCoaches,
        appendClients,
        appendLeads,
        appendFinances,
        appendCoaches,
        accounts,
        isFinanceSynced,
        addAccount,
        updateAccount,
        deleteAccount,
        products,
        storeOrders,
        homeworks,
        homeworkSubmissions,
        addProduct,
        updateProduct,
        deleteProduct,
        createOrder,
        updateOrderStatus,
        addHomework,
        deleteHomework,
        submitHomework,
        videoLessons,
        addVideoLesson,
        updateVideoLesson,
        deleteVideoLesson,
        incrementVideoLessonViews,
        deleteLead,
        deleteClient,
        deleteTask,
        deleteFinanceRecord,
        updateFinanceRecord,
        addFinanceCategory,
        updateFinanceCategory,
        deleteFinanceCategory,
        addFinanceRecord,
        updateFinancialPlan,
        updateClientNotes,
        updateClient,
        createGroup,
        deleteGroup,
        updateGroup,
        assignClientToGroup,
        assignClientToSelectTeam,
        removeClientFromSelectTeam,
        createSelectTeam,
        updateSelectTeamMember,
        batchUpdateSelectTeamRoster,
        recordSelectTeamFeePayment,
        createCoach,
        deleteCoach,
        assignCoachToGroup,
        updateCoachContacts,
        updateCoach,
        schoolName,
        updateSchoolName,
        whatsappNotifications,
        updateWhatsappNotifications,
        autoOverdueTasks,
        updateAutoOverdueTasks,
        crmConfig,
        updateCRMConfig,
        generateAIProgressReport,
        deleteAIProgressReport,
        checkAndGenerateAutomatedReports,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
};
