mod session;
mod input;
mod socket;
mod window_cmd; // 新增模块

use std::sync::{Arc, Mutex};
use session::{SessionInfo, SessionState, get_session_info};
use socket::setup_socket;
use window_cmd::{set_window_size, start_drag}; // 引入新命令
use tauri::Manager;
use window_vibrancy::apply_blur;

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
    .invoke_handler(tauri::generate_handler![get_session_info, set_window_size, start_drag]) // 注册 start_drag
    .setup(move |app| {
        if cfg!(debug_assertions) {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;
        }

        let window = app.get_webview_window("main").unwrap();

        // 开启 Windows 原生模糊效果 (Acrylic/Blur)
        #[cfg(target_os = "windows")]
        let _ = apply_blur(&window, Some((18, 18, 18, 125))); // 深灰色背景，半透明

        let app_handle = app.handle().clone();
        std::thread::spawn(move || {
            setup_socket(app_handle, session_state_clone);
        });

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
