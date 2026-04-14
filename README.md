# Sachkunde Quiz

[![CI](https://github.com/fberndl/sachkunde-quiz-app/actions/workflows/ci.yml/badge.svg)](https://github.com/fberndl/sachkunde-quiz-app/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black)](https://sachkunde-test-2.vercel.app)

Interaktive Lernapp fuer die Volksschule (3. Klasse) -- Sachkunde-Quiz mit 20+ Spielmodi, Gamification und Supabase-Backend.

## Features

- **Quiz-Modus** -- Multiple Choice, Lueckentext, Wahr/Falsch
- **20+ Spielmodi** -- Memory, Hangman, Kreuzwortraetsel, Millionenshow, Speed-Quiz, Space Runner, u.v.m.
- **Gamification** -- XP, Muenzen, Badges, Avatare, Themes, Level-System
- **Themen** -- Wien, Bezirke, Stephansdom, Ringstrasse, Planeten, Karten lesen
- **Supabase-Backend** -- Fragen-DB, Leaderboard, Spielerprofile

## Tech Stack

- React + React Native Web
- Webpack (Code-Splitting)
- Supabase (PostgreSQL + Auth)
- Vercel (Hosting)
- GitHub Actions (CI)

## Entwicklung

```bash
npm install --legacy-peer-deps
npm run web          # Dev-Server auf Port 3000
npm run build        # Produktions-Build
npm run lint         # ESLint
npm run lint:fix     # ESLint Auto-Fix
npm run format       # Prettier
```

## Projektstruktur

```
src/
  games/          # 20+ Spielmodi (Memory, Hangman, Quiz, ...)
  components/     # UI-Komponenten (Shop, Profil, Badges, ...)
  services/       # Supabase, XP, Coins
  data/           # Fragen, Avatare, Badges, Themes
  context/        # ThemeContext
  utils/          # Sound, Shuffle
web/              # HTML-Entry + Web-Bootstrap
```

## Lizenz

Privates Schulprojekt.
