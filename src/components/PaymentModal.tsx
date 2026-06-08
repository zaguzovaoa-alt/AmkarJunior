import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Shield, X, Loader2 } from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const PaymentModal = ({
  isOpen,
  onClose,
  clientId,
}: {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}) => {
  const { clients, crmConfig, addFinanceRecord, financeCategories } = useCRM();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<
    "12_sessions" | "8_sessions" | "4_sessions" | "1_session"
  >("12_sessions");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!crmConfig || !crmConfig.tariffs) return;
    switch (selectedTariff) {
      case "12_sessions":
        setAmount(crmConfig.tariffs["12_sessions"] || 0);
        break;
      case "8_sessions":
        setAmount(crmConfig.tariffs["8_sessions"] || 0);
        break;
      case "4_sessions":
        setAmount(crmConfig.tariffs["4_sessions"] || 0);
        break;
      case "1_session":
        setAmount(crmConfig.tariffs["1_session"] || 0);
        break;
    }
  }, [selectedTariff, crmConfig]);

  if (!isOpen) return null;
  if (!crmConfig || !crmConfig.tariffs)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );

  const handlePay = async () => {
    setLoading(true);
    // Simulate API delay for a beautiful YooKassa experience
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real app we would call YooKassa widget here, and verify payment via webhook.
    // Here we update firestore directly to simulate success.
    try {
      const clientRef = doc(db, "clients", clientId);
      const clientDoc = await getDoc(clientRef);
      if (clientDoc.exists()) {
        const c = clientDoc.data();
        let sessions = 12;
        if (selectedTariff === "8_sessions") sessions = 8;
        if (selectedTariff === "4_sessions") sessions = 4;
        if (selectedTariff === "1_session") sessions = 1;

        const updatedSessions = (c.abonementSessionsLeft || 0) + sessions;
        const newPayment = {
          id: `p_${Date.now()}`,
          date: new Date().toISOString().substring(0, 10),
          amount,
          item: `Абонемент на ${sessions} занятий`,
          status: "Оплачено",
        };

        const updatedPayments = [newPayment, ...(c.payments || [])];

        await updateDoc(clientRef, {
          abonement: selectedTariff,
          abonementStatus: "Оплачено",
          abonementTotalSessions: updatedSessions,
          abonementSessionsLeft: updatedSessions,
          abonementExpirationDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .substring(0, 10),
          payments: updatedPayments,
        });

        const categoryName = sessions === 1 ? "Разовые тренировки" : "Абонементы";
        const catObj = financeCategories.find(c => c.name === categoryName && c.type === 'income');

        await addFinanceRecord({
          type: "income",
          category: catObj ? catObj.name : categoryName,
          amount,
          date: new Date().toISOString().substring(0, 10),
          description: `Оплата ${sessions} занятий (${c.childSurname} ${c.childName}) ЮKassa`,
          accountId: "acc_bank",
          isFixed: false
        });
      }
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Ошибка при проведении платежа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={!loading && !success ? onClose : undefined}
      ></div>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center relative">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">
              Оплата YooKassa
            </h3>
          </div>
          {!loading && !success && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4 py-8 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800">
                  Оплата прошла успешно!
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  Ваш абонемент продлен. Ссылка на чек отправлена на вашу почту.
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  onClose();
                  window.location.reload();
                }}
                className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition"
              >
                Вернуться
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Выберите тариф
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedTariff("12_sessions")}
                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${selectedTariff === "12_sessions" ? "border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "border-slate-100 bg-slate-50 hover:bg-slate-100"}`}
                  >
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                      12 занятий
                    </div>
                    <div className="font-black text-slate-800 text-lg">
                      {crmConfig?.tariffs?.["12_sessions"] || 0} ₽
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedTariff("8_sessions")}
                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${selectedTariff === "8_sessions" ? "border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "border-slate-100 bg-slate-50 hover:bg-slate-100"}`}
                  >
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                      8 занятий
                    </div>
                    <div className="font-black text-slate-800 text-lg">
                      {crmConfig?.tariffs?.["8_sessions"] || 0} ₽
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedTariff("4_sessions")}
                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${selectedTariff === "4_sessions" ? "border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "border-slate-100 bg-slate-50 hover:bg-slate-100"}`}
                  >
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                      4 занятия
                    </div>
                    <div className="font-black text-slate-800 text-lg">
                      {crmConfig?.tariffs?.["4_sessions"] || 0} ₽
                    </div>
                  </div>
                  <div
                    onClick={() => setSelectedTariff("1_session")}
                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${selectedTariff === "1_session" ? "border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "border-slate-100 bg-slate-50 hover:bg-slate-100"}`}
                  >
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                      Разовое
                    </div>
                    <div className="font-black text-slate-800 text-lg">
                      {crmConfig?.tariffs?.["1_session"] || 0} ₽
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-500 shrink-0" />
                <div className="text-[10px] text-blue-700 leading-tight">
                  Платеж защищен шифрованием. Мы не храним данные ваших карт.
                  Операция проходит через сервис ЮKassa.
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-4 bg-[#000000] hover:bg-[#1a1a1a] text-[#00FFFF] font-black tracking-widest text-lg rounded-2xl shadow-[0_0_15px_rgba(0,255,255,0.4)] disabled:opacity-70 transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#00FFFF]" />
                ) : (
                  <>
                    <span>Оплатить {amount} ₽</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
