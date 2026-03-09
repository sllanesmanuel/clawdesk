/**
 * Toggle light/dark en el header.
 * Persiste la preferencia via Tauri command.
 */

import { invoke } from "@tauri-apps/api/core";

const LIGHT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
const DARK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

export function renderThemeToggle(container: HTMLElement): void {
  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  btn.setAttribute("aria-label", "Cambiar tema");
  btn.innerHTML = `${LIGHT_ICON}<span>Light</span>`;

  const updateUI = (theme: string) => {
    const isDark = theme === "dark";
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "");
    btn.innerHTML = isDark
      ? `${DARK_ICON}<span>Dark</span>`
      : `${LIGHT_ICON}<span>Light</span>`;
  };

  const loadAndApply = async () => {
    try {
      const theme = (await invoke("get_theme")) as string;
      if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      updateUI(theme === "dark" ? "dark" : "light");
    } catch {
      updateUI("light");
    }
  };

  btn.addEventListener("click", async () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    try {
      await invoke("set_theme", { theme: next });
      updateUI(next);
    } catch (e) {
      console.error("Error al guardar tema:", e);
      updateUI(next);
    }
  });

  container.appendChild(btn);
  loadAndApply();
}
