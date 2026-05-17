# Desktop App Wrapper - Configuration Guide

## Overview

This guide shows how to convert your Tauri desktop app into a web wrapper that loads the deployed Vercel site.

## Steps

### 1. Deploy to Vercel First

Follow the instructions in `VERCEL_DEPLOYMENT.md` to deploy your app and get the production URL (e.g., `https://isams.vercel.app`)

### 2. Update Tauri Configuration

Edit `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "ISAMS",
  "version": "0.1.0",
  "identifier": "edu.plpasig.isams",
  "build": {
    "devUrl": "https://your-app.vercel.app", // ← Your Vercel URL
    "beforeDevCommand": "", // ← Empty (no local dev)
    "beforeBuildCommand": "" // ← Empty (no build needed)
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "ISAMS - Integrated Smart Academic Management System",
        "url": "https://your-app.vercel.app", // ← Your Vercel URL
        "width": 1200,
        "height": 800,
        "visible": true,
        "resizable": true,
        "fullscreen": false,
        "decorations": true
      }
    ],
    "security": {
      "csp": "default-src 'self' https://your-app.vercel.app https://*.supabase.co https://*.supabase.in https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://your-app.vercel.app; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://your-app.vercel.app https://*.supabase.co; connect-src 'self' https://your-app.vercel.app https://*.supabase.co https://*.supabase.in https://accounts.google.com https://www.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https:;"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [], // ← Empty (no backend files)
    "externalBin": []
  },
  "plugins": {}
}
```

### 3. Build Desktop Installer

```bash
npm run tauri build
```

The installer will be created in `src-tauri/target/release/bundle/`

### 4. Installer Locations

- **Windows**: `src-tauri/target/release/bundle/nsis/ISAMS_*.exe`
- **Mac**: `src-tauri/target/release/bundle/dmg/ISAMS_*.dmg`
- **Linux**: `src-tauri/target/release/bundle/appimage/isams_*.AppImage`

## Benefits of This Approach

✅ **Tiny installer** (~5-10MB instead of 100s of MB)
✅ **Google Auth works** (runs on real web domain)
✅ **Easy updates** (update Vercel, everyone gets it)
✅ **No backend bundling issues**
✅ **Cross-platform** (Windows, Mac, Linux)
✅ **Native experience** (system tray, notifications, etc.)

## Development Workflow

### For Web Development:

```bash
# Deploy changes to Vercel
vercel --prod
```

### For Desktop App Updates:

```bash
# Update tauri.conf.json if needed
npm run tauri build
# Distribute new installer
```

## Alternative: Electron Wrapper

If you prefer Electron over Tauri:

### Install Electron

```bash
npm install electron --save-dev
npm install electron-builder --save-dev
```

### Create `electron-main.js`:

```javascript
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your Vercel URL
  win.loadURL("https://your-app.vercel.app");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### Update `package.json`:

```json
{
  "main": "electron-main.js",
  "scripts": {
    "electron": "electron .",
    "electron:build": "electron-builder"
  },
  "build": {
    "appId": "edu.plpasig.isams",
    "productName": "ISAMS",
    "files": ["electron-main.js", "src-tauri/icons/**"],
    "win": {
      "target": "nsis",
      "icon": "src-tauri/icons/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "src-tauri/icons/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "src-tauri/icons"
    }
  }
}
```

### Build Electron App:

```bash
npm run electron:build
```

## Comparison: Tauri vs Electron

| Feature             | Tauri         | Electron    |
| ------------------- | ------------- | ----------- |
| **Size**            | ~5-10MB       | ~150MB      |
| **Memory**          | Low           | High        |
| **Speed**           | Fast          | Moderate    |
| **Setup**           | Complex       | Simple      |
| **Current Project** | Already setup | Need to add |

**Recommendation**: Since Tauri is already in your project, use it! Just update the config to load the remote URL.

## Troubleshooting

### Issue: App shows blank screen

- Check the URL in tauri.conf.json is correct
- Verify Vercel deployment is working
- Check browser console in the app (View > Developer > Toggle DevTools)

### Issue: CSP errors

- Update the CSP in tauri.conf.json to allow your domains
- Include Supabase, Google, and your Vercel domain

### Issue: OAuth redirect fails

- Make sure redirect URIs in Google Console include both:
  - `https://your-app.vercel.app/api/oauth2callback`
  - `http://localhost:3000/api/oauth2callback` (for testing)

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Update `tauri.conf.json` with Vercel URL
3. ✅ Build desktop installer
4. ✅ Test the app
5. ✅ Distribute to users
