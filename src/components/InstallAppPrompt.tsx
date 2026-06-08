import React, { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";

export const InstallAppPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Force visibility for demo in browser environments where event doesn't fire automatically yet
    if (!isStandalone) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        'Чтобы установить веб-приложение, нажмите кнопку "Поделиться" в вашем браузере и выберите "На экран «Домой»" (Add to Home Screen).',
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-emerald-500 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-200 text-emerald-600 rounded-lg shadow-sm transition-all active:scale-95 group"
      title="Установить приложение"
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-600 transition" />
      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
        Установить приложение
      </span>
      <Download className="w-3 h-3 text-emerald-500 group-hover:text-emerald-600 transition hidden sm:block" />
    </button>
  );
};
