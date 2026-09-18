import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Camera, Calendar, User, Users, MapPin, X, FileText, AlertTriangle } from 'lucide-react';
import { TrainingSessionProtocol } from '../types';
import { formatSessionDateDisplay } from '../utils/dateUtils';
import { formatGroupNameDisplay } from '../utils/formatters';

export const TrainingSessionsViewer: React.FC = () => {
  const { trainingSessions } = useCRM();
  const [selectedSession, setSelectedSession] = useState<TrainingSessionProtocol | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainingSessions.map(session => (
          <div key={session.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-normal text-slate-800 text-sm leading-snug">{formatGroupNameDisplay(session.groupName)}</h4>
                <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1 flex-wrap gap-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatSessionDateDisplay(session.date, session.dateString)}</span>
                  </span>
                  {/* Lesson plan badge */}
                  {session.hasLessonPlan || session.lessonPlanText || session.lessonPlanPhotoUrl ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <FileText className="w-3 h-3 text-emerald-600" />
                      Конспект
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Без конспекта
                    </span>
                  )}
                </div>
              </div>
              {session.photoUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-100 cursor-pointer" onClick={() => setSelectedSession(session)}>
                  <img src={session.photoUrl} alt="Фотоотчет" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-1 mt-2">
              <div className="text-xs text-gray-600 flex items-center space-x-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Тренер: {session.coachName}</span>
              </div>
              <div className="text-xs text-gray-600 flex items-center space-x-1">
                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  Присутствовало: <strong>{session.presentCount} чел.</strong>
                  {(session.presentPaidCount !== undefined || session.presentUnpaidCount !== undefined) && (
                    <span className="text-slate-500 ml-1">
                      ({session.presentPaidCount ?? 0} опл. / {session.presentUnpaidCount ?? 0} б/о)
                    </span>
                  )}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedSession(session)} className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition">
              Подробнее
            </button>
          </div>
        ))}
        {trainingSessions.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 border border-dashed rounded-2xl">
            Фотоотчеты отсутствуют
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Отчет по тренировке</h3>
              <button onClick={() => setSelectedSession(null)} className="p-1 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {selectedSession.photoUrl ? (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img src={selectedSession.photoUrl} alt="Фотоотчет" className="w-full object-contain max-h-[40vh]" />
                  <div className="p-3 bg-slate-50 text-xs text-gray-500 flex justify-between items-center">
                     <span>Фото загружено: {formatSessionDateDisplay(selectedSession.date, selectedSession.dateString)}</span>
                     <span>Автор: {selectedSession.coachName}</span>
                  </div>
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
                   <div className="font-normal text-sm text-slate-900">{formatGroupNameDisplay(selectedSession.groupName)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Дата и время проведения</div>
                   <div className="font-bold text-sm text-slate-900">{formatSessionDateDisplay(selectedSession.date, selectedSession.dateString)}</div>
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

              {/* Конспект тренировки */}
              <div className={`p-4 rounded-xl border ${
                selectedSession.hasLessonPlan || selectedSession.lessonPlanText || selectedSession.lessonPlanPhotoUrl
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                  : "bg-rose-50/70 border-rose-200 text-rose-950"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${
                      selectedSession.hasLessonPlan || selectedSession.lessonPlanText || selectedSession.lessonPlanPhotoUrl
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`} />
                    <span className="font-extrabold text-xs uppercase tracking-wide">
                      Конспект тренировки
                    </span>
                  </div>
                  {selectedSession.hasLessonPlan || selectedSession.lessonPlanText || selectedSession.lessonPlanPhotoUrl ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Конспект прикреплен
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      Нет конспекта
                    </span>
                  )}
                </div>

                {selectedSession.lessonPlanText && (
                  <div className="bg-white p-3 rounded-lg border border-emerald-200/60 text-xs text-slate-800 whitespace-pre-wrap mt-2 leading-relaxed">
                    {selectedSession.lessonPlanText}
                  </div>
                )}

                {selectedSession.lessonPlanPhotoUrl && (
                  <div className="mt-3">
                    <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      Фотография конспекта
                    </span>
                    <a
                      href={selectedSession.lessonPlanPhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-48 h-36 rounded-xl overflow-hidden border border-emerald-200 shadow-xs hover:opacity-95 transition"
                    >
                      <img
                        src={selectedSession.lessonPlanPhotoUrl}
                        alt="Конспект"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  </div>
                )}

                {!selectedSession.hasLessonPlan && !selectedSession.lessonPlanText && !selectedSession.lessonPlanPhotoUrl && (
                  <p className="text-xs text-rose-700 italic mt-1">
                    Тренер зафиксировал отметку «Нет конспекта» при отправке ведомости.
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-xl space-y-3">
                 <h4 className="font-bold text-sm text-slate-900">Посещаемость</h4>
                 <div className="flex flex-wrap gap-4 text-xs">
                    <span className="text-emerald-600 font-bold">
                      Присутствовали: {selectedSession.presentCount} чел.
                      {(selectedSession.presentPaidCount !== undefined || selectedSession.presentUnpaidCount !== undefined) && (
                        <span className="font-normal text-slate-600 ml-1.5">
                          (с оплатой: <strong className="text-emerald-700">{selectedSession.presentPaidCount ?? 0}</strong>, без оплаты: <strong className="text-amber-700">{selectedSession.presentUnpaidCount ?? 0}</strong>)
                        </span>
                      )}
                    </span>
                    <span className="text-rose-600 font-bold">Пропустили: {selectedSession.absentCount + selectedSession.sickCount}</span>
                 </div>
                 <div className="space-y-1 mt-3">
                   {selectedSession.records.map(rec => (
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
