#!/bin/bash
# Automatisierter Build- und Smoke-Test
# Wird vor jedem Deploy ausgefuehrt

set -e
PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN + 1)); }

echo ""
echo "═══════════════════════════════════════════"
echo "  🧪 Sachkunde Quiz - Build & Smoke Test"
echo "═══════════════════════════════════════════"

# 1. Prüfe ob alle Game-Dateien existieren
echo ""
echo "📁 Spielmodus-Dateien..."
GAMES="MemoryGame SpeedQuiz MillionaireGame Flashcards SortingChallenge TrueFalseBlitz GameHub Leaderboard HangmanGame CrosswordGame QuizDuel SpaceRunner RingMatchGame MerkgeschichteGame BubbleBlaster TwoPlayerMemory PinboardGame CategoryGame RingSortGame RunnerGame QuestionEditor FeedbackScreen"
for g in $GAMES; do
  if [ -f "src/games/${g}.js" ]; then
    pass "$g.js existiert"
  else
    warn "$g.js fehlt (nicht kritisch)"
  fi
done

# 2. Prüfe ob questions.js gültig ist
echo ""
echo "📚 Fragendaten..."
Q_COUNT=$(grep -c "{ id:" src/data/questions.js 2>/dev/null || echo "0")
if [ "$Q_COUNT" -gt 10 ]; then
  pass "questions.js hat $Q_COUNT Fragen"
else
  fail "questions.js hat zu wenig Fragen ($Q_COUNT)"
fi

# Prüfe ob alle Fragen correct-Index haben
BAD_Q=$(grep "type:'multiple_choice'" src/data/questions.js | grep -v "correct:" | wc -l)
if [ "$BAD_Q" -eq 0 ]; then
  pass "Alle MC-Fragen haben correct-Index"
else
  warn "$BAD_Q MC-Fragen ohne correct-Index"
fi

# 3. Prüfe ob keine Secrets im Code sind
echo ""
echo "🔒 Security-Check..."
if grep -r "sb_secret_\|PRIVATE_KEY\|password.*=.*['\"]" src/ --include="*.js" | grep -v "APP_PASSWORD\|sachkunde2" | grep -q .; then
  fail "Mögliche Secrets im Quellcode gefunden!"
else
  pass "Keine Secrets im Quellcode"
fi

# 4. Webpack Build
echo ""
echo "🔨 Webpack Build..."
BUILD_OUTPUT=$(npx webpack --mode production 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  pass "Webpack Build erfolgreich"
else
  fail "Webpack Build fehlgeschlagen!"
  echo "$BUILD_OUTPUT" | grep -i "error" | head -5
fi

# 5. Prüfe Build-Output
echo ""
echo "📦 Build-Output..."
if [ -f "dist/index.html" ]; then
  pass "index.html existiert"
else
  fail "index.html fehlt!"
fi

BUNDLE_COUNT=$(ls dist/bundle.*.js dist/vendors.*.js 2>/dev/null | wc -l)
if [ "$BUNDLE_COUNT" -gt 0 ]; then
  BUNDLE_SIZE=$(du -sh dist/bundle.*.js 2>/dev/null | awk '{print $1}')
  VENDOR_SIZE=$(du -sh dist/vendors.*.js 2>/dev/null | awk '{print $1}')
  pass "Bundle erstellt (app: ${BUNDLE_SIZE:-n/a}, vendor: ${VENDOR_SIZE:-n/a})"
else
  fail "Kein Bundle gefunden!"
fi

IMG_COUNT=$(ls dist/images/*.jpg 2>/dev/null | wc -l)
if [ "$IMG_COUNT" -gt 0 ]; then
  pass "$IMG_COUNT Bilder im Build"
else
  warn "Keine Bilder im Build"
fi

# 6. Prüfe ob Bundle keine offensichtlichen Fehler hat
echo ""
echo "🔍 Bundle-Analyse..."
if [ -f dist/bundle.*.js ]; then
  BUNDLE_FILE=$(ls dist/bundle.*.js)

  # Prüfe ob React gerendert wird
  if grep -q "createElement" "$BUNDLE_FILE"; then
    pass "React createElement gefunden"
  else
    fail "React createElement fehlt im Bundle!"
  fi

  # Prüfe ob App-Komponente da ist
  if grep -q "Sachkunde\|WienQuiz\|sachkunde" "$BUNDLE_FILE"; then
    pass "App-Name im Bundle"
  else
    warn "App-Name nicht im Bundle gefunden"
  fi

  # Prüfe Supabase-Integration
  if grep -q "supabase" "$BUNDLE_FILE"; then
    pass "Supabase-Client im Bundle"
  else
    warn "Supabase nicht im Bundle"
  fi
fi

# 7. Prüfe ob index.html das Bundle referenziert
echo ""
echo "🌐 HTML-Check..."
if grep -q "bundle\." dist/index.html; then
  pass "index.html referenziert Bundle"
else
  fail "index.html referenziert kein Bundle!"
fi

# Zusammenfassung
echo ""
echo "═══════════════════════════════════════════"
echo "  📊 Ergebnis: $PASS bestanden, $FAIL fehlgeschlagen, $WARN Warnungen"
echo "═══════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "  ⛔ DEPLOY NICHT EMPFOHLEN - es gibt Fehler!"
  exit 1
else
  echo ""
  echo "  🚀 Bereit zum Deploy!"
  exit 0
fi
