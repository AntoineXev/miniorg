# Tauri Integration Summary

## Overview

MiniOrg now supports three deployment targets from a single codebase:

1. **Web (Local Dev)**: `npm run dev` - Next.js with local SQLite
2. **Cloudflare Workers**: `npm run build:cloudflare` - Production web app
3. **Tauri Desktop (Mac)**: `npm run tauri:build` - Native Mac application

## Architecture

### Hybrid Architecture
- **Frontend**: Next.js static export bundled in Tauri webview
- **Backend**: Cloudflare Workers API (same as web version)
- **Database**: Remote D1 via API calls (no local database)
- **Auth**: Custom JWT system for desktop (NextAuth for web)

### Authentication Flow

```
User clicks "Login" 
  → Tauri opens browser with Google OAuth
  → Google redirects to tauri://localhost?code=xxx
  → Tauri intercepts deep link
  → Frontend exchanges code for JWT via /api/auth/tauri/token
  → JWT stored in localStorage
  → All API calls include Bearer token
```

## Files Created/Modified

### New Tauri Files
- `src-tauri/` - Complete Rust application
  - `src/main.rs` - Entry point with system tray and shortcuts
  - `src/auth.rs` - OAuth deep link handling
  - `src/notifications.rs` - Native notifications
  - `src/calendar_sync.rs` - Background sync service
  - `Cargo.toml` - Rust dependencies
  - `tauri.conf.json` - Tauri configuration

### New TypeScript Files
- `lib/platform.ts` - Environment detection (Tauri vs Web)
- `lib/auth-tauri.ts` - Tauri auth utilities
- `lib/notifications-tauri.ts` - Native notifications wrapper
- `lib/calendar-sync-tauri.ts` - Calendar sync client
- `providers/tauri-session.tsx` - Unified session provider
- `app/api/auth/tauri/token/route.ts` - JWT exchange endpoint

### Modified Files
- `package.json` - Added Tauri scripts
- `next.config.js` - Added Tauri build mode (static export)
- `lib/api/client.ts` - Added JWT auth and absolute URLs for Tauri

## Key Features

### ✅ Implemented
- [x] Google OAuth login with deep links
- [x] JWT-based session management
- [x] System tray icon
- [x] Global keyboard shortcut (⌘K)
- [x] Native macOS notifications
- [x] Background calendar sync (every 15 min)
- [x] All web features (tasks, calendar, tags)

### 🔄 OAuth Setup Required
Before the app can authenticate, you need to:

1. Create a Google OAuth Desktop client
2. Add redirect URI: `tauri://localhost`
3. Set environment variables:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID_DESKTOP`
   - `GOOGLE_CLIENT_SECRET_DESKTOP` (in Cloudflare)

See `TAURI_SETUP.md` for detailed instructions.

## Build Commands

```bash
# Development
npm run tauri:dev           # Launch Tauri with hot reload

# Production Build
npm run build:tauri         # Build Next.js static export
npm run tauri:build         # Build Mac .app bundle

# Other targets (unchanged)
npm run dev                 # Web dev server
npm run build:cloudflare    # Cloudflare Workers build
```

## Platform Detection

The app automatically detects the environment:

```typescript
import { isTauri } from "@/lib/platform";

if (isTauri()) {
  // Native desktop features
} else {
  // Web features
}
```

## API Communication

### Web Mode
- Uses relative URLs (`/api/tasks`)
- Session via NextAuth cookies
- Same-origin requests

### Tauri Mode
- Uses absolute URLs (`https://your-domain.com/api/tasks`)
- Session via JWT Bearer token
- CORS headers required on backend

## Environment Variables

### For Tauri Dev (.env.tauri)
```env
NEXT_PUBLIC_API_URL=http://localhost:8788
NEXT_PUBLIC_APP_MODE=tauri
NEXT_PUBLIC_GOOGLE_CLIENT_ID_DESKTOP=xxx.apps.googleusercontent.com
```

### For Cloudflare (wrangler secrets)
```bash
wrangler secret put GOOGLE_CLIENT_ID_DESKTOP
wrangler secret put GOOGLE_CLIENT_SECRET_DESKTOP
```

## Testing Strategy

1. **Auth Flow**: Test login/logout in Tauri dev mode
2. **API Calls**: Verify all CRUD operations work
3. **Notifications**: Test native notifications
4. **Keyboard Shortcuts**: Test ⌘K from any app
5. **Calendar Sync**: Verify background sync works
6. **System Tray**: Test tray icon and menu

## Distribution

### Code Signing (Required for Distribution)
1. Get Apple Developer account ($99/year)
2. Create Developer ID certificate
3. Configure in `tauri.conf.json`
4. Notarize the app for macOS Gatekeeper

### Building for Release
```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/macos/MiniOrg.app
```

## Troubleshooting

### Deep Link Not Working
- Verify redirect URI is exactly `tauri://localhost`
- Check OAuth client type is "Desktop app"
- Restart Tauri app after OAuth setup

### API Calls Failing
- Check `NEXT_PUBLIC_API_URL` points to running backend
- Verify JWT token is set (check localStorage)
- Check CORS headers on Cloudflare API

### Build Errors
- Ensure Rust is installed: `rustc --version`
- Update Rust: `rustup update`
- Clean build: `cd src-tauri && cargo clean`

## Next Steps

1. **Create Google OAuth Desktop Client** (REQUIRED)
   - Follow instructions in `TAURI_SETUP.md`
   
2. **Test the Build**
   ```bash
   npm run tauri:dev
   ```

3. **Setup Code Signing** (for distribution)
   - Get Apple Developer account
   - Configure signing identity

4. **Build Production App**
   ```bash
   npm run tauri:build
   ```

5. **Distribute**
   - Notarize the app
   - Create DMG installer
   - Setup auto-updates (optional)

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Deep Links Guide](https://tauri.app/v1/guides/features/deep-link)
- [Google OAuth Desktop](https://developers.google.com/identity/protocols/oauth2/native-app)
- [macOS Code Signing](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
