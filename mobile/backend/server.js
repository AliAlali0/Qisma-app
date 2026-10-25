require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.send('✅ سيرفر تطبيق قسمه (المرحلة الثانية - التقييمات المتوازنة) يعمل بنجاح!');
});

// دالة خلط عشوائي لكسر الثبات
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// محلل ذكي احتياطي يستخرج الأسماء والتقييمات محلياً لو توقف السيرفر
function smartLocalAnalyzer(text) {
  const lines = text.split('\n');
  const players = [];
  let inGoalkeeperSection = false;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    const isNumbered = /^\s*[0-9٠-٩]+\s*[\/\-.\)]\s*/.test(line);
    if (!isNumbered && (line.includes('حارس') || line.includes('حراس') || line.includes('🧤'))) {
      inGoalkeeperSection = true;
      continue;
    }

    const match = line.match(/^\s*[0-9٠-٩]+\s*[\/\-.\)]\s*(.*)$/);
    if (match) {
      let rawName = match[1].trim();
      if (!rawName) continue;

      let isGk = inGoalkeeperSection;
      if (rawName.includes('🧤') || rawName.includes('حارس') || /\bGK\b/i.test(rawName)) {
        isGk = true;
      }

      // استخراج التقييم لو وجد رقم بين قوسين أو بجانب الاسم (مثل 85)
      let rating = isGk ? 82 : 75; // افتراضي
      const ratingMatch = rawName.match(/[\(\[\s](\d{1,2})[\)\]\s]?$/);
      if (ratingMatch) {
        rating = parseInt(ratingMatch[1], 10);
        rawName = rawName.replace(/[\(\[\s]\d{1,2}[\)\]\s]?$/, '').trim();
      }

      let cleanName = rawName.replace(/🧤/g, '').trim();
      if (!cleanName) cleanName = isGk ? 'حارس مرمى' : 'لاعب';

      players.push({
        name: cleanName,
        isGoalkeeper: isGk,
        rating: Math.min(Math.max(rating, 40), 99), // بين 40 و 99
        position: isGk ? 'حارس' : 'وسط',
      });
    }
  }
  return { players };
}

app.post('/api/divide-teams', async (req, res) => {
  console.log('📩 وصل طلب جديد لتحليل اللستة مع التقييمات والمراكز!');
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'النص فارغ' });
    }

    const prompt = `
أنت محلل ذكي ومحترف لفرق كرة القدم. مهمتك قراءة النص التالي واستخراج قائمة اللاعبين المسجلين، مع تحديد لكل لاعب:
1. الاسم (name): بدون أرقام قائمة وبدون إيموجي.
2. هل هو حارس مرمى؟ (isGoalkeeper: true/false) (اكتشفه من قسم الحراس أو وجود 🧤 أو كلمة حارس).
3. التقييم (rating): رقم من 50 إلى 99 يمثل مهارة اللاعب. إذا كتب المستخدم تقييماً بجانب الاسم (مثل 90 أو 85)، التزم به. وإذا لم يكتب، خمن تقييماً منطقياً بناءً على مكانة اللاعب أو اسم الشهرة (الأساسيون أو المحترفون عادة 80-90، البقية 70-75، الحارس الممتاز 80-85).
4. المركز المفضل (position): "دفاع" أو "وسط" أو "هجوم" أو "حارس" بناءً على ما يذكره النص أو طبيعة اللاعب.

أرجع النتيجة بصيغة JSON حصراً بهذا الهيكل:
{
  "players": [
    { "name": "اسم اللاعب", "isGoalkeeper": false, "rating": 82, "position": "وسط" }
  ]
}

النص:
${rawText}
`;

    let parsedData;
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
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 7000)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      parsedData = JSON.parse(response.text);
    } catch (aiError) {
      console.log('⚡ تم التحويل للمحلل المحلي نظراً لضغط السيرفر.');
      parsedData = smartLocalAnalyzer(rawText);
    }

    let players = parsedData.players || [];
    if (players.length < 2) {
      return res.status(400).json({ error: 'لم يتم العثور على عدد كافٍ من اللاعبين.' });
    }

    const totalExtracted = players.length;
    let wasRounded = false;

    // فصل الحراس عن اللاعبين
    let goalkeepers = shuffle(players.filter((p) => p.isGoalkeeper));
    let outfieldPlayers = shuffle(players.filter((p) => !p.isGoalkeeper));

    // إذا كان المجموع فردياً، نضيف لاعباً شاغراً بتقييم متوسط (65)
    if ((goalkeepers.length + outfieldPlayers.length) % 2 !== 0) {
      outfieldPlayers.push({ name: 'لاعب إضافي (شاغر)', isGoalkeeper: false, rating: 65, position: 'احتياط' });
      wasRounded = true;
    }

    const teamA = [];
    const teamB = [];

    // 1. توزيع الحراس بالتساوي بحيث يتواجهون
    goalkeepers.forEach((gk, index) => {
      if (index % 2 === 0) {
        teamA.push(gk);
      } else {
        teamB.push(gk);
      }
    });

    // 2. توزيع اللاعبين العاديين بنظام "السنيك (Snake Draft)" لتوازن المجموع الكلي للقوة
    // ترتيب اللاعبين تنازلياً حسب القوة (الريت) لتوزيع الأقوياء بالعدل بين الفريقين
    outfieldPlayers.sort((a, b) => b.rating - a.rating);

    let teamASumRating = teamA.reduce((acc, p) => acc + p.rating, 0);
    let teamBSumRating = teamB.reduce((acc, p) => acc + p.rating, 0);

    outfieldPlayers.forEach((player) => {
      // ضع اللاعب في الفريق الذي مجموعه أقل حالياً لتحقيق التوازن الذكي
      if (teamASumRating <= teamBSumRating) {
        teamA.push(player);
        teamASumRating += player.rating;
      } else {
        teamB.push(player);
        teamBSumRating += player.rating;
      }
    });

    const teamARatingTotal = teamA.reduce((sum, p) => sum + p.rating, 0);
    const teamBRatingTotal = teamB.reduce((sum, p) => sum + p.rating, 0);

    res.json({
      totalExtracted,
      wasRounded,
      goalkeepersCount: goalkeepers.length,
      teamA,
      teamB,
      teamARatingTotal,
      teamBRatingTotal,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});