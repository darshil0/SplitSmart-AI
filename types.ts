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

// Maps Item ID to an array of person names who are paying for it
export interface AssignmentMap {
  [itemId: string]: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
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

export type DistributionMethod = 'PROPORTIONAL' | 'EQUAL' | 'MANUAL';

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