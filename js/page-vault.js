import { isUserVerified, observeAuthState } from "./auth.js";
import { deleteReceipt, isExpiringSoon, subscribeToReceipts } from "./vault.js";
import { initPageShell } from "./page-common.js";

const demoReceipts = [
  { id: "demo-sony", productName: "Sony WH-1000XM5", category: "Electronics", amount: 348, purchaseDate: "2025-03-14", warrantyUntil: "2026-03-14", imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80" },
  { id: "demo-dyson", productName: "Dyson V15 Detect Absolute", category: "Home", amount: 749, purchaseDate: "2024-06-02", warrantyUntil: "2026-06-27", imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=700&q=80" },
  { id: "demo-apple", productName: "MacBook Air M3", category: "Electronics", amount: 1099, purchaseDate: "2026-01-22", warrantyUntil: "2027-01-22", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80" },
  { id: "demo-patagonia", productName: "Patagonia Torrentshell", category: "Apparel", amount: 179, purchaseDate: "2026-02-08", warrantyUntil: "", imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=700&q=80" }
];
const state = { user: null, receipts: [], filter: "all", query: "", unsubscribe: () => {} };
const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0); }
function date(value) { return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "No expiry"; }

function renderCard(receipt) {
  const expiring = isExpiringSoon(receipt);
  const image = receipt.imageUrl || "icons/proofly-logo.svg";
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.category = `${receipt.category} ${receipt.warrantyUntil ? "warranty" : "other"}`.toLowerCase();
  card.dataset.name = `${receipt.productName} ${receipt.category}`.toLowerCase();
  card.innerHTML = `<div class="product-photo"><img src="${escapeHtml(image)}" alt="${escapeHtml(receipt.productName)}" loading="lazy" onerror="this.src='icons/proofly-logo.svg'"><span>${escapeHtml(receipt.category)}</span></div><div class="product-card-body"><div class="product-card-topline"><span class="category-label">${escapeHtml(receipt.category)}</span><button class="more-button" type="button" data-delete-receipt="${escapeHtml(receipt.id)}" aria-label="Delete ${escapeHtml(receipt.productName)}">&#8942;</button></div><h3>${escapeHtml(receipt.productName)}</h3><p class="product-purchase">Purchased ${date(receipt.purchaseDate)} <strong>${money(receipt.amount)}</strong></p><div class="product-status ${expiring ? "is-warning" : ""}"><i></i>${expiring ? "Expires soon" : receipt.warrantyUntil ? `Warranty until ${date(receipt.warrantyUntil)}` : "Saved to vault"}</div></div>`;
  return card;
}

function render() {
  const list = $("[data-product-list]");
  const items = state.user && state.receipts.length ? state.receipts : demoReceipts;
  const filtered = items.filter((item) => (state.filter === "all" || item.category.toLowerCase().includes(state.filter)) && (!state.query || `${item.productName} ${item.category}`.toLowerCase().includes(state.query)));
  list.replaceChildren(...filtered.map(renderCard));
  $("[data-empty]").hidden = filtered.length > 0;
  $("[data-count]").textContent = `${items.length} items`;
}

document.addEventListener("click", async (event) => {
  const filter = event.target.closest("[data-product-filter]");
  if (filter) { state.filter = filter.dataset.productFilter; document.querySelectorAll("[data-product-filter]").forEach((button) => button.classList.toggle("is-active", button === filter)); render(); return; }
  const deleteButton = event.target.closest("[data-delete-receipt]");
  if (deleteButton && state.user && window.confirm("Delete this item from your vault?")) { await deleteReceipt(state.user, deleteButton.dataset.deleteReceipt); state.receipts = state.receipts.filter((item) => item.id !== deleteButton.dataset.deleteReceipt); render(); }
});
$("[data-search]").addEventListener("input", (event) => { state.query = event.target.value.toLowerCase().trim(); render(); });
initPageShell();
observeAuthState((user) => { const verifiedUser = user && isUserVerified(user) ? user : null; state.user = verifiedUser; state.unsubscribe(); state.unsubscribe = subscribeToReceipts(verifiedUser, (receipts) => { state.receipts = receipts; render(); }); render(); });