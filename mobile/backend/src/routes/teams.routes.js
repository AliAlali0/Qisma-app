/**
 * ============================================================================
 * Teams Routes
 * ============================================================================
 * GET    /api/teams     - Retrieve all saved teams
 * POST   /api/teams     - Create a new team
 * PUT    /api/teams/:id - Update an existing team
 * DELETE /api/teams/:id - Delete a team
 */

const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams.controller');

router.get('/', teamsController.getTeams);
router.post('/', teamsController.createTeam);
router.put('/:id', teamsController.updateTeam);
router.delete('/:id', teamsController.deleteTeam);

module.exports = router;
