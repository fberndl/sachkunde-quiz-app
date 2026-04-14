import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { fetchGameContent } from '../services/supabase';

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

const screenWidth = Dimensions.get('window').width;

// ---------------------------------------------------------------------------
// Puzzle definitions
// Each puzzle: { title, rows, cols, grid (2D), clues: { across, down } }
// grid cell: null = black, { letter, number? } = white cell
// ---------------------------------------------------------------------------

// Wort-Pool für automatische Kreuzworträtsel-Generierung
const WORD_POOL = [
  { word: 'DONAU', clue: 'Der große Fluss durch Wien' },
  { word: 'WIEN', clue: 'Bundeshauptstadt Österreichs' },
  { word: 'RING', clue: 'Die ___straße ist 4 km lang' },
  { word: 'OPER', clue: 'Die Staats___ am Opernring' },
  { word: 'PRATER', clue: 'Berühmter Vergnügungspark' },
  { word: 'RATHAUS', clue: 'Amtssitz des Bürgermeisters' },
  { word: 'INNERE', clue: 'Der 1. Bezirk heißt ___ Stadt' },
  { word: 'WALZER', clue: 'Wiener ___ – berühmter Tanz' },
  { word: 'BEZIRKE', clue: 'Wien hat 23 ___' },
  { word: 'STEPHANSDOM', clue: 'Wahrzeichen im 1. Bezirk' },
  { word: 'PARLAMENT', clue: 'Dort werden Gesetze beschlossen' },
  { word: 'HOFBURG', clue: 'Ehemalige Kaiserresidenz am Ring' },
  { word: 'FAVORITEN', clue: 'Der 10. Bezirk' },
  { word: 'SONNE', clue: 'Unser Stern im Zentrum' },
  { word: 'MOND', clue: 'Umkreist die Erde' },
  { word: 'MARS', clue: 'Der rote Planet' },
  { word: 'SATURN', clue: 'Planet mit Ringen' },
  { word: 'JUPITER', clue: 'Der größte Planet' },
  { word: 'VENUS', clue: 'Der heißeste Planet' },
  { word: 'MERKUR', clue: 'Kleinster Planet, nah an der Sonne' },
  { word: 'NEPTUN', clue: 'Am weitesten von der Sonne' },
  { word: 'STERN', clue: 'Die Sonne ist ein ___' },
  { word: 'PLANET', clue: 'Mars ist ein ___' },
  { word: 'GALAXIE', clue: 'Eine riesige Ansammlung von Sternen' },
  { word: 'URKNALL', clue: 'Der Anfang des Universums' },
  { word: 'RIESENRAD', clue: 'Wahrzeichen im Prater' },
  { word: 'LEGENDE', clue: 'Erklärt Kartenzeichen auf einer Karte' },
  { word: 'NORDEN', clue: 'Oben auf der Karte ist ___' },
  { word: 'DOM', clue: 'Kurz für Stephans___' },
  { word: 'ERDE', clue: 'Unser Heimatplanet' },
  { word: 'TURM', clue: 'Der Stephansdom hat einen hohen ___' },
  { word: 'STRAUSS', clue: 'Johann ___ – der Walzerkönig' },
  { word: 'KANAL', clue: 'Der Donau___ trennt Bezirke' },
];

// Crossword-Generator: platziert Wörter automatisch mit korrekten Kreuzungen
function generateCrossword(poolSize, wordPool) {
  const words = wordPool || WORD_POOL;
  const SIZE = 12;
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const pool = [...words].sort(() => Math.random() - 0.5).slice(0, poolSize || 20);
  // Sortiere längste zuerst
  pool.sort((a, b) => b.word.length - a.word.length);

  const placed = [];

  function fits(word, row, col, dir) {
    let hasCrossing = false;
    for (let i = 0; i < word.length; i++) {
      const r = dir === 'across' ? row : row + i;
      const c = dir === 'across' ? col + i : col;
      if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return false;
      const cell = grid[r][c];
      if (cell) {
        if (cell !== word[i]) return false;
        hasCrossing = true;
      } else {
        // Leere Zelle: prüfe ob Nachbarn in paralleler Richtung belegt sind
        // Das würde zwei Wörter nebeneinander in gleicher Richtung erzeugen
        if (dir === 'across') {
          // Oben und unten müssen leer sein (außer es ist eine Kreuzung mit down-Wort)
          if (grid[r - 1]?.[c]) return false;
          if (grid[r + 1]?.[c]) return false;
        } else {
          // Links und rechts müssen leer sein (außer es ist eine Kreuzung mit across-Wort)
          if (grid[r]?.[c - 1]) return false;
          if (grid[r]?.[c + 1]) return false;
        }
      }
    }
    // Vor und nach dem Wort muss leer sein
    if (dir === 'across') {
      if (col > 0 && grid[row][col - 1]) return false;
      if (col + word.length < SIZE && grid[row][col + word.length]) return false;
    } else {
      if (row > 0 && grid[row - 1]?.[col]) return false;
      if (row + word.length < SIZE && grid[row + word.length]?.[col]) return false;
    }
    return placed.length === 0 || hasCrossing;
  }

  function place(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
      const r = dir === 'across' ? row : row + i;
      const c = dir === 'across' ? col + i : col;
      grid[r][c] = word[i];
    }
  }

  function findBestPlacement(word) {
    let best = null;
    let bestScore = -1;
    // Versuche jede Zelle im Grid als Kreuzungspunkt
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!grid[r][c]) continue;
        const letter = grid[r][c];
        for (let i = 0; i < word.length; i++) {
          if (word[i] !== letter) continue;
          // Versuch across: Wort bei (r, c-i)
          const ac = c - i;
          if (ac >= 0 && fits(word, r, ac, 'across')) {
            // Zähle Kreuzungen
            let crosses = 0;
            for (let j = 0; j < word.length; j++) {
              if (grid[r][ac + j]) crosses++;
            }
            if (crosses > bestScore) { bestScore = crosses; best = { row: r, col: ac, dir: 'across' }; }
          }
          // Versuch down: Wort bei (r-i, c)
          const dr = r - i;
          if (dr >= 0 && fits(word, dr, c, 'down')) {
            let crosses = 0;
            for (let j = 0; j < word.length; j++) {
              if (grid[dr + j]?.[c]) crosses++;
            }
            if (crosses > bestScore) { bestScore = crosses; best = { row: dr, col: c, dir: 'down' }; }
          }
        }
      }
    }
    return best;
  }

  // Erstes Wort in die Mitte
  if (pool.length > 0) {
    const first = pool[0];
    const startCol = Math.max(0, Math.floor((SIZE - first.word.length) / 2));
    place(first.word, 1, startCol, 'across');
    placed.push({ ...first, row: 1, col: startCol, dir: 'across' });
  }

  // Restliche Wörter platzieren
  for (let wi = 1; wi < pool.length; wi++) {
    const entry = pool[wi];
    const pos = findBestPlacement(entry.word);
    if (pos) {
      place(entry.word, pos.row, pos.col, pos.dir);
      placed.push({ ...entry, ...pos });
    }
  }

  if (placed.length < 4) return null;

  // Grid auf tatsächliche Größe zuschneiden
  let minR = SIZE, maxR = 0, minC = SIZE, maxC = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c]) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
    }
  }
  // Offset alle Wörter
  placed.forEach(w => { w.row -= minR; w.col -= minC; });
  const finalRows = maxR - minR + 1;
  const finalCols = maxC - minC + 1;

  // Nummern vergeben
  const numberMap = {};
  let num = 1;
  placed.sort((a, b) => a.row - b.row || a.col - b.col);
  placed.forEach(w => {
    const key = `${w.row},${w.col}`;
    if (!numberMap[key]) numberMap[key] = num++;
    w.number = numberMap[key];
  });

  return { title: 'Kreuzworträtsel', rows: finalRows, cols: finalCols, words: placed };
}

// Generiere 3 Puzzles
function makePuzzles(wordPool) {
  const words = wordPool || WORD_POOL;
  const puzzles = [];
  for (let i = 0; i < 10; i++) { // Versuche bis zu 10 mal
    const p = generateCrossword(18, words);
    if (p && p.words.length >= 5) {
      p.title = `Rätsel ${puzzles.length + 1}`;
      puzzles.push(buildPuzzle(p));
      if (puzzles.length >= 3) break;
    }
  }
  return puzzles.length > 0 ? puzzles : [buildPuzzle(generateCrossword(10, words) || { title: 'Rätsel', rows: 12, cols: 12, words: [] })];
}

function buildPuzzle({ title, rows, cols, words }) {
  // Build empty grid
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = null; // black by default
    }
  }
  // Place words
  words.forEach((w) => {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (r < rows && c < cols) {
        if (!grid[r][c]) {
          grid[r][c] = { letter: w.word[i] };
        }
        if (i === 0) {
          grid[r][c].number = w.number;
        }
      }
    }
  });

  const clues = {
    across: words.filter((w) => w.dir === 'across').sort((a, b) => a.number - b.number),
    down: words.filter((w) => w.dir === 'down').sort((a, b) => a.number - b.number),
  };

  return { title, rows, cols, grid, clues, words };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Y', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

export default function CrosswordGame({ onBack, onXpEarned, semester }) {
  const [puzzles, setPuzzles] = useState(() => makePuzzles());
  const [loading, setLoading] = useState(true);
  const [puzzleIdx, setPuzzleIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbItems = await fetchGameContent('crossword', semester);
        if (!cancelled && dbItems && dbItems.length > 0) {
          const wordPool = dbItems.map(item => ({
            word: item.data.word,
            clue: item.data.clue,
          }));
          const newPuzzles = makePuzzles(wordPool);
          setPuzzles(newPuzzles);
          setPuzzleIdx(0);
        }
      } catch (e) {
        console.warn('Crossword DB load error, using fallback:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [semester]);

  const puzzle = puzzles[puzzleIdx];
  if (!puzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark, textAlign: 'center' }}>Keine Wörter verfügbar</Text>
          <TouchableOpacity onPress={onBack} style={{ marginTop: 16, padding: 14, backgroundColor: COLORS.blue, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const { rows, cols, grid, clues, words } = puzzle;

  // User input: 2D array of strings ('' = empty)
  const emptyInput = useCallback(
    () =>
      Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (grid[r][c] ? '' : null))
      ),
    [rows, cols, grid]
  );

  const [userInput, setUserInput] = useState(emptyInput);
  const [activeCell, setActiveCell] = useState(null); // { row, col }
  const [direction, setDirection] = useState('across');
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const xpAwardedRef = useRef(false);

  // Total fillable cells & filled count
  const totalCells = useMemo(() => {
    let count = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (grid[r][c]) count++;
    return count;
  }, [grid, rows, cols]);

  const filledCells = useMemo(() => {
    let count = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (userInput[r] && userInput[r][c]) count++;
    return count;
  }, [userInput, rows, cols]);

  const correctCells = useMemo(() => {
    let count = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (grid[r][c] && userInput[r][c] === grid[r][c].letter) count++;
    return count;
  }, [userInput, grid, rows, cols]);

  const progress = totalCells > 0 ? Math.round((correctCells / totalCells) * 100) : 0;

  // Cell sizing
  const gridPadding = 16;
  const cellSize = Math.floor((screenWidth - gridPadding * 2) / cols);
  const fontSize = cellSize > 30 ? 16 : 12;
  const numFontSize = cellSize > 30 ? 8 : 6;

  // Find which word a cell belongs to, to highlight the whole word
  const activeWord = useMemo(() => {
    if (!activeCell) return [];
    const { row, col } = activeCell;
    const w = words.find((wd) => {
      if (wd.dir !== direction) return false;
      for (let i = 0; i < wd.word.length; i++) {
        const wr = wd.dir === 'across' ? wd.row : wd.row + i;
        const wc = wd.dir === 'across' ? wd.col + i : wd.col;
        if (wr === row && wc === col) return true;
      }
      return false;
    });
    if (!w) return [];
    const cells = [];
    for (let i = 0; i < w.word.length; i++) {
      cells.push({
        row: w.dir === 'across' ? w.row : w.row + i,
        col: w.dir === 'across' ? w.col + i : w.col,
      });
    }
    return cells;
  }, [activeCell, direction, words]);

  const isInActiveWord = useCallback(
    (r, c) => activeWord.some((cell) => cell.row === r && cell.col === c),
    [activeWord]
  );

  const handleCellPress = useCallback(
    (r, c) => {
      if (!grid[r][c]) return;
      if (activeCell && activeCell.row === r && activeCell.col === c) {
        setDirection((d) => (d === 'across' ? 'down' : 'across'));
      } else {
        setActiveCell({ row: r, col: c });
      }
      setChecked(false);
    },
    [activeCell, grid]
  );

  const moveToNextCell = useCallback(
    (r, c) => {
      const nr = direction === 'down' ? r + 1 : r;
      const nc = direction === 'across' ? c + 1 : c;
      if (nr < rows && nc < cols && grid[nr] && grid[nr][nc]) {
        setActiveCell({ row: nr, col: nc });
      }
    },
    [direction, rows, cols, grid]
  );

  const moveToPrevCell = useCallback(
    (r, c) => {
      const nr = direction === 'down' ? r - 1 : r;
      const nc = direction === 'across' ? c - 1 : c;
      if (nr >= 0 && nc >= 0 && grid[nr] && grid[nr][nc]) {
        setActiveCell({ row: nr, col: nc });
      }
    },
    [direction, grid]
  );

  const handleKeyPress = useCallback(
    (key) => {
      if (!activeCell) return;
      const { row, col } = activeCell;
      if (key === '⌫') {
        setUserInput((prev) => {
          const next = prev.map((r) => [...r]);
          if (next[row][col]) {
            next[row][col] = '';
          } else {
            // Move back and delete
            const pr = direction === 'down' ? row - 1 : row;
            const pc = direction === 'across' ? col - 1 : col;
            if (pr >= 0 && pc >= 0 && grid[pr] && grid[pr][pc]) {
              next[pr][pc] = '';
              setActiveCell({ row: pr, col: pc });
            }
          }
          return next;
        });
        setChecked(false);
        return;
      }
      setUserInput((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = key;
        return next;
      });
      moveToNextCell(row, col);
      setChecked(false);
    },
    [activeCell, direction, grid, moveToNextCell]
  );

  const handleCheck = useCallback(() => {
    setChecked(true);
  }, []);

  const handleSolve = useCallback(() => {
    const filled = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => (grid[r][c] ? grid[r][c].letter : null))
    );
    setUserInput(filled);
    setSolved(true);
    setChecked(true);
  }, [grid, rows, cols]);

  const handleReset = useCallback(() => {
    setUserInput(emptyInput());
    setActiveCell(null);
    setChecked(false);
    setSolved(false);
    xpAwardedRef.current = false;
  }, [emptyInput]);

  const handleNextPuzzle = useCallback(() => {
    const next = (puzzleIdx + 1) % puzzles.length;
    setPuzzleIdx(next);
    const p = puzzles[next];
    setUserInput(
      Array.from({ length: p.rows }, (_, r) =>
        Array.from({ length: p.cols }, (_, c) => (p.grid[r][c] ? '' : null))
      )
    );
    setActiveCell(null);
    setDirection('across');
    setChecked(false);
    setSolved(false);
    xpAwardedRef.current = false;
  }, [puzzleIdx, puzzles]);

  const getCellBg = useCallback(
    (r, c) => {
      const cell = grid[r][c];
      if (!cell) return COLORS.dark;
      if (checked && userInput[r][c]) {
        if (userInput[r][c] === cell.letter) return '#d5f5e3';
        return '#fadbd8';
      }
      if (activeCell && activeCell.row === r && activeCell.col === c) return '#aed6f1';
      if (isInActiveWord(r, c)) return '#d6eaf8';
      return COLORS.white;
    },
    [grid, checked, userInput, activeCell, isInActiveWord]
  );

  const getCellTextColor = useCallback(
    (r, c) => {
      if (checked && userInput[r][c]) {
        if (userInput[r][c] === grid[r][c].letter) return COLORS.green;
        return COLORS.red;
      }
      return COLORS.dark;
    },
    [checked, userInput, grid]
  );

  const handleCluePress = useCallback(
    (word) => {
      setActiveCell({ row: word.row, col: word.col });
      setDirection(word.dir);
      setChecked(false);
    },
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Kreuzworträtsel</Text>
        <View style={styles.backBtn} />
      </View>

      {loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={{ marginTop: 8, color: COLORS.gray }}>Lade Wörter...</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Puzzle title & progress */}
        <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% gelöst</Text>
        </View>

        {/* Grid */}
        <View style={[styles.gridContainer, { width: cellSize * cols + 2 }]}>
          {Array.from({ length: rows }).map((_, r) => (
            <View key={r} style={styles.gridRow}>
              {Array.from({ length: cols }).map((_, c) => {
                const cell = grid[r][c];
                const isBlack = !cell;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={isBlack ? 1 : 0.6}
                    onPress={() => handleCellPress(r, c)}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getCellBg(r, c),
                      },
                    ]}
                  >
                    {cell && cell.number ? (
                      <Text style={[styles.cellNumber, { fontSize: numFontSize }]}>
                        {cell.number}
                      </Text>
                    ) : null}
                    {!isBlack && userInput[r][c] ? (
                      <Text
                        style={[
                          styles.cellLetter,
                          { fontSize, color: getCellTextColor(r, c) },
                        ]}
                      >
                        {userInput[r][c]}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Direction indicator */}
        <View style={styles.directionRow}>
          <TouchableOpacity
            onPress={() => setDirection('across')}
            style={[
              styles.directionBtn,
              direction === 'across' && styles.directionBtnActive,
            ]}
          >
            <Text
              style={[
                styles.directionText,
                direction === 'across' && styles.directionTextActive,
              ]}
            >
              → Waagerecht
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDirection('down')}
            style={[
              styles.directionBtn,
              direction === 'down' && styles.directionBtnActive,
            ]}
          >
            <Text
              style={[
                styles.directionText,
                direction === 'down' && styles.directionTextActive,
              ]}
            >
              ↓ Senkrecht
            </Text>
          </TouchableOpacity>
        </View>

        {/* Keyboard */}
        <View style={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <View key={ri} style={styles.keyboardRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  style={[styles.key, key === '⌫' && styles.keyBackspace]}
                >
                  <Text style={[styles.keyText, key === '⌫' && styles.keyTextBackspace]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleCheck} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Prüfen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSolve}
            style={[styles.actionBtn, styles.actionBtnGold]}
          >
            <Text style={styles.actionBtnText}>Lösung</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.actionBtn, styles.actionBtnGray]}
          >
            <Text style={styles.actionBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Clues */}
        <View style={styles.cluesContainer}>
          <Text style={styles.cluesSectionTitle}>Waagerecht</Text>
          {clues.across.map((w) => (
            <TouchableOpacity key={`a${w.number}`} onPress={() => handleCluePress(w)}>
              <Text style={styles.clueText}>
                <Text style={styles.clueNumber}>{w.number}. </Text>
                {w.clue}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.cluesSectionTitle, { marginTop: 12 }]}>Senkrecht</Text>
          {clues.down.map((w) => (
            <TouchableOpacity key={`d${w.number}`} onPress={() => handleCluePress(w)}>
              <Text style={styles.clueText}>
                <Text style={styles.clueNumber}>{w.number}. </Text>
                {w.clue}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next puzzle */}
        <TouchableOpacity onPress={handleNextPuzzle} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>
            Nächstes Rätsel ({((puzzleIdx + 1) % puzzles.length) + 1}/{puzzles.length})
          </Text>
        </TouchableOpacity>

        {solved && (
          <View style={styles.solvedBanner}>
            <Text style={styles.solvedText}>Lösung angezeigt!</Text>
          </View>
        )}

        {progress === 100 && !solved && (() => {
          const xpAmount = correctCells === totalCells ? 30 : 15;
          if (!xpAwardedRef.current) {
            xpAwardedRef.current = true;
            if (onXpEarned) onXpEarned(xpAmount, 'crossword', { stars: 3 });
          }
          return (
            <View style={[styles.solvedBanner, { backgroundColor: COLORS.green }]}>
              <Text style={styles.solvedText}>Perfekt gelöst!</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
                +{xpAmount} XP verdient!
              </Text>
            </View>
          );
        })()}

        {checked && progress > 0 && progress < 100 && !solved && (() => {
          const xpAmount = 15;
          if (!xpAwardedRef.current && correctCells > 0) {
            xpAwardedRef.current = true;
            const pctVal = totalCells > 0 ? Math.round((correctCells / totalCells) * 100) : 0;
            const starsVal = pctVal >= 90 ? 3 : pctVal >= 60 ? 2 : pctVal >= 30 ? 1 : 0;
            if (onXpEarned) onXpEarned(xpAmount, 'crossword', { stars: starsVal });
          }
          return correctCells > 0 ? (
            <View style={[styles.solvedBanner, { backgroundColor: COLORS.blue }]}>
              <Text style={styles.solvedText}>{correctCells}/{totalCells} richtig!</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#F39C12', textAlign: 'center', marginTop: 8 }}>
                +{xpAmount} XP verdient!
              </Text>
            </View>
          ) : null;
        })()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.dark,
  },
  backBtn: {
    width: 70,
  },
  backText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  puzzleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: COLORS.green,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
    width: 70,
    textAlign: 'right',
  },
  gridContainer: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.dark,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
    color: COLORS.dark,
    fontWeight: '700',
  },
  cellLetter: {
    fontWeight: '700',
    textAlign: 'center',
  },
  directionRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 6,
    gap: 8,
  },
  directionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#e8e8e8',
  },
  directionBtnActive: {
    backgroundColor: COLORS.blue,
  },
  directionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  directionTextActive: {
    color: COLORS.white,
  },
  keyboard: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  key: {
    minWidth: 36,
    height: 42,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    paddingHorizontal: 2,
  },
  keyBackspace: {
    minWidth: 44,
    backgroundColor: '#f0f0f0',
  },
  keyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  keyTextBackspace: {
    fontSize: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.blue,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnGold: {
    backgroundColor: COLORS.gold,
  },
  actionBtnGray: {
    backgroundColor: COLORS.gray,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  cluesContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  cluesSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    paddingBottom: 2,
  },
  clueText: {
    fontSize: 13,
    color: COLORS.dark,
    paddingVertical: 3,
    lineHeight: 18,
  },
  clueNumber: {
    fontWeight: '700',
    color: COLORS.blue,
  },
  nextBtn: {
    backgroundColor: COLORS.dark,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 4,
  },
  nextBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  solvedBanner: {
    marginTop: 10,
    backgroundColor: COLORS.gold,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  solvedText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
});
