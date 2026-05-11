import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCrm-3_PDrM_FHtVh1vQKRA9MBSCG75AwI",
  authDomain: "mbl-theft.firebaseapp.com",
  projectId: "mbl-theft",
  storageBucket: "mbl-theft.firebasestorage.app",
  messagingSenderId: "273386982412",
  appId: "1:273386982412:web:867655be3c3c20842d3229",
  measurementId: "G-XS6GEY2QL5",
};

// Initialize Firebase only once (Next.js hot reload safe)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Analytics — only initialise in browser (SSR-safe)
const initAnalytics = async () => {
  if (await isSupported()) return getAnalytics(app);
};

export { app, auth, googleProvider, initAnalytics };
