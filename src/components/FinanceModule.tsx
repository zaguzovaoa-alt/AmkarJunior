import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, AlertOctagon, 
  ArrowUpRight, ArrowDownRight, ClipboardList, CheckSquare, Trash2,
  Plus, Settings, PieChart, FileText, BarChart
} from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const { 
    finances, clients, groups, overwriteFinances,
    financeCategories, addFinanceCategory, deleteFinanceCategory,
    addFinanceRecord, updateFinancialPlan, financialPlans, deleteFinanceRecord,
    crmConfig, updateCRMConfig
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'cashflow' | 'pnl' | 'directories' | 'plan'>('dashboard');

  // Dashboard Logic
  const totalIncomes = finances.filter(f => f.type === 'income').reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalExpenses = finances.filter(f => f.type === 'expense').reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const operatingProfit = totalIncomes - totalExpenses;
  const unpaidClients = (clients || []).filter(
    c => c.status === 'active' && (c.abonementStatus === 'unpaid' || c.abonementStatus === 'expired')
  );
  const totalDebts = unpaidClients.length * 4500;

  const currentMonthStr = new Date().toISOString().substring(0, 7);

  // States for input form
  const [fType, setFType] = useState<'income'|'expense'>('income');
  const [fAmount, setFAmount] = useState('');
  const [fCat, setFCat] = useState('');
  const [fTargetMonth, setFTargetMonth] = useState(currentMonthStr);
  const [fDesc, setFDesc] = useState('');

  const [addSuccessMsg, setAddSuccessMsg] = useState('');

  const handleAddFinance = () => {
    if (!fAmount || !fCat) {
      setAddSuccessMsg('Введите сумму и категорию');
      setTimeout(() => setAddSuccessMsg(''), 3000);
      return;
    }
    addFinanceRecord({
      type: fType,
      amount: Number(fAmount),
      category: financeCategories.find(c => c.id === fCat)?.name || fCat,
      date: new Date().toISOString().substring(0, 10),
      description: fDesc,
      targetMonth: fTargetMonth
    });
    setFAmount(''); setFDesc('');
    setAddSuccessMsg('Запись добавлена!');
    setTimeout(() => setAddSuccessMsg(''), 3000);
  };

  // Directories State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income'|'expense'>('expense');

  const handleAddCat = () => {
    if (!newCatName) return;
    addFinanceCategory({ name: newCatName, type: newCatType });
    setNewCatName('');
  };

  // Plan State
  const activePlan = financialPlans.find(p => p.month === currentMonthStr) || {
    month: currentMonthStr,
    renew12Count: 0, renew8Count: 0, renew4Count: 0,
    new12Count: 0, new8Count: 0, new4Count: 0,
    price12: crmConfig.price12, price8: crmConfig.price8, price4: crmConfig.price4
  };
  const [plan, setPlan] = useState<typeof activePlan>(activePlan);

  React.useEffect(() => {
    const current = financialPlans.find(p => p.month === currentMonthStr);
    if (current) {
      setPlan(current);
    } else {
      setPlan({
        month: currentMonthStr,
        renew12Count: 0, renew8Count: 0, renew4Count: 0,
        new12Count: 0, new8Count: 0, new4Count: 0,
        price12: crmConfig.price12, price8: crmConfig.price8, price4: crmConfig.price4
      });
    }
  }, [financialPlans, currentMonthStr]);

  const savePlan = () => {
    updateFinancialPlan(plan);
    const btn = document.getElementById('savePlanBtn');
    if (btn) {
      btn.innerText = 'План сохранен ✅';
      setTimeout(() => { btn.innerText = 'Зафиксировать KPI план'; }, 2000);
    }
  };

  const planRevenue = (plan.renew12Count + plan.new12Count) * plan.price12 +
                      (plan.renew8Count + plan.new8Count) * plan.price8 +
                      (plan.renew4Count + plan.new4Count) * plan.price4;
  
  const planCount = plan.renew12Count + plan.renew8Count + plan.renew4Count + plan.new12Count + plan.new8Count + plan.new4Count;
  const avgCheck = planCount > 0 ? planRevenue / planCount : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">Управленческий учет и финансы</h1>
            <p className="text-gray-500 text-sm">Ввод операций, P&L, финансовое планирование абонементов.</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl flex-wrap">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >Дашборд</button>
            <button
              onClick={() => setActiveTab('input')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'input' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >ОперВвод</button>
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'cashflow' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >ОДДС</button>
            <button
              onClick={() => setActiveTab('pnl')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'pnl' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >P&L</button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'plan' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >ФинПлан</button>
            <button
              onClick={() => setActiveTab('directories')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'directories' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >Справочники</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-gray-400 font-bold text-xs uppercase">Выручка (All Time)</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{totalIncomes.toLocaleString()} ₽</div>
             </div>
             <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-gray-400 font-bold text-xs uppercase">Расходы (All Time)</span>
                <div className="text-2xl font-black text-orange-600 mt-1">{totalExpenses.toLocaleString()} ₽</div>
             </div>
             <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-gray-400 font-bold text-xs uppercase">Общая Прибыль</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{operatingProfit.toLocaleString()} ₽</div>
             </div>
             <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-gray-400 font-bold text-xs uppercase">Дебиторская долг.</span>
                <div className="text-2xl font-black text-amber-500 mt-1">{totalDebts.toLocaleString()} ₽</div>
             </div>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto">
            <h2 className="text-lg font-bold mb-6 text-slate-800 border-b pb-4">Ручной ввод операций (касса)</h2>
            <div className="space-y-4">
              <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-64">
                <button 
                  onClick={() => setFType('income')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${fType === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500'}`}
                >+ Доход</button>
                <button 
                  onClick={() => setFType('expense')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${fType === 'expense' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500'}`}
                >- Расход</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Сумма (₽)</label>
                  <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl font-mono text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Месяц учета (P&L)</label>
                  <input type="month" value={fTargetMonth} onChange={e => setFTargetMonth(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-gray-200 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl font-mono text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Статья БДДС</label>
                <select value={fCat} onChange={e => setFCat(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-gray-200 outline-none rounded-xl text-sm font-semibold text-slate-800">
                  <option value="" disabled>--- Выберите статью ---</option>
                  {financeCategories.filter(c => c.type === fType).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Основание / Примечание</label>
                <input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-gray-200 outline-none rounded-xl text-sm" placeholder="За что произведена оплата?" />
              </div>
              <button onClick={handleAddFinance} className="w-full py-3 bg-slate-900 text-white font-bold tracking-wide rounded-xl mt-4 hover:bg-slate-800 transition">
                Провести финансовую операцию
              </button>
              {addSuccessMsg && <p className="text-center text-sm font-bold text-emerald-600 mt-2">{addSuccessMsg}</p>}
            </div>
          </div>
        )}

        {activeTab === 'cashflow' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-slate-900">БДДС – Реестр платежей</h2>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3 px-2 font-semibold">Дата опер.</th>
                  <th className="py-3 px-2 font-semibold">Месяц РТУ</th>
                  <th className="py-3 px-2 font-semibold">Направление</th>
                  <th className="py-3 px-2 font-semibold">Статья / Категория</th>
                  <th className="py-3 px-2 font-semibold">Сумма</th>
                  <th className="py-3 px-2 font-semibold">Комментарий</th>
                  <th className="py-3 px-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {finances.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition group">
                    <td className="py-2.5 px-2 font-mono text-[11px] text-gray-400">{f.date}</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-[11px] text-indigo-600">{f.targetMonth || f.date.substring(0,7)}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${f.type==='income'?'bg-emerald-50 text-emerald-700':'bg-orange-50 text-orange-700'}`}>
                        {f.type === 'income' ? 'Поступление' : 'Выбытие'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium">{f.category}</td>
                    <td className={`py-2.5 px-2 font-mono font-black ${f.type==='income'?'text-emerald-600':'text-orange-600'}`}>
                      {f.type==='income'?'+':'-'}{f.amount.toLocaleString()} ₽
                    </td>
                    <td className="py-2.5 px-2 text-gray-500 text-[11px] max-w-xs truncate" title={f.description}>{f.description}</td>
                    <td className="py-2.5 px-2 text-right">
                      <button onClick={() => deleteFinanceRecord(f.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {finances.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400 text-xs">Нет записанных операций.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pnl' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-black mb-6 text-slate-900 border-b border-gray-100 pb-4">Отчет о прибылях и убытках (P&L)<br/><span className="text-sm font-medium text-gray-400">Учетный месяц: {currentMonthStr}</span></h2>
            
            <div className="space-y-8 max-w-3xl mx-auto">
              {/* ДОХОДЫ */}
              <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                <h3 className="font-bold text-emerald-800 border-b border-emerald-200/50 pb-2 mb-4 text-sm tracking-wide uppercase">Выручка</h3>
                <div className="space-y-2.5">
                  {financeCategories.filter(c => c.type === 'income').map(cat => {
                    const sum = finances.filter(f => f.type === 'income' && (f.targetMonth||f.date.substring(0,7)) === currentMonthStr && f.category === cat.name)
                                        .reduce((a, b) => a + Number(b.amount||0), 0);
                    if (sum === 0) return null;
                    return (
                      <div key={cat.id} className="flex justify-between items-center text-sm">
                        <span className="text-emerald-950 font-medium">{cat.name}</span>
                        <span className="font-mono font-bold text-emerald-800">{sum.toLocaleString()} ₽</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center text-sm font-black pt-3 border-t border-emerald-200/50 text-emerald-900">
                    <span>Итого Доходы:</span>
                    <span className="font-mono text-lg">{finances.filter(f => f.type==='income' && (f.targetMonth||f.date.substring(0,7))===currentMonthStr).reduce((a,b)=>a+Number(b.amount||0),0).toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>

              {/* РАСХОДЫ */}
              <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100/50">
                <h3 className="font-bold text-orange-800 border-b border-orange-200/50 pb-2 mb-4 text-sm tracking-wide uppercase">Операционные расходы</h3>
                <div className="space-y-2.5">
                  {financeCategories.filter(c => c.type === 'expense').map(cat => {
                    const sum = finances.filter(f => f.type === 'expense' && (f.targetMonth||f.date.substring(0,7)) === currentMonthStr && f.category === cat.name)
                                        .reduce((a, b) => a + Number(b.amount||0), 0);
                    if (sum === 0) return null;
                    return (
                      <div key={cat.id} className="flex justify-between items-center text-sm">
                        <span className="text-orange-950 font-medium">{cat.name}</span>
                        <span className="font-mono font-bold text-orange-800">{sum.toLocaleString()} ₽</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center text-sm font-black pt-3 border-t border-orange-200/50 text-orange-900">
                    <span>Итого Расходы:</span>
                    <span className="font-mono text-lg">{finances.filter(f => f.type==='expense' && (f.targetMonth||f.date.substring(0,7))===currentMonthStr).reduce((a,b)=>a+Number(b.amount||0),0).toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>

              {/* РЕЗУЛЬТАТ */}
              <div className="p-6 bg-slate-900 shadow-xl shadow-slate-900/20 text-white rounded-2xl flex justify-between items-center">
                <span className="font-bold tracking-wider text-sm text-slate-300 uppercase">Чистая прибыль (EBITDA)</span>
                <span className="text-3xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-md">
                  {(
                    finances.filter(f => f.type==='income' && (f.targetMonth||f.date.substring(0,7))===currentMonthStr).reduce((a,b)=>a+Number(b.amount||0),0) - 
                    finances.filter(f => f.type==='expense' && (f.targetMonth||f.date.substring(0,7))===currentMonthStr).reduce((a,b)=>a+Number(b.amount||0),0)
                  ).toLocaleString()} ₽
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b border-gray-100 pb-3">Финмодель и план продаж<br/><span className="text-sm font-medium text-gray-500">Месяц: {plan.month}</span></h2>
              
              <div>
                <h3 className="text-[11px] font-bold text-indigo-600 mb-3 uppercase tracking-widest bg-indigo-50 inline-block px-2 py-1 rounded">Продление базы (Сущ. клиенты)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <label className="text-[10px] text-gray-500 block mb-1 font-bold">12 тренировок (шт)</label>
                    <input type="number" value={plan.renew12Count} onChange={e => setPlan({...plan, renew12Count: Number(e.target.value)})} className="w-full bg-white border outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <label className="text-[10px] text-gray-500 block mb-1 font-bold">8 тренировок (шт)</label>
                    <input type="number" value={plan.renew8Count} onChange={e => setPlan({...plan, renew8Count: Number(e.target.value)})} className="w-full bg-white border outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <label className="text-[10px] text-gray-500 block mb-1 font-bold">4 тренировки (шт)</label>
                    <input type="number" value={plan.renew4Count} onChange={e => setPlan({...plan, renew4Count: Number(e.target.value)})} className="w-full bg-white border outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-emerald-600 mb-3 uppercase tracking-widest bg-emerald-50 inline-block px-2 py-1 rounded">Привлечение (Новые клиенты)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <label className="text-[10px] text-emerald-800 block mb-1 font-bold">12 тренировок (шт)</label>
                    <input type="number" value={plan.new12Count} onChange={e => setPlan({...plan, new12Count: Number(e.target.value)})} className="w-full bg-white border border-emerald-200 outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <label className="text-[10px] text-emerald-800 block mb-1 font-bold">8 тренировок (шт)</label>
                    <input type="number" value={plan.new8Count} onChange={e => setPlan({...plan, new8Count: Number(e.target.value)})} className="w-full bg-white border border-emerald-200 outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <label className="text-[10px] text-emerald-800 block mb-1 font-bold">4 тренировки (шт)</label>
                    <input type="number" value={plan.new4Count} onChange={e => setPlan({...plan, new4Count: Number(e.target.value)})} className="w-full bg-white border border-emerald-200 outline-none font-bold text-center py-1 rounded shadow-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>

              <button id="savePlanBtn" onClick={savePlan} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide rounded-xl transition shadow-lg shadow-slate-200">
                Зафиксировать KPI план
              </button>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b border-gray-100 pb-3">Unit-Экономика (Прайс)</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Прайс 12 зан.</label>
                  <div className="relative">
                    <input type="number" value={plan.price12} onChange={e=>setPlan({...plan, price12: Number(e.target.value)})} className="w-full text-center font-black text-lg bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-1" />
                    <span className="absolute right-2 bottom-1.5 text-gray-300 font-bold">₽</span>
                  </div>
                </div>
                <div className="text-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Прайс 8 зан.</label>
                  <div className="relative">
                    <input type="number" value={plan.price8} onChange={e=>setPlan({...plan, price8: Number(e.target.value)})} className="w-full text-center font-black text-lg bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-1" />
                    <span className="absolute right-2 bottom-1.5 text-gray-300 font-bold">₽</span>
                  </div>
                </div>
                <div className="text-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Прайс 4 зан.</label>
                  <div className="relative">
                    <input type="number" value={plan.price4} onChange={e=>setPlan({...plan, price4: Number(e.target.value)})} className="w-full text-center font-black text-lg bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-1" />
                    <span className="absolute right-2 bottom-1.5 text-gray-300 font-bold">₽</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-900/10">
                <div className="mb-6">
                  <span className="block text-xs text-indigo-300 font-bold uppercase tracking-widest mb-1">Прогноз выручки (Абонементы)</span>
                  <span className="text-4xl font-black text-white">{planRevenue.toLocaleString()} ₽</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-indigo-800/50 pt-5">
                  <div>
                    <span className="flex items-center text-[10px] text-indigo-300 uppercase tracking-wider font-bold mb-1">
                      План продаж
                    </span>
                    <span className="text-2xl font-black">{planCount} <span className="text-sm font-medium text-indigo-400">шт</span></span>
                  </div>
                  <div>
                    <span className="flex items-center text-[10px] text-indigo-300 uppercase tracking-wider font-bold mb-1">
                      Средний чек (ARPU)
                    </span>
                    <span className="text-2xl font-black">{Math.round(avgCheck).toLocaleString()} <span className="text-sm font-medium text-indigo-400">₽</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'directories' && (
          <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-6 border-b pb-4 text-slate-800">Системные параметры расчетов</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Комиссия банка (%)</label>
                <input type="number" step="0.1" value={crmConfig.acquiringFeePct} onChange={e => updateCRMConfig({ acquiringFeePct: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Цена 12 тренировок</label>
                <input type="number" value={crmConfig.price12} onChange={e => updateCRMConfig({ price12: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Цена 8 тренировок</label>
                <input type="number" value={crmConfig.price8} onChange={e => updateCRMConfig({ price8: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Цена 4 тренировок</label>
                <input type="number" value={crmConfig.price4} onChange={e => updateCRMConfig({ price4: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Цена 1 тренировки</label>
                <input type="number" value={crmConfig.price1} onChange={e => updateCRMConfig({ price1: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Изменение стоимости будет автоматически применяться при новых оплатах через форму пополнения.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-6 border-b pb-4 text-slate-800">Справочники: Аналитические статьи (БДДС / P&L)</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-4 rounded-xl border border-gray-100">
              <input 
                type="text" value={newCatName} onChange={e=>setNewCatName(e.target.value)}
                placeholder="Название новой статьи..." className="flex-1 p-3 border border-gray-200 outline-none rounded-xl text-sm font-medium focus:ring-1 focus:ring-slate-900"
              />
              <select value={newCatType} onChange={e=>setNewCatType(e.target.value as any)} className="p-3 border border-gray-200 rounded-xl outline-none text-sm font-bold text-slate-700 bg-white min-w-[200px]">
                <option value="income">Статья Поступлений</option>
                <option value="expense">Статья Списаний</option>
              </select>
              <button 
                id="addCatBtn"
                onClick={() => {
                  handleAddCat();
                  const btn = document.getElementById('addCatBtn');
                  if (btn) {
                    btn.innerText = 'Добавлено ✅';
                    setTimeout(() => { btn.innerText = '+ Создать статью'; }, 2000);
                  }
                }}
                className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition tracking-wide"
              >
                + Создать статью
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <h3 className="font-black text-emerald-800 mb-4 border-b border-emerald-100 pb-2 uppercase tracking-wider text-xs">Доходы (Поступления)</h3>
                  <ul className="space-y-2.5">
                    {financeCategories.filter(c => c.type === 'income').map(c => (
                      <li key={c.id} className="flex justify-between items-center px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm group hover:border-emerald-200 transition">
                        <span className="font-bold text-slate-700">{c.name}</span>
                        {!c.isSystem ? (
                          <button onClick={() => deleteFinanceCategory(c.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Системная</span>
                        )}
                      </li>
                    ))}
                  </ul>
               </div>
               <div className="space-y-3">
                  <h3 className="font-black text-orange-800 mb-4 border-b border-orange-100 pb-2 uppercase tracking-wider text-xs">Расходы (Списания)</h3>
                  <ul className="space-y-2.5">
                    {financeCategories.filter(c => c.type === 'expense').map(c => (
                      <li key={c.id} className="flex justify-between items-center px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm group hover:border-orange-200 transition">
                        <span className="font-bold text-slate-700">{c.name}</span>
                        {!c.isSystem ? (
                          <button onClick={() => deleteFinanceCategory(c.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                        ) : (
                          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-wider">Системная</span>
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
