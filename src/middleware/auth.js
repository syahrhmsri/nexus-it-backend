// backend/src/middleware/auth.js
const { createClient } = require('@supabase/supabase-js')
const { errorResponse } = require('../utils/response')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided.', 401)
    }

    const token = authHeader.split(' ')[1]

    // ✅ Verify token via Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return errorResponse(res, 'Invalid or expired token.', 401)
    }

    // ✅ Ambil data lengkap dari tabel public.users
    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email, role, department')
      .eq('id', user.id)
      .single()

    req.user = userData || { id: user.id, email: user.email, role: 'user' }
    next()

  } catch (error) {
    console.error('Auth middleware error:', error)
    return errorResponse(res, 'Authentication failed.', 500)
  }
}

module.exports = { authenticate }