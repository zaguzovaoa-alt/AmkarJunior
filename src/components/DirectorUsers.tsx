import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { AppUser } from "../context/AuthContext";
import { useCRM } from "../context/CRMContext";
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Shield,
  Mail,
  Smartphone,
  Loader2,
  Save,
  X,
  GraduationCap,
  Check,
  Key,
  Lock,
  AlertTriangle,
  Layers,
  Copy,
  CheckCheck,
} from "lucide-react";
import { handleFirestoreError, OperationType } from "../firebase";

export const DirectorUsers: React.FC = () => {
  const { coaches } = useCRM();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"staff" | "clients">("staff");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<AppUser>>({
    fullName: "",
    email: "",
    phone: "",
    role: "manager",
  });
  const [formPassword, setFormPassword] = useState("");
  const [isAlsoCoach, setIsAlsoCoach] = useState(false);

  const [saving, setSaving] = useState(false);

  // Quick Password Reset Modal
  const [passwordModalUser, setPasswordModalUser] = useState<AppUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("123456");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Duplicate merging state
  const [mergingGroupKey, setMergingGroupKey] = useState<string | null>(null);
  const [mergeSuccessMsg, setMergeSuccessMsg] = useState<string | null>(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<
    "manager" | "director" | "admin" | "trainer"
  >("trainer");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/staff-join?role=${inviteRole}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  useEffect(() => {
    const q = query(collection(db, "systemUsers"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data: AppUser[] = [];
        snapshot.forEach((doc) => {
          data.push(doc.data() as AppUser);
        });
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "systemUsers");
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const isUserCoach = (u: AppUser) => {
    return coaches.some((c) => {
      if (c.id === u.uid) return true;
      if (u.phone && c.phone) {
        const uClean = u.phone.replace(/\D/g, "").slice(-10);
        const cClean = c.phone.replace(/\D/g, "").slice(-10);
        if (uClean && cClean && uClean === cClean) return true;
      }
      if (
        u.fullName &&
        c.name &&
        u.fullName.trim().toLowerCase() === c.name.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  };

  const handleToggleCoachRole = async (u: AppUser) => {
    const isCoach = isUserCoach(u);
    if (isCoach) {
      if (
        window.confirm(
          `Исключить "${u.fullName}" из тренерского состава?\nДоступ в систему как ${
            u.role === "director"
              ? "Директор"
              : u.role === "admin"
                ? "Администратор"
                : "Сотрудник"
          } сохранится в полном объёме.`
        )
      ) {
        const existingCoach = coaches.find((c) => {
          if (c.id === u.uid) return true;
          if (u.phone && c.phone) {
            const uClean = u.phone.replace(/\D/g, "").slice(-10);
            const cClean = c.phone.replace(/\D/g, "").slice(-10);
            if (uClean && cClean && uClean === cClean) return true;
          }
          if (
            u.fullName &&
            c.name &&
            u.fullName.trim().toLowerCase() === c.name.trim().toLowerCase()
          ) {
            return true;
          }
          return false;
        });
        if (existingCoach) {
          try {
            await deleteDoc(doc(db, "coaches", existingCoach.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `coaches/${existingCoach.id}`);
          }
        }
      }
    } else {
      const coachRole =
        u.role === "director"
          ? "Тренер / Директор"
          : u.role === "admin"
            ? "Тренер / Администратор"
            : u.role === "manager"
              ? "Тренер / Менеджер"
              : "Тренер состава";
      const coachDoc = {
        id: u.uid,
        name: u.fullName.trim(),
        role: coachRole,
        phone: u.phone?.trim() || "",
        telegram: "",
        status: "Активен",
        joinedYear: new Date().getFullYear(),
        rating: 5,
        avatarUrl: "",
        groupsCount: 0,
        kidsCount: 0,
        workload: 0,
        paymentType: "per_session",
        rate: 1000,
        feedback: {
          professionalism: 5,
          communication: 5,
          results: 5,
          discipline: 5,
        },
      };
      try {
        await setDoc(doc(db, "coaches", u.uid), coachDoc, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `coaches/${u.uid}`);
      }
    }
  };

  const handleOpenModal = (user?: AppUser) => {
    setFormPassword("");
    if (user) {
      setEditingUserId(user.uid || null);
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "manager",
      });
      setIsAlsoCoach(isUserCoach(user) || user.role === "trainer");
    } else {
      setEditingUserId(null);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        role: activeTab === "clients" ? "parent" : "manager",
      });
      setIsAlsoCoach(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || (!formData.email && !formData.phone)) {
      alert(
        "Укажите ФИО и хотя бы один способ авторизации (Email или Телефон)",
      );
      return;
    }
    setSaving(true);

    try {
      const isNew = !editingUserId;
      // Use a random uid if creating pre-registered user. They will map to real UID on first login.
      const idToSave = isNew
        ? `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        : editingUserId;

      const payload: any = {
        fullName: formData.fullName,
        email: formData.email?.toLowerCase().trim() || null,
        phone: formData.phone?.trim() || null,
        role: formData.role,
        uid: idToSave,
      };

      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      if (isNew) {
        payload.createdAt = Date.now();
      } else {
        const existing = users.find((u) => u.uid === editingUserId);
        if (existing) {
          payload.createdAt = existing.createdAt;
          if (!formPassword.trim() && (existing as any).password) {
            payload.password = (existing as any).password;
          }
        }
      }

      await setDoc(doc(db, "systemUsers", idToSave as string), payload, {
        merge: true,
      });

      if (formData.role === "trainer" || isAlsoCoach) {
        const coachRole =
          formData.role === "director"
            ? "Тренер / Директор"
            : formData.role === "admin"
              ? "Тренер / Администратор"
              : formData.role === "manager"
                ? "Тренер / Менеджер"
                : "Тренер";

        const coachDoc = {
          id: idToSave as string,
          name: formData.fullName.trim(),
          role: coachRole,
          phone: formData.phone?.trim() || "",
          telegram: "",
          status: "Активен",
          joinedYear: new Date().getFullYear(),
          rating: 5,
          avatarUrl: "",
          groupsCount: 0,
          kidsCount: 0,
          workload: 0,
          paymentType: "per_session",
          rate: 1000,
          feedback: {
            professionalism: 5,
            communication: 5,
            results: 5,
            discipline: 5,
          },
        };
        await setDoc(doc(db, "coaches", idToSave as string), coachDoc, {
          merge: true,
        }).catch((err) => console.warn("Failed to sync coach:", err));
      } else if (editingUserId && !isAlsoCoach && formData.role !== "trainer") {
        const existingCoach = coaches.find((c) => {
          if (c.id === editingUserId) return true;
          if (formData.phone && c.phone) {
            const uClean = formData.phone.replace(/\D/g, "").slice(-10);
            const cClean = c.phone.replace(/\D/g, "").slice(-10);
            if (uClean && cClean && uClean === cClean) return true;
          }
          return false;
        });
        if (existingCoach) {
          await deleteDoc(doc(db, "coaches", existingCoach.id)).catch(() => {});
        }
      }

      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "systemUsers");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Удалить пользователя из системы?")) {
      try {
        await deleteDoc(doc(db, "systemUsers", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `systemUsers/${id}`);
      }
    }
  };

  // Group duplicates by normalized phone, email or name
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, AppUser[]>();
    users.forEach((u) => {
      const cleanPhone = (u.phone || "").replace(/\D/g, "").slice(-10);
      const cleanEmail = (u.email || "").trim().toLowerCase();
      const cleanName = (u.fullName || "").trim().toLowerCase();

      let key = "";
      if (cleanPhone && cleanPhone.length === 10) {
        key = `phone_${cleanPhone}`;
      } else if (cleanEmail && cleanEmail.includes("@")) {
        key = `email_${cleanEmail}`;
      } else if (cleanName && cleanName.length > 5 && !cleanName.startsWith("пользователь")) {
        key = `name_${cleanName}`;
      }
      if (!key) return;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    });

    const result: {
      key: string;
      title: string;
      users: AppUser[];
      primaryUser: AppUser;
      secondaryUsers: AppUser[];
    }[] = [];

    map.forEach((userList, key) => {
      if (userList.length > 1) {
        const sorted = [...userList].sort((a, b) => {
          const roleWeights: Record<string, number> = { admin: 10, director: 9, manager: 5, trainer: 4, parent: 1 };
          const isABychkovCanonical = a.uid === "director_bychkov" ? 100 : 0;
          const isBBychkovCanonical = b.uid === "director_bychkov" ? 100 : 0;
          const isATemp = a.uid.startsWith("temp_") ? -20 : 0;
          const isBTemp = b.uid.startsWith("temp_") ? -20 : 0;
          const weightA = (roleWeights[a.role] || 0) + isABychkovCanonical + isATemp + (a.email ? 5 : 0) + (a.phone ? 5 : 0) + ((a as any).password ? 5 : 0);
          const weightB = (roleWeights[b.role] || 0) + isBBychkovCanonical + isBTemp + (b.email ? 5 : 0) + (b.phone ? 5 : 0) + ((b as any).password ? 5 : 0);
          return weightB - weightA;
        });

        result.push({
          key,
          title: sorted[0].fullName,
          users: userList,
          primaryUser: sorted[0],
          secondaryUsers: sorted.slice(1),
        });
      }
    });

    return result;
  }, [users]);

  // Merge duplicates into one canonical user
  const handleMergeDuplicates = async (group: typeof duplicateGroups[0]) => {
    setMergingGroupKey(group.key);
    try {
      const p = group.primaryUser;
      const secondaries = group.secondaryUsers;

      const mergedEmail = p.email || secondaries.find((s) => s.email)?.email || null;
      const mergedPhone = p.phone || secondaries.find((s) => s.phone)?.phone || null;
      const mergedPassword = (p as any).password || secondaries.find((s) => (s as any).password)?.password || undefined;

      const updatedPayload: any = {
        ...p,
        email: mergedEmail,
        phone: mergedPhone,
      };
      if (mergedPassword) {
        updatedPayload.password = mergedPassword;
      }

      // 1. Update primary user
      await setDoc(doc(db, "systemUsers", p.uid), updatedPayload, { merge: true });

      // 2. Delete secondary duplicate docs
      for (const s of secondaries) {
        await deleteDoc(doc(db, "systemUsers", s.uid));
      }

      setMergeSuccessMsg(`Записи для «${group.title}» успешно объединены в одну!`);
      setTimeout(() => setMergeSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Error merging duplicates:", err);
      alert("Ошибка при объединении: " + err.message);
    } finally {
      setMergingGroupKey(null);
    }
  };

  // Quick reset password handler
  const handlePerformResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !resetPasswordValue.trim()) return;
    if (resetPasswordValue.trim().length < 6) {
      alert("Пароль должен быть не менее 6 символов");
      return;
    }

    setResettingPassword(true);
    try {
      const newPass = resetPasswordValue.trim();
      // Update in systemUsers
      await setDoc(doc(db, "systemUsers", passwordModalUser.uid), { password: newPass }, { merge: true });

      // Also update in coaches if exists
      const coachMatch = coaches.find(c => {
        if (c.id === passwordModalUser.uid) return true;
        if (passwordModalUser.phone && c.phone) {
          return passwordModalUser.phone.replace(/\D/g, "").slice(-10) === c.phone.replace(/\D/g, "").slice(-10);
        }
        return false;
      });
      if (coachMatch) {
        await setDoc(doc(db, "coaches", coachMatch.id), { password: newPass }, { merge: true }).catch(() => {});
      }

      setResetPasswordSuccess(`Пароль успешно установлен: ${newPass}`);
      setCopiedPassword(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      alert("Ошибка сброса пароля: " + err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const staffRoles = ["admin", "director", "manager", "trainer"];
  const displayedUsers = activeTab === "staff" 
    ? users.filter(u => staffRoles.includes(u.role))
    : users.filter(u => !staffRoles.includes(u.role));

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-sans">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center space-x-3 leading-tight">
            <Shield className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 shrink-0" />
            <span>Управление Доступами</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Настройка доступов для сотрудников и учеников/родителей.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {activeTab === "staff" && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 w-full sm:w-auto px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 font-bold shadow-sm transition"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Пригласить по ссылке</span>
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 font-bold shadow-sm transition"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить пользователя</span>
          </button>
        </div>
      </div>

      {mergeSuccessMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mergeSuccessMsg}</span>
        </div>
      )}

      {/* Duplicate warning & merge banner */}
      {duplicateGroups.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200 rounded-2xl shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Обнаружены дублирующиеся записи пользователей ({duplicateGroups.length})
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Система нашла несколько учетных записей с одинаковым телефоном, почтой или ФИО. Вы можете объединить их в одну каноническую запись в один клик.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 divide-y divide-amber-200/60">
            {duplicateGroups.map((group) => (
              <div
                key={group.key}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 text-sm">
                    {group.title}
                  </span>
                  <span className="text-amber-800 font-semibold ml-2">
                    ({group.users.length} записи в системе)
                  </span>
                  <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-2">
                    <span>
                      Основная:{" "}
                      <strong className="text-emerald-700 font-bold uppercase">
                        {group.primaryUser.role}
                      </strong>{" "}
                      ({group.primaryUser.phone || group.primaryUser.email || group.primaryUser.uid})
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">
                      Будет объединен дубликат:{" "}
                      {group.secondaryUsers.map((s) => s.uid).join(", ")}
                    </span>
                  </div>
                </div>
                <button
                  disabled={mergingGroupKey === group.key}
                  onClick={() => handleMergeDuplicates(group)}
                  className="self-start sm:self-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {mergingGroupKey === group.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                  <span>Объединить в 1 запись</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === "staff" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Сотрудники
        </button>
        <button
          onClick={() => setActiveTab("clients")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === "clients" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Ученики / Родители
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 border-b border-slate-200">
                    {activeTab === "staff" ? "Сотрудник" : "Пользователь"}
                  </th>
                  <th className="px-6 py-4 border-b border-slate-200">Роль</th>
                  <th className="px-6 py-4 border-b border-slate-200">
                    Google Email
                  </th>
                  <th className="px-6 py-4 border-b border-slate-200">
                    Телефон
                  </th>
                  <th className="px-6 py-4 border-b border-slate-200 text-right">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div>{u.fullName}</div>
                      {duplicateGroups.some((dg) => dg.users.some((du) => du.uid === u.uid)) && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Дубликат
                          </span>
                        </div>
                      )}
                      {u.uid.startsWith("temp_") && (
                        <div className="text-[10px] text-amber-500 font-medium">
                          Ожидает первого входа
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-amber-100 text-amber-700"
                              : u.role === "director"
                                ? "bg-purple-100 text-purple-700"
                                : u.role === "manager"
                                  ? "bg-blue-100 text-blue-700"
                                  : u.role === "trainer"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role === "admin"
                            ? "Администратор"
                            : u.role === "director"
                              ? "Директор"
                              : u.role === "manager"
                                ? "Менеджер"
                                : u.role === "trainer"
                                  ? "Тренер"
                                  : "Ученик/Родитель"}
                        </span>
                        {u.role !== "trainer" && isUserCoach(u) && (
                          <span
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
                            title="Также включен в тренерский состав (совмещение)"
                          >
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            <span>+ Тренер</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {u.email ? (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      ) : (
                        <span className="opacity-40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {u.phone ? (
                        <div className="flex items-center space-x-2">
                          <Smartphone className="w-4 h-4 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      ) : (
                        <span className="opacity-40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {staffRoles.includes(u.role) && u.role !== "trainer" && (
                        isUserCoach(u) ? (
                          <button
                            type="button"
                            onClick={() => handleToggleCoachRole(u)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Сотрудник в тренерском составе. Нажмите, чтобы исключить (доступ в систему сохранится)"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>В тренерах</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleCoachRole(u)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition inline-flex items-center space-x-1 shadow-xs cursor-pointer"
                            title="Назначить тренером без создания дубликата"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                            <span>Сделать тренером</span>
                          </button>
                        )
                      )}
                      <button
                        onClick={() => {
                          setPasswordModalUser(u);
                          setResetPasswordValue("123456");
                          setResetPasswordSuccess(null);
                          setCopiedPassword(false);
                        }}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition inline-flex items-center cursor-pointer"
                        title="Задать / сбросить пароль"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(u)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition inline-flex items-center"
                        title="Редактировать"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {(u.role !== "director" ||
                        users.filter((x) => x.role === "director").length >
                          1) && (
                        <button
                          onClick={() => handleDelete(u.uid)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition inline-flex items-center"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      Нет добавленных пользователей
                    </td>
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
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {editingUserId
                  ? "Редактировать пользователя"
                  : "Новый сотрудник"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  ФИО сотрудника
                </label>
                <input
                  required
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Петров Иван Иванович"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Google Email (Для входа)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="ivan@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Номер телефона (СМС код)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  placeholder="+79991234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Пароль для входа</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {editingUserId ? "Оставьте пустым, если не меняется" : "Минимум 6 символов"}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-sm"
                    placeholder={editingUserId ? "Не менять текущий пароль" : "Например: 123456"}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Роль / Доступ
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-semibold text-slate-700 bg-white"
                >
                  <option value="admin">Администратор (Полный доступ)</option>
                  <option value="director">Директор</option>
                  <option value="manager">Менеджер штаба</option>
                  <option value="trainer">Тренер</option>
                  <option value="parent">Родитель / Ученик</option>
                </select>
              </div>

              {formData.role !== "trainer" && formData.role !== "parent" && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <label className="flex items-start space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAlsoCoach}
                      onChange={(e) => setIsAlsoCoach(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Включить в тренерский состав (совмещение)</span>
                      </span>
                      <span className="text-[11px] text-slate-600 block leading-tight mt-0.5">
                        Сотрудник сохраняет все права{" "}
                        {formData.role === "director"
                          ? "директора"
                          : formData.role === "admin"
                            ? "администратора"
                            : "менеджера"}
                        , но также отображается в списках тренеров для закрепления за группами и ведения тренировок.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-bold rounded-lg transition"
                >
                  Отмена
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Password Reset Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setPasswordModalUser(null)}
          ></div>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-800">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Задать / сбросить пароль
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {passwordModalUser.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePerformResetPassword} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div>
                  <strong>Логин / Телефон:</strong> {passwordModalUser.phone || "Не указан"}
                </div>
                <div>
                  <strong>Email:</strong> {passwordModalUser.email || "Не указан"}
                </div>
                <div>
                  <strong>Роль:</strong> {passwordModalUser.role}
                </div>
              </div>

              {resetPasswordSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Пароль успешно сохранен!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Передайте пользователю данные для входа:
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between font-mono text-sm">
                    <span className="font-bold text-slate-800">{resetPasswordValue}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetPasswordValue);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-sans font-bold cursor-pointer"
                    >
                      {copiedPassword ? (
                        <>
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Скопировать</span>
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition cursor-pointer"
                  >
                    Готово
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Новый пароль
                    </label>
                    <input
                      required
                      type="text"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 font-mono text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                      placeholder="123456"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Минимум 6 символов. Пользователь сможет сразу войти по этому паролю.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResetPasswordValue("123456")}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition cursor-pointer"
                    >
                      123456 (стандарт)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const random = Math.floor(100000 + Math.random() * 900000).toString();
                        setResetPasswordValue(random);
                      }}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition cursor-pointer"
                    >
                      Случайный 6-значный
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setPasswordModalUser(null)}
                      className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-bold rounded-lg transition text-sm cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      disabled={resettingPassword}
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-bold shadow-sm transition flex items-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {resettingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      <span>Установить пароль</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Invite Link Builder Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setInviteModalOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                Пригласить сотрудника
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Выберите роль для ссылки
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-semibold text-slate-700 bg-white shadow-sm"
                >
                  <option value="admin">Администратор (Полный доступ)</option>
                  <option value="director">Директор</option>
                  <option value="manager">Менеджер штаба</option>
                  <option value="trainer">Тренер</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                  Отправьте эту ссылку выбранному сотруднику. Они смогут сами
                  заполнить своё ФИО и контакты.
                </p>
                <div className="bg-white border rounded px-3 py-2 text-xs font-mono text-slate-600 break-all select-all">
                  {window.location.origin}/staff-join?role={inviteRole}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCopyInviteLink}
                  className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-black shadow-md hover:bg-emerald-600 transition"
                >
                  {copiedLink ? "Ссылка скопирована!" : "Скопировать ссылку"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
