# 🔒 Security Setup Guide

This guide walks you through setting up all security features for the Winter Arc app.

## 📋 Overview

The app uses a **defense-in-depth** security approach with three layers:

1. **Socket.dev** - Dependency scanning (Supply chain security)
2. **Firebase Security Rules** - Access control & data validation
3. **Firebase App Check** - Bot protection (Web only)

---

## 1️⃣ Socket.dev - Dependency Scanning

### What it does:
- Scans all npm packages for vulnerabilities
- Detects supply chain attacks
- Alerts on suspicious package behavior
- Runs automatically on every push/PR

### Setup Steps:

#### Step 1: Create Socket.dev Account
1. Go to https://socket.dev
2. Sign up with GitHub account
3. Connect your repository

#### Step 2: Get API Key
1. Go to Socket.dev dashboard
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Copy the key

#### Step 3: Add GitHub Secret
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `SOCKET_SECURITY_API_KEY`
5. Value: Paste your Socket.dev API key
6. Click "Add secret"

#### Step 4: Verify Integration
1. Push a commit to main branch
2. Go to Actions tab in GitHub
3. Check "Socket Security Scan" workflow runs successfully

**File:** `.github/workflows/socket-security.yml` (already created)

---

## 2️⃣ Firebase Security Rules

### What it does:
- Enforces authentication on all requests
- Owner-only access to data
- Validates data types and ranges
- Prevents data tampering

### Setup Steps:

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase
```bash
firebase login
```

#### Step 3: Initialize Firestore (First time only)
```bash
cd winter-arc-app
firebase init firestore
```

Select options:
- Use existing project? **Yes**
- Select your Firebase project
- Firestore rules file? **firestore.rules** (use existing)
- Firestore indexes file? **firestore.indexes.json**

#### Step 4: Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

Expected output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
```

#### Step 5: Verify Rules
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click "Rules" tab
4. You should see your rules deployed

### Testing Rules Locally

```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# In another terminal, run tests
npm test
```

**File:** `firestore.rules` (already created)

---

## 3️⃣ Firebase App Check (Web Only)

### What it does:
- Protects against bots and abuse
- Uses reCAPTCHA v3 (invisible)
- Works automatically in background
- No user interaction required

### Setup Steps:

#### Step 1: Enable Firebase App Check
1. Go to Firebase Console
2. Navigate to **App Check** in left menu
3. Click **"Get started"**
4. Click **"Register"** next to your web app

#### Step 2: Get reCAPTCHA v3 Site Key
1. Go to https://www.google.com/recaptcha/admin
2. Click **"+"** to add new site
3. Fill in:
   - **Label:** Winter Arc App
   - **reCAPTCHA type:** reCAPTCHA v3
   - **Domains:** Add your domain (e.g., `wilddragonking.github.io`)
4. Accept Terms of Service
5. Click **"Submit"**
6. **Copy the Site Key** (starts with `6L...`)

#### Step 3: Add reCAPTCHA to Firebase App Check
1. Back in Firebase Console → App Check
2. Under your web app, click **"reCAPTCHA"**
3. Paste your **reCAPTCHA Site Key**
4. Click **"Save"**

#### Step 4: Add to Local Environment
```bash
# Edit your .env file
EXPO_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...your_site_key_here
```

#### Step 5: Add to GitHub Secrets
1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Click **"New repository secret"**
4. Name: `EXPO_PUBLIC_RECAPTCHA_SITE_KEY`
5. Value: Paste your reCAPTCHA Site Key
6. Click **"Add secret"**

#### Step 6: Update GitHub Actions Workflow

Edit `.github/workflows/deploy.yml` and add the environment variable:

```yaml
- name: Build for Web
  env:
    EXPO_PUBLIC_FIREBASE_API_KEY: ${{ secrets.EXPO_PUBLIC_FIREBASE_API_KEY }}
    # ... other secrets ...
    EXPO_PUBLIC_RECAPTCHA_SITE_KEY: ${{ secrets.EXPO_PUBLIC_RECAPTCHA_SITE_KEY }}
  run: npm run build:web
```

#### Step 7: Enforce App Check (Recommended for Production)
1. Firebase Console → App Check
2. Click **"APIs"** tab
3. Find **Firestore**
4. Toggle **"Enforce"** to ON
5. Confirm the dialog

⚠️ **Warning:** Only enable "Enforce" after testing! Enforcing will block all requests without valid App Check tokens.

#### Step 8: Test App Check
1. Deploy your changes
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for: `Firebase App Check initialized successfully`
5. Go to Network tab
6. Make a Firestore request
7. Check request headers for `X-Firebase-AppCheck`

**Files modified:**
- `src/services/firebase.ts` (already updated)
- `.env.example` (already updated)

---

## ✅ Verification Checklist

After completing all setup steps, verify:

### Socket.dev
- [ ] GitHub Action runs on push/PR
- [ ] Security reports appear in Actions artifacts
- [ ] Fails on high/critical vulnerabilities

### Firebase Security Rules
- [ ] Rules deployed to Firebase
- [ ] Can read/write own data
- [ ] Cannot read/write other users' data
- [ ] Invalid data is rejected

### Firebase App Check
- [ ] reCAPTCHA Site Key added to .env
- [ ] reCAPTCHA Site Key added to GitHub Secrets
- [ ] Console shows "Firebase App Check initialized successfully"
- [ ] Firestore requests include App Check token
- [ ] (Optional) Enforce enabled in Firebase Console

---

## 🔧 Troubleshooting

### Socket.dev Issues

**Problem:** Workflow fails with "API key invalid"
- **Solution:** Verify `SOCKET_SECURITY_API_KEY` secret is set correctly in GitHub

**Problem:** No security reports
- **Solution:** Check Actions tab → Socket Security Scan → Artifacts

### Firebase Security Rules Issues

**Problem:** "Permission denied" errors
- **Solution:** Check user is authenticated: `firebase.auth().currentUser`
- **Solution:** Verify userId matches in database

**Problem:** Cannot save data
- **Solution:** Check data validation rules (e.g., push-ups 1-1000)
- **Solution:** Run `firebase emulators:start` to test locally

### Firebase App Check Issues

**Problem:** "App Check initialization failed"
- **Solution:** Verify `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` is set
- **Solution:** Check domain is registered in reCAPTCHA console

**Problem:** Requests blocked after enabling Enforce
- **Solution:** Check App Check token is included in requests
- **Solution:** Temporarily disable Enforce to debug

**Problem:** "This site key is not enabled for the invisible captcha"
- **Solution:** Make sure you selected **reCAPTCHA v3** (not v2)

---

## 📚 Additional Resources

- [Socket.dev Documentation](https://socket.dev/docs)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)

---

## 🚀 Next Steps

Once security is set up:

1. **Monitor Security Alerts:** Check Socket.dev dashboard weekly
2. **Audit Security Rules:** Review quarterly
3. **Rotate Keys:** Update reCAPTCHA key every 90 days
4. **Enable Firestore Metrics:** Firebase Console → Performance Monitoring
5. **Set Budget Alerts:** Firebase Console → Budgets & Alerts

---

**Security is a continuous process, not a one-time setup!** 🔒
