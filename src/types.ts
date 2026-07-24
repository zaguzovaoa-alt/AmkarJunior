export type LeadSource = 'MAX' | 'telegram' | 'vk' | 'листовка' | 'рекомендация';

export interface Lead {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  childSurname: string;
  childBirthYear: number;
  childBirthDate?: string;
  childAge: number;
  source: LeadSource;
  createdAt: string; // ISO String
  timeString: string; // HH:MM
  status: 'new' | 'contacted' | 'trial_booked' | 'trial_completed' | 'converted' | 'lost';
  note?: string;
  trialDate?: string;
  trialTime?: string;
  trialGroupId?: string;
  trialCoachId?: string;
  trainerFeedback?: string;
  paymentLink?: string;
  paymentStatus?: 'pending' | 'paid';
}

export type ClientStatus = 'active' | 'inactive' | 'left' | 'trial' | 'paused' | 'completed';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  item: string;
  status: 'Оплачено' | 'Ожидает' | 'Просрочено';
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent_sick' | 'absent';
  reason?: string;
}

export interface ProgressMetrics {
  technique: number;
  tactics: number;
  physical: number;
  discipline: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  photoUrl?: string;
  category: string;
}

export interface StoreOrder {
  id: string;
  clientId: string;
  clientName: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'new' | 'completed' | 'cancelled';
  date: string;
}

export interface Homework {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  description: string;
  videoUrl?: string; // YouTube or other
  dueDate: string;
  dateAssigned: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  clientId: string;
  status: 'done' | 'pending';
  dateDone?: string;
}

export interface Client {
  id: string;
  password?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  childSurname: string;
  childBirthYear: number;
  childBirthDate?: string;
  childAge: number;
  status: ClientStatus;
  abonement: 'none' | '12_sessions' | '8_sessions' | '4_sessions' | '1_session';
  abonementStatus: 'Оплачено' | 'Ожидает оплаты' | 'Нет абонемента';
  abonementExpirationDate?: string;
  abonementTotalSessions?: number;
  abonementSessionsLeft: number;
  groupName: string | null; // e.g., 'Группа 2014' or null
  coachId: string | null;
  coachName: string | null;
  medicalCertificateUrl: string | null; // file name or base64 or status
  insuranceUrl: string | null;
  bonusBalance?: number;
  referralCode?: string;
  invitedBy?: string;
  payments: Payment[];
  attendance: AttendanceRecord[];
  progress: ProgressMetrics;
  achievements: Achievement[];
  notes: string;
  avatarUrl?: string;
  uniformSize?: string;
  relationshipRisk?: 'none' | 'low' | 'high';
  relationshipNotes?: string;
  managerBonusAccrued?: number;
  riskType?: 'none' | 'conflict' | 'absences';
  riskDetails?: string;
  riskUrgency?: 'none' | 'intervene' | 'urgent';
  riskResolution?: 'none' | 'left' | 'thinking' | 'renewed' | 'refused' | 'resolved' | 'reconciled';
  riskComment?: string;
}

export interface CRMTask {
  id: string;
  title: string;
  assignedTo: 'manager' | 'trainer' | 'director';
  status: 'new' | 'pending' | 'completed' | 'overdue';
  dueDate: string;
  description: string;
  relatedClientId?: string;
  relatedLeadId?: string;
  checklist?: { id: string; text: string; isCompleted: boolean }[];
  comments?: { id: string; text: string; author: string; timestamp: string }[];
}

export interface TrainingGroup {
  id: string;
  name: string; // e.g. 'Группа 2014'
  year: number; // e.g. 2014 (legacy)
  birthYearFrom?: number;
  birthYearTo?: number;
  coachId: string;
  coachName: string;
  playersCount: number;
  attendanceRate: number;
  scheduleDays: string[]; // e.g. ["Пн 17:00", "Ср 17:00"]
  venueCost?: number; // Cost of the venue per training session
  venueId?: string; // Links to the specific Counterparty for rent calculation
  maxCapacity?: number; // Max capacity of the group to calculate load percentage
  
  // For Select Teams (Сборные команды)
  isSelectTeam?: boolean;
  targetCompetition?: string;
  selectedClientIds?: string[];
}

export interface Coach {
  id: string;
  password?: string;
  name: string;
  role: string; // e.g., 'Старший тренер', 'Тренер Вратарей'
  joinedYear: number;
  groupsCount: number;
  kidsCount: number;
  workload: number; // percentage
  rating: number; // out of 5
  status: 'Активен' | 'На испытательном сроке' | 'Неактивен';
  phone?: string;
  telegram?: string; // e.g., telegram handle
  avatarUrl?: string; // photo url or base64
  feedback: {
    discipline: number;
    communication: number;
    professionalism: number;
    results: number;
  };
  paymentType?: 'fixed' | 'per_session'; // System payroll setting
  rate?: number; // Rate per month or per session
}

export interface TrainingSessionProtocol {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  dateString: string;
  coachId: string;
  coachName: string;
  assistantId?: string;
  assistantName?: string;
  photoUrl?: string | null;
  notes?: string;
  presentCount: number;
  absentCount: number;
  sickCount: number;
  trialCount?: number;
  records: {
    clientId: string;
    clientName: string;
    status: 'present' | 'absent_sick' | 'absent' | 'trial_free';
    reason?: string;
  }[];
}

export interface Counterparty {
  id: string;
  name: string;
  type: 'school_rent' | 'hall_rent' | 'coach' | 'other';
  description?: string;
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string; // e.g. 'Абонементы', 'Аренда', 'Зарплата'
  amount: number;
  date: string;
  description: string;
  groupName?: string;
  targetMonth?: string; // YYYY-MM
  accountId?: string; // Links to internal accounts
  isFixed?: boolean; // Indicates if this is a recurring/fixed expense or income
  counterpartyId?: string; // New: link to counterparty
  paymentStatus?: 'accrued' | 'paid' | 'pending'; // 'accrued' = Начислено (долг), 'paid' = Выплачено/Списано
  coachId?: string;
}

export interface FinanceCategory {
  id: string;
  type: 'income' | 'expense';
  name: string;
  isSystem?: boolean;
  expenseType?: 'variable' | 'fixed';
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'cash' | 'bank' | 'acquiring' | 'other';
}

export interface FinancialPlan {
  month: string; // YYYY-MM
  renew12Count: number;
  renew8Count: number;
  renew4Count: number;
  new12Count: number;
  new8Count: number;
  new4Count: number;
  price12: number;
  price8: number;
  price4: number;
  categoryTargets?: Record<string, number>;
}

export interface ReportConfig {
  enabled: boolean;
  dayOfWeek: number; // 1-7 (1=Monday, 7=Sunday)
  time: string; // "HH:MM"
  targetChatId: string;
  lastSent?: string; // Date string to track when it was last sent
}

export interface CRMConfig {
  acquiringFeePct: number;
  price12: number;
  price8: number;
  price4: number;
  price1: number;
  referralBonusAmount: number;
  referralBonusType: 'rubles' | 'sessions';
  yandexFormUrl?: string; // Link to the Yandex Form
  telegramBotToken?: string;
  telegramGroupChatId?: string;
  telegramAlerts?: Record<string, boolean>;
  reports?: {
    weekly: ReportConfig;
    manager: ReportConfig;
    salary: ReportConfig;
  };
}

export interface ChatMessage {
  id: string;
  senderRole: 'manager' | 'trainer' | 'parent' | 'director' | 'admin';
  senderName: string;
  text: string;
  timestamp: string; // HH:MM or ISO
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'document';
  visibleTo?: ('manager' | 'trainer' | 'parent' | 'director' | 'admin')[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  targetRole?: ('manager' | 'trainer' | 'parent' | 'director' | 'admin')[];
  targetGroupIds?: string[]; // if empty, applies to all
  dateString: string;
  isRead: boolean;
  type: 'event' | 'system' | 'message';
}
