/**
 * ============================================================================
 * Tournament Model (Data Access Layer)
 * ============================================================================
 * Encapsulates all PostgreSQL queries for the 'tournaments' table,
 * including tournament metadata, knockout/league fixtures, and standings.
 */

const { pool } = require('../../db');

class TournamentModel {
  /**
   * Retrieves all tournaments for the current user ordered by creation date.
   * @param {number} userId
   * @returns {Promise<Array<object>>}
   */
  static async findAll(userId) {
    const result = await pool.query(
      `SELECT * FROM tournaments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Finds a single tournament by ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT * FROM tournaments WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Creates a new tournament record.
   * @param {object} params
   * @returns {Promise<object>}
   */
  static async create({
    userId,
    name = 'بطولة قِسمه 🏆',
    tournamentType = 'league',
    teamsCount = 4,
    teamsData,
    fixturesData,
    status = 'active',
  }) {
    const result = await pool.query(
      `INSERT INTO tournaments (user_id, name, tournament_type, teams_count, teams_data, fixtures_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        name,
        tournamentType,
        teamsCount,
        JSON.stringify(teamsData),
        JSON.stringify(fixturesData),
        status,
      ]
    );
    return result.rows[0];
  }

  /**
   * Updates tournament fixtures, teams data, or status.
   * @param {number} id
   * @param {object} params
   * @returns {Promise<object|null>}
   */
  static async update(id, { teamsData, fixturesData, status }) {
    const result = await pool.query(
      `UPDATE tournaments
       SET teams_data = COALESCE($1, teams_data),
           fixtures_data = COALESCE($2, fixtures_data),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [
        teamsData ? JSON.stringify(teamsData) : null,
        fixturesData ? JSON.stringify(fixturesData) : null,
        status || null,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * Deletes a tournament by ID.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await pool.query(`DELETE FROM tournaments WHERE id = $1`, [id]);
    return result.rowCount > 0;
  }
}

module.exports = TournamentModel;
