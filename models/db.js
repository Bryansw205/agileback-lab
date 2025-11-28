require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || (
  process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME
    ? `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`
    : null
);

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Compatibilidad con llamadas estilo mysql2: db.query(sql, params, cb)
module.exports = {
  query: (text, params, cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(text, params)
      .then(res => cb(null, res.rows))
      .catch(err => cb(err));
  },
  pool
};
