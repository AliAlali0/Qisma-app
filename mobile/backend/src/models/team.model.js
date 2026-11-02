/**
 * ============================================================================
 * Team Model (Data Access Layer)
 * ============================================================================
 * Encapsulates all PostgreSQL queries for the 'teams' table,
 * including saved custom teams, formations, kit colors, and squad rosters.
 */

const { pool } = require('../../db');

class TeamModel {
  /**
   * Retrieves all saved teams for the current user.
   * @param {number} userId
   * @returns {Promise<Array<object>>}
   */
  static async findAll(userId) {
    const result = await pool.query(
      `SELECT * FROM teams WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Counts the total number of teams owned by a user.
   * @param {number} userId
   * @returns {Promise<number>}
   */
  static async count(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM teams WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10) || 0;
  }

  /**
   * Creates a new saved team record.
   * @param {object} params
   * @returns {Promise<object>}
   */
  static async create({
    userId,
    name,
    kitColor = '#16A34A',
    defendersCount = 2,
    midfieldersCount = 2,
    attackersCount = 1,
    playersData = [],
    tournamentName = null,
  }) {
    const result = await pool.query(
      `INSERT INTO teams (user_id, name, kit_color, defenders_count, midfielders_count, attackers_count, players_data, tournament_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        name,
        kitColor,
        Number(defendersCount) || 2,
        Number(midfieldersCount) || 2,
        Number(attackersCount) || 1,
        JSON.stringify(Array.isArray(playersData) ? playersData : []),
        tournamentName,
      ]
    );
    return result.rows[0];
  }

  /**
   * Updates an existing team's attributes or tactical slots.
   * @param {number} id
   * @param {object} params
   * @returns {Promise<object|null>}
   */
  static async update(
    id,
    { name, kitColor, defendersCount, midfieldersCount, attackersCount, playersData }
  ) {
    const result = await pool.query(
      `UPDATE teams
       SET name = COALESCE($1, name),
           kit_color = COALESCE($2, kit_color),
           defenders_count = COALESCE($3, defenders_count),
           midfielders_count = COALESCE($4, midfielders_count),
           attackers_count = COALESCE($5, attackers_count),
           players_data = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE players_data END
       WHERE id = $7
       RETURNING *`,
      [
        name && name.trim() ? name.trim() : null,
        kitColor || null,
        defendersCount !== undefined ? Number(defendersCount) : null,
        midfieldersCount !== undefined ? Number(midfieldersCount) : null,
        attackersCount !== undefined ? Number(attackersCount) : null,
        playersData !== undefined ? JSON.stringify(Array.isArray(playersData) ? playersData : []) : null,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * Deletes a team by ID.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await pool.query(`DELETE FROM teams WHERE id = $1`, [id]);
    return result.rowCount > 0;
  }
}

module.exports = TeamModel;
