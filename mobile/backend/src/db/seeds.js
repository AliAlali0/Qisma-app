/**
 * ============================================================================
 * Database Seed Data
 * ============================================================================
 * Populates essential bootstrap data (default admin user, starter teams,
 * and sample squad players) for initial app launch and local development.
 */

const { pool } = require('../../db');

/**
 * Seeds initial bootstrap records if the database is fresh.
 */
async function runDatabaseSeeds() {
  console.log('[DB Seeds] Checking and applying bootstrap seed records...');

  try {
    // 1. Seed or retrieve default 'admin' user
    const userRes = await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ('admin', '1234', 'subscriber')
       ON CONFLICT (username) DO NOTHING
       RETURNING id;`
    );

    let defaultUserId;
    if (userRes.rows.length > 0) {
      defaultUserId = userRes.rows[0].id;
    } else {
      const existingUser = await pool.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
      defaultUserId = existingUser.rows[0]?.id;
    }

    if (!defaultUserId) {
      console.warn('[DB Seeds] Could not find or create default admin user.');
      return;
    }

    // 2. Seed starter teams if none exist for default admin
    const teamsCountRes = await pool.query(
      `SELECT COUNT(*) FROM teams WHERE user_id = $1`,
      [defaultUserId]
    );

    if (parseInt(teamsCountRes.rows[0].count, 10) === 0) {
      await pool.query(
        `INSERT INTO teams (user_id, name, kit_color, defenders_count, midfielders_count, attackers_count)
         VALUES 
         ($1, 'فريق الصقور', '#16A34A', 3, 3, 2),
         ($1, 'فريق النمور', '#2563EB', 3, 3, 2),
         ($1, 'فريق الأسود', '#DC2626', 2, 2, 1),
         ($1, 'فريق الملكي', '#D97706', 2, 2, 1);`,
        [defaultUserId]
      );
      console.log('[DB Seeds] Starter teams seeded successfully.');
    }

    // 3. Seed starter players if none exist for default admin
    const playersCountRes = await pool.query(
      `SELECT COUNT(*) FROM players WHERE user_id = $1`,
      [defaultUserId]
    );

    if (parseInt(playersCountRes.rows[0].count, 10) === 0) {
      const samplePlayers = [
        ['منتظر', 85, 'حارس', ['دفاع']],
        ['موسى جعفر', 88, 'حارس', ['وسط']],
        ['أحمد الصليح', 92, 'هجوم', ['وسط']],
        ['محمد تقي', 86, 'وسط', ['هجوم', 'دفاع']],
        ['بو هادي', 90, 'هجوم', ['وسط']],
        ['علي عدنان', 82, 'دفاع', ['وسط']],
        ['سلمان', 80, 'وسط', ['دفاع']],
        ['باسل', 76, 'دفاع', ['وسط', 'حارس']],
        ['حسن', 72, 'وسط', ['دفاع', 'هجوم']],
        ['حسين', 65, 'دفاع', ['وسط']],
      ];

      for (const [name, rating, primaryPos, secPositions] of samplePlayers) {
        await pool.query(
          `INSERT INTO players (user_id, name, rating, primary_position, secondary_positions, group_name)
           VALUES ($1, $2, $3, $4, $5, 'عام')`,
          [defaultUserId, name, rating, primaryPos, secPositions]
        );
      }
      console.log('[DB Seeds] Sample squad players seeded successfully.');
    }

    console.log('[DB Seeds] All database seeds verified.');
  } catch (err) {
    console.error('[DB Seeds ERROR] Failed to run seeds:', err.message);
  }
}

module.exports = { runDatabaseSeeds };
