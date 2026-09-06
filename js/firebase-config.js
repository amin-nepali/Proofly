const firebaseConfig = window.PROOFLY_FIREBASE_CONFIG || {
  apiKey: "AIzaSyAQoRWPviHruV0iARYRgh-cCPLRVxW_lAs",
  authDomain: "proofly-33aca.firebaseapp.com",
  projectId: "proofly-33aca",
  storageBucket: "proofly-33aca.firebasestorage.app",
  messagingSenderId: "427746923719",
  appId: "1:427746923719:web:7c31791df87cc228335ae2",
  measurementId: "G-K6T6C82Y5R"
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const firebaseAvailable = Boolean(window.firebase && hasFirebaseConfig);

let auth = null;
let db = null;
let analytics = null;

if (firebaseAvailable) {
  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);
  auth = window.firebase.auth(app);
  db = window.firebase.firestore(app);
  if (window.firebase.analytics) analytics = window.firebase.analytics(app);
}

export { analytics, auth, db, firebaseAvailable, firebaseConfig };