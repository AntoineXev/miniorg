// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod notifications;
mod calendar_sync;

use tauri::{
    Emitter,
    Manager,
    AppHandle,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, Code, Modifiers, ShortcutState};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_nspanel::{
    tauri_panel,
    ManagerExt as NsPanelManagerExt,
    WebviewWindowExt,
    CollectionBehavior,
    PanelLevel,
    StyleMask,
};

// Define our custom panel type that can appear over fullscreen apps
tauri_panel! {
    panel!(QuickAddPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
    })
}

#[tauri::command]
fn show_quick_add_window(app: AppHandle) -> Result<(), String> {
    if let Ok(panel) = app.get_webview_panel("quick-add") {
        panel.show();
        panel.make_key_window();
        app.emit("open-quick-add", ()).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Quick add panel not found".to_string())
    }
}

#[tauri::command]
fn hide_quick_add_window(app: AppHandle) -> Result<(), String> {
    if let Ok(panel) = app.get_webview_panel("quick-add") {
        panel.hide();
        Ok(())
    } else {
        Err("Quick add panel not found".to_string())
    }
}

fn toggle_quick_add_window(app: AppHandle) {
    if let Ok(panel) = app.get_webview_panel("quick-add") {
        if panel.is_visible() {
            panel.hide();
        } else {
            panel.show();
            panel.make_key_window();
            let _ = app.emit("open-quick-add", ());
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_nspanel::init())
        .setup(|app| {
            // Handle deep links - focus the main window when a deep link is received
            #[cfg(desktop)]
            app.deep_link().on_open_url(|event| {
                // Deep link received, the app will be focused automatically
                // The URL is available in event.urls() if we need to handle specific routes
            });

            // Set activation policy to Accessory (required for panel to work over fullscreen)
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Convert the quick-add window to a panel so it can appear over fullscreen apps
            if let Some(quick_add_window) = app.get_webview_window("quick-add") {
                let panel = quick_add_window.to_panel::<QuickAddPanel>()
                    .expect("Failed to convert quick-add to panel");

                // Set floating level to appear above normal windows
                panel.set_level(PanelLevel::Floating.value());

                // Set style mask for non-activating panel behavior
                panel.set_style_mask(StyleMask::empty().nonactivating_panel().into());

                // Set collection behavior for fullscreen overlay:
                // - full_screen_auxiliary: display on same space as fullscreen window
                // - can_join_all_spaces: appear on all spaces/desktops
                panel.set_collection_behavior(
                    CollectionBehavior::new()
                        .full_screen_auxiliary()
                        .can_join_all_spaces()
                        .into(),
                );

                // Keep panel visible when app is deactivated
                panel.set_hides_on_deactivate(false);
            }

            // Register global shortcut Cmd+K (macOS) / Ctrl+K (Windows/Linux)
            let app_handle = app.handle().clone();

            #[cfg(target_os = "macos")]
            let shortcut = Shortcut::new(Some(Modifiers::META), Code::KeyK);

            #[cfg(not(target_os = "macos"))]
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyK);

            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                // Only trigger on key press, not release
                if event.state == ShortcutState::Pressed {
                    toggle_quick_add_window(app_handle.clone());
                }
            }).expect("Failed to register global shortcut");

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
            show_quick_add_window,
            hide_quick_add_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
