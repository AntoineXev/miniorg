use serde::{Deserialize, Serialize};
use keyring::Entry;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Listener};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpListener,
};
use url::Url;

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

#[derive(Debug, Clone, Serialize)]
pub struct OAuthCallbackPayload {
    pub code: String,
    pub state: Option<String>,
}

// Store for persistent auth token
static AUTH_TOKEN: Mutex<Option<AuthToken>> = Mutex::new(None);

const KEYRING_SERVICE: &str = "miniorg";
const KEYRING_USER: &str = "auth_token";

fn keyring_entry() -> Result<Entry, String> {
    Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| e.to_string())
}

fn read_token_from_keyring() -> Result<Option<AuthToken>, String> {
    let entry = keyring_entry()?;
    match entry.get_password() {
        Ok(value) => {
            let token = serde_json::from_str::<AuthToken>(&value)
                .map_err(|e| format!("Failed to parse stored token: {}", e))?;
            Ok(Some(token))
        }
        Err(_) => Ok(None),
    }
}

fn write_token_to_keyring(token: &AuthToken) -> Result<(), String> {
    let entry = keyring_entry()?;
    let payload = serde_json::to_string(token).map_err(|e| e.to_string())?;
    entry.set_password(&payload).map_err(|e| e.to_string())
}

fn clear_token_in_keyring() -> Result<(), String> {
    let entry = keyring_entry()?;
    match entry.delete_password() {
        Ok(_) => Ok(()),
        Err(err) => {
            let message = err.to_string();
            if message.to_lowercase().contains("no entry") {
                return Ok(());
            }
            Err(message)
        }
    }
}

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
    if token.is_some() {
        return Ok(token.clone());
    }
    drop(token);

    let stored = read_token_from_keyring()?;
    let mut token = AUTH_TOKEN.lock().unwrap();
    *token = stored.clone();
    Ok(stored)
}

/// Set auth token (after successful OAuth)
#[tauri::command]
pub fn set_auth_token(token: String, expires_at: Option<i64>) -> Result<(), String> {
    let mut auth_token = AUTH_TOKEN.lock().unwrap();
    let session = AuthToken { token, expires_at };
    *auth_token = Some(session.clone());
    write_token_to_keyring(&session)?;
    Ok(())
}

/// Clear auth token (logout)
#[tauri::command]
pub fn clear_auth_token() -> Result<(), String> {
    let mut auth_token = AUTH_TOKEN.lock().unwrap();
    *auth_token = None;
    clear_token_in_keyring()?;
    Ok(())
}

/// Handle deep link callback
pub fn handle_deep_link(app: &AppHandle, url: String) {
    println!("Deep link received: {}", url);
    
    // Parse URL and extract OAuth code
    if let Ok(parsed_url) = url::Url::parse(&url) {
        if let Some(code) = parsed_url.query_pairs().find(|(key, _)| key == "code") {
            let state = parsed_url
                .query_pairs()
                .find(|(key, _)| key == "state")
                .map(|(_, value)| value.to_string());
            let payload = OAuthCallbackPayload {
                code: code.1.to_string(),
                state,
            };
            let _ = app.emit_to("main", "oauth-code-received", payload);
        } else if let Some(error) = parsed_url.query_pairs().find(|(key, _)| key == "error") {
            let _ = app.emit_to("main", "oauth-error", error.1.to_string());
        }
    }
}

/// Start a loopback HTTP listener for Google OAuth (desktop flow).
/// Returns the redirect URI (http://127.0.0.1:<port>/callback) to use in the auth request.
#[tauri::command]
pub async fn start_oauth_listener(app_handle: AppHandle) -> Result<String, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to bind loopback listener: {}", e))?;

    let port = listener
        .local_addr()
        .map_err(|e| format!("Failed to read loopback port: {}", e))?
        .port();

    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);
    let app_handle_clone = app_handle.clone();

    tauri::async_runtime::spawn(async move {
        // Accept a single request then close
        if let Ok((mut socket, _)) = listener.accept().await {
            let mut buffer = [0u8; 4096];
            let mut request = String::new();

            if let Ok(n) = socket.read(&mut buffer).await {
                request = String::from_utf8_lossy(&buffer[..n]).into_owned();
            }

            let mut code: Option<String> = None;
            let mut error: Option<String> = None;
            let mut state: Option<String> = None;

            if let Some(first_line) = request.lines().next() {
                if let Some(path) = first_line.split_whitespace().nth(1) {
                    if let Ok(parsed) = Url::parse(&format!("http://localhost{}", path)) {
                        if let Some((_, c)) = parsed.query_pairs().find(|(k, _)| k == "code") {
                            code = Some(c.into_owned());
                            state = parsed
                                .query_pairs()
                                .find(|(k, _)| k == "state")
                                .map(|(_, value)| value.into_owned());
                        } else if let Some((_, e)) =
                            parsed.query_pairs().find(|(k, _)| k == "error")
                        {
                            error = Some(e.into_owned());
                        }
                    }
                }
            }

            // Always send a tiny HTML response to close the browser tab
            let body = r#"
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>MiniOrg</title></head>
  <body style="font-family: sans-serif; padding: 24px;">
    <h2>Login received</h2>
    <p>You can close this window and return to MiniOrg.</p>
    <script>window.close();</script>
  </body>
</html>
"#;
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                body
            );

            let _ = socket.write_all(response.as_bytes()).await;
            let _ = socket.shutdown().await;

            if let Some(code) = code {
                let payload = OAuthCallbackPayload { code, state };
                let _ = app_handle_clone.emit_to("main", "oauth-code-received", payload);
            } else if let Some(err) = error {
                let _ = app_handle_clone.emit_to("main", "oauth-error", err);
            } else {
                let _ = app_handle_clone.emit_to(
                    "main",
                    "oauth-error",
                    "Invalid OAuth callback".to_string(),
                );
            }
        }
    });

    Ok(redirect_uri)
}
