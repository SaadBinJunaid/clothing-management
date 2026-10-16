import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ---------------------------------------------------------------------------
// Firebase setup
// ---------------------------------------------------------------------------
// The values below come from a local ".env" file (copy .env.example to .env and
// fill in the keys from your Firebase project). Vite replaces import.meta.env.*
// with the matching VITE_ values while the app is being served or built.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Optional: only read if you later turn on Firebase Analytics. This project
  // does not use Analytics, so an empty value here changes nothing.
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}


// True only when the two essential keys are present.
// Pages check this flag to show a "finish your Firebase setup" message instead
// of a confusing crash (Firebase throws immediately on an empty config).
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
)

// One shared, human-readable message so every screen explains the same problem
// in the same words when the .env file has not been filled in yet.
export const FIREBASE_SETUP_MESSAGE =
  'Firebase is not set up yet. Copy .env.example to .env, paste your Firebase project keys, then restart the app.'

// Firebase can only be started when it is configured, so we guard the setup.
let app = null
if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
}

// "auth" handles admin login/sessions, "db" is the Cloud Firestore database.
// Both stay null until a real .env exists; the service files handle that safely.
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
