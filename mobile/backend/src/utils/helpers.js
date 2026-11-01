/**
 * ============================================================================
 * Helper Utilities (Data Sanitization, String Cleaning, & Formatting)
 * ============================================================================
 * Provides shared utility functions used across backend services & controllers:
 * - cleanPlayerName: Removes noise, numbers, stopwords, and emojis from player names.
 * - extractExplicitHintsFromText: Extracts positions/ratings written explicitly in WhatsApp text.
 * - getAlphabetTeamCode: Generates alphabetical labels (Team A, Team B ... Team Z, Team AA).
 * - shuffleArray: Fisher-Yates array shuffling for balanced random distribution.
 * - getDefaultUserId: Resolves the default organizer user ID from PostgreSQL.
 */

const { pool } = require('../../db');

/**
 * Resolves the primary default user id (admin/organizer).
 * Creates the admin user record if not present.
 */
async function getDefaultUserId() {
  const res = await pool.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
  if (res.rows.length > 0) return res.rows[0].id;
  const insertRes = await pool.query(
    `INSERT INTO users (username, role) VALUES ('admin', 'registered') RETURNING id`
  );
  return insertRes.rows[0].id;
}

/**
 * Strips formatting, numbers, emojis, and descriptive adjectives from names.
 */
function cleanPlayerName(raw) {
  if (!raw) return 'لاعب';
  let str = String(raw)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/🧤|⚽|🔥|⭐|🏟️|🟢|🔵/g, ' ')
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

/**
 * Parses raw WhatsApp text to extract explicit positions (GK, DEF, MID, ATT)
 * or explicit numeric ratings mentioned in brackets/parentheses.
 */
function extractExplicitHintsFromText(text) {
  const hints = new Map();
  const lines = text.split('\n');
  let inGkSection = false;
  let gkCount = 0;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/احتياط|انتظار|اضافي|إضافي|سبير|مقاعد|ويتنق|waiting/i.test(line) && !/^\s*[0-9٠-٩]+\s*[\/\-.\)]/.test(line)) {
      inGkSection = false;
      continue;
    }

    const isNumbered = /^\s*[0-9٠-٩]+\s*[\/\-.\)]\s*/.test(line);
    if (!isNumbered && (line.includes('حارس') || line.includes('حراس') || line.includes('🧤'))) {
      inGkSection = true;
      gkCount = 0;
      continue;
    }

    const match = line.match(/^\s*[0-9٠-٩]+\s*[\/\-.\)]\s*(.*)$/);
    if (match) {
      const rawName = match[1].trim();
      if (!rawName) continue;

      let isGk = false;
      if (inGkSection && gkCount < 2) {
        isGk = true;
        gkCount++;
        if (gkCount >= 2) inGkSection = false;
      }
      if (rawName.includes('🧤') || /(^|\s|\(|\[)(حارس|GK)(\s|\)|\]|$)/i.test(rawName)) {
        isGk = true;
      }

      let rating = null;
      const ratingMatch = rawName.match(/[\(\[\s](\d{2})[\)\]\s]?/);
      if (ratingMatch) rating = parseInt(ratingMatch[1], 10);

      let pos = isGk ? 'حارس' : null;
      if (!isGk) {
        if (/دفاع|مدافع|ظهير|قلب|CB/i.test(rawName)) pos = 'دفاع';
        else if (/هجوم|مهاجم|راس حربة|ST/i.test(rawName)) pos = 'هجوم';
        else if (/وسط|محور|صانع|CM/i.test(rawName)) pos = 'وسط';
      }

      const clean = cleanPlayerName(rawName);
      hints.set(clean, { isGk, rating, pos });
    }
  }

  return hints;
}

/**
 * Returns alphabetical code for an index (0 -> A, 1 -> B ... 25 -> Z, 26 -> AA).
 */
function getAlphabetTeamCode(index) {
  let code = '';
  let n = Number(index) || 0;
  while (n >= 0) {
    code = String.fromCharCode(65 + (n % 26)) + code;
    n = Math.floor(n / 26) - 1;
  }
  return code;
}

/**
 * In-place randomized shuffle of an array.
 */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

module.exports = {
  getDefaultUserId,
  cleanPlayerName,
  extractExplicitHintsFromText,
  getAlphabetTeamCode,
  shuffleArray,
};
