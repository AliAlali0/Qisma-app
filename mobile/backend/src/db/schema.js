/**
 * ============================================================================
 * Database Schema & Migrations
 * ============================================================================
 * Defines core PostgreSQL relational tables, foreign key constraints,
 * and performance indexes for Qismah App.
 */

const { pool } = require('../../db');

/**
 * Creates all application tables and performance indexes if they don't exist.
 */
async function initializeSchema() {
  console.log('[DB Schema] Running schema verification and table creation...');

  // 1. Users & Organizers Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) DEFAULT '1234',
      role VARCHAR(30) DEFAULT 'registered',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Custom Teams & Squads Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      kit_color VARCHAR(30) DEFAULT '#16A34A',
      defenders_count INTEGER DEFAULT 2,
      midfielders_count INTEGER DEFAULT 2,
      attackers_count INTEGER DEFAULT 1,
      players_data JSONB DEFAULT '[]',
      tournament_name VARCHAR(120) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Registered Players Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      rating INTEGER DEFAULT 75 CHECK (rating BETWEEN 1 AND 99),
      primary_position VARCHAR(30) NOT NULL,
      secondary_positions TEXT[] DEFAULT '{}',
      group_name VARCHAR(100) DEFAULT 'عام',
      matches_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      mvp_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Match Archive & Score History Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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

  // 5. Tournaments & Leagues Table
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

  // Safe migrations for pre-existing databases (non-breaking additions)
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(100) DEFAULT '1234';
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS players_data JSONB DEFAULT '[]';
    ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_name VARCHAR(120) DEFAULT NULL;
    ALTER TABLE players ADD COLUMN IF NOT EXISTS group_name VARCHAR(100) DEFAULT 'عام';
    ALTER TABLE players ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;
    ALTER TABLE players ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
    ALTER TABLE players ADD COLUMN IF NOT EXISTS mvp_count INTEGER DEFAULT 0;
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_color VARCHAR(30) DEFAULT '#16A34A';
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_color VARCHAR(30) DEFAULT '#2563EB';
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS mvp_player_name VARCHAR(100) DEFAULT NULL;
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS ratings_applied BOOLEAN DEFAULT FALSE;
  `);

  // 6. Performance Indexes (Ensures instant lookups by user_id and player name)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
    CREATE INDEX IF NOT EXISTS idx_players_name ON players(user_id, name);
    CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
    CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
    CREATE INDEX IF NOT EXISTS idx_tournaments_user_id ON tournaments(user_id);
  `);

  console.log('[DB Schema] Verified tables & performance indexes successfully.');
}

module.exports = {
  initializeSchema,
};
