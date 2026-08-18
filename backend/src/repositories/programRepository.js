const { pool } = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM programs');
  return rows;
};

exports.create = async (program) => {
  const { id, name, category, thumbnail, type, description, schedule, host, coverImage, hostImage } = program;
  await pool.query(
    `INSERT INTO programs (id, name, category, thumbnail, type, description, schedule, host, coverImage, hostImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, category, thumbnail, type, description, schedule, host, coverImage, hostImage || null]
  );
};

exports.update = async (id, program) => {
  const { name, category, thumbnail, type, description, schedule, host, coverImage, hostImage } = program;
  await pool.query(
    `UPDATE programs SET name=?, category=?, thumbnail=?, type=?, description=?, schedule=?, host=?, coverImage=?, hostImage=? WHERE id=?`,
    [name, category, thumbnail, type, description, schedule, host, coverImage, hostImage || null, id]
  );
};

exports.delete = async (id) => {
  await pool.query('DELETE FROM programs WHERE id=?', [id]);
};

exports.findRecent = async (limit = 3) => {
  const [rows] = await pool.query('SELECT * FROM programs LIMIT ?', [limit]);
  return rows;
};

exports.search = async (searchTerm, limit = 5) => {
  const [rows] = await pool.query(
    'SELECT * FROM programs WHERE name LIKE ? OR description LIKE ? OR category LIKE ? LIMIT ?',
    [searchTerm, searchTerm, searchTerm, limit]
  );
  return rows;
};
