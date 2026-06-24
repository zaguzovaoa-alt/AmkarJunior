import React, { useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { sendTelegramAlert } from "../utils/telegram";

export const TelegramReportScheduler: React.FC = () => {
  const {
    crmConfig,
    updateCRMConfig,
    clients,
    coaches,
    groups,
    trainingSessions,
    finances,
    tasks,
  } = useCRM();

  useEffect(() => {
    // We run a background check every minute
    const interval = setInterval(() => {
      checkAndSendReports();
    }, 60000);

    // Also check on mount
    checkAndSendReports();

    return () => clearInterval(interval);
  }, [crmConfig, clients, coaches, groups, trainingSessions, finances, tasks]);

  const checkAndSendReports = async () => {
    if (!crmConfig?.telegramBotToken) return;
    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentHourStr = now.getHours().toString().padStart(2, "0");
    const currentMinuteStr = now.getMinutes().toString().padStart(2, "0");
    const currentTimeStr = `${currentHourStr}:${currentMinuteStr}`;

    const reports = crmConfig?.reports;
    if (!reports) return;

    let updatedReports = { ...reports };
    let madeChanges = false;

    const shouldFire = (reportConfig: any) => {
      if (!reportConfig || !reportConfig.enabled) return false;
      if (reportConfig.dayOfWeek !== currentDayOfWeek) return false;
      if (reportConfig.time !== currentTimeStr) return false;

      const todayStr = now.toISOString().split("T")[0];
      if (reportConfig.lastSent === todayStr) return false;

      return true;
    };

    if (shouldFire(reports.weekly)) {
      await sendWeeklyReport(
        reports.weekly.targetChatId || crmConfig.telegramGroupChatId,
      );
      updatedReports.weekly = {
        ...reports.weekly,
        lastSent: now.toISOString().split("T")[0],
      };
      madeChanges = true;
    }

    if (shouldFire(reports.manager)) {
      await sendManagerReport(
        reports.manager.targetChatId || crmConfig.telegramGroupChatId,
      );
      updatedReports.manager = {
        ...reports.manager,
        lastSent: now.toISOString().split("T")[0],
      };
      madeChanges = true;
    }

    if (shouldFire(reports.salary)) {
      await sendSalaryReport(
        reports.salary.targetChatId || crmConfig.telegramGroupChatId,
      );
      updatedReports.salary = {
        ...reports.salary,
        lastSent: now.toISOString().split("T")[0],
      };
      madeChanges = true;
    }

    if (madeChanges) {
      updateCRMConfig({ reports: updatedReports });
    }
  };

  const getWeekRangeStr = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    return `${start.toLocaleDateString("ru-RU")} — ${end.toLocaleDateString("ru-RU")}`;
  };

  const sendWeeklyReport = async (chatId?: string) => {
    if (!chatId) return;

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const recentClients = clients.filter(
      (c) => new Date(c.createdAt) >= oneWeekAgo,
    );
    const newPlayers = recentClients.length;

    const recentPayments = finances.filter(
      (f) => f.type === "income" && new Date(f.date) >= oneWeekAgo,
    );

    let formSales = 0;
    let insuranceSales = 0;
    let renewals = 0;

    recentPayments.forEach((p) => {
      if (
        p.category === "Форма" ||
        p.category === "Форма/Экипировка" ||
        p.item?.includes("Форма")
      )
        formSales++;
      if (p.category === "Страховка" || p.item?.includes("Страховка"))
        insuranceSales++;
      if (p.category === "Абонементы" || p.item?.includes("Абонемент"))
        renewals++; // Simplification for renewals
    });

    const recentSessions = trainingSessions.filter(
      (s) => new Date(s.date) >= oneWeekAgo,
    );
    const coachesStats = coaches
      .map((coach) => {
        return {
          name: coach.name,
          sessions: recentSessions.filter((s) => s.coachId === coach.id).length,
        };
      })
      .filter((c) => c.sessions > 0);

    const groupsStats = groups
      .map((g) => {
        const groupSessions = recentSessions.filter((s) => s.groupId === g.id);
        if (groupSessions.length === 0) return null;

        let totalAttendance = 0;
        let max = 0;
        let min = 999;

        groupSessions.forEach((s) => {
          const presentCount = Object.values(s.attendance || {}).filter(
            (val) => val === "present",
          ).length;
          totalAttendance += presentCount;
          if (presentCount > max) max = presentCount;
          if (presentCount < min) min = presentCount;
        });

        const avg =
          groupSessions.length > 0
            ? (totalAttendance / groupSessions.length).toFixed(1)
            : "0";
        if (min === 999) min = 0;

        return {
          name: g.name,
          sessions: groupSessions.length,
          avg,
          max,
          min,
        };
      })
      .filter(Boolean) as any[];

    let text = `📊 <b>НЕДЕЛЬНЫЙ ОТЧЕТ</b>\n\n`;
    text += `Период: ${getWeekRangeStr()}\n\n`;
    text += `👩💼 <b>МЕНЕДЖЕР</b>\n`;
    text += `Продления: ${renewals}\n`;
    text += `Новые игроки: ${newPlayers}\n`;
    text += `Форма: ${formSales}\n`;
    text += `Страховка: ${insuranceSales}\n\n`;

    text += `👟 <b>ТРЕНЕРЫ</b>\n`;
    coachesStats.forEach((c) => {
      text += `${c.name}: ${c.sessions} тренировок\n`;
    });
    if (coachesStats.length === 0) text += `Нет тренировок за период\n`;
    text += `\n`;

    text += `👥 <b>ГРУППЫ</b>\n`;
    groupsStats.forEach((g) => {
      text += `${g.name}\n`;
      text += `Тренировок: ${g.sessions}\n`;
      text += `Средняя посещаемость: ${g.avg}\n`;
      text += `Максимум: ${g.max}\n`;
      text += `Минимум: ${g.min}\n\n`;
    });
    if (groupsStats.length === 0) text += `Нет тренировок за период\n`;

    await sendTelegramAlert(crmConfig!.telegramBotToken, chatId, text);
  };

  const sendManagerReport = async (chatId?: string) => {
    if (!chatId) return;

    const total = tasks.length;
    const newTasks = tasks.filter((t) => t.status === "Новая").length;
    const inProgress = tasks.filter((t) => t.status === "В работе").length;
    const waiting = tasks.filter((t) => t.status === "Ожидает ответа").length;

    const now = new Date();
    const overdue = tasks.filter(
      (t) =>
        t.status !== "Закрыто" &&
        t.status !== "Решено" &&
        new Date(t.deadline) < now,
    ).length;
    const closed = tasks.filter(
      (t) => t.status === "Закрыто" || t.status === "Решено",
    ).length;

    const conversion = total > 0 ? Math.round((closed / total) * 100) : 0;

    let text = `📊 <b>ОТЧЕТ МЕНЕДЖЕРА</b>\n\n`;
    text += `Всего задач: ${total}\n`;
    text += `Новые: ${newTasks}\n`;
    text += `В работе: ${inProgress}\n`;
    text += `Ожидают ответа: ${waiting}\n`;
    text += `Просрочено: ${overdue}\n`;
    text += `Закрыто: ${closed}\n\n`;
    text += `Конверсия: ${conversion}%\n`;

    await sendTelegramAlert(crmConfig!.telegramBotToken, chatId, text);
  };

  const sendSalaryReport = async (chatId?: string) => {
    if (!chatId) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const d = now.getDate();

    let startDate, endDate;
    if (d <= 15) {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month, 15);
    } else {
      startDate = new Date(year, month, 16);
      endDate = new Date(year, month + 1, 0);
    }

    const salaryDetails = coaches
      .map((coach) => {
        let expectedSalary = 0;
        const coachSessions = trainingSessions.filter(
          (s) =>
            s.coachId === coach.id &&
            new Date(s.date) >= startDate &&
            new Date(s.date) <= endDate,
        );

        let rate = 0;
        if (coach.paymentType === "per_session") rate = coach.rate || 0;

        const sessionPay = coachSessions.length * rate;
        const basePay = (coach.baseSalary || 0) / 2; // half month base

        let calculatedPay = sessionPay + basePay;

        const coachSalaries = finances.filter(
          (f) =>
            f.type === "expense" &&
            (f.category === "Зарплаты" ||
              f.category === "Зарплата" ||
              f.category === "Оклад") &&
            new Date(f.date) >= startDate &&
            new Date(f.date) <= endDate &&
            (f.description?.includes(coach.name) || false),
        );

        const totalPaid = coachSalaries.reduce((sum, f) => sum + f.amount, 0);

        const amount = Math.max(calculatedPay, totalPaid);

        return { name: coach.name, amount };
      })
      .filter((c) => c.amount > 0);

    const totalAmount = salaryDetails.reduce((sum, c) => sum + c.amount, 0);

    const periodStr = `${startDate.toLocaleDateString("ru-RU")} — ${endDate.toLocaleDateString("ru-RU")}`;
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

    let text = `💰 <b>ЗАРПЛАТА ТРЕНЕРОВ И АССИСТЕНТОВ</b>\n\n`;
    text += `Период: ${periodStr}\n`;
    text += `Месяц: ${monthStr}\n\n`;

    salaryDetails.forEach((c) => {
      text += `${c.name} — ${c.amount} ₽\n`;
    });

    if (salaryDetails.length === 0) {
      text += `Нет начислений за этот период\n`;
    }

    text += `\nИтого: ${totalAmount} ₽\n`;

    await sendTelegramAlert(crmConfig!.telegramBotToken, chatId, text);
  };

  return null;
};
