export function initPageShell() {
  const savedTheme = localStorage.getItem("proofly-theme");
  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("is-dark", theme === "dark");
    localStorage.setItem("proofly-theme", theme);
  };
  setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  if (document.documentElement.dataset.themeBound) return;
  document.documentElement.dataset.themeBound = "true";
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-action='toggle-theme']")) return;
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}