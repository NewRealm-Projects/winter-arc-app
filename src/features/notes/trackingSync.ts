import { noteStore } from '../../store/noteStore';
import { useStore } from '../../store/useStore';
import type { SmartTrackingContribution, SportEntry, SportKey } from '../../types';
import type { SmartNote, Event, WorkoutEvent } from '../../types/events';

const WORKOUT_INTENSITY_MAP: Record<NonNullable<WorkoutEvent['intensity']>, number> = {
  easy: 3,
  moderate: 6,
  hard: 8,
};

function getDateKey(ts: number) {
  return new Date(ts).toISOString().split('T')[0];
}

function mergeSportEntries(existing: SportEntry | undefined, incoming: SportEntry): SportEntry {
  if (!existing) {
    return incoming;
  }

  const duration = (() => {
    const existingDuration = existing.duration ?? 0;
    const incomingDuration = incoming.duration ?? 0;
    if (existingDuration === 0) return incomingDuration || undefined;
    if (incomingDuration === 0) return existingDuration || undefined;
    return existingDuration + incomingDuration;
  })();

  const intensity = (() => {
    const existingIntensity = existing.intensity ?? 0;
    const incomingIntensity = incoming.intensity ?? 0;
    if (existingIntensity === 0) return incomingIntensity || undefined;
    if (incomingIntensity === 0) return existingIntensity || undefined;
    return Math.max(existingIntensity, incomingIntensity);
  })();

  return {
    active: true,
    duration,
    intensity,
  };
}

function mapWorkoutSport(sport: WorkoutEvent['sport']): SportKey {
  switch (sport) {
    case 'hiit_hyrox':
      return 'hiit';
    case 'cardio':
      return 'cardio';
    case 'gym':
      return 'gym';
    case 'swimming':
      return 'schwimmen';
    case 'football':
      return 'soccer';
    default:
      return 'gym';
  }
}

function buildContributionFromEvent(event: Event, contribution: SmartTrackingContribution) {
  switch (event.kind) {
    case 'drink':
      contribution.water = (contribution.water ?? 0) + event.volumeMl;
      break;
    case 'protein':
      contribution.protein = (contribution.protein ?? 0) + event.grams;
      break;
    case 'food':
      if (typeof event.proteinG === 'number') {
        contribution.protein = (contribution.protein ?? 0) + event.proteinG;
      }
      break;
    case 'pushups':
      contribution.pushups = (contribution.pushups ?? 0) + event.count;
      break;
    case 'workout': {
      const sportKey = mapWorkoutSport(event.sport);
      const sports = contribution.sports ?? {};
      const entry: SportEntry = {
        active: true,
        duration: event.durationMin,
        intensity: event.intensity ? WORKOUT_INTENSITY_MAP[event.intensity] : undefined,
      };
      sports[sportKey] = mergeSportEntries(sports[sportKey], entry);
      contribution.sports = sports;
      break;
    }
    case 'rest': {
      const sports = contribution.sports ?? {};
      sports.rest = { active: true };
      contribution.sports = sports;
      break;
    }
    case 'weight':
      contribution.weight = {
        ...(contribution.weight ?? {}),
        value: event.kg,
      };
      break;
    case 'bfp':
      contribution.weight = {
        ...(contribution.weight ?? {}),
        bodyFat: event.percent,
      };
      break;
  }
}

function collectContributions(notes: SmartNote[]): Record<string, SmartTrackingContribution> {
  const map = new Map<string, SmartTrackingContribution>();

  for (const note of notes) {
    if (note.pending) continue;
    const dateKey = getDateKey(note.ts);
    const contribution = map.get(dateKey) ?? {};

    for (const event of note.events) {
      if ((event.confidence ?? 0) < 0.5) continue;
      buildContributionFromEvent(event, contribution);
    }

    if (Object.keys(contribution).length > 0) {
      map.set(dateKey, contribution);
    } else {
      map.delete(dateKey);
    }
  }

  return Object.fromEntries(map.entries());
}

let currentSync: Promise<void> | null = null;

async function syncSmartTracking() {
  if (!currentSync) {
    currentSync = (async () => {
      try {
        const notes = await noteStore.all();
        const contributions = collectContributions(notes);
        useStore.getState().setSmartContributions(contributions);
      } catch (error) {
        console.warn('Failed to sync smart tracking contributions', error);
      } finally {
        currentSync = null;
      }
    })();
  }

  await currentSync;
}

void syncSmartTracking();

noteStore.subscribe(() => {
  void syncSmartTracking();
});
