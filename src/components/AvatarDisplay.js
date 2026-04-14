import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAvatarById } from '../data/avatars';

// Reusable avatar display — used on home screen, leaderboard, profile.
export default function AvatarDisplay({ avatarId, size = 48, showBorder = true }) {
  const avatar = getAvatarById(avatarId);
  const fontSize = size * 0.55;

  return (
    <View style={[
      styles.circle,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: showBorder ? 2 : 0,
      },
    ]}>
      <Text style={{ fontSize }}>{avatar.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#FFF9F5',
    borderColor: '#F39C12',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});
