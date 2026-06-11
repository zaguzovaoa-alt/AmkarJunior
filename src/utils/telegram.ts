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
      console.error("Failed to send telegram alert:", await response.text());
    }
  } catch (error) {
    console.error("Telegram exact send error", error);
  }
};
