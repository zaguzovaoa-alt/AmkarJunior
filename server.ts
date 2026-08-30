import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import webpush from "web-push";

// VAPID Configuration for Real Background Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BBOoYURPv6mnX1R9OA2sppgEwLz4kbfFOrF0vuR0_BGGYpkHYwBOjLt7kMPGz6HI7iOz_nxBUe6l8skAjRveOgE";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "D693vH7b61Bc2p0WqV5L-Q_yQME0QkWM_a1I5Gzw6sM";
const VAPID_SUBJECT = "mailto:admin@amkarjunior.ru";

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} catch (e) {
  console.error("VAPID setup warning:", e);
}

// Read Firebase applet configuration
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e) {
  console.error("Failed to load firebase-applet-config.json:", e);
}

async function getCRMConfig() {
  if (!firebaseConfig.projectId || !firebaseConfig.firestoreDatabaseId || !firebaseConfig.apiKey) {
    return {
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
      telegramGroupChatId: process.env.TELEGRAM_CHAT_ID || "",
      telegramAlerts: { newLead: true, newOrder: true, churnRisk: true, scheduleConflict: true }
    };
  }
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/_config/initialized?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
        telegramGroupChatId: process.env.TELEGRAM_CHAT_ID || "",
        telegramAlerts: { newLead: true, newOrder: true, churnRisk: true, scheduleConflict: true }
      };
    }
    const data = await res.json();
    const docFields = data?.fields || {};
    const crmFields = docFields?.crmConfig?.mapValue?.fields || {};

    const rawBotToken = crmFields.telegramBotToken?.stringValue || docFields.telegramBotToken?.stringValue || process.env.TELEGRAM_BOT_TOKEN || "";
    let rawChatId = crmFields.telegramGroupChatId?.stringValue || docFields.telegramGroupChatId?.stringValue || process.env.TELEGRAM_CHAT_ID || "";

    // Clean up Chat ID if full URL was accidentally pasted
    if (rawChatId.includes("t.me/")) {
      rawChatId = "@" + rawChatId.split("t.me/")[1].replace(/\//g, "");
    }

    return {
      telegramBotToken: rawBotToken.trim(),
      telegramGroupChatId: rawChatId.trim(),
      telegramAlerts: {
        newLead: crmFields.telegramAlerts?.mapValue?.fields?.newLead?.booleanValue ?? true,
        newOrder: crmFields.telegramAlerts?.mapValue?.fields?.newOrder?.booleanValue ?? true,
        churnRisk: crmFields.telegramAlerts?.mapValue?.fields?.churnRisk?.booleanValue ?? true,
        scheduleConflict: crmFields.telegramAlerts?.mapValue?.fields?.scheduleConflict?.booleanValue ?? true,
      }
    };
  } catch (e) {
    console.error("Failed to fetch CRM config from Firestore:", e);
    return {
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
      telegramGroupChatId: process.env.TELEGRAM_CHAT_ID || "",
      telegramAlerts: { newLead: true, newOrder: true, churnRisk: true, scheduleConflict: true }
    };
  }
}

async function sendTelegramAlertServer(botToken: string, chatId: string, text: string) {
  const cleanToken = (botToken || "").trim();
  let cleanChatId = (chatId || "").trim();

  if (cleanChatId.includes("t.me/")) {
    cleanChatId = "@" + cleanChatId.split("t.me/")[1].replace(/\//g, "");
  }

  if (!cleanToken || !cleanChatId) {
    console.warn("Telegram alert skipped: botToken or chatId missing.");
    return { success: false, error: "Токен бота или ID чата не указан" };
  }

  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(async () => ({ description: await res.text() }));
      const errText = errData.description || JSON.stringify(errData);
      console.error("Telegram send alert failed:", errText);

      // Fallback without HTML formatting if parsing error
      if (errText.includes("can't parse entities")) {
        const plainText = text.replace(/<[^>]*>/g, "");
        const fallbackRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: plainText,
          }),
        });
        if (fallbackRes.ok) {
          return { success: true, fallback: true };
        }
      }
      return { success: false, error: errText };
    }

    const data = await res.json();
    console.log("Telegram alert delivered successfully to chatId:", cleanChatId);
    return { success: true, result: data };
  } catch (e: any) {
    console.error("Telegram network/fetch error on server:", e);
    return { success: false, error: e.message || String(e) };
  }
}

async function saveFirestoreDoc(collectionName: string, docId: string, fields: Record<string, any>) {
  if (!firebaseConfig.projectId || !firebaseConfig.firestoreDatabaseId || !firebaseConfig.apiKey) {
    return;
  }
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${collectionName}/${docId}?key=${firebaseConfig.apiKey}`;
    
    const formatValue = (val: any): any => {
      if (val === null || val === undefined) return { nullValue: null };
      if (typeof val === "boolean") return { booleanValue: val };
      if (typeof val === "number") {
        return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
      }
      if (typeof val === "string") return { stringValue: val };
      if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(formatValue) } };
      }
      if (typeof val === "object") {
        const objFields: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          objFields[k] = formatValue(v);
        }
        return { mapValue: { fields: objFields } };
      }
      return { stringValue: String(val) };
    };

    const formattedFields: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      formattedFields[k] = formatValue(v);
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: formattedFields }),
    });

    if (!res.ok) {
      console.error(`Failed to save Firestore doc ${collectionName}/${docId}:`, await res.text());
    }
  } catch (e) {
    console.error(`Error saving Firestore doc ${collectionName}/${docId}:`, e);
  }
}

// In-Memory & Firestore Push Subscriptions Store
const inMemoryPushSubscriptions = new Map<string, any>();

async function getPushSubscriptions(): Promise<any[]> {
  const localList = Array.from(inMemoryPushSubscriptions.values());
  if (localList.length > 0) return localList;

  if (!firebaseConfig.projectId || !firebaseConfig.firestoreDatabaseId || !firebaseConfig.apiKey) {
    return localList;
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/push_subscriptions?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return localList;
    const data = await res.json();
    if (data.documents && Array.isArray(data.documents)) {
      for (const doc of data.documents) {
        const fields = doc.fields || {};
        const rawJson = fields.subscriptionJson?.stringValue;
        if (rawJson) {
          try {
            const sub = JSON.parse(rawJson);
            inMemoryPushSubscriptions.set(sub.endpoint, sub);
          } catch {}
        }
      }
    }
  } catch (e) {
    console.error("Error fetching push subscriptions from Firestore:", e);
  }

  return Array.from(inMemoryPushSubscriptions.values());
}

async function savePushSubscription(sub: any, role: string = "all", userPhone: string = "") {
  if (!sub || !sub.endpoint) return;
  inMemoryPushSubscriptions.set(sub.endpoint, sub);

  // Generate safe document ID from endpoint hash
  const docId = "sub_" + Buffer.from(sub.endpoint).toString("base64url").slice(0, 50);
  await saveFirestoreDoc("push_subscriptions", docId, {
    endpoint: sub.endpoint,
    subscriptionJson: JSON.stringify(sub),
    role: role,
    userPhone: userPhone,
    updatedAt: new Date().toISOString(),
  });
  console.log(`[WebPush] Subscription saved successfully (${docId})`);
}

async function sendPushNotificationToAll(data: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}) {
  const payload = JSON.stringify({
    title: data.title,
    body: data.body,
    icon: data.icon || "/favicon.png",
    badge: "/favicon.png",
    tag: data.tag || `amkar-${Date.now()}`,
    data: { url: data.url || "/crm" },
  });

  const subs = await getPushSubscriptions();
  if (subs.length === 0) {
    console.log("[WebPush] No active push subscriptions found on server.");
    return { sent: 0, failed: 0 };
  }

  console.log(`[WebPush] Dispatching native push notification to ${subs.length} device(s): ${data.title}`);

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload, {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: "high",
      });
      sent++;
    } catch (err: any) {
      failed++;
      console.warn(`[WebPush] Push failed for endpoint ${sub.endpoint?.substring(0, 35)}... (Status: ${err.statusCode || err.message})`);
      if (err.statusCode === 410 || err.statusCode === 404) {
        inMemoryPushSubscriptions.delete(sub.endpoint);
      }
    }
  }

  return { sent, failed };
}

async function processIncomingLead(payload: any) {
  let parentPhone = "Не указан";
  let parentName = "Родитель";
  let childName = "Ребенок";
  let childSurname = "";
  let childAge = 0;
  let childBirthYear = 0;
  let notesList: string[] = [];
  let formSource = "Лендинг";

  if (payload && typeof payload === "object") {
    const entries = Object.entries(payload);
    entries.forEach(([key, value]) => {
      const k = key.toLowerCase();
      const v = typeof value === "string" ? value : String(value);

      if (
        k.includes("phone") ||
        k.includes("телефон") ||
        k.includes("мобильный") ||
        k.includes("номер")
      ) {
        parentPhone = v;
      } else if (
        k.includes("parent_name") ||
        k.includes("имя родителя") ||
        k.includes("ваше имя") ||
        (k === "name" && parentName === "Родитель")
      ) {
        parentName = v;
      } else if (
        k.includes("child_name") ||
        k.includes("имя ребенка") ||
        k.includes("имя ребёнка")
      ) {
        childName = v;
      } else if (k.includes("child_surname") || k.includes("фамилия")) {
        childSurname = v;
      } else if (k.includes("child_age") || k.includes("возраст")) {
        const parsedAge = parseInt(v.replace(/\D/g, ""), 10);
        if (!isNaN(parsedAge) && parsedAge > 0) childAge = parsedAge;
      } else if (k.includes("source") || k.includes("источник")) {
        formSource = v;
      } else if (k !== "notes" && k !== "utm_source") {
        notesList.push(`${key}: ${v}`);
      }
    });
  }

  let parentNameFinal = payload.parentName || payload.name || parentName;
  const parentPhoneFinal = payload.parentPhone || payload.phone || payload.contact || parentPhone;
  let childNameFinal = payload.childName || payload.child || childName;
  let childSurnameFinal = payload.childSurname || payload.surname || childSurname;
  const sourceFinal = payload.utm_source || payload.source || formSource || "Лендинг";
  let childAgeFinal = Number(payload.childAge || payload.age) || childAge;

  // Smart parsing: e.g. "Прохор, 8 лет" or "Быстрых Прохор"
  if (childNameFinal) {
    // Check if age is inside childName (e.g. "Прохор, 8 лет")
    const ageMatch = childNameFinal.match(/(\d+)\s*(?:лет|год|года|г\.?р\.?)?/i);
    if (ageMatch && !childAgeFinal) {
      childAgeFinal = parseInt(ageMatch[1], 10);
    }
    // Clean child name
    childNameFinal = childNameFinal.replace(/,?\s*\d+\s*(?:лет|год|года|г\.?р\.?)?/i, "").trim();

    // Check if both surname and name are in childName (e.g. "Быстрых Прохор")
    const parts = childNameFinal.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && !childSurnameFinal) {
      childSurnameFinal = parts[0];
      childNameFinal = parts.slice(1).join(" ");
    }
  }

  // If child surname is missing but parent has full name (e.g. "Быстрых Юрий Анатольевич"), use parent's surname
  if (!childSurnameFinal && parentNameFinal) {
    const parentParts = parentNameFinal.trim().split(/\s+/).filter(Boolean);
    if (parentParts.length >= 2) {
      childSurnameFinal = parentParts[0];
    }
  }

  const currentYear = new Date().getFullYear();
  if (childAgeFinal > 0) {
    childBirthYear = currentYear - childAgeFinal;
  } else if (payload.childBirthYear || payload.year) {
    childBirthYear = Number(payload.childBirthYear || payload.year);
    childAgeFinal = currentYear - childBirthYear;
  }

  const notesFinal = payload.notes || notesList.join("\n") || "Заявка на бесплатную тренировку";

  const now = new Date();
  const leadId = payload.id || `l_${Date.now()}`;
  const timeString = now.toTimeString().substring(0, 5);

  const newLead = {
    id: leadId,
    parentName: parentNameFinal,
    parentPhone: parentPhoneFinal,
    parentEmail: payload.parentEmail || payload.email || "",
    childName: childNameFinal,
    childSurname: childSurnameFinal,
    childBirthYear: childBirthYear || 2018,
    childAge: childAgeFinal || 0,
    source: sourceFinal,
    notes: notesFinal,
    timeString: timeString,
    createdAt: now.toISOString(),
    status: "new",
  };

  const ageText = childAgeFinal > 0 ? ` (${childAgeFinal} лет, ${childBirthYear || currentYear - childAgeFinal} г.р.)` : "";

  // 1. Fetch config and send Telegram notification IMMEDIATELY from server
  let tgResult: { success: boolean; error?: string } = { success: false };
  const config = await getCRMConfig();
  if (config && config.telegramAlerts.newLead !== false && config.telegramBotToken && config.telegramGroupChatId) {
    const childDisplayName = [childSurnameFinal, childNameFinal].filter(Boolean).join(" ") || "Не указано";
    const telegramMessage = `🚨 <b>НОВАЯ ЗАЯВКА (АМКАР ЮНИОР)</b>\n\n👤 <b>Родитель:</b> ${parentNameFinal}\n📞 <b>Телефон:</b> <code>${parentPhoneFinal}</code>\n⚽ <b>Ребенок:</b> ${childDisplayName}${ageText}\n📍 <b>Источник:</b> ${sourceFinal}\n📝 <b>Детали:</b> ${notesFinal}\n\n⏰ <i>${now.toLocaleDateString("ru-RU")} ${timeString}</i>`;
    tgResult = await sendTelegramAlertServer(config.telegramBotToken, config.telegramGroupChatId, telegramMessage);
  } else {
    console.warn("Telegram alert not sent: token/chatId missing in config", config);
  }

  // 2. Save lead directly to Firestore
  await saveFirestoreDoc("leads", leadId, newLead);

  // 3. Create Manager Task in Firestore
  const managerTaskId = `t_${Date.now()}_m`;
  const childFullTitle = [childSurnameFinal, childNameFinal].filter(Boolean).join(" ");
  const managerTask = {
    id: managerTaskId,
    title: `⚡ НОВАЯ ЗАЯВКА: ${childFullTitle}`,
    assignedTo: "manager",
    status: "new",
    dueDate: now.toLocaleDateString("ru-RU"),
    description: `🔥 Внимание! Поступила новая заявка из канала [${sourceFinal}].\nРодитель: ${parentNameFinal}\nТелефон: ${parentPhoneFinal}\nРебенок: ${childFullTitle}${ageText}\n🔔 НЕОБХОДИМО: Связаться в ближайшее время, уточнить детали и ЗАПИСАТЬ в расписание на пробную тренировку!`,
    relatedLeadId: leadId,
  };
  await saveFirestoreDoc("tasks", managerTaskId, managerTask);

  // 4. Create Director Task in Firestore
  const directorTaskId = `t_${Date.now()}_d`;
  const directorTask = {
    id: directorTaskId,
    title: `Контроль: Новая заявка [ ${sourceFinal} ]`,
    assignedTo: "director",
    status: "new",
    dueDate: now.toLocaleDateString("ru-RU"),
    description: `Новый потенциальный клиент: ${childFullTitle}${ageText}. Источник: ${sourceFinal}. Телефон: ${parentPhoneFinal}`,
  };
  await saveFirestoreDoc("tasks", directorTaskId, directorTask);

  // 5. Create System Notification in Firestore (triggers in-app sync on active clients)
  const notifId = `notif_${Date.now()}`;
  const notification = {
    id: notifId,
    title: `Новая заявка: ${childFullTitle}`,
    body: `Родитель: ${parentNameFinal} (${parentPhoneFinal}). Источник: ${sourceFinal}`,
    type: "system",
    targetRole: ["director", "admin", "manager"],
    isRead: false,
    dateString: now.toISOString(),
  };
  await saveFirestoreDoc("notifications", notifId, notification);

  // 6. Broadcast Real Web Push Notification (arrives even if CRM tab is closed or in background)
  try {
    await sendPushNotificationToAll({
      title: `⚡ Новая заявка: ${childFullTitle}`,
      body: `Родитель: ${parentNameFinal} (${parentPhoneFinal}). Источник: ${sourceFinal}`,
      tag: `lead-${leadId}`,
      url: "/crm",
    });
  } catch (e) {
    console.warn("Background webpush broadcast error:", e);
  }

  return {
    leadId,
    lead: newLead,
    telegramSent: tgResult.success,
    telegramError: tgResult.error,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const SMS_RU_API_ID = '9FB08C14-577B-E243-D5D1-E97A00106226';

  // Push Notification VAPID Public Key Endpoint
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // Push Subscription Endpoint (Saves browser push subscription)
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { subscription, role, userPhone } = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ status: "ERROR", message: "Invalid subscription payload" });
      }
      await savePushSubscription(subscription, role, userPhone);
      res.json({ status: "OK", message: "Push subscription registered successfully" });
    } catch (e: any) {
      console.error("Error subscribing push:", e);
      res.status(500).json({ status: "ERROR", message: e.message || String(e) });
    }
  });

  // Push Broadcast Endpoint (Sends Web Push to all devices)
  app.post("/api/push/broadcast", async (req, res) => {
    try {
      const { title, body, url, tag } = req.body;
      const result = await sendPushNotificationToAll({
        title: title || "⚡ Оповещение CRM",
        body: body || "Новое событие в системе",
        url: url || "/crm",
        tag: tag || `msg-${Date.now()}`,
      });
      res.json({ status: "OK", ...result });
    } catch (e: any) {
      console.error("Error broadcasting push:", e);
      res.status(500).json({ status: "ERROR", message: e.message || String(e) });
    }
  });

  // Test Push Endpoint
  app.post("/api/push/test", async (req, res) => {
    try {
      const result = await sendPushNotificationToAll({
        title: "🔔 Тестовое Push-уведомление (АМКАР ЮНИОР)",
        body: "Web Push работает в фоновом режиме! Оповещения будут приходить даже при закрытой вкладке CRM.",
        url: "/crm",
        tag: `test-push-${Date.now()}`,
      });
      res.json({ status: "OK", ...result });
    } catch (e: any) {
      res.status(500).json({ status: "ERROR", message: e.message || String(e) });
    }
  });

  // Dedicated endpoint for leads from landing page and web forms
  app.post("/api/leads/submit", async (req, res) => {
    try {
      const payload = req.body;
      console.log("Received lead submission via /api/leads/submit:", payload);
      const result = await processIncomingLead(payload);
      res.json({ status: "OK", ...result });
    } catch (e: any) {
      console.error("Error in /api/leads/submit:", e);
      res.status(500).json({ status: "ERROR", message: String(e) });
    }
  });

  app.post(["/api/webhooks/forms", "/api/webhooks/lead", "/api/webhooks/yandex"], async (req, res) => {
    try {
      const payload = req.body;
      console.log("Received lead webhook payload:", payload);

      (global as any).incomingLeads = (global as any).incomingLeads || [];
      (global as any).incomingLeads.push(payload);

      // Process immediately on server (Telegram alert + Firestore save + Push notification trigger)
      const result = await processIncomingLead(payload);

      res.json({ status: "OK", ...result });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ status: "ERROR", message: String(e) });
    }
  });

  // Test Telegram endpoint
  app.post("/api/telegram/test", async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      let finalBotToken = (botToken || "").trim();
      let finalChatId = (chatId || "").trim();

      if (!finalBotToken || !finalChatId) {
        const config = await getCRMConfig();
        if (config) {
          finalBotToken = finalBotToken || config.telegramBotToken;
          finalChatId = finalChatId || config.telegramGroupChatId;
        }
      }

      if (!finalBotToken || !finalChatId) {
        return res.status(400).json({ 
          status: "ERROR", 
          message: "Укажите Токен Бота и ID Группы чата для проверки." 
        });
      }

      const testMsg = `🔔 <b>ТЕСТОВОЕ ОПОВЕЩЕНИЕ CRM "АМКАР ЮНИОР"</b>\n\n✅ Интеграция с Telegram успешно настроена!\n🤖 Бот подключен и имеет права на отправку в этот чат.\n⏰ Время: ${new Date().toLocaleTimeString("ru-RU")}`;
      const result = await sendTelegramAlertServer(finalBotToken, finalChatId, testMsg);

      if (result.success) {
        res.json({ status: "OK", message: "Тестовое сообщение успешно доставлено в Telegram!" });
      } else {
        res.status(400).json({ status: "ERROR", message: result.error || "Не удалось отправить сообщение" });
      }
    } catch (e: any) {
      res.status(500).json({ status: "ERROR", message: e.message || String(e) });
    }
  });

  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { botToken, chatId, message, parseMode } = req.body;
      let finalBotToken = (botToken || "").trim();
      let finalChatId = (chatId || "").trim();

      // If token/chatId not passed explicitly in body, try to fetch from stored CRM config
      if (!finalBotToken || !finalChatId) {
        const config = await getCRMConfig();
        if (config) {
          finalBotToken = finalBotToken || config.telegramBotToken;
          finalChatId = finalChatId || config.telegramGroupChatId;
        }
      }

      if (!finalBotToken || !finalChatId) {
        return res.status(400).json({ status: "ERROR", message: "Telegram bot token or Chat ID not configured in CRM settings" });
      }

      const result = await sendTelegramAlertServer(finalBotToken, finalChatId, message);
      if (result.success) {
        res.json({ status: "OK", result: result.result });
      } else {
        res.status(500).json({ status: "ERROR", error: result.error });
      }
    } catch (e: any) {
      console.error("Error in /api/telegram/send:", e);
      res.status(500).json({ status: "ERROR", message: String(e) });
    }
  });

  // AI Progress Report Generation Endpoint (Quarterly / 3-Month child progress analysis)
  app.post("/api/gemini/generate-progress-report", async (req, res) => {
    try {
      const {
        clientId,
        childName,
        childSurname,
        childAge,
        childBirthYear,
        groupName,
        coachName,
        periodLabel,
        periodStartDate,
        periodEndDate,
        quarterNumber,
        quarterYear,
        metrics = { technique: 4.5, tactics: 4.2, physical: 4.5, discipline: 4.8 },
        attendanceStats = { totalSessions: 24, present: 22, absent: 1, sick: 1, attendanceRate: 92 },
        coachNotes = [],
        achievements = [],
        homeworksDone = 0,
      } = req.body;

      const fullName = [childSurname, childName].filter(Boolean).join(" ") || "Юный футболист";
      const tech = Number(metrics.technique) || 4.5;
      const tact = Number(metrics.tactics) || 4.2;
      const phys = Number(metrics.physical) || 4.5;
      const disc = Number(metrics.discipline) || 4.8;
      const avgScore = Number(((tech + tact + phys + disc) / 4).toFixed(1));
      
      const speedScore = Number(Math.min(5, Math.max(3.5, (phys * 0.6 + tech * 0.4))).toFixed(1));
      const teamworkScore = Number(Math.min(5, Math.max(3.5, (disc * 0.5 + tact * 0.5))).toFixed(1));

      const apiKey = process.env.GEMINI_API_KEY;
      let generatedReport: any = null;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Ты — старший методист и старший тренер детской футбольной школы «АМКАР ЮНИОР». 
Твоя задача — сформировать глубокий, воодушевляющий, профессиональный и педагогически выверенный ежеквартальный (3-месячный) отчет о прогрессе юного футболиста.

ДАННЫЕ СПОРТСМЕНА:
- Имя и Фамилия: ${fullName}
- Возраст: ${childAge || 7} лет (${childBirthYear ? childBirthYear + ' г.р.' : ''})
- Группа: ${groupName || 'Младшая группа'}
- Тренер: ${coachName || 'Тренерский штаб АМКАР ЮНИОР'}
- Период отчета (3 месяца): ${periodLabel || 'Текущий квартал'} (${periodStartDate || ''} — ${periodEndDate || ''})

ОТМЕТКИ И НАВЫКИ (по 5-балльной шкале):
- Техника владения мячом: ${tech} / 5.0
- Тактическое мышление и игра: ${tact} / 5.0
- Физическая подготовка и выносливость: ${phys} / 5.0
- Дисциплина и самоотдача: ${disc} / 5.0

СТАТИСТИКА ПОСЕЩАЕМОСТИ ЗА 3 МЕСЯЦА:
- Всего тренировок по плану: ${attendanceStats.totalSessions || 24}
- Посещено: ${attendanceStats.present || 22}
- Пропущено по болезни: ${attendanceStats.sick || 1}
- Прочих пропусков: ${attendanceStats.absent || 1}
- Процент посещаемости: ${attendanceStats.attendanceRate || 92}%

ОТМЕТКИ И КОММЕНТАРИИ ТРЕНЕРОВ:
${coachNotes.length > 0 ? coachNotes.map((n: string) => `- ${n}`).join('\n') : '- Регулярная качественная работа на тренировках, активное участие во всех упражнениях и игровых моментах.'}

ДОСТИЖЕНИЯ И ЗАДАНИЯ:
- Заработанные награды: ${achievements.length > 0 ? achievements.join(', ') : 'Стабильное выполнение программы'}
- Выполнено домашних футбольных заданий: ${homeworksDone}

СФОРМИРУЙ JSON со следующими полями:
{
  "overallSummary": "Развернутый абзац (4-6 предложений) с анализом прогресса за прошедшие 3 месяца: динамика формы, уверенность на поле, взаимодействие с партнерами.",
  "strengths": ["3-4 ключевые сильные стороны и конкретные футбольные элементы, где заметен наибольший скачок"],
  "growthAreas": ["2-3 зоны роста и тактические аспекты для развития на следующие 3 месяца"],
  "recommendationsForChild": ["3-4 конкретных упражнения, совета и футбольных челленджей для ребенка дома и на поле"],
  "recommendationsForParents": ["2-3 дельные рекомендации для родителей (поддержка, режим дня, баланс нагрузки)"],
  "coachTips": "Персональное напутствие тренера на следующий 3-месячный этап",
  "motivationalMessage": "Вдохновляющее, теплое пожелание юному чемпиону от академии АМКАР ЮНИОР",
  "overallScore": ${avgScore},
  "radarScores": {
    "technique": ${tech},
    "tactics": ${tact},
    "physical": ${phys},
    "discipline": ${disc},
    "speed": ${speedScore},
    "teamwork": ${teamworkScore}
  }
}
Отвечай ТОЛЬКО валидным JSON без лишнего текста и без Markdown backticks.`;

          const modelsToTry = ["gemini-2.5-flash", "gemini-3.7-flash"];
          for (const m of modelsToTry) {
            try {
              const aiResponse = await ai.models.generateContent({
                model: m,
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                },
              });

              const responseText = aiResponse.text?.trim() || "";
              if (responseText) {
                const cleanedJson = responseText.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
                generatedReport = JSON.parse(cleanedJson);
                if (generatedReport && generatedReport.overallSummary) {
                  break;
                }
              }
            } catch (mErr: any) {
              console.warn(`Gemini generation with ${m} unavailable or busy (${mErr?.message || mErr}), trying fallback...`);
            }
          }
        } catch (geminiError) {
          console.warn("Gemini API generation error, falling back to smart engine:", geminiError);
        }
      }

      // Intelligent Rule-Based Generator Fallback (if no API key or on rate limit)
      if (!generatedReport || !generatedReport.overallSummary) {
        const attendanceQuality = attendanceStats.attendanceRate >= 85 ? "высокую стабильность посещения тренировок" : "хорошую вовлеченность";
        const techDesc = tech >= 4.7 ? "блестящий контроль мяча, уверенный дриблинг и мягкое первое касание" : tech >= 4.0 ? "уверенный прогресс в базовых технических элементах и работе с мячом" : "заметное улучшение координации и чувства мяча";
        const tactDesc = tact >= 4.5 ? "зрелое игровое мышление и быстрое принятие решений на поле" : "активное понимание игровой позиции и взаимодействие с партнерами";

        generatedReport = {
          overallSummary: `За прошедшие 3 месяца ${fullName} продемонстрировал(а) отличную динамику в футбольном развитии и ${attendanceQuality}. На тренировках отмечается ${techDesc}, а также ${tactDesc}. Дисциплина и концентрация внимания находятся на уровне ${disc} из 5.0, что позволяет максимально эффективно усваивать тренерские установки. Ребенок проявляет спортивный характер, лидерские качества и искреннюю любовь к футболу.`,
          strengths: [
            tech >= 4.5 ? "Качественный контроль мяча и уверенное ведение обеими ногами" : "Улучшение координации и техники работы с мячом",
            tact >= 4.3 ? "Быстрое переключение между атакой и обороной, открывание в свободные зоны" : "Позиционная грамотность при командной игре",
            disc >= 4.6 ? "Железная самоотдача, уважение к партнерам и строгое соблюдение регламента" : "Высокая мотивация и вовлеченность в командный процесс",
            `Отличный показатель посещаемости (${attendanceStats.attendanceRate}%) за прошедший 3-месячный цикл`,
          ],
          growthAreas: [
            "Увеличение скорости принятия решений под давлением соперника (игры 1 в 1 и 2 в 2)",
            "Развитие навыка сканирования поля перед приемом мяча (игра 'с поднятой головой')",
            "Повышение взрывной стартовой скорости и устойчивости в силовых единоборствах",
          ],
          recommendationsForChild: [
            "Ежедневная разминка с мячом дома: 100 набиваний и 'восьмерка' вокруг препятствий",
            "Отработка ударов и передач слабой ногой у стенки (по 10-15 минут 3 раза в неделю)",
            "Больше игровых мини-футбольных ситуаций на тренировках с активным поиском свободных зон",
            "Постоянный визуальный контроль поля перед приемом мяча",
          ],
          recommendationsForParents: [
            "Поддерживайте интерес ребенка к тренировкам, хвалите за старание и самоотдачу, а не только за забитые голы.",
            "Соблюдайте режим сна (не менее 9-10 часов) и сбалансированное питание перед тренировками.",
            "Поощряйте самостоятельную работу с мячом на свежем воздухе в выходные дни.",
          ],
          coachTips: `Продолжай тренироваться с такой же страстью и целеустремленностью! Тренерский штаб видит твой огромный потенциал. Главный ориентир на следующие 3 месяца — смелость в принятии нестандартных решений на поле.`,
          motivationalMessage: `«АМКАР ЮНИОР» гордится твоими успехами за этот квартал! Ты растешь настоящим спортсменом и командным игроком. Только вперед к новым победам!`,
          overallScore: avgScore,
          radarScores: {
            technique: tech,
            tactics: tact,
            physical: phys,
            discipline: disc,
            speed: speedScore,
            teamwork: teamworkScore,
          },
        };
      }

      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fullReport = {
        id: reportId,
        clientId,
        childName,
        childSurname,
        groupName,
        coachName,
        periodLabel: periodLabel || `Квартал ${quarterNumber || 1} ${quarterYear || new Date().getFullYear()}`,
        periodStartDate: periodStartDate || "",
        periodEndDate: periodEndDate || "",
        quarterNumber: quarterNumber || Math.ceil((new Date().getMonth() + 1) / 3),
        quarterYear: quarterYear || new Date().getFullYear(),
        createdAt: new Date().toISOString(),
        generatedBy: "auto",
        metrics: {
          technique: tech,
          tactics: tact,
          physical: phys,
          discipline: disc,
        },
        attendanceStats,
        coachNotesSummary: coachNotes.join("; "),
        ...generatedReport,
      };

      // Save report in Firestore under progress_reports collection for durability
      await saveFirestoreDoc("progress_reports", reportId, fullReport);

      // Create an App Notification for Parent & Manager
      const notifId = `notif_${Date.now()}_rep`;
      await saveFirestoreDoc("notifications", notifId, {
        id: notifId,
        title: `ИИ-Отчет о прогрессе: ${fullName}`,
        body: `Сформирован квартальный отчет о прогрессе за 3 месяца. Итоговая оценка: ${fullReport.overallScore}/5.0`,
        type: "system",
        targetRole: ["parent", "trainer", "manager", "director"],
        isRead: false,
        dateString: new Date().toISOString(),
      });

      res.json({
        status: "OK",
        report: fullReport,
      });
    } catch (e: any) {
      console.error("Error generating progress report:", e);
      res.status(500).json({ status: "ERROR", message: e.message || String(e) });
    }
  });

  app.get("/api/webhooks/poll", (req, res) => {
    res.json({ leads: (global as any).incomingLeads || [] });
    (global as any).incomingLeads = [];
  });

  app.post("/api/callcheck/add", async (req, res) => {
    try {
      const phone = req.body?.phone || "";
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const url = `https://sms.ru/callcheck/add?api_id=${SMS_RU_API_ID}&phone=${cleanPhone}&json=1`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ status: "ERROR", message: String(e) });
    }
  });

  app.post("/api/callcheck/status", async (req, res) => {
    try {
      const { check_id } = req.body;
      const url = `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${check_id}&json=1`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ status: "ERROR", message: String(e) });
    }
  });

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Set up WebSocket server for Gemini Live API
  const wss = new WebSocketServer({ server });
  wss.on("connection", async (clientWs, req) => {
    try {
      if (req.url === "/api/live") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          clientWs.send(JSON.stringify({ error: "No GEMINI_API_KEY configured." }));
          clientWs.close();
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const sessionPromise = ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              try {
                const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audio) {
                  clientWs.send(JSON.stringify({ audio }));
                }
                if (message.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ interrupted: true }));
                }
              } catch (e) {
                console.error("Error processing output audio:", e);
              }
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
            },
            systemInstruction: {
              parts: [{
                text: "Ты родитель ребёнка, который занимается футболом в школе АМКАР ЮНИОР. Твоя задача — естественно и реалистично общаться по телефону с менеджером детской футбольной школы, который тебе звонит. Ты можешь задавать вопросы про расписание, стоимость, тренеров, отменять или переносить занятия. Общайся короткими фразами, как в реальном телефонном разговоре."
              }]
            }
          },
        });

        clientWs.on("message", (data) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.audio) {
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
                });
              });
            }
          } catch (e) {
            console.error("Failed handling incoming WS msg", e);
          }
        });

        clientWs.on("close", () => {
          sessionPromise.then(session => {
            try { session.close(); } catch (e) {}
          });
        });
      }
    } catch(err) {
      console.error("WS error: ", err);
    }
  });
}

startServer();
