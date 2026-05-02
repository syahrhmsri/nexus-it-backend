const sequelize = require('../config/database');
const User = require('./User');

// Jika nanti ada model Ticket dan Asset, tambahkan di sini
const db = {
  sequelize,
  User
};

module.exports = db;