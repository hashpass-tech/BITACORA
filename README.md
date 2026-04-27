# Bitácora

<div align="center">

**Your AI Research Partner for Live Sessions**

Every session, researched — in real time, with receipts.

Bitácora listens, fact-checks, and researches alongside you while speakers are still talking.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-black)](https://expo.dev/)

</div>

---

## 📖 Overview

Bitácora is the **first live AI research partner** for knowledge-dense events. Unlike AI meeting tools that just record, transcribe, and summarize—Bitácora **researches alongside you in real-time**, verifying claims against primary sources, detecting contradictions across sessions, and continuing research long after the speaker finishes.

Perfect for: conferences, earnings calls, press briefings, academic lectures, court hearings, regulatory panels.

### What Makes Bitácora Different

| Traditional AI Meeting Tools | Bitácora |
|---|---|
| Records + summarizes **after** the talk | **Researches claims** DURING the talk |
| Enhances your notes | Generates the notes **you couldn't** |
| Post-call action items | **In-session agentic research** |
| AI workspace for uploaded docs | **Synthesizes live streams + cross-session memory** |

## ✨ The Wedge: Live Fact-Checking, In Real-Time

Every AI meeting tool summarizes the past. Bitácora verifies the present.

As a speaker makes claims ("X regulation requires Y"), Bitácora:
- **Verifies** against primary sources within seconds
- **Flags contradictions** with previous speakers (cross-session memory)
- **Compares cross-jurisdictions** (Peruvian SBS vs. Brazilian CVM vs. Mexican CNBV)
- **Drafts follow-up questions** for you to ask
- **Continues researching** after the session ends via Managed Agents

## 🚀 Demo Moment

```
┌─────────────────────────────────────────────────────┐
│ ✅ PRIMARY SOURCE VERIFIED                           │
│ SBS Circular G-140-2024, Art. 7                     │
│ [View original text → ]                              │
│                                                      │
│ ⚠️ CONTRADICTION DETECTED                             │
│ Earlier speaker said: "no formal custody requirement"│
│                                                      │
│ 🔍 CROSS-JURISDICTION                                 │
│ Brazilian CVM Resolution 175 differs in:          │
│ • Custody threshold: BRL 50M vs PEN 5M               │
│ • Reporting frequency: monthly vs quarterly         │
│                                                      │
│ 💭 SUGGESTED QUESTION                               │
│ "How does this interact with cross-border custody" │
│ under the LatAm Sandbox framework?"                  │
│                                                      │
│ 📚 RESEARCH CONTINUES...                              │
│ Managed Agent investigating industry responses     │
│ (ready in 2 minutes)                                │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Framework**: React Native 0.81.5
- **Platform**: Expo SDK 54
- **AI**: Anthropic Claude (Opus 4.7) + Managed Agents
- **Navigation**: Expo Router 6.0
- **Styling**: TailwindCSS + NativeWind 4.1
- **Language**: TypeScript

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Expo Go app (for testing) or Expo development build

### Setup

```bash
# Clone the repository
git clone https://github.com/bitacora/bitacora.git
cd bitacora

# Install dependencies
pnpm install

# Start the development server
pnpm start
```

### Running the App

- **iOS**: Press `i` or open via Expo Go
- **Android**: Press `a` or open via Expo Go  
- **Web**: Press `w` or open http://localhost:8084

## 📁 Project Structure

```
BITACORA/
├── app/                  # Expo Router pages
│   ├── (tabs)/          # Tab navigation screens
│   │   ├── index.tsx    # Home
│   │   ├── record.tsx   # Recording + Live Research
│   │   ├── memory.tsx  # Memory + Cross-Session
│   │   └── profile.tsx  # Profile
│   ├── index.tsx        # Auth screen
│   ├── _layout.tsx      # Root layout
│   ├── session/[id].tsx # Session detail
│   └── live-session.tsx # Live research panel
├── components/          # Reusable components
│   ├── Button.tsx
│   ├── CreateBitacoraModal.tsx
│   └── ModeBadge.tsx
├── lib/                # Utilities
│   └── store.ts        # State management
├── assets/             # Images, fonts
└── global.css          # Global styles
```

## 🎯 Current Status

**Stage: Hackathon MVP (v0.1.0)**

### ✅ Live Research Features
- Real-time claim extraction from audio
- Primary source verification (web search)
- Cross-session contradiction detection
- Cross-jurisdiction comparison framework
- Managed Agent research thread continuation

### 📋 Roadmap
- Regulatory knowledge base (50+ LatAm norms)
- Full transcription with speaker diarization
- Export to structured brief (PDF)
- Multi-language support
- Offline mode

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌍 Languages

- [English](README.md) (this file)
- [Español](README.es.md)

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📚 Docs

The monorepo and setup guides now live under [docs/](docs/README.md).

## 🧭 Versioning

This repo uses `@edcalderon/versioning` for release tracking, changelog
generation, and env sync.

```bash
pnpm version:status
pnpm version:patch
pnpm env:sync
pnpm release:patch
pnpm release:minor
pnpm release:major
```

`pnpm release` is the default patch release wrapper. It bumps the version,
syncs `version.production.json`, and updates `CHANGELOG.md` through the
versioning CLI.

The AWS production CodePipeline is deploy-only. It builds and deploys the
current GitHub revision from `main` as the Expo web app at
`bitacora.hashpass.tech`; it does not perform a second release bump.

## 🔒 Security

For security concerns, please email security@bitacora.app

## 📞 Support

- 🐛 Report bugs via [GitHub Issues](https://github.com/bitacora/bitacora/issues)
- 💬 Join our Discord
- 📧 Email: support@bitacora.app

---

<div align="center">

**Built at BSL Peru 2026**

Every AI tool summarizes the past. Bitácora verifies the present.

</div>
