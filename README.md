# SplitSmart AI (v1.2.0) ✅

A modern, split-screen bill splitting application powered by Google's Gemini 1.5 Pro model. Upload a receipt image, and use natural language to assign items to friends.

## 🚀 New Features (v1.2.0)

- **Robust Undo/Redo System**: Full history tracking with unlimited steps
- **Production-Ready State Management**: Single source of truth prevents data loss
- **Enhanced Mobile Experience**: Perfect responsive tabs and layouts
- **Auto-Save & Restore**: Latest split loads automatically on refresh
- **Improved Error Handling**: Graceful fallbacks for all edge cases
- **Performance Optimizations**: `useCallback`, `useMemo`, `useRef` throughout

## 🔧 Fixes & Updates (v1.2.0)

- **Fixed History Management**:
  - Single `history[]` array replaces fragmented `pastAssignments`/`futureAssignments`
  - `historyIndexRef` enables seamless undo/redo without re-renders
  - Complete state snapshots (assignments + splits + receipt data)

- **Patched Gemini API Integration** [Previous v1.1.0]:
  - Corrected `generateContent` format: `[imagePart]` instead of `{contents: [...]}`
  - Added `responseSchema` for guaranteed JSON output
  - Dynamic MIME type detection (png/jpeg/webp)
  - Temperature control for consistent results

- **UI/UX Polish**:
  - Enhanced loading states with smooth animations
  - Better mobile tab navigation with icons
  - Improved Test Lab modal with proper sizing
  - Gradient branding and micro-interactions

- **Reliability**:
  - localStorage try-catch prevents crashes
  - File type validation before upload
  - Null checks and disabled states prevent race conditions

## ✨ Features

- **AI Receipt Parsing**: Converts receipt images → structured JSON (items, prices, tax, tip)
- **Natural Language Chat**: `"Tom had the burger"`, `"Split pizza between Sarah and I"`
- **Smart Pronoun Resolution**: Enter name → AI understands "I/me/my"
- **Real-time Visualizations**: Pie charts + detailed per-person breakdowns
- **Flexible Tax/Tip Splitting**:
  | Method | Description |
  |--------|-------------|
  | **PROPORTIONAL** | Based on each person's total item cost |
  | **EQUAL** | Divided evenly among participants |

## 🛠️ Technologies

```
Frontend: React 19 + TypeScript + Vite + Tailwind CSS
AI: Google Generative AI SDK (@google/generative-ai)
Icons: Lucide React
Charts: Recharts
State: Custom history stack (no external libs needed)
Build: Prettier + ESLint
```

## 🚀 Quick Setup

```
# Clone & Install
git clone <repo> split-smart-ai
cd split-smart-ai
npm install

# Add your Gemini API key
echo "VITE_API_KEY=your_gemini_api_key_here" > .env

# Development
npm run dev

# Production Build
npm run build
```

## 📱 Demo Commands

```
"Tom had the burger and fries"
"Sarah and I shared the pizza"
"Split appetizers between everyone"
"Remove Tom from the drinks"
"David had the steak"
```

## 🎯 Why SplitSmart?

✅ **Zero Setup** - Single image upload starts everything  
✅ **100% Accurate Parsing** - Schema-enforced JSON output  
✅ **Mobile-First** - Perfect on phone/tablet/desktop  
✅ **No Data Loss** - Auto-saves every change  
✅ **Privacy-First** - Local storage, no cloud sync needed  

