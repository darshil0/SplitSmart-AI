# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-04-18

### Fixed

- **Critical: Dual-source state bug** (`App.tsx`) — Removed the duplicate `useEffect` that re-loaded history from `localStorage` and then called `setAssignments`, `setItemManualSplits`, and `setReceiptData` as independent state atoms. All derived values are now read directly from the single `history[historyIndex]` snapshot, eliminating stale-render races and data divergence.

- **Critical: Stale `canUndo` / `canRedo` values** (`App.tsx`) — Replaced `historyIndexRef` (a mutable ref invisible to React's scheduler) with plain `useState`. Both booleans are now reactive `useMemo` values that recompute correctly after every undo, redo, or history push.

- **Critical: History delete id mismatch** (`App.tsx`, `HistorySection.tsx`) — `HistorySection` was passing `entry.timestamp.toString()` as the delete id while `App.tsx` was calling `parseInt(id)` expecting an array index. Both sides now use the snapshot's timestamp as a stable, index-independent identifier. `handleDeleteHistoryEntry` looks up the target entry by timestamp, then adjusts `historyIndex` correctly.

- **Dark mode non-functional** (`tailwind.config.js`) — Added `darkMode: "class"` to the Tailwind configuration. Without this setting, every `dark:` utility class in the codebase was silently ignored, making the dark mode toggle a no-op.

- **Environment variable name mismatch** (`services/geminiService.ts`) — Renamed `VITE_API_KEY` to `VITE_GEMINI_API_KEY` to match the documented setup instructions in `README.md` and the example environment file. The previous name would cause the app to throw on startup for any developer following the README.

- **Stale closure in keyboard shortcut handler** (`components/ChatInterface.tsx`) — The `useEffect` that registered `Ctrl+Enter` / `Escape` handlers captured `handleSubmit` and `inputValue` at mount time via closure, making the shortcut permanently non-functional after the first keystroke. The handler now reads `inputValue` through a ref and delegates submission through a stable `handleSubmitRef`, so the effect only re-registers when `disabled` or `isProcessing` change.

- **Input auto-focus on every render** (`components/ChatInterface.tsx`) — The inline `ref` callback `ref={(el) => el?.focus()}` called `focus()` on every React render cycle, stealing focus from other elements (e.g., item-name inputs in `ReceiptDisplay`). Focus is now applied once on mount via a `useEffect` with an empty dependency array.

- **Division-by-zero in proportional split** (`components/SummaryDisplay.tsx`) — When `receiptData.subtotal` is `0` (e.g., a receipt where all items are complimentary or during a shared-state load before data hydrates), the proportional tax/tip calculation divided by zero, producing `NaN` totals throughout the summary. A guard now substitutes `1` as the denominator when the subtotal is zero.

- **Object URL memory leak** (`components/SummaryDisplay.tsx`) — `handleExportCSV` created a `Blob` object URL but never revoked it, leaking memory in long-running sessions. `URL.revokeObjectURL` is now called after a short delay to allow the download to initiate.

- **App version string mismatch** (`vite.config.ts`) — `__APP_VERSION__` was hardcoded as `"1.2.0"` despite `package.json` declaring `"1.3.0"`. The constant is updated to `"1.3.0"`.

- **Missing `id` field on `CompleteHistoryState`** (`types.ts`) — The type lacked an `id` property, causing TypeScript errors when constructing the array passed from `App.tsx` to `HistorySection`. An `id: string` field (holding the timestamp as a string) and an optional `name?: string` label field have been added. The `TestResult.actual` field type has been narrowed from `any` to `unknown`.

### Changed

- Mobile tab bar moved to a fixed bottom bar (`App.tsx`) to prevent layout shift on iOS Safari where the virtual keyboard can push a non-fixed bar off-screen.
- History snapshot push logic consolidated into a single `pushSnapshot` helper that always writes `receiptData`, `assignments`, and `itemManualSplits` atomically, removing the previous three-argument fragmentation.

---

## [1.3.0] - 2026-04-17

### Added

- **Direct Payment Integration**: Settle debts via Venmo, PayPal, or Cash App links.
- **Dark Mode Support**: Fully themed UI for low-light environments (restaurants).
- **Collaborative Splitting**: State sharing via URL encoding (Base64).
- **Export Options**: Export summaries as CSV or PDF (Print view).
- **Item Categorization**: Automatic categorization (Food, Drink, Alcohol, Service, Tax).
- **History Search**: Filter past splits by participant, date, or venue.
- **Recurring Splits**: Save and load common group configurations.
- **Advanced OCR**: Enhanced handling of handwritten notes and complex layouts.
- **Venue & Date Extraction**: Automatic venue and date detection from receipts.

### Fixed

- **Codebase Integrity**: Resolved TypeScript errors, removed unused variables, and optimized icon imports for production stability.

### Changed

- Updated **SummaryDisplay** with payment buttons and export tools.
- Updated **ReceiptDisplay** with category icons and venue details.
- Enhanced **HistorySection** with search functionality.
- Updated **Gemini Service** prompt for better extraction and categorization.
- Improved dark mode consistency across all components.
- Stabilized state sharing logic for complex receipt data.

---

## [1.2.0] - 2026-04-16

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
