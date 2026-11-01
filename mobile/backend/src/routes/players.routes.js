/**
 * ============================================================================
 * Players Routes
 * ============================================================================
 * GET    /api/players     - Retrieve all registered players
 * POST   /api/players     - Create a new player
 * PUT    /api/players/:id - Update an existing player
 * DELETE /api/players/:id - Remove a player
 */

const express = require('express');
const router = express.Router();
const playersController = require('../controllers/players.controller');

router.get('/', playersController.getPlayers);
router.post('/', playersController.createPlayer);
router.put('/:id', playersController.updatePlayer);
router.delete('/:id', playersController.deletePlayer);

module.exports = router;
