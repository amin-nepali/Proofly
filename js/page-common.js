export function initPageShell() {
  const savedTheme = localStorage.getItem("proofly-theme");
  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("is-dark", theme === "dark");
    localStorage.setItem("proofly-theme", theme);
  };
  setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  document.querySelector("[data-action='toggle-theme']")?.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}