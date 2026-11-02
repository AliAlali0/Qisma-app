/**
 * ============================================================================
 * Player Model (Data Access Layer)
 * ============================================================================
 * Encapsulates all PostgreSQL queries for the 'players' table,
 * including player CRUD, stat increments, and performance rating adjustments.
 */

const { pool } = require('../../db');

class PlayerModel {
  /**
   * Retrieves all registered players for an organizer with null-safe stats.
   * @param {number} userId
   * @returns {Promise<Array<object>>}
   */
  static async findAll(userId) {
    const result = await pool.query(
      `SELECT id, name, rating, primary_position, secondary_positions,
              COALESCE(group_name, 'عام') AS group_name,
              COALESCE(matches_played, 0) AS matches_played,
              COALESCE(wins, 0) AS wins,
              COALESCE(mvp_count, 0) AS mvp_count
       FROM players
       WHERE user_id = $1
       ORDER BY rating DESC, wins DESC, id DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Retrieves essential player data (name, rating, position) for AI prompt enrichment.
   * @returns {Promise<Array<object>>}
   */
  static async findAllBasic() {
    const result = await pool.query(
      `SELECT name, rating, primary_position, secondary_positions FROM players`
    );
    return result.rows;
  }

  /**
   * Finds a player by clean name for a given user.
   * @param {number} userId
   * @param {string} cleanName
   * @returns {Promise<object|null>}
   */
  static async findByName(userId, cleanName) {
    const result = await pool.query(
      `SELECT id, name, rating, primary_position, secondary_positions, group_name
       FROM players
       WHERE user_id = $1 AND name = $2
       LIMIT 1`,
      [userId, cleanName]
    );
    return result.rows[0] || null;
  }

  /**
   * Creates a new player record.
   * @param {object} params
   * @returns {Promise<object>}
   */
  static async create({
    userId,
    name,
    rating = 75,
    primaryPosition,
    secondaryPositions = [],
    groupName = 'عام',
  }) {
    const result = await pool.query(
      `INSERT INTO players (user_id, name, rating, primary_position, secondary_positions, group_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, rating, primary_position, secondary_positions, group_name`,
      [userId, name, rating, primaryPosition, secondaryPositions, groupName]
    );
    return result.rows[0];
  }

  /**
   * Updates an existing player by ID.
   * @param {number} id
   * @param {object} params
   * @returns {Promise<object|null>}
   */
  static async update(
    id,
    { name, rating, primaryPosition, secondaryPositions = [], groupName = 'عام' }
  ) {
    const result = await pool.query(
      `UPDATE players
       SET name = $1, rating = $2, primary_position = $3, secondary_positions = $4, group_name = $5
       WHERE id = $6
       RETURNING id, name, rating, primary_position, secondary_positions, group_name`,
      [name, rating, primaryPosition, secondaryPositions, groupName, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Deletes a player by ID.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await pool.query(`DELETE FROM players WHERE id = $1`, [id]);
    return result.rowCount > 0;
  }

  /**
   * Increments the matches_played counter for a participating player.
   * @param {number} userId
   * @param {string} cleanName
   */
  static async incrementMatchesPlayed(userId, cleanName) {
    await pool.query(
      `UPDATE players
       SET matches_played = COALESCE(matches_played, 0) + 1
       WHERE user_id = $1 AND name = $2`,
      [userId, cleanName]
    );
  }

  /**
   * Records a match victory for a winning player.
   * Rating increments by +1 only if rating < 85 (soft cap rule).
   * @param {number} userId
   * @param {string} cleanName
   */
  static async recordWin(userId, cleanName) {
    await pool.query(
      `UPDATE players
       SET wins = COALESCE(wins, 0) + 1,
           rating = CASE
             WHEN rating < 85 THEN rating + 1
             ELSE rating
           END
       WHERE user_id = $1 AND name = $2`,
      [userId, cleanName]
    );
  }

  /**
   * Awards MVP honors:
   * Increments mvp_count.
   * If rating >= 85: adds +1 (max 99).
   * If rating < 85: adds +2 (max 99).
   * @param {number} userId
   * @param {string} cleanName
   */
  static async recordMvp(userId, cleanName) {
    await pool.query(
      `UPDATE players
       SET mvp_count = COALESCE(mvp_count, 0) + 1,
           rating = CASE
             WHEN rating >= 85 THEN LEAST(99, rating + 1)
             ELSE LEAST(99, rating + 2)
           END
       WHERE user_id = $1 AND name = $2`,
      [userId, cleanName]
    );
  }

  /**
   * Upserts a player discovered during roster synchronization.
   * Updates rating and position if already exists; inserts otherwise.
   * @param {object} params
   */
  static async upsertFromRoster({
    userId,
    cleanName,
    rating,
    primaryPos,
    secondaryPositions = [],
    groupName = 'عام',
  }) {
    const existing = await this.findByName(userId, cleanName);
    if (existing) {
      await pool.query(
        `UPDATE players SET rating = $1, primary_position = $2 WHERE id = $3`,
        [rating, primaryPos, existing.id]
      );
    } else {
      await this.create({
        userId,
        name: cleanName,
        rating,
        primaryPosition: primaryPos,
        secondaryPositions,
        groupName,
      });
    }
  }
}

module.exports = PlayerModel;
