use tauri::{Manager, Emitter}; 
use rust_socketio::{ClientBuilder, Payload, RawClient}; 
use serde_json::json;
use enigo::{Enigo, Settings, Key, Direction, Keyboard}; 
use std::thread;
use std::time::Duration;

use windows::Win32::Foundation::{HWND, LPARAM, WPARAM, BOOL};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_UNICODE, KEYEVENTF_KEYUP, VIRTUAL_KEY,
    VK_SHIFT, VK_OEM_COMMA, VK_OEM_PERIOD, VK_OEM_1, VK_OEM_2, VK_OEM_3, VK_OEM_4, VK_OEM_5, VK_OEM_6, VK_OEM_7, VK_OEM_MINUS
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, SendMessageW, WM_IME_CONTROL
};
use windows::Win32::UI::Input::Ime::{ImmGetDefaultIMEWnd};

// 关键常量：获取开启状态 (对应 Shift 切换)
const IMC_GETOPENSTATUS: WPARAM = WPARAM(0x0005);

// 映射表：仅包含全角中文标点 -> (虚拟键码, 是否需要 Shift)
// 只有这些特定的全角标点在中文模式下会被 Unicode 注入吞掉，因此需要走物理映射。
fn get_chinese_punctuation_mapping(c: char) -> Option<(VIRTUAL_KEY, bool)> {
    match c {
        '，' => Some((VK_OEM_COMMA, false)),
        '。' => Some((VK_OEM_PERIOD, false)),
        '；' => Some((VK_OEM_1, false)),
        '：' => Some((VK_OEM_1, true)),
        '？' => Some((VK_OEM_2, true)),
        '、' => Some((VK_OEM_5, false)),
        '‘' | '’' => Some((VK_OEM_7, false)),
        '“' | '”' => Some((VK_OEM_7, true)),
        '【' => Some((VK_OEM_4, false)),
        '】' => Some((VK_OEM_6, false)),
        '—' => Some((VK_OEM_MINUS, true)),
        '~' => Some((VK_OEM_3, true)),
        _ => None,
    }
}

fn send_physical_key(vk: VIRTUAL_KEY, need_shift: bool) {
    if need_shift {
        let shift_down = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 { ki: KEYBDINPUT { wVk: VK_SHIFT, wScan: 0, dwFlags: windows::Win32::UI::Input::KeyboardAndMouse::KEYBD_EVENT_FLAGS(0), time: 0, dwExtraInfo: 0 } },
        };
        unsafe { SendInput(&[shift_down], std::mem::size_of::<INPUT>() as i32); }
    }
    let key_down = INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 { ki: KEYBDINPUT { wVk: vk, wScan: 0, dwFlags: windows::Win32::UI::Input::KeyboardAndMouse::KEYBD_EVENT_FLAGS(0), time: 0, dwExtraInfo: 0 } },
    };
    let key_up = INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 { ki: KEYBDINPUT { wVk: vk, wScan: 0, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } },
    };
    unsafe { SendInput(&[key_down, key_up], std::mem::size_of::<INPUT>() as i32); }
    if need_shift {
        let shift_up = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 { ki: KEYBDINPUT { wVk: VK_SHIFT, wScan: 0, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } },
        };
        unsafe { SendInput(&[shift_up], std::mem::size_of::<INPUT>() as i32); }
    }
}

fn send_unicode_char(c: char) {
    let mut buf = [0; 2];
    for u16_ref in c.encode_utf16(&mut buf) {
        let u16_code = *u16_ref;
        let input_down = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 { ki: KEYBDINPUT { wVk: VIRTUAL_KEY(0), wScan: u16_code, dwFlags: KEYEVENTF_UNICODE, time: 0, dwExtraInfo: 0 } },
        };
        let input_up = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 { ki: KEYBDINPUT { wVk: VIRTUAL_KEY(0), wScan: u16_code, dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } },
        };
        unsafe { SendInput(&[input_down, input_up], std::mem::size_of::<INPUT>() as i32); }
    }
}

fn send_sequence(text: &str) {
    let target_hwnd = unsafe { GetForegroundWindow() };
    let ime_hwnd = unsafe { ImmGetDefaultIMEWnd(target_hwnd) };
    
    // 使用 OpenStatus 判定：true=中文, false=英文
    let mut is_chinese_mode = false;
    if ime_hwnd.0 != 0 {
        let res = unsafe { SendMessageW(ime_hwnd, WM_IME_CONTROL, IMC_GETOPENSTATUS, LPARAM(0)) };
        is_chinese_mode = res.0 != 0;
        println!("[DEBUG] Target HWND: {:?}, IME Open: {} => {}", 
            target_hwnd, 
            is_chinese_mode,
            if is_chinese_mode { "【中文模式】" } else { "【英文模式】" }
        );
    }

    for c in text.chars() {
        let mut use_physical_key = false;
        let mut vk_to_press = VIRTUAL_KEY(0);
        let mut need_shift = false;

        if is_chinese_mode {
            // 分支 B: 中文模式
            // 只有当字符是【全角中文标点】时，才走物理映射
            if let Some((vk, shift)) = get_chinese_punctuation_mapping(c) {
                use_physical_key = true;
                vk_to_press = vk;
                need_shift = shift;
            }
            // 汉字、半角标点、Emoji 等 -> use_physical_key 为 false -> 走 Unicode
        } else {
            // 分支 A: 英文模式 -> 全部走 Unicode
            use_physical_key = false;
        }

        if use_physical_key {
            println!("Char '{}' -> Physical", c);
            send_physical_key(vk_to_press, need_shift);
        } else {
            println!("Char '{}' -> Unicode", c);
            send_unicode_char(c);
        }
        
        thread::sleep(Duration::from_millis(20));
    }
}

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
        thread::spawn(move || {
            let app_handle_for_text = app_handle.clone();
            let app_handle_for_control = app_handle.clone();
            let on_text = move |payload: Payload, _socket: RawClient| {
                let text_opt: Option<String> = match payload {
                    Payload::Text(args) => args.get(0).and_then(|v| {
                        if v.is_string() { v.as_str().map(|s| s.to_string()) }
                        else { v.get("text").and_then(|t| t.as_str()).map(|s| s.to_string()) }
                    }),
                    Payload::String(s) => serde_json::from_str::<serde_json::Value>(&s).ok()
                        .and_then(|v| if v.is_string() { v.as_str().map(|s| s.to_string()) } 
                                      else { v.get("text").and_then(|t| t.as_str()).map(|s| s.to_string()) }),
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
                     Payload::String(s) => serde_json::from_str::<serde_json::Value>(&s).ok()
                         .and_then(|v| v.get("action").and_then(|a| a.as_str()).map(|s| s.to_string())),
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
            let on_open = |_: Payload, socket: RawClient| {
                let _ = socket.emit("join_room", json!("demo-room"));
            };
            ClientBuilder::new("http://10.10.114.222:3000")
                .namespace("/")
                .on("open", on_open)
                .on("receive_text", on_text)
                .on("receive_control", on_control)
                .connect()
                .ok();
        });
        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
