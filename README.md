# SplitSmart AI (v1.3.1) 🚀

A modern, split-screen bill splitting application powered by Google's Gemini 1.5 Pro model. Upload a receipt image and use natural language to assign items to friends.

## ✨ Features

- **AI Receipt Parsing**: Converts receipt images → structured JSON (items, prices, tax, tip, venue, date)
- **Item Categorization**: Auto-categorizes items (Food, Drink, Alcohol, etc.) with visual icons
- **Dark Mode Support**: Seamless theme toggle for low-light restaurant use
- **Natural Language Chat**: `"Tom had the burger"`, `"Split pizza between Sarah and I"`
- **Direct Payment Integration**: Instant Venmo, PayPal, and Cash App payment links
- **Collaborative Splitting**: Share split sessions via encoded URLs
- **Export Options**: Download settlement summaries as CSV or PDF
- **History Search**: Robust filtering of past splits (stored in browser) by date, person, or venue
- **Smart Pronoun Resolution**: Enter a name → AI understands references to "I/me/my" in context
- **Real-time Visualizations**: Pie charts and detailed per-person cost breakdowns
- **Undo/Redo Support**: Full history navigation with keyboard shortcuts (Cmd+Z/Cmd+Y on Mac, Ctrl+Z/Ctrl+Y on Windows/Linux)
- **Flexible Tax/Tip Splitting**: Choose from three distribution methods

| Method | Description |
|--------|-------------|
| **PROPORTIONAL** | Tax/tip distributed based on each person's item subtotal |
| **EQUAL** | Tax/tip divided evenly among all participants |
| **MANUAL** | Assign custom tax/tip amounts per item |

## 🚀 What's New in v1.3.1

### ✨ New Features

- **Direct Payment Integration**: Settle debts instantly via Venmo, PayPal, or Cash App
- **Dark Mode**: Premium dark theme optimized for restaurant use
- **State Sharing**: Generate unique URLs for collaborative bill splitting
- **Export & PDF**: Download summaries as CSV or generate clean PDF receipts
- **Item Categorization**: AI flags items as Food, Drink, Alcohol, Appetizer, etc.
- **History Search**: Find past splits by person name, venue, or date range
- **Advanced OCR**: Improved parsing of handwritten notes and complex receipt layouts

### 🔧 Key Enhancements

- **UI Polish**: Glassmorphism effects, category icons, and venue details display
- **Mobile Responsiveness**: Optimized for mobile (320px+), tablet, and desktop viewports
- **Gemini 1.5 Pro**: Refined extraction prompts for faster, more accurate parsing
- **Error Handling**: Graceful failures with user-friendly error messages

## 🛠️ Tech Stack

```
Frontend:  React 19 + TypeScript + Vite + Tailwind CSS
AI:        @google/generative-ai (Gemini 1.5 Pro)
Charts:    Recharts
Icons:     Lucide React
State:     Custom history stack + localStorage (browser-based)
Build:     Prettier + ESLint + Vitest
Deployment: Vercel, Netlify, or GitHub Pages
```

## 🎯 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- A free Google Gemini API key (get one at [Google AI Studio](https://aistudio.google.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/split-smart-ai.git
cd split-smart-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Gemini API key
```

### Environment Configuration

Create a `.env.local` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ Security Warning**: Never commit `.env.local` to version control. Add it to `.gitignore`.

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## 📱 Demo Commands

Try these natural language inputs after uploading a receipt:

```
"Tom had the burger and fries"
"Sarah and I shared the pizza"
"Split appetizers evenly between everyone"
"Remove Tom from the drinks"
"David had the steak ($35)"
"The remaining items go to Alex"
```

## 🎮 Usage Flow

```
1. 📸 Upload receipt image → AI extracts items and structure
2. 💬 Chat: Describe who had what using natural language
3. 🎨 Review pie chart and per-person cost breakdowns
4. 🔧 Adjust manually if needed or re-assign items
5. 💾 Changes auto-save to browser storage
6. 📤 Export as CSV/PDF or share via generated link
7. 💳 Send payment requests via Venmo/PayPal/Cash App
```

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

Follow the prompts to connect your GitHub repo and set environment variables.

### Netlify

```bash
npm run build
# Option A: Drag dist/ folder to Netlify dashboard
# Option B: Use Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**Configure environment variables** in your hosting dashboard under Settings > Environment.

### GitHub Pages

```bash
npm run build
# Push dist/ folder or use gh-pages package
```

## 📊 Core Features Explained

### AI Receipt Extraction

Gemini 1.5 Pro extracts the following structured data:

```json
{
  "venue": "Olive Garden",
  "date": "2025-06-04",
  "items": [
    { "name": "Fettuccine Alfredo", "price": 18.99, "category": "Food", "quantity": 1 },
    { "name": "Iced Tea", "price": 3.50, "category": "Drink", "quantity": 2 }
  ],
  "subtotal": 22.49,
  "tax": 1.79,
  "tip": 0,
  "total": 24.28
}
```

### Natural Language Processing

The app uses a two-step process:

1. **Extraction**: Gemini parses the receipt image into JSON
2. **Assignment**: Gemini processes natural language commands to assign items to people and split costs

### Data Storage

All data is stored locally in your browser (localStorage). No data is transmitted to our servers. The only API call is to Google's Gemini service for receipt parsing.

**Privacy Note**: Receipt images are sent to Google's API for parsing. Review Google's privacy policy if this is a concern.

## 🧪 Development & Testing

```bash
# Run type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

## ❓ Troubleshooting

### API Key Issues

**Error: "API key not valid"**
- Verify your key is correct in `.env.local`
- Ensure the key is enabled in Google AI Studio
- Check that you haven't committed the key to version control by accident

### Receipt Parsing Fails

- Ensure the receipt image is clear and well-lit
- Rotate the image if it's at an angle
- Avoid blurry or low-resolution images
- Try uploading as JPG rather than PNG

### Browser Storage Full

Clear browser storage in Settings → Privacy → Clear Browsing Data (select "Cookies and other site data")

## 📄 License

MIT License - Free for personal and commercial use.

---

**Built with ❤️ by Darshil for effortless group bill splitting**

_Made with React 19 + Gemini 1.5 Pro_
