import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, StatusBar, SafeAreaView, Image, Modal, TextInput,
} from 'react-native';

import { QUESTIONS, IMAGES, MATERIALS, shuffleArray } from './src/data/questions';
import GameHub from './src/games/GameHub';
import MemoryGame from './src/games/MemoryGame';
import SpeedQuiz from './src/games/SpeedQuiz';
import MillionaireGame from './src/games/MillionaireGame';
import Flashcards from './src/games/Flashcards';
import SortingChallenge from './src/games/SortingChallenge';
import TrueFalseBlitz from './src/games/TrueFalseBlitz';
import Leaderboard from './src/games/Leaderboard';
import HangmanGame from './src/games/HangmanGame';
import CrosswordGame from './src/games/CrosswordGame';
import QuizDuel from './src/games/QuizDuel';
import SpaceRunner from './src/games/SpaceRunner';
import RingMatchGame from './src/games/RingMatchGame';
import MerkgeschichteGame from './src/games/MerkgeschichteGame';
import BubbleBlaster from './src/games/BubbleBlaster';
import TwoPlayerMemory from './src/games/TwoPlayerMemory';
import PinboardGame from './src/games/PinboardGame';
import CategoryGame from './src/games/CategoryGame';
import RingSortGame from './src/games/RingSortGame';
import RunnerGame from './src/games/RunnerGame';
import { syncXp, renamePlayer, renameProfile, fetchQuestions } from './src/services/supabase';
import { getLocalXp, setLocalXp, getLocalName, setLocalName, getLocalHighscore, setLocalHighscore, reconcileXp } from './src/services/xpService';
import QuestionEditor from './src/games/QuestionEditor';
import FeedbackScreen from './src/games/FeedbackScreen';
import { getLocalCoins, earnCoins, spendCoins, reconcileCoins, coinsForStars } from './src/services/coinService';
import {
  getActiveAvatar, setActiveAvatar as persistAvatar, getOwnedAvatars, addOwnedAvatar,
  getOwnedThemes, addOwnedTheme,
  getLocalBadges, recordGamePlayed, getGameStats,
  isFirstTimeGamification, setGamificationVersion,
  syncProfileFromRemote, syncProfileToRemote, unlockBadge,
} from './src/services/profileService';
import { checkBadges } from './src/data/badges';
import { getLevel, getLevelInfo } from './src/games/GameHub';
import PlayerHeader from './src/components/PlayerHeader';
import MeinBereich from './src/components/MeinBereich';
import LevelUpOverlay from './src/components/LevelUpOverlay';
import BadgeUnlockOverlay from './src/components/BadgeUnlockOverlay';
import CoinAnimation from './src/components/CoinAnimation';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const { width } = Dimensions.get('window');
const isSmall = width < 380;

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
  bg2: '#F0F4F8', correct: '#D5F5E3', wrong: '#FADBD8',
  correctBorder: '#27AE60', wrongBorder: '#C0392B',
};

// ─── IMAGE VIEWER MODAL ───────────────────────────────────────────────────────
function ImageViewer({ image, visible, onClose }) {
  if (!image) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Image source={image} style={s.modalImage} resizeMode="contain" />
        <Text style={s.modalClose}>✕ Schließen</Text>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ onStart, onTopicSelect, selectedTopic, _highScore, onGames, xp, allQuestions, allTopics, selectedGrade, onGradeSelect, selectedSemester, onSemesterSelect, grades, semesters, playerName, coins, activeAvatar, onAvatarPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start(); }, []);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.homeWrap}>
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={s.homeEmoji}>📚</Text>
          <Text style={s.homeTitle}>Sachkunde Quiz</Text>
          <Text style={s.homeSub}>Lerne und teste dein Wissen!</Text>

          <PlayerHeader
            playerName={playerName}
            xp={xp}
            coins={coins}
            avatarId={activeAvatar}
            onAvatarPress={onAvatarPress}
          />

          <Text style={s.sectionLabel}>🎓 Klasse & Semester:</Text>
          <View style={s.chipWrap}>
            {grades.map(g => (
              <TouchableOpacity key={g}
                style={[s.chip, selectedGrade === g && s.chipActive]}
                onPress={() => onGradeSelect(g)}>
                <Text style={[s.chipTxt, selectedGrade === g && s.chipTxtActive]}>{g === 'Alle' ? 'Alle Klassen' : `${g}. Klasse`}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[s.chipWrap, { marginTop: -12 }]}>
            {semesters.map(sem => (
              <TouchableOpacity key={sem}
                style={[s.chip, selectedSemester === sem && s.chipActive]}
                onPress={() => onSemesterSelect(sem)}>
                <Text style={[s.chipTxt, selectedSemester === sem && s.chipTxtActive]}>{sem === 'Alle' ? 'Alle Semester' : sem}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.sectionLabel}>📚 Thema wählen:</Text>
          <View style={s.chipWrap}>
            {['Alle', ...allTopics].map(t => (
              <TouchableOpacity key={t}
                style={[s.chip, selectedTopic === t && s.chipActive]}
                onPress={() => onTopicSelect(t)}>
                <Text style={[s.chipTxt, selectedTopic === t && s.chipTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.statsRow}>
            {[
              [allQuestions.filter(q => selectedTopic === 'Alle' || q.topic === selectedTopic).length, 'Fragen'],
              [allTopics.length, 'Themen'],
              [MATERIALS.reduce((sum, m) => sum + m.images.length, 0), 'Materialien'],
            ].map(([n, l]) => (
              <View key={l} style={s.statCard}>
                <Text style={s.statN}>{n}</Text>
                <Text style={s.statL}>{l}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.bigBtn} onPress={onStart}>
            <Text style={s.bigBtnTxt}>🚀 Quiz starten!</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.bigBtn, { backgroundColor: C.blue }]} onPress={onGames}>
            <Text style={s.bigBtnTxt}>🎮 Spielmodi ({xp} XP)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignSelf: 'center', marginBottom: 12, paddingVertical: 6, paddingHorizontal: 16 }}
            onPress={() => window.location.reload(true)}
          >
            <Text style={{ fontSize: 13, color: C.blue, fontWeight: '700' }}>🔄 App aktualisieren</Text>
          </TouchableOpacity>

          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Fragetypen in dieser App:</Text>
            <Text style={s.infoItem}>📸 Schulbuchseite zeigen + Frage</Text>
            <Text style={s.infoItem}>✅ Multiple Choice</Text>
            <Text style={s.infoItem}>✏️ Lückentext ausfüllen</Text>
            <Text style={[s.infoTitle, { marginTop: 10 }]}>Spielmodi:</Text>
            <Text style={s.infoItem}>🧠 Memory - Paare finden</Text>
            <Text style={s.infoItem}>⚡ Speed Quiz - Gegen die Zeit</Text>
            <Text style={s.infoItem}>💰 Wer wird Millionär</Text>
            <Text style={s.infoItem}>📚 Flashcards - Lernkarten</Text>
            <Text style={s.infoItem}>🔢 Sortier-Challenge</Text>
            <Text style={s.infoItem}>✅❌ Wahr/Falsch Blitz</Text>
            <Text style={s.infoItem}>🏛️ Ringstraße Zuordnung</Text>
            <Text style={s.infoItem}>📖 Bezirke Merkgeschichte</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
function QuizScreen({ questions, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(false);
  const [fill, setFill] = useState('');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [results, setResults] = useState([]); // 'correct' | 'wrong' per question

  const cardAnim = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  const rawQ = questions[idx];
  const imgSrc = rawQ.image ? IMAGES[rawQ.image] : null;
  const [imgModal, setImgModal] = useState(false);

  // Bilder: Crop-Regionen um Antworten zu verstecken, oder erst nach Antwort zeigen
  const IMAGE_CROPS = {
    plaene_lesen:          { top: 0.02, height: 0.42 },
    karten_lesen:          { top: 0.32, height: 0.38 },
    bezirke_wien:          { top: 0.52, height: 0.46 },
    ringstrasse:           { top: 0.28, height: 0.68 },
    stephansdom:           { top: 0.08, height: 0.65 },
    erster_bezirk_plaetze: { top: 0.42, height: 0.50 },
  };
  const SHOW_AFTER_ANSWER = [
    'bezirke_bauwerke', 'erster_bezirk', 'erster_bezirk_info',
    'ringstrasse_gebaeude', 'ringstrasse_liste', 'ringstrasse_fotos',
    'ringstrasse_karte', 'ringstrasse_sheet',
    'stephansdom_aussen', 'stephansdom_innen', 'stephansdom_innen2',
  ];
  const imgCrop = rawQ.image ? IMAGE_CROPS[rawQ.image] : null;
  const imgAfterAnswer = rawQ.image ? SHOW_AFTER_ANSWER.includes(rawQ.image) : false;
  const showImgNow = imgSrc && !imgAfterAnswer;
  const showImgAfter = imgSrc && imgAfterAnswer && done;

  // Optionen mischen, damit die richtige Antwort nicht immer A ist
  const [shuffledQ, setShuffledQ] = useState(null);
  useEffect(() => {
    if (rawQ.options) {
      const indices = rawQ.options.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledQ({
        ...rawQ,
        options: indices.map(i => rawQ.options[i]),
        correct: indices.indexOf(rawQ.correct),
      });
    } else {
      setShuffledQ(rawQ);
    }
  }, [idx]);

  const q = shuffledQ || rawQ;

  useEffect(() => {
    cardAnim.setValue(0);
    Animated.timing(cardAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [idx]);

  const doBounce = () => Animated.sequence([
    Animated.timing(bounce, { toValue: 1.04, duration: 80, useNativeDriver: true }),
    Animated.timing(bounce, { toValue: 1, duration: 80, useNativeDriver: true }),
  ]).start();

  const handleMC = (i) => {
    if (done) return;
    setSel(i);
    setDone(true);
    if (i === q.correct) { setScore(s => s + 10); setCorrect(c => c + 1); setResults(r => [...r, 'correct']); doBounce(); }
    else { setWrong(w => w + 1); setResults(r => [...r, 'wrong']); }
  };

  const handleFill = () => {
    if (done) return;
    const ua = fill.trim().toLowerCase();
    if (!ua) return; // Leere Antwort ignorieren
    const ca = q.blanks[0].toLowerCase();
    const ok = ua === ca || (ua.length >= 2 && (ua.includes(ca) || ca.includes(ua)));
    setSel(ok ? 'ok' : 'fail');
    setDone(true);
    if (ok) { setScore(s => s + 10); setCorrect(c => c + 1); setResults(r => [...r, 'correct']); doBounce(); }
    else { setWrong(w => w + 1); setResults(r => [...r, 'wrong']); }
  };

  const next = () => {
    if (idx + 1 >= questions.length) { onFinish(score, correct, wrong); return; }
    setIdx(i => i + 1);
    setSel(null); setDone(false); setFill('');
    cardAnim.setValue(0);
  };

  const optStyle = (i) => {
    if (!done) return s.opt;
    if (i === q.correct) return [s.opt, s.optOK];
    if (i === sel && i !== q.correct) return [s.opt, s.optBAD];
    return [s.opt, s.optDim];
  };
  const optTxtStyle = (i) => {
    if (!done) return s.optTxt;
    if (i === q.correct) return [s.optTxt, { color: C.correctBorder }];
    if (i === sel && i !== q.correct) return [s.optTxt, { color: C.wrongBorder }];
    return [s.optTxt, { color: C.gray }];
  };

  return (
    <SafeAreaView style={s.safe}>
      <ImageViewer image={imgSrc} visible={imgModal} onClose={() => setImgModal(false)} />
      <ScrollView contentContainerStyle={s.quizWrap}>

        {/* Header */}
        <View style={s.qHeader}>
          <View>
            <Text style={s.qNum}>{idx + 1} / {questions.length}</Text>
            <Text style={s.qTopic}>{q.topic}</Text>
          </View>
          <View style={s.scorePill}>
            <Text style={s.scoreTxt}>⭐ {score} XP</Text>
          </View>
        </View>

        {/* Progress Bar — grün/rot/grau Segmente */}
        <View style={s.segBar}>
          {questions.map((_, i) => (
            <View key={i} style={[
              s.segItem,
              i < results.length
                ? { backgroundColor: results[i] === 'correct' ? C.green : C.red }
                : i === idx
                  ? { backgroundColor: C.blue }
                  : { backgroundColor: '#E0E0E0' },
            ]} />
          ))}
        </View>
        <View style={s.miniRow}>
          <Text style={[s.miniStat, { color: C.green }]}>✅ {correct}</Text>
          <Text style={[s.miniStat, { color: C.red }]}>❌ {wrong}</Text>
        </View>

        {/* Bild: zugeschnitten oder nach Antwort */}
        {showImgNow && (
          <TouchableOpacity
            style={[s.imgWrap, imgCrop && { height: 200, overflow: 'hidden' }]}
            onPress={() => setImgModal(true)} activeOpacity={0.85}
          >
            {imgCrop ? (
              <Image
                source={imgSrc}
                style={{
                  width: '100%',
                  height: 200 / imgCrop.height,
                  marginTop: -(imgCrop.top * (200 / imgCrop.height)),
                }}
                resizeMode="cover"
              />
            ) : (
              <Image source={imgSrc} style={s.qImg} resizeMode="cover" />
            )}
            <View style={s.imgOverlay}>
              <Text style={s.imgHint}>🔍 Tippen zum Vergrößern</Text>
              {q.imageHint && <Text style={s.imgCaption}>{q.imageHint}</Text>}
            </View>
          </TouchableOpacity>
        )}
        {imgAfterAnswer && !done && (
          <View style={[s.imgWrap, { backgroundColor: '#E8E8E8', height: 60, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 14, color: C.gray, fontWeight: '700' }}>📖 {q.imageHint || 'Schau in deinem Schulbuch nach!'}</Text>
          </View>
        )}
        {showImgAfter && (
          <TouchableOpacity style={s.imgWrap} onPress={() => setImgModal(true)} activeOpacity={0.85}>
            <Image source={imgSrc} style={s.qImg} resizeMode="cover" />
            <View style={s.imgOverlay}>
              <Text style={s.imgHint}>🔍 Schulbuchseite (Tippen zum Vergrößern)</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Frage */}
        <Animated.View style={[s.qCard, { opacity: cardAnim, transform: [{ scale: bounce }] }]}>
          <Text style={s.qTypeBadge}>
            {q.type === 'multiple_choice' ? '🔘 Multiple Choice' : '✏️ Lückentext'}
          </Text>
          <Text style={s.qTxt}>{q.question}</Text>
        </Animated.View>

        {/* Antworten */}
        {q.type !== 'fill_blank' ? (
          <View style={{ gap: 9, marginBottom: 14 }}>
            {q.options.map((opt, i) => (
              <TouchableOpacity key={i} style={optStyle(i)} onPress={() => handleMC(i)}>
                <View style={s.optLetter}><Text style={s.optLetterTxt}>{['A','B','C','D'][i]}</Text></View>
                <Text style={optTxtStyle(i)}>{opt}</Text>
                {done && i === q.correct && <Text style={{ marginLeft: 6 }}>✅</Text>}
                {done && i === sel && i !== q.correct && <Text style={{ marginLeft: 6 }}>❌</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ marginBottom: 14 }}>
            {!done ? (
              <>
                <Text style={s.fillLabel}>Deine Antwort:</Text>
                <TextInput
                  style={s.fillInput}
                  value={fill}
                  onChangeText={setFill}
                  placeholder="Antwort eintippen..."
                  placeholderTextColor="#CCC"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleFill}
                />
                {q.hint && <Text style={s.hint}>💭 Tipp: {q.hint}</Text>}
                <TouchableOpacity style={s.checkBtn} onPress={handleFill}>
                  <Text style={s.checkBtnTxt}>✓ Überprüfen</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={[s.fillResult, sel === 'ok' ? s.fillResultOK : s.fillResultBAD]}>
                <Text style={s.fillResultTxt}>
                  {sel === 'ok' ? '🎉 Richtig!' : `❌ Richtig wäre: ${q.blanks.join(' / ')}`}
                </Text>
                {fill && <Text style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>Deine Antwort: {fill}</Text>}
              </View>
            )}
          </View>
        )}

        {/* Erklärung */}
        {done && q.explanation && (
          <View style={s.explain}>
            <Text style={s.explainTitle}>💡 Erklärung:</Text>
            <Text style={s.explainTxt}>{q.explanation}</Text>
          </View>
        )}

        {/* Weiter */}
        {done && (
          <TouchableOpacity style={s.nextBtn} onPress={next}>
            <Text style={s.nextTxt}>{idx + 1 >= questions.length ? '🏁 Ergebnis!' : 'Weiter ➡️'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── RESULT ───────────────────────────────────────────────────────────────────
function ResultScreen({ score, total, correct, wrong, onRestart, onHome }) {
  const sc = useRef(new Animated.Value(0)).current;
  const pct = Math.round((correct / total) * 100);
  useEffect(() => { Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }).start(); }, []);

  const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👍' : '📚';
  const msg = pct >= 90 ? 'Fantastisch! Du bist ein Wien-Experte!' :
              pct >= 70 ? 'Super gemacht! Fast perfekt!' :
              pct >= 50 ? 'Gut! Noch ein bisschen üben!' : 'Weiter lernen – du schaffst das!';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.resultWrap}>
        <Animated.View style={[s.resultCard, { transform: [{ scale: sc }] }]}>
          <Text style={{ fontSize: 72 }}>{emoji}</Text>
          <Text style={s.resultTitle}>Quiz beendet!</Text>
          <Text style={s.resultMsg}>{msg}</Text>
          <View style={s.statsRow}>
            <View style={s.statCard}><Text style={s.statN}>{score}</Text><Text style={s.statL}>XP</Text></View>
            <View style={[s.statCard, { borderColor: C.green }]}><Text style={[s.statN, { color: C.green }]}>✅ {correct}</Text><Text style={s.statL}>Richtig</Text></View>
            <View style={[s.statCard, { borderColor: C.red }]}><Text style={[s.statN, { color: C.red }]}>❌ {wrong}</Text><Text style={s.statL}>Falsch</Text></View>
          </View>
          <View style={s.pBar}><View style={[s.pFill, { width: `${pct}%`, backgroundColor: C.green }]} /></View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.dark, marginTop: 6 }}>{pct}% richtig</Text>
        </Animated.View>
        <TouchableOpacity style={s.bigBtn} onPress={onRestart}><Text style={s.bigBtnTxt}>🔄 Nochmal</Text></TouchableOpacity>
        <TouchableOpacity style={[s.bigBtn, { backgroundColor: C.blue }]} onPress={onHome}><Text style={s.bigBtnTxt}>🏠 Zum Menü</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── LERNMATERIALIEN ─────────────────────────────────────────────────────────
function MaterialsScreen({ onBack }) {
  const [expanded, setExpanded] = useState(null);
  const [modalImg, setModalImg] = useState(null);

  return (
    <SafeAreaView style={s.safe}>
      <ImageViewer image={modalImg} visible={!!modalImg} onClose={() => setModalImg(null)} />
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark }}>📖 Lernmaterialien</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
        {MATERIALS.map((section, si) => (
          <View key={si} style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: expanded === si ? C.red : C.white,
                borderRadius: 14, padding: 16,
                borderWidth: 2, borderColor: expanded === si ? C.red : '#E8E8E8',
                elevation: 2,
              }}
              onPress={() => setExpanded(expanded === si ? null : si)}
            >
              <Text style={{
                fontSize: 16, fontWeight: '800',
                color: expanded === si ? C.white : C.dark,
              }}>
                {section.topic} ({section.images.length})
              </Text>
            </TouchableOpacity>
            {expanded === si && (
              <View style={{ marginTop: 8, gap: 10 }}>
                {section.images.map((img, ii) => (
                  <TouchableOpacity
                    key={ii}
                    style={{
                      backgroundColor: C.white, borderRadius: 14,
                      overflow: 'hidden', elevation: 3,
                      borderWidth: 2, borderColor: '#E8E8E8',
                    }}
                    activeOpacity={0.85}
                    onPress={() => setModalImg(IMAGES[img.key])}
                  >
                    <Image
                      source={IMAGES[img.key]}
                      style={{ width: '100%', height: 200 }}
                      resizeMode="cover"
                    />
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>{img.label}</Text>
                      <Text style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>Tippen zum Vergrößern</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const [screen, setScreen] = useState('home');
  const [topic, setTopic] = useState('Alle');
  const [grade, setGrade] = useState(3);
  const [semester, setSemester] = useState('Sommersemester');
  const [qs, setQs] = useState([]);
  const [result, setResult] = useState(null);
  const [dbQuestions, setDbQuestions] = useState(null);
  const [hs, setHs] = useState(getLocalHighscore);
  const [xp, setXp] = useState(getLocalXp);
  const [playerName, setPlayerName] = useState(getLocalName);

  // Gamification state
  const [coins, setCoins] = useState(getLocalCoins);
  const [activeAvatar, setActiveAvatarState] = useState(getActiveAvatar);
  const [ownedAvatars, setOwnedAvatars] = useState(getOwnedAvatars);
  const [ownedThemes, setOwnedThemesState] = useState(getOwnedThemes);
  const [unlockedBadges, setUnlockedBadges] = useState(getLocalBadges);
  const [showMeinBereich, setShowMeinBereich] = useState(false);
  const { themeId, switchTheme } = useTheme();

  // Celebration state
  const [levelUpData, setLevelUpData] = useState(null);
  const [badgeUnlockData, setBadgeUnlockData] = useState(null);
  const [coinAnimData, setCoinAnimData] = useState(null);
  const badgeQueueRef = useRef([]);

  // Load questions from Supabase on mount
  const loadQuestions = () => {
    fetchQuestions().then(data => {
      if (data && data.length > 0) setDbQuestions(data);
    }).catch(() => {});
  };
  useEffect(() => { loadQuestions(); }, []);

  const allQuestionsRaw = dbQuestions || QUESTIONS;
  // Filtere nach Klasse und Semester
  const allQuestions = allQuestionsRaw.filter(q => {
    if (grade !== 'Alle' && q.grade && q.grade !== grade) return false;
    if (semester !== 'Alle' && q.semester && q.semester !== semester) return false;
    return true;
  });
  const allTopics = [...new Set(allQuestions.map(q => q.topic))];
  const availableGrades = ['Alle', ...[...new Set(allQuestionsRaw.map(q => q.grade || 3))].sort((a,b) => a-b)];
  const availableSemesters = ['Alle', ...new Set(allQuestionsRaw.map(q => q.semester || 'Sommersemester'))];

  // Persist
  useEffect(() => { setLocalName(playerName); }, [playerName]);
  useEffect(() => { setLocalHighscore(hs); }, [hs]);

  // Beim Start: XP mit Supabase abgleichen
  useEffect(() => {
    if (!playerName) return;
    reconcileXp(playerName).then(correctXp => {
      setXp(correctXp);
    }).catch(() => {});
  }, [playerName]);

  // Gamification sync on startup
  useEffect(() => {
    if (!playerName) return;
    syncProfileFromRemote(playerName).catch(() => {});
    reconcileCoins(playerName).then(bal => setCoins(bal)).catch(() => {});
  }, [playerName]);

  // First-time gamification experience
  useEffect(() => {
    if (!playerName) return;
    if (!isFirstTimeGamification()) return;
    const stats = getGameStats();
    const newBadgeIds = checkBadges(stats, unlockedBadges);
    if (newBadgeIds.length > 0) {
      for (const bid of newBadgeIds) {
        unlockBadge(playerName, bid);
        const ftBal = earnCoins(playerName, 5, 'badge_bonus');
        setCoins(ftBal);
      }
      setUnlockedBadges(prev => [...prev, ...newBadgeIds]);
      badgeQueueRef.current = [...badgeQueueRef.current, ...newBadgeIds];
      if (!badgeUnlockData) {
        setBadgeUnlockData({ badgeId: badgeQueueRef.current.shift() });
      }
    }
    setGamificationVersion('1');
  }, [playerName]);

  // XP hinzufügen + sofort syncen
  const addXp = (amount) => {
    const newXp = getLocalXp() + amount;
    setXp(newXp);
    setLocalXp(newXp);
    if (playerName) syncXp(playerName, newXp).catch(() => {});
  };

  const getTopicQuestions = (t) => allQuestions.filter(q => t === 'Alle' || q.topic === t);

  const start = () => {
    const available = shuffleArray(getTopicQuestions(topic)).slice(0, 14);
    if (available.length === 0) return;
    setQs(available);
    setScreen('quiz');
  };
  const finish = (score, correct, wrong) => {
    if (score > hs) setHs(score);
    addXp(score);
    setResult({ score, correct, wrong, total: qs.length });
    setScreen('result');
  };

  const handleSelectGame = (gameId) => {
    const pool = gameId === 'millionaire' ? allQuestions : getTopicQuestions(topic);
    const available = shuffleArray(pool).slice(0, 14);
    if (available.length === 0) return;
    setQs(available);
    setScreen('game_' + gameId);
  };

  const handleGameXp = (amount, gameId = null, { streak = 0, stars = 0, wienCorrect = 0, isSpeedQuiz = false } = {}) => {
    if (amount > 0) {
      const prevLevel = getLevel(xp);
      addXp(amount);
      const newLevel = getLevel(xp + amount);

      // Award coins based on stars
      const coinAmount = coinsForStars(stars);
      const newBal = earnCoins(playerName, coinAmount, 'game_reward');
      setCoins(newBal);
      setCoinAnimData({ amount: coinAmount });

      // Record stats + check badges
      if (gameId) {
        const stats = recordGamePlayed(gameId, { streak, stars, wienCorrect, isSpeedQuiz });
        const newBadgeIds = checkBadges(stats, getLocalBadges());
        if (newBadgeIds.length > 0) {
          for (const bid of newBadgeIds) {
            unlockBadge(playerName, bid);
            const badgeBal = earnCoins(playerName, 5, 'badge_bonus');
            setCoins(badgeBal);
          }
          setUnlockedBadges(prev => [...prev, ...newBadgeIds]);
          // Queue badge celebrations
          badgeQueueRef.current = [...badgeQueueRef.current, ...newBadgeIds];
          if (!badgeUnlockData) {
            setBadgeUnlockData({ badgeId: badgeQueueRef.current.shift() });
          }
        }
      }

      // Level-up check
      if (newLevel > prevLevel) {
        const lvlInfo = getLevelInfo(xp + amount);
        const lvlBal = earnCoins(playerName, 20, 'level_bonus');
        setCoins(lvlBal);
        setLevelUpData({
          level: newLevel,
          levelEmoji: lvlInfo.emoji,
          levelName: lvlInfo.name,
          coinsEarned: 20,
          newUnlocks: [],
        });
      }
    }
  };
  const handleBuyAvatar = async (avatar) => {
    const newBal = await spendCoins(playerName, avatar.price, avatar.id);
    if (newBal === null) return;
    setCoins(newBal);
    const owned = addOwnedAvatar(avatar.id);
    setOwnedAvatars([...owned]);
    setActiveAvatarState(avatar.id);
    persistAvatar(avatar.id);
    syncProfileToRemote(playerName);
  };

  const handleBuyTheme = async (theme) => {
    const newBal = await spendCoins(playerName, theme.price, theme.id);
    if (newBal === null) return;
    setCoins(newBal);
    const owned = addOwnedTheme(theme.id);
    setOwnedThemesState([...owned]);
    switchTheme(theme.id);
    syncProfileToRemote(playerName);
  };

  const handleSelectAvatar = (id) => {
    setActiveAvatarState(id);
    persistAvatar(id);
    syncProfileToRemote(playerName);
  };

  const handleSelectTheme = (id) => {
    switchTheme(id);
    syncProfileToRemote(playerName);
  };

  const handleDismissBadge = () => {
    if (badgeQueueRef.current.length > 0) {
      setBadgeUnlockData({ badgeId: badgeQueueRef.current.shift() });
    } else {
      setBadgeUnlockData(null);
    }
  };

  const handleGameBack = () => setScreen('gamehub');
  const [nameInput, setNameInput] = useState('');

  // Name-Eingabe wenn noch kein Name gesetzt
  if (!playerName) {
    const submitName = () => { const n = nameInput.trim(); if (n.length >= 2) setPlayerName(n); };
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.light }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>👋</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: C.dark, marginBottom: 6 }}>Willkommen!</Text>
          <Text style={{ fontSize: 14, color: C.gray, marginBottom: 24, textAlign: 'center' }}>
            Gib deinen Spielernamen ein.{'\n'}Damit erscheinst du im Ranking!
          </Text>
          <TextInput
            style={{
              backgroundColor: C.white, borderRadius: 14, padding: 16,
              fontSize: 20, fontWeight: '700', color: C.dark, textAlign: 'center',
              borderWidth: 2, borderColor: '#E8E8E8', width: '100%', marginBottom: 16,
            }}
            placeholder="Dein Name..."
            placeholderTextColor="#CCC"
            maxLength={20}
            autoFocus
            value={nameInput}
            onChangeText={setNameInput}
            onSubmitEditing={submitName}
          />
          <TouchableOpacity
            style={{ backgroundColor: C.red, borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', opacity: nameInput.trim().length < 2 ? 0.4 : 1 }}
            onPress={submitName}
            disabled={nameInput.trim().length < 2}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: C.white }}>Los geht's!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.light, maxWidth: 500, width: '100%', alignSelf: 'center' }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.light} />
      {screen === 'home' && (
        <HomeScreen
          onStart={start} onTopicSelect={setTopic} selectedTopic={topic}
          highScore={hs} onGames={() => setScreen('gamehub')} xp={xp}
          allQuestions={allQuestions} allTopics={allTopics}
          selectedGrade={grade} onGradeSelect={setGrade}
          selectedSemester={semester} onSemesterSelect={setSemester}
          grades={availableGrades} semesters={availableSemesters}
          playerName={playerName} coins={coins} activeAvatar={activeAvatar}
          onAvatarPress={() => setShowMeinBereich(true)}
        />
      )}
      {screen === 'quiz' && <QuizScreen questions={qs} onFinish={finish} />}
      {screen === 'result' && result && <ResultScreen {...result} onRestart={start} onHome={() => setScreen('home')} />}
      {screen === 'gamehub' && (
        <GameHub onSelectGame={handleSelectGame} onBack={() => setScreen('home')} xp={xp} />
      )}
      {screen === 'game_memory' && <MemoryGame questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_speed' && <SpeedQuiz questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_millionaire' && <MillionaireGame questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_flashcards' && <Flashcards questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_sorting' && <SortingChallenge questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} semester={semester} />}
      {screen === 'game_truefalse' && <TrueFalseBlitz questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_hangman' && <HangmanGame onBack={handleGameBack} onXpEarned={handleGameXp} semester={semester} />}
      {screen === 'game_crossword' && <CrosswordGame onBack={handleGameBack} onXpEarned={handleGameXp} semester={semester} />}
      {screen === 'game_duel' && <QuizDuel questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_bubbleblaster' && <BubbleBlaster questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_spacerunner' && <SpaceRunner onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_ringmatch' && <RingMatchGame onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_merkgeschichte' && <MerkgeschichteGame onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_twoplayermemory' && <TwoPlayerMemory questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'game_ringsort' && <RingSortGame onBack={handleGameBack} onXpEarned={handleGameXp} semester={semester} />}
      {screen === 'game_pinboard' && <PinboardGame onBack={handleGameBack} onXpEarned={handleGameXp} semester={semester} />}
      {screen === 'game_category' && <CategoryGame onBack={handleGameBack} onXpEarned={handleGameXp} semester={semester} />}
      {screen === 'game_runner' && <RunnerGame questions={qs} onBack={handleGameBack} onXpEarned={handleGameXp} />}
      {screen === 'materials' && <MaterialsScreen onBack={() => setScreen('home')} />}
      {screen === 'leaderboard' && (
        <Leaderboard onBack={() => setScreen('home')} playerName={playerName} currentAvatar={activeAvatar} onSetName={(newName) => {
          const oldName = playerName;
          setPlayerName(newName);
          if (oldName && oldName !== newName) {
            renamePlayer(oldName, newName).catch(() => {});
            renameProfile(oldName, newName).catch(() => {});
          }
        }} />
      )}
      {screen === 'editor' && (
        <QuestionEditor onBack={() => setScreen('home')} questions={allQuestions} onQuestionsChanged={loadQuestions} />
      )}
      {screen === 'feedback' && <FeedbackScreen onBack={() => setScreen('home')} playerName={playerName} />}

      {/* Bottom Tab Bar */}
      {['home', 'materials', 'gamehub', 'leaderboard', 'feedback', 'editor'].includes(screen) && (
        <View style={s.tabBar}>
          <TouchableOpacity style={s.tab} onPress={() => setScreen('home')}>
            <Text style={[s.tabIcon, screen === 'home' && s.tabActive]}>🏠</Text>
            <Text style={[s.tabLabel, screen === 'home' && s.tabLabelActive]}>Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tab} onPress={() => setScreen('materials')}>
            <Text style={[s.tabIcon, screen === 'materials' && s.tabActive]}>📖</Text>
            <Text style={[s.tabLabel, screen === 'materials' && s.tabLabelActive]}>Material</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tab} onPress={() => setScreen('gamehub')}>
            <Text style={[s.tabIcon, screen === 'gamehub' && s.tabActive]}>🎮</Text>
            <Text style={[s.tabLabel, screen === 'gamehub' && s.tabLabelActive]}>Spiele</Text>
          </TouchableOpacity>
          {/* Ranking tab disabled until next quiz
          <TouchableOpacity style={s.tab} onPress={() => setScreen('leaderboard')}>
            <Text style={[s.tabIcon, screen === 'leaderboard' && s.tabActive]}>🏆</Text>
            <Text style={[s.tabLabel, screen === 'leaderboard' && s.tabLabelActive]}>Ranking</Text>
          </TouchableOpacity>
          */}
          <TouchableOpacity style={s.tab} onPress={() => setScreen('feedback')}>
            <Text style={[s.tabIcon, screen === 'feedback' && s.tabActive]}>{'\u{1F4AC}'}</Text>
            <Text style={[s.tabLabel, screen === 'feedback' && s.tabLabelActive]}>Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tab} onPress={() => setScreen('editor')}>
            <Text style={[s.tabIcon, screen === 'editor' && s.tabActive]}>{'\u270F\uFE0F'}</Text>
            <Text style={[s.tabLabel, screen === 'editor' && s.tabLabelActive]}>Editor</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mein Bereich Hub */}
      <MeinBereich
        visible={showMeinBereich}
        onClose={() => setShowMeinBereich(false)}
        playerName={playerName}
        playerLevel={getLevel(xp)}
        coins={coins}
        activeAvatar={activeAvatar}
        ownedAvatars={ownedAvatars}
        activeTheme={themeId}
        ownedThemes={ownedThemes}
        unlockedBadgeIds={unlockedBadges}
        onSelectAvatar={handleSelectAvatar}
        onBuyAvatar={handleBuyAvatar}
        onBuyTheme={handleBuyTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Celebration Overlays */}
      <LevelUpOverlay
        visible={!!levelUpData}
        {...(levelUpData || {})}
        onDismiss={() => setLevelUpData(null)}
      />
      <BadgeUnlockOverlay
        visible={!!badgeUnlockData}
        badgeId={badgeUnlockData?.badgeId}
        onDismiss={handleDismissBadge}
      />
      {coinAnimData && (
        <View style={{ position: 'absolute', top: 80, alignSelf: 'center', zIndex: 9998 }}>
          <CoinAnimation amount={coinAnimData.amount} onDone={() => setCoinAnimData(null)} />
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.light },

  // HOME
  homeWrap: { padding: isSmall ? 14 : 20, alignItems: 'center', paddingBottom: 40 },
  homeEmoji: { fontSize: isSmall ? 48 : 64, marginTop: 12 },
  homeTitle: { fontSize: isSmall ? 32 : 44, fontWeight: '900', color: C.red, marginTop: 6 },
  homeSub: { fontSize: isSmall ? 14 : 17, color: C.gray, marginBottom: 14 },
  hsBadge: { backgroundColor: C.gold, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 18, width: '100%', elevation: 4 },
  hsLabel: { fontSize: 13, fontWeight: '700', color: C.dark },
  hsVal: { fontSize: 30, fontWeight: '900', color: C.dark },
  sectionLabel: { fontSize: 17, fontWeight: '700', color: C.dark, alignSelf: 'flex-start', marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, width: '100%' },
  chip: { backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 2, borderColor: '#DDD' },
  chipActive: { backgroundColor: C.red, borderColor: C.red },
  chipTxt: { fontSize: 13, fontWeight: '700', color: C.dark },
  chipTxtActive: { color: C.white },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22, width: '100%' },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#EEE', elevation: 2 },
  statN: { fontSize: isSmall ? 20 : 26, fontWeight: '900', color: C.blue },
  statL: { fontSize: isSmall ? 10 : 11, color: C.gray, marginTop: 3 },
  bigBtn: { backgroundColor: C.red, borderRadius: 18, padding: isSmall ? 14 : 17, width: '100%', alignItems: 'center', marginBottom: 10, elevation: 6 },
  bigBtnTxt: { fontSize: isSmall ? 16 : 19, fontWeight: '900', color: C.white },
  infoBox: { backgroundColor: C.white, borderRadius: 16, padding: 16, width: '100%', borderWidth: 2, borderColor: '#EEE', marginTop: 4 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 8 },
  infoItem: { fontSize: 13, color: C.gray, marginBottom: 4 },

  // QUIZ
  quizWrap: { padding: isSmall ? 10 : 16, paddingBottom: 40 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  qNum: { fontSize: 16, fontWeight: '800', color: C.dark },
  qTopic: { fontSize: 12, color: C.gray },
  scorePill: { backgroundColor: C.gold, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  scoreTxt: { fontSize: 15, fontWeight: '800', color: C.dark },
  segBar: { flexDirection: 'row', gap: 3, marginBottom: 8, height: 10 },
  segItem: { flex: 1, borderRadius: 5 },
  miniRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  miniStat: { fontSize: 14, fontWeight: '700' },

  // IMAGE
  imgWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 14, elevation: 4, backgroundColor: C.dark },
  qImg: { width: '100%', height: isSmall ? 170 : 220 },
  imgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 10 },
  imgHint: { fontSize: 12, color: '#FFD', fontWeight: '700' },
  imgCaption: { fontSize: 12, color: '#EEE', marginTop: 2 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.93)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: width - 20, height: undefined, aspectRatio: 0.75 },
  modalClose: { color: C.white, fontSize: 16, fontWeight: '700', marginTop: 20, padding: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },

  // QUESTION CARD
  qCard: { backgroundColor: C.white, borderRadius: 18, padding: 18, marginBottom: 14, elevation: 4, borderWidth: 2, borderColor: '#F0F0F0' },
  qTypeBadge: { fontSize: 12, color: C.gray, fontWeight: '600', marginBottom: 8 },
  qTxt: { fontSize: isSmall ? 15 : 18, fontWeight: '800', color: C.dark, lineHeight: isSmall ? 22 : 26 },

  // OPTIONS
  opt: { backgroundColor: C.white, borderRadius: 13, padding: isSmall ? 11 : 14, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#E8E8E8', elevation: 2, marginBottom: 2 },
  optOK: { backgroundColor: C.correct, borderColor: C.correctBorder },
  optBAD: { backgroundColor: C.wrong, borderColor: C.wrongBorder },
  optDim: { opacity: 0.45 },
  optLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optLetterTxt: { fontSize: 13, fontWeight: '800', color: C.dark },
  optTxt: { flex: 1, fontSize: isSmall ? 13 : 15, fontWeight: '600', color: C.dark },

  // FILL BLANK
  fillLabel: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 8 },
  fillInput: {
    backgroundColor: C.white, borderRadius: 14, padding: 16,
    fontSize: 18, fontWeight: '700', color: C.dark,
    borderWidth: 2, borderColor: '#DDD', marginBottom: 10,
  },
  checkBtn: { backgroundColor: C.blue, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 6 },
  checkBtnTxt: { fontSize: 16, fontWeight: '800', color: C.white },
  fillResult: { borderRadius: 12, padding: 12, marginTop: 8 },
  fillResultOK: { backgroundColor: C.correct, borderWidth: 2, borderColor: C.correctBorder },
  fillResultBAD: { backgroundColor: C.wrong, borderWidth: 2, borderColor: C.wrongBorder },
  fillResultTxt: { fontSize: 15, fontWeight: '700', color: C.dark },
  hint: { fontSize: 13, color: C.gray, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },

  // EXPLANATION
  explain: { backgroundColor: '#EBF5FB', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 2, borderColor: '#AED6F1' },
  explainTitle: { fontSize: 13, fontWeight: '800', color: C.blue, marginBottom: 4 },
  explainTxt: { fontSize: 14, color: C.dark, lineHeight: 20 },

  // NEXT
  nextBtn: { backgroundColor: C.red, borderRadius: 14, padding: 17, alignItems: 'center', elevation: 5 },
  nextTxt: { fontSize: 18, fontWeight: '900', color: C.white },

  // RESULT
  resultWrap: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  resultCard: { backgroundColor: C.white, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', marginBottom: 20, elevation: 8 },
  resultTitle: { fontSize: 30, fontWeight: '900', color: C.dark, marginTop: 10, marginBottom: 6 },
  resultMsg: { fontSize: 15, color: C.gray, textAlign: 'center', marginBottom: 18 },

  // TAB BAR
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: '#E8E8E8', paddingBottom: 12, paddingTop: 8, elevation: 10 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  tabIcon: { fontSize: isSmall ? 18 : 22, opacity: 0.5 },
  tabActive: { opacity: 1 },
  tabLabel: { fontSize: isSmall ? 8 : 10, fontWeight: '600', color: C.gray, marginTop: 2 },
  tabLabelActive: { color: C.red, fontWeight: '800' },
});
