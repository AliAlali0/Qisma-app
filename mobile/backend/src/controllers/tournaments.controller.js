/**
 * ============================================================================
 * Tournaments Controller (League, Knockouts, & Multi-Team Engine)
 * ============================================================================
 * Handles creating round-robin or knockout tournaments, generating schedules,
 * and saving participating teams into the database using TournamentModel and TeamModel.
 */

const { TournamentModel, TeamModel } = require('../models');
const { getDefaultUserId } = require('../utils/helpers');
const {
  divideIntoMultipleTournamentTeams,
  buildTournamentFixtures,
} = require('../services/balancing.service');

/**
 * GET /api/tournaments
 * Lists all tournaments saved for the current user.
 */
async function getTournaments(req, res) {
  try {
    const userId = await getDefaultUserId();
    const tournaments = await TournamentModel.findAll(userId);
    res.json(tournaments);
  } catch (err) {
    console.error('[DB ERROR - GET /api/tournaments]:', err.message);
    res.status(500).json({ error: 'فشل جلب البطولات' });
  }
}

/**
 * POST /api/tournaments/generate
 * Generates N balanced teams from a player pool, builds fixtures, and saves both
 * the tournament record and each team into the teams table.
 */
async function generateTournament(req, res) {
  try {
    const { name, tournamentType, teamsCount, players } = req.body;
    const count = Math.max(Number(teamsCount) || 2, 2);

    if (!Array.isArray(players) || players.length < count) {
      return res.status(400).json({
        error: `الرجاء اختيار ${count} لاعبين على الأقل لتكوين ${count} أفرقة`,
      });
    }

    const userId = await getDefaultUserId();
    const type = ['league', 'knockout', 'groups_knockout'].includes(tournamentType)
      ? tournamentType
      : 'league';

    const tourneyTitle = name && name.trim() ? name.trim() : 'بطولة قِسمه 🏆';

    // Divide players into balanced teams labeled Team A, Team B...
    const teamsData = divideIntoMultipleTournamentTeams(players, count, 0);
    const fixturesData = buildTournamentFixtures(teamsData, type);

    // Save tournament record
    const tournament = await TournamentModel.create({
      userId,
      name: tourneyTitle,
      tournamentType: type,
      teamsCount: count,
      teamsData,
      fixturesData,
    });

    // Auto-save generated tournament teams into the teams table via TeamModel
    for (const t of teamsData) {
      const outfieldCount = Math.max(1, (t.players || []).length - 1);
      const defC = Math.max(1, Math.round(outfieldCount * 0.4));
      const attC = Math.max(1, Math.round(outfieldCount * 0.25));
      const midC = Math.max(1, outfieldCount - defC - attC);

      await TeamModel.create({
        userId,
        name: t.name,
        kitColor: t.color || '#16A34A',
        defendersCount: defC,
        midfieldersCount: midC,
        attackersCount: attC,
        playersData: t.players || [],
        tournamentName: tourneyTitle,
      });
    }

    res.status(201).json(tournament);
  } catch (err) {
    console.error('[TOURNAMENT GENERATE ERROR]:', err.message);
    res.status(500).json({ error: 'فشل إنشاء البطولة وتقسيم الفرق' });
  }
}

/**
 * PUT /api/tournaments/:id
 * Updates tournament scores, fixtures, standings, or status (e.g. completed).
 */
async function updateTournament(req, res) {
  try {
    const tournamentId = req.params.id;
    const { teams_data, fixtures_data, status } = req.body;

    const updated = await TournamentModel.update(tournamentId, {
      teamsData: teams_data,
      fixturesData: fixtures_data,
      status,
    });

    if (!updated) {
      return res.status(404).json({ error: 'البطولة غير موجودة' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[DB ERROR - PUT /api/tournaments/:id]:', err.message);
    res.status(500).json({ error: 'فشل تحديث البطولة' });
  }
}

/**
 * DELETE /api/tournaments/:id
 * Deletes a tournament record.
 */
async function deleteTournament(req, res) {
  try {
    const tournamentId = req.params.id;
    await TournamentModel.delete(tournamentId);
    res.json({ success: true, deletedId: Number(tournamentId) });
  } catch (err) {
    console.error('[DB ERROR - DELETE /api/tournaments/:id]:', err.message);
    res.status(500).json({ error: 'فشل حذف البطولة' });
  }
}

module.exports = {
  getTournaments,
  generateTournament,
  updateTournament,
  deleteTournament,
};
