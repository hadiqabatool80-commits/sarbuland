import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Successfully initialized Gemini Client');
  } catch (err) {
    console.error('Error initializing Gemini Client:', err);
  }
} else {
  console.log('Skipping Gemini initialization: GEMINI_API_KEY is not defined yet. Using high-fidelity fallback engines.');
}

// REST API endpoint: AI Advisor (SARA AI Chat)
app.post('/api/sara-chat', async (req, res) => {
  const { messages, userRole, voiceEnabled } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid message request format.' });
  }

  const latestMessageObj = messages[messages.length - 1];
  const userMessage = latestMessageObj.text || latestMessageObj.content || '';

  // Standard Persona Rules
  const systemInstruction = `
    You are SARA AI, a highly sophisticated, charismatic financial hologram assistant acting as a helpful "Jarvis" for Pakistan's investing ecosystem (SARBULAND fintech).
    Your voice setting is: ${voiceEnabled ? 'ACTIVE (sound enthusiastic and conversational)' : 'TEXT (clear, beautifully structured, insightful)'}.
    The current user persona is: ${userRole || 'Beginner'}.
    
    Guidelines:
    1. Communicate gracefully in a professional bilingual mix of elegant English and friendly Urdu (Roman Urdu is fine or standard Urdu words). Encourage the user like a coach.
    2. Answer questions about KSE/PSX stocks, compound interest, shariah compliant rules, mutual funds, personal tax slabs in Pakistan, savings.
    3. Be incredibly supportive, objective, and realistic. Keep the focus entirely on financial security, growth, and proper wealth management.
    4. If explaining complex terms (e.g. PE ratio, CAGR%), break them down with simple, relatable Pakistan-based parables (e.g., comparing it to a local shop, bazaar or property rental).
    5. Be crisp, exciting, and always end with an encouraging prompt or helpful guidance.
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ response: response.text });
    } catch (err: any) {
      console.error('Gemini Chat API Error:', err);
      // Fallback in case of actual API failure
    }
  }

  // Generative Fallback engine for local development sandbox
  const lowercaseInput = userMessage.toLowerCase();
  let fallbackReply = `Assalam-o-Alaikum! SARA AI here at your service. [Fallback Sandbox Mode Active] `;
  
  if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi') || lowercaseInput.includes('salaam') || lowercaseInput.includes('helo')) {
    fallbackReply += `It is wonderful to connect with you! As a ${userRole}, you are embarking on Pakistan's premier journey to investment confidence. Would you like to explore today's PSX market dynamics, take a quick Wealth DNA risk assessment, or clear up some concepts about Shariah compliant bonds?`;
  } else if (lowercaseInput.includes('shariah') || lowercaseInput.includes('halal') || lowercaseInput.includes('islamic')) {
    fallbackReply += `Islamic investing on SARBULAND is guided strictly by Shariah parameters. For instance, Meezan Bank (MEBL) applies filters where non-compliant elements are strictly purified. Your dividend payout is scrutinized to remove interest components, and any remaining 'purification amount' can be donated. This keeps your wealth 100% Halal and clean!`;
  } else if (lowercaseInput.includes('stock') || lowercaseInput.includes('share') || lowercaseInput.includes('psx')) {
    fallbackReply += `The Pakistan Stock Exchange (PSX) has shown incredible resilience in Karachi. Key Blue Chips like Systems Limited (SYS) and Meezan Bank (MEBL) demonstrate robust Return on Equity (ROE) values exceeding 30%. I recommend looking at dividend growers. Would you like to analyze a specific stock's Bull/Bear scenarios next?`;
  } else if (lowercaseInput.includes('student') || lowercaseInput.includes('scholarship')) {
    fallbackReply += `Superb choice! For students at partner universities like LUMS, IBA, and FAST, we offer a dedicated Scholarship Eligibility Engine, micro investing caps under Rs. 100, and fully accredited certificates in Financial Literacy. Level up your XP system in the Grow tab to trigger real reward multipliers!`;
  } else if (lowercaseInput.includes('tax') || lowercaseInput.includes('fbr')) {
    fallbackReply += `Under Pakistani tax frameworks, withholding tax on stock dividends is currently 15% for active Tax Filers and 30% for Non-filers. This is why becoming an active filer is your first major step towards financial optimization! SARA AI can guide you through the FBR process.`;
  } else {
    fallbackReply += `That is a fundamental question! In Pakistan's wealth growth landscape, the secret to beats inflation (Mehangai) and securing compound growth is disciplined monthly investing, keeping transaction costs low, and allocating assets based on your specific age bracket. Tell me supportively what specific target goals you want me to outline!`;
  }

  return res.json({ response: fallbackReply });
});

// REST API endpoint: AI Risk DNA Profile Assessment
app.post('/api/ai-risk-profile', async (req, res) => {
  const { age, income, savings, goals, riskAppetite, experience, timeHorizon } = req.body;

  const prompt = `
    Conduct an advanced AI investment risk appraisal and create a recommended asset allocation matrix (in percent) for:
    - Age: ${age}
    - Monthly Income Range: Rs. ${income}
    - Current Savings %: ${savings}%
    - Financial Goal: '${goals}'
    - Risk Appetite: '${riskAppetite}'
    - Experience in Markets: '${experience}'
    - Target Time Horizon: ${timeHorizon} years
    
    You must return a strictly valid JSON response conforming to this exact structure (no markdown tags, no extra comments, just the raw json):
    {
      "recommendedAllocation": {
        "stocks": 50,
        "bonds": 20,
        "gold": 15,
        "cash": 10,
        "reit": 5
      },
      "portfolioType": "Balanced Aggressive Portfolio / Shariah Student / Retirement Guarded",
      "description": "Short personalized diagnostic paragraph explaining the risk match and rationale.",
      "cagrExpectation": "12% - 15% CAGR based on historic indices",
      "guideline": "One clear action tip for execution."
    }
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    } catch (err) {
      console.error('Gemini Risk DNA API Error:', err);
    }
  }

  // Fallback engine if Gemini is not running
  let defaultType = 'Standard Balanced Portfolio';
  let defaultAllocation = { stocks: 40, bonds: 30, gold: 15, cash: 10, reit: 5 };
  let desc = 'You have a sensible approach matching a strategic wealth outline. We balance inflation-hedged equities alongside secure fixed yields.';
  let cagr = '14% - 16% historical Pakistan average';
  let guideline = 'Set up an automated monthly standing order (Raast) straight towards high-yield Islamic portfolios.';

  if (riskAppetite === 'conservative') {
    defaultType = 'Guarded Shariah Capital Protection';
    defaultAllocation = { stocks: 15, bonds: 55, gold: 10, cash: 15, reit: 5 };
    desc = 'Focus is heavily centered on capital preservation, shielding your cash from volatility while matching Islamic Sukuks with low market correlation.';
  } else if (riskAppetite === 'aggressive') {
    defaultType = 'Aggressive Growth Portfolio (Blue-Chip Compounder)';
    defaultAllocation = { stocks: 75, bonds: 10, gold: 5, cash: 5, reit: 5 };
    desc = 'High-growth equities centered in technology and exports (like Systems Limited) coupled with high dividend yielders to compound equity power rapidly over time.';
    cagr = '18% - 22% expected high-risk compounder targets';
  } else if (goals.toLowerCase().includes('student') || age < 23) {
    defaultType = 'Student Micro-Compounder Portfolio';
    defaultAllocation = { stocks: 50, bonds: 15, gold: 20, cash: 10, reit: 5 };
    desc = 'Optimized for small regular contributions. Uses Shariah compliant growth funds to leverage time as your greatest multi-year compounding ally.';
  }

  return res.json({
    recommendedAllocation: defaultAllocation,
    portfolioType: defaultType,
    description: desc,
    cagrExpectation: cagr,
    guideline,
  });
});

// REST API endpoint: AI Stock Scenario Analysis
app.post('/api/ai-stock-analysis', async (req, res) => {
  const { symbol, name, price, sector } = req.body;

  const prompt = `
    Analyze ticker '${symbol}' (${name || 'Unknown'}), currently trading at Rs. ${price} in the ${sector || 'finance'} sector.
    Provide a professional Bull Case, Base Case, and Bear Case scenario analysis with CAGR projections.
    Include 10 years of forecast estimates starting from current pricing.
    
    You must return a strictly valid JSON response conforming to this exact structure:
    {
      "bullCase": "Exciting growth perspective details.",
      "baseCase": "The normal operating progress path.",
      "bearCase": "Downside sector risks or currency pressure impact.",
      "expectedCagr": 15.5,
      "volatility": "Moderate to High",
      "riskScore": 35,
      "probabilityOfBull": 65,
      "projectionYears": [
        { "year": 1, "conservativeValue": 100, "baseValue": 110, "aggressiveValue": 120 },
        { "year": 3, "conservativeValue": 120, "baseValue": 140, "aggressiveValue": 180 },
        { "year": 5, "conservativeValue": 150, "baseValue": 190, "aggressiveValue": 250 },
        { "year": 10, "conservativeValue": 200, "baseValue": 320, "aggressiveValue": 500 }
      ]
    }
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    } catch (err) {
      console.error('Gemini Stock Analysis API Error:', err);
    }
  }

  // Fallback response for offline sandbox testing
  const startVal = parseFloat(price) || 200;
  return res.json({
    bullCase: `Strong local market expansion, rising export services billing, and high margin optimizations from tech integrations support a major upward momentum for ${symbol}.`,
    baseCase: `Moderate 15% revenue expansion while meeting high dividend distributions aligned with past structural averages in Pakistan.`,
    bearCase: `Inflation shock waves or rising regulatory withholding tax constraints compression in the short term.`,
    expectedCagr: 16.8,
    volatility: symbol === 'SYS' ? 'High' : 'Low to Moderate',
    riskScore: symbol === 'SYS' ? 55 : 30,
    probabilityOfBull: 60,
    projectionYears: [
      { year: 1, conservativeValue: Math.round(startVal * 0.95), baseValue: Math.round(startVal * 1.15), aggressiveValue: Math.round(startVal * 1.30) },
      { year: 3, conservativeValue: Math.round(startVal * 1.10), baseValue: Math.round(startVal * 1.50), aggressiveValue: Math.round(startVal * 1.85) },
      { year: 5, conservativeValue: Math.round(startVal * 1.35), baseValue: Math.round(startVal * 2.05), aggressiveValue: Math.round(startVal * 2.90) },
      { year: 10, conservativeValue: Math.round(startVal * 1.95), baseValue: Math.round(startVal * 4.35), aggressiveValue: Math.round(startVal * 7.50) },
    ],
  });
});

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Started Vite middleware inside Express');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SARBULAND Server launched successfully on http://localhost:${PORT}`);
  });
}

startServer();
