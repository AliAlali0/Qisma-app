/**
 * ============================================================================
 * Tournaments Routes
 * ============================================================================
 * GET    /api/tournaments          - List all tournaments
 * POST   /api/tournaments/generate - Generate tournament and balance teams
 * PUT    /api/tournaments/:id      - Update tournament standings / fixtures
 * DELETE /api/tournaments/:id      - Remove tournament
 */

const express = require('express');
const router = express.Router();
const tournamentsController = require('../controllers/tournaments.controller');

router.get('/', tournamentsController.getTournaments);
router.post('/generate', tournamentsController.generateTournament);
router.put('/:id', tournamentsController.updateTournament);
router.delete('/:id', tournamentsController.deleteTournament);

module.exports = router;
