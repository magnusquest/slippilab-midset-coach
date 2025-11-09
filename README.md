# SlippiLabs: MidSet Coach

An extension of [SlippiLabs](https://slippi.gg) that adds AI-powered game review and live coaching for Super Smash Bros. Melee players.

## Overview

MidSet Coach enhances SlippiLabs with two core AI-powered features to help players improve their gameplay:

1. **AI-Assisted Game Review** - Review your replays with structured notes and optional AI-guided Socratic questioning
2. **Coach Mode** - Get real-time voice coaching during matches with context from your previous games

## Features

### AI-Assisted Game Review

- **Structured Review Notes**: Attach notes to any replay with four fields:
  - What went well
  - What went wrong
  - Key learnings
  - Matchup notes
- **Socratic Review Mode**: Optional AI-guided reflection using ChatGPT to help you discover insights
- **Local Storage**: All review data stored client-side in IndexedDB

### Coach Mode

- **Pre-Game Preparation**:

  - Select your matchup (e.g., Fox vs. Falco)
  - AI loads context from your last 10 games (configurable)
  - Chat with AI to develop a gameplan

- **Live Coaching**:

  - Voice-enabled sessions using OpenAI's Realtime API
  - Push-to-talk during gameplay
  - Real-time tactical feedback and encouragement

- **Post-Game Integration**:
  - Seamlessly load the replay into SlippiLabs
  - Review what happened
  - Repeat the cycle: review � coach � play

## Architecture

- **Local-First**: All data stays on your machine (IndexedDB + localStorage)
- **Privacy-First**: You provide your own OpenAI API key
- **Client-Side Only**: No data sent to any servers except OpenAI
- **Modern Stack**: Built with SolidJS, TypeScript, and Vite

### AI Integration

- **Chat API** (gpt-4-turbo): For Socratic review and pre-game coaching
- **Realtime API** (gpt-4o-realtime-preview): For live voice coaching during gameplay

## Getting Started

### Prerequisites

- An OpenAI API key with access to:
  - Chat Completions API
  - Realtime API (for voice coaching)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Setup**: Add your OpenAI API key in Settings
2. **Review Games**: Open any replay and add review notes (manual or AI-assisted)
3. **Coach Mode**: Navigate to Coach, select your matchup, and start a session

## Credits

- **SlippiLabs**: Original project by Frank Borden
- **MidSet Coach Extension**: AI-powered review and coaching features
- **Slippi**: The replay and netplay system for Super Smash Bros. Melee

## License

MIT
