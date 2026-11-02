/**
 * ============================================================================
 * Auth Controller (User Authentication & Role Management)
 * ============================================================================
 * Handles user login and account role switching (registered vs subscriber)
 * via UserModel.
 */

const { UserModel } = require('../models');

async function login(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }

    const targetRole = ['registered', 'subscriber'].includes(role) ? role : 'subscriber';
    const existing = await UserModel.findByUsername(username);

    if (existing) {
      const updated = await UserModel.updateRole(existing.id, targetRole);
      return res.json(updated);
    }

    const created = await UserModel.create({
      username,
      password: password || '1234',
      role: targetRole,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('[AUTH ERROR]:', err.message);
    res.status(500).json({ error: 'فشل تسجيل الدخول' });
  }
}

module.exports = {
  login,
};
