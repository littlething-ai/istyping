mod session;
mod input;
mod socket;

use std::sync::{Arc, Mutex};
use session::{SessionInfo, SessionState, get_session_info};
use socket::setup_socket;

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
    .invoke_handler(tauri::generate_handler![get_session_info])
    .setup(move |app| {
        if cfg!(debug_assertions) {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;
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
