import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Users, FolderPlus, Trash2, UserPlus, UserMinus, Search, 
  Calendar, Plus, X, GraduationCap, Check, Edit2, Trophy
} from 'lucide-react';
import { parseScheduleString } from '../utils/scheduleParser';

export const GroupsModule: React.FC = () => {
  const { 
    groups, 
    coaches, 
    clients, 
    createGroup, 
    deleteGroup, 
    updateGroup,
    assignClientToGroup,
    assignClientToSelectTeam,
    removeClientFromSelectTeam
  } = useCRM();

  // 1. Search and Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);

  // 2. New Group Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupYear, setNewGroupYear] = useState<number>(new Date().getFullYear() - 10); // legacy
  const [newGroupBirthYearFrom, setNewGroupBirthYearFrom] = useState<number>(new Date().getFullYear() - 11);
  const [newGroupBirthYearTo, setNewGroupBirthYearTo] = useState<number>(new Date().getFullYear() - 9);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [newGroupSchedule, setNewGroupSchedule] = useState<string[]>(['Пн 18:00', 'Ср 18:00']);
  const [scheduleInput, setScheduleInput] = useState('Пн 18:00, Ср 18:00');
  const [newIsSelectTeam, setNewIsSelectTeam] = useState(false);
  const [newTargetCompetition, setNewTargetCompetition] = useState('');

  // Edit Group Form States
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupYear, setEditGroupYear] = useState<number>(new Date().getFullYear() - 10); // legacy
  const [editGroupBirthYearFrom, setEditGroupBirthYearFrom] = useState<number>(new Date().getFullYear() - 11);
  const [editGroupBirthYearTo, setEditGroupBirthYearTo] = useState<number>(new Date().getFullYear() - 9);
  const [editSelectedCoachId, setEditSelectedCoachId] = useState('');
  const [editScheduleInput, setEditScheduleInput] = useState('');
  const [editIsSelectTeam, setEditIsSelectTeam] = useState(false);
  const [editTargetCompetition, setEditTargetCompetition] = useState('');

  // Quick assignment states
  const [selectedClientIdToAssign, setSelectedClientIdToAssign] = useState('');
  const [targetGroupForClient, setTargetGroupForClient] = useState('');

  // 3. Dynamic metrics
  const totalGroupsCount = groups.length;
  const totalClientsInGroups = clients.filter(c => 
    c.groupName && groups.some(g => g.name.trim().toLowerCase() === c.groupName?.trim().toLowerCase())
  ).length;
  const unassignedClients = clients.filter(c => 
    !c.groupName || !groups.some(g => g.name.trim().toLowerCase() === c.groupName?.trim().toLowerCase())
  );
  const totalUnassignedCount = unassignedClients.length;
  const availableCoachesCount = coaches.length;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Пожалуйста, введите название группы');
      return;
    }

    const matchedCoach = coaches.find(c => c.id === selectedCoachId);
    const coachName = matchedCoach ? matchedCoach.name : 'Старший тренер';
    const coachId = selectedCoachId || 'c1';

    // Parse schedules from text input
    const parsedSlots = parseScheduleString(scheduleInput);
    const parsedSchedule = parsedSlots.map(slot => slot.raw);

    try {
      await createGroup(
        newGroupName,
        newGroupYear,
        newGroupBirthYearFrom,
        newGroupBirthYearTo,
        coachId,
        coachName,
        parsedSchedule.length > 0 ? parsedSchedule : newGroupSchedule,
        newIsSelectTeam,
        newTargetCompetition
      );

      // Reset
      setNewGroupName('');
      setNewGroupYear(new Date().getFullYear() - 10);
      setNewGroupBirthYearFrom(new Date().getFullYear() - 11);
      setNewGroupBirthYearTo(new Date().getFullYear() - 9);
      setSelectedCoachId('');
      setScheduleInput('Пн 18:00, Ср 18:05');
      setNewIsSelectTeam(false);
      setNewTargetCompetition('');
      setShowCreateModal(false);
    } catch (err: any) {
      alert('Ошибка при создании группы: ' + err.message);
    }
  };

  const handleStartEdit = (group: any) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupYear(group.year);
    setEditGroupBirthYearFrom(group.birthYearFrom || group.year - 1);
    setEditGroupBirthYearTo(group.birthYearTo || group.year + 1);
    setEditSelectedCoachId(group.coachId || '');
    setEditScheduleInput(group.scheduleDays.join(', '));
    setEditIsSelectTeam(group.isSelectTeam || false);
    setEditTargetCompetition(group.targetCompetition || '');
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    if (!editGroupName.trim()) {
      alert('Пожалуйста, введите название группы');
      return;
    }

    const matchedCoach = coaches.find(c => c.id === editSelectedCoachId);
    const coachName = matchedCoach ? matchedCoach.name : 'Не назначен';
    const coachId = editSelectedCoachId || '';

    const parsedSlots = parseScheduleString(editScheduleInput);
    const parsedSchedule = parsedSlots.map(slot => slot.raw);

    try {
      await updateGroup(editingGroup.id, {
        name: editGroupName.trim(),
        year: editGroupYear,
        birthYearFrom: editGroupBirthYearFrom,
        birthYearTo: editGroupBirthYearTo,
        coachId,
        coachName,
        scheduleDays: parsedSchedule,
        isSelectTeam: editIsSelectTeam,
        targetCompetition: editTargetCompetition
      });

      setEditingGroup(null);
    } catch (err: any) {
      alert('Ошибка при обновлении группы: ' + err.message);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `Вы действительно хотите распустить и удалить группу "${name}"?\nВсе ученики этой группы будут переведены в статус ожидания распределения.`
    );
    if (!isConfirmed) return;

    try {
      await deleteGroup(id);
    } catch (err: any) {
      alert('Ошибка при удалении группы: ' + err.message);
    }
  };

  const handleQuickAssign = async (clientId: string, groupName: string | null) => {
    try {
      await assignClientToGroup(clientId, groupName);
    } catch (err: any) {
      alert('Ошибка назначения группы: ' + err.message);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => {
    const fullName = `${c.childName} ${c.childSurname} ${c.parentName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    const nameA = `${a.childSurname} ${a.childName}`.trim().toLowerCase();
    const nameB = `${b.childSurname} ${b.childName}`.trim().toLowerCase();
    return nameA.localeCompare(nameB, 'ru');
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">Группы и составы</h1>
          <p className="text-gray-500 text-sm">Создание и расформирование групп, распределение учеников, планирование расписаний.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-650 hover:bg-red-700 bg-red-600 font-bold rounded-xl text-white text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-red-600/10 cursor-pointer self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Добавить новую группу</span>
        </button>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* KPI METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Всего групп</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalGroupsCount}</div>
            <div className="text-[10px] text-gray-400 font-semibold mt-1">Тренировочные составы</div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Детей распределено</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalClientsInGroups}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">Обучаются в группах</div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Ожидают распределения</span>
            <div className="text-2xl font-black text-orange-600 mt-1">{totalUnassignedCount}</div>
            <div className="text-[10px] text-orange-600 font-semibold mt-1">{totalUnassignedCount > 0 ? 'Требуется распределить ⚠️' : 'Все дети в группах! ✅'}</div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Активные тренеры</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{availableCoachesCount}</div>
            <div className="text-[10px] text-gray-500 font-semibold mt-1">Штатный тренерский состав</div>
          </div>
        </div>

        {/* WORKSPACE SECTIONS: Left Groups Cards, Right Unassigned Players Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1 & 2: TRAINING GROUPS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider font-mono">Список тренировочных групп ({totalGroupsCount})</h2>
              {groups.length > 5 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Быстрый поиск по группам..."
                    className="pl-8 pr-3 py-1 bg-white border rounded-lg text-xs font-medium w-48 text-left focus:outline-none focus:border-red-550"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                </div>
              )}
            </div>

            {groups.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed rounded-2xl shadow-xs space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Группы не созданы</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">Создайте вашу первую футбольную группу с помощью кнопки выше, определите ей возраст, тренера и состав учащихся.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => {
                  // Get dynamic client count assigned to this group name by stripping whitespace and matching case-insensitively
                  const groupClientsList = group.isSelectTeam 
                    ? clients.filter(c => group.selectedClientIds?.includes(c.id)).sort((a,b) => `${a.childSurname} ${a.childName}`.localeCompare(`${b.childSurname} ${b.childName}`, 'ru'))
                    : clients.filter(c => 
                        c.groupName && 
                        group.name && 
                        c.groupName.trim().toLowerCase() === group.name.trim().toLowerCase()
                      ).sort((a, b) => {
                        const nameA = `${a.childSurname} ${a.childName}`.trim().toLowerCase();
                        const nameB = `${b.childSurname} ${b.childName}`.trim().toLowerCase();
                        return nameA.localeCompare(nameB, 'ru');
                      });
                  const isNoCoach = !group.coachId;

                  return (
                    <div 
                      key={group.id} 
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition duration-200"
                    >
                      {/* Card Header */}
                      <div className="p-4 border-b border-gray-50/80 flex items-start justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            {group.isSelectTeam && (
                              <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono">
                                <Trophy className="w-3 h-3 text-red-500" />
                                <span>Сборная</span>
                              </span>
                            )}
                            <div className="inline-flex items-center space-x-1.5 bg-red-50 text-red-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono">
                              <span>
                                {group.birthYearFrom && group.birthYearTo 
                                  ? `${group.birthYearFrom} - ${group.birthYearTo} Год р.`
                                  : `${group.year} Год р.`
                                }
                              </span>
                            </div>
                          </div>
                          <h3 className="text-base font-black text-slate-900 tracking-tight text-left">
                            {group.name}
                            {group.targetCompetition && <span className="block text-xs font-semibold text-gray-500 mt-0.5">{group.targetCompetition}</span>}
                          </h3>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button 
                            onClick={() => handleStartEdit(group)}
                            className="p-1.5 hover:bg-neutral-50 text-slate-500 hover:text-red-650 rounded-lg transition cursor-pointer"
                            title="Редактировать группу"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="p-1.5 hover:bg-neutral-50 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Удалить группу"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Card Properties */}
                      <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 text-xs font-semibold text-neutral-600 flex flex-col space-y-1 text-left">
                        <div className="flex items-center space-x-2 text-slate-800">
                          <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Тренер: <strong>{group.coachName || 'Не назначен'}</strong></span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="truncate">Расписание: <strong className="text-slate-800 font-mono text-[11px]">{group.scheduleDays.join(', ') || 'Гибкое'}</strong></span>
                        </div>
                      </div>

                      {/* Players list inside Group */}
                      <div className="flex-1 p-3.5 space-y-2 text-left">
                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                          <span>Состав группы</span>
                          <span className="font-mono text-slate-705">{groupClientsList.length} Воспитанников</span>
                        </div>

                        {groupClientsList.length === 0 ? (
                          <div className="py-6 px-4 bg-slate-50/50 border border-dashed rounded-xl text-center text-xs text-gray-400 italic">
                            Группа пуста. Добавьте учеников из списка справа.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {groupClientsList.map((client) => (
                              <div 
                                key={client.id}
                                className="p-2 bg-slate-50/50 border rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/40 transition"
                              >
                                <div className="truncate pr-2">
                                  <div className="font-bold text-slate-800 truncate">
                                    {client.childName} {client.childSurname}
                                  </div>
                                  <div className="text-[9px] text-gray-400 font-medium truncate">
                                    {client.parentName} • {client.parentPhone}
                                  </div>
                                </div>

                                <button
                                  onClick={async () => {
                                    if (group.isSelectTeam) {
                                      await removeClientFromSelectTeam(client.id, group.id);
                                    } else {
                                      handleQuickAssign(client.id, null);
                                    }
                                  }}
                                  className="text-[10px] text-orange-655 font-bold hover:text-red-650 bg-orange-100/50 hover:bg-red-100 p-1 rounded transition text-orange-600 shrink-0"
                                  title="Исключить из группы"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Assign Select list */}
                      {(group.isSelectTeam ? clients.filter(c => !group.selectedClientIds?.includes(c.id)) : unassignedClients).length > 0 && (
                        <div className="p-3 border-t bg-slate-50 border-gray-100 rounded-b-2xl">
                          <div className="flex items-center space-x-1.5">
                            <select
                              defaultValue=""
                              onChange={async (e) => {
                                const val = e.target.value;
                                if (val) {
                                  if (group.isSelectTeam) {
                                    await assignClientToSelectTeam(val, group.id);
                                  } else {
                                    handleQuickAssign(val, group.name);
                                  }
                                  e.target.value = ''; // Reset select
                                }
                              }}
                              className="flex-1 bg-white border rounded-xl py-1 px-2.5 text-xs font-bold text-slate-705 focus:outline-none"
                            >
                              <option value="">+ Зачислить ученика...</option>
                              {(group.isSelectTeam ? clients.filter(c => !group.selectedClientIds?.includes(c.id)).sort((a,b) => `${a.childSurname} ${a.childName}`.localeCompare(`${b.childSurname} ${b.childName}`, 'ru')) : unassignedClients).map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.childName} {c.childSurname} {group.isSelectTeam && c.groupName ? `(${c.groupName})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 3: UNASSIGNED STUDENTS */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider font-mono text-left">Ожидают распределения ({totalUnassignedCount})</h2>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4.5 shadow-sm space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Найти ученика..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-32 py-2 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-red-600 focus:border-red-600"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 py-0.5 px-1 bg-slate-200 hover:bg-slate-300 rounded text-[9px] font-bold"
                  >
                    Сброс
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredClients.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 italic bg-slate-50 border border-dashed rounded-xl">
                    Учеников не обнаружено.
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const hasGroup = !!client.groupName;
                    
                    return (
                      <div 
                        key={client.id} 
                        className={`p-3 border rounded-xl flex flex-col space-y-2 text-left transition ${
                          hasGroup ? 'bg-slate-50 border-gray-100 opacity-70' : 'bg-red-50/10 border-red-100 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs truncate">
                              {client.childName} {client.childSurname}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-bold font-mono">
                              Возраст: {client.childAge} лет • {client.childBirthYear} г.р.
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium truncate">
                              Родитель: {client.parentName}
                            </p>
                          </div>

                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                            hasGroup ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-850 text-orange-700'
                          }`}>
                            {hasGroup ? client.groupName : 'Без группы'}
                          </span>
                        </div>

                        {/* Interactive Assign Button Row */}
                        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5">
                          <select
                            value={client.groupName ? (groups.find(g => g.name.trim().toLowerCase() === client.groupName?.trim().toLowerCase())?.name || client.groupName) : ''}
                            onChange={(e) => {
                              const selectedGName = e.target.value;
                              handleQuickAssign(client.id, selectedGName || null);
                            }}
                            className="bg-slate-100 border rounded-lg py-1 px-2 text-[10px] font-bold text-slate-705 text-left focus:outline-none flex-1"
                          >
                            <option value="">-- Выберите группу --</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.name}>
                                {g.name}
                              </option>
                            ))}
                            {hasGroup && <option value="">Удалить из группы</option>}
                          </select>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CREATE NEW TRAINING GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-red-600" />
              <span>Создать учебную группу</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">Укажите параметры новой группы, расписание и прикрепите тренера.</p>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Название группы</label>
                <input
                  type="text"
                  placeholder="Например: Группа 2015 спартак"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Год рождения учеников</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">с</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={newGroupBirthYearFrom}
                      onChange={(e) => setNewGroupBirthYearFrom(parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                    <span className="text-xs font-bold text-gray-500">до</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={newGroupBirthYearTo}
                      onChange={(e) => setNewGroupBirthYearTo(parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Тренер</label>
                  <select
                    required
                    value={selectedCoachId}
                    onChange={(e) => setSelectedCoachId(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="">-- Выбрать тренера --</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Расписание тренировок</label>
                <input
                  type="text"
                  placeholder="Например: Пн 18:00, Ср 18:00"
                  required
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 leading-normal mt-1">Через запятую. Формат: ДеньНедели ЧЧ:ММ (Пн 18:00, Ср 18:00)</p>
              </div>

              <div className="space-y-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newIsSelectTeam}
                    onChange={(e) => setNewIsSelectTeam(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5"><Trophy className="w-4 h-4 text-orange-500" /> Это сборная команда</span>
                </label>
                {newIsSelectTeam && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Целевое соревнование (Необязательно)</label>
                    <input 
                      type="text"
                      value={newTargetCompetition}
                      onChange={(e) => setNewTargetCompetition(e.target.value)}
                      placeholder="Напр. Кубок Мэра 2026"
                      className="w-full px-3 py-2 border border-red-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md"
                >
                  Создать группу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TRAINING GROUP MODAL */}
      {editingGroup && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditingGroup(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-red-650 animate-pulse" />
              <span>Редактировать группу</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">Измените параметры группы, скорректируйте расписание или смените тренера.</p>

            <form onSubmit={handleUpdateGroup} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Название группы</label>
                <input
                  type="text"
                  placeholder="Например: Группа 2015 спартак"
                  required
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Год рождения учеников</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">с</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={editGroupBirthYearFrom}
                      onChange={(e) => setEditGroupBirthYearFrom(parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                    <span className="text-xs font-bold text-gray-500">до</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={editGroupBirthYearTo}
                      onChange={(e) => setEditGroupBirthYearTo(parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Тренер</label>
                  <select
                    required
                    value={editSelectedCoachId}
                    onChange={(e) => setEditSelectedCoachId(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="">-- Выбрать тренера --</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">Расписание тренировок</label>
                <input
                  type="text"
                  placeholder="Например: Пн 18:00, Ср 18:00"
                  required
                  value={editScheduleInput}
                  onChange={(e) => setEditScheduleInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 leading-normal mt-1">Через запятую. Формат: ДеньНедели ЧЧ:ММ (Пн 18:00, Ср 18:00)</p>
              </div>

              <div className="space-y-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editIsSelectTeam}
                    onChange={(e) => setEditIsSelectTeam(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5"><Trophy className="w-4 h-4 text-orange-500" /> Это сборная команда</span>
                </label>
                {editIsSelectTeam && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Целевое соревнование</label>
                    <input 
                      type="text"
                      value={editTargetCompetition}
                      onChange={(e) => setEditTargetCompetition(e.target.value)}
                      placeholder="Напр. Кубок Мэра"
                      className="w-full px-3 py-2 border border-red-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase transition cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md shadow-red-600/10 cursor-pointer"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
