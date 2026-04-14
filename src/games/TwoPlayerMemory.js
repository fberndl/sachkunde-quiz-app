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

const C = {
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

const PLAYER_COLORS = {
  1: C.blue,
  2: C.red,
};

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

function MemoryCard({ card, isFlipped, isMatched, matchedBy, onPress, index }) {
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
    ? (matchedBy ? PLAYER_COLORS[matchedBy] : C.green)
    : isQuestion
    ? C.blue
    : C.gold;

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

export default function TwoPlayerMemory({ questions, onBack, onXpEarned }) {
  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [matchedByPlayer, setMatchedByPlayer] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const xpAwardedRef = useRef(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const turnAnim = useRef(new Animated.Value(1)).current;

  const initGame = useCallback(() => {
    setCards(buildCards(questions));
    setFlippedIds([]);
    setMatchedPairs(new Set());
    setMatchedByPlayer({});
    setCurrentPlayer(1);
    setScores({ 1: 0, 2: 0 });
    setGameOver(false);
    setIsChecking(false);
    xpAwardedRef.current = false;
    scaleAnim.setValue(0);
    turnAnim.setValue(1);
  }, [questions, scaleAnim, turnAnim]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Pulse animation for current player indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(turnAnim, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(turnAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [currentPlayer, turnAnim]);

  useEffect(() => {
    if (matchedPairs.size === NUM_PAIRS && matchedPairs.size > 0) {
      setGameOver(true);
      SoundService.success();
      if (onXpEarned && !xpAwardedRef.current) {
        xpAwardedRef.current = true;
        onXpEarned(NUM_PAIRS * 5, 'twoplayermemory', { stars: 2 });
      }
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [matchedPairs, scaleAnim, onXpEarned]);

  const handleCardPress = useCallback(
    (card) => {
      if (isChecking || flippedIds.length >= 2) return;
      if (flippedIds.includes(card.id)) return;
      if (matchedPairs.has(card.pairId)) return;

      const newFlipped = [...flippedIds, card.id];
      setFlippedIds(newFlipped);
      SoundService.flip();

      if (newFlipped.length === 2) {
        setIsChecking(true);

        const first = cards.find((c) => c.id === newFlipped[0]);
        const second = cards.find((c) => c.id === newFlipped[1]);

        if (
          first.pairId === second.pairId &&
          first.type !== second.type
        ) {
          // Match found - current player scores and keeps turn
          setTimeout(() => {
            SoundService.match();
            setMatchedPairs((prev) => {
              const next = new Set(prev);
              next.add(first.pairId);
              return next;
            });
            setMatchedByPlayer((prev) => ({
              ...prev,
              [first.pairId]: currentPlayer,
            }));
            setScores((prev) => ({
              ...prev,
              [currentPlayer]: prev[currentPlayer] + 1,
            }));
            setFlippedIds([]);
            setIsChecking(false);
            // Player keeps their turn on a match
          }, 600);
        } else {
          // No match - switch to other player
          setTimeout(() => {
            SoundService.wrong();
            setFlippedIds([]);
            setIsChecking(false);
            setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
          }, 1200);
        }
      }
    },
    [isChecking, flippedIds, matchedPairs, cards, currentPlayer]
  );

  const getResultText = () => {
    if (scores[1] > scores[2]) return 'Spieler 1 hat gewonnen!';
    if (scores[2] > scores[1]) return 'Spieler 2 hat gewonnen!';
    return 'Unentschieden!';
  };

  const getResultEmoji = () => {
    if (scores[1] > scores[2]) return '\uD83C\uDF1F';
    if (scores[2] > scores[1]) return '\uD83C\uDF1F';
    return '\uD83E\uDD1D';
  };

  if (gameOver) {
    const scaleInterpolate = scaleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    const winnerColor = scores[1] > scores[2]
      ? PLAYER_COLORS[1]
      : scores[2] > scores[1]
      ? PLAYER_COLORS[2]
      : C.gold;

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.winContainer,
            { transform: [{ scale: scaleInterpolate }] },
          ]}
        >
          <Text style={styles.winEmoji}>{getResultEmoji()}</Text>
          <Text style={[styles.winTitle, { color: winnerColor }]}>
            {getResultText()}
          </Text>

          <Text style={styles.xpText}>
            +{NUM_PAIRS * 5} XP verdient!
          </Text>

          <View style={styles.resultsBox}>
            <View style={styles.resultRow}>
              <View style={[styles.resultDot, { backgroundColor: PLAYER_COLORS[1] }]} />
              <Text style={styles.resultLabel}>Spieler 1</Text>
              <Text style={[styles.resultScore, { color: PLAYER_COLORS[1] }]}>
                {scores[1]} Paare
              </Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultRow}>
              <View style={[styles.resultDot, { backgroundColor: PLAYER_COLORS[2] }]} />
              <Text style={styles.resultLabel}>Spieler 2</Text>
              <Text style={[styles.resultScore, { color: PLAYER_COLORS[2] }]}>
                {scores[2]} Paare
              </Text>
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
        <Text style={styles.title}>2-Spieler Memory</Text>
      </View>

      {/* Player indicators */}
      <View style={styles.playerBar}>
        <Animated.View
          style={[
            styles.playerBadge,
            {
              backgroundColor: PLAYER_COLORS[1],
              opacity: currentPlayer === 1 ? 1 : 0.4,
              transform: currentPlayer === 1 ? [{ scale: turnAnim }] : [{ scale: 1 }],
            },
          ]}
        >
          <Text style={styles.playerName}>Spieler 1</Text>
          <Text style={styles.playerScore}>{scores[1]}</Text>
          {currentPlayer === 1 && (
            <Text style={styles.turnIndicator}>Dein Zug!</Text>
          )}
        </Animated.View>

        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <Animated.View
          style={[
            styles.playerBadge,
            {
              backgroundColor: PLAYER_COLORS[2],
              opacity: currentPlayer === 2 ? 1 : 0.4,
              transform: currentPlayer === 2 ? [{ scale: turnAnim }] : [{ scale: 1 }],
            },
          ]}
        >
          <Text style={styles.playerName}>Spieler 2</Text>
          <Text style={styles.playerScore}>{scores[2]}</Text>
          {currentPlayer === 2 && (
            <Text style={styles.turnIndicator}>Dein Zug!</Text>
          )}
        </Animated.View>
      </View>

      {/* Pairs progress */}
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>
          Paare: {matchedPairs.size}/{NUM_PAIRS}
        </Text>
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
            matchedBy={matchedByPlayer[card.pairId]}
            onPress={() => handleCardPress(card)}
          />
        ))}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.blue }]} />
          <Text style={styles.legendText}>Frage</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.gold }]} />
          <Text style={styles.legendText}>Antwort</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: PLAYER_COLORS[1] }]} />
          <Text style={styles.legendText}>Sp. 1</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: PLAYER_COLORS[2] }]} />
          <Text style={styles.legendText}>Sp. 2</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.light,
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
    color: C.blue,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: C.dark,
    textAlign: 'center',
    marginRight: 60,
  },
  // Player bar
  playerBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  playerBadge: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerScore: {
    fontSize: 28,
    fontWeight: '900',
    color: C.white,
    marginTop: 2,
  },
  turnIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    color: C.white,
  },
  // Progress
  progressBar: {
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.gray,
  },
  // Grid
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
    backgroundColor: C.dark,
  },
  cardFrontIcon: {
    fontSize: 28,
    fontWeight: '800',
    color: C.white,
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
    color: C.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 16,
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
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: C.gray,
    fontWeight: '600',
  },
  // Win screen
  winContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  winEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  winTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  xpText: {
    fontSize: 20,
    fontWeight: '900',
    color: C.gold,
    textAlign: 'center',
    marginBottom: 20,
  },
  resultsBox: {
    backgroundColor: C.white,
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
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  resultLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: C.dark,
  },
  resultScore: {
    fontSize: 18,
    fontWeight: '900',
  },
  resultDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  playAgainBtn: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '800',
    color: C.white,
  },
  backBtnWin: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnWinText: {
    fontSize: 16,
    color: C.blue,
    fontWeight: '600',
  },
});
