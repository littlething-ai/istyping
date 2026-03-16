# IsTyping Brand Icon Guide

## Purpose

This document records the first unified icon direction for IsTyping across:

- desktop app bundle icons
- system tray icon source
- website favicon source

## Design Direction

The icon is designed around the actual product interaction:

- a desktop screen
- a phone
- typing signal dots between them

This makes the icon more product-specific than a generic chat bubble or keyboard symbol.

## Visual Meaning

The final icon uses:

- a dark rounded-square background for app-icon clarity
- a desktop screen shape in warm light color
- a phone shape in orange
- three cyan dots representing live typing / transmission

It is meant to communicate:

- phone to desktop input
- lightweight utility
- speed and pairing

## Product Rationale

From a product perspective, this direction works well because:

- it describes the core use case directly
- it remains readable at small sizes
- it matches the website color language
- it avoids looking like a generic browser, chat, or AI product icon

## Color Palette

Primary colors used in the icon:

- dark base: `#11120F`
- teal: `#0D777A`
- teal highlight: `#83F2EA`
- orange: `#D55421`
- warm light: `#F5F1E8`

These colors intentionally align with the website launch palette.

## Source Of Truth

Primary SVG source:

- `ref/istyping-icon.svg`

This file should be treated as the master vector source.

## Generated Assets

Desktop app icon outputs are generated into:

- `desktop/src-tauri/icons/`

Website SVG copy:

- `web/public/istyping-icon.svg`

Website favicon:

- `web/src/app/favicon.ico`

## Regeneration Workflow

If the icon is updated later, regenerate the desktop icons from the SVG source:

- run the Tauri icon generation command using `ref/istyping-icon.svg`

Then refresh the web favicon from the generated `.ico` file.

## Future Brand Evolution

This is a strong first product icon for public alpha.

Later improvements can include:

- a full horizontal wordmark for the website
- monochrome tray-optimized variants if needed
- Open Graph / social preview artwork
- installer banner art for Windows release pages
