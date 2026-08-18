const { pool } = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM banners ORDER BY createdAt DESC');
  return rows;
};

exports.create = async (banner) => {
  const { id, title, imageUrl, url } = banner;
  await pool.query(
    'INSERT INTO banners (id, title, imageUrl, url) VALUES (?, ?, ?, ?)',
    [id, title || null, imageUrl, url || null]
  );
};

exports.update = async (id, banner) => {
  const { title, imageUrl, url } = banner;
  await pool.query(
    'UPDATE banners SET title=?, imageUrl=?, url=? WHERE id=?',
    [title || null, imageUrl, url || null, id]
  );
};

exports.delete = async (id) => {
  await pool.query('DELETE FROM banners WHERE id=?', [id]);
};
