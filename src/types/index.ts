export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export interface SportEntry {
  id: string;
  userId: string;
  type: string; // e.g., "Running", "Cycling", "Gym"
  duration: number; // in minutes
  date: Date;
  notes?: string;
}

export interface PushUpEntry {
  id: string;
  userId: string;
  count: number;
  date: Date;
  notes?: string;
}

export interface NutritionEntry {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories?: number;
  date: Date;
  notes?: string;
}

export interface WaterEntry {
  id: string;
  userId: string;
  amount: number; // in ml
  date: Date;
}

export interface DailyStats {
  date: Date;
  sportMinutes: number;
  pushUps: number;
  waterAmount: number;
  mealsLogged: number;
}
