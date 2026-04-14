import React, { useState, useEffect, useRef, useCallback } from 'react';
import SoundService from '../utils/SoundService';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

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

const NUM_PAIRS = 8;
const COLS = 4;
const CARD_GAP = 8;
const screenWidth = Dimensions.get('window').width;
const cardSize = (screenWidth - 32 - CARD_GAP * (COLS - 1)) / COLS;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(questions) {
  const picked = shuffleArray(questions).slice(0, NUM_PAIRS);
  const cards = [];
  picked.forEach((q, idx) => {
    const answer =
      q.type === 'fill_blank'
        ? q.blanks[0]
        : q.options[q.correct !== undefined ? q.correct : 0];
    cards.push({
      id: idx * 2,
      pairId: idx,
      type: 'question',
      text: q.question,
      topic: q.topic,
    });
    cards.push({
      id: idx * 2 + 1,
      pairId: idx,
      type: 'answer',
      text: answer,
      topic: q.topic,
    });
  });
  return shuffleArray(cards);
}

function MemoryCard({ card, isFlipped, isMatched, onPress, index }) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backStyle = { transform: [{ rotateY: backInterpolate }] };

  const isQuestion = card.type === 'question';
  const backColor = isMatched
    ? COLORS.green
    : isQuestion
    ? COLORS.blue
    : COLORS.gold;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isFlipped || isMatched}
      style={[
        styles.cardWrapper,
        {
          marginRight: (index + 1) % COLS === 0 ? 0 : CARD_GAP,
          marginBottom: CARD_GAP,
        },
      ]}
    >
      <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
        <Text style={styles.cardFrontIcon}>?</Text>
        <Text style={styles.cardFrontLabel}>Memory</Text>
      </Animated.View>

      <Animated.View
        style={[styles.card, styles.cardBack, { backgroundColor: backColor }, backStyle]}
      >
        <Text style={styles.cardTypeLabel}>
          {isQuestion ? 'FRAGE' : 'ANTWORT'}
        </Text>
        <Text
          style={styles.cardText}
          numberOfLines={5}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {card.text}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function MemoryGame({ questions, onBack, onXpEarned }) {
  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef(null);
  const xpAwardedRef = useRef(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const initGame = useCallback(() => {
    setCards(buildCards(questions));
    setFlippedIds([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setTimer(0);
    setGameWon(false);
    setIsChecking(false);
    xpAwardedRef.current = false;
    scaleAnim.setValue(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  }, [questions, scaleAnim]);

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initGame]);

  useEffect(() => {
    if (matchedPairs.size === NUM_PAIRS && matchedPairs.size > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameWon(true);
      SoundService.success();
      if (onXpEarned && !xpAwardedRef.current) {
        xpAwardedRef.current = true;
        const s = moves <= NUM_PAIRS + 2 ? 3 : moves <= NUM_PAIRS * 2 ? 2 : 1;
        onXpEarned(s * 15, 'memory', { stars: s });
      }
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [matchedPairs, scaleAnim]);

  const handleCardPress = useCallback(
    (card) => {
      if (isChecking || flippedIds.length >= 2) return;
      if (flippedIds.includes(card.id)) return;
      if (matchedPairs.has(card.pairId)) return;

      const newFlipped = [...flippedIds, card.id];
      setFlippedIds(newFlipped);
      SoundService.flip();

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setIsChecking(true);

        const first = cards.find((c) => c.id === newFlipped[0]);
        const second = cards.find((c) => c.id === newFlipped[1]);

        if (
          first.pairId === second.pairId &&
          first.type !== second.type
        ) {
          setTimeout(() => {
            SoundService.match();
            setMatchedPairs((prev) => {
              const next = new Set(prev);
              next.add(first.pairId);
              return next;
            });
            setFlippedIds([]);
            setIsChecking(false);
          }, 600);
        } else {
          setTimeout(() => {
            SoundService.wrong();
            setFlippedIds([]);
            setIsChecking(false);
          }, 1200);
        }
      }
    },
    [isChecking, flippedIds, matchedPairs, cards]
  );

  const getStars = () => {
    if (moves <= NUM_PAIRS + 2) return 3;
    if (moves <= NUM_PAIRS * 2) return 2;
    return 1;
  };

  if (gameWon) {
    const stars = getStars();
    const scaleInterpolate = scaleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.winContainer,
            { transform: [{ scale: scaleInterpolate }] },
          ]}
        >
          <Text style={styles.winTitle}>Gewonnen!</Text>
          <Text style={styles.winStars}>
            {Array(3)
              .fill(null)
              .map((_, i) => (i < stars ? '\u2605' : '\u2606'))
              .join(' ')}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{stars * 15} XP verdient!
          </Text>
          <View style={styles.statsBox}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Züge</Text>
              <Text style={styles.statValue}>{moves}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Zeit</Text>
              <Text style={styles.statValue}>{formatTime(timer)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Paare</Text>
              <Text style={styles.statValue}>{NUM_PAIRS}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.playAgainBtn} onPress={initGame}>
            <Text style={styles.playAgainText}>Nochmal spielen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtnWin} onPress={onBack}>
            <Text style={styles.backBtnWinText}>Zurück</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>{'\u2190'} Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Memory</Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeLabel}>Züge</Text>
          <Text style={styles.statBadgeValue}>{moves}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeLabel}>Paare</Text>
          <Text style={styles.statBadgeValue}>
            {matchedPairs.size}/{NUM_PAIRS}
          </Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeLabel}>Zeit</Text>
          <Text style={styles.statBadgeValue}>{formatTime(timer)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {cards.map((card, index) => (
          <MemoryCard
            key={card.id}
            card={card}
            index={index}
            isFlipped={flippedIds.includes(card.id)}
            isMatched={matchedPairs.has(card.pairId)}
            onPress={() => handleCardPress(card)}
          />
        ))}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.blue }]} />
          <Text style={styles.legendText}>Frage</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.gold }]} />
          <Text style={styles.legendText}>Antwort</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
          <Text style={styles.legendText}>Match</Text>
        </View>
      </View>
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statBadgeLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statBadgeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardWrapper: {
    width: cardSize,
    height: cardSize * 1.2,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFront: {
    backgroundColor: COLORS.red,
  },
  cardFrontIcon: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  cardFrontLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardBack: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  cardTypeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  winContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  winTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.dark,
    marginBottom: 12,
  },
  winStars: {
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
