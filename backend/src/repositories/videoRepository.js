const { pool } = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM videos ORDER BY createdAt DESC');
  return rows.map(v => ({
    ...v,
    isFeatured: !!v.isFeatured,
    isShort: !!v.isShort,
    isAudio: !!v.isAudio,
    isLive: !!v.isLive
  }));
};

exports.create = async (video) => {
  const { id, title, category, thumbnail, description, isFeatured, isShort, isAudio, isLive, url, duration, views, likes, createdAt, programId, releaseDate, pressNoteUrl } = video;
  const parseBool = (val) => (val === true || String(val).toLowerCase() === 'true' || val === 1 || String(val) === '1' || val === 'on') ? 1 : 0;
  
  await pool.query(
    `INSERT INTO videos (id, title, category, thumbnail, description, isFeatured, isShort, isAudio, isLive, url, duration, views, likes, createdAt, programId, releaseDate, pressNoteUrl) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, category, thumbnail, description, parseBool(isFeatured), parseBool(isShort), parseBool(isAudio), parseBool(isLive), url, duration, views || 0, likes || 0, createdAt, programId || null, releaseDate || null, pressNoteUrl || null]
  );
};

exports.update = async (id, video) => {
  const { title, category, thumbnail, description, isFeatured, isShort, isAudio, isLive, url, duration, programId, releaseDate, pressNoteUrl } = video;
  const parseBool = (val) => (val === true || String(val).toLowerCase() === 'true' || val === 1 || String(val) === '1' || val === 'on') ? 1 : 0;

  await pool.query(
    `UPDATE videos SET title=?, category=?, thumbnail=?, description=?, isFeatured=?, isShort=?, isAudio=?, isLive=?, url=?, duration=?, programId=?, releaseDate=?, pressNoteUrl=? WHERE id=?`,
    [title, category, thumbnail, description, parseBool(isFeatured), parseBool(isShort), parseBool(isAudio), parseBool(isLive), url, duration, programId || null, releaseDate || null, pressNoteUrl || null, id]
  );
};

exports.updateUrl = async (oldUrl, newUrl) => {
  await pool.query('UPDATE videos SET url = ? WHERE url = ?', [newUrl, oldUrl]);
};

exports.delete = async (id) => {
  await pool.query('DELETE FROM videos WHERE id=?', [id]);
};

exports.incrementViews = async (id) => {
  await pool.query('UPDATE videos SET views = views + 1 WHERE id = ?', [id]);
};

exports.incrementLikes = async (id) => {
  await pool.query('UPDATE videos SET likes = likes + 1 WHERE id = ?', [id]);
};

exports.findFeatured = async (limit = 2) => {
  const [rows] = await pool.query('SELECT * FROM videos WHERE isFeatured = 1 LIMIT ?', [limit]);
  return rows;
};

exports.search = async (searchTerm, limit = 10) => {
  const [rows] = await pool.query(
    'SELECT * FROM videos WHERE title LIKE ? OR description LIKE ? OR category LIKE ? LIMIT ?',
    [searchTerm, searchTerm, searchTerm, limit]
  );
  return rows;
};
