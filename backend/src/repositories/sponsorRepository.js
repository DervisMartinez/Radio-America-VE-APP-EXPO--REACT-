const { pool } = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM sponsors ORDER BY createdAt DESC');
  return rows;
};

exports.create = async (sponsor) => {
  const { id, name, url, programId, type, assignedEntities } = sponsor;
  await pool.query(
    `INSERT INTO sponsors (id, name, url, programId, type, assignedEntities) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, url, programId || null, type || 'audio', assignedEntities ? JSON.stringify(assignedEntities) : null]
  );
};

exports.update = async (id, sponsor) => {
  const { name, type, assignedEntities } = sponsor;
  await pool.query(
    `UPDATE sponsors SET name=?, type=?, assignedEntities=? WHERE id=?`,
    [name, type || 'audio', assignedEntities ? JSON.stringify(assignedEntities) : null, id]
  );
};

exports.delete = async (id) => {
  await pool.query('DELETE FROM sponsors WHERE id=?', [id]);
};
