require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDatabase } = require('./db');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Qisma App Backend with Tactical Balancing & Auto-Save is running!');
});

// دالة مساعدة لجلب معرف المستخدم الافتراضي (admin)
async function getDefaultUserId() {
  const res = await pool.query(`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
  if (res.rows.length > 0) return res.rows[0].id;
  const insertRes = await pool.query(
    `INSERT INTO users (username, role) VALUES ('admin', 'registered') RETURNING id`
  );
  return insertRes.rows[0].id;
}

// دالة الحفظ التلقائي للاعبين المستخرجين من اللستة في قاعدة البيانات PostgreSQL
// دالة الحفظ التلقائي المحدثة: تضيف اللاعبين الجدد وتحدث الموجودين فوراً في PostgreSQL
async function autoSavePlayersToDB(playersList) {
  if (!Array.isArray(playersList) || playersList.length === 0) return;
  try {
    const userId = await getDefaultUserId();

    for (const p of playersList) {
      if (!p || !p.name || p.name === 'لاعب إضافي' || p.name === 'لاعب') continue;

      const cleanName = cleanPlayerName(p.name);
      const rating = Math.min(Math.max(Number(p.rating) || 75, 40), 99);
      const primaryPos = p.isGoalkeeper || p.position === 'حارس'
        ? 'حارس'
        : ['دفاع', 'وسط', 'هجوم'].includes(p.position)
        ? p.position
        : 'وسط';

      // فحص هل اللاعب موجود مسبقاً في قاعدة بيانات هذا المستخدم
      const existing = await pool.query(
        `SELECT id FROM players WHERE user_id = $1 AND name = $2 LIMIT 1`,
        [userId, cleanName]
      );

      if (existing.rows.length > 0) {
        // تحديث البيانات إن كان موجوداً
        await pool.query(
          `UPDATE players SET rating = $1, primary_position = $2 WHERE id = $3`,
          [rating, primaryPos, existing.rows[0].id]
        );
      } else {
        // إدخال اللاعب الجديد كلياً في قاعدة البيانات
        await pool.query(
          `INSERT INTO players (user_id, name, rating, primary_position, secondary_positions)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, cleanName, rating, primaryPos, []]
        );
      }
    }
    console.log(`[AUTO-SAVE] Successfully synced ${playersList.length} players to PostgreSQL.`);
  } catch (err) {
    console.error('[AUTO-SAVE ERROR]:', err.message);
  }
}

// ==========================================
// 👥 مسارات إدارة اللاعبين (Players CRUD API)
// ==========================================

app.get('/api/players', async (req, res) => {
  try {
    const userId = await getDefaultUserId();
    const result = await pool.query(
      `SELECT id, name, rating, primary_position, secondary_positions,
              COALESCE(group_name, 'عام') AS group_name,
              COALESCE(matches_played, 0) AS matches_played,
              COALESCE(wins, 0) AS wins,
              COALESCE(mvp_count, 0) AS mvp_count
       FROM players
       WHERE user_id = $1
       ORDER BY rating DESC, wins DESC, id DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB ERROR - GET /api/players]:', err.message);
    res.status(500).json({ error: 'فشل جلب قائمة اللاعبين من قاعدة البيانات' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { name, rating, primary_position, secondary_positions, group_name } = req.body;
    if (!name || !name.trim() || !primary_position) {
      return res.status(400).json({ error: 'اسم اللاعب والمركز الأساسي مطلوبان' });
    }

    const userId = await getDefaultUserId();
    const cleanName = cleanPlayerName(name);
    const numRating = Math.min(Math.max(Number(rating) || 75, 40), 99);
    const secPositionsArray = Array.isArray(secondary_positions)
      ? secondary_positions.filter((pos) => pos !== primary_position)
      : [];

    const result = await pool.query(
      `INSERT INTO players (user_id, name, rating, primary_position, secondary_positions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, rating, primary_position, secondary_positions`,
      [userId, cleanName, numRating, primary_position, secPositionsArray]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - POST /api/players]:', err.message);
    res.status(500).json({ error: 'فشل حفظ اللاعب في قاعدة البيانات' });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const playerId = req.params.id;
    const { name, rating, primary_position, secondary_positions, group_name } = req.body;

    if (!name || !name.trim() || !primary_position) {
      return res.status(400).json({ error: 'اسم اللاعب والمركز الأساسي مطلوبان' });
    }

    const cleanName = cleanPlayerName(name);
    const numRating = Math.min(Math.max(Number(rating) || 75, 40), 99);
    const secPositionsArray = Array.isArray(secondary_positions)
      ? secondary_positions.filter((pos) => pos !== primary_position)
      : [];

    const result = await pool.query(
      `UPDATE players
       SET name = $1, rating = $2, primary_position = $3, secondary_positions = $4, group_name = COALESCE($5, group_name)
       WHERE id = $6
       RETURNING id, name, rating, primary_position, secondary_positions, group_name`,
      [cleanName, numRating, primary_position, secPositionsArray, (group_name && group_name.trim()) ? group_name.trim() : null, playerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'اللاعب غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - PUT /api/players/:id]:', err.message);
    res.status(500).json({ error: 'فشل تحديث بيانات اللاعب' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const playerId = req.params.id;
    await pool.query(`DELETE FROM players WHERE id = $1`, [playerId]);
    res.json({ success: true, deletedId: Number(playerId) });
  } catch (err) {
    console.error('[DB ERROR - DELETE /api/players/:id]:', err.message);
    res.status(500).json({ error: 'فشل حذف اللاعب' });
  }
});

// ==========================================
// 🧹 دوال التنظيف والموازنة التكتيكية حسب المراكز أولاً
// ==========================================

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

// استخراج التقييم والمركز الصريحين من النص الأصلي لضمان عدم ضياع أي مركز مثل [هجوم] أو [دفاع]
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

// ⚖️ خوارزمية التوزيع التكتيكي العادل: تضمن تكافؤ المراكز أولاً (مثلاً 3 دفاع ضد 3، و2 هجوم ضد 2) ثم تقارب القوة
function balanceTeamsTactically(activeMainPlayers, wasRounded, analysisSource) {
  let goalkeepers = activeMainPlayers.filter((p) => p.isGoalkeeper || p.position === 'حارس');
  let outfieldPlayers = activeMainPlayers.filter((p) => !p.isGoalkeeper && p.position !== 'حارس');

  // بحد أقصى حارسين أساسيين (حارس لكل فريق)
  goalkeepers.sort((a, b) => b.rating - a.rating);
  while (goalkeepers.length > 2) {
    const extraGk = goalkeepers.pop();
    extraGk.isGoalkeeper = false;
    extraGk.position = 'دفاع';
    outfieldPlayers.push(extraGk);
  }

  // إذا كانت اللستة بدون أي مراكز محددة (كلهم وسط)، نوزعهم تكتيكياً بأعداد زوجية متساوية
  const hasDefs = outfieldPlayers.some((p) => p.position === 'دفاع');
  const hasAtts = outfieldPlayers.some((p) => p.position === 'هجوم');
  if (!hasDefs && !hasAtts && outfieldPlayers.length >= 4) {
    const totalOut = outfieldPlayers.length;
    // نضمن أعداداً زوجية للدفاع والهجوم ليتوزعوا بالتساوي بين الفريقين
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

  // تصنيف اللاعبين في مجموعات حسب المركز وترتيب كل مركز من الأعلى للأقل تقييماً
  const gkGroup = [...goalkeepers].map((p) => ({ ...p, isGoalkeeper: true, position: 'حارس' })).sort((a, b) => b.rating - a.rating);
  const attGroup = outfieldPlayers.filter((p) => p.position === 'هجوم').sort((a, b) => b.rating - a.rating);
  const defGroup = outfieldPlayers.filter((p) => p.position === 'دفاع').sort((a, b) => b.rating - a.rating);
  const midGroup = outfieldPlayers.filter((p) => p.position !== 'هجوم' && p.position !== 'دفاع').map((p) => ({ ...p, position: 'وسط' })).sort((a, b) => b.rating - a.rating);

  const teamA = [];
  const teamB = [];
  const leftovers = [];

  // 1. توزيع كل مركز زوجياً (أزواج متقابلة): يضمن 100% تساوي عدد الدفاع والهجوم والوسط والحراس في الفريقين!
  const positionGroups = [gkGroup, attGroup, defGroup, midGroup];

  for (const group of positionGroups) {
    const pool = [...group];
    while (pool.length >= 2) {
      const p1 = pool.shift(); // الأعلى في هذا المركز
      const p2 = pool.shift(); // الثاني في نفس المركز

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
    // إذا كان عدد لاعبي هذا المركز فردياً، نحتفظ باللاعب الفردي لتوزيعه بالتساوي في الخطوة التالية
    if (pool.length === 1) {
      leftovers.push(pool.shift());
    }
  }

  // 2. توزيع الفوارق الفردية (إن وجدت) مع الحفاظ على تساوي عدد لاعبي الفريقين
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

  // 3. تحسين تقارب القوة (Swap Optimization) بشرط صارم: التبديل يتم حصراً بين لاعبين من نفس المركز!
  let improved = true;
  while (improved) {
    improved = false;
    const sumA = teamA.reduce((s, p) => s + p.rating, 0);
    const sumB = teamB.reduce((s, p) => s + p.rating, 0);
    let currentDiff = Math.abs(sumA - sumB);

    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        // ممنوع تبديل لاعب إلا مع لاعب يملك نفس المركز بالضبط (دفاع مع دفاع، هجوم مع هجوم، وسط مع وسط، حارس مع حارس)
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
// ==========================================
// 🎮 مسار التقسيم الذكي للاعبين المختارين من السجل حسب الخطة
// ==========================================
app.post('/api/draft-balance', async (req, res) => {
  try {
    const { players, formation } = req.body;
    if (!Array.isArray(players) || players.length < 2) {
      return res.status(400).json({ error: 'الرجاء اختيار لاعبين اثنين على الأقل للتقسيم' });
    }

    const defTarget = Number(formation?.def) || 2;
    const midTarget = Number(formation?.mid) || 2;
    const attTarget = Number(formation?.att) || 1;

    // تجهيز قائمة اللاعبين مع مراكزهم الأساسية والاحتياطية
    let poolList = players.map((p) => ({
      id: p.id,
      name: cleanPlayerName(p.name),
      rating: Math.min(Math.max(Number(p.rating) || 75, 40), 99),
      primary_position: p.primary_position || 'وسط',
      secondary_positions: Array.isArray(p.secondary_positions) ? p.secondary_positions : [],
    }));

    // ترتيب تنازلي حسب التقييم
    poolList.sort((a, b) => b.rating - a.rating);

    const assignedPlayers = [];
    const usedIds = new Set();

    // دالة مساعدة لسحب العدد المطلوب لكل مركز (تبحث في الأساسي أولاً، ثم الاحتياطي)
    const pickForPosition = (posName, countNeeded) => {
      const picked = [];

      // 1. من مركزه الأساسي مطابق
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

      // 2. إذا بقي نقص، نسحب ممن يملكون هذا المركز في المراكز الاحتياطية (secondary_positions)
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

    // نحتاج للفريقين معاً: 2 حراس، (defTarget * 2) دفاع، (attTarget * 2) هجوم، (midTarget * 2) وسط
    const gks = pickForPosition('حارس', 2);
    const defs = pickForPosition('دفاع', defTarget * 2);
    const atts = pickForPosition('هجوم', attTarget * 2);
    const mids = pickForPosition('وسط', midTarget * 2);

    assignedPlayers.push(...gks, ...defs, ...atts, ...mids);

    // أي لاعبين متبقين لم يُسحبوا نوزعهم لإكمال النقص في المراكز بالترتيب
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
});
// 1. المحلل المحلي الذكي (مخصص للضيف Guest)
function guestLocalAnalyzer(text) {
  const lines = text.split('\n');
  const mainPlayers = [];
  const waitingPlayers = [];
  let inGoalkeeperSection = false;
  let gkCountInSec = 0;
  let isWaitingListStarted = false;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    if (
      /احتياط|انتظار|اضافي|إضافي|سبير|مقاعد|ويتنق|waiting/i.test(line) &&
      !/^\s*[0-9٠-٩]+\s*[\/\-.\)]/.test(line)
    ) {
      isWaitingListStarted = true;
      inGoalkeeperSection = false;
      continue;
    }

    const isNumbered = /^\s*[0-9٠-٩]+\s*[\/\-.\)]\s*/.test(line);
    if (!isNumbered && (line.includes('حارس') || line.includes('حراس') || line.includes('🧤'))) {
      inGoalkeeperSection = true;
      gkCountInSec = 0;
      continue;
    }

    const match = line.match(/^\s*[0-9٠-٩]+\s*[\/\-.\)]\s*(.*)$/);
    if (match) {
      let rawName = match[1].trim();

      if (!rawName) {
        if (!isWaitingListStarted) mainPlayers.push({ isEmptySlot: true });
        continue;
      }

      let isGoalkeeper = false;
      if (!isWaitingListStarted && inGoalkeeperSection && gkCountInSec < 2) {
        isGoalkeeper = true;
        gkCountInSec++;
        if (gkCountInSec >= 2) inGoalkeeperSection = false;
      }
      if (rawName.includes('🧤') || /(^|\s|\(|\[)(حارس|GK)(\s|\)|\]|$)/i.test(rawName)) {
        isGoalkeeper = true;
      }

      let rating = isGoalkeeper ? 80 : 75;
      if (/اسطورة|أسطورة|خرافي|نار|حريقة|محترف|عالمي/.test(rawName)) rating = 94;
      else if (/ممتاز|متفوق|فنان|لعيب|كفو|بطل/.test(rawName)) rating = 90;
      else if (/كويس|جيد|مجتهد|مرتب|نشط|سريع/.test(rawName)) rating = 82;
      else if (/متوسط|يمشي|عادي|مقبول/.test(rawName)) rating = 70;
      else if (/فاشل|تكملة|ضعيف|تعبان|طافي|بطيء/.test(rawName)) rating = 55;

      const ratingMatch = rawName.match(/[\(\[\s](\d{2})[\)\]\s]?/);
      if (ratingMatch) rating = parseInt(ratingMatch[1], 10);

      let pos = isGoalkeeper ? 'حارس' : 'وسط';
      if (!isGoalkeeper) {
        if (/دفاع|مدافع|ظهير|قلب|CB/i.test(rawName)) pos = 'دفاع';
        else if (/هجوم|مهاجم|راس حربة|ST/i.test(rawName)) pos = 'هجوم';
        else if (/وسط|محور|صانع|CM/i.test(rawName)) pos = 'وسط';
      }

      let cleanName = cleanPlayerName(rawName);

      const playerObj = {
        name: cleanName,
        isGoalkeeper,
        rating: Math.min(Math.max(rating, 40), 99),
        position: pos,
      };

      if (isWaitingListStarted) {
        waitingPlayers.push(playerObj);
      } else {
        mainPlayers.push(playerObj);
      }
    }
  }

  let emptySlotsCount = mainPlayers.filter((p) => p.isEmptySlot).length;
  let activeMainPlayers = mainPlayers.filter((p) => !p.isEmptySlot);
  let wasRounded = false;

  while (emptySlotsCount > 0 && waitingPlayers.length > 0) {
    activeMainPlayers.push(waitingPlayers.shift());
    emptySlotsCount--;
    wasRounded = true;
  }

  const allRealPlayers = [...activeMainPlayers, ...waitingPlayers];

  if (activeMainPlayers.length % 2 !== 0) {
    if (waitingPlayers.length > 0) {
      activeMainPlayers.push(waitingPlayers.shift());
    } else {
      activeMainPlayers.push({
        name: 'لاعب إضافي',
        isGoalkeeper: false,
        rating: 65,
        position: 'وسط',
      });
    }
    wasRounded = true;
  }

  const result = balanceTeamsTactically(activeMainPlayers, wasRounded, 'local');
  result.allExtractedForDB = allRealPlayers;
  return result;
}

// 2. دالة الذكاء الاصطناعي الهجين (Llama AI للمسجلين)
async function analyzeWithLlamaAI(text) {
  let dbPlayersMap = new Map();
  let dbPlayersSummary = '';
  try {
    const dbRes = await pool.query(
      `SELECT name, rating, primary_position, secondary_positions FROM players`
    );
    for (const row of dbRes.rows) {
      dbPlayersMap.set(row.name.trim(), row);
    }
    dbPlayersSummary = dbRes.rows
      .map((r) => `${r.name} (ريت: ${r.rating}, مركز: ${r.primary_position})`)
      .join(' | ');
  } catch (err) {}

  const explicitHints = extractExplicitHintsFromText(text);

   const prompt = `
أنت محلل بيانات رياضي دقيق وصارم جداً. مهمتك تحليل نص الواتساب التالي بدقة حرفية، وعدم اختلاق أو زيادة أو نقصان أي لاعب.

قواعد صارمة جداً:
1. استخرج اللاعبين **الأساسيين فقط** في مصفوفة "mainPlayers".
2. أي أسماء تحت عناوين (احتياط، انتظار، سبير، مقاعد إضافية) ضعها في مصفوفة "waitingPlayers" ولا تضعها في الأساسيين أبداً!
3. عدد اللاعبين في "mainPlayers" يجب أن يطابق بدقة عدد اللاعبين المرقمين في القائمة الأساسية بالنص. لا تحضر أبداً 12 لاعباً إذا كان النص يحتوي على 10 فقط!
4. الحراس: أي اسم تحت قسم حراس أو بجانبه 🧤 هو حارس (isGoalkeeper: true, position: "حارس").
5. التقييمات والمراكز: استخرجها من النص أو قاعدة البيانات التالية: [${dbPlayersSummary}] أو ضع الافتراضي (75 لللاعب، 80 للحارس).

أرجع JSON فقط بهذا الشكل:
{
  "mainPlayers": [
    { "name": "اسم اللاعب", "isGoalkeeper": false, "rating": 85, "position": "وسط" }
  ],
  "waitingPlayers": [
    { "name": "اسم الاحتياط", "isGoalkeeper": false, "rating": 70, "position": "وسط" }
  ]
}

النص:
"""
${text}
"""
`;
  console.log('[Llama AI] Sending prompt to local Llama 3.1...');

  const response = await axios.post(
    'http://127.0.0.1:11434/api/generate',
    {
      model: 'llama3.1:latest',
      prompt: prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.0,
      },
    },
    { timeout: 120000 }
  );

  const rawResult = JSON.parse(response.data.response);

  const sanitizePlayer = (p) => {
    const cleanName = cleanPlayerName(p.name);
    const dbMatch = dbPlayersMap.get(cleanName);
    const hint = explicitHints.get(cleanName);

    let isGk =
      (hint && hint.isGk) ||
      Boolean(p.isGoalkeeper) ||
      p.position === 'حارس' ||
      (dbMatch && dbMatch.primary_position === 'حارس');

    let numRating = hint && hint.rating ? hint.rating : Number(p.rating);
    if (isNaN(numRating) || numRating < 40 || numRating > 99) {
      numRating = dbMatch ? Number(dbMatch.rating) : isGk ? 80 : 75;
    }

    let rawPos = String(p.position || '').trim();
    if (/هجوم|مهاجم|ST/i.test(rawPos)) rawPos = 'هجوم';
    else if (/دفاع|مدافع|CB/i.test(rawPos)) rawPos = 'دفاع';
    else if (/وسط|محور|CM/i.test(rawPos)) rawPos = 'وسط';
    else if (/حارس|GK/i.test(rawPos)) rawPos = 'حارس';

    let validPos =
      hint && hint.pos
        ? hint.pos
        : ['حارس', 'دفاع', 'وسط', 'هجوم'].includes(rawPos)
        ? rawPos
        : dbMatch
        ? dbMatch.primary_position
        : 'وسط';

    if (isGk) validPos = 'حارس';
    else if (validPos === 'حارس') validPos = 'وسط';

    return {
      name: cleanName,
      isGoalkeeper: isGk,
      rating: Math.round(numRating),
      position: validPos,
    };
  };

  let activeMainPlayers = (rawResult.mainPlayers || [])
    .filter((p) => p && p.name && String(p.name).trim() !== '')
    .map(sanitizePlayer);

  let waitingList = (rawResult.waitingPlayers || [])
    .filter((p) => p && p.name && String(p.name).trim() !== '')
    .map(sanitizePlayer);

  const allRealPlayers = [...activeMainPlayers, ...waitingList];

  let wasRounded = false;
  if (activeMainPlayers.length % 2 !== 0) {
    if (waitingList.length > 0) {
      activeMainPlayers.push(waitingList.shift());
    } else {
      activeMainPlayers.push({
        name: 'لاعب إضافي',
        isGoalkeeper: false,
        rating: 70,
        position: 'وسط',
      });
    }
    wasRounded = true;
  }

  const result = balanceTeamsTactically(activeMainPlayers, wasRounded, 'ai');
  result.allExtractedForDB = allRealPlayers;
  return result;
}

app.post('/api/divide-teams', async (req, res) => {
  try {
    const { rawText, userRole } = req.body;
    console.log(`[INFO] Request received. Role: ${userRole || 'guest'}`);

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'النص فارغ' });
    }

    let resultData;
    if (userRole === 'guest') {
      resultData = guestLocalAnalyzer(rawText);
      console.log(`[SUCCESS] Guest analyzed locally (${resultData.totalExtracted} players).`);
    } else {
      resultData = await analyzeWithLlamaAI(rawText);
      console.log(`[SUCCESS] Registered user analyzed via Llama AI (${resultData.totalExtracted} players).`);
    }

    // حفظ أو تحديث اللاعبين تلقائياً في قاعدة البيانات عند تقسيم اللستة
    if (resultData.allExtractedForDB) {
      await autoSavePlayersToDB(resultData.allExtractedForDB);
      delete resultData.allExtractedForDB;
    }

    res.json(resultData);
  } catch (error) {
    console.error('[ERROR]', error.message);
    res.status(500).json({ error: 'خطأ في تشغيل التحليل: ' + error.message });
  }
});
// ==========================================
// 📜 مسارات سجل المباريات (Matches API)
// ==========================================

// 1. جلب جميع المباريات المحفوظة للمستخدم
app.get('/api/matches', async (req, res) => {
  try {
    const userId = await getDefaultUserId();
    const result = await pool.query(
      `SELECT id, team_a_name, team_b_name, team_a_color, team_b_color, formation, 
              team_a_score, team_b_score, mvp_player_name, ratings_applied,
              team_a_players, team_b_players, created_at 
       FROM matches 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB ERROR - GET /api/matches]:', err.message);
    res.status(500).json({ error: 'فشل جلب سجل المباريات' });
  }
});

// 2. حفظ مباراة وتشكيلة جديدة (مع ألوان الأطقم)
app.post('/api/matches', async (req, res) => {
  try {
    const {
      team_a_name,
      team_b_name,
      team_a_color,
      team_b_color,
      formation,
      team_a_players,
      team_b_players,
      team_a_score,
      team_b_score,
    } = req.body;

    if (!team_a_players || !team_b_players) {
      return res.status(400).json({ error: 'بيانات تشكيلة الفريقين مطلوبة للحفظ' });
    }

    const userId = await getDefaultUserId();
    const scoreA =
      team_a_score !== undefined && team_a_score !== null && team_a_score !== ''
        ? Number(team_a_score)
        : null;
    const scoreB =
      team_b_score !== undefined && team_b_score !== null && team_b_score !== ''
        ? Number(team_b_score)
        : null;

    const result = await pool.query(
      `INSERT INTO matches (user_id, team_a_name, team_b_name, team_a_color, team_b_color, formation, team_a_players, team_b_players, team_a_score, team_b_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        team_a_name || 'الفريق الأول',
        team_b_name || 'الفريق الثاني',
        team_a_color || '#16A34A',
        team_b_color || '#2563EB',
        formation || 'مخصص',
        JSON.stringify(team_a_players),
        JSON.stringify(team_b_players),
        scoreA,
        scoreB,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - POST /api/matches]:', err.message);
    res.status(500).json({ error: 'فشل حفظ المباراة في قاعدة البيانات' });
  }
});

// 3. تحديث النتيجة الاختيارية + تطبيق قاعدة سقف الـ 85 ونجم المباراة MVP
app.put('/api/matches/:id/score', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { team_a_score, team_b_score, mvp_player_name, apply_rating_boost } = req.body;

    const scoreA =
      team_a_score !== undefined && team_a_score !== null && team_a_score !== ''
        ? Number(team_a_score)
        : null;
    const scoreB =
      team_b_score !== undefined && team_b_score !== null && team_b_score !== ''
        ? Number(team_b_score)
        : null;

    const matchCheck = await pool.query(`SELECT * FROM matches WHERE id = $1 LIMIT 1`, [matchId]);
    if (matchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'المباراة غير موجودة' });
    }

    const matchRow = matchCheck.rows[0];
    const userId = matchRow.user_id;
    let ratingsApplied = matchRow.ratings_applied;

    if (apply_rating_boost && !ratingsApplied && scoreA !== null && scoreB !== null) {
      const teamAPlayers = matchRow.team_a_players || [];
      const teamBPlayers = matchRow.team_b_players || [];
      const allParticipants = [...teamAPlayers, ...teamBPlayers];
      const winningPlayers =
        scoreA > scoreB ? teamAPlayers : scoreB > scoreA ? teamBPlayers : [];

      // 1. زيادة عدد المباريات لجميع المشاركين
      for (const p of allParticipants) {
        if (!p || !p.name) continue;
        await pool.query(
          `UPDATE players
           SET matches_played = COALESCE(matches_played, 0) + 1
           WHERE user_id = $1 AND name = $2`,
          [userId, cleanPlayerName(p.name)]
        );
      }

      // 2. لاعبو الفريق الفائز: يُضاف لهم فوز (+1)، ولا يزيد التقييم (+1) إلا إذا كان تقييم اللاعب أقل من 85
      for (const wp of winningPlayers) {
        if (!wp || !wp.name) continue;
        await pool.query(
          `UPDATE players
           SET wins = COALESCE(wins, 0) + 1,
               rating = CASE
                 WHEN rating < 85 THEN rating + 1
                 ELSE rating
               END
           WHERE user_id = $1 AND name = $2`,
          [userId, cleanPlayerName(wp.name)]
        );
      }

      // 3. نجم المباراة MVP: إذا كان تقييمه 85 فأعلى يزيد (+1 فقط)، وإذا كان أقل من 85 يزيد (+2)
      if (mvp_player_name && mvp_player_name.trim()) {
        await pool.query(
          `UPDATE players
           SET mvp_count = COALESCE(mvp_count, 0) + 1,
               rating = CASE
                 WHEN rating >= 85 THEN LEAST(99, rating + 1)
                 ELSE LEAST(99, rating + 2)
               END
           WHERE user_id = $1 AND name = $2`,
          [userId, cleanPlayerName(mvp_player_name)]
        );
      }

      ratingsApplied = true;
    }

    const result = await pool.query(
      `UPDATE matches 
       SET team_a_score = $1, team_b_score = $2, mvp_player_name = $3, ratings_applied = $4
       WHERE id = $5 
       RETURNING *`,
      [scoreA, scoreB, mvp_player_name || null, ratingsApplied, matchId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - PUT /api/matches/:id/score]:', err.message);
    res.status(500).json({ error: 'فشل تحديث نتيجة المباراة' });
  }
});
// 4. حذف مباراة من الأرشيف
app.delete('/api/matches/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    await pool.query(`DELETE FROM matches WHERE id = $1`, [matchId]);
    res.json({ success: true, deletedId: Number(matchId) });
  } catch (err) {
    console.error('[DB ERROR - DELETE /api/matches/:id]:', err.message);
    res.status(500).json({ error: 'فشل حذف المباراة' });
  }
});
// ==========================================
// 🏆 خوارزميات ومسارات نظام البطولات (Tournaments API)
// ==========================================

// ==========================================
// 🔤 دالة التسمية التسلسلية بالحروف (A, B, C ... Z, AA, AB ...)
// ==========================================
function getAlphabetTeamCode(index) {
  let code = '';
  let n = Number(index) || 0;
  while (n >= 0) {
    code = String.fromCharCode(65 + (n % 26)) + code;
    n = Math.floor(n / 26) - 1;
  }
  return code; // 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB ...
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// تقسيم اللاعبين المشاركين عشوائياً بالتساوي على أي عدد يدوي من الأفرقة مع تسمية A, B..Z, AA
function divideIntoMultipleTournamentTeams(players, teamsCount, startAlphaIndex = 0) {
  const k = Math.max(Number(teamsCount) || 2, 2); // يدعم أي عدد يدوي من الأفرقة بدون سقف!
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

// 1. جلب جميع البطولات المحفوظة
app.get('/api/tournaments', async (req, res) => {
  try {
    const userId = await getDefaultUserId();
    const result = await pool.query(
      `SELECT * FROM tournaments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB ERROR - GET /api/tournaments]:', err.message);
    res.status(500).json({ error: 'فشل جلب البطولات' });
  }
});

// 2. إنشاء بطولة جديدة + حفظ أفرقتها تلقائياً في جدول teams بتسمية A, B, C ... Z, AA
app.post('/api/tournaments/generate', async (req, res) => {
  try {
    const { name, tournamentType, teamsCount, players } = req.body;
    const count = Math.max(Number(teamsCount) || 2, 2);

    if (!Array.isArray(players) || players.length < count) {
      return res.status(400).json({
        error: `الرجاء اختيار ${count} لاعبين على الأقل لتكوين ${count} أفرقة`,
      });
    }

    const userId = await getDefaultUserId();
    const type = ['league', 'knockout', 'groups_knockout'].includes(tournamentType)
      ? tournamentType
      : 'league';

    const tourneyTitle = name && name.trim() ? name.trim() : 'بطولة قِسمه 🏆';

    // تقسيم الأفرقة بتسميات A, B, C ... Z, AA, AB
    const teamsData = divideIntoMultipleTournamentTeams(players, count, 0);
    const fixturesData = buildTournamentFixtures(teamsData, type);

    // حفظ البطولة في جدول tournaments
    const result = await pool.query(
      `INSERT INTO tournaments (user_id, name, tournament_type, teams_count, teams_data, fixtures_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        tourneyTitle,
        type,
        count,
        JSON.stringify(teamsData),
        JSON.stringify(fixturesData),
      ]
    );

    // حفظ جميع الأفرقة التي تم إنشاؤها في البطولة تلقائياً داخل جدول teams!
    for (const t of teamsData) {
      const outfieldCount = Math.max(1, (t.players || []).length - 1);
      const defC = Math.max(1, Math.round(outfieldCount * 0.4));
      const attC = Math.max(1, Math.round(outfieldCount * 0.25));
      const midC = Math.max(1, outfieldCount - defC - attC);

      await pool.query(
        `INSERT INTO teams (user_id, name, kit_color, defenders_count, midfielders_count, attackers_count, players_data, tournament_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          t.name,
          t.color || '#16A34A',
          defC,
          midC,
          attC,
          JSON.stringify(t.players || []),
          tourneyTitle,
        ]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[TOURNAMENT GENERATE ERROR]:', err.message);
    res.status(500).json({ error: 'فشل إنشاء البطولة وتقسيم الفرق' });
  }
});

// 3. تحديث نتائج مباريات البطولة
app.put('/api/tournaments/:id', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const { teams_data, fixtures_data, status } = req.body;

    const result = await pool.query(
      `UPDATE tournaments
       SET teams_data = COALESCE($1, teams_data),
           fixtures_data = COALESCE($2, fixtures_data),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [
        teams_data ? JSON.stringify(teams_data) : null,
        fixtures_data ? JSON.stringify(fixtures_data) : null,
        status || null,
        tournamentId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'البطولة غير موجودة' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - PUT /api/tournaments/:id]:', err.message);
    res.status(500).json({ error: 'فشل تحديث البطولة' });
  }
});

// 4. حذف بطولة
app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    await pool.query(`DELETE FROM tournaments WHERE id = $1`, [tournamentId]);
    res.json({ success: true, deletedId: Number(tournamentId) });
  } catch (err) {
    console.error('[DB ERROR - DELETE /api/tournaments/:id]:', err.message);
    res.status(500).json({ error: 'فشل حذف البطولة' });
  }
});

// ==========================================
// 🔐 مسارات الحسابات والرتب (Auth API)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }

    const cleanUser = username.trim().toLowerCase();
    const targetRole = ['registered', 'subscriber'].includes(role) ? role : 'subscriber';

    const existing = await pool.query(
      `SELECT id, username, role FROM users WHERE LOWER(username) = $1 LIMIT 1`,
      [cleanUser]
    );

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role`,
        [targetRole, existing.rows[0].id]
      );
      return res.json(updated.rows[0]);
    }

    const created = await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [cleanUser, password || '1234', targetRole]
    );

    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[AUTH ERROR]:', err.message);
    res.status(500).json({ error: 'فشل تسجيل الدخول' });
  }
});

// ==========================================
// 🛡️ مسارات جدول الأفرقة (Teams API - مع التسمية التلقائية A..Z, AA)
// ==========================================
app.get('/api/teams', async (req, res) => {
  try {
    const userId = await getDefaultUserId();
    const result = await pool.query(
      `SELECT * FROM teams WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DB ERROR - GET /api/teams]:', err.message);
    res.status(500).json({ error: 'فشل جلب الفرق المحفوظة' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const {
      name,
      kit_color,
      defenders_count,
      midfielders_count,
      attackers_count,
      players_data,
      tournament_name,
    } = req.body;

    const userId = await getDefaultUserId();

    // إذا لم يتم تسمية الفريق، نعطيه الحرف التسلسلي التالي تلقائياً (فريق A, فريق B ... فريق Z, فريق AA)
    let finalTeamName = name && name.trim() ? name.trim() : '';
    if (!finalTeamName) {
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM teams WHERE user_id = $1`,
        [userId]
      );
      const currentCount = parseInt(countRes.rows[0].count, 10) || 0;
      finalTeamName = `فريق ${getAlphabetTeamCode(currentCount)}`;
    }

    const result = await pool.query(
      `INSERT INTO teams (user_id, name, kit_color, defenders_count, midfielders_count, attackers_count, players_data, tournament_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        finalTeamName,
        kit_color || '#16A34A',
        Number(defenders_count) || 2,
        Number(midfielders_count) || 2,
        Number(attackers_count) || 1,
        JSON.stringify(Array.isArray(players_data) ? players_data : []),
        tournament_name || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[DB ERROR - POST /api/teams]:', err.message);
    res.status(500).json({ error: 'فشل حفظ الفريق' });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const teamId = req.params.id;
    const { name, kit_color, defenders_count, midfielders_count, attackers_count, players_data } = req.body;

    const result = await pool.query(
      `UPDATE teams
       SET name = COALESCE($1, name),
           kit_color = COALESCE($2, kit_color),
           defenders_count = COALESCE($3, defenders_count),
           midfielders_count = COALESCE($4, midfielders_count),
           attackers_count = COALESCE($5, attackers_count),
           players_data = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE players_data END
       WHERE id = $7
       RETURNING *`,
      [
        name && name.trim() ? name.trim() : null,
        kit_color || null,
        defenders_count ? Number(defenders_count) : null,
        midfielders_count ? Number(midfielders_count) : null,
        attackers_count ? Number(attackers_count) : null,
        players_data !== undefined ? JSON.stringify(Array.isArray(players_data) ? players_data : []) : null,
        teamId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الفريق غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'فشل تعديل الفريق' });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM teams WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'فشل حذف الفريق' });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[READY] Backend Server running on port ${PORT}`);
  await initDatabase();
});