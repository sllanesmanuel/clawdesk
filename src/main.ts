/**
 * clawdesk - OpenClaw Manager
 * Punto de entrada de la UI.
 */

import { invoke } from "@tauri-apps/api/core";
import { renderLayout, type ViewId } from "./components/Layout";
import { renderDashboard } from "./components/Dashboard";
import { renderOpenAIConfig } from "./components/OpenAIConfig";
import { renderChatTest } from "./components/ChatTest";
import { getCached, setCached, type InstallationStatus } from "./statusCache";

let currentView: ViewId = "dashboard";

async function getStatus(forceRefresh = false): Promise<InstallationStatus> {
  if (!forceRefresh && getCached()) return getCached()!;
  try {
    const s = (await invoke("get_installation_status")) as InstallationStatus;
    setCached(s);
    return s;
  } catch {
    const def = { installed: false, ready: false };
    setCached(def);
    return def;
  }
}

function renderView(
  contentArea: HTMLElement,
  view: ViewId,
  status: InstallationStatus
) {
  currentView = view;
  contentArea.innerHTML = "";

  switch (view) {
    case "dashboard":
      renderDashboard(contentArea);
      break;
    case "ia":
      renderIAView(contentArea, status);
      break;
    case "chat":
      renderChatView(contentArea, status);
      break;
  }
}

function renderIAView(container: HTMLElement, status: InstallationStatus) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Configurar IA</h1>
      <p class="page-subtitle">Configura un proveedor de IA (OpenAI, etc.)</p>
    </div>
  `;
  if (!status.installed) {
    container.innerHTML += `
      <div class="card">
        <p class="text-muted">OpenClaw no está instalado. Instálalo primero desde la sección Estado.</p>
      </div>
    `;
  } else {
    renderOpenAIConfig(container);
  }
}

function renderChatView(container: HTMLElement, status: InstallationStatus) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Chat</h1>
      <p class="page-subtitle">Prueba el agente de OpenClaw</p>
    </div>
  `;
  if (!status.ready) {
    container.innerHTML += `
      <div class="card">
        <p class="text-muted">Configura OpenClaw y un proveedor de IA antes de usar el chat.</p>
      </div>
    `;
  } else {
    renderChatTest(container);
  }
}

async function init() {
  const app = document.getElementById("app");
  if (!app) return;

  const { contentArea } = renderLayout(async (view) => {
    // Usar cache para cambio instantáneo; Dashboard refresca en background
    const status = await getStatus(false);
    renderView(contentArea, view, status);
    if (view === "dashboard") {
      getStatus(true).then((s) => {
        if (currentView === "dashboard") renderView(contentArea, "dashboard", s);
      });
    }
  }, "dashboard");

  const status = await getStatus(true);
  renderView(contentArea, "dashboard", status);
}

window.addEventListener("DOMContentLoaded", init);
