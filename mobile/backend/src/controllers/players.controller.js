/**
 * ============================================================================
 * Players Controller (Player CRUD & Multi-Squad Management)
 * ============================================================================
 * Handles listing, adding, editing, and deleting registered players in PostgreSQL.
 */

const { pool } = require('../../db');
const { getDefaultUserId, cleanPlayerName } = require('../utils/helpers');

/**
 * GET /api/players
 * Retrieves all registered players for the current user, ordered by rating & wins.
 */
async function getPlayers(req, res) {
  try {
    const userId = await getDefaultUserId();
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
    res.json(result.rows);
  } catch (err) {
    console.error('[DB ERROR - GET /api/players]:', err.message);
    res.status(500).json({ error: 'فشل جلب قائمة اللاعبين من قاعدة البيانات' });
  }
}

/**
 * POST /api/players
 * Adds a new player with position, rating, and squad group name.
 */
async function createPlayer(req, res) {
  try {
    const { name, rating, primary_position, secondary_positions, group_name } = req.body;
    if (!name || !name.trim() || !primary_position) {
      return res.status(400).json({ error: 'اسم اللاعب والمركز الأساسي مطلوبان' });
    }

    const userId = await getDefaultUserId();
    const cleanName = cleanPlayerName(name);
    const numRating = Math.min(Math.max(Number(rating) || 75, 40), 99);
    const secPositionsArray = Array.isArray(secondary_positions)
      ? secondary_positions.filter((pos) => pos !== primary_position)
      : [];

    const finalGroupName = (group_name && group_name.trim()) ? group_name.trim() : 'عام';

    const result = await pool.query(
      `INSERT INTO players (user_id, name, rating, primary_position, secondary_positions, group_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, rating, primary_position, secondary_positions, group_name`,
      [userId, cleanName, numRating, primary_position, secPositionsArray, finalGroupName]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - POST /api/players]:', err.message);
    res.status(500).json({ error: 'فشل حفظ اللاعب في قاعدة البيانات' });
  }
}

/**
 * PUT /api/players/:id
 * Updates an existing player's details, ratings, and squad group.
 */
async function updatePlayer(req, res) {
  try {
    const playerId = req.params.id;
    const { name, rating, primary_position, secondary_positions, group_name } = req.body;

    if (!name || !name.trim() || !primary_position) {
      return res.status(400).json({ error: 'اسم اللاعب والمركز الأساسي مطلوبان' });
    }

    const cleanName = cleanPlayerName(name);
    const numRating = Math.min(Math.max(Number(rating) || 75, 40), 99);
    const secPositionsArray = Array.isArray(secondary_positions)
      ? secondary_positions.filter((pos) => pos !== primary_position)
      : [];

    const finalGroupName = (group_name && group_name.trim()) ? group_name.trim() : 'عام';

    const result = await pool.query(
      `UPDATE players
       SET name = $1, rating = $2, primary_position = $3, secondary_positions = $4, group_name = $5
       WHERE id = $6
       RETURNING id, name, rating, primary_position, secondary_positions, group_name`,
      [cleanName, numRating, primary_position, secPositionsArray, finalGroupName, playerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - PUT /api/players/:id]:', err.message);
    res.status(500).json({ error: 'فشل تحديث بيانات اللاعب' });
  }
}

/**
 * DELETE /api/players/:id
 * Deletes a player from PostgreSQL by their ID.
 */
async function deletePlayer(req, res) {
  try {
    const playerId = req.params.id;
    await pool.query(`DELETE FROM players WHERE id = $1`, [playerId]);
    res.json({ success: true, deletedId: Number(playerId) });
  } catch (err) {
    console.error('[DB ERROR - DELETE /api/players/:id]:', err.message);
    res.status(500).json({ error: 'فشل حذف اللاعب' });
  }
}

module.exports = {
  getPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
