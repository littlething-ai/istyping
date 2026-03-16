# Desktop

This package contains the IsTyping desktop client built with Tauri, React, and Vite.

## What It Includes

- Floating island desktop UI
- Pairing window with QR code and room number
- Settings window for backend configuration and custom room ID
- System tray controls for showing, hiding, and repositioning the island
- Windows packaging through Tauri

## Run Locally

```bash
cd desktop
npm install
npm run tauri dev
```

## Build

```bash
cd desktop
npm run build
npm run tauri build
```

The MSI output is generated in `desktop/src-tauri/target/release/bundle/msi/`.

## Notes

- The desktop app is currently packaged for Windows
- In development, the app can fall back to a fixed debug room unless a custom room ID is set
- The floating island can be shown or hidden from the tray, and its position is persisted
