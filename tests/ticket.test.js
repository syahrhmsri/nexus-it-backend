// backend/tests/ticket.test.js
const request = require('supertest')
const app = require('../app')

describe('Ticket API', () => {
  let authToken = ''
  let ticketId = ''

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@nexusit.com', password: 'Admin@12345' })
    authToken = res.body.data?.token || ''
  })

  test('POST /api/tickets — create ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Ticket from Jest',
        category: 'software',
        priority: 'medium',
        description: 'This is a test ticket created by Jest automated testing.'
      })

    expect(res.statusCode).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.ticket).toHaveProperty('ticket_code')
    expect(res.body.data.ticket.status).toBe('open')

    ticketId = res.body.data.ticket.id
  })

  test('GET /api/tickets — get all tickets', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.data.tickets).toBeInstanceOf(Array)
    expect(res.body.data.tickets.length).toBeGreaterThan(0)
  })

  test('GET /api/tickets/:id — get ticket by id', async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.data.ticket.id).toBe(ticketId)
  })

  test('GET /api/tickets/stats — get stats', async () => {
    const res = await request(app)
      .get('/api/tickets/stats')
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toHaveProperty('open')
    expect(res.body.data).toHaveProperty('in_progress')
    expect(res.body.data).toHaveProperty('resolved')
  })

  test('PATCH /api/tickets/:id/status — update status', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'in_progress',
        message: 'Working on it now'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.data.ticket.status).toBe('in_progress')
  })
})
