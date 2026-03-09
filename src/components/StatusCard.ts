/**
 * Muestra el estado de instalación de OpenClaw.
 */

import { invoke } from "@tauri-apps/api/core";

export interface InstallationStatus {
  installed: boolean;
  ready: boolean;
  version?: string;
  config_path?: string;
  gateway_running: boolean;
  model_configured: boolean;
}

export function renderStatusCard(container: HTMLElement): void {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>Estado de OpenClaw</h2>
    <div id="status-content">Cargando...</div>
    <div class="path-config" id="path-config" style="display:none;">
      <label>Path de openclaw:</label>
      <input type="text" id="openclaw-path-input" placeholder="/ruta/a/openclaw" />
      <button class="btn btn-secondary" id="save-path-btn">Guardar path</button>
    </div>
    <button class="btn btn-secondary" id="toggle-path-btn" style="margin-top:0.5rem;">Configurar path de OpenClaw</button>
  `;
  container.appendChild(card);

  const content = card.querySelector("#status-content")!;
  const pathConfig = card.querySelector("#path-config") as HTMLElement;
  const pathInput = card.querySelector("#openclaw-path-input") as HTMLInputElement;
  const savePathBtn = card.querySelector("#save-path-btn")!;
  const togglePathBtn = card.querySelector("#toggle-path-btn")!;

  const refresh = async () => {
    content.textContent = "Cargando...";
    try {
      const status = (await invoke("get_installation_status")) as InstallationStatus;
      renderStatus(status, content);
    } catch (e) {
      content.innerHTML = `<span class="error-msg">Error: ${e}</span>`;
    }
  };

  togglePathBtn.addEventListener("click", () => {
    const visible = pathConfig.style.display !== "none";
    pathConfig.style.display = visible ? "none" : "block";
    if (!visible) {
      invoke("get_openclaw_path").then((r: unknown) => {
        const res = r as { resolved: string };
        pathInput.value = res.resolved;
      });
    }
  });

  savePathBtn.addEventListener("click", async () => {
    const path = pathInput.value.trim();
    if (!path) return;
    try {
      await invoke("set_openclaw_path", { path });
      pathConfig.style.display = "none";
      refresh();
    } catch (e) {
      alert("Error: " + e);
    }
  });

  refresh();
}

function renderStatus(
  s: InstallationStatus,
  el: Element
): void {
  const items: string[] = [];

  items.push(
    `<div class="status-row"><span class="status-dot ${s.installed ? "ok" : "error"}"></span>OpenClaw: ${s.installed ? "Instalado" : "No detectado"}</div>`
  );
  if (s.version) {
    items.push(
      `<div class="status-row"><span class="status-dot ok"></span>Versión: ${s.version}</div>`
    );
  }
  if (s.config_path) {
    items.push(
      `<div class="status-row"><span class="status-dot ok"></span>Config: ${s.config_path}</div>`
    );
  }
  items.push(
    `<div class="status-row"><span class="status-dot ${s.gateway_running ? "ok" : "warn"}"></span>Gateway: ${s.gateway_running ? "Corriendo" : "Parado"}</div>`
  );
  items.push(
    `<div class="status-row"><span class="status-dot ${s.model_configured ? "ok" : "warn"}"></span>Modelo: ${s.model_configured ? "Configurado" : "Sin configurar"}</div>`
  );

  el.innerHTML = items.join("");
}
