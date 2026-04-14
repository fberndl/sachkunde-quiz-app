# Changelog

## 2026-04-14

### Added
- ESLint + Prettier Konfiguration
- GitHub Actions CI Pipeline (Lint + Build)
- README mit Badges
- Webpack Code-Splitting (Vendor-Chunk)
- In-App Kaufdialog im Shop (ersetzt Alert.alert)
- Absturz-Schutz bei leeren Fragen-Filtern

### Fixed
- Shop: Klick auf Items funktionierte nicht auf Mobile Web (Alert.alert Bug)
- Crossword: Absturz bei leerem Puzzle
- Hangman: Absturz bei leerer Wortliste
- Quiz: Absturz wenn keine Fragen zum Filter passen
- ConfettiOverlay: Stale Closure in useEffect
- Farbkontrast zu niedrig bei gesperrten/deaktivierten Elementen

### Improved
- Tastatur-Buttons in Hangman/Kreuzwortraetsel vergroessert (28px -> 36px)
- Schriftgroessen fuer Kinder erhoeht (min. 12px statt 9-11px)
- Farbkontrast verbessert (#BDC3C7 -> #7F8C8D)
- Planet-Bilder von PNG zu JPG konvertiert (2.5MB -> 136KB)
- 27+ unbenutzte Bilder entfernt
- Android-Build-Artefakte aus Git entfernt
- Alte HTML-Backup und Temp-Dateien entfernt

### Removed
- Ranking-Tab deaktiviert (bis zum naechsten Quiz)
- Leaderboard XP auf 0 zurueckgesetzt
