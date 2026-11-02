/**
 * ============================================================================
 * User Model (Data Access Layer)
 * ============================================================================
 * Encapsulates all PostgreSQL queries for the 'users' table.
 */

const { pool } = require('../../db');

class UserModel {
  /**
   * Find a user by their lowercase username.
   * @param {string} username
   * @returns {Promise<object|null>}
   */
  static async findByUsername(username) {
    const cleanUser = username.trim().toLowerCase();
    const result = await pool.query(
      `SELECT id, username, role, created_at FROM users WHERE LOWER(username) = $1 LIMIT 1`,
      [cleanUser]
    );
    return result.rows[0] || null;
  }

  /**
   * Find a user by primary key ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT id, username, role, created_at FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new user record.
   * @param {object} params
   * @param {string} params.username
   * @param {string} [params.password]
   * @param {string} [params.role]
   * @returns {Promise<object>}
   */
  static async create({ username, password = '1234', role = 'registered' }) {
    const cleanUser = username.trim().toLowerCase();
    const result = await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role, created_at`,
      [cleanUser, password, role]
    );
    return result.rows[0];
  }

  /**
   * Update the user's role (registered vs subscriber).
   * @param {number} id
   * @param {string} role
   * @returns {Promise<object|null>}
   */
  static async updateRole(id, role) {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role`,
      [role, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Resolves or creates the primary default admin user ID for organizer tasks.
   * @returns {Promise<number>}
   */
  static async getDefaultUserId() {
    const existing = await this.findByUsername('admin');
    if (existing) {
      return existing.id;
    }
    const created = await this.create({
      username: 'admin',
      password: '1234',
      role: 'subscriber',
    });
    return created.id;
  }
}

module.exports = UserModel;
