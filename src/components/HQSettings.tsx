import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Settings,
  Database,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Smartphone,
  CheckSquare,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Building,
  Briefcase,
  FileSpreadsheet,
  Lock,
  Users,
  BellRing,
  Check,
} from "lucide-react";
import firebaseConfig from "../../firebase-applet-config.json";

export const HQSettings: React.FC = () => {
  const {
    leads,
    clients,
    tasks,
    finances,
    messages,
    coaches,
    groups,
    clearAllData,
    resetAllData,
    firestoreError,
    schoolName: schoolNameContext,
    updateSchoolName,
    whatsappNotifications: whatsappNotificationsContext,
    updateWhatsappNotifications,
    autoOverdueTasks: autoOverdueTasksContext,
    updateAutoOverdueTasks,
    crmConfig,
    updateCRMConfig,
  } = useCRM();

  const [savingSettings, setSavingSettings] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [referralBonusAmount, setReferralBonusAmount] = useState(crmConfig?.referralBonusAmount || 500);
  const [referralBonusType, setReferralBonusType] = useState(crmConfig?.referralBonusType || 'rubles');

  const handleSaveReferral = () => {
    updateCRMConfig({ referralBonusAmount, referralBonusType: referralBonusType as 'rubles' | 'sessions' });
    setSuccessMsg("Настройки реферальной системы сохранены");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const [telegramBotToken, setTelegramBotToken] = useState(crmConfig?.telegramBotToken || "");
  const [telegramGroupChatId, setTelegramGroupChatId] = useState(crmConfig?.telegramGroupChatId || "");
  const [telegramAlerts, setTelegramAlerts] = useState<Record<string, boolean>>(crmConfig?.telegramAlerts || {
    newLead: true,
    newOrder: true,
    churnRisk: true,
    scheduleConflict: true
  });

  React.useEffect(() => {
    if (crmConfig) {
      setTelegramBotToken(crmConfig.telegramBotToken || "");
      setTelegramGroupChatId(crmConfig.telegramGroupChatId || "");
      if (crmConfig.telegramAlerts) {
        setTelegramAlerts(crmConfig.telegramAlerts);
      }
      setReferralBonusAmount(crmConfig.referralBonusAmount || 500);
      setReferralBonusType(crmConfig.referralBonusType || 'rubles');
    }
  }, [crmConfig]);

  const handleSaveTelegram = () => {
    updateCRMConfig({ telegramBotToken, telegramGroupChatId, telegramAlerts });
    setSuccessMsg("Настройки Telegram алертов сохранены");
    setTimeout(() => setSuccessMsg(null), 3000);
  };


  // States for checkbox clearance config
  const [clearConfig, setClearConfig] = useState({
    leads: true,
    clients: true,
    tasks: true,
    finances: true,
    messages: true,
  });

  // Local config inputs (for visual branding settings / metadata)
  const [schoolName, setSchoolName] = useState("АМКАР ЮНИОР");
  const [taxRate, setTaxRate] = useState("0");
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [autoOverdueTasks, setAutoOverdueTasks] = useState(true);

  // Synchronize local state with loaded context settings
  React.useEffect(() => {
    if (schoolNameContext) setSchoolName(schoolNameContext);
    if (whatsappNotificationsContext !== undefined)
      setWhatsappNotifications(whatsappNotificationsContext);
    if (autoOverdueTasksContext !== undefined)
      setAutoOverdueTasks(autoOverdueTasksContext);
  }, [
    schoolNameContext,
    whatsappNotificationsContext,
    autoOverdueTasksContext,
  ]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSuccessMsg(null);
    try {
      await updateSchoolName(schoolName);
      await updateWhatsappNotifications(whatsappNotifications);
      await updateAutoOverdueTasks(autoOverdueTasks);
      setSuccessMsg(
        "Настройки бизнес-логики и брендинг школы успешно обновлены!",
      );
    } catch (e: any) {
      alert("Ошибка при сохранении настроек: " + (e.message || String(e)));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearSelected = async () => {
    const confirmed = window.confirm(
      "ВНИМАНИЕ! Выбранные категории будут БЕЗВОЗВРАТНО удалены из вашей базы данных Firestore. Вы действительно хотите подготовить систему к запуску в повседневную работу?",
    );
    if (!confirmed) return;

    setClearing(true);
    setSuccessMsg(null);
    try {
      await clearAllData(clearConfig);
      setSuccessMsg(
        "Выбранные демонстрационные данные успешно очищены! CRM переведена в чистый рабочий режим.",
      );
    } catch (e: any) {
      alert("Ошибка при очистке: " + (e.message || String(e)));
    } finally {
      setClearing(false);
    }
  };

  const handleResetDemoData = async () => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите сбросить базу данных и наполнить её исходными демонстрационными данными?",
    );
    if (!confirmed) return;

    setResetting(true);
    setSuccessMsg(null);
    try {
      await resetAllData();
      setSuccessMsg(
        "База данных успешно сброшена до исходных демонстрационных значений!",
      );
    } catch (e: any) {
      alert("Ошибка при сбросе: " + (e.message || String(e)));
    } finally {
      setResetting(false);
    }
  };

  const isDatabaseEmpty =
    leads.length === 0 &&
    clients.length === 0 &&
    tasks.length === 0 &&
    finances.length === 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      {/* Header */}
      <div className="p-4 md:p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            Настройки системы & БД
          </h1>
          <p className="text-gray-500 text-sm">
            Управление рабочим пространством, синхронизациями и базами данных
            футбольной школы.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
          <Settings className="w-4 h-4 text-red-650 text-red-600 animate-spin-hover" />
          <div className="text-xs text-left">
            <span className="font-extrabold text-red-700">
              Панель директора
            </span>
            <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
              Администрирование
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-805 text-emerald-800 text-xs text-left flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
              <p className="text-emerald-605 mt-1">
                Все изменения записаны в Cloud Firestore. Интерфейс менеджеров и
                тренеров обновился автоматически.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main DB Admin Box */}
          <div className="lg:col-span-2 space-y-6">
            {/* CLEAN ACTION SLATE CARD */}
            <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs space-y-5 text-left">
              <div className="flex items-center space-x-2 border-b pb-3.5">
                <Database className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-950 text-base">
                  Подготовка к запуску / Очистка заглушек
                </h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Чтобы начать полноценную повседневную работу с базой данных
                школы, удалите тестовых клиентов, лидов и транзакции, создав
                чистый рабочий холст. Это действие удалит выбранные коллекции из{" "}
                <strong className="text-slate-700 font-mono">Firestore</strong>,
                переведя систему в боевой режим.
              </p>

              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 text-xs font-extrabold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Важно перед очисткой:</span>
                </div>
                <p className="text-[11px] text-amber-850 leading-relaxed pl-6">
                  Карточки тренеров (
                  <strong className="font-semibold">
                    {coaches.length} шт.
                  </strong>
                  ) и активные группы тренировок (
                  <strong className="font-semibold">{groups.length} шт.</strong>
                  ) будут <strong>сохранены</strong>, так как они представляют
                  собой вашу реальную организационную структуру!
                </p>
              </div>

              {/* Selection Checkboxes */}
              <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 font-mono">
                  Выберите данные для удаления:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 bg-white p-3 rounded-lg border hover:bg-slate-100 transition cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                      checked={clearConfig.leads}
                      onChange={(e) =>
                        setClearConfig((prev) => ({
                          ...prev,
                          leads: e.target.checked,
                        }))
                      }
                    />
                    <div className="text-xs text-left">
                      <span className="font-extrabold block text-slate-800">
                        Потенциальные клиенты (Лиды)
                      </span>
                      <span className="text-[10.5px] text-gray-400 font-medium">
                        Будет удалено: {leads.length} заявок
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-white p-3 rounded-lg border hover:bg-slate-100 transition cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                      checked={clearConfig.clients}
                      onChange={(e) =>
                        setClearConfig((prev) => ({
                          ...prev,
                          clients: e.target.checked,
                        }))
                      }
                    />
                    <div className="text-xs text-left">
                      <span className="font-extrabold block text-slate-800">
                        База учеников (Клиенты)
                      </span>
                      <span className="text-[10.5px] text-gray-400 font-medium">
                        Будет удалено: {clients.length} игроков
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-white p-3 rounded-lg border hover:bg-slate-100 transition cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                      checked={clearConfig.tasks}
                      onChange={(e) =>
                        setClearConfig((prev) => ({
                          ...prev,
                          tasks: e.target.checked,
                        }))
                      }
                    />
                    <div className="text-xs text-left">
                      <span className="font-extrabold block text-slate-800">
                        Задачи сотрудников
                      </span>
                      <span className="text-[10.5px] text-gray-400 font-medium">
                        Будет удалено: {tasks.length} поручений
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-white p-3 rounded-lg border hover:bg-slate-100 transition cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                      checked={clearConfig.finances}
                      onChange={(e) =>
                        setClearConfig((prev) => ({
                          ...prev,
                          finances: e.target.checked,
                        }))
                      }
                    />
                    <div className="text-xs text-left">
                      <span className="font-extrabold block text-slate-800">
                        Финансовые транзакции
                      </span>
                      <span className="text-[10.5px] text-gray-400 font-medium">
                        Будет удалено: {finances.length} записей
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-white p-3 rounded-lg border hover:bg-slate-100 transition cursor-pointer md:col-span-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                      checked={clearConfig.messages}
                      onChange={(e) =>
                        setClearConfig((prev) => ({
                          ...prev,
                          messages: e.target.checked,
                        }))
                      }
                    />
                    <div className="text-xs text-left">
                      <span className="font-extrabold block text-slate-800">
                        Чат-поддержка (Сообщения)
                      </span>
                      <span className="text-[10.5px] text-gray-400 font-medium font-semibold">
                        Будет удалено: {messages.length} сообщений кураторов
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-4">
                <button
                  onClick={handleClearSelected}
                  disabled={
                    clearing ||
                    (!clearConfig.leads &&
                      !clearConfig.clients &&
                      !clearConfig.tasks &&
                      !clearConfig.finances &&
                      !clearConfig.messages)
                  }
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-350 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-red-600/15 transition flex items-center justify-center space-x-2"
                >
                  {clearing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Выполняется очистка...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>Очистить выбранные заглушки & Запустить</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleResetDemoData}
                  disabled={resetting}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs uppercase transition flex items-center justify-center space-x-2"
                >
                  {resetting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Инициализация...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Восстановить демо для тестирования</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* LIVE BRANDING & PARAMETERS SETTINGS */}
            <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs space-y-4 text-left">
              <div className="flex items-center space-x-2 border-b pb-3.5">
                <Sliders className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-950 text-base">
                  Конфигурация бизнес-логики
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Название академии / школы
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs font-semibold focus:ring-red-500 focus:border-red-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Auto triggers toggles */}
                <div className="md:col-span-2 space-y-3 pt-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-650 focus:ring-red-500 w-4.5 h-4.5 mt-0.5"
                      checked={whatsappNotifications}
                      onChange={(e) =>
                        setWhatsappNotifications(e.target.checked)
                      }
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 block">
                        Автоматические напоминания WhatsApp
                      </span>
                      <p className="text-gray-400 text-[10.5px]">
                        Отправлять уведомление родителям, когда на балансе
                        ученика остается менее 2 посещений.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-650 focus:ring-red-550 w-4.5 h-4.5 mt-0.5"
                      checked={autoOverdueTasks}
                      onChange={(e) => setAutoOverdueTasks(e.target.checked)}
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 block">
                        Контроль просроченных абонементов
                      </span>
                      <p className="text-gray-400 text-[10.5px]">
                        Автоматически переводить абонемент в статус «Ожидает
                        оплаты», если дата свыше срока действия наступила.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t text-right">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-extrabold uppercase rounded-xl tracking-wider transition"
                >
                  {savingSettings
                    ? "Сохранение..."
                    : "Сохранить настройки работы"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border shadow-sm text-left space-y-4">
              <h3 className="font-extrabold text-slate-900 border-b pb-2.5 text-sm flex items-center space-x-2">
                <BellRing className="w-4 h-4 text-slate-650" />
                <span>Telegram Алерты</span>
              </h3>
              
              <div className="space-y-4">
                <p className="text-xs text-slate-500 mb-2">Настройте бота и ID группы для системных и критических уведомлений руководству (риск оттока, заявки, конфликты).</p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Токен Бота</label>
                  <input 
                    type="text" 
                    value={telegramBotToken} 
                    onChange={e => setTelegramBotToken(e.target.value)}
                    placeholder="Например: 123456789:ABCDEF..."
                    className="w-full text-xs p-2 border rounded-xl outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Группы чата</label>
                  <input 
                    type="text" 
                    value={telegramGroupChatId} 
                    onChange={e => setTelegramGroupChatId(e.target.value)}
                    placeholder="Например: @zdorovie_psichosomatika или -100123456789"
                    className="w-full text-xs p-2 border rounded-xl outline-none focus:border-emerald-500" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    Для публичных групп можно использовать ссылку с @ (например: <strong>@zdorovie_psichosomatika</strong>). <br />
                    Для приватных групп используйте числовой ID (начинается с -100), его можно узнать, добавив в группу бота <strong>@getmyid_bot</strong>.<br />
                    <strong className="text-amber-600">Важно:</strong> Не забудьте добавить вашего собственного бота в администраторы группы!
                  </p>
                </div>

                <div className="pt-2 border-t space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Активные системные алерты</h4>
                  
                  {[
                    { id: 'newLead', label: 'Новая заявка (Лид / Воронка продаж)' },
                    { id: 'newOrder', label: 'Новый заказ в магазине экипировки' },
                    { id: 'churnRisk', label: 'Риск оттока (Пропуск 2+ тренировок подряд)' },
                    { id: 'scheduleConflict', label: 'Нештатная ситуация: Конфликт расписания (пересечение у одного тренера)' }
                  ].map(alert => (
                    <label key={alert.id} className="flex items-center space-x-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        telegramAlerts[alert.id] !== false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 group-hover:border-emerald-400'
                      }`}>
                        {telegramAlerts[alert.id] !== false && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{alert.label}</span>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={telegramAlerts[alert.id] !== false}
                        onChange={(e) => {
                          setTelegramAlerts(prev => ({ ...prev, [alert.id]: e.target.checked }));
                        }}
                      />
                    </label>
                  ))}
                </div>

                <div className="pt-2 border-t text-right">
                  <button onClick={handleSaveTelegram} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase rounded-xl tracking-wider transition">Сохранить</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border shadow-sm text-left space-y-4">
              <h3 className="font-extrabold text-slate-900 border-b pb-2.5 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-650" />
                <span>Реферальная система</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Размер вознаграждения</label>
                  <input 
                    type="number" 
                    value={referralBonusAmount} 
                    onChange={e => setReferralBonusAmount(Number(e.target.value))}
                    className="w-full text-xs p-2 border rounded-xl outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Тип вознаграждения</label>
                  <select 
                    value={referralBonusType} 
                    onChange={e => setReferralBonusType(e.target.value as any)}
                    className="w-full text-xs p-2 border rounded-xl outline-none focus:border-emerald-500"
                  >
                    <option value="rubles">Бонусные рубли</option>
                    <option value="sessions">Бесплатные занятия</option>
                  </select>
                </div>
                <div className="pt-2 border-t text-right">
                  <button onClick={handleSaveReferral} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase rounded-xl tracking-wider transition">Сохранить</button>
                </div>
              </div>
            </div>

            {/* FIRESTORE ACTIVE STATUS */}
            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-xs text-left space-y-4">
              <h3 className="font-extrabold text-slate-900 border-b pb-2.5 text-sm flex items-center space-x-2">
                <Lock className="w-4 h-4 text-slate-650" />
                <span>Окружение базы данных</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/25">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
                    <span className="font-bold text-emerald-805 text-emerald-800 text-[11px] uppercase">
                      Firestore подключен
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    ONLINE
                  </span>
                </div>

                <div className="text-[10.5px] space-y-1.5 font-mono text-slate-500 bg-slate-50 p-3 rounded-lg border">
                  <div>
                    <strong className="text-slate-705">PROJECT:</strong>{" "}
                    {firebaseConfig.projectId}
                  </div>
                  <div>
                    <strong className="text-slate-705">DATABASE:</strong>{" "}
                    {(firebaseConfig as any).firestoreDatabaseId || "(default)"}
                  </div>
                  <div>
                    <strong className="text-slate-705">STATUS:</strong> Active /
                    Read-Write Ready
                  </div>
                </div>

                <div className="text-xs text-slate-400 leading-normal bg-slate-100/50 p-2 text-center rounded-lg border border-dashed">
                  Адрес Firestore БД синхронизирован с правилами доступа.
                </div>
              </div>
            </div>

            {/* INTEGRITY CHECKLIST */}
            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-xs text-left space-y-4">
              <h3 className="font-extrabold text-slate-900 border-b pb-2.5 text-sm flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-slate-750" />
                <span>Параметры готовности CRM</span>
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">
                      Структура тренеров ({coaches.length})
                    </span>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Все тренеры зафиксированы в облаке.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">
                      Группы и Расписание ({groups.length})
                    </span>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Учебным группам назначены тренировочные часы.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  {isDatabaseEmpty ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center text-[9px] text-amber-500 font-black shrink-0 mt-0.5">
                      !
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">
                      Чистый рабочий реестр
                    </span>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      {isDatabaseEmpty
                        ? "Заглушки очищены. Все готово для ввода реальных учеников."
                        : "В базе еще присутствуют демонстрационные записи."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
