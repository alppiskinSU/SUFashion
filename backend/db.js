const mysql = require('mysql2');
require('dotenv').config();

let pool = null;

function getDB() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    }).promise();
  }
  return pool;
}

module.exports = { getDB }; 