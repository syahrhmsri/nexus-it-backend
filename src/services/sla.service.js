const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Background Monitor untuk SLA Tiket
 * Berjalan setiap 1 menit (bisa disesuaikan)
 */
const startSLAMonitor = () => {
  console.log('⏲️ SLA Monitor started...')

  // Schedule: Setiap 1 menit
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date().toISOString()

      // 1. Cari tiket yang overdue tapi statusnya belum diupdate
      const { data: overdueTickets, error: fetchError } = await supabase
        .from('tickets')
        .select('id, ticket_code')
        .lt('sla_deadline', now)
        .not('status', 'in', '("resolved","closed","overdue")')

      if (fetchError) throw fetchError

      if (overdueTickets && overdueTickets.length > 0) {
        console.log(`⚠️  Ditemukan ${overdueTickets.length} tiket baru yang melewati deadline!`)
        
        // 2. Update status ke 'overdue' di database
        const ids = overdueTickets.map(t => t.id)
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ status: 'overdue' })
          .in('id', ids)

        if (updateError) throw updateError
        
        console.log(`✅ Berhasil mengupdate ${ids.length} tiket menjadi OVERDUE.`)
      }

    } catch (error) {
      console.error('❌ SLA Monitor Error:', error.message)
    }
  })
}

module.exports = { startSLAMonitor }
