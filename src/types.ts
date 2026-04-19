// types.ts
// SplitSmart AI - Complete TypeScript Definitions (v1.3.1)

/**
 * CORE RECEIPT DATA
 */
export type ItemCategory =
  | "Food"
  | "Drink"
  | "Alcohol"
  | "Service"
  | "Tax"
  | "Other";

export interface ReceiptItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
  category?: ItemCategory;
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  venue?: string;
  date?: string;
}

/**
 * ASSIGNMENT & SPLITTING
 */
export interface AssignmentMap {
  [itemId: string]: string[]; // itemId → array of participant names
}

export interface ItemManualSplitsMap {
  [itemId: string]: { [name: string]: number };
}

export interface ItemTaxTipOverride {
  tax?: number;
  tip?: number;
}

export interface ItemOverridesMap {
  [itemId: string]: ItemTaxTipOverride;
}

/**
 * CHAT SYSTEM
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

/**
 * DISTRIBUTION METHODS
 */
export type DistributionMethod = "PROPORTIONAL" | "EQUAL" | "MANUAL";

/**
 * SUMMARY & CALCULATIONS
 */
export interface PersonSummary {
  name: string;
  items: Array<{ description: string; amount: number }>;
  subtotal: number;
  taxShare: number;
  tipShare: number;
  totalOwed: number;
}

/**
 * HISTORY & STATE MANAGEMENT
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  receiptData: ReceiptData;
  assignments: AssignmentMap;
  itemManualSplits: ItemManualSplitsMap;
  participants: string[];
  itemCount: number;
  total: number;
  currency: string;
  distributionMethod: DistributionMethod;
}

/**
 * FIX: added `id` field (timestamp as string) so HistorySection can pass a
 *      stable, non-index identifier to onDelete / onRestore callbacks.
 *      Also added optional `name` for display labelling.
 */
export interface CompleteHistoryState {
  id: string; // snapshot.timestamp.toString() — stable across re-renders
  name?: string; // optional display label, e.g. "Split 4/18/2026"
  assignments: AssignmentMap;
  itemManualSplits: ItemManualSplitsMap;
  receiptData: ReceiptData | null;
  timestamp: number;
}

/**
 * RECURRING GROUPS
 */
export interface SavedGroup {
  id: string;
  name: string;
  participants: string[];
}

/**
 * TESTING FRAMEWORK
 */
export type TestStatus = "idle" | "running" | "passed" | "failed";

export interface TestCase {
  id: string;
  name: string;
  category: "BVT" | "E2E" | "Regression" | "Edge" | "Performance" | "Scrum";
  input: {
    imageBase64?: string;
    chatCommands?: string[];
  };
  expected: Partial<ReceiptData> | Partial<AssignmentMap>;
  fn: () => Promise<void>;
}

export interface TestResult {
  id: string;
  name: string;
  category: TestCase["category"];
  status: TestStatus;
  duration?: number;
  error?: string;
  actual?: unknown;
  timestamp: number;
}

export interface TestSuite {
  id: string;
  name: string;
  tests: TestResult[];
  status: TestStatus;
  duration: number;
}
