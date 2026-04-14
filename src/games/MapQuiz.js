import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import SoundService from '../utils/SoundService';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH - 32;
const MAP_HEIGHT = Math.min(SCREEN_HEIGHT * 0.55, 420);

const BEZIRKE = [
  { nr: 1,  name: 'Innere Stadt',           x: 45, y: 50, w: 9, h: 9 },
  { nr: 2,  name: 'Leopoldstadt',            x: 55, y: 35, w: 10, h: 10 },
  { nr: 3,  name: 'Landstrasse',             x: 60, y: 55, w: 10, h: 10 },
  { nr: 4,  name: 'Wieden',                  x: 45, y: 60, w: 9, h: 8 },
  { nr: 5,  name: 'Margareten',              x: 38, y: 62, w: 9, h: 8 },
  { nr: 6,  name: 'Mariahilf',               x: 32, y: 55, w: 9, h: 8 },
  { nr: 7,  name: 'Neubau',                  x: 30, y: 48, w: 9, h: 8 },
  { nr: 8,  name: 'Josefstadt',              x: 32, y: 42, w: 9, h: 8 },
  { nr: 9,  name: 'Alsergrund',              x: 40, y: 38, w: 9, h: 9 },
  { nr: 10, name: 'Favoriten',               x: 50, y: 75, w: 12, h: 12 },
  { nr: 11, name: 'Simmering',               x: 65, y: 70, w: 12, h: 12 },
  { nr: 12, name: 'Meidling',                x: 28, y: 72, w: 10, h: 10 },
  { nr: 13, name: 'Hietzing',                x: 15, y: 68, w: 12, h: 12 },
  { nr: 14, name: 'Penzing',                 x: 12, y: 48, w: 12, h: 12 },
  { nr: 15, name: 'Rudolfsheim-Fuenfhaus',   x: 22, y: 58, w: 10, h: 9 },
  { nr: 16, name: 'Ottakring',               x: 18, y: 40, w: 11, h: 10 },
  { nr: 17, name: 'Hernals',                 x: 20, y: 32, w: 11, h: 9 },
  { nr: 18, name: 'Waehring',                x: 30, y: 28, w: 10, h: 9 },
  { nr: 19, name: 'Doebling',                x: 42, y: 22, w: 12, h: 10 },
  { nr: 20, name: 'Brigittenau',             x: 48, y: 30, w: 9, h: 8 },
  { nr: 21, name: 'Floridsdorf',             x: 55, y: 15, w: 14, h: 12 },
  { nr: 22, name: 'Donaustadt',              x: 75, y: 30, w: 18, h: 18 },
  { nr: 23, name: 'Liesing',                 x: 30, y: 82, w: 12, h: 10 },
];

const BEZIRK_COLORS = [
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#1ABC9C',
  '#3498DB', '#9B59B6', '#E91E63', '#00BCD4', '#8BC34A',
  '#FF9800', '#795548', '#607D8B', '#CDDC39', '#FF5722',
  '#009688', '#673AB7', '#03A9F4', '#FFC107', '#4CAF50',
  '#F44336', '#2196F3', '#9C27B0',
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateNameOptions(correctBezirk) {
  const others = BEZIRKE.filter((b) => b.nr !== correctBezirk.nr);
  const wrong = shuffleArray(others).slice(0, 3);
  const options = shuffleArray([correctBezirk, ...wrong]);
  return options;
}

export default function MapQuiz({ onBack, onXpEarned }) {
  const [mode, setMode] = useState(null);
  const [order, setOrder] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [feedbackBezirk, setFeedbackBezirk] = useState(null);
  const [nameOptions, setNameOptions] = useState([]);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const xpAwardedRef = useRef(false);

  const startGame = useCallback((selectedMode) => {
    const shuffled = shuffleArray([...BEZIRKE]);
    setMode(selectedMode);
    setOrder(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setFeedback(null);
    setFeedbackBezirk(null);
    setFinished(false);
    setSelectedOption(null);
    xpAwardedRef.current = false;
    if (selectedMode === 'name') {
      setNameOptions(generateNameOptions(shuffled[0]));
    }
  }, []);

  const currentBezirk = order[currentIndex];

  const advance = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= order.length) {
      setFinished(true);
      SoundService.success();
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      setCurrentIndex(nextIndex);
      setFeedback(null);
      setFeedbackBezirk(null);
      setSelectedOption(null);
      if (mode === 'name') {
        setNameOptions(generateNameOptions(order[nextIndex]));
      }
    }
  }, [currentIndex, order, mode, scaleAnim]);

  const showFeedback = useCallback((isCorrect, bezirkNr) => {
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setFeedbackBezirk(bezirkNr);
    if (isCorrect) {
      SoundService.correct();
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
    } else {
      SoundService.wrong();
    }
    feedbackAnim.setValue(0);
    Animated.timing(feedbackAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(advance, 1200);
  }, [advance, feedbackAnim]);

  const handleMapPress = useCallback((bezirk) => {
    if (feedback || mode !== 'find') return;
    const isCorrect = bezirk.nr === currentBezirk.nr;
    showFeedback(isCorrect, bezirk.nr);
  }, [feedback, mode, currentBezirk, showFeedback]);

  const handleNameSelect = useCallback((bezirk) => {
    if (feedback || mode !== 'name') return;
    setSelectedOption(bezirk.nr);
    const isCorrect = bezirk.nr === currentBezirk.nr;
    showFeedback(isCorrect, bezirk.nr);
  }, [feedback, mode, currentBezirk, showFeedback]);

  // Mode selection screen
  if (mode === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>{'\u2190'} Zurueck</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Bezirke-Quiz</Text>
        </View>
        <View style={styles.modeContainer}>
          <Text style={styles.modeTitle}>Waehle einen Modus</Text>

          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: COLORS.blue }]}
            onPress={() => startGame('find')}
          >
            <Text style={styles.modeBtnIcon}>{'\uD83D\uDDFA\uFE0F'}</Text>
            <View style={styles.modeBtnTextWrap}>
              <Text style={styles.modeBtnTitle}>Finde den Bezirk</Text>
              <Text style={styles.modeBtnDesc}>
                Name wird gezeigt - tippe auf die richtige Position
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: COLORS.gold }]}
            onPress={() => startGame('name')}
          >
            <Text style={styles.modeBtnIcon}>{'\u2753'}</Text>
            <View style={styles.modeBtnTextWrap}>
              <Text style={styles.modeBtnTitle}>Wie heisst der Bezirk?</Text>
              <Text style={styles.modeBtnDesc}>
                Nummer wird gezeigt - waehle den richtigen Namen
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Result screen
  if (finished) {
    const pct = Math.round((correctCount / 23) * 100);
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
    const xpAmount = correctCount * 3;
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true;
      if (onXpEarned) onXpEarned(xpAmount);
    }
    const scaleInterp = scaleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    return (
      <View style={styles.container}>
        <Animated.View
          style={[styles.resultContainer, { transform: [{ scale: scaleInterp }] }]}
        >
          <Text style={styles.resultTitle}>Ergebnis</Text>
          <Text style={styles.resultStars}>
            {Array(3)
              .fill(null)
              .map((_, i) => (i < stars ? '\u2605' : '\u2606'))
              .join(' ')}
          </Text>
          <View style={styles.statsBox}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Richtig</Text>
              <Text style={styles.statValue}>
                {correctCount} / 23
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Punkte</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Prozent</Text>
              <Text style={styles.statValue}>{pct}%</Text>
            </View>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{xpAmount} XP verdient!
          </Text>
          <TouchableOpacity
            style={styles.playAgainBtn}
            onPress={() => startGame(mode)}
          >
            <Text style={styles.playAgainText}>Nochmal spielen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.changeModeBtn}
            onPress={() => setMode(null)}
          >
            <Text style={styles.changeModeBtnText}>Modus wechseln</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtnWin} onPress={onBack}>
            <Text style={styles.backBtnWinText}>Zurueck</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Game screen
  const questionText =
    mode === 'find'
      ? `Tippe auf den ${currentBezirk.nr}. Bezirk (${currentBezirk.name})`
      : `Wie heisst der ${currentBezirk.nr}. Bezirk?`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>{'\u2190'} Zurueck</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bezirke-Quiz</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentIndex / 23) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / 23
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeLabel}>Punkte</Text>
          <Text style={styles.scoreBadgeValue}>{score}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeLabel}>Richtig</Text>
          <Text style={styles.scoreBadgeValue}>{correctCount}</Text>
        </View>
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>{questionText}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map container */}
        <View style={styles.mapContainer}>
          <View style={[styles.map, { width: MAP_WIDTH, height: MAP_HEIGHT }]}>
            {BEZIRKE.map((bezirk) => {
              const left = (bezirk.x / 100) * MAP_WIDTH - (bezirk.w / 100) * MAP_WIDTH / 2;
              const top = (bezirk.y / 100) * MAP_HEIGHT - (bezirk.h / 100) * MAP_HEIGHT / 2;
              const width = (bezirk.w / 100) * MAP_WIDTH;
              const height = (bezirk.h / 100) * MAP_HEIGHT;

              let bgColor = BEZIRK_COLORS[bezirk.nr - 1];
              let borderColor = 'rgba(255,255,255,0.6)';
              let borderWidth = 1.5;

              if (feedback && feedbackBezirk === bezirk.nr) {
                bgColor = feedback === 'correct' ? COLORS.green : COLORS.red;
                borderColor = feedback === 'correct' ? '#1a8a45' : '#8a1a1a';
                borderWidth = 3;
              } else if (feedback && bezirk.nr === currentBezirk.nr && feedback === 'wrong') {
                bgColor = COLORS.green;
                borderColor = '#1a8a45';
                borderWidth = 3;
              }

              const isHighlighted = mode === 'name' && bezirk.nr === currentBezirk.nr;

              return (
                <TouchableOpacity
                  key={bezirk.nr}
                  activeOpacity={mode === 'find' ? 0.7 : 1}
                  onPress={() => handleMapPress(bezirk)}
                  disabled={mode !== 'find' || feedback !== null}
                  style={[
                    styles.bezirkTile,
                    {
                      left,
                      top,
                      width,
                      height,
                      backgroundColor: bgColor,
                      borderColor,
                      borderWidth,
                    },
                    isHighlighted && styles.bezirkHighlighted,
                  ]}
                >
                  <Text
                    style={[
                      styles.bezirkLabel,
                      { fontSize: Math.max(8, Math.min(width * 0.28, 13)) },
                      isHighlighted && styles.bezirkLabelHighlighted,
                    ]}
                    numberOfLines={1}
                  >
                    {mode === 'find' ? String(bezirk.nr) : bezirk.nr === currentBezirk.nr ? '?' : String(bezirk.nr)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Name selection options (mode 2) */}
        {mode === 'name' && (
          <View style={styles.optionsContainer}>
            {nameOptions.map((option) => {
              let optBg = COLORS.white;
              let optBorder = 'rgba(0,0,0,0.1)';
              let optTextColor = COLORS.dark;

              if (feedback && selectedOption === option.nr) {
                if (option.nr === currentBezirk.nr) {
                  optBg = COLORS.green;
                  optBorder = COLORS.green;
                  optTextColor = COLORS.white;
                } else {
                  optBg = COLORS.red;
                  optBorder = COLORS.red;
                  optTextColor = COLORS.white;
                }
              } else if (feedback && option.nr === currentBezirk.nr) {
                optBg = COLORS.green;
                optBorder = COLORS.green;
                optTextColor = COLORS.white;
              }

              return (
                <TouchableOpacity
                  key={option.nr}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor: optBg,
                      borderColor: optBorder,
                    },
                  ]}
                  onPress={() => handleNameSelect(option)}
                  disabled={feedback !== null}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, { color: optTextColor }]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Feedback banner */}
        {feedback && (
          <Animated.View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor:
                  feedback === 'correct' ? COLORS.green : COLORS.red,
                opacity: feedbackAnim,
              },
            ]}
          >
            <Text style={styles.feedbackText}>
              {feedback === 'correct'
                ? 'Richtig! +10 Punkte'
                : `Falsch! Es war: ${currentBezirk.nr}. ${currentBezirk.name}`}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 16,
    color: COLORS.blue,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginRight: 60,
  },

  // Mode selection
  modeContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 32,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modeBtnIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  modeBtnTextWrap: {
    flex: 1,
  },
  modeBtnTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  modeBtnDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  // Progress
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },

  // Score
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scoreBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  scoreBadgeLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreBadgeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: 1,
  },

  // Question
  questionBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },

  scrollContent: {
    paddingBottom: 24,
  },

  // Map
  mapContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  map: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  bezirkTile: {
    position: 'absolute',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  bezirkHighlighted: {
    borderWidth: 3,
    borderColor: COLORS.dark,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bezirkLabel: {
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bezirkLabelHighlighted: {
    fontSize: 16,
    color: COLORS.white,
  },

  // Name options
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  optionBtn: {
    width: (SCREEN_WIDTH - 32 - 8) / 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Feedback
  feedbackBanner: {
    marginHorizontal: 16,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },

  // Results
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.dark,
    marginBottom: 12,
  },
  resultStars: {
    fontSize: 40,
    color: COLORS.gold,
    marginBottom: 24,
  },
  statsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  playAgainBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  changeModeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  changeModeBtnText: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: '600',
  },
  backBtnWin: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnWinText: {
    fontSize: 16,
    color: COLORS.blue,
    fontWeight: '600',
  },
});
