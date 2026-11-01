/**
 * ============================================================================
 * Teams Controller (Custom Teams & Tactical Kit Management)
 * ============================================================================
 * Handles creating, updating, listing, and deleting custom user teams with
 * auto-naming codes (Team A, Team B... Team Z, Team AA).
 */

const { pool } = require('../../db');
const { getDefaultUserId, getAlphabetTeamCode } = require('../utils/helpers');

/**
 * GET /api/teams
 * Fetches all saved teams for the current user.
 */
async function getTeams(req, res) {
  try {
    const userId = await getDefaultUserId();
    const result = await pool.query(
      `SELECT * FROM teams WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );
    res.json(result.rows);
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
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM teams WHERE user_id = $1`,
        [userId]
      );
      const currentCount = parseInt(countRes.rows[0].count, 10) || 0;
      finalTeamName = `فريق ${getAlphabetTeamCode(currentCount)}`;
    }

    const result = await pool.query(
      `INSERT INTO teams (user_id, name, kit_color, defenders_count, midfielders_count, attackers_count, players_data, tournament_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        finalTeamName,
        kit_color || '#16A34A',
        Number(defenders_count) || 2,
        Number(midfielders_count) || 2,
        Number(attackers_count) || 1,
        JSON.stringify(Array.isArray(players_data) ? players_data : []),
        tournament_name || null,
      ]
    );
    res.status(201).json(result.rows[0]);
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
        kit_color || null,
        defenders_count ? Number(defenders_count) : null,
        midfielders_count ? Number(midfielders_count) : null,
        attackers_count ? Number(attackers_count) : null,
        players_data !== undefined ? JSON.stringify(Array.isArray(players_data) ? players_data : []) : null,
        teamId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الفريق غير موجود' });
    }
    res.json(result.rows[0]);
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
    await pool.query(`DELETE FROM teams WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
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
