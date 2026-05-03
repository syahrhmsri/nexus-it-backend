// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit')

// Rate limiter umum
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // max 100 request per 15 menit
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
})

// Rate limiter ketat untuk auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // max 5 percobaan login per 15 menit
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true // tidak hitung request yang berhasil
})

module.exports = { generalLimiter, authLimiter }