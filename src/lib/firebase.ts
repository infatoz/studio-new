
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "sahayak-ai-n9xrq",
  appId: "1:941216237784:web:866e2ade451a0852bd2fad",
  storageBucket: "sahayak-ai-n9xrq.firebasestorage.app",
  apiKey: "AIzaSyAqaXXc3iKSMiQjY5HxsdPsGVO3akfJ7OQ",
  authDomain: "sahayak-ai-n9xrq.firebaseapp.com",
  messagingSenderId: "941216237784",
  measurementId: ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
