// Firebase type declarations
declare module 'firebase/app' {
  export interface FirebaseOptions {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
  }

  export interface FirebaseApp {}

  export function initializeApp(options: FirebaseOptions): FirebaseApp;
  export function getApp(name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
}

declare module 'firebase/auth' {
  import { FirebaseApp } from 'firebase/app';

  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
  }

  export interface Auth {
    currentUser: User | null;
  }

  export interface UserCredential {
    user: User;
  }

  export function getAuth(app?: FirebaseApp): Auth;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void): () => void;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function sendPasswordResetEmail(auth: Auth, email: string): Promise<void>;
  export function updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<void>;
}

declare module 'firebase/firestore' {
  import { FirebaseApp } from 'firebase/app';

  export interface Firestore {}

  export interface DocumentData {
    [field: string]: any;
  }

  export interface QueryDocumentSnapshot<T = DocumentData> {
    id: string;
    exists(): boolean;
    data(): T;
  }

  export interface DocumentSnapshot<T = DocumentData> {
    id: string;
    exists(): boolean;
    data(): T | undefined;
  }

  export interface SnapshotOptions {
    readonly serverTimestamps?: 'estimate' | 'previous' | 'none';
  }

  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
  }

  export interface Query<T = DocumentData> {}

  export interface QuerySnapshot<T = DocumentData> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
    forEach(callback: (result: QueryDocumentSnapshot<T>) => void): void;
  }

  export interface CollectionReference<T = DocumentData> extends Query<T> {
    id: string;
    path: string;
  }

  export interface WriteBatch {
    set<T>(documentRef: DocumentReference<T>, data: T): WriteBatch;
    update<T>(documentRef: DocumentReference<T>, data: Partial<T>): WriteBatch;
    delete(documentRef: DocumentReference): WriteBatch;
    commit(): Promise<void>;
  }

  export interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
  }

  export interface FieldValue {}

  export interface AggregateField<T> {
    aggregateType: string;
  }

  export interface AggregateQuerySnapshot<T> {
    data(): T;
  }

  export function getFirestore(app?: FirebaseApp): Firestore;
  export function collection(firestore: Firestore, path: string): CollectionReference<DocumentData>;
  export function doc(firestore: Firestore, path: string, ...pathSegments: string[]): DocumentReference<DocumentData>;
  export function getDoc<T = DocumentData>(reference: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
  export function getDocs<T = DocumentData>(query: Query<T>): Promise<QuerySnapshot<T>>;
  export function setDoc<T>(reference: DocumentReference<T>, data: T): Promise<void>;
  export function setDoc<T>(reference: DocumentReference<T>, data: Partial<T>, options: { merge: boolean }): Promise<void>;
  export function addDoc<T>(reference: CollectionReference<T>, data: T): Promise<DocumentReference<T>>;
  export function updateDoc<T>(reference: DocumentReference<T>, data: Partial<T>): Promise<void>;
  export function deleteDoc(reference: DocumentReference): Promise<void>;
  export function query<T>(query: Query<T>, ...queryConstraints: any[]): Query<T>;
  export function where(fieldPath: string, opStr: any, value: any): any;
  export function orderBy(fieldPath: string, directionStr?: 'asc' | 'desc'): any;
  export function limit(limit: number): any;
  export function serverTimestamp(): FieldValue;
  export function writeBatch(firestore: Firestore): WriteBatch;
  export function onSnapshot<T>(
    reference: DocumentReference<T> | Query<T>,
    observer: {
      next?: (snapshot: DocumentSnapshot<T> | QuerySnapshot<T>) => void;
      error?: (error: Error) => void;
      complete?: () => void;
    }
  ): () => void;
  export function getCountFromServer<T>(query: Query<T>): Promise<AggregateQuerySnapshot<{ count: AggregateField<number> }>>;
  export function count(): AggregateField<number>;
}

declare module 'firebase/storage' {
  import { FirebaseApp } from 'firebase/app';

  export interface FirebaseStorage {}

  export interface StorageReference {
    bucket: string;
    fullPath: string;
    name: string;
  }

  export interface UploadTask {
    snapshot: UploadTaskSnapshot;
    on(
      event: string,
      nextOrObserver?: (snapshot: UploadTaskSnapshot) => void,
      error?: (error: any) => void,
      complete?: () => void
    ): () => void;
  }

  export interface UploadTaskSnapshot {
    bytesTransferred: number;
    totalBytes: number;
    state: string;
    metadata: any;
    task: UploadTask;
    ref: StorageReference;
  }

  export function getStorage(app?: FirebaseApp): FirebaseStorage;
  export function ref(storage: FirebaseStorage, path?: string): StorageReference;
  export function uploadBytesResumable(ref: StorageReference, data: Blob | Uint8Array | ArrayBuffer): UploadTask;
  export function getDownloadURL(ref: StorageReference): Promise<string>;
}
