# Tauri Mac App Setup Guide

This guide will help you set up and build the MiniOrg Mac desktop app using Tauri.

## Prerequisites

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, restart your terminal and verify:

```bash
rustc --version
cargo --version
```

### 2. Install Xcode Command Line Tools (macOS)

```bash
xcode-select --install
```

### 3. Install Node.js Dependencies

If not already done:

```bash
npm install
```

## Google OAuth Setup for Desktop App

### Step 1: Create a Desktop OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
5. Select **Desktop app** as the application type
6. Give it a name (e.g., "MiniOrg Desktop")
7. Click **CREATE**
8. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables

Create a `.env.tauri` file in the project root:

```bash
cp .env.tauri.example .env.tauri
```

Edit `.env.tauri` and add your credentials:

```env
NEXT_PUBLIC_API_URL=http://localhost:8788
NEXT_PUBLIC_APP_MODE=tauri
NEXT_PUBLIC_GOOGLE_CLIENT_ID_DESKTOP=your-client-id.apps.googleusercontent.com
```

### Step 3: Update Cloudflare Secrets

The Cloudflare backend also needs the desktop client credentials:

```bash
wrangler secret put GOOGLE_CLIENT_ID_DESKTOP
# Enter: your-client-id.apps.googleusercontent.com

wrangler secret put GOOGLE_CLIENT_SECRET_DESKTOP
# Enter: your-client-secret
```

## Development

### Running in Dev Mode

Start the Tauri dev environment (this will start both Next.js and Tauri):

```bash
npm run tauri:dev
```

This will:
1. Start Next.js dev server on `http://localhost:3000`
2. Launch the Tauri app with hot reload enabled
3. Open the desktop window

**Note:** Make sure your Cloudflare backend is running or set `NEXT_PUBLIC_API_URL` to your deployed URL.

### Testing OAuth Flow

1. Click "Login with Google" in the app
2. Your default browser will open with Google login
3. After authorization, the callback will be handled by the Tauri app
4. You should be logged in automatically

## Building for Production

### Step 1: Build the Next.js Static Export

```bash
npm run build:tauri
```

This creates a static export in the `out/` directory.

### Step 2: Build the Tauri App

```bash
npm run tauri:build
```

This will:
1. Build the Next.js static export (if not already done)
2. Compile the Rust backend
3. Bundle everything into a native Mac `.app` file

The output will be in:
```
src-tauri/target/release/bundle/macos/MiniOrg.app
```

### Step 3: Run the Built App

```bash
open src-tauri/target/release/bundle/macos/MiniOrg.app
```

## Code Signing (Optional but Recommended)

For distribution outside the App Store, you need to sign your app with an Apple Developer account.

### Prerequisites

1. Apple Developer Account ($99/year)
2. Developer ID Application Certificate

### Configure Signing

Edit `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
      }
    }
  }
}
```

Then rebuild:

```bash
npm run tauri:build
```

### Notarization

For macOS Catalina and later, you also need to notarize your app:

```bash
# Install notarization tool
brew install gon

# Create gon config (gon.config.json)
# Then run:
gon gon.config.json
```

See [Apple's notarization guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution) for details.

## App Icons

To generate app icons from your logo:

1. Prepare a 1024x1024 PNG icon
2. Run the Tauri icon generator:

```bash
npm run tauri icon path/to/your/icon.png
```

This will generate all required icon sizes in `src-tauri/icons/`.

## Troubleshooting

### "Failed to open browser" Error

Make sure the default browser is set on your Mac:
- System Preferences > General > Default web browser

### OAuth Callback Not Working

1. Verify the redirect URI in Google Cloud Console is exactly: `tauri://localhost`
2. Check that deep link handling is enabled in `tauri.conf.json`
3. Ensure the OAuth client type is "Desktop app", not "Web application"

### Build Fails on Rust Compilation

1. Update Rust: `rustup update`
2. Clean and rebuild: `cargo clean && npm run tauri:build`

### "Cannot find module" Errors

Make sure you've installed all dependencies:

```bash
npm install
```

### App Won't Start

Check the console logs:

```bash
# View app logs
log stream --predicate 'process == "MiniOrg"' --level debug
```

## Separate Builds

The repo now supports 3 independent build targets:

1. **Local Dev**: `npm run dev` (standard Next.js with local SQLite)
2. **Cloudflare**: `npm run build:cloudflare` (Workers + D1)
3. **Tauri Mac**: `npm run tauri:build` (native desktop app)

Each build is isolated and won't interfere with the others.

## Features

The Tauri app includes:

- ✅ Native macOS notifications
- ✅ Global keyboard shortcut (⌘K for quick add)
- ✅ System tray icon
- ✅ Background calendar sync (every 15 min)
- ✅ Google OAuth authentication
- ✅ All web features (tasks, calendar, tags, etc.)

## Need Help?

- [Tauri Documentation](https://tauri.app/)
- [Tauri Discord](https://discord.com/invite/tauri)
- Check GitHub issues in this repo
