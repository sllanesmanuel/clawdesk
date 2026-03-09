/**
 * Layout principal: navbar arriba, sidebar izquierda, contenido central.
 */

import { renderThemeToggle } from "./ThemeToggle";

export type ViewId = "dashboard" | "ia" | "chat";

export function renderLayout(
  onViewChange: (view: ViewId) => void | Promise<void>,
  initialView: ViewId = "dashboard"
): { contentArea: HTMLElement; setView: (v: ViewId) => void } {
  const app = document.getElementById("app");
  if (!app) throw new Error("App container not found");

  app.innerHTML = "";
  app.className = "app-layout";

  // Navbar (header)
  const navbar = document.createElement("nav");
  navbar.className = "navbar";
  navbar.innerHTML = `
    <div class="navbar-brand">
      <span class="navbar-logo">clawdesk</span>
    </div>
    <div class="navbar-actions" id="navbar-actions"></div>
  `;
  const actionsEl = navbar.querySelector("#navbar-actions")!;
  renderThemeToggle(actionsEl as HTMLElement);
  app.appendChild(navbar);

  // Contenedor: sidebar + content
  const container = document.createElement("div");
  container.className = "layout-container";

  // Sidebar
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.innerHTML = `
    <ul class="sidebar-menu">
      <li><a href="#" data-view="dashboard" class="sidebar-link active">
        <span class="sidebar-icon">⌂</span> Dashboard
      </a></li>
      <li><a href="#" data-view="ia" class="sidebar-link">
        <span class="sidebar-icon">⚙</span> Configurar IA
      </a></li>
      <li><a href="#" data-view="chat" class="sidebar-link">
        <span class="sidebar-icon">▸</span> Chat
      </a></li>
    </ul>
  `;

  const setActiveLink = (view: ViewId) => {
    sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
      link.classList.toggle("active", (link as HTMLElement).dataset.view === view);
    });
  };

  sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = (link as HTMLElement).dataset.view as ViewId;
      setActiveLink(view);
      void Promise.resolve(onViewChange(view));
    });
  });

  // Área de contenido
  const contentArea = document.createElement("main");
  contentArea.className = "main-content";

  container.appendChild(sidebar);
  container.appendChild(contentArea);
  app.appendChild(container);

  const setView = (view: ViewId) => {
    setActiveLink(view);
    onViewChange(view);
  };

  setActiveLink(initialView);
  return { contentArea, setView };
}
