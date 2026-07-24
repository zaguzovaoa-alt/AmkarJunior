import React, { useEffect, useState, useRef } from "react";
import { useCRM } from "../context/CRMContext";
import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";

const pushedNotifsCache = new Set<string>();

export const NotificationListener: React.FC = () => {
  const {
    notifications,
    currentRole,
    userProfile,
    markNotificationRead,
    groups,
    clients,
  } = useCRM();
  const [browserPermission, setBrowserPermission] =
    useState<NotificationPermission>("default");
  const [activeToasts, setActiveToasts] = useState<string[]>([]);
  const pushedNotifsRef = useRef<Set<string>>(new Set());
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setBrowserPermission(permission);
          if (permission === "granted" && messaging) {
            initializeFCM();
          }
        });
      } else if (Notification.permission === "granted" && messaging) {
        initializeFCM();
      }
    }

    function initializeFCM() {
      if (!messaging) return;
      getToken(messaging, {
        vapidKey: process.env.VITE_FCM_VAPID_KEY || "dummy_vapid_key",
      })
        .then((token) => {
          if (token) {
            setFcmToken(token);
            // In a real app we would save this token to Firestore to target messages.
          }
        })
        .catch((err) => {
          console.warn(
            "FCM Token generation failed (expected in sandbox without VAPID keys):",
            err,
          );
        });

      onMessage(messaging, (payload) => {
        console.log("FCM Message received. ", payload);
        // Display foreground notification if needed
      });
    }
  }, []);

  useEffect(() => {
    // Determine which ones are relevant for me and unread
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
        // Find if any of parent's children are in these groups
        // parent is userProfile, they have phone
        const myKids = clients.filter(
          (c) => c.parentPhone === userProfile.phone,
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

    // For any relevant unread notification that we haven't toasted yet, Toast + Push Notification
    const newlyUnread = relevantUnread.filter(
      (n) => !pushedNotifsCache.has(n.id),
    );

    newlyUnread.forEach((n) => {
      pushedNotifsCache.add(n.id);
      setActiveToasts((prev) => [...prev, n.id]);

      // Hardware Push
      if (browserPermission === "granted") {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(n.title, { body: n.body, icon: "/favicon.ico" });
          }).catch(() => {
            new Notification(n.title, { body: n.body, icon: "/favicon.ico" });
          });
        } else {
          new Notification(n.title, { body: n.body, icon: "/favicon.ico" });
        }
      }

      // Auto-hide toast after 8 seconds, but keep it in history/unread unless explicitly marked
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((tid) => tid !== n.id));
      }, 8000);
    });
  }, [
    notifications,
    currentRole,
    browserPermission,
    activeToasts,
    clients,
    userProfile.phone,
    groups,
  ]);

  // Render Toasts
  const toastsToRender = notifications.filter((n) =>
    activeToasts.includes(n.id),
  );

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-3 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {toastsToRender.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`w-80 p-4 rounded-2xl shadow-2xl pointer-events-auto relative border ${
              notif.type === "event"
                ? "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900"
                : notif.type === "system"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <button
              onClick={() => {
                setActiveToasts((prev) => prev.filter((id) => id !== notif.id));
                markNotificationRead(notif.id);
              }}
              className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start space-x-3">
              <div className="pt-0.5 shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm leading-tight pr-4">
                  {notif.title}
                </h4>
                <p className="text-xs opacity-80 leading-snug">{notif.body}</p>
                <div className="text-[9px] font-mono opacity-50 pt-1 uppercase tracking-widest block">
                  {notif.type} • Push-уведомление
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
