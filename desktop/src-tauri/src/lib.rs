mod config;
mod input;
mod session;
mod socket;
mod window_cmd;

use config::{get_actual_url, load_config, save_config, IslandPosition, ServerConfig};
use session::{get_session_info, ConnectionStatus, SessionInfo, SessionState};
use socket::{resolve_room_id, setup_socket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::PhysicalPosition;
use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuEvent, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use window_cmd::{close_window, hide_window, js_log, set_window_size, show_window, start_drag};

const TRAY_SHOW_ISLAND: &str = "tray_show_island";
const TRAY_HIDE_ISLAND: &str = "tray_hide_island";
const TRAY_OPEN_PAIRING: &str = "tray_open_pairing";
const TRAY_OPEN_SETTINGS: &str = "tray_open_settings";
const TRAY_CENTER_ISLAND: &str = "tray_center_island";
const TRAY_RESET_ISLAND: &str = "tray_reset_island";
const TRAY_QUIT: &str = "tray_quit";

pub struct SocketManager {
    pub stop_signal: Mutex<Arc<AtomicBool>>,
}

fn show_window_by_label(app: &tauri::AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn hide_window_by_label(app: &tauri::AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.hide();
    }
}

fn set_island_visibility(app: &tauri::AppHandle, visible: bool) {
    if visible {
        show_window_by_label(app, "main");
    } else {
        hide_window_by_label(app, "main");
    }
}

fn get_default_island_position(
    window: &tauri::WebviewWindow,
) -> Option<PhysicalPosition<i32>> {
    let monitor = window.primary_monitor().ok().flatten()?;
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();
    let window_width = (200.0 * scale_factor) as i32;
    let window_height = (60.0 * scale_factor) as i32;
    let x = (monitor_size.width as i32 - window_width) / 2;
    let y = monitor_size.height as i32 - window_height - (100.0 * scale_factor) as i32;
    Some(PhysicalPosition::new(x, y))
}

fn persist_island_position(app: &tauri::AppHandle, x: i32, y: i32) {
    let mut config = load_config(app);
    config.island_position = Some(IslandPosition { x, y });
    if let Err(err) = save_config(app, &config) {
        eprintln!("[CONFIG] Failed to persist island position: {}", err);
    }
}

fn restore_or_reset_island_position(app: &tauri::AppHandle, reset: bool) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    if reset {
        if let Some(default_position) = get_default_island_position(&window) {
            let _ = window.set_position(default_position);
            let mut config = load_config(app);
            config.island_position = None;
            if let Err(err) = save_config(app, &config) {
                eprintln!("[CONFIG] Failed to reset island position: {}", err);
            }
        }
        return;
    }

    let config = load_config(app);
    if let Some(position) = config.island_position {
        let _ = window.set_position(PhysicalPosition::new(position.x, position.y));
    } else if let Some(default_position) = get_default_island_position(&window) {
        let _ = window.set_position(default_position);
    }
}

fn center_island_horizontally(app: &tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    let current_position = match window.outer_position() {
        Ok(position) => position,
        Err(_) => return,
    };
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());
    let Some(monitor) = monitor else {
        return;
    };

    let monitor_position = monitor.position();
    let monitor_size = monitor.size();
    let window_size = match window.outer_size() {
        Ok(size) => size,
        Err(_) => return,
    };

    let centered_x =
        monitor_position.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
    let _ = window.set_position(PhysicalPosition::new(centered_x, current_position.y));
    persist_island_position(app, centered_x, current_position.y);
}

fn handle_tray_menu_event(app: &tauri::AppHandle, id: &str) {
    match id {
        TRAY_SHOW_ISLAND => set_island_visibility(app, true),
        TRAY_HIDE_ISLAND => set_island_visibility(app, false),
        TRAY_OPEN_PAIRING => show_window_by_label(app, "pairing"),
        TRAY_OPEN_SETTINGS => show_window_by_label(app, "settings"),
        TRAY_CENTER_ISLAND => center_island_horizontally(app),
        TRAY_RESET_ISLAND => restore_or_reset_island_position(app, true),
        TRAY_QUIT => app.exit(0),
        _ => {}
    }
}

#[tauri::command]
async fn get_server_config(app_handle: tauri::AppHandle) -> ServerConfig {
    load_config(&app_handle)
}

#[tauri::command]
async fn disconnect_server(socket_manager: tauri::State<'_, SocketManager>) -> Result<(), String> {
    let stop_signal = socket_manager.stop_signal.lock().unwrap();
    stop_signal.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
async fn update_server_config(
    app_handle: tauri::AppHandle,
    config: ServerConfig,
    socket_manager: tauri::State<'_, SocketManager>,
    session_state: tauri::State<'_, SessionState>,
) -> Result<(), String> {
    save_config(&app_handle, &config)?;
    config::apply_proxy_config(&config);

    // 1. 停止旧的连接
    {
        let stop_signal = socket_manager.stop_signal.lock().unwrap();
        stop_signal.store(false, Ordering::SeqCst);
    }

    // 给一点时间让旧线程退出
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    // 2. 启动新的连接
    let new_stop_signal = Arc::new(AtomicBool::new(true));
    {
        let mut stop_signal_lock = socket_manager.stop_signal.lock().unwrap();
        *stop_signal_lock = new_stop_signal.clone();
    }

    let url = get_actual_url(&config);
    let room_id = resolve_room_id(&config.custom_room_id);
    let app_clone = app_handle.clone();
    let session_clone = session_state.0.clone();

    std::thread::spawn(move || {
        setup_socket(app_clone, session_clone, url, room_id, new_stop_signal);
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let session_state = SessionState(Arc::new(Mutex::new(SessionInfo {
        room_id: "".into(),
        room_number: "------".into(),
        participants: vec![],
        status: ConnectionStatus::Disconnected,
        server_url: "".into(),
    })));
    let session_state_clone = session_state.0.clone();

    let initial_stop_signal = Arc::new(AtomicBool::new(true));
    let socket_manager = SocketManager {
        stop_signal: Mutex::new(initial_stop_signal.clone()),
    };

    tauri::Builder::default()
        .manage(session_state)
        .manage(socket_manager)
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let config = load_config(&app_handle);
            config::apply_proxy_config(&config);
            let url = get_actual_url(&config);
            let room_id = resolve_room_id(&config.custom_room_id);

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .targets([
                            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                        ])
                        .build(),
                )?;
            }

            let show_island =
                MenuItemBuilder::with_id(TRAY_SHOW_ISLAND, "Show Island").build(app)?;
            let hide_island =
                MenuItemBuilder::with_id(TRAY_HIDE_ISLAND, "Hide Island").build(app)?;
            let open_pairing =
                MenuItemBuilder::with_id(TRAY_OPEN_PAIRING, "Open Pairing").build(app)?;
            let open_settings =
                MenuItemBuilder::with_id(TRAY_OPEN_SETTINGS, "Open Settings").build(app)?;
            let center_island =
                MenuItemBuilder::with_id(TRAY_CENTER_ISLAND, "Center Island Horizontally")
                    .build(app)?;
            let reset_island =
                MenuItemBuilder::with_id(TRAY_RESET_ISLAND, "Reset Island Position").build(app)?;
            let quit = MenuItemBuilder::with_id(TRAY_QUIT, "Quit").build(app)?;
            let tray_menu = MenuBuilder::new(app)
                .item(&show_island)
                .item(&hide_island)
                .separator()
                .item(&center_island)
                .item(&reset_island)
                .separator()
                .item(&open_pairing)
                .item(&open_settings)
                .separator()
                .item(&quit)
                .build()?;

            let tray_icon = app
                .default_window_icon()
                .cloned()
                .map(Image::from)
                .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;

            TrayIconBuilder::with_id("main-tray")
                .menu(&tray_menu)
                .icon(tray_icon)
                .tooltip("Is Typing")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event: MenuEvent| {
                    handle_tray_menu_event(app, event.id().as_ref());
                })
                .build(app)?;

            // 默认显示主窗口(灵动岛)
            let island_window = app.get_webview_window("main").unwrap();
            let _ = island_window.set_skip_taskbar(true);
            restore_or_reset_island_position(&app_handle, false);

            let _ = island_window.show();

            // 处理 Main 窗口(灵动岛)的关闭行为：改为隐藏，退出统一交给托盘
            let app_handle_for_main = app.handle().clone();
            island_window.on_window_event(move |event| {
                match event {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        set_island_visibility(&app_handle_for_main, false);
                    }
                    tauri::WindowEvent::Moved(position) => {
                        persist_island_position(&app_handle_for_main, position.x, position.y);
                    }
                    _ => {}
                }
            });

            // 处理 Settings 窗口的关闭行为：改为隐藏
            if let Some(settings_window) = app.get_webview_window("settings") {
                let settings_window_clone = settings_window.clone();
                settings_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = settings_window_clone.hide();
                    }
                });
            }

            // 处理 Pairing 窗口的关闭行为：改为隐藏
            if let Some(pairing_window) = app.get_webview_window("pairing") {
                let pairing_window_clone = pairing_window.clone();
                pairing_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = pairing_window_clone.hide();
                    }
                });
            }

            let session_state_for_init = session_state_clone.clone();

            std::thread::spawn(move || {
                setup_socket(
                    app_handle,
                    session_state_for_init,
                    url,
                    room_id,
                    initial_stop_signal,
                );
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_session_info,
            set_window_size,
            start_drag,
            js_log,
            show_window,
            hide_window,
            close_window,
            get_server_config,
            update_server_config,
            disconnect_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
