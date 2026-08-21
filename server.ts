import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

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
    return null;
  }
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/_config/initialized?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const fields = data?.fields?.crmConfig?.mapValue?.fields;
    if (!fields) return null;

    return {
      telegramBotToken: fields.telegramBotToken?.stringValue || "",
      telegramGroupChatId: fields.telegramGroupChatId?.stringValue || "",
      telegramAlerts: {
        newLead: fields.telegramAlerts?.mapValue?.fields?.newLead?.booleanValue ?? true,
      }
    };
  } catch (e) {
    console.error("Failed to fetch CRM config from Firestore:", e);
    return null;
  }
}

async function sendTelegramAlertServer(botToken: string, chatId: string, text: string) {
  if (!botToken || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Telegram send alert failed:", errText);
      if (errText.includes("can't parse entities")) {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: text.replace(/<[^>]*>/g, ""),
          }),
        });
      }
    } else {
      console.log("Telegram alert sent successfully to chatId:", chatId);
    }
  } catch (e) {
    console.error("Telegram error on server:", e);
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

async function processIncomingLead(payload: any) {
  let parentPhone = "Не указан";
  let parentName = "Родитель (из формы)";
  let childName = "Ребенок";
  let childSurname = "";
  let notesList: string[] = [];
  let formSource = "Веб-форма";

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
        (k === "name" && parentName === "Родитель (из формы)")
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
      } else if (k.includes("source") || k.includes("источник")) {
        formSource = v;
      } else {
        notesList.push(`${key}: ${v}`);
      }
    });
  }

  const parentNameFinal = payload.parentName || payload.name || parentName;
  const parentPhoneFinal = payload.parentPhone || payload.phone || payload.contact || parentPhone;
  const childNameFinal = payload.childName || payload.child || childName;
  const childSurnameFinal = payload.childSurname || payload.surname || childSurname;
  const sourceFinal = payload.utm_source || payload.source || formSource || "Веб-форма";
  const childAgeFinal = Number(payload.childAge || payload.age) || 8;
  const notesFinal = notesList.join("\n") || payload.notes || "Заявка из веб-формы";

  const now = new Date();
  const leadId = `l_${Date.now()}`;
  const timeString = now.toTimeString().substring(0, 5);

  const newLead = {
    id: leadId,
    parentName: parentNameFinal,
    parentPhone: parentPhoneFinal,
    parentEmail: payload.parentEmail || payload.email || "",
    childName: childNameFinal,
    childSurname: childSurnameFinal,
    childBirthYear: Number(payload.childBirthYear || payload.year) || 2017,
    childAge: childAgeFinal,
    source: sourceFinal,
    notes: notesFinal,
    timeString: timeString,
    createdAt: now.toISOString(),
    status: "new",
  };

  const ageText = childAgeFinal > 0 ? ` (${childAgeFinal} лет)` : "";

  // 1. Fetch config and send Telegram notification IMMEDIATELY from server
  const config = await getCRMConfig();
  if (config && config.telegramAlerts.newLead !== false && config.telegramBotToken && config.telegramGroupChatId) {
    const telegramMessage = `🚨 <b>НОВАЯ ЗАЯВКА</b>\n<b>Имя:</b> ${childSurnameFinal} ${childNameFinal}${ageText}\n<b>Источник:</b> ${sourceFinal}\n<b>Родитель:</b> ${parentNameFinal}\n<b>Телефон:</b> ${parentPhoneFinal}`;
    await sendTelegramAlertServer(config.telegramBotToken, config.telegramGroupChatId, telegramMessage);
  }

  // 2. Save lead directly to Firestore
  await saveFirestoreDoc("leads", leadId, newLead);

  // 3. Create Manager Task in Firestore
  const managerTaskId = `t_${Date.now()}_m`;
  const managerTask = {
    id: managerTaskId,
    title: `⚡ НОВАЯ ЗАЯВКА: ${childSurnameFinal} ${childNameFinal}`,
    assignedTo: "manager",
    status: "new",
    dueDate: now.toLocaleDateString("ru-RU"),
    description: `🔥 Внимание! Поступила новая заявка из канала [${sourceFinal}].\nРодитель: ${parentNameFinal}\nТелефон: ${parentPhoneFinal}\n🔔 НЕОБХОДИМО: Связаться в ближайшее время, уточнить детали и ЗАПИСАТЬ в расписание на пробную тренировку!`,
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
    description: `Новый потенциальный клиент: ${childSurnameFinal} ${childNameFinal}${ageText}. Источник: ${sourceFinal}`,
  };
  await saveFirestoreDoc("tasks", directorTaskId, directorTask);

  // 5. Create System Notification in Firestore (triggers push notification on all active clients via onSnapshot)
  const notifId = `notif_${Date.now()}`;
  const notification = {
    id: notifId,
    title: "Новая заявка!",
    body: `Поступила новая заявка: ${childSurnameFinal} ${childNameFinal}. Источник: ${sourceFinal}`,
    type: "system",
    targetRole: ["director", "admin", "manager"],
    isRead: false,
    dateString: now.toISOString(),
  };
  await saveFirestoreDoc("notifications", notifId, notification);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const SMS_RU_API_ID = '9FB08C14-577B-E243-D5D1-E97A00106226';

  app.post(["/api/webhooks/forms", "/api/webhooks/lead", "/api/webhooks/yandex"], async (req, res) => {
    try {
      const payload = req.body;
      console.log("Received lead webhook payload:", payload);

      (global as any).incomingLeads = (global as any).incomingLeads || [];
      (global as any).incomingLeads.push(payload);

      // Process immediately on server (Telegram alert + Firestore save + Push notification trigger)
      processIncomingLead(payload).catch((err) => {
        console.error("Error processing lead on server:", err);
      });

      res.json({ status: "OK" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ status: "ERROR", message: String(e) });
    }
  });

  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { botToken, chatId, message, parseMode } = req.body;
      let finalBotToken = botToken;
      let finalChatId = chatId;

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

      const url = `https://api.telegram.org/bot${finalBotToken}/sendMessage`;
      const tgRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: finalChatId,
          text: message,
          parse_mode: parseMode || "HTML",
        }),
      });

      if (!tgRes.ok) {
        const errText = await tgRes.text();
        console.error("Server Telegram send failed:", errText);
        if (errText.includes("can't parse entities")) {
          const fallbackRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: finalChatId,
              text: (message || "").replace(/<[^>]*>/g, ""),
            }),
          });
          const fallbackData = await fallbackRes.json();
          return res.json({ status: "OK", result: fallbackData });
        }
        return res.status(500).json({ status: "ERROR", error: errText });
      }

      const data = await tgRes.json();
      res.json({ status: "OK", result: data });
    } catch (e: any) {
      console.error("Error in /api/telegram/send:", e);
      res.status(500).json({ status: "ERROR", message: String(e) });
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
