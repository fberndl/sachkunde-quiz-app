import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, SafeAreaView,
} from 'react-native';

const { width } = Dimensions.get('window');

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
};

const LEVELS = [
  { xp: 0,      name: 'Anfänger',           emoji: '🌱' },
  { xp: 50,     name: 'Entdecker',          emoji: '🔍' },
  { xp: 150,    name: 'Neugierig',          emoji: '🐣' },
  { xp: 300,    name: 'Schlaukopf',          emoji: '🧠' },
  { xp: 500,    name: 'Wissens-Fuchs',      emoji: '🦊' },
  { xp: 800,    name: 'Quiz-Held',          emoji: '🦸' },
  { xp: 1200,   name: 'Bücherwurm',         emoji: '📚' },
  { xp: 1700,   name: 'Sternengucker',      emoji: '⭐' },
  { xp: 2300,   name: 'Wissens-Ninja',      emoji: '🥷' },
  { xp: 3000,   name: 'Galaxie-Forscher',   emoji: '🔭' },
  { xp: 3800,   name: 'Raketenwissenschaftler', emoji: '🚀' },
  { xp: 4800,   name: 'Gehirn-Akrobat',     emoji: '🤸' },
  { xp: 6000,   name: 'Wissens-Magier',     emoji: '🧙' },
  { xp: 7500,   name: 'Super-Brain',        emoji: '💎' },
  { xp: 9500,   name: 'Quiz-Champion',      emoji: '🏆' },
  { xp: 12000,  name: 'Meister des Wissens', emoji: '👑' },
  { xp: 15000,  name: 'Wien-Experte',       emoji: '🏛️' },
  { xp: 19000,  name: 'Universum-Kenner',   emoji: '🌌' },
  { xp: 24000,  name: 'Legendäres Genie',   emoji: '🌟' },
  { xp: 30000,  name: 'Unbesiegbar',        emoji: '🔥' },
];

const LEVEL_XP = LEVELS.map(l => l.xp);

function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) return i + 1;
  }
  return 1;
}

function getLevelInfo(xp) {
  const lvl = getLevel(xp);
  return LEVELS[lvl - 1];
}

function getXpForNextLevel(xp) {
  const lvl = getLevel(xp);
  if (lvl >= LEVELS.length) return { current: xp, needed: xp, progress: 1 };
  const prev = LEVELS[lvl - 1].xp;
  const next = LEVELS[lvl] ? LEVELS[lvl].xp : prev + 5000;
  return { current: xp - prev, needed: next - prev, progress: (xp - prev) / (next - prev) };
}

const GAMES = [
  {
    id: 'memory',
    emoji: '🧠',
    name: 'Memory',
    desc: 'Finde die passenden Frage-Antwort-Paare!',
    color: '#E74C3C',
    difficulty: 1,
  },
  {
    id: 'speed',
    emoji: '⚡',
    name: 'Speed Quiz',
    desc: 'Beantworte Fragen gegen die Zeit!',
    color: '#F39C12',
    difficulty: 2,
  },
  {
    id: 'millionaire',
    emoji: '💰',
    name: 'Wer wird Millionär',
    desc: 'Erreiche die Millionen-Frage!',
    color: '#1a1a2e',
    difficulty: 3,
  },
  {
    id: 'flashcards',
    emoji: '📚',
    name: 'Flashcards',
    desc: 'Lernkarten zum Üben und Wiederholen.',
    color: '#2980B9',
    difficulty: 1,
  },
  {
    id: 'sorting',
    emoji: '🔢',
    name: 'Sortier-Challenge',
    desc: 'Bringe Fakten in die richtige Reihenfolge!',
    color: '#8E44AD',
    difficulty: 2,
  },
  {
    id: 'truefalse',
    emoji: '✅❌',
    name: 'Wahr / Falsch Blitz',
    desc: 'Schnell entscheiden: Stimmt das?',
    color: '#27AE60',
    difficulty: 2,
  },
{
    id: 'hangman',
    emoji: '🪓',
    name: 'Galgenmännchen',
    desc: 'Errate Wien-Begriffe Buchstabe für Buchstabe!',
    color: '#D35400',
    difficulty: 2,
  },
  {
    id: 'crossword',
    emoji: '📝',
    name: 'Kreuzworträtsel',
    desc: 'Löse das Wien-Kreuzworträtsel!',
    color: '#2C3E50',
    difficulty: 3,
  },
  {
    id: 'duel',
    emoji: '⚔️',
    name: 'Quiz-Duell',
    desc: 'Tritt gegen Professor Wien an!',
    color: '#8E44AD',
    difficulty: 2,
  },
  {
    id: 'bubbleblaster',
    emoji: '🫧',
    name: 'Bubble Blaster',
    desc: 'Platze die richtige Antwort-Blase!',
    color: '#0a0a2e',
    difficulty: 2,
  },
  {
    id: 'spacerunner',
    emoji: '🚀',
    name: 'Space Runner',
    desc: 'Fliege durchs All und beantworte Fragen!',
    color: '#0a0a2e',
    difficulty: 2,
  },
  {
    id: 'ringmatch',
    emoji: '🏛️',
    name: 'Ringstraße Zuordnung',
    desc: 'Ordne Gebäude den Ringstraßen-Abschnitten zu!',
    color: '#8E44AD',
    difficulty: 2,
  },
  {
    id: 'merkgeschichte',
    emoji: '📖',
    name: 'Bezirke Merkgeschichte',
    desc: 'Lerne alle 23 Bezirke mit einer Geschichte!',
    color: '#E67E22',
    difficulty: 1,
  },
  {
    id: 'twoplayermemory',
    emoji: '👥',
    name: '2-Spieler Memory',
    desc: 'Spielt Memory zu zweit!',
    color: '#2980B9',
    difficulty: 1,
  },
  {
    id: 'ringsort',
    emoji: '🔄',
    name: 'Ring-Sortierung',
    desc: 'Sortiere die 9 Ringstraßen-Abschnitte!',
    color: '#8E44AD',
    difficulty: 2,
  },
  {
    id: 'pinboard',
    emoji: '📌',
    name: 'Pinnwand',
    desc: 'Ordne Gebäude den Ringstraßen-Abschnitten zu!',
    color: '#D4A574',
    difficulty: 2,
  },
  {
    id: 'category',
    emoji: '🎯',
    name: 'Zuordnen',
    desc: 'Sortiere Begriffe in die richtige Kategorie!',
    color: '#E67E22',
    difficulty: 1,
  },
  {
    id: 'runner',
    emoji: '🏃',
    name: '3D Runner',
    desc: 'Sammle die richtige Antwort ein!',
    color: '#1a1a2e',
    difficulty: 2,
  },
];

const DIFF_LABELS = ['Leicht', 'Mittel', 'Schwer'];
const DIFF_COLORS = [C.green, C.gold, C.red];

function GameCard({ game, index, onPress }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 400, delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
    }}>
      <TouchableOpacity style={[st.card, { borderLeftColor: game.color }]} onPress={onPress} activeOpacity={0.8}>
        <View style={st.cardTop}>
          <Text style={st.cardEmoji}>{game.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.cardName}>{game.name}</Text>
            <Text style={st.cardDesc}>{game.desc}</Text>
          </View>
        </View>
        <View style={st.cardBottom}>
          <View style={st.diffRow}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[
                st.diffDot,
                { backgroundColor: i < game.difficulty ? DIFF_COLORS[game.difficulty - 1] : '#E0E0E0' },
              ]} />
            ))}
            <Text style={[st.diffLabel, { color: DIFF_COLORS[game.difficulty - 1] }]}>
              {DIFF_LABELS[game.difficulty - 1]}
            </Text>
          </View>
          <View style={[st.playBtnWrap, { backgroundColor: game.color }]}>
            <Text style={st.playBtnTxt}>Spielen ▶</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GameHub({ onSelectGame, onBack, xp }) {
  const level = getLevel(xp);
  const lvlInfo = getLevelInfo(xp);
  const { current, needed, progress } = getXpForNextLevel(xp);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const xpBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.timing(xpBarAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [xp]);

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={st.header}>
            <TouchableOpacity onPress={onBack} style={st.backBtn}>
              <Text style={st.backTxt}>← Zurück</Text>
            </TouchableOpacity>
          </View>

          <Text style={st.title}>🎮 Spielmodi</Text>
          <Text style={st.subtitle}>Wähle einen Modus und sammle XP!</Text>

          {/* XP / Level */}
          <View style={st.xpCard}>
            <View style={st.xpTop}>
              <View style={st.levelBadge}>
                <Text style={{ fontSize: 22 }}>{lvlInfo.emoji}</Text>
                <Text style={st.levelTxt}>Lv.{level}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={st.xpLabel}>{lvlInfo.name}</Text>
                <Text style={{ fontSize: 12, color: C.gray, marginBottom: 4 }}>{xp} XP gesamt</Text>
                <View style={st.xpBarBg}>
                  <Animated.View style={[st.xpBarFill, {
                    width: xpBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }]} />
                </View>
                <Text style={st.xpNext}>{current} / {needed} XP bis Level {level + 1}{level < LEVELS.length ? ` (${LEVELS[level].name})` : ''}</Text>
              </View>
            </View>
          </View>

          {/* Game Cards */}
          {GAMES.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} onPress={() => onSelectGame(game.id)} />
          ))}

          <View style={{ height: 30 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export { getLevel, getLevelInfo, getXpForNextLevel, LEVEL_XP, LEVELS };

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.light },
  wrap: { padding: 16, paddingBottom: 40 },

  header: { flexDirection: 'row', marginBottom: 8 },
  backBtn: { paddingVertical: 8, paddingRight: 16 },
  backTxt: { fontSize: 16, fontWeight: '700', color: C.blue },

  title: { fontSize: 32, fontWeight: '900', color: C.dark, textAlign: 'center' },
  subtitle: { fontSize: 15, color: C.gray, textAlign: 'center', marginBottom: 16 },

  // XP Card
  xpCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 16,
    marginBottom: 20, elevation: 4, borderWidth: 2, borderColor: '#F0F0F0',
  },
  xpTop: { flexDirection: 'row', alignItems: 'center' },
  levelBadge: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.gold, justifyContent: 'center', alignItems: 'center',
    elevation: 4,
  },
  levelTxt: { fontSize: 18, fontWeight: '900', color: C.dark },
  xpLabel: { fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 6 },
  xpBarBg: { height: 10, backgroundColor: '#E8E8E8', borderRadius: 5, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: C.gold, borderRadius: 5 },
  xpNext: { fontSize: 12, color: C.gray, marginTop: 4 },

  // Game Cards
  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 3, borderWidth: 2, borderColor: '#F0F0F0',
    borderLeftWidth: 5,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardEmoji: { fontSize: 40, marginRight: 14 },
  cardName: { fontSize: 18, fontWeight: '800', color: C.dark },
  cardDesc: { fontSize: 13, color: C.gray, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffDot: { width: 10, height: 10, borderRadius: 5 },
  diffLabel: { fontSize: 12, fontWeight: '700', marginLeft: 6 },
  playBtnWrap: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  playBtnTxt: {
    color: C.white, fontSize: 14, fontWeight: '800',
  },
});
