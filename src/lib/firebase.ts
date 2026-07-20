import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpkRh4k5CXHvP_X9chmAgHLQhLATRY16I",
  authDomain: "mountaintour-af246.firebaseapp.com",
  projectId: "mountaintour-af246",
  storageBucket: "mountaintour-af246.firebasestorage.app",
  messagingSenderId: "28916197268",
  appId: "1:28916197268:web:69fd35232fc0e91cb71181"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use memoryLocalCache (no IndexedDB needed) so it works on both server and client.
// initializeFirestore throws if called twice on the same app, so we catch that.
export let db;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch {
  db = getFirestore(app);
}
