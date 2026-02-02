use tauri::{Manager, Emitter}; 
use rust_socketio::{ClientBuilder, Payload, RawClient}; 
use serde_json::json;
use enigo::{Enigo, Settings, Key, Direction, Keyboard}; 
use std::thread;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
        if cfg!(debug_assertions) {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;
        }

        let app_handle = app.handle().clone();

        println!("Setting up Socket.io thread...");

        thread::spawn(move || {
            println!("Connecting to Socket.io server...");

            let app_handle_for_text = app_handle.clone();
            let app_handle_for_control = app_handle.clone();

            let on_text = move |payload: Payload, _socket: RawClient| {
                println!("Typing Event Received: {:?}", payload);
                
                // 解析文本的逻辑
                let text_opt: Option<String> = match payload {
                    // rust_socketio 0.6.0: Payload::Text(Vec<Value>)
                    Payload::Text(args) => {
                        // args[0] 应该是 { "text": "..." }
                        args.get(0).and_then(|v| {
                            // v 是 { text: "..." }
                            v.get("text").and_then(|t| t.as_str()).map(|s| s.to_string())
                        })
                    },
                    // 兼容旧版或纯字符串
                    Payload::String(s) => {
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&s) {
                             val.get("text").and_then(|t| t.as_str()).map(|s| s.to_string())
                        } else {
                             None
                        }
                    },
                    _ => None
                };

                if let Some(text) = text_opt {
                     println!("Typing: {}", text);
                     let _ = app_handle_for_text.emit("debug-log", json!({ "type": "text", "content": text }));
                     if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                         let _ = enigo.text(&text);
                     }
                }
            };
            
            let on_control = move |payload: Payload, _socket: RawClient| {
                 let action_opt: Option<String> = match payload {
                     Payload::Text(args) => {
                         args.get(0).and_then(|v| {
                             v.get("action").and_then(|a| a.as_str()).map(|s| s.to_string())
                         })
                     },
                     Payload::String(s) => {
                         serde_json::from_str::<serde_json::Value>(&s).ok()
                             .and_then(|v| v.get("action").and_then(|a| a.as_str()).map(|s| s.to_string()))
                     },
                     _ => None
                 };

                 if let Some(action) = action_opt {
                     println!("Control Action: {}", action);
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

            // 注册 Open 回调，发送 join_room
            let on_open = |_: Payload, socket: RawClient| {
                println!("SocketIO Connected! Joining room...");
                // Emit 也是接受 Vec<Value> 或者 impl Into<Payload>
                // json!("demo-room") 应该会被转为 payload
                if let Err(e) = socket.emit("join_room", json!("demo-room")) {
                    eprintln!("Failed to join room: {}", e);
                }
            };

            let socket_result = ClientBuilder::new("http://10.10.114.222:3000")
                .namespace("/")
                .on("error", |err, _| eprintln!("SocketIO Error: {:#?}", err))
                .on("open", on_open)
                .on("receive_text", on_text)
                .on("receive_control", on_control)
                .connect();

            match socket_result {
                Ok(_) => println!("Socket connection closed."),
                Err(e) => eprintln!("Socket connection failed: {}", e),
            }
        });

        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}