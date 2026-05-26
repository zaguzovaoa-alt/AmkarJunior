import React from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, AlertOctagon, 
  ArrowUpRight, ArrowDownRight, ClipboardList, CheckSquare, Trash2
} from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const { finances, clients, overwriteFinances } = useCRM();

  // 1. Calculate dynamic statistics
  const totalIncomes = finances.filter(f => f.type === 'income').reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalExpenses = finances.filter(f => f.type === 'expense').reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const operatingProfit = totalIncomes - totalExpenses;

  // 2. Unpaid/expired student subscriptions
  const unpaidClients = (clients || []).filter(
    c => c.status === 'active' && (c.abonementStatus === 'unpaid' || c.abonementStatus === 'expired')
  );
  const totalDebts = unpaidClients.length * 4500; // Average cost of abonement 4500

  // 3. Structured expenses grouping
  const expenseRecords = finances.filter(f => f.type === 'expense');
  const groupedExpensesMap = expenseRecords.reduce((acc, f) => {
    const cat = f.category || 'Прочее';
    acc[cat] = (acc[cat] || 0) + Number(f.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const colors = ['bg-orange-500', 'bg-indigo-600', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-900', 'bg-gray-400'];
  const groupedExpenses = (Object.entries(groupedExpensesMap) as [string, number][]).map(([field, amt], idx) => {
    const amount = Number(amt);
    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
    return {
      field,
      amount,
      pct,
      col: colors[idx % colors.length]
    };
  }).sort((a, b) => Number(b.amount) - Number(a.amount));

  // 4. Monthly dynamic data for visual SVG progress line
  const monthsList = ['ДЕК 2025', 'ЯНВ 2026', 'ФЕВ 2026', 'МАР 2026', 'АПР 2026', 'МАЙ 2026'];
  const monthlyData = monthsList.map((m, idx) => {
    const monthNum = 12 + idx; // Dec(12) 2025, Jan(13)->1 2026, Feb(14)->2 2026, etc.
    const year = monthNum > 12 ? '2026' : '2025';
    const monthStr = monthNum > 12 ? String(monthNum - 12).padStart(2, '0') : '12';
    
    // Filter finances matching year-month text
    const monthFin = finances.filter(f => f.date.includes(`${year}-${monthStr}`));
    const inc = monthFin.filter(f => f.type === 'income').reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const exp = monthFin.filter(f => f.type === 'expense').reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return { month: m, income: inc, expense: exp };
  });

  const maxVal = Math.max(...monthlyData.map(d => Math.max(Number(d.income), Number(d.expense))), 10000);

  const pointsIncome = monthlyData.map((d, index) => {
    const x = 10 + (index * (480 / (monthsList.length - 1)));
    const y = 110 - (Number(d.income) / maxVal) * 90;
    return `${x},${y}`;
  });

  const pointsExpense = monthlyData.map((d, index) => {
    const x = 10 + (index * (480 / (monthsList.length - 1)));
    const y = 110 - (Number(d.expense) / maxVal) * 90;
    return `${x},${y}`;
  });

  const pathIncome = pointsIncome.length > 0 ? `M ${pointsIncome.join(' L ')}` : '';
  const pathExpense = pointsExpense.length > 0 ? `M ${pointsExpense.join(' L ')}` : '';

  // 5. Unpaid clients / dynamic debts mapping
  const dynamicDebts = unpaidClients.map((client) => {
    const amountVal = '4 500 ₽';
    const term = client.abonementStatus === 'unpaid' ? 'Просрочено 5 дней' : 'Истекла подписка';
    const color = client.abonementStatus === 'unpaid' ? 'text-orange-600' : 'text-amber-600';
    return {
      parent: client.parentName,
      child: `${client.childName} ${client.childSurname} (${client.groupName || 'Группа не назначена'})`,
      term,
      amount: amountVal,
      color
    };
  });

  // Action button to clear all finances immediately
  const handleClearFinances = async () => {
    const confirmed = window.confirm(
      'ВНИМАНИЕ! Вы действительно хотите ПОЛНОСТЬЮ удалить все финансовые транзакции из базы данных?'
    );
    if (!confirmed) return;
    try {
      await overwriteFinances([]);
      alert('Финансовые данные успешно очищены!');
    } catch (e: any) {
      alert('Ошибка при очистке финансовых данных: ' + (e.message || String(e)));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      
      {/* Header element */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">Финансы школы</h1>
          <p className="text-gray-500 text-sm">Операционная отчетность, балансовые ведомости, структура расходов и дебиторская задолженность.</p>
        </div>

        <div className="flex items-center space-x-3">
          {finances.length > 0 && (
            <button
              onClick={handleClearFinances}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
              title="Удалить все финансовые записи"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить финансы</span>
            </button>
          )}
          <div className="flex items-center space-x-2 bg-slate-100 p-2.5 rounded-xl border">
            <span className="text-xs font-bold text-slate-705 font-mono">МАЙ 2026 СЕЗОН</span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Выручка за месяц</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-display tracking-tight">
              {totalIncomes.toLocaleString('ru-RU')} ₽
            </div>
            <div className={`text-[10px] font-semibold mt-1 ${totalIncomes > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {totalIncomes > 0 ? '↑ Активные оплаты' : 'Нет начислений'}
            </div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Поступления на р/с</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-display tracking-tight">
              {totalIncomes.toLocaleString('ru-RU')} ₽
            </div>
            <div className={`text-[10px] font-semibold mt-1 ${totalIncomes > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {totalIncomes > 0 ? '100% зачислено' : 'Ожидание оплат'}
            </div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Расходы</span>
            <div className={`text-2xl font-black mt-1 font-display tracking-tight ${totalExpenses > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
              {totalExpenses.toLocaleString('ru-RU')} ₽
            </div>
            <div className={`text-[10px] font-semibold mt-1 ${totalExpenses > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {totalExpenses > 0 ? 'Расходные операции' : 'Нет расходов'}
            </div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Оперативная прибыль</span>
            <div className={`text-2xl font-black mt-1 font-display tracking-tight ${operatingProfit > 0 ? 'text-emerald-600' : operatingProfit < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {operatingProfit.toLocaleString('ru-RU')} ₽
            </div>
            <div className={`text-[10px] font-semibold mt-1 ${operatingProfit > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {operatingProfit > 0 ? 'Положительный баланс' : operatingProfit < 0? 'В дефиците' : 'Баланс нулевой'}
            </div>
          </div>
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm text-left col-span-2 lg:col-span-1">
            <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider font-mono">Долги/Задолженность</span>
            <div className={`text-2xl font-black mt-1 font-display tracking-tight ${totalDebts > 0 ? 'text-amber-500' : 'text-slate-900'}`}>
              {totalDebts.toLocaleString('ru-RU')} ₽
            </div>
            <div className={`text-[10px] font-semibold mt-1 ${totalDebts > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {totalDebts > 0 ? `Просрочено оплат: ${unpaidClients.length}` : 'Все абонементы оплачены ✅_'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1 & 2: Revenue dynamics and ledger */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Динамика доходов и расходов */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex border-b pb-3 items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm">Динамика доходов и расходов</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Сравнительный тайм-лайн за последние 6 месяцев (руб)</p>
                </div>
                <div className="flex space-x-3 text-[10px] font-bold">
                  <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-700">Доходы</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span className="text-slate-700">Расходы</span></span>
                </div>
              </div>

              {/* Visually outstanding SVG charts illustrating line progress */}
              <div className="h-44 pt-4 px-2 w-full select-none">
                {finances.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 italic">
                    Тренды отсутствуют: нет финансовых записей за полугодие.
                  </div>
                ) : (
                  <>
                    <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      
                      {/* Income path */}
                      {pathIncome && (
                        <path d={pathIncome} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                      )}
                      {monthlyData.map((d, index) => {
                        if (d.income === 0) return null;
                        const x = 10 + (index * (480 / (monthsList.length - 1)));
                        const y = 110 - (d.income / maxVal) * 90;
                        return <circle key={`inc-${index}`} cx={x} cy={y} r="4.5" fill="#10b981" />;
                      })}
                      
                      {/* Expenses path */}
                      {pathExpense && (
                        <path d={pathExpense} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                      )}
                      {monthlyData.map((d, index) => {
                        if (d.expense === 0) return null;
                        const x = 10 + (index * (480 / (monthsList.length - 1)));
                        const y = 110 - (d.expense / maxVal) * 90;
                        return <circle key={`exp-${index}`} cx={x} cy={y} r="4.5" fill="#f97316" />;
                      })}
                    </svg>
                    
                    <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-2 font-mono px-1">
                      {monthsList.map((m, id) => (
                        <span key={id}>{m}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Последние операции - Ledger */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-950 text-sm text-left">Кассовая книга последних операций</h3>
              
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {finances.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-400 italic bg-slate-50 border border-dashed rounded-xl">
                    Кассовая книга пуста. Импортируйте финансовые данные во вкладке "Массовый импорт" директора.
                  </div>
                ) : (
                  [...finances].sort((a, b) => b.date.localeCompare(a.date)).map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs hover:shadow-2xs transition">
                      <div className="flex items-center space-x-3 text-left">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.description || item.category}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{item.date} • {item.category} {item.groupName ? `(${item.groupName})` : ''}</div>
                        </div>
                      </div>
                      
                      <span className={`font-mono font-black text-sm whitespace-nowrap ${
                        item.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} ₽
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* COLUMN 3: Expense structured Breakdown and Debts list */}
          <div className="space-y-6">
            
            {/* Структура расходов */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
              <div className="border-b pb-3">
                <h3 className="font-extrabold text-slate-950 text-sm">Структура расходов за месяц</h3>
                <p className="text-[10px] text-gray-400">Суммарно израсходовано: {totalExpenses.toLocaleString()} руб.</p>
              </div>

              {/* Progress bars */}
              <div className="space-y-3.5 text-xs">
                {groupedExpenses.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 italic">
                    Расходные транзакции отсутствуют за этот период.
                  </div>
                ) : (
                  groupedExpenses.map((exp, id) => (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                        <span>{exp.field}</span>
                        <span className="font-mono text-slate-900">{exp.amount.toLocaleString()} ₽ ({exp.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`${exp.col} h-full rounded-full`} style={{ width: `${exp.pct}%` }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Дебиторская задолженность */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-extrabold text-slate-950 text-sm">Дебиторская задолженность</h3>
                <span className="px-2 py-0.5 rounded text-[9px] bg-orange-100 text-orange-850 font-bold">Контроль</span>
              </div>

              <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-1">
                {dynamicDebts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-emerald-600 italic font-medium bg-emerald-50/40 border border-emerald-100 rounded-xl">
                    Задолженностей по оплате абонементов не обнаружено! 👍
                  </div>
                ) : (
                  dynamicDebts.map((debt, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border rounded-xl flex items-center justify-between hover:shadow-3xs transition">
                      <div className="text-left space-y-0.5 pr-2">
                        <div className="font-bold text-slate-805 truncate text-xs">{debt.parent}</div>
                        <p className="text-[10px] text-gray-405 truncate font-medium">{debt.child}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black font-mono text-slate-900">{debt.amount}</div>
                        <span className={`text-[9px] font-bold font-mono tracking-tight ${debt.color}`}>{debt.term}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
