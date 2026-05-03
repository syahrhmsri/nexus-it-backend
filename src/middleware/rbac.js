// backend/src/middleware/rbac.js
const { errorResponse } = require('../utils/response')

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated.', 401)
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied.', 403)
    }

    next()
  }
}

module.exports = { authorize }