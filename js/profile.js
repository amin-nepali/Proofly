import { db, firebaseAvailable } from "./firebase-config.js";

const LOCAL_PROFILE_KEY = "proofly-profile";

function normalizeProfile(profile = {}, user = null) {
  return {
    displayName: String(profile.displayName || user?.displayName || user?.email?.split("@")[0] || "Proofly user").trim(),
    email: user?.email || profile.email || "",
    photoData: String(profile.photoData || ""),
    updatedAt: profile.updatedAt || new Date().toISOString()
  };
}

export async function getProfile(user) {
  if (!user) return null;
  if (!firebaseAvailable || user.isLocal) {
    try { return normalizeProfile(JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY) || "{}"), user); } catch { return normalizeProfile({}, user); }
  }
  const snapshot = await db.collection("users").doc(user.uid).get();
  return normalizeProfile(snapshot.exists ? snapshot.data() : {}, user);
}

export async function saveProfile(user, profile) {
  const normalized = normalizeProfile(profile, user);
  if (!firebaseAvailable || user.isLocal) {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(normalized));
    return normalized;
  }
  await db.collection("users").doc(user.uid).set(normalized, { merge: true });
  return normalized;
}

export async function compressProfileImage(file) {
  if (!file?.type.startsWith("image/")) throw new Error("Choose an image file.");
  const image = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = reader.result; }; reader.onerror = reject; reader.readAsDataURL(file); });
  const size = 256;
  const scale = Math.min(1, size / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .72);
}