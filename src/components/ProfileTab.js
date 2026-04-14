import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { STARTER_AVATARS, UNLOCKABLE_AVATARS, getAvatarById } from '../data/avatars';

export default function ProfileTab({ activeAvatar, ownedAvatars, playerLevel, onSelectAvatar }) {
  const owned = new Set(ownedAvatars);

  const renderAvatar = (avatar) => {
    const isOwned = owned.has(avatar.id);
    const isActive = activeAvatar === avatar.id;

    return (
      <TouchableOpacity
        key={avatar.id}
        style={[styles.avatarCell, isActive && styles.activeCell]}
        onPress={() => isOwned && onSelectAvatar(avatar.id)}
        disabled={!isOwned}
        activeOpacity={0.7}
      >
        <Text style={[styles.emoji, !isOwned && styles.locked]}>{avatar.emoji}</Text>
        <Text style={[styles.label, !isOwned && styles.lockedLabel]} numberOfLines={1}>
          {avatar.name}
        </Text>
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      <Text style={styles.sectionTitle}>Deine Avatare</Text>
      <View style={styles.row}>
        {STARTER_AVATARS.map(renderAvatar)}
      </View>
      <View style={styles.row}>
        {UNLOCKABLE_AVATARS.filter(a => owned.has(a.id)).map(renderAvatar)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  avatarCell: {
    width: 72,
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCell: { borderColor: '#F39C12', backgroundColor: 'rgba(243, 156, 18, 0.08)' },
  emoji: { fontSize: 32 },
  locked: { opacity: 0.3 },
  label: { fontSize: 10, color: '#2C3E50', marginTop: 4, textAlign: 'center' },
  lockedLabel: { color: '#CCC' },
  activeDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#F39C12',
    position: 'absolute', top: 4, right: 4,
  },
});
