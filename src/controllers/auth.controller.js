const { createClient } = require('@supabase/supabase-js')
const { successResponse, errorResponse } = require('../utils/response')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Login ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) return errorResponse(res, authError.message, 401)

    // 2. Ambil data profil dari tabel 'users' kita
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    return successResponse(res, {
      token: authData.session.access_token,
      user: userData || authData.user
    }, 'Login successful!')

  } catch (error) {
    return errorResponse(res, 'Login failed on server.', 500)
  }
}

const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    return successResponse(res, { user })
  } catch (error) {
    return errorResponse(res, 'Failed to fetch user data.', 500)
  }
}

const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return successResponse(res, { users })
  } catch (error) {
    return errorResponse(res, 'Failed to fetch all users.', 500)
  }
}

module.exports = { login, getMe, getAllUsers }