import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BADGE_CATEGORIES, BADGES, TIER_COLORS, getBadgesForCategory } from '../data/badges';

export default function AlbumTab({ unlockedBadgeIds }) {
  const unlocked = new Set(unlockedBadgeIds);
  const totalUnlocked = unlockedBadgeIds.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Sammelalbum</Text>
      <Text style={styles.progress}>{totalUnlocked} / {BADGES.length} Badges gesammelt</Text>

      {BADGE_CATEGORIES.map(cat => {
        const catBadges = getBadgesForCategory(cat.id);
        const catUnlocked = catBadges.filter(b => unlocked.has(b.id)).length;

        return (
          <View key={cat.id} style={styles.category}>
            <View style={styles.catHeader}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catProgress}>{catUnlocked}/{catBadges.length}</Text>
            </View>
            <View style={styles.badgeRow}>
              {catBadges.map(badge => {
                const isUnlocked = unlocked.has(badge.id);
                const tierColor = TIER_COLORS[badge.tier];
                const tierLabel = badge.tier === 'bronze' ? 'Bronze' : badge.tier === 'silver' ? 'Silber' : 'Gold';

                return (
                  <View key={badge.id} style={[
                    styles.badgeCell,
                    { borderColor: isUnlocked ? tierColor : '#DDD' },
                    isUnlocked && { backgroundColor: `${tierColor}15` },
                  ]}>
                    <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeLocked]}>
                      {isUnlocked ? cat.emoji : '\u2753'}
                    </Text>
                    <Text style={[styles.tierLabel, { color: isUnlocked ? tierColor : '#CCC' }]}>
                      {tierLabel}
                    </Text>
                    <Text style={styles.badgeDesc} numberOfLines={2}>
                      {badge.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(catUnlocked / catBadges.length) * 100}%` }]} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '900', color: '#2C3E50', textAlign: 'center' },
  progress: { fontSize: 14, color: '#95A5A6', textAlign: 'center', marginBottom: 20 },
  category: { marginBottom: 20 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catEmoji: { fontSize: 22, marginRight: 8 },
  catName: { fontSize: 16, fontWeight: '800', color: '#2C3E50', flex: 1 },
  catProgress: { fontSize: 14, fontWeight: '700', color: '#95A5A6' },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badgeCell: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#FAFAFA',
    minHeight: 100,
  },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeLocked: { opacity: 0.4 },
  tierLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  badgeDesc: { fontSize: 10, color: '#95A5A6', textAlign: 'center', marginTop: 4 },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F39C12',
    borderRadius: 3,
  },
});
