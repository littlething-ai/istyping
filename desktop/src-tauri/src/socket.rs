use tauri::{AppHandle, Emitter};
use rust_socketio::{ClientBuilder, Payload, RawClient};
use serde_json::json;
use enigo::{Enigo, Settings, Key, Direction, Keyboard};
use crate::input::send_sequence;
use rand::Rng;
use std::sync::Arc;

pub fn setup_socket(app_handle: AppHandle, session_state: Arc<std::sync::Mutex<crate::session::SessionInfo>>) {
    let app_handle_for_text = app_handle.clone();
    let app_handle_for_control = app_handle.clone();
    let app_handle_for_session = app_handle.clone();
    let session_state_clone = session_state.clone();

    // 生成全局唯一 Room ID (字母+数字，16位)
    let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();
    let room_id: String = (0..16)
        .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset.chars().nth(idx).unwrap()
        })
        .collect();
    
    let room_id_for_registration = room_id.clone();

    let on_text = move |payload: Payload, _socket: RawClient| {
        let text_opt: Option<String> = match payload {
            Payload::Text(args) => args.get(0).and_then(|v| {
                if v.is_string() { v.as_str().map(|s| s.to_string()) }
                else { v.get("text").and_then(|t| t.as_str()).map(|s| s.to_string()) }
            }),
            _ => None
        };
        if let Some(text) = text_opt {
             let _ = app_handle_for_text.emit("debug-log", json!({ "type": "text", "content": text }));
             send_sequence(&text);
        }
    };

    let on_control = move |payload: Payload, _socket: RawClient| {
         let action_opt: Option<String> = match payload {
             Payload::Text(args) => args.get(0).and_then(|v| v.get("action").and_then(|a| a.as_str()).map(|s| s.to_string())),
             _ => None
         };
         if let Some(action) = action_opt {
             let _ = app_handle_for_control.emit("debug-log", json!({ "type": "control", "content": action }));
             if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                 match action.as_str() {
                     "enter" => { let _ = enigo.key(Key::Return, Direction::Click); },
                     "backspace" => { let _ = enigo.key(Key::Backspace, Direction::Click); },
                     _ => {} 
                 }
             }
         }
    };

    let on_registered = move |payload: Payload, _socket: RawClient| {
        let data_opt = match payload {
            Payload::Text(args) => args.get(0).cloned(),
            Payload::String(s) => serde_json::from_str(&s).ok(),
            _ => None
        };
        
        if let Some(data) = data_opt {
            let room_number = if let Some(n) = data.get("roomNumber").and_then(|v| v.as_str()) {
                n.to_string()
            } else if let Some(n) = data.get("roomNumber").and_then(|v| v.as_u64()) {
                n.to_string()
            } else {
                "------".to_string()
            };

            let room_id_resp = data.get("roomId").and_then(|v| v.as_str()).unwrap_or("").to_string();
            
            // 1. 保存到共享状态
            {
                let mut state = session_state_clone.lock().unwrap();
                state.room_id = room_id_resp.clone();
                state.room_number = room_number.clone();
            }

            // 2. 通知前端
            let _ = app_handle_for_session.emit("session-info", json!({ "roomId": room_id_resp, "roomNumber": room_number }));
        }
    };

    let on_open = move |_: Payload, socket: RawClient| {
        let _ = socket.emit("register_room", json!(room_id_for_registration));
    };

    let on_error = |payload: Payload, _socket: RawClient| {
        eprintln!("[ERROR] Socket Error: {:?}", payload);
    };

    ClientBuilder::new("http://localhost:3000")
        .namespace("/")
        .on("open", on_open)
        .on("error", on_error)
        .on("room_registered", on_registered)
        .on("receive_text", on_text)
        .on("receive_control", on_control)
        .connect()
        .ok();
}
