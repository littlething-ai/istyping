# IsTyping Website Launch Copy And Structure

## Purpose

This document defines the first public-facing website structure and final copy for the `istyping.app` launch stage.

The product is being introduced as a `Public Alpha`, so the website should:

- explain the product clearly in a few seconds
- direct desktop users to download the app
- direct mobile users to the browser input page
- avoid pretending the product is already a fully mature platform
- stay simple enough to ship quickly

## Route Strategy

Use two main routes:

- `/`
  Marketing homepage / landing page
- `/input`
  Mobile browser input page

QR codes from the desktop app should point to:

- `/input?room=<roomId>`

The root homepage should no longer behave like the input tool.

## Product Positioning

Current positioning for launch:

- `Public Alpha`
- lightweight phone-to-desktop typing tool
- desktop app for pairing
- mobile browser for input

Recommended tone:

- simple
- practical
- honest
- confident without overclaiming

Avoid words like:

- revolutionary
- ultimate
- best-in-class
- seamless platform

Prefer words like:

- lightweight
- fast
- simple
- quick pairing
- public alpha

## Homepage Goals

The homepage must answer four questions quickly:

1. What is this?
2. Why would I use it?
3. What do I do first?
4. Is it ready enough to try?

## Primary Actions

Use only two main actions across the homepage:

- `Download for Windows`
- `Open Web Input`

The download action should always be stronger than the web input action on the homepage.

## Homepage Structure

Recommended section order:

1. Top navigation
2. Hero
3. Product preview
4. How it works
5. Why use IsTyping
6. Feature strip
7. Download section
8. Web input section
9. Open-source roadmap
10. FAQ
11. Final CTA
12. Footer

## Final Copy

### Top Navigation

Left:

- `IsTyping`

Right:

- `How it works`
- `FAQ`
- `Open Web Input`
- `Download`

### Hero

Eyebrow:

- `Public Alpha`

Headline:

- `Turn your phone into a keyboard for your desktop.`

Subheadline:

- `Open the desktop app, scan the pairing code, and start typing from your phone. Lightweight, fast, and built for quick phone-to-desktop input.`

Primary button:

- `Download for Windows`

Secondary button:

- `Open Web Input`

Support line:

- `Windows desktop app available now`
- `Mobile browser input supported`

Optional supporting microcopy:

- `Simple room-based pairing. No complicated setup.`

### Product Preview

Section title:

- `A simple bridge between your phone and your desktop`

Body:

- `Use the desktop app to create a room, then join from your phone and send text instantly.`

Visual direction:

- desktop app screenshot on one side
- mobile input screenshot on the other
- a subtle connection between them

### How It Works

Section title:

- `How it works`

Section subtitle:

- `Three steps to get typing`

Step 1:

- Title: `Download the desktop app`
- Body: `Launch IsTyping on your computer and open the pairing window.`

Step 2:

- Title: `Scan the code or enter the room`
- Body: `Use your phone camera or type the room code manually in the browser.`

Step 3:

- Title: `Start typing`
- Body: `Send text and simple controls from your phone to your desktop.`

### Why Use IsTyping

Section title:

- `Why use IsTyping`

Card 1:

- Title: `Keyboard backup`
- Body: `Useful when your keyboard is unavailable, inconvenient, or just out of reach.`

Card 2:

- Title: `Quick remote input`
- Body: `Type from your phone without switching physical keyboards or devices.`

Card 3:

- Title: `Presentation and testing`
- Body: `Handy for demos, screen recordings, device testing, and temporary setups.`

Card 4:

- Title: `Fast pairing`
- Body: `Open, scan, join, and start typing without a complicated setup flow.`

### Feature Strip

Section title:

- `Built for speed and simplicity`

Items:

- `Lightweight desktop app`
- `Room-based pairing`
- `Phone browser input`
- `Quick reconnect flow`
- `Simple control actions`
- `Public alpha, actively improving`

### Download Section

Section title:

- `Download the desktop app`

Body:

- `The desktop app manages pairing and receives input from your phone. Start there, then join from your mobile browser.`

Primary button:

- `Download for Windows`

Support lines:

- `Current release: Windows`
- `More platforms are planned`

### Web Input Section

Section title:

- `Already have a room code?`

Body:

- `If your desktop app is already running, open the web input page on your phone and join the room.`

Button:

- `Open Web Input`

### Open-Source Roadmap

Section title:

- `Open-source roadmap`

Body:

- `We plan to open-source the project after polishing the first public alpha release. For now, we’re focused on improving the product experience, stability, and onboarding.`

Optional shorter version:

- `Open source is planned. We’re finishing the first public alpha before releasing the full project.`

Optional support line:

- `GitHub release and source availability will be announced later.`

### FAQ

Q:

- `What is IsTyping?`

A:

- `IsTyping lets you use your phone as a lightweight input tool for your desktop. Open the desktop app, join the room from your phone, and start typing.`

Q:

- `Do I need the desktop app?`

A:

- `Yes. The desktop app creates the room and receives input from the phone side.`

Q:

- `Can I use it from my phone browser?`

A:

- `Yes. The phone side works directly in the browser, so you don’t need to install a separate mobile app.`

Q:

- `Do both devices need to be on the same network?`

A:

- `Not necessarily. As long as both sides can reach the service and join the same room, pairing can work across networks.`

If this is too strong for current behavior, replace it with:

- `It works best when both devices have a stable connection. Local network usage is the simplest setup.`

Q:

- `Is it free?`

A:

- `Yes. The current public alpha is free to use.`

Q:

- `Is it stable?`

A:

- `It is currently in public alpha. Core flows are usable, but we’re still refining the product and improving edge cases.`

Q:

- `Is it open source yet?`

A:

- `Not fully yet. A public open-source release is planned after the alpha experience is polished.`

Q:

- `Which platforms are supported?`

A:

- `The desktop app is currently available for Windows. The input side works in modern mobile browsers.`

### Final CTA

Section title:

- `Ready to try it?`

Body:

- `Download the desktop app and pair your phone in under a minute.`

Buttons:

- `Download for Windows`
- `Open Web Input`

### Footer

Left:

- `IsTyping`
- `Phone-to-desktop input, now in public alpha.`

Right:

- `FAQ`
- `Web Input`
- `Roadmap`
- `Contact`

## /input Page Positioning

The `/input` page should remain utility-first.

It should not try to explain the whole product.

Suggested page behavior:

- keep the join-room flow
- keep the connected input flow
- keep the refresh and change-room actions
- add only a very light brand cue
- optionally add a small `About IsTyping` link back to `/`

Suggested lightweight copy:

- page label: `Phone input for IsTyping desktop`
- join heading: `Join a room`
- input placeholder: `Enter room code`
- join button: `Join`

## Metadata Draft

Suggested homepage metadata:

- Title: `IsTyping - Turn your phone into a keyboard for your desktop`
- Description: `IsTyping is a lightweight phone-to-desktop typing tool. Download the desktop app, join from your phone browser, and start typing in seconds.`

Suggested `/input` metadata:

- Title: `IsTyping Web Input`
- Description: `Join an IsTyping room from your phone and send text to your desktop.`

## Minimum Scope For Web Implementation

For the first website release, keep implementation scope tight:

1. Move the current input tool to `/input`
2. Turn `/` into the homepage described here
3. Update desktop QR code links to `/input?room=<roomId>`
4. Replace placeholder metadata
5. Ship the homepage with:
   - hero
   - preview
   - how it works
   - why use it
   - download
   - FAQ
   - final CTA

## Notes For Future Open Source Launch

Do not present the product as fully open source until the repo is ready.

Before public open source release, confirm:

- README is clean
- license is chosen
- no sensitive config remains
- release/install instructions are usable
- issue templates or roadmap are ready

The product launch can happen before the full open-source launch.
