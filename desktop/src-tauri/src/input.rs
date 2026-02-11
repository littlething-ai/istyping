use std::thread;
use std::time::Duration;
use windows::Win32::Foundation::{LPARAM, WPARAM};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_UNICODE, KEYEVENTF_KEYUP, VIRTUAL_KEY,
    VK_SHIFT, VK_OEM_COMMA, VK_OEM_PERIOD, VK_OEM_1, VK_OEM_2, VK_OEM_3, VK_OEM_4, VK_OEM_5, VK_OEM_6, VK_OEM_7, VK_OEM_MINUS
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, SendMessageW, WM_IME_CONTROL
};
use windows::Win32::UI::Input::Ime::{ImmGetDefaultIMEWnd};

const IMC_GETOPENSTATUS: WPARAM = WPARAM(0x0005);

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

pub fn send_sequence(text: &str) {
    let target_hwnd = unsafe { GetForegroundWindow() };
    let ime_hwnd = unsafe { ImmGetDefaultIMEWnd(target_hwnd) };
    
    let mut is_chinese_mode = false;
    if ime_hwnd.0 != 0 {
        let res = unsafe { SendMessageW(ime_hwnd, WM_IME_CONTROL, IMC_GETOPENSTATUS, LPARAM(0)) };
        is_chinese_mode = res.0 != 0;
    }

    for c in text.chars() {
        let mut use_physical_key = false;
        let mut vk_to_press = VIRTUAL_KEY(0);
        let mut need_shift = false;

        if is_chinese_mode {
            if let Some((vk, shift)) = get_chinese_punctuation_mapping(c) {
                use_physical_key = true;
                vk_to_press = vk;
                need_shift = shift;
            }
        }

        if use_physical_key {
            send_physical_key(vk_to_press, need_shift);
        } else {
            send_unicode_char(c);
        }
        
        thread::sleep(Duration::from_millis(20));
    }
}
