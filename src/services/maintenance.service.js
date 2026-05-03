const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const { sendTelegramMessage } = require('./telegram.service')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Monitor Jadwal Maintenance Asset
 * Berjalan setiap hari jam 08:00 pagi
 */
const startMaintenanceMonitor = () => {
  // Jalankan setiap jam 08:00 (0 8 * * *)
  // Untuk keperluan demo, kita jalankan setiap jam (0 * * * *)
  cron.schedule('0 * * * *', async () => {
    console.log('⏲️ Maintenance Monitor started...')

    try {
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      // 1. Cari aset yang maintenance_date-nya dalam 7 hari ke depan
      // Dan statusnya masih 'active' (bukan sedang maintenance)
      const { data: nearingAssets, error } = await supabase
        .from('assets')
        .select('id, asset_code, name, maintenance_date, location')
        .lt('maintenance_date', nextWeek.toISOString())
        .gt('maintenance_date', today.toISOString())
        .eq('status', 'active')

      if (error) throw error

      if (nearingAssets && nearingAssets.length > 0) {
        console.log(`[Maintenance] Found ${nearingAssets.length} assets nearing maintenance.`)

        for (const asset of nearingAssets) {
          const msg = `⚠️ <b>MAINTENANCE REMINDER</b>\n` +
                      `Asset: ${asset.asset_code} - ${asset.name}\n` +
                      `Date: ${new Date(asset.maintenance_date).toLocaleDateString()}\n` +
                      `Location: ${asset.location}\n` +
                      `Please prepare for preventive maintenance.`
          
          await sendTelegramMessage(msg)
        }
      }

      // 2. Cari aset yang SUDAH LEWAT jadwal maintenance tapi status masih 'active'
      const { data: overdueAssets } = await supabase
        .from('assets')
        .select('id, asset_code, name, maintenance_date')
        .lt('maintenance_date', today.toISOString())
        .eq('status', 'active')

      if (overdueAssets && overdueAssets.length > 0) {
        for (const asset of overdueAssets) {
          // Update status menjadi 'maintenance_due' atau biarkan 'active' tapi beri alert keras
          console.warn(`[Maintenance] OVERDUE: ${asset.asset_code}`)
          
          await sendTelegramMessage(`🚨 <b>MAINTENANCE OVERDUE!</b>\nAsset: ${asset.asset_code} - ${asset.name}\nImmediate action required!`)
        }
      }

    } catch (error) {
      console.error('[Maintenance Monitor Error]', error.message)
    }
  })
}

module.exports = { startMaintenanceMonitor }
