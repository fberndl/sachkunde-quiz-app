import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, SafeAreaView, Dimensions,
} from 'react-native';
import { QUESTIONS, shuffleArray } from '../data/questions';
import { shuffleQuestionOptions } from '../utils/shuffleOptions';
import SoundService from '../utils/SoundService';

const { width } = Dimensions.get('window');

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
  purple: '#8E44AD',
};

const DIFFICULTIES = [
  { name: 'Leicht', rate: 0.45, emoji: '😊' },
  { name: 'Mittel', rate: 0.65, emoji: '🤔' },
  { name: 'Schwer', rate: 0.85, emoji: '😈' },
];

export default function QuizDuel({ questions, onBack, onXpEarned }) {
  const [phase, setPhase] = useState('select'); // select, play, reveal, result
  const [diff, setDiff] = useState(1);
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [sel, setSel] = useState(null);
  const [botAnswer, setBotAnswer] = useState(null);
  const [done, setDone] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const xpAwardedRef = useRef(false);

  const startGame = (d) => {
    setDiff(d);
    const filtered = (questions || QUESTIONS).filter(q => q.type !== 'fill_blank' && q.options);
    setQs(shuffleArray(filtered).slice(0, 10).map(shuffleQuestionOptions));
    setIdx(0); setPlayerScore(0); setBotScore(0); setSel(null); setDone(false);
    setPhase('play');
    xpAwardedRef.current = false;
  };

  useEffect(() => {
    if (phase === 'play') {
      cardAnim.setValue(0);
      Animated.timing(cardAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
    if (phase === 'result') {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
  }, [phase, idx]);

  const handleAnswer = (i) => {
    if (done) return;
    setSel(i);
    setDone(true);

    const q = qs[idx];
    const playerCorrect = i === q.correct;
    const botCorrect = Math.random() < DIFFICULTIES[diff].rate;
    const botPick = botCorrect ? q.correct : (q.correct + 1 + Math.floor(Math.random() * 3)) % q.options.length;

    setBotAnswer({ correct: botCorrect, pick: botPick });
    if (playerCorrect) { SoundService.correct(); setPlayerScore(s => s + 1); }
    else { SoundService.wrong(); }
    if (botCorrect) setBotScore(s => s + 1);
  };

  const next = () => {
    if (idx + 1 >= qs.length) { setPhase('result'); return; }
    setIdx(i => i + 1);
    setSel(null); setDone(false); setBotAnswer(null);
    cardAnim.setValue(0);
  };

  // SELECT DIFFICULTY
  if (phase === 'select') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>← Zurück</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={st.center}>
          <Text style={{ fontSize: 64 }}>⚔️</Text>
          <Text style={st.title}>Quiz-Duell</Text>
          <Text style={st.sub}>Tritt gegen Professor Wien an!</Text>
          <View style={st.botCard}>
            <Text style={{ fontSize: 48 }}>🎓</Text>
            <Text style={st.botName}>Professor Wien</Text>
            <Text style={{ color: C.gray, fontSize: 13 }}>Dein Gegner</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 12 }}>Schwierigkeit wählen:</Text>
          {DIFFICULTIES.map((d, i) => (
            <TouchableOpacity key={i} style={[st.diffBtn, { borderColor: [C.green, C.gold, C.red][i] }]} onPress={() => { SoundService.click(); startGame(i); }}>
              <Text style={{ fontSize: 24 }}>{d.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.dark }}>{d.name}</Text>
                <Text style={{ fontSize: 12, color: C.gray }}>Professor trifft {Math.round(d.rate * 100)}%</Text>
              </View>
              <Text style={{ fontSize: 18, color: C.gray }}>▶</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RESULT
  if (phase === 'result') {
    const won = playerScore > botScore;
    const tie = playerScore === botScore;
    const xpAmount = playerScore * 8;
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true;
      if (won) SoundService.success();
      const totalQ = qs.length > 0 ? qs.length : 1;
      const pctVal = Math.round((playerScore / totalQ) * 100);
      const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
      if (won && onXpEarned) onXpEarned(xpAmount, 'duel', { stars: starsVal });
    }
    return (
      <SafeAreaView style={st.safe}>
        <ScrollView contentContainerStyle={st.center}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
            <Text style={{ fontSize: 72 }}>{won ? '🏆' : tie ? '🤝' : '😢'}</Text>
            <Text style={st.title}>{won ? 'Du hast gewonnen!' : tie ? 'Unentschieden!' : 'Professor Wien gewinnt!'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
              +{xpAmount} XP verdient!
            </Text>
            <View style={st.scoreRow}>
              <View style={st.scoreCard}>
                <Text style={{ fontSize: 28 }}>👤</Text>
                <Text style={[st.scoreN, { color: won ? C.green : C.gray }]}>{playerScore}</Text>
                <Text style={st.scoreL}>Du</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: C.gray, alignSelf: 'center' }}>vs</Text>
              <View style={st.scoreCard}>
                <Text style={{ fontSize: 28 }}>🎓</Text>
                <Text style={[st.scoreN, { color: !won && !tie ? C.red : C.gray }]}>{botScore}</Text>
                <Text style={st.scoreL}>Professor</Text>
              </View>
            </View>
            <TouchableOpacity style={[st.btn, { backgroundColor: C.purple }]} onPress={() => setPhase('select')}>
              <Text style={st.btnTxt}>⚔️ Revanche!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.btn, { backgroundColor: C.gray }]} onPress={onBack}>
              <Text style={st.btnTxt}>← Zurück</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PLAY
  const q = qs[idx];
  if (!q) return null;

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Scoreboard */}
        <View style={st.scoreRow}>
          <View style={[st.miniScore, playerScore > botScore && { borderColor: C.green }]}>
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={st.miniN}>{playerScore}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark }}>{idx + 1} / {qs.length}</Text>
            <Text style={{ fontSize: 11, color: C.gray }}>vs Professor Wien 🎓</Text>
          </View>
          <View style={[st.miniScore, botScore > playerScore && { borderColor: C.red }]}>
            <Text style={{ fontSize: 18 }}>🎓</Text>
            <Text style={st.miniN}>{botScore}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={st.pBar}>
          <View style={[st.pFill, { width: `${((idx + (done ? 1 : 0)) / qs.length) * 100}%` }]} />
        </View>

        {/* Question */}
        <Animated.View style={[st.qCard, { opacity: cardAnim }]}>
          <Text style={st.qTopic}>{q.topic}</Text>
          <Text style={st.qTxt}>{q.question}</Text>
        </Animated.View>

        {/* Options */}
        {q.options.map((opt, i) => {
          let style = [st.opt];
          if (done) {
            if (i === q.correct) style.push(st.optOK);
            else if (i === sel && i !== q.correct) style.push(st.optBAD);
            else style.push({ opacity: 0.4 });
          }
          return (
            <TouchableOpacity key={i} style={style} onPress={() => handleAnswer(i)} disabled={done}>
              <View style={st.optLetter}><Text style={st.optLetterTxt}>{['A','B','C','D'][i]}</Text></View>
              <Text style={st.optTxt}>{opt}</Text>
              {done && i === q.correct && <Text>✅</Text>}
              {done && i === sel && i !== q.correct && <Text>❌</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Bot result */}
        {done && botAnswer && (
          <View style={[st.botResult, botAnswer.correct ? st.botOK : st.botBAD]}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.dark }}>
              🎓 Professor Wien: {botAnswer.correct ? '✅ Richtig!' : '❌ Falsch!'}
              {!botAnswer.correct && ` (tippte auf ${['A','B','C','D'][botAnswer.pick]})`}
            </Text>
          </View>
        )}

        {/* Next */}
        {done && (
          <TouchableOpacity style={[st.btn, { backgroundColor: C.purple, marginTop: 14 }]} onPress={next}>
            <Text style={st.btnTxt}>{idx + 1 >= qs.length ? '🏁 Ergebnis!' : 'Weiter ➡️'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.light },
  header: { padding: 16, paddingBottom: 0 },
  backTxt: { fontSize: 16, fontWeight: '700', color: C.blue },
  center: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: C.dark, marginTop: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: C.gray, marginBottom: 20 },

  botCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 20, alignItems: 'center',
    marginBottom: 20, width: '100%', borderWidth: 2, borderColor: '#F0F0F0', elevation: 3,
  },
  botName: { fontSize: 20, fontWeight: '900', color: C.dark, marginTop: 6 },

  diffBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
    borderRadius: 14, padding: 16, marginBottom: 10, width: '100%',
    borderWidth: 2, elevation: 2,
  },

  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scoreCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 20, alignItems: 'center',
    flex: 1, marginHorizontal: 8, elevation: 3, borderWidth: 2, borderColor: '#F0F0F0',
  },
  scoreN: { fontSize: 36, fontWeight: '900' },
  scoreL: { fontSize: 12, color: C.gray, marginTop: 2 },

  miniScore: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.white, borderRadius: 12, padding: 10,
    borderWidth: 2, borderColor: '#E8E8E8',
  },
  miniN: { fontSize: 18, fontWeight: '900', color: C.dark },

  pBar: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, marginBottom: 14, overflow: 'hidden' },
  pFill: { height: '100%', backgroundColor: C.purple, borderRadius: 4 },

  qCard: {
    backgroundColor: C.white, borderRadius: 18, padding: 18, marginBottom: 14,
    elevation: 4, borderWidth: 2, borderColor: '#F0F0F0',
  },
  qTopic: { fontSize: 12, color: C.gray, fontWeight: '600', marginBottom: 6 },
  qTxt: { fontSize: 17, fontWeight: '800', color: C.dark, lineHeight: 24 },

  opt: {
    backgroundColor: C.white, borderRadius: 13, padding: 13, flexDirection: 'row',
    alignItems: 'center', borderWidth: 2, borderColor: '#E8E8E8', elevation: 2, marginBottom: 6,
  },
  optOK: { backgroundColor: '#D5F5E3', borderColor: C.green },
  optBAD: { backgroundColor: '#FADBD8', borderColor: C.red },
  optLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optLetterTxt: { fontSize: 13, fontWeight: '800', color: C.dark },
  optTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: C.dark },

  botResult: { borderRadius: 12, padding: 12, marginTop: 10 },
  botOK: { backgroundColor: '#D5F5E3', borderWidth: 2, borderColor: C.green },
  botBAD: { backgroundColor: '#FADBD8', borderWidth: 2, borderColor: C.red },

  btn: { borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 10, width: '100%', elevation: 4 },
  btnTxt: { fontSize: 18, fontWeight: '900', color: C.white },
});
