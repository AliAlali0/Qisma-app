/**
 * ============================================================================
 * Balancing Service (Tactical Optimization & Matchmaking Algorithms)
 * ============================================================================
 * Provides core tactical distribution algorithms:
 * - balanceTeamsTactically: 2-team tactical balancer with exact position pairing (GK, DEF, MID, ATT).
 * - divideIntoMultipleTournamentTeams: Multi-team tournament generator supporting N teams (A, B... Z, AA).
 * - buildTournamentFixtures: Generates match fixtures for Round-Robin leagues or Knockout brackets.
 */

const { cleanPlayerName, getAlphabetTeamCode, shuffleArray } = require('../utils/helpers');

/**
 * 2-Team Tactical Balancer.
 * Pairs players by position first (DEF vs DEF, ATT vs ATT, GK vs GK),
 * then executes swap optimization to minimize rating differences between Team A and Team B.
 */
function balanceTeamsTactically(activeMainPlayers, wasRounded, analysisSource) {
  let goalkeepers = activeMainPlayers.filter((p) => p.isGoalkeeper || p.position === 'حارس');
  let outfieldPlayers = activeMainPlayers.filter((p) => !p.isGoalkeeper && p.position !== 'حارس');

  // Maximum 2 main goalkeepers (1 per team)
  goalkeepers.sort((a, b) => b.rating - a.rating);
  while (goalkeepers.length > 2) {
    const extraGk = goalkeepers.pop();
    extraGk.isGoalkeeper = false;
    extraGk.position = 'دفاع';
    outfieldPlayers.push(extraGk);
  }

  // If list has no specific positions assigned (all midfielders), distribute even counts across DEF and ATT
  const hasDefs = outfieldPlayers.some((p) => p.position === 'دفاع');
  const hasAtts = outfieldPlayers.some((p) => p.position === 'هجوم');
  if (!hasDefs && !hasAtts && outfieldPlayers.length >= 4) {
    const totalOut = outfieldPlayers.length;
    let targetDef = Math.max(2, Math.round((totalOut * 0.4) / 2) * 2);
    let targetAtt = Math.max(2, Math.round((totalOut * 0.25) / 2) * 2);
    if (targetDef + targetAtt > totalOut) {
      targetDef = 2;
      targetAtt = 2;
    }
    outfieldPlayers.forEach((p, idx) => {
      if (idx < targetDef) p.position = 'دفاع';
      else if (idx < targetDef + targetAtt) p.position = 'هجوم';
      else p.position = 'وسط';
    });
  }

  // Group players by position sorted descending by rating
  const gkGroup = [...goalkeepers].map((p) => ({ ...p, isGoalkeeper: true, position: 'حارس' })).sort((a, b) => b.rating - a.rating);
  const attGroup = outfieldPlayers.filter((p) => p.position === 'هجوم').sort((a, b) => b.rating - a.rating);
  const defGroup = outfieldPlayers.filter((p) => p.position === 'دفاع').sort((a, b) => b.rating - a.rating);
  const midGroup = outfieldPlayers.filter((p) => p.position !== 'هجوم' && p.position !== 'دفاع').map((p) => ({ ...p, position: 'وسط' })).sort((a, b) => b.rating - a.rating);

  const teamA = [];
  const teamB = [];
  const leftovers = [];

  // 1. Even distribution per position group (Pairs matching)
  const positionGroups = [gkGroup, attGroup, defGroup, midGroup];

  for (const group of positionGroups) {
    const pool = [...group];
    while (pool.length >= 2) {
      const p1 = pool.shift();
      const p2 = pool.shift();

      const sumA = teamA.reduce((s, p) => s + p.rating, 0);
      const sumB = teamB.reduce((s, p) => s + p.rating, 0);

      if (sumA <= sumB) {
        teamA.push(p1);
        teamB.push(p2);
      } else {
        teamB.push(p1);
        teamA.push(p2);
      }
    }
    if (pool.length === 1) {
      leftovers.push(pool.shift());
    }
  }

  // 2. Distribute leftover players while keeping squad size balanced
  leftovers.sort((a, b) => b.rating - a.rating);
  const targetSize = activeMainPlayers.length / 2;

  for (const player of leftovers) {
    const sumA = teamA.reduce((s, p) => s + p.rating, 0);
    const sumB = teamB.reduce((s, p) => s + p.rating, 0);

    if (teamA.length < targetSize && teamB.length < targetSize) {
      if (sumA <= sumB) teamA.push(player);
      else teamB.push(player);
    } else if (teamA.length < targetSize) {
      teamA.push(player);
    } else {
      teamB.push(player);
    }
  }

  // 3. Swap Optimization (Only swaps players of identical tactical positions)
  let improved = true;
  while (improved) {
    improved = false;
    const sumA = teamA.reduce((s, p) => s + p.rating, 0);
    const sumB = teamB.reduce((s, p) => s + p.rating, 0);
    let currentDiff = Math.abs(sumA - sumB);

    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        if (teamA[i].position !== teamB[j].position) continue;

        const newSumA = sumA - teamA[i].rating + teamB[j].rating;
        const newSumB = sumB - teamB[j].rating + teamA[i].rating;

        if (Math.abs(newSumA - newSumB) < currentDiff) {
          const temp = teamA[i];
          teamA[i] = teamB[j];
          teamB[j] = temp;
          currentDiff = Math.abs(newSumA - newSumB);
          improved = true;
        }
      }
    }
  }

  return {
    totalExtracted: teamA.length + teamB.length,
    wasRounded,
    goalkeepersCount: gkGroup.length,
    teamA,
    teamB,
    teamARatingTotal: teamA.reduce((s, p) => s + p.rating, 0),
    teamBRatingTotal: teamB.reduce((s, p) => s + p.rating, 0),
    analysisSource,
  };
}

/**
 * Divides registered players across K tournament teams (supports any number of teams).
 * Ensures at least 1 goalkeeper per team and balances total ratings across all teams.
 */
function divideIntoMultipleTournamentTeams(players, teamsCount, startAlphaIndex = 0) {
  const k = Math.max(Number(teamsCount) || 2, 2);
  const defaultColors = [
    '#1B4332', '#1D4ED8', '#B91C1C', '#D97706',
    '#7C3AED', '#0F766E', '#BE185D', '#374151',
  ];

  const teams = Array.from({ length: k }, (_, idx) => {
    const alphaCode = getAlphabetTeamCode(startAlphaIndex + idx);
    return {
      teamId: `T${idx + 1}`,
      name: `فريق ${alphaCode}`,
      color: defaultColors[idx % defaultColors.length],
      players: [],
      ratingTotal: 0,
    };
  });

  const poolList = shuffleArray(
    players.map((p, i) => ({
      id: p.id || `temp-${i}`,
      name: cleanPlayerName(p.name),
      rating: Math.min(Math.max(Number(p.rating) || 75, 40), 99),
      primary_position: p.primary_position || p.position || 'وسط',
      secondary_positions: Array.isArray(p.secondary_positions) ? p.secondary_positions : [],
    }))
  );

  const primaryGks = shuffleArray(poolList.filter((p) => p.primary_position === 'حارس'));
  const secondaryGks = shuffleArray(
    poolList.filter(
      (p) => p.primary_position !== 'حارس' && p.secondary_positions.includes('حارس')
    )
  );
  const nonGks = shuffleArray(
    poolList.filter(
      (p) => p.primary_position !== 'حارس' && !p.secondary_positions.includes('حارس')
    )
  );

  const mandatoryGks = [];
  const remainingPool = [];

  while (mandatoryGks.length < k && primaryGks.length > 0) {
    mandatoryGks.push({
      ...primaryGks.shift(),
      position: 'حارس',
      isGoalkeeper: true,
      lockedMainGk: true,
    });
  }

  while (primaryGks.length > 0) {
    const extraGk = primaryGks.shift();
    remainingPool.push({
      ...extraGk,
      position: extraGk.secondary_positions[0] || 'حارس',
      isGoalkeeper: !extraGk.secondary_positions[0],
      lockedMainGk: false,
    });
  }

  while (mandatoryGks.length < k && secondaryGks.length > 0) {
    mandatoryGks.push({
      ...secondaryGks.shift(),
      position: 'حارس',
      isGoalkeeper: true,
      lockedMainGk: true,
    });
  }

  while (secondaryGks.length > 0) {
    const p = secondaryGks.shift();
    remainingPool.push({
      ...p,
      position: p.primary_position,
      isGoalkeeper: false,
      lockedMainGk: false,
    });
  }

  while (mandatoryGks.length < k) {
    if (nonGks.length > 0) {
      mandatoryGks.push({
        ...nonGks.shift(),
        position: 'حارس',
        isGoalkeeper: true,
        lockedMainGk: true,
      });
    } else {
      mandatoryGks.push({
        id: `auto-gk-${mandatoryGks.length}`,
        name: `حارس ${getAlphabetTeamCode(mandatoryGks.length)}`,
        rating: 78,
        primary_position: 'حارس',
        position: 'حارس',
        isGoalkeeper: true,
        lockedMainGk: true,
      });
    }
  }

  for (const p of nonGks) {
    remainingPool.push({
      ...p,
      position: p.primary_position,
      isGoalkeeper: false,
      lockedMainGk: false,
    });
  }

  const shuffledMandatoryGks = shuffleArray(mandatoryGks);
  for (let i = 0; i < k; i++) {
    teams[i].players.push(shuffledMandatoryGks[i]);
  }

  remainingPool.sort((a, b) => {
    const jitterA = a.rating + (Math.random() * 8 - 4);
    const jitterB = b.rating + (Math.random() * 8 - 4);
    return jitterB - jitterA;
  });

  for (const player of remainingPool) {
    teams.sort((a, b) => {
      if (a.players.length !== b.players.length) {
        return a.players.length - b.players.length;
      }
      const sumA = a.players.reduce((s, p) => s + p.rating, 0);
      const sumB = b.players.reduce((s, p) => s + p.rating, 0);
      return sumA - sumB;
    });

    teams[0].players.push(player);
  }

  teams.sort((a, b) => {
    const numA = parseInt(a.teamId.replace('T', ''), 10);
    const numB = parseInt(b.teamId.replace('T', ''), 10);
    return numA - numB;
  });

  // Balance iteration swaps across teams
  for (let iter = 0; iter < 40; iter++) {
    let swapped = false;
    for (let t1 = 0; t1 < k; t1++) {
      for (let t2 = t1 + 1; t2 < k; t2++) {
        const sum1 = teams[t1].players.reduce((s, p) => s + p.rating, 0);
        const sum2 = teams[t2].players.reduce((s, p) => s + p.rating, 0);
        const currentDiff = Math.abs(sum1 - sum2);
        if (currentDiff <= 3) continue;

        for (let i = 0; i < teams[t1].players.length; i++) {
          if (teams[t1].players[i].lockedMainGk) continue;
          for (let j = 0; j < teams[t2].players.length; j++) {
            if (teams[t2].players[j].lockedMainGk) continue;

            const newSum1 = sum1 - teams[t1].players[i].rating + teams[t2].players[j].rating;
            const newSum2 = sum2 - teams[t2].players[j].rating + teams[t1].players[i].rating;
            if (Math.abs(newSum1 - newSum2) < currentDiff - 1) {
              const temp = teams[t1].players[i];
              teams[t1].players[i] = teams[t2].players[j];
              teams[t2].players[j] = temp;
              swapped = true;
              break;
            }
          }
          if (swapped) break;
        }
      }
    }
    if (!swapped) break;
  }

  teams.forEach((t) => {
    t.ratingTotal = t.players.reduce((s, p) => s + p.rating, 0);
  });

  return teams;
}

/**
 * Builds schedule fixtures for round robin or single elimination.
 */
function buildTournamentFixtures(teams, tournamentType) {
  const fixtures = [];
  let matchCounter = 1;

  if (tournamentType === 'league' || tournamentType === 'groups_knockout') {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          matchId: `M-${matchCounter++}`,
          stage: 'group',
          stageLabel: 'دور النقاط',
          teamAId: teams[i].teamId,
          teamAName: teams[i].name,
          teamBId: teams[j].teamId,
          teamBName: teams[j].name,
          scoreA: null,
          scoreB: null,
          winnerId: null,
        });
      }
    }
  } else if (tournamentType === 'knockout') {
    const shuffledTeams = shuffleArray(teams);
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 < shuffledTeams.length) {
        fixtures.push({
          matchId: `KO-${matchCounter++}`,
          stage: 'knockout_r1',
          stageLabel: shuffledTeams.length <= 4 ? 'نصف النهائي (إقصاء)' : 'الدور الإقصائي الأول',
          teamAId: shuffledTeams[i].teamId,
          teamAName: shuffledTeams[i].name,
          teamBId: shuffledTeams[i + 1].teamId,
          teamBName: shuffledTeams[i + 1].name,
          scoreA: null,
          scoreB: null,
          winnerId: null,
        });
      } else {
        fixtures.push({
          matchId: `KO-BYE-${matchCounter++}`,
          stage: 'knockout_bye',
          stageLabel: 'تأهل مباشر للدور القادم (قرعة)',
          teamAId: shuffledTeams[i].teamId,
          teamAName: shuffledTeams[i].name,
          teamBId: null,
          teamBName: 'تأهل مباشر (Bye)',
          scoreA: null,
          scoreB: null,
          winnerId: shuffledTeams[i].teamId,
        });
      }
    }
  }

  return fixtures;
}

module.exports = {
  balanceTeamsTactically,
  divideIntoMultipleTournamentTeams,
  buildTournamentFixtures,
};
