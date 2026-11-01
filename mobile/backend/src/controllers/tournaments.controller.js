/**
 * ============================================================================
 * Tournaments Controller (League, Knockouts, & Multi-Team Engine)
 * ============================================================================
 * Handles creating round-robin or knockout tournaments, generating schedules,
 * and saving participating teams into the database.
 */

const { pool } = require('../../db');
const { getDefaultUserId } = require('../utils/helpers');
const { divideIntoMultipleTournamentTeams, buildTournamentFixtures } = require('../services/balancing.service');

/**
 * GET /api/tournaments
 * Lists all tournaments saved for the current user.
 */
async function getTournaments(req, res) {
  try {
    const userId = await getDefaultUserId();
    const result = await pool.query(
      `SELECT * FROM tournaments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
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
    const result = await pool.query(
      `INSERT INTO tournaments (user_id, name, tournament_type, teams_count, teams_data, fixtures_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        tourneyTitle,
        type,
        count,
        JSON.stringify(teamsData),
        JSON.stringify(fixturesData),
      ]
    );

    // Auto-save generated tournament teams into the teams table
    for (const t of teamsData) {
      const outfieldCount = Math.max(1, (t.players || []).length - 1);
      const defC = Math.max(1, Math.round(outfieldCount * 0.4));
      const attC = Math.max(1, Math.round(outfieldCount * 0.25));
      const midC = Math.max(1, outfieldCount - defC - attC);

      await pool.query(
        `INSERT INTO teams (user_id, name, kit_color, defenders_count, midfielders_count, attackers_count, players_data, tournament_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          t.name,
          t.color || '#16A34A',
          defC,
          midC,
          attC,
          JSON.stringify(t.players || []),
          tourneyTitle,
        ]
      );
    }

    res.status(201).json(result.rows[0]);
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

    const result = await pool.query(
      `UPDATE tournaments
       SET teams_data = COALESCE($1, teams_data),
           fixtures_data = COALESCE($2, fixtures_data),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [
        teams_data ? JSON.stringify(teams_data) : null,
        fixtures_data ? JSON.stringify(fixtures_data) : null,
        status || null,
        tournamentId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'البطولة غير موجودة' });
    }

    res.json(result.rows[0]);
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
    await pool.query(`DELETE FROM tournaments WHERE id = $1`, [tournamentId]);
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
