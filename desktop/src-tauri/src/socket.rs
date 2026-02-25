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

    // 生成 Room ID
    let room_id: String = if cfg!(debug_assertions) {
        "DEBUG_SESSION_ID".to_string()
    } else {
        let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let mut rng = rand::thread_rng();
        (0..16)
            .map(|_| {
                let idx = rng.gen_range(0..charset.len());
                charset.chars().nth(idx).unwrap()
            })
            .collect()
    };
    
    let room_id_for_registration = room_id.clone();

    let on_text = move |payload: Payload, _socket: RawClient| {
        println!("[DEBUG] on_text received payload: {:?}", payload);
        let text_opt: Option<String> = match payload {
            Payload::Text(args) => args.get(0).and_then(|v| {
                if let Some(s) = v.as_str() {
                    // 如果是字符串，尝试解析为 JSON 并获取 "text" 字段 (类似之前的 Payload::String 逻辑)
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(s) {
                        parsed.get("text").and_then(|t| t.as_str()).map(|s| s.to_string())
                            .or_else(|| Some(s.to_string()))
                    } else {
                        Some(s.to_string())
                    }
                } else {
                    // 如果已经是对象，直接获取 "text" 字段
                    v.get("text").and_then(|t| t.as_str()).map(|s| s.to_string())
                }
            }),
            _ => None
        };
        if let Some(text) = text_opt {
             println!("[DEBUG] Processing text: {}", text);
             let _ = app_handle_for_text.emit("debug-log", json!({ "type": "text", "content": text }));
             send_sequence(&text);
        }
    };

    let on_control = move |payload: Payload, _socket: RawClient| {
         println!("[DEBUG] on_control received payload: {:?}", payload);
         let action_opt: Option<String> = match payload {
             Payload::Text(args) => args.get(0).and_then(|v| {
                 if let Some(s) = v.as_str() {
                     if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(s) {
                         parsed.get("action").and_then(|a| a.as_str()).map(|s| s.to_string())
                     } else {
                         None
                     }
                 } else {
                     v.get("action").and_then(|a| a.as_str()).map(|s| s.to_string())
                 }
             }),
             _ => None
         };
         if let Some(action) = action_opt {
             println!("[DEBUG] Processing control: {}", action);
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
            Payload::Text(args) => args.get(0).and_then(|v| {
                if let Some(s) = v.as_str() {
                    serde_json::from_str(s).ok()
                } else {
                    Some(v.clone())
                }
            }),
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
            
            println!("[NET] Room Registered! Code: {} (ID: {})", room_number, room_id_resp);

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

    let on_error = |payload: Payload, _socket: RawClient| {
        eprintln!("[NET] [ERROR] Socket Error: {:?}", payload);
    };

    let socket_url = if cfg!(debug_assertions) {
        "http://localhost:3000"
    } else {
        "http://istyping.app:3000"
    };

    println!("[NET] Connecting to {} ...", socket_url);

    let result = ClientBuilder::new(socket_url)
        .namespace("/")
        .on("error", on_error)
        .on("room_registered", on_registered)
        .on("receive_text", on_text)
        .on("receive_control", on_control)
        .connect();

    match result {
        Ok(client) => {
            println!("[NET] Client initialized successfully. Waiting 1 second before registering room (anti-race condition)...");
            
            // 稍微等待一下，确保底层的 WebSocket 和 Namespace 握手真正完成
            std::thread::sleep(std::time::Duration::from_millis(1000));
            
            println!("[NET] Emitting 'register_room' event...");
            // 使用最简纯字符串 Payload
            match client.emit("register_room", json!(room_id_for_registration)) {
                Ok(_) => println!("[NET] 'register_room' emit success (buffered/sent)."),
                Err(e) => eprintln!("[NET] [ERROR] Failed to emit 'register_room': {:?}", e),
            }

            // 关键：保持线程存活，否则 client 会被 Drop，连接会断开
            loop {
                std::thread::sleep(std::time::Duration::from_secs(3600));
            }
        }
        Err(e) => {
            eprintln!("[NET] [FATAL] Failed to connect: {:?}", e);
        }
    }
}
