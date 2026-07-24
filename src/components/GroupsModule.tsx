import React, { useState } from "react";
import { HeaderDescription } from "./HeaderDescription";
import { useCRM } from "../context/CRMContext";
import {
  Users,
  FolderPlus,
  Trash2,
  UserPlus,
  UserMinus,
  Search,
  Calendar,
  Plus,
  X,
  GraduationCap,
  Check,
  Edit2,
  Trophy,
} from "lucide-react";
import { parseScheduleString } from "../utils/scheduleParser";

export const GroupsModule: React.FC = () => {
  const {
    groups,
    coaches,
    clients,
    trainingSessions,
    finances,
    counterparties,
    createGroup,
    deleteGroup,
    updateGroup,
    assignClientToGroup,
    assignClientToSelectTeam,
    removeClientFromSelectTeam,
  } = useCRM();

  // 1. Search and Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(
    null,
  );

  // 2. New Group Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupYear, setNewGroupYear] = useState<number>(
    new Date().getFullYear() - 10,
  ); // legacy
  const [newGroupBirthYearFrom, setNewGroupBirthYearFrom] = useState<number>(
    new Date().getFullYear() - 11,
  );
  const [newGroupBirthYearTo, setNewGroupBirthYearTo] = useState<number>(
    new Date().getFullYear() - 9,
  );
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [newGroupSchedule, setNewGroupSchedule] = useState<string[]>([
    "Пн 18:00",
    "Ср 18:00",
  ]);
  const [scheduleInput, setScheduleInput] = useState("Пн 18:00, Ср 18:00");
  const [newIsSelectTeam, setNewIsSelectTeam] = useState(false);
  const [newTargetCompetition, setNewTargetCompetition] = useState("");
  const [newGroupVenueCost, setNewGroupVenueCost] = useState<number>(0);
  const [newGroupMaxCapacity, setNewGroupMaxCapacity] = useState<number>(15);
  const [newGroupVenueId, setNewGroupVenueId] = useState("");

  // Edit Group Form States
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupYear, setEditGroupYear] = useState<number>(
    new Date().getFullYear() - 10,
  ); // legacy
  const [editGroupBirthYearFrom, setEditGroupBirthYearFrom] = useState<number>(
    new Date().getFullYear() - 11,
  );
  const [editGroupBirthYearTo, setEditGroupBirthYearTo] = useState<number>(
    new Date().getFullYear() - 9,
  );
  const [editSelectedCoachId, setEditSelectedCoachId] = useState("");
  const [editScheduleInput, setEditScheduleInput] = useState("");
  const [editIsSelectTeam, setEditIsSelectTeam] = useState(false);
  const [editTargetCompetition, setEditTargetCompetition] = useState("");
  const [editVenueCost, setEditVenueCost] = useState<number>(0);
  const [editMaxCapacity, setEditMaxCapacity] = useState<number>(15);
  const [editVenueId, setEditVenueId] = useState("");

  // Quick assignment states
  const [selectedClientIdToAssign, setSelectedClientIdToAssign] = useState("");
  const [targetGroupForClient, setTargetGroupForClient] = useState("");

  // 3. Date Filters for Attendance Analysis
  const [attendanceStartDate, setAttendanceStartDate] = useState(
    (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
    })()
  );
  const [attendanceEndDate, setAttendanceEndDate] = useState(
    (() => {
      const d = new Date();
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${lastDay}`;
    })()
  );
  
  // Analytics modal state
  const [analyticsGroup, setAnalyticsGroup] = useState<any | null>(null);

  // 4. Dynamic metrics
  const totalGroupsCount = groups.length;
  const totalClientsInGroups = clients.filter(
    (c) =>
      c.groupName &&
      groups.some(
        (g) =>
          g.name.trim().toLowerCase() === c.groupName?.trim().toLowerCase(),
      ),
  ).length;
  const unassignedClients = clients.filter(
    (c) =>
      !c.groupName ||
      !groups.some(
        (g) =>
          g.name.trim().toLowerCase() === c.groupName?.trim().toLowerCase(),
      ),
  );
  const totalUnassignedCount = unassignedClients.length;
  const availableCoachesCount = coaches.length;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert("Пожалуйста, введите название группы");
      return;
    }

    const matchedCoach = coaches.find((c) => c.id === selectedCoachId);
    const coachName = matchedCoach ? matchedCoach.name : "Старший тренер";
    const coachId = selectedCoachId || "c1";

    // Parse schedules from text input
    const parsedSlots = parseScheduleString(scheduleInput);
    const parsedSchedule = parsedSlots.map((slot) => slot.raw);

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
        newTargetCompetition,
        [],
        newGroupVenueCost,
        newGroupMaxCapacity,
        newGroupVenueId
      );

      // Reset
      setNewGroupName("");
      setNewGroupYear(new Date().getFullYear() - 10);
      setNewGroupBirthYearFrom(new Date().getFullYear() - 11);
      setNewGroupBirthYearTo(new Date().getFullYear() - 9);
      setSelectedCoachId("");
      setScheduleInput("Пн 18:00, Ср 18:00");
      setNewIsSelectTeam(false);
      setNewTargetCompetition("");
      setNewGroupVenueCost(0);
      setNewGroupMaxCapacity(15);
      setNewGroupVenueId("");
      setShowCreateModal(false);
    } catch (err: any) {
      alert("Ошибка при создании группы: " + err.message);
    }
  };

  const handleStartEdit = (group: any) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupYear(group.year);
    setEditGroupBirthYearFrom(group.birthYearFrom || group.year - 1);
    setEditGroupBirthYearTo(group.birthYearTo || group.year + 1);
    setEditSelectedCoachId(group.coachId || "");
    setEditScheduleInput(group.scheduleDays.join(", "));
    setEditIsSelectTeam(group.isSelectTeam || false);
    setEditTargetCompetition(group.targetCompetition || "");
    setEditVenueCost(group.venueCost || 0);
    setEditVenueId(group.venueId || "");
    setEditMaxCapacity(group.maxCapacity || 15);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    if (!editGroupName.trim()) {
      alert("Пожалуйста, введите название группы");
      return;
    }

    const matchedCoach = coaches.find((c) => c.id === editSelectedCoachId);
    const coachName = matchedCoach ? matchedCoach.name : "Не назначен";
    const coachId = editSelectedCoachId || "";

    const parsedSlots = parseScheduleString(editScheduleInput);
    const parsedSchedule = parsedSlots.map((slot) => slot.raw);

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
        targetCompetition: editTargetCompetition,
        venueCost: editVenueCost,
        maxCapacity: editMaxCapacity,
        venueId: editVenueId
      });

      setEditingGroup(null);
    } catch (err: any) {
      alert("Ошибка при обновлении группы: " + err.message);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `Вы действительно хотите распустить и удалить группу "${name}"?
Все ученики этой группы будут переведены в статус ожидания распределения.`,
    );
    if (!isConfirmed) return;

    try {
      await deleteGroup(id);
    } catch (err: any) {
      alert("Ошибка при удалении группы: " + err.message);
    }
  };

  const handleQuickAssign = async (
    clientId: string,
    groupName: string | null,
  ) => {
    try {
      await assignClientToGroup(clientId, groupName);
    } catch (err: any) {
      alert("Ошибка назначения группы: " + err.message);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients
    .filter((c) => {
      const fullName =
        `${c.childName} ${c.childSurname} ${c.parentName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const nameA = `${a.childSurname} ${a.childName}`.trim().toLowerCase();
      const nameB = `${b.childSurname} ${b.childName}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, "ru");
    });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 ">
      {/* HEADER SECTION */}
      <div className="p-4 md:p-6 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center"><h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            Группы и составы
          </h1><HeaderDescription text={<>Создание и расформирование групп, распределение учеников,
            планирование расписаний.</>} /></div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-650 hover:bg-red-700 bg-red-600 font-bold rounded-xl text-white text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-red-600/10 cursor-pointer self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Добавить новую группу</span>
        </button>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* KPI METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Всего групп
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalGroupsCount}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold mt-1">
              Тренировочные составы
            </div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Детей распределено
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {totalClientsInGroups}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">
              Обучаются в группах
            </div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Ожидают распределения
            </span>
            <div className="text-2xl font-black text-orange-600 mt-1">
              {totalUnassignedCount}
            </div>
            <div className="text-[10px] text-orange-600 font-semibold mt-1">
              {totalUnassignedCount > 0
                ? "Требуется распределить ⚠️"
                : "Все дети в группах! ✅"}
            </div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Активные тренеры
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {availableCoachesCount}
            </div>
            <div className="text-[10px] text-gray-500 font-semibold mt-1">
              Штатный тренерский состав
            </div>
          </div>
        </div>

        {/* VENUE ANALYTICS SECTION */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider font-mono">
              Аналитика по площадкам и группам
            </h2>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-gray-500">За период:</span>
              <input
                type="date"
                value={attendanceStartDate}
                onChange={(e) => setAttendanceStartDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none focus:ring-0 p-0"
              />
              <span className="text-gray-300">-</span>
              <input
                type="date"
                value={attendanceEndDate}
                onChange={(e) => setAttendanceEndDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none focus:ring-0 p-0"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((g) => {
              const sessions = trainingSessions?.filter(s => 
                (s.groupId === g.id || s.groupName === g.name) &&
                s.dateString >= attendanceStartDate &&
                s.dateString <= attendanceEndDate
              ) || [];
              const totalCost = sessions.length * (g.venueCost || 0);
              const totalPresent = sessions.reduce((acc, s) => acc + s.presentCount, 0);
              const avgAttendanceCount = sessions.length > 0 ? (totalPresent / sessions.length) : 0;
              const maxCap = g.maxCapacity || g.playersCount || 1;
              const loadPercent = sessions.length > 0 ? Math.round((avgAttendanceCount / maxCap) * 100) : 0;

              return (
                <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition">
                  <div className="font-bold text-slate-900 border-b pb-2 tracking-tight flex justify-between items-center">
                    <div className="flex flex-col">
<span>{g.name}</span>
<span className="text-[10px] text-gray-500 font-medium mt-0.5">Площадка: {g.venueId ? counterparties.find(c => c.id === g.venueId)?.name || 'Неизвестно' : 'Не назначена'}</span>
</div>
                    <span className="text-[10px] font-mono text-gray-400 bg-slate-100 px-2 py-0.5 rounded">Вместимость: {maxCap}</span>
                  </div>
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Проведено тренировок:</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 rounded-md">{sessions.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Затраты на аренду:</span>
                      <span className="font-bold text-slate-900">{totalCost.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Ср. посещаемость (чел):</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{avgAttendanceCount.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Загруженность группы:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${loadPercent >= 80 ? 'text-emerald-700 bg-emerald-100' : loadPercent >= 50 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'}`}>{loadPercent}%</span>
                    </div>
                    
                    <button
                      onClick={() => setAnalyticsGroup(g)}
                      className="w-full mt-2 py-1.5 flex items-center justify-center gap-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition border border-slate-200"
                    >
                      Подробная аналитика
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE SECTIONS: Left Groups Cards, Right Unassigned Players Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* COLUMN 1 & 2: TRAINING GROUPS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider font-mono">
                Список тренировочных групп ({totalGroupsCount})
              </h2>
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
                  <h4 className="font-bold text-slate-900 text-sm">
                    Группы не созданы
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                    Создайте вашу первую футбольную группу с помощью кнопки
                    выше, определите ей возраст, тренера и состав учащихся.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => {
                  // Get dynamic client count assigned to this group name by stripping whitespace and matching case-insensitively
                  const groupClientsList = group.isSelectTeam
                    ? clients
                        .filter((c) => group.selectedClientIds?.includes(c.id))
                        .sort((a, b) =>
                          `${a.childSurname} ${a.childName}`.localeCompare(
                            `${b.childSurname} ${b.childName}`,
                            "ru",
                          ),
                        )
                    : clients
                        .filter(
                          (c) =>
                            c.groupName &&
                            group.name &&
                            c.groupName.trim().toLowerCase() ===
                              group.name.trim().toLowerCase(),
                        )
                        .sort((a, b) => {
                          const nameA = `${a.childSurname} ${a.childName}`
                            .trim()
                            .toLowerCase();
                          const nameB = `${b.childSurname} ${b.childName}`
                            .trim()
                            .toLowerCase();
                          return nameA.localeCompare(nameB, "ru");
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
                                  : `${group.year} Год р.`}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-base font-black text-slate-900 tracking-tight text-left">
                            {group.name}
                            {group.targetCompetition && (
                              <span className="block text-xs font-semibold text-gray-500 mt-0.5">
                                {group.targetCompetition}
                              </span>
                            )}
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
                            onClick={() =>
                              handleDeleteGroup(group.id, group.name)
                            }
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
                          <span>
                            Тренер:{" "}
                            <strong>{group.coachName || "Не назначен"}</strong>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="truncate">
                            Расписание:{" "}
                            <strong className="text-slate-800 font-mono text-[11px]">
                              {group.scheduleDays.join(", ") || "Гибкое"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Players list inside Group */}
                      <div className="flex-1 p-3.5 space-y-2 text-left">
                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                          <span>Состав группы</span>
                          <span className="font-mono text-slate-705">
                            {groupClientsList.length} Воспитанников
                          </span>
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
                                      await removeClientFromSelectTeam(
                                        client.id,
                                        group.id,
                                      );
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
                      {(group.isSelectTeam
                        ? clients.filter(
                            (c) => !group.selectedClientIds?.includes(c.id),
                          )
                        : unassignedClients
                      ).length > 0 && (
                        <div className="p-3 border-t bg-slate-50 border-gray-100 rounded-b-2xl">
                          <div className="flex items-center space-x-1.5">
                            <select
                              defaultValue=""
                              onChange={async (e) => {
                                const val = e.target.value;
                                if (val) {
                                  if (group.isSelectTeam) {
                                    await assignClientToSelectTeam(
                                      val,
                                      group.id,
                                    );
                                  } else {
                                    handleQuickAssign(val, group.name);
                                  }
                                  e.target.value = ""; // Reset select
                                }
                              }}
                              className="flex-1 bg-white border rounded-xl py-1 px-2.5 text-xs font-bold text-slate-705 focus:outline-none"
                            >
                              <option value="">+ Зачислить ученика...</option>
                              {(group.isSelectTeam
                                ? clients
                                    .filter(
                                      (c) =>
                                        !group.selectedClientIds?.includes(
                                          c.id,
                                        ),
                                    )
                                    .sort((a, b) =>
                                      `${a.childSurname} ${a.childName}`.localeCompare(
                                        `${b.childSurname} ${b.childName}`,
                                        "ru",
                                      ),
                                    )
                                : unassignedClients
                              ).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.childName} {c.childSurname}{" "}
                                  {group.isSelectTeam && c.groupName
                                    ? `(${c.groupName})`
                                    : ""}
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
            <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider font-mono text-left">
              Ожидают распределения ({totalUnassignedCount})
            </h2>

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
                    onClick={() => setSearchQuery("")}
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
                          hasGroup
                            ? "bg-slate-50 border-gray-100 opacity-70"
                            : "bg-red-50/10 border-red-100 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs truncate">
                              {client.childName} {client.childSurname}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-bold font-mono">
                              Возраст: {client.childAge} лет •{" "}
                              {client.childBirthYear} г.р.
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium truncate">
                              Родитель: {client.parentName}
                            </p>
                          </div>

                          <span
                            className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                              hasGroup
                                ? "bg-slate-200 text-slate-600"
                                : "bg-orange-100 text-orange-850 text-orange-700"
                            }`}
                          >
                            {hasGroup ? client.groupName : "Без группы"}
                          </span>
                        </div>

                        {/* Interactive Assign Button Row */}
                        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5">
                          <select
                            value={
                              client.groupName
                                ? groups.find(
                                    (g) =>
                                      g.name.trim().toLowerCase() ===
                                      client.groupName?.trim().toLowerCase(),
                                  )?.name || client.groupName
                                : ""
                            }
                            onChange={(e) => {
                              const selectedGName = e.target.value;
                              handleQuickAssign(
                                client.id,
                                selectedGName || null,
                              );
                            }}
                            className="bg-slate-100 border rounded-lg py-1 px-2 text-[10px] font-bold text-slate-705 text-left focus:outline-none flex-1"
                          >
                            <option value="">-- Выберите группу --</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.name}>
                                {g.name}
                              </option>
                            ))}
                            {hasGroup && (
                              <option value="">Удалить из группы</option>
                            )}
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
            <p className="text-xs text-gray-400 mb-4">
              Укажите параметры новой группы, расписание и прикрепите тренера.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  Название группы
                </label>
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
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Год рождения учеников
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">с</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={newGroupBirthYearFrom}
                      onChange={(e) =>
                        setNewGroupBirthYearFrom(
                          parseInt(e.target.value) || new Date().getFullYear(),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                    <span className="text-xs font-bold text-gray-500">до</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={newGroupBirthYearTo}
                      onChange={(e) =>
                        setNewGroupBirthYearTo(
                          parseInt(e.target.value) || new Date().getFullYear(),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Тренер
                  </label>
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
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  Расписание тренировок
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <label key={day} className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${scheduleInput.includes(day) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-slate-50'}`}>
                      <input 
                        type="checkbox" 
                        checked={scheduleInput.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const time = prompt(`Укажите время для ${day} (например, 17:00-18:00):`, "17:00-18:00");
                            if (time) {
                              setScheduleInput(prev => prev ? `${prev}, ${day} ${time}` : `${day} ${time}`);
                            }
                          } else {
                            const parts = scheduleInput.split(', ').filter(p => !p.startsWith(day));
                            setScheduleInput(parts.join(', '));
                          }
                        }}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold w-6">{day}</span>
                      {scheduleInput.includes(day) && (
                        <span className="text-[10px] text-red-600 font-mono font-medium ml-1 flex-1 truncate">
                          {scheduleInput.split(', ').find(p => p.startsWith(day))?.replace(day, '').trim() || ''}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <div className="flex justify-between items-center px-1">
                  <p className="text-[9px] text-gray-400 mt-1">Выберите дни и укажите время</p>
                  <button type="button" onClick={() => setScheduleInput('')} className="text-[9px] text-red-500 hover:underline">Очистить</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Аренда (₽/занят.)
                  </label>
                  <input
                    type="number"
                    value={Math.round(newGroupVenueCost)}
                    onChange={(e) => setNewGroupVenueCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Вместимость
                  </label>
                  <input
                    type="number"
                    value={newGroupMaxCapacity}
                    onChange={(e) => setNewGroupMaxCapacity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsSelectTeam}
                    onChange={(e) => setNewIsSelectTeam(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-orange-500" /> Это сборная
                    команда
                  </span>
                </label>
                {newIsSelectTeam && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Целевое соревнование (Необязательно)
                    </label>
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
            <p className="text-xs text-gray-400 mb-4">
              Измените параметры группы, скорректируйте расписание или смените
              тренера.
            </p>

            <form onSubmit={handleUpdateGroup} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  Название группы
                </label>
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
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Год рождения учеников
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">с</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={editGroupBirthYearFrom}
                      onChange={(e) =>
                        setEditGroupBirthYearFrom(
                          parseInt(e.target.value) || new Date().getFullYear(),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                    <span className="text-xs font-bold text-gray-500">до</span>
                    <input
                      type="number"
                      min="2010"
                      max="2027"
                      required
                      value={editGroupBirthYearTo}
                      onChange={(e) =>
                        setEditGroupBirthYearTo(
                          parseInt(e.target.value) || new Date().getFullYear(),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Тренер
                  </label>
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
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  Расписание тренировок
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <label key={day} className={`flex items-center p-2 rounded-lg border cursor-pointer transition ${editScheduleInput.includes(day) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-slate-50'}`}>
                      <input 
                        type="checkbox" 
                        checked={editScheduleInput.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const time = prompt(`Укажите время для ${day} (например, 17:00-18:00):`, "17:00-18:00");
                            if (time) {
                              setEditScheduleInput(prev => prev ? `${prev}, ${day} ${time}` : `${day} ${time}`);
                            }
                          } else {
                            const parts = editScheduleInput.split(', ').filter(p => !p.startsWith(day));
                            setEditScheduleInput(parts.join(', '));
                          }
                        }}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold w-6">{day}</span>
                      {editScheduleInput.includes(day) && (
                        <span className="text-[10px] text-red-600 font-mono font-medium ml-1 flex-1 truncate">
                          {editScheduleInput.split(', ').find(p => p.startsWith(day))?.replace(day, '').trim() || ''}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <div className="flex justify-between items-center px-1">
                  <p className="text-[9px] text-gray-400 mt-1">Выберите дни и укажите время</p>
                  <button type="button" onClick={() => setEditScheduleInput('')} className="text-[9px] text-red-500 hover:underline">Очистить</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Аренда (₽/занят.)
                  </label>
                  <input
                    type="number"
                    value={Math.round(editVenueCost)}
                    onChange={(e) => setEditVenueCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Вместимость
                  </label>
                  <input
                    type="number"
                    value={editMaxCapacity}
                    onChange={(e) => setEditMaxCapacity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsSelectTeam}
                    onChange={(e) => setEditIsSelectTeam(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-orange-500" /> Это сборная
                    команда
                  </span>
                </label>
                {editIsSelectTeam && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Целевое соревнование
                    </label>
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
      {/* ANALYTICS MODAL */}
      {analyticsGroup && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Аналитика: {analyticsGroup.name}
                </h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">
                  С {attendanceStartDate} по {attendanceEndDate}
                </p>
              </div>
              <button
                onClick={() => setAnalyticsGroup(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {(() => {
                const sessions = trainingSessions?.filter(s => 
                  (s.groupId === analyticsGroup.id || s.groupName === analyticsGroup.name) &&
                  s.dateString >= attendanceStartDate &&
                  s.dateString <= attendanceEndDate
                ).sort((a,b) => b.dateString.localeCompare(a.dateString)) || [];

                if (sessions.length === 0) {
                  return (
                    <div className="p-10 text-center text-gray-500 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl">
                      Отсутствуют данные за выбранный период.
                    </div>
                  );
                }

                const totalPresent = sessions.reduce((acc, s) => acc + s.presentCount, 0);
                const totalAbsent = sessions.reduce((acc, s) => acc + s.absentCount, 0);
                const totalSick = sessions.reduce((acc, s) => acc + s.sickCount, 0);
                
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Всего тренировок</div>
                        <div className="text-2xl font-black text-slate-800 mt-1">{sessions.length}</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <div className="text-[10px] uppercase font-bold text-emerald-600">Посещений</div>
                        <div className="text-2xl font-black text-emerald-700 mt-1">{totalPresent}</div>
                      </div>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="text-[10px] uppercase font-bold text-red-600">Пропусков</div>
                        <div className="text-2xl font-black text-red-700 mt-1">{totalAbsent}</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="text-[10px] uppercase font-bold text-amber-600">По болезни</div>
                        <div className="text-2xl font-black text-amber-700 mt-1">{totalSick}</div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-widest">
                        <div className="col-span-3">Дата</div>
                        <div className="col-span-2 text-center">Присутствовали</div>
                        <div className="col-span-2 text-center">Отсутствовали</div>
                        <div className="col-span-3">Ассистент</div>
                        <div className="col-span-2">Тренер</div>
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100">
                        {sessions.map(s => (
                          <div key={s.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-50 transition items-center">
                            <div className="col-span-3 font-mono text-xs font-bold text-slate-800">
                              {new Date(s.date).toLocaleDateString('ru-RU')} <span className="text-slate-400 font-medium">{new Date(s.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="col-span-2 text-center font-bold text-emerald-600 bg-emerald-50 py-1 rounded w-16 mx-auto">
                              {s.presentCount}
                            </div>
                            <div className="col-span-2 text-center font-bold text-red-500 bg-red-50 py-1 rounded w-16 mx-auto">
                              {s.absentCount + s.sickCount}
                            </div>
                            <div className="col-span-3 text-xs font-medium text-slate-700 truncate pr-2">
                              {s.assistantName ? (
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold whitespace-nowrap">{s.assistantName}</span>
                              ) : (
                                <span className="text-slate-400 italic">Нет</span>
                              )}
                            </div>
                            <div className="col-span-2 text-xs font-bold text-slate-800 truncate">
                              {s.coachName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
