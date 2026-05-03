require('dotenv').config()
const app = require('./app')
const { createClient } = require('@supabase/supabase-js')

// IMPORT SCHEDULERS (Pastikan filenya sudah ada ya Syah!)
const { startSLAMonitor } = require('./src/services/sla.service') 
const { startMaintenanceMonitor } = require('./src/services/maintenance.service') 

const PORT = process.env.PORT || 5000

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
)

async function startServer() {
  try {
    // 1. Test koneksi ke Supabase
    const { error } = await supabase.from('users').select('id').limit(1)

    if (error) {
      throw new Error(`Koneksi Supabase Gagal: ${error.message}`)
    }

    console.log('✅ NEXUS IT Database (Supabase) connected!')

    // 2. Jalankan Background Monitor
    startSLAMonitor() // Untuk monitoring SLA Tiket Week 2
    startMaintenanceMonitor() // Untuk monitoring Jadwal Maintenance Asset Week 3

    // 3. Nyalakan Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📍 Health Check: http://localhost:${PORT}/health`)
    })

  } catch (error) {
    console.error('❌ Gagal menyalakan server:', error.message)
    process.exit(1)
  }
}

startServer()