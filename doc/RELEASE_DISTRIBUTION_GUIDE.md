# IsTyping Release Distribution Guide

## Goal

Define a simple and reliable distribution strategy for the first public Windows release of IsTyping.

This guide assumes:

- the marketing website is hosted on Vercel
- the Windows desktop app is built with Tauri
- the project will publish a `0.1.0` public alpha release first

## Recommendation Summary

For the first public release, use this setup:

1. Build the Windows installer with Tauri
2. Upload the installer as a GitHub Release asset
3. Link the website download button to the GitHub Release asset
4. Keep Vercel responsible for the website only

This is the best first-step setup because it is:

- simple
- versioned
- trustworthy
- easy to maintain

## Why GitHub Releases First

GitHub Releases are a strong fit for desktop installers because they naturally support:

- versioned release pages
- attached binary assets
- stable release URLs
- a clear release history

This is especially useful for an early public alpha, because users and testers can clearly see:

- which version they downloaded
- what changed
- whether a new version exists

## Why Not Store The Installer Directly In The Vercel App First

Vercel is great for the website itself.

However, for the installer binary, using Vercel as the primary release host is not the best first move.

Reasons:

- release assets are better represented as versioned binaries than as general website files
- GitHub Releases provide a clearer release workflow
- GitHub gives users a familiar place to inspect version notes and binaries
- GitHub release assets make rollback and release history simpler

Vercel can still be used as the website entry point. The download button on the website can simply redirect users to the latest GitHub release asset.

## Suggested First Release Flow

### Step 1

Tag the release:

- `v0.1.0`

### Step 2

Build the Windows package with Tauri.

Typical outputs may include:

- `.msi`
- `.exe`

For the first public release, keep one primary download format visible.

Recommended primary format:

- `.msi`

Reason:

- more standard for Windows installation flows
- easier to present as the main installer

Optional:

- also upload `.exe` if you want a fallback

### Step 3

Create a GitHub Release for `v0.1.0`.

Attach:

- `IsTyping_0.1.0_x64_en-US.msi` or equivalent final filename

If both formats are uploaded:

- mark `.msi` as the main recommended installer on the website

### Step 4

Point the website download button to either:

- the specific release asset URL for `v0.1.0`

or later:

- the `latest` release asset URL

## Website Download Strategy

For the website CTA button:

- label: `Download for Windows`

Recommended first implementation:

- hard-link to the `v0.1.0` GitHub release asset

After the release cadence becomes stable:

- switch to a `latest` release download URL

This keeps the website simple while letting GitHub handle the asset distribution.

## Suggested Release Asset Naming

Use a clean and predictable filename.

Recommended pattern:

- `IsTyping_0.1.0_windows_x64.msi`

Good naming helps with:

- user trust
- easier support
- clearer manual downloads

## What Vercel Should Still Do

Vercel should remain responsible for:

- homepage hosting
- web input page hosting
- product messaging
- redirecting users to download locations

It does not need to be the binary host in the first public alpha.

## When Vercel Blob Becomes Worth Considering

Vercel Blob becomes worth considering later if you want:

- a custom download domain and path
- all download assets managed under your own site stack
- analytics or download indirection controlled inside the web app

Examples:

- `https://istyping.app/download/windows`
- redirecting internally to a hosted installer file

But for the first public release, this adds unnecessary operational overhead.

## Best Practical Setup For 0.1.0

Use this stack:

- Website: Vercel
- Windows installer hosting: GitHub Releases
- Download CTA on homepage: link to GitHub release asset
- Release notes: GitHub Release description

This is the simplest publishable setup.

## Release Page Content Recommendation

For the `v0.1.0` release notes, keep it short and practical.

Suggested sections:

- `What Is Included`
- `Known Limitations`
- `How To Install`
- `How To Use`

Example:

- Public alpha website launch
- Desktop tray support
- Pairing window improvements
- Custom room ID support
- Web input persistence improvements

## Alpha Messaging Recommendation

The release should be presented as:

- `Public Alpha`

This helps set expectations while still making the release feel intentional and real.

## Future Upgrade Path

When the product matures, you can evolve the distribution model:

1. Keep GitHub Releases as source of truth
2. Add a custom download redirect on `istyping.app`
3. Optionally move binary storage to Vercel Blob or another object store
4. Add auto-update infrastructure later

## Final Recommendation

For `0.1.0`, do not overbuild the release pipeline.

Ship it like this:

- Website on Vercel
- Installer on GitHub Releases
- Download button on the website points to the installer asset

That gives you a clean public launch with low operational complexity.
