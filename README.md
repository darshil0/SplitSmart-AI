# SplitSmart AI (v1.1.0)

A modern, split-screen bill splitting application powered by Google's Gemini 1.5 Pro model. Upload a receipt image, and use natural language to assign items to friends.

## Fixes & Updates (v1.1.0)

-   **Patched Gemini API Integration**:
    -   Corrected environment variable handling for Vite (`VITE_API_KEY`).
    -   Upgraded model to `gemini-1.5-pro-latest` for improved performance.
    -   Refactored API calls to align with the latest Google GenAI SDK.
-   **Codebase Formatting**:
    -   Added Prettier and formatted all files for consistency.
-   **Project Cleanup**:
    -   Removed irrelevant documentation and metadata files.

## Features

-   **AI Receipt Parsing**: Instantly converts receipt images into structured data (items, prices, tax, tip) using `gemini-1.5-pro-latest`.
-   **Natural Language Chat**: Assign items by typing commands like "Tom had the burger" or "Sarah and I shared the pizza".
-   **Smart Context**: Enter your name, and the AI understands "I", "me", and "my" in the chat.
-   **Real-time Summaries**: Visual pie charts and detailed breakdowns of who owes what.
-   **Flexible Distribution**: Choose how to split Tax and Tip:
    -   **Proportional**: Based on the cost of items each person ordered (Default).
    -   **Equal Split**: Divided equally among all participants.

## Technologies

-   **Frontend**: React 19, TypeScript, Tailwind CSS
-   **AI**: Google GenAI SDK (`@google/generative-ai`)
-   **Icons**: Lucide React
-   **Charts**: Recharts

## Setup

This application requires a Google Gemini API Key. Create a `.env` file in the root of the project and add your key like this:

`VITE_API_KEY=your_gemini_api_key_here`
