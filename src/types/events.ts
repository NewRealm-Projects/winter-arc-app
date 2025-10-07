export type EventKind =
  | 'drink'
  | 'protein'
  | 'pushups'
  | 'workout'
  | 'rest'
  | 'weight'
  | 'bfp'
  | 'food';

export interface BaseEvent {
  id: string;
  ts: number;
  kind: EventKind;
  confidence: number;
  source: 'heuristic' | 'llm';
}

export interface DrinkEvent extends BaseEvent {
  kind: 'drink';
  volumeMl: number;
  beverage: 'water' | 'protein' | 'coffee' | 'tea' | 'other';
}

export interface ProteinEvent extends BaseEvent {
  kind: 'protein';
  grams: number;
  sourceLabel?: string;
}

export interface PushupEvent extends BaseEvent {
  kind: 'pushups';
  count: number;
}

export interface WorkoutEvent extends BaseEvent {
  kind: 'workout';
  sport: 'hiit_hyrox' | 'cardio' | 'gym' | 'swimming' | 'football' | 'other';
  durationMin?: number;
  intensity?: 'easy' | 'moderate' | 'hard';
  notes?: string;
}

export interface RestEvent extends BaseEvent {
  kind: 'rest';
  reason?: string;
}

export interface WeightEvent extends BaseEvent {
  kind: 'weight';
  kg: number;
}

export interface BfpEvent extends BaseEvent {
  kind: 'bfp';
  percent: number;
}

export interface FoodEvent extends BaseEvent {
  kind: 'food';
  label: string;
  calories?: number;
  proteinG?: number;
}

export type Event =
  | DrinkEvent
  | ProteinEvent
  | PushupEvent
  | WorkoutEvent
  | RestEvent
  | WeightEvent
  | BfpEvent
  | FoodEvent;

export type SmartNoteAttachment = {
  id: string;
  url: string;
  type: 'image';
  storagePath?: string;
};

export interface SmartNote {
  id: string;
  ts: number;
  raw: string;
  summary: string;
  events: Event[];
  pending?: boolean;
  attachments?: SmartNoteAttachment[];
}

export type SmartNoteInput = {
  raw: string;
};

