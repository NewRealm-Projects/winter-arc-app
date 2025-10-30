# 🚀 Backend Setup - Quick Start

## ✅ Was ist fertig?

- ✅ Vercel Config (`vercel.json`)
- ✅ Health Check Endpoint (`api/health.ts`)
- ✅ Auth Verification (`api/auth/verify.ts`)
- ✅ Tracking Endpoint (`api/tracking/entry.ts`)
- ✅ Package.json Scripts
- ✅ Dependencies installiert

## 📋 Nächste Schritte

### 1. Firebase Service Account erstellen

1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Wähle dein Projekt
3. Settings ⚙️ → **Service Accounts**
4. Klicke **"Generate New Private Key"**
5. Speichere JSON als `serviceAccountKey.json` (wird ignoriert)

### 2. Environment Variables einrichten

Erstelle `.env.local`:

```bash
cp .env.local.template .env.local
```

Fülle die Werte aus `serviceAccountKey.json`:

```env
FIREBASE_PROJECT_ID=winter-arc-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@winter-arc-12345.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXX...\n-----END PRIVATE KEY-----\n"

GEMINI_API_KEY=your-key-here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Lokalen Dev-Server starten

```bash
npm run dev
```

Das startet:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

### 4. Backend testen

```bash
# Health Check
curl http://localhost:3000/api/health

# Expected Response:
# {"status":"ok","service":"winter-arc-backend","timestamp":"...","uptime":"1s","environment":"development"}
```

### 5. Auth testen (mit echtem Token)

1. Frontend starten → Login
2. Token aus DevTools kopieren
3. Test-Request:

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

## 🌐 Production Deployment

### 1. Vercel Account verbinden

```bash
npm install -g vercel
vercel login
```

### 2. Projekt verlinken

```bash
vercel
```

Folge den Prompts:
- Link to existing project? **NO**
- Project name: **winter-arc-app**
- Directory: **.**

### 3. Environment Variables in Vercel setzen

Gehe zu: [Vercel Dashboard](https://vercel.com/dashboard) → Settings → Environment Variables

Füge hinzu:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `FRONTEND_URL` (https://app.winterarc.newrealm.de)

### 4. Deploy!

```bash
# Preview Deployment
npm run deploy:preview

# Production Deployment
npm run deploy
```

## 📁 Struktur

```
api/
├── health.ts              # Health Check
├── auth/
│   └── verify.ts          # Token Verification
└── tracking/
    └── entry.ts           # Get Tracking Data
```

## 🔄 Nächste Features

Nach dem Setup kannst du weitere Endpoints hinzufügen:

- `api/tracking/update.ts` - Update Tracking Data
- `api/ai/quote.ts` - Gemini AI Quotes
- `api/user/profile.ts` - User Profile CRUD

Jede `.ts` Datei in `api/` wird automatisch zu `/api/<path>` Route!

## 🆘 Troubleshooting

### "Module not found: @vercel/node"
```bash
npm install -D @vercel/node
```

### "Firebase Admin error"
- Prüfe `.env.local` Format
- `FIREBASE_PRIVATE_KEY` muss `\n` als echte Newlines haben
- Stelle sicher, Service Account hat Firestore-Rechte

### "CORS error"
- Prüfe `vercel.json` Headers
- `FRONTEND_URL` muss mit tatsächlichem Frontend übereinstimmen

### Vercel CLI nicht gefunden
```bash
npm install -g vercel
```

## 📚 Ressourcen

- [Vercel Docs](https://vercel.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
