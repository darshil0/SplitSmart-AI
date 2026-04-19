# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-04-19

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

### Fixed

- Improved dark mode consistency across all components.
- Stabilized state sharing logic for complex receipt data.

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
