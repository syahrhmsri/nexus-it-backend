/**
 * Notification Service Stub
 */
const sendNotification = async (userId, message) => {
  console.log(`[Notification] To User ${userId}: ${message}`)
  // TODO: Implement actual notification logic (email, push, etc.)
}

module.exports = { sendNotification }
