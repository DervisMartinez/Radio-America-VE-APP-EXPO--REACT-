const { pool } = require('../config/db');

exports.findByEmail = async (email) => {
  const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return users.length > 0 ? users[0] : null;
};

exports.findAll = async () => {
  const [rows] = await pool.query('SELECT id, email, role, name, createdAt FROM users ORDER BY createdAt DESC');
  return rows;
};

exports.create = async (user) => {
  const { email, hash, role, name } = user;
  await pool.query(
    'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)', 
    [email, hash, role || 'admin', name || '']
  );
};

exports.delete = async (id) => {
  await pool.query('DELETE FROM users WHERE id=?', [id]);
};

exports.findById = async (id) => {
  const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return user.length > 0 ? user[0] : null;
};
