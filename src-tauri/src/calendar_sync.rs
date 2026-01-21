use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub is_syncing: bool,
    pub last_sync: Option<String>,
    pub error: Option<String>,
}

// Global sync state
lazy_static::lazy_static! {
    static ref SYNC_STATE: Arc<Mutex<SyncStatus>> = Arc::new(Mutex::new(SyncStatus {
        is_syncing: false,
        last_sync: None,
        error: None,
    }));
}

/// Start background calendar sync (every 15 minutes)
pub async fn start_background_sync(api_url: String, auth_token: String) {
    let mut interval = interval(Duration::from_secs(15 * 60)); // 15 minutes

    tokio::spawn(async move {
        loop {
            interval.tick().await;
            
            println!("Running background calendar sync...");
            
            let mut state = SYNC_STATE.lock().await;
            state.is_syncing = true;
            state.error = None;
            drop(state); // Release lock before async operation

            match sync_calendar(&api_url, &auth_token).await {
                Ok(_) => {
                    let mut state = SYNC_STATE.lock().await;
                    state.is_syncing = false;
                    state.last_sync = Some(chrono::Utc::now().to_rfc3339());
                    println!("Calendar sync completed successfully");
                }
                Err(e) => {
                    let mut state = SYNC_STATE.lock().await;
                    state.is_syncing = false;
                    state.error = Some(e);
                    eprintln!("Calendar sync failed");
                }
            }
        }
    });
}

/// Perform calendar sync by calling the API
async fn sync_calendar(api_url: &str, auth_token: &str) -> Result<(), String> {
    let client = reqwest::Client::new();
    
    let url = format!("{}/api/calendar-sync", api_url);
    
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", auth_token))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Sync failed: {}", error_text));
    }

    Ok(())
}

/// Manually trigger a calendar sync
#[tauri::command]
pub async fn trigger_calendar_sync(
    api_url: String,
    auth_token: String,
) -> Result<(), String> {
    let mut state = SYNC_STATE.lock().await;
    
    if state.is_syncing {
        return Err("Sync already in progress".to_string());
    }
    
    state.is_syncing = true;
    state.error = None;
    drop(state);

    match sync_calendar(&api_url, &auth_token).await {
        Ok(_) => {
            let mut state = SYNC_STATE.lock().await;
            state.is_syncing = false;
            state.last_sync = Some(chrono::Utc::now().to_rfc3339());
            Ok(())
        }
        Err(e) => {
            let mut state = SYNC_STATE.lock().await;
            state.is_syncing = false;
            state.error = Some(e.clone());
            Err(e)
        }
    }
}

/// Get current sync status
#[tauri::command]
pub async fn get_sync_status() -> Result<SyncStatus, String> {
    let state = SYNC_STATE.lock().await;
    Ok(state.clone())
}

/// Start the background sync service
#[tauri::command]
pub async fn start_sync_service(api_url: String, auth_token: String) -> Result<(), String> {
    start_background_sync(api_url, auth_token).await;
    Ok(())
}
