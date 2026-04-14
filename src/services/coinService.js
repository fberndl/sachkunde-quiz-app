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
// Synchronous local update — safe for rapid sequential calls.
function earnCoins(playerName, amount, type = 'game_reward', itemId = null) {
  const newBalance = getLocalCoins() + amount;
  setLocalCoins(newBalance);

  // Async remote sync — fire and forget
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
