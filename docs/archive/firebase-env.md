# Legacy Firebase Environment Variables

> **Status:** Archived – only required if you are maintaining the deprecated Firebase backend.

The previous Firebase-based backend required the following environment variables:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

To regenerate credentials:

1. Open the Firebase Console and navigate to **Project Settings → Service Accounts**.
2. Click **Generate New Private Key** to download a JSON file.
3. Copy the values into the variables above. Preserve newlines in `FIREBASE_PRIVATE_KEY` by replacing actual newlines with `\n` when storing in `.env` files.

These variables are no longer needed for the Next.js + Neon stack. Keep them separate from `.env.local` unless you are actively supporting the legacy service.
