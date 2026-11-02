/**
 * ============================================================================
 * Match Model (Data Access Layer)
 * ============================================================================
 * Encapsulates all PostgreSQL queries for the 'matches' table,
 * including match lineup archiving, score recording, and MVP logging.
 */

const { pool } = require('../../db');

class MatchModel {
  /**
   * Retrieves all matches for the current user ordered by most recent first.
   * @param {number} userId
   * @returns {Promise<Array<object>>}
   */
  static async findAll(userId) {
    const result = await pool.query(
      `SELECT id, team_a_name, team_b_name, team_a_color, team_b_color, formation, 
              team_a_score, team_b_score, mvp_player_name, ratings_applied,
              team_a_players, team_b_players, created_at 
       FROM matches 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Finds a single match by its primary key ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT * FROM matches WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Saves a new match record.
   * @param {object} params
   * @returns {Promise<object>}
   */
  static async create({
    userId,
    teamAName = 'الفريق الأول',
    teamBName = 'الفريق الثاني',
    teamAColor = '#16A34A',
    teamBColor = '#2563EB',
    formation = 'مخصص',
    teamAPlayers,
    teamBPlayers,
    teamAScore = null,
    teamBScore = null,
  }) {
    const result = await pool.query(
      `INSERT INTO matches (user_id, team_a_name, team_b_name, team_a_color, team_b_color, formation, team_a_players, team_b_players, team_a_score, team_b_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        teamAName,
        teamBName,
        teamAColor,
        teamBColor,
        formation,
        JSON.stringify(teamAPlayers),
        JSON.stringify(teamBPlayers),
        teamAScore,
        teamBScore,
      ]
    );
    return result.rows[0];
  }

  /**
   * Updates scores, MVP, and rating boost flag for a match.
   * @param {number} id
   * @param {object} params
   * @returns {Promise<object|null>}
   */
  static async updateScore(id, { scoreA, scoreB, mvpPlayerName, ratingsApplied }) {
    const result = await pool.query(
      `UPDATE matches 
       SET team_a_score = $1, team_b_score = $2, mvp_player_name = $3, ratings_applied = $4
       WHERE id = $5 
       RETURNING *`,
      [scoreA, scoreB, mvpPlayerName || null, ratingsApplied, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Deletes a match from the archive.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await pool.query(`DELETE FROM matches WHERE id = $1`, [id]);
    return result.rowCount > 0;
  }
}

module.exports = MatchModel;
