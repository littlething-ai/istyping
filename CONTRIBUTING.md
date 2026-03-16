# Contributing

Thanks for taking an interest in IsTyping.

The project is still early, so the best contributions are focused bug fixes, clear issue reports, small UX improvements, and documentation polish.

## Before You Start

- Read the root [`README.md`](/D:/1_Workspace/little_thing/istyping/README.md)
- Skim [`doc/README.md`](/D:/1_Workspace/little_thing/istyping/doc/README.md) for project context
- Check whether the change belongs in `desktop`, `web`, or `backend`

## Development Setup

### Backend

```bash
cd backend
npm install
node server.js
```

### Web

```bash
cd web
npm install
npm run dev
```

### Desktop

```bash
cd desktop
npm install
npm run tauri dev
```

## Contribution Guidelines

- Keep pull requests focused on one problem or one improvement
- Explain the user-visible impact in the PR description
- Include screenshots or short recordings for UI changes when possible
- If you change behavior across multiple apps, note that explicitly
- Update relevant docs when product flows or setup steps change

## Good First Contributions

- Fix small UX inconsistencies in the desktop or web app
- Improve onboarding copy
- Add missing developer docs
- Improve error handling around pairing and reconnect flows
- Tighten release and packaging documentation

## Reporting Bugs

Please include:
- What you tried to do
- What you expected to happen
- What actually happened
- Which app was involved: `desktop`, `web`, or `backend`
- Screenshots, logs, or reproduction steps if available

## Pull Requests

Before opening a PR, please make sure:
- The relevant app still builds
- New or changed behavior has been tested manually
- Docs were updated if needed
- The change is scoped tightly enough to review clearly

## Questions and Feedback

If you are unsure where a change belongs, open an issue first with a short proposal.
