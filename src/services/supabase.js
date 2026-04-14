import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://buxlrrbfmuhuollvcdzv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AXrIJGR6VRYmIzdftLn3xQ_2E6v1g2J';

const supabase = (SUPABASE_URL !== 'DEINE_SUPABASE_URL')
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Aktualisiert die Gesamt-XP eines Spielers im Leaderboard
export async function syncXp(name, totalXp) {
  if (!supabase || !name) return null;
  const { data, error } = await supabase
    .from('leaderboard')
    .upsert([{ name, score: totalXp, game_mode: 'XP' }], { onConflict: 'name' })
    .select();
  if (error) console.warn('Leaderboard sync error:', error.message);
  return data;
}

export async function renamePlayer(oldName, newName) {
  if (!supabase || !oldName || !newName) return false;
  const { error } = await supabase
    .from('leaderboard')
    .update({ name: newName })
    .eq('name', oldName);
  if (error) { console.warn('Rename error:', error.message); return false; }
  return true;
}

export async function getLeaderboard(limit = 30) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) { console.warn('Leaderboard fetch error:', error.message); return []; }
  return data || [];
}

export async function fetchXp(name) {
  if (!supabase || !name) return null;
  const { data, error } = await supabase
    .from('leaderboard')
    .select('score')
    .eq('name', name)
    .single();
  if (error || !data) return null;
  return data.score;
}

// --- Question CRUD ---

export async function fetchQuestions() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('topic')
    .order('id');
  if (error) { console.warn('Questions fetch error:', error.message); return []; }
  return (data || []).map(row => {
    const q = { ...row, imageHint: row.image_hint };
    delete q.image_hint;
    if (!q.image) delete q.image;
    if (!q.hint) delete q.hint;
    if (!q.imageHint) delete q.imageHint;
    if (!q.blanks || q.blanks.length === 0) delete q.blanks;
    return q;
  });
}

export async function saveQuestion(q) {
  if (!supabase) return null;
  const row = {
    topic: q.topic,
    type: q.type,
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    blanks: q.blanks,
    hint: q.hint,
    image: q.image,
    image_hint: q.imageHint,
    grade: q.grade || 3,
    semester: q.semester || 'Sommersemester',
  };
  if (q.id) row.id = q.id;
  const { data, error } = await supabase
    .from('questions')
    .upsert([row])
    .select()
    .single();
  if (error) { console.warn('Question save error:', error.message); return null; }
  return data;
}

export async function deleteQuestion(id) {
  if (!supabase) return false;
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) { console.warn('Question delete error:', error.message); return false; }
  return true;
}

export async function fetchGameContent(game, semester) {
  if (!supabase) return [];
  let query = supabase.from('game_content').select('*').eq('game', game);
  if (semester && semester !== 'Alle') query = query.eq('semester', semester);
  const { data, error } = await query.order('id');
  if (error) { console.warn('Game content fetch error:', error.message); return []; }
  return data || [];
}

export async function submitFeedback(playerName, category, message) {
  if (!supabase || !playerName || !message) return null;
  const { data, error } = await supabase
    .from('feedback')
    .insert([{ player_name: playerName, category, message }])
    .select();
  if (error) console.warn('Feedback error:', error.message);
  return data;
}

export function isConfigured() {
  return supabase !== null;
}

// --- Player Profile ---

export async function getOrCreateProfile(playerName) {
  if (!supabase || !playerName) return null;
  // Try to fetch existing
  const { data } = await supabase
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
