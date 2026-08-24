export const escapeHtml = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

export const sendTelegramAlert = async (
  botToken: string | undefined,
  chatId: string | undefined,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  // 1. Primary: Use server proxy route (has access to Firestore config, bypasses CORS & ISP restrictions)
  try {
    const serverRes = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botToken: botToken || undefined,
        chatId: chatId || undefined,
        message,
        parseMode: "HTML",
      }),
    });
    const resData = await serverRes.json().catch(() => null);
    if (serverRes.ok && resData?.status === "OK") {
      return { success: true };
    }
    if (resData?.message || resData?.error) {
      console.warn("Server Telegram proxy reported error:", resData);
    }
  } catch (serverErr) {
    console.warn("Server Telegram route error, trying direct fallback:", serverErr);
  }

  // 2. Direct client-side fallback if botToken and chatId are known
  if (!botToken || !chatId) {
    return { success: false, error: "Токен бота или ID чата не настроены" };
  }

  try {
    let cleanChatId = chatId.trim();
    if (cleanChatId.includes("t.me/")) {
      cleanChatId = "@" + cleanChatId.split("t.me/")[1].replace(/\//g, "");
    }

    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to send telegram alert directly:", errText);
      if (errText.includes("can't parse entities")) {
        const fbRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: message.replace(/<[^>]*>/g, ""),
          }),
        });
        if (fbRes.ok) return { success: true };
      }
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Telegram exact send error:", error);
    return { success: false, error: error.message || String(error) };
  }
};

export const testTelegramConnection = async (
  botToken?: string,
  chatId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch("/api/telegram/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken, chatId }),
    });
    const data = await res.json();
    if (res.ok && data.status === "OK") {
      return { success: true, message: data.message || "Тестовое сообщение успешно доставлено в Telegram!" };
    }
    return { success: false, message: data.message || data.error || "Ошибка при проверке Telegram подключения" };
  } catch (e: any) {
    return { success: false, message: e.message || "Не удалось связаться с сервером" };
  }
};

