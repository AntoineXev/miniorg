use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Listener};

// Global state to store the OAuth code
struct OAuthState {
    code: Mutex<Option<String>>,
    error: Mutex<Option<String>>,
}

impl Default for OAuthState {
    fn default() -> Self {
        Self {
            code: Mutex::new(None),
            error: Mutex::new(None),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthToken {
    pub token: String,
    pub expires_at: Option<i64>,
}

// Store for persistent auth token
static AUTH_TOKEN: Mutex<Option<AuthToken>> = Mutex::new(None);

/// Start OAuth flow by opening browser
#[tauri::command]
pub async fn start_oauth_flow(
    app_handle: AppHandle,
    auth_url: String,
) -> Result<String, String> {
    println!("Starting OAuth flow with URL: {}", auth_url);
    
    // Open the OAuth URL in the user's default browser
    use tauri_plugin_shell::ShellExt;
    app_handle.shell().open(&auth_url, None)
        .map_err(|e| format!("Failed to open browser: {}", e))?;

    // Register deep link protocol handler
    // The OAuth redirect will be to tauri://localhost?code=xxx
    let _id = app_handle.listen_any("oauth-callback", move |event: tauri::Event| {
        let payload = event.payload();
        println!("Received OAuth callback: {}", payload);
        
        // Parse the callback URL
        if let Ok(url) = url::Url::parse(&format!("tauri://localhost{}", payload)) {
            if let Some(code) = url.query_pairs().find(|(key, _)| key == "code") {
                println!("OAuth code received: {}", code.1);
                // Store the code (this would be picked up by the frontend)
                // In practice, we'll emit an event to the frontend
            }
        }
    });

    Ok("OAuth flow started. Waiting for callback...".to_string())
}

/// Get stored auth token
#[tauri::command]
pub fn get_auth_token() -> Result<Option<AuthToken>, String> {
    let token = AUTH_TOKEN.lock().unwrap();
    Ok(token.clone())
}

/// Set auth token (after successful OAuth)
#[tauri::command]
pub fn set_auth_token(token: String, expires_at: Option<i64>) -> Result<(), String> {
    let mut auth_token = AUTH_TOKEN.lock().unwrap();
    *auth_token = Some(AuthToken { token, expires_at });
    println!("Auth token stored successfully");
    Ok(())
}

/// Clear auth token (logout)
#[tauri::command]
pub fn clear_auth_token() -> Result<(), String> {
    let mut auth_token = AUTH_TOKEN.lock().unwrap();
    *auth_token = None;
    println!("Auth token cleared");
    Ok(())
}

/// Handle deep link callback
pub fn handle_deep_link(app: &AppHandle, url: String) {
    println!("Deep link received: {}", url);
    
    // Parse URL and extract OAuth code
    if let Ok(parsed_url) = url::Url::parse(&url) {
        if let Some(code) = parsed_url.query_pairs().find(|(key, _)| key == "code") {
            // Emit event to frontend with the code
            let _ = app.emit_to("main", "oauth-code-received", code.1.to_string());
        } else if let Some(error) = parsed_url.query_pairs().find(|(key, _)| key == "error") {
            let _ = app.emit_to("main", "oauth-error", error.1.to_string());
        }
    }
}
