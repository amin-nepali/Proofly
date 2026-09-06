import { getAuthErrorMessage, isUserVerified, observeAuthState, refreshCurrentUser, resendVerificationEmail, signInWithEmail, signInWithGoogle, signOut } from "./auth.js";
import { bindImageUpload, closeScanner, openScanner } from "./scanner.js";
import { addQrCode, addReceipt, deleteQrCode, deleteReceipt, isExpiringSoon, MAX_FREE_RECEIPTS, subscribeToQrCodes, subscribeToReceipts } from "./vault.js";

const state = { user: null, receipts: [], qrCodes: [], filter: "all", qrFilter: "all", query: "", authMode: "signIn", unsubscribe: () => {}, unsubscribeQr: () => {}, activeQr: null };
const demoReceipts = [
  { id: "demo-sony", productName: "Sony WH-1000XM5", category: "Electronics", amount: 348, purchaseDate: "2025-03-14", warrantyUntil: "2026-03-14" },
  { id: "demo-dyson", productName: "Dyson V15 Detect Absolute", category: "Home", amount: 749, purchaseDate: "2024-06-02", warrantyUntil: "2026-06-27" },
  { id: "demo-apple", productName: "MacBook Air M3", category: "Electronics", amount: 1099, purchaseDate: "2026-01-22", warrantyUntil: "2027-01-22" },
  { id: "demo-patagonia", productName: "Patagonia Torrentshell", category: "Apparel", amount: 179, purchaseDate: "2026-02-08", warrantyUntil: "" }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const qrTypeLabels = { wifi: "Wi-Fi", bank: "Bank account", wallet: "Wallet", merchant: "Merchant", payment: "Payment", contact: "Contact", other: "Other" };

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3500);
}

function showVerificationPanel(visible) {
  const panel = $("[data-verification-panel]");
  if (panel) panel.hidden = !visible;
}

function openModal(name) {
  const modal = $(`[data-modal="${name}"]`);
  if (modal && !modal.open) modal.showModal();
}

async function closeModal(modal) {
  if (modal?.dataset.modal === "scanner" || modal?.dataset.modal === "qr-capture") await closeScanner();
  if (modal?.open) modal.close();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return "No warranty date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function renderReceiptCard(receipt) {
  const expiring = isExpiringSoon(receipt);
  const category = receipt.category || "Other";
  const card = document.createElement("article");
  card.className = "receipt-card generated-receipt";
  card.dataset.category = `${expiring ? "expiring " : ""}${receipt.warrantyUntil ? "warranty" : "other"}`;
  card.dataset.name = `${receipt.productName} ${category}`.toLowerCase();
  card.innerHTML = `<div class="receipt-visual product-generated"><span class="product-label">PROOFLY</span><div class="generated-mark" aria-hidden="true">${receipt.productName.slice(0, 1).toUpperCase()}</div><span class="product-type">${category}</span></div><div class="receipt-body"><div class="receipt-topline"><span class="category-label">${category}</span><button class="more-button" type="button" data-delete-receipt="${receipt.id}" aria-label="Delete ${receipt.productName}" title="Delete receipt">&#8942;</button></div><h3>${receipt.productName}</h3><p class="receipt-meta">Purchased ${formatDate(receipt.purchaseDate)} <span>${formatCurrency(receipt.amount)}</span></p><div class="receipt-footer"><span class="status ${expiring ? "status-warning" : "status-active"}"><i></i> ${expiring ? "Expires soon" : receipt.warrantyUntil ? "Warranty active" : "Saved to vault"}</span><span class="receipt-date">${receipt.warrantyUntil ? `Until ${formatDate(receipt.warrantyUntil)}` : "No expiry"}</span></div></div>`;
  return card;
}

function renderReceipts() {
  const list = $("[data-receipt-list]");
  const empty = $("[data-empty-state]");
  const staticCards = $$(".receipt-card:not(.generated-receipt)", list);
  $$(".generated-receipt", list).forEach((card) => card.remove());
  const receipts = state.user ? state.receipts : [];
  receipts.forEach((receipt) => list.append(renderReceiptCard(receipt)));
  const cards = $$(".receipt-card", list);
  cards.forEach((card) => {
    const matchesFilter = state.filter === "all" || card.dataset.category.includes(state.filter);
    const matchesQuery = !state.query || card.dataset.name.includes(state.query);
    card.hidden = !(matchesFilter && matchesQuery);
  });
  const visible = cards.some((card) => !card.hidden);
  empty.hidden = visible;
  staticCards.forEach((card) => { card.hidden = Boolean(state.user) || !visible; });
  updateStats(receipts.length ? receipts : demoReceipts);
}

function updateStats(receipts) {
  const expiringCount = receipts.filter((receipt) => isExpiringSoon(receipt)).length;
  const total = $("[data-stat='total']");
  if (total) total.innerHTML = `${receipts.length} <small>receipts</small>`;
  const expiring = $(".stat-card-coral .stat-value");
  if (expiring) expiring.innerHTML = `${String(expiringCount).padStart(2, "0")} <small>warranties</small>`;
  const upgrade = $(".upgrade-banner p");
  if (upgrade) upgrade.textContent = `You are using ${receipts.length} of ${MAX_FREE_RECEIPTS} free receipt slots.`;
}

function renderAuthState(user) {
  state.user = user;
  state.receipts = user ? state.receipts : [];
  const avatar = $(".avatar-button");
  avatar.textContent = user ? (user.displayName || user.email || "A").slice(0, 2).toUpperCase() : "AM";
  avatar.setAttribute("aria-label", user ? "Sign out" : "Open account menu");
  renderReceipts();
}

function handleAuthUser(user) {
  if (user && !isUserVerified(user)) {
    state.user = null;
    showVerificationPanel(true);
    subscribeUser(null);
    renderReceipts();
    openModal("auth");
    return;
  }
  showVerificationPanel(false);
  renderAuthState(user);
  subscribeUser(user);
}

function subscribeUser(user) {
  state.unsubscribe();
  state.unsubscribeQr();
  state.unsubscribe = subscribeToReceipts(user, (receipts) => {
    state.receipts = receipts;
    renderReceipts();
  }, () => showToast("We could not sync your vault right now."));
  state.unsubscribeQr = subscribeToQrCodes(user, (qrCodes) => {
    state.qrCodes = qrCodes;
    renderQrCodes();
  }, () => showToast("We could not sync your QR vault right now."));
}

function renderQrCard(qrCode) {
  const card = document.createElement("article");
  card.className = "qr-card";
  card.dataset.qrType = qrCode.type;
  card.dataset.qrName = qrCode.name.toLowerCase();
  card.innerHTML = `<div class="qr-card-code" data-qr-preview></div><div class="qr-card-body"><div class="qr-card-topline"><span class="qr-type-pill">${escapeHtml(qrTypeLabels[qrCode.type] || qrTypeLabels.other)}</span><button class="more-button" type="button" data-delete-qr="${escapeHtml(qrCode.id)}" aria-label="Delete ${escapeHtml(qrCode.name)}" title="Delete QR code">&#8942;</button></div><h3>${escapeHtml(qrCode.name)}</h3><p>${escapeHtml(qrCode.payload.slice(0, 76))}${qrCode.payload.length > 76 ? "..." : ""}</p><button class="button button-secondary qr-open-button" type="button" data-view-qr="${escapeHtml(qrCode.id)}">Open QR <span aria-hidden="true">&#8599;</span></button></div>`;
  const preview = card.querySelector("[data-qr-preview]");
  if (window.QRCode) new window.QRCode(preview, { text: qrCode.payload, width: 116, height: 116, colorDark: "#0f172a", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
  return card;
}

function renderQrCodes() {
  const list = $("[data-qr-list]");
  const empty = $("[data-qr-empty]");
  list.replaceChildren();
  const filtered = state.qrCodes.filter((qrCode) => (state.qrFilter === "all" || qrCode.type === state.qrFilter) && (!state.query || `${qrCode.name} ${qrCode.payload}`.toLowerCase().includes(state.query)));
  filtered.forEach((qrCode) => list.append(renderQrCard(qrCode)));
  empty.hidden = filtered.length > 0;
}

function openQrView(qrCode) {
  state.activeQr = qrCode;
  $("[data-qr-view-type]").textContent = qrTypeLabels[qrCode.type] || qrTypeLabels.other;
  $("[data-qr-view-name]").textContent = qrCode.name;
  $("[data-qr-view-payload]").textContent = qrCode.payload;
  const output = $("[data-qr-output]");
  output.replaceChildren();
  if (window.QRCode) new window.QRCode(output, { text: qrCode.payload, width: 220, height: 220, colorDark: "#0f172a", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
  openModal("qr-view");
}

function resetQrCapture() {
  const form = $("[data-qr-form]");
  form.reset();
  form.hidden = true;
  $("#qr-reader").hidden = false;
}

function parseScanResult(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" ? parsed : { notes: value };
  } catch {
    return { notes: value, productName: value.slice(0, 70) };
  }
}

function createReceiptForm() {
  const dialog = document.createElement("dialog");
  dialog.className = "modal receipt-form-modal";
  dialog.dataset.modal = "receipt-form";
  dialog.innerHTML = `<button class="modal-close" type="button" data-action="close-modal" aria-label="Close receipt form">&times;</button><div class="modal-heading"><p class="eyebrow">Add to your vault</p><h2>Save a receipt</h2><p>Keep the details you will want when it matters.</p></div><form class="receipt-form" data-receipt-form><label>Product name<input name="productName" required maxlength="120" autofocus></label><div class="form-row"><label>Category<input name="category" list="receipt-categories" value="Other" required></label><label>Amount<input name="amount" type="number" min="0" step="0.01" required></label></div><div class="form-row"><label>Purchase date<input name="purchaseDate" type="date" required></label><label>Warranty ends<input name="warrantyUntil" type="date"></label></div><label>Notes<input name="notes" maxlength="240"></label><button class="button button-primary" type="submit">Save receipt <span aria-hidden="true">&#8594;</span></button></form><datalist id="receipt-categories"><option value="Electronics"><option value="Home"><option value="Apparel"><option value="Travel"><option value="Other"></datalist>`;
  document.body.append(dialog);
  return dialog;
}

async function handleReceiptSubmit(event) {
  event.preventDefault();
  if (!state.user) {
    showToast("Sign in to save receipts across your devices.");
    closeModal(event.currentTarget.closest("dialog"));
    openModal("auth");
    return;
  }
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try {
    await addReceipt(state.user, data);
    closeModal(form.closest("dialog"));
    showToast("Receipt saved to your vault.");
  } catch (error) {
    showToast(error.code === "receipt-limit-reached" ? "Your free vault is full. Upgrade to save more." : "We could not save that receipt.");
  }
}

function bindActions(receiptForm) {
  document.addEventListener("click", async (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    const { action } = actionElement.dataset;
    if (action === "open-auth") {
      if (state.user) { await signOut(); renderAuthState(null); subscribeUser(null); showToast("You have been signed out."); } else openModal("auth");
    }
    if (action === "close-modal") await closeModal(actionElement.closest("dialog"));
    if (action === "open-scanner") {
      if (!state.user) { openModal("auth"); showToast("Sign in to add a scanned receipt."); return; }
      openModal("scanner");
      await openScanner({ onResult: (result) => { closeModal($("[data-modal='scanner']")); openModal("receipt-form"); Object.assign($("[data-receipt-form] input[name='productName']"), { value: parseScanResult(result).productName || "" }); showToast(result ? "Code captured. Complete the details." : "Code could not be read."); } });
    }
    if (action === "open-qr-capture") {
      if (!state.user) { openModal("auth"); showToast("Sign in to save QR codes across your devices."); return; }
      resetQrCapture();
      openModal("qr-capture");
      await openScanner({ readerId: "qr-reader", onResult: (result) => { closeModal($("[data-modal='qr-capture']")); openModal("qr-capture"); const form = $("[data-qr-form]"); form.hidden = false; $("#qr-reader").hidden = true; $("[data-qr-form] textarea[name='payload']").value = result; $("[data-qr-form] input[name='name']").focus(); showToast("QR information captured. Give it a name."); } });
    }
    if (action === "open-receipt-form") { closeModal($("[data-modal='scanner']")); openModal("receipt-form"); }
    if (action === "enter-qr-manually") { closeScanner(); $("#qr-reader").hidden = true; $("[data-qr-form]").hidden = false; $("[data-qr-form] input[name='name']").focus(); }
    if (action === "google-sign-in") {
      try { const user = await signInWithGoogle(); if (user) { handleAuthUser(user); closeModal($("[data-modal='auth']")); showToast("Welcome to your vault."); } } catch (error) { showToast(getAuthErrorMessage(error)); }
    }
    if (action === "resend-verification") {
      try { await resendVerificationEmail(); showToast("Verification email sent again."); } catch (error) { showToast(getAuthErrorMessage(error)); }
    }
    if (action === "check-verification") {
      try { const user = await refreshCurrentUser(); if (!user || !isUserVerified(user)) { showToast("Your email is not verified yet."); } else { handleAuthUser(user); closeModal($("[data-modal='auth']")); showToast("Email verified. Welcome to your vault."); } } catch (error) { showToast(getAuthErrorMessage(error)); }
    }
    if (action === "switch-auth") {
      state.authMode = state.authMode === "signIn" ? "create" : "signIn";
      actionElement.textContent = state.authMode === "create" ? "Sign in instead" : "Create an account";
      $("[data-auth-form] .button").firstChild.textContent = state.authMode === "create" ? "Create account " : "Sign in ";
      $("[data-auth-form] input[name='password']").setAttribute("autocomplete", state.authMode === "create" ? "new-password" : "current-password");
    }
    if (action === "toggle-theme") setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    if (action === "export-vault") exportVault();
    if (action === "upgrade") showToast("Upgrade billing will be available soon.");
    if (action === "upload-receipt") document.querySelector("[data-upload-input]")?.click();
    if (action === "upload-qr") document.querySelector("[data-qr-upload-input]")?.click();
    if (action === "view-qr") { const qrCode = state.qrCodes.find((item) => item.id === actionElement.dataset.viewQr); if (qrCode) openQrView(qrCode); }
    if (action === "copy-qr") { await navigator.clipboard?.writeText(state.activeQr?.payload || ""); showToast("QR information copied."); }
    if (action === "share-qr") { if (state.activeQr && navigator.share) await navigator.share({ title: state.activeQr.name, text: state.activeQr.payload }); else { await navigator.clipboard?.writeText(state.activeQr?.payload || ""); showToast("QR information copied for sharing."); } }
    if (action === "download-qr") { const canvas = $("[data-qr-output] canvas"); if (canvas) { const link = document.createElement("a"); link.download = `${state.activeQr?.name || "proofly-qr"}.png`; link.href = canvas.toDataURL("image/png"); link.click(); showToast("QR image downloaded."); } }
  });
  document.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-receipt]");
    if (!deleteButton || !state.user) return;
    if (window.confirm("Delete this receipt from your vault?")) { await deleteReceipt(state.user, deleteButton.dataset.deleteReceipt); showToast("Receipt deleted."); }
  });
  $("[data-search]").addEventListener("input", (event) => { state.query = event.target.value.trim().toLowerCase(); renderReceipts(); });
  $("[data-search]").addEventListener("input", (event) => { state.query = event.target.value.trim().toLowerCase(); renderQrCodes(); });
  $$('[data-filter]').forEach((button) => button.addEventListener("click", () => { state.filter = button.dataset.filter; $$('[data-filter]').forEach((item) => item.classList.toggle("is-active", item === button)); renderReceipts(); }));
  $("[data-auth-form]").addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); try { const result = await signInWithEmail(data.email, data.password, state.authMode === "create"); if (result?.verificationRequired) { showVerificationPanel(true); openModal("auth"); showToast("Verify your email before entering your vault."); } else { handleAuthUser(result); closeModal($("[data-modal='auth']")); showToast(state.authMode === "create" ? "Welcome to your vault." : "Welcome back."); } } catch (error) { showToast(getAuthErrorMessage(error)); } });
  receiptForm.querySelector("[data-receipt-form]").addEventListener("submit", handleReceiptSubmit);
  $("[data-qr-form]").addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); if (!state.user) return; try { const savedQrCode = await addQrCode(state.user, data); state.qrCodes = [savedQrCode, ...state.qrCodes.filter((qrCode) => qrCode.id !== savedQrCode.id)]; renderQrCodes(); closeModal($("[data-modal='qr-capture']")); showToast("QR code saved to your vault."); } catch { showToast("We could not save that QR code."); } });
  $$('[data-qr-filter]').forEach((button) => button.addEventListener("click", () => { state.qrFilter = button.dataset.qrFilter; $$('[data-qr-filter]').forEach((item) => item.classList.toggle("is-active", item === button)); renderQrCodes(); }));
  $("[data-qr-list]").addEventListener("click", async (event) => { const viewButton = event.target.closest("[data-view-qr]"); if (viewButton) { const qrCode = state.qrCodes.find((item) => item.id === viewButton.dataset.viewQr); if (qrCode) openQrView(qrCode); return; } const deleteButton = event.target.closest("[data-delete-qr]"); if (deleteButton && window.confirm("Delete this QR code from your vault?")) { await deleteQrCode(state.user, deleteButton.dataset.deleteQr); state.qrCodes = state.qrCodes.filter((qrCode) => qrCode.id !== deleteButton.dataset.deleteQr); renderQrCodes(); showToast("QR code deleted."); } });
}

function exportVault() {
  const data = state.user ? state.receipts : demoReceipts;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "proofly-vault.json"; link.click(); URL.revokeObjectURL(link.href);
  showToast("Your vault export is ready.");
}

const receiptForm = createReceiptForm();
bindActions(receiptForm);
const uploadInput = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
uploadInput.dataset.uploadInput = "true";
document.body.append(uploadInput);
bindImageUpload(uploadInput, (result) => {
  openModal("receipt-form");
  const parsed = parseScanResult(result);
  $("[data-receipt-form] input[name='productName']").value = parsed.productName || "";
  showToast(result ? "Image scanned. Complete the details." : "No code found in that image.");
});
const qrUploadInput = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
qrUploadInput.dataset.qrUploadInput = "true";
document.body.append(qrUploadInput);
bindImageUpload(qrUploadInput, (result) => {
  openModal("qr-capture");
  $("#qr-reader").hidden = true;
  $("[data-qr-form]").hidden = false;
  $("[data-qr-form] textarea[name='payload']").value = result;
  $("[data-qr-form] input[name='name']").focus();
  showToast(result ? "QR information captured. Give it a name." : "No QR code found in that image.");
}, "qr-reader");
observeAuthState(handleAuthUser);

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("is-dark", theme === "dark");
  localStorage.setItem("proofly-theme", theme);
}

const savedTheme = localStorage.getItem("proofly-theme");
setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));