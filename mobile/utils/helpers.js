import { KIT_COLORS } from '../constants/config';

export function cleanPlayerName(raw) {
  if (!raw) return 'لاعب';
  let str = String(raw)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/🧤|⚽|🔥|⭐|🏟️|🟢|🔵|🔴|🟡|🟣|⚫/g, ' ')
    .replace(/[0-9٠-٩]+/g, ' ')
    .replace(/[\-\–\—\/\\.,،:()\[\]{}+*]/g, ' ');

  const stopWords = new Set([
    'ممتاز', 'اسطورة', 'أسطورة', 'متفوق', 'فنان', 'حريقة', 'محترف', 'لعيب',
    'كويس', 'جيد', 'مجتهد', 'مرتب', 'متوسط', 'يمشي', 'الليلة', 'الحال', 'عادي',
    'فاشل', 'تكملة', 'عدد', 'ضعيف', 'تعبان', 'جدا', 'جداً',
    'حارس', 'مرمى', 'دفاع', 'مدافع', 'وسط', 'محور', 'هجوم', 'مهاجم', 'صانع', 'ظهير',
    'gk', 'st', 'cm', 'cb', 'احتياط', 'انتظار', 'سبير',
  ]);

  const words = str
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  return words.join(' ') || 'لاعب';
}

export function prepareTeamForPitch(team) {
  const updated = team.map((p, index) => {
    const cleaned = cleanPlayerName(p.name);
    const isGk = Boolean(p.isGoalkeeper) || p.position === 'حارس';
    const validRating = Number(p.rating);
    return {
      ...p,
      name: cleaned,
      rating: !isNaN(validRating) && validRating >= 40 ? Math.round(validRating) : isGk ? 80 : 75,
      isGoalkeeper: isGk,
      position: isGk ? 'حارس' : p.position || 'وسط',
      uniqueId:
        p.uniqueId ||
        `p-${index}-${cleaned.replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 7)}`,
    };
  });

  let gks = updated.filter((p) => p.isGoalkeeper || p.position === 'حارس');
  if (gks.length === 0 && updated.length > 0) {
    updated[0].position = 'حارس';
    updated[0].isGoalkeeper = true;
  }

  return updated;
}

export function createEmptyFormationSlots(teamKey, defCount, midCount, attCount) {
  const slots = [];
  slots.push({
    slotId: `${teamKey}-GK-0`,
    teamKey,
    position: 'حارس',
    isGoalkeeper: true,
    player: null,
  });

  for (let i = 0; i < defCount; i++) {
    slots.push({
      slotId: `${teamKey}-DEF-${i}`,
      teamKey,
      position: 'دفاع',
      isGoalkeeper: false,
      player: null,
    });
  }
  for (let i = 0; i < midCount; i++) {
    slots.push({
      slotId: `${teamKey}-MID-${i}`,
      teamKey,
      position: 'وسط',
      isGoalkeeper: false,
      player: null,
    });
  }
  for (let i = 0; i < attCount; i++) {
    slots.push({
      slotId: `${teamKey}-ATT-${i}`,
      teamKey,
      position: 'هجوم',
      isGoalkeeper: false,
      player: null,
    });
  }
  return slots;
}

export function computeTournamentStandings(teams, fixtures) {
  const statsMap = {};
  (teams || []).forEach((t) => {
    statsMap[t.teamId] = {
      teamId: t.teamId,
      name: t.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    };
  });

  (fixtures || []).forEach((m) => {
    if (m.stage !== 'group') return;
    if (m.scoreA === null || m.scoreB === null || m.scoreA === undefined || m.scoreB === undefined) {
      return;
    }

    const sA = Number(m.scoreA);
    const sB = Number(m.scoreB);
    const stA = statsMap[m.teamAId];
    const stB = statsMap[m.teamBId];
    if (!stA || !stB) return;

    stA.played += 1;
    stB.played += 1;
    stA.gf += sA;
    stA.ga += sB;
    stA.gd = stA.gf - stA.ga;

    stB.gf += sB;
    stB.ga += sA;
    stB.gd = stB.gf - stB.ga;

    if (sA > sB) {
      stA.won += 1;
      stA.points += 3;
      stB.lost += 1;
    } else if (sB > sA) {
      stB.won += 1;
      stB.points += 3;
      stA.lost += 1;
    } else {
      stA.drawn += 1;
      stB.drawn += 1;
      stA.points += 1;
      stB.points += 1;
    }
  });

  return Object.values(statsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

export function getPositionCode(pos) {
  if (pos === 'حارس') return 'GK';
  if (pos === 'دفاع') return 'CB';
  if (pos === 'هجوم') return 'ST';
  return 'CM';
}

export function getCardStyleByRating(rating, isGk) {
  if (isGk) return { bg: '#F97316', border: '#FED7AA', text: '#FFFFFF' };
  if (rating >= 85) return { bg: '#EAB308', border: '#FEF08A', text: '#1F2937' };
  if (rating >= 72) return { bg: '#CBD5E1', border: '#F8FAFC', text: '#1E293B' };
  return { bg: '#B45309', border: '#FDE68A', text: '#FFFFFF' };
}

export function getKitEmojiByHex(hex, fallbackKey) {
  const found = KIT_COLORS.find((c) => c.hex === hex);
  if (found) return found.emoji;
  return fallbackKey === 'A' ? '🟢' : '🔵';
}

export function getTeamLines(team) {
  const gks = team.filter((p) => p.position === 'حارس' || p.isGoalkeeper);
  const defs = team.filter((p) => !p.isGoalkeeper && p.position === 'دفاع');
  const mids = team.filter((p) => !p.isGoalkeeper && p.position === 'وسط');
  const atts = team.filter((p) => !p.isGoalkeeper && p.position === 'هجوم');
  return { gks, defs, mids, atts };
}

export function getDraftLines(slots) {
  const gks = slots.filter((s) => s.position === 'حارس');
  const defs = slots.filter((s) => s.position === 'دفاع');
  const mids = slots.filter((s) => s.position === 'وسط');
  const atts = slots.filter((s) => s.position === 'هجوم');
  return { gks, defs, mids, atts };
}

export function getAlphabetTeamCode(index) {
  let code = '';
  let n = Number(index) || 0;
  while (n >= 0) {
    code = String.fromCharCode(65 + (n % 26)) + code;
    n = Math.floor(n / 26) - 1;
  }
  return code;
}