import React, { useState, useRef, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { Client } from "../types";
import { Camera, Save, CheckCircle2, Loader2 } from "lucide-react";
import { compressImage } from "../utils/image";

interface ChildSettingsProps {
  client: Client;
}

export function ChildSettings({ client }: ChildSettingsProps) {
  const { updateClient } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    childName: client.childName || "",
    childSurname: client.childSurname || "",
    childBirthDate: client.childBirthDate || "",
    uniformSize: client.uniformSize || "",
  });

  useEffect(() => {
    setFormData({
      childName: client.childName || "",
      childSurname: client.childSurname || "",
      childBirthDate: client.childBirthDate || "",
      uniformSize: client.uniformSize || "",
    });
  }, [client]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Размер файла не должен превышать 5МБ");
        return;
      }
      setSaving(true);
      compressImage(file, async (base64) => {
        try {
          await updateClient(client.id, { avatarUrl: base64 });
          setSuccessMsg("Фото успешно обновлено!");
          setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
          alert("Ошибка при сохранении фото");
        } finally {
          setSaving(false);
        }
      });
    }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await updateClient(client.id, {
        childName: formData.childName,
        childSurname: formData.childSurname,
        childBirthDate: formData.childBirthDate,
        uniformSize: formData.uniformSize,
      });
      setSuccessMsg("Данные успешно сохранены!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      alert("Ошибка при сохранении данных");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-gray-200 shadow-inner mt-6 space-y-6">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Настройки профиля ребёнка</h3>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {client.avatarUrl ? (
                <img src={client.avatarUrl} alt="Аватар" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 font-extrabold text-3xl">
                  {client.childName?.[0] || "?"}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <p className="text-[10px] text-slate-500 font-medium text-center">
            Нажмите на камеру, чтобы <br /> обновить фото
          </p>
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Имя
              </label>
              <input
                type="text"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl text-sm font-medium transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Фамилия
              </label>
              <input
                type="text"
                value={formData.childSurname}
                onChange={(e) => setFormData({ ...formData, childSurname: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl text-sm font-medium transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Дата рождения
              </label>
              <input
                type="date"
                value={formData.childBirthDate}
                onChange={(e) => setFormData({ ...formData, childBirthDate: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl text-sm font-medium transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Размер экипировки
              </label>
              <select
                value={formData.uniformSize}
                onChange={(e) => setFormData({ ...formData, uniformSize: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl text-sm font-medium transition"
              >
                <option value="">Не выбран</option>
                <option value="104">104 (3-4 года)</option>
                <option value="110">110 (4-5 лет)</option>
                <option value="116">116 (5-6 лет)</option>
                <option value="122">122 (6-7 лет)</option>
                <option value="128">128 (7-8 лет)</option>
                <option value="134">134 (8-9 лет)</option>
                <option value="140">140 (9-10 лет)</option>
                <option value="146">146 (10-11 лет)</option>
                <option value="152">152 (11-12 лет)</option>
                <option value="XS">Взрослый XS</option>
                <option value="S">Взрослый S</option>
                <option value="M">Взрослый M</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              {successMsg && (
                <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSaveInfo}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase transition shadow-sm flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Сохранить изменения</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
