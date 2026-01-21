// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod notifications;
mod calendar_sync;

use tauri::{
    Emitter,
    Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Build tray menu
            let show_menu = MenuItemBuilder::with_id("show", "Show").build(app)?;
            let quit_menu = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&show_menu)
                .separator()
                .item(&quit_menu)
                .build()?;

            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Register global shortcut for quick add (Cmd+K / Ctrl+K)
            let handle = app.handle().clone();
            
            #[cfg(target_os = "macos")]
            let shortcut_str = "Command+K";
            #[cfg(not(target_os = "macos"))]
            let shortcut_str = "Ctrl+K";

            let shortcut: Shortcut = shortcut_str.parse().unwrap();
            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("quick-add-shortcut", ());
                }
            }).unwrap_or_else(|err| {
                eprintln!("Failed to register global shortcut: {}", err);
            });

            app.global_shortcut().register(shortcut).unwrap_or_else(|err| {
                eprintln!("Failed to register global shortcut: {}", err);
            });

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
