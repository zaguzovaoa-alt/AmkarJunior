import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { ShoppingBag, Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { Product } from '../types';

export const AdminStore: React.FC = () => {
  const { products, storeOrders, addProduct, updateProduct, deleteProduct, updateOrderStatus } = useCRM();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ category: 'Экипировка' });

  const handleAdd = () => {
    if (newProduct.name && newProduct.price) {
      addProduct(newProduct as Omit<Product, 'id'>);
      setIsAdding(false);
      setNewProduct({ category: 'Экипировка' });
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Магазин (Админ)</h1>
          <p className="text-sm text-gray-500">Управление экипировкой и заказами</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('catalog')} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'catalog' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>Каталог</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'orders' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>Заказы ({storeOrders.filter(o => o.status === 'new').length})</button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <button onClick={() => setIsAdding(!isAdding)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Добавить товар
          </button>
          
          {isAdding && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm max-w-2xl">
              <h3 className="font-bold text-slate-800 mb-4">Новый товар</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Название</label>
                  <input type="text" className="w-full p-2 border rounded-xl outline-none" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Категория</label>
                  <select className="w-full p-2 border rounded-xl outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                     <option value="Экипировка">Экипировка</option>
                     <option value="Аксессуары">Аксессуары</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Цена (руб)</label>
                  <input type="number" className="w-full p-2 border rounded-xl outline-none" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">URL Фото (необязательно)</label>
                  <input type="text" className="w-full p-2 border rounded-xl outline-none" value={newProduct.photoUrl || ''} onChange={e => setNewProduct({...newProduct, photoUrl: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1">Описание</label>
                  <textarea className="w-full p-2 border rounded-xl outline-none" rows={2} value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                </div>
                <div className="md:col-span-2 pt-2">
                  <button onClick={handleAdd} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold">Сохранить</button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white border shadow-sm rounded-2xl p-4 flex flex-col justify-between">
                <div>
                   <div className="text-[10px] uppercase font-bold text-gray-400">{p.category}</div>
                   <h4 className="font-bold text-slate-800 leading-tight">{p.name}</h4>
                   <div className="text-xl font-black text-slate-900 mt-2">{p.price} ₽</div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                   <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-500 bg-slate-50 rounded-xl transition">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-sm">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b">
               <tr className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                 <th className="p-4">Дата / ID</th>
                 <th className="p-4">Клиент</th>
                 <th className="p-4">Товары</th>
                 <th className="p-4">Сумма</th>
                 <th className="p-4">Статус</th>
                 <th className="p-4 text-right">Действия</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {storeOrders.length === 0 ? (
                 <tr><td colSpan={6} className="p-8 text-center text-gray-400">Нет заказов</td></tr>
               ) : storeOrders.map(o => (
                 <tr key={o.id} className="hover:bg-slate-50">
                   <td className="p-4 text-xs font-mono text-gray-500">
                     {new Date(o.date).toLocaleDateString()}<br/>{o.id}
                   </td>
                   <td className="p-4 font-bold text-slate-800">{o.clientName}</td>
                   <td className="p-4 text-xs max-w-[250px]">
                     {o.items.map((i, idx) => <div key={idx} className="truncate">• {i.name} ({i.quantity} шт)</div>)}
                   </td>
                   <td className="p-4 font-black">{o.totalAmount} ₽</td>
                   <td className="p-4">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.status === 'new' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                       {o.status === 'new' ? 'Новый' : 'Выполнен'}
                     </span>
                   </td>
                   <td className="p-4 text-right">
                     {o.status === 'new' && (
                       <button onClick={() => updateOrderStatus(o.id, 'completed')} className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider rounded border border-emerald-100 hover:bg-emerald-100">
                         Завершить
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};
