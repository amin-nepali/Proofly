let scanner = null;
let active = false;
let currentReaderId = "reader";
let onScan = () => {};

function getScannerMessage() {
  return document.querySelector("#reader p");
}

function setScannerMessage(message) {
  const element = getScannerMessage();
  if (element) element.textContent = message;
}

function stopScanner() {
  if (!scanner || !active) return Promise.resolve();
  return scanner.stop().catch(() => {}).then(() => {
    active = false;
    const clearResult = scanner.clear();
    if (clearResult?.catch) clearResult.catch(() => {});
  });
}

export async function openScanner({ readerId = "reader", onResult } = {}) {
  currentReaderId = readerId;
  onScan = typeof onResult === "function" ? onResult : () => {};
  const reader = document.getElementById(currentReaderId);
  if (!reader) return;

  if (!window.Html5Qrcode) {
    setScannerMessage("Scanner is unavailable. Upload a receipt image instead.");
    return;
  }

  await stopScanner();
  scanner = new window.Html5Qrcode(currentReaderId);
  try {
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 140 }, aspectRatio: 1.45 },
      (decodedText) => {
        onScan(decodedText);
        stopScanner();
      },
      () => {}
    );
    active = true;
    setScannerMessage("Align the code inside the frame.");
  } catch {
    setScannerMessage("Camera access was unavailable. Upload a receipt image instead.");
  }
}

export async function closeScanner() {
  await stopScanner();
  scanner = null;
  currentReaderId = "reader";
  onScan = () => {};
}

export function bindImageUpload(input, onResult, readerId = currentReaderId) {
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file || !window.Html5Qrcode) return;
    const imageScanner = new window.Html5Qrcode(readerId);
    try {
      const decodedText = await imageScanner.scanFile(file, true);
      onResult(decodedText);
    } catch {
      onResult("");
    } finally {
      const clearResult = imageScanner.clear();
      if (clearResult?.catch) clearResult.catch(() => {});
      input.value = "";
    }
  });
}