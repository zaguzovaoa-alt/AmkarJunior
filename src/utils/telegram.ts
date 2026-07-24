export const escapeTelegramHtml = (str: string): string => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

export const sendTelegramAlert = async (
  botToken: string | undefined,
  chatId: string | undefined,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  if (!botToken || !chatId) {
    console.warn("Telegram alert skipped: botToken or chatId missing");
    return { success: false, error: "Токен бота или ID чата не заполнено" };
  }

  const cleanToken = botToken.trim().replace(/^bot/i, '');
  const cleanChatId = chatId.trim();

  // Attempt 1: Route through backend proxy first to avoid client CORS / adblocker / network issues
  try {
    const proxyRes = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: cleanToken, chatId: cleanChatId, message }),
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.status === "OK") return { success: true };
    }
  } catch (e) {
    console.warn("Backend Telegram proxy failed, using direct client fetch fallback", e);
  }

  // Attempt 2: Direct fetch to Telegram API
  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    let resText = await response.text();

    // If HTML entities failed, retry as raw text
    if (!response.ok && resText.includes("can't parse entities")) {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: message,
        }),
      });
      resText = await response.text();
    }

    if (!response.ok) {
      console.error("Failed to send telegram alert:", resText);
      return { success: false, error: resText };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Telegram exact send error", error);
    return { success: false, error: String(error?.message || error) };
  }
};
