import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView, ScrollView,
} from 'react-native';
import SoundService from '../utils/SoundService';
import { fetchGameContent } from '../services/supabase';

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
};

const FALLBACK_ORDER = [
  'Stubenring',
  'Parkring',
  'Schubertring',
  'Kärntner Ring',
  'Opernring',
  'Burgring',
  'Dr.-Karl-Renner-Ring',
  'Universitätsring',
  'Schottenring',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RingSortGame({ onBack, onXpEarned, semester }) {
  const [correctOrder, setCorrectOrder] = useState(FALLBACK_ORDER);
  const [shuffled, setShuffled] = useState(() => shuffle(FALLBACK_ORDER));
  const [selected, setSelected] = useState([]); // ordered list of section names
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(null); // { correct: bool[] , score: number }
  const xpAwardedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(FALLBACK_ORDER.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchGameContent('ringsort', semester).then(rows => {
      if (rows.length > 0 && rows[0].data?.order) {
        const order = rows[0].data.order;
        setCorrectOrder(order);
        setShuffled(shuffle(order));
      }
    });
  }, [semester]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
    cardAnims.forEach((a, i) => {
      Animated.timing(a, {
        toValue: 1, duration: 350, delay: i * 60, useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleTap = useCallback((name) => {
    if (checked) return;
    setSelected(prev => {
      const idx = prev.indexOf(name);
      if (idx !== -1) {
        // remove this and everything after it (undo)
        return prev.slice(0, idx);
      }
      return [...prev, name];
    });
  }, [checked]);

  const handleCheck = useCallback(() => {
    const correctArr = selected.map((name, i) => name === correctOrder[i]);
    const score = correctArr.filter(Boolean).length;
    setResults({ correct: correctArr, score });
    setChecked(true);

    if (score === correctOrder.length) {
      SoundService.success();
    } else if (score >= 5) {
      SoundService.correct();
    } else {
      SoundService.wrong();
    }

    const xp = score * 8;
    if (!xpAwardedRef.current && xp > 0 && onXpEarned) {
      xpAwardedRef.current = true;
      const starsVal = score === correctOrder.length ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
      onXpEarned(xp, 'ringsort', { stars: starsVal });
    }
  }, [selected, onXpEarned, correctOrder]);

  const handleRetry = useCallback(() => {
    setShuffled(shuffle(correctOrder));
    setSelected([]);
    setChecked(false);
    setResults(null);
    xpAwardedRef.current = false;
  }, [correctOrder]);

  const getOrderNum = (name) => {
    const idx = selected.indexOf(name);
    return idx !== -1 ? idx + 1 : null;
  };

  const getCardStyle = (name) => {
    if (!checked || !results) return null;
    const idx = selected.indexOf(name);
    if (idx === -1) return null;
    return results.correct[idx] ? 'correct' : 'wrong';
  };

  const allSelected = selected.length === correctOrder.length;

  return (
    <SafeAreaView style={s.container}>
      <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Text style={s.backText}>Zurück</Text>
          </TouchableOpacity>
          <Text style={s.title}>Ring-Sortierung</Text>
        </View>

        <Text style={s.subtitle}>
          Tippe die {correctOrder.length} Ringstrassen-Abschnitte in der richtigen Reihenfolge an (im Uhrzeigersinn vom Donaukanal).
        </Text>

        {/* Progress indicator */}
        <View style={s.progressRow}>
          {correctOrder.map((_, i) => (
            <View
              key={i}
              style={[
                s.progressDot,
                i < selected.length && s.progressDotFilled,
                checked && results && i < results.correct.length && (
                  results.correct[i] ? s.progressDotCorrect : s.progressDotWrong
                ),
              ]}
            >
              <Text style={s.progressDotText}>{i + 1}</Text>
            </View>
          ))}
        </View>

        {/* Cards */}
        <ScrollView style={s.scrollArea} contentContainerStyle={s.cardsContainer}>
          {shuffled.map((name, i) => {
            const orderNum = getOrderNum(name);
            const cardResult = getCardStyle(name);
            const isSelected = orderNum !== null;

            return (
              <Animated.View
                key={name}
                style={{
                  opacity: cardAnims[i],
                  transform: [{
                    translateY: cardAnims[i].interpolate({
                      inputRange: [0, 1], outputRange: [30, 0],
                    }),
                  }],
                }}
              >
                <TouchableOpacity
                  style={[
                    s.card,
                    isSelected && s.cardSelected,
                    cardResult === 'correct' && s.cardCorrect,
                    cardResult === 'wrong' && s.cardWrong,
                  ]}
                  onPress={() => handleTap(name)}
                  activeOpacity={0.7}
                  disabled={checked}
                >
                  {isSelected && (
                    <View style={[
                      s.numberBadge,
                      cardResult === 'correct' && s.numberBadgeCorrect,
                      cardResult === 'wrong' && s.numberBadgeWrong,
                    ]}>
                      <Text style={s.numberText}>{orderNum}</Text>
                    </View>
                  )}
                  <Text style={[
                    s.cardText,
                    isSelected && s.cardTextSelected,
                  ]}>
                    {name}
                  </Text>
                  {checked && cardResult === 'wrong' && (
                    <Text style={s.correctHint}>
                      Richtig: {correctOrder.indexOf(name) + 1}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Bottom area */}
        {!checked && allSelected && (
          <TouchableOpacity style={s.checkBtn} onPress={handleCheck}>
            <Text style={s.checkBtnText}>Überprüfen</Text>
          </TouchableOpacity>
        )}

        {!checked && !allSelected && (
          <Text style={s.hintText}>
            {selected.length === 0
              ? 'Tippe den ersten Abschnitt an!'
              : `${selected.length} / ${correctOrder.length} ausgewählt`}
          </Text>
        )}

        {checked && results && (
          <View style={s.resultArea}>
            <Text style={s.resultTitle}>
              {results.score === 9 ? 'Perfekt!' :
               results.score >= 7 ? 'Fast perfekt!' :
               results.score >= 5 ? 'Gut gemacht!' :
               'Übe weiter!'}
            </Text>
            <Text style={s.resultScore}>
              {results.score} / {correctOrder.length} richtig  =  {results.score * 8} XP
            </Text>
            <TouchableOpacity style={s.retryBtn} onPress={handleRetry}>
              <Text style={s.retryBtnText}>Nochmal versuchen</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a2e',
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginRight: 12,
  },
  backText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: C.gray,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 6,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotFilled: {
    backgroundColor: C.blue,
  },
  progressDotCorrect: {
    backgroundColor: C.green,
  },
  progressDotWrong: {
    backgroundColor: C.red,
  },
  progressDotText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  cardsContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: 'rgba(41,128,185,0.2)',
    borderColor: C.blue,
  },
  cardCorrect: {
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderColor: C.green,
  },
  cardWrong: {
    backgroundColor: 'rgba(192,57,43,0.2)',
    borderColor: C.red,
  },
  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberBadgeCorrect: {
    backgroundColor: C.green,
  },
  numberBadgeWrong: {
    backgroundColor: C.red,
  },
  numberText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
  cardText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardTextSelected: {
    color: C.white,
  },
  correctHint: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  checkBtn: {
    backgroundColor: C.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  checkBtnText: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
  },
  hintText: {
    color: C.gray,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  resultArea: {
    alignItems: 'center',
    marginTop: 10,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
  },
  resultTitle: {
    color: C.gold,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  resultScore: {
    color: C.white,
    fontSize: 16,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: C.blue,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  retryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
