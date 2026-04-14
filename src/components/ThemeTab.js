import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { THEMES } from '../data/themes';

export default function ThemeTab({ activeTheme, ownedThemes, onSelectTheme }) {
  const owned = new Set(ownedThemes);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Themes</Text>
      {THEMES.map(theme => {
        const isOwned = owned.has(theme.id);
        const isActive = activeTheme === theme.id;
        if (!isOwned) return null;

        return (
          <TouchableOpacity
            key={theme.id}
            style={[styles.themeCard, isActive && styles.activeCard]}
            onPress={() => onSelectTheme(theme.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.preview, {
              backgroundColor: theme.colors.bgPrimary,
              borderColor: theme.colors.accent,
            }]}>
              <View style={[styles.previewBtn, { backgroundColor: theme.colors.buttonBg }]}>
                <Text style={{ color: theme.colors.buttonText, fontSize: 10, fontWeight: '700' }}>Button</Text>
              </View>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 9 }}>Card</Text>
              </View>
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeName}>{theme.emoji} {theme.name}</Text>
              {isActive && <Text style={styles.activeLabel}>{'\u2713'} Aktiv</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: '900', color: '#2C3E50', textAlign: 'center', marginBottom: 16 },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    elevation: 2,
  },
  activeCard: { borderColor: '#F39C12' },
  preview: {
    width: 70,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  previewBtn: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  previewCard: { borderRadius: 4, padding: 4, borderWidth: 1 },
  themeInfo: { flex: 1, marginLeft: 12 },
  themeName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  activeLabel: { fontSize: 13, fontWeight: '700', color: '#27AE60', marginTop: 2 },
});
