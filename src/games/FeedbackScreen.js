import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Text, View, Animated,
} from 'react-native';
import { submitFeedback } from '../services/supabase';

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
};

const CATEGORIES = [
  { key: 'vorschlag', label: '\u{1F4A1} Vorschlag' },
  { key: 'problem',   label: '\u{1F41B} Problem melden' },
  { key: 'lob',       label: '\u2B50 Lob' },
];

const MIN_CHARS = 10;
const MAX_CHARS = 500;
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const LS_KEY = 'sachkunde_last_feedback';

export default function FeedbackScreen({ onBack, playerName }) {
  const [category, setCategory] = useState('vorschlag');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const checkAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check cooldown on mount and tick every second
  useEffect(() => {
    const tick = () => {
      try {
        const last = localStorage.getItem(LS_KEY);
        if (last) {
          const elapsed = Date.now() - parseInt(last, 10);
          if (elapsed < COOLDOWN_MS) {
            setCooldown(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
          } else {
            setCooldown(0);
          }
        }
      } catch (_) {
        // localStorage unavailable
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Entry fade
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const canSend = message.trim().length >= MIN_CHARS && cooldown === 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    await submitFeedback(playerName || 'Anonym', category, message.trim());
    try {
      localStorage.setItem(LS_KEY, String(Date.now()));
    } catch (_) {}
    setSending(false);
    setSent(true);
    // Success animation
    Animated.sequence([
      Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(checkAnim, { toValue: 1.15, friction: 3, useNativeDriver: true }),
      Animated.timing(checkAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleReset = () => {
    setSent(false);
    setMessage('');
    setCategory('vorschlag');
    checkAnim.setValue(0);
  };

  if (sent) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.successWrap}>
          <Animated.Text style={[st.checkMark, { transform: [{ scale: checkAnim }] }]}>
            {'\u2705'}
          </Animated.Text>
          <Text style={st.successTitle}>Danke f\u00FCr dein Feedback!</Text>
          <Text style={st.successSub}>Wir lesen jede Nachricht und verbessern die App laufend.</Text>
          <TouchableOpacity style={st.btnPrimary} onPress={handleReset}>
            <Text style={st.btnPrimaryTxt}>Weiteres Feedback senden</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.btnSecondary} onPress={onBack}>
            <Text style={st.btnSecondaryTxt}>{'\u2190'} Zur\u00FCck</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={onBack} style={st.backBtn}>
            <Text style={st.backTxt}>{'\u2190'} Zur\u00FCck</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>Feedback & Probleme</Text>
        </View>

        <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
          {/* Category chips */}
          <Text style={st.label}>Kategorie w\u00E4hlen:</Text>
          <View style={st.chipRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[st.chip, category === c.key && st.chipActive]}
                onPress={() => setCategory(c.key)}
              >
                <Text style={[st.chipTxt, category === c.key && st.chipTxtActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message input */}
          <Text style={st.label}>Deine Nachricht:</Text>
          <TextInput
            style={st.input}
            multiline
            numberOfLines={6}
            maxLength={MAX_CHARS}
            placeholder="Schreib uns dein Feedback..."
            placeholderTextColor={C.gray}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          {/* Character counter */}
          <View style={st.counterRow}>
            <Text style={[
              st.counter,
              message.trim().length < MIN_CHARS && message.length > 0 && { color: C.red },
              message.trim().length >= MIN_CHARS && { color: C.green },
            ]}>
              {message.length}/{MAX_CHARS}
            </Text>
            {message.length > 0 && message.trim().length < MIN_CHARS && (
              <Text style={st.counterHint}>Mindestens {MIN_CHARS} Zeichen</Text>
            )}
          </View>

          {/* Cooldown warning */}
          {cooldown > 0 && (
            <View style={st.cooldownBox}>
              <Text style={st.cooldownTxt}>
                Bitte warte noch {cooldown} Sekunden
              </Text>
            </View>
          )}

          {/* Send button */}
          <TouchableOpacity
            style={[st.btnPrimary, !canSend && st.btnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Text style={[st.btnPrimaryTxt, !canSend && { opacity: 0.6 }]}>
              {sending ? 'Wird gesendet...' : 'Senden'}
            </Text>
          </TouchableOpacity>

          {/* Player info */}
          <Text style={st.playerInfo}>
            Gesendet als: {playerName || 'Anonym'}
          </Text>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.light },

  header: {
    backgroundColor: C.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { paddingRight: 12 },
  backTxt: { fontSize: 15, fontWeight: '700', color: C.blue },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.dark },

  content: { padding: 20, paddingBottom: 40 },

  label: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 8, marginTop: 16 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: C.blue,
    backgroundColor: '#EBF5FB',
  },
  chipTxt: { fontSize: 13, fontWeight: '600', color: C.gray },
  chipTxtActive: { color: C.blue, fontWeight: '700' },

  input: {
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: C.dark,
    minHeight: 120,
    lineHeight: 22,
  },

  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  counter: { fontSize: 12, fontWeight: '600', color: C.gray },
  counterHint: { fontSize: 12, color: C.red, fontWeight: '600' },

  cooldownBox: {
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  cooldownTxt: { fontSize: 13, fontWeight: '700', color: '#D4AC0D' },

  btnPrimary: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  btnPrimaryTxt: { fontSize: 16, fontWeight: '800', color: C.white },
  btnDisabled: { backgroundColor: '#BDC3C7' },

  btnSecondary: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnSecondaryTxt: { fontSize: 14, fontWeight: '700', color: C.blue },

  playerInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: C.gray,
    marginTop: 16,
  },

  // Success screen
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  checkMark: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '900', color: C.dark, marginBottom: 8, textAlign: 'center' },
  successSub: { fontSize: 14, color: C.gray, textAlign: 'center', marginBottom: 30 },
});
