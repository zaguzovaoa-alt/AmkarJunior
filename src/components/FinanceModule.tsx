import React, { useState, useMemo, useEffect } from "react";
import { HeaderDescription } from "./HeaderDescription";
import { toYearMonthString, formatSessionDateDisplay } from "../utils/dateUtils";
import { db } from "../firebase";
import { setDoc, doc, updateDoc } from "firebase/firestore";
import { useCRM } from "../context/CRMContext";
import { Counterparty } from "../types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  AlertOctagon,
  ClipboardList,
  CheckSquare,
  Trash2,
  Plus,
  Settings,
  PieChart,
  FileText,
  BarChart,
  Calendar,
  User,
  ArrowRight,
  CreditCard,
  Edit2,
  ArrowRightLeft,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  MessageSquare,
  Phone,
  Bell,
  Upload,
  Building2,
  X,
  ChevronRight,
  Search,
  Info,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const FinanceModule: React.FC = () => {
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const {
    finances,
    clients,
    groups,
    accounts,
    overwriteFinances,
    financeCategories,
    addFinanceCategory,
    deleteFinanceCategory,
    addFinanceRecord,
    addAccount,
    updateAccount,
    deleteAccount,
    updateFinancialPlan,
    financialPlans,
    deleteFinanceRecord,
    coaches,
    trainingSessions,
    crmConfig,
    updateCRMConfig,
    counterparties,
    addCounterparty,
    updateCounterparty,
    deleteCounterparty,
    currentRole,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "input"
    | "cashflow"
    | "pnl"
    | "directories"
    | "plan"
    | "accounts"
    | "salaries"
    | "rent"
    | "debts"
    | "counterparties"
    | "client_income"
    | "expiring"
  >(() => (currentRole === "manager" ? "expiring" : "dashboard"));

  const [expiringSessionsFilter, setExpiringSessionsFilter] = useState<"all" | 3 | 2 | 1 | "unpaid">("all");
  const [expiringSearchQuery, setExpiringSearchQuery] = useState<string>("");

  const [salaryTab, setSalaryTab] = useState<"staff" | "transactions">("staff");
  const [selectedCoachIdForDetail, setSelectedCoachIdForDetail] = useState<string | null>(null);
  const [coachDetailSubTab, setCoachDetailSubTab] = useState<"sessions" | "finances">("sessions");

  
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(yyyy, now.getMonth() + 1, 0).getDate();
  const currentMonthStr = `${yyyy}-${mm}`;

  const defaultStartDate = `${yyyy}-${mm}-01`;
  const defaultEndDate = `${yyyy}-${mm}-${lastDay}`;

  const [dashStartDate, setDashStartDate] = useState(defaultStartDate);
  const [dashEndDate, setDashEndDate] = useState(defaultEndDate);

  // Dashboard Logic
  const totalIncomes = finances
    .filter(
      (f) =>
        f.type === "income" && f.date >= dashStartDate && f.date <= dashEndDate,
    )
    .reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalExpenses = finances
    .filter(
      (f) =>
        f.type === "expense" &&
        f.paymentStatus !== "accrued" &&
        f.date >= dashStartDate &&
        f.date <= dashEndDate,
    )
    .reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const operatingProfit = totalIncomes - totalExpenses;
  const unpaidClients = (clients || []).filter(
    (c) =>
      c.status === "active" &&
      (c.abonementStatus === "unpaid" || c.abonementStatus === "expired"),
  );
  const totalDebts = unpaidClients.length * 4500;

  // States for input form
  const [fType, setFType] = useState<"income" | "expense">("income");
  const [fAmount, setFAmount] = useState("");
  const [fDate, setFDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; });
  const [fCat, setFCat] = useState("");
  const [fAccount, setFAccount] = useState<string>("acc_cash");
  const [fIsFixed, setFIsFixed] = useState(false);
  const [fTargetMonth, setFTargetMonth] = useState(currentMonthStr);
  const [fDesc, setFDesc] = useState("");
  const [fCounterparty, setFCounterparty] = useState("");

  const [addSuccessMsg, setAddSuccessMsg] = useState("");
  const [addErrorMsg, setAddErrorMsg] = useState("");

  // Transfer and Edit states
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccBalance, setEditAccBalance] = useState<number>(0);

  const [transferFromAcc, setTransferFromAcc] = useState<string | null>(null);
  const [transferToAcc, setTransferToAcc] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  // Payout Modal state (Salary / Rent)
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutType, setPayoutType] = useState<"salary" | "rent">("salary");
  const [payoutTargetName, setPayoutTargetName] = useState("");
  const [payoutTargetId, setPayoutTargetId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutAccountId, setPayoutAccountId] = useState("acc_cash");
  const [payoutDate, setPayoutDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const handlePayoutSubmit = () => {
    if (!payoutAmount || Number(payoutAmount) <= 0 || !payoutAccountId) return;

    const isSalary = payoutType === "salary";
    const cat = isSalary ? "Зарплата" : "Аренда";
    const desc = isSalary
      ? `Выплата зарплаты: ${payoutTargetName}`
      : `Оплата аренды площадки: ${payoutTargetName}`;

    addFinanceRecord({
      type: "expense",
      category: cat,
      amount: Number(payoutAmount),
      date: payoutDate,
      description: desc,
      accountId: payoutAccountId,
      paymentStatus: "paid",
      coachId: isSalary ? payoutTargetId : undefined,
      counterpartyId: !isSalary ? payoutTargetId : undefined,
    });

    setPayoutModalOpen(false);
    setPayoutAmount("");
    setAddSuccessMsg(isSalary ? "Зарплата успешно выплачена!" : "Аренда успешно оплачена!");
    setTimeout(() => setAddSuccessMsg(""), 3000);
  };

  useEffect(() => {
    // Left intentionally blank
  }, [accounts, finances]);

  const handleAddFinance = () => {
    if (!fAmount || !fCat || !fAccount) {
      setAddErrorMsg("Введите сумму, категорию и счет");
      setTimeout(() => setAddErrorMsg(""), 3000);
      return;
    }
    addFinanceRecord({
      type: fType,
      amount: Number(fAmount),
      category: financeCategories.find((c) => c.id === fCat)?.name || fCat,
      date: fDate,
      description: fDesc,
      targetMonth: fTargetMonth,
      accountId: fAccount,
      isFixed: fIsFixed,
      counterpartyId: fCounterparty || undefined,
    });
    setFAmount("");
    setFDesc("");
    setFCounterparty("");
    setAddSuccessMsg("Запись добавлена!");
    setTimeout(() => setAddSuccessMsg(""), 3000);
  };

  // Directories State
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [newCatExpenseType, setNewCatExpenseType] = useState<
    "variable" | "fixed"
  >("fixed");

  // Grid/Cashflow state
  const [gridFilterMonth, setGridFilterMonth] = useState(currentMonthStr);
  const [rentMonth, setRentMonth] = useState(currentMonthStr);
  const [rentDateMode, setRentDateMode] = useState<"month" | "half1" | "half2" | "period">("month");
  const [rentStartDate, setRentStartDate] = useState<string>(`${currentMonthStr}-01`);
  const [rentEndDate, setRentEndDate] = useState<string>(`${currentMonthStr}-15`);
  const [gridFilterType, setGridFilterType] = useState<
    "all" | "income" | "expense"
  >("all");
  const [gridFilterAccount, setGridFilterAccount] = useState<"all" | string>(
    "all",
  );

  const [pnlExpandedIncomes, setPnlExpandedIncomes] = useState(false);
  const [pnlExpandedVariable, setPnlExpandedVariable] = useState(false);
  const [pnlExpandedFixed, setPnlExpandedFixed] = useState(false);

  const handleAddCat = () => {
    if (!newCatName) return;
    addFinanceCategory({
      name: newCatName,
      type: newCatType,
      expenseType: newCatType === "expense" ? newCatExpenseType : undefined,
    });
    setNewCatName("");
  };

  // Accounts Form State
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<
    "cash" | "bank" | "acquiring" | "other"
  >("cash");
  const [newAccBalance, setNewAccBalance] = useState<number>(0);

  const [newCpName, setNewCpName] = useState("");
  const [newCpType, setNewCpType] = useState<"school_rent" | "hall_rent" | "coach" | "other">("school_rent");
  const [newCpDesc, setNewCpDesc] = useState("");
  const [newCpPaymentType, setNewCpPaymentType] = useState<"fixed" | "per_session">("per_session");
  const [newCpRate, setNewCpRate] = useState<number>(0);

  // Counterparties search, filter, edit & delete states
  const [cpSearch, setCpSearch] = useState("");
  const [cpFilterType, setCpFilterType] = useState<"all" | "school_rent" | "hall_rent" | "coach" | "other">("all");
  const [editingCp, setEditingCp] = useState<Counterparty | null>(null);
  const [editCpName, setEditCpName] = useState("");
  const [editCpType, setEditCpType] = useState<"school_rent" | "hall_rent" | "coach" | "other">("school_rent");
  const [editCpPaymentType, setEditCpPaymentType] = useState<"fixed" | "per_session">("per_session");
  const [editCpRate, setEditCpRate] = useState<number>(0);
  const [editCpDesc, setEditCpDesc] = useState("");
  const [deletingCp, setDeletingCp] = useState<Counterparty | null>(null);

  const handleStartEditCp = (cp: Counterparty) => {
    setEditingCp(cp);
    setEditCpName(cp.name);
    setEditCpType(cp.type || "school_rent");
    setEditCpPaymentType(cp.paymentType || "per_session");
    setEditCpRate(cp.rate || 0);
    setEditCpDesc(cp.description || "");
  };

  const handleSaveEditCp = async () => {
    if (!editingCp || !editCpName.trim()) return;
    await updateCounterparty(editingCp.id, {
      name: editCpName.trim(),
      type: editCpType,
      paymentType: editCpPaymentType,
      rate: Number(editCpRate) || 0,
      description: editCpDesc.trim(),
    });
    setEditingCp(null);
  };

  const handleConfirmDeleteCp = async () => {
    if (!deletingCp) return;
    await deleteCounterparty(deletingCp.id);
    setDeletingCp(null);
  };

  const filteredCounterparties = useMemo(() => {
    return counterparties.filter((cp) => {
      const matchesFilter = cpFilterType === "all" || cp.type === cpFilterType;
      const query = cpSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        cp.name.toLowerCase().includes(query) ||
        (cp.description && cp.description.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [counterparties, cpFilterType, cpSearch]);

  const handleAddCounterparty = () => {
    if (!newCpName.trim()) return;
    addCounterparty({
      name: newCpName.trim(),
      type: newCpType,
      description: newCpDesc.trim(),
      paymentType: newCpPaymentType,
      rate: newCpRate,
    });
    setNewCpName("");
    setNewCpDesc("");
    setNewCpPaymentType("per_session");
    setNewCpRate(0);
  };

  const handleAddAccount = () => {
    if (!newAccName.trim()) return;
    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      balance: newAccBalance || 0,
    });
    setNewAccName("");
    setNewAccBalance(0);
  };

  const handleEditAccountSubmit = async () => {
    if (!editingAccount || !editAccName.trim()) return;

    const accTransactions = finances.filter(
      (f) => f.accountId === editingAccount,
    );
    const accIncomes = accTransactions
      .filter((f) => f.type === "income")
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const accExpenses = accTransactions
      .filter((f) => f.type === "expense" && f.paymentStatus !== "accrued")
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const incomesMinusExpenses = accIncomes - accExpenses;

    const newBaseBalance = editAccBalance - incomesMinusExpenses;

    await updateAccount(editingAccount, {
      name: editAccName.trim(),
      balance: newBaseBalance,
    });

    setEditingAccount(null);
  };

  const handleTransferSubmit = async () => {
    if (
      !transferFromAcc ||
      !transferToAcc ||
      !transferAmount ||
      isNaN(Number(transferAmount)) ||
      Number(transferAmount) <= 0
    )
      return;

    const amount = Number(transferAmount);

    await addFinanceRecord({
      type: "expense",
      amount: amount,
      category: "Перевод между счетами",
      date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
      description: "Исходящий перевод средств",
      targetMonth: currentMonthStr,
      accountId: transferFromAcc,
      isFixed: false,
    });

    await addFinanceRecord({
      type: "income",
      amount: amount,
      category: "Перевод между счетами",
      date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
      description: "Входящий перевод средств",
      targetMonth: currentMonthStr,
      accountId: transferToAcc,
      isFixed: false,
    });

    setTransferFromAcc(null);
  };

  // Plan State
  const activePlan = financialPlans.find(
    (p) => p.month === currentMonthStr,
  ) || {
    month: gridFilterMonth,
    renew12Count: 0,
    renew8Count: 0,
    renew4Count: 0,
    new12Count: 0,
    new8Count: 0,
    new4Count: 0,
    price12: crmConfig.price12,
    price8: crmConfig.price8,
    price4: crmConfig.price4,
    categoryTargets: {},
  };
  const [plan, setPlan] = useState<typeof activePlan>(activePlan);

  React.useEffect(() => {
    const current = financialPlans.find((p) => p.month === gridFilterMonth);
    if (current) {
      setPlan({ ...current, categoryTargets: current.categoryTargets || {} });
    } else {
      setPlan({
        month: currentMonthStr,
        renew12Count: 0,
        renew8Count: 0,
        renew4Count: 0,
        new12Count: 0,
        new8Count: 0,
        new4Count: 0,
        price12: crmConfig.price12,
        price8: crmConfig.price8,
        price4: crmConfig.price4,
        categoryTargets: {},
      });
    }
  }, [financialPlans, gridFilterMonth]);

  const savePlan = () => {
    updateFinancialPlan(plan);
    const btn = document.getElementById("savePlanBtn");
    if (btn) {
      btn.innerText = "План сохранен";
      setTimeout(() => {
        btn.innerText = "Зафиксировать KPI план";
      }, 2000);
    }
  };

  const planRevenue =
    (plan.renew12Count + plan.new12Count) * plan.price12 +
    (plan.renew8Count + plan.new8Count) * plan.price8 +
    (plan.renew4Count + plan.new4Count) * plan.price4;

  const planCount =
    plan.renew12Count +
    plan.renew8Count +
    plan.renew4Count +
    plan.new12Count +
    plan.new8Count +
    plan.new4Count;
  const avgCheck = planCount > 0 ? planRevenue / planCount : 0;

  // Computed accounts with real liquid balance (incomes - non-accrued expenses)
  const calculatedAccounts = useMemo(() => {
    return accounts.map((acc) => {
      const accTransactions = finances.filter((f) => f.accountId === acc.id);
      const accIncomes = accTransactions
        .filter((f) => f.type === "income")
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);
      const accExpenses = accTransactions
        .filter((f) => f.type === "expense" && f.paymentStatus !== "accrued")
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);
      const actualBalance = (acc.balance || 0) + accIncomes - accExpenses;
      return { ...acc, actualBalance };
    });
  }, [accounts, finances]);

  // New Dashboard calculations
  const dashboardData = useMemo(() => {
    const totalBalance = calculatedAccounts.reduce(
      (sum, acc) => sum + acc.actualBalance,
      0,
    );
    const balancesPieData = calculatedAccounts
      .filter((a) => a.actualBalance > 0)
      .map((acc, index) => ({
        name: acc.name,
        value: acc.actualBalance,
        color: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
          "#ec4899",
          "#6366f1",
        ][index % 6],
      }));

    // Top Stats metrics
    const periodData = finances.filter(
      (f) => f.date >= dashStartDate && f.date <= dashEndDate,
    );
    const mIncomes = periodData
      .filter((f) => f.type === "income")
      .reduce((acc, f) => acc + Number(f.amount || 0), 0);
    const mExpenses = periodData
      .filter((f) => f.type === "expense" && f.paymentStatus !== "accrued")
      .reduce((acc, f) => acc + Number(f.amount || 0), 0);
    const mProfit = mIncomes - mExpenses;

    // Group monthly for LineChart
    const monthsMap = new Map<
      string,
      { name: string; Доходы: number; Расходы: number }
    >();
    finances.forEach((f) => {
      const tm = f.targetMonth || f.date.substring(0, 7);
      if (!monthsMap.has(tm))
        monthsMap.set(tm, { name: tm, Доходы: 0, Расходы: 0 });
      const stat = monthsMap.get(tm)!;
      if (f.type === "income") stat.Доходы += Number(f.amount || 0);
      else if (f.type === "expense" && f.paymentStatus !== "accrued") stat.Расходы += Number(f.amount || 0);
    });

    // Sort ascending by month string
    const dynamicChartData = Array.from(monthsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-6); // Last 6 months
    // Map nice month names
    const monthNames = [
      "Янв",
      "Фев",
      "Мар",
      "Апр",
      "Май",
      "Июн",
      "Июл",
      "Авг",
      "Сен",
      "Окт",
      "Ноя",
      "Дек",
    ];
    dynamicChartData.forEach((d) => {
      const [year, m] = d.name.split("-");
      d.name = `${monthNames[Number(m) - 1]} ${year}`;
    });

    // Pie chart for expenses
    const pieMap = new Map<string, number>();
    periodData
      .filter((f) => f.type === "expense" && f.paymentStatus !== "accrued")
      .forEach((f) => {
        pieMap.set(
          f.category,
          (pieMap.get(f.category) || 0) + Number(f.amount || 0),
        );
      });
    let pieData = Array.from(pieMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const COLORS = [
      "#ef4444",
      "#f97316",
      "#8b5cf6",
      "#3b82f6",
      "#10b981",
      "#e5e7eb",
    ];
    pieData = pieData.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
    }));

    return {
      mIncomes,
      mExpenses,
      mProfit,
      dynamicChartData,
      pieData,
      totalBalance,
      balancesPieData,
      calculatedAccounts,
    };
  }, [finances, dashStartDate, dashEndDate, accounts]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800  relative">
      {notification && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50">
          <CheckSquare className="w-5 h-5 text-emerald-400" />
          <span className="font-medium text-sm">{notification}</span>
        </div>
      )}
      <div className="p-4 md:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center"><h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
              Управленческий учет и финансы
            </h1><HeaderDescription text={<>Ввод операций, P&L, финансовое планирование абонементов.</>} /></div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl flex-wrap">
            {currentRole === "manager" ? (
              <>
                <button
                  onClick={() => setActiveTab("expiring")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "expiring"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Заканчивается абонемент (2-3 зан.)
                </button>
                <button
                  onClick={() => setActiveTab("debts")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "debts"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Неоплаченные
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "dashboard"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Дашборд
                </button>
                <button
                  onClick={() => setActiveTab("expiring")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "expiring"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Заканчивается абонемент (2-3 зан.)
                </button>
                <button
                  onClick={() => setActiveTab("input")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "input"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ОперВвод
                </button>
                <button
                  onClick={() => setActiveTab("cashflow")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "cashflow"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ОДДС
                </button>
                <button
                  onClick={() => setActiveTab("pnl")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "pnl"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ОПУ
                </button>
                <button
                  onClick={() => setActiveTab("plan")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "plan"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ФинПлан
                </button>
                <button
                  onClick={() => setActiveTab("directories")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "directories"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Справочники
                </button>
                <button
                  onClick={() => setActiveTab("accounts")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "accounts"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Счета
                </button>
                <button
                  onClick={() => setActiveTab("salaries")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "salaries"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Зарплаты
                </button>
                <button
                  onClick={() => setActiveTab("rent")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "rent"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Аренда
                </button>
                <button
                  onClick={() => setActiveTab("counterparties")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "counterparties"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Контрагенты
                </button>
                <button
                  onClick={() => setActiveTab("debts")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "debts"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Долги
                </button>
                <button
                  onClick={() => setActiveTab("client_income")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === "client_income"
                      ? "bg-white shadow-sm text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Доходы от клиентов
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {activeTab === "expiring" && (() => {
          const allExpiringClients = clients.filter(
            (c) =>
              c.status === "active" &&
              c.abonement &&
              c.abonement !== "none" &&
              ((typeof c.abonementSessionsLeft === "number" && c.abonementSessionsLeft <= 3) ||
                c.abonementStatus === "Ожидает оплаты" ||
                c.abonementStatus === "unpaid")
          );

          const count3 = allExpiringClients.filter((c) => c.abonementSessionsLeft === 3).length;
          const count2 = allExpiringClients.filter((c) => c.abonementSessionsLeft === 2).length;
          const count1 = allExpiringClients.filter((c) => c.abonementSessionsLeft === 1).length;
          const countUnpaid = allExpiringClients.filter(
            (c) =>
              c.abonementSessionsLeft === 0 ||
              c.abonementStatus === "Ожидает оплаты" ||
              c.abonementStatus === "unpaid"
          ).length;

          const filteredList = allExpiringClients.filter((c) => {
            // Sub-filter by session count
            if (expiringSessionsFilter === 3 && c.abonementSessionsLeft !== 3) return false;
            if (expiringSessionsFilter === 2 && c.abonementSessionsLeft !== 2) return false;
            if (expiringSessionsFilter === 1 && c.abonementSessionsLeft !== 1) return false;
            if (expiringSessionsFilter === "unpaid") {
              const isUnpaid =
                c.abonementSessionsLeft === 0 ||
                c.abonementStatus === "Ожидает оплаты" ||
                c.abonementStatus === "unpaid";
              if (!isUnpaid) return false;
            }

            // Search query filter
            if (expiringSearchQuery.trim()) {
              const q = expiringSearchQuery.toLowerCase();
              const nameMatch = `${c.childSurname} ${c.childName}`.toLowerCase().includes(q);
              const parentMatch = `${c.parentName}`.toLowerCase().includes(q);
              const phoneMatch = `${c.parentPhone}`.includes(q);
              const groupMatch = `${c.groupName}`.toLowerCase().includes(q);
              if (!nameMatch && !parentMatch && !phoneMatch && !groupMatch) return false;
            }

            return true;
          });

          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <Clock className="w-6 h-6 text-amber-600" />
                      Заканчивается абонемент (2-3 зан.)
                    </h2>
                    <span className="bg-amber-100 text-amber-800 font-extrabold text-xs px-2.5 py-1 rounded-full border border-amber-200">
                      {allExpiringClients.length} чел.
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Список активных учеников, у которых осталось 3, 2 или 1 занятие (2-3 зан.), либо требуется продление абонемента.
                  </p>
                </div>
              </div>

              {/* Metric Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Total */}
                <div
                  onClick={() => setExpiringSessionsFilter("all")}
                  className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                    expiringSessionsFilter === "all"
                      ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/30"
                      : "border-amber-100 hover:border-amber-200"
                  }`}
                >
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                    Всего на продление
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {allExpiringClients.length} <span className="text-xs font-normal text-gray-500">чел.</span>
                  </div>
                  <div className="text-[11px] text-amber-600 font-semibold mt-1">
                    1, 2 и 3 занятия
                  </div>
                </div>

                {/* 3 sessions left */}
                <div
                  onClick={() => setExpiringSessionsFilter(3)}
                  className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                    expiringSessionsFilter === 3
                      ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                      : "border-blue-100 hover:border-blue-200"
                  }`}
                >
                  <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                    Осталось 3 занятия
                  </div>
                  <div className="text-2xl font-black text-blue-700">
                    {count3} <span className="text-xs font-normal text-gray-500">чел.</span>
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold mt-1">
                    Плановое напоминание
                  </div>
                </div>

                {/* 2 sessions left */}
                <div
                  onClick={() => setExpiringSessionsFilter(2)}
                  className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                    expiringSessionsFilter === 2
                      ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30"
                      : "border-amber-100 hover:border-amber-200"
                  }`}
                >
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                    Осталось 2 занятия
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    {count2} <span className="text-xs font-normal text-gray-500">чел.</span>
                  </div>
                  <div className="text-[11px] text-amber-600 font-semibold mt-1">
                    Подготовка счета
                  </div>
                </div>

                {/* 1 session left */}
                <div
                  onClick={() => setExpiringSessionsFilter(1)}
                  className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                    expiringSessionsFilter === 1
                      ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30"
                      : "border-rose-100 hover:border-rose-200"
                  }`}
                >
                  <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Осталось 1 занятие</span>
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-black text-[9px]">Срочно!</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600">
                    {count1} <span className="text-xs font-normal text-gray-500">чел.</span>
                  </div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-1">
                    Критический остаток
                  </div>
                </div>

                {/* 0 / Unpaid */}
                <div
                  onClick={() => setExpiringSessionsFilter("unpaid")}
                  className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                    expiringSessionsFilter === "unpaid"
                      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30"
                      : "border-red-100 hover:border-red-200"
                  }`}
                >
                  <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">
                    0 зан. / Ожидают оплаты
                  </div>
                  <div className="text-2xl font-black text-red-600">
                    {countUnpaid} <span className="text-xs font-normal text-gray-500">чел.</span>
                  </div>
                  <div className="text-[11px] text-red-600 font-semibold mt-1">
                    Требуется новый счет
                  </div>
                </div>
              </div>

              {/* Table Card with Filter Chips and Search */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                  {/* Category Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setExpiringSessionsFilter("all")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        expiringSessionsFilter === "all"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Все ({allExpiringClients.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiringSessionsFilter(3)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        expiringSessionsFilter === 3
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
                      }`}
                    >
                      3 занятия ({count3})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiringSessionsFilter(2)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        expiringSessionsFilter === 2
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
                      }`}
                    >
                      2 занятия ({count2})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiringSessionsFilter(1)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        expiringSessionsFilter === 1
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
                      }`}
                    >
                      1 занятие ({count1})
                    </button>
                    {countUnpaid > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpiringSessionsFilter("unpaid")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                          expiringSessionsFilter === "unpaid"
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60"
                        }`}
                      >
                        Ожидают счет ({countUnpaid})
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Поиск по ученику, родителю, тел..."
                      value={expiringSearchQuery}
                      onChange={(e) => setExpiringSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {expiringSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setExpiringSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-gray-400 font-semibold uppercase tracking-wider border-b text-[10px]">
                        <th className="p-3">Ученик (Ребенок)</th>
                        <th className="p-3">Родитель & Связь</th>
                        <th className="p-3">Группа</th>
                        <th className="p-3">Абонемент</th>
                        <th className="p-3">Остаток занятий</th>
                        <th className="p-3">Статус оплаты</th>
                        <th className="p-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-400">
                            {expiringSearchQuery
                              ? "По вашему поисковому запросу ничего не найдено"
                              : "Нет учеников в выбранной категории"}
                          </td>
                        </tr>
                      ) : (
                        filteredList.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">
                                {c.childSurname} {c.childName}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {c.childAge ? `${c.childAge} лет` : ""} {c.childBirthYear ? `(${c.childBirthYear} г.р.)` : ""}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">
                                {c.parentName}
                              </div>
                              <div className="text-[10px] text-indigo-600 font-mono">
                                {c.parentPhone}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">
                                {c.groupName || "Без группы"}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {c.abonement === "1_session"
                                ? "Разовое (1 зан)"
                                : c.abonement === "4_sessions"
                                  ? "Абонемент 4 зан"
                                  : c.abonement === "8_sessions"
                                    ? "Абонемент 8 зан"
                                    : c.abonement === "12_sessions"
                                      ? "Абонемент 12 зан"
                                      : c.abonement || "Стандартный"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded-lg font-black text-xs border inline-flex items-center gap-1 ${
                                  c.abonementSessionsLeft === 3
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : c.abonementSessionsLeft === 2
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : c.abonementSessionsLeft === 1
                                        ? "bg-rose-50 text-rose-800 border-rose-200 font-black"
                                        : "bg-red-50 text-red-800 border-red-200"
                                }`}
                              >
                                {c.abonementSessionsLeft === 1 ? (
                                  <>1 из {c.abonementTotalSessions || 8} зан. (Срочно)</>
                                ) : c.abonementSessionsLeft === 2 ? (
                                  <>2 из {c.abonementTotalSessions || 8} зан.</>
                                ) : c.abonementSessionsLeft === 3 ? (
                                  <>3 из {c.abonementTotalSessions || 8} зан.</>
                                ) : (
                                  <>0 зан. (Истек)</>
                                )}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.abonementStatus === "Оплачено"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {c.abonementStatus || "Ожидает оплаты"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() =>
                                  showNotification(
                                    `Ссылка на оплату и напоминание отправлены родителю ${c.parentName} (${c.parentPhone})!`
                                  )
                                }
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-xs"
                              >
                                Отправить счет
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-sm font-bold text-slate-800">
                Финансовые показатели за период:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dashStartDate}
                  onChange={(e) => setDashStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-slate-400 font-medium">—</span>
                <input
                  type="date"
                  value={dashEndDate}
                  onChange={(e) => setDashEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium text-sm">
                      Выручка
                    </span>
                    <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {totalIncomes.toLocaleString()} ₽
                  </div>
                </div>
                <div className="text-emerald-500 text-xs font-bold mt-3">
                  +0%{" "}
                  <span className="text-gray-400 font-normal">к прошлому</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium text-sm">
                      Поступления
                    </span>
                    <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {dashboardData.mIncomes.toLocaleString()} ₽
                  </div>
                </div>
                <div className="text-emerald-500 text-xs font-bold mt-3">
                  +0%{" "}
                  <span className="text-gray-400 font-normal">к прошлому</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium text-sm">
                      Расходы
                    </span>
                    <div className="w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {dashboardData.mExpenses.toLocaleString()} ₽
                  </div>
                </div>
                <div className="text-emerald-500 text-xs font-bold mt-3">
                  -0%{" "}
                  <span className="text-gray-400 font-normal">к прошлому</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium text-sm">
                      Прибыль
                    </span>
                    <div className="w-6 h-6 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {dashboardData.mProfit.toLocaleString()} ₽
                  </div>
                </div>
                <div className="text-emerald-500 text-xs font-bold mt-3">
                  +0%{" "}
                  <span className="text-gray-400 font-normal">к прошлому</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium text-sm truncate pr-2">
                      Долги/задолженность
                    </span>
                    <div className="w-6 h-6 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertOctagon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {totalDebts.toLocaleString()} ₽
                  </div>
                </div>
                <div className="text-emerald-500 text-xs font-bold mt-3">
                  -0%{" "}
                  <span className="text-gray-400 font-normal">к прошлому</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Line Chart */}
              <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Динамика доходов и расходов
                  </h3>
                  <select className="text-xs border-none outline-none bg-transparent text-gray-500 font-medium cursor-pointer">
                    <option>По месяцам</option>
                  </select>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dashboardData.dynamicChartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickFormatter={(val) =>
                          val === 0 ? "0 ₽" : `${val / 1000}k ₽`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow:
                            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number) => [
                          `${value.toLocaleString()} ₽`,
                        ]}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      />
                      <Line
                        type="monotone"
                        name="Доходы"
                        dataKey="Доходы"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "#10b981",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        name="Расходы"
                        dataKey="Расходы"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "#ef4444",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Account Balances */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Остатки на счетах
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  {dashboardData.calculatedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                          {acc.type === "cash" ? (
                            <Wallet className="w-4 h-4" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {acc.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {acc.actualBalance.toLocaleString()} ₽
                      </span>
                    </div>
                  ))}
                  {dashboardData.calculatedAccounts.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-4">
                      Счета не добавлены
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-slate-900">
                    Всего
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900">
                    {dashboardData.totalBalance.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Operations */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Последние операции
                  </h3>
                  <button
                    className="text-xs text-blue-600 font-medium"
                    onClick={() => setActiveTab("cashflow")}
                  >
                    Все
                  </button>
                </div>
                <div className="space-y-2 flex-1">
                  {finances
                    .slice(-5)
                    .reverse()
                    .map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition px-2 rounded-lg -mx-2 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${f.type === "income" ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}
                          >
                            {f.type === "income" ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">
                              {f.category}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate max-w-[120px]">
                              {f.description ||
                                (f.type === "income"
                                  ? "Поступление"
                                  : "Расход")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-black font-mono ${f.type === "income" ? "text-emerald-500" : "text-red-500"}`}
                          >
                            {f.type === "income" ? "+" : "-"}
                            {f.amount.toLocaleString()} ₽
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {f.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  {finances.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-4">
                      Операций пока нет
                    </div>
                  )}
                </div>
              </div>

              {/* Pie Chart (Структура расходов) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Структура расходов{" "}
                    <span className="text-gray-400 font-normal">
                      ({currentMonthStr})
                    </span>
                  </h3>
                </div>
                {dashboardData.pieData.length > 0 ? (
                  <div className="flex flex-col items-center justify-start flex-1 w-full gap-4">
                    <div className="w-40 h-40 relative mx-auto shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart
                          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        >
                          <Pie
                            data={dashboardData.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="90%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {dashboardData.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow:
                                "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number) => [
                              `${value.toLocaleString()} ₽`,
                            ]}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-base font-black text-slate-900 mb-0.5">
                          {dashboardData.mExpenses.toLocaleString()} ₽
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                          Всего
                        </span>
                      </div>
                    </div>
                    <div className="w-full flex-1 min-w-0 px-2 mt-2 space-y-2 overflow-y-auto custom-scrollbar">
                      <ul className="space-y-3">
                        {dashboardData.pieData.map((item, id) => (
                          <li
                            key={id}
                            className="flex justify-between items-center text-xs"
                          >
                            <div className="flex items-center min-w-0 pr-2 overflow-hidden">
                              <span
                                className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm shrink-0"
                                style={{ backgroundColor: item.color }}
                              ></span>
                              <span className="text-slate-600 font-medium truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-slate-800 font-bold text-xs shrink-0 whitespace-nowrap">
                              {item.value.toLocaleString()} ₽{" "}
                              <span className="text-[9px] text-gray-400 font-medium ml-0.5">
                                (
                                {Math.round(
                                  (item.value / dashboardData.mExpenses) * 100,
                                )}
                                %)
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400 flex-1">
                    Нет расходов за месяц
                  </div>
                )}
              </div>

              {/* Accounts Receivable */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Дебиторская задолженность
                  </h3>
                  <button
                    className="text-xs text-blue-600 font-medium"
                    onClick={() => {}}
                  >
                    Все
                  </button>
                </div>
                <div className="space-y-2">
                  {unpaidClients.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition px-2 rounded-lg -mx-2 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt="avatar"
                            className="w-8 h-8 rounded-full border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                            {c.childSurname.charAt(0)}
                            {c.childName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-800">
                            {c.childSurname} {c.childName}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {c.groupName || "Без группы"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-4">
                        <div className="text-sm font-black font-mono text-red-500 w-16 text-right">
                          4 500 ₽
                        </div>
                        <div className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded uppercase tracking-widest hidden sm:block">
                          Просрочено
                        </div>
                      </div>
                    </div>
                  ))}
                  {unpaidClients.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-4">
                      Должников нет
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "input" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto">
            <h2 className="text-lg font-bold mb-6 text-slate-800 border-b pb-4">
              Ручной ввод операций (касса)
            </h2>
            <div className="space-y-4">
              <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-64">
                <button
                  onClick={() => { setFType("income"); setFCat(""); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${fType === "income" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500"}`}
                >
                  + Доход
                </button>
                <button
                  onClick={() => { setFType("expense"); setFCat(""); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${fType === "expense" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500"}`}
                >
                  - Расход
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Дата операции
                </label>
                <input
                  type="date"
                  value={fDate}
                  onChange={(e) => setFDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Сумма (₽)
                  </label>
                  <input
                    type="number"
                    value={fAmount}
                    onChange={(e) => setFAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl font-mono text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Месяц учета (P&L)
                  </label>
                  <input
                    type="month"
                    value={fTargetMonth}
                    onChange={(e) => setFTargetMonth(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Счет списания/зачисления
                  </label>
                  <select
                    value={fAccount}
                    onChange={(e) => setFAccount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 outline-none rounded-xl text-sm font-semibold text-slate-800"
                  >
                    {calculatedAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Баланс: {a.actualBalance.toLocaleString("ru-RU")} ₽)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Тип расхода
                  </label>
                  <select
                    disabled={fType === "income"}
                    value={fIsFixed ? "fixed" : "variable"}
                    onChange={(e) => setFIsFixed(e.target.value === "fixed")}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 outline-none rounded-xl text-sm font-semibold text-slate-800 disabled:opacity-50"
                  >
                    <option value="variable">Переменный расход</option>
                    <option value="fixed">Постоянный расход</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Статья БДДС
                </label>
                <select
                  value={fCat}
                  onChange={(e) => setFCat(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 outline-none rounded-xl text-sm font-semibold text-slate-800"
                >
                  <option value="" disabled>
                    --- Выберите статью ---
                  </option>
                  {financeCategories
                    .filter((c) => c.type === fType)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              {fType === "expense" && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Контрагент (кому платим)
                  </label>
                  <select
                    value={fCounterparty}
                    onChange={(e) => setFCounterparty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 outline-none rounded-xl text-sm font-medium text-slate-800"
                  >
                    <option value="">Без контрагента</option>
                    {counterparties.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name} ({cp.type === 'school_rent' ? 'Аренда школы' : cp.type === 'hall_rent' ? 'Аренда зала' : cp.type === 'coach' ? 'Тренер' : 'Другое'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Основание / Примечание
                </label>
                <input
                  type="text"
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 outline-none rounded-xl text-sm"
                  placeholder="За что произведена оплата?"
                />
              </div>
              <button
                onClick={handleAddFinance}
                className="w-full py-3 bg-slate-900 text-white font-bold tracking-wide rounded-xl mt-4 hover:bg-slate-800 transition"
              >
                Провести финансовую операцию
              </button>
              {addSuccessMsg && (
                <p className="text-center text-sm font-bold text-emerald-600 mt-2">
                  {addSuccessMsg}
                </p>
              )}
              {addErrorMsg && (
                <p className="text-center text-sm font-bold text-red-600 mt-2">
                  {addErrorMsg}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "cashflow" &&
          (() => {
            const periodFinances = finances.filter(
              (f) => f.date >= dashStartDate && f.date <= dashEndDate && f.paymentStatus !== "accrued",
            );
            periodFinances.sort((a, b) => b.date.localeCompare(a.date));

            const incomes = periodFinances
              .filter((f) => f.type === "income")
              .reduce((acc, f) => acc + Number(f.amount || 0), 0);
            const expenses = periodFinances
              .filter((f) => f.type === "expense")
              .reduce((acc, f) => acc + Number(f.amount || 0), 0);
            const netFlow = incomes - expenses;

            const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
            const todayFinances = finances.filter((f) => f.date === today && f.paymentStatus !== "accrued");
            const todayIncomesList = todayFinances.filter(
              (f) => f.type === "income",
            );
            const todayExpensesList = todayFinances.filter(
              (f) => f.type === "expense",
            );

            const todayIncomes = todayIncomesList.reduce(
              (sum, f) => sum + Number(f.amount || 0),
              0,
            );
            const todayExpenses = todayExpensesList.reduce(
              (sum, f) => sum + Number(f.amount || 0),
              0,
            );

            const groupByCategory = (list: any[]) => {
              const map = new Map();
              list.forEach((f) => {
                map.set(
                  f.category,
                  (map.get(f.category) || 0) + Number(f.amount || 0),
                );
              });
              return Array.from(map.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
            };

            const topTodayIncomes = groupByCategory(todayIncomesList).slice(
              0,
              4,
            );
            const topTodayExpenses = groupByCategory(todayExpensesList).slice(
              0,
              4,
            );

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-slate-900">
                    1. ДДС (Движение денежных средств)
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                      <input
                        type="date"
                        value={dashStartDate}
                        onChange={(e) => setDashStartDate(e.target.value)}
                        className="outline-none bg-transparent"
                      />
                      <span className="text-slate-400">—</span>
                      <input
                        type="date"
                        value={dashEndDate}
                        onChange={(e) => setDashEndDate(e.target.value)}
                        className="outline-none bg-transparent"
                      />
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <button
                      onClick={() => showNotification("Фильтры в разработке")}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition"
                    >
                      <Filter className="w-4 h-4" /> Фильтры
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Остатки на счетах */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Остатки на счетах
                    </div>
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs font-bold text-slate-500 mb-1">
                        Всего
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {dashboardData.totalBalance.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dashboardData.calculatedAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-[10px] font-bold text-slate-500">
                            {acc.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-900">
                            {acc.actualBalance.toLocaleString("ru-RU")} ₽
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Приходы */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Приходы
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 mb-1">
                        + {incomes.toLocaleString("ru-RU")} ₽
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        за период
                      </div>
                    </div>
                  </div>

                  {/* Расходы */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Расходы
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 mb-1">
                        - {expenses.toLocaleString("ru-RU")} ₽
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        за период
                      </div>
                    </div>
                  </div>

                  {/* Чистый поток */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Чистый поток
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 mb-1">
                        {netFlow > 0 ? "+" : ""}
                        {netFlow.toLocaleString("ru-RU")} ₽
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        за период
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 mb-2">
                        Приходы за сегодня
                      </div>
                      <div className="text-xl font-black text-slate-900 mb-6">
                        {todayIncomes.toLocaleString("ru-RU")} ₽
                      </div>
                      <div className="space-y-3 mb-6">
                        {topTodayIncomes.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center"
                          >
                            <span className="text-[11px] font-bold text-slate-500">
                              {item.name}
                            </span>
                            <span className="text-[11px] font-bold text-slate-900">
                              {item.value.toLocaleString("ru-RU")} ₽
                            </span>
                          </div>
                        ))}
                        {topTodayIncomes.length === 0 && (
                          <div className="text-[11px] text-slate-400">
                            Нет операций
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-blue-500 hover:underline text-left">
                      Все поступления &gt;
                    </button>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col">
                    <div className="text-xs font-bold text-slate-900 mb-4">
                      Динамика остатка денежных средств
                    </div>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={dashboardData.dynamicChartData}
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                          />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="Доходы"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#10b981" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Расходы"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#ef4444" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 mb-2">
                        Расходы за сегодня
                      </div>
                      <div className="text-xl font-black text-slate-900 mb-6">
                        {todayExpenses.toLocaleString("ru-RU")} ₽
                      </div>
                      <div className="space-y-3 mb-6">
                        {topTodayExpenses.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center"
                          >
                            <span className="text-[11px] font-bold text-slate-500">
                              {item.name}
                            </span>
                            <span className="text-[11px] font-bold text-slate-900">
                              {item.value.toLocaleString("ru-RU")} ₽
                            </span>
                          </div>
                        ))}
                        {topTodayExpenses.length === 0 && (
                          <div className="text-[11px] text-slate-400">
                            Нет операций
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-blue-500 hover:underline text-left">
                      Все расходы &gt;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">
                      Все операции
                    </h3>
                    <button
                      onClick={() => setActiveTab("input")}
                      className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition"
                    >
                      + Добавить операцию
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50">
                        <tr>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Дата
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Статья
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Категория
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Контрагент / Клиент
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100 text-right">
                            Приход
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100 text-right">
                            Расход
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Счет
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Комментарий
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100 w-10 text-center">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {periodFinances.map((f) => {
                          const accObj = accounts.find(
                            (a) => a.id === f.accountId,
                          );
                          return (
                            <tr
                              key={f.id}
                              className="hover:bg-slate-50 transition"
                            >
                              <td className="px-5 py-3 text-slate-500 font-medium">
                                {new Date(f.date).toLocaleDateString("ru-RU")}
                              </td>
                              <td className="px-5 py-3 text-slate-900 font-bold">
                                {f.category}
                              </td>
                              <td className="px-5 py-3 text-slate-500">
                                {f.isFixed ? "Постоянный" : "Переменный"}
                              </td>
                              <td className="px-5 py-3 text-slate-900 font-bold">
                                {(() => {
                                  if (f.counterpartyId) {
                                    const cp = counterparties.find(c => c.id === f.counterpartyId);
                                    if (cp) return cp.name;
                                  }
                                  if (f.description) {
                                    if (f.category === "Зарплата" || f.category === "Тренер") {
                                      const match = f.description.match(/: ([^(]+)/);
                                      if (match && match[1]) return match[1].trim();
                                    }
                                    const match = f.description.match(/\(([^)]+)\)/);
                                    if (match && match[1]) {
                                      return match[1].trim();
                                    }
                                    return f.description.split(" ")[0] || "—";
                                  }
                                  return "—";
                                })()}
                              </td>
                              <td className="px-5 py-3 text-emerald-600 font-bold text-right">
                                {f.type === "income"
                                  ? `+${Number(f.amount).toLocaleString(
                                      "ru-RU",
                                    )} ₽`
                                  : ""}
                              </td>
                              <td className="px-5 py-3 text-red-600 font-bold text-right">
                                {f.type === "expense"
                                  ? `-${Number(f.amount).toLocaleString(
                                      "ru-RU",
                                    )} ₽`
                                  : ""}
                              </td>
                              <td className="px-5 py-3 text-slate-500">
                                {f.paymentStatus === "accrued" ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md inline-block">
                                    Начислено (К оплате)
                                  </span>
                                ) : accObj ? (
                                  accObj.name
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-5 py-3 text-slate-500 max-w-[150px] truncate">
                                {f.description || "—"}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button
                                  onClick={() => deleteFinanceRecord(f.id)}
                                  className="text-slate-400 hover:text-red-500 transition"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {periodFinances.length === 0 && (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-5 py-8 text-center text-slate-400 font-medium"
                            >
                              Нет операций за выбранный период
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        {activeTab === "pnl" &&
          (() => {
            const currentMonthDate = new Date(gridFilterMonth + "-01");
            const prevMonthDate = new Date(currentMonthDate);
            prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
            const pY = prevMonthDate.getFullYear();
            const pM = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
            const prevMonthStr = `${pY}-${pM}`;

            const monthNames = [
              "январю",
              "февралю",
              "марту",
              "апрелю",
              "маю",
              "июню",
              "июлю",
              "августу",
              "сентябрю",
              "октябрю",
              "ноябрю",
              "декабрю",
            ];
            const prevMonthName = monthNames[prevMonthDate.getMonth()];

            const getMonthData = (monthStr: string) => {
              const mFinances = finances.filter(
                (f) => (f.targetMonth || f.date.substring(0, 7)) === monthStr,
              );
              const incomeTransactions = mFinances.filter(
                (f) => f.type === "income",
              );
              const variableTransactions = mFinances.filter(
                (f) => f.type === "expense" && !f.isFixed && f.paymentStatus !== "accrued",
              );
              const fixedTransactions = mFinances.filter(
                (f) => f.type === "expense" && f.isFixed && f.paymentStatus !== "accrued",
              );

              const income = incomeTransactions.reduce(
                (acc, f) => acc + Number(f.amount || 0),
                0,
              );
              const variable = variableTransactions.reduce(
                (acc, f) => acc + Number(f.amount || 0),
                0,
              );
              const fixed = fixedTransactions.reduce(
                (acc, f) => acc + Number(f.amount || 0),
                0,
              );

              const totalExp = variable + fixed;
              const gross = income - variable;
              const net = gross - fixed;
              const rent = income > 0 ? (net / income) * 100 : 0;

              return {
                income,
                variable,
                fixed,
                totalExp,
                gross,
                net,
                rent,
                incomeTransactions,
                variableTransactions,
                fixedTransactions,
              };
            };

            const currentData = getMonthData(gridFilterMonth);
            const prevData = getMonthData(prevMonthStr);

            const getDiff = (curr: number, prev: number) => {
              if (prev === 0) return { val: 0, text: "0%" };
              const diff = ((curr - prev) / prev) * 100;
              return {
                val: diff,
                text: `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`,
              };
            };

            const incomeDiff = getDiff(currentData.income, prevData.income);
            const variableDiff = getDiff(
              currentData.variable,
              prevData.variable,
            );
            const grossDiff = getDiff(currentData.gross, prevData.gross);
            const expenseDiff = getDiff(currentData.fixed, prevData.fixed); // Assuming "Расходы" means fixed here, or total? The screenshot uses "Себестоимость" and "Расходы". Let's assume Себестоимость = variable, Расходы = fixed.
            const netDiff = getDiff(currentData.net, prevData.net);
            const rentDiff = currentData.rent - prevData.rent;

            // Pie Charts Data
            const groupByCategory = (list: any[]) => {
              const map = new Map();
              list.forEach((f) => {
                map.set(
                  f.category,
                  (map.get(f.category) || 0) + Number(f.amount || 0),
                );
              });
              return Array.from(map.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
            };

            const incomesByCategory = groupByCategory(
              currentData.incomeTransactions,
            );
            const expensesByCategory = groupByCategory([
              ...currentData.variableTransactions,
              ...currentData.fixedTransactions,
            ]);

            const COLORS = [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#8b5cf6",
              "#ec4899",
              "#6b7280",
              "#ef4444",
              "#f97316",
            ];

            // Monthly history table
            const last6Months = [];
            for (let i = 0; i < 6; i++) {
              const d = new Date(currentMonthDate);
              d.setMonth(d.getMonth() - i);
              const dY = d.getFullYear();
              const dM = String(d.getMonth() + 1).padStart(2, "0");
              const mStr = `${dY}-${dM}`;
              const mName = d.toLocaleString("ru-RU", {
                month: "long",
                year: "numeric",
              });
              const mData = getMonthData(mStr);
              last6Months.push({
                mStr,
                name: mName.charAt(0).toUpperCase() + mName.slice(1),
                ...mData,
              });
            }

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-slate-900">
                    2. ОПУ (Отчет о прибылях и убытках)
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                      <input
                        type="month"
                        value={gridFilterMonth}
                        onChange={(e) => setGridFilterMonth(e.target.value)}
                        className="outline-none bg-transparent"
                      />
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <button
                      onClick={() => showNotification("Фильтры в разработке")}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition"
                    >
                      <Filter className="w-4 h-4" /> Фильтры
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Выручка */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-2">
                      Выручка
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {currentData.income.toLocaleString("ru-RU")} ₽
                    </div>
                    <div
                      className={`text-xs font-bold ${incomeDiff.val >= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {incomeDiff.text} к {prevMonthName}
                    </div>
                  </div>

                  {/* Себестоимость */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative">
                    <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                      Себестоимость{" "}
                      <div className="w-3 h-3 rounded-full border border-slate-300 text-[8px] flex items-center justify-center text-slate-400">
                        ?
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {currentData.variable.toLocaleString("ru-RU")} ₽
                    </div>
                    <div
                      className={`text-xs font-bold ${variableDiff.val <= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {variableDiff.text} к {prevMonthName}
                    </div>
                  </div>

                  {/* Валовая прибыль */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-2">
                      Валовая прибыль
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {currentData.gross.toLocaleString("ru-RU")} ₽
                    </div>
                    <div
                      className={`text-xs font-bold ${grossDiff.val >= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {grossDiff.text} к {prevMonthName}
                    </div>
                  </div>

                  {/* Расходы */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-2">
                      Расходы
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {currentData.fixed.toLocaleString("ru-RU")} ₽
                    </div>
                    <div
                      className={`text-xs font-bold ${expenseDiff.val <= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {expenseDiff.text} к {prevMonthName}
                    </div>
                  </div>

                  {/* Чистая прибыль */}
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
                    <div className="text-xs font-bold text-slate-600 mb-2">
                      Чистая прибыль
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {currentData.net.toLocaleString("ru-RU")} ₽
                    </div>
                    <div
                      className={`text-xs font-bold ${netDiff.val >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {netDiff.text} к {prevMonthName}
                    </div>
                  </div>

                  {/* Рентабельность */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative">
                    <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                      Рентабельность{" "}
                      <div className="w-3 h-3 rounded-full border border-slate-300 text-[8px] flex items-center justify-center text-slate-400">
                        ?
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {currentData.rent.toFixed(1).replace(".", ",")} %
                    </div>
                    <div
                      className={`text-xs font-bold ${rentDiff >= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {rentDiff > 0 ? "+" : ""}
                      {rentDiff.toFixed(1)} п.п. к {prevMonthName}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Структура выручки */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 w-full relative min-h-[200px]">
                      <h3 className="text-sm font-bold text-slate-900 mb-4 absolute top-0 left-0">
                        Структура выручки
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <RePieChart>
                          <Pie
                            data={incomesByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {incomesByCategory.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 mt-8 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-slate-900">
                          {currentData.income.toLocaleString("ru-RU")} ₽
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Всего
                        </span>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-3 mt-4 md:mt-8">
                      {incomesByCategory.map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            ></div>
                            <span className="text-[11px] font-bold text-slate-600">
                              {cat.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-900">
                            {cat.value.toLocaleString("ru-RU")} ₽{" "}
                            <span className="text-slate-400 ml-1">
                              (
                              {currentData.income > 0
                                ? (
                                    (cat.value / currentData.income) *
                                    100
                                  ).toFixed(0)
                                : 0}
                              %)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Структура расходов */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 w-full relative min-h-[200px]">
                      <h3 className="text-sm font-bold text-slate-900 mb-4 absolute top-0 left-0">
                        Структура расходов
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <RePieChart>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 mt-8 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-slate-900">
                          {currentData.totalExp.toLocaleString("ru-RU")} ₽
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Всего
                        </span>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-3 mt-4 md:mt-8">
                      {expensesByCategory.map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            ></div>
                            <span className="text-[11px] font-bold text-slate-600">
                              {cat.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-900">
                            {cat.value.toLocaleString("ru-RU")} ₽{" "}
                            <span className="text-slate-400 ml-1">
                              (
                              {currentData.totalExp > 0
                                ? (
                                    (cat.value / currentData.totalExp) *
                                    100
                                  ).toFixed(0)
                                : 0}
                              %)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">
                      Динамика по месяцам
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50">
                        <tr>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Месяц
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Выручка
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Себестоимость
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Расходы
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Прибыль
                          </th>
                          <th className="px-5 py-3 border-b border-slate-100">
                            Рентабельность
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {last6Months.map((m, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition"
                          >
                            <td className="px-5 py-3 text-slate-900 font-bold">
                              {m.name}
                            </td>
                            <td className="px-5 py-3 text-slate-600 font-medium">
                              {m.income.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-5 py-3 text-slate-600 font-medium">
                              {m.variable.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-5 py-3 text-slate-600 font-medium">
                              {m.fixed.toLocaleString("ru-RU")} ₽
                            </td>
                            <td
                              className={`px-5 py-3 font-bold ${m.net >= 0 ? "text-emerald-600" : "text-red-600"}`}
                            >
                              {m.net.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-5 py-3 text-slate-900 font-bold">
                              {m.rent.toFixed(1).replace(".", ",")} %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        {activeTab === "plan" && (
          <div className="space-y-6 border-none">
            {/* ДИНАМИКА И ВЫПОЛНЕНИЕ ПЛАНА (ТРАТЫ И ДОХОДЫ) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-5xl">
              <h2 className="text-xl font-bold text-slate-900 border-b border-gray-100 pb-3 mb-6">
                Выполнение финансового плана (по категориям)
                <br />
                <div className="mt-2 flex items-center gap-3">
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm w-max">
      <input
        type="month"
        value={gridFilterMonth}
        onChange={(e) => setGridFilterMonth(e.target.value)}
        className="outline-none bg-transparent"
      />
      <Calendar className="w-4 h-4 text-slate-400" />
    </div>
  </div>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Расходы блок */}
                <div>
                  <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    План по расходам
                  </h3>
                  <div className="space-y-4">
                    {financeCategories
                      .filter((c) => c.type === "expense")
                      .map((cat) => {
                        const target = plan.categoryTargets?.[cat.id] || 0;

                        const actual = finances
                          .filter(
                            (f) =>
                              f.type === "expense" &&
                              f.category === cat.name &&
                              (f.targetMonth || f.date.substring(0, 7)) ===
                                plan.month,
                          )
                          .reduce((a, b) => a + Number(b.amount || 0), 0);

                        const percent =
                          target > 0
                            ? Math.min(Math.round((actual / target) * 100), 999)
                            : actual > 0
                              ? 100
                              : 0;
                        const isOverspent = actual > target && target > 0;

                        return (
                          <div
                            key={cat.id}
                            className="bg-slate-50 p-4 rounded-xl border border-gray-100"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-slate-800 text-sm truncate">
                                {cat.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  План:
                                </span>
                                <input
                                  type="number"
                                  value={target}
                                  onChange={(e) => {
                                    setPlan({
                                      ...plan,
                                      categoryTargets: {
                                        ...(plan.categoryTargets || {}),
                                        [cat.id]: Number(e.target.value),
                                      },
                                    });
                                  }}
                                  onBlur={savePlan}
                                  className="w-20 bg-white border border-gray-200 outline-none font-bold text-right py-1 px-2 rounded-lg text-sm focus:border-red-500"
                                />
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <div>
                                  <span className="text-xs font-semibold inline-block text-slate-500">
                                    Факт: {actual.toLocaleString()} ₽
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`text-xs font-black inline-block ${isOverspent ? "text-red-600" : "text-slate-700"}`}
                                  >
                                    {percent}%
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-slate-200">
                                <div
                                  style={{
                                    width: `${Math.min(percent, 100)}%`,
                                  }}
                                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isOverspent ? "bg-red-500" : "bg-slate-600"}`}
                                ></div>
                              </div>
                              {isOverspent && (
                                <p className="text-[10px] text-red-500 font-bold mt-1">
                                  Перерасход:{" "}
                                  {(actual - target).toLocaleString()} ₽
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Доходы блок */}
                <div>
                  <h3 className="text-sm font-bold text-emerald-600 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    План по доходам
                  </h3>
                  <div className="space-y-4">
                    {financeCategories
                      .filter((c) => c.type === "income")
                      .map((cat) => {
                        const target = plan.categoryTargets?.[cat.id] || 0;

                        const actual = finances
                          .filter(
                            (f) =>
                              f.type === "income" &&
                              f.category === cat.name &&
                              (f.targetMonth || f.date.substring(0, 7)) ===
                                plan.month,
                          )
                          .reduce((a, b) => a + Number(b.amount || 0), 0);

                        const percent =
                          target > 0
                            ? Math.min(Math.round((actual / target) * 100), 999)
                            : actual > 0
                              ? 100
                              : 0;
                        const isAchieved = target > 0 && actual >= target;

                        return (
                          <div
                            key={cat.id}
                            className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-slate-800 text-sm truncate">
                                {cat.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  План:
                                </span>
                                <input
                                  type="number"
                                  value={target}
                                  onChange={(e) => {
                                    setPlan({
                                      ...plan,
                                      categoryTargets: {
                                        ...(plan.categoryTargets || {}),
                                        [cat.id]: Number(e.target.value),
                                      },
                                    });
                                  }}
                                  onBlur={savePlan}
                                  className="w-20 bg-white border border-gray-200 outline-none font-bold text-right py-1 px-2 rounded-lg text-sm focus:border-emerald-500"
                                />
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <div>
                                  <span className="text-xs font-semibold inline-block text-slate-500">
                                    Факт: {actual.toLocaleString()} ₽
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`text-xs font-black inline-block ${isAchieved ? "text-emerald-600" : "text-slate-700"}`}
                                  >
                                    {percent}%
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-slate-200">
                                <div
                                  style={{
                                    width: `${Math.min(percent, 100)}%`,
                                  }}
                                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isAchieved ? "bg-emerald-500" : "bg-emerald-400"}`}
                                ></div>
                              </div>
                              {isAchieved && (
                                <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                  Перевыполнение:{" "}
                                  {(actual - target).toLocaleString()} ₽
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-gray-100 pb-3">
                  Финмодель и план продаж
                  <br />
                  <div className="mt-2 flex items-center gap-3">
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm w-max">
      <input
        type="month"
        value={gridFilterMonth}
        onChange={(e) => setGridFilterMonth(e.target.value)}
        className="outline-none bg-transparent"
      />
      <Calendar className="w-4 h-4 text-slate-400" />
    </div>
  </div>
                </h2>

                <div>
                  <h3 className="text-[11px] font-bold text-indigo-600 mb-3 uppercase tracking-widest bg-indigo-50 inline-block px-2 py-1 rounded">
                    Продление базы (Сущ. клиенты)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <label className="text-[10px] text-gray-500 block mb-1 font-bold">
                        12 тренировок (шт)
                      </label>
                      <input
                        type="number"
                        value={plan.renew12Count}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            renew12Count: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <label className="text-[10px] text-gray-500 block mb-1 font-bold">
                        8 тренировок (шт)
                      </label>
                      <input
                        type="number"
                        value={plan.renew8Count}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            renew8Count: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                      <label className="text-[10px] text-gray-500 block mb-1 font-bold">
                        4 тренировки (шт)
                      </label>
                      <input
                        type="number"
                        value={plan.renew4Count}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            renew4Count: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-emerald-600 mb-3 uppercase tracking-widest bg-emerald-50 inline-block px-2 py-1 rounded">
                    Привлечение (Новые клиенты)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <label className="text-[10px] text-emerald-800 block mb-1 font-bold">
                        12 тренировок (шт)
                      </label>
                      <input
                        type="number"
                        value={plan.new12Count}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            new12Count: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-emerald-200 outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <label className="text-[10px] text-emerald-800 block mb-1 font-bold">
                        8 тренировок (шт)
                      </label>
                      <input
                        type="number"
                        value={plan.new8Count}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            new8Count: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-emerald-200 outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <label className="text-[10px] text-emerald-800 block mb-1 font-bold">
                        4 тренировки (шт)
                      </label>
                      <input
                        type="number"
                        value={plan.new4Count}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            new4Count: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-emerald-200 outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  id="savePlanBtn"
                  onClick={savePlan}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide rounded-xl transition shadow-lg shadow-slate-200"
                >
                  Зафиксировать базовые KPI
                </button>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-gray-100 pb-3">
                  Unit-Экономика (Прайс)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                      Прайс 12 зан.
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={plan.price12}
                        onChange={(e) =>
                          setPlan({ ...plan, price12: Number(e.target.value) })
                        }
                        className="w-full text-center font-black text-lg bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-1"
                      />
                      <span className="absolute right-2 bottom-1.5 text-gray-300 font-bold">
                        ₽
                      </span>
                    </div>
                  </div>
                  <div className="text-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                      Прайс 8 зан.
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={plan.price8}
                        onChange={(e) =>
                          setPlan({ ...plan, price8: Number(e.target.value) })
                        }
                        className="w-full text-center font-black text-lg bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-1"
                      />
                      <span className="absolute right-2 bottom-1.5 text-gray-300 font-bold">
                        ₽
                      </span>
                    </div>
                  </div>
                  <div className="text-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                      Прайс 4 зан.
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={plan.price4}
                        onChange={(e) =>
                          setPlan({ ...plan, price4: Number(e.target.value) })
                        }
                        className="w-full text-center font-black text-lg bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-1"
                      />
                      <span className="absolute right-2 bottom-1.5 text-gray-300 font-bold">
                        ₽
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-900/10">
                  <div className="mb-6">
                    <span className="block text-xs text-indigo-300 font-bold uppercase tracking-widest mb-1">
                      Прогноз выручки (Абонементы)
                    </span>
                    <span className="text-4xl font-black text-white">
                      {planRevenue.toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-indigo-800/50 pt-5">
                    <div>
                      <span className="flex items-center text-[10px] text-indigo-300 uppercase tracking-wider font-bold mb-1">
                        План продаж
                      </span>
                      <span className="text-2xl font-black">
                        {planCount}{" "}
                        <span className="text-sm font-medium text-indigo-400">
                          шт
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="flex items-center text-[10px] text-indigo-300 uppercase tracking-wider font-bold mb-1">
                        Средний чек (ARPU)
                      </span>
                      <span className="text-2xl font-black">
                        {Math.round(avgCheck).toLocaleString()}{" "}
                        <span className="text-sm font-medium text-indigo-400">
                          ₽
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "salaries" &&
          (() => {
            const getMonthName = (monthStr: string) => {
              const d = new Date(monthStr + "-01");
              const mName = d.toLocaleString("ru-RU", {
                month: "long",
                year: "numeric",
              });
              return mName.charAt(0).toUpperCase() + mName.slice(1);
            };

            const periodFinances = finances.filter(
              (f) => f.date.substring(0, 7) === gridFilterMonth,
            );

            // Coach stats
            const coachStats = coaches.map((coach) => {
              // 1. Оклад (Base salary)
              const rate = coach.rate || 0;
              const baseSalary = coach.paymentType === "fixed" ? rate : 0;

              // 2. Проведено тренировок
              const sessionsAsMain = trainingSessions.filter(
                (ts) =>
                  toYearMonthString(ts.dateString, ts.date) === gridFilterMonth &&
                  (ts.coachId === coach.id || (ts.coachName && coach.name && ts.coachName.includes(coach.name))),
              ).length;
              const sessionsAsAssistant = trainingSessions.filter(
                (ts) =>
                  toYearMonthString(ts.dateString, ts.date) === gridFilterMonth &&
                  (ts.assistantId === coach.id || (ts.assistantName && coach.name && ts.assistantName.includes(coach.name))),
              ).length;
              const totalSessions = sessionsAsMain + sessionsAsAssistant;

              // 3. Доплаты (Surcharges) - calculated from accrued finance records OR fallback to sessions * rate
              const accruedSessionRecords = periodFinances.filter(
                (f) =>
                  f.type === "expense" &&
                  f.category === "Зарплата" &&
                  f.paymentStatus === "accrued" &&
                  (f.coachId === coach.id || f.description?.includes(coach.name)),
              );
              const accruedFromRecords = accruedSessionRecords.reduce(
                (sum, f) => sum + Number(f.amount || 0),
                0,
              );

              const surcharges =
                accruedFromRecords > 0
                  ? accruedFromRecords
                  : coach.paymentType === "per_session"
                    ? totalSessions * (rate || 1500)
                    : 0;

              // 4. Премии (Bonuses)
              const bonuses = periodFinances
                .filter(
                  (f) =>
                    f.type === "expense" &&
                    f.category === "Премии" &&
                    f.description?.includes(coach.name),
                )
                .reduce((sum, f) => sum + Number(f.amount), 0);

              // 5. Начислено (Accrued)
              const accrued = baseSalary + surcharges + bonuses;

              // 6. Выплачено (Paid) - only actual payouts (paymentStatus !== 'accrued')
              const paid = periodFinances
                .filter(
                  (f) =>
                    f.type === "expense" &&
                    (f.category === "Зарплата" || f.category === "Зарплаты") &&
                    f.paymentStatus !== "accrued" &&
                    (f.coachId === coach.id || f.description?.includes(coach.name)),
                )
                .reduce((sum, f) => sum + Number(f.amount), 0);

              // 7. К выплате
              const toPay = Math.max(0, accrued - paid);

              let statusText = "Не выплачено";
              let statusColor = "text-slate-500 bg-slate-100 px-2 py-0.5 rounded";

              if (accrued === 0 && paid === 0) {
                statusText = "—";
                statusColor = "text-slate-400";
              } else if (toPay <= 0) {
                statusText = "Выплачено";
                statusColor =
                  "text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded font-bold";
              } else if (paid > 0 && toPay > 0) {
                statusText = "Частично";
                statusColor =
                  "text-orange-500 bg-orange-50 px-2 py-0.5 rounded font-bold";
              }

              return {
                coach,
                baseSalary,
                totalSessions,
                surcharges,
                bonuses,
                accrued,
                paid,
                toPay,
                statusText,
                statusColor,
              };
            });

            // If a coach has no baseSalary, no sessions, and no payments, maybe hide them or keep them? We keep them as per screenshot.
            const totalAccrued = coachStats.reduce(
              (sum, c) => sum + c.accrued,
              0,
            );
            const totalPaid = coachStats.reduce((sum, c) => sum + c.paid, 0);
            const totalToPay = totalAccrued - totalPaid;

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-slate-900">
                    Зарплаты
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                      <input
                        type="month"
                        value={gridFilterMonth}
                        onChange={(e) => setGridFilterMonth(e.target.value)}
                        className="outline-none bg-transparent"
                      />
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <button
                      onClick={() => showNotification("Фильтры в разработке")}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition"
                    >
                      <Filter className="w-4 h-4" /> Фильтры
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      Начислено всего
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">
                      {totalAccrued.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      Выплачено
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">
                      {totalPaid.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      К выплате
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">
                      {totalToPay.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">
                      Сотрудников
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">
                      {coaches.length}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="flex border-b border-slate-100 px-5 pt-4">
                    <div
                      onClick={() => setSalaryTab("staff")}
                      className={`text-sm font-bold cursor-pointer transition pb-3 px-2 mr-6 ${salaryTab === "staff" ? "text-red-600 border-b-2 border-red-600" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Сотрудники
                    </div>
                    <div
                      onClick={() => setSalaryTab("transactions")}
                      className={`text-sm font-bold cursor-pointer transition pb-3 px-2 ${salaryTab === "transactions" ? "text-red-600 border-b-2 border-red-600" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Начисления и выплаты
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {salaryTab === "staff" ? (
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="text-slate-400 text-[10px] font-bold">
                          <tr>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium">
                              Сотрудник
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium">
                              Должность
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              Оклад
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-center">
                              Проведено
                              <br />
                              тренировок
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              Доплаты
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              Премии
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              Начислено
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              Выплачено
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              К выплате
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium">
                              Статус
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              Действие
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {coachStats.map((stat, idx) => (
                            <tr
                              key={idx}
                              onClick={() => {
                                setSelectedCoachIdForDetail(stat.coach.id);
                                setCoachDetailSubTab("sessions");
                              }}
                              className="hover:bg-slate-50/80 transition group cursor-pointer"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 font-bold text-xs">
                                    {stat.coach.avatarUrl ? (
                                      <img
                                        src={stat.coach.avatarUrl}
                                        alt={stat.coach.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      stat.coach.name.charAt(0)
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 group-hover:text-red-600 transition flex items-center gap-1.5">
                                      <span>{stat.coach.name}</span>
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-normal">
                                      {stat.coach.paymentType === "fixed"
                                        ? `Оклад ${stat.coach.rate?.toLocaleString("ru-RU") || 0} ₽`
                                        : `Сдельная ${stat.coach.rate?.toLocaleString("ru-RU") || 1500} ₽/зан.`}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-600 font-medium">
                                {stat.coach.role}
                              </td>
                              <td className="px-5 py-4 text-slate-900 font-medium text-right">
                                {stat.baseSalary > 0
                                  ? `${stat.baseSalary.toLocaleString("ru-RU")} ₽`
                                  : "—"}
                              </td>
                              <td className="px-5 py-4 text-slate-900 font-medium text-center">
                                {stat.totalSessions > 0 ? (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                                    {stat.totalSessions}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-5 py-4 text-slate-900 font-medium text-right">
                                {stat.surcharges > 0
                                  ? `${stat.surcharges.toLocaleString("ru-RU")} ₽`
                                  : "—"}
                              </td>
                              <td className="px-5 py-4 text-slate-900 font-medium text-right">
                                {stat.bonuses > 0
                                  ? `${stat.bonuses.toLocaleString("ru-RU")} ₽`
                                  : "—"}
                              </td>
                              <td className="px-5 py-4 text-slate-900 font-bold text-right">
                                {stat.accrued > 0
                                  ? `${stat.accrued.toLocaleString("ru-RU")} ₽`
                                  : "—"}
                              </td>
                              <td className="px-5 py-4 text-slate-900 font-medium text-right">
                                {stat.paid > 0
                                  ? `${stat.paid.toLocaleString("ru-RU")} ₽`
                                  : "—"}
                              </td>
                              <td className="px-5 py-4 text-red-600 font-bold text-right">
                                {stat.toPay > 0
                                  ? `${stat.toPay.toLocaleString("ru-RU")} ₽`
                                  : "0 ₽"}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`text-[10px] font-bold ${stat.statusColor}`}
                                >
                                  {stat.statusText}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {stat.toPay > 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPayoutType("salary");
                                      setPayoutTargetName(stat.coach.name);
                                      setPayoutTargetId(stat.coach.id);
                                      setPayoutAmount(String(stat.toPay));
                                      setPayoutModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                                  >
                                    Выплатить
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {coachStats.length === 0 && (
                            <tr>
                              <td
                                colSpan={11}
                                className="px-5 py-8 text-center text-slate-400 font-medium"
                              >
                                Нет сотрудников
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="text-slate-400 text-[10px] font-bold">
                          <tr>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium">
                              Дата
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium">
                              Сотрудник / Описание
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium text-right">
                              Сумма
                            </th>
                            <th className="px-5 py-4 border-b border-slate-50 font-medium">
                              Счет
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {periodFinances
                            .filter(
                              (f) =>
                                f.category === "Зарплата" ||
                                f.category === "Премии" ||
                                f.category === "Зарплаты",
                            )
                            .sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime(),
                            )
                            .map((f, i) => (
                              <tr
                                key={i}
                                className="hover:bg-slate-50 transition group"
                              >
                                <td className="px-5 py-4 text-slate-600 font-medium">
                                  {new Date(f.date).toLocaleDateString("ru-RU")}
                                </td>
                                <td className="px-5 py-4">
                                  <div className="font-bold text-slate-900">
                                    {f.description || f.category}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {f.category}
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-slate-900 font-medium text-right">
                                  {Number(f.amount).toLocaleString("ru-RU")} ₽
                                </td>
                                <td className="px-5 py-4 text-slate-500 font-medium">
                                  {accounts.find((a) => a.id === f.accountId)
                                    ?.name || "Неизвестный счет"}
                                </td>
                              </tr>
                            ))}
                          {periodFinances.filter(
                            (f) =>
                              f.category === "Зарплата" ||
                              f.category === "Премии" ||
                              f.category === "Зарплаты",
                          ).length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-5 py-8 text-center text-slate-400 font-medium"
                              >
                                Нет операций в этом месяце
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <button
                      onClick={() => showNotification("Функция экспорта в разработке")}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" /> Экспорт в Excel
                    </button>
                    <button
                      onClick={() => setActiveTab("input")}
                      className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition px-4 py-2 rounded-xl shadow-sm shadow-red-600/20"
                    >
                      + Добавить начисление
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {activeTab === "rent" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                      Учет и взаиморасчеты по аренде площадок
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Автоматический учет начислений за проведенные тренировки и фактические выплаты
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setPayoutType("rent");
                      setPayoutTargetName("Аренда площадок");
                      setPayoutTargetId("");
                      setPayoutAmount("");
                      setPayoutModalOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
                  >
                    <CreditCard className="w-4 h-4" />
                    + Оплатить аренду
                  </button>
                </div>

                {/* Date Filter Toolbar */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {/* Month Selector */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Месяц:</span>
                    <input
                      type="month"
                      value={rentMonth === "all" ? currentMonthStr : rentMonth}
                      disabled={rentMonth === "all"}
                      onChange={(e) => {
                        setRentMonth(e.target.value);
                        if (rentDateMode === "period") {
                          setRentStartDate(`${e.target.value}-01`);
                          setRentEndDate(`${e.target.value}-15`);
                        }
                      }}
                      className="outline-none bg-transparent font-bold cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Mode Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRentDateMode("month")}
                      disabled={rentMonth === "all"}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        rentDateMode === "month" && rentMonth !== "all"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      }`}
                    >
                      Весь месяц
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRentDateMode("half1");
                        const activeM = rentMonth === "all" ? currentMonthStr : rentMonth;
                        setRentStartDate(`${activeM}-01`);
                        setRentEndDate(`${activeM}-15`);
                      }}
                      disabled={rentMonth === "all"}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        rentDateMode === "half1" && rentMonth !== "all"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      }`}
                    >
                      1–15 число
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRentDateMode("half2");
                        const activeM = rentMonth === "all" ? currentMonthStr : rentMonth;
                        setRentStartDate(`${activeM}-16`);
                        setRentEndDate(`${activeM}-31`);
                      }}
                      disabled={rentMonth === "all"}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        rentDateMode === "half2" && rentMonth !== "all"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      }`}
                    >
                      16–31 число
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRentDateMode("period");
                        const activeM = rentMonth === "all" ? currentMonthStr : rentMonth;
                        setRentStartDate(`${activeM}-01`);
                        setRentEndDate(`${activeM}-15`);
                      }}
                      disabled={rentMonth === "all"}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        rentDateMode === "period" && rentMonth !== "all"
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      }`}
                    >
                      Точные даты
                    </button>
                  </div>

                  {/* All Time Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (rentMonth === "all") {
                        setRentMonth(currentMonthStr);
                        setRentDateMode("month");
                      } else {
                        setRentMonth("all");
                        setRentDateMode("month");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      rentMonth === "all"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {rentMonth === "all" ? "За весь период" : "Все месяцы"}
                  </button>

                  {/* Custom Date Pickers when rentDateMode === 'period' */}
                  {rentDateMode === "period" && rentMonth !== "all" && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                      <span className="text-slate-500 font-semibold">С:</span>
                      <input
                        type="date"
                        value={rentStartDate}
                        onChange={(e) => setRentStartDate(e.target.value)}
                        className="bg-transparent font-bold outline-none cursor-pointer text-slate-900"
                      />
                      <span className="text-slate-500 font-semibold">По:</span>
                      <input
                        type="date"
                        value={rentEndDate}
                        onChange={(e) => setRentEndDate(e.target.value)}
                        className="bg-transparent font-bold outline-none cursor-pointer text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Cards & Venue Calculations */}
              {(() => {
                const isRecordInRentPeriod = (f: any) => {
                  if (f.type !== "expense" || f.category !== "Аренда") return false;
                  if (f.description?.toLowerCase().includes("абонемент")) return false;

                  if (rentMonth === "all") return true;

                  if (rentDateMode === "period") {
                    if (rentStartDate && f.date < rentStartDate) return false;
                    if (rentEndDate && f.date > rentEndDate) return false;
                    return true;
                  }

                  if (rentDateMode === "half1") {
                    const activeM = rentMonth === "all" ? currentMonthStr : rentMonth;
                    return f.date >= `${activeM}-01` && f.date <= `${activeM}-15`;
                  }

                  if (rentDateMode === "half2") {
                    const activeM = rentMonth === "all" ? currentMonthStr : rentMonth;
                    return f.date >= `${activeM}-16` && f.date <= `${activeM}-31`;
                  }

                  const recordMonth = f.targetMonth || f.date.substring(0, 7);
                  return recordMonth === rentMonth;
                };

                const rentAccruals = finances.filter(isRecordInRentPeriod);

                const rentCounterpartiesMap = new Map<
                  string,
                  { name: string; id: string; accrued: number; paid: number; paymentType: "fixed" | "per_session"; cpObj?: any }
                >();

                // Pre-populate with all known rent counterparties
                counterparties
                  .filter((c) => c.type === "school_rent" || c.type === "hall_rent")
                  .forEach((cp) => {
                    let baseAccrued = 0;
                    if (cp.paymentType === "fixed") {
                      baseAccrued = cp.rate || 0;
                      if (rentDateMode === "half1" || rentDateMode === "half2") {
                        baseAccrued = Math.round(baseAccrued / 2);
                      }
                    }
                    rentCounterpartiesMap.set(cp.id, {
                      name: cp.name,
                      id: cp.id,
                      accrued: baseAccrued,
                      paid: 0,
                      paymentType: cp.paymentType || "per_session",
                      cpObj: cp,
                    });
                  });

                // Process actual finance records
                rentAccruals.forEach((f) => {
                  let key = f.counterpartyId;
                  if (!key) {
                    const matchedCp = counterparties.find(c => (c.type === "school_rent" || c.type === "hall_rent") && (c.id === f.counterpartyId || f.description.includes(c.name)));
                    key = matchedCp ? matchedCp.id : (f.groupName ? `group_${f.groupName}` : f.description || "Аренда площадки");
                  }

                  let name = key;
                  if (key.startsWith("group_")) {
                    name = `Группа ${f.groupName}`;
                  } else {
                    const cp = counterparties.find((c) => c.id === key);
                    if (cp) name = cp.name;
                    else if (f.groupName) name = `Группа ${f.groupName}`;
                  }

                  if (!rentCounterpartiesMap.has(key)) {
                    rentCounterpartiesMap.set(key, {
                      name,
                      id: key,
                      accrued: 0,
                      paid: 0,
                      paymentType: "per_session",
                    });
                  }

                  const item = rentCounterpartiesMap.get(key)!;
                  if (f.paymentStatus === "accrued") {
                    if (!item.cpObj || item.cpObj.paymentType !== "fixed") {
                      item.accrued += Number(f.amount || 0);
                    }
                  } else {
                    item.paid += Number(f.amount || 0);
                  }
                });

                const list = Array.from(rentCounterpartiesMap.values());
                const totalAccrued = list.reduce((sum, item) => sum + item.accrued, 0);
                const totalPaid = list.reduce((sum, item) => sum + item.paid, 0);
                const currentDebt = Math.max(0, totalAccrued - totalPaid);

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                          Начислено за аренду
                        </span>
                        <div className="text-xl font-bold text-slate-800 mt-1">
                          {totalAccrued.toLocaleString("ru-RU")} ₽
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Фиксированная за месяц + за проведенные тренировки
                        </span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                          Выплачено арендодателям
                        </span>
                        <div className="text-xl font-bold text-emerald-600 mt-1">
                          {totalPaid.toLocaleString("ru-RU")} ₽
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Фактически выплаченные средства
                        </span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                          Задолженность по аренде
                        </span>
                        <div className={`text-xl font-bold mt-1 ${currentDebt > 0 ? "text-red-600" : "text-slate-800"}`}>
                          {currentDebt.toLocaleString("ru-RU")} ₽
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          К оплате площадкам
                        </span>
                      </div>
                    </div>

                    {/* Settlement per Venue Table */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 text-sm">
                        Взаиморасчеты по арендным площадкам и объектам
                      </h3>
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="px-4 py-3">Площадка / Объект</th>
                              <th className="px-4 py-3">Тип оплаты</th>
                              <th className="px-4 py-3 text-right">Начислено</th>
                              <th className="px-4 py-3 text-right">Выплачено</th>
                              <th className="px-4 py-3 text-right">Долг за аренду</th>
                              <th className="px-4 py-3 text-right">Действие</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {list.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium">
                                  Начислений по аренде пока нет
                                </td>
                              </tr>
                            ) : (
                              list.map((item) => {
                                const debt = Math.max(0, item.accrued - item.paid);
                                const isFixed = item.paymentType === "fixed";
                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                                    <td className="px-4 py-3">
                                      {isFixed ? (
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                          Фиксированная (1 раз в месяц)
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded">
                                          За тренировку группы
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                                      {item.accrued.toLocaleString("ru-RU")} ₽
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                                      {item.paid.toLocaleString("ru-RU")} ₽
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600">
                                      {debt > 0 ? `${debt.toLocaleString("ru-RU")} ₽` : "0 ₽"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {debt > 0 ? (
                                        <button
                                          onClick={() => {
                                            setPayoutType("rent");
                                            setPayoutTargetName(item.name);
                                            setPayoutTargetId(item.id);
                                            setPayoutAmount(String(debt));
                                            setPayoutModalOpen(true);
                                          }}
                                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                                        >
                                          Оплатить аренду
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 font-medium">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Journal of All Rent Finance Records */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">
                  Журнал операций и начислений по аренде
                </h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Дата</th>
                        <th className="px-4 py-3">Объект / Группа</th>
                        <th className="px-4 py-3">Описание</th>
                        <th className="px-4 py-3 text-right">Сумма</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Счет</th>
                        <th className="px-4 py-3 text-center">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const rentRecords = finances
                          .filter((f) => {
                            if (f.type !== "expense" || f.category !== "Аренда") return false;
                            if (f.description?.toLowerCase().includes("абонемент")) return false;

                            if (rentMonth === "all") return true;

                            if (rentDateMode === "period") {
                              if (rentStartDate && f.date < rentStartDate) return false;
                              if (rentEndDate && f.date > rentEndDate) return false;
                              return true;
                            }

                            if (rentDateMode === "half1") {
                              const activeM = rentMonth === "all" ? currentMonthStr : rentMonth;
                              return f.date >= `${activeM}-01` && f.date <= `${activeM}-15`;
                            }

                            if (rentDateMode === "half2") {
                              const activeM = rentMonth === "all" ? currentMonthStr : rentMonth;
                              return f.date >= `${activeM}-16` && f.date <= `${activeM}-31`;
                            }

                            const recordMonth = f.targetMonth || f.date.substring(0, 7);
                            return recordMonth === rentMonth;
                          })
                          .sort((a, b) => b.date.localeCompare(a.date));

                        if (rentRecords.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-4 py-6 text-center text-slate-400 font-medium">
                                Нет записей по аренде
                              </td>
                            </tr>
                          );
                        }

                        return rentRecords.map((f) => {
                          const accObj = accounts.find((a) => a.id === f.accountId);
                          const isAccrued = f.paymentStatus === "accrued";
                          return (
                            <tr key={f.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 text-slate-500 font-medium">
                                {new Date(f.date).toLocaleDateString("ru-RU")}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800">
                                {f.groupName ? `Группа ${f.groupName}` : f.counterpartyId ? (counterparties.find(c => c.id === f.counterpartyId)?.name || "Площадка") : "Аренда"}
                              </td>
                              <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                                {f.description || "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">
                                {Number(f.amount).toLocaleString("ru-RU")} ₽
                              </td>
                              <td className="px-4 py-3">
                                {isAccrued ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md inline-block">
                                    Начислено (К оплате)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md inline-block">
                                    Оплачено
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-medium">
                                {accObj ? accObj.name : "—"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => deleteFinanceRecord(f.id)}
                                  className="text-slate-400 hover:text-red-500 transition"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === "debts" &&
          (() => {
            const currentDate = new Date();

            // Generate client debts data
            const debtRecords = clients
              .map((client) => {
                const pendingPayments =
                  client.payments?.filter(
                    (p) => p.status === "Ожидает" || p.status === "Просрочено",
                  ) || [];
                const paidPayments =
                  client.payments?.filter((p) => p.status === "Оплачено") || [];

                if (pendingPayments.length === 0) return null;

                const totalDebt = pendingPayments.reduce(
                  (sum, p) => sum + p.amount,
                  0,
                );
                const overduePayments = pendingPayments.filter(
                  (p) => p.status === "Просрочено",
                );
                const expectedPayments = pendingPayments.filter(
                  (p) => p.status === "Ожидает",
                );

                const overdueAmount = overduePayments.reduce(
                  (sum, p) => sum + p.amount,
                  0,
                );
                const expectedAmount = expectedPayments.reduce(
                  (sum, p) => sum + p.amount,
                  0,
                );

                // Calculate overdue days from the oldest overdue payment
                let maxOverdueDays = 0;
                if (overduePayments.length > 0) {
                  const oldestOverdue = overduePayments.reduce((oldest, p) => {
                    return new Date(p.date) < new Date(oldest.date)
                      ? p
                      : oldest;
                  });
                  const msDiff =
                    currentDate.getTime() -
                    new Date(oldestOverdue.date).getTime();
                  maxOverdueDays = Math.max(
                    0,
                    Math.floor(msDiff / (1000 * 60 * 60 * 24)),
                  );
                }

                // Last payment date
                let lastPaymentDate = "—";
                if (paidPayments.length > 0) {
                  const latestPayment = paidPayments.reduce((latest, p) => {
                    return new Date(p.date) > new Date(latest.date)
                      ? p
                      : latest;
                  });
                  lastPaymentDate = new Date(
                    latestPayment.date,
                  ).toLocaleDateString("ru-RU");
                }

                return {
                  client,
                  totalDebt,
                  overdueAmount,
                  expectedAmount,
                  maxOverdueDays,
                  lastPaymentDate,
                  overduePayments,
                  expectedPayments,
                };
              })
              .filter(Boolean) as Array<any>;

            const totalDebtSum = debtRecords.reduce(
              (sum, r) => sum + r.totalDebt,
              0,
            );
            const totalOverdueSum = debtRecords.reduce(
              (sum, r) => sum + r.overdueAmount,
              0,
            );
            const totalExpectedSum = debtRecords.reduce(
              (sum, r) => sum + r.expectedAmount,
              0,
            );

            const overdueClientsCount = debtRecords.filter(
              (r) => r.overdueAmount > 0,
            ).length;
            const expectedClientsCount = debtRecords.filter(
              (r) => r.expectedAmount > 0,
            ).length;

            return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-slate-900">
                    Долги клиентов (дебиторская задолженность)
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => showNotification("Фильтры в разработке")}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition"
                    >
                      <Filter className="w-4 h-4" /> Фильтры
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-1">
                        Общая задолженность
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {totalDebtSum.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 mt-4">
                      {debtRecords.length}{" "}
                      {debtRecords.length === 1
                        ? "клиент"
                        : debtRecords.length >= 2 && debtRecords.length <= 4
                          ? "клиента"
                          : "клиентов"}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden ring-1 ring-red-500/10">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-1">
                        Просроченная задолженность
                      </div>
                      <div className="text-2xl font-black text-red-600">
                        {totalOverdueSum.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 mt-4">
                      {overdueClientsCount}{" "}
                      {overdueClientsCount === 1
                        ? "клиент"
                        : overdueClientsCount >= 2 && overdueClientsCount <= 4
                          ? "клиента"
                          : "клиентов"}
                    </div>
                    <AlertOctagon className="w-16 h-16 text-red-500/5 absolute -right-2 -bottom-2" />
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-1">
                        Ожидаем к оплате
                      </div>
                      <div className="text-2xl font-black text-slate-900">
                        {totalExpectedSum.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 mt-4">
                      {expectedClientsCount}{" "}
                      {expectedClientsCount === 1
                        ? "клиент"
                        : expectedClientsCount >= 2 && expectedClientsCount <= 4
                          ? "клиента"
                          : "клиентов"}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="text-slate-400 text-[10px] font-bold">
                        <tr>
                          <th className="px-5 py-4 border-b border-slate-50 font-medium">
                            Клиент
                          </th>
                          <th className="px-5 py-4 border-b border-slate-50 font-medium">
                            Ребенок
                          </th>
                          <th className="px-5 py-4 border-b border-slate-50 font-medium">
                            Группа
                          </th>
                          <th className="px-5 py-4 border-b border-slate-50 font-medium">
                            Долг
                          </th>
                          <th className="px-5 py-4 border-b border-slate-50 font-medium">
                            Просрочка
                          </th>
                          <th className="px-5 py-4 border-b border-slate-50 font-medium">
                            Последний платеж
                          </th>
                          <th className="px-5 py-4 border-b border-slate-50 font-medium">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {debtRecords.map((record, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition group"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 font-bold text-xs">
                                  {record.client.parentName.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-900">
                                  {record.client.parentName}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600 font-medium">
                              {record.client.childName}{" "}
                              {record.client.childSurname}
                            </td>
                            <td className="px-5 py-4 text-slate-600 font-medium">
                              {record.client.groupName || "—"}
                            </td>
                            <td className="px-5 py-4 text-slate-900 font-medium">
                              {record.totalDebt.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-5 py-4">
                              {record.maxOverdueDays > 0 ? (
                                <span className="text-red-600 font-bold">
                                  {record.maxOverdueDays}{" "}
                                  {record.maxOverdueDays % 10 === 1 &&
                                  record.maxOverdueDays % 100 !== 11
                                    ? "день"
                                    : [2, 3, 4].includes(
                                          record.maxOverdueDays % 10,
                                        ) &&
                                        ![12, 13, 14].includes(
                                          record.maxOverdueDays % 100,
                                        )
                                      ? "дня"
                                      : "дней"}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-600 font-medium">
                              {record.lastPaymentDate}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    showNotification(
                                      `Открытие чата WhatsApp: ${record.client.parentPhone}`,
                                    )
                                  }
                                  className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                  title="Написать в WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    showNotification(
                                      `Вызов номера: ${record.client.parentPhone}`,
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                  title="Позвонить"
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    showNotification(
                                      `Напоминание отправлено клиенту: ${record.client.parentName}`,
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                                  title="Напомнить"
                                >
                                  <Bell className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {debtRecords.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-5 py-8 text-center text-slate-400 font-medium"
                            >
                              Нет клиентов с задолженностями
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <button
                      onClick={() =>
                        showNotification(
                          `Напоминание отправлено ${debtRecords.length} клиентам`,
                        )
                      }
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
                    >
                      <Bell className="w-3.5 h-3.5" /> Напомнить всем
                    </button>
                    <button
                      onClick={() => showNotification("Функция экспорта в разработке")}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" /> Экспорт в Excel
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {activeTab === "accounts" &&
          (() => {
            const processedAccounts = calculatedAccounts;
            const totalBalance = processedAccounts.reduce(
              (sum, acc) => sum + acc.actualBalance,
              0,
            );

            return (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b pb-6 mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">
                      Внутренние Счета
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Мониторинг всех касс, расчетных счетов и эквайринга
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                      Общий баланс
                    </p>
                    <p className="text-4xl font-black text-emerald-600 tracking-tight">
                      {totalBalance.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {processedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between min-h-[175px] shadow-xs hover:shadow-md hover:border-slate-300 transition-all relative"
                    >
                      {/* Top bar: Icon, Name, Badge, Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              acc.type === "cash"
                                ? "bg-emerald-100 text-emerald-700"
                                : acc.type === "bank"
                                  ? "bg-blue-100 text-blue-700"
                                  : acc.type === "acquiring"
                                    ? "bg-violet-100 text-violet-700"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {acc.type === "cash" ? (
                              <Wallet className="w-4.5 h-4.5" />
                            ) : acc.type === "bank" ? (
                              <Building2 className="w-4.5 h-4.5" />
                            ) : (
                              <CreditCard className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3
                              className="font-bold text-slate-900 text-sm truncate"
                              title={acc.name}
                            >
                              {acc.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider border ${
                                  acc.type === "cash"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : acc.type === "bank"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : acc.type === "acquiring"
                                        ? "bg-violet-50 text-violet-700 border-violet-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {acc.type === "cash"
                                  ? "Наличные"
                                  : acc.type === "bank"
                                    ? "Расч. счет"
                                    : acc.type === "acquiring"
                                      ? "Эквайринг"
                                      : "Счет"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          <button
                            onClick={() => {
                              setTransferFromAcc(acc.id);
                              setTransferToAcc("");
                              setTransferAmount("");
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Перевод средств"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAccount(acc.id);
                              setEditAccName(acc.name);
                              setEditAccBalance(acc.actualBalance);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Удалить этот счет? Операции по нему не будут удалены, но могут перестать отображаться корректно.",
                                )
                              )
                                deleteAccount(acc.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Balance & Subtitle */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Текущий остаток
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                            {acc.actualBalance.toLocaleString("ru-RU")}&nbsp;₽
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTransferFromAcc(acc.id);
                            setTransferToAcc("");
                            setTransferAmount("");
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> Перевод
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Create New Account Form */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col justify-between min-h-[175px] hover:bg-slate-50 transition">
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        + Новый счет
                      </span>
                      <input
                        type="text"
                        placeholder="Название счета"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <select
                        value={newAccType}
                        onChange={(e) => setNewAccType(e.target.value as any)}
                        className="w-1/2 text-xs p-2 rounded-xl border border-slate-200 font-bold outline-none focus:border-emerald-500 bg-white cursor-pointer"
                      >
                        <option value="cash">Наличные</option>
                        <option value="bank">Расч. счет</option>
                        <option value="acquiring">Эквайринг</option>
                        <option value="other">Другое</option>
                      </select>
                      <button
                        onClick={handleAddAccount}
                        className="w-1/2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition active:scale-95 flex items-center justify-center gap-1 py-2"
                      >
                        <Plus className="w-3.5 h-3.5" /> Добавить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {activeTab === "directories" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto">
              <h2 className="text-lg font-bold mb-6 border-b pb-4 text-slate-800">
                Системные параметры расчетов
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Комиссия банка (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={crmConfig.acquiringFeePct}
                    onChange={(e) =>
                      updateCRMConfig({
                        acquiringFeePct: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Цена 12 тренировок
                  </label>
                  <input
                    type="number"
                    value={crmConfig.price12}
                    onChange={(e) =>
                      updateCRMConfig({ price12: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Цена 8 тренировок
                  </label>
                  <input
                    type="number"
                    value={crmConfig.price8}
                    onChange={(e) =>
                      updateCRMConfig({ price8: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Цена 4 тренировок
                  </label>
                  <input
                    type="number"
                    value={crmConfig.price4}
                    onChange={(e) =>
                      updateCRMConfig({ price4: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Цена 1 тренировки
                  </label>
                  <input
                    type="number"
                    value={crmConfig.price1}
                    onChange={(e) =>
                      updateCRMConfig({ price1: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Изменение стоимости будет автоматически применяться при новых
                оплатах через форму пополнения.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto">
              <h2 className="text-lg font-bold mb-6 border-b pb-4 text-slate-800">
                Справочники: Аналитические статьи (БДДС / P&L)
              </h2>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-4 rounded-xl border border-gray-100">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Название новой статьи..."
                  className="flex-1 p-3 border border-gray-200 outline-none rounded-xl text-sm font-medium focus:ring-1 focus:ring-slate-900"
                />
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="p-3 border border-gray-200 rounded-xl outline-none text-sm font-bold text-slate-700 bg-white min-w-[200px]"
                >
                  <option value="income">Статья Поступлений</option>
                  <option value="expense">Статья Списаний</option>
                </select>
                {newCatType === "expense" && (
                  <select
                    value={newCatExpenseType}
                    onChange={(e) =>
                      setNewCatExpenseType(
                        e.target.value as "variable" | "fixed",
                      )
                    }
                    className="p-3 border border-gray-200 rounded-xl outline-none text-sm font-bold text-slate-700 bg-white min-w-[150px]"
                  >
                    <option value="fixed">Постоянный</option>
                    <option value="variable">Переменный</option>
                  </select>
                )}
                <button
                  id="addCatBtn"
                  onClick={() => {
                    handleAddCat();
                    const btn = document.getElementById("addCatBtn");
                    if (btn) {
                      btn.innerText = "Добавлено";
                      setTimeout(() => {
                        btn.innerText = "+ Создать статью";
                      }, 2000);
                    }
                  }}
                  className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition tracking-wide"
                >
                  + Создать статью
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="font-black text-emerald-800 mb-4 border-b border-emerald-100 pb-2 uppercase tracking-wider text-xs">
                    Доходы (Поступления)
                  </h3>
                  <ul className="space-y-2.5">
                    {financeCategories
                      .filter((c) => c.type === "income")
                      .map((c) => (
                        <li
                          key={c.id}
                          className="flex justify-between items-center px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm group hover:border-emerald-200 transition"
                        >
                          <span className="font-bold text-slate-700">
                            {c.name}
                          </span>
                          {!c.isSystem ? (
                            <button
                              onClick={() => deleteFinanceCategory(c.id)}
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
                              Системная
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-black text-orange-800 mb-4 border-b border-orange-100 pb-2 uppercase tracking-wider text-xs">
                    Расходы (Списания)
                  </h3>
                  <ul className="space-y-2.5">
                    {financeCategories
                      .filter((c) => c.type === "expense")
                      .map((c) => (
                        <li
                          key={c.id}
                          className="flex justify-between items-center px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm group hover:border-orange-200 transition"
                        >
                          <span className="font-bold text-slate-700">
                            {c.name}
                          </span>
                          {!c.isSystem ? (
                            <button
                              onClick={() => deleteFinanceCategory(c.id)}
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-wider">
                              Системная
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "counterparties" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
            {/* Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Справочник контрагентов
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Управление школами, спортивными залами, тренерами и подрядчиками
                </p>
              </div>
              <div className="bg-slate-100/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 self-start sm:self-center">
                Всего: {counterparties.length}
              </div>
            </div>

            {/* Add New Counterparty Form Card */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Добавить нового контрагента</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-4">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Название / ФИО <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCpName}
                    onChange={(e) => setNewCpName(e.target.value)}
                    placeholder="напр. Школа №12 или ИП Иванов"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Категория
                  </label>
                  <select
                    value={newCpType}
                    onChange={(e) => setNewCpType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  >
                    <option value="school_rent">Аренда школы</option>
                    <option value="hall_rent">Аренда зала</option>
                    <option value="coach">Тренер / Ассистент</option>
                    <option value="other">Другое</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Условия оплаты
                  </label>
                  <select
                    value={newCpPaymentType}
                    onChange={(e) => setNewCpPaymentType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  >
                    <option value="per_session">За тренировку (сдельная)</option>
                    <option value="fixed">За месяц (фикс / оклад)</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Ставка (₽)
                  </label>
                  <input
                    type="number"
                    value={newCpRate || ""}
                    onChange={(e) => setNewCpRate(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-9">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Описание / Дополнительно (опционально)
                  </label>
                  <input
                    type="text"
                    value={newCpDesc}
                    onChange={(e) => setNewCpDesc(e.target.value)}
                    placeholder="Адрес, телефон, реквизиты договора..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex items-end">
                  <button
                    onClick={handleAddCounterparty}
                    disabled={!newCpName.trim()}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-slate-900/10 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Создать</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cpSearch}
                    onChange={(e) => setCpSearch(e.target.value)}
                    placeholder="Поиск по названию или описанию..."
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 transition"
                  />
                  {cpSearch && (
                    <button
                      onClick={() => setCpSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: "all", label: "Все", count: counterparties.length },
                    { id: "school_rent", label: "Школы", count: counterparties.filter(c => c.type === "school_rent").length },
                    { id: "hall_rent", label: "Залы", count: counterparties.filter(c => c.type === "hall_rent").length },
                    { id: "coach", label: "Тренеры", count: counterparties.filter(c => c.type === "coach").length },
                    { id: "other", label: "Другое", count: counterparties.filter(c => c.type === "other").length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCpFilterType(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                        cpFilterType === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        cpFilterType === tab.id ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-600"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Counterparties Grid/List */}
              {filteredCounterparties.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">Контрагенты не найдены</div>
                  <p className="text-xs text-slate-400 mt-1">
                    {cpSearch ? "Попробуйте изменить поисковый запрос или сбросить фильтры" : "Добавьте первого контрагента с помощью формы выше"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredCounterparties.map((cp) => {
                    const getTypeBadge = (type: string) => {
                      switch (type) {
                        case "school_rent":
                          return { label: "Аренда школы", bg: "bg-blue-50 text-blue-700 border-blue-100", icon: Building2 };
                        case "hall_rent":
                          return { label: "Аренда зала", bg: "bg-purple-50 text-purple-700 border-purple-100", icon: Building2 };
                        case "coach":
                          return { label: "Тренер", bg: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: User };
                        default:
                          return { label: "Другое", bg: "bg-amber-50 text-amber-700 border-amber-100", icon: Wallet };
                      }
                    };

                    const badge = getTypeBadge(cp.type);
                    const IconComp = badge.icon;

                    return (
                      <div
                        key={cp.id}
                        className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:shadow-md transition group flex flex-col justify-between gap-3 relative"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-red-600 transition">
                                {cp.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                {(cp.rate !== undefined && cp.rate > 0) || cp.paymentType ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {cp.paymentType === "fixed" ? "Фикс:" : "Сдельная:"}{" "}
                                    {(cp.rate || 0).toLocaleString("ru-RU")} ₽
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEditCp(cp)}
                              title="Редактировать контрагента"
                              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingCp(cp)}
                              title="Удалить контрагента"
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Description / Info */}
                        {cp.description ? (
                          <div className="text-xs text-slate-500 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 font-medium">{cp.description}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rent calculations block */}
            <div className="mt-10 border-t border-slate-100 pt-8 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Взаиморасчеты по аренде площадок
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Автоматический учет начисленной аренды за проведенные тренировки
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Площадка / Группа</th>
                      <th className="px-4 py-3 text-right">Начислено за тренировки</th>
                      <th className="px-4 py-3 text-right">Выплачено</th>
                      <th className="px-4 py-3 text-right">Долг за аренду</th>
                      <th className="px-4 py-3 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const rentAccruals = finances.filter(
                        (f) =>
                          f.type === "expense" &&
                          f.category === "Аренда" &&
                          !f.description?.toLowerCase().includes("абонемент")
                      );

                      const rentCounterpartiesMap = new Map<
                        string,
                        { name: string; id: string; accrued: number; paid: number; cpObj?: any }
                      >();

                      // Pre-populate with all known rent counterparties
                      counterparties.filter(c => c.type === 'school_rent' || c.type === 'hall_rent').forEach(cp => {
                        rentCounterpartiesMap.set(cp.id, {
                          name: cp.name,
                          id: cp.id,
                          accrued: cp.paymentType === "fixed" ? (cp.rate || 0) : 0,
                          paid: 0,
                          cpObj: cp
                        });
                      });

                      // Process actual records for the period
                      rentAccruals.forEach((f) => {
                        let key = f.counterpartyId || f.groupName || f.description || "Аренда площадки";
                        let name = key;
                        
                        if (f.counterpartyId) {
                          const cp = counterparties.find((c) => c.id === f.counterpartyId);
                          if (cp) name = cp.name;
                        } else if (f.groupName) {
                          name = `Группа ${f.groupName}`;
                        }

                        if (!rentCounterpartiesMap.has(key)) {
                          rentCounterpartiesMap.set(key, { name, id: key, accrued: 0, paid: 0 });
                        }

                        const item = rentCounterpartiesMap.get(key)!;
                        if (f.paymentStatus === "accrued") {
                          // Only sum accrued records if they are NOT fixed (fixed is already populated)
                          if (!item.cpObj || item.cpObj.paymentType !== "fixed") {
                            item.accrued += Number(f.amount || 0);
                          }
                        } else {
                          item.paid += Number(f.amount || 0);
                        }
                      });

                      const list = Array.from(rentCounterpartiesMap.values());
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-400 font-medium">
                              Начислений по аренде пока нет (создаются автоматически при проведении тренировок)
                            </td>
                          </tr>
                        );
                      }

                      return list.map((item) => {
                        const debt = Math.max(0, item.accrued - item.paid);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {item.accrued.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                              {item.paid.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-red-600">
                              {debt > 0 ? `${debt.toLocaleString("ru-RU")} ₽` : "0 ₽"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {debt > 0 ? (
                                <button
                                  onClick={() => {
                                    setPayoutType("rent");
                                    setPayoutTargetName(item.name);
                                    setPayoutTargetId(item.id);
                                    setPayoutAmount(String(debt));
                                    setPayoutModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                                >
                                  Оплатить аренду
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === "client_income" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold mb-6 border-b pb-4 text-slate-800">
              Доходы от клиентов
            </h2>
            <div className="space-y-4">
              {clients.map((client) => {
                const paidPayments = client.payments?.filter(p => p.status === "Оплачено") || [];
                if (paidPayments.length === 0) return null;

                const totalIncome = paidPayments.reduce((sum, p) => sum + p.amount, 0);
                const fullName = `${client.childSurname} ${client.childName}`.trim();

                return (
                  <div key={client.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-slate-800">{fullName}</h3>
                      <div className="font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-sm">
                        +{totalIncome.toLocaleString()} ₽
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">
                        <div className="col-span-3">Дата</div>
                        <div className="col-span-6">Основание</div>
                        <div className="col-span-3 text-right">Сумма</div>
                      </div>
                      {paidPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment) => (
                        <div key={payment.id} className="grid grid-cols-12 gap-2 text-sm text-slate-700 items-center py-1">
                          <div className="col-span-3 font-mono text-xs">{new Date(payment.date).toLocaleDateString("ru-RU")}</div>
                          <div className="col-span-6 truncate">{payment.item}</div>
                          <div className="col-span-3 text-right font-medium text-emerald-600">+{payment.amount.toLocaleString()} ₽</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {clients.every(c => (c.payments?.filter(p => p.status === "Оплачено") || []).length === 0) && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Нет данных об оплатах от клиентов.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6">
              Редактирование счета
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Название счета
                </label>
                <input
                  type="text"
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Остаток (текущий фактический баланс)
                </label>
                <input
                  type="number"
                  value={editAccBalance}
                  onChange={(e) => setEditAccBalance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={() => setEditingAccount(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleEditAccountSubmit}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {transferFromAcc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6">
              Перевод средств
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Счет списания
                </label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600">
                  {accounts.find((a) => a.id === transferFromAcc)?.name ||
                    "Неизвестный счет"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Счет зачисления
                </label>
                <select
                  value={transferToAcc}
                  onChange={(e) => setTransferToAcc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="" disabled>
                    Выберите счет
                  </option>
                  {calculatedAccounts
                    .filter((a) => a.id !== transferFromAcc)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Баланс: {acc.actualBalance.toLocaleString("ru-RU")} ₽)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Сумма перевода
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={() => setTransferFromAcc(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleTransferSubmit}
                disabled={
                  !transferToAcc ||
                  !transferAmount ||
                  Number(transferAmount) <= 0
                }
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Перевести
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal (Salary / Venue Rent) */}
      {payoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {payoutType === "salary" ? "Выплата зарплаты" : "Оплата аренды"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Фактическая выплата средств с выбранного счета в счет начислений
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Получатель / Объект
                </label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800">
                  {payoutTargetName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Счет списания
                </label>
                <select
                  value={payoutAccountId}
                  onChange={(e) => setPayoutAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  {calculatedAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Баланс: {acc.actualBalance.toLocaleString("ru-RU")} ₽)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Сумма выплаты (₽)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {payoutType === "salary" && (() => {
                  const targetCoach = coaches.find((c) => c.id === payoutTargetId || c.name === payoutTargetName);
                  if (!targetCoach || targetCoach.paymentType !== "fixed" || !targetCoach.rate) return null;
                  const half = Math.round(targetCoach.rate / 2);
                  return (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayoutAmount(String(half))}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition"
                      >
                        Аванс (1–15): {half.toLocaleString("ru-RU")} ₽
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayoutAmount(String(targetCoach.rate! - half))}
                        className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition"
                      >
                        Расчет (16–31): {(targetCoach.rate! - half).toLocaleString("ru-RU")} ₽
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayoutAmount(String(targetCoach.rate))}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition"
                      >
                        Весь оклад: {targetCoach.rate.toLocaleString("ru-RU")} ₽
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Дата выплаты
                </label>
                <input
                  type="date"
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handlePayoutSubmit}
                disabled={!payoutAmount || Number(payoutAmount) <= 0 || !payoutAccountId}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Подтвердить выплату
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coach Salary Detail Modal */}
      {selectedCoachIdForDetail && (() => {
        const coach = coaches.find((c) => c.id === selectedCoachIdForDetail);
        if (!coach) return null;

        // Find coach sessions for gridFilterMonth
        const coachSessions = trainingSessions
          .filter((ts) => {
            const tsMonth = toYearMonthString(ts.dateString, ts.date);
            if (tsMonth !== gridFilterMonth) return false;

            const isMain =
              ts.coachId === coach.id ||
              (ts.coachName && coach.name && ts.coachName.includes(coach.name));
            const isAssistant =
              ts.assistantId === coach.id ||
              (ts.assistantName && coach.name && ts.assistantName.includes(coach.name));

            return isMain || isAssistant;
          })
          .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

        // Find coach finance records
        const periodFinances = finances.filter(
          (f) => (f.targetMonth || f.date.substring(0, 7)) === gridFilterMonth
        );
        const coachFinances = periodFinances
          .filter((f) => {
            const matchesCoach =
              f.coachId === coach.id ||
              (f.description && coach.name && f.description.includes(coach.name));
            const isSalaryCat =
              f.category === "Зарплата" ||
              f.category === "Зарплаты" ||
              f.category === "Премии";
            return matchesCoach && isSalaryCat;
          })
          .sort((a, b) => b.date.localeCompare(a.date));

        // Calculate stats
        const rate = coach.rate || 0;
        const baseSalary = coach.paymentType === "fixed" ? rate : 0;
        const totalSessions = coachSessions.length;

        const accruedSessionRecords = periodFinances.filter(
          (f) =>
            f.type === "expense" &&
            f.category === "Зарплата" &&
            f.paymentStatus === "accrued" &&
            (f.coachId === coach.id || (f.description && coach.name && f.description.includes(coach.name)))
        );
        const accruedFromRecords = accruedSessionRecords.reduce(
          (sum, f) => sum + Number(f.amount || 0),
          0
        );

        const surcharges =
          accruedFromRecords > 0
            ? accruedFromRecords
            : coach.paymentType === "per_session"
            ? totalSessions * (rate || 1500)
            : 0;

        const bonuses = periodFinances
          .filter(
            (f) =>
              f.type === "expense" &&
              f.category === "Премии" &&
              (f.coachId === coach.id || (f.description && coach.name && f.description.includes(coach.name)))
          )
          .reduce((sum, f) => sum + Number(f.amount || 0), 0);

        const accrued = baseSalary + surcharges + bonuses;

        const paid = periodFinances
          .filter(
            (f) =>
              f.type === "expense" &&
              (f.category === "Зарплата" || f.category === "Зарплаты") &&
              f.paymentStatus !== "accrued" &&
              (f.coachId === coach.id || (f.description && coach.name && f.description.includes(coach.name)))
          )
          .reduce((sum, f) => sum + Number(f.amount || 0), 0);

        const toPay = Math.max(0, accrued - paid);

        const getMonthName = (monthStr: string) => {
          const d = new Date(monthStr + "-01");
          const mName = d.toLocaleString("ru-RU", { month: "long", year: "numeric" });
          return mName.charAt(0).toUpperCase() + mName.slice(1);
        };

        // Half-month salary calculations for fixed rate coaches
        const half1Accrued = coach.paymentType === "fixed" ? Math.round((coach.rate || 0) / 2) : 0;
        const half2Accrued = coach.paymentType === "fixed" ? (coach.rate || 0) - half1Accrued : 0;

        const paidHalf1 = coachFinances
          .filter(
            (f) =>
              f.paymentStatus !== "accrued" &&
              ((parseInt(f.date.split("-")[2] || "0", 10) <= 16) ||
                f.description?.toLowerCase().includes("1-15") ||
                f.description?.toLowerCase().includes("аванс"))
          )
          .reduce((sum, f) => sum + Number(f.amount || 0), 0);

        const paidHalf2 = Math.max(0, paid - paidHalf1);
        const toPayHalf1 = Math.max(0, half1Accrued - paidHalf1);
        const toPayHalf2 = Math.max(0, half2Accrued - paidHalf2);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-400 text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-500/20 overflow-hidden shrink-0">
                    {coach.avatarUrl ? (
                      <img src={coach.avatarUrl} alt={coach.name} className="w-full h-full object-cover" />
                    ) : (
                      coach.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900">{coach.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {coach.role}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Тип оплаты:{" "}
                      <strong className="text-slate-800">
                        {coach.paymentType === "fixed"
                          ? `Оклад (${(coach.rate || 0).toLocaleString("ru-RU")} ₽/мес)`
                          : `За тренировку (${(coach.rate || 1500).toLocaleString("ru-RU")} ₽/зан)`}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <input
                      type="month"
                      value={gridFilterMonth}
                      onChange={(e) => setGridFilterMonth(e.target.value)}
                      className="outline-none bg-transparent font-bold cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => setSelectedCoachIdForDetail(null)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-5 shrink-0">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Проведено
                  </div>
                  <div className="text-base md:text-lg font-black text-slate-900">
                    {totalSessions} <span className="text-xs font-normal text-slate-500">тренировок</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Оклад / Сдельная
                  </div>
                  <div className="text-base md:text-lg font-black text-slate-900">
                    {(baseSalary + surcharges).toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Премии
                  </div>
                  <div className="text-base md:text-lg font-black text-slate-900">
                    {bonuses.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                    Итого начислено
                  </div>
                  <div className="text-base md:text-lg font-black text-emerald-700">
                    {accrued.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3.5 col-span-2 md:col-span-1">
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">
                    К выплате
                  </div>
                  <div className="text-base md:text-lg font-black text-rose-700">
                    {toPay.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
              </div>

              {/* Fixed Salary Semi-Monthly Schedule Breakdown */}
              {coach.paymentType === "fixed" && (
                <div className="mb-5 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      График выплат оклада по полумесяцам (50% / 50%)
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Оклад: <strong className="text-slate-900 font-bold">{coach.rate?.toLocaleString("ru-RU")} ₽/мес</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Period 1: 1-15 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800">1-я половина (1–15 число)</span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            Выплата 16-го числа
                          </span>
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-1">
                          Начислено: {half1Accrued.toLocaleString("ru-RU")} ₽
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Выплачено: <span className="font-bold text-slate-700">{paidHalf1.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Остаток к выплате 16-го:</span>
                        <span className={`text-xs font-black ${toPayHalf1 > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {toPayHalf1 > 0 ? `${toPayHalf1.toLocaleString("ru-RU")} ₽` : "Оплачено"}
                        </span>
                      </div>
                    </div>

                    {/* Period 2: 16-31 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800">2-я половина (16–31 число)</span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Выплата 1-го числа
                          </span>
                        </div>
                        <div className="text-sm font-black text-slate-900 mt-1">
                          Начислено: {half2Accrued.toLocaleString("ru-RU")} ₽
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Выплачено: <span className="font-bold text-slate-700">{paidHalf2.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Остаток к выплате 1-го:</span>
                        <span className={`text-xs font-black ${toPayHalf2 > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {toPayHalf2 > 0 ? `${toPayHalf2.toLocaleString("ru-RU")} ₽` : "Оплачено"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtabs inside Modal */}
              <div className="flex border-b border-slate-100 mb-4 shrink-0">
                <button
                  onClick={() => setCoachDetailSubTab("sessions")}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                    coachDetailSubTab === "sessions"
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Проведенные тренировки ({coachSessions.length})</span>
                </button>
                <button
                  onClick={() => setCoachDetailSubTab("finances")}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                    coachDetailSubTab === "finances"
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Начисления и выплаты ({coachFinances.length})</span>
                </button>
              </div>

              {/* Table Container */}
              <div className="overflow-y-auto flex-1 min-h-0 rounded-2xl border border-slate-100">
                {coachDetailSubTab === "sessions" ? (
                  coachSessions.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs font-medium">
                      За {getMonthName(gridFilterMonth)} проведенные тренировки для данного сотрудника не найдены.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-100">Дата</th>
                          <th className="px-4 py-3 border-b border-slate-100">Группа</th>
                          <th className="px-4 py-3 border-b border-slate-100">Роль</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-center">Учеников на занятии</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-right">Ставка</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-right">Начисление</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-center">Протокол</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {coachSessions.map((ts) => {
                          const isMain =
                            ts.coachId === coach.id ||
                            (ts.coachName && coach.name && ts.coachName.includes(coach.name));
                          const roleLabel = isMain ? "Главный тренер" : "Ассистент";
                          const perSessionRate = coach.rate || 1500;
                          const sessionAccrual = coach.paymentType === "per_session" ? perSessionRate : 0;

                          const formattedDate = formatSessionDateDisplay(ts.date, ts.dateString);

                          return (
                            <tr key={ts.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 font-bold text-slate-900">{formattedDate}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                  {ts.groupName || "Группа"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isMain
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-purple-50 text-purple-700"
                                  }`}
                                >
                                  {roleLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-emerald-600">
                                {ts.presentCount || 0} учен.
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600 font-medium">
                                {coach.paymentType === "per_session"
                                  ? `${perSessionRate.toLocaleString("ru-RU")} ₽`
                                  : "В окладе"}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">
                                {coach.paymentType === "per_session"
                                  ? `${sessionAccrual.toLocaleString("ru-RU")} ₽`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {ts.photoUrl ? (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                                    С фотоотчетом
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                    Заполнено
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
                ) : (
                  coachFinances.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs font-medium">
                      За {getMonthName(gridFilterMonth)} финансовые записи по сотруднику отсутствуют.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-100">Дата</th>
                          <th className="px-4 py-3 border-b border-slate-100">Категория / Тип</th>
                          <th className="px-4 py-3 border-b border-slate-100">Описание</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-right">Сумма</th>
                          <th className="px-4 py-3 border-b border-slate-100 text-center">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {coachFinances.map((f) => {
                          const isAccrual = f.paymentStatus === "accrued";
                          return (
                            <tr key={f.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 font-bold text-slate-900">{f.date}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{f.category}</td>
                              <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{f.description}</td>
                              <td
                                className={`px-4 py-3 text-right font-bold ${
                                  isAccrual ? "text-emerald-600" : "text-slate-900"
                                }`}
                              >
                                {Number(f.amount || 0).toLocaleString("ru-RU")} ₽
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isAccrual
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {isAccrual ? "Начисление" : "Выплачено"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-500 font-medium">
                  Детализация за {getMonthName(gridFilterMonth)}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCoachIdForDetail(null)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Закрыть
                  </button>
                  {toPay > 0 && (
                    <button
                      onClick={() => {
                        setPayoutType("salary");
                        setPayoutTargetName(coach.name);
                        setPayoutTargetId(coach.id);
                        setPayoutAmount(String(toPay));
                        setSelectedCoachIdForDetail(null);
                        setPayoutModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Выплатить {toPay.toLocaleString("ru-RU")} ₽</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Counterparty Modal */}
      {editingCp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Редактирование контрагента
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Измените параметры и условия работы
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCp(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Название / ФИО <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCpName}
                  onChange={(e) => setEditCpName(e.target.value)}
                  placeholder="Имя или название контрагента"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Категория
                  </label>
                  <select
                    value={editCpType}
                    onChange={(e) => setEditCpType(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  >
                    <option value="school_rent">Аренда школы</option>
                    <option value="hall_rent">Аренда зала</option>
                    <option value="coach">Тренер / Ассистент</option>
                    <option value="other">Другое</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Условия оплаты
                  </label>
                  <select
                    value={editCpPaymentType}
                    onChange={(e) => setEditCpPaymentType(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                  >
                    <option value="per_session">За тренировку (сдельная)</option>
                    <option value="fixed">За месяц (фикс / оклад)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Ставка / Стоимость (₽)
                </label>
                <input
                  type="number"
                  value={editCpRate || ""}
                  onChange={(e) => setEditCpRate(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Описание / Заметки / Реквизиты
                </label>
                <textarea
                  value={editCpDesc}
                  onChange={(e) => setEditCpDesc(e.target.value)}
                  rows={3}
                  placeholder="Адрес площадки, контакты управляющего, детали договора..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition resize-none"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingCp(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEditCp}
                disabled={!editCpName.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-slate-900/10 transition"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 text-center mb-1">
              Удалить контрагента?
            </h3>
            <p className="text-xs text-slate-500 font-medium text-center mb-6">
              Вы уверены, что хотите удалить контрагента <strong className="text-slate-800">«{deletingCp.name}»</strong>? Это действие нельзя отменить.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingCp(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDeleteCp}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
