require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { generalLimiter } = require('./src/middleware/rateLimiter')

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(generalLimiter)
app.use('/uploads', express.static('uploads'))

// ROUTES
app.use('/api/auth', require('./src/routes/auth.routes'))
app.use('/api/tickets', require('./src/routes/ticket.routes'))
app.use('/api/assets', require('./src/routes/asset.routes'))
app.get('/api/reports/tickets/export', require('./src/controllers/report.controller').exportTicketsCSV)
app.get('/api/reports/assets/export', require('./src/controllers/report.controller').exportAssetsCSV)

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NEXUS IT Backend (Supabase Version)',
    timestamp: new Date()
  })
})

// Error Handling 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

module.exports = app