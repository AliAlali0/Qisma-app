/**
 * ============================================================================
 * Matches Routes
 * ============================================================================
 * GET    /api/matches          - Retrieve match history
 * POST   /api/matches          - Create a new match record
 * PUT    /api/matches/:id/score- Update scores, wins & MVP awards
 * DELETE /api/matches/:id      - Remove a match
 */

const express = require('express');
const router = express.Router();
const matchesController = require('../controllers/matches.controller');

router.get('/', matchesController.getMatches);
router.post('/', matchesController.createMatch);
router.put('/:id/score', matchesController.updateMatchScore);
router.delete('/:id', matchesController.deleteMatch);

module.exports = router;
