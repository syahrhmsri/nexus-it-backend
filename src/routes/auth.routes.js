const express = require('express')
const router = express.Router()

// Auth routes stubs
router.post('/login', (req, res) => res.json({ message: 'Login stub' }))
router.post('/register', (req, res) => res.json({ message: 'Register stub' }))

module.exports = router
