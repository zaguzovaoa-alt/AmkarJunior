import React, { useState } from "react";
import { CRMProvider, useCRM } from "./context/CRMContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthScreen } from "./components/AuthScreen";
import { Sidebar } from "./components/Sidebar";
import { ParentPortal } from "./components/ParentPortal";
import { TrainerCRM } from "./components/TrainerCRM";
import { ManagerCRM } from "./components/ManagerCRM";
import { DirectorCRM } from "./components/DirectorCRM";
import { FinanceModule } from "./components/FinanceModule";
import { CoachesList } from "./components/CoachesList";
import { GoogleCalendarSync } from "./components/GoogleCalendarSync";
import { HQSettings } from "./components/HQSettings";
import { GroupsModule } from "./components/GroupsModule";
import { DirectorUsers } from "./components/DirectorUsers";
import { JoinPage } from "./components/JoinPage";
import { AdminStore } from "./components/AdminStore";
import { TasksModule } from "./components/TasksModule";
import { Shield, RefreshCw, Menu } from "lucide-react";
import firebaseConfig from "../firebase-applet-config.json";

import { PaymentModal } from "./components/PaymentModal";

function DashboardContainer() {
  const { appUser } = useAuth();
  const {
    currentRole,
    currentTab,
    setCurrentTab,
    setCurrentRole,
    firestoreError,
    dismissFirestoreError,
  } = useCRM();
  const [showInstructions, setShowInstructions] = useState(false);
  const [paymentModalClientId, setPaymentModalClientId] = useState<
    string | null
  >(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper renderer for active role-specific view layout
  const renderRoleComponent = () => {
    switch (currentRole) {
      case "admin":
      case "director":
        if (currentTab === "director_home" || currentTab === "hq_home")
          return <DirectorCRM setActiveTab={setCurrentTab} />;
        if (currentTab === "director_finances" || currentTab === "hq_finances")
          return <FinanceModule />;
        if (currentTab === "director_coaches" || currentTab === "hq_coaches")
          return <CoachesList />;
        if (currentTab === "director_sync" || currentTab === "hq_calendar_sync")
          return <GoogleCalendarSync />;
        if (currentTab === "hq_attendance")
          return (
            <TrainerCRM
              activeTab="trainer_attendance"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "hq_messages")
          return (
            <TrainerCRM
              activeTab="trainer_messages"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "hq_clients" || currentTab === "hq_analytics") {
          return (
            <ManagerCRM
              activeTab={currentTab}
              setActiveTab={(tab) => setCurrentTab(tab)}
            />
          );
        }
        if (currentTab === "hq_leads") {
          return (
            <ManagerCRM
              activeTab="hq_leads"
              setActiveTab={(tab) => setCurrentTab(tab)}
            />
          );
        }
        if (currentTab === "hq_settings") return <HQSettings />;
        if (currentTab === "hq_store") return <AdminStore />;
        if (currentTab === "hq_tasks") return <TasksModule />;
        if (currentTab === "director_groups" || currentTab === "hq_groups")
          return <GroupsModule />;
        if (currentTab === "director_users") return <DirectorUsers />;
        return <DirectorCRM setActiveTab={setCurrentTab} />;

      case "manager":
        if (currentTab === "hq_settings" || currentTab === "manager_settings") return <HQSettings />;
        if (currentTab === "hq_store") return <AdminStore />;
        if (currentTab === "manager_leads" || currentTab === "hq_leads") {
          return (
            <ManagerCRM
              activeTab="hq_leads"
              setActiveTab={(tab) => setCurrentTab(tab)}
            />
          );
        }
        if (
          currentTab === "manager_clients" ||
          currentTab === "hq_clients" ||
          currentTab === "hq_analytics"
        ) {
          return (
            <ManagerCRM
              activeTab={currentTab}
              setActiveTab={(tab) => setCurrentTab(tab)}
            />
          );
        }
        if (currentTab === "manager_finances" || currentTab === "hq_finances")
          return <FinanceModule />;
        if (currentTab === "manager_sync" || currentTab === "hq_calendar_sync")
          return <GoogleCalendarSync />;
        if (currentTab === "manager_coaches" || currentTab === "hq_coaches")
          return <CoachesList />;
        if (currentTab === "manager_groups" || currentTab === "hq_groups")
          return <GroupsModule />;
        if (currentTab === "hq_tasks") return <TasksModule />;
        if (currentTab === "hq_attendance")
          return (
            <TrainerCRM
              activeTab="trainer_attendance"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "hq_messages")
          return (
            <TrainerCRM
              activeTab="trainer_messages"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "hq_home")
          return <DirectorCRM setActiveTab={setCurrentTab} />;
        return (
          <ManagerCRM
            activeTab="hq_leads"
            setActiveTab={(tab) => setCurrentTab(tab)}
          />
        );

      case "trainer":
        if (currentTab === "trainer_settings") return <HQSettings />;
        if (currentTab === "trainer_home")
          return (
            <TrainerCRM activeTab="trainer_home" setActiveTab={setCurrentTab} />
          );
        if (currentTab === "trainer_schedule")
          return (
            <TrainerCRM
              activeTab="trainer_schedule"
              setActiveTab={setCurrentTab}
            />
          );
        if (
          currentTab === "trainer_attendance" ||
          currentTab === "hq_attendance"
        )
          return (
            <TrainerCRM
              activeTab="trainer_attendance"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "trainer_progress")
          return (
            <TrainerCRM
              activeTab="trainer_progress"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "trainer_messages" || currentTab === "hq_messages")
          return (
            <TrainerCRM
              activeTab="trainer_messages"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "trainer_groups")
          return (
            <TrainerCRM
              activeTab="trainer_groups"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "trainer_sessions")
          return (
            <TrainerCRM
              activeTab="trainer_sessions"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "trainer_homeworks")
          return (
            <TrainerCRM
              activeTab="trainer_homeworks"
              setActiveTab={setCurrentTab}
            />
          );
        if (currentTab === "trainer_knowledge")
          return (
            <TrainerCRM
              activeTab="trainer_knowledge"
              setActiveTab={setCurrentTab}
            />
          );
        return (
          <TrainerCRM activeTab="trainer_home" setActiveTab={setCurrentTab} />
        );

      case "parent":
        return (
          <ParentPortal activeTab={currentTab} setActiveTab={setCurrentTab} />
        );

      default:
        return <DirectorCRM setActiveTab={setCurrentTab} />;
    }
  };

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans w-full max-w-full overflow-x-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          currentRole={currentRole}
          activeTab={currentTab}
          setActiveTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      {/* Main content hub panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative w-full lg:w-auto">
        {firestoreError &&
          (() => {
            const isOffline =
              firestoreError.toLowerCase().includes("offline") ||
              firestoreError.toLowerCase().includes("unavailable");
            return (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 text-xs font-sans text-amber-800 shrink-0 select-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{isOffline ? "📡" : "⚠️"}</span>
                    <div>
                      <h4 className="font-bold text-amber-955 mb-0.5 text-sm">
                        {isOffline
                          ? `Нет подключения к базе данных Firestore (Проект: ${firebaseConfig.projectId})`
                          : `Ограничение доступа к Firestore (Проект: ${firebaseConfig.projectId})`}
                      </h4>
                      <div className="text-amber-800 leading-relaxed max-w-4xl">
                        {isOffline ? (
                          <p>
                            <strong>Инстанс базы данных не отвечает:</strong>{" "}
                            <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950 font-bold">
                              {firestoreError.substring(0, 150)}
                            </code>
                            . Обычно это означает, что вы еще не создали
                            выбранный инстанс БД{" "}
                            <span className="font-semibold underline">
                              {(firebaseConfig as any).firestoreDatabaseId}
                            </span>{" "}
                            в консоли Firebase (создается через{" "}
                            <em>Cloud Firestore &gt; Create Database</em>) или
                            ваше сетевое соединение блокирует трафик сокетов
                            Firebase. Приложение автоматически перешло в{" "}
                            <strong>Демо-режим на локальных данных</strong>.
                          </p>
                        ) : (
                          <p>
                            Ошибка разрешений Firestore:{" "}
                            <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950 font-bold">
                              {firestoreError.substring(0, 150)}
                            </code>
                            . Инстанс{" "}
                            <span className="font-semibold underline">
                              {(firebaseConfig as any).firestoreDatabaseId}
                            </span>{" "}
                            временно закрыт для записи без правил безопасности.
                            Приложение запущено в{" "}
                            <strong>Демо-режиме на локальных данных</strong>.
                          </p>
                        )}

                        {showInstructions && (
                          <div className="mt-4 p-4 bg-white border border-amber-200 rounded-lg space-y-3 text-slate-800 text-[12px] shadow-sm">
                            {isOffline ? (
                              <>
                                <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs mb-1">
                                  <span>⚙️</span> Решение проблемы со статусом
                                  Offline:
                                </div>
                                <ul className="list-disc pl-5 space-y-2.5 leading-relaxed text-slate-700">
                                  <li>
                                    <strong>
                                      Создание инстанса базы данных:
                                    </strong>
                                    <p className="mt-1 text-slate-600">
                                      Идентификатор базы данных:{" "}
                                      <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-red-600">
                                        {
                                          (firebaseConfig as any)
                                            .firestoreDatabaseId
                                        }
                                      </code>
                                      . Пожалуйста, перейдите в{" "}
                                      <a
                                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline font-semibold"
                                      >
                                        консоль Firebase
                                      </a>
                                      , нажмите{" "}
                                      <strong>«Create database»</strong>, и при
                                      создании введите{" "}
                                      <strong>Database ID</strong>:
                                      <br />
                                      <code className="bg-slate-900 text-slate-100 px-2 py-1 rounded inline-block font-mono text-[11px] select-all my-1">
                                        {
                                          (firebaseConfig as any)
                                            .firestoreDatabaseId
                                        }
                                      </code>
                                    </p>
                                  </li>
                                  <li>
                                    <strong>Блокировщики рекламы:</strong>
                                    <p className="mt-1 text-slate-600">
                                      Убедитесь, что ad-block, корпоративные
                                      Firewall или прокси не режут фоновые
                                      WebSocket сокет-соединения Firebase.
                                      Попробуйте вкладку инкогнито.
                                    </p>
                                  </li>
                                </ul>
                              </>
                            ) : (
                              <>
                                <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs mb-1">
                                  <span>⚙️</span> Настройка правил доступа:
                                </div>
                                <p className="text-slate-700 leading-relaxed mb-2">
                                  Вы подключили приватное окружение Firebase.
                                  Достаточно один раз скопировать правила
                                  безопасности в консоли Firebase:
                                </p>
                                <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-slate-700">
                                  <li>
                                    Перейдите к разделу правил:{" "}
                                    <a
                                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 font-semibold underline hover:text-blue-800"
                                    >
                                      Перейти в Firebase Console ↗
                                    </a>
                                  </li>
                                  <li>
                                    Примените на вкладке <strong>Rules</strong>{" "}
                                    следующие правила и нажмите{" "}
                                    <strong>Publish</strong>:
                                    <pre className="bg-slate-900 text-slate-100 p-3 mt-1.5 rounded-md font-mono text-[10px] overflow-x-auto select-all leading-normal">
                                      {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                                    </pre>
                                  </li>
                                </ol>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-medium text-[11px] transition inline-block text-center whitespace-nowrap"
                    >
                      {showInstructions ? "Скрыть помощь" : "Показать решение"}
                    </button>
                    <a
                      href={
                        isOffline
                          ? `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`
                          : `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium shadow-sm transition inline-block text-center whitespace-nowrap text-[11px]"
                    >
                      {isOffline ? "Консоль базы" : "Правила безопасности"}
                    </a>
                    <button
                      onClick={dismissFirestoreError}
                      className="px-3 py-1.5 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded font-medium transition text-[11px] font-semibold whitespace-nowrap"
                    >
                      Понятно
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Simple global breadcrumbs bar with live interactive Role Switcher */}
        <div className="bg-white px-4 md:px-6 py-2.5 border-b border-gray-150 flex items-center justify-between text-xs text-slate-500 font-sans sticky top-0 z-30 shadow-sm md:shadow-none">
          <div className="flex items-center space-x-2 font-medium">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 mr-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span
              onClick={() => {
                if (appUser?.role !== "admin" && appUser?.role !== "director") return;
                const roles: (
                  | "admin"
                  | "director"
                  | "manager"
                  | "trainer"
                  | "parent"
                )[] = ["admin", "director", "manager", "trainer", "parent"];
                const nextIdx = (roles.indexOf(currentRole) + 1) % roles.length;
                setCurrentRole(roles[nextIdx]);
              }}
              className={`px-2 py-1 rounded-md border transition duration-150 text-[10px] font-bold inline-flex items-center space-x-1 ${
                appUser?.role === "admin" || appUser?.role === "director"
                  ? "text-red-600 bg-red-50 border-red-200/60 hover:bg-red-100/80 cursor-pointer"
                  : "text-slate-600 bg-slate-50 border-slate-200/60 cursor-default"
              }`}
              title="Нажмите для смены роли"
            >
              <span>
                {currentRole === "admin"
                  ? "Админ"
                  : currentRole === "director"
                    ? "Директор"
                    : currentRole === "manager"
                      ? "Менеджер"
                      : currentRole === "trainer"
                        ? "Тренер"
                        : currentRole === "parent"
                          ? "Родитель"
                          : currentRole}
              </span>
              {(appUser?.role === "admin" || appUser?.role === "director") && (
                <RefreshCw className="w-2.5 h-2.5 ml-1 animate-spin-hover text-red-500" />
              )}
            </span>
          </div>

          <div className="flex items-center space-x-3 select-none">
            <InstallAppPrompt />

            {/* Quick action: Open secure payment portal for default sandbox */}
            {currentRole === "parent" && (
              <button
                onClick={() => setPaymentModalClientId("cl1")}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded uppercase transition font-mono"
              >
                💳 Оплатить абонемент
              </button>
            )}

            {/* Quick administrative role helper indicator */}
            <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 border rounded-lg hidden sm:flex">
              <Shield className="w-3.5 h-3.5 text-slate-550" />
              <span className="text-[10px] text-gray-550 font-bold uppercase tracking-wide">
                Доступ разрешен
              </span>
            </div>
          </div>
        </div>

        {/* CRM Role-Specific Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
          <div className="flex-1 flex flex-col min-h-0">{renderRoleComponent()}</div>

          {/* Global Footer */}
          <footer className="mt-auto py-6 border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 opacity-80">
                <AmkarLogo width="24" height="24" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                  Амкар Юниор
                </span>
              </div>

              <div className="text-center sm:text-right flex flex-col items-center sm:items-end gap-1">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors"
                >
                  Политика конфиденциальности
                </a>
                <a
                  href="/safety"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors"
                >
                  Обработка персональных данных
                </a>
                <p className="text-[10px] text-slate-400 mt-1">
                  © {new Date().getFullYear()} ИП Тюкалов Е.Е. Все права
                  защищены.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {paymentModalClientId && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPaymentModalClientId(null)}
          clientId={paymentModalClientId}
        />
      )}
    </div>
  );
}

import { TelegramReportScheduler } from "./components/TelegramReportScheduler";

function AuthGateway() {
  const { user, appUser, loading, logout } = useAuth();
  const { currentRole, setCurrentRole, updateUserProfile, currentTab, setCurrentTab } = useCRM();

  // Sync Firebase appUser role to the CRM mock state when the user logs in
  React.useEffect(() => {
    if (appUser && appUser.role) {
      setCurrentRole(appUser.role);
      if (appUser.role === "parent" && (!currentTab || !currentTab.startsWith("parent_"))) {
        setCurrentTab("parent_home");
      } else if (appUser.role === "trainer" && (!currentTab || (!currentTab.startsWith("trainer_") && !currentTab.startsWith("hq_")))) {
        setCurrentTab("trainer_home");
      }
    }
    if (appUser) {
      updateUserProfile({
        name: appUser.fullName || '',
        phone: appUser.phone || '',
        email: appUser.email || '',
        role: appUser.role,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.uid]);

  if (loading) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (!user || !appUser) {
    return <AuthScreen />;
  }

  return (
    <>
      <DashboardContainer />
      <NotificationListener />
      <TelegramReportScheduler />
      {/* Global Logout Button */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={logout}
          className="bg-white/90 shadow-md backdrop-blur px-3 py-1.5 rounded-full text-[10px] uppercase font-bold text-slate-500 hover:text-red-500 hover:bg-white transition"
        >
          ВЫЙТИ ({appUser.role})
        </button>
      </div>
    </>
  );
}

import { InstallAppPrompt } from "./components/InstallAppPrompt";
import { RegistrationPage } from "./components/RegistrationPage";
import { StaffRegistrationPage } from "./components/StaffRegistrationPage";
import { NotificationListener } from "./components/NotificationListener";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { AmkarLogo } from "./components/AmkarLogo";
import { SafetyPolicy } from "./components/SafetyPolicy";
import { PhotoPolicy } from "./components/PhotoPolicy";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  React.useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  if (currentPath === "/") {
    return (
      <CRMProvider>
        <JoinPage />
      </CRMProvider>
    );
  }

  if (currentPath === "/privacy") {
    return (
      <PrivacyPolicy
        onBack={() => {
          window.history.back();
        }}
      />
    );
  }

  if (currentPath === "/safety") {
    return (
      <SafetyPolicy
        onBack={() => {
          window.history.back();
        }}
      />
    );
  }

  if (currentPath === "/photo") {
    return (
      <PhotoPolicy
        onBack={() => {
          window.history.back();
        }}
      />
    );
  }

  if (currentPath === "/join" || currentPath === "/payment") {
    return (
      <CRMProvider>
        <JoinPage />
      </CRMProvider>
    );
  }

  if (currentPath === "/register") {
    return (
      <AuthProvider>
        <CRMProvider>
          <RegistrationPage />
        </CRMProvider>
      </AuthProvider>
    );
  }

  if (currentPath === "/staff-join") {
    return (
      <AuthProvider>
        <StaffRegistrationPage />
      </AuthProvider>
    );
  }

  // /crm and any other route will hit the CRM Auth Gateway
  return (
    <AuthProvider>
      <CRMProvider>
        <AuthGateway />
      </CRMProvider>
    </AuthProvider>
  );
}
