/**
 * ============================================================================
 * AI Service (Direct Cloud LLM Engine: OpenAI / Groq / DeepSeek + Heuristic Fallback)
 * ============================================================================
 * Direct cloud LLM parsing of unformatted WhatsApp squad lists:
 * - Primary: Direct Cloud LLM (OpenAI GPT-4o-mini, Groq Llama 3.3, DeepSeek) via standard OpenAI-compatible API.
 * - Zero local GPU/RAM requirement.
 * - Fallback: Deterministic local regex/heuristic rule engine ensuring 100% zero downtime.
 */

const axios = require('axios');
const { cleanPlayerName } = require('../utils/helpers');
const { balanceTeamsTactically } = require('./balancing.service');

/**
 * Returns an active GoogleGenAI client instance if GEMINI_API_KEY is provided.
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = require('@google/genai');
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    return null;
  }
}

/**
 * Builds standard structured JSON prompt for LLM extraction.
 */
function buildAIPrompt(text, dbPlayersSummary) {
  return `
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
}

/**
 * Cleans and sanitizes LLM JSON output, handles bench substitution for odd counts,
 * and passes the squads to tactical balancing.
 */
function postProcessAIResult(rawResult, dbPlayersMap, explicitHints, analysisSource) {
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

  const result = balanceTeamsTactically(activeMainPlayers, wasRounded, analysisSource);
  result.allExtractedForDB = allRealPlayers;
  return result;
}

/**
 * Local Meta Llama 3.1 analyzer via Ollama.
 */
async function analyzeWithLlamaAI(text, dbPlayersMap, dbPlayersSummary, explicitHints) {
  const prompt = buildAIPrompt(text, dbPlayersSummary);
  console.log('[Llama AI] Sending prompt to local Llama 3.1 (Ollama)...');

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
    { timeout: 8000 }
  );

  const rawResult = JSON.parse(response.data.response);
  return postProcessAIResult(rawResult, dbPlayersMap, explicitHints, 'llama');
}

/**
 * Cloud Google Gemini analyzer via @google/genai SDK.
 */
async function analyzeWithGeminiAI(text, dbPlayersMap, dbPlayersSummary, explicitHints) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  const prompt = buildAIPrompt(text, dbPlayersSummary);
  console.log('[Gemini Cloud AI] Calling Google Gemini Cloud API directly...');

  let response;
  try {
    response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
  } catch (err) {
    console.warn(`[Gemini 2.5 failed, falling back to gemini-1.5-flash]: ${err.message}`);
    response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
  }

  let textRes = (response && response.text) ? response.text : '';
  textRes = textRes.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const rawResult = JSON.parse(textRes);
  return postProcessAIResult(rawResult, dbPlayersMap, explicitHints, 'gemini');
}

/**
 * Direct Cloud LLM analyzer via standard OpenAI-compatible REST API.
 * Connects directly to OpenAI (GPT-4o / GPT-4o-mini), Groq (Llama 3.3 in cloud), DeepSeek, or OpenRouter.
 */
async function analyzeWithDirectLLM(text, dbPlayersMap, dbPlayersSummary, explicitHints) {
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('No Direct LLM API key provided. Set OPENAI_API_KEY or LLM_API_KEY in .env');
  }

  let baseURL = process.env.LLM_BASE_URL;
  let model = process.env.LLM_MODEL;

  if (!baseURL) {
    if (process.env.GROQ_API_KEY || apiKey.startsWith('gsk_')) {
      baseURL = 'https://api.groq.com/openai/v1';
      model = model || 'llama-3.3-70b-versatile';
    } else if (process.env.DEEPSEEK_API_KEY) {
      baseURL = 'https://api.deepseek.com';
      model = model || 'deepseek-chat';
    } else {
      baseURL = 'https://api.openai.com/v1';
      model = model || 'gpt-4o-mini';
    }
  }

  model = model || 'gpt-4o-mini';
  const cleanBase = baseURL.replace(/\/+$/, '');
  const url = `${cleanBase}/chat/completions`;

  console.log(`[Direct LLM] Calling ${url} with model: ${model}...`);

  const prompt = buildAIPrompt(text, dbPlayersSummary);

  const response = await axios.post(
    url,
    {
      model,
      messages: [
        {
          role: 'system',
          content: 'أنت محلل بيانات رياضي دقيق وصارم جداً. مهمتك تحليل نص الواتساب وإرجاع النتيجة بصيغة JSON فقط حسب القواعد المطلوبة.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from Direct LLM');
  }

  let cleanContent = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const rawResult = JSON.parse(cleanContent);
  return postProcessAIResult(rawResult, dbPlayersMap, explicitHints, 'direct_llm');
}

/**
 * Smart Local Regex / Heuristic Analyzer (Instant, offline rule engine).
 */
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

/**
 * High-level AI router:
 * 1. Primary: Direct Cloud LLM (OpenAI / Groq / DeepSeek / Any direct endpoint).
 * 2. Optional: Gemini API (only if explicit GEMINI_API_KEY is present and no direct LLM).
 * 3. Fallback: Deterministic Local Rule Engine (100% zero downtime even offline).
 */
async function processRosterDivision(rawText, userRole, dbPlayersMap, dbPlayersSummary, explicitHints) {
  // Guest users use the deterministic local rule engine
  if (userRole === 'guest') {
    const result = guestLocalAnalyzer(rawText);
    result.analysisSource = 'local';
    return result;
  }

  // 1. PRIMARY: Direct Cloud LLM (OpenAI, Groq, DeepSeek, or any OpenAI-compatible API)
  const hasDirectKey =
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.DEEPSEEK_API_KEY;

  if (hasDirectKey) {
    try {
      const result = await analyzeWithDirectLLM(rawText, dbPlayersMap, dbPlayersSummary, explicitHints);
      console.log(`[AI SUCCESS] Analyzed via Direct LLM (${result.totalExtracted} players).`);
      return result;
    } catch (llmErr) {
      console.warn(`[Direct LLM Warning]: ${llmErr.message}.`);
    }
  }

  // 2. OPTIONAL: Google Gemini (Only if no direct LLM key is configured)
  if (process.env.GEMINI_API_KEY && !hasDirectKey) {
    try {
      const result = await analyzeWithGeminiAI(rawText, dbPlayersMap, dbPlayersSummary, explicitHints);
      console.log(`[AI SUCCESS] Analyzed via Google Gemini Cloud AI (${result.totalExtracted} players).`);
      return result;
    } catch (geminiErr) {
      console.warn(`[Gemini Cloud AI Warning]: ${geminiErr.message}.`);
    }
  }

  // 3. OPTIONAL LOCAL LLM (Only if explicitly enabled via AI_MODE=local in .env)
  if (process.env.AI_MODE === 'local') {
    try {
      const result = await analyzeWithLlamaAI(rawText, dbPlayersMap, dbPlayersSummary, explicitHints);
      console.log(`[AI SUCCESS] Analyzed via Local Llama 3.1 (${result.totalExtracted} players).`);
      return result;
    } catch (llamaErr) {
      console.warn(`[Local Llama Warning]: ${llamaErr.message}.`);
    }
  }

  // 4. RESILIENT FALLBACK: Deterministic Local Rule Engine
  console.log('[AI FALLBACK] Routing to deterministic Local Rule Engine (Zero Downtime)...');
  const result = guestLocalAnalyzer(rawText);
  result.analysisSource = 'local';
  return result;
}

module.exports = {
  buildAIPrompt,
  postProcessAIResult,
  analyzeWithDirectLLM,
  analyzeWithGeminiAI,
  analyzeWithLlamaAI,
  guestLocalAnalyzer,
  processRosterDivision,
};
