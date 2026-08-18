const { pool } = require('../config/db');

exports.findByUserId = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM user_profile WHERE userId = ?', [userId]);
  return rows.length > 0 ? rows[0] : null;
};

exports.create = async (userId, profileData) => {
  const { firstName, lastName, avatar, bio, twitter, instagram, youtube, facebook } = profileData;
  await pool.query(
    `INSERT INTO user_profile (userId, firstName, lastName, avatar, bio, twitter, instagram, youtube, facebook) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, firstName, lastName, avatar, bio, twitter, instagram, youtube, facebook]
  );
};

exports.update = async (userId, profileData) => {
  const { firstName, lastName, avatar, bio, twitter, instagram, youtube, facebook } = profileData;
  await pool.query(
    `UPDATE user_profile SET firstName=?, lastName=?, avatar=?, bio=?, twitter=?, instagram=?, youtube=?, facebook=? WHERE userId=?`,
    [firstName, lastName, avatar, bio, twitter, instagram, youtube, facebook, userId]
  );
};
