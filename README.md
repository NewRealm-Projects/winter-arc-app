
# Winter Arc

A cross-platform fitness tracking app for tracking your winter fitness journey.

---

## 📚 Dokumentationsstrategie

- Es gibt nur zwei zentrale Doku-Dateien: `README.md` (Projektüberblick, Einstieg) und `CLAUDE.md` (Entwicklung, Wissen, Fixes, Lessons Learned).
- Alle neuen Erfahrungen, Fixes und Erkenntnisse werden in `CLAUDE.md` **integriert, verdichtet und sinnvoll zusammengeführt** – niemals einfach nur angehängt.
- Keine weiteren `.md`-Dateien im Projekt.


## Features

- 💪 **Push-ups Tracker**: Log your daily push-up count
- 🏃 **Sport Activities**: Track running, cycling, gym sessions, and more
- 🥗 **Nutrition**: Log meals with calorie tracking
- 💧 **Water Intake**: Monitor your daily hydration

## Tech Stack

- **Expo / React Native** - Cross-platform mobile & web
- **TypeScript** - Type safety
- **Firebase** - Authentication & Database
- **GitHub Actions** - Automated deployment

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Firebase credentials

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   - Press `w` for web
   - Press `a` for Android
   - Press `i` for iOS

## Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Email/Password authentication
3. Create a Firestore database
4. Copy your Firebase config to `.env` file

## Deployment

The app automatically deploys to GitHub Pages when you push to the `main` branch.

To deploy manually:
```bash
npm run build:web
```


## License

MIT
