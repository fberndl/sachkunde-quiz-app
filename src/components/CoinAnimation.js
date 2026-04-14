import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// Animated "+X" coin counter that ticks up from 0 to target.
export default function CoinAnimation({ amount, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => onDone && onDone(), 800);
    });
  }, []);

  return (
    <Animated.View style={[styles.wrap, { opacity: anim, transform: [{ scale }] }]}>
      <Text style={styles.text}>{'\uD83E\uDE99'} +{amount}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F39C12',
  },
});
