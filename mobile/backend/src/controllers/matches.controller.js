/**
 * ============================================================================
 * Matches Controller (Match History Hub & Performance Rating System)
 * ============================================================================
 * Handles match logging, scores update, MVP award boosts, and rating capping rules
 * using MatchModel and PlayerModel.
 */

const { MatchModel, PlayerModel } = require('../models');
const { getDefaultUserId, cleanPlayerName } = require('../utils/helpers');

/**
 * GET /api/matches
 * Retrieves match history for current user ordered by creation date descending.
 */
async function getMatches(req, res) {
  try {
    const userId = await getDefaultUserId();
    const matches = await MatchModel.findAll(userId);
    res.json(matches);
  } catch (err) {
    console.error('[DB ERROR - GET /api/matches]:', err.message);
    res.status(500).json({ error: 'فشل جلب سجل المباريات' });
  }
}

/**
 * POST /api/matches
 * Saves a new match lineup and optional scores.
 */
async function createMatch(req, res) {
  try {
    const {
      team_a_name,
      team_b_name,
      team_a_color,
      team_b_color,
      formation,
      team_a_players,
      team_b_players,
      team_a_score,
      team_b_score,
    } = req.body;

    if (!team_a_players || !team_b_players) {
      return res.status(400).json({ error: 'بيانات تشكيلة الفريقين مطلوبة للحفظ' });
    }

    const userId = await getDefaultUserId();
    const scoreA =
      team_a_score !== undefined && team_a_score !== null && team_a_score !== ''
        ? Number(team_a_score)
        : null;
    const scoreB =
      team_b_score !== undefined && team_b_score !== null && team_b_score !== ''
        ? Number(team_b_score)
        : null;

    const match = await MatchModel.create({
      userId,
      teamAName: team_a_name || 'الفريق الأول',
      teamBName: team_b_name || 'الفريق الثاني',
      teamAColor: team_a_color || '#16A34A',
      teamBColor: team_b_color || '#2563EB',
      formation: formation || 'مخصص',
      teamAPlayers,
      teamBPlayers,
      teamAScore: scoreA,
      teamBScore: scoreB,
    });

    res.status(201).json(match);
  } catch (err) {
    console.error('[DB ERROR - POST /api/matches]:', err.message);
    res.status(500).json({ error: 'فشل حفظ المباراة في قاعدة البيانات' });
  }
}

/**
 * PUT /api/matches/:id/score
 * Updates match final score, increments wins/matches played, awards MVP boost,
 * and enforces the 85-rating soft cap rule.
 */
async function updateMatchScore(req, res) {
  try {
    const matchId = req.params.id;
    const { team_a_score, team_b_score, mvp_player_name, apply_rating_boost } = req.body;

    const scoreA =
      team_a_score !== undefined && team_a_score !== null && team_a_score !== ''
        ? Number(team_a_score)
        : null;
    const scoreB =
      team_b_score !== undefined && team_b_score !== null && team_b_score !== ''
        ? Number(team_b_score)
        : null;

    const matchRow = await MatchModel.findById(matchId);
    if (!matchRow) {
      return res.status(404).json({ error: 'المباراة غير موجودة' });
    }

    const userId = matchRow.user_id;
    let ratingsApplied = matchRow.ratings_applied;

    if (apply_rating_boost && !ratingsApplied && scoreA !== null && scoreB !== null) {
      const teamAPlayers = matchRow.team_a_players || [];
      const teamBPlayers = matchRow.team_b_players || [];
      const allParticipants = [...teamAPlayers, ...teamBPlayers];
      const winningPlayers =
        scoreA > scoreB ? teamAPlayers : scoreB > scoreA ? teamBPlayers : [];

      // 1. Increment matches_played for all participating players
      for (const p of allParticipants) {
        if (!p || !p.name) continue;
        await PlayerModel.incrementMatchesPlayed(userId, cleanPlayerName(p.name));
      }

      // 2. Winning players get +1 win. Rating increases (+1) only if rating < 85
      for (const wp of winningPlayers) {
        if (!wp || !wp.name) continue;
        await PlayerModel.recordWin(userId, cleanPlayerName(wp.name));
      }

      // 3. Match MVP: If rating >= 85 increases by +1, if rating < 85 increases by +2
      if (mvp_player_name && mvp_player_name.trim()) {
        await PlayerModel.recordMvp(userId, cleanPlayerName(mvp_player_name));
      }

      ratingsApplied = true;
    }

    const updated = await MatchModel.updateScore(matchId, {
      scoreA,
      scoreB,
      mvpPlayerName: mvp_player_name,
      ratingsApplied,
    });

    res.json(updated);
  } catch (err) {
    console.error('[DB ERROR - PUT /api/matches/:id/score]:', err.message);
    res.status(500).json({ error: 'فشل تحديث نتيجة المباراة' });
  }
}

/**
 * DELETE /api/matches/:id
 * Deletes a match from the archive.
 */
async function deleteMatch(req, res) {
  try {
    const matchId = req.params.id;
    await MatchModel.delete(matchId);
    res.json({ success: true, deletedId: Number(matchId) });
  } catch (err) {
    console.error('[DB ERROR - DELETE /api/matches/:id]:', err.message);
    res.status(500).json({ error: 'فشل حذف المباراة' });
  }
}

module.exports = {
  getMatches,
  createMatch,
  updateMatchScore,
  deleteMatch,
};
