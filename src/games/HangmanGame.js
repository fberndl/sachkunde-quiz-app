import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WRONG = 8;
const ROUNDS_PER_GAME = 6;

const WORDS = [
  { word: 'STEPHANSDOM', hint: 'Die bekannteste Kirche Wiens' },
  { word: 'PUMMERIN', hint: 'Die große Glocke im Stephansdom' },
  { word: 'RINGSTRASSE', hint: 'Die berühmte Prachtstraße rund um den 1. Bezirk' },
  { word: 'HOFBURG', hint: 'Die ehemalige kaiserliche Residenz' },
  { word: 'RATHAUS', hint: 'Hier arbeitet der Bürgermeister' },
  { word: 'PARLAMENT', hint: 'Hier werden Gesetze beschlossen' },
  { word: 'BURGTHEATER', hint: 'Berühmtes Theater am Universitätsring' },
  { word: 'UNIVERSITÄT', hint: 'Hier studieren rund 90.000 junge Menschen' },
  { word: 'DONAUSTADT', hint: 'Der 22. Bezirk von Wien' },
  { word: 'FAVORITEN', hint: 'Der 10. Bezirk von Wien' },
  { word: 'LEOPOLDSTADT', hint: 'Der 2. Bezirk, ein Inselbezirk' },
  { word: 'ALSERGRUND', hint: 'Der 9. Bezirk von Wien' },
  { word: 'MARIAHILF', hint: 'Der 6. Bezirk, Haus des Meeres liegt hier' },
  { word: 'PESTSÄULE', hint: 'Vergoldete Barocksäule auf dem Graben' },
  { word: 'RIESENTOR', hint: 'Das große Tor am Stephansdom' },
  { word: 'ADLERTURM', hint: 'Ein Turm am Stephansdom' },
  { word: 'BELVEDERE', hint: 'Ein berühmtes Schloss im 3. Bezirk' },
  { word: 'RINGTURM', hint: 'Ein bekannter Turm am Donaukanal' },
  { word: 'SCHÖNBRUNN', hint: 'Das berühmte Schloss in Hietzing' },
  { word: 'PRATER', hint: 'Der große Vergnügungspark in Wien' },
  { word: 'RIESENRAD', hint: 'Das Wahrzeichen im Prater' },
  { word: 'DONAUKANAL', hint: 'Gewässer, das durch die Innenbezirke fließt' },
  { word: 'INNERE STADT', hint: 'Der 1. Bezirk, der älteste Teil Wiens' },
  { word: 'PLANQUADRAT', hint: 'Hilft beim Finden von Orten auf der Karte' },
  { word: 'LEGENDE', hint: 'Erklärt die Zeichen auf der Landkarte' },
  { word: 'MASSSTAB', hint: 'Zeigt das Verhältnis von Karte zu Wirklichkeit' },
  { word: 'NORDTURM', hint: 'Ein Turm des Stephansdoms' },
  { word: 'SÜDTURM', hint: 'Der hohe Turm des Stephansdoms (136,4 m)' },
  // Alle Bezirke
  { word: 'WIEDEN', hint: 'Der 4. Bezirk' },
  { word: 'MARGARETEN', hint: 'Der 5. Bezirk' },
  { word: 'NEUBAU', hint: 'Der 7. Bezirk' },
  { word: 'JOSEFSTADT', hint: 'Der 8. und kleinste Bezirk' },
  { word: 'SIMMERING', hint: 'Der 11. Bezirk, hier ist der Zentralfriedhof' },
  { word: 'MEIDLING', hint: 'Der 12. Bezirk' },
  { word: 'HIETZING', hint: 'Der 13. Bezirk, Schloss Schönbrunn' },
  { word: 'PENZING', hint: 'Der 14. Bezirk' },
  { word: 'OTTAKRING', hint: 'Der 16. Bezirk, bekannt für ein Bier' },
  { word: 'HERNALS', hint: 'Der 17. Bezirk' },
  { word: 'WÄHRING', hint: 'Der 18. Bezirk' },
  { word: 'DÖBLING', hint: 'Der 19. Bezirk' },
  { word: 'BRIGITTENAU', hint: 'Der 20. Bezirk, ein Inselbezirk' },
  { word: 'FLORIDSDORF', hint: 'Der 21. Bezirk, nördlich der Donau' },
  { word: 'LIESING', hint: 'Der 23. und jüngste Bezirk' },
  { word: 'GÜRTEL', hint: 'Trennt Innen- von Außenbezirken' },
  { word: 'NASCHMARKT', hint: 'Berühmter Markt im 6. Bezirk' },
  { word: 'STAATSOPER', hint: 'Der erste Ringstraßenbau' },
  { word: 'DONAUTURM', hint: 'Hoher Turm im 22. Bezirk' },
  { word: 'LANDSTRASSE', hint: 'Der 3. Bezirk' },
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
  ['Y', 'X', 'C', 'V', 'B', 'N', 'M', 'ß'],
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWords() {
  return shuffleArray(WORDS).slice(0, ROUNDS_PER_GAME);
}

function normalizeChar(ch) {
  return ch.toUpperCase();
}

function getWordLetters(word) {
  return word.toUpperCase().split('').filter((c) => c !== ' ');
}

function computeScore(wordLength, wrongCount, usedHint) {
  const base = wordLength * 15;
  const penalty = wrongCount * 20;
  const hintPenalty = usedHint ? 30 : 0;
  return Math.max(0, base - penalty - hintPenalty);
}

// --- Gallows Drawing ---
function GallowsView({ wrongCount }) {
  const parts = [];
  // Base
  if (wrongCount >= 0) {
    parts.push(
      // Bottom beam
      <View key="base" style={g.base} />,
      // Vertical pole
      <View key="pole" style={g.pole} />,
      // Top beam
      <View key="top" style={g.top} />,
      // Rope
      <View key="rope" style={g.rope} />,
    );
  }
  // Step 1: Gallows already shown. wrongCount >= 1 => Head
  if (wrongCount >= 1) {
    parts.push(
      <View key="head" style={g.head} />,
    );
  }
  // Step 2: Body
  if (wrongCount >= 2) {
    parts.push(<View key="body" style={g.body} />);
  }
  // Step 3: Left arm
  if (wrongCount >= 3) {
    parts.push(<View key="larm" style={g.leftArm} />);
  }
  // Step 4: Right arm
  if (wrongCount >= 4) {
    parts.push(<View key="rarm" style={g.rightArm} />);
  }
  // Step 5: Left leg
  if (wrongCount >= 5) {
    parts.push(<View key="lleg" style={g.leftLeg} />);
  }
  // Step 6: Right leg
  if (wrongCount >= 6) {
    parts.push(<View key="rleg" style={g.rightLeg} />);
  }
  // Step 7: Left foot
  if (wrongCount >= 7) {
    parts.push(<View key="lfoot" style={g.leftFoot} />);
  }
  // Step 8: Face (eyes and mouth)
  if (wrongCount >= 8) {
    parts.push(
      <View key="face" style={g.faceContainer}>
        <View style={g.eyeLeft} />
        <View style={g.eyeRight} />
        <View style={g.mouth} />
      </View>,
    );
  }

  return (
    <View style={g.container}>
      {parts}
    </View>
  );
}

const GALLOWS_W = Math.min(200, SCREEN_WIDTH * 0.5);
const GALLOWS_H = 200;
const POLE_LEFT = 40;
const BEAM_TOP = 15;
const ROPE_LEFT = GALLOWS_W - 60;
const HANG_X = ROPE_LEFT;
const HEAD_TOP = BEAM_TOP + 25;
const HEAD_SIZE = 30;
const BODY_TOP = HEAD_TOP + HEAD_SIZE;
const BODY_H = 50;
const ARM_TOP = BODY_TOP + 10;
const ARM_LEN = 30;
const LEG_TOP = BODY_TOP + BODY_H;
const LEG_LEN = 35;

const g = StyleSheet.create({
  container: {
    width: GALLOWS_W,
    height: GALLOWS_H,
    alignSelf: 'center',
    marginVertical: 8,
  },
  base: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    width: GALLOWS_W - 20,
    height: 4,
    backgroundColor: COLORS.dark,
    borderRadius: 2,
  },
  pole: {
    position: 'absolute',
    bottom: 0,
    left: POLE_LEFT,
    width: 4,
    height: GALLOWS_H - 10,
    backgroundColor: COLORS.dark,
    borderRadius: 2,
  },
  top: {
    position: 'absolute',
    top: BEAM_TOP,
    left: POLE_LEFT,
    width: ROPE_LEFT - POLE_LEFT + 2,
    height: 4,
    backgroundColor: COLORS.dark,
    borderRadius: 2,
  },
  rope: {
    position: 'absolute',
    top: BEAM_TOP,
    left: ROPE_LEFT,
    width: 3,
    height: 25,
    backgroundColor: COLORS.dark,
  },
  head: {
    position: 'absolute',
    top: HEAD_TOP,
    left: HANG_X - HEAD_SIZE / 2,
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: HEAD_SIZE / 2,
    borderWidth: 3,
    borderColor: COLORS.dark,
    backgroundColor: 'transparent',
  },
  body: {
    position: 'absolute',
    top: BODY_TOP,
    left: HANG_X - 1.5,
    width: 3,
    height: BODY_H,
    backgroundColor: COLORS.dark,
  },
  leftArm: {
    position: 'absolute',
    top: ARM_TOP,
    left: HANG_X - ARM_LEN,
    width: ARM_LEN,
    height: 3,
    backgroundColor: COLORS.dark,
    transform: [{ rotate: '30deg' }],
  },
  rightArm: {
    position: 'absolute',
    top: ARM_TOP,
    left: HANG_X,
    width: ARM_LEN,
    height: 3,
    backgroundColor: COLORS.dark,
    transform: [{ rotate: '-30deg' }],
  },
  leftLeg: {
    position: 'absolute',
    top: LEG_TOP,
    left: HANG_X - LEG_LEN + 5,
    width: LEG_LEN,
    height: 3,
    backgroundColor: COLORS.dark,
    transform: [{ rotate: '40deg' }],
  },
  rightLeg: {
    position: 'absolute',
    top: LEG_TOP,
    left: HANG_X - 5,
    width: LEG_LEN,
    height: 3,
    backgroundColor: COLORS.dark,
    transform: [{ rotate: '-40deg' }],
  },
  leftFoot: {
    position: 'absolute',
    top: LEG_TOP + LEG_LEN - 5,
    left: HANG_X - LEG_LEN - 2,
    width: 12,
    height: 3,
    backgroundColor: COLORS.dark,
  },
  faceContainer: {
    position: 'absolute',
    top: HEAD_TOP,
    left: HANG_X - HEAD_SIZE / 2,
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeLeft: {
    position: 'absolute',
    top: 8,
    left: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.red,
  },
  eyeRight: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.red,
  },
  mouth: {
    position: 'absolute',
    bottom: 5,
    width: 10,
    height: 3,
    backgroundColor: COLORS.red,
    borderRadius: 1.5,
  },
});

// --- Word Display ---
function WordDisplay({ word, guessed, revealed }) {
  const letters = word.toUpperCase().split('');
  return (
    <View style={styles.wordContainer}>
      {letters.map((ch, i) => {
        const isSpace = ch === ' ';
        const isVisible = isSpace || guessed.has(ch) || revealed;
        return (
          <View
            key={i}
            style={[
              styles.letterBox,
              isSpace && styles.letterSpace,
              revealed && !guessed.has(ch) && !isSpace && styles.letterMissed,
            ]}
          >
            <Text
              style={[
                styles.letterText,
                revealed && !guessed.has(ch) && !isSpace && styles.letterMissedText,
              ]}
            >
              {isSpace ? '' : isVisible ? ch : ''}
            </Text>
            {!isSpace && <View style={styles.letterUnderline} />}
          </View>
        );
      })}
    </View>
  );
}

// --- Keyboard ---
function Keyboard({ guessed, wordLetters, onPress, disabled }) {
  return (
    <View style={styles.keyboard}>
      {KEYBOARD_ROWS.map((row, ri) => (
        <View key={ri} style={styles.keyRow}>
          {row.map((letter) => {
            const wasGuessed = guessed.has(letter);
            const isCorrect = wasGuessed && wordLetters.has(letter);
            const isWrong = wasGuessed && !wordLetters.has(letter);
            return (
              <TouchableOpacity
                key={letter}
                style={[
                  styles.key,
                  isCorrect && styles.keyCorrect,
                  isWrong && styles.keyWrong,
                  wasGuessed && styles.keyUsed,
                ]}
                onPress={() => onPress(letter)}
                disabled={wasGuessed || disabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.keyText,
                    isCorrect && styles.keyTextCorrect,
                    isWrong && styles.keyTextWrong,
                    wasGuessed && !isCorrect && !isWrong && styles.keyTextUsed,
                  ]}
                >
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// --- Result Screen ---
function ResultScreen({ rounds, totalScore, onPlayAgain, onBack, xpAmount }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const solved = rounds.filter((r) => r.won).length;
  const maxPossible = rounds.reduce(
    (sum, r) => sum + getWordLetters(r.word).length * 15,
    0,
  );
  const pct = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  let grade, gradeColor;
  if (pct >= 90) { grade = 'Ausgezeichnet!'; gradeColor = COLORS.green; }
  else if (pct >= 70) { grade = 'Sehr gut!'; gradeColor = COLORS.blue; }
  else if (pct >= 50) { grade = 'Gut gemacht!'; gradeColor = COLORS.gold; }
  else { grade = 'Weiter üben!'; gradeColor = COLORS.red; }

  return (
    <Animated.View style={[styles.resultContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultEmoji}>{pct >= 70 ? '🏆' : '📝'}</Text>
        <Text style={[styles.resultGrade, { color: gradeColor }]}>{grade}</Text>
        <Text style={styles.resultScore}>{totalScore} Punkte</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
          +{xpAmount} XP verdient!
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{solved}/{rounds.length}</Text>
            <Text style={styles.statLabel}>Gelöst</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{pct}%</Text>
            <Text style={styles.statLabel}>Ergebnis</Text>
          </View>
        </View>

        <View style={styles.roundsList}>
          {rounds.map((r, i) => (
            <View key={i} style={styles.roundRow}>
              <Text style={styles.roundIcon}>{r.won ? '✓' : '✗'}</Text>
              <Text style={[styles.roundWord, !r.won && styles.roundWordLost]}>{r.word}</Text>
              <Text style={styles.roundPts}>{r.score} Pkt</Text>
            </View>
          ))}
        </View>

        <View style={styles.resultButtons}>
          <TouchableOpacity style={styles.btnPrimary} onPress={onPlayAgain} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>Nochmal spielen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// --- Round Outcome Overlay ---
function RoundOutcome({ won, word, score, roundNum, totalRounds, onNext }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.outcomeCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.outcomeEmoji}>{won ? '🎉' : '😔'}</Text>
        <Text style={[styles.outcomeTitle, { color: won ? COLORS.green : COLORS.red }]}>
          {won ? 'Richtig!' : 'Leider verloren!'}
        </Text>
        <Text style={styles.outcomeWord}>{word}</Text>
        <Text style={styles.outcomeScore}>+{score} Punkte</Text>
        <Text style={styles.outcomeRound}>Runde {roundNum} von {totalRounds}</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>
            {roundNum < totalRounds ? 'Nächstes Wort' : 'Ergebnis ansehen'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// --- Main Component ---
export default function HangmanGame({ onBack, onXpEarned, semester }) {
  const [allWords, setAllWords] = useState(WORDS);
  const [gameWords, setGameWords] = useState(() => pickWords());
  const [roundIndex, setRoundIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [guessed, setGuessed] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [roundOutcome, setRoundOutcome] = useState(null); // { won, score }
  const [roundResults, setRoundResults] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [phase, setPhase] = useState('playing'); // playing | outcome | result
  const xpAwardedRef = useRef(false);

  // Load words from Supabase
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchGameContent('hangman', semester);
        if (!cancelled && rows.length > 0) {
          const dbWords = rows.map(r => r.data);
          setAllWords(dbWords);
          setGameWords(shuffleArray(dbWords).slice(0, ROUNDS_PER_GAME));
        }
      } catch (e) {
        console.warn('Hangman DB load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [semester]);

  const currentWord = gameWords[roundIndex];
  const wordUpper = currentWord.word.toUpperCase();
  const wordLettersSet = useMemo(() => new Set(getWordLetters(wordUpper)), [wordUpper]);

  const wrongGuesses = useMemo(
    () => [...guessed].filter((l) => !wordLettersSet.has(l)),
    [guessed, wordLettersSet],
  );
  const wrongCount = wrongGuesses.length;

  const isWon = useMemo(
    () => [...wordLettersSet].every((l) => guessed.has(l)),
    [wordLettersSet, guessed],
  );
  const isLost = wrongCount >= MAX_WRONG;
  const roundOver = isWon || isLost;

  // Detect round over
  useEffect(() => {
    if (roundOver && phase === 'playing') {
      if (isWon) {
        SoundService.success();
      }
      const score = isWon ? computeScore(getWordLetters(wordUpper).length, wrongCount, usedHint) : 0;
      const result = { word: currentWord.word, won: isWon, score, wrongCount };
      setRoundOutcome({ won: isWon, score });
      setRoundResults((prev) => [...prev, result]);
      setTotalScore((prev) => prev + score);
      setPhase('outcome');
    }
  }, [roundOver, phase, isWon, wordUpper, wrongCount, usedHint, currentWord.word]);

  const handleGuess = useCallback(
    (letter) => {
      if (roundOver || phase !== 'playing') return;
      const normalized = normalizeChar(letter);
      if (wordLettersSet.has(normalized)) {
        SoundService.correct();
      } else {
        SoundService.wrong();
      }
      setGuessed((prev) => {
        const next = new Set(prev);
        next.add(normalized);
        return next;
      });
    },
    [roundOver, phase, wordLettersSet],
  );

  const handleHint = useCallback(() => {
    setShowHint(true);
    setUsedHint(true);
  }, []);

  const handleNextRound = useCallback(() => {
    if (roundIndex + 1 >= ROUNDS_PER_GAME) {
      setPhase('result');
    } else {
      setRoundIndex((prev) => prev + 1);
      setGuessed(new Set());
      setShowHint(false);
      setUsedHint(false);
      setRoundOutcome(null);
      setPhase('playing');
    }
  }, [roundIndex]);

  const handlePlayAgain = useCallback(() => {
    setGameWords(shuffleArray(allWords).slice(0, ROUNDS_PER_GAME));
    setRoundIndex(0);
    setGuessed(new Set());
    setShowHint(false);
    setUsedHint(false);
    setRoundOutcome(null);
    setRoundResults([]);
    setTotalScore(0);
    setPhase('playing');
    xpAwardedRef.current = false;
  }, [allWords]);

  // Loading screen
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: COLORS.dark }}>Wörter werden geladen...</Text>
      </View>
    );
  }

  // Result screen
  if (phase === 'result') {
    const xpAmount = Math.max(0, Math.round(totalScore / 5));
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const solved = roundResults.filter(r => r.won).length;
      const pct = roundResults.length > 0 ? Math.round((solved / roundResults.length) * 100) : 0;
      const starsVal = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
      if (onXpEarned) onXpEarned(xpAmount, 'hangman', { stars: starsVal });
    }
    return (
      <View style={styles.container}>
        <ResultScreen
          rounds={roundResults}
          totalScore={totalScore}
          onPlayAgain={handlePlayAgain}
          onBack={onBack}
          xpAmount={xpAmount}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Galgenmännchen</Text>
          <Text style={styles.headerSub}>
            Runde {roundIndex + 1}/{ROUNDS_PER_GAME}
          </Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Punkte</Text>
          <Text style={styles.scoreValue}>{totalScore}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Mistakes indicator */}
        <View style={styles.mistakesRow}>
          {Array.from({ length: MAX_WRONG }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.mistakeDot,
                i < wrongCount && styles.mistakeDotFilled,
              ]}
            />
          ))}
          <Text style={styles.mistakesText}>
            {wrongCount}/{MAX_WRONG} Fehler
          </Text>
        </View>

        {/* Gallows */}
        <GallowsView wrongCount={wrongCount} />

        {/* Word */}
        <WordDisplay word={wordUpper} guessed={guessed} revealed={isLost} />

        {/* Hint */}
        {!showHint && !roundOver && (
          <TouchableOpacity style={styles.hintBtn} onPress={handleHint} activeOpacity={0.7}>
            <Text style={styles.hintBtnText}>💡 Hinweis anzeigen</Text>
          </TouchableOpacity>
        )}
        {showHint && (
          <View style={styles.hintBox}>
            <Text style={styles.hintLabel}>Hinweis:</Text>
            <Text style={styles.hintText}>{currentWord.hint}</Text>
          </View>
        )}

        {/* Keyboard */}
        <Keyboard
          guessed={guessed}
          wordLetters={wordLettersSet}
          onPress={handleGuess}
          disabled={roundOver}
        />
      </ScrollView>

      {/* Round outcome overlay */}
      {phase === 'outcome' && roundOutcome && (
        <RoundOutcome
          won={roundOutcome.won}
          word={currentWord.word}
          score={roundOutcome.score}
          roundNum={roundIndex + 1}
          totalRounds={ROUNDS_PER_GAME}
          onNext={handleNextRound}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: COLORS.dark,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    color: COLORS.gray,
    fontSize: 13,
    marginTop: 2,
  },
  scoreBox: {
    backgroundColor: 'rgba(243,156,18,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  scoreLabel: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  // Mistakes
  mistakesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  mistakeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 3,
  },
  mistakeDotFilled: {
    backgroundColor: COLORS.red,
  },
  mistakesText: {
    color: COLORS.gray,
    fontSize: 12,
    marginLeft: 8,
  },
  // Word display
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  letterBox: {
    width: 28,
    height: 42,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 3,
    marginVertical: 3,
  },
  letterSpace: {
    width: 16,
  },
  letterMissed: {
    backgroundColor: 'rgba(192,57,43,0.1)',
    borderRadius: 4,
  },
  letterText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 4,
  },
  letterMissedText: {
    color: COLORS.red,
  },
  letterUnderline: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.dark,
    borderRadius: 1.5,
  },
  // Hint
  hintBtn: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginBottom: 10,
  },
  hintBtnText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  hintBox: {
    alignSelf: 'center',
    backgroundColor: 'rgba(243,156,18,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    maxWidth: SCREEN_WIDTH - 64,
  },
  hintLabel: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  hintText: {
    color: COLORS.dark,
    fontSize: 14,
  },
  // Keyboard
  keyboard: {
    marginTop: 6,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  key: {
    minWidth: 28,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2.5,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#D5D8DC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  keyCorrect: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  keyWrong: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  keyUsed: {
    opacity: 0.5,
  },
  keyText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  keyTextCorrect: {
    color: COLORS.white,
  },
  keyTextWrong: {
    color: COLORS.white,
  },
  keyTextUsed: {
    color: COLORS.gray,
  },
  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  outcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    width: SCREEN_WIDTH - 64,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  outcomeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  outcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  outcomeWord: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  outcomeScore: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: '700',
    marginBottom: 4,
  },
  outcomeRound: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 20,
  },
  // Buttons
  btnPrimary: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.gray,
  },
  btnSecondaryText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  // Result screen
  resultContainer: {
    flex: 1,
  },
  resultScroll: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  resultGrade: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  resultScore: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '600',
  },
  roundsList: {
    width: '100%',
    marginBottom: 20,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 6,
  },
  roundIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.green,
    width: 24,
  },
  roundWord: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  roundWordLost: {
    color: COLORS.red,
  },
  roundPts: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
  },
  resultButtons: {
    width: '100%',
    marginTop: 8,
  },
});
