export async function sendDiscordNotification(webhookUrl: string, content: string): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch {
    // Discord通知の失敗はサイレントに無視する
  }
}
