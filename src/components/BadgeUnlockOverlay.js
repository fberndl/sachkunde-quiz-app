import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import ConfettiOverlay from './ConfettiOverlay';
import { getBadgeById, BADGE_CATEGORIES, TIER_COLORS } from '../data/badges';
import SoundService from '../utils/SoundService';

export default function BadgeUnlockOverlay({ visible, badgeId, onDismiss }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      SoundService.streak();
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(flipAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start(() => {
        // Auto-dismiss after 2.5s
        setTimeout(() => onDismiss && onDismiss(), 2500);
      });
    } else {
      flipAnim.setValue(0);
      scaleAnim.setValue(0.3);
    }
  }, [visible]);

  if (!visible || !badgeId) return null;

  const badge = getBadgeById(badgeId);
  if (!badge) return null;

  const category = BADGE_CATEGORIES.find(c => c.id === badge.category);
  const tierColor = TIER_COLORS[badge.tier] || '#C0C0C0';
  const tierLabel = badge.tier === 'bronze' ? 'Bronze' : badge.tier === 'silver' ? 'Silber' : 'Gold';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <ConfettiOverlay visible={true} />
        <Animated.View style={[styles.card, {
          transform: [{ scale: scaleAnim }],
          borderColor: tierColor,
        }]}>
          <Animated.View style={{
            transform: [{
              rotateY: flipAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['180deg', '90deg', '0deg'],
              }),
            }],
          }}>
            <Text style={styles.emoji}>{category ? category.emoji : '\u2B50'}</Text>
          </Animated.View>
          <Text style={[styles.tier, { color: tierColor }]}>{tierLabel}</Text>
          <Text style={styles.category}>{category ? category.name : ''}</Text>
          <Text style={styles.label}>{badge.label}</Text>
          <View style={styles.coinRow}>
            <Text style={styles.coinText}>{'\uD83E\uDE99'} +5 Münzen</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
    elevation: 10,
    borderWidth: 3,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  tier: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  category: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginTop: 4 },
  label: { fontSize: 14, color: '#95A5A6', marginTop: 4, marginBottom: 12 },
  coinRow: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  coinText: { fontSize: 16, fontWeight: '800', color: '#F39C12' },
});
