use tauri::{AppHandle, Emitter};
use rust_socketio::{ClientBuilder, Payload, RawClient};
use serde_json::json;
use enigo::{Enigo, Settings, Key, Direction, Keyboard};
use crate::input::send_sequence;
use rand::Rng;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use crate::session::{ConnectionStatus, Participant, SessionInfo};

pub struct SocketState {
    pub stop_signal: Arc<AtomicBool>,
}

pub fn setup_socket(
    app_handle: AppHandle, 
    session_state: Arc<Mutex<SessionInfo>>,
    socket_url: String,
    stop_signal: Arc<AtomicBool>
) {
    let app_handle_for_text = app_handle.clone();
    let app_handle_for_control = app_handle.clone();
    let app_handle_for_session = app_handle.clone();
    let app_handle_for_error = app_handle.clone();
    let app_handle_for_status = app_handle.clone();
    let session_state_clone = session_state.clone();

    // Reset session info when connecting to a new server
    {
        let mut state = session_state.lock().unwrap();
        state.room_id = "".into();
        state.room_number = "------".into();
        state.participants = vec![];
        state.status = ConnectionStatus::Connecting;
        state.server_url = socket_url.clone();
    }
    
    let _ = app_handle.emit("session-info", json!({ 
        "roomId": "", 
        "roomNumber": "------", 
        "participants": [], 
        "status": "connecting",
        "serverUrl": socket_url.clone()
    }));

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

    let stop_signal_for_text = stop_signal.clone();
    let on_text = move |payload: Payload, _socket: RawClient| {
        if !stop_signal_for_text.load(Ordering::SeqCst) { return; }
        
        let text_opt: Option<String> = match payload {
            Payload::Text(args) => args.get(0).and_then(|v| {
                if let Some(s) = v.as_str() {
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(s) {
                        parsed.get("text").and_then(|t| t.as_str()).map(|s| s.to_string())
                            .or_else(|| Some(s.to_string()))
                    } else {
                        Some(s.to_string())
                    }
                } else {
                    v.get("text").and_then(|t| t.as_str()).map(|s| s.to_string())
                }
            }),
            _ => None
        };
        if let Some(text) = text_opt {
             let _ = app_handle_for_text.emit("debug-log", json!({ "type": "text", "content": text }));
             send_sequence(&text);
        }
    };

    let stop_signal_for_control = stop_signal.clone();
    let on_control = move |payload: Payload, _socket: RawClient| {
         if !stop_signal_for_control.load(Ordering::SeqCst) { return; }
         
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

    let session_state_for_update = session_state_clone.clone();
    let app_handle_for_update = app_handle_for_session.clone();
    let stop_signal_for_update = stop_signal.clone();
    let on_room_update = move |payload: Payload, _socket: RawClient| {
        if !stop_signal_for_update.load(Ordering::SeqCst) { return; }
        
        let data_opt: Option<serde_json::Value> = match payload {
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
            if let Some(participants_val) = data.get("participants") {
                if let Ok(participants) = serde_json::from_value::<Vec<Participant>>(participants_val.clone()) {
                    let mut state = session_state_for_update.lock().unwrap();
                    state.participants = participants.clone();
                    let _ = app_handle_for_update.emit("session-info", &*state);
                }
            }
        }
    };

    let session_state_for_reg = session_state_clone.clone();
    let app_handle_for_reg = app_handle_for_session.clone();
    let stop_signal_for_reg = stop_signal.clone();
    let on_registered = move |payload: Payload, _socket: RawClient| {
        if !stop_signal_for_reg.load(Ordering::SeqCst) { return; }
        
        let data_opt: Option<serde_json::Value> = match payload {
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

            {
                let mut state = session_state_for_reg.lock().unwrap();
                state.room_id = room_id_resp.clone();
                state.room_number = room_number.clone();
                state.status = ConnectionStatus::Connected;
            }

            let state = session_state_for_reg.lock().unwrap();
            let _ = app_handle_for_reg.emit("session-info", &*state);
        }
    };

    let session_state_for_error = session_state_clone.clone();
    let stop_signal_for_error = stop_signal.clone();
    let on_error = move |payload: Payload, _socket: RawClient| {
        if !stop_signal_for_error.load(Ordering::SeqCst) { return; }
        
        eprintln!("[NET] [ERROR] Socket Error: {:?}", payload);
        {
            let mut state = session_state_for_error.lock().unwrap();
            state.status = ConnectionStatus::Error;
        }
        let state = session_state_for_error.lock().unwrap();
        let _ = app_handle_for_error.emit("session-info", &*state);
    };

    println!("[NET] Connecting to {} ...", socket_url);

    let result = ClientBuilder::new(socket_url)
        .namespace("/")
        .on("error", on_error)
        .on("room_registered", on_registered)
        .on("room_update", on_room_update)
        .on("receive_text", on_text)
        .on("receive_control", on_control)
        .connect();

    match result {
        Ok(client) => {
            println!("[NET] Client initialized successfully.");
            
            std::thread::sleep(std::time::Duration::from_millis(1000));
            
            let device_name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "My Desktop".to_string());
            
            println!("[NET] Emitting 'register_room' event for {}...", device_name);
            match client.emit("register_room", json!({ 
                "roomId": room_id_for_registration,
                "deviceName": device_name,
                "deviceType": "pc"
            })) {
                Ok(_) => println!("[NET] 'register_room' emit success."),
                Err(e) => eprintln!("[NET] [ERROR] Failed to emit 'register_room': {:?}", e),
            }

            while stop_signal.load(Ordering::SeqCst) {
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
            println!("[NET] Stop signal received. Disconnecting...");
            let _ = client.disconnect();
            
            {
                let mut state = session_state_clone.lock().unwrap();
                state.status = ConnectionStatus::Disconnected;
            }
            let state = session_state_clone.lock().unwrap();
            let _ = app_handle_for_status.emit("session-info", &*state);
        }
        Err(e) => {
            eprintln!("[NET] [FATAL] Failed to connect: {:?}", e);
            {
                let mut state = session_state_clone.lock().unwrap();
                state.status = ConnectionStatus::Error;
            }
            let state = session_state_clone.lock().unwrap();
            let _ = app_handle_for_status.emit("session-info", &*state);
        }
    }
}
