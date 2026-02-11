mod session;
mod input;
mod socket;
mod window_cmd; // 新增模块

use std::sync::{Arc, Mutex};
use session::{SessionInfo, SessionState, get_session_info};
use socket::setup_socket;
use window_cmd::{set_window_size, start_drag, js_log}; // 引入 js_log
use tauri::Manager;
// 移除了未使用到的 window_vibrancy 引用

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
    .invoke_handler(tauri::generate_handler![get_session_info, set_window_size, start_drag, js_log]) // 注册 js_log
    .setup(move |app| {
        if cfg!(debug_assertions) {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    // 确保 Stdout 开启，以便在终端看到日志
                    .targets([
                        tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                        tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                    ])
                    .build(),
            )?;
        }

        let window = app.get_webview_window("main").unwrap();

        // 移除原生模糊效果，因为它会强制产生一个不符合圆角 UI 的矩形背景框
        // 我们改为完全依赖前端的 glass 效果和 transparent: true 配置

        let app_handle = app.handle().clone();
        std::thread::spawn(move || {
            setup_socket(app_handle, session_state_clone);
        });

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
