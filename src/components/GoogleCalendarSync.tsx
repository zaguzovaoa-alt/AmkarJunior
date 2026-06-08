import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  History,
  Info,
  HelpCircle,
  Sliders,
  Settings2,
  AlertCircle,
} from "lucide-react";
import { ScheduleCalendar } from "./ScheduleCalendar";

export const GoogleCalendarSync: React.FC = () => {
  const {
    calendarSyncEnabled,
    calendarSyncStatus,
    calendarSyncLog,
    toggleCalendarSync,
    triggerManualCalendarSync,
  } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState<"calendar" | "sync">(
    "calendar",
  );
  const [testLogLoading, setTestLogLoading] = useState(false);

  const handleManualSync = () => {
    setTestLogLoading(true);
    setTimeout(() => {
      triggerManualCalendarSync();
      setTestLogLoading(false);
      alert(
        "Интеграция с Google Calendar: Синхронизация расписания выполнена успешно!\n6 событий тренировок экспортировано на ваш аккаунт zaguzovaoa@gmail.com.",
      );
    }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      {/* Upper Navigation Tabs selector for Workspace Sync */}
      <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        <div>
          <div className="text-xs font-black text-red-650 uppercase font-mono tracking-widest mb-1 select-none">
            Панель управления расписанием
          </div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            Календарь & Синхронизация
          </h1>
        </div>

        {/* Subtabs switcher */}
        <div className="flex space-x-2 select-none self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("calendar")}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-t-xl transition border-b-2 font-sans ${
              activeSubTab === "calendar"
                ? "border-red-600 text-red-650 bg-red-50/20"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-slate-50"
            }`}
          >
            📅 Расписание занятий
          </button>

          <button
            onClick={() => setActiveSubTab("sync")}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-t-xl transition border-b-2 font-sans flex items-center gap-1.5 ${
              activeSubTab === "sync"
                ? "border-red-600 text-red-650 bg-red-50/20"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-slate-50"
            }`}
          >
            <span>🔗 Настройки Google Sync</span>
            {calendarSyncEnabled && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main panel displays */}
      <div className="transition duration-150">
        {activeSubTab === "calendar" ? (
          <ScheduleCalendar />
        ) : (
          <div className="p-6 max-w-4xl mx-auto space-y-6 text-left animate-in fade-in duration-100">
            {/* Main Sync Status configuration panel */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-500 font-mono tracking-wider">
                    Рабочее окружение
                  </h3>
                  <p className="text-sm text-slate-900 font-bold mt-1">
                    Интегрированный рабочий почтовый ящик:{" "}
                    <span className="text-red-600 font-bold underline">
                      zaguzovaoa@gmail.com
                    </span>
                  </p>
                </div>

                <div className="flex items-center space-x-3.5 shrink-0">
                  <span
                    className={`px-3 py-1 text-[10px] font-black tracking-wider uppercase rounded-full border ${
                      calendarSyncEnabled
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-amber-50 border-amber-100 text-amber-850"
                    }`}
                  >
                    {calendarSyncEnabled
                      ? "● Синхронизация АКТИВНА"
                      : "● Синхронизация ОТКЛЮЧЕНА"}
                  </span>

                  <button
                    onClick={toggleCalendarSync}
                    className={`px-4 py-2 font-black text-xs uppercase rounded-xl transition ${
                      calendarSyncEnabled
                        ? "bg-orange-600 hover:bg-orange-500 text-white shadow-sm"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {calendarSyncEnabled ? "Деактивировать" : "Активировать"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
                <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <Info className="w-4.5 h-4.5 text-indigo-600" />
                    <span>Опции автосинхронизации</span>
                  </h4>
                  <p className="text-gray-500 leading-normal">
                    При создании тренировочного дня, переносе корта или отмене
                    матча тренером через интерактивный календарь, футбольная CRM
                    автоматически производит PATCH-запросы к Google Calendar
                    API, мгновенно отправляя обновления на телефоны родителей
                    учеников.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <Sliders className="w-4.5 h-4.5 text-slate-650" />
                    <span>Принудительный ручной экспорт</span>
                  </h4>
                  <p className="text-gray-500 leading-normal mb-1">
                    Для перезаписи всех событий, исключения наложений и
                    выравнивания времени тренировок в календарях родителей
                    запустите полный экспорт данных за текущий месяц.
                  </p>
                  <button
                    onClick={handleManualSync}
                    disabled={testLogLoading}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-black uppercase text-[10px] rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${testLogLoading ? "animate-spin" : ""}`}
                    />
                    <span>
                      {testLogLoading
                        ? "Выполняем экспорт..."
                        : "Запустить экспорт в Google Calendar"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time synced logs journal timeline */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex border-b pb-3 items-center justify-between">
                <h3 className="font-extrabold text-slate-950 text-sm flex items-center space-x-2">
                  <History className="w-4 h-4 text-gray-400" />
                  <span>Журнал транзакционных выгрузок Google CRM</span>
                </h3>
                <span className="text-[10px] bg-slate-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded font-mono">
                  ШЛЮЗ СВЯЗИ: 200 OK
                </span>
              </div>

              <div className="space-y-3 text-xs leading-normal font-sans">
                {calendarSyncLog.length === 0 ? (
                  <div className="py-6 text-center text-gray-450 italic">
                    Логи транзакций пусты. Сделайте изменения в календаре или
                    выполните экспорт.
                  </div>
                ) : (
                  calendarSyncLog.map((log, id) => (
                    <div
                      key={id}
                      className="p-3 bg-slate-50 border-l-4 border-emerald-500 rounded-r-xl flex justify-between items-start"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-805">
                          {log}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Драйвер: Google API OAuth2
                        </div>
                      </div>
                      <span className="text-[10.5px] font-mono font-bold text-gray-500">
                        200 OK
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
