/**
 * Telegram Service
 * Mengirim notifikasi ke Telegram Bot
 */
const sendTelegramMessage = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log(`[Telegram] SKIP (No Token/ChatId): ${message}`)
    return
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })

    const result = await response.json()
    if (!result.ok) {
      throw new Error(result.description)
    }

    console.log(`✅ [Telegram] Message sent!`)
  } catch (error) {
    console.error(`❌ [Telegram] Error:`, error.message)
  }
}

module.exports = { sendTelegramMessage }
