use windows::Win32::Foundation::{HWND, LPARAM, WPARAM};
use windows::Win32::UI::Input::Ime::{ImmGetDefaultIMEWnd, IME_CMODE_NATIVE};
use windows::Win32::UI::Input::KeyboardAndMouse::GetKeyboardLayout;
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, SendMessageW, WM_IME_CONTROL, GetWindowTextW, GetWindowThreadProcessId
};
use std::{thread, time::Duration};

const IMC_GETCONVERSIONMODE: WPARAM = WPARAM(0x0001);
const IMC_GETOPENSTATUS: WPARAM = WPARAM(0x0005); // 新增：检测开启状态

fn get_window_title(hwnd: HWND) -> String {
    let mut buf = [0u16; 512];
    let len = unsafe { GetWindowTextW(hwnd, &mut buf) };
    if len > 0 {
        String::from_utf16_lossy(&buf[..len as usize])
    } else {
        "Unknown".to_string()
    }
}

fn main() {
    println!("=== IME Monitor (Mode + OpenStatus) ===");
    println!("Printing status every 1 second...");
    println!("Please toggle Shift to see if 'Open' changes.");
    println!("-------------------------------------------");

    loop {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0 != 0 {
                let title = get_window_title(hwnd);
                
                let thread_id = GetWindowThreadProcessId(hwnd, None);
                let hkl = GetKeyboardLayout(thread_id);
                let lang_id = (hkl.0 as u32) & 0xFFFF;

                let ime_hwnd = ImmGetDefaultIMEWnd(hwnd);
                
                if ime_hwnd.0 != 0 {
                    // 1. Check Conversion Mode
                    let res_mode = SendMessageW(ime_hwnd, WM_IME_CONTROL, IMC_GETCONVERSIONMODE, LPARAM(0));
                    let mode = res_mode.0 as u32;
                    
                    // 2. Check Open Status (关键！)
                    let res_open = SendMessageW(ime_hwnd, WM_IME_CONTROL, IMC_GETOPENSTATUS, LPARAM(0));
                    let is_open = res_open.0 != 0;

                    let status_str = if is_open { "【中文/Open】" } else { "【英文/Closed】" };
                    
                    println!("Window: [{}] | Lang: {:04X} | Open: {:<5} | Mode: {:08X} => {}", 
                        title, lang_id, is_open, mode, status_str
                    );
                } else {
                    println!("Window: [{}] | Lang: {:04X} | No IME Window", title, lang_id);
                }
            }
        }
        thread::sleep(Duration::from_secs(1));
    }
}