use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationPayload {
    pub title: String,
    pub body: String,
}

/// Send a native system notification
#[tauri::command]
pub fn send_notification(
    app_handle: AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    app_handle.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| format!("Failed to send notification: {}", e))
}

/// Request notification permissions (macOS)
#[tauri::command]
pub fn request_notification_permission() -> Result<bool, String> {
    // On macOS, permissions are requested automatically on first notification
    // This is a placeholder for future permission checking
    Ok(true)
}
