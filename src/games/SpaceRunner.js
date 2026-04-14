import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, PanResponder,
} from 'react-native';
import { QUESTIONS, shuffleArray } from '../data/questions';

const { width: W, height: H } = Dimensions.get('window');
const LANE_W = Math.min(W, 420);
const LANES = 3;
const LANE_SIZE = LANE_W / LANES;
const GAME_H = H - 155;
const TICK = 28;

const C = {
  bg: '#050520', road: '#0a0a3a',
  star: '#FFF', gold: '#F39C12', white: '#FFF',
  green: '#27AE60', red: '#E74C3C', blue: '#2980B9',
  gray: '#888', dark: '#2C3E50', light: '#FFF9F5',
  purple: '#9B59B6', cyan: '#00E5FF', orange: '#FF6F00',
  laser: '#00FF88', laserDouble: '#FF00FF', laserTriple: '#FFD700',
};

const OBS_TYPES = [
  { emoji: '🪨', hp: 1, pts: 15, name: 'Asteroid', drops: true },
  { emoji: '☄️', hp: 2, pts: 30, name: 'Komet', drops: true },
  { emoji: '🛸', hp: 3, pts: 50, name: 'UFO', drops: true },
  { emoji: '🌑', hp: 4, pts: 80, name: 'Mond', drops: true },
];

const POWERUP_TYPES = [
  { emoji: '🛡️', type: 'shield', color: C.cyan, dur: 6000, desc: 'Schild! 6s' },
  { emoji: '⭐', type: 'bonus', color: C.gold, dur: 0, desc: '+50 XP!' },
  { emoji: '💚', type: 'life', color: C.green, dur: 0, desc: '+1 Leben!' },
  { emoji: '🔥', type: 'double', color: C.orange, dur: 7000, desc: '2x Punkte! 7s' },
  { emoji: '🔫', type: 'weapon', color: C.laserDouble, dur: 8000, desc: 'Waffen-Upgrade! 8s' },
  { emoji: '💣', type: 'bomb', color: C.red, dur: 0, desc: 'BOOM! Alles weg!' },
  { emoji: '⚡', type: 'rapidfire', color: '#FFFF00', dur: 5000, desc: 'Schnellfeuer! 5s' },
];

const WEAPON_LEVELS = [
  { name: 'Laser', color: C.laser, width: 3, speed: 12, damage: 1, count: 1 },
  { name: 'Doppel-Laser', color: C.laserDouble, width: 3, speed: 14, damage: 1, count: 2 },
  { name: 'Dreifach-Laser', color: C.laserTriple, width: 4, speed: 16, damage: 2, count: 3 },
];

function getQuizQuestions() {
  return shuffleArray(QUESTIONS.filter(q => q.type !== 'fill_blank' && q.options && q.options.length >= 3));
}

let globalId = 0;
const nextId = () => ++globalId;

export default function SpaceRunner({ onBack, onXpEarned }) {
  const [phase, setPhase] = useState('menu');
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [lasers, setLasers] = useState([]);
  const [powerups, setPowerups] = useState([]);
  const [particles, setParticles] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [drops, setDrops] = useState([]);
  const [stars, setStars] = useState(() =>
    Array.from({ length: 45 }, () => ({
      x: Math.random() * LANE_W, y: Math.random() * GAME_H,
      size: Math.random() * 2.5 + 0.5, speed: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.5 + 0.3,
    }))
  );
  const [roadLines, setRoadLines] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({ y: i * (GAME_H / 10) }))
  );
  const [quizQ, setQuizQ] = useState(null);
  const [quizAnswerLanes, setQuizAnswerLanes] = useState([]);
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [distance, setDistance] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [showFlash, setShowFlash] = useState(null);
  const [shieldActive, setShieldActive] = useState(false);
  const [doubleActive, setDoubleActive] = useState(false);
  const [weaponLevel, setWeaponLevel] = useState(0);
  const [rapidFire, setRapidFire] = useState(false);
  const [shipBlink, setShipBlink] = useState(false);
  const [notification, setNotification] = useState(null);
  const [level, setLevel] = useState(1);
  const [kills, setKills] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [autoFireFrame, setAutoFireFrame] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('space_hs') || '0', 10); } catch (e) { return 0; }
  });

  const r = useRef({});
  const xpAwardedRef = useRef(false);
  const upd = (k, v) => { r.current[k] = v; };
  useEffect(() => { upd('lane', lane); }, [lane]);
  useEffect(() => { upd('speed', speed); }, [speed]);
  useEffect(() => { upd('lives', lives); }, [lives]);
  useEffect(() => { upd('phase', phase); }, [phase]);
  useEffect(() => { upd('shield', shieldActive); }, [shieldActive]);
  useEffect(() => { upd('double', doubleActive); }, [doubleActive]);
  useEffect(() => { upd('weapon', weaponLevel); }, [weaponLevel]);
  useEffect(() => { upd('rapid', rapidFire); }, [rapidFire]);

  const showNotif = (text, color) => {
    setNotification({ text, color });
    setTimeout(() => setNotification(null), 1500);
  };

  const spawnParticles = (x, y, color, count = 8) => {
    setParticles(prev => [...prev, ...Array.from({ length: count }, () => ({
      id: nextId(), x, y, color,
      vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2,
      life: 12 + Math.floor(Math.random() * 8),
    }))]);
  };

  const spawnExplosion = (x, y, size) => {
    setExplosions(prev => [...prev, { id: nextId(), x, y, size, life: 12 }]);
    spawnParticles(x, y, C.orange, 12);
    spawnParticles(x, y, C.gold, 6);
    spawnParticles(x, y, C.red, 4);
  };

  const fireWeapon = () => {
    if (r.current.phase !== 'play') return;
    const wep = WEAPON_LEVELS[r.current.weapon || 0];
    const cx = r.current.lane * LANE_SIZE + LANE_SIZE / 2;
    const shipY = GAME_H - 80;
    const newLasers = [];
    if (wep.count === 1) {
      newLasers.push({ id: nextId(), x: cx, y: shipY - 10, ...wep });
    } else if (wep.count === 2) {
      newLasers.push({ id: nextId(), x: cx - 8, y: shipY - 10, ...wep });
      newLasers.push({ id: nextId(), x: cx + 8, y: shipY - 10, ...wep });
    } else {
      newLasers.push({ id: nextId(), x: cx - 14, y: shipY - 5, ...wep });
      newLasers.push({ id: nextId(), x: cx, y: shipY - 15, ...wep });
      newLasers.push({ id: nextId(), x: cx + 14, y: shipY - 5, ...wep });
    }
    setLasers(prev => [...prev, ...newLasers]);
  };

  // Swipe
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 15,
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 15 && Math.abs(gs.dy) < 15) fireWeapon();
        else if (gs.dx > 30) setLane(l => Math.min(2, l + 1));
        else if (gs.dx < -30) setLane(l => Math.max(0, l - 1));
      },
    })
  ).current;

  const startGame = () => {
    globalId = 0;
    setQuizIdx(0); setScore(0); setDistance(0); setSpeed(3);
    setLane(1); setLives(3); setCombo(0); setLevel(1); setKills(0);
    setObstacles([]); setLasers([]); setPowerups([]); setParticles([]);
    setExplosions([]); setDrops([]);
    setShowFlash(null); setShieldActive(false); setDoubleActive(false);
    setWeaponLevel(0); setRapidFire(false);
    setShipBlink(false); setNotification(null);
    setQuestionsAnswered(0); setQuestionsCorrect(0);
    setPhase('play');
    xpAwardedRef.current = false;
  };

  // === GAME LOOP ===
  useEffect(() => {
    if (phase !== 'play') return;
    let frame = 0;
    let nextQuiz = 200 + Math.floor(Math.random() * 150);
    let nextObs = 5;
    let nextPow = 35 + Math.floor(Math.random() * 25);
    let fireCD = 0;

    const tick = setInterval(() => {
      frame++;
      const spd = r.current.speed || 3;
      const mult = r.current.double ? 2 : 1;
      const shipY = GAME_H - 80;
      const shipLane = r.current.lane;
      const shipCx = shipLane * LANE_SIZE + LANE_SIZE / 2;

      setDistance(d => d + spd * 0.1);
      if (frame % 5 === 0) setScore(s => s + mult); // Distanz-Punkte
      if (frame % 200 === 0) {
        setSpeed(s => Math.min(s + 0.4, 10)); // Schneller schwerer werden
        setLevel(l => l + 1);
      }

      // Auto-fire
      const fireRate = r.current.rapid ? 4 : 8;
      fireCD--;
      if (fireCD <= 0) {
        fireWeapon();
        fireCD = fireRate;
      }

      // Stars
      setStars(prev => prev.map(s => ({
        ...s, y: s.y + s.speed * spd * 0.4,
        ...(s.y > GAME_H ? { y: -5, x: Math.random() * LANE_W } : {}),
      })));

      // Road lines
      setRoadLines(prev => prev.map(rl => ({
        ...rl, y: rl.y + spd * 2.5,
        ...(rl.y > GAME_H ? { y: -10 } : {}),
      })));

      // Particles
      setParticles(prev => prev
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 1 }))
        .filter(p => p.life > 0));

      // Explosions
      setExplosions(prev => prev.map(e => ({ ...e, life: e.life - 1 })).filter(e => e.life > 0));

      // Spawn obstacles - mehr und stärker mit höherem Level
      nextObs--;
      if (nextObs <= 0) {
        const lvl = Math.min(Math.floor(spd / 2), OBS_TYPES.length - 1);
        // Höheres Level = stärkere Gegner wahrscheinlicher
        const typeIdx = Math.min(
          Math.floor(Math.random() * (lvl + 1) + (spd > 5 ? 1 : 0)),
          OBS_TYPES.length - 1
        );
        const type = OBS_TYPES[typeIdx];
        const obsLane = Math.floor(Math.random() * LANES);
        // HP skaliert mit Speed
        const hpBonus = spd > 6 ? 1 : 0;
        setObstacles(prev => [...prev, {
          lane: obsLane, y: -40, id: nextId(), ...type,
          hp: type.hp + hpBonus, currentHp: type.hp + hpBonus,
          pts: type.pts * (1 + hpBonus), scale: 0.3,
        }]);
        // Weniger Abstand = mehr Hindernisse bei höherem Level
        nextObs = Math.max(4, 14 - Math.floor(spd * 0.9));
        // Ab Level 3: manchmal 2 Hindernisse gleichzeitig
        if (spd > 5 && Math.random() < 0.3) {
          const lane2 = (obsLane + 1 + Math.floor(Math.random() * 2)) % LANES;
          const type2 = OBS_TYPES[Math.floor(Math.random() * (lvl + 1))];
          setObstacles(prev => [...prev, {
            lane: lane2, y: -40, id: nextId(), ...type2,
            hp: type2.hp, currentHp: type2.hp, pts: type2.pts, scale: 0.3,
          }]);
        }
      }

      // Spawn powerups - VIEL seltener
      nextPow--;
      if (nextPow <= 0) {
        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        const puLane = Math.floor(Math.random() * LANES);
        setPowerups(prev => [...prev, { lane: puLane, y: -40, id: nextId(), ...type }]);
        nextPow = 120 + Math.floor(Math.random() * 80); // ~4-6 Sekunden statt ~1s
      }

      // Move lasers + hit detection
      setLasers(prev => {
        let updated = prev.map(l => ({ ...l, y: l.y - l.speed })).filter(l => l.y > -20);
        // Laser-obstacle collision
        setObstacles(obs => {
          const remaining = [];
          for (const o of obs) {
            let wasHit = false;
            updated = updated.filter(l => {
              const ox = o.lane * LANE_SIZE + LANE_SIZE / 2;
              const hitDist = 22 * (o.scale || 1);
              if (Math.abs(l.x - ox) < hitDist && Math.abs(l.y - o.y) < hitDist) {
                o.currentHp -= l.damage;
                spawnParticles(ox, o.y, C.gold, 3);
                wasHit = true;
                return false; // remove laser
              }
              return true;
            });
            if (o.currentHp <= 0) {
              // Destroyed!
              const ox = o.lane * LANE_SIZE + LANE_SIZE / 2;
              spawnExplosion(ox, o.y, 30);
              setScore(s => s + o.pts * mult);
              setKills(k => k + 1);
              // Drop power-up?
              if (o.drops && Math.random() < 0.1) {
                const dropType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                setDrops(d => [...d, { ...dropType, x: ox, y: o.y, id: nextId() }]);
              }
            } else {
              remaining.push(o);
            }
          }
          return remaining;
        });
        return updated;
      });

      // Move drops (fallen power-ups from destroyed enemies)
      setDrops(prev => prev
        .map(d => ({ ...d, y: d.y + 2 }))
        .filter(d => {
          if (d.y > GAME_H + 30) return false;
          const dx = Math.abs(d.x - shipCx);
          if (dx < 30 && d.y > shipY - 20 && d.y < shipY + 20) {
            applyPowerup(d);
            return false;
          }
          return true;
        }));

      // Move obstacles
      setObstacles(prev => prev
        .map(o => {
          const ny = o.y + spd * 2.2;
          const progress = Math.min(ny / GAME_H, 1);
          return { ...o, y: ny, scale: 0.3 + progress * 0.7 };
        })
        .filter(o => {
          if (o.y > GAME_H + 50) return false;
          // Ship collision
          if (o.lane === shipLane && o.y > shipY - 16 && o.y < shipY + 16) {
            if (r.current.shield) {
              spawnParticles(shipCx, shipY, C.cyan, 10);
              showNotif('🛡️ Geblockt!', C.cyan);
              return false;
            }
            const nl = r.current.lives - 1;
            setLives(nl);
            setCombo(0);
            setShipBlink(true);
            setTimeout(() => setShipBlink(false), 600);
            spawnExplosion(shipCx, shipY, 20);
            setShowFlash('hit');
            setTimeout(() => setShowFlash(null), 200);
            if (nl <= 0) { clearInterval(tick); setPhase('result'); }
            return false;
          }
          return true;
        }));

      // Move power-ups
      setPowerups(prev => prev
        .map(p => ({ ...p, y: p.y + spd * 1.8 }))
        .filter(p => {
          if (p.y > GAME_H + 50) return false;
          if (p.lane === shipLane && p.y > shipY - 20 && p.y < shipY + 20) {
            applyPowerup(p);
            return false;
          }
          return true;
        }));

      // Quiz trigger
      nextQuiz--;
      if (nextQuiz <= 0 && r.current.phase === 'play') {
        clearInterval(tick);
        const pool = getQuizQuestions();
        setQuizIdx(qi => {
          const q = pool[qi % pool.length];
          setQuizQ(q);
          const correctLane = Math.floor(Math.random() * 3);
          const wrongOpts = shuffleArray(q.options.filter((_, i) => i !== q.correct));
          const lanes = [];
          let wi = 0;
          for (let i = 0; i < 3; i++) {
            if (i === correctLane) lanes.push({ text: q.options[q.correct], correct: true });
            else { lanes.push({ text: wrongOpts[wi] || '???', correct: false }); wi++; }
          }
          setQuizAnswerLanes(lanes);
          setPhase('quiz');
          return qi + 1;
        });
        nextQuiz = 25 + Math.floor(Math.random() * 15);
      }
    }, TICK);
    return () => clearInterval(tick);
  }, [phase]);

  const applyPowerup = (p) => {
    spawnParticles(r.current.lane * LANE_SIZE + LANE_SIZE / 2, GAME_H - 80, p.color, 10);
    switch (p.type) {
      case 'shield':
        setShieldActive(true); showNotif(p.desc, p.color);
        setTimeout(() => setShieldActive(false), p.dur); break;
      case 'bonus':
        setScore(s => s + 50); showNotif(p.desc, p.color); break;
      case 'life':
        setLives(l => Math.min(l + 1, 5)); showNotif(p.desc, p.color); break;
      case 'double':
        setDoubleActive(true); showNotif(p.desc, p.color);
        setTimeout(() => setDoubleActive(false), p.dur); break;
      case 'weapon':
        setWeaponLevel(w => Math.min(w + 1, 2)); showNotif(p.desc, p.color);
        if (p.dur) setTimeout(() => setWeaponLevel(0), p.dur); break;
      case 'bomb':
        setObstacles([]); showNotif(p.desc, p.color);
        setShowFlash('correct'); setTimeout(() => setShowFlash(null), 300);
        setScore(s => s + 100); break;
      case 'rapidfire':
        setRapidFire(true); showNotif(p.desc, p.color);
        setTimeout(() => setRapidFire(false), p.dur); break;
    }
  };

  // Quiz timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    setQuizAnswered(false); setQuizTimer(10);
    const cd = setInterval(() => {
      setQuizTimer(t => {
        if (t <= 1) { clearInterval(cd); quizMiss(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(cd);
  }, [phase]);

  const quizMiss = () => {
    setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('result'); return Math.max(0, nl); });
    setCombo(0); showNotif('⏱ Zeit abgelaufen!', C.red);
    setShowFlash('wrong');
    setTimeout(() => { setShowFlash(null); if (r.current.lives > 0) setPhase('play'); }, 700);
  };

  const handleQuizAnswer = (i) => {
    if (quizAnswered) return;
    setQuizAnswered(true); setQuestionsAnswered(n => n + 1);
    const a = quizAnswerLanes[i];
    if (a.correct) {
      const pts = 100 + combo * 30;
      setScore(s => s + pts); setCombo(c => c + 1); setQuestionsCorrect(n => n + 1);
      showNotif(`✅ Richtig! +${pts} XP!`, C.green); setShowFlash('correct');
    } else {
      setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('result'); return Math.max(0, nl); });
      setCombo(0); showNotif('❌ Falsch!', C.red); setShowFlash('wrong');
    }
    setTimeout(() => { setShowFlash(null); if (r.current.lives > 0) setPhase('play'); }, 900);
  };

  const skipQuiz = () => {
    if (quizAnswered) return;
    setQuizAnswered(true);
    setLives(l => { const nl = l - 1; if (nl <= 0) setPhase('result'); return Math.max(0, nl); });
    setCombo(0); showNotif('⏭ Übersprungen', C.gray);
    setTimeout(() => { if (r.current.lives > 0) setPhase('play'); }, 500);
  };

  useEffect(() => {
    if (phase === 'result' && score > highScore) {
      setHighScore(score);
      try { localStorage.setItem('space_hs', String(score)); } catch (e) {}
    }
  }, [phase]);

  // ═══ MENU ═══
  if (phase === 'menu') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity onPress={onBack}><Text style={st.backTxt}>← Zurück</Text></TouchableOpacity>
        </View>
        <View style={st.menuWrap}>
          <Text style={{ fontSize: 64 }}>🚀</Text>
          <Text style={st.menuTitle}>Space Runner</Text>
          <Text style={st.menuSub}>Fliege, schiesse, sammle und beantworte Fragen!</Text>
          {highScore > 0 && (
            <View style={st.hsBadge}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>🏆 Highscore: {highScore}</Text>
            </View>
          )}
          <View style={st.howTo}>
            <Text style={st.howTitle}>Steuerung:</Text>
            <Text style={st.howItem}>👆 Tippe aufs Spielfeld = Schiessen</Text>
            <Text style={st.howItem}>👈👉 Wische oder Buttons = Ausweichen</Text>
            <Text style={st.howTitle}>Ziel:</Text>
            <Text style={st.howItem}>💥 Schiesse Asteroiden ab (Auto-Feuer!)</Text>
            <Text style={st.howItem}>⭐ Sammle Power-Ups und Drops</Text>
            <Text style={st.howItem}>❓ Beantworte Sachkunde-Fragen</Text>
            <Text style={st.howTitle}>Power-Ups:</Text>
            <Text style={st.howItem}>🛡️ Schild  ⭐ Bonus  💚 Leben  🔥 2x XP</Text>
            <Text style={st.howItem}>🔫 Waffen-Up  💣 Bombe  ⚡ Schnellfeuer</Text>
          </View>
          <TouchableOpacity style={[st.startBtn, { backgroundColor: C.purple }]} onPress={startGame}>
            <Text style={st.startTxt}>🚀 Losfliegen!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══ RESULT ═══
  if (phase === 'result') {
    const isNew = score >= highScore && score > 0;
    const xpAmount = Math.round(score / 20);
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const starsVal = score >= 200 ? 3 : score >= 100 ? 2 : score > 0 ? 1 : 0;
      if (onXpEarned) onXpEarned(xpAmount, 'spacerunner', { stars: starsVal });
    }
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.menuWrap}>
          <Text style={{ fontSize: 56 }}>{isNew ? '🏆' : '💥'}</Text>
          <Text style={st.menuTitle}>{isNew ? 'Neuer Highscore!' : 'Game Over!'}</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{xpAmount} XP verdient!
          </Text>
          <View style={st.resultGrid}>
            <View style={st.resultCard}><Text style={st.rcN}>{score}</Text><Text style={st.rcL}>Score</Text></View>
            <View style={st.resultCard}><Text style={[st.rcN, { color: C.blue }]}>{Math.floor(distance)}m</Text><Text style={st.rcL}>Distanz</Text></View>
            <View style={st.resultCard}><Text style={[st.rcN, { color: C.red }]}>{kills}</Text><Text style={st.rcL}>Abschüsse</Text></View>
            <View style={st.resultCard}><Text style={[st.rcN, { color: C.green }]}>{questionsCorrect}/{questionsAnswered}</Text><Text style={st.rcL}>Fragen</Text></View>
          </View>
          <TouchableOpacity style={[st.startBtn, { backgroundColor: C.purple }]} onPress={startGame}>
            <Text style={st.startTxt}>🔄 Nochmal!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.startBtn, { backgroundColor: C.gray }]} onPress={onBack}>
            <Text style={st.startTxt}>← Zurück</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══ PLAY & QUIZ ═══
  const shipCx = lane * LANE_SIZE + LANE_SIZE / 2;
  const shipY = GAME_H - 80;
  const wep = WEAPON_LEVELS[weaponLevel];

  return (
    <View style={st.gameWrap} {...panResponder.panHandlers}>
      <View style={[st.gameArea, { width: LANE_W }]}>
        {/* Stars */}
        {stars.map((s, i) => (
          <View key={i} style={{
            position: 'absolute', left: s.x, top: s.y,
            width: s.size, height: s.size, borderRadius: s.size,
            backgroundColor: i % 7 === 0 ? '#FFD700' : i % 11 === 0 ? '#87CEEB' : C.star,
            opacity: s.brightness,
          }} />
        ))}

        {/* Road perspective lines */}
        {roadLines.map((rl, i) => {
          const p = rl.y / GAME_H;
          return (
            <View key={i} style={{
              position: 'absolute', top: rl.y,
              left: (1 - p) * 25, right: (1 - p) * 25, height: 1,
              backgroundColor: `rgba(80,80,200,${0.04 + p * 0.06})`,
            }} />
          );
        })}

        {/* Lane dividers */}
        {[1, 2].map(i => (
          <View key={i} style={{
            position: 'absolute', left: i * LANE_SIZE, top: 0,
            width: 1, height: GAME_H, backgroundColor: 'rgba(80,120,255,0.08)',
          }} />
        ))}

        {/* Lasers */}
        {lasers.map(l => (
          <View key={l.id} style={{
            position: 'absolute', left: l.x - l.width / 2, top: l.y,
            width: l.width, height: 14, borderRadius: 2,
            backgroundColor: l.color,
            shadowColor: l.color, shadowRadius: 6, shadowOpacity: 0.8,
          }} />
        ))}

        {/* Particles */}
        {particles.map(p => (
          <View key={p.id} style={{
            position: 'absolute', left: p.x - 2, top: p.y - 2,
            width: 4, height: 4, borderRadius: 2,
            backgroundColor: p.color, opacity: p.life / 20,
          }} />
        ))}

        {/* Explosions */}
        {explosions.map(e => {
          const s = e.size * (1 + (12 - e.life) * 0.15);
          return (
            <View key={e.id} style={{
              position: 'absolute', left: e.x - s / 2, top: e.y - s / 2,
              width: s, height: s, borderRadius: s / 2,
              backgroundColor: `rgba(255,${100 + e.life * 10},0,${e.life / 15})`,
              borderWidth: 2, borderColor: `rgba(255,200,0,${e.life / 15})`,
            }} />
          );
        })}

        {/* Drops from destroyed enemies */}
        {drops.map(d => (
          <View key={d.id} style={{
            position: 'absolute', left: d.x - 14, top: d.y - 14,
            width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18 }}>{d.emoji}</Text>
          </View>
        ))}

        {/* Power-ups */}
        {powerups.map(p => (
          <View key={p.id} style={{
            position: 'absolute',
            left: p.lane * LANE_SIZE + LANE_SIZE / 2 - 16, top: p.y - 16,
            width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
          </View>
        ))}

        {/* Obstacles with HP indicator */}
        {obstacles.map(o => {
          const sz = 36 * (o.scale || 1);
          const ox = o.lane * LANE_SIZE + LANE_SIZE / 2 - sz / 2;
          return (
            <View key={o.id} style={{
              position: 'absolute', left: ox, top: o.y - sz / 2,
              width: sz, height: sz, justifyContent: 'center', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 22 * (o.scale || 1) }}>{o.emoji}</Text>
              {o.hp > 1 && o.scale > 0.5 && (
                <View style={{
                  position: 'absolute', bottom: -4, width: sz * 0.8, height: 3,
                  backgroundColor: 'rgba(255,0,0,0.4)', borderRadius: 2, overflow: 'hidden',
                }}>
                  <View style={{
                    width: `${(o.currentHp / o.hp) * 100}%`, height: '100%',
                    backgroundColor: o.currentHp > o.hp / 2 ? C.green : C.red,
                  }} />
                </View>
              )}
            </View>
          );
        })}

        {/* Quiz overlay */}
        {phase === 'quiz' && quizQ && (
          <>
            <View style={st.quizOverlay} />
            <View style={st.quizBanner}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: C.gold, fontSize: 13, fontWeight: '800' }}>❓ Sachkunde-Frage</Text>
                <Text style={{ color: quizTimer <= 3 ? '#FF4444' : C.gold, fontSize: 16, fontWeight: '900' }}>⏱ {quizTimer}s</Text>
              </View>
              <Text style={st.quizTxt}>{quizQ.question}</Text>
            </View>
            {quizAnswerLanes.map((a, i) => (
              <TouchableOpacity key={i} style={[st.quizOpt, {
                top: GAME_H / 2 + 10 + i * 55,
                borderColor: quizAnswered ? (a.correct ? C.green : C.red) : C.gold,
                opacity: quizAnswered && !a.correct ? 0.4 : 1,
                backgroundColor: quizAnswered && a.correct ? 'rgba(39,174,96,0.3)' : 'rgba(0,0,0,0.8)',
              }]} onPress={() => handleQuizAnswer(i)} disabled={quizAnswered}>
                <View style={[st.quizLetter, { backgroundColor: quizAnswered && a.correct ? C.green : 'rgba(243,156,18,0.2)' }]}>
                  <Text style={{ color: quizAnswered && a.correct ? '#FFF' : C.gold, fontWeight: '900', fontSize: 14 }}>{['A','B','C'][i]}</Text>
                </View>
                <Text style={st.quizOptTxt} numberOfLines={2}>{a.text}</Text>
              </TouchableOpacity>
            ))}
            {!quizAnswered && (
              <TouchableOpacity style={st.skipBtn} onPress={skipQuiz}>
                <Text style={{ color: '#888', fontSize: 12 }}>Überspringen (−1 ❤️)</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Ship */}
        <View style={[st.ship, { left: shipCx - 20, top: shipY, opacity: shipBlink ? 0.3 : 1 }]}>
          {shieldActive && <View style={st.shieldBubble} />}
          <Text style={{ fontSize: 32 }}>🚀</Text>
          {/* Engine glow */}
          <View style={{ position: 'absolute', bottom: -20, alignItems: 'center' }}>
            <View style={{ width: 6, height: 10, borderRadius: 3, backgroundColor: C.cyan, opacity: 0.9 }} />
            <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: C.blue, opacity: 0.6, marginTop: -3 }} />
          </View>
        </View>

        {/* Notification */}
        {notification && (
          <View style={[st.notif, { borderColor: notification.color }]}>
            <Text style={[st.notifTxt, { color: notification.color }]}>{notification.text}</Text>
          </View>
        )}

        {/* Flash */}
        {showFlash && (
          <View style={[st.flash, {
            backgroundColor: showFlash === 'correct' ? 'rgba(39,174,96,0.2)' : showFlash === 'hit' ? 'rgba(192,57,43,0.3)' : 'rgba(192,57,43,0.2)',
          }]} />
        )}
      </View>

      {/* HUD */}
      <View style={[st.hud, { width: LANE_W }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={st.hudScore}>⭐{score}</Text>
          {combo > 1 && <Text style={st.hudCombo}>x{combo}</Text>}
          {doubleActive && <Text style={{ fontSize: 12 }}>🔥</Text>}
          {shieldActive && <Text style={{ fontSize: 12 }}>🛡️</Text>}
          {rapidFire && <Text style={{ fontSize: 12 }}>⚡</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 1 }}>
          {Array.from({ length: Math.max(lives, 3) }, (_, i) => (
            <Text key={i} style={{ fontSize: 12, opacity: i < lives ? 1 : 0.15 }}>❤️</Text>
          ))}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={st.hudDist}>{Math.floor(distance)}m</Text>
          <Text style={{ color: '#555', fontSize: 9 }}>Lv.{level} | {wep.name}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={[st.controls, { width: LANE_W }]}>
        <TouchableOpacity style={st.ctrlBtn} onPress={() => setLane(l => Math.max(0, l - 1))}>
          <Text style={st.ctrlTxt}>⬅️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.ctrlBtn, { backgroundColor: 'rgba(0,255,136,0.15)', borderColor: 'rgba(0,255,136,0.3)' }]} onPress={fireWeapon}>
          <Text style={st.ctrlTxt}>🔫</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.ctrlBtn} onPress={() => setLane(l => Math.min(2, l + 1))}>
          <Text style={st.ctrlTxt}>➡️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.light },
  header: { padding: 16 },
  backTxt: { fontSize: 16, fontWeight: '700', color: C.blue },
  menuWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuTitle: { fontSize: 28, fontWeight: '900', color: C.dark, marginTop: 6 },
  menuSub: { fontSize: 13, color: C.gray, textAlign: 'center', marginBottom: 12 },
  hsBadge: { backgroundColor: C.gold, borderRadius: 12, padding: 8, alignItems: 'center', width: '100%', marginBottom: 10 },
  howTo: { backgroundColor: '#FFF', borderRadius: 12, padding: 10, width: '100%', marginBottom: 12, borderWidth: 2, borderColor: '#EEE' },
  howTitle: { fontSize: 12, fontWeight: '700', color: C.dark, marginBottom: 2, marginTop: 4 },
  howItem: { fontSize: 11, color: C.gray, marginBottom: 1 },
  startBtn: { borderRadius: 16, padding: 14, width: '100%', alignItems: 'center', marginBottom: 8 },
  startTxt: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12, width: '100%' },
  resultCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#EEE' },
  rcN: { fontSize: 24, fontWeight: '900', color: C.gold },
  rcL: { fontSize: 10, color: C.gray },

  gameWrap: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  gameArea: { flex: 1, overflow: 'hidden', position: 'relative', backgroundColor: C.road },
  ship: { position: 'absolute', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  shieldBubble: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: C.cyan, backgroundColor: 'rgba(0,229,255,0.08)' },

  quizOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,32,0.75)' },
  quizBanner: { position: 'absolute', left: 8, right: 8, top: GAME_H / 2 - 130, backgroundColor: 'rgba(0,0,0,0.92)', borderRadius: 14, padding: 12, borderWidth: 2, borderColor: C.gold },
  quizTxt: { color: '#FFF', fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 20 },
  quizOpt: { position: 'absolute', left: 10, right: 10, height: 48, borderRadius: 12, borderWidth: 2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  quizLetter: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  quizOptTxt: { color: '#FFF', fontSize: 12, fontWeight: '700', flex: 1 },
  skipBtn: { position: 'absolute', left: 10, right: 10, top: GAME_H / 2 + 10 + 3 * 55, alignItems: 'center', padding: 6 },

  notif: { position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.88)', borderRadius: 10, padding: 8, borderWidth: 2, alignItems: 'center' },
  notifTxt: { fontSize: 15, fontWeight: '900' },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.75)' },
  hudScore: { color: C.gold, fontSize: 14, fontWeight: '900' },
  hudCombo: { color: C.gold, fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(243,156,18,0.15)', paddingHorizontal: 4, borderRadius: 4 },
  hudDist: { color: '#AAA', fontSize: 11, fontWeight: '700' },

  controls: { flexDirection: 'row', gap: 6, padding: 6, backgroundColor: 'rgba(0,0,0,0.65)' },
  ctrlBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  ctrlTxt: { fontSize: 24 },
});
