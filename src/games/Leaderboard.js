import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import { getLeaderboard, isConfigured } from '../services/supabase';
import { getLevelInfo } from './GameHub';
import AvatarDisplay from '../components/AvatarDisplay';

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
};

const MEDALS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];

export default function Leaderboard({ onBack, playerName, onSetName, currentAvatar }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState(playerName || '');
  const [showNamePrompt, setShowNamePrompt] = useState(!playerName);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    loadScores();
    // Auto-refresh alle 10 Sekunden
    const interval = setInterval(loadScores, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadScores = async () => {
    setLoading(true);
    const data = await getLeaderboard();
    setScores(data);
    setLoading(false);
  };

  const handleSaveName = () => {
    const name = nameInput.trim();
    if (name.length >= 2) {
      onSetName(name);
      setShowNamePrompt(false);
    }
  };

  if (!isConfigured()) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity onPress={onBack} style={st.backBtn}>
            <Text style={st.backTxt}>{'\u2190'} Zurück</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{'\uD83C\uDFC6'}</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.dark, textAlign: 'center' }}>
            Leaderboard kommt bald!
          </Text>
          <Text style={{ fontSize: 14, color: C.gray, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Das Online-Leaderboard wird gerade eingerichtet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={st.header}>
          <TouchableOpacity onPress={onBack} style={st.backBtn}>
            <Text style={st.backTxt}>{'\u2190'} Zurück</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={loadScores} style={st.refreshBtn}>
            <Text style={st.refreshTxt}>{'\uD83D\uDD04'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={st.title}>{'\uD83C\uDFC6'} Ranking</Text>
        <Text style={st.subtitle}>Wer hat die meisten XP gesammelt?</Text>

        {/* Name Setup */}
        {showNamePrompt && (
          <View style={st.nameCard}>
            <Text style={st.nameLabel}>Dein Spielername:</Text>
            <TextInput
              style={st.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Name eingeben..."
              placeholderTextColor="#CCC"
              maxLength={20}
              autoFocus
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity
              style={[st.nameBtn, nameInput.trim().length < 2 && { opacity: 0.4 }]}
              onPress={handleSaveName}
              disabled={nameInput.trim().length < 2}
            >
              <Text style={st.nameBtnTxt}>Speichern</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Player Badge */}
        {!showNamePrompt && playerName && (
          <TouchableOpacity style={st.playerBadge} onPress={() => setShowNamePrompt(true)}>
            <Text style={st.playerName}>{'\uD83D\uDC64'} {playerName}</Text>
            <Text style={st.playerEdit}>Ändern</Text>
          </TouchableOpacity>
        )}

        {/* Scores */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={C.red} />
            <Text style={{ color: C.gray, marginTop: 10 }}>Lade Ranking...</Text>
          </View>
        ) : scores.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 40 }}>{'\uD83D\uDE36'}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark, marginTop: 8 }}>
              Noch keine Spieler!
            </Text>
            <Text style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>
              Spiele ein Quiz um XP zu sammeln.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
            {scores.map((entry, i) => {
              const isMe = playerName && entry.name === playerName;
              return (
                <View key={entry.id || i} style={[st.row, isMe && st.rowMe, i === 0 && st.rowFirst]}>
                  <View style={[st.rank, i === 0 && { backgroundColor: C.gold }]}>
                    <Text style={[st.rankTxt, i === 0 && { color: C.white }]}>
                      {i < 3 ? MEDALS[i] : `${i + 1}.`}
                    </Text>
                  </View>
                  <AvatarDisplay avatarId={isMe ? currentAvatar : 'emoji_star'} size={28} />
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={[st.entryName, isMe && { color: C.red }]}>
                      {entry.name} {isMe ? '(Du) ' : ''}
                      <Text style={st.rankLabel}>({getLevelInfo(entry.score).emoji}{getLevelInfo(entry.score).name})</Text>
                    </Text>
                  </View>
                  <View style={st.xpBadge}>
                    <Text style={[st.xpVal, i === 0 && { color: C.gold }]}>{entry.score}</Text>
                    <Text style={st.xpLbl}>XP</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.light },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 0 },
  backBtn: { paddingVertical: 8, paddingRight: 16 },
  backTxt: { fontSize: 16, fontWeight: '700', color: C.blue },
  refreshBtn: { padding: 8 },
  refreshTxt: { fontSize: 20 },
  title: { fontSize: 28, fontWeight: '900', color: C.dark, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.gray, textAlign: 'center', marginBottom: 14 },

  nameCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 16, marginHorizontal: 16,
    marginBottom: 12, borderWidth: 2, borderColor: '#F0F0F0', elevation: 3,
  },
  nameLabel: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 8 },
  nameInput: {
    backgroundColor: '#F8F8F8', borderRadius: 12, padding: 14, fontSize: 16,
    fontWeight: '700', color: C.dark, borderWidth: 2, borderColor: '#E8E8E8',
    marginBottom: 10,
  },
  nameBtn: { backgroundColor: C.red, borderRadius: 12, padding: 12, alignItems: 'center' },
  nameBtnTxt: { fontSize: 16, fontWeight: '800', color: C.white },

  playerBadge: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 12, padding: 12, marginHorizontal: 16,
    marginBottom: 10, borderWidth: 2, borderColor: '#F0F0F0',
  },
  playerName: { fontSize: 15, fontWeight: '800', color: C.dark },
  playerEdit: { fontSize: 12, fontWeight: '600', color: C.blue },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 2,
    borderColor: '#F0F0F0', elevation: 2,
  },
  rowMe: { borderColor: C.gold, backgroundColor: '#FFFDF5' },
  rowFirst: { borderColor: C.gold, borderWidth: 2 },
  rank: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankTxt: { fontSize: 16, fontWeight: '900' },
  entryName: { fontSize: 15, fontWeight: '800', color: C.dark },
  rankLabel: { fontSize: 12, fontWeight: '600', color: C.gray },
  xpBadge: { alignItems: 'center', marginLeft: 10 },
  xpVal: { fontSize: 22, fontWeight: '900', color: C.red },
  xpLbl: { fontSize: 11, fontWeight: '700', color: C.gray },
});
