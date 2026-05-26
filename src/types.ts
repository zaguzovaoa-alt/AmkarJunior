export type LeadSource = 'MAX' | 'telegram' | 'vk' | 'листовка' | 'рекомендация';

export interface Lead {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  childSurname: string;
  childBirthYear: number;
  childAge: number;
  source: LeadSource;
  createdAt: string; // ISO String
  timeString: string; // HH:MM
  status: 'new' | 'contacted' | 'trial_booked' | 'trial_completed' | 'converted' | 'lost';
  note?: string;
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

export interface Client {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  childSurname: string;
  childBirthYear: number;
  childAge: number;
  status: ClientStatus;
  abonement: 'none' | '12_sessions' | '8_sessions' | '4_sessions' | '1_session';
  abonementStatus: 'Оплачено' | 'Ожидает оплаты' | 'Нет абонемента';
  abonementExpirationDate?: string;
  abonementSessionsLeft: number;
  groupName: string | null; // e.g., 'Группа 2014' or null
  coachId: string | null;
  coachName: string | null;
  branch?: string; // e.g. "Манеж Спартак", "Импульс Арена"
  medicalCertificateUrl: string | null; // file name or base64 or status
  insuranceUrl: string | null;
  payments: Payment[];
  attendance: AttendanceRecord[];
  progress: ProgressMetrics;
  achievements: Achievement[];
  notes: string;
  avatarUrl?: string;
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
}

export interface TrainingGroup {
  id: string;
  name: string; // e.g. 'Группа 2014'
  year: number; // e.g. 2014
  coachId: string;
  coachName: string;
  playersCount: number;
  attendanceRate: number;
  scheduleDays: string[]; // e.g. ["Пн 17:00", "Ср 17:00"]
}

export interface Coach {
  id: string;
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
}

export interface TrainingSessionProtocol {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  dateString: string;
  coachId: string;
  coachName: string;
  photoUrl?: string | null;
  notes?: string;
  presentCount: number;
  absentCount: number;
  sickCount: number;
  records: {
    clientId: string;
    clientName: string;
    status: 'present' | 'absent_sick' | 'absent';
    reason?: string;
  }[];
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string; // e.g. 'Абонементы', 'Аренда', 'Зарплата'
  amount: number;
  date: string;
  description: string;
  groupName?: string;
}

export interface ChatMessage {
  id: string;
  senderRole: 'manager' | 'trainer' | 'parent' | 'director';
  senderName: string;
  text: string;
  timestamp: string; // HH:MM or ISO
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'document';
}
