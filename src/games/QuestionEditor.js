import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, TextInput, Alert, Platform,
} from 'react-native';
import { saveQuestion } from '../services/supabase';

const C = {
  red: '#C0392B', gold: '#F39C12', blue: '#2980B9', green: '#27AE60',
  light: '#FFF9F5', white: '#FFFFFF', dark: '#2C3E50', gray: '#95A5A6',
};

const EMPTY_QUESTION = {
  topic: '',
  type: 'multiple_choice',
  question: '',
  options: ['', '', '', ''],
  correct: 0,
  explanation: '',
  blanks: [''],
  hint: '',
  grade: 3,
  semester: 'Sommersemester',
};

const GRADES = [1, 2, 3, 4];
const SEMESTERS = ['Wintersemester', 'Sommersemester'];

function TopicBadge({ topic }) {
  return (
    <View style={s.topicBadge}>
      <Text style={s.topicBadgeText}>{topic}</Text>
    </View>
  );
}

function TypeBadge({ type }) {
  const isMC = type === 'multiple_choice';
  return (
    <View style={[s.typeBadge, { backgroundColor: isMC ? C.blue : C.gold }]}>
      <Text style={s.typeBadgeText}>{isMC ? 'MC' : 'Lückentext'}</Text>
    </View>
  );
}

// --- Edit/Add Form ---
function QuestionForm({ initial, allTopics, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_QUESTION,
    ...initial,
    options: initial?.options ? [...initial.options] : ['', '', '', ''],
    blanks: initial?.blanks ? [...initial.blanks] : [''],
  }));
  const [saving, setSaving] = useState(false);
  const [topicInput, setTopicInput] = useState(form.topic);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const isEditing = !!initial?.id;

  const filteredTopics = useMemo(() => {
    if (!topicInput || topicInput.length < 1) return [];
    const lower = topicInput.toLowerCase();
    return allTopics.filter(t => t.toLowerCase().includes(lower) && t.toLowerCase() !== lower);
  }, [topicInput, allTopics]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setOption = (idx, val) => {
    setForm(f => {
      const opts = [...f.options];
      opts[idx] = val;
      return { ...f, options: opts };
    });
  };

  const sanitize = (str, maxLen) =>
    (str || '').replace(/<[^>]*>/g, '').trim().slice(0, maxLen);

  const handleSave = async () => {
    const q = { ...form, topic: topicInput };

    // Sanitize all text inputs
    q.topic = sanitize(q.topic, 50);
    q.question = sanitize(q.question, 500);
    q.explanation = sanitize(q.explanation, 500);
    q.hint = sanitize(q.hint, 200);
    q.options = q.options.map(o => sanitize(o, 200));
    q.blanks = q.blanks.map(b => sanitize(b, 100));

    if (!q.topic) { doAlert('Thema fehlt'); return; }
    if (!q.question) { doAlert('Frage fehlt'); return; }
    if (q.type === 'multiple_choice') {
      if (q.options.some(o => !o)) { doAlert('Alle Antworten ausfüllen'); return; }
    } else {
      if (!q.blanks[0]) { doAlert('Antwort fehlt'); return; }
    }
    setSaving(true);
    const result = await saveQuestion(q);
    setSaving(false);
    if (result) {
      onSave();
    } else {
      doAlert('Fehler beim Speichern');
    }
  };

  const doAlert = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Hinweis', msg);
  };

  return (
    <ScrollView style={s.formScroll} contentContainerStyle={s.formContent}>
      <Text style={s.formTitle}>{isEditing ? 'Frage bearbeiten' : 'Neue Frage'}</Text>

      {/* Topic */}
      <Text style={s.label}>Thema</Text>
      <TextInput
        style={s.input}
        value={topicInput}
        onChangeText={v => { setTopicInput(v); setShowTopicSuggestions(true); }}
        placeholder="z.B. Wien"
        placeholderTextColor={C.gray}
        onBlur={() => setTimeout(() => setShowTopicSuggestions(false), 200)}
      />
      {showTopicSuggestions && filteredTopics.length > 0 && (
        <View style={s.autocompleteList}>
          {filteredTopics.slice(0, 5).map(t => (
            <TouchableOpacity
              key={t}
              style={s.autocompleteItem}
              onPress={() => { setTopicInput(t); setShowTopicSuggestions(false); }}
            >
              <Text style={s.autocompleteText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Grade & Semester */}
      <Text style={s.label}>Klasse</Text>
      <View style={s.typeToggle}>
        {GRADES.map(g => (
          <TouchableOpacity key={g}
            style={[s.typeBtn, form.grade === g && s.typeBtnActive]}
            onPress={() => setField('grade', g)}>
            <Text style={[s.typeBtnText, form.grade === g && s.typeBtnTextActive]}>{g}.</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.label}>Semester</Text>
      <View style={s.typeToggle}>
        {SEMESTERS.map(sem => (
          <TouchableOpacity key={sem}
            style={[s.typeBtn, form.semester === sem && s.typeBtnActive]}
            onPress={() => setField('semester', sem)}>
            <Text style={[s.typeBtnText, form.semester === sem && s.typeBtnTextActive]}>
              {sem === 'Wintersemester' ? 'Winter' : 'Sommer'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type toggle */}
      <Text style={s.label}>Typ</Text>
      <View style={s.typeToggle}>
        <TouchableOpacity
          style={[s.typeBtn, form.type === 'multiple_choice' && s.typeBtnActive]}
          onPress={() => setField('type', 'multiple_choice')}
        >
          <Text style={[s.typeBtnText, form.type === 'multiple_choice' && s.typeBtnTextActive]}>
            Multiple Choice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.typeBtn, form.type === 'fill_blank' && s.typeBtnActive]}
          onPress={() => setField('type', 'fill_blank')}
        >
          <Text style={[s.typeBtnText, form.type === 'fill_blank' && s.typeBtnTextActive]}>
            Lückentext
          </Text>
        </TouchableOpacity>
      </View>

      {/* Question text */}
      <Text style={s.label}>Frage</Text>
      <TextInput
        style={[s.input, s.inputMultiline]}
        value={form.question}
        onChangeText={v => setField('question', v)}
        placeholder="Fragetext eingeben..."
        placeholderTextColor={C.gray}
        multiline
      />

      {/* Type-specific fields */}
      {form.type === 'multiple_choice' ? (
        <>
          <Text style={s.label}>Antworten</Text>
          {form.options.map((opt, i) => (
            <View key={i} style={s.optionRow}>
              <TouchableOpacity
                style={[s.radio, form.correct === i && s.radioActive]}
                onPress={() => setField('correct', i)}
              >
                {form.correct === i && <View style={s.radioDot} />}
              </TouchableOpacity>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={opt}
                onChangeText={v => setOption(i, v)}
                placeholder={`Antwort ${i + 1}`}
                placeholderTextColor={C.gray}
              />
            </View>
          ))}
          <Text style={s.radioHint}>Richtige Antwort antippen</Text>
        </>
      ) : (
        <>
          <Text style={s.label}>Antwort (Lücke)</Text>
          <TextInput
            style={s.input}
            value={form.blanks[0] || ''}
            onChangeText={v => setForm(f => ({ ...f, blanks: [v] }))}
            placeholder="Richtige Antwort"
            placeholderTextColor={C.gray}
          />
          <Text style={s.label}>Hinweis</Text>
          <TextInput
            style={s.input}
            value={form.hint || ''}
            onChangeText={v => setField('hint', v)}
            placeholder="Optionaler Hinweis"
            placeholderTextColor={C.gray}
          />
        </>
      )}

      {/* Explanation */}
      <Text style={s.label}>Erklärung</Text>
      <TextInput
        style={[s.input, s.inputMultiline]}
        value={form.explanation || ''}
        onChangeText={v => setField('explanation', v)}
        placeholder="Erklärung zur Antwort..."
        placeholderTextColor={C.gray}
        multiline
      />

      {/* Buttons */}
      <View style={s.formButtons}>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelBtnText}>Abbrechen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? '...' : 'Speichern'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// --- Main Component ---
export default function QuestionEditor({ onBack, questions, onQuestionsChanged }) {
  const [editing, setEditing] = useState(null); // null = list, object = editing, 'new' = adding
  const [search, setSearch] = useState('');

  const allTopics = useMemo(() => {
    const set = new Set(questions.map(q => q.topic).filter(Boolean));
    return [...set].sort();
  }, [questions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return questions;
    const lower = search.toLowerCase();
    return questions.filter(q =>
      q.question.toLowerCase().includes(lower) ||
      q.topic?.toLowerCase().includes(lower)
    );
  }, [questions, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(q => {
      const t = q.topic || 'Ohne Thema';
      if (!map[t]) map[t] = [];
      map[t].push(q);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleSaved = () => {
    setEditing(null);
    onQuestionsChanged();
  };

  // --- Form view ---
  if (editing !== null) {
    return (
      <SafeAreaView style={s.container}>
        <QuestionForm
          initial={editing === 'new' ? null : editing}
          allTopics={allTopics}
          onSave={handleSaved}
          onCancel={() => setEditing(null)}
        />
      </SafeAreaView>
    );
  }

  // --- List view ---
  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backBtnText}>{'<'} Zurück</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Fragen-Editor</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setEditing('new')}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Suchen..."
          placeholderTextColor={C.gray}
        />
        {search.length > 0 && (
          <TouchableOpacity style={s.clearSearch} onPress={() => setSearch('')}>
            <Text style={s.clearSearchText}>x</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Question count */}
      <Text style={s.countText}>
        {filtered.length} Frage{filtered.length !== 1 ? 'n' : ''}
        {search ? ` gefunden` : ''}
      </Text>

      {/* Grouped list */}
      <ScrollView style={s.list} contentContainerStyle={s.listContent}>
        {grouped.map(([topic, qs]) => (
          <View key={topic} style={s.group}>
            <Text style={s.groupTitle}>{topic}</Text>
            {qs.map(q => (
              <TouchableOpacity
                key={q.id}
                style={s.questionCard}
                onPress={() => setEditing(q)}
                activeOpacity={0.7}
              >
                <View style={s.cardTop}>
                  <TopicBadge topic={q.topic || '?'} />
                  <TypeBadge type={q.type} />
                </View>
                <Text style={s.questionText} numberOfLines={2}>
                  {q.question}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {grouped.length === 0 && (
          <Text style={s.emptyText}>
            {search ? 'Keine Fragen gefunden.' : 'Noch keine Fragen vorhanden.'}
          </Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 16,
    color: C.blue,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.dark,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: C.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.dark,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearSearch: {
    position: 'absolute',
    right: 26,
    top: 20,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    color: C.gray,
    fontSize: 16,
    fontWeight: '700',
  },
  countText: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 13,
    color: C.gray,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  group: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionCard: {
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  topicBadge: {
    backgroundColor: C.dark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  topicBadgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 14,
    color: C.dark,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: C.gray,
    fontSize: 15,
    marginTop: 40,
  },

  // --- Form styles ---
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: C.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.dark,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 4,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeToggle: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: C.white,
  },
  typeBtnActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.dark,
  },
  typeBtnTextActive: {
    color: C.white,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.gray,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: C.green,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.green,
  },
  radioHint: {
    fontSize: 12,
    color: C.gray,
    marginTop: -2,
    marginBottom: 4,
  },
  autocompleteList: {
    backgroundColor: C.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: -2,
    marginBottom: 4,
  },
  autocompleteItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  autocompleteText: {
    fontSize: 14,
    color: C.dark,
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: C.dark,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: C.green,
    alignItems: 'center',
  },
  saveBtnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
