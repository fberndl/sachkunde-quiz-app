import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { fetchGameContent } from '../services/supabase';

const COLORS = {
  red: '#C0392B',
  gold: '#F39C12',
  blue: '#2980B9',
  green: '#27AE60',
  light: '#FFF9F5',
  white: '#FFFFFF',
  dark: '#2C3E50',
  gray: '#95A5A6',
};

const BEZIRKE = [
  { num: 1, name: 'Innere Stadt' },
  { num: 2, name: 'Leopoldstadt' },
  { num: 3, name: 'Landstraße' },
  { num: 4, name: 'Wieden' },
  { num: 5, name: 'Margareten' },
  { num: 6, name: 'Mariahilf' },
  { num: 7, name: 'Neubau' },
  { num: 8, name: 'Josefstadt' },
  { num: 9, name: 'Alsergrund' },
];

const RING_ABSCHNITTE = [
  { num: 1, name: 'Stubenring' },
  { num: 2, name: 'Parkring' },
  { num: 3, name: 'Schubertring' },
  { num: 4, name: 'Kärntner Ring' },
  { num: 5, name: 'Opernring' },
  { num: 6, name: 'Burgring' },
  { num: 7, name: 'Dr.-Karl-Renner-Ring' },
  { num: 8, name: 'Universitätsring' },
  { num: 9, name: 'Schottenring' },
  { num: 10, name: 'Franz-Josefs-Kai' },
];

const GEBAEUDE_BEZIRK = [
  { num: 1, name: 'Stephansdom', label: '1. Bezirk' },
  { num: 2, name: 'Schloss Belvedere', label: '3. Bezirk' },
  { num: 3, name: 'Haus des Meeres', label: '6. Bezirk' },
  { num: 4, name: 'Votivkirche', label: '9. Bezirk' },
  { num: 5, name: 'DC Tower 1', label: '22. Bezirk' },
];

const TURM_HOEHEN = [
  { num: 1, name: 'Nordturm (68 m)', value: 68 },
  { num: 2, name: 'Südturm (137 m)', value: 137 },
  { num: 3, name: 'DC Tower 1 (250 m)', value: 250 },
];

function generateSortingChallenges() {
  return [
    {
      title: 'Sortiere die Wiener Innenbezirke!',
      instruction: 'Bringe die Bezirke in die richtige Reihenfolge (1-9).',
      items: BEZIRKE.map(b => ({ ...b, display: b.name, solution: `${b.num}. ${b.name}` })),
      pickCount: 6,
    },
    {
      title: 'Ringstraßen-Abschnitte sortieren!',
      instruction: 'Sortiere die Abschnitte im Uhrzeigersinn (Stubenring bis Franz-Josefs-Kai).',
      items: RING_ABSCHNITTE.map(r => ({ ...r, display: r.name, solution: `${r.num}. ${r.name}` })),
      pickCount: 6,
    },
    {
      title: 'Gebäude nach Bezirksnummer sortieren!',
      instruction: 'Sortiere die Gebäude vom niedrigsten zum höchsten Bezirk.',
      items: GEBAEUDE_BEZIRK.map(g => ({ ...g, display: g.name, solution: `${g.name} (${g.label})` })),
      pickCount: 5,
    },
    {
      title: 'Türme nach Höhe sortieren!',
      instruction: 'Sortiere vom niedrigsten zum höchsten Turm.',
      items: TURM_HOEHEN.map(t => ({ ...t, display: t.name.split(' (')[0], solution: t.name })),
      pickCount: 3,
    },
  ];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mapDbRows(rows) {
  return rows.map(row => {
    const d = row.data;
    return {
      title: row.title,
      instruction: d.question,
      items: d.items,
      pickCount: d.pickCount,
    };
  });
}

export default function SortingChallenge({ questions, onBack, onXpEarned, semester }) {
  const [challenges, setChallenges] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [correctOrder, setCorrectOrder] = useState([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [resultMap, setResultMap] = useState([]);
  const [canContinue, setCanContinue] = useState(false);
  const timerRef = useRef(null);
  const xpAwardedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const allChallenges = challenges || shuffleArray(generateSortingChallenges());
  const totalRounds = allChallenges.length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchGameContent('sorting', semester);
        if (!cancelled && rows && rows.length > 0) {
          setChallenges(shuffleArray(mapDbRows(rows)));
        }
      } catch (e) {
        console.warn('Sorting content fetch error:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [semester]);

  const startRound = useCallback((idx) => {
    const challenge = allChallenges[idx];
    if (!challenge) return;
    const picked = shuffleArray(challenge.items).slice(0, challenge.pickCount);
    const sorted = [...picked].sort((a, b) => a.num - b.num);
    setCorrectOrder(sorted);
    setItems(shuffleArray(picked));
    setChecked(false);
    setResultMap([]);
    setCanContinue(false);
    setTimer(0);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [allChallenges, fadeAnim]);

  useEffect(() => {
    if (allChallenges.length > 0) startRound(0);
  }, [challenges]);

  useEffect(() => {
    if (gameOver || checked) return;
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [roundIndex, checked, gameOver]);

  useEffect(() => {
    if (gameOver && onXpEarned && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const pct = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
      const starsVal = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
      onXpEarned(score * 5, 'sorting', { stars: starsVal });
    }
  }, [gameOver, score, onXpEarned]);

  const moveItem = (index, direction) => {
    if (checked) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setItems(newItems);
  };

  const checkOrder = () => {
    clearInterval(timerRef.current);
    const results = items.map((item, i) => item.num === correctOrder[i].num);
    setResultMap(results);
    const correctCount = results.filter(Boolean).length;
    setScore(s => s + correctCount);
    setTotalPossible(tp => tp + items.length);
    setChecked(true);
    setCanContinue(false);
    setTimeout(() => setCanContinue(true), 4000);
  };

  const nextRound = () => {
    const next = roundIndex + 1;
    if (next >= totalRounds) {
      setGameOver(true);
    } else {
      setRoundIndex(next);
      startRound(next);
    }
  };

  const restart = () => {
    setScore(0);
    setTotalPossible(0);
    setRoundIndex(0);
    setGameOver(false);
    xpAwardedRef.current = false;
    startRound(0);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (gameOver) {
    const pct = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Sortier-Challenge beendet!</Text>
          <Text style={styles.starRow}>
            {[1, 2, 3].map(i => (
              <Text key={i} style={[styles.star, i <= stars ? styles.starFilled : styles.starEmpty]}>
                {'\u2605'}
              </Text>
            ))}
          </Text>
          <Text style={styles.resultScore}>{score} / {totalPossible} richtig</Text>
          <Text style={styles.resultPct}>{pct}%</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{score * 5} XP verdient!
          </Text>
          <Text style={styles.resultMsg}>
            {pct >= 90 ? 'Ausgezeichnet! Du bist ein Sortier-Profi!' :
             pct >= 60 ? 'Gut gemacht! Weiter so!' :
             pct >= 30 ? 'Nicht schlecht, übe weiter!' :
             'Versuch es nochmal!'}
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={restart}>
            <Text style={styles.btnPrimaryText}>Nochmal spielen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onBack}>
            <Text style={styles.btnSecondaryText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const challenge = allChallenges[roundIndex];
  const allCorrect = resultMap.length > 0 && resultMap.every(Boolean);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'} Zurück</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerStat}>Runde {roundIndex + 1}/{totalRounds}</Text>
          <Text style={styles.headerStat}>{'\u23F1'} {formatTime(timer)}</Text>
          <Text style={styles.headerStat}>Punkte: {score}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeInstruction}>{challenge.instruction}</Text>

          <View style={styles.itemList}>
            {items.map((item, index) => {
              const isCorrect = resultMap[index] === true;
              const isWrong = resultMap[index] === false;
              return (
                <View
                  key={item.num + '-' + item.name}
                  style={[
                    styles.itemRow,
                    isCorrect && styles.itemCorrect,
                    isWrong && styles.itemWrong,
                  ]}
                >
                  <View style={styles.itemIndex}>
                    <Text style={styles.itemIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={[
                    styles.itemText,
                    isCorrect && styles.itemTextCorrect,
                    isWrong && styles.itemTextWrong,
                  ]}>{checked ? item.solution : item.display}</Text>
                  {!checked && (
                    <View style={styles.arrowBtns}>
                      <TouchableOpacity
                        onPress={() => moveItem(index, -1)}
                        style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                        disabled={index === 0}
                      >
                        <Text style={styles.arrowText}>{'\u25B2'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveItem(index, 1)}
                        style={[styles.arrowBtn, index === items.length - 1 && styles.arrowBtnDisabled]}
                        disabled={index === items.length - 1}
                      >
                        <Text style={styles.arrowText}>{'\u25BC'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {checked && (
                    <Text style={styles.checkMark}>
                      {isCorrect ? '\u2713' : '\u2717'}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {checked && !allCorrect && (
            <View style={styles.solutionBox}>
              <Text style={styles.solutionTitle}>Richtige Reihenfolge:</Text>
              {correctOrder.map((item, i) => (
                <Text key={i} style={styles.solutionItem}>
                  {i + 1}. {item.solution}
                </Text>
              ))}
            </View>
          )}

          {checked && allCorrect && (
            <View style={[styles.solutionBox, { backgroundColor: '#E8F8F0' }]}>
              <Text style={[styles.solutionTitle, { color: COLORS.green }]}>
                Perfekt! Alles richtig!
              </Text>
            </View>
          )}

          {!checked ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={checkOrder}>
              <Text style={styles.btnPrimaryText}>Überprüfen</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnPrimary, !canContinue && { opacity: 0.4 }]}
              onPress={nextRound}
              disabled={!canContinue}
            >
              <Text style={styles.btnPrimaryText}>
                {canContinue
                  ? (roundIndex + 1 >= totalRounds ? 'Ergebnis anzeigen' : 'Nächste Runde')
                  : 'Lösung lesen...'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.dark,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerStat: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  challengeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  challengeInstruction: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  itemList: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemCorrect: {
    borderColor: COLORS.green,
    backgroundColor: '#E8F8F0',
  },
  itemWrong: {
    borderColor: COLORS.red,
    backgroundColor: '#FDEDEC',
  },
  itemIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIndexText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  itemTextCorrect: {
    color: COLORS.green,
  },
  itemTextWrong: {
    color: COLORS.red,
  },
  arrowBtns: {
    flexDirection: 'column',
    marginLeft: 8,
  },
  arrowBtn: {
    backgroundColor: COLORS.blue,
    width: 32,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  arrowBtnDisabled: {
    backgroundColor: '#D5D8DC',
  },
  arrowText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  checkMark: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  solutionBox: {
    backgroundColor: '#FEF9E7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  solutionItem: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 2,
  },
  btnPrimary: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.blue,
    marginTop: 8,
  },
  btnSecondaryText: {
    color: COLORS.blue,
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.light,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  starRow: {
    fontSize: 40,
    marginBottom: 16,
  },
  star: {
    fontSize: 40,
  },
  starFilled: {
    color: COLORS.gold,
  },
  starEmpty: {
    color: '#D5D8DC',
  },
  resultScore: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  resultPct: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.blue,
    marginBottom: 12,
  },
  resultMsg: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
});
