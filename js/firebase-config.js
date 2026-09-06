const firebaseConfig = window.PROOFLY_FIREBASE_CONFIG || {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const firebaseAvailable = Boolean(window.firebase && hasFirebaseConfig);

let auth = null;
let db = null;

if (firebaseAvailable) {
  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  auth = window.firebase.auth(app);
  db = window.firebase.firestore(app);
}

export { auth, db, firebaseAvailable, firebaseConfig };