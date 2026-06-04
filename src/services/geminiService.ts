import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ReceiptData, AssignmentMap } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!API_KEY) {
  console.error(
    "VITE_GEMINI_API_KEY is not defined. Please set it in your .env file.",
  );
}

const ai = new GoogleGenerativeAI(API_KEY || "");

const generationConfig = {
  responseMimeType: "application/json",
  temperature: 0.1,
};

// Use 'any' for schema to avoid complex @google/generative-ai type mismatches
// but keep it structured for the AI
const receiptSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          price: { type: SchemaType.NUMBER },
          quantity: { type: SchemaType.NUMBER },
          category: {
            type: SchemaType.STRING,
            enum: ["Food", "Drink", "Alcohol", "Service", "Tax", "Other"],
          },
        },
        required: ["id", "description", "price", "quantity", "category"],
      },
    },
    currency: { type: SchemaType.STRING },
    subtotal: { type: SchemaType.NUMBER },
    tax: { type: SchemaType.NUMBER },
    tip: { type: SchemaType.NUMBER },
    total: { type: SchemaType.NUMBER },
    venue: { type: SchemaType.STRING },
    date: { type: SchemaType.STRING },
  },
  required: ["items", "currency", "subtotal", "tax", "tip", "total"],
};

export const parseReceiptImage = async (
  base64Image: string,
): Promise<ReceiptData> => {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.",
    );
  }

  const model = ai.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      ...generationConfig,
      responseSchema: receiptSchema,
    },
    systemInstruction: `You are an elite receipt parsing engine specialized in complex, handwritten, and multi-column receipts. 

EXTRACTION RULES:
1. LAYOUT: Handles multi-column layouts where prices might be far from descriptions.
2. HANDWRITING: Identify handwritten notes (e.g., tip added at bottom, item swaps).
3. CATEGORIZATION: Assign each item to [Food, Drink, Alcohol, Service, Tax, Other].
4. VENUE & DATE: Extract the venue name and date if visible.
5. DISCOUNTS: Include as negative items.
6. SERVICE CHARGES: Categorize as 'Service' and add to tip or items.

CONSISTENCY CHECK:
- sum(items[].price) + tax + tip MUST equal total.
- If quantity > 1, the 'price' should be the TOTAL for that line item.

Output ONLY valid JSON.`,
  });

  let cleanBase64 = base64Image;
  let mimeType = "image/png";

  if (base64Image.startsWith("data:image/")) {
    const matches = base64Image.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    if (matches) {
      mimeType = `image/${matches[1]}`;
      cleanBase64 = base64Image.replace(
        /^data:image\/[a-zA-Z0-9]+;base64,/,
        "",
      );
    }
  }

  const imagePart = {
    inlineData: {
      data: cleanBase64,
      mimeType,
    },
  };

  try {
    const result = await model.generateContent([imagePart]);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(responseText) as ReceiptData;

    data.items = (data.items || []).map((item, index) => ({
      ...item,
      id: item.id || `item_${index}`,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    }));

    data.currency = data.currency || "$";
    data.subtotal = Number(data.subtotal) || 0;
    data.tax = Number(data.tax) || 0;
    data.tip = Number(data.tip) || 0;
    data.total = Number(data.total) || 0;

    return data;
  } catch (error) {
    console.error("Failed to parse receipt image:", error);
    if (error instanceof SyntaxError) {
      throw new Error("AI produced invalid JSON. Please try again.");
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : "AI could not process the receipt image. Ensure it's a clear receipt image and try again.",
    );
  }
};

interface ChatResponse {
  updatedAssignments: AssignmentMap;
  reply: string;
}

const chatSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    updatedAssignments: {
      type: SchemaType.OBJECT,
      additionalProperties: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
    },
    reply: { type: SchemaType.STRING },
  },
  required: ["updatedAssignments", "reply"],
};

export const processChatCommand = async (
  receiptData: ReceiptData,
  currentAssignments: AssignmentMap,
  userMessage: string,
  currentUser?: string,
): Promise<{ assignments: AssignmentMap; reply: string }> => {
  if (!API_KEY) {
    return {
      assignments: currentAssignments,
      reply: "API key is missing. Please configure your environment.",
    };
  }

  const userContext = currentUser
    ? `Current user: "${currentUser}". "I/me/my" refers to "${currentUser}".`
    : "";

  const model = ai.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      ...generationConfig,
      responseSchema: chatSchema,
    },
    systemInstruction: `You are a bill-splitting assistant. Update item assignments based on user commands.

RULES:
- "X had Y" → Add X to Y's owners
- "Split X between A, B, C" → Set X's owners to [A, B, C]
- "Everyone shared X" → Set to all known participants
- "Remove X from Y" → Remove X from Y's owners
- Use fuzzy matching for names/items
- Preserve existing assignments unless modified
- Return COMPLETE updated assignments

Output ONLY valid JSON matching the schema.`,
  });

  const prompt = `${userContext}

RECEIPT ITEMS: ${JSON.stringify(receiptData.items)}
CURRENT ASSIGNMENTS: ${JSON.stringify(currentAssignments)}
USER COMMAND: ${userMessage}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    const parsedResult = JSON.parse(responseText) as ChatResponse;

    return {
      assignments: parsedResult.updatedAssignments || {},
      reply: parsedResult.reply || "Assignments updated successfully.",
    };
  } catch (error) {
    console.error("Error processing chat command:", error);
    return {
      assignments: currentAssignments,
      reply: "Sorry, I couldn't process that command. Please try rephrasing.",
    };
  }
};
