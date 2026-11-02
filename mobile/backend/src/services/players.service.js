/**
 * ============================================================================
 * Players Service (Database Synchronization & Business Logic)
 * ============================================================================
 * Handles background syncing of extracted players to PostgreSQL via PlayerModel.
 * Inserts new players discovered from WhatsApp lists or updates their stats.
 */

const { PlayerModel } = require('../models');
const { getDefaultUserId, cleanPlayerName } = require('../utils/helpers');

/**
 * Automatically syncs extracted players into the PostgreSQL database.
 * If a player exists, updates their rating and primary position.
 * If a player is new, inserts them with default squad tag 'عام'.
 */
async function autoSavePlayersToDB(playersList) {
  if (!Array.isArray(playersList) || playersList.length === 0) return;
  try {
    const userId = await getDefaultUserId();

    for (const p of playersList) {
      if (!p || !p.name || p.name === 'لاعب إضافي' || p.name === 'لاعب') continue;

      const cleanName = cleanPlayerName(p.name);
      const rating = Math.min(Math.max(Number(p.rating) || 75, 40), 99);
      const primaryPos = p.isGoalkeeper || p.position === 'حارس'
        ? 'حارس'
        : ['دفاع', 'وسط', 'هجوم'].includes(p.position)
        ? p.position
        : 'وسط';

      await PlayerModel.upsertFromRoster({
        userId,
        cleanName,
        rating,
        primaryPos,
        secondaryPositions: [],
        groupName: 'عام',
      });
    }
    console.log(`[AUTO-SAVE] Successfully synced ${playersList.length} players to PostgreSQL.`);
  } catch (err) {
    console.error('[AUTO-SAVE ERROR]:', err.message);
  }
}

module.exports = {
  autoSavePlayersToDB,
};
