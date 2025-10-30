import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

/**
 * Get Tracking Entry
 *
 * GET /api/tracking/entry?dateKey=2025-10-30
 * Headers: { Authorization: "Bearer <firebase-id-token>" }
 *
 * Returns: Tracking data for the specified date
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get dateKey from query params
    const { dateKey } = req.query;
    if (!dateKey || typeof dateKey !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid dateKey parameter' });
    }

    // Fetch from Firestore
    const docRef = db
      .collection('tracking')
      .doc(userId)
      .collection('entries')
      .doc(dateKey);

    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Return tracking data
    res.status(200).json({
      dateKey,
      data: doc.data(),
    });
  } catch (error) {
    console.error('Error fetching tracking entry:', error);

    if (error instanceof Error && error.message.includes('auth')) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}
