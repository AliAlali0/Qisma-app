/**
 * ============================================================================
 * Qismah Backend Server (Main Application Entry Point)
 * ============================================================================
 * Modular Express server architecture:
 * - /api/auth        -> auth.routes
 * - /api/players     -> players.routes
 * - /api/teams       -> teams.routes
 * - /api/matches     -> matches.routes
 * - /api/tournaments -> tournaments.routes
 * - /api             -> divide.routes (/divide-teams, /draft-balance)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');

// Route Modules
const authRoutes = require('./src/routes/auth.routes');
const playersRoutes = require('./src/routes/players.routes');
const teamsRoutes = require('./src/routes/teams.routes');
const matchesRoutes = require('./src/routes/matches.routes');
const tournamentsRoutes = require('./src/routes/tournaments.routes');
const divideRoutes = require('./src/routes/divide.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/', (req, res) => {
  res.send('✅ Qisma App Modular Backend (Layered Architecture) is running successfully!');
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api', divideRoutes);

// Server Startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[READY] Modular Backend Server running on port ${PORT}`);
  await initDatabase();
});
