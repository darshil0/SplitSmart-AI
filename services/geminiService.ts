import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData, AssignmentMap } from "../types";

// Helper to get AI instance
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

// 1. Parse Receipt Image
export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  const ai = getAiClient();
  
  // Clean base64 string if it contains data URI prefix
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/png", // Assuming PNG or JPEG, generic handling usually works with correct mime
            data: cleanBase64,
          },
        },
        {
          text: `Analyze this receipt. Extract all line items, their prices, and quantities. 
          Also identify the subtotal, tax, tip (if any), and grand total. 
          If tip is not explicitly listed, assume 0.
          Return a strict JSON object matching the defined schema.
          For the currency, use the symbol found (e.g., "$", "€", "£").`
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Unique ID for the item (e.g. item_1)" },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                quantity: { type: Type.NUMBER },
              },
              required: ["id", "description", "price", "quantity"],
            },
          },
          subtotal: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          tip: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
          currency: { type: Type.STRING },
        },
        required: ["items", "subtotal", "tax", "total", "currency"],
      },
      thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking for accurate parsing
    },
  });

  if (!response.text) {
    throw new Error("Failed to parse receipt text from response.");
  }

  try {
    const data = JSON.parse(response.text) as ReceiptData;
    return data;
  } catch (error) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("AI returned invalid JSON.");
  }
};

// 2. Process Chat Command
export const processChatCommand = async (
  receiptData: ReceiptData,
  currentAssignments: AssignmentMap,
  userMessage: string,
  currentUser?: string
): Promise<{ assignments: AssignmentMap; reply: string }> => {
  const ai = getAiClient();

  const userContext = currentUser 
    ? `IMPORTANT: The user interacting with you is named "${currentUser}". If the user mentions "I", "me", "my", or "myself", assign the items to "${currentUser}".` 
    : '';

  const prompt = `
    You are a bill-splitting assistant.
    
    ${userContext}

    Current Receipt Items:
    ${JSON.stringify(receiptData.items)}

    Current Assignments (Item ID -> [Array of Names]):
    ${JSON.stringify(currentAssignments)}

    User Command: "${userMessage}"

    Task:
    1. Interpret the user's natural language command to update the assignments.
    2. Support statements like "Tom had the burger", "Alice and Bob shared the pizza", "Remove Sarah from the salad".
    3. If an item name in the command is fuzzy (e.g. "drinks" for "Coke" and "Beer"), try to match reasonably.
    4. Return the *complete* updated assignment map.
    5. Provide a short, friendly, conversational reply confirming what you did.

    Note:
    - If a person is added to an item, append them to the list for that item ID.
    - If "shared", ensure all names are in the list.
    - If "remove", filter them out.
    - If someone claims the whole item (e.g. "I had the steak"), replace existing assignments for that item unless implied otherwise.
    
    Output JSON Schema:
    {
      "assignments": { ... },
      "reply": "string"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assignments: {
            type: Type.OBJECT,
            description: "Map of item IDs to arrays of names",
            additionalProperties: true, // Allow dynamic keys for item IDs
          },
          reply: { type: Type.STRING },
        },
        required: ["assignments", "reply"],
      },
      thinkingConfig: { thinkingBudget: 4096 }, // Reasoning about fuzzy matching
    },
  });

   if (!response.text) {
    throw new Error("Failed to process chat command.");
  }

  try {
    const result = JSON.parse(response.text);
    // Ensure assignments matches our expected type structure (handling potentially empty or weird returns)
    const validAssignments: AssignmentMap = {};
    
    // Safety copy to ensure we match the AssignmentMap signature
    if (result.assignments) {
        for (const [key, value] of Object.entries(result.assignments)) {
            if (Array.isArray(value)) {
                validAssignments[key] = value.map(String);
            }
        }
    }

    return {
      assignments: validAssignments,
      reply: result.reply,
    };
  } catch (error) {
    console.error("Error parsing chat response", error);
    throw new Error("AI returned invalid assignment data.");
  }
};
