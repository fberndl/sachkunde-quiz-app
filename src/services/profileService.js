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
