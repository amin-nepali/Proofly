import { auth, firebaseAvailable } from "./firebase-config.js";

const googleProvider = firebaseAvailable ? new window.firebase.auth.GoogleAuthProvider() : null;

function getAuthErrorMessage(error) {
  const messages = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-not-found": "No account was found for that email.",
    "auth/wrong-password": "That password is not correct.",
    "auth/email-already-in-use": "An account already exists for that email.",
    "auth/weak-password": "Use a password with at least six characters.",
    "auth/popup-closed-by-user": "The sign-in window was closed.",
    "auth/operation-not-allowed": "This sign-in method is not enabled yet."
  };
  return messages[error?.code] || "We could not sign you in. Please try again.";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("proofly-user") || "null");
  } catch {
    return null;
  }
}

function saveLocalUser(user) {
  localStorage.setItem("proofly-user", JSON.stringify(user));
  return user;
}

export function observeAuthState(onUserChange) {
  if (firebaseAvailable) {
    return auth.onAuthStateChanged(onUserChange);
  }
  onUserChange(getStoredUser());
  return () => {};
}

export async function signInWithGoogle() {
  if (!firebaseAvailable) {
    return saveLocalUser({ uid: "local-demo-user", displayName: "Amin", email: "demo@proofly.app", isLocal: true });
  }
  const result = await auth.signInWithPopup(googleProvider);
  return result.user;
}

export async function signInWithEmail(email, password, createAccount = false) {
  if (!firebaseAvailable) {
    return saveLocalUser({ uid: "local-demo-user", displayName: email.split("@")[0], email, isLocal: true });
  }
  const result = createAccount
    ? await auth.createUserWithEmailAndPassword(email, password)
    : await auth.signInWithEmailAndPassword(email, password);
  return result.user;
}

export async function signOut() {
  if (firebaseAvailable) {
    await auth.signOut();
  } else {
    localStorage.removeItem("proofly-user");
  }
}

export { getAuthErrorMessage };