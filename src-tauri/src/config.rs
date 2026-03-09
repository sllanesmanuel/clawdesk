//! Lectura y escritura del config de OpenClaw (openclaw.json)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

use crate::openclaw;

/// Config de OpenClaw (estructura parcial para lo que necesitamos)
/// Soporta tanto agents.defaults (nuevo) como agent (legacy)
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct OpenClawConfig {
    #[serde(default)]
    pub env: HashMap<String, String>,
    #[serde(default)]
    pub agents: AgentsConfig,
    /// Legacy: algunos configs usan agent en singular
    #[serde(default)]
    pub agent: Option<AgentsDefaults>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct AgentsConfig {
    #[serde(default)]
    pub defaults: AgentsDefaults,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct AgentsDefaults {
    #[serde(default)]
    pub model: ModelConfig,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ModelConfig {
    pub primary: Option<String>,
}

/// Obtiene la ruta del archivo de config activo.
/// Ejecuta openclaw config file y extrae solo la línea con el path.
/// Fallback: ~/.openclaw/openclaw.json
pub fn get_config_path() -> Result<String, String> {
    let default_path = dirs::home_dir()
        .map(|h| h.join(".openclaw").join("openclaw.json"))
        .and_then(|p| p.to_str().map(String::from))
        .unwrap_or_else(|| "~/.openclaw/openclaw.json".to_string());

    let (stdout, _) = match openclaw::run_openclaw(&["config", "file"]) {
        Ok(out) => out,
        Err(_) => return Ok(expand_home_path(&default_path)),
    };

    let path = stdout
        .lines()
        .map(str::trim)
        .filter(|s| !s.is_empty() && !s.starts_with("channels.") && !s.starts_with("Doctor"))
        .find(|s| (s.contains('/') || s.contains('\\')) && (s.ends_with(".json") || s.contains("openclaw")))
        .or_else(|| {
            stdout
                .lines()
                .map(str::trim)
                .filter(|s| !s.is_empty() && s.len() < 512)
                .find(|s| s.contains('/') || s.contains('\\'))
        })
        .map(String::from)
        .unwrap_or_else(|| expand_home_path(&default_path));

    if path.len() > 4096 {
        return Err("Ruta de config demasiado larga".to_string());
    }
    Ok(path)
}

fn expand_home_path(p: &str) -> String {
    if p.starts_with("~/") {
        dirs::home_dir()
            .map(|h| h.join(&p[2..]))
            .and_then(|p| p.to_str().map(String::from))
            .unwrap_or_else(|| p.to_string())
    } else {
        p.to_string()
    }
}

/// Lee el config desde la ruta indicada
pub fn read_config(path: &str) -> Result<OpenClawConfig, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| format!("JSON inválido: {}", e))
}

/// Lee el config usando la ruta que devuelve openclaw config file
pub fn read_openclaw_config() -> Result<OpenClawConfig, String> {
    let path = get_config_path()?;
    read_config(&path)
}

/// Escribe el config en la ruta indicada
pub fn write_config(path: &str, config: &OpenClawConfig) -> Result<(), String> {
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

/// Actualiza la config de OpenAI (API key y modelo) y valida
pub fn write_openai_config(api_key: &str, model: &str) -> Result<(), String> {
    let path = get_config_path()?;
    let mut config = read_config(&path).unwrap_or_default();

    config
        .env
        .insert("OPENAI_API_KEY".to_string(), api_key.to_string());

    let model_primary = format!("openai/{}", model);
    config.agents.defaults.model.primary = Some(model_primary.clone());
    if let Some(ref mut agent) = config.agent {
        agent.model.primary = Some(model_primary);
    }

    write_config(&path, &config)?;

    // Validar
    let (stdout, stderr) = openclaw::run_openclaw(&["config", "validate"])
        .map_err(|e| format!("Validación fallida: {}", e))?;
    if !stderr.is_empty() {
        return Err(stderr);
    }
    if stdout.contains("error") || stdout.contains("Error") {
        return Err(stdout);
    }
    Ok(())
}
