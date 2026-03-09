//! Wrapper para ejecutar el CLI de OpenClaw y detectar su path

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

use crate::settings;

/// Resultado de la detección del path de openclaw
#[derive(Debug, Serialize, Deserialize)]
pub struct OpenClawPathResult {
    pub detected: Option<String>,
    pub configured: Option<String>,
    pub resolved: String,
}

/// Detecta el path del ejecutable openclaw
/// Orden: configured (settings) -> which/where -> rutas conocidas
pub fn detect_openclaw_path() -> OpenClawPathResult {
    let cfg = settings::load_settings();
    let configured = cfg.openclaw_path.clone();

    // Si hay path configurado y existe, usarlo
    if let Some(ref p) = configured {
        if std::path::Path::new(p).exists() {
            return OpenClawPathResult {
                detected: None,
                configured: Some(p.clone()),
                resolved: p.clone(),
            };
        }
    }

    // Intentar which (Unix) o where (Windows)
    let detected = which_openclaw();

    // Rutas conocidas por plataforma
    let fallback_paths = known_paths();

    let resolved = detected
        .clone()
        .or_else(|| {
            fallback_paths
                .into_iter()
                .find(|p| std::path::Path::new(p).exists())
        })
        .unwrap_or_else(|| "openclaw".to_string());

    OpenClawPathResult {
        detected,
        configured,
        resolved,
    }
}

/// Usa `which` para encontrar openclaw en PATH (cross-platform)
fn which_openclaw() -> Option<String> {
    which::which("openclaw")
        .ok()
        .and_then(|p| p.to_str().map(String::from))
}

/// Rutas conocidas donde puede estar instalado openclaw
fn known_paths() -> Vec<String> {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    let home_str = home.to_string_lossy();

    #[cfg(unix)]
    {
        vec![
            format!("{}/.openclaw/bin/openclaw", home_str),
            format!("{}/.local/bin/openclaw", home_str),
        ]
    }
    #[cfg(windows)]
    {
        vec![
            format!("{}\\.openclaw\\bin\\openclaw.cmd", home_str),
            format!("{}\\.local\\bin\\openclaw.cmd", home_str),
        ]
    }
}

/// Ejecuta un comando openclaw con los argumentos dados
pub fn run_openclaw(args: &[&str]) -> Result<(String, String), String> {
    let path_result = detect_openclaw_path();
    let exe = &path_result.resolved;

    let output = Command::new(exe)
        .args(args)
        .output()
        .map_err(|e| format!("Error ejecutando openclaw: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(if stderr.is_empty() { stdout } else { stderr });
    }

    Ok((stdout, stderr))
}
