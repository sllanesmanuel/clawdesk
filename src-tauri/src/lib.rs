//! clawdesk - OpenClaw Manager UI
//!
//! App de escritorio para configurar y gestionar OpenClaw de forma visual.

mod config;
mod openclaw;
mod settings;

use config::OpenClawConfig;
use serde::{Deserialize, Serialize};
use settings::{load_settings, save_settings};

/// Resultado del estado de instalación de OpenClaw
#[derive(Debug, Serialize, Deserialize)]
pub struct InstallationStatus {
    pub installed: bool,
    pub ready: bool,
    pub version: Option<String>,
    pub config_path: Option<String>,
    pub gateway_running: bool,
    pub model_configured: bool,
}

/// Obtiene el path de openclaw (detectado y/o configurado)
#[tauri::command]
fn get_openclaw_path() -> openclaw::OpenClawPathResult {
    openclaw::detect_openclaw_path()
}

/// Configura el path personalizado de openclaw
#[tauri::command]
fn set_openclaw_path(path: String) -> Result<(), String> {
    let mut settings = load_settings();
    settings.openclaw_path = Some(path);
    save_settings(&settings)
}

/// Obtiene el estado de instalación de OpenClaw
#[tauri::command]
fn get_installation_status() -> InstallationStatus {
    let _path_result = openclaw::detect_openclaw_path();

    // Verificar si openclaw está instalado y responde
    let version = openclaw::run_openclaw(&["--version"])
        .ok()
        .map(|(out, _)| out.trim().to_string());

    let installed = version.is_some();

    if !installed {
        return InstallationStatus {
            installed: false,
            ready: false,
            version: None,
            config_path: None,
            gateway_running: false,
            model_configured: false,
        };
    }

    // Obtener ruta del config
    let config_path = openclaw::run_openclaw(&["config", "file"])
        .ok()
        .map(|(out, _)| out.trim().to_string());

    // Validar config
    let config_valid = openclaw::run_openclaw(&["config", "validate"]).is_ok();

    // Leer config para verificar modelo y credenciales
    let (model_configured, has_openai_key) = if config_valid {
        match config::read_openclaw_config() {
            Ok(cfg) => {
                let model = cfg
                    .agents
                    .defaults
                    .model
                    .primary
                    .filter(|m| !m.is_empty())
                    .or_else(|| {
                        cfg.agent
                            .as_ref()
                            .and_then(|a| a.model.primary.clone())
                            .filter(|m| !m.is_empty())
                    });
                let key = cfg.env.get("OPENAI_API_KEY").map(|s| !s.is_empty());
                (model.is_some(), key.unwrap_or(false))
            }
            Err(_) => (false, false),
        }
    } else {
        (false, false)
    };

    let ready = config_valid && (model_configured || has_openai_key);

    // Estado del gateway
    let gateway_running = openclaw::run_openclaw(&["gateway", "status"]).is_ok()
        || openclaw::run_openclaw(&["health"]).is_ok();

    InstallationStatus {
        installed,
        ready,
        version,
        config_path,
        gateway_running,
        model_configured: model_configured || has_openai_key,
    }
}

/// Lee el config de OpenClaw
#[tauri::command]
fn read_openclaw_config() -> Result<OpenClawConfig, String> {
    config::read_openclaw_config()
}

/// Escribe la config de OpenAI (API key + modelo)
#[tauri::command]
fn write_openai_config(api_key: String, model: String) -> Result<(), String> {
    config::write_openai_config(&api_key, &model)
}

/// Intenta iniciar el gateway si no está corriendo
#[tauri::command]
fn ensure_gateway_running() -> Result<bool, String> {
    // Verificar si ya corre
    if openclaw::run_openclaw(&["gateway", "status"]).is_ok() {
        return Ok(true);
    }
    // Intentar iniciar (gateway start instala/inicia el servicio)
    let _ = openclaw::run_openclaw(&["gateway", "start"]);
    Ok(openclaw::run_openclaw(&["gateway", "status"]).is_ok())
}

/// Envía un mensaje al agente y devuelve la respuesta
#[tauri::command]
fn send_chat_message(message: String) -> Result<String, String> {
    let (stdout, stderr) = openclaw::run_openclaw(&["agent", "--message", &message])?;
    if !stderr.is_empty() && stdout.is_empty() {
        return Err(stderr);
    }
    Ok(stdout)
}

/// Obtiene el tema guardado
#[tauri::command]
fn get_theme() -> String {
    load_settings()
        .theme
        .unwrap_or_else(|| "system".to_string())
}

/// Guarda el tema (light | dark | system)
#[tauri::command]
fn set_theme(theme: String) -> Result<(), String> {
    let mut settings = load_settings();
    settings.theme = Some(theme);
    save_settings(&settings)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_openclaw_path,
            set_openclaw_path,
            get_installation_status,
            read_openclaw_config,
            write_openai_config,
            ensure_gateway_running,
            send_chat_message,
            get_theme,
            set_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error mientras se ejecutaba la aplicación tauri");
}
