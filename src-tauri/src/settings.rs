//! Persistencia de configuración de clawdesk (path de OpenClaw, tema, etc.)

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Configuración persistida de clawdesk
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ClawdeskSettings {
    /// Path personalizado del ejecutable openclaw (opcional)
    pub openclaw_path: Option<String>,
    /// Tema: "light" | "dark"
    pub theme: Option<String>,
}

/// Obtiene el directorio de config de clawdesk (~/.config/clawdesk o equivalente)
pub fn config_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("clawdesk"))
}

/// Ruta del archivo de settings
fn settings_path() -> Option<PathBuf> {
    config_dir().map(|d| d.join("settings.json"))
}

/// Carga los settings desde disco
pub fn load_settings() -> ClawdeskSettings {
    let path = match settings_path() {
        Some(p) => p,
        None => return ClawdeskSettings::default(),
    };

    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return ClawdeskSettings::default(),
    };

    serde_json::from_str(&content).unwrap_or_default()
}

/// Guarda los settings en disco
pub fn save_settings(settings: &ClawdeskSettings) -> Result<(), String> {
    let dir = config_dir().ok_or("No se pudo obtener directorio de config")?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let path = dir.join("settings.json");
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}
