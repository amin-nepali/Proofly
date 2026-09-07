import { auth, firebaseAvailable } from "./firebase-config.js";

const googleProvider = firebaseAvailable ? new window.firebase.auth.GoogleAuthProvider() : null;

function getAuthErrorMessage(error) {
  const messages = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-not-found": "No account was found for that email.",
    "auth/user-disabled": "This account has been disabled. Contact support for help.",
    "auth/wrong-password": "That password is not correct.",
    "auth/invalid-login-credentials": "Those sign-in details are not valid. Please try again.",
    "auth/email-already-in-use": "An account already exists for that email.",
    "auth/weak-password": "Use a password with at least six characters.",
    "auth/popup-closed-by-user": "The sign-in window was closed.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Please try again.",
    "auth/unauthorized-domain": "This site is not authorized for Google sign-in. Add its domain in Firebase Authentication settings.",
    "auth/operation-not-supported-in-this-environment": "Google sign-in is not supported in this browser context.",
    "auth/network-request-failed": "Network connection failed. Check your connection and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled yet.",
    "auth/invalid-credential": "Those sign-in details are not valid. Please try again.",
    "auth/redirect-cancelled-by-user": "Google sign-in was cancelled. Please try again.",
    "auth/web-storage-unsupported": "This browser is blocking sign-in storage. Open Proofly in Safari or Chrome and try again.",
    "auth/internal-error": "Google sign-in could not be completed. Please try again.",
    "auth/email-not-verified": "Verify your email address before signing in.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again."
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

async function setAuthPersistence() {
  try {
    await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
  } catch (error) {
    if (error?.code !== "auth/web-storage-unsupported") throw error;
    await auth.setPersistence(window.firebase.auth.Auth.Persistence.SESSION);
  }
}

export async function signInWithGoogle() {
  if (!firebaseAvailable) {
    return saveLocalUser({ uid: "local-demo-user", displayName: "Amin", email: "demo@proofly.app", isLocal: true });
  }
  await setAuthPersistence();
  const isMobileBrowser = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const isInstalledPwa = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (isMobileBrowser || isInstalledPwa) {
    await auth.signInWithRedirect(googleProvider);
    return null;
  }
  try {
    const result = await auth.signInWithPopup(googleProvider);
    return result.user;
  } catch (error) {
    if (["auth/popup-blocked", "auth/popup-timeout", "auth/cancelled-popup-request", "auth/popup-closed-by-user"].includes(error?.code)) {
      await auth.signInWithRedirect(googleProvider);
      return null;
    }
    throw error;
  }
}

export async function getGoogleRedirectResult() {
  if (!firebaseAvailable) return null;
  const result = await auth.getRedirectResult();
  return result?.user || null;
}

export async function signInWithEmail(email, password, createAccount = false) {
  if (!firebaseAvailable) {
    return saveLocalUser({ uid: "local-demo-user", displayName: email.split("@")[0], email, isLocal: true });
  }
  await setAuthPersistence();
  const result = createAccount
    ? await auth.createUserWithEmailAndPassword(email, password)
    : await auth.signInWithEmailAndPassword(email, password);
  await result.user.reload();
  if (createAccount) {
    await result.user.sendEmailVerification();
    return { user: result.user, verificationRequired: true };
  }
  if (!result.user.emailVerified) {
    await auth.signOut();
    const error = new Error("Email verification required.");
    error.code = "auth/email-not-verified";
    throw error;
  }
  return result.user;
}

export function isEmailPasswordUser(user) {
  return Boolean(user?.providerData?.some((provider) => provider.providerId === "password"));
}

export function isUserVerified(user) {
  return Boolean(user?.isLocal || !isEmailPasswordUser(user) || user.emailVerified);
}

export async function resendVerificationEmail() {
  if (!firebaseAvailable || !auth.currentUser) return;
  await auth.currentUser.sendEmailVerification();
}

export async function refreshCurrentUser() {
  if (!firebaseAvailable || !auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

export async function updateUserPassword(password) {
  if (!firebaseAvailable || !auth.currentUser) throw new Error("You must be signed in.");
  await auth.currentUser.updatePassword(password);
}

export async function sendPasswordReset(email) {
  if (!firebaseAvailable) return;
  await auth.sendPasswordResetEmail(email);
}

export async function signOut() {
  if (firebaseAvailable) {
    await auth.signOut();
  } else {
    localStorage.removeItem("proofly-user");
  }
}

export { getAuthErrorMessage };