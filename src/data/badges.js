// Badge definitions with categories, tiers, and threshold logic.
// Each badge has an id, category, tier, emoji, threshold description, and check function.
// Check functions receive a stats object: { speedQuizCount, wienQuestionsCorrect,
//   bestStreak, uniqueGamesPlayed, totalRoundsPlayed, threeStarCount }

export const BADGE_CATEGORIES = [
  { id: 'speed',       name: 'Speed-K\u00F6nig',     emoji: '\u26A1' },
  { id: 'wien',        name: 'Wien-Experte',          emoji: '\uD83C\uDFDB\uFE0F' },
  { id: 'streak',      name: 'Streak-Meister',        emoji: '\uD83D\uDD25' },
  { id: 'collector',   name: 'Spielesammler',         emoji: '\uD83C\uDFAE' },
  { id: 'diligent',    name: 'Flei\u00DFig',          emoji: '\uD83D\uDCDA' },
  { id: 'perfectionist', name: 'Perfektionist',       emoji: '\u2B50' },
];

export const BADGES = [
  // Speed-Koenig
  { id: 'speed_bronze',  category: 'speed',  tier: 'bronze', label: '5 Speed-Quizze',   check: s => s.speedQuizCount >= 5 },
  { id: 'speed_silver',  category: 'speed',  tier: 'silver', label: '20 Speed-Quizze',  check: s => s.speedQuizCount >= 20 },
  { id: 'speed_gold',    category: 'speed',  tier: 'gold',   label: '50 Speed-Quizze',  check: s => s.speedQuizCount >= 50 },

  // Wien-Experte
  { id: 'wien_bronze',   category: 'wien',   tier: 'bronze', label: '5 Wien-Fragen richtig',   check: s => s.wienQuestionsCorrect >= 5 },
  { id: 'wien_silver',   category: 'wien',   tier: 'silver', label: '25 Wien-Fragen richtig',  check: s => s.wienQuestionsCorrect >= 25 },
  { id: 'wien_gold',     category: 'wien',   tier: 'gold',   label: '100 Wien-Fragen richtig', check: s => s.wienQuestionsCorrect >= 100 },

  // Streak-Meister
  { id: 'streak_bronze', category: 'streak', tier: 'bronze', label: '5er Streak',  check: s => s.bestStreak >= 5 },
  { id: 'streak_silver', category: 'streak', tier: 'silver', label: '10er Streak', check: s => s.bestStreak >= 10 },
  { id: 'streak_gold',   category: 'streak', tier: 'gold',   label: '20er Streak', check: s => s.bestStreak >= 20 },

  // Spielesammler
  { id: 'collector_bronze', category: 'collector', tier: 'bronze', label: '5 Spiele probiert',     check: s => s.uniqueGamesPlayed >= 5 },
  { id: 'collector_silver', category: 'collector', tier: 'silver', label: '15 Spiele probiert',    check: s => s.uniqueGamesPlayed >= 15 },
  { id: 'collector_gold',   category: 'collector', tier: 'gold',   label: 'Alle 22 Spiele',       check: s => s.uniqueGamesPlayed >= 22 },

  // Fleissig
  { id: 'diligent_bronze', category: 'diligent', tier: 'bronze', label: '20 Runden gespielt',  check: s => s.totalRoundsPlayed >= 20 },
  { id: 'diligent_silver', category: 'diligent', tier: 'silver', label: '100 Runden gespielt', check: s => s.totalRoundsPlayed >= 100 },
  { id: 'diligent_gold',   category: 'diligent', tier: 'gold',   label: '500 Runden gespielt', check: s => s.totalRoundsPlayed >= 500 },

  // Perfektionist
  { id: 'perfect_bronze', category: 'perfectionist', tier: 'bronze', label: '5x drei Sterne',  check: s => s.threeStarCount >= 5 },
  { id: 'perfect_silver', category: 'perfectionist', tier: 'silver', label: '20x drei Sterne', check: s => s.threeStarCount >= 20 },
  { id: 'perfect_gold',   category: 'perfectionist', tier: 'gold',   label: '50x drei Sterne', check: s => s.threeStarCount >= 50 },
];

export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

// Given a stats object and array of already-unlocked badge IDs,
// returns array of newly unlocked badge IDs.
export function checkBadges(stats, unlockedBadgeIds) {
  const unlocked = new Set(unlockedBadgeIds);
  const newlyUnlocked = [];
  for (const badge of BADGES) {
    if (!unlocked.has(badge.id) && badge.check(stats)) {
      newlyUnlocked.push(badge.id);
    }
  }
  return newlyUnlocked;
}

export function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}

export function getBadgesForCategory(categoryId) {
  return BADGES.filter(b => b.category === categoryId);
}
