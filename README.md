# clawdesk

UI de escritorio para OpenClaw: configurar y gestionar OpenClaw de forma visual e intuitiva.

## Requisitos

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (para compilar la app)
- [OpenClaw](https://openclaw.ai/) instalado (opcional: la UI puede ayudar a configurarlo)

## Desarrollo

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run build
npm run tauri build
```

Los binarios se generan en `src-tauri/target/release/`.

## Funcionalidades

- **Estado**: Ver si OpenClaw está instalado, versión, config, estado del gateway
- **Configurar IA**: Añadir API key de OpenAI y seleccionar modelo
- **Probar chat**: Enviar mensajes al agente desde la UI
- **Tema**: Toggle light/dark (color primario: rojo OpenClaw #FF5A2D)
- **Path configurable**: Si openclaw no está en PATH, configurar la ruta manualmente

## Plataformas

Linux, macOS, Windows.
