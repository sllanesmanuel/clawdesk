/**
 * Formulario para configurar OpenAI (API key y modelo).
 */

import { invoke } from "@tauri-apps/api/core";
import { invalidate as invalidateStatusCache } from "../statusCache";

const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4"];

export function renderOpenAIConfig(container: HTMLElement): void {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>Configurar IA</h2>
    <div id="openai-config-status"></div>
    <div class="form-group" id="openai-form">
      <label>API Key (OpenAI)</label>
      <input type="password" id="openai-api-key" placeholder="sk-..." />
    </div>
    <div class="form-group">
      <label>Modelo</label>
      <select id="openai-model">
        ${MODELS.map((m) => `<option value="${m}">${m}</option>`).join("")}
      </select>
    </div>
    <button class="btn btn-primary" id="save-openai-btn">Guardar y validar</button>
    <div id="openai-error" class="error-msg" style="display:none;"></div>
  `;
  container.appendChild(card);

  const statusEl = card.querySelector("#openai-config-status")!;
  const formEl = card.querySelector("#openai-form") as HTMLElement;
  const apiKeyInput = card.querySelector("#openai-api-key") as HTMLInputElement;
  const modelSelect = card.querySelector("#openai-model") as HTMLSelectElement;
  const saveBtn = card.querySelector("#save-openai-btn")!;
  const errorEl = card.querySelector("#openai-error") as HTMLElement;

  const loadConfig = async () => {
    try {
      const cfg = (await invoke("read_openclaw_config")) as {
        env?: Record<string, string>;
        agents?: { defaults?: { model?: { primary?: string } } };
      };
      const hasKey = cfg.env?.OPENAI_API_KEY && cfg.env.OPENAI_API_KEY.length > 0;
      const primary = cfg.agents?.defaults?.model?.primary;

      if (hasKey) {
        statusEl.innerHTML = `<span class="badge">Configurado</span> <button class="btn btn-secondary" id="edit-openai-btn" style="margin-left:0.5rem;">Editar</button>`;
        formEl.style.display = "none";
        apiKeyInput.placeholder = "••••••••";
        statusEl.querySelector("#edit-openai-btn")?.addEventListener("click", () => {
          formEl.style.display = "block";
          statusEl.innerHTML = "";
        });
      } else {
        statusEl.innerHTML = "";
        formEl.style.display = "block";
      }

      if (primary?.startsWith("openai/")) {
        const model = primary.replace("openai/", "");
        if (MODELS.includes(model)) {
          modelSelect.value = model;
        }
      }
    } catch {
      statusEl.innerHTML = "";
      formEl.style.display = "block";
    }
  };

  saveBtn.addEventListener("click", async () => {
    errorEl.style.display = "none";
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    if (!apiKey) {
      errorEl.textContent = "Ingresa la API key";
      errorEl.style.display = "block";
      return;
    }
    saveBtn.textContent = "Guardando...";
    try {
      await invoke("write_openai_config", {
        apiKey,
        model,
      });
      invalidateStatusCache();
      formEl.style.display = "none";
      statusEl.innerHTML = `<span class="badge">Configurado</span> <button class="btn btn-secondary" id="edit-openai-btn" style="margin-left:0.5rem;">Editar</button>`;
      statusEl.querySelector("#edit-openai-btn")?.addEventListener("click", () => {
        formEl.style.display = "block";
        statusEl.innerHTML = "";
      });
    } catch (e) {
      errorEl.textContent = String(e);
      errorEl.style.display = "block";
    } finally {
      saveBtn.textContent = "Guardar y validar";
    }
  });

  loadConfig();
}
