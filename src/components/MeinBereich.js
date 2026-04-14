import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import ProfileTab from './ProfileTab';
import ShopTab from './ShopTab';
import AlbumTab from './AlbumTab';
import ThemeTab from './ThemeTab';

const TABS = [
  { id: 'profile', label: 'Profil',  emoji: '\uD83D\uDC64' },
  { id: 'shop',    label: 'Shop',    emoji: '\uD83D\uDED2' },
  { id: 'album',   label: 'Album',   emoji: '\uD83C\uDFC5' },
  { id: 'themes',  label: 'Themes',  emoji: '\uD83C\uDFA8' },
];

export default function MeinBereich({
  visible, onClose,
  playerName, playerLevel, coins,
  activeAvatar, ownedAvatars,
  activeTheme, ownedThemes,
  unlockedBadgeIds,
  onSelectAvatar, onBuyAvatar, onBuyTheme, onSelectTheme,
}) {
  const [activeTab, setActiveTab] = useState('profile');

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mein Bereich</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'profile' && (
            <ProfileTab
              activeAvatar={activeAvatar}
              ownedAvatars={ownedAvatars}
              playerLevel={playerLevel}
              onSelectAvatar={onSelectAvatar}
            />
          )}
          {activeTab === 'shop' && (
            <ShopTab
              coins={coins}
              playerLevel={playerLevel}
              ownedAvatars={ownedAvatars}
              ownedThemes={ownedThemes}
              onBuyAvatar={onBuyAvatar}
              onBuyTheme={onBuyTheme}
            />
          )}
          {activeTab === 'album' && (
            <AlbumTab unlockedBadgeIds={unlockedBadgeIds} />
          )}
          {activeTab === 'themes' && (
            <ThemeTab
              activeTheme={activeTheme}
              ownedThemes={ownedThemes}
              onSelectTheme={onSelectTheme}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#2C3E50' },
  closeBtn: { padding: 8 },
  closeTxt: { fontSize: 22, color: '#95A5A6' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#F39C12' },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 12, fontWeight: '600', color: '#7F8C8D', marginTop: 2 },
  tabLabelActive: { color: '#F39C12', fontWeight: '800' },
  content: { flex: 1 },
});
