/**
 * Área para probar el chat con el agente de OpenClaw.
 */

import { invoke } from "@tauri-apps/api/core";

export function renderChatTest(container: HTMLElement): void {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>Probar chat</h2>
    <div class="chat-area" id="chat-output">Envía un mensaje para probar la conexión con el agente.</div>
    <div class="chat-input-row">
      <input type="text" id="chat-input" placeholder="Escribe un mensaje..." />
      <button class="btn btn-primary" id="chat-send-btn">Enviar</button>
    </div>
    <div id="chat-error" class="error-msg" style="display:none;"></div>
  `;
  container.appendChild(card);

  const output = card.querySelector("#chat-output")!;
  const input = card.querySelector("#chat-input") as HTMLInputElement;
  const sendBtn = card.querySelector("#chat-send-btn")!;
  const errorEl = card.querySelector("#chat-error") as HTMLElement;

  const append = (text: string, isUser: boolean) => {
    const div = document.createElement("div");
    div.style.marginBottom = "0.5rem";
    div.style.fontWeight = isUser ? "600" : "400";
    div.textContent = (isUser ? "Tú: " : "Agente: ") + text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  sendBtn.addEventListener("click", async () => {
    const msg = input.value.trim();
    if (!msg) return;

    errorEl.style.display = "none";
    append(msg, true);
    input.value = "";
    sendBtn.textContent = "Enviando...";
    sendBtn.setAttribute("disabled", "true");

    try {
      // Asegurar que el gateway esté corriendo
      await invoke("ensure_gateway_running");
      const response = (await invoke("send_chat_message", {
        message: msg,
      })) as string;
      append(response || "(sin respuesta)", false);
    } catch (e) {
      errorEl.textContent = String(e);
      errorEl.style.display = "block";
      append("Error: " + e, false);
    } finally {
      sendBtn.textContent = "Enviar";
      sendBtn.removeAttribute("disabled");
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      (sendBtn as HTMLButtonElement).click();
    }
  });
}
