# Firebase Authentication Setup - Troubleshooting Guide

## Problem: `auth/internal-error` beim Google Login

### Schritt-für-Schritt Lösung:

## 1️⃣ Firebase Console Authentication aktivieren

1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Wähle dein Projekt: **winter-arc-app-2**
3. Klicke auf **Authentication** im Menü links
4. Klicke auf **Get Started** (falls noch nicht aktiviert)

## 2️⃣ Google Sign-In Provider aktivieren

1. In **Authentication** → Klicke auf **Sign-in method** Tab
2. Unter **Sign-in providers** → Klicke auf **Google**
3. **Enable** den Toggle-Schalter
4. **Project support email** auswählen (deine Email)
5. Klicke **Save**

## 3️⃣ Authorized Domains prüfen

1. In **Authentication** → **Settings** Tab
2. Scrolle zu **Authorized domains**
3. Stelle sicher, dass folgende Domains vorhanden sind:
   - ✅ `localhost`
   - ✅ `winter-arc-app-2.firebaseapp.com`
   - ✅ Deine Production Domain (falls vorhanden)

## 4️⃣ OAuth Consent Screen konfigurieren (Google Cloud Console)

Der `auth/internal-error` tritt oft auf, wenn der OAuth Consent Screen nicht konfiguriert ist:

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Wähle dein Projekt: **winter-arc-app-2**
3. Navigiere zu **APIs & Services** → **OAuth consent screen**
4. Falls nicht konfiguriert:
   - **User Type**: External
   - **App name**: Winter Arc Tracker
   - **User support email**: Deine Email
   - **Developer contact information**: Deine Email
   - Klicke **Save and Continue**

## 5️⃣ OAuth 2.0 Client IDs prüfen

1. In Google Cloud Console → **APIs & Services** → **Credentials**
2. Unter **OAuth 2.0 Client IDs** solltest du einen Eintrag sehen (automatisch von Firebase erstellt)
3. Klicke darauf und prüfe:
   - **Authorized JavaScript origins**:
     - `http://localhost:5175`
     - `http://localhost`
     - `https://winter-arc-app-2.firebaseapp.com`
   - **Authorized redirect URIs**:
     - `http://localhost:5175/__/auth/handler`
     - `https://winter-arc-app-2.firebaseapp.com/__/auth/handler`

Falls diese fehlen, füge sie hinzu und klicke **Save**.

## 6️⃣ App Check (Optional, aber empfohlen)

Falls du App Check aktiviert hast:

1. Firebase Console → **App Check**
2. Registriere deine Web-App
3. Wähle **reCAPTCHA v3** als Provider
4. Debug-Token für localhost aktivieren (falls Dev-Modus)

## 7️⃣ Browser Console Logs prüfen

Öffne die Browser Developer Tools (F12) und schau dir die Console an:

```
🔥 Firebase Configuration:
  API Key: ✓ Set
  Auth Domain: winter-arc-app-2.firebaseapp.com
  ...

🔐 Starting Google login...
📱 Opening Google Sign-In popup...
```

Falls ein Fehler auftritt, siehst du Details wie:
```
❌ Login error: {
  code: 'auth/internal-error',
  message: '...',
  details: {...}
}
```

## 8️⃣ Häufige Fehler und Lösungen

### `auth/internal-error`
- ✅ Google Sign-In Provider in Firebase aktivieren
- ✅ OAuth Consent Screen konfigurieren
- ✅ Redirect URIs in Google Cloud Console hinzufügen

### `auth/popup-blocked`
- ✅ Popups für localhost in Browser-Einstellungen erlauben

### `auth/unauthorized-domain`
- ✅ localhost:5175 zu Authorized Domains hinzufügen

### `auth/configuration-not-found`
- ✅ Überprüfe Firebase Config in .env
- ✅ Stelle sicher, dass alle VITE_FIREBASE_* Variablen gesetzt sind

## 9️⃣ Test mit Demo Mode

Falls Google Login nicht funktioniert, kannst du die App mit **Demo Mode** testen:

1. Klicke auf den **"🧪 Demo Mode (Testing)"** Button auf der Login-Seite
2. Dies erstellt einen temporären Demo-User ohne Firebase Authentication
3. Gut zum Testen der App-Funktionalität

## 🔟 Weitere Hilfe

Falls das Problem weiterhin besteht:

1. Öffne Browser Console (F12) → **Console** Tab
2. Kopiere alle Logs (besonders die mit ❌)
3. Schicke mir die Logs für weitere Analyse

### Wichtige Logs:
- Firebase Configuration
- Login error details
- Auth state changes
