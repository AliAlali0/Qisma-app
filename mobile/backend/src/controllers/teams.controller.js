/**
 * ============================================================================
 * Teams Controller (Custom Teams & Tactical Kit Management)
 * ============================================================================
 * Handles creating, updating, listing, and deleting custom user teams
 * using TeamModel with auto-naming codes (Team A, Team B... Team Z, Team AA).
 */

const { TeamModel } = require('../models');
const { getDefaultUserId, getAlphabetTeamCode } = require('../utils/helpers');

/**
 * GET /api/teams
 * Fetches all saved teams for the current user.
 */
async function getTeams(req, res) {
  try {
    const userId = await getDefaultUserId();
    const teams = await TeamModel.findAll(userId);
    res.json(teams);
  } catch (err) {
    console.error('[DB ERROR - GET /api/teams]:', err.message);
    res.status(500).json({ error: 'فشل جلب الفرق المحفوظة' });
  }
}

/**
 * POST /api/teams
 * Creates a new team with kit color, formation counts, and optional player roster.
 * Generates alphabetical label automatically if no name is provided.
 */
async function createTeam(req, res) {
  try {
    const {
      name,
      kit_color,
      defenders_count,
      midfielders_count,
      attackers_count,
      players_data,
      tournament_name,
    } = req.body;

    const userId = await getDefaultUserId();

    let finalTeamName = name && name.trim() ? name.trim() : '';
    if (!finalTeamName) {
      const currentCount = await TeamModel.count(userId);
      finalTeamName = `فريق ${getAlphabetTeamCode(currentCount)}`;
    }

    const team = await TeamModel.create({
      userId,
      name: finalTeamName,
      kitColor: kit_color || '#16A34A',
      defendersCount: Number(defenders_count) || 2,
      midfieldersCount: Number(midfielders_count) || 2,
      attackersCount: Number(attackers_count) || 1,
      playersData: Array.isArray(players_data) ? players_data : [],
      tournamentName: tournament_name || null,
    });

    res.status(201).json(team);
  } catch (err) {
    console.error('[DB ERROR - POST /api/teams]:', err.message);
    res.status(500).json({ error: 'فشل حفظ الفريق' });
  }
}

/**
 * PUT /api/teams/:id
 * Updates team attributes or formation slots.
 */
async function updateTeam(req, res) {
  try {
    const teamId = req.params.id;
    const { name, kit_color, defenders_count, midfielders_count, attackers_count, players_data } = req.body;

    const updated = await TeamModel.update(teamId, {
      name: name && name.trim() ? name.trim() : null,
      kitColor: kit_color || null,
      defendersCount: defenders_count !== undefined ? Number(defenders_count) : null,
      midfieldersCount: midfielders_count !== undefined ? Number(midfielders_count) : null,
      attackersCount: attackers_count !== undefined ? Number(attackers_count) : null,
      playersData: players_data !== undefined ? (Array.isArray(players_data) ? players_data : []) : undefined,
    });

    if (!updated) {
      return res.status(404).json({ error: 'الفريق غير موجود' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[DB ERROR - PUT /api/teams/:id]:', err.message);
    res.status(500).json({ error: 'فشل تعديل الفريق' });
  }
}

/**
 * DELETE /api/teams/:id
 * Removes a custom team.
 */
async function deleteTeam(req, res) {
  try {
    const teamId = req.params.id;
    await TeamModel.delete(teamId);
    res.json({ success: true, deletedId: Number(teamId) });
  } catch (err) {
    console.error('[DB ERROR - DELETE /api/teams/:id]:', err.message);
    res.status(500).json({ error: 'فشل حذف الفريق' });
  }
}

module.exports = {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
};
