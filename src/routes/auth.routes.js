const express = require('express')
const router = express.Router()
const {
  login,
  getMe,
  getAllUsers
} = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/rbac')
const { validate } = require('../middleware/validator')
const { authLimiter } = require('../middleware/rateLimiter')

/**
 * @route   POST /api/auth/login
 * @desc    Login user via Supabase Auth
 * @access  Public
 */
router.post('/login', authLimiter, validate('login'), login)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile data
 * @access  Protected
 */
router.get('/me', authenticate, getMe)

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Protected (Admin)
 */
router.get('/users', authenticate, authorize('admin'), getAllUsers)

module.exports = router