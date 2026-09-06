import { isUserVerified, observeAuthState } from "./auth.js";
import { deleteReceipt, isExpiringSoon, subscribeToReceipts } from "./vault.js";
import { initPageShell } from "./page-common.js";

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
  const items = state.receipts;
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
observeAuthState((user) => { const verifiedUser = user && isUserVerified(user) ? user : null; if (!verifiedUser) { window.location.replace("index.html?auth=required"); return; } state.user = verifiedUser; state.unsubscribe(); state.unsubscribe = subscribeToReceipts(verifiedUser, (receipts) => { state.receipts = receipts; render(); }); render(); });