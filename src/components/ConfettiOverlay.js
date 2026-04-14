import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 50;
const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#F39C12', '#E74C3C'];

// Web implementation using canvas
function ConfettiCanvas({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * SCREEN_W,
      y: -20 - Math.random() * 100,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    let frame;
    let startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

      // Fade out after 1.5s
      const fadeStart = 1500;
      const fadeDuration = 500;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.rotation += p.rotSpeed;

        if (elapsed > fadeStart) {
          p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / fadeDuration);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < fadeStart + fadeDuration) {
        frame = requestAnimationFrame(animate);
      } else {
        onDone && onDone();
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SCREEN_W,
        height: SCREEN_H,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

// React Native fallback (simplified)
function ConfettiNative({ onDone }) {
  const anims = useRef(
    Array.from({ length: 20 }, () => ({
      y: new Animated.Value(-20),
      x: Math.random() * SCREEN_W,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map(p =>
      Animated.parallel([
        Animated.timing(p.y, { toValue: SCREEN_H + 20, duration: 1500 + Math.random() * 500, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ])
    );
    Animated.parallel(animations).start(() => onDone && onDone());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          left: p.x,
          width: 8,
          height: 6,
          backgroundColor: p.color,
          borderRadius: 2,
          opacity: p.opacity,
          transform: [{ translateY: p.y }],
        }} />
      ))}
    </View>
  );
}

export default function ConfettiOverlay({ visible, onDone }) {
  if (!visible) return null;

  if (Platform.OS === 'web') {
    return <ConfettiCanvas onDone={onDone} />;
  }
  return <ConfettiNative onDone={onDone} />;
}
