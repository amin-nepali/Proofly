import { isUserVerified, observeAuthState } from "./auth.js";
import { addQrCode, deleteQrCode, subscribeToQrCodes } from "./vault.js";
import { initPageShell } from "./page-common.js";

const labels = { wifi: "Wi-Fi", bank: "Bank account", wallet: "Wallet", merchant: "Merchant", payment: "Payment", contact: "Contact", other: "Other" };
const state = { user: null, qrCodes: [], filter: "all", query: "", unsubscribe: () => {} };
const $ = (selector) => document.querySelector(selector);
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function toast(message) { const element = $("[data-toast]"); element.textContent = message; element.classList.add("is-visible"); window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => element.classList.remove("is-visible"), 2800); }

function draw(element, payload, size = 142) { element.replaceChildren(); if (window.QRCode && payload) new window.QRCode(element, { text: payload, width: size, height: size, colorDark: "#0f172a", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H }); }
function visibleCodes() { return state.qrCodes.filter((item) => (state.filter === "all" || item.type === state.filter) && (!state.query || `${item.name} ${item.payload}`.toLowerCase().includes(state.query))).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })); }

function render() {
  const list = $("[data-qr-list]");
  const items = visibleCodes();
  list.replaceChildren();
  items.forEach((qrCode) => {
    const card = document.createElement("article");
    card.className = "saved-qr-card";
    card.innerHTML = `<div class="saved-qr-code" data-code-preview></div><div class="saved-qr-content"><div class="saved-qr-topline"><span class="qr-type-pill">${escapeHtml(labels[qrCode.type] || labels.other)}</span><button class="more-button" type="button" data-delete-qr="${escapeHtml(qrCode.id)}" aria-label="Delete ${escapeHtml(qrCode.name)}">&#8942;</button></div><h3>${escapeHtml(qrCode.name)}</h3><p>${escapeHtml(qrCode.payload)}</p><div class="saved-qr-actions"><button class="button button-primary" type="button" data-download-qr="${escapeHtml(qrCode.id)}">Download</button><button class="text-button" type="button" data-copy-qr="${escapeHtml(qrCode.id)}">Copy payload</button></div></div>`;
    draw(card.querySelector("[data-code-preview]"), qrCode.payload, 142);
    list.append(card);
  });
  $("[data-empty]").hidden = items.length > 0;
}

function updateGenerator() { draw($("[data-generator-preview]"), $("[data-qr-payload]").value.trim(), 190); }
$("[data-qr-payload]").addEventListener("input", updateGenerator);
$("[data-qr-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.user) { toast("Sign in from the home page to save QR codes."); return; }
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (!data.payload.trim()) { toast("Add the information you want inside the QR code."); return; }
  const saved = await addQrCode(state.user, data);
  state.qrCodes = [saved, ...state.qrCodes.filter((item) => item.id !== saved.id)];
  event.currentTarget.reset(); updateGenerator(); render(); toast("QR code created and saved.");
});
$("[data-search]").addEventListener("input", (event) => { state.query = event.target.value.toLowerCase().trim(); render(); });
document.addEventListener("click", async (event) => {
  const filter = event.target.closest("[data-qr-filter]");
  if (filter) { state.filter = filter.dataset.qrFilter; document.querySelectorAll("[data-qr-filter]").forEach((button) => button.classList.toggle("is-active", button === filter)); render(); return; }
  const copy = event.target.closest("[data-copy-qr]");
  if (copy) { const item = state.qrCodes.find((qrCode) => qrCode.id === copy.dataset.copyQr); if (item) { await navigator.clipboard?.writeText(item.payload); toast("Payload copied."); } return; }
  const download = event.target.closest("[data-download-qr]");
  if (download) { const item = state.qrCodes.find((qrCode) => qrCode.id === download.dataset.downloadQr); const card = download.closest(".saved-qr-card"); const canvas = card?.querySelector("canvas"); if (item && canvas) { const link = document.createElement("a"); link.download = `${item.name}.png`; link.href = canvas.toDataURL("image/png"); link.click(); } return; }
  const remove = event.target.closest("[data-delete-qr]");
  if (remove && state.user && window.confirm("Delete this QR code?")) { await deleteQrCode(state.user, remove.dataset.deleteQr); state.qrCodes = state.qrCodes.filter((item) => item.id !== remove.dataset.deleteQr); render(); toast("QR code deleted."); }
});
initPageShell();
observeAuthState((user) => { const verifiedUser = user && isUserVerified(user) ? user : null; if (!verifiedUser) { window.location.replace("index.html?auth=required"); return; } state.user = verifiedUser; state.unsubscribe(); state.unsubscribe = subscribeToQrCodes(verifiedUser, (qrCodes) => { state.qrCodes = qrCodes; render(); }); render(); });