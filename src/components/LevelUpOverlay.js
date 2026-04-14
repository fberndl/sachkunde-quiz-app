import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal } from 'react-native';
import ConfettiOverlay from './ConfettiOverlay';
import SoundService from '../utils/SoundService';

export default function LevelUpOverlay({ visible, level, levelEmoji, levelName, coinsEarned, newUnlocks, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
      SoundService.success();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <ConfettiOverlay visible={true} />
        <Animated.View style={[styles.card, {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        }]}>
          <Text style={styles.emoji}>{levelEmoji}</Text>
          <Text style={styles.title}>Level {level} erreicht!</Text>
          <Text style={styles.name}>{levelName}</Text>
          <View style={styles.coinRow}>
            <Text style={styles.coinText}>{'\uD83E\uDE99'} +{coinsEarned} Münzen</Text>
          </View>
          {newUnlocks && newUnlocks.length > 0 && (
            <View style={styles.unlockSection}>
              <Text style={styles.unlockTitle}>Neu verfügbar:</Text>
              {newUnlocks.map((item, i) => (
                <Text key={i} style={styles.unlockItem}>{item}</Text>
              ))}
            </View>
          )}
          <Text style={styles.dismiss}>Tippen zum Schließen</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 10,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#2C3E50', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '600', color: '#95A5A6', marginBottom: 16 },
  coinRow: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  coinText: { fontSize: 20, fontWeight: '800', color: '#F39C12' },
  unlockSection: { marginTop: 8, alignItems: 'center' },
  unlockTitle: { fontSize: 14, fontWeight: '700', color: '#2C3E50', marginBottom: 6 },
  unlockItem: { fontSize: 14, color: '#7f8c8d', marginBottom: 2 },
  dismiss: { fontSize: 13, color: '#BDC3C7', marginTop: 16 },
});
