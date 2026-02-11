use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    #[serde(rename = "roomId")]
    pub room_id: String,
    #[serde(rename = "roomNumber")]
    pub room_number: String,
}

pub struct SessionState(pub Arc<Mutex<SessionInfo>>);

#[tauri::command]
pub fn get_session_info(state: tauri::State<'_, SessionState>) -> SessionInfo {
    state.0.lock().unwrap().clone()
}
