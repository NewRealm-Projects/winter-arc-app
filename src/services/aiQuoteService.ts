import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export type QuoteTimePeriod = 'morning' | 'noon' | 'evening';

export interface AIQuote {
  quote: string;
  subtext: string;
  period: QuoteTimePeriod;
  updatedAt: string; // ISO string
  feedback?: Record<string, 'up' | 'down'>; // userId -> feedback
}

export async function saveAIQuote(userId: string, period: QuoteTimePeriod, quote: AIQuote) {
  const ref = doc(db, 'aiQuotes', userId);
  await setDoc(ref, { [period]: quote }, { merge: true });
}

export async function getAIQuote(userId: string, period: QuoteTimePeriod): Promise<AIQuote | null> {
  const ref = doc(db, 'aiQuotes', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return data[period] || null;
}

export async function setAIQuoteFeedback(userId: string, period: QuoteTimePeriod, feedbackUserId: string, value: 'up' | 'down') {
  const ref = doc(db, 'aiQuotes', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const quote = data[period];
  if (!quote) return;
  const feedback = { ...quote.feedback, [feedbackUserId]: value };
  await setDoc(ref, { [period]: { ...quote, feedback } }, { merge: true });
}
