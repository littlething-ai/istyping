use tauri::{AppHandle, Manager, LogicalSize, Size, Window};

#[tauri::command]
pub fn set_window_size(app_handle: AppHandle, width: f64, height: f64) {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.set_size(Size::Logical(LogicalSize { width, height }));
    }
}

#[tauri::command]
pub fn start_drag(window: Window) {
    let _ = window.start_dragging();
}

#[tauri::command]
pub fn js_log(message: String) {
    println!("[JS-UI] {}", message);
}
