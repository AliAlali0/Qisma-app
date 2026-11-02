/**
 * ============================================================================
 * Players Controller (Player CRUD & Multi-Squad Management)
 * ============================================================================
 * Handles listing, adding, editing, and deleting registered players
 * using the PlayerModel data access layer.
 */

const { PlayerModel } = require('../models');
const { getDefaultUserId, cleanPlayerName } = require('../utils/helpers');

/**
 * GET /api/players
 * Retrieves all registered players for the current user, ordered by rating & wins.
 */
async function getPlayers(req, res) {
  try {
    const userId = await getDefaultUserId();
    const players = await PlayerModel.findAll(userId);
    res.json(players);
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

    const player = await PlayerModel.create({
      userId,
      name: cleanName,
      rating: numRating,
      primaryPosition: primary_position,
      secondaryPositions: secPositionsArray,
      groupName: finalGroupName,
    });

    res.status(201).json(player);
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

    const updated = await PlayerModel.update(playerId, {
      name: cleanName,
      rating: numRating,
      primaryPosition: primary_position,
      secondaryPositions: secPositionsArray,
      groupName: finalGroupName,
    });

    if (!updated) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }

    res.json(updated);
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
    await PlayerModel.delete(playerId);
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
