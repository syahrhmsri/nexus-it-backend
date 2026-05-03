// backend/tests/auth.test.js
const request = require('supertest')
const app = require('../app')

describe('Auth API', () => {
  let authToken = ''

  // Test Login
  test('POST /api/auth/login — success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@nexusit.com',
        password: 'Admin@12345'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('token')
    expect(res.body.data).toHaveProperty('user')
    expect(res.body.data.user.role).toBe('admin')

    authToken = res.body.data.token
  })

  // Test Login gagal
  test('POST /api/auth/login — wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@nexusit.com',
        password: 'wrongpassword'
      })

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // Test Get Me
  test('GET /api/auth/me — with token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.data.user).toHaveProperty('email')
  })

  // Test Get Me tanpa token
  test('GET /api/auth/me — no token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.statusCode).toBe(401)
  })
})
