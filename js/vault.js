import { db, firebaseAvailable } from "./firebase-config.js";

const MAX_FREE_RECEIPTS = 15;
const LOCAL_RECEIPTS_KEY = "proofly-receipts";
const LOCAL_QR_CODES_KEY = "proofly-qr-codes";

function normalizeReceipt(receipt) {
  return {
    id: receipt.id || crypto.randomUUID(),
    productName: String(receipt.productName || "Untitled receipt").trim(),
    category: String(receipt.category || "Other").trim(),
    amount: Number(receipt.amount) || 0,
    purchaseDate: receipt.purchaseDate || new Date().toISOString().slice(0, 10),
    warrantyUntil: receipt.warrantyUntil || "",
    imageUrl: receipt.imageUrl || "",
    notes: String(receipt.notes || "").trim(),
    createdAt: receipt.createdAt || new Date().toISOString()
  };
}

function readLocalReceipts() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_RECEIPTS_KEY) || "[]");
    return Array.isArray(value) ? value.map(normalizeReceipt) : [];
  } catch {
    return [];
  }
}

function writeLocalReceipts(receipts) {
  localStorage.setItem(LOCAL_RECEIPTS_KEY, JSON.stringify(receipts));
}

function normalizeQrCode(qrCode) {
  return {
    id: qrCode.id || crypto.randomUUID(),
    name: String(qrCode.name || "Unnamed QR code").trim(),
    type: String(qrCode.type || "other").trim().toLowerCase(),
    payload: String(qrCode.payload || "").trim(),
    createdAt: qrCode.createdAt || new Date().toISOString(),
    updatedAt: qrCode.updatedAt || new Date().toISOString()
  };
}

function readLocalQrCodes() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_QR_CODES_KEY) || "[]");
    return Array.isArray(value) ? value.map(normalizeQrCode) : [];
  } catch {
    return [];
  }
}

function writeLocalQrCodes(qrCodes) {
  localStorage.setItem(LOCAL_QR_CODES_KEY, JSON.stringify(qrCodes));
}

function receiptCollection(userId) {
  return db.collection("users").doc(userId).collection("receipts");
}

export function isExpiringSoon(receipt, referenceDate = new Date()) {
  if (!receipt.warrantyUntil) return false;
  const expiry = new Date(`${receipt.warrantyUntil}T23:59:59`);
  const days = (expiry - referenceDate) / 86400000;
  return days >= 0 && days < 30;
}

export function subscribeToReceipts(user, onChange, onError) {
  if (!user) {
    onChange([]);
    return () => {};
  }
  if (!firebaseAvailable || user.isLocal) {
    onChange(readLocalReceipts());
    return () => {};
  }
  return receiptCollection(user.uid).orderBy("purchaseDate", "desc").onSnapshot(
    (snapshot) => onChange(snapshot.docs.map((document) => normalizeReceipt({ id: document.id, ...document.data() }))),
    onError
  );
}

export async function addReceipt(user, receipt) {
  const existing = user?.isLocal || !firebaseAvailable ? readLocalReceipts() : null;
  if ((existing ? existing.length : (await receiptCollection(user.uid).limit(MAX_FREE_RECEIPTS + 1).get()).size) >= MAX_FREE_RECEIPTS) {
    const error = new Error("Free plan receipt limit reached.");
    error.code = "receipt-limit-reached";
    throw error;
  }

  const normalized = normalizeReceipt(receipt);
  if (existing) {
    writeLocalReceipts([normalized, ...existing]);
    return normalized;
  }
  const document = receiptCollection(user.uid).doc();
  const { id: ignoredId, ...firestoreReceipt } = normalized;
  await document.set(firestoreReceipt);
  return { ...normalized, id: document.id };
}

export async function updateReceipt(user, id, receipt) {
  const normalized = normalizeReceipt({ ...receipt, id });
  if (user?.isLocal || !firebaseAvailable) {
    writeLocalReceipts(readLocalReceipts().map((item) => item.id === id ? normalized : item));
    return normalized;
  }
  const { id: ignoredId, ...firestoreReceipt } = normalized;
  await receiptCollection(user.uid).doc(id).set(firestoreReceipt, { merge: true });
  return normalized;
}

export async function deleteReceipt(user, id) {
  if (user?.isLocal || !firebaseAvailable) {
    writeLocalReceipts(readLocalReceipts().filter((item) => item.id !== id));
    return;
  }
  await receiptCollection(user.uid).doc(id).delete();
}

function qrCodeCollection(userId) {
  return db.collection("users").doc(userId).collection("qrCodes");
}

export function subscribeToQrCodes(user, onChange, onError) {
  if (!user) {
    onChange([]);
    return () => {};
  }
  if (!firebaseAvailable || user.isLocal) {
    onChange(readLocalQrCodes());
    return () => {};
  }
  return qrCodeCollection(user.uid).orderBy("updatedAt", "desc").onSnapshot(
    (snapshot) => onChange(snapshot.docs.map((document) => normalizeQrCode({ id: document.id, ...document.data() }))),
    onError
  );
}

export async function addQrCode(user, qrCode) {
  const normalized = normalizeQrCode(qrCode);
  if (user?.isLocal || !firebaseAvailable) {
    const existing = readLocalQrCodes();
    writeLocalQrCodes([normalized, ...existing]);
    return normalized;
  }
  const document = qrCodeCollection(user.uid).doc();
  const { id: ignoredId, ...firestoreQrCode } = normalized;
  await document.set(firestoreQrCode);
  return { ...normalized, id: document.id };
}

export async function deleteQrCode(user, id) {
  if (user?.isLocal || !firebaseAvailable) {
    writeLocalQrCodes(readLocalQrCodes().filter((qrCode) => qrCode.id !== id));
    return;
  }
  await qrCodeCollection(user.uid).doc(id).delete();
}

export { MAX_FREE_RECEIPTS };