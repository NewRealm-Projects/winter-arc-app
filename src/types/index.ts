export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  weight?: number; // in kg
  height?: number; // in cm
  bodyFat?: number; // body fat percentage
  onboardingCompleted?: boolean;
  groupCode?: string; // group identifier (e.g., "boys")
  nickname?: string;
}

export interface SportEntry {
  id: string;
  userId: string;
  date: Date;
  completed: boolean; // Simple checkbox - did you work out today?
}

export interface PushUpEntry {
  id: string;
  userId: string;
  count: number;
  date: Date;
  notes?: string;
}

export interface ProteinEntry {
  id: string;
  userId: string;
  grams: number; // protein in grams
  date: Date;
  notes?: string;
}

export interface WaterEntry {
  id: string;
  userId: string;
  amount: number; // in ml
  date: Date;
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number; // in kg
  bodyFat?: number; // body fat percentage (optional)
  date: Date;
}

export interface DailyStats {
  date: Date;
  sportCompleted: boolean;
  pushUps: number;
  waterAmount: number;
  proteinGrams: number;
}
