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
) => {
  if (!botToken || !chatId) return; // Silent return if not configured
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to send telegram alert:", errText);
      // Fallback: retry without HTML parse mode if HTML parsing failed
      if (errText.includes("can't parse entities")) {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message.replace(/<[^>]*>/g, ""),
          }),
        });
      }
    }
  } catch (error) {
    console.error("Telegram exact send error", error);
  }
};

