# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Winter Arc Fitness Tracking PWA

## Project Overview

Progressive Web App (PWA) für iOS und Android namens "Winter Arc Fitness Tracker" - eine umfassende Fitness-Tracking-App mit Fokus auf Liegestütze, Sport, Ernährung und Gewichtstracking.

---

## Technologie-Stack

- **Frontend**: React mit TypeScript
- **Build-Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **AI**: Google Gemini für personalisierte Motivationssprüche
- **Security**: Firebase App Check mit reCAPTCHA v3
- **PWA**: Workbox für Service Worker und Offline-Funktionalität
- **Charts**: Recharts für Gewichtsgraphen
- **State Management**: Zustand mit automatischer Firebase-Synchronisation

---

## Authentifizierung & Onboarding

### Login
- Google SSO über Firebase Auth
- Beim ersten Login: Onboarding-Flow mit folgenden Schritten:
  1. Spitzname
  2. Geschlecht (Männlich/Weiblich/Divers)
  3. Größe (in cm)
  4. Gewicht (in kg)
  5. Körperfettanteil (KFA, optional, in %)
  6. Maximale Liegestütze am Stück (für Trainingsplan-Generierung)

---

## App-Struktur (Bottom Navigation)

### Seite 1: Dashboard/Übersicht

**Header mit AI-Motivation (oben)**
- Persönliche Begrüßung mit Nickname
- **AI-generierter Motivationsspruch**: Analysiert Tracking-Daten (Streak, Liegestütze, Sport-Sessions) und generiert täglich einen personalisierten, motivierenden Spruch über Google Gemini
- Fallback auf statische Motivationssprüche, falls Gemini API nicht konfiguriert
- Glassmorphism-Design mit Backdrop-Blur-Effekt

**Wochentracking (Mitte)**
- Zeigt die aktuelle Woche (Montag-Sonntag)
- Visueller Progress-Indikator für täglich erledigte Aufgaben
- Checkboxen oder Kreise für jeden Tag mit farblicher Kennzeichnung (erledigt/offen)

**Leaderboard (darunter)**
- Gruppen-basiertes Ranking
- User können Gruppencode eingeben/erstellen (z.B. "boys")
- Zeigt alle Mitglieder der Gruppe mit ihrem Score
- Score basiert auf: erledigte Tracking-Tage, Liegestütze, Sport-Sessions
- Anzeige: Rang, Spitzname, Punkte/Progress

### Seite 2: Tracking

**1. Liegestütze-Kachel (oben)**
Beim Klick öffnet sich Modal mit zwei Modi:

**Modus A: Schnelleingabe**
- Einfaches Zahlenfeld zur Eingabe der Gesamt-Liegestütze

**Modus B: Trainingsmodus**
Implementiere den "Base & Bump" Algorithmus:

```typescript
// Initialisierung (einmalig nach Onboarding)
function initPushupPlan(maxReps: number) {
  const B = Math.max(3, Math.floor(0.45 * maxReps));
  return {
    baseReps: B,
    sets: 5,
    restTime: 90 // Sekunden
  };
}

// Täglicher Trainingsplan
function getDailyPlan(state) {
  return {
    sets: [
      { number: 1, target: state.baseReps, type: 'fixed' },
      { number: 2, target: state.baseReps, type: 'fixed' },
      { number: 3, target: state.baseReps, type: 'fixed' },
      { number: 4, target: state.baseReps, type: 'fixed' },
      { number: 5, target: state.baseReps + 2, type: 'amrap' } // AMRAP mit Limit
    ],
    restTime: state.restTime
  };
}

// Auswertung nach Training
function evaluateWorkout(state, reps: number[]) {
  const B = state.baseReps;
  const hit = reps.slice(0, 4).filter(r => r >= B).length;
  const amrapOk = reps[4] >= B;

  let nextB;
  if (hit === 4 && amrapOk) {
    nextB = B + 1; // Progress
  } else if (hit === 3 || (hit === 4 && reps[4] === B - 1)) {
    nextB = B; // Hold
  } else {
    nextB = Math.max(3, B - 1); // Regression
  }

  // Deload Guard
  const nextSets = (nextB * 5 > 120) ? 4 : 5;

  return {
    baseReps: nextB,
    sets: nextSets,
    restTime: state.restTime,
    status: hit === 4 && amrapOk ? 'pass' : hit === 3 ? 'hold' : 'fail'
  };
}
```

**Trainingsmodus UI:**
- Zeige 5 Kacheln für jeden Satz mit Ziel-Wiederholungen
- 90-Sekunden Countdown-Timer zwischen Sätzen
- Input für tatsächliche Wiederholungen pro Satz
- Nach Abschluss: Status-Badge (Pass/Hold/Fail) und neue Basis für morgen
- Info-Banner: "1 Wiederholung vor Form-Kollaps stoppen"
- **Wöchentliche Re-Kalibrierung** (Tag 7): AMRAP-Test zur Neuberechnung

**2. Sport-Kachel**
Drei Checkbox-Optionen (können täglich mehrfach abgehakt werden):
- HIIT/HYROX
- Cardio
- Gym

**3. Wasser-Kachel**
- Ziel: z.B. 3 Liter pro Tag
- Visuelle Darstellung (Gläser oder Fortschrittsbalken)
- Schnell-Buttons: +250ml, +500ml, +1L
- Manuelle Eingabe möglich

**4. Protein-Kachel**
- Ziel basierend auf Körpergewicht (z.B. 2g pro kg)
- Input-Feld für Gramm Protein
- Tagesfortschritt anzeigen

**5. Gewichts-Graph (unten)**
- Eingabemöglichkeit: Gewicht (kg) + optional KFA (%)
- Liniendiagramm für Gewichtsverlauf (letzte 30/90 Tage)
- BMI-Berechnung und Anzeige, wenn Größe vorhanden
- Formel: BMI = Gewicht (kg) / (Größe (m))²

### Seite 3: Erweitertes Leaderboard
- Monatsübersicht mit Kalenderansicht
- Heatmap der Trainingstage
- Detaillierte Statistiken pro Gruppenmitglied:
  - Gesamte Liegestütze
  - Sport-Sessions
  - Streak (aufeinanderfolgende Tage)
  - Durchschnittliche Wasseraufnahme
  - Durchschnittliche Proteinaufnahme
- Filter: Woche/Monat/All-Time
- Achievements/Badges System

### Seite 4: Einstellungen

**Profil**
- Bearbeiten aller Onboarding-Daten (Spitzname, Geschlecht, Größe, Gewicht, KFA, max. Liegestütze)
- Profilbild (optional)

**Gruppen**
- Aktuellen Gruppencode anzeigen
- Gruppencode ändern/neue Gruppe beitreten
- Gruppe verlassen

**Benachrichtigungen**
- Tägliche Erinnerung (Uhrzeit wählbar)
- Erinnerung für unvollständige Tage
- Push-Notifications via Firebase Cloud Messaging

**Datenschutz & Konto**
- Abmelden
- Konto löschen (mit Bestätigung, löscht alle Daten aus Firebase)
- Datenschutzerklärung
- AGB

---

## Offline-Funktionalität

- Service Worker mit Workbox implementieren
- Offline-First Strategie:
  - Alle Tracking-Eingaben werden lokal im IndexedDB/localStorage gespeichert
  - Bei Internetverbindung: Sync mit Firestore
  - Conflict Resolution bei gleichzeitigen Änderungen
- Background Sync für ausstehende Updates
- Cache-First Strategie für statische Assets
- Network-First für Leaderboard/Gruppendaten

---

## Firebase Datenmodell

```typescript
// Firestore Collections
users: {
  [userId]: {
    nickname: string;
    gender: 'male' | 'female' | 'diverse';
    height: number; // cm
    weight: number; // kg
    bodyFat?: number; // %
    maxPushups: number;
    groupCode: string;
    createdAt: timestamp;
    pushupState: {
      baseReps: number;
      sets: number;
      restTime: number;
    };
  }
}

tracking: {
  [userId]: {
    [date: YYYY-MM-DD]: {
      pushups: {
        total?: number; // Schnelleingabe
        workout?: { // Trainingsmodus
          reps: number[];
          status: 'pass' | 'hold' | 'fail';
        };
      };
      sports: {
        hiit: boolean;
        cardio: boolean;
        gym: boolean;
      };
      water: number; // ml
      protein: number; // g
      weight?: {
        value: number; // kg
        bodyFat?: number; // %
        bmi?: number;
      };
      completed: boolean;
    }
  }
}

groups: {
  [groupCode]: {
    name: string;
    members: string[]; // userIds
    createdAt: timestamp;
  }
}
```

---

## Design-Anforderungen

- Modernes, cleanes UI mit Winter-Theme (kühle Farben: Blau, Weiß, Grau-Töne)
- Dark Mode Support
- Responsive für alle Bildschirmgrößen
- Animationen für Übergänge und Erfolgsmeldungen
- Haptic Feedback auf mobilen Geräten
- iOS Safari und Chrome Android optimiert

---

## PWA Konfiguration

- manifest.json mit Icons (512x512, 192x192)
- App-Name: "Winter Arc Tracker"
- Standalone Display Mode
- Theme Color und Background Color
- Splash Screens für iOS

---

## Zusätzliche Features

- Streak-Counter (aufeinanderfolgende Trainingstage)
- Motivierende Quotes/Sprüche
- Erfolgs-Notifications bei Meilensteinen
- Export der eigenen Daten (CSV/JSON)
- Teilbare Fortschritts-Cards (Social Media)

---

## Sicherheit & Performance

- Firebase Security Rules für Datenschutz
- Input Validation auf Client und Server
- Rate Limiting für API-Calls
- Optimierte Bundle-Größe
- Lazy Loading für Routen
- Optimierte Bilder (WebP mit Fallback)

---

## Development Commands

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Then fill in Firebase credentials in .env

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run linter
npm run lint
```

### Environment Variables Setup

The app requires the following environment variables in `.env`:

**Firebase Configuration (Required):**
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Gemini AI for Personalized Quotes (Optional):**
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
```
- Get your API key from: https://makersuite.google.com/app/apikey
- If not set, the app will show fallback motivational quotes
- The AI analyzes user tracking data (streak, pushups, sports) to generate personalized daily motivational quotes

**Firebase App Check with reCAPTCHA v3 (Optional but recommended for production):**
```bash
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```
- Setup steps:
  1. Go to Firebase Console → App Check → Register app
  2. Select reCAPTCHA v3 as provider
  3. Register your domain (localhost for dev, your-domain.com for prod)
  4. Copy the site key to `.env`
- If not set, App Check will be skipped (development mode)
- Protects Firebase services from abuse and unauthorized access

---

## Architecture

### State Management

The app uses **Zustand** for global state management:
- `useStore` - Main store with user, tracking, dark mode
- State automatically syncs with Firebase via hooks

### Firebase Integration

**Authentication:**
- `useAuth` hook - Listens to Firebase auth state
- Automatically fetches/creates user data on login
- Redirects to onboarding if user data doesn't exist

**Firestore:**
- `firestoreService` - CRUD operations for users, tracking, groups
- `useTracking` hook - Auto-saves tracking data (debounced 1s)
- Security rules prevent unauthorized access

### Key Hooks

- `useAuth()` - Firebase authentication listener
- `useTracking()` - Auto-sync tracking data to Firestore

### Data Flow

1. User logs in with Google SSO
2. `useAuth` fetches user data from Firestore
3. If no user data exists, redirect to onboarding
4. Onboarding saves user data to Firestore
5. Tracking changes auto-save to Firestore (debounced)

---

## Firebase Structure

```
firestore/
├── users/{userId}
│   ├── nickname: string
│   ├── gender: 'male' | 'female' | 'diverse'
│   ├── height: number
│   ├── weight: number
│   ├── bodyFat?: number
│   ├── maxPushups: number
│   ├── groupCode: string
│   ├── createdAt: timestamp
│   └── pushupState: { baseReps, sets, restTime }
│
├── tracking/{userId}/days/{date}
│   ├── pushups: { total?, workout? }
│   ├── sports: { hiit, cardio, gym }
│   ├── water: number
│   ├── protein: number
│   ├── weight?: { value, bodyFat?, bmi? }
│   └── completed: boolean
│
└── groups/{groupCode}
    ├── name: string
    ├── members: string[]
    └── createdAt: timestamp
```

---

## Best Practices

- Implementiere Best Practices für React, TypeScript und PWA-Entwicklung
- Code-Splitting und Lazy Loading für optimale Performance
- Accessibility (a11y) Standards einhalten
- SEO-Optimierung
- Progressive Enhancement Strategie
