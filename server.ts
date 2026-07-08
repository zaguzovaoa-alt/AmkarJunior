import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const SMS_RU_API_ID = '9FB08C14-577B-E243-D5D1-E97A00106226';

  app.post("/api/webhooks/forms", (req, res) => {
    try {
      const payload = req.body;
      (global as any).incomingLeads = (global as any).incomingLeads || [];
      (global as any).incomingLeads.push(payload);
      res.json({status: "OK"});
    } catch (e: any) {
      console.error(e);
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
      // Use code/call to receive a call where the code is the last 4 digits
      const url = `https://sms.ru/code/call?api_id=${SMS_RU_API_ID}&phone=${cleanPhone}`;
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
