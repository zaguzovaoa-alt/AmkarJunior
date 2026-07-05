import React, { useState } from "react";
import { HeaderDescription } from "./HeaderDescription";
import { useCRM } from "../context/CRMContext";
import {
  GraduationCap,
  TrendingUp,
  Users,
  Star,
  CheckSquare,
  BarChart2,
  Circle,
  Trophy,
  Award,
  Heart,
  ShieldCheck,
  UserPlus,
  Trash2,
  X,
  Plus,
  Sparkles,
  AlertCircle,
  Phone,
  Send,
  MessageCircle,
  Edit2,
  Save,
  MessageSquare,
} from "lucide-react";

import { compressImage } from "../utils/image";

export const CoachesList: React.FC = () => {
  const {
    coaches,
    groups,
    clients,
    createCoach,
    deleteCoach,
    assignCoachToGroup,
    updateCoachContacts,
    updateCoach,
  } = useCRM();

  // Preset trainer photo URLs
  const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&auto=format&fit=crop&q=80", // Male coach
    "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=120&auto=format&fit=crop&q=80", // Female coach 1
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&auto=format&fit=crop&q=80", // Male coach athletic
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80", // Female coach smiling
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&auto=format&fit=crop&q=80", // Yogi coach female
  ];

  // 1. New Coach Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachRole, setNewCoachRole] = useState("Тренер состава");
  const [newCoachJoinedYear, setNewCoachJoinedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [newCoachStatus, setNewCoachStatus] = useState<
    "Активен" | "На испытательном сроке" | "Неактивен"
  >("Активен");
  const [newCoachPhone, setNewCoachPhone] = useState("");
  const [newCoachTelegram, setNewCoachTelegram] = useState("");
  const [newCoachAvatarUrl, setNewCoachAvatarUrl] = useState("");
  const [newCoachPaymentType, setNewCoachPaymentType] = useState<"fixed" | "per_session">("per_session");
  const [newCoachRate, setNewCoachRate] = useState<number>(1000);

  // 1b. Inline Edit Coach Contact States
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editTelegram, setEditTelegram] = useState("");

  // 1c. Full Coach Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoachToEdit, setSelectedCoachToEdit] = useState<any>(null);
  const [editCoachName, setEditCoachName] = useState("");
  const [editCoachRole, setEditCoachRole] = useState("");
  const [editCoachJoinedYear, setEditCoachJoinedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [editCoachStatus, setEditCoachStatus] = useState<
    "Активен" | "На испытательном сроке" | "Неактивен"
  >("Активен");
  const [editCoachPhone, setEditCoachPhone] = useState("");
  const [editCoachTelegram, setEditCoachTelegram] = useState("");
  const [editCoachAvatarUrl, setEditCoachAvatarUrl] = useState("");
  const [editCoachPaymentType, setEditCoachPaymentType] = useState<"fixed" | "per_session">("per_session");
  const [editCoachRate, setEditCoachRate] = useState<number>(1000);
  const [editDisc, setEditDisc] = useState(5);
  const [editComm, setEditComm] = useState(5);
  const [editProf, setEditProf] = useState(5);
  const [editRes, setEditRes] = useState(5);

  // Feedback Initial Ratings
  const [discGrade, setDiscGrade] = useState(5);
  const [commGrade, setCommGrade] = useState(5);
  const [profGrade, setProfGrade] = useState(5);
  const [resGrade, setResGrade] = useState(5);

  // Dynamic calculations
  const totalCoaches = coaches.length;
  const staffCoaches = coaches.filter(
    (c) =>
      c.role.includes("Старший") ||
      c.role.includes("Тренер") ||
      c.role.includes("тренер"),
  ).length;
  const traineeCoaches = coaches.filter(
    (c) =>
      c.role.toLowerCase().includes("стажер") ||
      c.role.toLowerCase().includes("ассистент"),
  ).length;
  const totalLessons = groups.reduce(
    (sum, g) => sum + (g.scheduleDays?.length || 0),
    0,
  );
  const totalGroups = groups.length;
  const totalStudents = clients.filter((c) => c.status === "active").length;

  const avgRating =
    totalCoaches > 0
      ? (
          coaches.reduce((sum, c) => sum + (c.rating || 0), 0) / totalCoaches
        ).toFixed(1)
      : "0.0";

  // Average feedback parameters
  const avgDiscipline =
    totalCoaches > 0
      ? (
          coaches.reduce((sum, c) => sum + (c.feedback?.discipline || 0), 0) /
          totalCoaches
        ).toFixed(1)
      : "0.0";
  const avgCommunication =
    totalCoaches > 0
      ? (
          coaches.reduce(
            (sum, c) => sum + (c.feedback?.communication || 0),
            0,
          ) / totalCoaches
        ).toFixed(1)
      : "0.0";
  const avgProfessionalism =
    totalCoaches > 0
      ? (
          coaches.reduce(
            (sum, c) => sum + (c.feedback?.professionalism || 0),
            0,
          ) / totalCoaches
        ).toFixed(1)
      : "0.0";
  const avgResults =
    totalCoaches > 0
      ? (
          coaches.reduce((sum, c) => sum + (c.feedback?.results || 0), 0) /
          totalCoaches
        ).toFixed(1)
      : "0.0";

  // Calculate daily workload dynamically from actual groups' scheduleDays
  const sessionsByDay: {
    [key: string]: { key: string; count: number; load: number; col: string };
  } = {
    Понедельник: { key: "Пн", count: 0, load: 0, col: "bg-emerald-600" },
    Вторник: { key: "Вт", count: 0, load: 0, col: "bg-slate-900 shadow-xs" },
    Среда: { key: "Ср", count: 0, load: 0, col: "bg-emerald-500" },
    Четверг: { key: "Чт", count: 0, load: 0, col: "bg-indigo-600" },
    Пятница: { key: "Пт", count: 0, load: 0, col: "bg-emerald-500" },
    Суббота: { key: "Сб", count: 0, load: 0, col: "bg-emerald-600" },
    Воскресенье: { key: "Вс", count: 0, load: 0, col: "bg-gray-400" },
  };

  groups.forEach((g) => {
    g.scheduleDays?.forEach((d) => {
      const dayPrefix = d.split(" ")[0];
      Object.values(sessionsByDay).forEach((val) => {
        if (val.key === dayPrefix) {
          val.count += 1;
        }
      });
    });
  });

  const workloadData = Object.entries(sessionsByDay).map(([dayName, data]) => {
    const loadPercent = Math.min(data.count * 20, 100);
    return {
      day: dayName,
      count: data.count,
      load: loadPercent,
      col: data.col,
    };
  });

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachName.trim()) {
      alert("Пожалуйста, введите ФИО тренера");
      return;
    }

    try {
      await createCoach(
        newCoachName,
        newCoachRole,
        newCoachJoinedYear,
        newCoachStatus,
        newCoachPhone,
        newCoachTelegram,
        newCoachAvatarUrl,
        {
          discipline: discGrade,
          communication: commGrade,
          professionalism: profGrade,
          results: resGrade,
        },
        newCoachPaymentType,
        newCoachRate
      );

      // Reset info
      setNewCoachName("");
      setNewCoachRole("Тренер состава");
      setNewCoachJoinedYear(new Date().getFullYear());
      setNewCoachStatus("Активен");
      setNewCoachPhone("");
      setNewCoachTelegram("");
      setNewCoachAvatarUrl("");
      setDiscGrade(5);
      setCommGrade(5);
      setProfGrade(5);
      setResGrade(5);
      setShowCreateModal(false);
    } catch (err: any) {
      alert("Ошибка при добавлении тренера: " + err.message);
    }
  };

  const handleDeleteCoach = async (id: string, name: string) => {
    const isConfirmed = window.confirm(
      `Вы действительно хотите уволить/удалить тренера "${name}"?\nВсе его группы будут переведены в статус "Не назначен".`,
    );
    if (!isConfirmed) return;

    try {
      await deleteCoach(id);
    } catch (err: any) {
      alert("Ошибка при удалении тренера: " + err.message);
    }
  };

  const handleUnassignGroup = async (groupId: string) => {
    try {
      await assignCoachToGroup(groupId, "", "Не назначен");
    } catch (err: any) {
      alert("Ошибка снятия тренера с группы: " + err.message);
    }
  };

  const handleAssignGroup = async (
    groupId: string,
    coachId: string,
    coachName: string,
  ) => {
    try {
      await assignCoachToGroup(groupId, coachId, coachName);
    } catch (err: any) {
      alert("Ошибка назначения тренера: " + err.message);
    }
  };

  const handleSaveContacts = async (coachId: string) => {
    try {
      await updateCoachContacts(coachId, editPhone, editTelegram);
      setEditingCoachId(null);
    } catch (err: any) {
      alert("Ошибка при сохранении контактов: " + err.message);
    }
  };

  const handleStartEditCoach = (coach: any) => {
    setSelectedCoachToEdit(coach);
    setEditCoachName(coach.name);
    setEditCoachRole(coach.role);
    setEditCoachJoinedYear(coach.joinedYear);
    setEditCoachStatus(coach.status);
    setEditCoachPhone(coach.phone || "");
    setEditCoachTelegram(coach.telegram || "");
    setEditCoachAvatarUrl(coach.avatarUrl || "");
    setEditCoachPaymentType(coach.paymentType || "per_session");
    setEditCoachRate(coach.rate || 1000);
    setEditDisc(coach.feedback?.discipline ?? 5);
    setEditComm(coach.feedback?.communication ?? 5);
    setEditProf(coach.feedback?.professionalism ?? 5);
    setEditRes(coach.feedback?.results ?? 5);
    setShowEditModal(true);
  };

  const handleSaveCoachEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoachToEdit) return;

    try {
      await updateCoach(selectedCoachToEdit.id, {
        name: editCoachName,
        role: editCoachRole,
        joinedYear: Number(editCoachJoinedYear),
        status: editCoachStatus,
        phone: editCoachPhone,
        telegram: editCoachTelegram,
        avatarUrl: editCoachAvatarUrl,
        paymentType: editCoachPaymentType,
        rate: editCoachRate,
        feedback: {
          discipline: editDisc,
          communication: editComm,
          professionalism: editProf,
          results: editRes,
        },
      });
      setShowEditModal(false);
      setSelectedCoachToEdit(null);
    } catch (err: any) {
      alert("Ошибка при сохранении изменений: " + err.message);
    }
  };

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        if (isEdit) {
          setEditCoachAvatarUrl(base64);
        } else {
          setNewCoachAvatarUrl(base64);
        }
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 ">
      {/* Header bar */}
      <div className="p-4 md:p-6 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center"><h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            Рейтинг и мониторинг Тренеров
          </h1><HeaderDescription text={<>Панель контроля спортивной нагрузки, дисциплинарных оценок и
            расписания тренерского состава.</>} /></div>
        </div>

        <div className="flex items-center space-x-3.5 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 font-bold rounded-xl text-white text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-red-600/10 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Добавить нового тренера</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-100 p-2.5 rounded-xl border">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-705 font-mono">
              ШТАТА: {totalCoaches} СОТРУДНИКОВ
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Top summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Всего тренеров
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalCoaches}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium">
              {staffCoaches} штатных • {traineeCoaches} стажеров
            </p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Тренировок в неделю
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {totalLessons}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium">
              Активные занятия
            </p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Групп под ведением
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalGroups}
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Включая мини-секции
            </p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Воспитанников обучают
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalStudents}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium">
              Активные ученики
            </p>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border shadow-sm text-left col-span-2 lg:col-span-1">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
              Средняя оценка
            </span>
            <div className="text-2xl font-black text-amber-500 mt-1">
              {avgRating}
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              На основе отзывов
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1 & 2: Coach list table (matches Image 5 left) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-950 text-sm text-left uppercase tracking-wider font-mono">
                Табель рабочей загруженности тренеров
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-gray-400 font-semibold uppercase tracking-wider border-b text-[10px]">
                      <th className="p-3">Тренер</th>
                      <th className="p-3">Должность</th>
                      <th className="p-3">Контакты & Связь</th>
                      <th className="p-3">Группы</th>
                      <th className="p-3">Детей</th>
                      <th className="p-3">Оптимальная Нагрузка</th>
                      <th className="p-3">Оценка</th>
                      <th className="p-3">Статус</th>
                      <th className="p-3 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coaches.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-12 text-center text-gray-400 italic"
                        >
                          Список тренеров пуст. Вы можете добавить тренеров с
                          помощью кнопки "Добавить нового тренера" вверху.
                        </td>
                      </tr>
                    ) : (
                      coaches.map((ch) => {
                        // Calculate dynamic fields specifically for this coach
                        const coachGroups = groups.filter(
                          (g) =>
                            g.coachId === ch.id ||
                            (g.coachName === ch.name && ch.name),
                        );
                        const coachGroupsCount = coachGroups.length;
                        const coachKidsCount = clients.filter(
                          (c) =>
                            c.status === "active" &&
                            c.groupName &&
                            coachGroups.some(
                              (g) =>
                                g.name &&
                                g.name.trim().toLowerCase() ===
                                  c.groupName?.trim().toLowerCase(),
                            ),
                        ).length;

                        // Workload calculation (lessons per week)
                        const coachLessonsCount = coachGroups.reduce(
                          (acc, g) => acc + (g.scheduleDays?.length || 0),
                          0,
                        );
                        const calculatedWorkload = Math.min(
                          coachLessonsCount * 25,
                          100,
                        );
                        const workloadPercentage =
                          coachGroupsCount === 0
                            ? ch.workload
                            : calculatedWorkload;

                        // All groups that don't belong to this coach
                        const uncoachedGroups = groups.filter(
                          (g) => g.coachId !== ch.id,
                        );

                        return (
                          <tr
                            key={ch.id}
                            className="hover:bg-slate-50 transition"
                          >
                            <td className="p-3">
                              <div className="flex items-center space-x-2.5 text-left">
                                {ch.avatarUrl ? (
                                  <img
                                    src={ch.avatarUrl}
                                    alt={ch.name}
                                    referrerPolicy="no-referrer"
                                    className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 border border-red-150 font-extrabold flex items-center justify-center text-sm shrink-0 uppercase">
                                    {ch.name ? ch.name[0] : "?"}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-800">
                                    {ch.name}
                                  </div>
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    с {ch.joinedYear} года
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-semibold text-slate-700 text-left">
                              {ch.role}
                            </td>

                            {/* Contacts and Messenger shortcuts */}
                            <td className="p-3">
                              {editingCoachId === ch.id ? (
                                <div className="flex flex-col gap-1.5 p-1 min-w-[190px]">
                                  <input
                                    type="text"
                                    placeholder="Телефон (напр. +79991234567)"
                                    value={editPhone}
                                    onChange={(e) =>
                                      setEditPhone(e.target.value)
                                    }
                                    className="px-2 py-1 bg-white border border-gray-300 rounded text-[11px] text-slate-800 font-bold focus:outline-none focus:border-red-656"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Telegram (@username)"
                                    value={editTelegram}
                                    onChange={(e) =>
                                      setEditTelegram(e.target.value)
                                    }
                                    className="px-2 py-1 bg-white border border-gray-300 rounded text-[11px] text-mono text-slate-800 font-bold focus:outline-none focus:border-indigo-656"
                                  />
                                  <div className="flex gap-1.5 mt-1">
                                    <button
                                      onClick={() => handleSaveContacts(ch.id)}
                                      className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center justify-center gap-1 shadow cursor-pointer"
                                    >
                                      <Save className="w-3 h-3" />
                                      <span>Сохранить</span>
                                    </button>
                                    <button
                                      onClick={() => setEditingCoachId(null)}
                                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] cursor-pointer"
                                    >
                                      Отмена
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1 text-left min-w-[170px]">
                                  {ch.phone ? (
                                    <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                                      <Phone className="w-3 h-3 text-red-500 shrink-0 select-none animate-bounce" />
                                      <a
                                        href={`tel:${ch.phone.replace(/[^+\d]/g, "")}`}
                                        className="font-bold text-[11px] whitespace-nowrap hover:underline hover:text-red-700"
                                        title="Позвонить прямо сейчас"
                                      >
                                        {ch.phone}
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">
                                      Телефон не указан
                                    </span>
                                  )}

                                  {ch.telegram ? (
                                    <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#0088cc] shrink-0">
                                         <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.304-.346-.11l-6.4 4.024-2.76-.86c-.6-.185-.61-.595.125-.89l10.82-4.172c.504-.197.942.115.807.94z"/>
                                      </svg>
                                      <span className="font-mono text-[11px] text-[#0088cc] font-semibold truncate">
                                        {ch.telegram.startsWith("@")
                                          ? ch.telegram
                                          : `@${ch.telegram}`}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">
                                      Telegram не указан
                                    </span>
                                  )}

                                  <div className="flex items-center space-x-1 mt-1 pt-1 border-t border-slate-100">
                                    {ch.phone ? (
                                      <a
                                        href={`https://wa.me/${ch.phone.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 rounded text-[9px] font-extrabold flex items-center space-x-0.5 transition border border-emerald-250 leading-tight"
                                        title="Связаться по WhatsApp"
                                      >
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                                        <span>WA</span>
                                      </a>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-slate-50 text-gray-300 rounded text-[8px] font-bold cursor-not-allowed">
                                        WA
                                      </span>
                                    )}

                                    {ch.telegram ? (
                                      <a
                                        href={`https://t.me/${ch.telegram.replace(/^@/, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-850 rounded text-[9px] font-extrabold flex items-center space-x-0.5 transition border border-sky-250 leading-tight"
                                        title="Связаться по Telegram"
                                      >
                                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0"></span>
                                        <span>TG</span>
                                      </a>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-slate-50 text-gray-300 rounded text-[8px] font-bold cursor-not-allowed">
                                        TG
                                      </span>
                                    )}

                                    <button
                                      onClick={() => {
                                        setEditingCoachId(ch.id);
                                        setEditPhone(ch.phone || "");
                                        setEditTelegram(ch.telegram || "");
                                      }}
                                      className="p-1 hover:bg-slate-150 text-slate-400 hover:text-slate-800 rounded transition shrink-0 cursor-pointer"
                                      title="Изменить контакты"
                                    >
                                      <Edit2 className="w-3 h-3 text-red-600 hover:text-red-700" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Groups Column with interactive assignment */}
                            <td className="p-3 text-left">
                              <div className="space-y-1.5 max-w-[170px]">
                                {coachGroups.length === 0 ? (
                                  <span className="text-[10px] text-amber-600 font-medium block">
                                    Не закреплен
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {coachGroups.map((cg) => (
                                      <span
                                        key={cg.id}
                                        className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-1.5 py-0.5 rounded-lg text-[9px] font-bold"
                                        title="Нажмите х чтобы открепить тренера от этой группы"
                                      >
                                        <span>{cg.name}</span>
                                        <button
                                          onClick={() =>
                                            handleUnassignGroup(cg.id)
                                          }
                                          className="hover:bg-red-200 p-0.5 rounded text-red-500 transition"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Assign another group dropdown selector */}
                                {uncoachedGroups.length > 0 && (
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val) {
                                        handleAssignGroup(val, ch.id, ch.name);
                                        e.target.value = ""; // Reset select
                                      }
                                    }}
                                    className="bg-white border rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 focus:outline-none w-full cursor-pointer"
                                  >
                                    <option value="">+ Закрепить группу</option>
                                    {uncoachedGroups.map((ug) => (
                                      <option key={ug.id} value={ug.id}>
                                        {ug.name}{" "}
                                        {ug.coachId
                                          ? `(был у: ${ug.coachName})`
                                          : ""}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </td>

                            <td className="p-3 text-slate-800 font-bold font-mono text-center">
                              {coachKidsCount || ch.kidsCount}
                            </td>

                            <td className="p-3">
                              <div className="space-y-1 w-24">
                                <div className="flex justify-between text-[9px] font-bold text-slate-600">
                                  <span>Показатель</span>
                                  <span>{workloadPercentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${workloadPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center space-x-1 font-mono font-bold text-slate-800">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{ch.rating}</span>
                              </div>
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap block text-center ${
                                  ch.status === "Активен"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : ch.status === "На испытательном сроке"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-gray-150 text-gray-600"
                                }`}
                              >
                                {ch.status}
                              </span>
                            </td>

                            {/* Actions Column */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleStartEditCoach(ch)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition shrink-0 cursor-pointer"
                                  title="Редактировать профиль и оценки тренера"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCoach(ch.id, ch.name)
                                  }
                                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition shrink-0 cursor-pointer"
                                  title="Уволить / Удалить тренера"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coach feedback parameters (Image 5 bottom left) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
              <h3 className="font-extrabold text-slate-950 text-sm border-b pb-2 uppercase tracking-wider font-mono">
                Радар уверенности и оценки обратной связи
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/40">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                    Дисциплина
                  </span>
                  <div className="text-xl font-black text-emerald-600 mt-1">
                    {avgDiscipline} / 5
                  </div>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    Лидерские качества
                  </p>
                </div>
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/40">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                    Коммуникация
                  </span>
                  <div className="text-xl font-black text-indigo-600 mt-1">
                    {avgCommunication} / 5
                  </div>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    Связь с родителями
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/40">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                    Профессионализм
                  </span>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {avgProfessionalism} / 5
                  </div>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    Методики ФИФА
                  </p>
                </div>
                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/40">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">
                    Плавный прогресс
                  </span>
                  <div className="text-xl font-black text-amber-600 mt-1">
                    {avgResults} / 5
                  </div>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    Удовлетворенность
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Workload Daily Charts and notifications */}
          <div className="space-y-6 text-left">
            {/* Нагрузка тренеров по дням - Image 5 middle right */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-extrabold text-slate-950 text-sm">
                  График утилизации тренерского времени
                </h3>
                <p className="text-[10px] text-gray-400">
                  Оптимальная планка нагрузки - 80%
                </p>
              </div>

              <div className="space-y-3.5 text-xs font-sans">
                {workloadData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-750">
                      <span>{item.day}</span>
                      <span className="font-mono">
                        {item.count} зан. ({item.load}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${item.col} h-full rounded-full`}
                        style={{ width: `${item.load}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coaches directory check safety status */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                <span>Сертификация штата</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                Все тренеры школы «АМКАР ЮНИОР» обладают лицензиями РФС и УЕФА
                категорий "C-Youth" и выше, прошли обязательное сканирование на
                наличие медицинских книжек и справок о несудимости.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NEW COACH MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-900/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              <span>Добавить тренера в штат</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Заполните личные и спортивные характеристики нового специалиста.
            </p>

            <form onSubmit={handleCreateCoach} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  ФИО Тренера
                </label>
                <input
                  type="text"
                  placeholder="Например: Смирнов Александр Сергеевич"
                  required
                  value={newCoachName}
                  onChange={(e) => setNewCoachName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Должность
                  </label>
                  <select
                    value={newCoachRole}
                    onChange={(e) => setNewCoachRole(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="Старший тренер">Старший тренер</option>
                    <option value="Тренер состава">Тренер состава</option>
                    <option value="Тренер вратарей">Тренер вратарей</option>
                    <option value="Помощник тренера">Помощник тренера</option>
                    <option value="Тренер стажер">Тренер стажер</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Год вступления
                  </label>
                  <input
                    type="number"
                    min="2015"
                    max="2027"
                    required
                    value={newCoachJoinedYear}
                    onChange={(e) =>
                      setNewCoachJoinedYear(
                        parseInt(e.target.value) || new Date().getFullYear(),
                      )
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Coach Avatar Section */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider block">
                  Фото / Аватар тренера
                </label>

                <div className="flex items-center space-x-3">
                  {newCoachAvatarUrl ? (
                    <div className="relative group">
                      <img
                        src={newCoachAvatarUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-red-550 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setNewCoachAvatarUrl("")}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 border border-white hover:bg-red-700 transition"
                        title="Удалить фото"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-50 border border-red-150 flex flex-col items-center justify-center text-red-600 font-extrabold text-[10px] uppercase cursor-pointer relative hover:bg-red-100/50 transition">
                      <span>НЕТ ФОТО</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer shadow-xs hover:bg-slate-50 transition">
                        <span>📁 Загрузить файл с ПК</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, false)}
                        />
                      </label>
                      <span className="text-[9px] text-gray-400 block mt-0.5">
                        До 1.5 МБ (.png, .jpg)
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Или вставьте URL-ссылку на фото..."
                      value={newCoachAvatarUrl}
                      onChange={(e) => setNewCoachAvatarUrl(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[9px] font-bold text-gray-500 block mb-1 uppercase font-mono">
                    Или выберите готовый спортивный аватар:
                  </span>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setNewCoachAvatarUrl(url)}
                        className={`w-7 h-7 rounded-full overflow-hidden border shrink-0 hover:scale-105 transition ${
                          newCoachAvatarUrl === url
                            ? "ring-2 ring-red-600 border-transparent scale-110"
                            : "border-slate-200"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Preset ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Телефон связи
                  </label>
                  <input
                    type="text"
                    placeholder="Например: +79991234567"
                    value={newCoachPhone}
                    onChange={(e) => setNewCoachPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Никнейм Telegram
                  </label>
                  <input
                    type="text"
                    placeholder="Например: @coach_alex"
                    value={newCoachTelegram}
                    onChange={(e) => setNewCoachTelegram(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  Статус контракта
                </label>
                <select
                  value={newCoachStatus}
                  onChange={(e) => setNewCoachStatus(e.target.value as any)}
                  className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="Активен">Активен</option>
                  <option value="На испытательном сроке">
                    На испытательном сроке
                  </option>
                  <option value="Неактивен">Неактивен</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Тип оплаты
                  </label>
                  <select
                    value={newCoachPaymentType}
                    onChange={(e) => setNewCoachPaymentType(e.target.value as "fixed" | "per_session")}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="per_session">За тренировку / час</option>
                    <option value="fixed">Фиксированный оклад</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Ставка (₽)
                  </label>
                  <input
                    type="number"
                    value={newCoachRate}
                    onChange={(e) => setNewCoachRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">
                  Начальные оценки отзывов (1-5)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Дисциплина
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={discGrade}
                      onChange={(e) =>
                        setDiscGrade(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Связь
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={commGrade}
                      onChange={(e) =>
                        setCommGrade(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Проф-изм
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={profGrade}
                      onChange={(e) =>
                        setProfGrade(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Прогресс
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={resGrade}
                      onChange={(e) =>
                        setResGrade(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md"
                >
                  Добавить тренера
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL COACH EDIT MODAL */}
      {showEditModal && selectedCoachToEdit && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedCoachToEdit(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-red-600" />
              <span>Редактировать тренера</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Обновите ФИО, контакты, оценки тренера или прикрепите новое фото.
            </p>

            <form
              onSubmit={handleSaveCoachEdit}
              className="space-y-4 text-left"
            >
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  ФИО Тренера
                </label>
                <input
                  type="text"
                  required
                  value={editCoachName}
                  onChange={(e) => setEditCoachName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Должность
                  </label>
                  <select
                    value={editCoachRole}
                    onChange={(e) => setEditCoachRole(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="Старший тренер">Старший тренер</option>
                    <option value="Тренер состава">Тренер состава</option>
                    <option value="Тренер вратарей">Тренер вратарей</option>
                    <option value="Помощник тренера">Помощник тренера</option>
                    <option value="Тренер стажер">Тренер стажер</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Год вступления
                  </label>
                  <input
                    type="number"
                    min="2015"
                    max="2027"
                    required
                    value={editCoachJoinedYear}
                    onChange={(e) =>
                      setEditCoachJoinedYear(
                        parseInt(e.target.value) || new Date().getFullYear(),
                      )
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Coach Avatar Section */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider block">
                  Фото / Аватар тренера
                </label>

                <div className="flex items-center space-x-3">
                  {editCoachAvatarUrl ? (
                    <div className="relative group">
                      <img
                        src={editCoachAvatarUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-red-500 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setEditCoachAvatarUrl("")}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 border border-white hover:bg-red-700 transition"
                        title="Удалить фото"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-50 border border-red-150 flex flex-col items-center justify-center text-red-600 font-extrabold text-[10px] uppercase cursor-pointer relative hover:bg-red-100/50 transition">
                      <span>НЕТ ФОТО</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer shadow-xs hover:bg-slate-50 transition">
                        <span>📁 Изменить файл с ПК</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, true)}
                        />
                      </label>
                      <span className="text-[9px] text-gray-400 block mt-0.5">
                        До 1.5 МБ (.png, .jpg)
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Или вставьте URL-ссылку на фото..."
                      value={editCoachAvatarUrl}
                      onChange={(e) => setEditCoachAvatarUrl(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[9px] font-bold text-gray-500 block mb-1 uppercase font-mono">
                    Выберите спортивный аватар:
                  </span>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setEditCoachAvatarUrl(url)}
                        className={`w-7 h-7 rounded-full overflow-hidden border shrink-0 hover:scale-105 transition ${
                          editCoachAvatarUrl === url
                            ? "ring-2 ring-red-600 border-transparent scale-110"
                            : "border-slate-200"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Preset ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Телефон связи
                  </label>
                  <input
                    type="text"
                    placeholder="+79991234567"
                    value={editCoachPhone}
                    onChange={(e) => setEditCoachPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Никнейм Telegram
                  </label>
                  <input
                    type="text"
                    placeholder="@coach_alex"
                    value={editCoachTelegram}
                    onChange={(e) => setEditCoachTelegram(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                  Статус контракта
                </label>
                <select
                  value={editCoachStatus}
                  onChange={(e) => setEditCoachStatus(e.target.value as any)}
                  className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value="Активен">Активен</option>
                  <option value="На испытательном сроке">
                    На испытательном сроке
                  </option>
                  <option value="Неактивен">Неактивен</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Тип оплаты
                  </label>
                  <select
                    value={editCoachPaymentType}
                    onChange={(e) => setEditCoachPaymentType(e.target.value as "fixed" | "per_session")}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="per_session">За тренировку / час</option>
                    <option value="fixed">Фиксированный оклад</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    Ставка (₽)
                  </label>
                  <input
                    type="number"
                    value={editCoachRate}
                    onChange={(e) => setEditCoachRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">
                  Оценки отзывов (1-5)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Дисциплина
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editDisc}
                      onChange={(e) =>
                        setEditDisc(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono animate-pulse"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Связь
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editComm}
                      onChange={(e) =>
                        setEditComm(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono animate-pulse"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Проф-изм
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editProf}
                      onChange={(e) =>
                        setEditProf(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono animate-pulse"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 p-2 border rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">
                      Прогресс
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editRes}
                      onChange={(e) =>
                        setEditRes(
                          Math.min(
                            5,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        )
                      }
                      className="w-10 px-1 py-0.5 border rounded text-center text-xs font-black font-mono animate-pulse"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCoachToEdit(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition shadow-md"
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
