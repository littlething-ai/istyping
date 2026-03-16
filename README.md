# IsTyping

IsTyping lets you use your phone as a lightweight input tool for your desktop.

The project includes:
- A Windows desktop app built with Tauri
- A phone-friendly web input page
- A small Socket.IO backend for room pairing and input delivery

IsTyping is currently in public alpha. The core pairing and typing flow is usable today, and the project is now open source on GitHub.

## Links

- Website: [https://istyping.app](https://istyping.app)
- Web input: [https://istyping.app/input](https://istyping.app/input)
- GitHub: [https://github.com/littlething-ai/istyping](https://github.com/littlething-ai/istyping)
- Latest Windows download: [v0.1.1 MSI](https://github.com/littlething-ai/istyping/releases/download/v0.1.1/istyping_0.1.1_x64_en-US.msi)
- Release notes: [v0.1.1](https://github.com/littlething-ai/istyping/releases/tag/v0.1.1)

## What It Does

- Creates a room on desktop and lets a phone join by QR code or room number
- Sends text and simple control actions from the phone to the desktop
- Keeps the desktop side lightweight with a tray-first, always-available workflow
- Provides a product homepage at `/` and a dedicated phone input experience at `/input`

## Current Status

- Desktop app: Windows available now
- Mobile side: modern mobile browsers supported
- macOS: planned, not available yet
- Project status: public alpha

## Project Structure

- [`desktop`](./desktop): Tauri desktop app, pairing window, settings window, floating island UI
- [`web`](./web): Next.js marketing site and `/input` web client
- [`backend`](./backend): Express + Socket.IO room and relay service
- [`doc`](./doc): product, launch, release, and architecture notes

## Quick Start

### 1. Start the backend

```bash
cd backend
npm install
node server.js
```

The backend listens on port `2020` by default.

### 2. Start the web app

```bash
cd web
npm install
npm run dev
```

The web app runs on port `3001` in development.

### 3. Start the desktop app

```bash
cd desktop
npm install
npm run tauri dev
```

## Build

### Web

```bash
cd web
npm run build
```

### Desktop

```bash
cd desktop
npm run build
npm run tauri build
```

The Windows installer is generated under `desktop/src-tauri/target/release/bundle/msi/`.

## Documentation

Start with [`doc/README.md`](./doc/README.md) for a guide to the available docs.

Helpful documents:
- [`RUN_GUIDE.md`](./doc/RUN_GUIDE.md)
- [`CLIENT_NETWORK_ARCHITECTURE.md`](./doc/CLIENT_NETWORK_ARCHITECTURE.md)
- [`WEBSITE_LAUNCH_COPY_AND_STRUCTURE.md`](./doc/WEBSITE_LAUNCH_COPY_AND_STRUCTURE.md)
- [`RELEASE_DISTRIBUTION_GUIDE.md`](./doc/RELEASE_DISTRIBUTION_GUIDE.md)

## Contributing

Contributions, bug reports, and product feedback are welcome.

Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

## Changelog

Release history is tracked in [`CHANGELOG.md`](./CHANGELOG.md).

## License

The project does not have a repository-wide license file yet.

Until a license is added, please do not assume reuse rights beyond normal GitHub viewing and collaboration expectations.
