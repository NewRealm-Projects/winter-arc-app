// Minimal stub modules to satisfy legacy imports while Firebase is phased out.
// Remove after full migration to PostgreSQL services.

declare module 'firebase/firestore' {
  export interface Timestamp { toMillis(): number }
  export interface DocumentSnapshot<T = any> { data(): T | undefined }
  export interface QuerySnapshot<T = any> { docs: Array<DocumentSnapshot<T>> }
  export type FirestoreError = { code: string; message: string }
  export function getDoc(ref: any): Promise<DocumentSnapshot>
  export function getDocs(q: any): Promise<QuerySnapshot>
  export function setDoc(ref: any, data: any): Promise<void>
  export function writeBatch(db: any): { set(ref: any, data: any): void; commit(): Promise<void> }
}

declare module 'firebase/storage' {
  export function deleteObject(ref: any): Promise<void>
  export function getDownloadURL(ref: any): Promise<string>
  export function ref(storage: any, path: string): any
  export function uploadBytes(ref: any, data: any): Promise<{ ref: any }>
  export interface FirebaseStorage {}
}

declare module 'firebase/auth' {
  export interface Auth {}
}

export {};
