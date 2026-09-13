// Core ideas users actually talk about — independent of the funnel-stage
// categories in categorize.js (Trading/Investment/eKYC/...). Used for the
// "Top themes" / liked-improve summaries and theme-trend-over-time.
//
// IMPORTANT: dashboard.html carries its own client-side mirror of this list
// (it can't import a Node module into an inline <script>). Keep both in
// sync by hand when editing either one.

const SUMMARY_THEMES = [
  { label: 'Customer support', words: ['support', 'service', 'team', 'customer', 'help', 'response', 'query', 'staff'] },
  { label: 'Brokerage & charges', words: ['brokerage', 'charges', 'charge', 'fee', 'fees', 'cost', 'expensive', 'cheap'] },
  { label: 'Account opening & KYC', words: ['account', 'kyc', 'open', 'verification', 'verify', 'document', 'demat', 'pan', 'aadhaar', 'nominee'] },
  { label: 'Login & access', words: ['login', 'otp', 'password', 'access', 'signin', 'sign'] },
  { label: 'Trading execution', words: ['trade', 'trading', 'order', 'execution', 'buy', 'sell', 'price', 'slippage', 'market'] },
  { label: 'App reliability & performance', words: ['crash', 'slow', 'lag', 'bug', 'freeze', 'hang', 'error', 'loading', 'update', 'version', 'glitch', 'issue'] },
  { label: 'Ease of use', words: ['easy', 'interface', 'ui', 'design', 'simple', 'navigation', 'smooth', 'convenient'] },
  { label: 'Investment options', words: ['mutual', 'fund', 'sip', 'ipo', 'invest', 'investment', 'portfolio', 'wealth'] },
  { label: 'Referrals & onboarding', words: ['download', 'install', 'refer', 'referral', 'promo', 'bonus', 'signup'] },
  { label: 'Loss / money concerns', words: ['loss', 'money', 'fraud', 'scam', 'refund', 'withdraw', 'withdrawal'] },
];

const GENERIC_SUMMARY_WORDS = new Set([
  'good', 'app', 'application', 'apps', 'best', 'nice', 'great', 'excellent',
  'awesome', 'amazing', 'super', 'worst', 'bad', 'poor', 'okay', 'fine',
  'love', 'like', 'one', 'also', 'please', 'work', 'works', 'working',
  'really', 'much', 'lot', 'time', 'every', 'everything', 'very good',
  'nice app', 'good app', 'best app', 'hai', 'yeh', 'sir', 'thank',
  'thanks', 'thank you',
]);

/** All themes a review's tokenized text matches (a review can match
 * several — unlike the single-category classification in categorize.js). */
function themesForTokens(tokens) {
  const tokenSet = new Set(tokens);
  const matched = [];
  for (const theme of SUMMARY_THEMES) {
    if (theme.words.some((w) => tokenSet.has(w))) matched.push(theme.label);
  }
  return matched;
}

module.exports = { SUMMARY_THEMES, GENERIC_SUMMARY_WORDS, themesForTokens };
