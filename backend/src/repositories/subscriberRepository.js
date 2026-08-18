const { pool } = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM subscribers ORDER BY subscribedAt DESC');
  return rows;
};

exports.findAllEmails = async () => {
  const [rows] = await pool.query('SELECT email FROM subscribers');
  return rows.map(r => r.email);
};

exports.create = async (email) => {
  await pool.query('INSERT INTO subscribers (email) VALUES (?)', [email]);
};
