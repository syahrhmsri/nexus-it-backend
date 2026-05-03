// backend/src/middleware/validator.js
const Joi = require('joi')
const { errorResponse } = require('../utils/response')

// Schema validasi
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(8).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
        'any.required': 'Password is required'
      }),
    role: Joi.string().valid('super_admin', 'it_staff', 'end_user')
      .default('end_user'),
    department: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
  })
}

// Middleware validator
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName]
    
    if (!schema) {
      return next()
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false // tampilkan semua error sekaligus
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
      return errorResponse(res, 'Validation failed', 422, errors)
    }

    req.body = value // gunakan value yang sudah divalidasi
    next()
  }
}

module.exports = { validate }