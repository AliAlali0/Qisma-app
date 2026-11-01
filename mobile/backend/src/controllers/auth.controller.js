/**
 * ============================================================================
 * Auth Controller (User Authentication & Role Management)
 * ============================================================================
 * Handles user login and account role switching (registered vs subscriber).
 */

const { pool } = require('../../db');

async function login(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }

    const cleanUser = username.trim().toLowerCase();
    const targetRole = ['registered', 'subscriber'].includes(role) ? role : 'subscriber';

    const existing = await pool.query(
      `SELECT id, username, role FROM users WHERE LOWER(username) = $1 LIMIT 1`,
      [cleanUser]
    );

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role`,
        [targetRole, existing.rows[0].id]
      );
      return res.json(updated.rows[0]);
    }

    const created = await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [cleanUser, password || '1234', targetRole]
    );

    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[AUTH ERROR]:', err.message);
    res.status(500).json({ error: 'فشل تسجيل الدخول' });
  }
}

module.exports = {
  login,
};
