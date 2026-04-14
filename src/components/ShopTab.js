import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { UNLOCKABLE_AVATARS } from '../data/avatars';
import { THEMES } from '../data/themes';

export default function ShopTab({ coins, playerLevel, ownedAvatars, ownedThemes, onBuyAvatar, onBuyTheme }) {
  const ownedAv = new Set(ownedAvatars);
  const ownedTh = new Set(ownedThemes);
  const [dialog, setDialog] = useState(null);

  const handleBuy = (item, type) => {
    if (type === 'avatar' && ownedAv.has(item.id)) return;
    if (type === 'theme' && ownedTh.has(item.id)) return;

    const gate = item.levelGate || 0;
    if (playerLevel < gate) {
      setDialog({ title: 'Gesperrt', message: `Ab Level ${gate} verfügbar!`, buttons: [{ text: 'OK' }] });
      return;
    }

    if (coins < item.price) {
      setDialog({ title: 'Zu wenig Münzen', message: `Du brauchst ${item.price} Münzen, hast aber nur ${coins}.`, buttons: [{ text: 'OK' }] });
      return;
    }

    setDialog({
      title: `${item.name} kaufen?`,
      message: `${item.price} Münzen ausgeben?`,
      buttons: [
        { text: 'Nein', style: 'cancel' },
        { text: 'Ja!', onPress: () => type === 'avatar' ? onBuyAvatar(item) : onBuyTheme(item) },
      ],
    });
  };

  const renderItem = (item, type) => {
    const isOwned = type === 'avatar' ? ownedAv.has(item.id) : ownedTh.has(item.id);
    const gate = item.levelGate || 0;
    const isLocked = playerLevel < gate;
    const canAfford = coins >= (item.price || 0);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.item, isOwned && styles.ownedItem]}
        onPress={() => !isOwned && handleBuy(item, type)}
        disabled={isOwned}
        activeOpacity={0.7}
      >
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {isOwned ? (
            <Text style={styles.ownedText}>{'\u2713'} Gekauft</Text>
          ) : isLocked ? (
            <Text style={styles.lockedText}>Ab Level {gate}</Text>
          ) : (
            <Text style={[styles.priceText, !canAfford && styles.cantAfford]}>
              {'\uD83E\uDE99'} {item.price}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.coinBar}>
        <Text style={styles.coinBarText}>{'\uD83E\uDE99'} {coins} Münzen</Text>
      </View>

      <Text style={styles.sectionTitle}>Avatare</Text>
      {UNLOCKABLE_AVATARS.map(a => renderItem(a, 'avatar'))}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Themes</Text>
      {THEMES.filter(t => t.price > 0).map(t => renderItem(t, 'theme'))}

      {dialog && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.dialogBox}>
              <Text style={styles.dialogTitle}>{dialog.title}</Text>
              <Text style={styles.dialogMsg}>{dialog.message}</Text>
              <View style={styles.dialogBtns}>
                {dialog.buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dialogBtn, btn.style !== 'cancel' && styles.dialogBtnPrimary]}
                    onPress={() => { setDialog(null); btn.onPress?.(); }}
                  >
                    <Text style={[styles.dialogBtnTxt, btn.style !== 'cancel' && styles.dialogBtnTxtPrimary]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  coinBar: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  coinBarText: { fontSize: 20, fontWeight: '900', color: '#F39C12' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2C3E50', marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    elevation: 2,
  },
  ownedItem: { borderColor: '#27AE60', backgroundColor: 'rgba(39, 174, 96, 0.04)' },
  itemEmoji: { fontSize: 36, marginRight: 14 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  priceText: { fontSize: 14, fontWeight: '700', color: '#F39C12', marginTop: 2 },
  cantAfford: { color: '#BDC3C7' },
  ownedText: { fontSize: 13, fontWeight: '700', color: '#27AE60', marginTop: 2 },
  lockedText: { fontSize: 13, fontWeight: '600', color: '#BDC3C7', marginTop: 2 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  dialogBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    elevation: 8,
  },
  dialogTitle: { fontSize: 20, fontWeight: '900', color: '#2C3E50', textAlign: 'center', marginBottom: 8 },
  dialogMsg: { fontSize: 15, color: '#7F8C8D', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  dialogBtns: { flexDirection: 'row', gap: 10 },
  dialogBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  dialogBtnPrimary: { backgroundColor: '#C0392B' },
  dialogBtnTxt: { fontSize: 16, fontWeight: '800', color: '#7F8C8D' },
  dialogBtnTxtPrimary: { color: '#FFFFFF' },
});
