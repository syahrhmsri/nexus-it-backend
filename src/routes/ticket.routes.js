const express = require('express')
const router = express.Router()
const ticketController = require('../controllers/ticket.controller')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/rbac')
const { authenticateSystem } = require('../middleware/system.auth')

// Fungsi pembantu untuk mengizinkan salah satu (User atau System)
const authenticateFlex = (req, res, next) => {
  if (req.headers['x-system-token']) {
    return authenticateSystem(req, res, next)
  }
  return authenticate(req, res, next)
}

// GET semua tiket
router.get('/', authenticate, ticketController.getAllTickets)

// GET statistik tiket
router.get('/stats', authenticate, ticketController.getTicketStats)

// Route export
router.get('/export', authenticate, ticketController.exportTicketsData)

// GET detail tiket
router.get('/:id', authenticate, ticketController.getTicketById)

// POST buat tiket baru (Bisa dari User atau System NetWatch)
router.post('/', authenticateFlex, ticketController.createTicket)

// PATCH update status tiket
router.patch('/:id/status', authenticate, ticketController.updateTicketStatus)

// PATCH assign tiket
router.patch('/:id/assign',
  authenticate,
  authorize('admin', 'it_staff'),
  ticketController.assignTicket
)

// GET komentar tiket
router.get('/:id/updates', authenticate, ticketController.getTicketUpdates)

// POST tambah komentar
router.post('/:id/updates', authenticate, ticketController.addTicketUpdate)

module.exports = router