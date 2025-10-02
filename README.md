# Winter Arc Tracker

Progressive Web App (PWA) für iOS und Android - Track your winter fitness journey with pushups, sports, nutrition, and weight tracking.

## Features

- 💪 **Pushup Training** - Smart training plan with "Base & Bump" algorithm
- 🏃 **Sport Tracking** - HIIT/HYROX, Cardio, Gym sessions
- 💧 **Water Tracking** - Daily hydration goals
- 🥩 **Protein Tracking** - Nutrition targets based on body weight
- 📈 **Weight Graph** - Track weight and body fat percentage
- 🏆 **Leaderboard** - Group-based rankings and statistics
- 📱 **PWA** - Install on any device, works offline
- 🌙 **Dark Mode** - Full dark mode support

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **State Management**: Zustand
- **Charts**: Recharts
- **PWA**: Vite PWA Plugin + Workbox
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for backend)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd winter-arc-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Add your Firebase configuration to `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/      # Reusable React components
├── pages/          # Page components
├── routes/         # Routing configuration
├── store/          # Zustand state management
├── firebase/       # Firebase configuration
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Authentication in Authentication > Sign-in method
4. Create a Firestore database in production mode
5. Deploy security rules from `firestore.rules`

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

### Firestore Collections

- `users/{userId}` - User profiles and settings
- `tracking/{userId}/days/{date}` - Daily tracking data
- `groups/{groupCode}` - Leaderboard groups

### Security Rules

The app includes Firestore security rules in `firestore.rules`:
- Users can only read/write their own data
- All authenticated users can read group data
- Groups cannot be deleted

Deploy rules with:
```bash
firebase deploy --only firestore:rules
```

## PWA Features

- Offline support with service worker
- Install on home screen
- Background sync
- Push notifications (coming soon)

## License

MIT
