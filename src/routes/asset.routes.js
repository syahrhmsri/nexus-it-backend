const express = require('express')
const router = express.Router()

// Asset routes stubs
router.get('/', (req, res) => res.json({ message: 'Asset list stub' }))

module.exports = router
