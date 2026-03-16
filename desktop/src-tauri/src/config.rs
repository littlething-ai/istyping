use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ServerMode {
    Auto,
    Prod,
    Dev,
    Custom,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IslandPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServerConfig {
    pub mode: ServerMode,
    pub custom_url: String,
    #[serde(default)]
    pub custom_room_id: String,
    #[serde(default)]
    pub island_position: Option<IslandPosition>,
    #[serde(default)]
    pub proxy_enabled: bool,
    #[serde(default)]
    pub proxy_url: String,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            mode: ServerMode::Prod,
            custom_url: "http://localhost:2020".to_string(),
            custom_room_id: "".to_string(),
            island_position: None,
            proxy_enabled: false,
            proxy_url: "".to_string(),
        }
    }
}

fn normalize_server_config(config: &mut ServerConfig) {
    if matches!(config.mode, ServerMode::Auto) {
        config.mode = if cfg!(debug_assertions) {
            ServerMode::Dev
        } else {
            ServerMode::Prod
        };
    }
}

pub fn get_config_path(app_handle: &AppHandle) -> PathBuf {
    let mut path = app_handle
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.push("config.json");
    path
}

pub fn load_config(app_handle: &AppHandle) -> ServerConfig {
    let path = get_config_path(app_handle);
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            println!("[CONFIG] Loading from {:?}: {}", path, content);
            if let Ok(mut config) = serde_json::from_str::<ServerConfig>(&content) {
                normalize_server_config(&mut config);
                return config;
            } else {
                eprintln!("[CONFIG] Failed to parse config JSON");
            }
        }
    }
    println!("[CONFIG] Using default config");
    let mut config = ServerConfig::default();
    normalize_server_config(&mut config);
    config
}

pub fn save_config(app_handle: &AppHandle, config: &ServerConfig) -> Result<(), String> {
    let path = get_config_path(app_handle);
    let mut config_to_save = config.clone();
    normalize_server_config(&mut config_to_save);
    let content = serde_json::to_string_pretty(&config_to_save).map_err(|e| e.to_string())?;
    println!("[CONFIG] Saving to {:?}: {}", path, content);
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_actual_url(config: &ServerConfig) -> String {
    match config.mode {
        ServerMode::Auto => {
            if cfg!(debug_assertions) {
                "http://localhost:2020".to_string()
            } else {
                "https://backend.istyping.app".to_string()
            }
        }
        ServerMode::Prod => "https://backend.istyping.app".to_string(),
        ServerMode::Dev => "http://localhost:2020".to_string(),
        ServerMode::Custom => config.custom_url.clone(),
    }
}

pub fn apply_proxy_config(config: &ServerConfig) {
    if config.proxy_enabled && !config.proxy_url.trim().is_empty() {
        println!("[CONFIG] Applying proxy: {}", config.proxy_url);
        std::env::set_var("HTTP_PROXY", config.proxy_url.trim());
        std::env::set_var("HTTPS_PROXY", config.proxy_url.trim());
        std::env::set_var("ALL_PROXY", config.proxy_url.trim());
    } else {
        println!("[CONFIG] Clearing proxy settings");
        std::env::remove_var("HTTP_PROXY");
        std::env::remove_var("HTTPS_PROXY");
        std::env::remove_var("ALL_PROXY");
    }
}
