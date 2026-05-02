require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./src/models'); // Pastikan import ini benar

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected to Supabase!');
    
    // Perintah ini yang akan membuat tabel otomatis di Supabase
    await sequelize.sync({ alter: true }); 
    console.log('✅ Models synced & Tables created!');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();