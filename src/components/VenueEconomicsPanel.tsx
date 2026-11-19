import React, { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Account,
  Client,
  Counterparty,
  FinanceRecord,
  TrainingGroup,
} from "../types";

interface VenueEconomicsPanelProps {
  finances: FinanceRecord[];
  counterparties: Counterparty[];
  groups: TrainingGroup[];
  clients: Client[];
  accounts: Account[];
  rentMonth: string;
  rentDateMode: "month" | "half1" | "half2" | "period";
  rentStartDate: string;
  rentEndDate: string;
  currentMonthStr: string;
}

interface VenueEconomicsRow {
  venueId: string;
  venueName: string;
  paymentType: "fixed" | "per_session";
  monthlyRate: number;
  attachedGroups: string[];
  subrentIncome: number;
  groupIncome: number;
  individualIncome: number;
  totalIncome: number;
  rentAccrued: number;
  rentPaid: number;
  otherExpenses: number;
  totalCashExpenses: number;
  totalPnlExpenses: number;
  records: {
    record: FinanceRecord;
    bucket:
      | "subrent"
      | "individual"
      | "group"
      | "rent_paid"
      | "rent_accrued"
      | "other_expense";
  }[];
}

function isTransferRecord(f: FinanceRecord): boolean {
  const catLower = (f.category || "").toLowerCase();
  return (
    Boolean((f as any).isTransfer) ||
    catLower.includes("перевод между счетами") ||
    catLower === "перевод"
  );
}

function isSubrentIncome(f: FinanceRecord): boolean {
  if (f.type !== "income") return false;
  const catLower = (f.category || "").toLowerCase();
  const descLower = (f.description || "").toLowerCase();
  return (
    f.category === "Сдача площадок в аренду" ||
    catLower.includes("сдача площад") ||
    catLower.includes("субаренд") ||
    descLower.includes("сдача площадки в аренду")
  );
}

function isIndividualIncome(f: FinanceRecord): boolean {
  if (f.type !== "income") return false;
  const catLower = (f.category || "").toLowerCase();
  const descLower = (f.description || "").toLowerCase();
  return (
    catLower.includes("индивидуал") || descLower.includes("индивидуал")
  );
}

const BUCKET_LABELS: Record<
  VenueEconomicsRow["records"][number]["bucket"],
  string
> = {
  subrent: "Субаренда",
  individual: "Индивидуальные",
  group: "Группы / Абонементы",
  rent_paid: "Оплата аренды",
  rent_accrued: "Начислено аренды",
  other_expense: "Прочий расход",
};

export const VenueEconomicsPanel: React.FC<VenueEconomicsPanelProps> = ({
  finances,
  counterparties,
  groups,
  clients,
  accounts,
  rentMonth,
  rentDateMode,
  rentStartDate,
  rentEndDate,
  currentMonthStr,
}) => {
  const [accountingMode, setAccountingMode] = useState<"pnl" | "cash">("pnl");
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);

  const accountNameMap = useMemo(
    () => new Map<string, string>(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const rows = useMemo<VenueEconomicsRow[]>(() => {
    const venueCounterparties = counterparties.filter(
      (cp) => cp.type === "school_rent" || cp.type === "hall_rent",
    );
    const venueById = new Map<string, Counterparty>(
      venueCounterparties.map((cp) => [cp.id, cp]),
    );

    // Map normalized group name -> venueId
    const groupNameToVenueId = new Map<string, string>();
    const groupsByVenueId = new Map<string, string[]>();
    for (const g of groups) {
      if (g.venueId && venueById.has(g.venueId)) {
        const key = (g.name || "").trim().toLowerCase();
        if (key) groupNameToVenueId.set(key, g.venueId);
        const list = groupsByVenueId.get(g.venueId) || [];
        if (g.name && !list.includes(g.name)) list.push(g.name);
        groupsByVenueId.set(g.venueId, list);
      }
    }

    // Map clientId -> venueId via their group
    const clientIdToVenueId = new Map<string, string>();
    for (const c of clients) {
      const gKey = (c.groupName || "").trim().toLowerCase();
      const vId = gKey ? groupNameToVenueId.get(gKey) : undefined;
      if (vId) clientIdToVenueId.set(c.id, vId);
    }

    const rowMap = new Map<string, VenueEconomicsRow>();

    // Seed all known venue counterparties
    for (const cp of venueCounterparties) {
      let baseFixedAccrued = 0;
      if (cp.paymentType === "fixed") {
        baseFixedAccrued = Number(cp.rate || 0);
        if (rentDateMode === "half1" || rentDateMode === "half2") {
          baseFixedAccrued = Math.round(baseFixedAccrued / 2);
        }
      }

      rowMap.set(cp.id, {
        venueId: cp.id,
        venueName: cp.name,
        paymentType: cp.paymentType || "per_session",
        monthlyRate: Number(cp.rate || 0),
        attachedGroups: groupsByVenueId.get(cp.id) || [],
        subrentIncome: 0,
        groupIncome: 0,
        individualIncome: 0,
        totalIncome: 0,
        rentAccrued: baseFixedAccrued,
        rentPaid: 0,
        otherExpenses: 0,
        totalCashExpenses: 0,
        totalPnlExpenses: 0,
        records: [],
      });
    }

    const isInPeriod = (f: FinanceRecord): boolean => {
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
      const recordMonth = f.targetMonth || (f.date || "").substring(0, 7);
      return recordMonth === rentMonth;
    };

    const resolveVenueId = (f: FinanceRecord): string | null => {
      // 1. Direct counterpartyId match to a venue
      if (f.counterpartyId && venueById.has(f.counterpartyId)) {
        return f.counterpartyId;
      }
      // 2. Group link (for incomes tied to a group like "Детские сады")
      if (f.groupName) {
        const vId = groupNameToVenueId.get(f.groupName.trim().toLowerCase());
        if (vId) return vId;
      }
      // 3. Client's group fallback (for incomes tied to a client without explicit groupName)
      if (f.type === "income" && f.clientId) {
        const vId = clientIdToVenueId.get(f.clientId);
        if (vId) return vId;
      }
      // 4. Explicit venue name in description
      if (f.description) {
        const descLower = f.description.toLowerCase();
        for (const cp of venueCounterparties) {
          const cpNameLower = cp.name.trim().toLowerCase();
          if (cpNameLower.length >= 3 && descLower.includes(cpNameLower)) {
            return cp.id;
          }
        }
      }
      return null;
    };

    for (const f of finances) {
      if (isTransferRecord(f)) continue;
      if (!isInPeriod(f)) continue;

      const venueId = resolveVenueId(f);
      if (!venueId) continue;

      const row = rowMap.get(venueId);
      if (!row) continue;

      const amt = Number(f.amount || 0);
      if (f.type === "income") {
        if (isSubrentIncome(f)) {
          row.subrentIncome += amt;
          row.records.push({ record: f, bucket: "subrent" });
        } else if (isIndividualIncome(f)) {
          row.individualIncome += amt;
          row.records.push({ record: f, bucket: "individual" });
        } else {
          row.groupIncome += amt;
          row.records.push({ record: f, bucket: "group" });
        }
      } else if (f.type === "expense") {
        const isRentCat =
          f.category === "Аренда" ||
          (f.category || "").toLowerCase().includes("аренд");
        const isSubscRefund = (f.description || "")
          .toLowerCase()
          .includes("абонемент");

        if (isRentCat && !isSubscRefund) {
          if (f.paymentStatus === "accrued") {
            if (row.paymentType !== "fixed") {
              row.rentAccrued += amt;
            }
            row.records.push({ record: f, bucket: "rent_accrued" });
          } else {
            row.rentPaid += amt;
            row.records.push({ record: f, bucket: "rent_paid" });
          }
        } else if (f.counterpartyId === venueId) {
          // Only attribute non-rent expenses to a venue when explicitly linked via counterpartyId
          row.otherExpenses += amt;
          row.records.push({ record: f, bucket: "other_expense" });
        }
      }
    }

    const result = Array.from(rowMap.values()).map((r) => {
      const totalIncome = r.subrentIncome + r.groupIncome + r.individualIncome;
      const totalCashExpenses = r.rentPaid + r.otherExpenses;
      const effectiveRentForPnl = Math.max(r.rentAccrued, r.rentPaid);
      const totalPnlExpenses = effectiveRentForPnl + r.otherExpenses;

      r.records.sort((a, b) =>
        (b.record.date || "").localeCompare(a.record.date || ""),
      );

      return {
        ...r,
        totalIncome,
        totalCashExpenses,
        totalPnlExpenses,
      };
    });

    return result.sort(
      (a, b) =>
        b.totalIncome +
        b.totalPnlExpenses -
        (a.totalIncome + a.totalPnlExpenses),
    );
  }, [
    finances,
    counterparties,
    groups,
    clients,
    rentMonth,
    rentDateMode,
    rentStartDate,
    rentEndDate,
    currentMonthStr,
  ]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const exp =
          accountingMode === "pnl" ? r.totalPnlExpenses : r.totalCashExpenses;
        acc.subrent += r.subrentIncome;
        acc.group += r.groupIncome;
        acc.individual += r.individualIncome;
        acc.income += r.totalIncome;
        acc.expenses += exp;
        acc.profit += r.totalIncome - exp;
        return acc;
      },
      { subrent: 0, group: 0, individual: 0, income: 0, expenses: 0, profit: 0 },
    );
  }, [rows, accountingMode]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden text-left">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-950 tracking-tight">
              Экономика по объектам (площадкам)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Сводная прибыль по каждой площадке: субаренда + группы объекта +
            индивидуальные тренировки − аренда и расходы объекта. Нажмите на
            строку для детализации.
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setAccountingMode("pnl")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              accountingMode === "pnl"
                ? "bg-white text-slate-950 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            С учётом начисленной аренды
          </button>
          <button
            type="button"
            onClick={() => setAccountingMode("cash")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              accountingMode === "cash"
                ? "bg-white text-slate-950 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            По факту оплат (ДДС)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[860px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
              <th className="py-3 pl-5 pr-3">Площадка / Объект</th>
              <th className="py-3 px-3 text-right">Субаренда</th>
              <th className="py-3 px-3 text-right">Группы / Абонементы</th>
              <th className="py-3 px-3 text-right">Индивидуальные</th>
              <th className="py-3 px-3 text-right">Всего доход</th>
              <th className="py-3 px-3 text-right">Расходы объекта</th>
              <th className="py-3 pl-3 pr-5 text-right">Прибыль объекта</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const expenses =
                accountingMode === "pnl"
                  ? r.totalPnlExpenses
                  : r.totalCashExpenses;
              const profit = r.totalIncome - expenses;
              const coveragePct =
                expenses > 0 ? Math.round((r.totalIncome / expenses) * 100) : null;
              const isExpanded = expandedVenueId === r.venueId;

              return (
                <React.Fragment key={r.venueId}>
                  <tr
                    onClick={() =>
                      setExpandedVenueId(isExpanded ? null : r.venueId)
                    }
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3.5 pl-5 pr-3 align-middle">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">
                            {r.venueName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[260px]">
                            {r.attachedGroups.length > 0
                              ? `Группы: ${r.attachedGroups.join(", ")}`
                              : "Группы не привязаны"}
                            {" · "}
                            {r.paymentType === "fixed"
                              ? "Фикс/мес"
                              : "Сдельная"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {r.subrentIncome > 0
                        ? `+${r.subrentIncome.toLocaleString("ru-RU")} ₽`
                        : "0 ₽"}
                    </td>

                    <td className="py-3.5 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {r.groupIncome > 0
                        ? `+${r.groupIncome.toLocaleString("ru-RU")} ₽`
                        : "0 ₽"}
                    </td>

                    <td className="py-3.5 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {r.individualIncome > 0
                        ? `+${r.individualIncome.toLocaleString("ru-RU")} ₽`
                        : "0 ₽"}
                    </td>

                    <td className="py-3.5 px-3 text-right tabular-nums font-bold text-emerald-700">
                      {r.totalIncome > 0
                        ? `+${r.totalIncome.toLocaleString("ru-RU")} ₽`
                        : "0 ₽"}
                    </td>

                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <div className="font-semibold text-slate-900">
                        {expenses > 0
                          ? `−${expenses.toLocaleString("ru-RU")} ₽`
                          : "0 ₽"}
                      </div>
                      {r.rentAccrued > 0 && r.rentPaid !== r.rentAccrued && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          оплачено {r.rentPaid.toLocaleString("ru-RU")} из{" "}
                          {r.rentAccrued.toLocaleString("ru-RU")} ₽
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 pl-3 pr-5 text-right tabular-nums">
                      <div
                        className={`font-bold ${
                          profit > 0
                            ? "text-emerald-700"
                            : profit < 0
                              ? "text-red-600"
                              : "text-slate-700"
                        }`}
                      >
                        {profit > 0 ? "+" : ""}
                        {profit.toLocaleString("ru-RU")} ₽
                      </div>
                      {coveragePct !== null && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          окупаемость {coveragePct}%
                        </div>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-slate-800">
                              Операции по объекту «{r.venueName}» (
                              {r.records.length})
                            </span>
                            {r.attachedGroups.length > 0 && (
                              <span className="text-[11px] text-slate-500">
                                Привязанные группы: {r.attachedGroups.join(", ")}
                              </span>
                            )}
                          </div>

                          {r.records.length === 0 ? (
                            <div className="text-xs text-slate-500 py-3">
                              За выбранный период по этому объекту ещё не
                              зафиксировано операций.
                            </div>
                          ) : (
                            <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500">
                                    <th className="py-2 pl-3 pr-2">Дата</th>
                                    <th className="py-2 px-2">Источник</th>
                                    <th className="py-2 px-2">Статья</th>
                                    <th className="py-2 px-2">
                                      Описание / Группа / Игрок
                                    </th>
                                    <th className="py-2 px-2">Счёт</th>
                                    <th className="py-2 pl-2 pr-3 text-right">
                                      Сумма
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {r.records.map(({ record, bucket }) => {
                                    const isInc = record.type === "income";
                                    const accName = record.accountId
                                      ? accountNameMap.get(record.accountId) ||
                                        record.accountId
                                      : "—";
                                    return (
                                      <tr
                                        key={record.id}
                                        className="hover:bg-slate-50/60"
                                      >
                                        <td className="py-2 pl-3 pr-2 tabular-nums text-slate-500 whitespace-nowrap">
                                          {record.date
                                            ? record.date
                                                .split("-")
                                                .reverse()
                                                .join(".")
                                            : "—"}
                                        </td>
                                        <td className="py-2 px-2 whitespace-nowrap font-medium text-slate-700">
                                          {BUCKET_LABELS[bucket]}
                                        </td>
                                        <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                                          {record.category}
                                        </td>
                                        <td className="py-2 px-2 text-slate-700 max-w-[320px] truncate">
                                          {record.description || "—"}
                                          {record.groupName &&
                                            !(record.description || "").includes(
                                              record.groupName,
                                            ) && (
                                              <span className="text-slate-400">
                                                {" "}
                                                · {record.groupName}
                                              </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                                          {record.paymentStatus === "accrued"
                                            ? "Начисление"
                                            : accName}
                                        </td>
                                        <td
                                          className={`py-2 pl-2 pr-3 text-right tabular-nums font-bold whitespace-nowrap ${
                                            isInc
                                              ? "text-emerald-700"
                                              : record.paymentStatus ===
                                                  "accrued"
                                                ? "text-amber-700"
                                                : "text-red-600"
                                          }`}
                                        >
                                          {isInc ? "+" : "−"}
                                          {Number(
                                            record.amount || 0,
                                          ).toLocaleString("ru-RU")}{" "}
                                          ₽
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900 tabular-nums">
              <td className="py-3 pl-5 pr-3">Итого по всем объектам</td>
              <td className="py-3 px-3 text-right">
                {totals.subrent > 0
                  ? `+${totals.subrent.toLocaleString("ru-RU")} ₽`
                  : "0 ₽"}
              </td>
              <td className="py-3 px-3 text-right">
                {totals.group > 0
                  ? `+${totals.group.toLocaleString("ru-RU")} ₽`
                  : "0 ₽"}
              </td>
              <td className="py-3 px-3 text-right">
                {totals.individual > 0
                  ? `+${totals.individual.toLocaleString("ru-RU")} ₽`
                  : "0 ₽"}
              </td>
              <td className="py-3 px-3 text-right text-emerald-700">
                {totals.income > 0
                  ? `+${totals.income.toLocaleString("ru-RU")} ₽`
                  : "0 ₽"}
              </td>
              <td className="py-3 px-3 text-right">
                {totals.expenses > 0
                  ? `−${totals.expenses.toLocaleString("ru-RU")} ₽`
                  : "0 ₽"}
              </td>
              <td
                className={`py-3 pl-3 pr-5 text-right ${
                  totals.profit > 0
                    ? "text-emerald-700"
                    : totals.profit < 0
                      ? "text-red-600"
                      : "text-slate-900"
                }`}
              >
                {totals.profit > 0 ? "+" : ""}
                {totals.profit.toLocaleString("ru-RU")} ₽
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
