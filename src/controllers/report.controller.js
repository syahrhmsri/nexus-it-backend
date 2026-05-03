const { createClient } = require('@supabase/supabase-js')
const { errorResponse } = require('../utils/response')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Export semua tiket ke format CSV
 */
const exportTicketsCSV = async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('ticket_code, title, priority, status, created_at, sla_deadline')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Generate CSV Header
    let csvContent = 'Code,Title,Priority,Status,Created At,Deadline\n'

    // Add rows
    tickets.forEach(t => {
      const row = [
        t.ticket_code,
        `"${t.title.replace(/"/g, '""')}"`,
        t.priority,
        t.status,
        t.created_at,
        t.sla_deadline
      ].join(',')
      csvContent += row + '\n'
    })

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=nexus-it-tickets.csv')
    
    return res.status(200).send(csvContent)

  } catch (error) {
    console.error('Export Error:', error.message)
    return errorResponse(res, 'Gagal mengekspor laporan.', 500)
  }
}

/**
 * Export semua asset ke format CSV
 */
const exportAssetsCSV = async (req, res) => {
  try {
    const { data: assets, error } = await supabase
      .from('assets')
      .select('asset_code, name, category, brand, serial_number, location, status, condition, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Generate CSV Header
    let csvContent = 'Code,Name,Category,Brand,Serial Number,Location,Status,Condition,Registered At\n'

    // Add rows
    assets.forEach(a => {
      const row = [
        a.asset_code,
        `"${a.name.replace(/"/g, '""')}"`,
        a.category,
        a.brand || '-',
        a.serial_number || '-',
        a.location || '-',
        a.status,
        a.condition,
        a.created_at
      ].join(',')
      csvContent += row + '\n'
    })

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=nexus-it-assets.csv')
    
    return res.status(200).send(csvContent)

  } catch (error) {
    console.error('Export Error:', error.message)
    return errorResponse(res, 'Gagal mengekspor laporan aset.', 500)
  }
}

module.exports = { exportTicketsCSV, exportAssetsCSV }