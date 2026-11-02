/**
 * ============================================================================
 * PostgreSQL Database Connection & Pool Management
 * ============================================================================
 * Exports the connection pool and the master database initialization routine.
 */

const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://qisma_user:qisma_password@127.0.0.1:5433/qisma_db';

const pool = new Pool({ connectionString });

// Test connectivity on initial load
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

/**
 * Initializes the database schema, migrations, and seed data.
 */
async function initDatabase() {
  try {
    console.log('[DB] Connecting to PostgreSQL...');
    
    // Dynamically load schema and seeds to prevent circular dependencies
    const { initializeSchema } = require('./src/db/schema');
    const { runDatabaseSeeds } = require('./src/db/seeds');

    await initializeSchema();
    await runDatabaseSeeds();

    console.log('[DB] Database initialization complete and ready for queries.');
  } catch (err) {
    console.error('[DB ERROR] Failed to initialize PostgreSQL:', err.message);
  }
}

module.exports = {
  pool,
  initDatabase,
};
