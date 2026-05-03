// backend/src/routes/asset.routes.js
const express = require('express')
const router = express.Router()
const assetController = require('../controllers/asset.controller') // Pakai objek agar lebih aman
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/rbac')
const upload = require('../middleware/upload')

// Semua route di bawah ini wajib login
router.use(authenticate)

// 1. Stats (Letakkan di atas agar tidak dianggap sebagai :id)
router.get('/stats', assetController.getAssetStats)

// 2. Assets CRUD
router.get('/', assetController.getAssets)
router.get('/:id', assetController.getAssetById)
router.get('/:id/qr', assetController.getAssetQRCode)

// Route yang butuh role khusus
router.post('/', 
  authorize('it_staff', 'super_admin', 'admin'), 
  upload.single('photo'), 
  assetController.createAsset
)

router.put('/:id', 
  authorize('it_staff', 'super_admin', 'admin'), 
  upload.single('photo'), 
  assetController.updateAsset
)

router.delete('/:id',
  authorize('super_admin', 'admin'),
  assetController.deleteAsset
)

module.exports = router