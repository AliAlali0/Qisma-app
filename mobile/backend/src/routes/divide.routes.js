/**
 * ============================================================================
 * Divide & Draft Routes
 * ============================================================================
 * POST /api/divide-teams - AI roster extraction and tactical division
 * POST /api/draft-balance- Balancing selected players for custom pitch formations
 */

const express = require('express');
const router = express.Router();
const divideController = require('../controllers/divide.controller');

router.post('/divide-teams', divideController.divideTeams);
router.post('/draft-balance', divideController.draftBalance);

module.exports = router;
