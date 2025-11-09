// Placeholder firebase module to satisfy dynamic imports during migration off Firebase.
// Provides the minimal shape expected by smartNoteService and other legacy code.
export async function getFirebaseApp() {
  return { initialized: false };
}
export const firestore = {} as any;
export const storage = {} as any;
export const auth = {} as any;
