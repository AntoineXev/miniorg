// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod notifications;
mod calendar_sync;

use tauri::{
    Emitter,
    Manager
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {        
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::start_oauth_flow,
            auth::get_auth_token,
            auth::set_auth_token,
            auth::clear_auth_token,
            auth::start_oauth_listener,
            notifications::send_notification,
            notifications::request_notification_permission,
            calendar_sync::trigger_calendar_sync,
            calendar_sync::get_sync_status,
            calendar_sync::start_sync_service,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
