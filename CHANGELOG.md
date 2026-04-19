# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-04-18

### Added

- Robust Undo/Redo: Full history tracking with unlimited steps.
- Production State Management: Single source of truth, no data loss.
- Enhanced Mobile UX: Responsive tabs and touch gestures.
- Auto-Save & Restore: Latest split loads on refresh.
- Test Lab: Automated test dashboard for core logic verification.

### Fixed

- Fixed History System: Single `history[]` array + `historyIndexRef`.
- Patched Gemini API: Proper `generateContent([imagePart])` + `responseSchema`.
- UI Polish: Smooth loading states, mobile tabs, gradient branding.
- TypeScript Environment: Resolved `import.meta` and global UMD errors.
- Dependency Management: Stabilized versions of `@google/generative-ai` and `vite-plugin-pwa`.
- Component Logic: Fixed data property mismatches and missing null checks.
- Test Suite: Corrected logic and type errors in the automated test suite.
