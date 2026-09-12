// Rule-based categorization of a review into a product-funnel stage, using
// simple phrase matching (no ML, no external calls — consistent with the
// rest of the offline analysis pipeline). Each review is assigned exactly
// one category: whichever stage's phrase list has the most distinct hits,
// tie-broken by TIE_BREAK_PRIORITY; "other" if nothing matches.
//
// "trading" and "investment" are deliberately kept as separate categories,
// never merged: trading is short-horizon order execution (buy/sell, F&O,
// intraday, margin, brokerage/charges, market data); investment is
// long-horizon wealth building (mutual funds, SIPs, IPOs, bonds, goal
// planning). A review can only land in one, never both.

// Fixed display/color order — never re-sorted by volume, so a category's
// identity (and chart color) stays stable across filters and time ranges.
const CATEGORY_ORDER = ['trading', 'investment', 'ekyc', 'activation', 'acquisition', 'support', 'other'];

const CATEGORY_LABELS = {
  trading: 'Trading',
  investment: 'Investment',
  ekyc: 'eKYC',
  activation: 'Activation',
  acquisition: 'Acquisition',
  support: 'Support',
  other: 'Other',
};

// Priority used only to break ties when two categories match the same
// number of distinct phrases in a review. Investment is checked ahead of
// trading so an explicit "mutual fund" / "SIP" mention doesn't fall back
// into trading just because generic words like "order" or "portfolio" also
// matched.
const TIE_BREAK_PRIORITY = ['ekyc', 'investment', 'trading', 'support', 'activation', 'acquisition'];

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
  ekyc: [
    'kyc', 'e-kyc', 'ekyc', 'pan card', 'pan number', 'aadhaar', 'aadhar',
    'verification', 'verify', 'document', 'digilocker', 'esign', 'e-sign',
    'video kyc', 'demat', 'bank account link', 'nominee', 'signature',
    'income proof', 'cvl', 'kra', 'kyc pending', 'kyc rejected',
  ],
  activation: [
    'login', 'log in', 'sign up', 'signup', 'register', 'registration',
    'otp', 'password', 'create account', 'new account', 'first time',
    'onboarding', 'set up', 'setup', 'welcome', 'getting started',
    'activate', 'activation', 'account opening', 'open account',
  ],
  acquisition: [
    'download', 'install', 'installation', 'referral', 'refer a friend',
    'refer and earn', 'invite', 'promo code', 'playstore', 'play store',
    'app store', 'advertisement', 'reward', 'bonus', 'recommended by',
    'found this app', 'why i chose', 'switching from',
  ],
  support: [
    'customer care', 'customer service', 'customer support', 'helpline',
    'complaint', 'response', 'reply', 'refund', 'call center', 'call centre',
    'ticket', 'chat support', 'resolve', 'resolved', 'no response',
    'contact', 'support team', 'raised a', 'escalate',
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
