import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Dimensions, SafeAreaView } from 'react-native';

const { width } = Dimensions.get('window');

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

const RING_SECTIONS = [
  { name: 'Stubenring', buildings: ['Regierungsgebäude', 'Museum für angewandte Kunst (MAK)'], info: 'Am Stubenring befinden sich das Regierungsgebäude und das MAK.' },
  { name: 'Parkring', buildings: ['Stadtpark'], info: 'Am Parkring liegt der Wiener Stadtpark mit dem Johann-Strauß-Denkmal.' },
  { name: 'Schubertring', buildings: ['(nach Franz Schubert benannt)'], info: 'Der Schubertring ist nach dem Komponisten Franz Schubert benannt.' },
  { name: 'Kärntner Ring', buildings: ['Hotel Imperial'], info: 'Am Kärntner Ring steht das berühmte Hotel Imperial.' },
  { name: 'Opernring', buildings: ['Staatsoper'], info: 'Am Opernring steht die Wiener Staatsoper - der erste Ringstraßenbau.' },
  { name: 'Burgring', buildings: ['Hofburg', 'Naturhistorisches Museum', 'Kunsthistorisches Museum'], info: 'Am Burgring liegen die Hofburg und die beiden großen Museen.' },
  { name: 'Dr.-Karl-Renner-Ring', buildings: ['Parlament'], info: 'Am Dr.-Karl-Renner-Ring steht das Parlament mit dem Pallas-Athene-Brunnen.' },
  { name: 'Universitätsring', buildings: ['Universität', 'Rathaus', 'Burgtheater'], info: 'Am Universitätsring stehen die Universität, das Rathaus und das Burgtheater.' },
  { name: 'Schottenring', buildings: ['Börse', 'Ringturm'], info: 'Am Schottenring befinden sich die Börse und der Ringturm.' },
];

const CLOCKWISE_ORDER = ['Stubenring', 'Parkring', 'Schubertring', 'Kärntner Ring', 'Opernring', 'Burgring', 'Dr.-Karl-Renner-Ring', 'Universitätsring', 'Schottenring'];

const RING_FACTS = [
  'Die Ringstraße ist 4 km lang und 57 m breit.',
  'Kaiser Franz Joseph I. ließ sie ab 1865 bauen.',
  'Sie besteht aus 9 Abschnitten (+ Franz-Josefs-Kai).',
  'Der Franz-Josefs-Kai entlang des Donaukanals schließt den Ring.',
  'Zwischen den Prachtbauten wurden auf beiden Seiten Alleen angelegt.',
  'Parks: Rathauspark, Stadtpark, Burggarten, Volksgarten, Sigmund-Freud-Park.',
];

const ALL_BUILDINGS = RING_SECTIONS.flatMap(s => s.buildings);

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(correctBuildings) {
  const wrong = ALL_BUILDINGS.filter(b => !correctBuildings.includes(b));
  const shuffledWrong = shuffleArray(wrong);
  const numWrong = Math.max(2, 5 - correctBuildings.length);
  const distractors = shuffledWrong.slice(0, numWrong);
  return shuffleArray([...correctBuildings, ...distractors]);
}

function getRandomFact(usedFacts) {
  const available = RING_FACTS.filter((_, i) => !usedFacts.includes(i));
  if (available.length === 0) return { fact: RING_FACTS[0], index: 0 };
  const idx = RING_FACTS.indexOf(available[Math.floor(Math.random() * available.length)]);
  return { fact: RING_FACTS[idx], index: idx };
}

export default function RingMatchGame({ onBack, onXpEarned }) {
  const [phase, setPhase] = useState('match');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [infoText, setInfoText] = useState('');
  const [bonusFact, setBonusFact] = useState('');
  const [usedFacts, setUsedFacts] = useState([]);
  const [optionStates, setOptionStates] = useState({});
  const [answered, setAnswered] = useState(false);
  const [sectionOrder, setSectionOrder] = useState(RING_SECTIONS.map((_, i) => i));
  const [orderItems, setOrderItems] = useState([]);
  const [orderChecked, setOrderChecked] = useState(false);
  const [orderResults, setOrderResults] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [orderCorrect, setOrderCorrect] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const infoAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flashAnims = useRef({}).current;
  const xpAwardedRef = useRef(false);

  const totalSections = RING_SECTIONS.length;

  const setupSection = useCallback((idx) => {
    const section = RING_SECTIONS[sectionOrder[idx]];
    const opts = generateOptions(section.buildings);
    setOptions(opts);
    setSelected([]);
    setOptionStates({});
    setAnswered(false);
    setShowInfo(false);
    cardAnim.setValue(0);
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [sectionOrder, cardAnim]);

  const initGame = useCallback(() => {
    const order = shuffleArray(RING_SECTIONS.map((_, i) => i));
    setSectionOrder(order);
    setCurrentIndex(0);
    setMistakes(0);
    setStreak(0);
    setBestStreak(0);
    setShowInfo(false);
    setAnswered(false);
    setPhase('match');
    setGameOver(false);
    setUsedFacts([]);
    setOrderChecked(false);
    setOrderResults([]);
    setOrderCorrect(0);
    xpAwardedRef.current = false;
    fadeAnim.setValue(0);
    progressAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const firstSection = RING_SECTIONS[order[0]];
    const opts = generateOptions(firstSection.buildings);
    setOptions(opts);
    setSelected([]);
    setOptionStates({});
    cardAnim.setValue(0);
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, cardAnim, progressAnim]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentIndex / totalSections,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, totalSections, progressAnim]);

  const getFlashAnim = (building) => {
    if (!flashAnims[building]) {
      flashAnims[building] = new Animated.Value(0);
    }
    return flashAnims[building];
  };

  const flashOption = (building, isCorrect) => {
    const anim = getFlashAnim(building);
    anim.setValue(1);
    Animated.timing(anim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  };

  const handleOptionPress = (building) => {
    if (answered) return;
    if (selected.includes(building)) return;

    const section = RING_SECTIONS[sectionOrder[currentIndex]];
    const isCorrect = section.buildings.includes(building);

    const newStates = { ...optionStates };
    newStates[building] = isCorrect ? 'correct' : 'wrong';
    setOptionStates(newStates);
    flashOption(building, isCorrect);

    if (isCorrect) {
      const newSelected = [...selected, building];
      setSelected(newSelected);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      if (newSelected.length === section.buildings.length) {
        setAnswered(true);
        const { fact, index } = getRandomFact(usedFacts);
        setInfoText(section.info);
        setBonusFact(fact);
        setUsedFacts(prev => [...prev, index]);
        setTimeout(() => {
          setShowInfo(true);
          infoAnim.setValue(0);
          Animated.spring(infoAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }, 400);
      }
    } else {
      setMistakes(m => m + 1);
      setStreak(0);
    }
  };

  const handleRevealAnswer = () => {
    const section = RING_SECTIONS[sectionOrder[currentIndex]];
    const newStates = { ...optionStates };
    section.buildings.forEach(b => {
      if (!selected.includes(b)) {
        newStates[b] = 'revealed';
      }
    });
    setOptionStates(newStates);
    setAnswered(true);
    setStreak(0);
    const { fact, index } = getRandomFact(usedFacts);
    setInfoText(section.info);
    setBonusFact(fact);
    setUsedFacts(prev => [...prev, index]);
    setTimeout(() => {
      setShowInfo(true);
      infoAnim.setValue(0);
      Animated.spring(infoAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  const handleNext = () => {
    const next = currentIndex + 1;
    if (next >= totalSections) {
      setPhase('order');
      const shuffled = shuffleArray(CLOCKWISE_ORDER.map((name, i) => ({ name, correctIndex: i })));
      setOrderItems(shuffled);
      setOrderChecked(false);
      setOrderResults([]);
      cardAnim.setValue(0);
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      setCurrentIndex(next);
      setupSection(next);
    }
  };

  const moveOrderItem = (index, direction) => {
    if (orderChecked) return;
    const target = index + direction;
    if (target < 0 || target >= orderItems.length) return;
    const newItems = [...orderItems];
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setOrderItems(newItems);
  };

  const checkOrder = () => {
    const results = orderItems.map((item, i) => item.correctIndex === i);
    setOrderResults(results);
    setOrderChecked(true);
    const correct = results.filter(Boolean).length;
    setOrderCorrect(correct);
  };

  const finishGame = () => {
    setGameOver(true);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const getStars = () => {
    if (mistakes === 0) return 3;
    if (mistakes <= 2) return 2;
    if (mistakes <= 4) return 1;
    return 0;
  };

  // --- Result screen ---
  if (gameOver) {
    const stars = getStars();
    const xpAmount = stars * 15;
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true;
      if (onXpEarned) onXpEarned(xpAmount, 'ringmatch', { stars, streak });
    }
    const pct = Math.max(0, Math.round(((totalSections * 2 - mistakes) / (totalSections * 2)) * 100));
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.resultCard, { opacity: fadeAnim }]}>
          <Text style={styles.resultBadge}>Ringstraße</Text>
          <Text style={styles.resultTitle}>Zuordnung beendet!</Text>
          <Text style={styles.starRow}>
            {[1, 2, 3].map(i => (
              <Text key={i} style={[styles.star, i <= stars ? styles.starFilled : styles.starEmpty]}>
                {'\u2605'}
              </Text>
            ))}
          </Text>

          <View style={styles.statsBox}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Fehler</Text>
              <Text style={styles.statValue}>{mistakes}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Beste Serie</Text>
              <Text style={styles.statValue}>{bestStreak}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Reihenfolge</Text>
              <Text style={styles.statValue}>{orderCorrect}/{totalSections} richtig</Text>
            </View>
          </View>

          <Text style={styles.resultMsg}>
            {stars === 3 ? 'Perfekt! Du kennst die Ringstraße auswendig!' :
             stars === 2 ? 'Sehr gut! Fast alles richtig!' :
             stars === 1 ? 'Nicht schlecht! Übe weiter!' :
             'Versuch es nochmal - du schaffst das!'}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{xpAmount} XP verdient!
          </Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={initGame}>
            <Text style={styles.btnPrimaryText}>Nochmal spielen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onBack}>
            <Text style={styles.btnSecondaryText}>Zurück</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // --- Phase 2: Reihenfolge ---
  if (phase === 'order') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'\u2190'} Zurück</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerStat}>Bonusrunde</Text>
            <Text style={styles.headerStat}>Fehler: {mistakes}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View style={{
            opacity: cardAnim,
            transform: [{
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            }],
          }}>
            <View style={styles.phaseCard}>
              <Text style={styles.phaseBadge}>Bonusrunde</Text>
              <Text style={styles.phaseTitle}>Reihenfolge der Ringstraße</Text>
              <Text style={styles.phaseSubtitle}>
                Sortiere die 9 Abschnitte im Uhrzeigersinn!
              </Text>
            </View>

            <View style={styles.orderList}>
              {orderItems.map((item, index) => {
                const isCorrect = orderChecked && orderResults[index] === true;
                const isWrong = orderChecked && orderResults[index] === false;
                return (
                  <View
                    key={item.name}
                    style={[
                      styles.orderRow,
                      isCorrect && styles.orderRowCorrect,
                      isWrong && styles.orderRowWrong,
                    ]}
                  >
                    <View style={[
                      styles.orderIndex,
                      isCorrect && { backgroundColor: COLORS.green },
                      isWrong && { backgroundColor: COLORS.red },
                    ]}>
                      <Text style={styles.orderIndexText}>{index + 1}</Text>
                    </View>
                    <Text style={[
                      styles.orderText,
                      isCorrect && { color: COLORS.green },
                      isWrong && { color: COLORS.red },
                    ]}>{item.name}</Text>
                    {!orderChecked && (
                      <View style={styles.arrowBtns}>
                        <TouchableOpacity
                          onPress={() => moveOrderItem(index, -1)}
                          style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                          disabled={index === 0}
                        >
                          <Text style={styles.arrowText}>{'\u25B2'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => moveOrderItem(index, 1)}
                          style={[styles.arrowBtn, index === orderItems.length - 1 && styles.arrowBtnDisabled]}
                          disabled={index === orderItems.length - 1}
                        >
                          <Text style={styles.arrowText}>{'\u25BC'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {orderChecked && (
                      <Text style={[styles.checkMark, { color: isCorrect ? COLORS.green : COLORS.red }]}>
                        {isCorrect ? '\u2713' : '\u2717'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {orderChecked && (
              <View style={styles.solutionBox}>
                <Text style={styles.solutionTitle}>
                  {orderCorrect === totalSections ? 'Perfekt! Alles richtig!' : 'Richtige Reihenfolge:'}
                </Text>
                {orderCorrect < totalSections && CLOCKWISE_ORDER.map((name, i) => (
                  <Text key={i} style={styles.solutionItem}>
                    {i + 1}. {name}
                  </Text>
                ))}
              </View>
            )}

            {!orderChecked ? (
              <TouchableOpacity style={styles.btnPrimary} onPress={checkOrder}>
                <Text style={styles.btnPrimaryText}>Überprüfen</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnPrimary} onPress={finishGame}>
                <Text style={styles.btnPrimaryText}>Ergebnis anzeigen</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Phase 1: Zuordnung ---
  const section = RING_SECTIONS[sectionOrder[currentIndex]];
  const remainingCorrect = section.buildings.filter(b => !selected.includes(b)).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'} Zurück</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerStat}>{currentIndex + 1}/{totalSections}</Text>
          <Text style={styles.headerStat}>
            {streak > 0 ? `Serie: ${streak}` : ''}
          </Text>
          <Text style={styles.headerStat}>Fehler: {mistakes}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, {
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{
          opacity: cardAnim,
          transform: [{
            scale: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          }],
        }}>
          {/* Section card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionLabel}>Ringstraßen-Abschnitt</Text>
            <Text style={styles.sectionName}>{section.name}</Text>
            <Text style={styles.sectionHint}>
              {section.buildings.length === 1
                ? 'Wähle das richtige Gebäude!'
                : `Wähle alle ${section.buildings.length} Gebäude!`}
            </Text>
            {!answered && remainingCorrect > 0 && section.buildings.length > 1 && (
              <View style={styles.remainingBadge}>
                <Text style={styles.remainingText}>
                  Noch {remainingCorrect} zu finden
                </Text>
              </View>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((building) => {
              const state = optionStates[building];
              const flashAnim = getFlashAnim(building);
              const isSelected = selected.includes(building);

              let btnStyle = styles.optionBtn;
              let textStyle = styles.optionText;

              if (state === 'correct') {
                btnStyle = [styles.optionBtn, styles.optionCorrect];
                textStyle = [styles.optionText, styles.optionTextCorrect];
              } else if (state === 'wrong') {
                btnStyle = [styles.optionBtn, styles.optionWrong];
                textStyle = [styles.optionText, styles.optionTextWrong];
              } else if (state === 'revealed') {
                btnStyle = [styles.optionBtn, styles.optionRevealed];
                textStyle = [styles.optionText, styles.optionTextRevealed];
              }

              return (
                <Animated.View
                  key={building}
                  style={{
                    backgroundColor: flashAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', state === 'correct' || state === 'revealed' ? '#E8F8F0' : '#FDEDEC'],
                    }),
                    borderRadius: 14,
                  }}
                >
                  <TouchableOpacity
                    style={btnStyle}
                    onPress={() => handleOptionPress(building)}
                    disabled={answered || isSelected || state === 'wrong'}
                    activeOpacity={0.7}
                  >
                    <Text style={textStyle}>
                      {state === 'correct' || state === 'revealed' ? '\u2713 ' : ''}
                      {state === 'wrong' ? '\u2717 ' : ''}
                      {building}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Reveal button if stuck */}
          {!answered && (
            <TouchableOpacity style={styles.btnReveal} onPress={handleRevealAnswer}>
              <Text style={styles.btnRevealText}>Lösung zeigen</Text>
            </TouchableOpacity>
          )}

          {/* Info box after correct answer */}
          {showInfo && (
            <Animated.View style={{
              opacity: infoAnim,
              transform: [{
                translateY: infoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}>
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>i</Text>
                <Text style={styles.infoTitle}>Wusstest du?</Text>
                <Text style={styles.infoText}>{infoText}</Text>
              </View>
              <View style={styles.factBox}>
                <Text style={styles.factIcon}>{'\u2605'}</Text>
                <Text style={styles.factTitle}>Ringstraßen-Fakt</Text>
                <Text style={styles.factText}>{bonusFact}</Text>
              </View>
            </Animated.View>
          )}

          {/* Next button */}
          {answered && (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
              <Text style={styles.btnPrimaryText}>
                {currentIndex + 1 >= totalSections ? 'Weiter zur Bonusrunde' : 'Nächster Abschnitt'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
  progressBarBg: {
    height: 6,
    backgroundColor: '#E8E8E8',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.green,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // Section card
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sectionAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: COLORS.blue,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 6,
  },
  sectionName: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
  remainingBadge: {
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 10,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blue,
  },

  // Options
  optionsContainer: {
    marginBottom: 12,
  },
  optionBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
  },
  optionCorrect: {
    borderColor: COLORS.green,
    backgroundColor: '#E8F8F0',
  },
  optionTextCorrect: {
    color: COLORS.green,
  },
  optionWrong: {
    borderColor: COLORS.red,
    backgroundColor: '#FDEDEC',
  },
  optionTextWrong: {
    color: COLORS.red,
  },
  optionRevealed: {
    borderColor: COLORS.gold,
    backgroundColor: '#FEF9E7',
  },
  optionTextRevealed: {
    color: COLORS.gold,
  },

  // Reveal button
  btnReveal: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  btnRevealText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Info box
  infoBox: {
    backgroundColor: '#FEF9E7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  infoIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    backgroundColor: COLORS.gold,
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
    overflow: 'hidden',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },

  // Fact box
  factBox: {
    backgroundColor: '#EBF5FB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
  },
  factIcon: {
    fontSize: 18,
    color: COLORS.gold,
    marginBottom: 6,
  },
  factTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 4,
  },
  factText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },

  // Buttons
  btnPrimary: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    elevation: 3,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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

  // Phase 2: Order
  phaseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    alignItems: 'center',
  },
  phaseBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 6,
  },
  phaseSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderList: {
    marginBottom: 16,
  },
  orderRow: {
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
  orderRowCorrect: {
    borderColor: COLORS.green,
    backgroundColor: '#E8F8F0',
  },
  orderRowWrong: {
    borderColor: COLORS.red,
    backgroundColor: '#FDEDEC',
  },
  orderIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderIndexText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  orderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
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

  // Result
  resultCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.light,
  },
  resultBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  statsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },
  resultMsg: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
});
