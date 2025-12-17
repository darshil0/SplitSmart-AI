export interface ReceiptItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
}

export interface AssignmentMap {
  [itemId: string]: string[];
}

export interface ItemManualSplitsMap {
  [itemId: string]: { [name: string]: number };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface PersonSummary {
  name: string;
  items: { description: string; amount: number }[];
  subtotal: number;
  taxShare: number;
  tipShare: number;
  totalOwed: number;
}

export type DistributionMethod = "PROPORTIONAL" | "EQUAL" | "MANUAL";

export interface ItemTaxTipOverride {
  tax?: number;
  tip?: number;
}

export interface ItemOverridesMap {
  [itemId: string]: ItemTaxTipOverride;
}

export interface HistoryEntry {
  id: string;
  date: number;
  total: number;
  currency: string;
  participants: string[];
  itemCount: number;
}

// Testing Framework Types
export type TestStatus = "idle" | "running" | "passed" | "failed";

export interface TestResult {
  id: string;
  name: string;
  category: "BVT" | "E2E" | "Regression" | "Edge Case" | "Scrum";
  status: TestStatus;
  error?: string;
  duration?: number;
}
