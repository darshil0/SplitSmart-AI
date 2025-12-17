import { GoogleGenerativeAI } from "@google/generative-ai";
import { ReceiptData, AssignmentMap } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY as string;

if (!API_KEY) {
  console.error("VITE_API_KEY is not defined. Please set it in your .env file.");
  throw new Error("VITE_API_KEY is not defined.");
}

const ai = new GoogleGenerativeAI(API_KEY);

const generationConfig = {
  responseMimeType: "application/json",
  temperature: 0.1,
};

// Define JSON schema for receipt parsing
const receiptSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          quantity: { type: "number" },
        },
        required: ["id", "description", "price", "quantity"],
      },
    },
    currency: { type: "string" },
    subtotal: { type: "number" },
    tax: { type: "number" },
    tip: { type: "number" },
    total: { type: "number" },
  },
  required: ["items", "currency", "subtotal", "tax", "tip", "total"],
  additionalProperties: false,
};

// 1. Parse Receipt Image
export const parseReceiptImage = async (
  base64Image: string,
): Promise<ReceiptData> => {
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      ...generationConfig,
      responseSchema: receiptSchema,
    },
    systemInstruction: `You are a world-class receipt parsing agent. Extract structured data from this receipt with maximum accuracy.

CONTEXT & EDGE CASES:
- Items might have descriptions spanning multiple lines. Prices usually align right.
- Discounts/Coupons: Include as items with negative prices.
- Service charges: Add to 'tip' or as separate line item.
- Multiple taxes: Sum into single 'tax' field.
- Ignore store addresses, phone numbers, marketing text.
- Handwritten notes: Prioritize final adjustments.
- Quantity: Assume 1 if not specified.

Ensure: sum(items[].price) ≈ subtotal, total = subtotal + tax + tip`,
  });

  // Clean base64 data URL prefix and detect mime type
  let cleanBase64 = base64Image;
  let mimeType = "image/png";
  
  if (base64Image.startsWith("data:image/")) {
    const matches = base64Image.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    if (matches) {
      mimeType = `image/${matches[1]}`;
      cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, "");
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
    const response = result.response;
    
    if (!response.text()) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(response.text()) as ReceiptData;

    // Validate and sanitize numeric fields
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
    throw new Error(
      "AI could not process the receipt image. Ensure it's a clear receipt image and try again."
    );
  }
};

// 2. Process Chat Command
export const processChatCommand = async (
  receiptData: ReceiptData,
  currentAssignments: AssignmentMap,
  userMessage: string,
  currentUser?: string,
): Promise<{ assignments: AssignmentMap; reply: string }> => {
  const userContext = currentUser
    ? `Current user: "${currentUser}". "I/me/my" refers to "${currentUser}".`
    : "";

  // Define schema for chat response
  const chatSchema = {
    type: "object",
    properties: {
      updatedAssignments: {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { type: "string" },
        },
      },
      reply: { type: "string" },
    },
    required: ["updatedAssignments", "reply"],
    additionalProperties: false,
  };

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
    const response = result.response;
    
    if (!response.text()) {
      throw new Error("Empty response from AI");
    }

    const parsedResult = JSON.parse(response.text());

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
