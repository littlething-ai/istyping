mod session;
mod input;
mod socket;
mod window_cmd;

use std::sync::{Arc, Mutex};
use session::{SessionInfo, SessionState, get_session_info};
use socket::setup_socket;
use window_cmd::{set_window_size, start_drag, js_log, show_window, hide_window, close_window};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let session_state = SessionState(Arc::new(Mutex::new(SessionInfo {
      room_id: "".into(),
      room_number: "------".into(),
  })));
  let session_state_clone = session_state.0.clone();

  tauri::Builder::default()
    .manage(session_state)
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
        get_session_info, 
        set_window_size, 
        start_drag, 
        js_log,
        show_window,
        hide_window,
        close_window
    ])
    .setup(move |app| {
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
        let _ = island_window.show();

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

        let app_handle = app.handle().clone();
        
        std::thread::spawn(move || {
            setup_socket(app_handle, session_state_clone);
        });

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
