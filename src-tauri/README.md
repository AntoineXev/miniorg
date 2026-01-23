# Tauri Backend (Rust)

This directory contains the Rust backend for the MiniOrg desktop application.

## Structure

```
src-tauri/
├── src/
│   ├── main.rs           # Entry point, system tray, global shortcuts
│   ├── auth.rs           # OAuth deep link handling, JWT storage
│   ├── notifications.rs  # Native macOS notifications
│   └── calendar_sync.rs  # Background calendar sync service
├── icons/                # App icons (generated)
├── Cargo.toml           # Rust dependencies
├── tauri.conf.json      # Tauri configuration
└── build.rs             # Build script
```

## Modules

### `main.rs`
- Application entry point
- System tray setup (show/quit menu)
- Global keyboard shortcut (⌘K)
- Event handlers for tray clicks
- Registers all Tauri commands

### `auth.rs`
- `start_oauth_flow()` - Opens browser with OAuth URL
- `get_auth_token()` - Retrieves stored JWT
- `set_auth_token()` - Saves JWT after successful login
- `clear_auth_token()` - Logout, clears JWT
- `handle_deep_link()` - Processes `tauri://localhost` callbacks

### `notifications.rs`
- `send_notification()` - Sends native macOS notification
- `request_notification_permission()` - Requests permission (auto on first use)

### `calendar_sync.rs`
- `start_sync_service()` - Starts background sync (every 15 min)
- `trigger_calendar_sync()` - Manual sync trigger
- `get_sync_status()` - Get current sync state
- Background task that calls `/api/calendar-sync` periodically

## Dependencies

Key Rust crates used:

- `tauri` - Desktop app framework
- `serde` - JSON serialization
- `tokio` - Async runtime
- `reqwest` - HTTP client for API calls
- `chrono` - Date/time handling
- `lazy_static` - Global state management

## Building

### Development
```bash
cargo build
```

### Release
```bash
cargo build --release
```

### With Tauri CLI
```bash
npm run tauri:dev    # Dev with hot reload
npm run tauri:build  # Production build
```

## Tauri Commands

Commands exposed to the frontend via `window.__TAURI__.tauri.invoke()`:

### Auth
- `start_oauth_flow(auth_url: String)`
- `get_auth_token() -> Option<AuthToken>`
- `set_auth_token(token: String, expires_at: Option<i64>)`
- `clear_auth_token()`

### Notifications
- `send_notification(title: String, body: String)`
- `request_notification_permission() -> bool`

### Calendar Sync
- `start_sync_service(api_url: String, auth_token: String)`
- `trigger_calendar_sync(api_url: String, auth_token: String)`
- `get_sync_status() -> SyncStatus`

## Configuration

### `tauri.conf.json`

Key settings:
- `identifier`: `com.miniorg.app` (must be unique)
- `allowlist`: Security permissions
  - `shell.open`: For opening OAuth URLs
  - `http.all`: For API calls
  - `notification.all`: For native notifications
  - `globalShortcut.all`: For ⌘K shortcut
- `systemTray`: System tray icon config
- `windows`: Default window size and settings

## Deep Link Setup

The app registers `tauri://` as a custom protocol to handle OAuth callbacks.

Flow:
1. User clicks login
2. Browser opens: `https://accounts.google.com/o/oauth2/v2/auth?...`
3. Google redirects to: `tauri://localhost?code=xxx`
4. macOS routes to the app
5. App emits `oauth-code-received` event
6. Frontend exchanges code for JWT

## System Tray

The app runs in the system tray with a menu:
- **Show**: Brings window to front
- **Quit**: Exits the application

Left-click on tray icon also shows the window.

## Global Shortcuts

- **⌘K** (macOS) / **Ctrl+K** (others): Opens quick-add task modal
  - Works even when app is in background
  - Brings window to focus and emits `quick-add-shortcut` event

## Debugging

### View Logs
```bash
# macOS
log stream --predicate 'process == "MiniOrg"' --level debug

# Or within Rust code
println!("Debug: {}", value);
eprintln!("Error: {}", error);
```

### Dev Tools
In development mode, open dev tools with:
- Right-click → Inspect Element
- Or add to menu in `tauri.conf.json`

## Security

### Allowlist
Only explicitly allowed APIs are accessible. Never use `"all": true` in production.

### CSP
Content Security Policy is configured in `tauri.conf.json` to prevent XSS.

### HTTPS
All external API calls should use HTTPS in production.

## Platform-Specific Code

### macOS
```rust
#[cfg(target_os = "macos")]
let shortcut = "Command+K";

#[cfg(not(target_os = "macos"))]
let shortcut = "Ctrl+K";
```

Currently only macOS is targeted, but the app can be extended to Windows/Linux.

## Building for Distribution

### Code Signing (macOS)
1. Get Apple Developer certificate
2. Add to `tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name"
    }
  }
}
```

### Icon Generation
```bash
npm run tauri icon path/to/icon.png
```

Generates all required sizes in `icons/`.

## Troubleshooting

### Build fails
- Update Rust: `rustup update`
- Clean build: `cargo clean`
- Check Xcode CLI tools: `xcode-select --install`

### Linking errors
- Install required system libraries
- Check `Cargo.toml` dependencies

### Runtime errors
- Check console logs
- Verify allowlist permissions
- Test API endpoints separately

## Resources

- [Tauri Docs](https://tauri.app/v1/guides/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Tokio Docs](https://tokio.rs/)
