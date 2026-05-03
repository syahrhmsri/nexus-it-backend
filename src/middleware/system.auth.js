// backend/src/middleware/system.auth.js
const { errorResponse } = require('../utils/response')

const authenticateSystem = (req, res, next) => {
  const token = req.headers['x-system-token'] || 
    req.headers.authorization?.split(' ')[1]

  if (!token || token !== process.env.SYSTEM_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'System token invalid.'
    })
  }

  // Set system user
  req.user = {
    id: 'system',
    name: 'NetWatch System',
    role: 'admin',
    email: 'system@nexusit.com'
  }

  next()
}

module.exports = { authenticateSystem }
