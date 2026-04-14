import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 340;

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

function getCorrectAnswer(q) {
  if (q.type === 'fill_blank') {
    return q.blanks.join(', ');
  }
  if (q.options && q.correct !== undefined) {
    return q.options[q.correct];
  }
  return '';
}

function FlashcardItem({ question, isFlipped, onFlip, flipAnim }) {
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontStyle = {
    transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
  };
  const backStyle = {
    transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
  };

  const answer = getCorrectAnswer(question);

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onFlip}>
      <View style={styles.cardContainer}>
        {/* Front */}
        <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
          <View style={styles.topicBadge}>
            <Text style={styles.topicBadgeText}>{question.topic}</Text>
          </View>
          <Text style={styles.cardQuestion}>{question.question}</Text>
          <Text style={styles.tapHint}>Antippen zum Umdrehen</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <Text style={styles.answerLabel}>Richtige Antwort</Text>
          <Text style={styles.answerText}>{answer}</Text>
          {question.explanation ? (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

function StackedCards({ count }) {
  if (count <= 1) return null;
  const layers = Math.min(count - 1, 3);
  const cards = [];
  for (let i = layers; i >= 1; i--) {
    cards.push(
      <View
        key={i}
        style={[
          styles.stackCard,
          {
            top: i * 4,
            left: i * 2,
            right: i * 2,
            opacity: 1 - i * 0.2,
            zIndex: -i,
          },
        ]}
      />
    );
  }
  return <>{cards}</>;
}

function SummaryScreen({ knownCards, unknownCards, total, onRestart, onPracticeHard, onBack, xpEarned }) {
  const knownCount = knownCards.length;
  const percentage = Math.round((knownCount / total) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <ScrollView contentContainerStyle={styles.summaryContent}>
        <Text style={styles.summaryTitle}>Zusammenfassung</Text>

        <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
          +{xpEarned} XP verdient!
        </Text>

        <View style={styles.summaryStatsRow}>
          <View style={[styles.statBox, { backgroundColor: '#E8F8F0' }]}>
            <Text style={[styles.statNumber, { color: COLORS.green }]}>{knownCount}</Text>
            <Text style={styles.statLabel}>Gewusst</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FDEDEC' }]}>
            <Text style={[styles.statNumber, { color: COLORS.red }]}>{unknownCards.length}</Text>
            <Text style={styles.statLabel}>Nochmal</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FEF5E7' }]}>
            <Text style={[styles.statNumber, { color: COLORS.gold }]}>{percentage}%</Text>
            <Text style={styles.statLabel}>Richtig</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.summaryProgressContainer}>
          <View style={styles.summaryProgressBar}>
            <View
              style={[
                styles.summaryProgressFill,
                { width: `${percentage}%`, backgroundColor: COLORS.green },
              ]}
            />
          </View>
        </View>

        {unknownCards.length > 0 && (
          <View style={styles.unknownSection}>
            <Text style={styles.unknownTitle}>Zum Wiederholen:</Text>
            {unknownCards.map((q, idx) => (
              <View key={q.id} style={styles.unknownItem}>
                <Text style={styles.unknownNumber}>{idx + 1}.</Text>
                <View style={styles.unknownContent}>
                  <Text style={styles.unknownQuestion}>{q.question}</Text>
                  <Text style={styles.unknownAnswer}>{getCorrectAnswer(q)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.summaryButtons}>
          {unknownCards.length > 0 && (
            <TouchableOpacity
              style={[styles.summaryButton, { backgroundColor: COLORS.gold }]}
              onPress={onPracticeHard}
              activeOpacity={0.8}
            >
              <Text style={styles.summaryButtonText}>
                Schwierige Karten nochmal ({unknownCards.length})
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.summaryButton, { backgroundColor: COLORS.blue }]}
            onPress={onRestart}
            activeOpacity={0.8}
          >
            <Text style={styles.summaryButtonText}>Alle Karten nochmal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.summaryButton, { backgroundColor: COLORS.gray }]}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.summaryButtonText}>Beenden</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Flashcards({ questions, onBack, onXpEarned }) {
  const [deck, setDeck] = useState(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [finished, setFinished] = useState(false);
  const [buttonsLocked, setButtonsLocked] = useState(true);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const xpAwardedRef = useRef(false);

  const flipValue = useRef(0);

  React.useEffect(() => {
    const id = flipAnim.addListener(({ value }) => {
      flipValue.current = value;
    });
    return () => flipAnim.removeListener(id);
  }, [flipAnim]);

  // Buttons gesperrt bis Timer (6s) abgelaufen UND Karte umgedreht
  const [timerDone, setTimerDone] = useState(false);
  React.useEffect(() => {
    setTimerDone(false);
    setButtonsLocked(true);
    const timer = setTimeout(() => setTimerDone(true), 6000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  React.useEffect(() => {
    setButtonsLocked(!(timerDone && isFlipped));
  }, [timerDone, isFlipped]);

  React.useEffect(() => {
    if (finished && onXpEarned && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const pct = deck.length > 0 ? Math.round((known.length / (known.length + unknown.length)) * 100) : 0;
      const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
      onXpEarned(known.length * 5, 'flashcards', { stars });
    }
  }, [finished, known.length, onXpEarned]);

  const flipCard = useCallback(() => {
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const goToNext = useCallback(
    (wasKnown) => {
      const currentQuestion = deck[currentIndex];
      if (wasKnown) {
        setKnown((prev) => [...prev, currentQuestion]);
      } else {
        setUnknown((prev) => [...prev, currentQuestion]);
      }

      if (currentIndex >= deck.length - 1) {
        setFinished(true);
        return;
      }

      // Slide out, then reset
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        flipAnim.setValue(0);
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
        slideAnim.setValue(width);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }).start();
      });
    },
    [currentIndex, deck, flipAnim, slideAnim]
  );

  const handleRestart = useCallback(() => {
    setDeck(questions);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown([]);
    setUnknown([]);
    setFinished(false);
    xpAwardedRef.current = false;
    flipAnim.setValue(0);
    slideAnim.setValue(0);
  }, [questions, flipAnim, slideAnim]);

  const handlePracticeHard = useCallback(() => {
    setDeck(unknown);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown([]);
    setUnknown([]);
    setFinished(false);
    xpAwardedRef.current = false;
    flipAnim.setValue(0);
    slideAnim.setValue(0);
  }, [unknown, flipAnim, slideAnim]);

  // Zufällige Button-Reihenfolge pro Karte damit Kinder nicht immer blind grün drücken
  const buttonSwapped = useMemo(
    () => deck.map(() => Math.random() < 0.5),
    [deck]
  );

  const totalInDeck = deck.length;
  const progress = totalInDeck > 0 ? (currentIndex + 1) / totalInDeck : 0;
  const remaining = totalInDeck - currentIndex;

  if (finished) {
    return (
      <SummaryScreen
        knownCards={known}
        unknownCards={unknown}
        total={totalInDeck}
        onRestart={handleRestart}
        onPracticeHard={handlePracticeHard}
        onBack={onBack}
        xpEarned={known.length * 5}
      />
    );
  }

  const currentQuestion = deck[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>{'<'} Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>
          {currentIndex + 1} / {totalInDeck}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Card area */}
      <View style={styles.cardArea}>
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <View style={styles.stackWrapper}>
            <StackedCards count={remaining} />
            <FlashcardItem
              question={currentQuestion}
              isFlipped={isFlipped}
              onFlip={flipCard}
              flipAnim={flipAnim}
            />
          </View>
        </Animated.View>
      </View>

      {/* Action buttons - Reihenfolge wechselt zufällig pro Karte */}
      <View style={[styles.actionRow, buttonsLocked && { opacity: 0.4 }]}>
        {buttonSwapped[currentIndex] ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.knownButton]}
              onPress={() => goToNext(true)}
              activeOpacity={0.8}
              disabled={buttonsLocked}
            >
              <Text style={styles.actionButtonText}>{buttonsLocked ? (!isFlipped ? 'Erst umdrehen!' : 'Lies zuerst...') : 'Gewusst! ✅'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.unknownButton]}
              onPress={() => goToNext(false)}
              activeOpacity={0.8}
              disabled={buttonsLocked}
            >
              <Text style={styles.actionButtonText}>{buttonsLocked ? (!isFlipped ? 'Erst umdrehen!' : 'Lies zuerst...') : 'Nochmal üben 🔄'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.unknownButton]}
              onPress={() => goToNext(false)}
              activeOpacity={0.8}
              disabled={buttonsLocked}
            >
              <Text style={styles.actionButtonText}>{buttonsLocked ? (!isFlipped ? 'Erst umdrehen!' : 'Lies zuerst...') : 'Nochmal üben 🔄'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.knownButton]}
              onPress={() => goToNext(true)}
              activeOpacity={0.8}
              disabled={buttonsLocked}
            >
              <Text style={styles.actionButtonText}>{buttonsLocked ? (!isFlipped ? 'Erst umdrehen!' : 'Lies zuerst...') : 'Gewusst! ✅'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.blue,
    fontWeight: '600',
  },
  counter: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '700',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 3,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stackWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 24,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardFront: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  topicBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  topicBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cardQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  tapHint: {
    position: 'absolute',
    bottom: 16,
    color: COLORS.gray,
    fontSize: 12,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  answerText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  explanationBox: {
    backgroundColor: '#F0F9F4',
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 20,
  },
  stackCard: {
    position: 'absolute',
    height: CARD_HEIGHT,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  unknownButton: {
    backgroundColor: COLORS.red,
  },
  knownButton: {
    backgroundColor: COLORS.green,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  // Summary styles
  summaryContent: {
    padding: 24,
    paddingBottom: 40,
  },
  summaryTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '600',
    marginTop: 4,
  },
  summaryProgressContainer: {
    marginBottom: 24,
  },
  summaryProgressBar: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  unknownSection: {
    marginBottom: 24,
  },
  unknownTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
  },
  unknownItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  unknownNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray,
    marginRight: 10,
    marginTop: 1,
  },
  unknownContent: {
    flex: 1,
  },
  unknownQuestion: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
    marginBottom: 4,
  },
  unknownAnswer: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '600',
  },
  summaryButtons: {
    gap: 10,
  },
  summaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
