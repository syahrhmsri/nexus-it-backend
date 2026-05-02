const express = require('express')
const router = express.Router()

// User routes stubs
router.get('/profile', (req, res) => res.json({ message: 'User profile stub' }))

module.exports = router
