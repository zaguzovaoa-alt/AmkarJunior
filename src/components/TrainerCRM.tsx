import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { ScheduleCalendar } from './ScheduleCalendar';
import { 
  Calendar, Check, User, AlertCircle, ChevronRight, CheckSquare, 
  MessageSquare, Star, Plus, Download, ClipboardList, Camera, Upload, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrainerCRMProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TrainerCRM: React.FC<TrainerCRMProps> = ({ activeTab, setActiveTab }) => {
  const { clients, tasks, groups, coaches, finances, messages, addChatMessage, markAttendance, ratePlayer, completeTask, updateClient } = useCRM();
  
  // We act as "Василий Петров", Старший тренер (coachId: 'c1/default')
  const myCoach = coaches[0] || { name: 'Василий Петров', role: 'Старший тренер' };
  
  // Local states for interactive things
  const [selectedGroupForAttendance, setSelectedGroupForAttendance] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<{[key: string]: { status: 'present' | 'absent_sick' | 'absent'; reason: string }}>({});
  const [uploadedAttendancePhoto, setUploadedAttendancePhoto] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // States for player rating
  const [selectedPlayerForRating, setSelectedPlayerForRating] = useState<string | null>(null);
  const [techniqueRating, setTechniqueRating] = useState(4.5);
  const [tacticsRating, setTacticsRating] = useState(4.5);
  const [physicalRating, setPhysicalRating] = useState(4.5);
  const [disciplineRating, setDisciplineRating] = useState(4.5);

  const [chatInput, setChatInput] = useState('');

  // States for client relationship risk submission from trainer
  const [trainerSelectedClientId, setTrainerSelectedClientId] = useState<string | null>(null);
  const [trainerRiskType, setTrainerRiskType] = useState<'none' | 'conflict' | 'absences'>('none');
  const [trainerRiskDetails, setTrainerRiskDetails] = useState('');
  const [trainerRiskUrgency, setTrainerRiskUrgency] = useState<'none' | 'intervene' | 'urgent'>('none');
  const [trainerRiskComment, setTrainerRiskComment] = useState('');

  const handleTrainerSubmitRisk = async () => {
    if (!trainerSelectedClientId) return;
    try {
      await updateClient(trainerSelectedClientId, {
        riskType: trainerRiskType,
        riskDetails: trainerRiskDetails,
        riskUrgency: trainerRiskUrgency,
        riskComment: trainerRiskComment,
        relationshipRisk: trainerRiskUrgency === 'urgent' ? 'high' : (trainerRiskUrgency === 'intervene' ? 'low' : 'none')
      });
      alert('Сигнал о риске ухода / конфликте успешно отправлен руководству школы! Для Вас и менеджера сгенерированы ответные задачи в календарь.');
      // Reset
      setTrainerSelectedClientId(null);
      setTrainerRiskType('none');
      setTrainerRiskDetails('');
      setTrainerRiskUrgency('none');
      setTrainerRiskComment('');
    } catch (err: any) {
      alert('Ошибка добавления риска: ' + err.message);
    }
  };

  const myGroups = groups.filter(g => g.coachId === 'c1');
  const coachTasks = tasks.filter(t => t.assignedTo === 'trainer');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    addChatMessage({
      senderRole: 'trainer',
      senderName: `Тренер ${myCoach.name}`,
      text: chatInput
    });
    setChatInput('');
  };

  const startAttendanceMarking = (groupId: string) => {
    const groupObj = groups.find(g => g.id === groupId || g.name === groupId);
    const resolvedName = groupObj ? groupObj.name : groupId;
    setSelectedGroupForAttendance(resolvedName);
    // Pre-populate actual client players in that group using case-insensitive trimmed matching
    const groupPlayers = clients.filter(c => 
      c.groupName && 
      resolvedName && 
      c.groupName.trim().toLowerCase() === resolvedName.trim().toLowerCase()
    );
    const initialRecs: any = {};
    groupPlayers.forEach(p => {
      initialRecs[p.id] = { status: 'present', reason: '' };
    });
    setAttendanceRecords(initialRecs);
    setUploadedAttendancePhoto(null);
    setSessionNotes('');
  };

  const handleAttendanceChange = (playerId: string, status: 'present' | 'absent_sick' | 'absent', reason = '') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [playerId]: { status, reason }
    }));
  };

  const submitAttendanceToCRM = () => {
    if (!selectedGroupForAttendance) return;
    const formattedDate = 'Сегодня';
    const records = Object.keys(attendanceRecords).map(pid => ({
      clientId: pid,
      status: attendanceRecords[pid].status,
      reason: attendanceRecords[pid].reason
    }));

    markAttendance(selectedGroupForAttendance, formattedDate, records, uploadedAttendancePhoto || 'фотоотчет_тренировки_сп.jpg', sessionNotes);
    alert('Ведомость посещаемости успешно сохранена и передана в бухгалтерию администрации!');
    setSelectedGroupForAttendance(null);
  };

  const submitPlayerRating = () => {
    if (!selectedPlayerForRating) return;
    ratePlayer(selectedPlayerForRating, {
      technique: techniqueRating,
      tactics: tacticsRating,
      physical: physicalRating,
      discipline: disciplineRating
    });
    alert('Спортивный отчет игрока успешно обновлен в его личном кабинете!');
    setSelectedPlayerForRating(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      
      {/* Header element */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            Добрый день, {myCoach.name ? (myCoach.name.split(' ')[1] || myCoach.name.split(' ')[0] || 'Тренер') : 'Тренер'}!
          </h1>
          <p className="text-gray-500 text-sm">Панель управления тренера. Координируйте нагрузку и оценивайте результаты учеников.</p>
        </div>

        <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-155 px-4 py-2 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <div className="text-xs text-left">
            <span className="font-extrabold text-emerald-700">{myCoach.role}</span>
            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Филиал Спартак</div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* TAB 1: DASHBOARD OVERVIEW (МАТЧИТ ИЗОБРАЖЕНИЕ №3) */}
        {activeTab === 'trainer_home' && (
          <div id="trainer-main-dashboard" className="space-y-6">
            
            {/* Top stats boxes exactly like on Image 3 */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Мои группы</span>
                <div className="text-2xl font-black text-slate-900 mt-1">4</div>
                <div className="text-[10px] text-gray-400 mt-0.5">123 игрока закреплено</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Тренировок в неделю</span>
                <div className="text-2xl font-black text-slate-900 mt-1">8</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Следующая: сегодня 17:00</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Ср. посещаемость</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">87%</div>
                <div className="text-[10px] text-emerald-600 mt-0.5 font-bold">↑ +5% к прошлой неделе</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Оценка игроков</span>
                <div className="text-2xl font-black text-amber-500 mt-1">4,6</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Средний балл по школе</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-105 shadow-xs col-span-2 lg:col-span-1 text-left">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Задачи на day</span>
                <div className="text-2xl font-black text-emerald-650 text-emerald-600 mt-1">{coachTasks.filter(t => t.status !== 'completed').length}</div>
                <div className="text-[10px] text-orange-500 font-bold">2 просрочено</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left col: Today Schedule & My Groups Status */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Расписание на сегодня */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">Расписание на сегодня (21 мая, среда)</h3>
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="space-y-3">
                    {myGroups.length > 0 ? (
                      myGroups.map((g, idx) => {
                        const firstSchedule = g.scheduleDays[0] || '17:00';
                        const timeStr = firstSchedule.split(' ')[1] || firstSchedule;
                        const placeStr = g.name.toLowerCase().includes('школа 135') ? 'Манеж Спартак' : 'Импульс Арена';
                        return (
                          <div key={g.id} className={`p-4 border rounded-xl flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/30 transition duration-150`}>
                            <div className="space-y-1 text-left">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[9px] uppercase">
                                {timeStr}
                              </span>
                              <div className="font-bold text-slate-850 text-xs mt-1">{g.name} — {placeStr}</div>
                              <p className="text-[10px] text-gray-400">Групповая тренировка • {g.playersCount} игроков</p>
                            </div>
                            <button 
                              onClick={() => startAttendanceMarking(g.id)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 font-bold text-white rounded text-[10px] uppercase transition"
                            >
                              Заполнить посещения
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-slate-50 border rounded-xl text-center text-xs text-gray-400 font-semibold">
                        Нет назначенных групп или тренировок на сегодня.
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <div className="text-xs font-bold font-mono text-slate-500">21:00 – 22:00</div>
                        <div className="font-bold text-slate-800 text-xs">Родительское собрание — Онлайн (Zoom)</div>
                        <div className="text-[10px] text-gray-400">Запланировано • Все родители групп</div>
                      </div>
                      <span className="px-2.5 py-1 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 rounded">
                        запланировано
                      </span>
                    </div>
                  </div>
                </div>

                {/* My Groups List - Image 3 right */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">Мои тренировочные группы</h3>
                    <span className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">Перейти ко всем</span>
                  </div>

                  <div className="space-y-3">
                    {myGroups.map((grp, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 hover:bg-slate-100/60 border rounded-xl transition flex justify-between items-center">
                        <div className="text-left space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-slate-900 text-sm">{grp.name}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[9px] font-mono font-bold">
                              Год р.: {grp.year}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-405 font-medium">Расписание: {grp.scheduleDays.join(', ')}</div>
                        </div>

                        <div className="flex space-x-6 items-center text-xs">
                          <div className="text-center">
                            <div className="font-bold text-slate-800">{grp.playersCount}</div>
                            <div className="text-[9px] text-gray-400">Игроков</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-emerald-600">{grp.attendanceRate}%</div>
                            <div className="text-[9px] text-gray-400">Посещ.</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last ratings list - Image 3 middle right */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">Последние оценки игроков группы</h3>
                    <span className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">Все оценки</span>
                  </div>

                  <div className="space-y-3 text-left">
                    {clients.filter(c => c.status === 'active').slice(0, 3).map((item, id) => (
                      <div key={id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between hover:shadow-2xs cursor-pointer"
                        onClick={() => {
                          setSelectedPlayerForRating(item.id);
                          setTechniqueRating(item.progress.technique);
                          setTacticsRating(item.progress.tactics);
                          setPhysicalRating(item.progress.physical);
                          setDisciplineRating(item.progress.discipline);
                        }}
                      >
                        <div className="flex items-center space-x-3 text-xs">
                          <div className="h-8 w-8 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center">
                            {item.childName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{item.childSurname} {item.childName}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{item.groupName} • Средняя оценка {((item.progress.technique + item.progress.tactics + item.progress.physical + item.progress.discipline)/4).toFixed(1)}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-mono font-bold text-slate-800">4.{7 - id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right column: Tasks list & File Library */}
              <div className="space-y-6">
                
                {/* Trainer Client Risk & Conflict Panel */}
                <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm space-y-4 text-left">
                  <div className="flex border-b border-rose-100 pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5 text-rose-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      Сигнал о риске ухода / Конфликте
                    </h3>
                    <span className="text-[9px] bg-rose-50 text-rose-700 font-extrabold px-1.5 py-0.5 rounded uppercase">CRM Контроль</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Выберите воспитанника</label>
                      <select 
                        className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium"
                        value={trainerSelectedClientId || ''}
                        onChange={(e) => setTrainerSelectedClientId(e.target.value)}
                      >
                        <option value="">-- Выберите ученика --</option>
                        {clients.filter(c => c.status === 'active' || c.status === 'trial').map(c => (
                          <option key={c.id} value={c.id}>{c.childSurname} {c.childName} ({c.groupName || 'Без группы'})</option>
                        ))}
                      </select>
                    </div>

                    {trainerSelectedClientId && (
                      <div className="space-y-3 pt-3 border-t border-slate-100 animate-fadeIn text-left">
                        <div className="space-y-1">
                          <label className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Тип возникающего риска</label>
                          <select 
                            className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-medium"
                            value={trainerRiskType}
                            onChange={(e: any) => setTrainerRiskType(e.target.value)}
                          >
                            <option value="none">Нет рисков / Норма</option>
                            <option value="conflict">Конфликт (указывается с кем)</option>
                            <option value="absences">Пропуски (более 2-х)</option>
                          </select>
                        </div>

                        {trainerRiskType === 'conflict' && (
                          <div className="space-y-1">
                            <label className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">С кем конкретно возник конфликт?</label>
                            <input 
                              type="text"
                              className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800"
                              placeholder="Например: с тренером Василием, с родителем Иванова"
                              value={trainerRiskDetails}
                              onChange={(e) => setTrainerRiskDetails(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Уровень срочности вмешательства</label>
                          <select 
                            className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs text-slate-700 font-bold"
                            value={trainerRiskUrgency}
                            onChange={(e: any) => setTrainerRiskUrgency(e.target.value)}
                          >
                            <option value="none">Штатное урегулирование</option>
                            <option value="intervene">Вмешаться</option>
                            <option value="urgent">СРОЧНО</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Активный комментарий к ситуации</label>
                          <textarea 
                            rows={2}
                            maxLength={400}
                            className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 resize-none leading-relaxed placeholder:text-gray-400"
                            placeholder="Опишите подробности происходящего конфликта или неявки..."
                            value={trainerRiskComment}
                            onChange={(e) => setTrainerRiskComment(e.target.value)}
                          />
                        </div>

                        <button
                          onClick={handleTrainerSubmitRisk}
                          className="w-full py-2.5 bg-rose-520 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition duration-150 flex items-center justify-center space-x-1"
                        >
                          <span>Отправить сигнал в CRM</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checklists CRM Tasks */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">Список текущих задач</h3>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Задачник</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {coachTasks.map((t, idx) => (
                      <div key={idx} className="flex items-start space-x-3.5">
                        <button 
                          onClick={() => {
                            completeTask(t.id);
                            alert(`Задача "${t.title}" отмечена решенной! Руководство получит сведения.`);
                          }}
                          className={`mt-0.5 p-0.5 rounded border transition ${
                            t.status === 'completed' 
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-800' 
                              : 'border-gray-300 text-transparent hover:border-gray-500'
                          }`}
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                        </button>
                        <div className="space-y-0.5">
                          <h4 className={`font-semibold ${t.status === 'completed' ? 'line-through text-gray-450' : 'text-slate-800'}`}>
                            {t.title}
                          </h4>
                          <p className="text-[10px] text-gray-400">{t.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[9px] font-mono text-orange-500 font-bold">{t.dueDate}</span>
                            <span>•</span>
                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{t.assignedTo}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Downloads library - Image 3 right bottom */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">Учебно-методические материалы</h3>
                    <span className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">Все</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'План тренировки 21.05.2025', size: 'PDF • 245 КБ', date: 'Загружено сегодня' },
                      { name: 'Упражнения на владение мячом', size: 'PDF • 1.2 МБ', date: 'Загружено вчера' },
                      { name: 'Методика ОФП для тренеров', size: 'PDF • 3.4 МБ', date: '18 мая 2026' }
                    ].map((file, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border rounded-xl hover:shadow-3xs transition flex items-center justify-between">
                        <div className="space-y-0.5 max-w-[180px]">
                          <div className="font-bold text-slate-800 text-xs truncate" title={file.name}>{file.name}</div>
                          <div className="text-[9px] text-gray-400 font-mono font-medium">{file.size} • {file.date}</div>
                        </div>
                        <button 
                          onClick={() => alert(`Начата симуляция безопасного скачивания файла методики "${file.name}"...`)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded transition text-slate-600"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'trainer_schedule' && (
          <div className="bg-white rounded-2xl p-0 border border-slate-200 overflow-hidden shadow-sm">
            <ScheduleCalendar />
          </div>
        )}

        {/* TAB 3: ATTENDANCE POPUP/WIDGET */}
        {activeTab === 'trainer_attendance' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">Ведомости присутствия на занятии</h3>
            
            {!selectedGroupForAttendance ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Выберите группу для составления электронного табеля посещаемости за сегодня:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGroups.map((g, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border-2 border-slate-100 hover:border-emerald-600/30 rounded-2xl transition flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-slate-850">{g.name}</div>
                        <p className="text-xs text-gray-405 mt-1">Обучается: {g.playersCount} воспитанников</p>
                      </div>
                      <button 
                        onClick={() => startAttendanceMarking(g.id)}
                        className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs transition"
                      >
                        Открыть список
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-150 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">Вы зашли в табель {selectedGroupForAttendance} — Сегодня</span>
                  <button 
                    onClick={() => setSelectedGroupForAttendance(null)}
                    className="text-xs focus:underline text-slate-500 font-bold"
                  >
                    Вернуться назад
                  </button>
                </div>

                {/* Submitting attendance controls with real photo upload validation simulation */}
                <div className="p-4 bg-slate-50 border rounded-xl space-y-3.5 select-none">
                  <div className="font-bold text-slate-850 text-xs flex items-center space-x-2">
                    <Camera className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Фиксация достоверности (Фотоотчет тренировки)</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Уважаемый тренер, приложите фото построения группы на газоне для автоматического подтверждения проведения тренировки администратору.</p>
                  
                  <div className="flex items-center space-x-3.5">
                    <button 
                      type="button" 
                      onClick={() => setUploadedAttendancePhoto('photo_confirmed_gps_track.jpg')}
                      className="px-3 py-1.5 bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg transition"
                    >
                      Прикрепить фотоотчет
                    </button>
                    <span className="text-xs font-mono text-gray-405">
                      {uploadedAttendancePhoto ? '✅ Файл прикреплен: ' + uploadedAttendancePhoto : '⚠️ Фото не прикреплено (будет использован автоснимок)'}
                    </span>
                  </div>
                </div>

                {/* Players state check-sheet */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">Список воспитанников</h4>
                  <div className="divide-y divide-gray-150">
                    {clients.filter(c => {
                      const cGroup = c.groupName?.trim().toLowerCase();
                      const sGroup = selectedGroupForAttendance?.trim().toLowerCase();
                      return !!cGroup && !!sGroup && (cGroup === sGroup || (c.status === 'trial' && cGroup === sGroup));
                    }).map((p, i) => {
                      const isTrial = p.status === 'trial';
                      return (
                        <div key={i} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-bold text-slate-850">{p.childSurname} {p.childName}</span>
                            {isTrial && (
                              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[9px] font-black uppercase tracking-wider">
                                ПРОБНОЕ ЗАНЯТИЕ
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            <button 
                              onClick={() => handleAttendanceChange(p.id, 'present')}
                              className={`px-3 py-1 rounded-lg font-bold ${
                                attendanceRecords[p.id]?.status === 'present' 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-slate-100 text-gray-500'
                              }`}
                            >
                              Был
                            </button>
                            <button 
                              onClick={() => handleAttendanceChange(p.id, 'absent_sick')}
                              className={`px-3 py-1 rounded-lg font-bold ${
                                attendanceRecords[p.id]?.status === 'absent_sick' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-slate-100 text-gray-500'
                              }`}
                            >
                              Болен
                            </button>
                            <button 
                              onClick={() => handleAttendanceChange(p.id, 'absent')}
                              className={`px-3 py-1 rounded-lg font-bold ${
                                attendanceRecords[p.id]?.status === 'absent' 
                                  ? 'bg-amber-400 text-slate-900' 
                                  : 'bg-slate-100 text-gray-500'
                              }`}
                            >
                              Пропуск
                            </button>

                            {(attendanceRecords[p.id]?.status === 'absent' || attendanceRecords[p.id]?.status === 'absent_sick') && (
                              <input 
                                type="text" 
                                placeholder="Укажите причину..." 
                                value={attendanceRecords[p.id]?.reason || ''}
                                onChange={(e) => handleAttendanceChange(p.id, attendanceRecords[p.id]?.status, e.target.value)}
                                className="px-2.5 py-1 bg-white border rounded text-[11px] w-36"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-800 text-xs text-left">Заметки о тренировке (для директора)</h4>
                  <textarea 
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Например: Отрабатывали удары по воротам. Все молодцы, Иванов И. отличился..."
                    className="w-full h-24 p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex space-x-3.5 pt-4 border-t border-gray-150">
                  <button 
                    onClick={submitAttendanceToCRM}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition"
                  >
                    Завершить и отправить ведомость
                  </button>
                  <button 
                    onClick={() => setSelectedGroupForAttendance(null)}
                    className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PLAYER RATING */}
        {activeTab === 'trainer_progress' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">Оценка успеваемости и геймификация</h3>
            <p className="text-xs text-gray-505">Выберите ученика для внесения профессиональных оценок спортивных качеств:</p>

            {!selectedPlayerForRating ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {clients.filter(c => c.status === 'active').map((player, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setSelectedPlayerForRating(player.id);
                      setTechniqueRating(player.progress.technique);
                      setTacticsRating(player.progress.tactics);
                      setPhysicalRating(player.progress.physical);
                      setDisciplineRating(player.progress.discipline);
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl cursor-pointer border text-left flex items-center justify-between transition"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 text-xs">{player.childSurname} {player.childName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{player.groupName}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border rounded-xl max-w-xl mx-auto space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-slate-800 text-sm">Панель оценки: {clients.find(c => c.id===selectedPlayerForRating)?.childSurname} {clients.find(c => c.id===selectedPlayerForRating)?.childName}</h4>
                  <button onClick={() => setSelectedPlayerForRating(null)} className="text-xs text-gray-400 font-bold">Закрыть</button>
                </div>

                <div className="space-y-4 text-xs">
                  {[
                    { label: 'Технические навыки (дриблинг, ведение, пас, удар)', value: techniqueRating, setter: setTechniqueRating },
                    { label: 'Тактическое понимание (выбор позиции, игра в пас)', value: tacticsRating, setter: setTacticsRating },
                    { label: 'Физическая подготовка (выносливость, скорость, координация)', value: physicalRating, setter: setPhysicalRating },
                    { label: 'Дисциплина (соблюдение правил, слушает тренера)', value: disciplineRating, setter: setDisciplineRating }
                  ].map((field, id) => (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-600">{field.label}</span>
                        <span className="text-emerald-600 underline font-mono">{field.value.toFixed(1)} / 5.0</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="0.1" 
                        value={field.value}
                        onChange={(e) => field.setter(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3.5 pt-3.5 border-t">
                  <button 
                    onClick={submitPlayerRating}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold"
                  >
                    Утвердить новые оценки
                  </button>
                  <button 
                    onClick={() => setSelectedPlayerForRating(null)}
                    className="px-4 py-2 bg-slate-300 rounded-lg text-slate-700 font-bold"
                  >
                    Назад
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: MESSAGES CHAT */}
        {activeTab === 'trainer_messages' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[520px] overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 border rounded-full flex items-center justify-center font-bold">
                  Ч
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-sm">Общий чат тренеров и администрации</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Безопасный корпоративный канал связи</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">В сети</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 text-xs">
              {messages.map((ms, id) => {
                const isMe = ms.senderRole === 'trainer';
                return (
                  <div key={id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs sm:max-w-md p-3 rounded-2xl ${
                      isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'
                    }`}>
                      <div className="flex justify-between items-center mb-1 text-[9px] opacity-80 font-bold">
                        <span>{ms.senderName}</span>
                        <span className="font-mono ml-4">{ms.timestamp}</span>
                      </div>
                      <p className="leading-relaxed text-left">{ms.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t bg-white flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="Обсудить спортивные показатели, задолженности или планы тренировок..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-100 focus:bg-white border rounded-xl text-xs outline-none"
              />
              <button type="submit" className="p-2.5 bg-indigo-600 hover:bg-indigo-505 rounded-xl text-white transition-all shadow-sm">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
