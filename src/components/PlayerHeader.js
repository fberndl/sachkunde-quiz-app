import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AvatarDisplay from './AvatarDisplay';
import { getLevelInfo, getLevel } from '../games/GameHub';

export default function PlayerHeader({ playerName, xp, coins, avatarId, onAvatarPress }) {
  const level = getLevel(xp);
  const levelInfo = getLevelInfo(xp);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
        <AvatarDisplay avatarId={avatarId} size={52} />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{playerName}</Text>
        <View style={styles.row}>
          <Text style={styles.level}>{levelInfo.emoji} Lv.{level}</Text>
          <Text style={styles.xp}>{xp} XP</Text>
        </View>
      </View>
      <View style={styles.coinBadge}>
        <Text style={styles.coinText}>{'\uD83E\uDE99'} {coins}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  level: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F39C12',
  },
  xp: {
    fontSize: 12,
    color: '#95A5A6',
  },
  coinBadge: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F39C12',
  },
});
