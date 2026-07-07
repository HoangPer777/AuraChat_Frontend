import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBNx62tJiEdbtmnsXf2NaXC3W2UIeoPvw0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'aura-chat-633d9.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aura-chat-633d9',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'aura-chat-633d9.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '872405129346',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:872405129346:web:b27390c38e8284a955fc9b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-GR3KC1BHES',
}

const app = initializeApp(firebaseConfig)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
const auth = getAuth(app)

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('Firebase auth persistence failed:', error)
  })
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
const facebookProvider = new FacebookAuthProvider()

let messagingPromise = null

export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null
  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) => (supported ? getMessaging(app) : null))
  }
  return messagingPromise
}

export {
  app,
  analytics,
  auth,
  googleProvider,
  facebookProvider,
  firebaseConfig,
}
