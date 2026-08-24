import React, { useEffect, useState, useRef, useCallback } from "react";
import { useCRM } from "../context/CRMContext";
import { BellRing, X, ArrowRight, Volume2, CheckCircle2, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { playNotificationSound } from "../utils/audio";

// Helper for converting Base64 VAPID Key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Persistent cache of handled notification IDs to strictly prevent duplicates
const STORAGE_KEY = "amkar_handled_notif_ids_v2";

function getHandledNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: string[] = JSON.parse(raw);
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function markNotificationAsHandled(id: string) {
  if (typeof window === "undefined" || !id) return;
  try {
    const set = getHandledNotificationIds();
    set.add(id);
    // Keep max 500 recent IDs
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to persist handled notification ID:", e);
  }
}

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
  
  // Track mount time so historical notifications don't play sound or spam on load
  const sessionStartTimeRef = useRef<number>(Date.now());
  const isInitialMountedRef = useRef<boolean>(false);
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitleRef = useRef<string>(typeof document !== "undefined" ? document.title : "");

  // 1. Subscribe client to Web Push on the server
  const subscribeToWebPush = useCallback(async (reg: ServiceWorkerRegistration) => {
    try {
      if (!("pushManager" in reg)) return;

      // Fetch VAPID public key
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) return;
      const { publicKey } = await keyRes.json();
      if (!publicKey) return;

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // Send to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          role: currentRole || "all",
          userPhone: userProfile?.phone || "",
        }),
      });
      console.log("Device successfully subscribed to background Web Push.");
    } catch (e) {
      console.warn("Background Web Push registration warning:", e);
    }
  }, [currentRole, userProfile?.phone]);

  // 2. Register Service Worker for background push
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setSwRegistration(reg);
        if (Notification.permission === "granted") {
          subscribeToWebPush(reg);
        }
      })
      .catch((err) => {
        console.warn("Service worker registration skipped:", err);
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
  }, [subscribeToWebPush, currentRole, setCurrentTab]);

  // 3. Check and show permission banner if not yet requested
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setBrowserPermission(Notification.permission);
    const isDismissed = localStorage.getItem("amkar_dismiss_push_banner") === "true";
    if (
      Notification.permission === "default" &&
      !isDismissed &&
      (currentRole === "director" || currentRole === "manager" || currentRole === "admin")
    ) {
      setShowPermissionBanner(true);
    } else {
      setShowPermissionBanner(false);
    }
  }, [currentRole]);

  // 4. Tab title flasher when in background
  const flashTabTitle = (alertText: string) => {
    if (typeof document === "undefined" || !document.hidden) return;

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

  // 5. Native OS Push Sender
  const sendNativePush = useCallback(
    (title: string, body: string, notifId?: string) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      try {
        if (swRegistration && "showNotification" in swRegistration) {
          swRegistration
            .showNotification(title, {
              body,
              icon: "/favicon.png",
              badge: "/favicon.png",
              tag: notifId || "amkar-" + Date.now(),
              data: { url: "/crm" },
              vibrate: [200, 100, 200],
              requireInteraction: true,
            })
            .catch(() => fallbackDirect(title, body));
        } else {
          fallbackDirect(title, body);
        }
      } catch {
        fallbackDirect(title, body);
      }

      function fallbackDirect(t: string, b: string) {
        try {
          const notif = new Notification(t, { body: b, icon: "/favicon.png" });
          notif.onclick = () => {
            window.focus();
            const targetTab = currentRole === "manager" ? "manager_leads" : "hq_leads";
            setCurrentTab(targetTab);
          };
        } catch {}
      }
    },
    [swRegistration, currentRole, setCurrentTab]
  );

  // 6. Request Permission Handler
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
        if (swRegistration) {
          await subscribeToWebPush(swRegistration);
        }
        sendNativePush(
          "🔔 Push-уведомления включены!",
          "Оповещения о новых заявках будут приходить вовремя и без повторов."
        );
      } else if (permission === "denied") {
        alert("Push-уведомления заблокированы. Разрешите их в настройках браузера для получения оповещений.");
      }
    } catch (e) {
      console.error("Error requesting notification permission:", e);
    }
  }, [swRegistration, subscribeToWebPush, sendNativePush]);

  // 7. Auto-unlock AudioContext on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const tempCtx = new AudioContextClass();
          tempCtx.resume().then(() => tempCtx.close()).catch(() => {});
        }
      } catch {}
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // 8. Robust Single-Execution Notification Listener
  useEffect(() => {
    if (notifications.length === 0) return;

    const handledIds = getHandledNotificationIds();

    // On initial mount of the session: mark all pre-existing notifications as handled so they don't fire spam on load
    if (!isInitialMountedRef.current) {
      isInitialMountedRef.current = true;
      notifications.forEach((n) => {
        // Any notification created prior to this page open is already known
        const notifTime = new Date(n.dateString).getTime();
        if (notifTime < sessionStartTimeRef.current - 10000) {
          markNotificationAsHandled(n.id);
        }
      });
      return;
    }

    // Filter unread notifications relevant to current role / user
    const relevantUnread = notifications.filter((notif) => {
      if (notif.isRead) return false;
      if (handledIds.has(notif.id)) return false;

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
        const myKids = clients.filter((c) => c.parentPhone === userProfile?.phone);
        const kidGroupNames = myKids.map((c) => c.groupName);
        const myKidsIds = myKids.map((c) => c.id);
        const myGroupIds = groups
          .filter(
            (g) =>
              kidGroupNames.includes(g.name) ||
              (g.isSelectTeam && g.selectedClientIds?.some((id) => myKidsIds.includes(id)))
          )
          .map((g) => g.id);

        const hasOverlap = notif.targetGroupIds.some((gid) => myGroupIds.includes(gid));
        if (!hasOverlap) return false;
      }

      return true;
    });

    // Fire alert EXACTLY ONCE per new notification ID
    relevantUnread.forEach((n) => {
      markNotificationAsHandled(n.id);
      setActiveToasts((prev) => (prev.includes(n.id) ? prev : [...prev, n.id]));

      // 1. Play audible sound chime (1 time)
      playNotificationSound();

      // 2. Dispatch hardware OS Push Notification (1 time)
      sendNativePush(n.title, n.body, n.id);

      // 3. Flash document title if in another tab
      flashTabTitle(`🚨 ${n.title} | АМКАР ЮНИОР`);

      // 4. Auto-dismiss in-app toast after 8 seconds
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((tid) => tid !== n.id));
      }, 8000);
    });
  }, [
    notifications,
    currentRole,
    clients,
    userProfile?.phone,
    groups,
    sendNativePush,
  ]);

  const toastsToRender = notifications.filter((n) => activeToasts.includes(n.id));

  return (
    <>
      {/* Push Permission Prompt Banner */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] max-w-xl w-[95%] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-red-500/30 flex items-center justify-between gap-4 backdrop-blur-xl"
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
                  Получайте моментальные оповещения при поступлении заявок даже при закрытом приложении.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={requestPermission}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/30 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Разрешить</span>
              </button>
              <button
                onClick={() => {
                  setShowPermissionBanner(false);
                  localStorage.setItem("amkar_dismiss_push_banner", "true");
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Push Notifications / In-App Toasts (Shown 1 Time) */}
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
                  className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isNewLead
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse"
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
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-md shadow-red-600/30 cursor-pointer"
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
