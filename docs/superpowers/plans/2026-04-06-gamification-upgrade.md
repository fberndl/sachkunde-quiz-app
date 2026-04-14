# Gamification Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete gamification layer (coins, avatars, themes, badges, celebrations) to the Sachkunde quiz app as a single "wow" release.

**Architecture:** New service layer (`src/services/`) for coins, profiles, badges. React Context for themes. New UI components (`src/components/`) for celebrations, overlays, and the "Mein Bereich" hub. All game components get a new `onCoinsEarned` callback alongside the existing `onXpEarned`. Supabase gets 3 new tables; LocalStorage mirrors all state.

**Tech Stack:** React Native + react-native-web, Supabase (PostgreSQL), Web Audio API (existing SoundService), React Context for theming.

**Spec:** `docs/superpowers/specs/2026-04-06-gamification-upgrade-design.md`

---

## File Structure

### New files to create

```
src/
  services/
    coinService.js          — Coin earn/spend/balance + Supabase sync
    profileService.js       — Player profile CRUD (avatar, theme, coins)
    badgeService.js         — Badge definitions, threshold checking, unlock logic
  context/
    ThemeContext.js          — ThemeProvider + useTheme() hook + theme definitions
  components/
    ConfettiOverlay.js      — Canvas-based confetti animation
    LevelUpOverlay.js       — Level-up celebration modal
    BadgeUnlockOverlay.js   — Badge unlock celebration modal
    CoinAnimation.js        — Animated "+X coins" counter
    MeinBereich.js          — Full-screen overlay hub (profile, shop, album, themes)
    ProfileTab.js           — Avatar selection grid
    ShopTab.js              — Buy avatars + themes with coins
    AlbumTab.js             — Badge collection album grid
    ThemeTab.js             — Theme preview + activation
    AvatarDisplay.js        — Reusable avatar display component
    PlayerHeader.js         — Avatar + name + level + coins bar (home screen)
  data/
    avatars.js              — Avatar definitions (id, emoji, name, price, levelGate)
    themes.js               — Theme objects (colors, gradients, backgrounds)
    badges.js               — Badge category/tier definitions + thresholds
```

### Files to modify

```
App.js                          — Add ThemeProvider wrapper, coin state, MeinBereich screen,
                                  PlayerHeader on home, celebration triggers, onCoinsEarned callbacks
src/services/supabase.js        — Add profile/coin/badge Supabase queries
src/games/GameHub.js            — Export GAMES array for badge counting
src/games/Leaderboard.js        — Show avatar next to player name
src/utils/SoundService.js       — Add coinEarn sound
```

---

## Task 1: Supabase Schema — Create New Tables

**Files:**
- Modify: `src/services/supabase.js`

This task creates the 3 new tables via Supabase MCP or SQL editor. No code changes needed yet — just the schema.

- [ ] **Step 1: Create `player_profiles` table**

Run this SQL in Supabase SQL editor (or via MCP `execute_sql`):

```sql
CREATE TABLE IF NOT EXISTS player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text UNIQUE NOT NULL,
  coins integer DEFAULT 0,
  active_avatar text DEFAULT 'emoji_default',
  owned_avatars text[] DEFAULT ARRAY['emoji_star', 'emoji_fire', 'emoji_brain', 'emoji_rocket', 'emoji_crown'],
  active_theme text DEFAULT 'standard',
  owned_themes text[] DEFAULT ARRAY['standard'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS but allow anon access (matches existing leaderboard pattern)
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON player_profiles FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Create `coin_transactions` table**

```sql
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL REFERENCES player_profiles(player_name),
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('game_reward', 'badge_bonus', 'level_bonus', 'purchase')),
  item_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON coin_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_coin_tx_player ON coin_transactions(player_name);
```

- [ ] **Step 3: Create `player_badges` table**

```sql
CREATE TABLE IF NOT EXISTS player_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL REFERENCES player_profiles(player_name),
  badge_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(player_name, badge_id)
);

ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON player_badges FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_badges_player ON player_badges(player_name);
```

- [ ] **Step 4: Verify tables exist**

Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`

Expected: `coin_transactions`, `leaderboard`, `player_badges`, `player_profiles` (plus existing tables).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: add gamification spec and plan"
```

---

## Task 2: Data Definitions — Avatars, Themes, Badges

**Files:**
- Create: `src/data/avatars.js`
- Create: `src/data/themes.js`
- Create: `src/data/badges.js`

- [ ] **Step 1: Create avatar definitions**

Create `src/data/avatars.js`:

```js
// Avatar definitions: emoji-based for now, can be upgraded to SVG/PNG later.
// Each avatar has an id, display emoji, name, price in coins, and optional level gate.

export const STARTER_AVATARS = [
  { id: 'emoji_star', emoji: '\u2B50', name: 'Stern' },
  { id: 'emoji_fire', emoji: '\uD83D\uDD25', name: 'Feuer' },
  { id: 'emoji_brain', emoji: '\uD83E\uDDE0', name: 'Gehirn' },
  { id: 'emoji_rocket', emoji: '\uD83D\uDE80', name: 'Rakete' },
  { id: 'emoji_crown', emoji: '\uD83D\uDC51', name: 'Krone' },
];

export const UNLOCKABLE_AVATARS = [
  { id: 'fiaker',       emoji: '\uD83D\uDC0E', name: 'Fiaker-Kutscherin',          price: 15, levelGate: 0 },
  { id: 'heuriger',     emoji: '\uD83E\uDDD1\u200D\uD83C\uDF73', name: 'Heuriger-Koch',              price: 15, levelGate: 0 },
  { id: 'prater',       emoji: '\uD83C\uDFA1', name: 'Prater-Riesenrad-Pilot',     price: 20, levelGate: 3 },
  { id: 'schoenbrunn',  emoji: '\uD83E\uDD81', name: 'Sch\u00F6nbrunn-L\u00F6we',  price: 25, levelGate: 5 },
  { id: 'ubahn',        emoji: '\uD83D\uDE87', name: 'U-Bahn-Kapit\u00E4nin',      price: 25, levelGate: 5 },
  { id: 'donau',        emoji: '\uD83E\uDDDC\u200D\u2640\uFE0F', name: 'Donau-Nixe',                 price: 30, levelGate: 7 },
  { id: 'ringstrasse',  emoji: '\uD83C\uDFDB\uFE0F', name: 'Ringstra\u00DFen-Architekt',  price: 30, levelGate: 7 },
  { id: 'stephansdom',  emoji: '\u26EA', name: 'Stephansdom-W\u00E4chter',   price: 40, levelGate: 10 },
  { id: 'saengerknabe', emoji: '\uD83C\uDFA4', name: 'Wiener S\u00E4ngerknabe',    price: 40, levelGate: 10 },
  { id: 'augarten',     emoji: '\uD83C\uDFA8', name: 'Augarten-Meisterin',         price: 50, levelGate: 12 },
  { id: 'rathausmann',  emoji: '\uD83C\uDFF0', name: 'Rathausmann',                price: 35, levelGate: 8 },
  { id: 'naschmarkt',   emoji: '\uD83C\uDF4E', name: 'Naschmarkt-H\u00E4ndlerin',  price: 25, levelGate: 6 },
  { id: 'zentralfried', emoji: '\uD83E\uDDDB', name: 'Zentralfriedhof-Geist',      price: 45, levelGate: 11 },
  { id: 'wienfluss',    emoji: '\uD83D\uDC1F', name: 'Wienfluss-Fisch',            price: 20, levelGate: 4 },
  { id: 'klimt',        emoji: '\uD83D\uDDBC\uFE0F', name: 'Klimt-K\u00FCnstler',         price: 50, levelGate: 14 },
];

export const ALL_AVATARS = [...STARTER_AVATARS, ...UNLOCKABLE_AVATARS];

export function getAvatarById(id) {
  return ALL_AVATARS.find(a => a.id === id) || STARTER_AVATARS[0];
}
```

- [ ] **Step 2: Create theme definitions**

Create `src/data/themes.js`:

```js
// Theme definitions as JS objects for React Native StyleSheet consumption.
// Each theme provides colors + optional background config consumed via ThemeContext.

export const THEMES = [
  {
    id: 'standard',
    name: 'Standard',
    emoji: '\uD83C\uDF93',
    price: 0,
    levelGate: 0,
    colors: {
      bgPrimary: '#FFF9F5',
      bgSecondary: '#F0F4F8',
      bgGradient: ['#667eea', '#764ba2'],
      accent: '#C0392B',
      accentSecondary: '#F39C12',
      textPrimary: '#2C3E50',
      textSecondary: '#95A5A6',
      cardBg: '#FFFFFF',
      cardBorder: '#E8E8E8',
      buttonBg: '#C0392B',
      buttonText: '#FFFFFF',
    },
    backgroundImage: null,
  },
  {
    id: 'weltraum',
    name: 'Weltraum',
    emoji: '\uD83D\uDE80',
    price: 30,
    levelGate: 0,
    colors: {
      bgPrimary: '#0f0c29',
      bgSecondary: '#1a1a3e',
      bgGradient: ['#0f0c29', '#302b63', '#24243e'],
      accent: '#00d4ff',
      accentSecondary: '#7c3aed',
      textPrimary: '#FFFFFF',
      textSecondary: '#a0a0cc',
      cardBg: 'rgba(255,255,255,0.08)',
      cardBorder: 'rgba(255,255,255,0.15)',
      buttonBg: '#00d4ff',
      buttonText: '#0f0c29',
    },
    backgroundImage: null,
  },
  {
    id: 'natur',
    name: 'Natur',
    emoji: '\uD83C\uDF3F',
    price: 30,
    levelGate: 0,
    colors: {
      bgPrimary: '#f0f9f4',
      bgSecondary: '#e0f2e9',
      bgGradient: ['#134e5e', '#71b280'],
      accent: '#27AE60',
      accentSecondary: '#2ecc71',
      textPrimary: '#1a3a2a',
      textSecondary: '#5a7a6a',
      cardBg: '#FFFFFF',
      cardBorder: '#c8e6c9',
      buttonBg: '#27AE60',
      buttonText: '#FFFFFF',
    },
    backgroundImage: null,
  },
  {
    id: 'wien_nacht',
    name: 'Wien bei Nacht',
    emoji: '\uD83C\uDF03',
    price: 40,
    levelGate: 8,
    colors: {
      bgPrimary: '#1a1a2e',
      bgSecondary: '#16213e',
      bgGradient: ['#1a1a2e', '#16213e', '#0f3460'],
      accent: '#e94560',
      accentSecondary: '#f5c518',
      textPrimary: '#FFFFFF',
      textSecondary: '#8a8aaa',
      cardBg: 'rgba(255,255,255,0.06)',
      cardBorder: 'rgba(233,69,96,0.3)',
      buttonBg: '#e94560',
      buttonText: '#FFFFFF',
    },
    backgroundImage: null,
  },
  {
    id: 'ozean',
    name: 'Ozean',
    emoji: '\uD83C\uDF0A',
    price: 30,
    levelGate: 0,
    colors: {
      bgPrimary: '#e0f7fa',
      bgSecondary: '#b2ebf2',
      bgGradient: ['#0077b6', '#00b4d8', '#90e0ef'],
      accent: '#ff6b35',
      accentSecondary: '#0077b6',
      textPrimary: '#01497c',
      textSecondary: '#468faf',
      cardBg: '#FFFFFF',
      cardBorder: '#b2ebf2',
      buttonBg: '#ff6b35',
      buttonText: '#FFFFFF',
    },
    backgroundImage: null,
  },
  {
    id: 'candy',
    name: 'Candy',
    emoji: '\uD83C\uDF6C',
    price: 40,
    levelGate: 6,
    colors: {
      bgPrimary: '#fff0f5',
      bgSecondary: '#fce4ec',
      bgGradient: ['#ff9a9e', '#fecfef', '#fdfcfb'],
      accent: '#e91e63',
      accentSecondary: '#ff6090',
      textPrimary: '#4a1942',
      textSecondary: '#8a5082',
      cardBg: '#FFFFFF',
      cardBorder: '#f8bbd0',
      buttonBg: '#e91e63',
      buttonText: '#FFFFFF',
    },
    backgroundImage: null,
  },
];

export function getThemeById(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
```

- [ ] **Step 3: Create badge definitions**

Create `src/data/badges.js`:

```js
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
```

- [ ] **Step 4: Verify imports work**

Run: `cd /home/fberndl/sachkunde-test-2 && node -e "const a = require('./src/data/avatars'); const t = require('./src/data/themes'); const b = require('./src/data/badges'); console.log(a.ALL_AVATARS.length, 'avatars'); console.log(t.THEMES.length, 'themes'); console.log(b.BADGES.length, 'badges');"`

Expected: `20 avatars`, `6 themes`, `18 badges`

- [ ] **Step 5: Commit**

```bash
git add src/data/avatars.js src/data/themes.js src/data/badges.js
git commit -m "feat: add avatar, theme, and badge data definitions"
```

---

## Task 3: Supabase Queries — Profile, Coin, Badge Functions

**Files:**
- Modify: `src/services/supabase.js` (add new exports at bottom)

- [ ] **Step 1: Add profile queries to supabase.js**

Append to `src/services/supabase.js` after the existing `isConfigured` function:

```js
// --- Player Profile ---

export async function getOrCreateProfile(playerName) {
  if (!supabase || !playerName) return null;
  // Try to fetch existing
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('player_name', playerName)
    .single();
  if (data) return data;
  // Create new
  const { data: created, error: createErr } = await supabase
    .from('player_profiles')
    .insert([{ player_name: playerName }])
    .select()
    .single();
  if (createErr) console.warn('Profile create error:', createErr.message);
  return created;
}

export async function updateProfile(playerName, updates) {
  if (!supabase || !playerName) return null;
  const { data, error } = await supabase
    .from('player_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('player_name', playerName)
    .select()
    .single();
  if (error) console.warn('Profile update error:', error.message);
  return data;
}

export async function renameProfile(oldName, newName) {
  if (!supabase || !oldName || !newName) return false;
  const { error } = await supabase
    .from('player_profiles')
    .update({ player_name: newName, updated_at: new Date().toISOString() })
    .eq('player_name', oldName);
  if (error) { console.warn('Profile rename error:', error.message); return false; }
  return true;
}

// --- Coin Transactions ---

export async function addCoinTransaction(playerName, amount, type, itemId = null) {
  if (!supabase || !playerName) return null;
  const { data, error } = await supabase
    .from('coin_transactions')
    .insert([{ player_name: playerName, amount, type, item_id: itemId }])
    .select()
    .single();
  if (error) console.warn('Coin tx error:', error.message);
  return data;
}

export async function getCoinBalance(playerName) {
  if (!supabase || !playerName) return 0;
  const { data, error } = await supabase
    .from('coin_transactions')
    .select('amount')
    .eq('player_name', playerName);
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + row.amount, 0);
}

// --- Player Badges ---

export async function getPlayerBadges(playerName) {
  if (!supabase || !playerName) return [];
  const { data, error } = await supabase
    .from('player_badges')
    .select('badge_id, unlocked_at')
    .eq('player_name', playerName);
  if (error) { console.warn('Badges fetch error:', error.message); return []; }
  return data || [];
}

export async function unlockBadge(playerName, badgeId) {
  if (!supabase || !playerName) return null;
  const { data, error } = await supabase
    .from('player_badges')
    .upsert([{ player_name: playerName, badge_id: badgeId }], { onConflict: 'player_name,badge_id' })
    .select()
    .single();
  if (error) console.warn('Badge unlock error:', error.message);
  return data;
}
```

- [ ] **Step 2: Verify build still works**

Run: `cd /home/fberndl/sachkunde-test-2 && npm run build 2>&1 | tail -5`

Expected: Build succeeds (no import errors).

- [ ] **Step 3: Commit**

```bash
git add src/services/supabase.js
git commit -m "feat: add Supabase queries for profiles, coins, badges"
```

---

## Task 4: Coin Service — Local + Remote Sync

**Files:**
- Create: `src/services/coinService.js`

- [ ] **Step 1: Create coinService.js**

```js
import { addCoinTransaction, getCoinBalance, updateProfile } from './supabase';

const COIN_KEY = 'sachkunde_coins';

// --- LocalStorage ---

function getLocalCoins() {
  try {
    return parseInt(localStorage.getItem(COIN_KEY) || '0', 10) || 0;
  } catch (e) { return 0; }
}

function setLocalCoins(coins) {
  try {
    localStorage.setItem(COIN_KEY, String(coins));
  } catch (e) { /* silently ignore */ }
}

// --- Coin Operations ---

// Award coins after a game. Returns new balance.
async function earnCoins(playerName, amount, type = 'game_reward', itemId = null) {
  const newBalance = getLocalCoins() + amount;
  setLocalCoins(newBalance);

  if (playerName) {
    addCoinTransaction(playerName, amount, type, itemId).catch(() => {});
    updateProfile(playerName, { coins: newBalance }).catch(() => {});
  }

  return newBalance;
}

// Spend coins on a purchase. Returns new balance or null if insufficient.
async function spendCoins(playerName, amount, itemId) {
  const current = getLocalCoins();
  if (current < amount) return null;

  const newBalance = current - amount;
  setLocalCoins(newBalance);

  if (playerName) {
    addCoinTransaction(playerName, -amount, 'purchase', itemId).catch(() => {});
    updateProfile(playerName, { coins: newBalance }).catch(() => {});
  }

  return newBalance;
}

// Reconcile local coins with server (server = source of truth via transaction sum).
async function reconcileCoins(playerName) {
  const localCoins = getLocalCoins();

  let remoteBalance = 0;
  try {
    remoteBalance = await getCoinBalance(playerName);
  } catch (e) {
    return localCoins; // offline — keep local
  }

  // Server (transaction log sum) is source of truth
  if (remoteBalance !== localCoins) {
    setLocalCoins(remoteBalance);
  }
  return remoteBalance;
}

// Calculate coins earned for a game result based on star rating.
function coinsForStars(stars) {
  if (stars >= 3) return 10;
  if (stars >= 2) return 6;
  if (stars >= 1) return 3;
  return 1;
}

export {
  getLocalCoins,
  setLocalCoins,
  earnCoins,
  spendCoins,
  reconcileCoins,
  coinsForStars,
};
```

- [ ] **Step 2: Verify module loads**

Run: `node -e "const c = require('./src/services/coinService'); console.log(typeof c.earnCoins, typeof c.spendCoins, typeof c.coinsForStars);"`

Expected: `function function function`

- [ ] **Step 3: Commit**

```bash
git add src/services/coinService.js
git commit -m "feat: add coin service with earn/spend/reconcile"
```

---

## Task 5: Profile Service — Avatar, Theme, Badge Persistence

**Files:**
- Create: `src/services/profileService.js`

- [ ] **Step 1: Create profileService.js**

```js
import { getOrCreateProfile, updateProfile, getPlayerBadges, unlockBadge as unlockBadgeRemote } from './supabase';

// --- LocalStorage Keys ---
const KEYS = {
  activeAvatar: 'sachkunde_active_avatar',
  ownedAvatars: 'sachkunde_owned_avatars',
  activeTheme: 'sachkunde_active_theme',
  ownedThemes: 'sachkunde_owned_themes',
  badges: 'sachkunde_badges',
  gamificationVersion: 'sachkunde_gamification_version',
  // Game stats for badge checking
  stats: 'sachkunde_game_stats',
};

const DEFAULT_OWNED_AVATARS = ['emoji_star', 'emoji_fire', 'emoji_brain', 'emoji_rocket', 'emoji_crown'];
const DEFAULT_OWNED_THEMES = ['standard'];

// --- Generic localStorage helpers ---

function getJson(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}

function setJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* silently ignore */ }
}

function getString(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) { return fallback; }
}

function setString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) { /* silently ignore */ }
}

// --- Avatar ---

function getActiveAvatar() { return getString(KEYS.activeAvatar, 'emoji_star'); }
function setActiveAvatar(id) { setString(KEYS.activeAvatar, id); }
function getOwnedAvatars() { return getJson(KEYS.ownedAvatars, DEFAULT_OWNED_AVATARS); }
function setOwnedAvatars(arr) { setJson(KEYS.ownedAvatars, arr); }

function addOwnedAvatar(id) {
  const owned = getOwnedAvatars();
  if (!owned.includes(id)) {
    owned.push(id);
    setOwnedAvatars(owned);
  }
  return owned;
}

// --- Theme ---

function getActiveTheme() { return getString(KEYS.activeTheme, 'standard'); }
function setActiveTheme(id) { setString(KEYS.activeTheme, id); }
function getOwnedThemes() { return getJson(KEYS.ownedThemes, DEFAULT_OWNED_THEMES); }
function setOwnedThemes(arr) { setJson(KEYS.ownedThemes, arr); }

function addOwnedTheme(id) {
  const owned = getOwnedThemes();
  if (!owned.includes(id)) {
    owned.push(id);
    setOwnedThemes(owned);
  }
  return owned;
}

// --- Badges ---

function getLocalBadges() { return getJson(KEYS.badges, []); }
function setLocalBadges(arr) { setJson(KEYS.badges, arr); }

function addLocalBadge(badgeId) {
  const badges = getLocalBadges();
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
    setLocalBadges(badges);
  }
  return badges;
}

// --- Game Stats (for badge checking) ---

function getGameStats() {
  return getJson(KEYS.stats, {
    speedQuizCount: 0,
    wienQuestionsCorrect: 0,
    bestStreak: 0,
    uniqueGamesPlayed: 0,
    gamesPlayedSet: [],
    totalRoundsPlayed: 0,
    threeStarCount: 0,
  });
}

function setGameStats(stats) { setJson(KEYS.stats, stats); }

// Update stats after a game round. Returns updated stats.
function recordGamePlayed(gameId, { streak = 0, stars = 0, wienCorrect = 0, isSpeedQuiz = false } = {}) {
  const stats = getGameStats();

  stats.totalRoundsPlayed += 1;

  if (!stats.gamesPlayedSet) stats.gamesPlayedSet = [];
  if (!stats.gamesPlayedSet.includes(gameId)) {
    stats.gamesPlayedSet.push(gameId);
  }
  stats.uniqueGamesPlayed = stats.gamesPlayedSet.length;

  if (streak > (stats.bestStreak || 0)) stats.bestStreak = streak;
  if (stars >= 3) stats.threeStarCount = (stats.threeStarCount || 0) + 1;
  if (isSpeedQuiz) stats.speedQuizCount = (stats.speedQuizCount || 0) + 1;
  stats.wienQuestionsCorrect = (stats.wienQuestionsCorrect || 0) + wienCorrect;

  setGameStats(stats);
  return stats;
}

// --- Gamification Version (for first-time experience) ---

function getGamificationVersion() { return getString(KEYS.gamificationVersion, '0'); }
function setGamificationVersion(v) { setString(KEYS.gamificationVersion, v); }
function isFirstTimeGamification() { return getGamificationVersion() === '0'; }

// --- Sync profile from Supabase ---

async function syncProfileFromRemote(playerName) {
  const profile = await getOrCreateProfile(playerName);
  if (!profile) return null;

  // Remote -> local (only if remote has data)
  if (profile.active_avatar && profile.active_avatar !== 'emoji_default') {
    setActiveAvatar(profile.active_avatar);
  }
  if (profile.owned_avatars && profile.owned_avatars.length > 0) {
    setOwnedAvatars(profile.owned_avatars);
  }
  if (profile.active_theme) setActiveTheme(profile.active_theme);
  if (profile.owned_themes && profile.owned_themes.length > 0) {
    setOwnedThemes(profile.owned_themes);
  }

  // Sync badges
  const remoteBadges = await getPlayerBadges(playerName);
  if (remoteBadges.length > 0) {
    const localBadges = getLocalBadges();
    const merged = [...new Set([...localBadges, ...remoteBadges.map(b => b.badge_id)])];
    setLocalBadges(merged);
  }

  return profile;
}

// Push local state to remote
async function syncProfileToRemote(playerName) {
  await updateProfile(playerName, {
    active_avatar: getActiveAvatar(),
    owned_avatars: getOwnedAvatars(),
    active_theme: getActiveTheme(),
    owned_themes: getOwnedThemes(),
  }).catch(() => {});
}

// Unlock a badge locally + remotely
async function unlockBadge(playerName, badgeId) {
  addLocalBadge(badgeId);
  if (playerName) {
    unlockBadgeRemote(playerName, badgeId).catch(() => {});
  }
}

export {
  // Avatar
  getActiveAvatar, setActiveAvatar, getOwnedAvatars, setOwnedAvatars, addOwnedAvatar,
  // Theme
  getActiveTheme, setActiveTheme, getOwnedThemes, setOwnedThemes, addOwnedTheme,
  // Badges
  getLocalBadges, setLocalBadges, addLocalBadge, unlockBadge,
  // Stats
  getGameStats, setGameStats, recordGamePlayed,
  // Version
  isFirstTimeGamification, setGamificationVersion,
  // Sync
  syncProfileFromRemote, syncProfileToRemote,
};
```

- [ ] **Step 2: Verify module loads**

Run: `node -e "const p = require('./src/services/profileService'); console.log(typeof p.getActiveAvatar, typeof p.recordGamePlayed);"`

Expected: `function function`

- [ ] **Step 3: Commit**

```bash
git add src/services/profileService.js
git commit -m "feat: add profile service for avatar, theme, badge persistence"
```

---

## Task 6: Theme Context — React Context + Provider

**Files:**
- Create: `src/context/ThemeContext.js`

- [ ] **Step 1: Create ThemeContext.js**

```js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { THEMES, getThemeById } from '../data/themes';
import { getActiveTheme, setActiveTheme as persistTheme } from '../services/profileService';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => getActiveTheme());
  const theme = getThemeById(themeId);

  const switchTheme = useCallback((id) => {
    setThemeId(id);
    persistTheme(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeId, switchTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Wrap App in ThemeProvider**

In `App.js`, add import at top:

```js
import { ThemeProvider } from './src/context/ThemeContext';
```

Then wrap the root `<View>` in the `App` component's return (around line 624-625):

Change:
```js
return (
    <View style={{ flex: 1, backgroundColor: C.light, maxWidth: 500, width: '100%', alignSelf: 'center' }}>
```

To:
```js
return (
  <ThemeProvider>
    <View style={{ flex: 1, backgroundColor: C.light, maxWidth: 500, width: '100%', alignSelf: 'center' }}>
```

And add the closing `</ThemeProvider>` tag before the final `);` of the return (after line 704's `</View>`):

```js
    </View>
  </ThemeProvider>
  );
```

- [ ] **Step 3: Verify app still renders**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/context/ThemeContext.js App.js
git commit -m "feat: add ThemeContext provider wrapping the app"
```

---

## Task 7: Confetti Overlay Component

**Files:**
- Create: `src/components/ConfettiOverlay.js`

- [ ] **Step 1: Create ConfettiOverlay.js**

This uses a simple `<canvas>` element for web (the primary platform). Falls back to colored Animated.Views for native.

```js
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 50;
const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#F39C12', '#E74C3C'];

// Web implementation using canvas
function ConfettiCanvas({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * SCREEN_W,
      y: -20 - Math.random() * 100,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    let frame;
    let startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

      // Fade out after 1.5s
      const fadeStart = 1500;
      const fadeDuration = 500;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.rotation += p.rotSpeed;

        if (elapsed > fadeStart) {
          p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / fadeDuration);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < fadeStart + fadeDuration) {
        frame = requestAnimationFrame(animate);
      } else {
        onDone && onDone();
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SCREEN_W,
        height: SCREEN_H,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

// React Native fallback (simplified)
function ConfettiNative({ onDone }) {
  const anims = useRef(
    Array.from({ length: 20 }, () => ({
      y: new Animated.Value(-20),
      x: Math.random() * SCREEN_W,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map(p =>
      Animated.parallel([
        Animated.timing(p.y, { toValue: SCREEN_H + 20, duration: 1500 + Math.random() * 500, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ])
    );
    Animated.parallel(animations).start(() => onDone && onDone());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          left: p.x,
          width: 8,
          height: 6,
          backgroundColor: p.color,
          borderRadius: 2,
          opacity: p.opacity,
          transform: [{ translateY: p.y }],
        }} />
      ))}
    </View>
  );
}

export default function ConfettiOverlay({ visible, onDone }) {
  if (!visible) return null;

  if (Platform.OS === 'web') {
    return <ConfettiCanvas onDone={onDone} />;
  }
  return <ConfettiNative onDone={onDone} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ConfettiOverlay.js
git commit -m "feat: add confetti overlay component (canvas + native)"
```

---

## Task 8: Celebration Overlays — Level-Up + Badge Unlock

**Files:**
- Create: `src/components/LevelUpOverlay.js`
- Create: `src/components/BadgeUnlockOverlay.js`
- Create: `src/components/CoinAnimation.js`
- Modify: `src/utils/SoundService.js` (add coinEarn sound)

- [ ] **Step 1: Add coinEarn sound to SoundService.js**

In `src/utils/SoundService.js`, add a new method to the SoundService object (after the existing `match` method):

```js
  coinEarn() {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Ascending coin chime: two quick high notes
    playTone(1200, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(1500, 0.1, 'sine', 0.25), 80);
  },
```

- [ ] **Step 2: Create CoinAnimation.js**

```js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// Animated "+X" coin counter that ticks up from 0 to target.
export default function CoinAnimation({ amount, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => onDone && onDone(), 800);
    });
  }, []);

  return (
    <Animated.View style={[styles.wrap, { opacity: anim, transform: [{ scale }] }]}>
      <Text style={styles.text}>{'\uD83E\uDE99'} +{amount}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F39C12',
  },
});
```

- [ ] **Step 3: Create LevelUpOverlay.js**

```js
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal } from 'react-native';
import ConfettiOverlay from './ConfettiOverlay';
import SoundService from '../utils/SoundService';

export default function LevelUpOverlay({ visible, level, levelEmoji, levelName, coinsEarned, newUnlocks, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      SoundService.success();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <ConfettiOverlay visible={true} />
        <Animated.View style={[styles.card, {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        }]}>
          <Text style={styles.emoji}>{levelEmoji}</Text>
          <Text style={styles.title}>Level {level} erreicht!</Text>
          <Text style={styles.name}>{levelName}</Text>
          <View style={styles.coinRow}>
            <Text style={styles.coinText}>{'\uD83E\uDE99'} +{coinsEarned} M\u00FCnzen</Text>
          </View>
          {newUnlocks && newUnlocks.length > 0 && (
            <View style={styles.unlockSection}>
              <Text style={styles.unlockTitle}>Neu verf\u00FCgbar:</Text>
              {newUnlocks.map((item, i) => (
                <Text key={i} style={styles.unlockItem}>{item}</Text>
              ))}
            </View>
          )}
          <Text style={styles.dismiss}>Tippen zum Schlie\u00DFen</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 10,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#2C3E50', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '600', color: '#95A5A6', marginBottom: 16 },
  coinRow: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  coinText: { fontSize: 20, fontWeight: '800', color: '#F39C12' },
  unlockSection: { marginTop: 8, alignItems: 'center' },
  unlockTitle: { fontSize: 14, fontWeight: '700', color: '#2C3E50', marginBottom: 6 },
  unlockItem: { fontSize: 14, color: '#7f8c8d', marginBottom: 2 },
  dismiss: { fontSize: 13, color: '#BDC3C7', marginTop: 16 },
});
```

- [ ] **Step 4: Create BadgeUnlockOverlay.js**

```js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import ConfettiOverlay from './ConfettiOverlay';
import { getBadgeById, BADGE_CATEGORIES, TIER_COLORS } from '../data/badges';
import SoundService from '../utils/SoundService';

export default function BadgeUnlockOverlay({ visible, badgeId, onDismiss }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      SoundService.streak();
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(flipAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start(() => {
        // Auto-dismiss after 2.5s
        setTimeout(() => onDismiss && onDismiss(), 2500);
      });
    } else {
      flipAnim.setValue(0);
      scaleAnim.setValue(0.3);
    }
  }, [visible]);

  if (!visible || !badgeId) return null;

  const badge = getBadgeById(badgeId);
  if (!badge) return null;

  const category = BADGE_CATEGORIES.find(c => c.id === badge.category);
  const tierColor = TIER_COLORS[badge.tier] || '#C0C0C0';
  const tierLabel = badge.tier === 'bronze' ? 'Bronze' : badge.tier === 'silver' ? 'Silber' : 'Gold';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <ConfettiOverlay visible={true} />
        <Animated.View style={[styles.card, {
          transform: [{ scale: scaleAnim }],
          borderColor: tierColor,
        }]}>
          <Animated.View style={{
            transform: [{
              rotateY: flipAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['180deg', '90deg', '0deg'],
              }),
            }],
          }}>
            <Text style={styles.emoji}>{category ? category.emoji : '\u2B50'}</Text>
          </Animated.View>
          <Text style={[styles.tier, { color: tierColor }]}>{tierLabel}</Text>
          <Text style={styles.category}>{category ? category.name : ''}</Text>
          <Text style={styles.label}>{badge.label}</Text>
          <View style={styles.coinRow}>
            <Text style={styles.coinText}>{'\uD83E\uDE99'} +5 M\u00FCnzen</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
    elevation: 10,
    borderWidth: 3,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  tier: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  category: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginTop: 4 },
  label: { fontSize: 14, color: '#95A5A6', marginTop: 4, marginBottom: 12 },
  coinRow: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  coinText: { fontSize: 16, fontWeight: '800', color: '#F39C12' },
});
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/SoundService.js src/components/CoinAnimation.js src/components/LevelUpOverlay.js src/components/BadgeUnlockOverlay.js
git commit -m "feat: add celebration overlays (level-up, badge, coin animation)"
```

---

## Task 9: Avatar Display + Player Header Component

**Files:**
- Create: `src/components/AvatarDisplay.js`
- Create: `src/components/PlayerHeader.js`

- [ ] **Step 1: Create AvatarDisplay.js**

```js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAvatarById } from '../data/avatars';

// Reusable avatar display — used on home screen, leaderboard, profile.
export default function AvatarDisplay({ avatarId, size = 48, showBorder = true }) {
  const avatar = getAvatarById(avatarId);
  const fontSize = size * 0.55;

  return (
    <View style={[
      styles.circle,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: showBorder ? 2 : 0,
      },
    ]}>
      <Text style={{ fontSize }}>{avatar.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#FFF9F5',
    borderColor: '#F39C12',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});
```

- [ ] **Step 2: Create PlayerHeader.js**

This replaces the XP badge on the home screen. Shows avatar (tappable), name, level, coins.

```js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AvatarDisplay from './AvatarDisplay';
import { getLevelInfo, getLevel } from '../games/GameHub';

export default function PlayerHeader({ playerName, xp, coins, avatarId, onAvatarPress }) {
  const level = getLevel(xp);
  const levelInfo = getLevelInfo(xp);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
        <AvatarDisplay avatarId={avatarId} size={52} />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{playerName}</Text>
        <View style={styles.row}>
          <Text style={styles.level}>{levelInfo.emoji} Lv.{level}</Text>
          <Text style={styles.xp}>{xp} XP</Text>
        </View>
      </View>
      <View style={styles.coinBadge}>
        <Text style={styles.coinText}>{'\uD83E\uDE99'} {coins}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  level: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F39C12',
  },
  xp: {
    fontSize: 12,
    color: '#95A5A6',
  },
  coinBadge: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F39C12',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AvatarDisplay.js src/components/PlayerHeader.js
git commit -m "feat: add AvatarDisplay and PlayerHeader components"
```

---

## Task 10: "Mein Bereich" Hub — Tabs (Profile, Shop, Album, Themes)

**Files:**
- Create: `src/components/MeinBereich.js`
- Create: `src/components/ProfileTab.js`
- Create: `src/components/ShopTab.js`
- Create: `src/components/AlbumTab.js`
- Create: `src/components/ThemeTab.js`

This is the largest UI task. Each tab is its own component; `MeinBereich.js` orchestrates them.

- [ ] **Step 1: Create ProfileTab.js**

```js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { STARTER_AVATARS, UNLOCKABLE_AVATARS, getAvatarById } from '../data/avatars';

export default function ProfileTab({ activeAvatar, ownedAvatars, playerLevel, onSelectAvatar }) {
  const owned = new Set(ownedAvatars);

  const renderAvatar = (avatar) => {
    const isOwned = owned.has(avatar.id);
    const isActive = activeAvatar === avatar.id;

    return (
      <TouchableOpacity
        key={avatar.id}
        style={[styles.avatarCell, isActive && styles.activeCell]}
        onPress={() => isOwned && onSelectAvatar(avatar.id)}
        disabled={!isOwned}
        activeOpacity={0.7}
      >
        <Text style={[styles.emoji, !isOwned && styles.locked]}>{avatar.emoji}</Text>
        <Text style={[styles.label, !isOwned && styles.lockedLabel]} numberOfLines={1}>
          {avatar.name}
        </Text>
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      <Text style={styles.sectionTitle}>Deine Avatare</Text>
      <View style={styles.row}>
        {STARTER_AVATARS.map(renderAvatar)}
      </View>
      <View style={styles.row}>
        {UNLOCKABLE_AVATARS.filter(a => owned.has(a.id)).map(renderAvatar)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  avatarCell: {
    width: 72,
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCell: { borderColor: '#F39C12', backgroundColor: 'rgba(243, 156, 18, 0.08)' },
  emoji: { fontSize: 32 },
  locked: { opacity: 0.3 },
  label: { fontSize: 10, color: '#2C3E50', marginTop: 4, textAlign: 'center' },
  lockedLabel: { color: '#CCC' },
  activeDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#F39C12',
    position: 'absolute', top: 4, right: 4,
  },
});
```

- [ ] **Step 2: Create ShopTab.js**

```js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { UNLOCKABLE_AVATARS } from '../data/avatars';
import { THEMES } from '../data/themes';

export default function ShopTab({ coins, playerLevel, ownedAvatars, ownedThemes, onBuyAvatar, onBuyTheme }) {
  const ownedAv = new Set(ownedAvatars);
  const ownedTh = new Set(ownedThemes);

  const handleBuy = (item, type) => {
    if (type === 'avatar' && ownedAv.has(item.id)) return;
    if (type === 'theme' && ownedTh.has(item.id)) return;

    const gate = item.levelGate || 0;
    if (playerLevel < gate) {
      Alert.alert('Gesperrt', `Ab Level ${gate} verf\u00FCgbar!`);
      return;
    }

    if (coins < item.price) {
      Alert.alert('Zu wenig M\u00FCnzen', `Du brauchst ${item.price} M\u00FCnzen, hast aber nur ${coins}.`);
      return;
    }

    Alert.alert(
      `${item.name} kaufen?`,
      `${item.price} M\u00FCnzen ausgeben?`,
      [
        { text: 'Nein', style: 'cancel' },
        { text: 'Ja!', onPress: () => type === 'avatar' ? onBuyAvatar(item) : onBuyTheme(item) },
      ]
    );
  };

  const renderItem = (item, type) => {
    const isOwned = type === 'avatar' ? ownedAv.has(item.id) : ownedTh.has(item.id);
    const gate = item.levelGate || 0;
    const isLocked = playerLevel < gate;
    const canAfford = coins >= (item.price || 0);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.item, isOwned && styles.ownedItem]}
        onPress={() => !isOwned && handleBuy(item, type)}
        disabled={isOwned}
        activeOpacity={0.7}
      >
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {isOwned ? (
            <Text style={styles.ownedText}>{'\u2713'} Gekauft</Text>
          ) : isLocked ? (
            <Text style={styles.lockedText}>Ab Level {gate}</Text>
          ) : (
            <Text style={[styles.priceText, !canAfford && styles.cantAfford]}>
              {'\uD83E\uDE99'} {item.price}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.coinBar}>
        <Text style={styles.coinBarText}>{'\uD83E\uDE99'} {coins} M\u00FCnzen</Text>
      </View>

      <Text style={styles.sectionTitle}>Avatare</Text>
      {UNLOCKABLE_AVATARS.map(a => renderItem(a, 'avatar'))}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Themes</Text>
      {THEMES.filter(t => t.price > 0).map(t => renderItem(t, 'theme'))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  coinBar: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  coinBarText: { fontSize: 20, fontWeight: '900', color: '#F39C12' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    elevation: 2,
  },
  ownedItem: { borderColor: '#27AE60', backgroundColor: 'rgba(39, 174, 96, 0.04)' },
  itemEmoji: { fontSize: 36, marginRight: 14 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  priceText: { fontSize: 14, fontWeight: '700', color: '#F39C12', marginTop: 2 },
  cantAfford: { color: '#BDC3C7' },
  ownedText: { fontSize: 13, fontWeight: '700', color: '#27AE60', marginTop: 2 },
  lockedText: { fontSize: 13, fontWeight: '600', color: '#BDC3C7', marginTop: 2 },
});
```

- [ ] **Step 3: Create AlbumTab.js**

```js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BADGE_CATEGORIES, BADGES, TIER_COLORS, getBadgesForCategory } from '../data/badges';

export default function AlbumTab({ unlockedBadgeIds }) {
  const unlocked = new Set(unlockedBadgeIds);
  const totalUnlocked = unlockedBadgeIds.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Sammelalbum</Text>
      <Text style={styles.progress}>{totalUnlocked} / {BADGES.length} Badges gesammelt</Text>

      {BADGE_CATEGORIES.map(cat => {
        const catBadges = getBadgesForCategory(cat.id);
        const catUnlocked = catBadges.filter(b => unlocked.has(b.id)).length;

        return (
          <View key={cat.id} style={styles.category}>
            <View style={styles.catHeader}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catProgress}>{catUnlocked}/{catBadges.length}</Text>
            </View>
            <View style={styles.badgeRow}>
              {catBadges.map(badge => {
                const isUnlocked = unlocked.has(badge.id);
                const tierColor = TIER_COLORS[badge.tier];
                const tierLabel = badge.tier === 'bronze' ? 'Bronze' : badge.tier === 'silver' ? 'Silber' : 'Gold';

                return (
                  <View key={badge.id} style={[
                    styles.badgeCell,
                    { borderColor: isUnlocked ? tierColor : '#DDD' },
                    isUnlocked && { backgroundColor: `${tierColor}15` },
                  ]}>
                    <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeLocked]}>
                      {isUnlocked ? cat.emoji : '\u2753'}
                    </Text>
                    <Text style={[styles.tierLabel, { color: isUnlocked ? tierColor : '#CCC' }]}>
                      {tierLabel}
                    </Text>
                    <Text style={styles.badgeDesc} numberOfLines={2}>
                      {badge.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(catUnlocked / catBadges.length) * 100}%` }]} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '900', color: '#2C3E50', textAlign: 'center' },
  progress: { fontSize: 14, color: '#95A5A6', textAlign: 'center', marginBottom: 20 },
  category: { marginBottom: 20 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catEmoji: { fontSize: 22, marginRight: 8 },
  catName: { fontSize: 16, fontWeight: '800', color: '#2C3E50', flex: 1 },
  catProgress: { fontSize: 14, fontWeight: '700', color: '#95A5A6' },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badgeCell: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#FAFAFA',
    minHeight: 100,
  },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeLocked: { opacity: 0.4 },
  tierLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  badgeDesc: { fontSize: 10, color: '#95A5A6', textAlign: 'center', marginTop: 4 },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F39C12',
    borderRadius: 3,
  },
});
```

- [ ] **Step 4: Create ThemeTab.js**

```js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { THEMES } from '../data/themes';

export default function ThemeTab({ activeTheme, ownedThemes, onSelectTheme }) {
  const owned = new Set(ownedThemes);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Themes</Text>
      {THEMES.map(theme => {
        const isOwned = owned.has(theme.id);
        const isActive = activeTheme === theme.id;
        if (!isOwned) return null;

        return (
          <TouchableOpacity
            key={theme.id}
            style={[styles.themeCard, isActive && styles.activeCard]}
            onPress={() => onSelectTheme(theme.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.preview, {
              backgroundColor: theme.colors.bgPrimary,
              borderColor: theme.colors.accent,
            }]}>
              <View style={[styles.previewBtn, { backgroundColor: theme.colors.buttonBg }]}>
                <Text style={{ color: theme.colors.buttonText, fontSize: 10, fontWeight: '700' }}>Button</Text>
              </View>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 9 }}>Card</Text>
              </View>
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeName}>{theme.emoji} {theme.name}</Text>
              {isActive && <Text style={styles.activeLabel}>{'\u2713'} Aktiv</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '900', color: '#2C3E50', textAlign: 'center', marginBottom: 16 },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    elevation: 2,
  },
  activeCard: { borderColor: '#F39C12' },
  preview: {
    width: 70,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  previewBtn: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  previewCard: { borderRadius: 4, padding: 4, borderWidth: 1 },
  themeInfo: { flex: 1, marginLeft: 12 },
  themeName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  activeLabel: { fontSize: 13, fontWeight: '700', color: '#27AE60', marginTop: 2 },
});
```

- [ ] **Step 5: Create MeinBereich.js hub**

```js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import ProfileTab from './ProfileTab';
import ShopTab from './ShopTab';
import AlbumTab from './AlbumTab';
import ThemeTab from './ThemeTab';

const TABS = [
  { id: 'profile', label: 'Profil',  emoji: '\uD83D\uDC64' },
  { id: 'shop',    label: 'Shop',    emoji: '\uD83D\uDED2' },
  { id: 'album',   label: 'Album',   emoji: '\uD83C\uDFC5' },
  { id: 'themes',  label: 'Themes',  emoji: '\uD83C\uDFA8' },
];

export default function MeinBereich({
  visible, onClose,
  playerName, playerLevel, coins,
  activeAvatar, ownedAvatars,
  activeTheme, ownedThemes,
  unlockedBadgeIds,
  onSelectAvatar, onBuyAvatar, onBuyTheme, onSelectTheme,
}) {
  const [activeTab, setActiveTab] = useState('profile');

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mein Bereich</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'profile' && (
            <ProfileTab
              activeAvatar={activeAvatar}
              ownedAvatars={ownedAvatars}
              playerLevel={playerLevel}
              onSelectAvatar={onSelectAvatar}
            />
          )}
          {activeTab === 'shop' && (
            <ShopTab
              coins={coins}
              playerLevel={playerLevel}
              ownedAvatars={ownedAvatars}
              ownedThemes={ownedThemes}
              onBuyAvatar={onBuyAvatar}
              onBuyTheme={onBuyTheme}
            />
          )}
          {activeTab === 'album' && (
            <AlbumTab unlockedBadgeIds={unlockedBadgeIds} />
          )}
          {activeTab === 'themes' && (
            <ThemeTab
              activeTheme={activeTheme}
              ownedThemes={ownedThemes}
              onSelectTheme={onSelectTheme}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#2C3E50' },
  closeBtn: { padding: 8 },
  closeTxt: { fontSize: 22, color: '#95A5A6' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#F39C12' },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: '#95A5A6', marginTop: 2 },
  tabLabelActive: { color: '#F39C12', fontWeight: '800' },
  content: { flex: 1 },
});
```

- [ ] **Step 6: Verify build**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProfileTab.js src/components/ShopTab.js src/components/AlbumTab.js src/components/ThemeTab.js src/components/MeinBereich.js
git commit -m "feat: add Mein Bereich hub with profile, shop, album, theme tabs"
```

---

## Task 11: App.js Integration — Wire Everything Together

**Files:**
- Modify: `App.js`

This is the central wiring task. It adds coin state, avatar/theme/badge state, celebration triggers, and the MeinBereich overlay to the root App component.

- [ ] **Step 1: Add new imports to App.js**

Add these imports at the top of `App.js` after the existing imports (after line 31):

```js
import { getLocalCoins, earnCoins, spendCoins, reconcileCoins, coinsForStars } from './src/services/coinService';
import {
  getActiveAvatar, setActiveAvatar as persistAvatar, getOwnedAvatars, addOwnedAvatar,
  getActiveTheme, getOwnedThemes, addOwnedTheme,
  getLocalBadges, recordGamePlayed, getGameStats,
  isFirstTimeGamification, setGamificationVersion,
  syncProfileFromRemote, syncProfileToRemote, unlockBadge,
} from './src/services/profileService';
import { checkBadges } from './src/data/badges';
import { getLevel, getLevelInfo } from './src/games/GameHub';
import PlayerHeader from './src/components/PlayerHeader';
import MeinBereich from './src/components/MeinBereich';
import LevelUpOverlay from './src/components/LevelUpOverlay';
import BadgeUnlockOverlay from './src/components/BadgeUnlockOverlay';
import CoinAnimation from './src/components/CoinAnimation';
import { useTheme } from './src/context/ThemeContext';
```

- [ ] **Step 2: Add new state variables to App component**

In the `App()` function (around line 508), add after the existing state declarations:

```js
  // Gamification state
  const [coins, setCoins] = useState(getLocalCoins);
  const [activeAvatar, setActiveAvatarState] = useState(getActiveAvatar);
  const [ownedAvatars, setOwnedAvatars] = useState(getOwnedAvatars);
  const [ownedThemes, setOwnedThemesState] = useState(getOwnedThemes);
  const [unlockedBadges, setUnlockedBadges] = useState(getLocalBadges);
  const [showMeinBereich, setShowMeinBereich] = useState(false);
  const { themeId, switchTheme } = useTheme();

  // Celebration state
  const [levelUpData, setLevelUpData] = useState(null);
  const [badgeUnlockData, setBadgeUnlockData] = useState(null);
  const [coinAnimData, setCoinAnimData] = useState(null);
  const badgeQueueRef = useRef([]);
```

- [ ] **Step 3: Add gamification sync on startup**

Add this useEffect after the existing XP reconciliation effect (after line 549):

```js
  // Gamification sync on startup
  useEffect(() => {
    if (!playerName) return;
    syncProfileFromRemote(playerName).catch(() => {});
    reconcileCoins(playerName).then(bal => setCoins(bal)).catch(() => {});
  }, [playerName]);
```

- [ ] **Step 4: Add game completion handler with coins + badges**

Replace the existing `handleGameXp` function (around line 579) with an expanded version:

```js
  const handleGameXp = (amount, gameId = null, { streak = 0, stars = 0, wienCorrect = 0, isSpeedQuiz = false } = {}) => {
    if (amount > 0) {
      const prevLevel = getLevel(xp);
      addXp(amount);
      const newLevel = getLevel(xp + amount);

      // Award coins based on stars
      const coinAmount = coinsForStars(stars);
      earnCoins(playerName, coinAmount, 'game_reward').then(bal => setCoins(bal));
      setCoinAnimData({ amount: coinAmount });

      // Record stats + check badges
      if (gameId) {
        const stats = recordGamePlayed(gameId, { streak, stars, wienCorrect, isSpeedQuiz });
        const newBadgeIds = checkBadges(stats, unlockedBadges);
        if (newBadgeIds.length > 0) {
          for (const bid of newBadgeIds) {
            unlockBadge(playerName, bid);
            earnCoins(playerName, 5, 'badge_bonus').then(bal => setCoins(bal));
          }
          setUnlockedBadges(prev => [...prev, ...newBadgeIds]);
          // Queue badge celebrations
          badgeQueueRef.current = [...badgeQueueRef.current, ...newBadgeIds];
          if (!badgeUnlockData) {
            setBadgeUnlockData({ badgeId: badgeQueueRef.current.shift() });
          }
        }
      }

      // Level-up check
      if (newLevel > prevLevel) {
        const lvlInfo = getLevelInfo(xp + amount);
        earnCoins(playerName, 20, 'level_bonus').then(bal => setCoins(bal));
        setLevelUpData({
          level: newLevel,
          levelEmoji: lvlInfo.emoji,
          levelName: lvlInfo.name,
          coinsEarned: 20,
          newUnlocks: [],
        });
      }
    }
  };
```

- [ ] **Step 5: Add purchase handlers**

Add these functions after `handleGameXp`:

```js
  const handleBuyAvatar = async (avatar) => {
    const newBal = await spendCoins(playerName, avatar.price, avatar.id);
    if (newBal === null) return;
    setCoins(newBal);
    const owned = addOwnedAvatar(avatar.id);
    setOwnedAvatars([...owned]);
    setActiveAvatarState(avatar.id);
    persistAvatar(avatar.id);
    syncProfileToRemote(playerName);
  };

  const handleBuyTheme = async (theme) => {
    const newBal = await spendCoins(playerName, theme.price, theme.id);
    if (newBal === null) return;
    setCoins(newBal);
    const owned = addOwnedTheme(theme.id);
    setOwnedThemesState([...owned]);
    switchTheme(theme.id);
    syncProfileToRemote(playerName);
  };

  const handleSelectAvatar = (id) => {
    setActiveAvatarState(id);
    persistAvatar(id);
    syncProfileToRemote(playerName);
  };

  const handleSelectTheme = (id) => {
    switchTheme(id);
    syncProfileToRemote(playerName);
  };

  const handleDismissBadge = () => {
    if (badgeQueueRef.current.length > 0) {
      setBadgeUnlockData({ badgeId: badgeQueueRef.current.shift() });
    } else {
      setBadgeUnlockData(null);
    }
  };
```

- [ ] **Step 6: Add PlayerHeader to HomeScreen**

In the `HomeScreen` component (around line 57), add `playerName`, `coins`, `activeAvatar`, `onAvatarPress` to its props, then replace the existing XP badge (the `hsBadge` View showing "Gesamt-XP") with:

```js
<PlayerHeader
  playerName={playerName}
  xp={xp}
  coins={coins}
  avatarId={activeAvatar}
  onAvatarPress={onAvatarPress}
/>
```

Update the HomeScreen call in the render (around line 628) to pass the new props:

```js
<HomeScreen
  onStart={start} onTopicSelect={setTopic} selectedTopic={topic}
  highScore={hs} onGames={() => setScreen('gamehub')} xp={xp}
  allQuestions={allQuestions} allTopics={allTopics}
  selectedGrade={grade} onGradeSelect={setGrade}
  selectedSemester={semester} onSemesterSelect={setSemester}
  grades={availableGrades} semesters={availableSemesters}
  playerName={playerName} coins={coins} activeAvatar={activeAvatar}
  onAvatarPress={() => setShowMeinBereich(true)}
/>
```

- [ ] **Step 7: Add MeinBereich + celebration overlays to render**

Before the closing `</View>` in App's return (before the `</ThemeProvider>`), add:

```js
      {/* Mein Bereich Hub */}
      <MeinBereich
        visible={showMeinBereich}
        onClose={() => setShowMeinBereich(false)}
        playerName={playerName}
        playerLevel={getLevel(xp)}
        coins={coins}
        activeAvatar={activeAvatar}
        ownedAvatars={ownedAvatars}
        activeTheme={themeId}
        ownedThemes={ownedThemes}
        unlockedBadgeIds={unlockedBadges}
        onSelectAvatar={handleSelectAvatar}
        onBuyAvatar={handleBuyAvatar}
        onBuyTheme={handleBuyTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Celebration Overlays */}
      <LevelUpOverlay
        visible={!!levelUpData}
        {...(levelUpData || {})}
        onDismiss={() => setLevelUpData(null)}
      />
      <BadgeUnlockOverlay
        visible={!!badgeUnlockData}
        badgeId={badgeUnlockData?.badgeId}
        onDismiss={handleDismissBadge}
      />
```

- [ ] **Step 8: Verify build**

Run: `npm run build 2>&1 | tail -10`

Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add App.js
git commit -m "feat: wire gamification into App.js — coins, avatars, badges, celebrations"
```

---

## Task 12: Leaderboard Avatar Integration

**Files:**
- Modify: `src/games/Leaderboard.js`

- [ ] **Step 1: Add avatar display to leaderboard entries**

Add import at top of `Leaderboard.js`:

```js
import AvatarDisplay from '../components/AvatarDisplay';
```

In the leaderboard row rendering, add an `<AvatarDisplay>` before the player name. The exact edit depends on the row layout — find the `<Text>` that shows `entry.name` and add `<AvatarDisplay avatarId="emoji_star" size={28} />` before it.

Note: Since leaderboard entries don't include avatar data from Supabase yet, all non-current-player entries will show the default avatar. The current player's avatar should come from the parent via a new `currentAvatar` prop.

Add `currentAvatar` prop to the Leaderboard component and use it for the current player's row.

- [ ] **Step 2: Verify leaderboard still renders**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/games/Leaderboard.js
git commit -m "feat: show avatar in leaderboard entries"
```

---

## Task 13: First-Time Experience — Welcome + Retroactive Badges

**Files:**
- Modify: `App.js` (add first-time check in startup effect)

- [ ] **Step 1: Add first-time experience logic**

Add a new useEffect in App.js for the first-time gamification experience:

```js
  // First-time gamification experience
  useEffect(() => {
    if (!playerName || !isFirstTimeGamification()) return;

    // Retroactive badge calculation
    const stats = getGameStats();
    const newBadgeIds = checkBadges(stats, []);
    if (newBadgeIds.length > 0) {
      for (const bid of newBadgeIds) {
        unlockBadge(playerName, bid);
        earnCoins(playerName, 5, 'badge_bonus');
      }
      setUnlockedBadges(newBadgeIds);
      // Show badge celebrations
      badgeQueueRef.current = [...newBadgeIds];
      setBadgeUnlockData({ badgeId: badgeQueueRef.current.shift() });
    }

    setGamificationVersion('1');
    reconcileCoins(playerName).then(bal => setCoins(bal));
  }, [playerName]);
```

Note: The retroactive badge count will only be as good as the existing stats data. Since we're adding `recordGamePlayed()` now, historical games before this update won't have stats recorded. This means the retroactive calculation starts from zero — which is fine since all players get a fresh start with the new stats tracking. Future games will accumulate stats properly.

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add App.js
git commit -m "feat: add first-time gamification experience with retroactive badges"
```

---

## Task 14: Game Result Integration — Pass Stats to handleGameXp

**Files:**
- Modify: Multiple game files (pass gameId and stats when calling onXpEarned)

Each game currently calls `onXpEarned(amount)`. We need to extend this to pass game stats. Since changing all 22 game signatures at once is risky, the approach is:

1. Make `handleGameXp` backwards-compatible (it already handles the case where extra args are undefined)
2. Update games incrementally — start with SpeedQuiz as the model, then update others

- [ ] **Step 1: Update SpeedQuiz to pass stats**

In `src/games/SpeedQuiz.js`, find the `onXpEarned` call in the finish effect and change it to:

```js
onXpEarned(Math.round(score / 10), 'speed', {
  streak: bestStreak,
  stars: percentage >= 90 ? 3 : percentage >= 60 ? 2 : percentage >= 30 ? 1 : 0,
  isSpeedQuiz: true,
});
```

(Find the exact variable names for streak and percentage in SpeedQuiz.js — they may be named `streak`/`bestStreak` and the percentage may need to be calculated from `score`/`total`.)

- [ ] **Step 2: Update remaining games similarly**

For each game, find the `onXpEarned(amount)` call and add the gameId string and relevant stats. At minimum, pass the gameId so `uniqueGamesPlayed` tracking works:

- `MemoryGame.js`: `onXpEarned(amount, 'memory', { stars: ... })`
- `MillionaireGame.js`: `onXpEarned(amount, 'millionaire', { stars: ... })`
- `TrueFalseBlitz.js`: `onXpEarned(amount, 'truefalse', { streak: bestStreak, stars: ... })`
- All other games: `onXpEarned(amount, '<gameId>', { stars: ... })`

The gameId must match the `id` field in the GAMES array in GameHub.js.

- [ ] **Step 3: Verify all games still work**

Run: `npm run build 2>&1 | tail -5`

Expected: Build succeeds. Manually test 2-3 games to verify XP + coins are awarded.

- [ ] **Step 4: Commit**

```bash
git add src/games/*.js
git commit -m "feat: pass game stats (id, streak, stars) to XP handler for badge tracking"
```

---

## Task 15: Final Build + Deploy Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build 2>&1`

Expected: Clean build, no errors or warnings.

- [ ] **Step 2: Manual smoke test checklist**

Open the app in a browser and verify:
- [ ] Home screen shows PlayerHeader with avatar, name, level, coins
- [ ] Tapping avatar opens "Mein Bereich"
- [ ] Profile tab shows owned avatars, can switch active
- [ ] Shop tab shows avatar/theme prices, can purchase
- [ ] Album tab shows badge grid with locked/unlocked
- [ ] Theme tab shows owned themes, can switch
- [ ] Playing a game awards coins (visible on result screen)
- [ ] Level-up triggers confetti + overlay
- [ ] Badge unlock triggers celebration

- [ ] **Step 3: Deploy**

Run: `npm run deploy`

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: deployment tweaks for gamification release"
```

---

## Summary

| Task | Description | New Files | Modified Files |
|------|-------------|-----------|----------------|
| 1 | Supabase schema | — | SQL only |
| 2 | Data definitions | avatars.js, themes.js, badges.js | — |
| 3 | Supabase queries | — | supabase.js |
| 4 | Coin service | coinService.js | — |
| 5 | Profile service | profileService.js | — |
| 6 | Theme context | ThemeContext.js | App.js |
| 7 | Confetti overlay | ConfettiOverlay.js | — |
| 8 | Celebrations | LevelUpOverlay.js, BadgeUnlockOverlay.js, CoinAnimation.js | SoundService.js |
| 9 | Avatar + header | AvatarDisplay.js, PlayerHeader.js | — |
| 10 | Mein Bereich hub | MeinBereich.js, ProfileTab.js, ShopTab.js, AlbumTab.js, ThemeTab.js | — |
| 11 | App.js wiring | — | App.js |
| 12 | Leaderboard avatars | — | Leaderboard.js |
| 13 | First-time experience | — | App.js |
| 14 | Game stats integration | — | All game files |
| 15 | Build + deploy | — | — |
