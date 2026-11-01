const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://qisma_user:qisma_password@127.0.0.1:5433/qisma_db';

const pool = new Pool({ connectionString });

async function initDatabase() {
  try {
    console.log('[DB] Connecting to PostgreSQL and verifying schema...');
    // داخل دالة initDatabase() بعد إنشاء جدول teams مباشرة أضف:
    await pool.query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS players_data JSONB DEFAULT '[]';`);
    await pool.query(`ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_name VARCHAR(120) DEFAULT NULL;`);
    // 1. جدول المستخدمين (يدعم: registered, subscriber)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) DEFAULT '1234',
        role VARCHAR(30) DEFAULT 'registered',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(100) DEFAULT '1234';`);

    // 2. جدول الفرق المحفوظة وألوان الأطقم
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        kit_color VARCHAR(30) DEFAULT '#1B4332',
        defenders_count INTEGER DEFAULT 2,
        midfielders_count INTEGER DEFAULT 2,
        attackers_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. جدول اللاعبين + إحصائيات الفوز ونجم المباراة
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        rating INTEGER DEFAULT 75 CHECK (rating BETWEEN 1 AND 99),
        primary_position VARCHAR(30) NOT NULL,
        secondary_positions TEXT[] DEFAULT '{}',
        matches_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        mvp_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS mvp_count INTEGER DEFAULT 0;`);
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS group_name VARCHAR(100) DEFAULT 'عام';`);

    // 4. جدول المباريات والتقسيمات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        team_a_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        team_b_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        team_a_name VARCHAR(100) DEFAULT 'الفريق الأول',
        team_b_name VARCHAR(100) DEFAULT 'الفريق الثاني',
        team_a_color VARCHAR(30) DEFAULT '#16A34A',
        team_b_color VARCHAR(30) DEFAULT '#2563EB',
        formation VARCHAR(20) DEFAULT '2-2-1',
        team_a_players JSONB NOT NULL,
        team_b_players JSONB NOT NULL,
        team_a_score INTEGER DEFAULT NULL,
        team_b_score INTEGER DEFAULT NULL,
        mvp_player_name VARCHAR(100) DEFAULT NULL,
        ratings_applied BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_color VARCHAR(30) DEFAULT '#16A34A';`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_color VARCHAR(30) DEFAULT '#2563EB';`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS mvp_player_name VARCHAR(100) DEFAULT NULL;`);
    await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS ratings_applied BOOLEAN DEFAULT FALSE;`);

    // 5. جدول البطولات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(120) DEFAULT 'بطولة قِسمه',
        tournament_type VARCHAR(40) NOT NULL,
        teams_count INTEGER DEFAULT 4,
        teams_data JSONB NOT NULL,
        fixtures_data JSONB NOT NULL,
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
      defaultUserId = existingUser.rows[0].id;
    }

    const teamsCount = await pool.query(
      `SELECT COUNT(*) FROM teams WHERE user_id = $1`,
      [defaultUserId]
    );
    if (parseInt(teamsCount.rows[0].count, 10) === 0) {
      await pool.query(
        `INSERT INTO teams (user_id, name, kit_color, defenders_count, midfielders_count, attackers_count)
         VALUES 
         ($1, 'فريق الصقور', '#16A34A', 3, 3, 2),
         ($1, 'فريق النمور', '#2563EB', 3, 3, 2),
         ($1, 'فريق الأسود', '#DC2626', 2, 2, 1),
         ($1, 'فريقالملكي', '#D97706', 2, 2, 1);`,
        [defaultUserId]
      );
    }

    const playersCount = await pool.query(
      `SELECT COUNT(*) FROM players WHERE user_id = $1`,
      [defaultUserId]
    );
    if (parseInt(playersCount.rows[0].count, 10) === 0) {
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
          `INSERT INTO players (user_id, name, rating, primary_position, secondary_positions)
           VALUES ($1, $2, $3, $4, $5)`,
          [defaultUserId, name, rating, primaryPos, secPositions]
        );
      }
    }

    console.log('[DB] Step 7 Schema Ready (users, teams, players + stats, matches + MVP, tournaments)!');
  } catch (err) {
    console.error('[DB ERROR] Failed to initialize PostgreSQL:', err.message);
  }
}

module.exports = { pool, initDatabase };