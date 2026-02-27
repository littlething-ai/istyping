use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Participant {
    pub id: String,
    pub device_name: String,
    pub device_type: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
    Error,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub room_id: String,
    pub room_number: String,
    pub participants: Vec<Participant>,
    pub status: ConnectionStatus,
    pub server_url: String,
}

pub struct SessionState(pub Arc<Mutex<SessionInfo>>);

#[tauri::command]
pub fn get_session_info(state: tauri::State<'_, SessionState>) -> SessionInfo {
    state.0.lock().unwrap().clone()
}
