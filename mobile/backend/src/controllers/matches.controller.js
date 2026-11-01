/**
 * ============================================================================
 * Matches Controller (Match History Hub & Performance Rating System)
 * ============================================================================
 * Handles match logging, scores update, MVP award boosts, and rating capping rules.
 */

const { pool } = require('../../db');
const { getDefaultUserId, cleanPlayerName } = require('../utils/helpers');

/**
 * GET /api/matches
 * Retrieves match history for current user ordered by creation date descending.
 */
async function getMatches(req, res) {
  try {
    const userId = await getDefaultUserId();
    const result = await pool.query(
      `SELECT id, team_a_name, team_b_name, team_a_color, team_b_color, formation, 
              team_a_score, team_b_score, mvp_player_name, ratings_applied,
              team_a_players, team_b_players, created_at 
       FROM matches 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
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

    const result = await pool.query(
      `INSERT INTO matches (user_id, team_a_name, team_b_name, team_a_color, team_b_color, formation, team_a_players, team_b_players, team_a_score, team_b_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        team_a_name || 'الفريق الأول',
        team_b_name || 'الفريق الثاني',
        team_a_color || '#16A34A',
        team_b_color || '#2563EB',
        formation || 'مخصص',
        JSON.stringify(team_a_players),
        JSON.stringify(team_b_players),
        scoreA,
        scoreB,
      ]
    );

    res.status(201).json(result.rows[0]);
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

    const matchCheck = await pool.query(`SELECT * FROM matches WHERE id = $1 LIMIT 1`, [matchId]);
    if (matchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'المباراة غير موجودة' });
    }

    const matchRow = matchCheck.rows[0];
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
        await pool.query(
          `UPDATE players
           SET matches_played = COALESCE(matches_played, 0) + 1
           WHERE user_id = $1 AND name = $2`,
          [userId, cleanPlayerName(p.name)]
        );
      }

      // 2. Winning players get +1 win. Rating increases (+1) only if rating < 85
      for (const wp of winningPlayers) {
        if (!wp || !wp.name) continue;
        await pool.query(
          `UPDATE players
           SET wins = COALESCE(wins, 0) + 1,
               rating = CASE
                 WHEN rating < 85 THEN rating + 1
                 ELSE rating
               END
           WHERE user_id = $1 AND name = $2`,
          [userId, cleanPlayerName(wp.name)]
        );
      }

      // 3. Match MVP: If rating >= 85 increases by +1, if rating < 85 increases by +2
      if (mvp_player_name && mvp_player_name.trim()) {
        await pool.query(
          `UPDATE players
           SET mvp_count = COALESCE(mvp_count, 0) + 1,
               rating = CASE
                 WHEN rating >= 85 THEN LEAST(99, rating + 1)
                 ELSE LEAST(99, rating + 2)
               END
           WHERE user_id = $1 AND name = $2`,
          [userId, cleanPlayerName(mvp_player_name)]
        );
      }

      ratingsApplied = true;
    }

    const result = await pool.query(
      `UPDATE matches 
       SET team_a_score = $1, team_b_score = $2, mvp_player_name = $3, ratings_applied = $4
       WHERE id = $5 
       RETURNING *`,
      [scoreA, scoreB, mvp_player_name || null, ratingsApplied, matchId]
    );

    res.json(result.rows[0]);
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
    await pool.query(`DELETE FROM matches WHERE id = $1`, [matchId]);
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
