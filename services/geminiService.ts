import { GoogleGenerativeAI } from "@google/generative-ai";
import { ReceiptData, AssignmentMap } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY as string;

if (!API_KEY) {
  alert("VITE_API_KEY is not defined. Please set it in your .env file.");
  throw new Error("VITE_API_KEY is not defined.");
}

const ai = new GoogleGenerativeAI(API_KEY);

const generationConfig = {
  responseMimeType: "application/json",
};

// 1. Parse Receipt Image
export const parseReceiptImage = async (
  base64Image: string,
): Promise<ReceiptData> => {
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig,
    systemInstruction: `You are a world-class receipt parsing agent. Your goal is to extract structured data from this receipt with 100% accuracy.

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

Double-check the math: (sum of item prices) should roughly equal subtotal. total should equal subtotal + tax + tip.`,
  });

  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    "",
  );

  const imagePart = {
    inlineData: {
      data: cleanBase64,
      mimeType: "image/png",
    },
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [imagePart] }],
    });

    const response = result.response;
    const jsonText = response.text();

    const data = JSON.parse(jsonText) as ReceiptData;

    // Basic validation
    data.subtotal = Number(data.subtotal) || 0;
    data.tax = Number(data.tax) || 0;
    data.tip = Number(data.tip) || 0;
    data.total = Number(data.total) || 0;

    return data;
  } catch (error) {
    console.error("Failed to parse receipt image:", error);
    throw new Error(
      "AI could not process the receipt image. Please check the console for more details.",
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
    ? `The user is "${currentUser}". "I/me/my" refers to "${currentUser}".`
    : "";

  const model = ai.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig,
    systemInstruction: `You are a bill-splitting assistant. Your task is to update item assignments based on user commands.

    RULES:
    - If user says "X had Y", add X to Y's owners.
    - If user says "Split X between A, B, C", set Y's owners to [A, B, C].
    - If user says "Everyone shared X", set owners to all known participants.
    - If user says "Remove X from Y", filter X out.
    - Use fuzzy matching for item names.
    - Always return the FULL, updated assignment map.

    Output format MUST be a JSON object with two keys:
    1. "updatedAssignments": An object where keys are item IDs and values are arrays of owner names (e.g., {"item_0": ["Alice", "Bob"]}).
    2. "reply": A friendly, conversational string confirming the action taken.`,
  });

  const prompt = `
    ${userContext}

    RECEIPT: ${JSON.stringify(receiptData.items)}
    CURRENT ASSIGNMENTS: ${JSON.stringify(currentAssignments)}
    USER COMMAND: "${userMessage}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text();

    const parsedResult = JSON.parse(jsonText);

    const validAssignments: AssignmentMap =
      parsedResult.updatedAssignments || {};

    return {
      assignments: validAssignments,
      reply: parsedResult.reply || "I've updated the assignments.",
    };
  } catch (error) {
    console.error("Error processing chat command:", error);
    throw new Error("AI could not process the chat command.");
  }
};
