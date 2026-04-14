import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { IMAGES, shuffleArray } from '../data/questions';
import { shuffleQuestionOptions } from '../utils/shuffleOptions';

const PRIZE_LADDER = [
  100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000,
  500000, 1000000,
];
const SAFETY_NETS = [1000, 50000];
const SAFETY_INDICES = SAFETY_NETS
  .map((v) => PRIZE_LADDER.indexOf(v))
  .filter((i) => i !== -1);

const MIN_QUESTIONS = 13;

const COLORS = {
  bg: '#1a1a2e',
  bgLight: '#16213e',
  gold: '#F39C12',
  blue: '#2980B9',
  red: '#C0392B',
  green: '#27AE60',
  white: '#FFFFFF',
  light: '#FFF9F5',
  dark: '#2C3E50',
  gray: '#95A5A6',
  goldDark: '#D4880F',
  bgCard: '#0f3460',
  bgOption: '#1a1a3e',
  bgOptionBorder: '#2980B9',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatPrize(val) {
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getSafetyPrize(currentLevel, ladder, safetyIndices) {
  let safe = 0;
  for (const idx of safetyIndices) {
    if (currentLevel > idx) safe = ladder[idx];
  }
  return safe;
}

function prepareQuestions(questions) {
  // Dedupliziere nach ID und Fragetext
  const seen = new Set();
  const eligible = questions.filter((q) => {
    if (seen.has(q.id) || seen.has(q.question)) return false;
    if ((q.type !== 'multiple_choice' && q.type !== 'image_choice') || !q.options || q.options.length !== 4) return false;
    seen.add(q.id);
    seen.add(q.question);
    return true;
  });
  const count = Math.min(eligible.length, PRIZE_LADDER.length);
  return shuffleArray(eligible).slice(0, count).map(shuffleQuestionOptions);
}

// --- Audience Joker Bar Chart ---
function AudienceChart({ percentages, options, eliminated }) {
  return (
    <View style={styles.audienceContainer}>
      <Text style={styles.jokerTitle}>Publikumsjoker</Text>
      <View style={styles.audienceBars}>
        {options.map((opt, i) => {
          const pct = percentages[i];
          const isEliminated = eliminated.includes(i);
          return (
            <View key={i} style={styles.audienceBarCol}>
              <Text style={styles.audiencePct}>
                {isEliminated ? '-' : `${pct}%`}
              </Text>
              <View style={styles.audienceBarBg}>
                <View
                  style={[
                    styles.audienceBarFill,
                    {
                      height: isEliminated ? 0 : `${pct}%`,
                      backgroundColor:
                        pct >= 40
                          ? COLORS.gold
                          : pct >= 20
                          ? COLORS.blue
                          : COLORS.gray,
                    },
                  ]}
                />
              </View>
              <Text style={styles.audienceLabel}>
                {String.fromCharCode(65 + i)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// --- Phone Joker ---
function PhoneHint({ question }) {
  const hint =
    question.explanation || question.imageHint || 'Ich bin mir nicht sicher...';
  return (
    <View style={styles.phoneContainer}>
      <Text style={styles.jokerTitle}>Telefonjoker</Text>
      <Text style={styles.phoneIcon}>📞</Text>
      <Text style={styles.phoneText}>
        &quot;Ich denke... {hint}&quot;
      </Text>
    </View>
  );
}

// --- Main Game Component ---
export default function MillionaireGame({ questions, onBack, onXpEarned }) {
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [phase, setPhase] = useState('playing'); // playing, suspense, revealed, won, lost, walkaway
  const [jokers, setJokers] = useState({
    fiftyFifty: true,
    audience: true,
    phone: true,
  });
  const [eliminated, setEliminated] = useState([]);
  const [showAudience, setShowAudience] = useState(false);
  const [audienceData, setAudienceData] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [finalPrize, setFinalPrize] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const suspenseAnim = useRef(new Animated.Value(0)).current;
  const ladderScrollRef = useRef(null);
  const xpAwardedRef = useRef(false);

  // Initialize game
  useEffect(() => {
    const prepared = prepareQuestions(questions);
    setGameQuestions(prepared);
  }, [questions]);

  // Award XP when game ends
  useEffect(() => {
    if ((phase === 'won' || phase === 'lost' || phase === 'walkaway') && onXpEarned && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const stars = finalPrize >= 500000 ? 3 : finalPrize >= 50000 ? 2 : finalPrize > 0 ? 1 : 0;
      onXpEarned(Math.round(finalPrize / 3333), 'millionaire', { stars });
    }
  }, [phase, finalPrize, onXpEarned]);

  // Pulse animation for current level
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const currentQuestion = gameQuestions[currentLevel];

  // Generate audience percentages
  const generateAudienceData = useCallback(
    (correctIdx) => {
      const pcts = [0, 0, 0, 0];
      const correctPct = 50 + Math.floor(Math.random() * 21); // 50-70%
      let remaining = 100 - correctPct;

      pcts[correctIdx] = correctPct;
      const others = [0, 1, 2, 3].filter(
        (i) => i !== correctIdx && !eliminated.includes(i),
      );

      others.forEach((i, idx) => {
        if (idx === others.length - 1) {
          pcts[i] = remaining;
        } else {
          const share = Math.floor(Math.random() * (remaining + 1));
          pcts[i] = share;
          remaining -= share;
        }
      });

      return pcts;
    },
    [eliminated],
  );

  // Joker handlers
  const useFiftyFifty = useCallback(() => {
    if (!jokers.fiftyFifty || !currentQuestion || phase !== 'playing') return;
    const correct = currentQuestion.correct;
    const wrong = [0, 1, 2, 3].filter(
      (i) => i !== correct && !eliminated.includes(i),
    );
    const shuffled = shuffleArray(wrong);
    const toEliminate = shuffled.slice(0, 2);
    setEliminated((prev) => [...prev, ...toEliminate]);
    setJokers((prev) => ({ ...prev, fiftyFifty: false }));
  }, [jokers.fiftyFifty, currentQuestion, phase, eliminated]);

  const useAudience = useCallback(() => {
    if (!jokers.audience || !currentQuestion || phase !== 'playing') return;
    const data = generateAudienceData(currentQuestion.correct);
    setAudienceData(data);
    setShowAudience(true);
    setJokers((prev) => ({ ...prev, audience: false }));
  }, [jokers.audience, currentQuestion, phase, generateAudienceData]);

  const usePhone = useCallback(() => {
    if (!jokers.phone || !currentQuestion || phase !== 'playing') return;
    setShowPhone(true);
    setJokers((prev) => ({ ...prev, phone: false }));
  }, [jokers.phone, currentQuestion, phase]);

  // Answer selection
  const selectAnswer = useCallback(
    (idx) => {
      if (phase !== 'playing' || eliminated.includes(idx)) return;
      setSelectedAnswer(idx);
      setPhase('suspense');
      setShowAudience(false);
      setShowPhone(false);

      // Suspense animation
      Animated.sequence([
        Animated.timing(suspenseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(suspenseAnim, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(suspenseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Reveal after dramatic pause
      setTimeout(() => {
        const isCorrect = idx === currentQuestion.correct;
        setPhase('revealed');

        if (isCorrect) {
          if (currentLevel === PRIZE_LADDER.length - 1) {
            // Won the million!
            setTimeout(() => {
              setFinalPrize(PRIZE_LADDER[PRIZE_LADDER.length - 1]);
              setPhase('won');
            }, 1500);
          }
        } else {
          // Wrong answer
          setTimeout(() => {
            setFinalPrize(getSafetyPrize(currentLevel, PRIZE_LADDER, SAFETY_INDICES));
            setPhase('lost');
          }, 2000);
        }
      }, 2200);
    },
    [phase, eliminated, currentQuestion, currentLevel, suspenseAnim],
  );

  // Next question
  const nextQuestion = useCallback(() => {
    setCurrentLevel((prev) => prev + 1);
    setSelectedAnswer(null);
    setPhase('playing');
    setEliminated([]);
    setShowAudience(false);
    setShowPhone(false);
    setAudienceData(null);
  }, []);

  // Walk away
  const walkAway = useCallback(() => {
    const prize =
      currentLevel === 0 ? 0 : PRIZE_LADDER[currentLevel - 1];
    setFinalPrize(prize);
    setPhase('walkaway');
  }, [currentLevel]);

  // Restart
  const restart = useCallback(() => {
    const prepared = prepareQuestions(questions);
    setGameQuestions(prepared);
    setCurrentLevel(0);
    setSelectedAnswer(null);
    setPhase('playing');
    setJokers({ fiftyFifty: true, audience: true, phone: true });
    setEliminated([]);
    setShowAudience(false);
    setShowPhone(false);
    setAudienceData(null);
    setFinalPrize(0);
    xpAwardedRef.current = false;
  }, [questions]);

  // Get option style based on state
  const getOptionStyle = useCallback(
    (idx) => {
      if (eliminated.includes(idx)) return styles.optionEliminated;
      if (phase === 'suspense' && idx === selectedAnswer)
        return styles.optionSelected;
      if (phase === 'revealed') {
        if (idx === currentQuestion.correct) return styles.optionCorrect;
        if (idx === selectedAnswer) return styles.optionWrong;
      }
      return styles.optionDefault;
    },
    [eliminated, phase, selectedAnswer, currentQuestion],
  );

  const getOptionTextStyle = useCallback(
    (idx) => {
      if (eliminated.includes(idx)) return styles.optionTextEliminated;
      if (phase === 'revealed' && idx === currentQuestion?.correct)
        return styles.optionTextCorrect;
      if (phase === 'revealed' && idx === selectedAnswer)
        return styles.optionTextWrong;
      if (phase === 'suspense' && idx === selectedAnswer)
        return styles.optionTextSelected;
      return styles.optionText;
    },
    [eliminated, phase, selectedAnswer, currentQuestion],
  );

  // --- End Screens ---
  if (phase === 'won' || phase === 'lost' || phase === 'walkaway') {
    const isWon = phase === 'won';
    const isWalkaway = phase === 'walkaway';
    return (
      <View style={styles.container}>
        <View style={styles.endScreen}>
          <Text
            style={[
              styles.endTitle,
              {
                color: isWon
                  ? COLORS.gold
                  : isWalkaway
                  ? COLORS.blue
                  : COLORS.red,
              },
            ]}>
            {isWon
              ? 'MILLIONÄR!'
              : isWalkaway
              ? 'AUFGEGEBEN'
              : 'LEIDER VERLOREN'}
          </Text>
          <Text style={styles.endSubtitle}>
            {isWon
              ? 'Herzlichen Glückwunsch!'
              : isWalkaway
              ? 'Kluge Entscheidung!'
              : 'Das war leider falsch.'}
          </Text>
          <View style={styles.endPrizeBox}>
            <Text style={styles.endPrizeLabel}>Dein Gewinn:</Text>
            <Text
              style={[
                styles.endPrizeValue,
                {
                  color: isWon
                    ? COLORS.gold
                    : finalPrize > 0
                    ? COLORS.green
                    : COLORS.red,
                },
              ]}>
              {formatPrize(finalPrize)} EUR
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{Math.round(finalPrize / 3333)} XP verdient!
          </Text>
          {phase === 'lost' && currentQuestion && (
            <View style={styles.endExplanation}>
              <Text style={styles.endExplanationLabel}>
                Richtige Antwort:
              </Text>
              <Text style={styles.endExplanationText}>
                {currentQuestion.options[currentQuestion.correct]}
              </Text>
              {currentQuestion.explanation && (
                <Text style={styles.endExplanationDetail}>
                  {currentQuestion.explanation}
                </Text>
              )}
            </View>
          )}
          <View style={styles.endButtons}>
            <TouchableOpacity
              style={styles.endButtonPrimary}
              onPress={restart}>
              <Text style={styles.endButtonText}>Nochmal spielen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.endButtonSecondary}
              onPress={onBack}>
              <Text style={styles.endButtonSecondaryText}>Zurück</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Not enough questions
  if (gameQuestions.length < MIN_QUESTIONS) {
    return (
      <View style={styles.container}>
        <View style={styles.endScreen}>
          <Text style={styles.endTitle}>Nicht genügend Fragen</Text>
          <Text style={styles.endSubtitle}>
            Es werden mindestens {MIN_QUESTIONS} Multiple-Choice-Fragen mit 4 Optionen
            benötigt.
          </Text>
          <TouchableOpacity style={styles.endButtonPrimary} onPress={onBack}>
            <Text style={styles.endButtonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentQuestion) return null;

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wer wird Millionär?</Text>
        <Text style={styles.headerPrize}>
          Frage {currentLevel + 1} / {PRIZE_LADDER.length}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Prize Ladder */}
        <View style={styles.ladderContainer}>
          <ScrollView
            ref={ladderScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ladderScroll}>
            {PRIZE_LADDER.map((prize, idx) => {
              const isCurrent = idx === currentLevel;
              const isPast = idx < currentLevel;
              const isSafety = SAFETY_NETS.includes(prize);
              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.ladderItem,
                    isPast && styles.ladderItemPast,
                    isCurrent && styles.ladderItemCurrent,
                    isSafety && !isCurrent && styles.ladderItemSafety,
                    isCurrent && { transform: [{ scale: pulseAnim }] },
                  ]}>
                  <Text
                    style={[
                      styles.ladderNumber,
                      isCurrent && styles.ladderNumberCurrent,
                      isPast && styles.ladderNumberPast,
                    ]}>
                    {idx + 1}
                  </Text>
                  <Text
                    style={[
                      styles.ladderPrize,
                      isCurrent && styles.ladderPrizeCurrent,
                      isPast && styles.ladderPrizePast,
                      isSafety && !isCurrent && styles.ladderPrizeSafety,
                    ]}>
                    {formatPrize(prize)}
                  </Text>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>

        {/* Jokers */}
        <View style={styles.jokerRow}>
          <TouchableOpacity
            style={[
              styles.jokerBtn,
              !jokers.fiftyFifty && styles.jokerBtnUsed,
            ]}
            onPress={useFiftyFifty}
            disabled={!jokers.fiftyFifty || phase !== 'playing'}>
            <Text
              style={[
                styles.jokerText,
                !jokers.fiftyFifty && styles.jokerTextUsed,
              ]}>
              50:50
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.jokerBtn,
              !jokers.audience && styles.jokerBtnUsed,
            ]}
            onPress={useAudience}
            disabled={!jokers.audience || phase !== 'playing'}>
            <Text
              style={[
                styles.jokerText,
                !jokers.audience && styles.jokerTextUsed,
              ]}>
              Publikum
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.jokerBtn, !jokers.phone && styles.jokerBtnUsed]}
            onPress={usePhone}
            disabled={!jokers.phone || phase !== 'playing'}>
            <Text
              style={[
                styles.jokerText,
                !jokers.phone && styles.jokerTextUsed,
              ]}>
              Telefon
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.walkAwayBtn}
            onPress={walkAway}
            disabled={phase !== 'playing'}>
            <Text style={styles.walkAwayText}>Aufgeben</Text>
          </TouchableOpacity>
        </View>

        {/* Audience Joker Result */}
        {showAudience && audienceData && (
          <AudienceChart
            percentages={audienceData}
            options={currentQuestion.options}
            eliminated={eliminated}
          />
        )}

        {/* Phone Joker Result */}
        {showPhone && <PhoneHint question={currentQuestion} />}

        {/* Image (if image_choice) */}
        {currentQuestion.type === 'image_choice' && currentQuestion.image && (
          <View style={styles.imageContainer}>
            <Image
              source={IMAGES[currentQuestion.image]}
              style={styles.questionImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Question */}
        <View style={styles.questionBox}>
          <Text style={styles.questionPrizeTag}>
            Für {formatPrize(PRIZE_LADDER[currentLevel])} EUR
          </Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {currentQuestion.options.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.optionBtn, getOptionStyle(idx)]}
              onPress={() => selectAnswer(idx)}
              disabled={
                phase !== 'playing' || eliminated.includes(idx)
              }>
              <Animated.View
                style={[
                  styles.optionInner,
                  phase === 'suspense' &&
                    idx === selectedAnswer && {
                      opacity: suspenseAnim,
                    },
                ]}>
                <Text style={[styles.optionLetter, getOptionTextStyle(idx)]}>
                  {letters[idx]}:
                </Text>
                <Text
                  style={[styles.optionContent, getOptionTextStyle(idx)]}
                  numberOfLines={3}>
                  {opt}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revealed: explanation + next */}
        {phase === 'revealed' && (
          <View style={styles.revealedBox}>
            {currentQuestion.explanation && (
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            )}
            {selectedAnswer === currentQuestion.correct && (
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={nextQuestion}>
                <Text style={styles.nextBtnText}>
                  Nächste Frage →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: COLORS.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '40',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.red + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.gold,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerPrize: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Ladder
  ladderContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '20',
  },
  ladderScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  ladderItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray + '30',
    alignItems: 'center',
    minWidth: 56,
  },
  ladderItemPast: {
    backgroundColor: COLORS.green + '20',
    borderColor: COLORS.green + '40',
  },
  ladderItemCurrent: {
    backgroundColor: COLORS.gold + '30',
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  ladderItemSafety: {
    borderColor: COLORS.gold + '60',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  ladderNumber: {
    color: COLORS.gray,
    fontSize: 10,
    fontWeight: '600',
  },
  ladderNumberCurrent: {
    color: COLORS.gold,
  },
  ladderNumberPast: {
    color: COLORS.green,
  },
  ladderPrize: {
    color: COLORS.gray,
    fontSize: 11,
    fontWeight: '700',
  },
  ladderPrizeCurrent: {
    color: COLORS.gold,
    fontSize: 13,
  },
  ladderPrizePast: {
    color: COLORS.green,
  },
  ladderPrizeSafety: {
    color: COLORS.gold + 'CC',
  },

  // Jokers
  jokerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  jokerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold + '15',
  },
  jokerBtnUsed: {
    borderColor: COLORS.gray + '40',
    backgroundColor: COLORS.gray + '10',
  },
  jokerText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  jokerTextUsed: {
    color: COLORS.gray + '60',
    textDecorationLine: 'line-through',
  },
  walkAwayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.red + '80',
    backgroundColor: COLORS.red + '15',
  },
  walkAwayText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '700',
  },

  // Audience
  audienceContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.blue + '40',
  },
  jokerTitle: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  audienceBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  audienceBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  audiencePct: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  audienceBarBg: {
    width: 32,
    height: 70,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  audienceBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  audienceLabel: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },

  // Phone
  phoneContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.blue + '40',
  },
  phoneIcon: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 6,
  },
  phoneText: {
    color: COLORS.light,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Image
  imageContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  },
  questionImage: {
    width: '100%',
    height: 180,
  },

  // Question
  questionBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gold + '50',
  },
  questionPrizeTag: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Options
  optionsGrid: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  optionBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionDefault: {
    backgroundColor: COLORS.bgOption,
    borderColor: COLORS.bgOptionBorder + '60',
  },
  optionSelected: {
    backgroundColor: COLORS.gold + '30',
    borderColor: COLORS.gold,
  },
  optionCorrect: {
    backgroundColor: COLORS.green + '30',
    borderColor: COLORS.green,
  },
  optionWrong: {
    backgroundColor: COLORS.red + '30',
    borderColor: COLORS.red,
  },
  optionEliminated: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.gray + '20',
    opacity: 0.3,
  },
  optionLetter: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 10,
    width: 24,
  },
  optionContent: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  optionText: {
    color: COLORS.white,
  },
  optionTextSelected: {
    color: COLORS.gold,
  },
  optionTextCorrect: {
    color: COLORS.green,
  },
  optionTextWrong: {
    color: COLORS.red,
  },
  optionTextEliminated: {
    color: COLORS.gray + '50',
  },

  // Revealed
  revealedBox: {
    marginHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  explanationText: {
    color: COLORS.light,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  nextBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: COLORS.gold,
    borderRadius: 24,
  },
  nextBtnText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '700',
  },

  // End Screen
  endScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  endTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  endSubtitle: {
    color: COLORS.light,
    fontSize: 16,
    marginBottom: 28,
    textAlign: 'center',
  },
  endPrizeBox: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gold + '50',
    alignItems: 'center',
    marginBottom: 20,
  },
  endPrizeLabel: {
    color: COLORS.gray,
    fontSize: 14,
    marginBottom: 6,
  },
  endPrizeValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  endExplanation: {
    backgroundColor: COLORS.bgCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.red + '40',
    width: '100%',
  },
  endExplanationLabel: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  endExplanationText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  endExplanationDetail: {
    color: COLORS.light,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  endButtons: {
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  endButtonPrimary: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  endButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '700',
  },
  endButtonSecondary: {
    borderWidth: 1.5,
    borderColor: COLORS.gray + '60',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  endButtonSecondaryText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
});
