import {
  addDays,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import packageJson from '../../package.json';
import { auth, db } from '../firebase';
import type { DailyTracking, DailyCheckIn, DailyTrainingLoad, User } from '../types';
import {
  buildWorkoutEntriesFromTracking,
  computeDailyTrainingLoadV1,
  resolvePushupsFromTracking,
} from './trainingLoad';
import { getDayProgressSummary } from '../utils/progress';
import { addBreadcrumb, captureException } from './sentryService';

interface DayDocument extends Partial<DailyTracking> {
  readonly date?: string;
  readonly tasksCompleted?: number;
  readonly tasksTotal?: number;
  readonly dayProgressPct?: number;
  readonly dayStreakMet?: boolean;
}

function getWeekId(date: Date): string {
  return format(date, "yyyy-'W'II");
}

async function getDayDocumentsForWeek(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<Map<string, DayDocument>> {
  const startKey = format(weekStart, 'yyyy-MM-dd');
  const endKey = format(weekEnd, 'yyyy-MM-dd');
  const collectionRef = collection(db, 'tracking', userId, 'entries');
  const weekQuery = query(
    collectionRef,
    where('date', '>=', startKey),
    where('date', '<=', endKey),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(weekQuery);
  const result = new Map<string, DayDocument>();
  snapshot.forEach((document) => {
    result.set(document.id, document.data() as DayDocument);
  });
  return result;
}

function buildWeekRange(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  return { weekStart, weekEnd };
}

const APP_VERSION = packageJson?.version;

export async function saveDailyCheckInAndRecalc(
  dateKey: string,
  data: { sleepScore: number; recoveryScore: number; sick: boolean }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    addBreadcrumb('Check-in: No authenticated user', {}, 'error');
    throw new Error('User must be authenticated to save a check-in');
  }

  const userId = currentUser.uid;
  addBreadcrumb('Check-in: Starting save', { dateKey, userId, ...data });
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

  try {
    await setDoc(trainingLoadRef, trainingLoadData, { merge: true });
    addBreadcrumb('Check-in: Training load saved', { dateKey, load: computation.load });
  } catch (error) {
    addBreadcrumb('Check-in: Failed to save training load', { error: String(error) }, 'error');
    captureException(error, { context: 'saveDailyCheckInAndRecalc', dateKey, userId });
    throw error;
  }

  const userSnapshot = await getDoc(doc(db, 'users', userId));
  const userData = userSnapshot.exists() ? (userSnapshot.data() as Partial<User>) : undefined;

  // Include check-in data in day progress calculation
  const checkInData: Partial<DailyCheckIn> = {
    sleepScore: data.sleepScore,
    recoveryScore: data.recoveryScore,
    sick: data.sick,
  };

  const daySummary = getDayProgressSummary({
    tracking,
    checkIn: checkInData,
    user: userData,
    enabledActivities: userData?.enabledActivities,
  });

  await setDoc(
    trackingRef,
    {
      date: dateKey,
      tasksCompleted: daySummary.tasksCompleted,
      tasksTotal: daySummary.tasksTotal,
      dayProgressPct: daySummary.percent,
      dayStreakMet: daySummary.streakMet,
      streakScore: daySummary.streakScore, // NEW: Store weighted streak score
      updatedAt: timestamp,
    },
    { merge: true }
  );

  const targetDate = parseISO(dateKey);
  const { weekStart, weekEnd } = buildWeekRange(targetDate);
  const weekDays = await getDayDocumentsForWeek(userId, weekStart, weekEnd);

  // Fetch check-in data for the entire week
  const startKey = format(weekStart, 'yyyy-MM-dd');
  const endKey = format(weekEnd, 'yyyy-MM-dd');
  const checkInsCollectionRef = collection(db, 'users', userId, 'checkins');
  const checkInsQuery = query(
    checkInsCollectionRef,
    where('date', '>=', startKey),
    where('date', '<=', endKey),
    orderBy('date', 'asc')
  );
  const checkInsSnapshot = await getDocs(checkInsQuery);
  const weekCheckIns = new Map<string, Partial<DailyCheckIn>>();
  checkInsSnapshot.forEach((document) => {
    weekCheckIns.set(document.id, document.data() as DailyCheckIn);
  });

  const metrics = Array.from({ length: 7 }, (_, index) => {
    const currentDate = addDays(weekStart, index);
    const key = format(currentDate, 'yyyy-MM-dd');
    const existing = weekDays.get(key);
    const checkIn = weekCheckIns.get(key);
    return getDayProgressSummary({
      tracking: existing,
      checkIn,
      user: userData,
      enabledActivities: userData?.enabledActivities,
    });
  });

  const streakDays = metrics.reduce(
    (total, metric) => (metric.streakMet ? total + 1 : total),
    0
  );
  const totalPct = metrics.reduce((total, metric) => total + metric.percent, 0);
  const averagePct = metrics.length > 0 ? totalPct / metrics.length : 0;

  const weekRef = doc(db, 'tracking', userId, 'weeks', getWeekId(weekStart));
  await setDoc(
    weekRef,
    {
      streakDays,
      totalPctAvg: averagePct,
      updatedAt: timestamp,
    },
    { merge: true }
  );

  addBreadcrumb('Check-in: Save completed successfully', { dateKey, streakDays });
}

// MIGRATION NOTE:
// This service now uses 'tracking/{userId}/entries/{date}' instead of 'days'
// Legacy data will be migrated automatically on first login via useAuth hook
