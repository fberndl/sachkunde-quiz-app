import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView,
} from 'react-native';
import { shuffleArray } from '../data/questions';
import SoundService from '../utils/SoundService';

const { width: W, height: H } = Dimensions.get('window');

const LANE_COLORS = ['#f72585', '#8b5cf6', '#4cc9f0'];
const LANE_COLORS_RGB = ['247,37,133', '139,92,246', '76,201,240'];

function prepareQuestions(questions) {
  const mc = questions.filter(q => q.type === 'multiple_choice' && q.options && q.options.length >= 3);
  const shuffled = shuffleArray(mc).slice(0, 10);
  return shuffled.map(q => {
    const correctText = q.options[q.correct];
    const wrongOpts = shuffleArray(q.options.filter((_, i) => i !== q.correct)).slice(0, 2);
    const correctLane = Math.floor(Math.random() * 3);
    const answers = [];
    let wi = 0;
    for (let i = 0; i < 3; i++) {
      if (i === correctLane) answers.push({ text: correctText, correct: true });
      else { answers.push({ text: wrongOpts[wi] || '???', correct: false }); wi++; }
    }
    return { question: q.question, answers, correctLane };
  });
}

export default function RunnerGame({ questions, onBack, onXpEarned }) {
  const [phase, setPhase] = useState('menu'); // menu | play | over
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState(null); // { text, color }

  const canvasRef = useRef(null);
  const gameRef = useRef({
    active: false,
    playerLane: 1,
    targetLane: 1,
    obstacles: [],
    particles: [],
    questions: [],
    currentQ: 0,
    lives: 3,
    score: 0,
    correctCount: 0,
    speed: 1.8,
    questionLoaded: false,
    waitingForNext: false,
  });
  const animRef = useRef(null);
  const xpAwarded = useRef(false);

  const moveTo = useCallback((lane) => {
    const g = gameRef.current;
    if (g.active && lane >= 0 && lane <= 2) {
      g.targetLane = lane;
    }
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handler = (e) => {
      const g = gameRef.current;
      if (!g.active) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (Math.round(g.targetLane) > 0) moveTo(Math.round(g.targetLane) - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (Math.round(g.targetLane) < 2) moveTo(Math.round(g.targetLane) + 1);
      } else if (e.key === 'ArrowUp' || e.key === ' ') {
        moveTo(1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [moveTo]);

  const showFeedback = (correct) => {
    setFeedback({ text: correct ? '\u2713 Richtig!' : '\u2717 Falsch!', color: correct ? '#00ff88' : '#ff4444' });
    setTimeout(() => setFeedback(null), 800);
  };

  const loadNextQuestion = () => {
    const g = gameRef.current;
    if (g.currentQ >= g.questions.length) return;

    const q = g.questions[g.currentQ];
    const canvasH = canvasRef.current ? canvasRef.current.height : 600;
    const startY = -120;
    for (let i = 0; i < 3; i++) {
      g.obstacles.push({
        lane: i,
        y: startY,
        text: q.answers[i].text,
        correct: q.answers[i].correct,
        passed: false,
      });
    }
    g.questionLoaded = true;
    g.waitingForNext = false;
    setCurrentQ(g.currentQ);
  };

  const endGame = () => {
    const g = gameRef.current;
    g.active = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    if (!xpAwarded.current && onXpEarned) {
      const xp = g.correctCount * 5;
      const maxQ = g.questions ? g.questions.length : 1;
      const pctVal = maxQ > 0 ? Math.round((g.correctCount / maxQ) * 100) : 0;
      const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
      if (xp > 0) onXpEarned(xp, 'runner', { stars: starsVal });
      xpAwarded.current = true;
    }
    try { SoundService.success(); } catch (e) {}
    setPhase('over');
  };

  const createParticles = (x, y, colorRgb, count) => {
    const g = gameRef.current;
    for (let i = 0; i < count; i++) {
      g.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        size: Math.random() * 8 + 4,
        life: 1,
        color: colorRgb,
      });
    }
  };

  // Canvas render loop
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const laneWidth = w / 3;
    const g = gameRef.current;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Lanes
    for (let i = 0; i < 3; i++) {
      const x = i * laneWidth;
      ctx.fillStyle = `rgba(${LANE_COLORS_RGB[i]},0.1)`;
      ctx.fillRect(x + 2, 0, laneWidth - 4, h);

      ctx.strokeStyle = LANE_COLORS[i];
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Lane labels
      ctx.fillStyle = LANE_COLORS[i];
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        i === 0 ? '\u25C0 LINKS' : i === 1 ? '\u25CF MITTE' : 'RECHTS \u25B6',
        x + laneWidth / 2, 20
      );
    }

    // Right border
    ctx.strokeStyle = LANE_COLORS[2];
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w, h);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Moving horizontal lines (road effect)
    const time = Date.now() * 0.003;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const y = ((time * 100 + i * (h / 10)) % h);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Answer blocks
    g.obstacles.forEach(obs => {
      const x = obs.lane * laneWidth + laneWidth / 2;
      const boxW = laneWidth - 20;
      const boxH = 70;

      ctx.fillStyle = `rgba(${LANE_COLORS_RGB[obs.lane]},0.85)`;
      ctx.strokeStyle = LANE_COLORS[obs.lane];
      ctx.lineWidth = 3;

      const bx = x - boxW / 2;
      const by = obs.y - boxH / 2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bx, by, boxW, boxH, 12);
      } else {
        ctx.rect(bx, by, boxW, boxH);
      }
      ctx.fill();
      ctx.stroke();

      // Text on block
      ctx.font = 'bold 13px system-ui';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      const text = obs.text;
      if (text.length > 12) {
        const words = text.split(' ');
        let line1 = '', line2 = '';
        words.forEach(word => {
          if (line1.length + word.length < 14) line1 += (line1 ? ' ' : '') + word;
          else line2 += (line2 ? ' ' : '') + word;
        });
        ctx.fillText(line1, x, obs.y - 5);
        ctx.fillText(line2, x, obs.y + 12);
      } else {
        ctx.fillText(text, x, obs.y + 5);
      }
    });

    // Player (triangle character)
    const playerX = (g.playerLane + (g.targetLane - g.playerLane) * 0.3) * laneWidth + laneWidth / 2;
    const playerY = h - 80;

    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ff88';
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(playerX, playerY - 30);
    ctx.lineTo(playerX - 20, playerY + 10);
    ctx.lineTo(playerX + 20, playerY + 10);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(playerX - 6, playerY - 12, 3, 0, Math.PI * 2);
    ctx.arc(playerX + 6, playerY - 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    for (let i = 1; i <= 4; i++) {
      ctx.fillStyle = `rgba(0,255,136,${0.3 - i * 0.07})`;
      ctx.beginPath();
      ctx.arc(playerX, playerY + 10 + i * 12, 12 - i * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    g.particles = g.particles.filter(p => p.life > 0);
    g.particles.forEach(p => {
      ctx.fillStyle = `rgba(${p.color},${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
    });
  };

  // Game loop
  const gameLoop = () => {
    const g = gameRef.current;
    if (!g.active) return;

    // Smooth player movement
    g.playerLane += (g.targetLane - g.playerLane) * 0.2;

    // Move obstacles down
    g.obstacles.forEach(obs => { obs.y += g.speed; });

    const canvas = canvasRef.current;
    if (!canvas) { animRef.current = requestAnimationFrame(gameLoop); return; }

    const canvasH = canvas.height;
    const laneWidth = canvas.width / 3;
    const playerY = canvasH - 80;

    // Collision detection
    g.obstacles = g.obstacles.filter(obs => {
      const playerLaneRounded = Math.round(g.playerLane);

      // Player hits this block
      if (Math.abs(obs.y - playerY) < 40 && obs.lane === playerLaneRounded && !obs.passed) {
        obs.passed = true;
        const px = obs.lane * laneWidth + laneWidth / 2;

        if (obs.correct) {
          g.score += 10;
          g.correctCount++;
          setScore(g.score);
          setCorrectCount(g.correctCount);
          createParticles(px, playerY, '0,255,136', 25);
          showFeedback(true);
          try { SoundService.correct(); } catch (e) {}

          g.currentQ++;
          // Remove all blocks from this wave
          g.obstacles.forEach(o => { o.passed = true; });

          if (g.currentQ >= g.questions.length) {
            setTimeout(() => endGame(), 800);
          } else {
            g.waitingForNext = true;
            setTimeout(() => loadNextQuestion(), 1200);
          }
          return false;
        } else {
          g.lives--;
          setLives(g.lives);
          createParticles(px, playerY, '255,68,68', 25);
          showFeedback(false);
          try { SoundService.wrong(); } catch (e) {}

          // Mark all blocks in this wave as passed
          g.obstacles.forEach(o => { o.passed = true; });

          g.currentQ++;
          if (g.lives <= 0 || g.currentQ >= g.questions.length) {
            setTimeout(() => endGame(), 800);
          } else {
            g.waitingForNext = true;
            setTimeout(() => loadNextQuestion(), 1000);
          }
          return false;
        }
      }

      // Correct answer scrolled past = missed it = lose a life
      if (obs.y > canvasH + 50 && obs.correct && !obs.passed) {
        obs.passed = true;
        g.obstacles.forEach(o => { o.passed = true; });

        g.lives--;
        setLives(g.lives);
        showFeedback(false);
        try { SoundService.wrong(); } catch (e) {}

        g.currentQ++;
        if (g.lives <= 0 || g.currentQ >= g.questions.length) {
          setTimeout(() => endGame(), 500);
        } else {
          g.waitingForNext = true;
          setTimeout(() => loadNextQuestion(), 1000);
        }
        return false;
      }

      // Remove wrong answers that scrolled off
      if (obs.y > canvasH + 50 && !obs.correct) {
        return false;
      }

      return obs.y < canvasH + 100;
    });

    renderCanvas();
    animRef.current = requestAnimationFrame(gameLoop);
  };

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const startGame = () => {
    const g = gameRef.current;
    g.questions = prepareQuestions(questions);
    g.active = true;
    g.playerLane = 1;
    g.targetLane = 1;
    g.obstacles = [];
    g.particles = [];
    g.currentQ = 0;
    g.lives = 3;
    g.score = 0;
    g.correctCount = 0;
    g.speed = 1.8;
    g.questionLoaded = false;
    g.waitingForNext = false;

    setLives(3);
    setScore(0);
    setCurrentQ(0);
    setCorrectCount(0);
    setFeedback(null);
    xpAwarded.current = false;
    setPhase('play');

    // Wait a frame for canvas to mount, then resize and start
    setTimeout(() => {
      resizeCanvas();
      loadNextQuestion();
      animRef.current = requestAnimationFrame(gameLoop);
    }, 50);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      gameRef.current.active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const questionText = phase === 'play' && gameRef.current.questions[gameRef.current.currentQ]
    ? gameRef.current.questions[gameRef.current.currentQ].question
    : '';

  // --- MENU ---
  if (phase === 'menu') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.menuOverlay}>
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <Text style={s.backBtnText}>{'\u2190'} Zurück</Text>
          </TouchableOpacity>
          <Text style={s.menuTitle}>{'\uD83C\uDFC3'} Quiz Runner</Text>
          <Text style={s.menuSub}>Weiche den falschen Antworten aus!</Text>
          <Text style={s.menuSub}>Sammle die richtigen ein!</Text>
          <View style={s.controlsPreview}>
            <View style={[s.previewBtn, { backgroundColor: 'rgba(247,37,133,0.3)' }]}>
              <Text style={s.previewEmoji}>{'\u25C0'}</Text>
              <Text style={[s.previewLabel, { color: '#f72585' }]}>Links</Text>
            </View>
            <View style={[s.previewBtn, { backgroundColor: 'rgba(139,92,246,0.3)' }]}>
              <Text style={s.previewEmoji}>{'\u25CF'}</Text>
              <Text style={[s.previewLabel, { color: '#8b5cf6' }]}>Mitte</Text>
            </View>
            <View style={[s.previewBtn, { backgroundColor: 'rgba(76,201,240,0.3)' }]}>
              <Text style={s.previewEmoji}>{'\u25B6'}</Text>
              <Text style={[s.previewLabel, { color: '#4cc9f0' }]}>Rechts</Text>
            </View>
          </View>
          <TouchableOpacity style={s.startBtn} onPress={startGame}>
            <Text style={s.startBtnText}>{'\u25B6'} START</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- GAME OVER ---
  if (phase === 'over') {
    const g = gameRef.current;
    const maxScore = g.questions.length * 10;
    const pct = maxScore > 0 ? Math.round((g.score / maxScore) * 100) : 0;
    const resultText = pct >= 90 ? '\uD83C\uDFC6 Fantastisch!' : pct >= 70 ? '\uD83C\uDF1F Super gemacht!' : pct >= 50 ? '\uD83D\uDC4D Gut!' : '\uD83D\uDCAA Weiter üben!';
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;

    return (
      <SafeAreaView style={s.container}>
        <View style={s.menuOverlay}>
          <Text style={s.menuTitle}>{'\uD83C\uDFC1'} Geschafft!</Text>
          <Text style={s.finalScore}>{g.score} / {maxScore} Punkte</Text>
          <Text style={s.starsText}>
            {stars > 0 ? '\u2B50'.repeat(stars) : '\uD83D\uDE22'}
          </Text>
          <Text style={s.resultText}>{resultText}</Text>
          <Text style={s.xpText}>+{g.correctCount * 5} XP</Text>
          <TouchableOpacity style={s.startBtn} onPress={startGame}>
            <Text style={s.startBtnText}>{'\uD83D\uDD04'} Nochmal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuBtn} onPress={onBack}>
            <Text style={s.menuBtnText}>{'\uD83C\uDFE0'} Zurück</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- PLAYING ---
  return (
    <SafeAreaView style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { gameRef.current.active = false; if (animRef.current) cancelAnimationFrame(animRef.current); onBack(); }}>
          <Text style={s.closeBtn}>{'\u2715'}</Text>
        </TouchableOpacity>
        <View style={s.questionBox}>
          <Text style={s.questionText} numberOfLines={2}>{questionText}</Text>
        </View>
        <Text style={s.scoreText}>{score}{'\u2B50'}</Text>
      </View>

      {/* Lives */}
      <Text style={s.livesText}>
        {'\u2764\uFE0F'.repeat(lives)}{'\uD83D\uDDA4'.repeat(3 - lives)}
      </Text>

      {/* Progress */}
      <View style={s.progressOuter}>
        <View style={[s.progressInner, { width: `${((currentQ + 1) / (gameRef.current.questions.length || 1)) * 100}%` }]} />
      </View>

      {/* Canvas area */}
      <View style={s.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </View>

      {/* Feedback overlay */}
      {feedback && (
        <View style={s.feedbackOverlay}>
          <Text style={[s.feedbackText, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={s.controlsBar}>
        <TouchableOpacity
          style={[s.ctrlBtn, { background: 'linear-gradient(135deg,#f72585,#b5179e)', boxShadow: '0 4px 20px rgba(247,37,133,0.5)' }]}
          onPress={() => moveTo(0)}
          activeOpacity={0.7}
        >
          <Text style={s.ctrlBtnText}>{'\u25C0'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.ctrlBtn, { background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 20px rgba(139,92,246,0.5)' }]}
          onPress={() => moveTo(1)}
          activeOpacity={0.7}
        >
          <Text style={s.ctrlBtnText}>{'\u25CF'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.ctrlBtn, { background: 'linear-gradient(135deg,#4cc9f0,#4361ee)', boxShadow: '0 4px 20px rgba(76,201,240,0.5)' }]}
          onPress={() => moveTo(2)}
          activeOpacity={0.7}
        >
          <Text style={s.ctrlBtnText}>{'\u25B6'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0a1a',
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 8,
  },
  closeBtn: {
    backgroundColor: '#f72585',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontWeight: 'bold',
    fontSize: 14,
    overflow: 'hidden',
  },
  questionBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4cc9f0',
  },
  questionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  scoreText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#4cc9f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: '#4cc9f0',
    overflow: 'hidden',
  },
  // Lives
  livesText: {
    textAlign: 'center',
    fontSize: 24,
    paddingVertical: 5,
  },
  // Progress
  progressOuter: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginHorizontal: 10,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    borderRadius: 3,
    backgroundImage: 'linear-gradient(90deg,#f72585,#4cc9f0)',
  },
  // Canvas
  canvasWrap: {
    flex: 1,
  },
  // Feedback
  feedbackOverlay: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  feedbackText: {
    fontSize: 42,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  // Controls
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  ctrlBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlBtnText: {
    fontSize: 28,
    color: '#fff',
  },
  // Menu
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  backBtnText: {
    color: '#4cc9f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  menuSub: {
    color: '#4cc9f0',
    fontSize: 16,
    marginBottom: 4,
  },
  controlsPreview: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 25,
  },
  previewBtn: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  previewEmoji: {
    fontSize: 24,
    color: '#fff',
  },
  previewLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  startBtn: {
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 50,
    backgroundImage: 'linear-gradient(135deg,#10b981,#059669)',
    marginBottom: 10,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuBtn: {
    paddingHorizontal: 35,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  menuBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  // Game Over
  finalScore: {
    fontSize: 28,
    color: '#4cc9f0',
    marginVertical: 10,
  },
  starsText: {
    fontSize: 48,
    marginVertical: 10,
  },
  resultText: {
    color: '#aaa',
    fontSize: 18,
    marginBottom: 10,
  },
  xpText: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
