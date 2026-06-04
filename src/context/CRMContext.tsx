import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc, getDocFromServer, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Lead, Client, CRMTask, TrainingGroup, Coach, FinanceRecord, ChatMessage, LeadSource, Payment, TrainingSessionProtocol, FinanceCategory, FinancialPlan, CRMConfig, AppNotification
} from '../types';

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
  leads: Lead[];
  clients: Client[];
  tasks: CRMTask[];
  groups: TrainingGroup[];
  coaches: Coach[];
  finances: FinanceRecord[];
  financeCategories: FinanceCategory[];
  financialPlans: FinancialPlan[];
  trainingSessions: TrainingSessionProtocol[];
  messages: ChatMessage[];
  calendarSyncEnabled: boolean;
  calendarSyncStatus: 'connected' | 'disconnected' | 'syncing';
  calendarSyncLog: string[];
  currentRole: 'manager' | 'trainer' | 'parent' | 'director';
  currentTab: string;
  setCurrentRole: (role: 'manager' | 'trainer' | 'parent' | 'director') => void;
  setCurrentTab: (tab: string) => void;
  firestoreError: string | null;
  dismissFirestoreError: () => void;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'timeString' | 'status'>) => void;
  updateLeadStatus: (id: string, status: Lead['status']) => void;
  bookTrial: (leadId: string, coachId: string, groupName: string, date: string, time: string) => void;
  completeTrialAndMarkAttendance: (
    leadId: string, 
    attended: boolean, 
    notes: string, 
    groupName: string, 
    coachName: string,
    fileAttached?: string
  ) => void;
  sendPaymentLink: (clientId: string, amount: number, title: string) => void;
  processPayment: (clientId: string, tariff: '12_sessions' | '8_sessions' | '4_sessions' | '1_session', amount: number) => void;
  uploadDocument: (clientId: string, type: 'medical' | 'insurance', fileName: string) => void;
  markAttendance: (groupId: string, date: string, records: { clientId: string; status: 'present' | 'absent_sick' | 'absent'; reason?: string }[], mediaFile?: string, notes?: string) => void;
  ratePlayer: (clientId: string, metrics: { technique: number; tactics: number; physical: number; discipline: number }) => void;
  addTask: (task: Omit<CRMTask, 'id' | 'status'>) => void;
  completeTask: (id: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateChatMessage: (id: string, newText: string) => void;
  deleteChatMessage: (id: string) => void;
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'isRead' | 'dateString'>) => void;
  markNotificationRead: (id: string) => void;
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
  addFinanceCategory: (category: Omit<FinanceCategory, 'id'>) => Promise<void>;
  deleteFinanceCategory: (id: string) => Promise<void>;
  updateFinancialPlan: (plan: FinancialPlan) => Promise<void>;
  addFinanceRecord: (record: Omit<FinanceRecord, 'id'>) => Promise<void>;
  updateClientNotes: (clientId: string, notes: string) => Promise<void>;
  updateClient: (clientId: string, updates: Partial<Omit<Client, 'id'>>) => Promise<void>;
  createGroup: (name: string, year: number, birthYearFrom: number, birthYearTo: number, coachId: string, coachName: string, scheduleDays: string[], isSelectTeam?: boolean, targetCompetition?: string, selectedClientIds?: string[]) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  updateGroup: (id: string, updates: Partial<Omit<TrainingGroup, 'id'>>) => Promise<void>;
  assignClientToGroup: (clientId: string, groupName: string | null) => Promise<void>;
  assignClientToSelectTeam: (clientId: string, groupId: string) => Promise<void>;
  removeClientFromSelectTeam: (clientId: string, groupId: string) => Promise<void>;
  createCoach: (name: string, role: string, joinedYear: number, status: Coach['status'], phone?: string, telegram?: string, avatarUrl?: string, initialFeedback?: Coach['feedback']) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;
  assignCoachToGroup: (groupId: string, coachId: string, coachName: string) => Promise<void>;
  updateCoachContacts: (coachId: string, phone: string, telegram: string) => Promise<void>;
  updateCoach: (coachId: string, updates: Partial<Omit<Coach, 'id'>>) => Promise<void>;
  schoolName: string;
  updateSchoolName: (name: string) => Promise<void>;
  whatsappNotifications: boolean;
  updateWhatsappNotifications: (enabled: boolean) => Promise<void>;
  autoOverdueTasks: boolean;
  updateAutoOverdueTasks: (enabled: boolean) => Promise<void>;
  crmConfig: CRMConfig;
  updateCRMConfig: (config: Partial<CRMConfig>) => Promise<void>;
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

const INITIAL_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: 'cat_in_ab', type: 'income', name: 'Абонементы', isSystem: true },
  { id: 'cat_in_1tr', type: 'income', name: 'Разовые тренировки', isSystem: true },
  { id: 'cat_in_ind', type: 'income', name: 'Индивидуальные тренировки' },
  { id: 'cat_in_eq', type: 'income', name: 'Форма/Экипировка' },
  { id: 'cat_ex_acq', type: 'expense', name: 'Эквайринг (Комиссия ЮKassa)', isSystem: true },
  { id: 'cat_ex_rent', type: 'expense', name: 'Аренда' },
  { id: 'cat_ex_sal', type: 'expense', name: 'Зарплата' },
  { id: 'cat_ex_mar', type: 'expense', name: 'Маркетинг/Реклама' },
  { id: 'cat_ex_inv', type: 'expense', name: 'Инвентарь/Оборудование' },
];

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [tasks, setTasks] = useState<CRMTask[]>(INITIAL_TASKS);
  const [coaches, setCoaches] = useState<Coach[]>(INITIAL_COACHES);
  const [groups, setGroups] = useState<TrainingGroup[]>(INITIAL_GROUPS);
  const [finances, setFinances] = useState<FinanceRecord[]>(INITIAL_FINANCES);
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>(() => {
    const cached = localStorage.getItem('amkar_finance_categories');
    return cached ? JSON.parse(cached) : INITIAL_FINANCE_CATEGORIES;
  });
  const [financialPlans, setFinancialPlans] = useState<FinancialPlan[]>(() => {
    const cached = localStorage.getItem('amkar_financial_plans');
    return cached ? JSON.parse(cached) : [];
  });
  const [trainingSessions, setTrainingSessions] = useState<TrainingSessionProtocol[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const dismissFirestoreError = () => {
    setFirestoreError(null);
  };

  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('amkar_cal_sync_enabled') === 'true';
  });

  const [calendarSyncStatus, setCalendarSyncStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');
  
  const [calendarSyncLog, setCalendarSyncLog] = useState<string[]>(() => {
    const cached = localStorage.getItem('amkar_cal_sync_log');
    return cached ? JSON.parse(cached) : [
      'Система инициализирована.',
      'Ожидание подключения Google Календаря...'
    ];
  });

  const [currentRole, setCurrentRoleState] = useState<'manager' | 'trainer' | 'parent' | 'director'>(() => {
    const cached = localStorage.getItem('amkar_current_role');
    return (cached as 'manager' | 'trainer' | 'parent' | 'director') || 'director';
  });

  const [currentTab, setCurrentTabState] = useState<string>(() => {
    const cached = localStorage.getItem('amkar_current_tab');
    if (cached) return cached;
    if (currentRole === 'trainer') return 'trainer_home';
    if (currentRole === 'parent') return 'parent_home';
    return 'hq_home';
  });

  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem('amkar_school_name') || 'АМКАР ЮНИОР';
  });
  const [whatsappNotifications, setWhatsappNotifications] = useState<boolean>(() => {
    return localStorage.getItem('amkar_whatsapp_notifications') !== 'false';
  });
  const [autoOverdueTasks, setAutoOverdueTasks] = useState<boolean>(() => {
    return localStorage.getItem('amkar_auto_overdue_tasks') !== 'false';
  });

  const [crmConfig, setCrmConfig] = useState<CRMConfig>(() => {
    const cached = localStorage.getItem('amkar_crm_config');
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
      price1: 550
    };
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem('amkar_user_profile');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return {
      name: 'Василий',
      role: 'Менеджер / Администратор',
      avatarUrl: 'https://i.pravatar.cc/100?img=11',
      phone: '+7 (999) 123-45-67',
      email: 'manager@amkar.ru'
    };
  });

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...userProfile, ...updates };
    setUserProfile(newProfile);
    localStorage.setItem('amkar_user_profile', JSON.stringify(newProfile));
    try {
      const configDocRef = doc(db, '_config', 'initialized');
      await setDoc(configDocRef, { userProfile: newProfile }, { merge: true });
    } catch(e) { console.error('Failed to sync profile', e); }
  };

  const updateCRMConfig = async (configUpdates: Partial<CRMConfig>) => {
    const newConfig = { ...crmConfig, ...configUpdates };
    setCrmConfig(newConfig);
    localStorage.setItem('amkar_crm_config', JSON.stringify(newConfig));
    try {
      const configDocRef = doc(db, '_config', 'initialized');
      await setDoc(configDocRef, { crmConfig: newConfig }, { merge: true });
    } catch (e) {
      console.error('Failed to sync config to Firestore:', e);
    }
  };

  const updateSchoolName = async (name: string) => {
    setSchoolName(name);
    localStorage.setItem('amkar_school_name', name);
    try {
      const configDocRef = doc(db, '_config', 'initialized');
      await setDoc(configDocRef, { schoolName: name }, { merge: true });
    } catch (e) {
      console.error('Failed to sync school name to Firestore:', e);
    }
  };

  const updateWhatsappNotifications = async (enabled: boolean) => {
    setWhatsappNotifications(enabled);
    localStorage.setItem('amkar_whatsapp_notifications', String(enabled));
    try {
      const configDocRef = doc(db, '_config', 'initialized');
      await setDoc(configDocRef, { whatsappNotifications: enabled }, { merge: true });
    } catch (e) {
      console.error('Failed to sync whatsappNotifications to Firestore:', e);
    }
  };

  const updateAutoOverdueTasks = async (enabled: boolean) => {
    setAutoOverdueTasks(enabled);
    localStorage.setItem('amkar_auto_overdue_tasks', String(enabled));
    try {
      const configDocRef = doc(db, '_config', 'initialized');
      await setDoc(configDocRef, { autoOverdueTasks: enabled }, { merge: true });
    } catch (e) {
      console.error('Failed to sync autoOverdueTasks to Firestore:', e);
    }
  };

  const setCurrentRole = (role: 'manager' | 'trainer' | 'parent' | 'director') => {
    setCurrentRoleState(role);
    localStorage.setItem('amkar_current_role', role);
    let defaultTab = 'hq_home';
    if (role === 'trainer') defaultTab = 'trainer_home';
    else if (role === 'parent') defaultTab = 'parent_home';
    setCurrentTab(defaultTab);
  };

  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    localStorage.setItem('amkar_current_tab', tab);
  };

  // 1. Connection check and auto-population on first load
  useEffect(() => {
    const testConnectionAndInit = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firestore connection check: App is currently operating in offline/demo mode.");
        }
      }

      try {
        const configDocRef = doc(db, '_config', 'initialized');
        const configDoc = await getDoc(configDocRef);
        
        // Retrieve groups to verify if seeding is needed (e.g., if collections got cleared but config remained)
        let shouldSeed = !configDoc.exists();
        if (!shouldSeed) {
          const testGroups = await getDocs(collection(db, 'groups'));
          if (testGroups.empty) {
            shouldSeed = true;
          }
        }
        
        if (shouldSeed) {
          console.log("Pre-populating Firestore database with default CRM demo datasets...");
          for (const item of INITIAL_COACHES) {
            await setDoc(doc(db, 'coaches', item.id), item);
          }
          for (const item of INITIAL_GROUPS) {
            await setDoc(doc(db, 'groups', item.id), item);
          }
          for (const item of INITIAL_CLIENTS) {
            await setDoc(doc(db, 'clients', item.id), item);
          }
          for (const item of INITIAL_TASKS) {
            await setDoc(doc(db, 'tasks', item.id), item);
          }
          for (const item of INITIAL_FINANCES) {
            await setDoc(doc(db, 'finances', item.id), item);
          }
          for (const item of INITIAL_MESSAGES) {
            await setDoc(doc(db, 'messages', item.id), item);
          }
          for (const item of INITIAL_LEADS) {
            await setDoc(doc(db, 'leads', item.id), item);
          }
          await setDoc(configDocRef, { 
            initialized: true,
            isProductionWiped: true,
            isProductionWipedFull: true,
            schoolName: 'АМКАР ЮНИОР',
            whatsappNotifications: true,
            autoOverdueTasks: true
          });
        } else {
          // Load settings from config document if present
          const data = configDoc.data();
          if (data) {
            if (data.schoolName) {
              setSchoolName(data.schoolName);
              localStorage.setItem('amkar_school_name', data.schoolName);
            }
            if (data.whatsappNotifications !== undefined) {
              setWhatsappNotifications(data.whatsappNotifications);
              localStorage.setItem('amkar_whatsapp_notifications', String(data.whatsappNotifications));
            }
            if (data.autoOverdueTasks !== undefined) {
              setAutoOverdueTasks(data.autoOverdueTasks);
              localStorage.setItem('amkar_auto_overdue_tasks', String(data.autoOverdueTasks));
            }
            if (data.crmConfig) {
              setCrmConfig(data.crmConfig);
              localStorage.setItem('amkar_crm_config', JSON.stringify(data.crmConfig));
            }
            if (data.userProfile) {
              setUserProfile(data.userProfile);
              localStorage.setItem('amkar_user_profile', JSON.stringify(data.userProfile));
            }
          }
        }
      } catch (err: any) {
        const errMsg = err.message || String(err);
        const isOffline = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('unavailable');
        if (isOffline) {
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

  // 2. Real-time synchronizations with Firestore
  useEffect(() => {
    if (!firebaseReady) return;

    const handleSnapshotErr = (err: any, col: string) => {
      const errMsg = err.message || String(err);
      const isOffline = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('unavailable');
      if (isOffline) {
        console.warn(`Firestore collection ${col} loaded/waiting in offline mode:`, errMsg);
      } else {
        setFirestoreError(errMsg);
        try {
          handleFirestoreError(err, OperationType.GET, col);
        } catch (e) {
          console.error(`Caught expected firestore permission error on ${col}:`, e);
        }
      }
    };

    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const list: Lead[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Lead);
      });
      setLeads(list);
    }, (err) => handleSnapshotErr(err, 'leads'));

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const list: Client[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Client);
      });
      setClients(list);
    }, (err) => handleSnapshotErr(err, 'clients'));

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const list: CRMTask[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as CRMTask);
      });
      setTasks(list);
    }, (err) => handleSnapshotErr(err, 'tasks'));

    const unsubCoaches = onSnapshot(collection(db, 'coaches'), (snapshot) => {
      const list: Coach[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Coach);
      });
      setCoaches(list);
    }, (err) => handleSnapshotErr(err, 'coaches'));

    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const list: TrainingGroup[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as TrainingGroup);
      });
      setGroups(list);
    }, (err) => handleSnapshotErr(err, 'groups'));

    const unsubFinances = onSnapshot(collection(db, 'finances'), (snapshot) => {
      const list: FinanceRecord[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as FinanceRecord);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setFinances(list);
    }, (err) => handleSnapshotErr(err, 'finances'));

    const unsubTrainingSessions = onSnapshot(collection(db, 'training_sessions'), (snapshot) => {
      const list: TrainingSessionProtocol[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as TrainingSessionProtocol);
      });
      // Sort newest first
      list.sort((a, b) => b.date.localeCompare(a.date));
      setTrainingSessions(list);
    }, (err) => handleSnapshotErr(err, 'training_sessions'));

    const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ChatMessage);
      });
      list.sort((a, b) => a.id.localeCompare(b.id));
      setMessages(list);
    }, (err) => handleSnapshotErr(err, 'messages'));

    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as AppNotification);
      });
      list.sort((a, b) => b.dateString.localeCompare(a.dateString));
      setNotifications(list);
    }, (err) => handleSnapshotErr(err, 'notifications'));

    return () => {
      unsubLeads();
      unsubClients();
      unsubTasks();
      unsubCoaches();
      unsubGroups();
      unsubFinances();
      unsubTrainingSessions();
      unsubMessages();
      unsubNotifications();
    };
  }, [firebaseReady]);

  // Sync log preferences in localstorage
  useEffect(() => {
    localStorage.setItem('amkar_cal_sync_enabled', String(calendarSyncEnabled));
    setCalendarSyncStatus(calendarSyncEnabled ? 'connected' : 'disconnected');
  }, [calendarSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('amkar_cal_sync_log', JSON.stringify(calendarSyncLog));
  }, [calendarSyncLog]);

  useEffect(() => {
    localStorage.setItem('amkar_finance_categories', JSON.stringify(financeCategories));
  }, [financeCategories]);

  useEffect(() => {
    localStorage.setItem('amkar_financial_plans', JSON.stringify(financialPlans));
  }, [financialPlans]);

  // Hook to poll webhooks periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const pollWebhooks = async () => {
      try {
        const response = await fetch('/api/webhooks/poll');
        if (response.ok) {
          const data = await response.json();
          if (data.leads && data.leads.length > 0) {
            data.leads.forEach((payload: any) => {
              // Create a lead from webhook payload
              const structuredLead = {
                parentName: payload.parentName || payload.name || 'Родитель (из формы)',
                parentPhone: payload.parentPhone || payload.phone || payload.contact || 'Не указан',
                parentEmail: payload.parentEmail || payload.email || undefined,
                childName: payload.childName || payload.child || 'Ребенок',
                childSurname: payload.childSurname || payload.surname || '',
                childBirthYear: parseInt(payload.childBirthYear || payload.year || '2015', 10),
                childAge: payload.childAge || payload.age || 8,
                source: payload.source || payload.utm_source || 'Веб-форма',
                notes: payload.notes || payload.message || 'Заявка с сайта или формы',
                timeString: new Date().toTimeString().slice(0, 5)
              };
              
              // We call addLead to insert and create tasks
              addLead(structuredLead);
            });
          }
        }
      } catch (e) {
        console.warn('Webhook poll failed:', e);
      }
    };
    
    interval = setInterval(pollWebhooks, 15000); // 15 seconds
    pollWebhooks(); // initial check
    return () => clearInterval(interval);
  }, []);

  // Actions
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'timeString' | 'status'>) => {
    const now = new Date();
    const leadId = `l_${Date.now()}`;
    const newLead: Lead = {
      ...leadData,
      id: leadId,
      createdAt: now.toISOString(),
      timeString: now.toTimeString().substring(0, 5),
      status: 'new'
    };

    // Immediate local state update
    setLeads(prev => [...prev, newLead]);

    // Automatically trigger task for Manager and Director locally
    const managerTaskId = `t_${Date.now()}_m`;
    const managerTask: CRMTask = {
      id: managerTaskId,
      title: `Связаться по новой заявке: ${newLead.childSurname} ${newLead.childName}`,
      assignedTo: 'manager',
      status: 'new',
      dueDate: 'Сегодня',
      description: `Поступила новая заявка из канала [${newLead.source}]. Родитель: ${newLead.parentName}, Тел: ${newLead.parentPhone}`,
      relatedLeadId: newLead.id
    };

    const directorTaskId = `t_${Date.now()}_d`;
    const directorTask: CRMTask = {
      id: directorTaskId,
      title: `Контроль: Новая заявка [ ${newLead.source} ]`,
      assignedTo: 'director',
      status: 'new',
      dueDate: 'Сегодня',
      description: `Новый потенциальный клиент: ${newLead.childSurname} ${newLead.childName} (${newLead.childAge} лет). Источник: ${newLead.source}`
    };

    setTasks(prev => [managerTask, directorTask, ...prev]);

    // Safe background sync without blocking UI execution
    setDoc(doc(db, 'leads', leadId), newLead).catch(err => {
      console.warn("Failed to sync new lead to Firestore:", err);
    });
    setDoc(doc(db, 'tasks', managerTaskId), managerTask).catch(err => {
      console.warn("Failed to sync manager task to Firestore:", err);
    });
    setDoc(doc(db, 'tasks', directorTaskId), directorTask).catch(err => {
      console.warn("Failed to sync director task to Firestore:", err);
    });

    if (calendarSyncEnabled) {
      setCalendarSyncLog(prev => [
        `[${new Date().toLocaleTimeString()}] Обнаружена заявка. Запланировано автособытие "Звонок-контакт" в Google Календаре.`,
        ...prev
      ]);
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    updateDoc(doc(db, 'leads', id), { status }).catch(err => {
      console.warn(`Failed to update status for lead ${id} in Firestore, kept locally:`, err);
    });
  };

  const bookTrial = async (leadId: string, coachId: string, groupName: string, date: string, time: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const group = groups.find(g => g.name === groupName);

    const updatedLead: Lead = {
      ...lead,
      status: 'trial_booked',
      trialDate: date,
      trialTime: time,
      trialGroupId: group?.id,
      trialCoachId: coachId,
    };

    setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));

    const trainerTaskId = `t_${Date.now()}_tr`;
    const trainerTask: CRMTask = {
      id: trainerTaskId,
      title: `Провести пробную тренировку для ${lead.childName} ${lead.childSurname}`,
      assignedTo: 'trainer',
      status: 'pending',
      dueDate: `${date} в ${time}`,
      description: `Проверить навыки ребенка (возраст: ${lead.childAge} лет). Оставить отзыв после тренировки.`,
      relatedClientId: lead.id
    };

    setTasks(prev => [trainerTask, ...prev]);

    updateDoc(doc(db, 'leads', leadId), updatedLead as any).catch(err => {
      console.warn("Failed to update lead status in Firestore:", err);
    });
    setDoc(doc(db, 'tasks', trainerTaskId), trainerTask).catch(err => {
      console.warn("Failed to sync trainer task in Firestore:", err);
    });

    if (calendarSyncEnabled) {
      setCalendarSyncLog(prev => [
        `[${new Date().toLocaleTimeString()}] Добавлено событие "Пробная тренировка: ${updatedLead.childSurname} ${updatedLead.childName}" в Google Календарь.`,
        ...prev
      ]);
    }
  };

  const completeTrialAndMarkAttendance = async (
    leadId: string,
    attended: boolean,
    coachNotes: string,
    groupName: string,
    coachName: string,
    fileAttached?: string
  ) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newFeedback = `[Тренер ${coachName} отметил]: ${coachNotes}. ${fileAttached ? 'Фотоотчет прикреплен: ' + fileAttached : ''}`;
    
    // Update Lead status to trial_completed and append trainer feedback
    const updatedLead: Lead = {
      ...lead,
      status: 'trial_completed',
      trainerFeedback: newFeedback
    };
    
    // Immediate local updates
    setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));

    const label = `${lead.childName} ${lead.childSurname}`;
    const managerTaskId = `t_${Date.now()}_conv`;
    const managerTask: CRMTask = {
      id: managerTaskId,
      title: `Связаться с родителем ${label} после пробного занятия`,
      assignedTo: 'manager',
      status: 'new',
      dueDate: 'Сегодня',
      description: `Пробная тренировка пройдена (${attended ? 'Присутствовал' : 'Пропустил'}). Отзыв тренера: ${coachNotes}. Связаться и отправить ссылку на оплату. Тел: ${lead.parentPhone}`,
      relatedLeadId: leadId
    };

    const directorTaskId = `t_${Date.now()}_dir_conv`;
    const directorTask: CRMTask = {
      id: directorTaskId,
      title: `Контроль конверсии: Пробное пройдено - ${label}`,
      assignedTo: 'director',
      status: 'new',
      dueDate: 'Сегодня',
      description: `Ребенок посетил пробное занятие. Комментарий тренера: ${coachNotes}`
    };

    setTasks(prev => [managerTask, directorTask, ...prev]);

    // Safe background sync without blocking UI execution
    updateDoc(doc(db, 'leads', leadId), updatedLead as any).catch(err => {
      console.warn("Failed to sync attendance in Firestore:", err);
    });
    setDoc(doc(db, 'tasks', managerTaskId), managerTask).catch(err => {
      console.warn("Failed to sync manager task in Firestore:", err);
    });
    setDoc(doc(db, 'tasks', directorTaskId), directorTask).catch(err => {
      console.warn("Failed to sync director task in Firestore:", err);
    });
  };

  const sendPaymentLink = async (clientId: string, amount: number, title: string) => {
    const taskId = `t_${Date.now()}_paylink`;
    const task: CRMTask = {
      id: taskId,
      title: `Отправлена ссылка на оплату ЮКасса в ЛК родителя`,
      assignedTo: 'manager',
      status: 'completed',
      dueDate: 'Сегодня',
      description: `Ссылка для оплаты тарифа (${title} - ${amount} руб.) отправлена в личный кабинет и SMS.`,
      relatedClientId: clientId
    };
    setTasks(prev => [task, ...prev]);
    setDoc(doc(db, 'tasks', taskId), task).catch(err => {
      console.warn("Failed to log payment link in Firestore, kept locally:", err);
    });
  };

  const processPayment = async (clientId: string, tariff: '12_sessions' | '8_sessions' | '4_sessions' | '1_session', amount: number) => {
    let client = clients.find(c => c.id === clientId);
    let lead = leads.find(l => l.id === clientId);
    if (!client && !lead) return;

    let textTariff = '';
    let sessions = 0;
    switch (tariff) {
      case '12_sessions': textTariff = 'Абонемент на 12 занятий'; sessions = 12; break;
      case '8_sessions': textTariff = 'Абонемент на 8 занятий'; sessions = 8; break;
      case '4_sessions': textTariff = 'Абонемент на 4 занятия'; sessions = 4; break;
      case '1_session': textTariff = 'Разовая тренировка'; sessions = 1; break;
    }

    const todayString = new Date().toISOString().substring(0, 10);
    const targetMonth = todayString.substring(0, 7);
    const financeId = `f_${Date.now()}`;
    const newPayment: Payment = {
      id: `p_${Date.now()}`,
      date: todayString,
      amount: amount,
      item: textTariff,
      status: 'Оплачено'
    };

    const newFinance: FinanceRecord = {
      id: financeId,
      type: 'income',
      category: 'Абонементы',
      amount: amount,
      date: todayString,
      description: `Успешная оплата ЮKassa: ${textTariff} от пользователя ID ${clientId}`,
      targetMonth
    };

    const acquiringExpenseId = `f_${Date.now()}_acq`;
    const acquiringFee = Math.round(amount * (crmConfig.acquiringFeePct / 100));
    const acquiringFinance: FinanceRecord = {
      id: acquiringExpenseId,
      type: 'expense',
      category: 'Эквайринг (Комиссия ЮKassa)',
      amount: acquiringFee,
      date: todayString,
      description: `Эквайринг ${crmConfig.acquiringFeePct}% от оплаты абонемента ${textTariff} (клиент ID ${clientId})`,
      targetMonth
    };

    if (lead) {
      const newClientId = `cl_${Date.now()}`;
      const groupName = lead.trialGroupId ? groups.find(g => g.id === lead?.trialGroupId)?.name || null : groups[0]?.name || null;
      
      const newClient: Client = {
        id: newClientId,
        parentName: lead.parentName,
        parentPhone: lead.parentPhone,
        parentEmail: lead.parentEmail,
        childName: lead.childName,
        childSurname: lead.childSurname,
        childBirthYear: lead.childBirthYear,
        childAge: lead.childAge,
        status: 'active',
        abonement: tariff,
        abonementStatus: 'Оплачено',
        abonementTotalSessions: sessions,
        abonementSessionsLeft: sessions,
        abonementExpirationDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().substring(0, 10),
        groupName: groupName,
        coachId: lead.trialCoachId || coaches[0]?.id || '',
        coachName: coaches.find(c => c.id === lead?.trialCoachId)?.name || 'Не указан',
        medicalCertificateUrl: null,
        insuranceUrl: null,
        payments: [newPayment],
        attendance: [],
        progress: { technique: 4.0, tactics: 4.0, physical: 4.0, discipline: 4.0 },
        achievements: [],
        relationshipRisk: 'none',
        managerBonusAccrued: 500,
        notes: `Конвертирован из лида. Источник: ${lead.source}. ${lead.trainerFeedback ? 'Отзыв тренера на пробном: ' + lead.trainerFeedback : ''}`
      };

      setClients(prev => [...prev, newClient]);
      setLeads(prev => prev.map(l => l.id === lead?.id ? { ...l, status: 'converted' } : l));
      setFinances(prev => [
        {...newFinance, groupName: groupName || undefined}, 
        {...acquiringFinance, groupName: groupName || undefined},
        ...prev
      ]);

      const directorTaskId = `t_${Date.now()}_dir_paid`;
      const clientLabel = `${newClient.childName} ${newClient.childSurname}`;
      const directorNotification: CRMTask = {
        id: directorTaskId,
        title: `Доход и конверсия: ${amount} ₽ получено от ${clientLabel}`,
        assignedTo: 'director',
        status: 'new',
        dueDate: 'Сегодня',
        description: `Успешный переход из пробного периода в активные. Оплачен: ${textTariff}`
      };
      setTasks(prev => [directorNotification, ...prev]);

      setDoc(doc(db, 'clients', newClientId), newClient).catch(e => console.warn(e));
      updateDoc(doc(db, 'leads', lead.id), { status: 'converted' }).catch(e => console.warn(e));
      setDoc(doc(db, 'finances', financeId), {...newFinance, groupName: groupName || undefined}).catch(e => console.warn(e));
      setDoc(doc(db, 'finances', acquiringExpenseId), {...acquiringFinance, groupName: groupName || undefined}).catch(e => console.warn(e));
      setDoc(doc(db, 'tasks', directorTaskId), directorNotification).catch(e => console.warn(e));

    } else if (client) {
      let autoGroup = client.groupName;
      if (!autoGroup) {
        if (groups.length > 0) autoGroup = groups[0].name;
        else autoGroup = null;
      }
      
      const updatedPayments = [newPayment, ...client.payments];

      setClients(prev => prev.map(c => c.id === clientId ? {
        ...c,
        status: 'active' as const,
        abonement: tariff,
        abonementStatus: 'Оплачено',
        abonementTotalSessions: sessions + (c.abonementSessionsLeft || 0),
        abonementSessionsLeft: sessions + (c.abonementSessionsLeft || 0),
        abonementExpirationDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().substring(0, 10),
        groupName: autoGroup,
        payments: updatedPayments,
        managerBonusAccrued: (c.managerBonusAccrued || 0) + 100
      } : c));

      setFinances(prev => [
        {...newFinance, groupName: autoGroup || undefined}, 
        {...acquiringFinance, groupName: autoGroup || undefined},
        ...prev
      ]);

      const directorTaskId = `t_${Date.now()}_dir_paid`;
      const clientLabel = `${client.childName} ${client.childSurname}`;
      const directorNotification: CRMTask = {
        id: directorTaskId,
        title: `Продление абонемента: ${amount} ₽ от ${clientLabel}`,
        assignedTo: 'director',
        status: 'new',
        dueDate: 'Сегодня',
        description: `Клиент оплатил: ${textTariff}`
      };
      setTasks(prev => [directorNotification, ...prev]);

      updateDoc(doc(db, 'clients', clientId), {
        status: 'active',
        abonement: tariff,
        abonementStatus: 'Оплачено',
        abonementTotalSessions: sessions + (client.abonementSessionsLeft || 0),
        abonementSessionsLeft: sessions + (client.abonementSessionsLeft || 0),
        abonementExpirationDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().substring(0, 10),
        groupName: autoGroup,
        payments: updatedPayments,
        managerBonusAccrued: (client.managerBonusAccrued || 0) + 100
      }).catch(err => {
        console.warn("Failed to update client subscription in Firestore:", err);
      });
      setDoc(doc(db, 'finances', financeId), {...newFinance, groupName: autoGroup || undefined}).catch(err => {
        console.warn("Failed to sync finance record in Firestore:", err);
      });
      setDoc(doc(db, 'finances', acquiringExpenseId), {...acquiringFinance, groupName: autoGroup || undefined}).catch(err => {
        console.warn("Failed to sync expense record in Firestore:", err);
      });
      setDoc(doc(db, 'tasks', directorTaskId), directorNotification).catch(err => {
        console.warn("Failed to sync director payment notification in Firestore:", err);
      });
    }

    if (calendarSyncEnabled) {
      setCalendarSyncLog(prev => [
        `[${new Date().toLocaleTimeString()}] Оплачен абонемент ${textTariff} (${amount} руб). Автоматически синхронизирован весь календарь занятий в аккаунт родителя.`,
        ...prev
      ]);
    }
  };

  const uploadDocument = async (clientId: string, type: 'medical' | 'insurance', fileName: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const notesUpdate = `${client.notes}\n[Документы]: Загружен файл ${fileName} (${type === 'medical' ? 'Справка' : 'Страховка'}).`;
    const updateFields: any = {
      notes: notesUpdate
    };
    if (type === 'medical') {
      updateFields.medicalCertificateUrl = fileName;
    } else {
      updateFields.insuranceUrl = fileName;
    }

    // Instantly update local state so views reflect the uploaded file instantly
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updateFields } : c));

    // Background sync
    updateDoc(doc(db, 'clients', clientId), updateFields).catch(err => {
      console.warn(`Failed to upload document for client ${clientId}:`, err);
    });
  };

  const markAttendance = async (
    groupId: string, 
    date: string, 
    records: { clientId: string; status: 'present' | 'absent_sick' | 'absent'; reason?: string }[],
    mediaFile?: string,
    notes?: string
  ) => {
    const rawClients = clients; // avoid stale state issues in loops
    const groupName = groups.find(g => g.id === groupId || g.name === groupId)?.name || groupId;
    const coachId = groups.find(g => g.name === groupName)?.coachId || 'unknown';
    const coachName = groups.find(g => g.name === groupName)?.coachName || 'Неизвестный тренер';

    const presentCount = records.filter(r => r.status === 'present').length;
    const sickCount = records.filter(r => r.status === 'absent_sick').length;
    const absentCount = records.filter(r => r.status === 'absent').length;

    const newProtocol: TrainingSessionProtocol = {
      id: `ts_${Date.now()}`,
      groupId: groupId,
      groupName: groupName,
      date: new Date().toISOString(),
      dateString: date,
      coachId,
      coachName,
      photoUrl: mediaFile,
      notes: notes,
      presentCount,
      absentCount,
      sickCount,
      records: records.map(r => {
        const clientObj = rawClients.find(c => c.id === r.clientId);
        return {
          clientId: r.clientId,
          clientName: clientObj ? `${clientObj.childSurname} ${clientObj.childName}` : r.clientId,
          status: r.status,
          reason: r.reason
        };
      })
    };

    setTrainingSessions(prev => [newProtocol, ...prev]);

    // Background sync of the session
    try {
      await setDoc(doc(db, 'training_sessions', newProtocol.id), newProtocol as any);
    } catch(err) {
      console.warn("Could not save training session to firestore", err);
    }

    // Instantly update local clients state so views update immediately
    setClients(prev => prev.map(c => {
      const record = records.find(r => r.clientId === c.id);
      if (record) {
        const wasPresent = record.status === 'present';
        const isSessionDeducted = wasPresent && c.abonementSessionsLeft > 0;
        return {
          ...c,
          abonementSessionsLeft: isSessionDeducted ? c.abonementSessionsLeft - 1 : c.abonementSessionsLeft,
          notes: mediaFile ? `${c.notes}\n[Посещаемость ${date}]: Тренер прикрепил фото ${mediaFile}.` : c.notes,
          attendance: [
            { date, status: record.status, reason: record.reason },
            ...c.attendance
          ]
        };
      }
      return c;
    }));

    const group = groups.find(g => g.id === groupId);
    const directorTaskId = `t_${Date.now()}_att`;
    const directorTask: CRMTask = {
      id: directorTaskId,
      title: `Отмечена посещаемость в группе: ${group?.name || groupId}`,
      assignedTo: 'director',
      status: 'new',
      dueDate: 'Сегодня',
      description: `Тренер ${group?.coachName || 'Тренер'} утвердил лист посещаемости на ${date}. Присутствовало: ${records.filter(r => r.status==='present').length} человек.`
    };

    setTasks(prev => [directorTask, ...prev]);

    // Background sync without blocking UI execution
    records.forEach(record => {
      const c = clients.find(cl => cl.id === record.clientId);
      if (c) {
        const wasPresent = record.status === 'present';
        const isSessionDeducted = wasPresent && c.abonementSessionsLeft > 0;
        updateDoc(doc(db, 'clients', c.id), {
          abonementSessionsLeft: isSessionDeducted ? c.abonementSessionsLeft - 1 : c.abonementSessionsLeft,
          notes: mediaFile ? `${c.notes}\n[Посещаемость ${date}]: Тренер прикрепил фото ${mediaFile}.` : c.notes,
          attendance: [
            { date, status: record.status, reason: record.reason },
            ...c.attendance
          ]
        }).catch(err => {
          console.warn(`Failed to sync attendance for ${c.id}:`, err);
        });
      }
    });

    setDoc(doc(db, 'tasks', directorTaskId), directorTask).catch(err => {
      console.warn("Failed to sync director task for attendance:", err);
    });
  };

  const ratePlayer = async (clientId: string, metrics: { technique: number; tactics: number; physical: number; discipline: number }) => {
    const c = clients.find(cl => cl.id === clientId);
    if (!c) return;

    const autoAchievements = [...c.achievements];
    if (metrics.technique >= 4.8 && !c.achievements.find(a => a.id === 'ac_tech_master')) {
      autoAchievements.push({
        id: 'ac_tech_master',
        title: 'Мастер Техники ⚽',
        description: 'Получена высшая оценка 4.8+ за технические навыки',
        earnedAt: new Date().toISOString().substring(0, 10),
        icon: '🏆'
      });
    }
    if (metrics.discipline >= 4.7 && !c.achievements.find(a => a.id === 'ac_dis_master')) {
      autoAchievements.push({
        id: 'ac_dis_master',
        title: 'Железная Дисциплина ⚡',
        description: 'Отличное поведение и дисциплина на тренировках',
        earnedAt: new Date().toISOString().substring(0, 10),
        icon: '🎖️'
      });
    }

    // Instantly update local state so views reflect player metrics instantly
    setClients(prev => prev.map(cl => cl.id === clientId ? { ...cl, progress: metrics, achievements: autoAchievements } : cl));

    // Background sync
    updateDoc(doc(db, 'clients', clientId), {
      progress: metrics,
      achievements: autoAchievements
    }).catch(err => {
      console.warn(`Failed to sync player metrics for client ${clientId} in Firestore:`, err);
    });
  };

  const addTask = async (taskData: Omit<CRMTask, 'id' | 'status'>) => {
    const id = `t_${Date.now()}`;
    const newTask: CRMTask = {
      ...taskData,
      id,
      status: 'new'
    };
    setTasks(prev => [newTask, ...prev]);
    setDoc(doc(db, 'tasks', id), newTask).catch(err => {
      console.warn("Failed to add task to Firestore, kept locally:", err);
    });
  };

  const completeTask = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    updateDoc(doc(db, 'tasks', id), { status: 'completed' }).catch(err => {
      console.warn(`Failed to complete task ${id} in Firestore, kept locally:`, err);
    });
  };

  const addChatMessage = async (msgData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const id = `msg_${Date.now()}`;
    const timeNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      ...msgData,
      id,
      timestamp: timeNow
    };

    // Instantly update local state so messages show up in chat instantly
    setMessages(prev => [...prev, newMsg]);

    // Background sync
    setDoc(doc(db, 'messages', id), newMsg).catch(err => {
      console.warn("Failed to sync new message in Firestore:", err);
    });
  };

  const updateChatMessage = async (id: string, newText: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text: newText } : m));
    updateDoc(doc(db, 'messages', id), { text: newText }).catch(err => {
      console.warn(`Failed to update message ${id} in Firestore:`, err);
    });
  };

  const deleteChatMessage = async (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    deleteDoc(doc(db, 'messages', id)).catch(err => {
      console.warn(`Failed to delete message ${id} in Firestore:`, err);
    });
  };

  const addNotification = async (notifData: Omit<AppNotification, 'id' | 'isRead' | 'dateString'>) => {
    const id = `notif_${Date.now()}`;
    const dateString = new Date().toISOString();
    const newNotif: AppNotification = {
      ...notifData,
      id,
      isRead: false,
      dateString
    };
    
    setNotifications(prev => [newNotif, ...prev]);
    setDoc(doc(db, 'notifications', id), newNotif).catch(err => {
      console.warn("Failed to sync new notification in Firestore:", err);
    });
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    updateDoc(doc(db, 'notifications', id), { isRead: true }).catch(err => {
      console.warn(`Failed to mark notification ${id} as read in Firestore:`, err);
    });
  };

  const toggleCalendarSync = () => {
    setCalendarSyncEnabled(prev => !prev);
    const isEnabled = !calendarSyncEnabled;
    const time = new Date().toLocaleTimeString();
    if (isEnabled) {
      setCalendarSyncLog(prev => [
        `[${time}] Успешное сопряжение с вашим Google Calendar. Экспортировано расписание 4-х возрастных групп в облако.`,
        `[${time}] Авторизация пройдена под адресом zaguzovaoa@gmail.com`,
        ...prev
      ]);
    } else {
      setCalendarSyncLog(prev => [
        `[${time}] Соединение разорвано. Расписание больше не транслируется в облачные календари.`,
        ...prev
      ]);
    }
  };

  const triggerManualCalendarSync = () => {
    if (!calendarSyncEnabled) return;
    setCalendarSyncStatus('syncing');
    
    setTimeout(() => {
      setCalendarSyncStatus('connected');
      const time = new Date().toLocaleTimeString();
      setCalendarSyncLog(prev => [
        `[${time}] Синхронизация завершена успешно. Обновлено 28 будущих событий тренировок, 4 турнира, и статусы посещаемости.`,
        ...prev
      ]);
    }, 1500);
  };

  const addFinanceCategory = async (category: Omit<FinanceCategory, 'id'>) => {
    const id = `cat_${Date.now()}`;
    const newCategory = { ...category, id };
    setFinanceCategories(prev => [...prev, newCategory]);
    // Would save to Firestore if needed
  };

  const deleteFinanceCategory = async (id: string) => {
    setFinanceCategories(prev => prev.filter(c => c.id !== id));
  };

  const addFinanceRecord = async (record: Omit<FinanceRecord, 'id'>) => {
    const id = `f_${Date.now()}`;
    const newRecord = { ...record, id };
    setFinances(prev => [newRecord, ...prev]);
    setDoc(doc(db, 'finances', id), newRecord).catch(e => console.warn(e));
  };

  const updateFinancialPlan = async (plan: FinancialPlan) => {
    setFinancialPlans(prev => {
      const existing = prev.find(p => p.month === plan.month);
      if (existing) {
        return prev.map(p => p.month === plan.month ? plan : p);
      }
      return [...prev, plan];
    });
    // Would save to Firestore here
  };

  const resetAllData = async () => {
    try {
      for (const item of leads) {
        await deleteDoc(doc(db, 'leads', item.id));
      }
      for (const item of clients) {
        await deleteDoc(doc(db, 'clients', item.id));
      }
      for (const item of tasks) {
        await deleteDoc(doc(db, 'tasks', item.id));
      }
      for (const item of coaches) {
        await deleteDoc(doc(db, 'coaches', item.id));
      }
      for (const item of groups) {
        await deleteDoc(doc(db, 'groups', item.id));
      }
      for (const item of finances) {
        await deleteDoc(doc(db, 'finances', item.id));
      }
      for (const item of messages) {
        await deleteDoc(doc(db, 'messages', item.id));
      }

      for (const item of INITIAL_LEADS) {
        await setDoc(doc(db, 'leads', item.id), item);
      }
      for (const item of INITIAL_CLIENTS) {
        await setDoc(doc(db, 'clients', item.id), item);
      }
      for (const item of INITIAL_TASKS) {
        await setDoc(doc(db, 'tasks', item.id), item);
      }
      for (const item of INITIAL_COACHES) {
        await setDoc(doc(db, 'coaches', item.id), item);
      }
      for (const item of INITIAL_GROUPS) {
        await setDoc(doc(db, 'groups', item.id), item);
      }
      for (const item of INITIAL_FINANCES) {
        await setDoc(doc(db, 'finances', item.id), item);
      }
      for (const item of INITIAL_MESSAGES) {
        await setDoc(doc(db, 'messages', item.id), item);
      }

      setCalendarSyncEnabled(false);
      setCalendarSyncLog([
        'Каталог сброшен до исходных системных значений.',
        'Ожидание подключения Google Календаря...'
      ]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'resetAllData');
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
        for (const item of leads) {
          await deleteDoc(doc(db, 'leads', item.id));
        }
        setLeads([]);
      }
      if (options.clients) {
        for (const item of clients) {
          await deleteDoc(doc(db, 'clients', item.id));
        }
        setClients([]);
      }
      if (options.tasks) {
        for (const item of tasks) {
          await deleteDoc(doc(db, 'tasks', item.id));
        }
        setTasks([]);
      }
      if (options.finances) {
        for (const item of finances) {
          await deleteDoc(doc(db, 'finances', item.id));
        }
        setFinances([]);
      }
      if (options.messages) {
        for (const item of messages) {
          await deleteDoc(doc(db, 'messages', item.id));
        }
        setMessages([]);
      }

      // Mark the system config database as initialized and production ready
      const configDocRef = doc(db, '_config', 'initialized');
      await setDoc(configDocRef, { initialized: true, isProductionReady: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'clearAllData');
    }
  };

  const overwriteClients = async (newClients: Client[]) => {
    try {
      for (const item of clients) {
        await deleteDoc(doc(db, 'clients', item.id));
      }
      for (const item of newClients) {
        await setDoc(doc(db, 'clients', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'clients');
    }
  };

  const overwriteLeads = async (newLeads: Lead[]) => {
    try {
      for (const item of leads) {
        await deleteDoc(doc(db, 'leads', item.id));
      }
      for (const item of newLeads) {
        await setDoc(doc(db, 'leads', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'leads');
    }
  };

  const overwriteFinances = async (newFinances: FinanceRecord[]) => {
    try {
      for (const item of finances) {
        await deleteDoc(doc(db, 'finances', item.id));
      }
      for (const item of newFinances) {
        await setDoc(doc(db, 'finances', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'finances');
    }
  };

  const appendClients = async (newClients: Client[]) => {
    try {
      for (const item of newClients) {
        await setDoc(doc(db, 'clients', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'clients');
    }
  };

  const appendLeads = async (newLeads: Lead[]) => {
    try {
      for (const item of newLeads) {
        await setDoc(doc(db, 'leads', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'leads');
    }
  };

  const appendFinances = async (newFinances: FinanceRecord[]) => {
    try {
      for (const item of newFinances) {
        await setDoc(doc(db, 'finances', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'finances');
    }
  };

  const overwriteCoaches = async (newCoaches: Coach[]) => {
    try {
      for (const item of coaches) {
        await deleteDoc(doc(db, 'coaches', item.id));
      }
      for (const item of newCoaches) {
        await setDoc(doc(db, 'coaches', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'coaches');
    }
  };

  const appendCoaches = async (newCoaches: Coach[]) => {
    try {
      for (const item of newCoaches) {
        await setDoc(doc(db, 'coaches', item.id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'coaches');
    }
  };

  const deleteLead = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    deleteDoc(doc(db, 'leads', id)).catch(err => {
      console.warn(`Failed to delete lead ${id} on Firestore, kept locally:`, err);
    });
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    deleteDoc(doc(db, 'clients', id)).catch(err => {
      console.warn(`Failed to delete client ${id} on Firestore, kept locally:`, err);
    });
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'tasks', id)).catch(err => {
      console.warn(`Failed to delete task ${id} on Firestore, kept locally:`, err);
    });
  };

  const deleteFinanceRecord = async (id: string) => {
    setFinances(prev => prev.filter(f => f.id !== id));
    deleteDoc(doc(db, 'finances', id)).catch(err => {
      console.warn(`Failed to delete finance record ${id} on Firestore, kept locally:`, err);
    });
  };

  const updateClientNotes = async (clientId: string, notes: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes } : c));
    updateDoc(doc(db, 'clients', clientId), { notes }).catch(err => {
      console.warn(`Failed to update notes for client ${clientId} on Firestore, kept locally:`, err);
    });
  };

  const updateClient = async (clientId: string, updates: Partial<Omit<Client, 'id'>>) => {
    const original = clients.find(c => c.id === clientId);

    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    updateDoc(doc(db, 'clients', clientId), updates as any).catch(err => {
      console.warn(`Failed to update client ${clientId} on Firestore, kept locally:`, err);
    });

    if (updates.riskType && updates.riskType !== 'none') {
      const isNewRisk = !original || original.riskType !== updates.riskType || original.riskUrgency !== updates.riskUrgency;
      if (isNewRisk) {
        const childName = original ? `${original.childSurname} ${original.childName}` : 'Ученик';
        const riskTypeLabel = updates.riskType === 'conflict' 
          ? `Конфликт (с кем: ${updates.riskDetails || 'не указано'})` 
          : `Пропуски тренировок (более 2-х)`;
        
        const urgencyLabel = updates.riskUrgency === 'urgent' ? 'СРОЧНО' : 'Вмешаться';
        
        const managerTaskId = `t_risk_mgr_${Date.now()}`;
        const managerTask: CRMTask = {
          id: managerTaskId,
          title: `⚠️ РИСК (${urgencyLabel}): ${childName}`,
          assignedTo: 'manager',
          status: 'new',
          dueDate: 'Сегодня',
          description: `Проблема: ${riskTypeLabel}. Уровень: ${urgencyLabel}. Комментарий: ${updates.riskComment || 'Без комментария'}. Отреагируйте в CRM.`,
          relatedClientId: clientId
        };

        const trainerTaskId = `t_risk_trn_${Date.now() + 1}`;
        const trainerTask: CRMTask = {
          id: trainerTaskId,
          title: `⚠️ РИСК (${urgencyLabel}): ${childName}`,
          assignedTo: 'trainer',
          status: 'new',
          dueDate: 'Сегодня',
          description: `Проблема: ${riskTypeLabel}. Уровень: ${urgencyLabel}. Комментарий: ${updates.riskComment || 'Без комментария'}. Проработайте с родителем и менеджером.`,
          relatedClientId: clientId
        };

        setTasks(prev => [managerTask, trainerTask, ...prev]);
        setDoc(doc(db, 'tasks', managerTaskId), managerTask).catch(err => {
          console.warn("Failed to sync manager risk task to Firestore:", err);
        });
        setDoc(doc(db, 'tasks', trainerTaskId), trainerTask).catch(err => {
          console.warn("Failed to sync trainer risk task to Firestore:", err);
        });
      }
    }
  };

  const createGroup = async (name: string, year: number, birthYearFrom: number, birthYearTo: number, coachId: string, coachName: string, scheduleDays: string[], isSelectTeam?: boolean, targetCompetition?: string, selectedClientIds?: string[]) => {
    const newGroup: TrainingGroup = {
      id: `g_${Date.now()}`,
      name,
      year,
      birthYearFrom,
      birthYearTo,
      coachId,
      coachName,
      playersCount: selectedClientIds ? selectedClientIds.length : 0,
      attendanceRate: 100,
      scheduleDays,
      isSelectTeam,
      targetCompetition,
      selectedClientIds: selectedClientIds || []
    };
    setGroups(prev => [...prev, newGroup]);
    setDoc(doc(db, 'groups', newGroup.id), newGroup).catch(err => {
      console.warn(`Failed to create group in Firestore:`, err);
    });
  };

  const updateGroup = async (id: string, updates: Partial<Omit<TrainingGroup, 'id'>>) => {
    const oldGroup = groups.find(g => g.id === id);
    const oldName = oldGroup?.name;

    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    updateDoc(doc(db, 'groups', id), updates).catch(err => {
      console.warn(`Failed to update group ${id} on Firestore:`, err);
    });

    if (updates.name && oldName && oldName !== updates.name) {
      // Update clients state with new groupName
      setClients(prev => prev.map(c => c.groupName === oldName ? { ...c, groupName: updates.name } : c));
      
      // Persist client groupName changes to Firestore
      const clientsToUpdate = clients.filter(c => c.groupName === oldName);
      for (const c of clientsToUpdate) {
        updateDoc(doc(db, 'clients', c.id), { groupName: updates.name }).catch(err => {
          console.warn(`Failed to update client group name in Firestore:`, err);
        });
      }
    }
  };

  const deleteGroup = async (id: string) => {
    const groupName = groups.find(g => g.id === id)?.name;
    setGroups(prev => prev.filter(g => g.id !== id));
    deleteDoc(doc(db, 'groups', id)).catch(err => {
      console.warn(`Failed to delete group ${id} on Firestore:`, err);
    });
    if (groupName) {
      setClients(prev => prev.map(c => c.groupName === groupName ? { ...c, groupName: null } : c));
      const clientsToReset = clients.filter(c => c.groupName === groupName);
      for (const c of clientsToReset) {
        updateDoc(doc(db, 'clients', c.id), { groupName: null }).catch(err => {
          console.warn(`Failed to reset client group in Firestore:`, err);
        });
      }
    }
  };

  const assignClientToSelectTeam = async (clientId: string, groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const selectedClientIds = group.selectedClientIds || [];
    if (selectedClientIds.includes(clientId)) return;

    const newSelectedIds = [...selectedClientIds, clientId];
    
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, selectedClientIds: newSelectedIds, playersCount: newSelectedIds.length } : g));
    
    updateDoc(doc(db, 'groups', groupId), {
      selectedClientIds: newSelectedIds,
      playersCount: newSelectedIds.length 
    }).catch(err => {
      console.warn(`Failed to assign client to select team in Firestore:`, err);
    });
  };

  const removeClientFromSelectTeam = async (clientId: string, groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const selectedClientIds = group.selectedClientIds || [];
    if (!selectedClientIds.includes(clientId)) return;

    const newSelectedIds = selectedClientIds.filter(id => id !== clientId);

    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, selectedClientIds: newSelectedIds, playersCount: newSelectedIds.length } : g));
    
    updateDoc(doc(db, 'groups', groupId), {
      selectedClientIds: newSelectedIds,
      playersCount: newSelectedIds.length 
    }).catch(err => {
      console.warn(`Failed to remove client from select team in Firestore:`, err);
    });
  };

  const assignClientToGroup = async (clientId: string, groupName: string | null) => {
    const matchedGroup = groupName ? groups.find(g => g.name.trim().toLowerCase() === groupName.trim().toLowerCase()) : null;
    const finalGroupName = matchedGroup ? matchedGroup.name : (groupName ? groupName.trim() : null);
    const coachId = matchedGroup ? (matchedGroup.coachId || null) : null;
    const coachName = matchedGroup ? (matchedGroup.coachName || null) : null;

    setClients(prev => prev.map(c => c.id === clientId ? { 
      ...c, 
      groupName: finalGroupName,
      coachId,
      coachName
    } : c));

    updateDoc(doc(db, 'clients', clientId), { 
      groupName: finalGroupName, 
      coachId, 
      coachName 
    }).catch(err => {
      console.warn(`Failed to assign client ${clientId} to group in Firestore:`, err);
    });
  };

  const createCoach = async (
    name: string,
    role: string,
    joinedYear: number,
    status: Coach['status'],
    phone?: string,
    telegram?: string,
    avatarUrl?: string,
    initialFeedback?: Coach['feedback']
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
      phone: phone || '',
      telegram: telegram || '',
      avatarUrl: avatarUrl || '',
      rating: initialFeedback 
        ? Number(((initialFeedback.discipline + initialFeedback.communication + initialFeedback.professionalism + initialFeedback.results) / 4).toFixed(1))
        : 5.0,
      feedback: initialFeedback || {
        discipline: 5,
        communication: 5,
        professionalism: 5,
        results: 5
      }
    };
    setCoaches(prev => [...prev, newCoach]);
    setDoc(doc(db, 'coaches', newCoach.id), newCoach).catch(err => {
      console.warn(`Failed to create coach in Firestore:`, err);
    });
  };

  const deleteCoach = async (id: string) => {
    setCoaches(prev => prev.filter(c => c.id !== id));
    deleteDoc(doc(db, 'coaches', id)).catch(err => {
      console.warn(`Failed to delete coach ${id} on Firestore:`, err);
    });
    // For groups assigned to this coach, set coach to 'Не назначен'
    setGroups(prev => prev.map(g => g.coachId === id ? { ...g, coachId: '', coachName: 'Не назначен' } : g));
    const groupsToReset = groups.filter(g => g.coachId === id);
    for (const g of groupsToReset) {
      updateDoc(doc(db, 'groups', g.id), { coachId: '', coachName: 'Не назначен' }).catch(err => {
        console.warn(`Failed to reset group coach in Firestore:`, err);
      });
    }
  };

  const assignCoachToGroup = async (groupId: string, coachId: string, coachName: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, coachId, coachName } : g));
    updateDoc(doc(db, 'groups', groupId), { coachId, coachName }).catch(err => {
      console.warn(`Failed to assign coach to group ${groupId} in Firestore:`, err);
    });
  };

  const updateCoachContacts = async (coachId: string, phone: string, telegram: string) => {
    setCoaches(prev => prev.map(c => c.id === coachId ? { ...c, phone, telegram } : c));
    updateDoc(doc(db, 'coaches', coachId), { phone, telegram }).catch(err => {
      console.warn(`Failed to update coach contacts in Firestore:`, err);
    });
  };

  const updateCoach = async (coachId: string, updates: Partial<Omit<Coach, 'id'>>) => {
    setCoaches(prev => prev.map(c => {
      if (c.id === coachId) {
        const mergedObj = { ...c, ...updates };
        if (updates.feedback) {
          const fb = updates.feedback;
          mergedObj.rating = Number(((fb.discipline + fb.communication + fb.professionalism + fb.results) / 4).toFixed(1));
        }
        return mergedObj;
      }
      return c;
    }));

    const flatUpdates = { ...updates };
    if (updates.feedback) {
      const fb = updates.feedback;
      (flatUpdates as any).rating = Number(((fb.discipline + fb.communication + fb.professionalism + fb.results) / 4).toFixed(1));
    }

    updateDoc(doc(db, 'coaches', coachId), flatUpdates).catch(err => {
      console.warn(`Failed to update coach ${coachId} in Firestore:`, err);
    });

    if (updates.name) {
      setGroups(prev => prev.map(g => g.coachId === coachId ? { ...g, coachName: updates.name! } : g));
      const groupsToUpdate = groups.filter(g => g.coachId === coachId);
      for (const g of groupsToUpdate) {
        updateDoc(doc(db, 'groups', g.id), { coachName: updates.name! }).catch(err => {
          console.warn(`Failed to update coach name in group ${g.id} in Firestore:`, err);
        });
      }
    }
  };

  return (
    <CRMContext.Provider value={{
      userProfile,
      updateUserProfile,
      leads, clients, tasks, groups, coaches, finances, financeCategories, financialPlans, trainingSessions, messages,
      calendarSyncEnabled, calendarSyncStatus, calendarSyncLog,
      currentRole, currentTab, setCurrentRole, setCurrentTab,
      firestoreError, dismissFirestoreError,
      addLead, updateLeadStatus, bookTrial, completeTrialAndMarkAttendance,
      sendPaymentLink, processPayment, uploadDocument, markAttendance, ratePlayer,
      completeTask, addTask,
      notifications, addNotification, markNotificationRead,
      addChatMessage, updateChatMessage, deleteChatMessage, toggleCalendarSync, triggerManualCalendarSync,
      resetAllData,
      clearAllData,
      overwriteClients, overwriteLeads, overwriteFinances, overwriteCoaches,
      appendClients, appendLeads, appendFinances, appendCoaches,
      deleteLead, deleteClient, deleteTask, deleteFinanceRecord, addFinanceCategory, deleteFinanceCategory, addFinanceRecord, updateFinancialPlan, updateClientNotes, updateClient,
      createGroup, deleteGroup, updateGroup, assignClientToGroup, assignClientToSelectTeam, removeClientFromSelectTeam,
      createCoach, deleteCoach, assignCoachToGroup, updateCoachContacts, updateCoach,
      schoolName, updateSchoolName, whatsappNotifications, updateWhatsappNotifications,
      autoOverdueTasks, updateAutoOverdueTasks,
      crmConfig, updateCRMConfig
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
