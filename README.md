# Bitácora

<div align="center">

**Open-Source AI Logbook**

Every session, remembered.

Transform any spoken session into structured, searchable memory. Your second brain for conferences, lectures, and meetings.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-black)](https://expo.dev/)

</div>

---

## 📖 Overview

Bitácora is an AI-powered logbook application built with React Native and Expo. It allows users to record audio sessions, transcribe them, and organize them into searchable memories. Perfect for conferences, lectures, meetings, and any spoken content you want to remember.

## ✨ Features

- **🎙️ Audio Recording** - Record sessions with high-quality audio capture
- **📝 AI Transcription** - Automatic speech-to-text conversion
- **🧠 Memory Organization** - Structure and categorize your sessions
- **🔍 Searchable Archive** - Find any session instantly
- **📱 Cross-Platform** - Works on iOS, Android, and Web
- **🎨 Beautiful UI** - Modern, clean interface with TailwindCSS

## 🚀 Current Status

**Stage: Early Development (v1.0.0)**

### ✅ Completed
- Authentication flow (Email/Google)
- Tab navigation system
- Home screen with session list
- Recording functionality
- Memory management interface
- Profile screen
- Responsive design

### 🚧 In Progress
- AI transcription integration
- Search functionality
- Cloud sync
- Offline mode

### 📋 Planned
- Advanced AI features (summaries, insights)
- Collaboration features
- Export options
- Analytics dashboard

## 🛠️ Tech Stack

- **Framework**: React Native 0.81.5
- **Platform**: Expo SDK 54
- **Navigation**: Expo Router 6.0
- **Styling**: TailwindCSS + NativeWind 4.1
- **Icons**: Lucide React Native
- **Language**: TypeScript

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo Go app (for testing) or Expo development build

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/bitacora.git
cd bitacora

# Install dependencies
npm install

# Start the development server
npx expo start
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
│   │   ├── record.tsx   # Recording
│   │   ├── memory.tsx  # Memory
│   │   └── profile.tsx  # Profile
│   ├── index.tsx        # Auth screen
│   └── _layout.tsx      # Root layout
├── components/          # Reusable components
│   ├── Button.tsx
│   ├── CreateBitacoraModal.tsx
│   └── ModeBadge.tsx
├── lib/                # Utilities and helpers
├── assets/             # Images, fonts, etc.
└── global.css          # Global styles
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌍 Languages

- [English](README.md) (this file)
- [Español](README.es.md)

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 🔒 Security

For security concerns, please email security@bitacora.app

## 📞 Support

- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/bitacora/issues)
- 💬 Join our [Discord](https://discord.gg/bitacora)
- 📧 Email: support@bitacora.app

---

<div align="center">

Crafted by [Hashpass.tech](https://hashpass.tech)

Made with ❤️

</div>
