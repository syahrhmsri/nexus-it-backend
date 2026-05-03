const { createClient } = require('@supabase/supabase-js')
const { successResponse, errorResponse } = require('../utils/response')
const { recordAuditLog } = require('../utils/audit')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ===========================
// HELPER: Generate ticket code
// ===========================
const generateTicketCode = async () => {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })

  const number = String((count || 0) + 1).padStart(3, '0')
  return `TKT-${year}-${number}`
}

// ===========================
// HELPER: Hitung SLA deadline
// ===========================
const getSLADeadline = (priority) => {
  const hours = {
    critical: 2,
    high: 8,
    medium: 24,
    low: 72,
  }
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + (hours[priority] || 24))
  return deadline.toISOString()
}

// ===========================
// GET ALL TICKETS
// ===========================
const getAllTickets = async (req, res) => {
  try {
    const {
      status, priority, category,
      search, page = 1, limit = 10
    } = req.query

    let query = supabase
      .from('tickets')
      .select(`
        *,
        submitter:submitted_by (id, name, email),
        assignee:assigned_to (id, name, email)
      `)

    // Filter
    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (category) query = query.eq('category', category)
    if (search) query = query.ilike('title', `%${search}%`)

    // Kalau user biasa, hanya lihat tiket sendiri
    if (req.user.role === 'user') {
      query = query.eq('submitted_by', req.user.id)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return successResponse(res, {
      tickets: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
      }
    })

  } catch (error) {
    console.error('getAllTickets error:', error)
    return errorResponse(res, 'Failed to fetch tickets.', 500)
  }
}
// ... (Bagian atas file seperti getAllTickets tetap ada) ...

// ===========================
// GET TICKET BY ID
// ===========================
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        submitter:submitted_by (id, name, email, department),
        assignee:assigned_to (id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return errorResponse(res, 'Ticket not found.', 404)
    }
    return successResponse(res, { ticket: data })
  } catch (error) {
    return errorResponse(res, 'Failed to fetch ticket.', 500)
  }
}

// ===================================
// DAY 7: EXPORT TICKETS DATA 
// ===================================
const exportTicketsData = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        ticket_code, title, category, priority, status, 
        created_at, sla_deadline, resolved_at,
        submitter:submitted_by (name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return successResponse(res, { tickets: data }, 'Data exported successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to export data.', 500);
  }
}

// ===========================
// CREATE TICKET
// ===========================
const createTicket = async (req, res) => {
  try {
    const { title, category, priority, description } = req.body

    // Validasi
    if (!title || !category || !priority || !description) {
      return errorResponse(res, 'All fields are required.', 400)
    }

    // Day 5: Tambahan validasi karakter
    if (description.length < 20) {
      return errorResponse(res, 'Deskripsi minimal 20 karakter agar IT Staff paham.', 400)
    }

    const ticketCode = await generateTicketCode()
    const slaDeadline = getSLADeadline(priority)

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ticket_code: ticketCode,
        title,
        category,
        priority,
        status: 'open',
        description,
        submitted_by: req.user.id,
        sla_deadline: slaDeadline,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await recordAuditLog(
      req.user.id,
      `Created ticket ${ticketCode}`,
      'helpdesk',
      `Title: ${title}, Priority: ${priority}`
    )

    return successResponse(res, { ticket: data }, 'Ticket created successfully!', 201)
  } catch (error) {
    console.error('createTicket error:', error)
    return errorResponse(res, 'Failed to create ticket.', 500)
  }
}


// ===========================
// UPDATE TICKET STATUS
// ===========================
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, message } = req.body

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status.', 400)
    }

    const updateData = { status, updated_at: new Date().toISOString() }

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Tambah komentar otomatis
    if (message) {
      await supabase.from('ticket_updates').insert({
        ticket_id: id,
        user_id: req.user.id,
        message,
        status_change: status,
      })
    }

    // Log activity
    await recordAuditLog(
      req.user.id,
      `Updated ticket status`,
      'helpdesk',
      `Ticket: ${data.ticket_code}, Status: ${status}`
    )

    return successResponse(res, { ticket: data },
      'Ticket status updated!')

  } catch (error) {
    return errorResponse(res, 'Failed to update ticket status.', 500)
  }
}

// ===========================
// ASSIGN TICKET
// ===========================
const assignTicket = async (req, res) => {
  try {
    const { id } = req.params
    const { assigned_to } = req.body

    const { data, error } = await supabase
      .from('tickets')
      .update({
        assigned_to,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return successResponse(res, { ticket: data }, 'Ticket assigned!')

  } catch (error) {
    return errorResponse(res, 'Failed to assign ticket.', 500)
  }
}

// ===========================
// GET TICKET UPDATES
// ===========================
const getTicketUpdates = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('ticket_updates')
      .select(`
        *,
        user:user_id (id, name, email, role)
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return successResponse(res, { updates: data })

  } catch (error) {
    return errorResponse(res, 'Failed to fetch updates.', 500)
  }
}

// ===========================
// ADD TICKET UPDATE
// ===========================
const addTicketUpdate = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    if (!message) {
      return errorResponse(res, 'Message is required.', 400)
    }

    const { data, error } = await supabase
      .from('ticket_updates')
      .insert({
        ticket_id: id,
        user_id: req.user.id,
        message,
      })
      .select(`
        *,
        user:user_id (id, name, email, role)
      `)
      .single()

    if (error) throw error

    return successResponse(res, { update: data }, 'Comment added!')

  } catch (error) {
    return errorResponse(res, 'Failed to add comment.', 500)
  }
}

// ===========================
// GET TICKET STATS
// ===========================
const getTicketStats = async (req, res) => {
  try {
    const { count: openCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    const { count: inProgressCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')

    const { count: resolvedCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    const { count: overdueCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .lt('sla_deadline', new Date().toISOString())
      .not('status', 'in', '("resolved","closed")')

    return successResponse(res, {
      open: openCount || 0,
      in_progress: inProgressCount || 0,
      resolved: resolvedCount || 0,
      overdue: overdueCount || 0,
    })

  } catch (error) {
    return errorResponse(res, 'Failed to fetch stats.', 500)
  }
}

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  assignTicket,
  getTicketUpdates,
  addTicketUpdate,
  getTicketStats,
  exportTicketsData,
}