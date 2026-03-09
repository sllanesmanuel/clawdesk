/**
 * Dashboard: vista principal con resumen y detalle de OpenClaw.
 */

import { invoke } from "@tauri-apps/api/core";
import { renderStatusCard } from "./StatusCard";

interface InstallationStatus {
  installed: boolean;
  ready: boolean;
  version?: string;
  config_path?: string;
  gateway_running: boolean;
  model_configured: boolean;
}

export function renderDashboard(container: HTMLElement): void {
  container.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p class="page-subtitle">Resumen y estado de OpenClaw</p>
    </div>
    <div class="dashboard-grid" id="dashboard-cards">
      <div class="dashboard-card loading">Cargando...</div>
    </div>
    <div id="dashboard-status" class="dashboard-status-section"></div>
  `;

  const cardsEl = container.querySelector("#dashboard-cards")!;
  const statusSection = container.querySelector("#dashboard-status")!;

  invoke("get_installation_status")
    .then((s) => {
      const st = s as InstallationStatus;
      cardsEl.innerHTML = `
        <div class="dashboard-card ${st.installed ? "ok" : "error"}">
          <div class="dashboard-card-icon">${st.installed ? "✓" : "✗"}</div>
          <h3>OpenClaw</h3>
          <p>${st.installed ? "Instalado" : "No detectado"}</p>
          ${st.version ? `<span class="dashboard-meta">v${st.version}</span>` : ""}
        </div>
        <div class="dashboard-card ${st.gateway_running ? "ok" : "warn"}">
          <div class="dashboard-card-icon">${st.gateway_running ? "●" : "○"}</div>
          <h3>Gateway</h3>
          <p>${st.gateway_running ? "Corriendo" : "Parado"}</p>
        </div>
        <div class="dashboard-card ${st.model_configured ? "ok" : "warn"}">
          <div class="dashboard-card-icon">${st.model_configured ? "✓" : "!"}</div>
          <h3>Modelo IA</h3>
          <p>${st.model_configured ? "Configurado" : "Sin configurar"}</p>
        </div>
        <div class="dashboard-card ${st.ready ? "ok" : "warn"}">
          <div class="dashboard-card-icon">${st.ready ? "✓" : "!"}</div>
          <h3>Estado</h3>
          <p>${st.ready ? "Listo" : "Configuración pendiente"}</p>
        </div>
      `;
      renderStatusCard(statusSection as HTMLElement);
    })
    .catch((e) => {
      cardsEl.innerHTML = `
        <div class="dashboard-card error">
          <div class="dashboard-card-icon">✗</div>
          <h3>Error</h3>
          <p>${e}</p>
        </div>
      `;
      renderStatusCard(statusSection as HTMLElement);
    });
}
