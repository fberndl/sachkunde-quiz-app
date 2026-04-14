import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  TextInput,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  red: '#C0392B',
  gold: '#F39C12',
  blue: '#2980B9',
  green: '#27AE60',
  light: '#FFF9F5',
  white: '#FFFFFF',
  dark: '#2C3E50',
  gray: '#95A5A6',
};

// Color groups for district number badges
const DISTRICT_COLORS = {
  1: '#8E44AD',   // Innere Stadt - purple
  2: '#2980B9',   // Leopoldstadt - blue
  3: '#27AE60',   // Landstrasse - green
  4: '#27AE60',   // Wieden - green
  5: '#E74C3C',   // Margareten - red
  6: '#E74C3C',   // Mariahilf - red
  7: '#E74C3C',   // Neubau - red
  8: '#F39C12',   // Josefstadt - gold
  9: '#F39C12',   // Alsergrund - gold
  10: '#D35400',  // Favoriten - orange
  11: '#D35400',  // Simmering - orange
  12: '#16A085',  // Meidling - teal
  13: '#16A085',  // Hietzing - teal
  14: '#16A085',  // Penzing - teal
  15: '#16A085',  // Rudolfsheim - teal
  16: '#2C3E50',  // Ottakring - dark
  17: '#2C3E50',  // Hernals - dark
  18: '#8E44AD',  // Waehring - purple
  19: '#8E44AD',  // Doebling - purple
  20: '#2980B9',  // Brigittenau - blue
  21: '#2980B9',  // Floridsdorf - blue
  22: '#C0392B',  // Donaustadt - red
  23: '#C0392B',  // Liesing - red
};

const ALL_DISTRICTS = [
  'Innere Stadt', 'Leopoldstadt', 'Landstraße', 'Wieden', 'Margareten',
  'Mariahilf', 'Neubau', 'Josefstadt', 'Alsergrund', 'Favoriten',
  'Simmering', 'Meidling', 'Hietzing', 'Penzing', 'Rudolfsheim-Fünfhaus',
  'Ottakring', 'Hernals', 'Währing', 'Döbling', 'Brigittenau',
  'Floridsdorf', 'Donaustadt', 'Liesing',
];

const STORY_PARAGRAPHS = [
  {
    text: 'Einmal (1. Bezirk) lebte in der inneren Stadt ({Innere Stadt}) ein Herr namens Leopold ({Leopoldstadt}) der Zweite (2. Bezirk).',
    blanks: [
      { district: 'Innere Stadt', number: 1 },
      { district: 'Leopoldstadt', number: 2 },
    ],
  },
  {
    text: 'Jeden 3. Tag (3. Bezirk) wanderte er über die {Landstraße} vier Stunden lang (4. Bezirk) nach {Wieden}.',
    blanks: [
      { district: 'Landstraße', number: 3 },
      { district: 'Wieden', number: 4 },
    ],
  },
  {
    text: 'Dort traf er um 5 Uhr (5. Bezirk) bei {Margareten}, seiner Freundin ein. Sie musste bis 6 Uhr (6. Bezirk) ihrer Schwester Maria helfen ({Mariahilf}), doch danach konnten die beiden Verlobten endlich ihre Wohnung im 7. Stock (7. Bezirk) eines {Neubau}s besichtigen, wo sie nach ihrer Hochzeit wohnen wollten.',
    blanks: [
      { district: 'Margareten', number: 5 },
      { district: 'Mariahilf', number: 6 },
      { district: 'Neubau', number: 7 },
    ],
  },
  {
    text: 'Vor acht Tagen (8. Bezirk) hatten sie die Wohnung von einem Herrn Josef aus der Stadt ({Josefstadt}) gekauft. Sie lag im 9. Bezirk, im {Alsergrund}. Diese gehörte zu den zehn (10. Bezirk) {Favoriten} unter den Wohnungen, die Leopold und Margarete besichtigt hatten.',
    blanks: [
      { district: 'Josefstadt', number: 8 },
      { district: 'Alsergrund', number: 9 },
      { district: 'Favoriten', number: 10 },
    ],
  },
  {
    text: 'Als endlich Hochzeit gefeiert wurde, schenkte Leopold seiner Braut elf (11. Bezirk) schimmernde Ringe ({Simmering}). Unter den vielen Gästen waren auch seine Freunde aus China mit ihren 3 Söhnen: dem 12-jährigen Mei Ling (12. Bezirk {Meidling}), dem 13-jährigen Hi Tsing (13. Bezirk {Hietzing}) und dem 14-jährigen Pen Tsing (14. Bezirk {Penzing}). Auch Rudolf Heim, der 5 Häuser besaß ({Rudolfsheim-Fünfhaus}), war unter den Gästen (15. Bezirk).',
    blanks: [
      { district: 'Simmering', number: 11 },
      { district: 'Meidling', number: 12 },
      { district: 'Hietzing', number: 13 },
      { district: 'Penzing', number: 14 },
      { district: 'Rudolfsheim-Fünfhaus', number: 15 },
    ],
  },
  {
    text: 'Um 16 Uhr (16. Bezirk) trafen die Gäste in der {Ottakring}er Brauerei zur Festtafel ein. Den 17 Feiernden (17. Bezirk) servierte Herr Nals ({Hernals}) die köstlichsten Speisen.',
    blanks: [
      { district: 'Ottakring', number: 16 },
      { district: 'Hernals', number: 17 },
    ],
  },
  {
    text: 'Das Brautpaar hatte 18 Monate (18. Bezirk) gespart, um genug {Währing} für ihr Hochzeitsfest auf der Bank zu haben.',
    blanks: [
      { district: 'Währing', number: 18 },
    ],
  },
  {
    text: 'Leopold und Margarete waren schon lange ein Paar - seit sie einander mit 19 Jahren (19. Bezirk) in {Döbling} getroffen hatten. Ihre gemeinsamen Freunde, die 20-jährige (20. Bezirk) Brigitte aus der Au ({Brigittenau}) und der 21-jährige (21. Bezirk) Flori aus dem Dorf ({Floridsdorf}) hatten sie miteinander bekannt gemacht.',
    blanks: [
      { district: 'Döbling', number: 19 },
      { district: 'Brigittenau', number: 20 },
      { district: 'Floridsdorf', number: 21 },
    ],
  },
  {
    text: 'Sie verliebten sich schon nach 22 Tagen (22. Bezirk) ineinander, als sie mit einem Schiff auf der Donau aus der Stadt ({Donaustadt}) schipperten.',
    blanks: [
      { district: 'Donaustadt', number: 22 },
    ],
  },
  {
    text: 'Nun lebten sie glücklich und zufrieden zusammen und betrieben 23 Jahre lang (23. Bezirk) eine gemeinsame Leasing-Firma ({Liesing}). Und wenn sie nicht gestorben sind, dann wandern sie noch heute durch alle Bezirke Wiens!',
    blanks: [
      { district: 'Liesing', number: 23 },
    ],
  },
];

const QUIZ_TIME_PER_QUESTION = 8;

// Helpers

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fuzzyMatch(input, target) {
  const normalize = (s) =>
    s.toLowerCase()
      .trim()
      .replace(/[ß]/g, 'ss')
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/[-\s]+/g, ' ')
      .replace(/[^a-z0-9 ]/g, '');
  return normalize(input) === normalize(target);
}

function generateQuizOptions(correctIndex) {
  const options = [correctIndex];
  while (options.length < 4) {
    const rand = Math.floor(Math.random() * 23);
    if (!options.includes(rand)) {
      options.push(rand);
    }
  }
  return shuffleArray(options);
}

function renderStoryText(text) {
  // Replace {DistrictName} with highlighted text
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const openIdx = remaining.indexOf('{');
    if (openIdx === -1) {
      parts.push(
        <Text key={key++} style={styles.storyText}>
          {remaining}
        </Text>,
      );
      break;
    }
    if (openIdx > 0) {
      parts.push(
        <Text key={key++} style={styles.storyText}>
          {remaining.substring(0, openIdx)}
        </Text>,
      );
    }
    const closeIdx = remaining.indexOf('}', openIdx);
    if (closeIdx === -1) {
      parts.push(
        <Text key={key++} style={styles.storyText}>
          {remaining}
        </Text>,
      );
      break;
    }
    const districtName = remaining.substring(openIdx + 1, closeIdx);
    // Find the district number
    const districtIdx = ALL_DISTRICTS.indexOf(districtName);
    const districtNum = districtIdx >= 0 ? districtIdx + 1 : null;
    const color = districtNum ? DISTRICT_COLORS[districtNum] : COLORS.blue;
    parts.push(
      <Text key={key++} style={[styles.storyHighlight, { color }]}>
        {districtName}
        {districtNum ? ` (${districtNum}.)` : ''}
      </Text>,
    );
    remaining = remaining.substring(closeIdx + 1);
  }
  return parts;
}

// --- District Number Badge ---
function DistrictBadge({ number, size = 'normal' }) {
  const color = DISTRICT_COLORS[number] || COLORS.blue;
  const badgeSize = size === 'large' ? 48 : 28;
  const fontSize = size === 'large' ? 20 : 13;
  return (
    <View
      style={[
        styles.districtBadge,
        {
          backgroundColor: color,
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
        },
      ]}>
      <Text style={[styles.districtBadgeText, { fontSize }]}>{number}.</Text>
    </View>
  );
}

// --- Star Rating ---
function StarRating({ score, total }) {
  const pct = total > 0 ? score / total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0;
  const starChars = [];
  for (let i = 0; i < 3; i++) {
    starChars.push(i < stars ? '\u2B50' : '\u2606');
  }
  return (
    <View style={styles.starRow}>
      {starChars.map((s, i) => (
        <Text key={i} style={styles.starChar}>
          {s}
        </Text>
      ))}
    </View>
  );
}

// =====================================================
// MODE SELECTION SCREEN
// =====================================================

function ModeSelection({ onSelectMode }) {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 120,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const modes = [
    {
      id: 'read',
      emoji: '\uD83D\uDCD6',
      title: 'Geschichte lesen',
      desc: 'Lies das Märchen und lerne alle 23 Bezirke kennen!',
      color: COLORS.blue,
    },
    {
      id: 'fill',
      emoji: '\u270D\uFE0F',
      title: 'Lückentext',
      desc: 'Fülle die fehlenden Bezirksnamen in die Geschichte ein!',
      color: COLORS.gold,
    },
    {
      id: 'quiz',
      emoji: '\u26A1',
      title: 'Bezirke-Schnelltest',
      desc: 'Welcher Bezirk hat welche Nummer? 23 Fragen gegen die Zeit!',
      color: COLORS.red,
    },
  ];

  return (
    <ScrollView
      style={styles.modeScrollContainer}
      contentContainerStyle={styles.modeContainer}>
      <Text style={styles.modeTitle}>Bezirke Merkgeschichte</Text>
      <Text style={styles.modeSubtitle}>
        Das Märchen von Leopold und Margarete
      </Text>
      <Text style={styles.modeDesc}>
        Eine Geschichte, in der alle 23 Wiener Bezirke vorkommen. Wähle einen
        Modus:
      </Text>

      {modes.map((mode, i) => (
        <Animated.View
          key={mode.id}
          style={{
            opacity: anims[i],
            transform: [
              {
                translateY: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          }}>
          <TouchableOpacity
            style={[styles.modeCard, { borderLeftColor: mode.color }]}
            onPress={() => onSelectMode(mode.id)}
            activeOpacity={0.8}>
            <Text style={styles.modeCardEmoji}>{mode.emoji}</Text>
            <View style={styles.modeCardContent}>
              <Text style={styles.modeCardTitle}>{mode.title}</Text>
              <Text style={styles.modeCardDesc}>{mode.desc}</Text>
            </View>
            <View
              style={[styles.modeCardArrow, { backgroundColor: mode.color }]}>
              <Text style={styles.modeCardArrowText}>{'\u25B6'}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

// =====================================================
// MODE 1: READ STORY
// =====================================================

function ReadStoryMode({ onSwitchToFill, onBack }) {
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scrollAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geschichte lesen</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.storyScroll}
        contentContainerStyle={styles.storyScrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: scrollAnim }}>
          <Text style={styles.storyTitle}>
            Das Märchen von Leopold und Margarete
          </Text>
          <Text style={styles.storyIntro}>
            In dieser Geschichte verstecken sich alle 23 Wiener Bezirke. Die
            Bezirksnamen sind farbig hervorgehoben.
          </Text>

          {STORY_PARAGRAPHS.map((paragraph, pIdx) => (
            <View key={pIdx} style={styles.storyParagraph}>
              <View style={styles.storyBadgeRow}>
                {paragraph.blanks.map((blank) => (
                  <DistrictBadge key={blank.number} number={blank.number} />
                ))}
              </View>
              <Text style={styles.storyParagraphText}>
                {renderStoryText(paragraph.text)}
              </Text>
            </View>
          ))}

          <View style={styles.storyEndBox}>
            <Text style={styles.storyEndEmoji}>{'\uD83C\uDFB0'}</Text>
            <Text style={styles.storyEndText}>
              Geschafft! Du hast alle 23 Bezirke kennengelernt.
            </Text>
            <TouchableOpacity
              style={styles.practiceButton}
              onPress={onSwitchToFill}
              activeOpacity={0.8}>
              <Text style={styles.practiceButtonText}>Jetzt üben!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// MODE 2: FILL IN THE BLANKS
// =====================================================

function FillBlankMode({ onBack, onFinish, onXpEarned }) {
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [finished, setFinished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const xpAwardedRef = useRef(false);

  const paragraph = STORY_PARAGRAPHS[currentParagraph];
  const totalBlanks = STORY_PARAGRAPHS.reduce(
    (sum, p) => sum + p.blanks.length,
    0,
  );

  const animateTransition = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleInputChange = useCallback(
    (blankKey, value) => {
      setAnswers((prev) => ({ ...prev, [blankKey]: value }));
    },
    [],
  );

  const handleSubmitBlank = useCallback(
    (blankKey, district) => {
      if (submitted[blankKey]) return;
      const userAnswer = answers[blankKey] || '';
      if (userAnswer.trim().length === 0) return;
      const isCorrect = fuzzyMatch(userAnswer, district);
      setSubmitted((prev) => ({
        ...prev,
        [blankKey]: { correct: isCorrect, answer: district },
      }));
      setTotalAttempts((t) => t + 1);
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
      }
    },
    [answers, submitted],
  );

  const allBlanksSubmitted =
    paragraph &&
    paragraph.blanks.every((blank) => {
      const key = `${currentParagraph}-${blank.number}`;
      return submitted[key] !== undefined;
    });

  const handleNext = useCallback(() => {
    if (currentParagraph + 1 >= STORY_PARAGRAPHS.length) {
      setFinished(true);
    } else {
      setCurrentParagraph((p) => p + 1);
      animateTransition();
    }
  }, [currentParagraph, animateTransition]);

  // Render paragraph text with blanks inline
  const renderFillText = useCallback(() => {
    if (!paragraph) return null;
    const parts = [];
    let remaining = paragraph.text;
    let key = 0;
    let blankIdx = 0;

    while (remaining.length > 0) {
      const openIdx = remaining.indexOf('{');
      if (openIdx === -1) {
        parts.push(
          <Text key={key++} style={styles.fillText}>
            {remaining}
          </Text>,
        );
        break;
      }
      if (openIdx > 0) {
        parts.push(
          <Text key={key++} style={styles.fillText}>
            {remaining.substring(0, openIdx)}
          </Text>,
        );
      }
      const closeIdx = remaining.indexOf('}', openIdx);
      if (closeIdx === -1) {
        parts.push(
          <Text key={key++} style={styles.fillText}>
            {remaining}
          </Text>,
        );
        break;
      }

      const districtName = remaining.substring(openIdx + 1, closeIdx);
      const blank = paragraph.blanks[blankIdx];
      if (blank) {
        const blankKey = `${currentParagraph}-${blank.number}`;
        const sub = submitted[blankKey];
        const color = DISTRICT_COLORS[blank.number] || COLORS.blue;

        parts.push(
          <View key={key++} style={styles.fillBlankInlineWrap}>
            <View style={styles.fillBlankRow}>
              <DistrictBadge number={blank.number} />
              {sub ? (
                <View
                  style={[
                    styles.fillResultBox,
                    {
                      borderColor: sub.correct ? COLORS.green : COLORS.red,
                      backgroundColor: sub.correct
                        ? COLORS.green + '15'
                        : COLORS.red + '15',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.fillResultText,
                      { color: sub.correct ? COLORS.green : COLORS.red },
                    ]}>
                    {sub.correct
                      ? answers[blankKey]
                      : `${answers[blankKey]} \u2192 ${sub.answer}`}
                  </Text>
                </View>
              ) : (
                <View style={styles.fillInputRow}>
                  <TextInput
                    style={[styles.fillInput, { borderColor: color }]}
                    value={answers[blankKey] || ''}
                    onChangeText={(val) => handleInputChange(blankKey, val)}
                    placeholder={`${blank.number}. Bezirk?`}
                    placeholderTextColor={COLORS.gray}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onSubmitEditing={() =>
                      handleSubmitBlank(blankKey, blank.district)
                    }
                  />
                  <TouchableOpacity
                    style={[styles.fillCheckBtn, { backgroundColor: color }]}
                    onPress={() =>
                      handleSubmitBlank(blankKey, blank.district)
                    }>
                    <Text style={styles.fillCheckBtnText}>{'\u2713'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>,
        );
        blankIdx++;
      }
      remaining = remaining.substring(closeIdx + 1);
    }
    return parts;
  }, [
    paragraph,
    currentParagraph,
    answers,
    submitted,
    handleInputChange,
    handleSubmitBlank,
  ]);

  // Results screen
  if (finished) {
    const xpAmount = correctCount * 3;
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const pctVal = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
      const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
      if (onXpEarned) onXpEarned(xpAmount, 'merkgeschichte', { stars: starsVal });
    }
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.resultContainer}>
          <StarRating score={correctCount} total={totalBlanks} />
          <Text style={styles.resultTitle}>Lückentext geschafft!</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{xpAmount} XP verdient!
          </Text>
          <View style={styles.resultCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Richtig</Text>
              <Text style={[styles.statValue, { color: COLORS.green }]}>
                {correctCount}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Gesamt</Text>
              <Text style={[styles.statValue, { color: COLORS.blue }]}>
                {totalBlanks}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Genauigkeit</Text>
              <Text style={[styles.statValue, { color: COLORS.gold }]}>
                {totalBlanks > 0
                  ? Math.round((correctCount / totalBlanks) * 100)
                  : 0}
                %
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setCurrentParagraph(0);
              setAnswers({});
              setSubmitted({});
              setCorrectCount(0);
              setTotalAttempts(0);
              setFinished(false);
              xpAwardedRef.current = false;
            }}
            activeOpacity={0.7}>
            <Text style={styles.primaryButtonText}>Nochmal spielen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onBack}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Zurück</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Progress calculation
  const completedBlanks = Object.keys(submitted).length;
  const progressPct =
    totalBlanks > 0 ? (completedBlanks / totalBlanks) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lückentext</Text>
        <Text style={styles.headerScore}>
          {correctCount}/{totalBlanks}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      <Text style={styles.paragraphIndicator}>
        Absatz {currentParagraph + 1} von {STORY_PARAGRAPHS.length}
      </Text>

      <ScrollView
        style={styles.fillScroll}
        contentContainerStyle={styles.fillScrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.fillParagraphCard}>{renderFillText()}</View>

          {allBlanksSubmitted && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>
                {currentParagraph + 1 >= STORY_PARAGRAPHS.length
                  ? 'Ergebnis anzeigen'
                  : 'Nächster Absatz \u2192'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// MODE 3: QUICK QUIZ
// =====================================================

function QuickQuizMode({ onBack, onXpEarned }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_PER_QUESTION);
  const [finished, setFinished] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [questionOrder] = useState(() => shuffleArray([...Array(23).keys()]));

  const timerBarAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const questionStartTime = useRef(Date.now());
  const xpAwardedRef = useRef(false);

  const currentDistrictIdx = questionOrder[currentQuestion];

  // Generate options for current question
  useEffect(() => {
    if (finished) return;
    const newOptions = generateQuizOptions(currentDistrictIdx);
    setOptions(newOptions);
  }, [currentQuestion, currentDistrictIdx, finished]);

  // Timer
  useEffect(() => {
    if (finished || showFeedback) return;

    questionStartTime.current = Date.now();
    setTimeLeft(QUIZ_TIME_PER_QUESTION);
    timerBarAnim.setValue(1);

    animRef.current = Animated.timing(timerBarAnim, {
      toValue: 0,
      duration: QUIZ_TIME_PER_QUESTION * 1000,
      useNativeDriver: false,
    });
    animRef.current.start();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleQuizTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }
    };
  }, [currentQuestion, finished, showFeedback]);

  const handleQuizTimeout = useCallback(() => {
    setShowFeedback(true);
    const elapsed = (Date.now() - questionStartTime.current) / 1000;
    setTotalTime((t) => t + elapsed);

    feedbackAnim.setValue(0);
    Animated.timing(feedbackAnim, {
      toValue: -1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setTimeout(() => advanceQuiz(), 1500);
  }, []);

  const advanceQuiz = useCallback(() => {
    if (currentQuestion + 1 >= 23) {
      setFinished(true);
    } else {
      setCurrentQuestion((q) => q + 1);
      setSelected(null);
      setShowFeedback(false);
      feedbackAnim.setValue(0);
    }
  }, [currentQuestion, feedbackAnim]);

  const handleQuizAnswer = useCallback(
    (districtIdx) => {
      if (selected !== null || showFeedback) return;

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }

      setSelected(districtIdx);
      setShowFeedback(true);

      const elapsed = (Date.now() - questionStartTime.current) / 1000;
      setTotalTime((t) => t + elapsed);

      const isCorrect = districtIdx === currentDistrictIdx;

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
      }

      feedbackAnim.setValue(0);
      Animated.timing(feedbackAnim, {
        toValue: isCorrect ? 1 : -1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      setTimeout(() => advanceQuiz(), 1500);
    },
    [selected, showFeedback, currentDistrictIdx, advanceQuiz, feedbackAnim],
  );

  const getQuizOptionStyle = useCallback(
    (districtIdx) => {
      if (!showFeedback) {
        return styles.quizOption;
      }
      if (districtIdx === currentDistrictIdx) {
        return [styles.quizOption, styles.quizOptionCorrect];
      }
      if (districtIdx === selected && districtIdx !== currentDistrictIdx) {
        return [styles.quizOption, styles.quizOptionWrong];
      }
      return [styles.quizOption, styles.quizOptionDimmed];
    },
    [showFeedback, currentDistrictIdx, selected],
  );

  const getQuizOptionTextStyle = useCallback(
    (districtIdx) => {
      if (!showFeedback) {
        return styles.quizOptionText;
      }
      if (districtIdx === currentDistrictIdx) {
        return [styles.quizOptionText, { color: COLORS.green, fontWeight: '700' }];
      }
      if (districtIdx === selected && districtIdx !== currentDistrictIdx) {
        return [styles.quizOptionText, { color: COLORS.red, fontWeight: '700' }];
      }
      return [styles.quizOptionText, { color: COLORS.gray }];
    },
    [showFeedback, currentDistrictIdx, selected],
  );

  // Results screen
  if (finished) {
    const accuracy = Math.round((correctCount / 23) * 100);
    const avgTime = (totalTime / 23).toFixed(1);
    const xpAmount = correctCount * 4;
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true;
      const starsVal = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : accuracy >= 30 ? 1 : 0;
      if (onXpEarned) onXpEarned(xpAmount, 'merkgeschichte', { stars: starsVal });
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <StarRating score={correctCount} total={23} />
          <Text style={styles.resultTitle}>Schnelltest beendet!</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
            +{xpAmount} XP verdient!
          </Text>

          <View style={styles.resultCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Richtig</Text>
              <Text style={[styles.statValue, { color: COLORS.green }]}>
                {correctCount} / 23
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Genauigkeit</Text>
              <Text style={[styles.statValue, { color: COLORS.blue }]}>
                {accuracy}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Durchschnittszeit</Text>
              <Text style={[styles.statValue, { color: COLORS.gold }]}>
                {avgTime}s
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setCurrentQuestion(0);
              setSelected(null);
              setShowFeedback(false);
              setCorrectCount(0);
              setTimeLeft(QUIZ_TIME_PER_QUESTION);
              setTotalTime(0);
              setFinished(false);
              feedbackAnim.setValue(0);
              xpAwardedRef.current = false;
            }}
            activeOpacity={0.7}>
            <Text style={styles.primaryButtonText}>Nochmal spielen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onBack}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Zurück</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const timerBarWidth = timerBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const timerBarColor = timerBarAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [COLORS.red, COLORS.red, COLORS.gold, COLORS.green],
  });

  const feedbackBg = feedbackAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [
      'rgba(192,57,43,0.1)',
      'rgba(0,0,0,0)',
      'rgba(39,174,96,0.1)',
    ],
  });

  const districtColor = DISTRICT_COLORS[currentDistrictIdx + 1] || COLORS.blue;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: feedbackBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schnelltest</Text>
        <Text style={styles.headerScore}>
          {correctCount}/{currentQuestion + (showFeedback ? 1 : 0)}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.quizProgressRow}>
        <Text style={styles.quizProgressText}>
          Frage {currentQuestion + 1} / 23
        </Text>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarContainer}>
        <Animated.View
          style={[
            styles.timerBar,
            { width: timerBarWidth, backgroundColor: timerBarColor },
          ]}
        />
      </View>
      <Text
        style={[styles.timerText, timeLeft <= 3 && { color: COLORS.red }]}>
        {timeLeft}s
      </Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.quizContent}
        showsVerticalScrollIndicator={false}>
        {/* District number prominently */}
        <View style={styles.quizQuestionBox}>
          <Text style={styles.quizQuestionLabel}>Welcher Bezirk ist das?</Text>
          <View
            style={[
              styles.quizNumberCircle,
              { backgroundColor: districtColor },
            ]}>
            <Text style={styles.quizNumberText}>
              {currentDistrictIdx + 1}.
            </Text>
          </View>
          <Text style={styles.quizQuestionHint}>
            {currentDistrictIdx + 1}. Bezirk
          </Text>
        </View>

        {/* 4 Options */}
        <View style={styles.quizOptionsContainer}>
          {options.map((districtIdx, i) => (
            <TouchableOpacity
              key={`${currentQuestion}-${districtIdx}`}
              style={getQuizOptionStyle(districtIdx)}
              onPress={() => handleQuizAnswer(districtIdx)}
              activeOpacity={0.7}
              disabled={showFeedback}>
              <Text style={getQuizOptionTextStyle(districtIdx)}>
                {ALL_DISTRICTS[districtIdx]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <View style={styles.quizFeedbackBox}>
            {selected === currentDistrictIdx ? (
              <Text style={[styles.quizFeedbackText, { color: COLORS.green }]}>
                Richtig!
              </Text>
            ) : (
              <Text style={[styles.quizFeedbackText, { color: COLORS.red }]}>
                {selected === null ? 'Zeit abgelaufen!' : 'Falsch!'}{' '}
                {ALL_DISTRICTS[currentDistrictIdx]}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function MerkgeschichteGame({ onBack, onXpEarned }) {
  const [mode, setMode] = useState(null); // null, 'read', 'fill', 'quiz'

  const handleSelectMode = useCallback((selectedMode) => {
    setMode(selectedMode);
  }, []);

  const handleBackToModes = useCallback(() => {
    setMode(null);
  }, []);

  if (mode === 'read') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ReadStoryMode
          onSwitchToFill={() => setMode('fill')}
          onBack={handleBackToModes}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'fill') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FillBlankMode onBack={handleBackToModes} onXpEarned={onXpEarned} />
      </SafeAreaView>
    );
  }

  if (mode === 'quiz') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <QuickQuizMode onBack={handleBackToModes} onXpEarned={onXpEarned} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
            <Text style={styles.headerBackText}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Merkgeschichte</Text>
          <View style={{ width: 40 }} />
        </View>
        <ModeSelection onSelectMode={handleSelectMode} />
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: COLORS.dark,
  },
  headerBackBtn: {
    padding: 8,
    width: 40,
  },
  headerBackText: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
    width: 40,
    textAlign: 'right',
  },

  // Mode Selection
  modeScrollContainer: {
    flex: 1,
  },
  modeContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  modeDesc: {
    fontSize: 14,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modeCardEmoji: {
    fontSize: 36,
    marginRight: 14,
  },
  modeCardContent: {
    flex: 1,
  },
  modeCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  modeCardDesc: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  modeCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modeCardArrowText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Story Mode (Read)
  storyScroll: {
    flex: 1,
  },
  storyScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  storyIntro: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  storyParagraph: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storyBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  storyParagraphText: {
    fontSize: 16,
    color: COLORS.dark,
    lineHeight: 26,
  },
  storyText: {
    fontSize: 16,
    color: COLORS.dark,
    lineHeight: 26,
  },
  storyHighlight: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 26,
  },
  storyEndBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storyEndEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  storyEndText: {
    fontSize: 15,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
  },
  practiceButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  practiceButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '700',
  },

  // District Badge
  districtBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  districtBadgeText: {
    color: COLORS.white,
    fontWeight: '800',
  },

  // Stars
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starChar: {
    fontSize: 40,
    marginHorizontal: 4,
  },

  // Fill-in-the-blank mode
  fillScroll: {
    flex: 1,
  },
  fillScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  fillParagraphCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fillText: {
    fontSize: 16,
    color: COLORS.dark,
    lineHeight: 26,
  },
  fillBlankInlineWrap: {
    marginVertical: 8,
  },
  fillBlankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  fillInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fillInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: '500',
  },
  fillCheckBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillCheckBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  fillResultBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fillResultText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Progress bar
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 3,
  },
  paragraphIndicator: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },

  // Quiz mode
  quizProgressRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  quizProgressText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  timerBarContainer: {
    height: 8,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timerBar: {
    height: '100%',
    borderRadius: 4,
  },
  timerText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: 4,
    marginBottom: 4,
  },
  quizContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  quizQuestionBox: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  quizQuestionLabel: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 16,
  },
  quizNumberCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  quizNumberText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
  },
  quizQuestionHint: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  quizOptionsContainer: {
    width: '100%',
    gap: 10,
  },
  quizOption: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  quizOptionCorrect: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.green + '15',
  },
  quizOptionWrong: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.red + '15',
  },
  quizOptionDimmed: {
    opacity: 0.5,
  },
  quizOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  quizFeedbackBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    width: '100%',
  },
  quizFeedbackText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Results
  resultContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 24,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.gray + '60',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  secondaryButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
});
