import React, { useState } from 'react';
import { HeaderDescription } from "./HeaderDescription";
import { useCRM } from '../context/CRMContext';
import { ShoppingBag, Tag, Plus, Edit2, Trash2, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { compressImage } from '../utils/image';

export const AdminStore: React.FC = () => {
  const { products, storeOrders, addProduct, updateProduct, deleteProduct, updateOrderStatus } = useCRM();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({ 
    category: 'Экипировка',
    name: '',
    price: 0,
    description: '',
    photoUrl: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        if (isEdit && editingProduct) {
          setEditingProduct({ ...editingProduct, photoUrl: base64 });
        } else {
          setNewProduct((prev) => ({ ...prev, photoUrl: base64 }));
        }
      });
    }
  };

  const handleAdd = async () => {
    setErrorMsg(null);
    const nameStr = (newProduct.name || '').trim();
    if (!nameStr) {
      setErrorMsg('Введите название товара');
      return;
    }
    const priceVal = Number(newProduct.price);
    if (isNaN(priceVal) || priceVal < 0) {
      setErrorMsg('Укажите корректную цену товара (положительное число)');
      return;
    }

    try {
      setIsSubmitting(true);
      await addProduct({
        name: nameStr,
        category: newProduct.category || 'Экипировка',
        price: priceVal,
        description: (newProduct.description || '').trim(),
        photoUrl: newProduct.photoUrl || ''
      });
      setIsAdding(false);
      setNewProduct({ category: 'Экипировка', name: '', price: 0, description: '', photoUrl: '' });
    } catch (err: any) {
      console.error("Ошибка при добавлении товара:", err);
      setErrorMsg(err?.message || 'Не удалось добавить товар. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    setErrorMsg(null);
    const nameStr = (editingProduct.name || '').trim();
    if (!nameStr) {
      setErrorMsg('Введите название товара');
      return;
    }
    const priceVal = Number(editingProduct.price);
    if (isNaN(priceVal) || priceVal < 0) {
      setErrorMsg('Укажите корректную цену товара');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProduct(editingProduct.id, {
        name: nameStr,
        category: editingProduct.category || 'Экипировка',
        price: priceVal,
        description: (editingProduct.description || '').trim(),
        photoUrl: editingProduct.photoUrl || ''
      });
      setEditingProduct(null);
    } catch (err: any) {
      console.error("Ошибка при обновлении товара:", err);
      setErrorMsg(err?.message || 'Не удалось обновить товар.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-7xl mx-auto text-left font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-black text-slate-800">Магазин (Админ)</h1>
            <HeaderDescription text={<>Управление экипировкой и заказами</>} />
          </div>
        </div>
        <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('catalog')} 
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'catalog' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-slate-800'}`}
          >
            Каталог ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'orders' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-slate-800'}`}
          >
            Заказы ({storeOrders.filter(o => o.status === 'new').length})
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                setIsAdding(!isAdding);
                setEditingProduct(null);
                setErrorMsg(null);
              }} 
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold inline-flex items-center shadow-xs transition"
            >
              <Plus className="w-4 h-4 mr-2" /> Добавить товар
            </button>
          </div>

          {/* ADD PRODUCT FORM */}
          {isAdding && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-2xl relative">
              <button 
                onClick={() => setIsAdding(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-slate-800 text-base mb-4">Новый товар</h3>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Название *</label>
                  <input 
                    type="text" 
                    placeholder="Например: Игровая футболка"
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    value={newProduct.name || ''} 
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Категория</label>
                  <select 
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option value="Экипировка">Экипировка</option>
                    <option value="Аксессуары">Аксессуары</option>
                    <option value="Атрибутика">Атрибутика</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Цена (руб) *</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    value={newProduct.price ?? ''} 
                    onChange={e => setNewProduct({...newProduct, price: e.target.value === '' ? 0 : Number(e.target.value)})} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Фото товара</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)} 
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" 
                  />
                  {newProduct.photoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={newProduct.photoUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-slate-200" />
                      <button 
                        onClick={() => setNewProduct({...newProduct, photoUrl: ''})} 
                        className="text-xs text-red-500 hover:underline"
                      >
                        Удалить фото
                      </button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Описание</label>
                  <textarea 
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    rows={2} 
                    placeholder="Описание размера, материала и т.д."
                    value={newProduct.description || ''} 
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-end space-x-2 pt-2">
                  <button 
                    onClick={() => setIsAdding(false)} 
                    className="px-4 py-2 border rounded-xl font-semibold text-slate-600 text-sm hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleAdd} 
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EDIT PRODUCT MODAL */}
          {editingProduct && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md max-w-2xl relative">
              <button 
                onClick={() => setEditingProduct(null)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-slate-800 text-base mb-4">Редактировать товар</h3>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Название *</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    value={editingProduct.name || ''} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Категория</label>
                  <select 
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    value={editingProduct.category} 
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  >
                    <option value="Экипировка">Экипировка</option>
                    <option value="Аксессуары">Аксессуары</option>
                    <option value="Атрибутика">Атрибутика</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Цена (руб) *</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    value={editingProduct.price ?? ''} 
                    onChange={e => setEditingProduct({...editingProduct, price: e.target.value === '' ? 0 : Number(e.target.value)})} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Заменить фото</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)} 
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" 
                  />
                  {editingProduct.photoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={editingProduct.photoUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-slate-200" />
                      <button 
                        onClick={() => setEditingProduct({...editingProduct, photoUrl: ''})} 
                        className="text-xs text-red-500 hover:underline"
                      >
                        Удалить фото
                      </button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Описание</label>
                  <textarea 
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                    rows={2} 
                    value={editingProduct.description || ''} 
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-end space-x-2 pt-2">
                  <button 
                    onClick={() => setEditingProduct(null)} 
                    className="px-4 py-2 border rounded-xl font-semibold text-slate-600 text-sm hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleUpdate} 
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Обновить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS CATALOG GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="font-medium text-sm">Товаров в каталоге пока нет</p>
                <p className="text-xs text-slate-400 mt-1">Нажмите «Добавить товар», чтобы создать первую позицию.</p>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="bg-white border border-slate-200/80 shadow-xs rounded-2xl flex flex-col overflow-hidden hover:shadow-md transition">
                  {p.photoUrl ? (
                    <div className="h-44 w-full bg-slate-100 relative">
                      <img src={p.photoUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-44 w-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <ShoppingBag className="w-10 h-10 opacity-40" />
                    </div>
                  )}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{p.category}</div>
                      <h4 className="font-bold text-slate-800 leading-tight mt-1 line-clamp-2 text-sm">{p.name}</h4>
                      {p.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                      )}
                      <div className="text-lg font-black text-slate-900 mt-2">
                        {(p.price || 0).toLocaleString()} ₽
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end items-center space-x-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setEditingProduct(p);
                          setIsAdding(false);
                          setErrorMsg(null);
                        }} 
                        className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-50 rounded-xl transition hover:bg-emerald-50"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Удалить товар "${p.name}"?`)) {
                            deleteProduct(p.id);
                          }
                        }} 
                        className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-xl transition hover:bg-red-50"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white border rounded-2xl shadow-xs overflow-hidden text-sm">
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
                    {new Date(o.date).toLocaleDateString()}<br/>
                    <span className="text-[10px] text-gray-400">{o.id}</span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{o.clientName}</td>
                  <td className="p-4 text-xs max-w-[250px]">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="truncate">• {i.name} ({i.quantity} шт)</div>
                    ))}
                  </td>
                  <td className="p-4 font-black">{(o.totalAmount || 0).toLocaleString()} ₽</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${o.status === 'new' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {o.status === 'new' ? 'Новый' : 'Выполнен'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {o.status === 'new' && (
                      <button 
                        onClick={() => updateOrderStatus(o.id, 'completed')} 
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider rounded border border-emerald-100 hover:bg-emerald-100 transition"
                      >
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
