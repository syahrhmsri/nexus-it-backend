// backend/app.js
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimiter = require('./src/middleware/rateLimiter')

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)

// Static files (uploads)
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'))
app.use('/api/tickets', require('./src/routes/ticket.routes'))
app.use('/api/assets', require('./src/routes/asset.routes'))
app.use('/api/users', require('./src/routes/user.routes'))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'NEXUS IT Backend',
    timestamp: new Date()
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

module.exports = app