export const DEMO_MODE_FLAG_KEY = 'winter-arc-demo-mode';

export function markDemoModeActive(): void {
  try {
    localStorage.setItem(DEMO_MODE_FLAG_KEY, 'true');
  } catch {
    // ignore storage access errors in restricted environments
  }
}

export function clearDemoModeMarker(): void {
  try {
    localStorage.removeItem(DEMO_MODE_FLAG_KEY);
  } catch {
    // ignore storage access errors in restricted environments
  }
}

export function isDemoModeActive(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}
