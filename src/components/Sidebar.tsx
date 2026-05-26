import React from 'react';
import { 
  BarChart, Users, FileText, CheckSquare, GraduationCap, 
  FolderPlus, DollarSign, BookOpen, MessageSquare, Calendar, 
  Settings, Award, Sparkles, RefreshCw, Trophy
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';

interface SidebarProps {
  currentRole: 'manager' | 'trainer' | 'parent' | 'director';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messageCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentRole, 
  activeTab, 
  setActiveTab,
  messageCount
}) => {
  const { schoolName, leads, messages } = useCRM();

  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const parentMessagesCount = messages.filter(m => m.senderRole === 'parent').length;
  const finalMessageCount = messageCount !== undefined ? messageCount : parentMessagesCount;

  // Get visible menu items based on role
  const getMenuItems = () => {
    switch (currentRole) {
      case 'parent':
        return [
          { id: 'parent_home', label: 'Главная', icon: BarChart },
          { id: 'parent_schedule', label: 'Расписание', icon: Calendar },
          { id: 'parent_attendance', label: 'Посещения', icon: CheckSquare },
          { id: 'parent_payments', label: 'Платежи', icon: DollarSign },
          { id: 'parent_messages', label: 'Сообщения', icon: MessageSquare, badge: finalMessageCount || undefined },
          { id: 'parent_knowledge', label: 'База знаний', icon: BookOpen },
          { id: 'parent_gamification', label: 'Награды и Цели', icon: Trophy },
          { id: 'parent_settings', label: 'Настройки', icon: Settings }
        ];
      case 'trainer':
        return [
          { id: 'trainer_home', label: 'Главная', icon: BarChart },
          { id: 'trainer_schedule', label: 'Мое расписание', icon: Calendar },
          { id: 'trainer_groups', label: 'Мои группы', icon: Users },
          { id: 'trainer_attendance', label: 'Посещения', icon: CheckSquare },
          { id: 'trainer_progress', label: 'Успеваемость', icon: Award },
          { id: 'trainer_messages', label: 'Сообщения', icon: MessageSquare, badge: finalMessageCount || undefined },
          { id: 'trainer_knowledge', label: 'Методика', icon: BookOpen },
          { id: 'trainer_settings', label: 'Настройки', icon: Settings }
        ];
      case 'manager':
      case 'director':
      default:
        return [
          { id: 'hq_home', label: 'Главная', icon: BarChart },
          { id: 'hq_clients', label: 'Клиенты', icon: Users },
          { id: 'hq_leads', label: 'Заявки', icon: FileText, badge: newLeadsCount || undefined },
          { id: 'hq_coaches', label: 'Тренеры', icon: GraduationCap },
          { id: 'hq_groups', label: 'Группы', icon: FolderPlus },
          { id: 'hq_finances', label: 'Финансы', icon: DollarSign },
          { id: 'hq_analytics', label: 'Бонусы и Аналитика', icon: Sparkles },
          { id: 'hq_attendance', label: 'Посещения', icon: CheckSquare },
          { id: 'hq_messages', label: 'Сообщения', icon: MessageSquare, badge: finalMessageCount || undefined },
          { id: 'hq_calendar_sync', label: 'Google Календарь', icon: RefreshCw },
          { id: 'hq_settings', label: 'Настройки', icon: Settings }
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div id="crm-sidebar" className="w-64 bg-white border-r border-gray-100 flex flex-col h-full text-slate-800 min-h-[700px]">
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center space-x-3 text-left">
        <div className="flex-shrink-0">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
            <path d="M12 2L2 22h20L12 2z"/>
            <path d="M12 8v14"/>
            <path d="M7 12l5-5 5 5"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <div className="font-extrabold tracking-tight text-slate-900 text-sm leading-none uppercase">АМКАР ЮНИОР</div>
          <div className="text-[10px] text-gray-400 tracking-wide mt-1">
            ФУТБОЛЬНЫЙ КЛУБ
          </div>
        </div>
      </div>

      {/* Role State Tag */}
      <div className="px-6 py-2 flex items-center justify-between text-xs mb-4">
        <span className="text-gray-400">Режим:</span>
        <span className="text-slate-600 font-medium">
          {currentRole === 'director' ? 'Директор' : 
           currentRole === 'manager' ? 'Менеджер' : 
           currentRole === 'trainer' ? 'Тренер' : 'Ученик'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left text-xs font-medium ${
                isActive 
                  ? 'bg-gray-100 text-slate-900' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-gray-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${
                  isActive ? 'bg-white text-slate-800 shadow-sm' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Collapse button stub */}
      <div className="p-4 mt-auto">
        <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 text-xs font-medium px-3 py-2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Свернуть</span>
        </button>
      </div>
    </div>
  );
};
