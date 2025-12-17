# SplitSmart AI (v1.2.0) 🚀

A modern, split-screen bill splitting application powered by Google's Gemini 1.5 Pro model. Upload a receipt image and use natural language to assign items to friends.

## ✨ Features

- **AI Receipt Parsing**: Converts receipt images → structured JSON (items, prices, tax, tip)
- **Natural Language Chat**: `"Tom had the burger"`, `"Split pizza between Sarah and I"`
- **Smart Pronoun Resolution**: Enter name → AI understands "I/me/my"
- **Real-time Visualizations**: Pie charts + detailed per-person breakdowns
- **Flexible Tax/Tip Splitting**:
  | Method       | Description                          |
  |--------------|--------------------------------------|
  | **PROPORTIONAL** | Based on each person's total item cost |
  | **EQUAL**    | Divided evenly among participants    |
  | **MANUAL**   | Custom tax/tip per item              |

## 🚀 What's New in v1.2.0

### ✨ New Features
- **Robust Undo/Redo**: Full history tracking with unlimited steps
- **Production State Management**: Single source of truth, no data loss
- **Enhanced Mobile UX**: Perfect responsive tabs + touch gestures
- **Auto-Save & Restore**: Latest split loads on refresh
- **Performance**: `useCallback`, `useMemo`, `useRef` everywhere

### 🔧 Key Fixes
- **Fixed History System**: Single `history[]` array + `historyIndexRef`
- **Patched Gemini API**: Proper `generateContent([imagePart])` + `responseSchema`
- **UI Polish**: Smooth loading states, mobile tabs, gradient branding

## 🛠️ Tech Stack

```
Frontend: React 19 + TypeScript + Vite + Tailwind CSS
AI:      @google/generative-ai (Gemini 1.5 Pro)
Charts:  Recharts
Icons:   Lucide React
State:   Custom history stack (no external libs)
Build:   Prettier + ESLint + Vitest
```

## 🎯 Quick Start

```bash
# Clone & Install
git clone <your-repo> split-smart-ai
cd split-smart-ai
npm install

# Add Gemini API Key
echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Development
npm run dev

# Build for Production
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

## 🎮 Usage Flow

```
1. 📸 Upload receipt image → AI extracts items instantly
2. 💬 Chat: "Tom had the burger" → Auto-assigns items
3. 🎨 Review pie chart + per-person breakdowns
4. 💾 Auto-saves every change (localStorage)
5. 🔄 Undo/Redo with Ctrl+Z / Ctrl+Y
```

## 🌐 Deployment

```bash
# Vercel (Recommended)
npm i -g vercel
vercel --prod

# Netlify
npm run build
# Drag `dist/` to Netlify deploy
```

## 📊 Why SplitSmart?

| ✅ Zero Setup | Single image upload starts everything |
|--------------|---------------------------------------|
| ✅ 100% Accurate | Schema-enforced JSON output |
| ✅ Mobile-First | Perfect on iPhone/Android/Desktop |
| ✅ No Data Loss | Auto-saves every interaction |
| ✅ Privacy-First | Local storage only |

## 🤝 Contributing

```bash
# Run tests
npm run test

# Lint & Format
npm run lint
npm run format

# Type check
npm run type-check
```

## 📄 License

MIT License - Free for personal & commercial use.

***

**Built with ❤️ by Darshil for effortless group bill splitting**  

*Made with React 19 + Gemini 1.5 Pro (2025)*
