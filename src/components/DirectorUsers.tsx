import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { AppUser } from '../context/AuthContext';
import { Users, Plus, Trash2, Edit3, Shield, Mail, Smartphone, Loader2, Save, X } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../firebase';

export const DirectorUsers: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<AppUser>>({
    fullName: '',
    email: '',
    phone: '',
    role: 'manager'
  });

  const [saving, setSaving] = useState(false);
  
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'manager'|'director'|'admin'|'trainer'>('trainer');
  const [copiedLink, setCopiedLink] = useState(false);
  
  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/staff-join?role=${inviteRole}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  useEffect(() => {
    const q = query(collection(db, 'systemUsers'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: AppUser[] = [];
      snapshot.forEach(doc => {
        data.push(doc.data() as AppUser);
      });
      setUsers(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'systemUsers');
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleOpenModal = (user?: AppUser) => {
    if (user) {
      setEditingUserId(user.uid || null);
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'manager'
      });
    } else {
      setEditingUserId(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: 'manager'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || (!formData.email && !formData.phone)) {
      alert("Укажите ФИО и хотя бы один способ авторизации (Email или Телефон)");
      return;
    }
    setSaving(true);
    
    try {
      const isNew = !editingUserId;
      // Use a random uid if creating pre-registered user. They will map to real UID on first login.
      const idToSave = isNew ? `temp_${Date.now()}_${Math.random().toString(36).substring(2,9)}` : editingUserId;
      
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email?.toLowerCase().trim() || null,
        phone: formData.phone?.trim() || null,
        role: formData.role,
        uid: idToSave
      };

      if (isNew) {
        payload.createdAt = Date.now();
      } else {
        const existing = users.find(u => u.uid === editingUserId);
        if (existing) {
          payload.createdAt = existing.createdAt;
        }
      }

      await setDoc(doc(db, 'systemUsers', idToSave as string), payload, { merge: true });
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'systemUsers');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Удалить пользователя из системы?")) {
      try {
         await deleteDoc(doc(db, 'systemUsers', id));
      } catch (err) {
         handleFirestoreError(err, OperationType.DELETE, `systemUsers/${id}`);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-sans">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center space-x-3">
            <Shield className="w-7 h-7 text-emerald-500" />
            <span>Управление Доступами (Сотрудники)</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Добавьте email или телефоны тренеров и менеджеров для предоставления доступа.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setInviteModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg flex items-center space-x-2 font-bold shadow-sm transition"
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Пригласить по ссылке</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 font-bold shadow-sm transition"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить сотрудника</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">Сотрудник</th>
                <th className="px-6 py-4 border-b border-slate-200">Роль</th>
                <th className="px-6 py-4 border-b border-slate-200">Google Email</th>
                <th className="px-6 py-4 border-b border-slate-200">Телефон</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {u.fullName}
                    {u.uid.startsWith('temp_') && <div className="text-[10px] text-amber-500 font-medium">Ожидает первого входа</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                      u.role === 'director' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'trainer' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role === 'admin' ? 'Администратор' : 
                       u.role === 'director' ? 'Директор' : 
                       u.role === 'manager' ? 'Менеджер' : 
                       u.role === 'trainer' ? 'Тренер' : 'Ученик/Родитель'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {u.email ? <div className="flex items-center space-x-2"><Mail className="w-4 h-4 text-slate-400" /><span>{u.email}</span></div> : <span className="opacity-40">-</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {u.phone ? <div className="flex items-center space-x-2"><Smartphone className="w-4 h-4 text-slate-400" /><span>{u.phone}</span></div> : <span className="opacity-40">-</span>}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(u)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Редактировать">
                       <Edit3 className="w-4 h-4" />
                    </button>
                    {(u.role !== 'director' || users.filter(x => x.role === 'director').length > 1) && (
                      <button onClick={() => handleDelete(u.uid)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Удалить">
                         <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Нет добавленных пользователей</td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">{editingUserId ? 'Редактировать пользователя' : 'Новый сотрудник'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5"/></button>
             </div>
             
             <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">ФИО сотрудника</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Петров Иван Иванович" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Google Email (Для входа)</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="ivan@gmail.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Номер телефона (СМС код)</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono" placeholder="+79991234567" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Роль / Доступ</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-semibold text-slate-700 bg-white">
                    <option value="admin">Администратор (Полный доступ)</option>
                    <option value="director">Директор</option>
                    <option value="manager">Менеджер штаба</option>
                    <option value="trainer">Тренер</option>
                    <option value="parent">Родитель / Ученик</option>
                  </select>
                </div>
                
                <div className="pt-2 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-bold rounded-lg transition">Отмена</button>
                  <button disabled={saving} type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold shadow-sm transition flex items-center space-x-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Сохранить</span>
                  </button>
                </div>
             </form>
           </div>
         </div>
      )}

      {/* Invite Link Builder Modal */}
      {inviteModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)}></div>
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Пригласить сотрудника</h3>
                <button onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Выберите роль для ссылки</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-semibold text-slate-700 bg-white shadow-sm">
                    <option value="admin">Администратор (Полный доступ)</option>
                    <option value="director">Директор</option>
                    <option value="manager">Менеджер штаба</option>
                    <option value="trainer">Тренер</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Отправьте эту ссылку выбранному сотруднику. Они смогут сами заполнить своё ФИО и контакты.</p>
                  <div className="bg-white border rounded px-3 py-2 text-xs font-mono text-slate-600 break-all select-all">
                    {window.location.origin}/staff-join?role={inviteRole}
                  </div>
                </div>
                
                <div className="pt-2">
                  <button 
                    onClick={handleCopyInviteLink}
                    className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-black shadow-md hover:bg-emerald-600 transition"
                  >
                    {copiedLink ? 'Ссылка скопирована!' : 'Скопировать ссылку'}
                  </button>
                </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};
