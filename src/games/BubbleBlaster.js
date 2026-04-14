import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, SafeAreaView,
} from 'react-native';
import { shuffleQuestionOptions } from '../utils/shuffleOptions';
import SoundService from '../utils/SoundService';

const { width: W, height: H } = Dimensions.get('window');
const GAME_H = H - 200; // Spielfeld-Höhe (abzüglich Header + Frage)
const BUBBLE_MIN = 70;
const BUBBLE_MAX = 140;
const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 12;

function getBubbleSize(text) {
  const len = text.length;
  if (len <= 5) return BUBBLE_MIN;
  if (len >= 30) return BUBBLE_MAX;
  return BUBBLE_MIN + ((len - 5) / 25) * (BUBBLE_MAX - BUBBLE_MIN);
}

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
  purple: '#8E44AD',
};

const BUBBLE_COLORS = ['#E74C3C', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C', '#F1C40F'];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generiert eine zufällige Startposition und Geschwindigkeit für eine Blase
function randomBubbleState(index, total, size) {
  const margin = size / 2 + 10;
  const maxX = W - size - 20;
  const maxY = GAME_H - size - 20;
  const col = index % 2;
  const row = Math.floor(index / 2);
  const baseX = margin + col * (maxX / 2) + Math.random() * 40 - 20;
  const baseY = margin + row * (maxY / Math.ceil(total / 2)) + Math.random() * 30 - 15;
  return {
    x: Math.max(margin, Math.min(maxX, baseX)),
    y: Math.max(margin, Math.min(maxY, baseY)),
    dx: (Math.random() - 0.5) * 2.5,
    dy: (Math.random() - 0.5) * 2.5,
  };
}

function Bubble({ text, color, x, y, dx, dy, size, onPop, popped, correct }) {
  const posX = useRef(new Animated.Value(x)).current;
  const posY = useRef(new Animated.Value(y)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const moveRef = useRef({ x, y, dx, dy });
  const animFrame = useRef(null);

  // Einblenden
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
  }, []);

  // Bewegung
  useEffect(() => {
    if (popped) return;
    const maxX = W - size - 20;
    const maxY = GAME_H - size - 20;
    const margin = 10;

    const move = () => {
      const m = moveRef.current;
      m.x += m.dx;
      m.y += m.dy;

      // Wandabprall
      if (m.x <= margin || m.x >= maxX) { m.dx *= -1; m.x = Math.max(margin, Math.min(maxX, m.x)); }
      if (m.y <= margin || m.y >= maxY) { m.dy *= -1; m.y = Math.max(margin, Math.min(maxY, m.y)); }

      posX.setValue(m.x);
      posY.setValue(m.y);
      animFrame.current = requestAnimationFrame(move);
    };
    animFrame.current = requestAnimationFrame(move);
    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, [popped]);

  // Pop-Animation
  useEffect(() => {
    if (popped) {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      Animated.timing(scale, {
        toValue: correct ? 1.5 : 0, duration: 300, useNativeDriver: true,
      }).start();
    }
  }, [popped, correct]);

  const bgColor = popped
    ? (correct ? C.green : C.red)
    : color;

  const fontSize = size <= 80 ? 11 : size <= 100 ? 12 : 13;

  return (
    <Animated.View style={[
      styles.bubble,
      {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: bgColor,
        transform: [
          { translateX: posX },
          { translateY: posY },
          { scale },
        ],
        opacity: popped && !correct ? scale.interpolate({
          inputRange: [0, 1], outputRange: [0, 1],
        }) : 1,
      },
    ]}>
      <TouchableOpacity
        style={styles.bubbleTouch}
        onPress={onPop}
        disabled={popped}
        activeOpacity={0.7}
      >
        <Text style={[styles.bubbleText, { fontSize }]} numberOfLines={4} adjustsFontSizeToFit>
          {popped && correct ? '✓' : text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BubbleBlaster({ questions, onBack, onXpEarned }) {
  const allQs = useRef(
    shuffleArray(questions.filter(q => q.type !== 'fill_blank' && q.options && q.options.length >= 3))
      .slice(0, TOTAL_QUESTIONS)
      .map(shuffleQuestionOptions)
  ).current;

  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [popped, setPopped] = useState(null); // Index der geplatzten Blase
  const [finished, setFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', 'timeout'
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerBarAnim = useRef(new Animated.Value(1)).current;

  const q = allQs[qIdx];

  // Timer
  useEffect(() => {
    if (finished || popped !== null || !q) return;
    timerBarAnim.setValue(1);
    Animated.timing(timerBarAnim, {
      toValue: 0, duration: TIME_PER_QUESTION * 1000, useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qIdx, finished]);

  const showFeedback = useCallback((type) => {
    setFeedback(type);
    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(feedbackAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleTimeout = useCallback(() => {
    SoundService.timeout();
    setPopped(-1);
    setStreak(0);
    showFeedback('timeout');
    setTimeout(nextQuestion, 1500);
  }, [qIdx]);

  const handlePop = useCallback((index) => {
    if (popped !== null || finished) return;
    setPopped(index);

    const isCorrect = index === q.correct;
    if (isCorrect) {
      SoundService.correct();
      const bonus = Math.ceil(timeLeft * 10);
      const streakBonus = streak >= 2 ? streak * 5 : 0;
      setScore(s => s + 50 + bonus + streakBonus);
      setStreak(s => {
        const next = s + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      setCorrectCount(c => c + 1);
      if (streak >= 2) SoundService.streak();
      showFeedback('correct');
    } else {
      SoundService.wrong();
      setStreak(0);
      showFeedback('wrong');
    }
    setTimeout(nextQuestion, 1500);
  }, [popped, finished, q, timeLeft, streak, bestStreak, qIdx]);

  const nextQuestion = useCallback(() => {
    if (qIdx + 1 >= allQs.length) {
      setFinished(true);
    } else {
      setQIdx(i => i + 1);
      setPopped(null);
      setTimeLeft(TIME_PER_QUESTION);
    }
  }, [qIdx]);

  // XP vergeben
  useEffect(() => {
    if (finished && !xpAwarded) {
      SoundService.success();
      setXpAwarded(true);
      const earned = Math.round(score / 10) + correctCount * 3;
      const pctVal = allQs.length > 0 ? Math.round((correctCount / allQs.length) * 100) : 0;
      const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
      if (earned > 0) onXpEarned(earned, 'bubbleblaster', { stars: starsVal, streak: bestStreak });
    }
  }, [finished]);

  // Blasen-Positionen für aktuelle Frage
  const bubbles = q ? q.options.map((opt, i) => {
    const size = getBubbleSize(opt);
    return {
      text: opt,
      color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
      size,
      ...randomBubbleState(i, q.options.length, size),
    };
  }) : [];

  if (finished) {
    const pct = Math.round((correctCount / allQs.length) * 100);
    const earned = Math.round(score / 10) + correctCount * 3;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultBox}>
          <Text style={styles.resultEmoji}>
            {pct >= 80 ? '🎯' : pct >= 50 ? '💪' : '🫧'}
          </Text>
          <Text style={styles.resultTitle}>
            {pct >= 80 ? 'Bubble Master!' : pct >= 50 ? 'Gut gemacht!' : 'Weiter üben!'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{correctCount}/{allQs.length}</Text>
              <Text style={styles.statLabel}>Richtig</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{score}</Text>
              <Text style={styles.statLabel}>Punkte</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{bestStreak}x</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <Text style={styles.xpText}>+{earned} XP verdient!</Text>
          <TouchableOpacity style={styles.btn} onPress={onBack}>
            <Text style={styles.btnTxt}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!q) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.scoreText}>💎 {score}</Text>
        <Text style={styles.progressText}>{qIdx + 1}/{allQs.length}</Text>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerBar}>
        <Animated.View style={[
          styles.timerFill,
          {
            width: timerBarAnim.interpolate({
              inputRange: [0, 1], outputRange: ['0%', '100%'],
            }),
            backgroundColor: timerBarAnim.interpolate({
              inputRange: [0, 0.3, 1], outputRange: [C.red, C.gold, C.green],
            }),
          },
        ]} />
      </View>

      {/* Frage */}
      <View style={styles.questionBox}>
        <Text style={styles.questionText} numberOfLines={3} adjustsFontSizeToFit>
          {q.question}
        </Text>
        {streak >= 3 && (
          <Text style={styles.streakBadge}>🔥 {streak}x Streak!</Text>
        )}
      </View>

      {/* Spielfeld mit Blasen */}
      <View style={[styles.gameField, { height: GAME_H }]}>
        {bubbles.map((b, i) => (
          <Bubble
            key={`${qIdx}-${i}`}
            text={b.text}
            color={b.color}
            size={b.size}
            x={b.x}
            y={b.y}
            dx={b.dx}
            dy={b.dy}
            popped={popped === i || popped === -1}
            correct={i === q.correct}
            onPop={() => handlePop(i)}
          />
        ))}

        {/* Feedback Banner */}
        {feedback && (
          <Animated.View style={[
            styles.feedbackBanner,
            { opacity: feedbackAnim },
            feedback === 'correct' ? styles.feedbackCorrect :
            feedback === 'timeout' ? styles.feedbackTimeout :
            styles.feedbackWrong,
          ]}>
            <Text style={styles.feedbackText}>
              {feedback === 'correct' ? '✓ Richtig!' :
               feedback === 'timeout' ? '⏰ Zeit abgelaufen!' :
               '✗ Falsch!'}
            </Text>
            {feedback !== 'correct' && (
              <Text style={styles.feedbackAnswer}>
                Richtig: {q.options[q.correct]}
              </Text>
            )}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a2e' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backTxt: { fontSize: 15, fontWeight: '700', color: '#7ec8e3' },
  scoreText: { fontSize: 18, fontWeight: '900', color: C.gold },
  progressText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

  timerBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16, borderRadius: 3, overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 3 },

  questionBox: {
    paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center',
  },
  questionText: {
    fontSize: 18, fontWeight: '800', color: C.white, textAlign: 'center',
    lineHeight: 24,
  },
  streakBadge: {
    fontSize: 14, fontWeight: '800', color: C.gold, marginTop: 4,
  },

  gameField: {
    flex: 1, position: 'relative', overflow: 'hidden',
  },

  bubble: {
    position: 'absolute',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  bubbleTouch: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    padding: 10,
  },
  bubbleText: {
    fontWeight: '800', color: C.white, textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  feedbackBanner: {
    position: 'absolute', top: '35%', left: 20, right: 20,
    borderRadius: 16, padding: 16, alignItems: 'center',
  },
  feedbackCorrect: { backgroundColor: 'rgba(39,174,96,0.95)' },
  feedbackWrong: { backgroundColor: 'rgba(192,57,43,0.95)' },
  feedbackTimeout: { backgroundColor: 'rgba(243,156,18,0.95)' },
  feedbackText: { fontSize: 22, fontWeight: '900', color: C.white },
  feedbackAnswer: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  resultBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultTitle: { fontSize: 28, fontWeight: '900', color: C.white, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    padding: 16, alignItems: 'center', minWidth: 80,
  },
  statNum: { fontSize: 24, fontWeight: '900', color: C.white },
  statLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  xpText: { fontSize: 20, fontWeight: '900', color: C.gold, marginBottom: 24 },
  btn: {
    backgroundColor: '#7ec8e3', borderRadius: 16, paddingVertical: 14,
    paddingHorizontal: 40,
  },
  btnTxt: { fontSize: 18, fontWeight: '900', color: '#0a0a2e' },
});
