const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@nexus.com';
    // Cek apakah admin sudah ada agar tidak duplikat saat restart server
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('AdminNexus123!', 10);
      await User.create({
        name: 'Aisyah Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin', // Sesuai ENUM di model User kamu
        department: 'IT Infrastructure',
        is_active: true
      });
      console.log('✅ Default Admin created: admin@nexus.com');
    } else {
      console.log('ℹ️ Admin sudah ada, skip seeding.');
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

module.exports = seedAdmin;