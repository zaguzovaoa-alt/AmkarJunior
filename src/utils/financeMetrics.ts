import {
  Account,
  Client,
  CRMConfig,
  FinanceCategory,
  FinanceRecord,
  FinancialPlan,
} from "../types";

export const INTERNAL_TRANSFER_CATEGORY = "Перевод между счетами";

export const isInternalTransfer = (f: FinanceRecord): boolean => {
  return f.category === INTERNAL_TRANSFER_CATEGORY;
};

export const isUnpaidAccrual = (f: FinanceRecord): boolean => {
  return f.paymentStatus === "accrued";
};

/**
 * Canonical Cash Flow (ДДС) filter:
 * Excludes internal transfers between own accounts AND unpaid accruals ("Начислено / К оплате").
 */
export const isCashFlowRecord = (f: FinanceRecord): boolean => {
  return !isInternalTransfer(f) && !isUnpaidAccrual(f);
};

export const getRecordAccrualMonth = (f: FinanceRecord): string => {
  return f.targetMonth || (f.date ? f.date.substring(0, 7) : "");
};

export const getRecordCashMonth = (f: FinanceRecord): string => {
  return f.date ? f.date.substring(0, 7) : "";
};

export const calcSubscriptionsPlanRevenue = (plan?: FinancialPlan | null): number => {
  if (!plan) return 0;
  return (
    ((plan.renew12Count || 0) + (plan.new12Count || 0)) * (plan.price12 || 0) +
    ((plan.renew8Count || 0) + (plan.new8Count || 0)) * (plan.price8 || 0) +
    ((plan.renew4Count || 0) + (plan.new4Count || 0)) * (plan.price4 || 0)
  );
};

export const calcCategoryIncomePlanTotal = (
  plan: FinancialPlan | undefined | null,
  financeCategories: FinanceCategory[],
): number => {
  if (!plan?.categoryTargets) return 0;
  return financeCategories
    .filter((c) => c.type === "income")
    .reduce((sum, cat) => sum + Number(plan.categoryTargets?.[cat.id] || 0), 0);
};

export const calcCategoryExpensePlanTotal = (
  plan: FinancialPlan | undefined | null,
  financeCategories: FinanceCategory[],
): number => {
  if (!plan?.categoryTargets) return 0;
  return financeCategories
    .filter((c) => c.type === "expense")
    .reduce((sum, cat) => sum + Number(plan.categoryTargets?.[cat.id] || 0), 0);
};

export type RevenueGoalSource =
  | "explicit_plan"
  | "category_targets"
  | "subscriptions_plan"
  | "default_config";

export interface EffectiveRevenueGoalResult {
  goal: number;
  source: RevenueGoalSource;
  sourceLabel: string;
  categoryTargetsTotal: number;
  subscriptionsPlanTotal: number;
}

/**
 * Single source of truth for Monthly Revenue Goal across Director Dashboard & Finance Module.
 * Priority:
 * 1. Explicit monthly plan goal (plan.revenueGoal > 0)
 * 2. Sum of income category targets for that month (categoryTargets)
 * 3. Subscription unit-economics forecast (planRevenue)
 * 4. Global CRM default revenue goal (crmConfig.targetRevenueGoal / fallback)
 */
export const getEffectiveRevenueGoal = (
  month: string,
  financialPlans: FinancialPlan[],
  financeCategories: FinanceCategory[],
  crmConfig?: CRMConfig,
  fallbackGoal = 600000,
): EffectiveRevenueGoalResult => {
  const monthPlan = financialPlans.find((p) => p.month === month);
  const categoryTargetsTotal = calcCategoryIncomePlanTotal(monthPlan, financeCategories);
  const subscriptionsPlanTotal = calcSubscriptionsPlanRevenue(monthPlan);

  if (monthPlan && Number(monthPlan.revenueGoal || 0) > 0) {
    return {
      goal: Number(monthPlan.revenueGoal),
      source: "explicit_plan",
      sourceLabel: "Финплан месяца",
      categoryTargetsTotal,
      subscriptionsPlanTotal,
    };
  }

  if (categoryTargetsTotal > 0) {
    return {
      goal: categoryTargetsTotal,
      source: "category_targets",
      sourceLabel: "План по категориям",
      categoryTargetsTotal,
      subscriptionsPlanTotal,
    };
  }

  if (subscriptionsPlanTotal > 0) {
    return {
      goal: subscriptionsPlanTotal,
      source: "subscriptions_plan",
      sourceLabel: "Прогноз абонементов",
      categoryTargetsTotal,
      subscriptionsPlanTotal,
    };
  }

  const defaultVal =
    Number(crmConfig?.targetRevenueGoal || 0) > 0
      ? Number(crmConfig?.targetRevenueGoal)
      : fallbackGoal;

  return {
    goal: defaultVal,
    source: "default_config",
    sourceLabel: "Базовая цель клуба",
    categoryTargetsTotal,
    subscriptionsPlanTotal,
  };
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatISODate = (d: Date): string => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/**
 * Computes the exact previous period for period-over-period % comparison.
 * - Full calendar month -> previous full calendar month
 * - Custom range of N days -> immediately preceding N-day range
 */
export const getPreviousPeriodRange = (
  startDate: string,
  endDate: string,
): { prevStartDate: string; prevEndDate: string } => {
  if (!startDate || !endDate) {
    return { prevStartDate: startDate, prevEndDate: endDate };
  }
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  const isStartFirstOfMonth = start.getDate() === 1;
  const lastDayOfEndMonth = new Date(
    end.getFullYear(),
    end.getMonth() + 1,
    0,
  ).getDate();
  const isEndLastOfMonth = end.getDate() === lastDayOfEndMonth;

  if (
    isStartFirstOfMonth &&
    isEndLastOfMonth &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
    return {
      prevStartDate: formatISODate(prevStart),
      prevEndDate: formatISODate(prevEnd),
    };
  }

  const diffDays = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays);

  return {
    prevStartDate: formatISODate(prevStart),
    prevEndDate: formatISODate(prevEnd),
  };
};

export interface DeltaDisplay {
  text: string;
  pct: number | null;
  direction: "up" | "down" | "flat" | "none";
}

export const calculatePercentDelta = (
  current: number,
  previous: number,
): DeltaDisplay => {
  if (previous === 0) {
    if (current === 0) {
      return { text: "0%", pct: 0, direction: "flat" };
    }
    return {
      text: current > 0 ? "новый рост" : "новый расход",
      pct: null,
      direction: current > 0 ? "up" : "down",
    };
  }
  const pct = Math.round(((current - previous) / Math.abs(previous)) * 100);
  if (pct === 0) {
    return { text: "0%", pct: 0, direction: "flat" };
  }
  return {
    text: `${pct > 0 ? "+" : ""}${pct}%`,
    pct,
    direction: pct > 0 ? "up" : "down",
  };
};

/**
 * Computes client debts using actual CRM Russian statuses & CRM tariff prices.
 */
export const calculateClientDebts = (
  clients: Client[],
  crmConfig?: CRMConfig,
): { debtors: Client[]; totalDebt: number } => {
  const debtors = (clients || []).filter(
    (c) =>
      c.status !== "completed" &&
      (c.abonementStatus === "Не оплачено" ||
        c.abonementStatus === "Ожидает оплаты" ||
        (c.bonusBalance !== undefined && c.bonusBalance < 0) ||
        Number((c as any).debtAmount || 0) > 0),
  );

  const p12 = crmConfig?.price12 || 12000;
  const p8 = crmConfig?.price8 || 8000;
  const p4 = crmConfig?.price4 || 4500;
  const p1 = crmConfig?.price1 || 1000;

  const totalDebt = debtors.reduce((sum, c) => {
    const explicitDebt = Number((c as any).debtAmount || 0);
    if (explicitDebt > 0) return sum + explicitDebt;
    if (
      c.abonementStatus !== "Не оплачено" &&
      c.abonementStatus !== "Ожидает оплаты" &&
      c.bonusBalance &&
      c.bonusBalance < 0
    ) {
      return sum + Math.abs(c.bonusBalance);
    }
    const abCost =
      c.abonement === "12_sessions"
        ? p12
        : c.abonement === "8_sessions"
          ? p8
          : c.abonement === "4_sessions"
            ? p4
            : c.abonement === "1_session"
              ? p1
              : p4;
    return sum + abCost;
  }, 0);

  return { debtors, totalDebt };
};

export interface DailyCashBalancePoint {
  date: string;
  label: string;
  Остаток: number;
  Приходы: number;
  Расходы: number;
}

/**
 * Builds true cumulative daily cash balance series for the selected ДДС period.
 * - Opening balance at startDate = sum(initial account balances) + net paid account transactions before startDate.
 * - Daily running balance reflects exact account cash movement (so final point matches actual liquid balance at endDate).
 * - Daily Приходы / Расходы exclude internal transfers & unpaid accruals.
 */
export const buildDailyCashBalanceSeries = (
  accounts: Account[],
  finances: FinanceRecord[],
  startDate: string,
  endDate: string,
): DailyCashBalancePoint[] => {
  if (!startDate || !endDate || startDate > endDate) return [];

  const accountIds = new Set(accounts.map((a) => a.id));
  const baseBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0,
  );

  let runningBalance = baseBalance;
  const dailyMap = new Map<
    string,
    { accountDelta: number; income: number; expense: number }
  >();

  let latestTxDateInPeriod = startDate;

  finances.forEach((f) => {
    if (!f.date || isUnpaidAccrual(f)) return;
    const amt = Number(f.amount || 0);
    const affectsAccount = Boolean(f.accountId && accountIds.has(f.accountId));
    const isExternal = !isInternalTransfer(f);

    if (f.date < startDate) {
      if (affectsAccount) {
        if (f.type === "income") runningBalance += amt;
        else if (f.type === "expense") runningBalance -= amt;
      }
      return;
    }

    if (f.date >= startDate && f.date <= endDate) {
      if (f.date > latestTxDateInPeriod) {
        latestTxDateInPeriod = f.date;
      }
      if (!dailyMap.has(f.date)) {
        dailyMap.set(f.date, { accountDelta: 0, income: 0, expense: 0 });
      }
      const bucket = dailyMap.get(f.date)!;
      if (affectsAccount) {
        if (f.type === "income") bucket.accountDelta += amt;
        else if (f.type === "expense") bucket.accountDelta -= amt;
      }
      if (isExternal) {
        if (f.type === "income") bucket.income += amt;
        else if (f.type === "expense") bucket.expense += amt;
      }
    }
  });

  const todayISO = formatISODate(new Date());
  // Cap future empty days at today (unless there are recorded future-dated transactions in range)
  const effectiveEndISO =
    endDate > todayISO
      ? latestTxDateInPeriod > todayISO
        ? latestTxDateInPeriod
        : todayISO >= startDate
          ? todayISO
          : endDate
      : endDate;

  const startD = parseISODate(startDate);
  const endD = parseISODate(effectiveEndISO);
  const totalDays = Math.max(
    1,
    Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  // Build full daily series first
  const fullSeries: DailyCashBalancePoint[] = [];
  const cursor = new Date(startD);
  while (cursor <= endD) {
    const iso = formatISODate(cursor);
    const bucket = dailyMap.get(iso);
    if (bucket) {
      runningBalance += bucket.accountDelta;
    }
    fullSeries.push({
      date: iso,
      label: `${pad2(cursor.getDate())}.${pad2(cursor.getMonth() + 1)}`,
      Остаток: Math.round(runningBalance),
      Приходы: Math.round(bucket?.income || 0),
      Расходы: Math.round(bucket?.expense || 0),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // If the range is very long (> 62 days), aggregate cleanly by week while keeping ending balance accurate
  if (totalDays > 62) {
    const sampled: DailyCashBalancePoint[] = [];
    for (let i = 0; i < fullSeries.length; i += 7) {
      const chunk = fullSeries.slice(i, i + 7);
      const last = chunk[chunk.length - 1];
      sampled.push({
        date: last.date,
        label: last.label,
        Остаток: last.Остаток,
        Приходы: chunk.reduce((s, p) => s + p.Приходы, 0),
        Расходы: chunk.reduce((s, p) => s + p.Расходы, 0),
      });
    }
    return sampled;
  }

  return fullSeries;
};
