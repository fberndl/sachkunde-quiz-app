import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Dimensions, SafeAreaView } from 'react-native';
import SoundService from '../utils/SoundService';
import { fetchGameContent } from '../services/supabase';

const { width } = Dimensions.get('window');

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
};

const CORK = '#D4A574';
const CORK_DARK = '#B8895A';
const PIN_RED = '#E74C3C';

const FALLBACK_ASSIGNMENTS = [
  { building: 'Staatsoper', section: 'Opernring', emoji: '🎭' },
  { building: 'Parlament', section: 'Dr.-Karl-Renner-Ring', emoji: '🏛️' },
  { building: 'Rathaus', section: 'Universitätsring', emoji: '🏰' },
  { building: 'Burgtheater', section: 'Universitätsring', emoji: '🎪' },
  { building: 'Kunsthist. Museum', section: 'Burgring', emoji: '🖼️' },
  { building: 'Naturhist. Museum', section: 'Burgring', emoji: '🦕' },
  { building: 'Universität Wien', section: 'Universitätsring', emoji: '🎓' },
  { building: 'Stadtpark', section: 'Parkring', emoji: '🌳' },
  { building: 'Börse', section: 'Schottenring', emoji: '📈' },
  { building: 'Votivkirche', section: 'Schottenring', emoji: '⛪' },
  { building: 'MAK', section: 'Stubenring', emoji: '🎨' },
  { building: 'Postsparkasse', section: 'Stubenring', emoji: '🏦' },
];

const BUILDINGS_PER_ROUND = 6;
const TOTAL_ROUNDS = 2;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRoundBuildings(usedIndices, assignments) {
  const available = assignments.map((a, i) => i).filter(i => !usedIndices.includes(i));
  const shuffled = shuffleArray(available);
  return shuffled.slice(0, BUILDINGS_PER_ROUND);
}

function getSectionsForRound(buildingIndices, assignments) {
  const sectionSet = new Set();
  buildingIndices.forEach(i => sectionSet.add(assignments[i].section));
  return Array.from(sectionSet);
}

export default function PinboardGame({ onBack, onXpEarned, semester }) {
  const [ASSIGNMENTS, setAssignments] = useState(FALLBACK_ASSIGNMENTS);
  const [round, setRound] = useState(1);
  const [roundBuildings, setRoundBuildings] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [matched, setMatched] = useState([]);
  const [firstTryTracker, setFirstTryTracker] = useState({});
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [flashState, setFlashState] = useState(null); // { section, type: 'correct'|'wrong' }
  const [sectionPinned, setSectionPinned] = useState({}); // section -> [{ building, emoji }]
  const [phase, setPhase] = useState('play'); // 'play' | 'roundEnd' | 'results'
  const [usedIndices, setUsedIndices] = useState([]);

  const xpAwardedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef({}).current;
  const bounceAnims = useRef({}).current;

  const initRound = useCallback((roundNum, prevUsed) => {
    const indices = pickRoundBuildings(prevUsed, ASSIGNMENTS);
    const secs = getSectionsForRound(indices, ASSIGNMENTS);
    setRoundBuildings(shuffleArray(indices));
    setSections(shuffleArray(secs));
    setSelectedBuilding(null);
    setMatched([]);
    setFirstTryTracker({});
    setSectionPinned({});
    setFlashState(null);
    setPhase('play');

    // Reset card animations
    indices.forEach(i => {
      if (!cardAnims[i]) cardAnims[i] = new Animated.Value(0);
      else cardAnims[i].setValue(0);
      if (!bounceAnims[i]) bounceAnims[i] = new Animated.Value(1);
      else bounceAnims[i].setValue(1);
    });

    // Animate cards in
    Animated.stagger(80, indices.map(i =>
      Animated.spring(cardAnims[i], { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 })
    )).start();

    return indices;
  }, [cardAnims, bounceAnims, ASSIGNMENTS]);

  useEffect(() => {
    fetchGameContent('pinboard', semester).then(rows => {
      if (rows.length > 0 && rows[0].data?.assignments) {
        setAssignments(rows[0].data.assignments);
      }
    });
  }, [semester]);

  useEffect(() => {
    const indices = initRound(1, []);
    setUsedIndices(indices);

    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [ASSIGNMENTS]);

  const handleBuildingTap = useCallback((idx) => {
    if (matched.includes(idx)) return;
    SoundService.click();
    setSelectedBuilding(prev => prev === idx ? null : idx);
  }, [matched]);

  const handleSectionTap = useCallback((section) => {
    if (selectedBuilding === null) return;

    const assignment = ASSIGNMENTS[selectedBuilding];
    const isCorrect = assignment.section === section;

    if (isCorrect) {
      SoundService.correct();
      setFlashState({ section, type: 'correct' });

      // Track first try
      const wasFirstTry = !firstTryTracker[selectedBuilding];
      if (wasFirstTry) {
        setCorrectFirstTry(prev => prev + 1);
      }
      setFirstTryTracker(prev => ({ ...prev, [selectedBuilding]: true }));
      setTotalCorrect(prev => prev + 1);

      // Pin the building to the section
      setSectionPinned(prev => ({
        ...prev,
        [section]: [...(prev[section] || []), { building: assignment.building, emoji: assignment.emoji }],
      }));

      // Animate matched card
      const newMatched = [...matched, selectedBuilding];
      setMatched(newMatched);
      setSelectedBuilding(null);

      // Check round complete
      if (newMatched.length === BUILDINGS_PER_ROUND) {
        setTimeout(() => {
          SoundService.success();
          if (round < TOTAL_ROUNDS) {
            setPhase('roundEnd');
          } else {
            setPhase('results');
          }
        }, 600);
      }
    } else {
      SoundService.wrong();
      setFlashState({ section, type: 'wrong' });
      setFirstTryTracker(prev => ({ ...prev, [selectedBuilding]: false }));

      // Bounce animation
      const ba = bounceAnims[selectedBuilding];
      if (ba) {
        Animated.sequence([
          Animated.timing(ba, { toValue: 1.15, duration: 100, useNativeDriver: true }),
          Animated.timing(ba, { toValue: 0.9, duration: 100, useNativeDriver: true }),
          Animated.timing(ba, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }

      setSelectedBuilding(null);
    }

    setTimeout(() => setFlashState(null), 500);
  }, [selectedBuilding, matched, firstTryTracker, round, bounceAnims]);

  const handleNextRound = useCallback(() => {
    const nextRound = round + 1;
    setRound(nextRound);
    const newIndices = initRound(nextRound, usedIndices);
    setUsedIndices(prev => [...prev, ...newIndices]);
  }, [round, usedIndices, initRound]);

  const handleFinish = useCallback(() => {
    const xp = correctFirstTry * 5;
    if (!xpAwardedRef.current && onXpEarned && xp > 0) {
      xpAwardedRef.current = true;
      const total = BUILDINGS_PER_ROUND * TOTAL_ROUNDS;
      const pctVal = Math.round((totalCorrect / total) * 100);
      const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
      onXpEarned(xp, 'pinboard', { stars: starsVal });
    }
    onBack();
  }, [correctFirstTry, totalCorrect, onBack, onXpEarned]);

  // --- Results screen ---
  if (phase === 'results') {
    const xp = correctFirstTry * 5;
    const total = BUILDINGS_PER_ROUND * TOTAL_ROUNDS;
    const pct = Math.round((totalCorrect / total) * 100);
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultsBox}>
          <Text style={styles.resultsEmoji}>📌</Text>
          <Text style={styles.resultsTitle}>Pinnwand fertig!</Text>
          <Text style={styles.resultsStars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
          <Text style={styles.resultsStat}>{totalCorrect} / {total} richtig zugeordnet</Text>
          <Text style={styles.resultsStat}>{correctFirstTry} beim ersten Versuch</Text>
          <Text style={styles.resultsXp}>+{xp} XP</Text>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Fertig</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Round end screen ---
  if (phase === 'roundEnd') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultsBox}>
          <Text style={styles.resultsEmoji}>✅</Text>
          <Text style={styles.resultsTitle}>Runde {round} geschafft!</Text>
          <Text style={styles.resultsStat}>Alle Gebäude zugeordnet!</Text>
          <TouchableOpacity style={styles.finishBtn} onPress={handleNextRound}>
            <Text style={styles.finishBtnText}>Nächste Runde</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Play screen ---
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Zurück</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📌 Pinnwand</Text>
          <Text style={styles.roundLabel}>Runde {round}/{TOTAL_ROUNDS}</Text>
        </View>

        <Text style={styles.instruction}>
          {selectedBuilding !== null
            ? `Tippe auf den Abschnitt für "${ASSIGNMENTS[selectedBuilding].building}"`
            : 'Wähle ein Gebäude und ordne es dem richtigen Abschnitt zu!'}
        </Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          {roundBuildings.map((idx, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                matched.includes(idx) && styles.progressDotDone,
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Section slots (pinboard areas) */}
          <Text style={styles.sectionHeader}>Ringstraßen-Abschnitte</Text>
          <View style={styles.sectionsContainer}>
            {sections.map(section => {
              const pinned = sectionPinned[section] || [];
              const isFlashing = flashState && flashState.section === section;
              const flashColor = isFlashing
                ? (flashState.type === 'correct' ? C.green : C.red)
                : null;

              return (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.sectionSlot,
                    flashColor && { borderColor: flashColor, borderWidth: 3 },
                  ]}
                  onPress={() => handleSectionTap(section)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pinDot} />
                  <Text style={styles.sectionName}>{section}</Text>
                  {pinned.map((p, pi) => (
                    <View key={pi} style={styles.pinnedItem}>
                      <Text style={styles.pinnedEmoji}>{p.emoji}</Text>
                      <Text style={styles.pinnedText}>{p.building}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Building cards */}
          <Text style={styles.sectionHeader}>Gebäude</Text>
          <View style={styles.cardsContainer}>
            {roundBuildings.map((idx, i) => {
              if (matched.includes(idx)) return null;

              const assignment = ASSIGNMENTS[idx];
              const isSelected = selectedBuilding === idx;
              const ca = cardAnims[idx] || new Animated.Value(1);
              const ba = bounceAnims[idx] || new Animated.Value(1);

              const rotation = ((i % 5) - 2) * 1.5; // slight random-ish rotation

              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.cardWrapper,
                    {
                      opacity: ca,
                      transform: [
                        { scale: Animated.multiply(ca, ba) },
                        { rotate: `${rotation}deg` },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.buildingCard,
                      isSelected && styles.buildingCardSelected,
                    ]}
                    onPress={() => handleBuildingTap(idx)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardPin} />
                    <Text style={styles.cardEmoji}>{assignment.emoji}</Text>
                    <Text style={styles.cardName}>{assignment.building}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORK,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CORK_DARK,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
  },
  roundLabel: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  instruction: {
    textAlign: 'center',
    color: C.dark,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: CORK_DARK,
  },
  progressDotDone: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: C.dark,
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionsContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  sectionSlot: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: CORK_DARK,
    borderStyle: 'dashed',
    minHeight: 56,
    position: 'relative',
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PIN_RED,
    position: 'absolute',
    top: 6,
    right: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  sectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 4,
  },
  pinnedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39,174,96,0.15)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  pinnedEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  pinnedText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.dark,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 10,
    paddingTop: 4,
  },
  cardWrapper: {
    width: (width - 56) / 3,
  },
  buildingCard: {
    backgroundColor: C.white,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  buildingCardSelected: {
    borderColor: C.blue,
    backgroundColor: '#EAF2FA',
    elevation: 6,
    shadowOpacity: 0.35,
  },
  cardPin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PIN_RED,
    position: 'absolute',
    top: 4,
    right: 4,
    elevation: 1,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '700',
    color: C.dark,
    textAlign: 'center',
  },

  // Results & round-end
  resultsBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  resultsEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.dark,
    marginBottom: 12,
  },
  resultsStars: {
    fontSize: 36,
    marginBottom: 16,
  },
  resultsStat: {
    fontSize: 16,
    color: C.dark,
    marginBottom: 6,
    fontWeight: '500',
  },
  resultsXp: {
    fontSize: 22,
    fontWeight: '800',
    color: C.gold,
    marginTop: 12,
    marginBottom: 20,
  },
  finishBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  finishBtnText: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
