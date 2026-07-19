import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import { Calendar, User, Clock, CheckCircle, Camera, X } from "lucide-react";
import { TrainingSessionProtocol } from "../types";
import { HeaderDescription } from "./HeaderDescription";

export const TrainerSessions: React.FC = () => {
  const { trainingSessions, coaches, currentRole } = useCRM();
  const { appUser } = useAuth();
  
  const myCoach = coaches.find(
    (c) =>
      c.name.toLowerCase() === appUser?.fullName?.toLowerCase() ||
      (c.phone && appUser?.phone && c.phone === appUser?.phone)
  ) || coaches[0];
  
  const [selectedSession, setSelectedSession] = useState<TrainingSessionProtocol | null>(null);
  const [filterMonth, setFilterMonth] = useState(
    (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    })()
  );

  const isPrivileged = currentRole === 'admin' || currentRole === 'director';
  const mySessions = (trainingSessions || []).filter(
    (s) =>
      (isPrivileged || s.coachId === myCoach?.id ||
      s.coachName?.includes(myCoach?.name || "") ||
      s.assistantId === myCoach?.id) &&
      s.date.substring(0, 7) === filterMonth
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const sessionsAsMain = mySessions.filter(s => s.coachId === myCoach?.id || s.coachName?.includes(myCoach?.name || ""));
  const sessionsAsAssistant = mySessions.filter(s => s.assistantId === myCoach?.id && s.coachId !== myCoach?.id);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Учет тренировок</h1>
            <HeaderDescription text={<>{isPrivileged ? "Журнал всех проведенных тренировок и фотоотчетов." : "Мониторинг проведенных тренировок в качестве основного тренера и ассистента."}</>} />
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-max">
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="outline-none bg-transparent text-sm font-bold text-slate-700"
            />
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100/50">
            <div className="text-emerald-600 mb-1 font-bold text-sm">Всего тренировок</div>
            <div className="text-3xl font-black text-emerald-700">{mySessions.length}</div>
            <div className="text-xs text-emerald-600/70 mt-1 font-medium">За выбранный месяц</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100/50">
            <div className="text-blue-600 mb-1 font-bold text-sm">Основной тренер</div>
            <div className="text-3xl font-black text-blue-700">{sessionsAsMain.length}</div>
            <div className="text-xs text-blue-600/70 mt-1 font-medium">Провел(а) тренировок</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100/50">
            <div className="text-amber-600 mb-1 font-bold text-sm">Ассистент</div>
            <div className="text-3xl font-black text-amber-700">{sessionsAsAssistant.length}</div>
            <div className="text-xs text-amber-600/70 mt-1 font-medium">Помогал(а) на тренировках</div>
          </div>
        </div>

        {mySessions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">За выбранный месяц тренировок не найдено.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mySessions.map((session) => (
              <div key={session.id} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-100 hover:shadow-md transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{session.groupName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {session.date}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {session.coachId === myCoach?.id ? "Вы (Основной тренер)" : 
                       session.assistantId === myCoach?.id ? `Ассистент (Основной: ${session.coachName})` : 
                       "Основной тренер"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6">
                  {session.photoUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setSelectedSession(session as any)}>
                      <img src={session.photoUrl} alt="Фото" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button onClick={() => setSelectedSession(session as any)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition">Подробнее</button>
                  <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl font-black text-emerald-600">{session.presentCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Присутствовало</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-rose-500">{session.absentCount + session.sickCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Отсутствовало</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Отчет по тренировке</h3>
              <button onClick={() => setSelectedSession(null)} className="p-1 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {selectedSession.photoUrl ? (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50 flex items-center justify-center min-h-[200px]">
                  <img src={selectedSession.photoUrl} alt="Фотоотчет" className="w-full object-contain max-h-[40vh]" />
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 bg-slate-50 rounded-xl border border-dashed">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span>Фотоотчет не прикреплен</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Группа</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.groupName}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Дата и время проведения</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.date} • {selectedSession.dateString}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Тренер</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.coachName}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Ассистент</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.assistantName || 'Не указан'}</div>
                </div>
              </div>

              <div className="p-4 border rounded-xl space-y-3">
                 <h4 className="font-bold text-sm text-slate-900">Посещаемость</h4>
                 <div className="flex gap-4 text-xs">
                    <span className="text-emerald-600 font-bold">Присутствовали: {selectedSession.presentCount}</span>
                    <span className="text-rose-600 font-bold">Пропустили: {selectedSession.absentCount + selectedSession.sickCount}</span>
                 </div>
                 <div className="space-y-1 mt-3">
                   {selectedSession.records && selectedSession.records.map(rec => (
                     <div key={rec.clientId} className="flex justify-between items-center py-1 border-b last:border-0 border-gray-100 text-xs">
                       <span className="font-medium">{rec.clientName}</span>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.status === 'present' ? 'bg-emerald-50 text-emerald-700' : rec.status === 'absent_sick' ? 'bg-amber-50 text-amber-700' : rec.status === 'trial_free' ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-rose-50 text-rose-700'}`}>
                         {rec.status === 'present' ? 'Был' : rec.status === 'absent_sick' ? 'Болел' : rec.status === 'trial_free' ? 'Пробная' : 'Пропуск'}
                       </span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
