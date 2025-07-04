const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  
  // Додайте цей рядок, щоб виправити кодування
  client_encoding: 'UTF8', 
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};