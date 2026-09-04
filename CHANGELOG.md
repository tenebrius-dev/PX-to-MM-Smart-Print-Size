# Changelog

## [1.4.0] — 2026-09-05

- Added a temporary canvas stroke guide for `Included` mode: a locked, fill-free scene rectangle follows the selected node and marks exact center/outside stroke outsets.
- Added per-edge stroke-outset calculation with a safe no-guide fallback for hidden, inside, zero, mixed, or unknown geometry.
- Added guide lifecycle cleanup for selection, page changes, node changes, plugin close, and stale nodes from an interrupted run; the guide remains separate from Figma's native blue selection outline.
- Updated the stroke control copy, icon, and default state to make the `Outside stroke` choice explicit.
- Validation passed: `npm test -- --run`, `npm run typecheck`, `npm run lint`, `npm run ui3:validate`, and `npm run build`.
- Figma Desktop visual smoke testing of the additional scene node in Layers, Undo, export, and multiplayer remains a separate manual release gate.

## [1.3.0] — 2026-09-04

- Added complete English and Russian README sections with an in-page language switcher.
- Documented the current Dimensions and Scale panel behavior, conversion rules, stroke handling, selection limits, and Figma-specific restrictions.
- Synchronized the package metadata with the `1.3.0` release.
