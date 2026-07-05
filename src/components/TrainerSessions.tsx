import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import { Calendar, User, Clock, CheckCircle } from "lucide-react";
import { HeaderDescription } from "./HeaderDescription";

export const TrainerSessions: React.FC = () => {
  const { trainingSessions, coaches } = useCRM();
  const { appUser } = useAuth();
  
  const myCoach = coaches.find(
    (c) =>
      c.name.toLowerCase() === appUser?.fullName?.toLowerCase() ||
      (c.phone && appUser?.phone && c.phone === appUser?.phone)
  ) || coaches[0];
  
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  const mySessions = (trainingSessions || []).filter(
    (s) =>
      (s.coachId === myCoach?.id ||
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
            <HeaderDescription text={<>Мониторинг проведенных тренировок в качестве основного тренера и ассистента.</>} />
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
                
                <div className="flex items-center gap-6 sm:gap-8">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
