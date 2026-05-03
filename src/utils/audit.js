const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Mencatat aktivitas user ke tabel audit_logs
 * @param {string} userId - ID User yang melakukan aksi
 * @param {string} action - Deskripsi aksi (e.g., 'Deleted Asset AST-001')
 * @param {string} module - Nama modul (helpdesk, assets, network, auth)
 * @param {string} detail - Detail tambahan dalam format string
 */
const recordAuditLog = async (userId, action, module, detail = '') => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: userId,
          action: action,
          module: module,
          detail: detail,
          created_at: new Date().toISOString()
        }
      ])

    if (error) throw error
    console.log(`[Audit] Recorded: ${action} by User ${userId}`)
  } catch (error) {
    console.error('[Audit Error]', error.message)
  }
}

module.exports = { recordAuditLog }
