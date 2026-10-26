require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.send('✅ Qisma App Backend is running successfully!');
});

// دالة صارمة لتنظيف الاسم وإزالة الكلمات الوصفية نهائياً
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

function smartLocalFallback(text) {
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
      line.includes('احتياط') ||
      line.includes('انتظار') ||
      line.includes('اضافية') ||
      line.includes('إضافية') ||
      line.includes('سبير') ||
      line.includes('مقاعد')
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
      if (rawName.includes('🧤') || /\b(حارس|GK)\b/i.test(rawName)) {
        isGoalkeeper = true;
      }

      let rating = isGoalkeeper ? 80 : 75;
      if (/ممتاز|اسطورة|أسطورة|متفوق|فنان|حريقة|محترف/.test(rawName)) rating = 90;
      else if (/كويس|جيد|مجتهد|مرتب/.test(rawName)) rating = 80;
      else if (/متوسط|يمشي|عادي/.test(rawName)) rating = 70;
      else if (/فاشل|تكملة|ضعيف|تعبان/.test(rawName)) rating = 55;

      const ratingMatch = rawName.match(/[\(\[\s](\d{1,2})[\)\]\s]?/);
      if (ratingMatch) rating = parseInt(ratingMatch[1], 10);

      let pos = isGoalkeeper ? 'حارس' : 'وسط';
      if (!isGoalkeeper) {
        if (rawName.includes('دفاع') || rawName.includes('مدافع')) pos = 'دفاع';
        else if (rawName.includes('هجوم') || rawName.includes('مهاجم')) pos = 'هجوم';
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

  let goalkeepers = activeMainPlayers.filter((p) => p.isGoalkeeper);
  let outfieldPlayers = activeMainPlayers.filter((p) => !p.isGoalkeeper);

  const teamA = [];
  const teamB = [];

  goalkeepers.sort((a, b) => b.rating - a.rating);
  goalkeepers.forEach((gk, index) => {
    if (index % 2 === 0) teamA.push(gk);
    else teamB.push(gk);
  });

  outfieldPlayers.sort((a, b) => b.rating - a.rating);
  const targetSize = activeMainPlayers.length / 2;

  outfieldPlayers.forEach((player) => {
    let sumA = teamA.reduce((s, p) => s + p.rating, 0);
    let sumB = teamB.reduce((s, p) => s + p.rating, 0);

    if (teamA.length < targetSize && teamB.length < targetSize) {
      if (sumA <= sumB) teamA.push(player);
      else teamB.push(player);
    } else if (teamA.length < targetSize) {
      teamA.push(player);
    } else {
      teamB.push(player);
    }
  });

  return {
    totalExtracted: teamA.length + teamB.length,
    wasRounded,
    goalkeepersCount: goalkeepers.length,
    teamA,
    teamB,
    teamARatingTotal: teamA.reduce((s, p) => s + p.rating, 0),
    teamBRatingTotal: teamB.reduce((s, p) => s + p.rating, 0),
    analysisSource: 'local',
  };
}

app.post('/api/divide-teams', async (req, res) => {
  console.log('[INFO] Received team division request.');
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'النص فارغ' });
    }

   const prompt = `
أنت مدرب ومحلل ذكي ومحترف لفرق كرة القدم. مهمتك قراءة رسالة الواتساب التالية كما هي، فهم أقسامها بذكاء، ثم توزيع اللاعبين إلى فريقين متوازنين تماماً (teamA و teamB).

القواعد الذهبية لفهم الرسالة وتوزيع الفرق:
1. فهم أقسام الرسالة بالترتيب:
   - اقرأ الرسالة من الأعلى للأسفل.
   - إذا ظهر عنوان يدل على الحراس (مثل: "🧤حارس🧤" أو "الحراس")، فإن اللاعبين الذين يأتون تحته مباشرة (حتى لو كان مكتوباً بجانب اسمهم رقم تقييم فقط مثل "(88)" أو وصف بدون تكرار كلمة حارس أو GK) هم **حراس مرمى أساسيون** (isGoalkeeper: true و position: "حارس")، وذلك حتى يبدأ قسم جديد (مثل: "مقاعد إضافية" أو "احتياط" أو "انتظار").
   - كذلك أي لاعب في أي مكان بجانبه "🧤" أو "GK" أو "حارس" هو حارس مرمى.
2. قائمة الاحتياط / الانتظار / المقاعد الإضافية:
   - أي أسماء تأتي تحت عنوان يدل على الاحتياط أو الانتظار أو المقاعد الإضافية: **لا تقم بإضافتهم أبداً** للتشكيلة الأساسية إلا في حالتين:
     أ) إذا كان مجموع اللاعبين الأساسيين (شاملاً الحراس) عدداً فردياً يحتاج لتكملة زوجية.
     ب) إذا كان هناك أرقام فارغة بدون اسم في اللستة الأساسية تحتاج لمن يملؤها (اسحب من الاحتياط بالترتيب بقدر النقص فقط).
   - إذا كان عدد اللاعبين الأساسيين زوجياً وكاملاً، تجاهل أسماء الاحتياط تماماً ولا تدخلهم في teamA أو teamB.
3. التقييم (rating) وحفظ تقييم الحارس واللاعبين:
   - لكل لاعب (سواء كان حارساً أو لاعب ميدان) تقييم من 50 إلى 99.
   - إذا كان بجانب اسم اللاعب أو الحارس رقم صريح (مثل 92 أو 88 أو 60)، التزم بنفس الرقم تماماً ولا تغيره!
   - إذا كان بجانب الاسم أي كلمة أو عبارة تصف مستواه (مثل: ممتاز، متفوق، مجتهد، كويس، متوسط، يمشي الليلة، تكملة عدد، فاشل، أو أي تعبير آخر)، افهم معنى الوصف وقدّر له تقييماً منطقياً يناسب معناه من 50 إلى 99.
   - إذا لم يُذكر بجانب اللاعب أو الحارس لا رقم ولا وصف، أعطه تقييماً افتراضياً متوازناً (حوالي 75 للاعب و 80 للحارس).
4. المراكز (position) والتوزيع العادل:
   - المراكز المسموحة حصراً هي: ("حارس", "دفاع", "وسط", "هجوم").
   - للحراس ضع دائماً position: "حارس" و isGoalkeeper: true.
   - لباقي اللاعبين التزم بمركزهم المذكور، ومن لم يُذكر له مركز وزّعه بذكاء بين ("دفاع", "وسط", "هجوم") لتكوين تشكيلة متوازنة في الملعب.
   - ضع حارساً في teamA وحارساً في teamB، ووزّع باقي اللاعبين بحيث يتساوى عدد اللاعبين في الفريقين ويتقارب مجموع القوة الكلي (teamARatingTotal و teamBRatingTotal) شاملاً تقييم الحراس بأقصى درجة ممكنة.

مهم جداً: ابدأ أولاً بملء مصفوفة extractedMainPlayers باللاعبين الأساسيين الذين استخرجتهم بالترتيب لتتأكد من عدم نسيان أي حارس أو تقييم، ثم كوّن teamA و teamB في JSON بهذا الهيكل الدقيق:
{
  "extractedMainPlayers": [
    { "name": "الاسم النظيف", "isGoalkeeper": false, "rating": 85, "position": "وسط" }
  ],
  "totalExtracted": 10,
  "wasRounded": false,
  "goalkeepersCount": 2,
  "teamA": [
    { "name": "الاسم النظيف", "isGoalkeeper": true, "rating": 88, "position": "حارس" }
  ],
  "teamB": [
    { "name": "الاسم النظيف", "isGoalkeeper": true, "rating": 80, "position": "حارس" }
  ],
  "teamARatingTotal": 400,
  "teamBRatingTotal": 398
}

النص المراد تحليله كما هو:
"""
${rawText}
"""
`;

    let resultData;
    try {
      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 8000)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      resultData = JSON.parse(response.text);
      resultData.analysisSource = 'ai';

      if (resultData.teamA) resultData.teamA.forEach(p => p.name = cleanPlayerName(p.name));
      if (resultData.teamB) resultData.teamB.forEach(p => p.name = cleanPlayerName(p.name));
    } catch (aiError) {
      resultData = smartLocalFallback(rawText);
    }

    res.json(resultData);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[READY] Server running on port ${PORT}`);
});