require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  user: 'postgres.vtigceezhzxalumwlbsz',
  password: 'bd123',
  database: 'postgres',
  port: 5432,
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos Supabase');
  }
});

module.exports = db;
