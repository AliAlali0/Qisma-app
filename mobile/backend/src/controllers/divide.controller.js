/**
 * ============================================================================
 * Divide Controller (Tactical Team Balancing & Dual AI Division)
 * ============================================================================
 * Handles WhatsApp roster division via the 3-Tier AI pipeline (Llama/Gemini/Local)
 * as well as custom formation pitch drafting (/api/draft-balance).
 */

const { PlayerModel } = require('../models');
const { cleanPlayerName, extractExplicitHintsFromText } = require('../utils/helpers');
const { balanceTeamsTactically } = require('../services/balancing.service');
const { autoSavePlayersToDB } = require('../services/players.service');
const { processRosterDivision } = require('../services/ai.service');

/**
 * POST /api/divide-teams
 * Parses unstructured WhatsApp rosters and balances players into Team A & Team B.
 */
async function divideTeams(req, res) {
  try {
    const { rawText, userRole } = req.body;
    console.log(`[INFO] /api/divide-teams request received. Role: ${userRole || 'guest'}`);

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'النص فارغ' });
    }

    // Prepare known database players map for rating/position enrichment
    let dbPlayersMap = new Map();
    let dbPlayersSummary = '';
    try {
      const dbPlayers = await PlayerModel.findAllBasic();
      for (const row of dbPlayers) {
        dbPlayersMap.set(row.name.trim(), row);
      }
      dbPlayersSummary = dbPlayers
        .map((r) => `${r.name} (ريت: ${r.rating}, مركز: ${r.primary_position})`)
        .join(' | ');
    } catch (err) {}

    const explicitHints = extractExplicitHintsFromText(rawText);

    // Run unified AI pipeline (Llama 3.1 -> Gemini Cloud Fallback -> Local Rule Engine)
    const resultData = await processRosterDivision(
      rawText,
      userRole,
      dbPlayersMap,
      dbPlayersSummary,
      explicitHints
    );

    // Auto-save discovered or updated players to PostgreSQL in background
    if (resultData.allExtractedForDB) {
      await autoSavePlayersToDB(resultData.allExtractedForDB);
      delete resultData.allExtractedForDB;
    }

    res.json(resultData);
  } catch (error) {
    console.error('[DIVIDE-TEAMS ERROR]:', error.message);
    res.status(500).json({ error: 'خطأ في تشغيل التحليل: ' + error.message });
  }
}

/**
 * POST /api/draft-balance
 * Balances selected registered players into specific formation slots (DEF, MID, ATT, GK).
 */
async function draftBalance(req, res) {
  try {
    const { players, formation } = req.body;
    if (!Array.isArray(players) || players.length < 2) {
      return res.status(400).json({ error: 'الرجاء اختيار لاعبين اثنين على الأقل للتقسيم' });
    }

    const defTarget = Number(formation?.def) || 2;
    const midTarget = Number(formation?.mid) || 2;
    const attTarget = Number(formation?.att) || 1;

    let poolList = players.map((p) => ({
      id: p.id,
      name: cleanPlayerName(p.name),
      rating: Math.min(Math.max(Number(p.rating) || 75, 40), 99),
      primary_position: p.primary_position || 'وسط',
      secondary_positions: Array.isArray(p.secondary_positions) ? p.secondary_positions : [],
    }));

    poolList.sort((a, b) => b.rating - a.rating);

    const assignedPlayers = [];
    const usedIds = new Set();

    const pickForPosition = (posName, countNeeded) => {
      const picked = [];
      for (const p of poolList) {
        if (picked.length >= countNeeded) break;
        if (!usedIds.has(p.id) && p.primary_position === posName) {
          usedIds.add(p.id);
          picked.push({
            ...p,
            position: posName,
            isGoalkeeper: posName === 'حارس',
          });
        }
      }

      for (const p of poolList) {
        if (picked.length >= countNeeded) break;
        if (!usedIds.has(p.id) && p.secondary_positions.includes(posName)) {
          usedIds.add(p.id);
          picked.push({
            ...p,
            position: posName,
            isGoalkeeper: posName === 'حارس',
          });
        }
      }

      return picked;
    };

    const gks = pickForPosition('حارس', 2);
    const defs = pickForPosition('دفاع', defTarget * 2);
    const atts = pickForPosition('هجوم', attTarget * 2);
    const mids = pickForPosition('وسط', midTarget * 2);

    assignedPlayers.push(...gks, ...defs, ...atts, ...mids);

    for (const p of poolList) {
      if (!usedIds.has(p.id)) {
        usedIds.add(p.id);
        let fallbackPos = 'وسط';
        if (gks.length < 2) {
          fallbackPos = 'حارس';
          gks.push(p);
        } else if (defs.length < defTarget * 2) {
          fallbackPos = 'دفاع';
          defs.push(p);
        } else if (atts.length < attTarget * 2) {
          fallbackPos = 'هجوم';
          atts.push(p);
        } else {
          fallbackPos = 'وسط';
          mids.push(p);
        }
        assignedPlayers.push({
          ...p,
          position: fallbackPos,
          isGoalkeeper: fallbackPos === 'حارس',
        });
      }
    }

    const balanced = balanceTeamsTactically(assignedPlayers, false, 'ai');
    res.json(balanced);
  } catch (err) {
    console.error('[DRAFT BALANCE ERROR]:', err.message);
    res.status(500).json({ error: 'فشل تقسيم اللاعبين المختارين' });
  }
}

module.exports = {
  divideTeams,
  draftBalance,
};
