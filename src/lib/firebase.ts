
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAqaXXc3iKSMiQjY5HxsdPsGVO3akfJ7OQ",
  authDomain: "sahayak-ai-n9xrq.firebaseapp.com",
  projectId: "sahayak-ai-n9xrq",
  storageBucket: "sahayak-ai-n9xrq.firebasestorage.app",
  messagingSenderId: "941216237784",
  appId: "1:941216237784:web:866e2ade451a0852bd2fad"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app, {
  persistence: undefined,
  authDomain: firebaseConfig.authDomain
});

export { app, auth };
