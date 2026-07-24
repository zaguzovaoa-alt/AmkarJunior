import React, { useState, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { Lock, Phone, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { phonesMatch } from "../context/AuthContext";

interface CredentialsSettingsProps {
  currentPhone: string;
  hasPassword?: boolean;
}

export function CredentialsSettings({ currentPhone, hasPassword: initialHasPassword }: CredentialsSettingsProps) {
  const { updateUserCredentials } = useCRM();
  
  const [phone, setPhone] = useState(currentPhone || "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasPassword, setHasPassword] = useState<boolean | undefined>(initialHasPassword);

  useEffect(() => {
    if (initialHasPassword !== undefined) {
      setHasPassword(initialHasPassword);
      return;
    }
    const checkPassword = async () => {
      if (!currentPhone) return;
      const candidates = [currentPhone, currentPhone.replace('+7', '8'), currentPhone.replace(/^\+7/, '')].filter(Boolean);
      for (const cand of candidates) {
        const sysQ = query(collection(db, 'systemUsers'), where('phone', '==', cand));
        const sysDocs = await getDocs(sysQ);
        if (!sysDocs.empty) {
          setHasPassword(!!sysDocs.docs[0].data().password);
          return;
        }

        const coachQ = query(collection(db, 'coaches'), where('phone', '==', cand));
        const coachDocs = await getDocs(coachQ);
        if (!coachDocs.empty) {
          setHasPassword(!!coachDocs.docs[0].data().password);
          return;
        }

        const clientQ = query(collection(db, 'clients'), where('parentPhone', '==', cand));
        const clientDocs = await getDocs(clientQ);
        if (!clientDocs.empty) {
          setHasPassword(!!clientDocs.docs[0].data().password);
          return;
        }
      }

      // Fallback: search systemUsers, coaches, clients with phonesMatch
      const sysDocs = await getDocs(collection(db, 'systemUsers'));
      const sysMatch = sysDocs.docs.find(d => phonesMatch(d.data().phone, currentPhone));
      if (sysMatch) {
        setHasPassword(!!sysMatch.data().password);
        return;
      }

      const coachDocs = await getDocs(collection(db, 'coaches'));
      const coachMatch = coachDocs.docs.find(d => phonesMatch(d.data().phone, currentPhone));
      if (coachMatch) {
        setHasPassword(!!coachMatch.data().password);
        return;
      }

      const clientDocs = await getDocs(collection(db, 'clients'));
      const clientMatch = clientDocs.docs.find(d => phonesMatch(d.data().parentPhone, currentPhone));
      if (clientMatch) {
        setHasPassword(!!clientMatch.data().password);
        return;
      }
    };
    checkPassword();
  }, [currentPhone, initialHasPassword]);

  const handleSave = async () => {
    try {
      setStatus("loading");
      setErrorMsg("");
      if (!phone) {
        throw new Error("Номер телефона не может быть пустым");
      }
      await updateUserCredentials(phone, password || undefined);
      if (password) {
        setHasPassword(true);
        setPassword("");
      }
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setErrorMsg(e.message || "Ошибка при сохранении");
    }
  };

  return (
    <div className="p-5 rounded-2xl border bg-white shadow-sm space-y-4">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Данные для авторизации</h3>
          <p className="text-xs text-slate-500">Измените логин (телефон) или установите пароль</p>
        </div>
      </div>

      {!hasPassword && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl flex items-start space-x-2 text-xs border border-amber-100 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Похоже, вы еще не установили пароль для входа. Пожалуйста, придумайте пароль для защиты вашего аккаунта. В качестве логина используется ваш номер телефона.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center space-x-2 text-xs font-semibold mb-4 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4" />
          <span>Данные для входа успешно обновлены!</span>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-100">
          {errorMsg}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Логин (Номер телефона)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              placeholder="+7 (900) 000-00-00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Новый пароль
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              placeholder={hasPassword ? "Оставьте пустым, чтобы не менять" : "Придумайте пароль"}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={status === "loading"}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{status === "loading" ? "Сохранение..." : "Сохранить данные"}</span>
        </button>
      </div>
    </div>
  );
}
