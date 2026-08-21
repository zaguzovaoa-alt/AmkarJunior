import React, { useEffect, useState, useRef, useCallback } from "react";
import { useCRM } from "../context/CRMContext";
import { Bell, BellRing, X, ArrowRight, Volume2, CheckCircle2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { playNotificationSound } from "../utils/audio";

// Track notification IDs that were already toasted or alerted in this session
const pushedNotifsCache = new Set<string>();

export const NotificationListener: React.FC = () => {
  const {
    notifications,
    currentRole,
    userProfile,
    markNotificationRead,
    setCurrentTab,
    groups,
    clients,
  } = useCRM();

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  const [activeToasts, setActiveToasts] = useState<string[]>([]);
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitleRef = useRef<string>(typeof document !== "undefined" ? document.title : "");

  // Register Service Worker for robust Background Push & Actions
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setSwRegistration(reg);
          console.log("Push Notification Service Worker registered successfully.");
        })
        .catch((err) => {
          console.warn("Service worker registration failed (using direct Notification fallback):", err);
        });

      const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data?.type === "OPEN_LEADS_TAB") {
          window.focus();
          const targetTab = currentRole === "manager" ? "manager_leads" : "hq_leads";
          setCurrentTab(targetTab);
        }
      };

      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      };
    }
  }, [currentRole, setCurrentTab]);

  // Check and update permission status
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);
      const isDismissed = localStorage.getItem("amkar_dismiss_push_banner") === "true";
      if (Notification.permission === "default" && !isDismissed && (currentRole === "director" || currentRole === "manager" || currentRole === "admin")) {
        setShowPermissionBanner(true);
      } else {
        setShowPermissionBanner(false);
      }
    }
  }, [currentRole]);

  // Document title restoration on focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
        if (originalTitleRef.current) {
          document.title = originalTitleRef.current;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
    };
  }, []);

  // Request Push Notification Permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Ваш браузер не поддерживает Push-уведомления.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      setShowPermissionBanner(false);

      if (permission === "granted") {
        playNotificationSound();
        // Dispatch test confirmation
        sendNativePush("🔔 Уведомления включены!", "Вы будете мгновенно получать оповещения о новых заявках клиентов.");
      } else if (permission === "denied") {
        alert("Push-уведомления заблокированы в настройках браузера. Разрешите их в настройках сайта для получения оповещений.");
      }
    } catch (e) {
      console.error("Error requesting notification permission:", e);
    }
  }, []);

  // Dispatch hardware / browser push notification
  const sendNativePush = useCallback((title: string, body: string, notifId?: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      if (swRegistration && "showNotification" in swRegistration) {
        swRegistration.showNotification(title, {
          body,
          icon: "/favicon.png",
          badge: "/favicon.png",
          tag: notifId || "amkar-" + Date.now(),
          data: { url: "/crm" },
          vibrate: [200, 100, 200],
          requireInteraction: true,
        }).catch(() => {
          fallbackDirectNotification(title, body);
        });
      } else {
        fallbackDirectNotification(title, body);
      }
    } catch (err) {
      console.warn("Push notification delivery error:", err);
    }

    function fallbackDirectNotification(t: string, b: string) {
      try {
        const notif = new Notification(t, {
          body: b,
          icon: "/favicon.png",
        });
        notif.onclick = () => {
          window.focus();
          const targetTab = currentRole === "manager" ? "manager_leads" : "hq_leads";
          setCurrentTab(targetTab);
        };
      } catch (e) {
        console.warn("Direct Notification constructor failed in environment:", e);
      }
    }
  }, [swRegistration, currentRole, setCurrentTab]);

  // Flash title in tab when inactive
  const flashTabTitle = (alertText: string) => {
    if (typeof document === "undefined") return;
    if (!document.hidden) return;

    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title || "АМКАР ЮНИОР CRM";
    }

    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
    }

    let isFlashing = false;
    titleIntervalRef.current = setInterval(() => {
      document.title = isFlashing ? alertText : originalTitleRef.current;
      isFlashing = !isFlashing;
    }, 1200);
  };

  // Main listener for incoming notifications
  useEffect(() => {
    if (notifications.length === 0) return;

    // Filter unread notifications relevant to current role / user
    const relevantUnread = notifications.filter((notif) => {
      if (notif.isRead) return false;

      // Role check
      if (
        notif.targetRole &&
        notif.targetRole.length > 0 &&
        !notif.targetRole.includes(currentRole)
      ) {
        return false;
      }

      // If parent, check group membership
      if (
        currentRole === "parent" &&
        notif.targetGroupIds &&
        notif.targetGroupIds.length > 0
      ) {
        const myKids = clients.filter(
          (c) => c.parentPhone === userProfile?.phone,
        );
        const kidGroupNames = myKids.map((c) => c.groupName);
        const myKidsIds = myKids.map((c) => c.id);
        const myGroupIds = groups
          .filter(
            (g) =>
              kidGroupNames.includes(g.name) ||
              (g.isSelectTeam &&
                g.selectedClientIds?.some((id) => myKidsIds.includes(id))),
          )
          .map((g) => g.id);

        const hasOverlap = notif.targetGroupIds.some((gid) =>
          myGroupIds.includes(gid),
        );
        if (!hasOverlap) return false;
      }

      return true;
    });

    // On initial boot, seed the cache so we don't spam 20 historical notifications on page refresh
    if (isInitialLoadRef.current) {
      relevantUnread.forEach((n) => pushedNotifsCache.add(n.id));
      isInitialLoadRef.current = false;
      return;
    }

    // Find genuinely new notifications that arrived in real-time
    const newlyReceived = relevantUnread.filter((n) => !pushedNotifsCache.has(n.id));

    newlyReceived.forEach((n) => {
      pushedNotifsCache.add(n.id);
      setActiveToasts((prev) => [...prev, n.id]);

      // 1. Play audible sound chime
      playNotificationSound();

      // 2. Dispatch hardware Push Notification
      sendNativePush(n.title, n.body, n.id);

      // 3. Flash document title if in another tab
      flashTabTitle(`🚨 ${n.title} | АМКАР ЮНИОР`);

      // 4. Auto-dismiss toast after 10 seconds (stays in unread badge until read)
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((tid) => tid !== n.id));
      }, 10000);
    });
  }, [
    notifications,
    currentRole,
    clients,
    userProfile?.phone,
    groups,
    sendNativePush,
  ]);

  // Test Notification Trigger
  const triggerTestNotification = () => {
    playNotificationSound();
    sendNativePush(
      "⚡ Тестовая заявка: Смирнов Матвей (7 лет)",
      "Источник: Посадочная страница. Телефон: +7 (999) 000-11-22"
    );
    const testToastId = "test_toast_" + Date.now();
    setActiveToasts((prev) => [...prev, testToastId]);
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((tid) => tid !== testToastId));
    }, 8000);
  };

  const toastsToRender = notifications
    .filter((n) => activeToasts.includes(n.id))
    .concat(
      activeToasts
        .filter((tid) => tid.startsWith("test_toast_"))
        .map((tid) => ({
          id: tid,
          title: "⚡ Тестовая заявка: Смирнов Матвей (7 лет)",
          body: "Источник: Посадочная страница. Телефон: +7 (999) 000-11-22. Уведомления и звук работают штатно!",
          type: "system" as const,
          isRead: false,
          dateString: new Date().toISOString(),
        }))
    );

  return (
    <>
      {/* Push Permission Prompt Banner */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-[99999] max-w-xl w-[95%] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-red-500/30 flex items-center justify-between gap-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-snug">
                  Включите Push-уведомления
                </h4>
                <p className="text-xs text-slate-300 leading-tight">
                  Получайте моментальные оповещения со звуком при поступлении новых заявок.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={requestPermission}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/30 whitespace-nowrap flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Разрешить</span>
              </button>
              <button
                onClick={() => {
                  setShowPermissionBanner(false);
                  localStorage.setItem("amkar_dismiss_push_banner", "true");
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Push Notifications / In-App Toasts */}
      <div className="fixed bottom-5 right-5 z-[9999] space-y-3 flex flex-col items-end pointer-events-none max-w-md w-full px-4 sm:px-0">
        <AnimatePresence>
          {toastsToRender.map((notif) => {
            const isNewLead = notif.title.toLowerCase().includes("заявк");
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`w-full sm:w-96 p-4 rounded-2xl shadow-2xl pointer-events-auto relative border ${
                  isNewLead
                    ? "bg-slate-900 border-red-500/50 text-white shadow-red-950/40"
                    : notif.type === "event"
                      ? "bg-fuchsia-950 border-fuchsia-700/50 text-white"
                      : "bg-slate-900 border-slate-700 text-white"
                }`}
              >
                <button
                  onClick={() => {
                    setActiveToasts((prev) => prev.filter((id) => id !== notif.id));
                    markNotificationRead(notif.id);
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isNewLead
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/40 animate-bounce"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm leading-tight text-white">
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">
                      {notif.body}
                    </p>

                    {isNewLead && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveToasts((prev) => prev.filter((id) => id !== notif.id));
                            markNotificationRead(notif.id);
                            const targetTab = currentRole === "manager" ? "manager_leads" : "hq_leads";
                            setCurrentTab(targetTab);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-md shadow-red-600/30"
                        >
                          <span>Открыть заявки</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono pt-1 uppercase tracking-wider flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3 text-red-400" />
                      <span>Push & Звуковое оповещение</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
};
