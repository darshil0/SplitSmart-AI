# SplitSmart AI

A modern, split-screen bill splitting application powered by Google's Gemini 3 Pro model. Upload a receipt image, and use natural language to assign items to friends.

## Features

- **AI Receipt Parsing**: Instantly converts receipt images into structured data (items, prices, tax, tip) using `gemini-3-pro-preview`.
- **Natural Language Chat**: Assign items by typing commands like "Tom had the burger" or "Sarah and I shared the pizza".
- **Smart Context**: Enter your name, and the AI understands "I", "me", and "my" in the chat.
- **Real-time Summaries**: Visual pie charts and detailed breakdowns of who owes what.
- **Flexible Distribution**: Choose how to split Tax and Tip:
  - **Proportional**: Based on the cost of items each person ordered (Default).
  - **Equal Split**: Divided equally among all participants.

## Technologies

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI**: Google GenAI SDK (`@google/genai`)
- **Icons**: Lucide React
- **Charts**: Recharts

## Setup

This application requires a Google Gemini API Key. Ensure `process.env.API_KEY` is configured in your environment.
