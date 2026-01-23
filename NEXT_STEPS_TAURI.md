# Next Steps for Tauri Integration

## ⚠️ IMPORTANT: Manual Steps Required

The Tauri integration is **90% complete**, but there are a few manual steps you need to complete before the app will work.

## 1. Install Rust (5 minutes)

Open your terminal and run:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow the prompts, then restart your terminal and verify:

```bash
rustc --version
cargo --version
```

## 2. Create Google OAuth Desktop Client (10 minutes)

This is **CRITICAL** - without this, the app cannot authenticate users.

### Step-by-Step:

1. Go to https://console.cloud.google.com/
2. Select your existing project (where you already have the web OAuth client)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
5. Choose **Desktop app** as the application type
6. Name it "MiniOrg Desktop"
7. Click **CREATE**
8. **IMPORTANT**: Copy the Client ID and Client Secret

### Add the Redirect URI:

- The desktop client should automatically have redirect URIs configured
- If not, manually add: `http://localhost` and `urn:ietf:wg:oauth:2.0:oob`
- The app will actually use `tauri://localhost` which is handled by Tauri

## 3. Configure Environment Variables

### For Local Development:

Create a file `.env.tauri` in the project root:

```bash
# In /Users/antoine/Projects/miniorg/
touch .env.tauri
```

Add these lines (replace with your actual values):

```env
NEXT_PUBLIC_API_URL=http://localhost:8788
NEXT_PUBLIC_APP_MODE=tauri
NEXT_PUBLIC_GOOGLE_CLIENT_ID_DESKTOP=YOUR_DESKTOP_CLIENT_ID.apps.googleusercontent.com
```

### For Cloudflare Backend:

The backend also needs to know about the desktop client:

```bash
wrangler secret put GOOGLE_CLIENT_ID_DESKTOP
# Enter your desktop client ID when prompted

wrangler secret put GOOGLE_CLIENT_SECRET_DESKTOP
# Enter your desktop client secret when prompted
```

## 4. Install Tauri CLI

Since npm had permission issues, let's add it properly:

```bash
# Fix npm permissions first (if needed)
sudo chown -R $(whoami) ~/.npm

# Then install Tauri CLI
npm install --save-dev @tauri-apps/cli@latest
```

## 5. Test the Build

Once Rust and the OAuth client are set up:

```bash
# Start the Tauri dev environment
npm run tauri:dev
```

This will:
- Build the Next.js app
- Launch the Tauri app in a native window
- Enable hot reload for development

**Make sure your Cloudflare backend is running** (or set `NEXT_PUBLIC_API_URL` to your deployed URL).

## 6. Integration with Your Existing Code

You need to integrate the `TauriSessionProvider` into your app layout.

### Option A: Replace SessionProvider in dashboard layout

Edit `app/(dashboard)/layout.tsx`:

```typescript
import { SessionProvider } from "next-auth/react";
import { TauriSessionProvider } from "@/providers/tauri-session";
import { isTauri } from "@/lib/platform";

// In the component:
const Provider = isTauri() ? TauriSessionProvider : SessionProvider;

return (
  <Provider>
    {/* your existing layout */}
  </Provider>
);
```

### Option B: Wrap your entire app

Edit `app/layout.tsx` to add the TauriSessionProvider at the root level.

## 7. Update Login Page for Tauri

Edit `app/(auth)/login/page.tsx` to handle Tauri login:

```typescript
import { useTauriSession } from "@/providers/tauri-session";
import { isTauri } from "@/lib/platform";

export default function LoginPage() {
  const { login } = useTauriSession();
  
  const handleLogin = async () => {
    if (isTauri()) {
      await login(); // Will open browser for OAuth
    } else {
      // Your existing web login flow
    }
  };
  
  // Rest of your component
}
```

## 8. Generate App Icons (Optional)

Once you have a 1024x1024 PNG logo:

```bash
npm run tauri icon path/to/your/logo.png
```

This will generate all required icon sizes.

## Testing Checklist

Once everything is set up:

- [ ] Rust installed and working
- [ ] Google OAuth Desktop client created
- [ ] Environment variables configured (.env.tauri)
- [ ] Cloudflare secrets set (GOOGLE_CLIENT_ID_DESKTOP, GOOGLE_CLIENT_SECRET_DESKTOP)
- [ ] `npm run tauri:dev` launches successfully
- [ ] Can login with Google (opens browser, returns to app)
- [ ] Tasks, calendar, and other features work
- [ ] ⌘K quick-add works from anywhere
- [ ] System tray icon appears
- [ ] Notifications work

## Build for Production

When you're ready to create a distributable app:

```bash
npm run tauri:build
```

The app will be in:
```
src-tauri/target/release/bundle/macos/MiniOrg.app
```

You can run it directly:
```bash
open src-tauri/target/release/bundle/macos/MiniOrg.app
```

## For Distribution

To distribute outside of your machine, you'll need:

1. **Apple Developer Account** ($99/year)
2. **Code Signing Certificate**
3. **Notarization** (for macOS Gatekeeper)

See `TAURI_SETUP.md` for detailed instructions.

## Questions or Issues?

If you encounter problems:

1. Check `TAURI_SETUP.md` for troubleshooting
2. Check `docs/TAURI_INTEGRATION.md` for architecture details
3. The Rust code is in `src-tauri/src/` if you need to debug
4. Tauri logs can be viewed with: `log stream --predicate 'process == "MiniOrg"' --level debug`

## Summary

What's been implemented:
- ✅ Complete Tauri setup
- ✅ OAuth flow with deep links
- ✅ JWT authentication system
- ✅ API client with bearer tokens
- ✅ Native notifications
- ✅ Global shortcuts (⌘K)
- ✅ System tray
- ✅ Background calendar sync
- ✅ Build scripts

What you need to do:
- 🔲 Install Rust
- 🔲 Create Google OAuth Desktop client
- 🔲 Configure environment variables
- 🔲 Integrate TauriSessionProvider in your layouts
- 🔲 Test the app

Once these steps are complete, you'll have a fully functional Mac desktop app! 🎉
