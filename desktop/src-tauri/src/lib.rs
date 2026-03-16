mod session;
mod input;
mod socket;
mod window_cmd;
mod config;

use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use session::{SessionInfo, SessionState, get_session_info, ConnectionStatus};
use socket::{setup_socket, resolve_room_id};
use window_cmd::{set_window_size, start_drag, js_log, show_window, hide_window, close_window};
use tauri::Manager;
use config::{ServerConfig, load_config, save_config, get_actual_url};

pub struct SocketManager {
    pub stop_signal: Mutex<Arc<AtomicBool>>,
}

#[tauri::command]
async fn get_server_config(app_handle: tauri::AppHandle) -> ServerConfig {
    load_config(&app_handle)
}

#[tauri::command]
async fn disconnect_server(
    socket_manager: tauri::State<'_, SocketManager>,
) -> Result<(), String> {
    let stop_signal = socket_manager.stop_signal.lock().unwrap();
    stop_signal.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
async fn update_server_config(
    app_handle: tauri::AppHandle, 
    config: ServerConfig, 
    socket_manager: tauri::State<'_, SocketManager>,
    session_state: tauri::State<'_, SessionState>
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

        // 默认显示主窗口(灵动岛)
        let island_window = app.get_webview_window("main").unwrap();
        
        // 自动定位到屏幕底部中心
        if let Ok(Some(monitor)) = island_window.primary_monitor() {
            let monitor_size = monitor.size();
            let scale_factor = monitor.scale_factor();
            
            // 灵动岛尺寸 200x60
            let window_width = (200.0 * scale_factor) as u32;
            let window_height = (60.0 * scale_factor) as u32;
            
            let x = (monitor_size.width - window_width) / 2;
            // 距离屏幕底部边缘 100 物理像素 (约在任务栏上方)
            let y = monitor_size.height - window_height - (100.0 * scale_factor) as u32;
            
            let _ = island_window.set_position(tauri::PhysicalPosition::new(x, y));
        }

        let _ = island_window.show();

        // 处理 Main 窗口(灵动岛)的关闭行为：直接退出整个应用
        let app_handle_for_exit = app.handle().clone();
        island_window.on_window_event(move |event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                app_handle_for_exit.exit(0);
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
            setup_socket(app_handle, session_state_for_init, url, room_id, initial_stop_signal);
        });

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
