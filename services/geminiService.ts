
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData, AssignmentMap } from "../types";

// Helper to get AI instance
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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
            mimeType: "image/png",
            data: cleanBase64,
          },
        },
        {
          text: `You are a world-class receipt parsing agent. Your goal is to extract structured data from this receipt with 100% accuracy.

CONTEXT & EDGE CASES:
1. COMPLEX LAYOUTS: Items might have descriptions spanning multiple lines. Prices are usually on the far right. Quantities might be on the left or in the middle.
2. DISCOUNTS: If you see "Discount", "Coupon", or negative values, include them as items with a negative price.
3. SERVICE CHARGE: If a service charge is present and separate from the tip, sum it into the 'tip' field or include it as a line item if it's substantial.
4. MULTIPLE TAXES: Sum all tax components (e.g., GST, PST, VAT) into the single 'tax' field.
5. NOISE: Ignore store addresses, phone numbers, and marketing text at the bottom.
6. HANDWRITTEN NOTES: If there are handwritten tips or totals, prioritize them over printed ones if they look like final adjustments.
7. QUANTITY: If quantity isn't explicitly listed for an item, assume 1.

JSON SCHEMA REQUIREMENTS:
- 'items': An array of objects.
- 'items[].id': Create a unique ID like "item_0", "item_1".
- 'items[].description': The full item name.
- 'items[].price': The unit price multiplied by quantity (the total for that line).
- 'items[].quantity': The number of units.
- 'currency': The currency symbol ($, €, £, etc.). If not found, use "$".
- 'subtotal', 'tax', 'tip', 'total': Numeric values.

Double-check the math: (sum of item prices) should roughly equal subtotal. total should equal subtotal + tax + tip.`
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
                id: { type: Type.STRING, description: "Unique identifier for the item." },
                description: { type: Type.STRING, description: "Clear description of the item." },
                price: { type: Type.NUMBER, description: "The total price for this line item (qty * unit price)." },
                quantity: { type: Type.NUMBER, description: "Number of units purchased." },
              },
              required: ["id", "description", "price", "quantity"],
            },
          },
          subtotal: { type: Type.NUMBER, description: "Total before tax and tip." },
          tax: { type: Type.NUMBER, description: "Total tax amount." },
          tip: { type: Type.NUMBER, description: "Total tip or service charge." },
          total: { type: Type.NUMBER, description: "Grand total of the receipt." },
          currency: { type: Type.STRING, description: "The currency symbol used." },
        },
        required: ["items", "subtotal", "tax", "total", "currency"],
      },
      thinkingConfig: { thinkingBudget: 4096 }, // Increased budget for complex reasoning
    },
  });

  if (!response.text) {
    throw new Error("Failed to parse receipt text from response.");
  }

  try {
    const data = JSON.parse(response.text) as ReceiptData;
    // Basic validation to ensure numbers are valid
    data.subtotal = Number(data.subtotal) || 0;
    data.tax = Number(data.tax) || 0;
    data.tip = Number(data.tip) || 0;
    data.total = Number(data.total) || 0;
    
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
    ? `The user is "${currentUser}". "I/me/my" refers to "${currentUser}".` 
    : '';

  const prompt = `
    You are a bill-splitting assistant. 
    ${userContext}

    RECEIPT: ${JSON.stringify(receiptData.items)}
    CURRENT ASSIGNMENTS: ${JSON.stringify(currentAssignments)}
    USER COMMAND: "${userMessage}"

    RULES:
    - If user says "X had Y", add X to Y's owners.
    - If user says "Split X between A, B, C", set Y's owners to [A, B, C].
    - If user says "Everyone shared X", set owners to all known participants.
    - If user says "Remove X from Y", filter X out.
    - Use fuzzy matching for item names.
    - Return the FULL updated assignment map.

    Output format: JSON with "updatedAssignments" (array of {itemId, owners}) and "reply" (string).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          updatedAssignments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    itemId: { type: Type.STRING },
                    owners: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["itemId", "owners"]
            }
          },
          reply: { type: Type.STRING },
        },
        required: ["updatedAssignments", "reply"],
      },
      thinkingConfig: { thinkingBudget: 2048 },
    },
  });

   if (!response.text) {
    throw new Error("Failed to process chat command.");
  }

  try {
    const result = JSON.parse(response.text);
    const validAssignments: AssignmentMap = {};
    
    if (result.updatedAssignments && Array.isArray(result.updatedAssignments)) {
        result.updatedAssignments.forEach((item: any) => {
            if (item.itemId && Array.isArray(item.owners)) {
                validAssignments[item.itemId] = item.owners.map(String);
            }
        });
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
