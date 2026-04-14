# Gamification Upgrade — Design Spec

## Context

Sachkunde quiz app for a 3rd-grade Austrian class (~20-30 children). The app already has 22 games, XP/level progression (20 levels), star ratings, streaks, sounds, and a global leaderboard. The goal is a single "wow" release that adds delight through rewards, personalization, and celebration — not to fix retention.

## Overview

Six interconnected features delivered as one update:

1. **Coin currency** — new spend-able currency alongside existing XP
2. **Avatar system** — unlockable profile images with level-gates
3. **Themes** — purchasable color schemes + background images
4. **Badge collection album** — 18 badges in 6 categories (Bronze/Silver/Gold)
5. **Celebration animations** — confetti + sound on milestones
6. **"Mein Bereich" hub** — accessible via avatar tap on home screen

---

## 1. Coin Currency (Münzen)

### Earning

| Source | Amount |
|--------|--------|
| Game completed — 3 stars | 10 coins |
| Game completed — 2 stars | 6 coins |
| Game completed — 1 star | 3 coins |
| Game completed — 0 stars | 1 coin |
| Badge unlock | +5 coins bonus |
| Level-up | +20 coins bonus |

### Spending

| Item type | Price range |
|-----------|------------|
| Avatars (illustrated characters) | 15–50 coins |
| Themes | 30–60 coins |

### Display

- Coin count shown top-right on home screen (next to XP/level)
- Animated "+X coins" counter on game result screen after each game
- In shop: price per item visible, greyed out if insufficient coins

### Persistence

- Dual-sync: LocalStorage + Supabase (same pattern as existing XP system)
- New Supabase table `player_profiles` stores all gamification state per player (keyed by `player_name`). The existing `leaderboard` table stays unchanged.
- Supabase table `coin_transactions` logs every earn/spend event:
  - `id`, `player_name` (text), `amount` (+/-), `type` (game_reward | badge_bonus | level_bonus | purchase), `item_id` (nullable), `created_at`
- `player_profiles` table has column: `coins` (integer, default 0)
- Reconciliation: `coin_transactions` table is the source of truth. On app load, sum all transactions server-side and compare with local balance. If they diverge, server wins. This correctly handles spending (where local < remote is expected after a purchase on another device).

---

## 2. Avatar System

### Free starter set

- 5–6 emoji-based avatars available to all players at no cost
- On first open after update: prompt to choose a starter avatar

### Unlockable avatars

~15 illustrated characters with Vienna/Sachkunde theme:

| Avatar | Price | Level required |
|--------|-------|----------------|
| Fiaker-Kutscherin | 15 coins | — |
| Heuriger-Koch | 15 coins | — |
| Prater-Riesenrad-Pilot | 20 coins | Level 3 |
| Schönbrunn-Löwe | 25 coins | Level 5 |
| U-Bahn-Kapitänin | 25 coins | Level 5 |
| Donau-Nixe | 30 coins | Level 7 |
| Ringstraßen-Architekt | 30 coins | Level 7 |
| Stephansdom-Wächter | 40 coins | Level 10 |
| Wiener-Sängerknabe | 40 coins | Level 10 |
| Augarten-Porzellan-Meisterin | 50 coins | Level 12 |
| ... (remaining ~5 TBD during implementation) | 30–50 coins | Level 8–15 |

Level-gate means the avatar appears in the shop but is locked ("Ab Level X") until the player reaches that level. Even after meeting the level requirement, it still costs coins to purchase.

### Where avatars appear

- Home screen: prominent, top area, tappable → opens "Mein Bereich"
- Leaderboard: next to player name (replaces current level emoji)
- Game result screen: next to score display

### Technical

- Avatars bundled as emoji/SVG/PNG assets in the app (no server download)
- Supabase `player_profiles` table stores: `active_avatar` (text), `owned_avatars` (text array)
- LocalStorage mirrors: `player_active_avatar`, `player_owned_avatars`
- Player identity: keyed by `player_name` (same as leaderboard). Name changes update both `leaderboard` and `player_profiles` in a single operation.

---

## 3. Themes

Six themes, one free (default), five purchasable:

| Theme | Price | Level gate | Description |
|-------|-------|------------|-------------|
| 🎓 Standard | free | — | Current purple gradient |
| 🚀 Weltraum | 30 coins | — | Dark background with stars, neon-blue accents |
| 🌿 Natur | 30 coins | — | Green tones, leaf silhouette background |
| 🌃 Wien bei Nacht | 40 coins | Level 8 | Dark blue, Vienna skyline silhouette, warm lantern gold |
| 🌊 Ozean | 30 coins | — | Blue wave tones, coral-orange buttons |
| 🍬 Candy | 40 coins | Level 6 | Pink pastels, playful colors, candy-red buttons |

### Technical

Each theme is a JavaScript object consumed via React Context (not CSS custom properties — the app uses React Native StyleSheet, not CSS):

```js
// Example theme object
const weltraumTheme = {
  id: 'weltraum',
  bgPrimary: '#0f0c29',
  bgSecondary: '#302b63',
  bgGradient: ['#0f0c29', '#302b63', '#24243e'],
  accent: '#00d4ff',
  accentHover: '#33ddff',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0cc',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.15)',
  buttonBg: '#00d4ff',
  buttonText: '#0f0c29',
  backgroundImage: null, // or require('./assets/themes/stars-bg.png')
};
```

- A `ThemeContext` provider wraps the app; all components read theme values via `useTheme()` hook
- Theme switch is instant (React state update, no reload)
- Supabase `player_profiles` table stores: `active_theme` (text), `owned_themes` (text array)
- LocalStorage mirrors: `player_active_theme`, `player_owned_themes`

---

## 4. Badge Collection Album (Sammelalbum)

### Categories and thresholds

| Category | Badge | Bronze | Silver | Gold |
|----------|-------|--------|--------|------|
| 🏃 Speed-König | ⚡ | 5 speed quizzes completed | 20 | 50 |
| 🏛️ Wien-Experte | 🏛️ | 5 Vienna questions correct | 25 | 100 |
| 🔥 Streak-Meister | 🔥 | 5-answer streak | 10-answer streak | 20-answer streak |
| 🎮 Spielesammler | 🎮 | 5 different games played | 15 | All 22 |
| 📚 Fleißig | 📚 | 20 rounds played | 100 | 500 |
| ⭐ Perfektionist | ⭐ | 5× three stars | 20× | 50× |

Total: 18 badges (6 categories × 3 tiers).

### Badge checking

Badges are evaluated:
- After every game completion (check all categories against current stats)
- On first app open after update (retroactive unlock based on existing play history)

### Retroactive unlock on update

When the app first loads after the update:
1. Calculate all badge thresholds against existing player stats
2. Unlock all earned badges at once
3. Show a special welcome screen: "Neues Update! Du hast X Badges verdient!" with staggered reveal animation
4. Award coin bonuses for retroactively unlocked badges

### Album UI

- Grid layout: 6 rows (categories), 3 columns (Bronze/Silver/Gold)
- Unlocked badges: full color icon + tier color border (bronze/silver/gold)
- Locked badges: "❓" icon + greyed border + unlock condition text visible
- Progress bar per category: "2/3 Badges"
- Overall progress: "12/18 Badges gesammelt"

### Persistence

- Supabase `player_badges` table: `player_name`, `badge_id` (e.g. "speed_bronze"), `unlocked_at`
- LocalStorage: `player_badges` (array of badge IDs)
- Badge check runs client-side against local stats; unlocks sync to Supabase

---

## 5. Celebration Animations

### Confetti system

- Canvas-based overlay, implemented in-app (no external package)
- Particles: ~50 colored rectangles/circles, random rotation, gravity physics
- Duration: ~2 seconds fade-out
- Reusable component: `ConfettiOverlay` triggered via ref/callback

### Level-up celebration

1. Full-width overlay banner slides down
2. New level emoji + "Level X erreicht! 🎉"
3. Confetti fires + existing fanfare sound (C5→E5→G5→C6)
4. Below: "+20 Münzen!" + list of newly available avatars/themes
5. Tap anywhere to dismiss

### Badge unlock celebration

1. Smaller centered overlay
2. Badge icon flips from ❓ to real icon (CSS 3D transform)
3. Confetti fires + existing streak sound
4. "+5 Münzen" text
5. Auto-dismiss after 2.5 seconds or tap

### Post-game coin animation

- On result screen: coin icon + counter animates from 0 to earned amount
- Integrates into existing result screen layout (below stars, above XP bar)

---

## 6. "Mein Bereich" Hub

### Navigation

```
Home Screen
├── [Avatar] [Name] [Level Badge] [🪙 123]    ← top bar, always visible
│   └── Tap avatar → "Mein Bereich" (modal/full-screen)
│       ├── Tab: Profil — name edit, avatar selection grid
│       ├── Tab: Shop — buy avatars + themes with coins
│       ├── Tab: Album — badge collection grid
│       └── Tab: Themes — preview + activate owned themes
├── [Game Grid]                                 ← unchanged
└── [Leaderboard Tab]                           ← avatars shown next to names
```

### "Mein Bereich" opens as a full-screen overlay (not a new navigation tab), dismissed with back button or X.

### Shop sub-screen

- Two sections: "Avatare" and "Themes"
- Each item shows: image/preview, name, price in coins, level requirement (if any)
- States: locked (level too low), affordable, too expensive (greyed price), owned (checkmark)
- Purchase confirmation: "Avatar X für 30 Münzen kaufen?" → Yes/No
- After purchase: brief celebration animation + item auto-equipped

### First-time experience (after update)

1. App opens → "Neues Update!" welcome overlay
2. Retroactive badge calculation runs
3. Staggered badge reveal: "Du hast X Badges verdient!" (each badge flips in with 300ms delay)
4. Coin bonus awarded for all retroactive badges
5. Prompt to pick starter avatar
6. Brief tooltip: "Tippe auf deinen Avatar um den Shop zu öffnen!"
7. Normal app usage resumes

---

## Data Model — Supabase Changes

### Existing table: `leaderboard` (unchanged)

Stays as-is: `name`, `score`, `game_mode`. No modifications.

### New table: `player_profiles`

Keyed by `player_name` (same string as `leaderboard.name`). One row per player.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid PK | gen_random_uuid() | |
| player_name | text UNIQUE | | Same as leaderboard.name |
| coins | integer | 0 | Current coin balance (cached; source of truth is coin_transactions) |
| active_avatar | text | 'emoji_default' | Currently equipped avatar ID |
| owned_avatars | text[] | '{emoji_1,...,emoji_5}' | All owned avatar IDs |
| active_theme | text | 'standard' | Currently active theme ID |
| owned_themes | text[] | '{standard}' | All owned theme IDs |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

Note: `player_name` is fragile (no auth, name-based identity). This is a known limitation matching the existing leaderboard design. If a player renames, both `leaderboard` and `player_profiles` must be updated together.

### New table: `coin_transactions`

Source of truth for coin balance. `player_profiles.coins` is a cached sum.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| player_name | text | References player_profiles.player_name |
| amount | integer | Positive = earn, negative = spend |
| type | text | game_reward, badge_bonus, level_bonus, purchase |
| item_id | text | Nullable — avatar/theme ID for purchases |
| created_at | timestamptz | DEFAULT now() |

### New table: `player_badges`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| player_name | text | References player_profiles.player_name |
| badge_id | text | e.g. "speed_bronze", "wien_gold" |
| unlocked_at | timestamptz | DEFAULT now() |

### LocalStorage keys (new)

- `player_coins` — integer
- `player_active_avatar` — string
- `player_owned_avatars` — JSON array
- `player_active_theme` — string
- `player_owned_themes` — JSON array
- `player_badges` — JSON array of badge IDs
- `gamification_version` — tracks if first-time-experience has run

---

## Asset Requirements

### Avatars
- 5–6 emoji-based starter avatars (rendered from system emoji or simple SVG outlines — no custom illustration needed)
- ~15 illustrated characters: start with emoji-based representations (e.g. 🏰 for Stephansdom-Wächter, 🧜‍♀️ for Donau-Nixe). Can be upgraded to custom SVG/PNG illustrations later without changing the system. This keeps the first release fast.
- Recommended size if custom art is added later: 128×128px, SVG preferred

### Themes
- 5 CSS variable sets
- 2–3 background SVG patterns (Weltraum stars, Natur leaves, Wien skyline)

### Badges
- 6 category icons (can reuse emojis or create simple SVGs)
- Bronze/Silver/Gold border colors: #CD7F32, #C0C0C0, #FFD700

---

## Out of Scope (future updates)

- Avatar builder/Baukasten (assemble from parts)
- Daily login streaks / daily challenges
- Friend lists / direct challenges
- Game-specific leaderboards
- Difficulty presets
- Sound packs per theme
