// @/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyAGTTsz1XTEiTa2vvHoFbtSMwXlxUQm-6o',
  authDomain: 'mathcom-69440.firebaseapp.com',
  projectId: 'mathcom-69440',
  storageBucket: 'mathcom-69440.appspot.com',
  messagingSenderId: '1061643130922',
  appId: '1:1061643130922:web:c2a0b4412eca8212c2cb53',
  measurementId: 'G-B6RJKPFM77',
}

// Init Firebase app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

if (typeof window !== 'undefined') {
  getAnalytics(app)
}

const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)
const provider = new GoogleAuthProvider()

export { auth, db, storage, provider }
