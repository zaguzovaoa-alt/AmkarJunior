import React, { useState, useMemo } from "react";
import { useCRM } from "../context/CRMContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
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
    deleteAccount,
    updateFinancialPlan,
    financialPlans,
    deleteFinanceRecord,
    crmConfig,
    updateCRMConfig,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "input" | "cashflow" | "pnl" | "directories" | "plan" | "accounts"
  >("dashboard");

  const currentMonthStr = new Date().toISOString().substring(0, 7);

  // States for date range filtering on dashboard
  const defaultStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .substring(0, 10);
  const defaultEndDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString()
    .substring(0, 10);

  const [dashStartDate, setDashStartDate] = useState(defaultStartDate);
  const [dashEndDate, setDashEndDate] = useState(defaultEndDate);

  // Dashboard Logic
  const totalIncomes = finances
    .filter((f) => f.type === "income" && f.date >= dashStartDate && f.date <= dashEndDate)
    .reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalExpenses = finances
    .filter((f) => f.type === "expense" && f.date >= dashStartDate && f.date <= dashEndDate)
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
  const [fCat, setFCat] = useState("");
  const [fAccount, setFAccount] = useState<string>("acc_cash");
  const [fIsFixed, setFIsFixed] = useState(false);
  const [fTargetMonth, setFTargetMonth] = useState(currentMonthStr);
  const [fDesc, setFDesc] = useState("");

  const [addSuccessMsg, setAddSuccessMsg] = useState("");

  const handleAddFinance = () => {
    if (!fAmount || !fCat || !fAccount) {
      setAddSuccessMsg("Введите сумму, категорию и счет");
      setTimeout(() => setAddSuccessMsg(""), 3000);
      return;
    }
    addFinanceRecord({
      type: fType,
      amount: Number(fAmount),
      category: financeCategories.find((c) => c.id === fCat)?.name || fCat,
      date: new Date().toISOString().substring(0, 10),
      description: fDesc,
      targetMonth: fTargetMonth,
      accountId: fAccount,
      isFixed: fIsFixed
    });
    setFAmount("");
    setFDesc("");
    setAddSuccessMsg("Запись добавлена!");
    setTimeout(() => setAddSuccessMsg(""), 3000);
  };

  // Directories State
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [newCatExpenseType, setNewCatExpenseType] = useState<"variable" | "fixed">("fixed");

  // Grid/Cashflow state
  const [gridFilterMonth, setGridFilterMonth] = useState(currentMonthStr);
  const [gridFilterType, setGridFilterType] = useState<"all" | "income" | "expense">("all");
  const [gridFilterAccount, setGridFilterAccount] = useState<"all" | string>("all");

  const [pnlExpandedIncomes, setPnlExpandedIncomes] = useState(false);
  const [pnlExpandedVariable, setPnlExpandedVariable] = useState(false);
  const [pnlExpandedFixed, setPnlExpandedFixed] = useState(false);

  const handleAddCat = () => {
    if (!newCatName) return;
    addFinanceCategory({ name: newCatName, type: newCatType, expenseType: newCatType === "expense" ? newCatExpenseType : undefined });
    setNewCatName("");
  };

  // Accounts Form State
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<"cash" | "bank" | "acquiring" | "other">("cash");
  const [newAccBalance, setNewAccBalance] = useState<number>(0);

  const handleAddAccount = () => {
    if (!newAccName.trim()) return;
    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      balance: newAccBalance || 0
    });
    setNewAccName("");
    setNewAccBalance(0);
  };

  // Plan State
  const activePlan = financialPlans.find(
    (p) => p.month === currentMonthStr,
  ) || {
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
  };
  const [plan, setPlan] = useState<typeof activePlan>(activePlan);

  React.useEffect(() => {
    const current = financialPlans.find((p) => p.month === currentMonthStr);
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
  }, [financialPlans, currentMonthStr]);

  const savePlan = () => {
    updateFinancialPlan(plan);
    const btn = document.getElementById("savePlanBtn");
    if (btn) {
      btn.innerText = "План сохранен ✅";
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

  // New Dashboard calculations
  const dashboardData = useMemo(() => {
    // Top Stats metrics
    const periodData = finances.filter(
      (f) => f.date >= dashStartDate && f.date <= dashEndDate,
    );
    const mIncomes = periodData
      .filter((f) => f.type === "income")
      .reduce((acc, f) => acc + Number(f.amount || 0), 0);
    const mExpenses = periodData
      .filter((f) => f.type === "expense")
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
      else stat.Расходы += Number(f.amount || 0);
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
      .filter((f) => f.type === "expense")
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

    return { mIncomes, mExpenses, mProfit, dynamicChartData, pieData };
  }, [finances, dashStartDate, dashEndDate]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      <div className="p-4 md:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
              Управленческий учет и финансы
            </h1>
            <p className="text-gray-500 text-sm">
              Ввод операций, P&L, финансовое планирование абонементов.
            </p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl flex-wrap">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === "dashboard" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Дашборд
            </button>
            <button
              onClick={() => setActiveTab("input")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === "input" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              ОперВвод
            </button>
            <button
              onClick={() => setActiveTab("cashflow")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === "cashflow" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              ОДДС
            </button>
            <button
              onClick={() => setActiveTab("pnl")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === "pnl" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              P&L
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === "plan" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              ФинПлан
            </button>
            <button
              onClick={() => setActiveTab("directories")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === "directories" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Справочники
            </button>
            <button
              onClick={() => setActiveTab("accounts")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === "accounts" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Счета
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
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
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
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

              {/* Pie Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-900 text-sm mb-4 shrink-0">
                  Структура расходов{" "}
                  <span className="text-gray-400 font-normal">
                    ({currentMonthStr})
                  </span>
                </h3>
                {dashboardData.pieData.length > 0 ? (
                  <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row items-center justify-center gap-6 flex-1">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 relative mx-auto shrink-0">
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
                        <span className="text-lg sm:text-xl font-black text-slate-900 mb-0.5 sm:mb-1">
                          {dashboardData.mExpenses.toLocaleString()} ₽
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                          Всего
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 w-full min-w-0">
                      <ul className="space-y-3">
                        {dashboardData.pieData.slice(0, 5).map((item, id) => (
                          <li
                            key={id}
                            className="flex justify-between items-center text-xs"
                          >
                            <div className="flex items-center min-w-0 pr-3">
                              <span
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 shadow-sm shrink-0"
                                style={{ backgroundColor: item.color }}
                              ></span>
                              <span className="text-slate-600 font-medium truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-slate-800 font-bold text-xs shrink-0 whitespace-nowrap">
                              {item.value.toLocaleString()} ₽{" "}
                              <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium ml-1">
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
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                    Нет расходов за месяц
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Operations */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Последние операции
                  </h3>
                  <button
                    className="text-xs text-blue-600 font-medium"
                    onClick={() => setActiveTab("cashflow")}
                  >
                    Все операции
                  </button>
                </div>
                <div className="space-y-2">
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
                            <div className="text-[10px] text-gray-500">
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

              {/* Accounts Receivable */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
                  onClick={() => setFType("income")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${fType === "income" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500"}`}
                >
                  + Доход
                </button>
                <button
                  onClick={() => setFType("expense")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${fType === "expense" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500"}`}
                >
                  - Расход
                </button>
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
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
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
            </div>
          </div>
        )}

        {activeTab === "cashflow" && (() => {
          let visibleFinances = finances.filter(f => f.date.substring(0, 7) === gridFilterMonth);
          if (gridFilterType !== "all") {
            visibleFinances = visibleFinances.filter(f => f.type === gridFilterType);
          }
          if (gridFilterAccount !== "all") {
            visibleFinances = visibleFinances.filter(f => f.accountId === gridFilterAccount);
          }
          const vIncomes = visibleFinances.filter((f) => f.type === "income").reduce((acc, f) => acc + Number(f.amount || 0), 0);
          const vExpenses = visibleFinances.filter((f) => f.type === "expense").reduce((acc, f) => acc + Number(f.amount || 0), 0);

          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-[600px] flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  БДДС – Детализированный реестр платежей
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={gridFilterAccount} 
                    onChange={e => setGridFilterAccount(e.target.value)} 
                    className="text-sm p-2 border rounded-lg bg-slate-50 outline-none"
                  >
                    <option value="all">Все счета</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <input
                    type="month"
                    value={gridFilterMonth}
                    onChange={(e) => setGridFilterMonth(e.target.value)}
                    className="text-sm p-1.5 border rounded-lg bg-slate-50 outline-none"
                  />
                  <select 
                    value={gridFilterType} 
                    onChange={(e) => setGridFilterType(e.target.value as any)} 
                    className="text-sm p-2 border rounded-lg bg-slate-50 outline-none"
                  >
                    <option value="all">Все транзакции</option>
                    <option value="income">Только доходы</option>
                    <option value="expense">Только расходы</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-auto border rounded-xl rounded-b-none border-b-0">
                <table className="w-full text-left text-sm whitespace-nowrap bg-white border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr className="text-gray-500 font-bold tracking-wider text-[10px] uppercase">
                      <th className="p-3 border-b border-r">ID / Дата</th>
                      <th className="p-3 border-b border-r">Тип</th>
                      <th className="p-3 border-b border-r">Регулярность</th>
                      <th className="p-3 border-b border-r">
                        Счет списания/зачисления
                      </th>
                      <th className="p-3 border-b border-r text-right">Сумма</th>
                      <th className="p-3 border-b border-r">Категория</th>
                      <th className="p-3 border-b border-r max-w-[200px] truncate">
                        Основание / Примечание
                      </th>
                      <th className="p-3 border-b text-center w-10">Удалить</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {visibleFinances.map((f, i) => {
                      const accObj = accounts.find(a => a.id === f.accountId);
                      return (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <td className="p-2 border-r font-mono text-gray-500">
                            {new Date(f.date).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="p-2 border-r">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                            >
                              {f.type === "income" ? "ДОХОД" : "РАСХОД"}
                            </span>
                          </td>
                          <td className="p-2 border-r font-medium text-slate-700 uppercase text-[10px] tracking-wider">
                            {!f.isFixed ? "Переменный" : "Постоянный"}
                          </td>
                          <td className="p-2 border-r font-medium text-slate-700">
                            {accObj ? accObj.name : "—"}
                          </td>
                          <td
                            className={`p-2 border-r font-bold text-right font-mono ${f.type === "income" ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {f.type === "income" ? "+" : "-"}
                            {Number(f.amount).toLocaleString("ru-RU")} ₽
                          </td>
                          <td className="p-2 border-r font-medium text-slate-800">
                            {f.category}
                          </td>
                          <td
                            className="p-2 border-r max-w-[200px] truncate"
                            title={f.description}
                          >
                            {f.description || "-"}
                          </td>
                          <td className="p-2 text-center w-10">
                            <button
                              onClick={() => deleteFinanceRecord(f.id)}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {visibleFinances.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-gray-400">
                          Нет транзакций по заданным фильтрам
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-t-0 rounded-b-xl p-3 flex justify-end space-x-6 items-center">
                <div className="text-xs text-gray-500 font-bold uppercase shrink-0">
                  Итого за период:
                </div>
                <div className="text-sm font-bold text-emerald-600 shrink-0">
                  Оборот: {Number(vIncomes).toLocaleString()} ₽
                </div>
                <div className="text-sm font-bold text-red-600 shrink-0">
                  Расход: {Number(vExpenses).toLocaleString()} ₽
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === "pnl" && (() => {
          const currentMonthFinances = finances.filter(
            (f) => (f.targetMonth || f.date.substring(0, 7)) === gridFilterMonth
          );
          
          const incomeTransactions = currentMonthFinances.filter(f => f.type === "income");
          const totalIncome = incomeTransactions.reduce((acc, f) => acc + Number(f.amount || 0), 0);
          const paymentsCount = incomeTransactions.length;
          
          // Let's deduce 12-session subscriptions. E.g. base amount might match price12, or just show category breakdowns. 
          // Since "12 занятий" is often in description or category, we'll try to find it. Or we just show the categories inside Incomes.
          const incomesByCategory = financeCategories
            .filter((c) => c.type === "income")
            .map(cat => ({
               ...cat, 
               sum: incomeTransactions.filter(f => f.category === cat.name).reduce((acc, f) => acc + Number(f.amount || 0), 0)
            }))
            .filter(c => c.sum > 0);

          const variableCategories = financeCategories
            .filter((c) => c.type === "expense" && c.expenseType !== "fixed")
            .map(cat => ({
               ...cat, 
               sum: currentMonthFinances.filter(f => f.category === cat.name && f.type === "expense").reduce((acc, f) => acc + Number(f.amount || 0), 0)
            }))
            .filter(c => c.sum > 0);
            
          const fixedCategories = financeCategories
            .filter((c) => c.type === "expense" && c.expenseType === "fixed")
            .map(cat => ({
               ...cat, 
               sum: currentMonthFinances.filter(f => f.category === cat.name && f.type === "expense").reduce((acc, f) => acc + Number(f.amount || 0), 0)
            }))
            .filter(c => c.sum > 0);
            
          const totalVariable = variableCategories.reduce((acc, c) => acc + c.sum, 0);
          const totalFixed = fixedCategories.reduce((acc, c) => acc + c.sum, 0);
          
          const ebitda = totalIncome - totalVariable - totalFixed;
          
          // taxes / net profit (placeholder for acquing or other deductions. Just equating EBITDA and Net here if no taxes)
          const netProfit = ebitda; 

          return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-8">
            <h2 className="text-xl font-black mb-6 text-slate-900 border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span>Отчет о прибылях и убытках (P&L)</span>
              <div className="flex items-center space-x-2 text-sm font-medium">
                <span className="text-gray-500">Учетный месяц:</span>
                <input 
                  type="month"
                  value={gridFilterMonth}
                  onChange={(e) => setGridFilterMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
                />
              </div>
            </h2>

            <div className="space-y-6 max-w-3xl mx-auto">
              {/* ДОХОДЫ */}
              <div className="bg-emerald-50/50 p-4 md:p-5 rounded-2xl border border-emerald-100">
                <div 
                  className="flex justify-between items-center cursor-pointer group"
                  onClick={() => setPnlExpandedIncomes(!pnlExpandedIncomes)}
                >
                  <h3 className="font-bold text-emerald-800 text-sm tracking-wide uppercase flex items-center space-x-2">
                    <span>Выручка</span>
                    <span className="text-emerald-500 bg-emerald-100/50 px-1.5 py-0.5 rounded text-[10px]">
                      {pnlExpandedIncomes ? "− скрыть" : "+ раскрыть"}
                    </span>
                  </h3>
                  <div className="text-right">
                    <div className="font-mono text-lg font-black text-emerald-700">
                      {totalIncome.toLocaleString()} ₽
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      Кол-во платежей: {paymentsCount} шт.
                    </div>
                  </div>
                </div>

                {pnlExpandedIncomes && (
                  <div className="mt-4 pt-3 border-t border-emerald-100 space-y-2.5">
                    {incomesByCategory.map((cat) => (
                      <div key={cat.id} className="flex justify-between items-center text-sm">
                        <span className="text-emerald-950 font-medium">{cat.name}</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {cat.sum.toLocaleString()} ₽
                        </span>
                      </div>
                    ))}
                    {incomesByCategory.length === 0 && (
                      <div className="text-xs text-emerald-600/70 italic text-center py-2">
                        Нет поступлений за период
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ПЕРЕМЕННЫЕ РАСХОДЫ */}
              <div className="bg-orange-50/50 p-4 md:p-5 rounded-2xl border border-orange-100">
                <div 
                  className="flex justify-between items-center cursor-pointer group"
                  onClick={() => setPnlExpandedVariable(!pnlExpandedVariable)}
                >
                  <h3 className="font-bold text-orange-800 text-sm tracking-wide uppercase flex items-center space-x-2">
                    <span>Переменные расходы</span>
                    <span className="text-orange-500 bg-orange-100/50 px-1.5 py-0.5 rounded text-[10px]">
                      {pnlExpandedVariable ? "− скрыть" : "+ раскрыть"}
                    </span>
                  </h3>
                  <div className="font-mono text-lg font-black text-orange-700">
                    {totalVariable.toLocaleString()} ₽
                  </div>
                </div>

                {pnlExpandedVariable && (
                  <div className="mt-4 pt-3 border-t border-orange-100 space-y-2.5">
                    {variableCategories.map((cat) => (
                      <div key={cat.id} className="flex justify-between items-center text-sm">
                        <span className="text-orange-950 font-medium">{cat.name}</span>
                        <span className="font-mono font-bold text-orange-800">
                          {cat.sum.toLocaleString()} ₽
                        </span>
                      </div>
                    ))}
                    {variableCategories.length === 0 && (
                      <div className="text-xs text-orange-600/70 italic text-center py-2">
                        Нет переменных расходов за период
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ПОСТОЯННЫЕ РАСХОДЫ */}
              <div className="bg-rose-50/50 p-4 md:p-5 rounded-2xl border border-rose-100">
                <div 
                  className="flex justify-between items-center cursor-pointer group"
                  onClick={() => setPnlExpandedFixed(!pnlExpandedFixed)}
                >
                  <h3 className="font-bold text-rose-800 text-sm tracking-wide uppercase flex items-center space-x-2">
                    <span>Постоянные расходы</span>
                    <span className="text-rose-500 bg-rose-100/50 px-1.5 py-0.5 rounded text-[10px]">
                      {pnlExpandedFixed ? "− скрыть" : "+ раскрыть"}
                    </span>
                  </h3>
                  <div className="font-mono text-lg font-black text-rose-700">
                    {totalFixed.toLocaleString()} ₽
                  </div>
                </div>

                {pnlExpandedFixed && (
                  <div className="mt-4 pt-3 border-t border-rose-100 space-y-2.5">
                    {fixedCategories.map((cat) => (
                      <div key={cat.id} className="flex justify-between items-center text-sm">
                        <span className="text-rose-950 font-medium">{cat.name}</span>
                        <span className="font-mono font-bold text-rose-800">
                          {cat.sum.toLocaleString()} ₽
                        </span>
                      </div>
                    ))}
                    {fixedCategories.length === 0 && (
                      <div className="text-xs text-rose-600/70 italic text-center py-2">
                        Нет постоянных расходов за период
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* РЕЗУЛЬТАТ EBITDA */}
              <div className="p-4 md:p-6 bg-slate-800 shadow-xl shadow-slate-900/10 text-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <span className="font-bold tracking-wider text-sm text-slate-300 uppercase block mb-1">
                    EBITDA
                  </span>
                  <p className="text-[10px] text-slate-400">Прибыль до налогов и амортизации</p>
                </div>
                <span className={`text-2xl mt-2 md:mt-0 font-black font-mono tracking-tight drop-shadow-md ${ebitda >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {ebitda > 0 ? "+" : ""}{ebitda.toLocaleString()} ₽
                </span>
              </div>

              {/* ЧИСТАЯ ПРИБЫЛЬ */}
              <div className="p-4 md:p-6 bg-slate-950 shadow-xl shadow-slate-900/20 text-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center border-t-4 border-emerald-500 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="font-black tracking-widest text-sm text-slate-200 uppercase block mb-1">
                    Чистая прибыль
                  </span>
                  <p className="text-[10px] text-slate-500">Итоговый финансовый результат</p>
                </div>
                <span className={`text-3xl mt-2 md:mt-0 font-black font-mono tracking-tight drop-shadow-lg relative z-10 ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {netProfit > 0 ? "+" : ""}{netProfit.toLocaleString()} ₽
                </span>
                
                {/* Decorative background glow */}
                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${netProfit >= 0 ? "bg-emerald-500" : "bg-red-500"}`}></div>
              </div>

            </div>
          </div>
          );
        })()}

        {activeTab === "plan" && (
          <div className="space-y-6 border-none">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-gray-100 pb-3">
                  Финмодель и план продаж
                  <br />
                  <span className="text-sm font-medium text-gray-500">
                    Месяц: {plan.month}
                  </span>
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
                          setPlan({ ...plan, new12Count: Number(e.target.value) })
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
                          setPlan({ ...plan, new8Count: Number(e.target.value) })
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
                          setPlan({ ...plan, new4Count: Number(e.target.value) })
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

            {/* ДИНАМИКА И ВЫПОЛНЕНИЕ ПЛАНА (ТРАТЫ И ДОХОДЫ) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-5xl">
              <h2 className="text-xl font-bold text-slate-900 border-b border-gray-100 pb-3 mb-6">
                Выполнение финансового плана (по категориям)
                <br />
                <span className="text-sm font-medium text-gray-500">
                  Месяц: {plan.month}
                </span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Расходы блок */}
                <div>
                  <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    План по расходам
                  </h3>
                  <div className="space-y-4">
                    {financeCategories.filter((c) => c.type === 'expense').map((cat) => {
                      const target = plan.categoryTargets?.[cat.id] || 0;
                      
                      const actual = finances.filter(
                        (f) =>
                          f.type === "expense" &&
                          f.category === cat.name &&
                          (f.targetMonth || f.date.substring(0, 7)) === plan.month
                      ).reduce((a, b) => a + Number(b.amount || 0), 0);

                      const percent = target > 0 ? Math.min(Math.round((actual / target) * 100), 999) : (actual > 0 ? 100 : 0);
                      const isOverspent = actual > target && target > 0;

                      return (
                        <div key={cat.id} className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-800 text-sm truncate">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">План:</span>
                              <input 
                                type="number" 
                                value={target}
                                onChange={(e) => {
                                  setPlan({
                                    ...plan,
                                    categoryTargets: {
                                      ...(plan.categoryTargets || {}),
                                      [cat.id]: Number(e.target.value)
                                    }
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
                                <span className={`text-xs font-black inline-block ${isOverspent ? 'text-red-600' : 'text-slate-700'}`}>
                                  {percent}%
                                </span>
                              </div>
                            </div>
                            <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-slate-200">
                              <div 
                                style={{ width: `${Math.min(percent, 100)}%` }} 
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isOverspent ? 'bg-red-500' : 'bg-slate-600'}`}
                              ></div>
                            </div>
                            {isOverspent && (
                              <p className="text-[10px] text-red-500 font-bold mt-1">
                                Перерасход: {(actual - target).toLocaleString()} ₽
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
                    {financeCategories.filter((c) => c.type === 'income').map((cat) => {
                      const target = plan.categoryTargets?.[cat.id] || 0;
                      
                      const actual = finances.filter(
                        (f) =>
                          f.type === "income" &&
                          f.category === cat.name &&
                          (f.targetMonth || f.date.substring(0, 7)) === plan.month
                      ).reduce((a, b) => a + Number(b.amount || 0), 0);

                      const percent = target > 0 ? Math.min(Math.round((actual / target) * 100), 999) : (actual > 0 ? 100 : 0);
                      const isAchieved = target > 0 && actual >= target;

                      return (
                        <div key={cat.id} className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-800 text-sm truncate">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">План:</span>
                              <input 
                                type="number" 
                                value={target}
                                onChange={(e) => {
                                  setPlan({
                                    ...plan,
                                    categoryTargets: {
                                      ...(plan.categoryTargets || {}),
                                      [cat.id]: Number(e.target.value)
                                    }
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
                                <span className={`text-xs font-black inline-block ${isAchieved ? 'text-emerald-600' : 'text-slate-700'}`}>
                                  {percent}%
                                </span>
                              </div>
                            </div>
                            <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-slate-200">
                              <div 
                                style={{ width: `${Math.min(percent, 100)}%` }} 
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isAchieved ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                              ></div>
                            </div>
                            {isAchieved && (
                              <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                Перевыполнение: {(actual - target).toLocaleString()} ₽
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
          </div>
        )}

        {activeTab === "accounts" && (() => {
          const processedAccounts = accounts.map(acc => {
            const accTransactions = finances.filter(f => f.accountId === acc.id);
            const accIncomes = accTransactions.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
            const accExpenses = accTransactions.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
            const actualBalance = acc.balance + accIncomes - accExpenses;
            return { ...acc, actualBalance };
          });
          const totalBalance = processedAccounts.reduce((sum, acc) => sum + acc.actualBalance, 0);

          return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b pb-6 mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Внутренние Счета</h2>
                  <p className="text-sm text-slate-500 font-medium">Мониторинг всех касс, расчетных счетов и эквайринга</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Общий баланс</p>
                  <p className="text-4xl font-black text-emerald-600 tracking-tight">{totalBalance.toLocaleString("ru-RU")} ₽</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedAccounts.map(acc => (
                  <div key={acc.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between h-40 shadow-sm transition hover:shadow-md hover:border-slate-300 relative group">
                    <button 
                      onClick={() => deleteAccount(acc.id)} 
                      className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-800 break-words pr-8">{acc.name}</div>
                      <div className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded shadow-sm border border-emerald-200 uppercase font-extrabold tracking-wider whitespace-nowrap">
                        {acc.type === 'cash' ? 'Наличные' : acc.type === 'bank' ? 'Расч. счет' : acc.type === 'acquiring' ? 'Эквайринг' : 'Счет'}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-slate-900 tracking-tight">{acc.actualBalance.toLocaleString("ru-RU")} ₽</div>
                      <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Текущий остаток</div>
                    </div>
                  </div>
                ))}

                {/* Create New Account Form */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col justify-center h-40 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Название счета" 
                      value={newAccName}
                      onChange={e => setNewAccName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <select 
                        value={newAccType}
                        onChange={e => setNewAccType(e.target.value as any)}
                        className="w-1/2 text-xs p-2 rounded-lg border border-slate-200 font-bold outline-none focus:border-emerald-500 bg-white"
                      >
                        <option value="cash">Наличные</option>
                        <option value="bank">Р/С</option>
                        <option value="acquiring">Эквайринг</option>
                        <option value="other">Другое</option>
                      </select>
                      <button 
                        onClick={handleAddAccount}
                        className="w-1/2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition active:scale-95 flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Добавить
                      </button>
                    </div>
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
                    onChange={(e) => setNewCatExpenseType(e.target.value as "variable" | "fixed")}
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
                      btn.innerText = "Добавлено ✅";
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
      </div>
    </div>
  );
};
