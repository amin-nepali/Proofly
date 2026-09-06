const prooflyFirebaseConfig = {
  apiKey: "AIzaSyAQoRWPviHruV0iARYRgh-cCPLRVxW_lAs",
  authDomain: "proofly-33aca.firebaseapp.com",
  projectId: "proofly-33aca",
  storageBucket: "proofly-33aca.firebasestorage.app",
  messagingSenderId: "427746923719",
  appId: "1:427746923719:web:7c31791df87cc228335ae2",
  measurementId: "G-K6T6C82Y5R"
};

window.PROOFLY_FIREBASE_CONFIG = window.PROOFLY_FIREBASE_CONFIG || prooflyFirebaseConfig;

if (window.firebase && !window.firebase.apps.length) {
  window.firebase.initializeApp(window.PROOFLY_FIREBASE_CONFIG);
}

if (window.firebase?.analytics && window.firebase.apps.length) {
  window.firebase.analytics();
}
