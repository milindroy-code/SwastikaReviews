// Rule-based classification of a review into exactly one of: trading,
// investment, or other. Kept deliberately narrow — this used to be a
// 7-way product-funnel taxonomy (trading/investment/eKYC/activation/
// acquisition/support/other), but everywhere that taxonomy was displayed
// has moved to the core-idea "themes" system (src/themes.js) instead.
// Trading vs. investment stays as its own special case (not a theme)
// because it was explicitly asked to never be blended into one number:
// trading is short-horizon order execution (buy/sell, F&O, intraday,
// margin, brokerage/charges, market data); investment is long-horizon
// wealth building (mutual funds, SIPs, IPOs, bonds, goal planning).

const CATEGORY_ORDER = ['trading', 'investment', 'other'];

const CATEGORY_LABELS = {
  trading: 'Trading',
  investment: 'Investment',
  other: 'Other',
};

// Investment is checked ahead of trading on a tie so an explicit "mutual
// fund" / "SIP" mention doesn't fall back into trading just because a
// generic word like "order" or "portfolio" also matched.
const TIE_BREAK_PRIORITY = ['investment', 'trading'];

const PHRASES = {
  trading: [
    'order', 'buy', 'sell', 'brokerage', 'charge', 'charges', 'margin',
    'watchlist', 'candle', 'chart', 'market order', 'limit order', 'trade',
    'trading', 'execution', 'slippage', 'price', 'quote', 'f&o', 'futures',
    'options', 'intraday', 'delivery', 'stop loss', 'gtt', 'square off',
    'position', 'market depth', 'order book', 'buy sell', 'sold', 'purchase',
    'scalping', 'day trading', 'live price', 'real time price',
  ],
  investment: [
    'mutual fund', 'mutual funds', 'sip', 'ipo', 'invest', 'investment',
    'investing', 'investor', 'wealth', 'long term', 'long-term',
    'financial goal', 'goal based', 'goal-based', 'retirement', 'elss',
    'nps', 'fixed deposit', 'fd ', 'bond', 'bonds', 'gold bond',
    'index fund', 'index funds', 'diversify', 'diversification',
    'compounding', 'lumpsum', 'lump sum', 'asset allocation',
    'financial planning', 'save for', 'savings plan',
  ],
};

function categorize(text) {
  const t = (text || '').toLowerCase();
  if (!t.trim()) return 'other';

  let best = null;
  let bestScore = 0;
  const scores = {};

  for (const cat of Object.keys(PHRASES)) {
    let score = 0;
    for (const phrase of PHRASES[cat]) {
      if (t.includes(phrase)) score++;
    }
    scores[cat] = score;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }

  if (bestScore === 0) return 'other';

  // Tie-break: any other category matching the same top score, prefer by priority order.
  const tied = Object.keys(scores).filter((c) => scores[c] === bestScore);
  if (tied.length > 1) {
    for (const p of TIE_BREAK_PRIORITY) {
      if (tied.includes(p)) return p;
    }
  }
  return best;
}

module.exports = { categorize, CATEGORY_ORDER, CATEGORY_LABELS };
