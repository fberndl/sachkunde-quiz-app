import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
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

const TIME_PER_QUESTION = 5;
const TOTAL_QUESTIONS = 15;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateStatements(questions) {
  const statements = [];

  const mcQuestions = questions.filter(
    q => (q.type === 'multiple_choice' || q.type === 'image_choice') && q.options && q.correct !== undefined
  );

  for (const q of mcQuestions) {
    const correctAnswer = q.options[q.correct];

    // TRUE statement from correct answer
    statements.push({
      text: buildStatement(q.question, correctAnswer),
      isTrue: true,
      explanation: q.explanation || `Die richtige Antwort ist: ${correctAnswer}`,
      source: q.question,
    });

    // FALSE statement from a wrong answer
    const wrongOptions = q.options.filter((_, i) => i !== q.correct);
    if (wrongOptions.length > 0) {
      const wrongAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      statements.push({
        text: buildStatement(q.question, wrongAnswer),
        isTrue: false,
        explanation: `Falsch! ${q.explanation || `Die richtige Antwort ist: ${correctAnswer}`}`,
        source: q.question,
      });
    }
  }

  // Fill-blank questions
  const fillQuestions = questions.filter(q => q.type === 'fill_blank' && q.blanks);
  for (const q of fillQuestions) {
    const correctBlank = q.blanks[0];
    statements.push({
      text: q.question.replace('___', correctBlank),
      isTrue: true,
      explanation: `Richtig! ${q.question.replace('___', correctBlank)}`,
      source: q.question,
    });
  }

  return shuffleArray(statements);
}

function buildStatement(question, answer) {
  // Try to form a natural statement
  const q = question.replace(/\?$/, '').trim();

  if (/^Wie viele/i.test(q)) {
    return q.replace(/^Wie viele/i, answer) + '.';
  }
  if (/^Wie heißt/i.test(q)) {
    const subject = q.replace(/^Wie heißt\s*/i, '');
    return `${subject} heißt ${answer}.`;
  }
  if (/^Wie hoch/i.test(q)) {
    const subject = q.replace(/^Wie hoch ist\s*/i, '');
    return `${subject} ist ${answer} hoch.`;
  }
  if (/^Wie lang/i.test(q)) {
    const subject = q.replace(/^Wie lang ist\s*/i, '');
    return `${subject} ist ${answer} lang.`;
  }
  if (/^Wie breit/i.test(q)) {
    const subject = q.replace(/^Wie breit ist\s*/i, '');
    return `${subject} ist ${answer} breit.`;
  }
  if (/^Was ist/i.test(q)) {
    const subject = q.replace(/^Was ist\s*/i, '');
    return `${subject} ist ${answer}.`;
  }
  if (/^Was befindet sich/i.test(q)) {
    return `${answer} befindet sich ${q.replace(/^Was befindet sich\s*/i, '')}.`;
  }
  if (/^Was steht/i.test(q)) {
    return `${answer} steht ${q.replace(/^Was steht\s*/i, '')}.`;
  }
  if (/^In welchem Bezirk/i.test(q)) {
    const building = q.replace(/^In welchem Bezirk liegt\s*/i, '');
    return `${building} liegt im ${answer}.`;
  }
  if (/^In welchem Abschnitt/i.test(q)) {
    const building = q.replace(/^In welchem Abschnitt liegt\s*/i, '');
    return `${building} liegt am ${answer}.`;
  }
  if (/^In welchem Planquadrat/i.test(q)) {
    const building = q.replace(/^In welchem Planquadrat liegt\s*/i, '');
    return `${building} liegt im Planquadrat ${answer}.`;
  }
  if (/^Welch/i.test(q)) {
    return `Die Antwort ist: ${answer}.`;
  }
  if (/^Wer /i.test(q)) {
    return `${answer} ${q.replace(/^Wer\s*/i, '')}.`;
  }
  if (/^Wo /i.test(q)) {
    return `${answer} - ${q.replace(/^Wo\s*/i, '')}.`;
  }
  if (/^Warum/i.test(q)) {
    return `${q}: ${answer}.`;
  }
  if (/^Womit/i.test(q)) {
    return `${answer} - ${q.replace(/^Womit\s*/i, '')}.`;
  }
  if (/^Wohin/i.test(q)) {
    return `${answer} - ${q.replace(/^Wohin\s*/i, '')}.`;
  }
  if (/^Aus wie vielen/i.test(q)) {
    return `${q.replace(/^Aus wie vielen/i, `Aus ${answer}`)} Abschnitten.`;
  }

  // Fallback
  return `${q}: ${answer}.`;
}

export default function TrueFalseBlitz({ questions, onBack, onXpEarned }) {
  const allStatements = useRef(generateStatements(questions)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [answered, setAnswered] = useState(null); // 'correct', 'wrong', 'timeout'
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);
  const xpAwardedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const totalQ = Math.min(TOTAL_QUESTIONS, allStatements.length);
  const statement = allStatements[currentIndex];

  const endGame = useCallback(() => {
    clearInterval(timerRef.current);
    setGameOver(true);
    SoundService.success();
  }, []);

  useEffect(() => {
    if (gameOver && onXpEarned && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const correctCount = results.filter(r => r.result === 'correct').length;
      const pctVal = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
      const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
      onXpEarned(correctCount * 5, 'truefalse', { stars: starsVal, streak });
    }
  }, [gameOver, results, onXpEarned]);

  const goNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= totalQ) {
      endGame();
      return;
    }
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setCurrentIndex(next);
    setAnswered(null);
    setTimeLeft(TIME_PER_QUESTION);
    progressAnim.setValue(1);
  }, [currentIndex, totalQ, endGame, fadeAnim, progressAnim]);

  const handleAnswer = useCallback((userSaidTrue) => {
    if (answered) return;
    clearInterval(timerRef.current);

    const isCorrect = (userSaidTrue && statement.isTrue) || (!userSaidTrue && !statement.isTrue);
    const result = isCorrect ? 'correct' : 'wrong';
    setAnswered(result);

    if (isCorrect) {
      SoundService.correct();
      const bonus = timeLeft;
      setScore(s => s + 10 + bonus);
      setStreak(s => {
        const newStreak = s + 1;
        setBestStreak(b => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      SoundService.wrong();
      setStreak(0);
    }

    setResults(r => [...r, { ...statement, result }]);

    feedbackAnim.setValue(1);
    Animated.timing(feedbackAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    setTimeout(goNext, 1500);
  }, [answered, statement, timeLeft, goNext, feedbackAnim]);

  const handleTimeout = useCallback(() => {
    if (answered) return;
    SoundService.timeout();
    setAnswered('timeout');
    setStreak(0);
    setResults(r => [...r, { ...statement, result: 'timeout' }]);

    feedbackAnim.setValue(1);
    Animated.timing(feedbackAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    setTimeout(goNext, 1500);
  }, [answered, statement, goNext, feedbackAnim]);

  useEffect(() => {
    if (gameOver || answered) return;
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: TIME_PER_QUESTION * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, gameOver, answered, progressAnim]);

  useEffect(() => {
    if (timeLeft === 0 && !answered && !gameOver) {
      handleTimeout();
    }
  }, [timeLeft, answered, gameOver, handleTimeout]);

  const restart = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswered(null);
    setGameOver(false);
    setResults([]);
    setTimeLeft(TIME_PER_QUESTION);
    xpAwardedRef.current = false;
    progressAnim.setValue(1);
    fadeAnim.setValue(1);
  };

  if (gameOver) {
    const correctCount = results.filter(r => r.result === 'correct').length;
    const pct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;

    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Blitz-Ergebnis!</Text>
          <Text style={styles.starRow}>
            {[1, 2, 3].map(i => (
              <Text key={i} style={[styles.star, i <= stars ? styles.starFilled : styles.starEmpty]}>
                {'\u2605'}
              </Text>
            ))}
          </Text>
          <Text style={styles.resultScore}>{score} Punkte</Text>
          <Text style={styles.resultDetail}>{correctCount} / {totalQ} richtig</Text>
          <Text style={styles.resultDetail}>Beste Serie: {bestStreak}</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{correctCount * 5} XP verdient!
          </Text>
          <Text style={styles.resultMsg}>
            {pct >= 90 ? 'Unglaublich schnell und richtig!' :
             pct >= 60 ? 'Sehr gut! Weiter üben!' :
             pct >= 30 ? 'Nicht schlecht, versuch es nochmal!' :
             'Übung macht den Meister!'}
          </Text>

          <View style={styles.resultList}>
            {results.map((r, i) => (
              <View key={i} style={[styles.resultRow, r.result === 'correct' ? styles.resultRowCorrect : styles.resultRowWrong]}>
                <Text style={styles.resultIcon}>
                  {r.result === 'correct' ? '\u2713' : r.result === 'timeout' ? '\u23F1' : '\u2717'}
                </Text>
                <Text style={styles.resultText} numberOfLines={2}>
                  {r.text}
                </Text>
                <Text style={[styles.resultLabel, r.isTrue ? styles.labelTrue : styles.labelFalse]}>
                  {r.isTrue ? 'WAHR' : 'FALSCH'}
                </Text>
              </View>
            ))}
          </View>

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

  const timerColor = timeLeft <= 2 ? COLORS.red : timeLeft <= 3 ? COLORS.gold : COLORS.green;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'} Zurück</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerStat}>Frage {currentIndex + 1}/{totalQ}</Text>
          <Text style={styles.headerStat}>Punkte: {score}</Text>
          {streak >= 2 && (
            <Text style={[styles.headerStat, { color: COLORS.gold }]}>
              Serie: {streak}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.timerBar}>
        <Animated.View style={[styles.timerFill, { width: progressWidth, backgroundColor: timerColor }]} />
      </View>

      <View style={styles.timerRow}>
        <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <Animated.View style={[styles.questionArea, { opacity: fadeAnim }]}>
        <View style={styles.statementCard}>
          <Text style={styles.statementText}>{statement.text}</Text>
        </View>

        {answered && (
          <Animated.View style={[styles.feedbackBanner, { opacity: feedbackAnim }]}>
            <Text style={[
              styles.feedbackText,
              answered === 'correct' ? styles.feedbackCorrect :
              answered === 'timeout' ? styles.feedbackTimeout : styles.feedbackWrong
            ]}>
              {answered === 'correct' ? 'Richtig! +' + (10 + timeLeft) + ' Punkte' :
               answered === 'timeout' ? 'Zeit abgelaufen!' :
               'Falsch!'}
            </Text>
            <Text style={styles.feedbackExplanation}>
              {statement.isTrue ? 'Die Aussage ist WAHR' : 'Die Aussage ist FALSCH'}
            </Text>
          </Animated.View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.answerBtn,
              styles.trueBtn,
              answered && !statement.isTrue && styles.answerBtnDimmed,
              answered && statement.isTrue && styles.trueHighlight,
            ]}
            onPress={() => handleAnswer(true)}
            disabled={!!answered}
          >
            <Text style={styles.answerBtnIcon}>{'\u2713'}</Text>
            <Text style={styles.answerBtnText}>WAHR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.answerBtn,
              styles.falseBtn,
              answered && statement.isTrue && styles.answerBtnDimmed,
              answered && !statement.isTrue && styles.falseHighlight,
            ]}
            onPress={() => handleAnswer(false)}
            disabled={!!answered}
          >
            <Text style={styles.answerBtnIcon}>{'\u2717'}</Text>
            <Text style={styles.answerBtnText}>FALSCH</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {streak >= 3 && !answered && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{streak}er Serie!</Text>
        </View>
      )}
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
  timerBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
  },
  timerFill: {
    height: 6,
    borderRadius: 3,
  },
  timerRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '800',
  },
  questionArea: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  statementCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    minHeight: 120,
    justifyContent: 'center',
  },
  statementText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 28,
  },
  feedbackBanner: {
    alignItems: 'center',
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  feedbackCorrect: {
    color: COLORS.green,
  },
  feedbackWrong: {
    color: COLORS.red,
  },
  feedbackTimeout: {
    color: COLORS.gold,
  },
  feedbackExplanation: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  answerBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  trueBtn: {
    backgroundColor: COLORS.green,
  },
  falseBtn: {
    backgroundColor: COLORS.red,
  },
  trueHighlight: {
    backgroundColor: COLORS.green,
    borderWidth: 3,
    borderColor: '#1E8449',
  },
  falseHighlight: {
    backgroundColor: COLORS.red,
    borderWidth: 3,
    borderColor: '#922B21',
  },
  answerBtnDimmed: {
    opacity: 0.4,
  },
  answerBtnIcon: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '800',
  },
  answerBtnText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '800',
    marginTop: 4,
  },
  streakBadge: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  resultCard: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.light,
    paddingTop: 60,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  starRow: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 12,
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
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.blue,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 2,
  },
  resultMsg: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  resultList: {
    marginBottom: 16,
    maxHeight: 280,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  resultRowCorrect: {
    backgroundColor: '#E8F8F0',
  },
  resultRowWrong: {
    backgroundColor: '#FDEDEC',
  },
  resultIcon: {
    fontSize: 18,
    fontWeight: '700',
    width: 26,
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 6,
  },
  labelTrue: {
    backgroundColor: '#D5F5E3',
    color: COLORS.green,
  },
  labelFalse: {
    backgroundColor: '#FADBD8',
    color: COLORS.red,
  },
  btnPrimary: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
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
  },
  btnSecondaryText: {
    color: COLORS.blue,
    fontSize: 16,
    fontWeight: '700',
  },
});
