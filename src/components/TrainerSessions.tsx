import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  Camera,
  X,
  Edit3,
  Trash2,
  Save,
  Upload,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { TrainingSessionProtocol } from "../types";
import { HeaderDescription } from "./HeaderDescription";
import { toYearMonthString, formatSessionDateDisplay } from "../utils/dateUtils";
import { compressImage } from "../utils/image";

export const TrainerSessions: React.FC = () => {
  const {
    trainingSessions,
    coaches,
    currentRole,
    deleteTrainingSession,
    updateTrainingSessionProtocol,
  } = useCRM();
  const { appUser } = useAuth();

  const myCoach =
    coaches.find(
      (c) =>
        c.name.toLowerCase() === appUser?.fullName?.toLowerCase() ||
        (c.phone && appUser?.phone && c.phone === appUser?.phone),
    ) || coaches[0];

  const [selectedSession, setSelectedSession] = useState<TrainingSessionProtocol | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<TrainingSessionProtocol | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const isPrivileged = currentRole === "admin" || currentRole === "director";
  const mySessions = (trainingSessions || [])
    .filter(
      (s) =>
        (isPrivileged ||
          s.coachId === myCoach?.id ||
          s.coachName?.includes(myCoach?.name || "") ||
          s.assistantId === myCoach?.id) &&
        toYearMonthString(s.dateString, s.date) === filterMonth,
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const sessionsAsMain = mySessions.filter(
    (s) => s.coachId === myCoach?.id || s.coachName?.includes(myCoach?.name || ""),
  );
  const sessionsAsAssistant = mySessions.filter(
    (s) => s.assistantId === myCoach?.id && s.coachId !== myCoach?.id,
  );

  const openSessionDetail = (session: TrainingSessionProtocol) => {
    setSelectedSession(session);
    setIsEditing(false);
    setEditForm(null);
  };

  const startEditing = (session: TrainingSessionProtocol) => {
    setSelectedSession(session);
    setEditForm(JSON.parse(JSON.stringify(session)));
    setIsEditing(true);
  };

  const handleStatusChange = (
    clientId: string,
    newStatus: "present" | "absent_sick" | "absent" | "trial_free",
  ) => {
    if (!editForm) return;
    const updatedRecords = (editForm.records || []).map((r) =>
      r.clientId === clientId ? { ...r, status: newStatus } : r,
    );
    setEditForm({ ...editForm, records: updatedRecords });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      compressImage(file, (base64) => {
        setEditForm((prev) => (prev ? { ...prev, photoUrl: base64 } : null));
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setIsSaving(true);
    try {
      await updateTrainingSessionProtocol(editForm);
      setSelectedSession(editForm);
      setIsEditing(false);
      setEditForm(null);
    } catch (err) {
      console.error("Failed to update session:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteTrainingSession(id);
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        setIsEditing(false);
        setEditForm(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              Учет тренировок
            </h1>
            <HeaderDescription
              text={
                <>
                  {isPrivileged
                    ? "Журнал всех проведенных тренировок и возможность их редактирования."
                    : "Мониторинг, корректировка и удаление отчетов по проведенным тренировкам."}
                </>
              }
            />
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
            <div className="text-xs text-blue-600/70 mt-1 font-medium">
              Провел(а) тренировок
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100/50">
            <div className="text-amber-600 mb-1 font-bold text-sm">Ассистент</div>
            <div className="text-3xl font-black text-amber-700">
              {sessionsAsAssistant.length}
            </div>
            <div className="text-xs text-amber-600/70 mt-1 font-medium">
              Помогал(а) на тренировках
            </div>
          </div>
        </div>

        {mySessions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              За выбранный месяц тренировок не найдено.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mySessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-100 hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{session.groupName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                      {formatSessionDateDisplay(session.date, session.dateString)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {session.coachId === myCoach?.id
                        ? "Вы (Основной тренер)"
                        : session.assistantId === myCoach?.id
                        ? `Ассистент (Основной: ${session.coachName})`
                        : "Основной тренер"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  {session.photoUrl && (
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                      onClick={() => openSessionDetail(session)}
                    >
                      <img
                        src={session.photoUrl}
                        alt="Фото"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 border-r pr-4 border-slate-200">
                    <div className="text-center">
                      <div className="text-lg font-black text-emerald-600">
                        {session.presentCount}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">
                        Были
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-rose-500">
                        {session.absentCount + session.sickCount}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">
                        Пропуск
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openSessionDetail(session)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition"
                    >
                      Подробнее
                    </button>
                    <button
                      onClick={() => startEditing(session)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                      title="Корректировать ведомость"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(session.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                      title="Удалить ведомость"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail / Edit Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {isEditing ? "Редактирование ведомости" : "Отчет по тренировке"}
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  {selectedSession.groupName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => startEditing(selectedSession)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Изм.</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(selectedSession.id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedSession(null);
                    setIsEditing(false);
                    setEditForm(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              {!isEditing ? (
                /* READ-ONLY VIEW */
                <>
                  {selectedSession.photoUrl ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50 flex items-center justify-center min-h-[200px]">
                      <img
                        src={selectedSession.photoUrl}
                        alt="Фотоотчет"
                        className="w-full object-contain max-h-[35vh]"
                      />
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400 bg-slate-50 rounded-xl border border-dashed">
                      <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span>Фотоотчет не прикреплен</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Группа
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {selectedSession.groupName}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Дата и время
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {formatSessionDateDisplay(selectedSession.date, selectedSession.dateString)}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Основной тренер
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {selectedSession.coachName}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Ассистент
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {selectedSession.assistantName || "Не указан"}
                      </div>
                    </div>
                  </div>

                  {selectedSession.notes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="text-[10px] uppercase font-bold text-amber-700 mb-1">
                        Заметки тренера
                      </div>
                      <p className="text-xs text-slate-800 italic">
                        "{selectedSession.notes}"
                      </p>
                    </div>
                  )}

                  <div className="p-4 border rounded-xl space-y-3">
                    <h4 className="font-bold text-sm text-slate-900">
                      Ведомость посещаемости
                    </h4>
                    <div className="flex gap-4 text-xs">
                      <span className="text-emerald-600 font-bold">
                        Присутствовали: {selectedSession.presentCount}
                      </span>
                      <span className="text-rose-600 font-bold">
                        Пропустили:{" "}
                        {selectedSession.absentCount + selectedSession.sickCount}
                      </span>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      {selectedSession.records &&
                        selectedSession.records.map((rec) => (
                          <div
                            key={rec.clientId}
                            className="flex justify-between items-center py-1.5 border-b last:border-0 border-gray-100 text-xs"
                          >
                            <span className="font-bold text-slate-800">
                              {rec.clientName}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                rec.status === "present"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : rec.status === "absent_sick"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : rec.status === "trial_free"
                                  ? "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {rec.status === "present"
                                ? "Был"
                                : rec.status === "absent_sick"
                                ? "Болел"
                                : rec.status === "trial_free"
                                ? "Пробная"
                                : "Пропуск"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : editForm ? (
                /* EDITING FORM */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Дата проведения (ДД.ММ.ГГГГ)
                      </label>
                      <input
                        type="text"
                        value={editForm.dateString}
                        onChange={(e) =>
                          setEditForm({ ...editForm, dateString: e.target.value })
                        }
                        className="w-full text-xs font-semibold p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Время / Краткая дата
                      </label>
                      <input
                        type="text"
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm({ ...editForm, date: e.target.value })
                        }
                        className="w-full text-xs font-semibold p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Заметки и разбор тренера
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.notes || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      placeholder="Комментарий о проведенной тренировке..."
                      className="w-full text-xs font-medium p-2.5 border rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Фотоотчет с тренировки
                    </label>
                    {editForm.photoUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-16 rounded-xl overflow-hidden border">
                          <img
                            src={editForm.photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition">
                          Заменить фото
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition text-xs font-bold text-slate-600">
                        <Upload className="w-4 h-4" />
                        <span>Прикрепить новое фото</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      Посещаемость игроков в ведомости
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {(editForm.records || []).map((rec) => (
                        <div
                          key={rec.clientId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50 border rounded-xl gap-2 text-xs"
                        >
                          <span className="font-bold text-slate-900">
                            {rec.clientName || rec.clientId}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "present")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "present"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50"
                              }`}
                            >
                              + Был
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "absent_sick")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "absent_sick"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50"
                              }`}
                            >
                              Б Болел
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "absent")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "absent"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50"
                              }`}
                            >
                              - Пропуск
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(rec.clientId, "trial_free")
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                rec.status === "trial_free"
                                  ? "bg-fuchsia-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-fuchsia-50"
                              }`}
                            >
                              П Пробная
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? "Сохранение..." : "Сохранить изменения"}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-scale-in space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Удаление ведомости
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Вы действительно хотите безвозвратно удалить заполненную ведомость по этой
              тренировке из истории и базы данных?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteSession(confirmDeleteId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                Удалить ведомость
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
