import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { IMAGES } from '../data/questions';
import { shuffleQuestionOptions } from '../utils/shuffleOptions';
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

const TIME_PER_QUESTION = 10;
const BASE_POINTS = 100;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SpeedQuiz({ questions, onBack, onXpEarned }) {
  const speedQuestions = useRef(
    shuffleArray(questions.filter((q) => q.type !== 'fill_blank')).map(shuffleQuestionOptions)
  ).current;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const timerBarAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(1)).current;
  const pointsPopAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const xpAwardedRef = useRef(false);
  const questionStartTime = useRef(Date.now());

  const currentQuestion = speedQuestions[currentIndex];

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
  }, []);

  const advanceQuestion = useCallback(() => {
    if (currentIndex + 1 >= speedQuestions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowFeedback(false);
      setTimeLeft(TIME_PER_QUESTION);
      timerBarAnim.setValue(1);
      feedbackAnim.setValue(0);
      pointsPopAnim.setValue(0);
      questionStartTime.current = Date.now();
    }
  }, [currentIndex, speedQuestions.length, timerBarAnim, feedbackAnim, pointsPopAnim]);

  // Start countdown timer for each question
  useEffect(() => {
    if (finished || showFeedback) return;

    questionStartTime.current = Date.now();
    timerBarAnim.setValue(1);

    animRef.current = Animated.timing(timerBarAnim, {
      toValue: 0,
      duration: TIME_PER_QUESTION * 1000,
      useNativeDriver: false,
    });
    animRef.current.start();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Time ran out
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => stopTimer();
  }, [currentIndex, finished]);

  useEffect(() => {
    if (finished && onXpEarned && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      SoundService.success();
      const pct = speedQuestions.length > 0 ? Math.round((correctCount / speedQuestions.length) * 100) : 0;
      const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
      onXpEarned(Math.round(score / 10), 'speed', { stars, streak, isSpeedQuiz: true });
    }
  }, [finished, score, onXpEarned]);

  const handleTimeout = () => {
    SoundService.timeout();
    setShowFeedback(true);
    setStreak(0);
    const elapsed = (Date.now() - questionStartTime.current) / 1000;
    setTotalTime((t) => t + elapsed);
    showFeedbackAnimation(false);
    setTimeout(advanceQuestion, 1500);
  };

  const showFeedbackAnimation = (isCorrect) => {
    feedbackAnim.setValue(0);
    Animated.timing(feedbackAnim, {
      toValue: isCorrect ? 1 : -1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const showPointsAnimation = () => {
    pointsPopAnim.setValue(1);
    Animated.timing(pointsPopAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const animateStreak = () => {
    streakAnim.setValue(1.4);
    Animated.spring(streakAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleAnswer = (optionIndex) => {
    if (selected !== null || showFeedback) return;

    stopTimer();
    setSelected(optionIndex);
    setShowFeedback(true);

    const elapsed = (Date.now() - questionStartTime.current) / 1000;
    setTotalTime((t) => t + elapsed);

    const isCorrect = optionIndex === currentQuestion.correct;

    if (isCorrect) {
      SoundService.correct();
      const timeBonus = Math.round((timeLeft / TIME_PER_QUESTION) * 50);
      const newStreak = streak + 1;
      const multiplier = Math.min(newStreak, 5);
      const points = (BASE_POINTS + timeBonus) * multiplier;

      setScore((s) => s + points);
      setStreak(newStreak);
      setCorrectCount((c) => c + 1);
      setBestStreak((b) => Math.max(b, newStreak));
      setEarnedPoints(points);
      showPointsAnimation();

      if (newStreak >= 2) {
        animateStreak();
      }
    } else {
      SoundService.wrong();
      setStreak(0);
      setEarnedPoints(0);
    }

    showFeedbackAnimation(isCorrect);
    setTimeout(advanceQuestion, 1500);
  };

  // Results screen
  if (finished || speedQuestions.length === 0) {
    if (speedQuestions.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.resultTitle}>Keine passenden Fragen</Text>
          <Text style={styles.resultSubtext}>
            Es gibt keine Multiple-Choice-Fragen für den Speed-Modus.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const avgTime =
      speedQuestions.length > 0
        ? (totalTime / speedQuestions.length).toFixed(1)
        : 0;
    const accuracy =
      speedQuestions.length > 0
        ? Math.round((correctCount / speedQuestions.length) * 100)
        : 0;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.resultContainer}
      >
        <Text style={styles.resultEmoji}>
          {accuracy >= 80 ? '\u{1F3C6}' : accuracy >= 50 ? '\u{1F44D}' : '\u{1F4AA}'}
        </Text>
        <Text style={styles.resultTitle}>Speed-Quiz beendet!</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
          +{Math.round(score / 10)} XP verdient!
        </Text>

        <View style={styles.resultCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Punkte</Text>
            <Text style={[styles.statValue, { color: COLORS.gold }]}>{score}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Richtig</Text>
            <Text style={[styles.statValue, { color: COLORS.green }]}>
              {correctCount} / {speedQuestions.length}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Genauigkeit</Text>
            <Text style={[styles.statValue, { color: COLORS.blue }]}>{accuracy}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Beste Serie</Text>
            <Text style={[styles.statValue, { color: COLORS.red }]}>
              x{bestStreak}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Durchschnittszeit</Text>
            <Text style={[styles.statValue, { color: COLORS.dark }]}>{avgTime}s</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Zurück zum Menü</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Feedback overlay color
  const feedbackBg = feedbackAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [
      'rgba(192,57,43,0.15)',
      'rgba(0,0,0,0)',
      'rgba(39,174,96,0.15)',
    ],
  });

  const timerBarWidth = timerBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const timerBarColor = timerBarAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [COLORS.red, COLORS.red, COLORS.gold, COLORS.green],
  });

  const pointsTranslateY = pointsPopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 0],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: feedbackBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Speed-Quiz</Text>
        <Text style={styles.headerScore}>{score} Pkt</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {speedQuestions.length}
        </Text>
        {streak >= 2 && (
          <Animated.Text
            style={[
              styles.streakBadge,
              { transform: [{ scale: streakAnim }] },
            ]}
          >
            x{streak} Serie!
          </Animated.Text>
        )}
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarContainer}>
        <Animated.View
          style={[
            styles.timerBar,
            { width: timerBarWidth, backgroundColor: timerBarColor },
          ]}
        />
      </View>
      <Text style={[styles.timerText, timeLeft <= 3 && { color: COLORS.red }]}>
        {timeLeft}s
      </Text>

      {/* Points pop-up */}
      {earnedPoints > 0 && showFeedback && selected === currentQuestion.correct && (
        <Animated.Text
          style={[
            styles.pointsPop,
            {
              opacity: pointsPopAnim,
              transform: [{ translateY: pointsTranslateY }],
            },
          ]}
        >
          +{earnedPoints}
        </Animated.Text>
      )}

      {/* Question area */}
      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionScrollContent}
      >
        {currentQuestion.image && IMAGES[currentQuestion.image] && (
          <Image
            source={IMAGES[currentQuestion.image]}
            style={styles.questionImage}
            resizeMode="contain"
          />
        )}

        <Text style={styles.topicLabel}>{currentQuestion.topic}</Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            let optionStyle = styles.option;
            let textStyle = styles.optionText;

            if (showFeedback) {
              if (index === currentQuestion.correct) {
                optionStyle = [styles.option, styles.optionCorrect];
                textStyle = [styles.optionText, styles.optionTextHighlight];
              } else if (index === selected && index !== currentQuestion.correct) {
                optionStyle = [styles.option, styles.optionWrong];
                textStyle = [styles.optionText, styles.optionTextHighlight];
              }
            } else if (index === selected) {
              optionStyle = [styles.option, styles.optionSelected];
            }

            return (
              <TouchableOpacity
                key={index}
                style={optionStyle}
                onPress={() => handleAnswer(index)}
                activeOpacity={0.7}
                disabled={showFeedback}
              >
                <Text style={textStyle}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback text after answer */}
        {showFeedback && (
          <View style={styles.feedbackBox}>
            {selected === currentQuestion.correct ? (
              <Text style={[styles.feedbackText, { color: COLORS.green }]}>
                Richtig!
              </Text>
            ) : (
              <Text style={[styles.feedbackText, { color: COLORS.red }]}>
                {selected === null ? 'Zeit abgelaufen!' : 'Falsch!'}
                {' '}Richtig: {currentQuestion.options[currentQuestion.correct]}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: COLORS.dark,
  },
  headerBackBtn: {
    padding: 8,
  },
  headerBackText: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
  },
  // Progress
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  streakBadge: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gold,
  },
  // Timer bar
  timerBarContainer: {
    height: 8,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timerBar: {
    height: '100%',
    borderRadius: 4,
  },
  timerText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: 4,
    marginBottom: 4,
  },
  // Points pop
  pointsPop: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.gold,
  },
  // Question
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  questionImage: {
    width: SCREEN_WIDTH - 32,
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    marginTop: 8,
    alignSelf: 'center',
  },
  topicLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 16,
    lineHeight: 26,
  },
  // Options
  optionsContainer: {
    gap: 10,
  },
  option: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    borderColor: COLORS.blue,
    backgroundColor: '#EBF5FB',
  },
  optionCorrect: {
    borderColor: COLORS.green,
    backgroundColor: '#EAFAF1',
  },
  optionWrong: {
    borderColor: COLORS.red,
    backgroundColor: '#FDEDEC',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: '500',
  },
  optionTextHighlight: {
    fontWeight: '700',
    color: COLORS.white,
  },
  // Feedback
  feedbackBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Results
  resultContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 24,
    textAlign: 'center',
  },
  resultSubtext: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  backButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
