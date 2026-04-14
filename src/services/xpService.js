import { syncXp, fetchXp } from './supabase';

// --- LocalStorage helpers ---

function getLocalXp() {
  try {
    return parseInt(localStorage.getItem('sachkunde_xp') || '0', 10) || 0;
  } catch (e) {
    return 0;
  }
}

function setLocalXp(xp) {
  try {
    localStorage.setItem('sachkunde_xp', String(xp));
  } catch (e) {
    // localStorage unavailable (SSR, private browsing quota, etc.) — silently ignore
  }
}

function getLocalName() {
  try {
    return localStorage.getItem('sachkunde_name') || '';
  } catch (e) {
    return '';
  }
}

function setLocalName(name) {
  try {
    localStorage.setItem('sachkunde_name', name);
  } catch (e) {
    // silently ignore
  }
}

function getLocalHighscore() {
  try {
    return parseInt(localStorage.getItem('sachkunde_hs') || '0', 10) || 0;
  } catch (e) {
    return 0;
  }
}

function setLocalHighscore(hs) {
  try {
    localStorage.setItem('sachkunde_hs', String(hs));
  } catch (e) {
    // silently ignore
  }
}

// --- XP Sync (the critical function) ---
// This is the main fix. The problem was stale closures — syncXp was called with old xp values.
// Now we have a single source of truth: localStorage is always read fresh, never from a closure.

async function reconcileXp(playerName) {
  // Cloud (Supabase) ist die Quelle der Wahrheit.
  // Bei Netzwerkfehler: lokalen Wert behalten.
  const localXp = getLocalXp();

  let remote = null;
  try {
    remote = await fetchXp(playerName);
  } catch (e) {
    // Network error — keep local value
    return localXp;
  }

  if (remote !== null) {
    // Cloud hat Vorrang — lokal übernehmen
    setLocalXp(remote);
    return remote;
  }

  // Spieler existiert noch nicht in der Cloud — lokal hochsynchen
  try {
    await syncXp(playerName, localXp);
  } catch (e) {}

  return localXp;
}

async function addAndSyncXp(playerName, amount) {
  // Adds XP locally AND syncs to Supabase in one atomic operation.
  // Reads current XP fresh from localStorage to prevent stale closure issues.
  const current = getLocalXp();
  const newXp = current + amount;
  setLocalXp(newXp);

  if (playerName) {
    // Don't await — fire and forget to not block UI
    syncXp(playerName, newXp).catch(() => {});
  }

  return newXp;
}

export {
  getLocalXp,
  setLocalXp,
  getLocalName,
  setLocalName,
  getLocalHighscore,
  setLocalHighscore,
  reconcileXp,
  addAndSyncXp,
};
