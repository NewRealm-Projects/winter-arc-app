import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import packageJson from '../../package.json';
import { auth, db } from '../firebase';
import type { DailyTracking, DailyCheckIn, DailyTrainingLoad } from '../types';
import {
  buildWorkoutEntriesFromTracking,
  computeDailyTrainingLoadV1,
  resolvePushupsFromTracking,
} from './trainingLoad';

const APP_VERSION = packageJson?.version;

export async function saveDailyCheckInAndRecalc(
  dateKey: string,
  data: { sleepScore: number; recoveryScore: number; sick: boolean }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to save a check-in');
  }

  const userId = currentUser.uid;
  const checkinRef = doc(db, 'users', userId, 'checkins', dateKey);
  const trainingLoadRef = doc(db, 'users', userId, 'trainingLoad', dateKey);
  const trackingRef = doc(db, 'tracking', userId, 'entries', dateKey);

  const [checkinSnapshot, trainingLoadSnapshot, trackingSnapshot] = await Promise.all([
    getDoc(checkinRef),
    getDoc(trainingLoadRef),
    getDoc(trackingRef),
  ]);

  const tracking = trackingSnapshot.exists() ? (trackingSnapshot.data() as DailyTracking) : undefined;
  const workouts = buildWorkoutEntriesFromTracking(tracking);
  const pushupsReps = resolvePushupsFromTracking(tracking);

  const computation = computeDailyTrainingLoadV1({
    workouts,
    pushupsReps,
    sleepScore: data.sleepScore,
    recoveryScore: data.recoveryScore,
    sick: data.sick,
  });

  const timestamp = serverTimestamp();

  const checkinPayload: Partial<DailyCheckIn> = {
    date: dateKey,
    sleepScore: data.sleepScore,
    recoveryScore: data.recoveryScore,
    sick: data.sick,
    source: 'manual',
    updatedAt: timestamp,
  };

  if (APP_VERSION) {
    checkinPayload.appVersion = APP_VERSION;
  }

  const checkinData = checkinSnapshot.exists()
    ? checkinPayload
    : { ...checkinPayload, createdAt: timestamp };

  await setDoc(checkinRef, checkinData, { merge: true });

  const trainingLoadPayload: Partial<DailyTrainingLoad> = {
    date: dateKey,
    load: computation.load,
    components: computation.components,
    inputs: computation.inputs,
    calcVersion: 'v1',
    updatedAt: timestamp,
  };

  const trainingLoadData = trainingLoadSnapshot.exists()
    ? trainingLoadPayload
    : { ...trainingLoadPayload, createdAt: timestamp };

  await setDoc(trainingLoadRef, trainingLoadData, { merge: true });
}
