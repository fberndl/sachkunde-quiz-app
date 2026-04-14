import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView, ScrollView,
} from 'react-native';
import SoundService from '../utils/SoundService';
import { fetchGameContent } from '../services/supabase';

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
};

const FALLBACK_CHALLENGES = [
  // Sommersemester
  {
    semester: 'Sommersemester',
    name: 'Innenbezirke oder Außenbezirke?',
    left: 'Innenbezirk (1-9)',
    right: 'Außenbezirk (10-23)',
    items: [
      { text: 'Innere Stadt', cat: 'l' },
      { text: 'Favoriten', cat: 'r' },
      { text: 'Leopoldstadt', cat: 'l' },
      { text: 'Hietzing', cat: 'r' },
      { text: 'Mariahilf', cat: 'l' },
      { text: 'Floridsdorf', cat: 'r' },
      { text: 'Josefstadt', cat: 'l' },
      { text: 'Donaustadt', cat: 'r' },
    ],
  },
  {
    semester: 'Sommersemester',
    name: 'Gesteinsplanet oder Gasplanet?',
    left: 'Gesteinsplanet',
    right: 'Gasplanet',
    items: [
      { text: 'Merkur', cat: 'l' },
      { text: 'Jupiter', cat: 'r' },
      { text: 'Venus', cat: 'l' },
      { text: 'Saturn', cat: 'r' },
      { text: 'Erde', cat: 'l' },
      { text: 'Uranus', cat: 'r' },
      { text: 'Mars', cat: 'l' },
      { text: 'Neptun', cat: 'r' },
    ],
  },
  {
    semester: 'Sommersemester',
    name: 'Ringstraße oder nicht?',
    left: 'Am Ring',
    right: 'Nicht am Ring',
    items: [
      { text: 'Staatsoper', cat: 'l' },
      { text: 'Schönbrunn', cat: 'r' },
      { text: 'Parlament', cat: 'l' },
      { text: 'Prater', cat: 'r' },
      { text: 'Rathaus', cat: 'l' },
      { text: 'Donauturm', cat: 'r' },
      { text: 'Universität', cat: 'l' },
      { text: 'Naschmarkt', cat: 'r' },
    ],
  },
  {
    semester: 'Sommersemester',
    name: 'Stern oder Planet?',
    left: 'Stern',
    right: 'Planet',
    items: [
      { text: 'Sonne', cat: 'l' },
      { text: 'Mars', cat: 'r' },
      { text: 'Polarstern', cat: 'l' },
      { text: 'Jupiter', cat: 'r' },
      { text: 'Sirius', cat: 'l' },
      { text: 'Venus', cat: 'r' },
      { text: 'Rigel', cat: 'l' },
      { text: 'Saturn', cat: 'r' },
    ],
  },
  // Wintersemester
  {
    semester: 'Wintersemester',
    name: 'Leitet Strom oder nicht?',
    left: 'Leiter',
    right: 'Nichtleiter',
    items: [
      { text: 'Metall', cat: 'l' },
      { text: 'Plastik', cat: 'r' },
      { text: 'Kupfer', cat: 'l' },
      { text: 'Holz', cat: 'r' },
      { text: 'Eisen', cat: 'l' },
      { text: 'Gummi', cat: 'r' },
      { text: 'Gold', cat: 'l' },
      { text: 'Glas', cat: 'r' },
    ],
  },
  {
    semester: 'Wintersemester',
    name: 'Aggregatzustand von Wasser?',
    left: 'Fest (Eis)',
    right: 'Flüssig/Gasförmig',
    items: [
      { text: 'Eiswürfel', cat: 'l' },
      { text: 'Wasserdampf', cat: 'r' },
      { text: 'Schnee', cat: 'l' },
      { text: 'Regen', cat: 'r' },
      { text: 'Hagel', cat: 'l' },
      { text: 'Nebel', cat: 'r' },
      { text: 'Gletscher', cat: 'l' },
      { text: 'Tau', cat: 'r' },
    ],
  },
  {
    semester: 'Wintersemester',
    name: 'Floridsdorfer Bezirksteil?',
    left: 'Gehört dazu',
    right: 'Gehört nicht dazu',
    items: [
      { text: 'Stammersdorf', cat: 'l' },
      { text: 'Ottakring', cat: 'r' },
      { text: 'Jedlesee', cat: 'l' },
      { text: 'Simmering', cat: 'r' },
      { text: 'Leopoldau', cat: 'l' },
      { text: 'Hernals', cat: 'r' },
      { text: 'Strebersdorf', cat: 'l' },
      { text: 'Döbling', cat: 'r' },
    ],
  },
  {
    semester: 'Wintersemester',
    name: 'Gewässer in Wien?',
    left: 'Wiener Gewässer',
    right: 'Nicht in Wien',
    items: [
      { text: 'Donau', cat: 'l' },
      { text: 'Rhein', cat: 'r' },
      { text: 'Donaukanal', cat: 'l' },
      { text: 'Bodensee', cat: 'r' },
      { text: 'Alte Donau', cat: 'l' },
      { text: 'Neusiedler See', cat: 'r' },
      { text: 'Wienfluss', cat: 'l' },
      { text: 'Salzach', cat: 'r' },
    ],
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CategoryGame({ onBack, onXpEarned, semester }) {
  const [allChallenges, setAllChallenges] = useState(FALLBACK_CHALLENGES);

  useEffect(() => {
    fetchGameContent('category', semester).then(rows => {
      if (rows.length > 0) {
        const mapped = rows.map(r => ({
          semester: r.semester,
          name: r.title,
          left: r.data.left,
          right: r.data.right,
          items: r.data.items,
        }));
        setAllChallenges(mapped);
      }
    });
  }, [semester]);

  const CHALLENGES = allChallenges.filter(c =>
    !semester || semester === 'Alle' || c.semester === semester
  );
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [items, setItems] = useState(() => shuffle((CHALLENGES[0] || FALLBACK_CHALLENGES[0]).items));
  const [selectedItem, setSelectedItem] = useState(null);
  const [leftBucket, setLeftBucket] = useState([]);
  const [rightBucket, setRightBucket] = useState([]);
  const [flashState, setFlashState] = useState(null); // { index, result: 'correct'|'wrong' }
  const [wrongAttempts, setWrongAttempts] = useState({}); // { itemText: true } if they got it wrong
  const [roundDone, setRoundDone] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScores, setRoundScores] = useState([]);

  const xpAwardedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const leftFlash = useRef(new Animated.Value(0)).current;
  const rightFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  // Reset game when challenges load from DB
  useEffect(() => {
    if (CHALLENGES.length > 0) {
      setChallengeIdx(0);
      setItems(shuffle(CHALLENGES[0].items));
      setSelectedItem(null);
      setLeftBucket([]);
      setRightBucket([]);
      setFlashState(null);
      setWrongAttempts({});
      setRoundDone(false);
      setRoundScore(0);
      setAllDone(false);
      setTotalScore(0);
      setRoundScores([]);
      xpAwardedRef.current = false;
    }
  }, [allChallenges]);

  const challenge = CHALLENGES[challengeIdx];

  const unsortedItems = items.filter(
    (it) => !leftBucket.includes(it.text) && !rightBucket.includes(it.text)
  );

  const handleSelectItem = useCallback((itemText) => {
    if (flashState) return;
    setSelectedItem((prev) => (prev === itemText ? null : itemText));
  }, [flashState]);

  const flashColumn = useCallback((side, success) => {
    const anim = side === 'l' ? leftFlash : rightFlash;
    anim.setValue(success ? 1 : -1);
    Animated.timing(anim, {
      toValue: 0, duration: 500, useNativeDriver: false,
    }).start();
  }, [leftFlash, rightFlash]);

  const handleAssign = useCallback((side) => {
    if (!selectedItem || flashState) return;

    const item = items.find((it) => it.text === selectedItem);
    if (!item) return;

    const isCorrect = item.cat === side;

    if (isCorrect) {
      SoundService.correct();
      flashColumn(side, true);
      if (side === 'l') {
        setLeftBucket((prev) => [...prev, item.text]);
      } else {
        setRightBucket((prev) => [...prev, item.text]);
      }
      setSelectedItem(null);
      setFlashState({ text: item.text, result: 'correct' });
      setTimeout(() => setFlashState(null), 400);
    } else {
      SoundService.wrong();
      flashColumn(side, false);
      setWrongAttempts((prev) => ({ ...prev, [item.text]: true }));
      setFlashState({ text: item.text, result: 'wrong' });
      setTimeout(() => {
        setFlashState(null);
        setSelectedItem(null);
      }, 600);
    }
  }, [selectedItem, flashState, items, flashColumn]);

  // Check if round is complete
  useEffect(() => {
    if (leftBucket.length + rightBucket.length === items.length && items.length > 0 && !roundDone) {
      const correctFirst = items.filter((it) => !wrongAttempts[it.text]).length;
      setRoundScore(correctFirst);
      setRoundDone(true);
      SoundService.success();
    }
  }, [leftBucket, rightBucket, items, wrongAttempts, roundDone]);

  const handleNextRound = useCallback(() => {
    const nextIdx = challengeIdx + 1;
    const newScores = [...roundScores, roundScore];
    setRoundScores(newScores);

    if (nextIdx >= CHALLENGES.length) {
      const total = newScores.reduce((a, b) => a + b, 0);
      setTotalScore(total);
      setAllDone(true);

      if (!xpAwardedRef.current && onXpEarned) {
        xpAwardedRef.current = true;
        const maxScore = CHALLENGES.reduce((sum, ch) => sum + ch.items.length, 0);
        const pctVal = maxScore > 0 ? Math.round((total / maxScore) * 100) : 0;
        const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
        onXpEarned(total * 3, 'category', { stars: starsVal });
      }
    } else {
      setChallengeIdx(nextIdx);
      setItems(shuffle(CHALLENGES[nextIdx].items));
      setSelectedItem(null);
      setLeftBucket([]);
      setRightBucket([]);
      setFlashState(null);
      setWrongAttempts({});
      setRoundDone(false);
      setRoundScore(0);
    }
  }, [challengeIdx, roundScore, roundScores, onXpEarned]);

  const getColumnBg = (flashAnim) => {
    return flashAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['rgba(192,57,43,0.15)', 'transparent', 'rgba(39,174,96,0.15)'],
    });
  };

  const totalItems = CHALLENGES.reduce((sum, ch) => sum + ch.items.length, 0);

  // ── Final results screen ──
  if (allDone) {
    const maxScore = totalItems;
    const pct = Math.round((totalScore / maxScore) * 100);
    const xp = totalScore * 3;
    let emoji, msg;
    if (pct === 100) { emoji = '🏆'; msg = 'Perfekt! Alle richtig beim ersten Versuch!'; }
    else if (pct >= 75) { emoji = '🌟'; msg = 'Sehr gut gemacht!'; }
    else if (pct >= 50) { emoji = '👍'; msg = 'Gut, aber da geht noch mehr!'; }
    else { emoji = '💪'; msg = 'Weiter üben, du schaffst das!'; }

    return (
      <SafeAreaView style={st.safe}>
        <Animated.View style={[st.container, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={st.scrollContent}>
            <Text style={st.bigEmoji}>{emoji}</Text>
            <Text style={st.title}>Alle Runden geschafft!</Text>
            <Text style={st.subtitle}>{msg}</Text>

            <View style={st.statsBox}>
              <Text style={st.statLabel}>Gesamt richtig (1. Versuch)</Text>
              <Text style={st.statValue}>{totalScore} / {maxScore}</Text>
              <Text style={st.statLabel}>XP verdient</Text>
              <Text style={[st.statValue, { color: C.gold }]}>+{xp} XP</Text>
            </View>

            <View style={st.roundSummary}>
              {CHALLENGES.map((ch, i) => (
                <View key={i} style={st.roundRow}>
                  <Text style={st.roundName} numberOfLines={1}>{ch.name}</Text>
                  <Text style={st.roundResult}>{roundScores[i]} / {ch.items.length}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={st.btn} onPress={onBack}>
              <Text style={st.btnText}>Zurück</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Round results screen ──
  if (roundDone) {
    return (
      <SafeAreaView style={st.safe}>
        <Animated.View style={[st.container, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={st.scrollContent}>
            <Text style={st.bigEmoji}>{roundScore === items.length ? '🎉' : '👏'}</Text>
            <Text style={st.title}>Runde {challengeIdx + 1} geschafft!</Text>
            <Text style={st.subtitle}>{challenge.name}</Text>

            <View style={st.statsBox}>
              <Text style={st.statLabel}>Richtig beim 1. Versuch</Text>
              <Text style={st.statValue}>{roundScore} / {items.length}</Text>
            </View>

            <TouchableOpacity style={st.btn} onPress={handleNextRound}>
              <Text style={st.btnText}>
                {challengeIdx + 1 < CHALLENGES.length ? 'Nächste Runde' : 'Ergebnis anzeigen'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Gameplay screen ──
  return (
    <SafeAreaView style={st.safe}>
      <Animated.View style={[st.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={onBack} style={st.backBtn}>
            <Text style={st.backText}>← Zurück</Text>
          </TouchableOpacity>
          <Text style={st.roundLabel}>Runde {challengeIdx + 1} / {CHALLENGES.length}</Text>
        </View>

        <Text style={st.challengeName}>{challenge.name}</Text>

        <ScrollView contentContainerStyle={st.scrollContent}>
          {/* Category columns */}
          <View style={st.columns}>
            {/* Left column */}
            <TouchableOpacity
              style={st.columnTouch}
              activeOpacity={0.7}
              onPress={() => handleAssign('l')}
            >
              <Animated.View style={[
                st.column,
                { backgroundColor: getColumnBg(leftFlash) },
                selectedItem && st.columnActive,
              ]}>
                <Text style={st.columnLabel}>{challenge.left}</Text>
                <View style={st.bucketItems}>
                  {leftBucket.map((t) => (
                    <View key={t} style={st.bucketItem}>
                      <Text style={st.bucketItemText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </TouchableOpacity>

            {/* Right column */}
            <TouchableOpacity
              style={st.columnTouch}
              activeOpacity={0.7}
              onPress={() => handleAssign('r')}
            >
              <Animated.View style={[
                st.column,
                { backgroundColor: getColumnBg(rightFlash) },
                selectedItem && st.columnActive,
              ]}>
                <Text style={st.columnLabel}>{challenge.right}</Text>
                <View style={st.bucketItems}>
                  {rightBucket.map((t) => (
                    <View key={t} style={st.bucketItem}>
                      <Text style={st.bucketItemText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Unsorted item cards */}
          {unsortedItems.length > 0 && (
            <View style={st.itemsArea}>
              <Text style={st.hint}>
                {selectedItem ? 'Tippe auf eine Kategorie oben!' : 'Wähle einen Begriff:'}
              </Text>
              <View style={st.itemsGrid}>
                {unsortedItems.map((it) => {
                  const isSelected = selectedItem === it.text;
                  const isFlashCorrect = flashState?.text === it.text && flashState.result === 'correct';
                  const isFlashWrong = flashState?.text === it.text && flashState.result === 'wrong';

                  return (
                    <TouchableOpacity
                      key={it.text}
                      style={[
                        st.itemCard,
                        isSelected && st.itemSelected,
                        isFlashCorrect && st.itemCorrect,
                        isFlashWrong && st.itemWrong,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectItem(it.text)}
                    >
                      <Text style={[
                        st.itemText,
                        isSelected && st.itemTextSelected,
                      ]}>{it.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.light,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: C.blue,
    fontWeight: '600',
  },
  roundLabel: {
    fontSize: 14,
    color: C.gray,
    fontWeight: '600',
  },
  challengeName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.dark,
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  columns: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 10,
  },
  columnTouch: {
    flex: 1,
  },
  column: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.gray,
    borderRadius: 14,
    minHeight: 160,
    padding: 10,
    alignItems: 'center',
  },
  columnActive: {
    borderColor: C.blue,
    borderWidth: 2.5,
  },
  columnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: C.dark,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  bucketItems: {
    width: '100%',
    gap: 6,
  },
  bucketItem: {
    backgroundColor: '#D5F5E3',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.green,
  },
  bucketItemText: {
    fontSize: 13,
    color: C.dark,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemsArea: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  hint: {
    fontSize: 14,
    color: C.gray,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  itemCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minWidth: 120,
    alignItems: 'center',
  },
  itemSelected: {
    borderColor: C.blue,
    backgroundColor: '#EBF5FB',
    shadowOpacity: 0.12,
  },
  itemCorrect: {
    borderColor: C.green,
    backgroundColor: '#D5F5E3',
  },
  itemWrong: {
    borderColor: C.red,
    backgroundColor: '#FADBD8',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.dark,
  },
  itemTextSelected: {
    color: C.blue,
  },
  // ── Results screens ──
  bigEmoji: {
    fontSize: 60,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: C.gray,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: C.gray,
    fontWeight: '600',
    marginTop: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: C.dark,
    marginBottom: 4,
  },
  roundSummary: {
    marginHorizontal: 30,
    marginBottom: 24,
    backgroundColor: C.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  roundName: {
    fontSize: 13,
    color: C.dark,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  roundResult: {
    fontSize: 14,
    fontWeight: '700',
    color: C.green,
  },
  btn: {
    backgroundColor: C.blue,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginHorizontal: 40,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  btnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
