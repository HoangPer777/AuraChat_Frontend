import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNx62tJiEdbtmnsXf2NaXC3W2UIeoPvw0",
  authDomain: "aura-chat-633d9.firebaseapp.com",
  projectId: "aura-chat-633d9",
  storageBucket: "aura-chat-633d9.firebasestorage.app",
  messagingSenderId: "872405129346",
  appId: "1:872405129346:web:b27390c38e8284a955fc9b",
  measurementId: "G-GR3KC1BHES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);

// Initialize Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { app, analytics, auth, googleProvider, facebookProvider };
