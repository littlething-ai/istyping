use tauri::{AppHandle, LogicalSize, Manager, Size, Window};

#[tauri::command]
pub fn set_window_size(app_handle: AppHandle, label: String, width: f64, height: f64) {
    if let Some(window) = app_handle.get_webview_window(&label) {
        let _ = window.set_size(Size::Logical(LogicalSize { width, height }));
    }
}

#[tauri::command]
pub fn show_window(app_handle: AppHandle, label: String) {
    if let Some(window) = app_handle.get_webview_window(&label) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command]
pub fn hide_window(app_handle: AppHandle, label: String) {
    if let Some(window) = app_handle.get_webview_window(&label) {
        let _ = window.hide();
    }
}

#[tauri::command]
pub fn close_window(app_handle: AppHandle, label: String) {
    if let Some(window) = app_handle.get_webview_window(&label) {
        let _ = window.close();
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
