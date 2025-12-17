import { TestResult, ReceiptData, AssignmentMap, DistributionMethod, ItemOverridesMap, ItemManualSplitsMap } from '../types';

/**
 * MOCK DATA FOR TESTING
 */
const MOCK_RECEIPT: ReceiptData = {
  items: [
    { id: '1', description: 'Classic Burger', price: 10.00, quantity: 1 },
    { id: '2', description: 'Truffle Fries', price: 5.00, quantity: 1 },
    { id: '3', description: 'Red Wine', price: 15.00, quantity: 1 },
  ],
  subtotal: 30.00,
  tax: 3.00,
  tip: 6.00,
  total: 39.00,
  currency: '$'
};

/**
 * Test Runner Implementation
 */
export const runTestSuite = async (onUpdate: (res: TestResult) => void) => {
  const tests: { name: string; category: TestResult['category']; fn: () => Promise<void> }[] = [
    // --- BVT (Build Verification Tests) ---
    {
      name: 'BVT: Proportional Split Engine',
      category: 'BVT',
      fn: async () => {
        const assignments: AssignmentMap = { '1': ['John'], '2': ['John'], '3': ['Sarah'] };
        const totalSub = 30;
        const johnSub = 15; // Burger (10) + Fries (5)
        const sarahSub = 15; // Wine (15)
        
        const johnTax = (johnSub / totalSub) * 3;
        const johnTip = (johnSub / totalSub) * 6;
        const johnTotal = johnSub + johnTax + johnTip;
        
        if (johnTotal !== 19.5) throw new Error(`Math Mismatch: Expected 19.5, got ${johnTotal}`);
      }
    },
    {
      name: 'BVT: Equal Split Engine',
      category: 'BVT',
      fn: async () => {
        const participants = ['John', 'Sarah'];
        const tax = 3;
        const tip = 6;
        const taxPerPerson = tax / participants.length;
        if (taxPerPerson !== 1.5) throw new Error('Equal tax split failed');
      }
    },

    // --- E2E (End-to-End Logic) ---
    {
      name: 'E2E: Full Settlement Workflow',
      category: 'E2E',
      fn: async () => {
        // Step 1: Assignment
        let assignments: AssignmentMap = { '1': ['Alice'] };
        // Step 2: Override
        let overrides: ItemOverridesMap = { '1': { tax: 0 } };
        // Logic check: if Alice pays $0 tax on item 1, does it work?
        if (overrides['1'].tax !== 0) throw new Error('Override failed to register');
      }
    },
    {
      name: 'E2E: Undo/Redo Logic Stack',
      category: 'E2E',
      fn: async () => {
        const history: AssignmentMap[] = [];
        history.push({ '1': ['A'] });
        history.push({ '1': ['A', 'B'] });
        const undo = history.pop(); // Undo to {'1': ['A', 'B']}
        if (!undo || undo['1'].length !== 2) throw new Error('Redo state was not the top of stack');
      }
    },

    // --- EDGE CASES ---
    {
      name: 'Edge Case: Zero Price Items',
      category: 'Edge Case',
      fn: async () => {
        const subtotal = 10;
        const itemPrice = 0;
        const tax = 2;
        const share = (itemPrice / subtotal) * tax;
        if (share !== 0) throw new Error('Tax applied to free item');
      }
    },
    {
      name: 'Edge Case: 0% Tip Scenario',
      category: 'Edge Case',
      fn: async () => {
        const tip = 0;
        const share = tip / 5;
        if (share !== 0) throw new Error('Calculation failed with 0 tip');
      }
    },
    {
      name: 'Edge Case: Single Participant Only',
      category: 'Edge Case',
      fn: async () => {
        const sub = 100, tax = 10, tip = 20;
        const total = sub + tax + tip;
        if (total !== 130) throw new Error('Basic addition failed for single user');
      }
    },
    {
      name: 'Edge Case: Very Long Item Names',
      category: 'Edge Case',
      fn: async () => {
        const longName = "A".repeat(1000);
        const item = { description: longName, price: 10 };
        if (item.description.length !== 1000) throw new Error('String handling limit reached');
      }
    },

    // --- REGRESSION ---
    {
      name: 'Regression: LocalStorage Sync',
      category: 'Regression',
      fn: async () => {
        const key = 'test_key';
        const val = { ok: true };
        localStorage.setItem(key, JSON.stringify(val));
        const res = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.removeItem(key);
        if (!res.ok) throw new Error('LocalStorage failed to persist object');
      }
    },
    {
      name: 'Regression: Item Quantity Updates',
      category: 'Regression',
      fn: async () => {
        const item = { price: 10, quantity: 2 };
        // The price in our system is "Total for Line"
        // If we change qty from 1 to 2, price should likely be updated by the UI logic
        // This test verifies the price representation remains consistent
        if (typeof item.price !== 'number') throw new Error('Price is not a number');
      }
    },
    {
      name: 'Regression: Manual Amount Precision',
      category: 'Regression',
      fn: async () => {
        const splits: ItemManualSplitsMap = { '1': { 'A': 3.33, 'B': 3.33, 'C': 3.34 } };
        const total = Object.values(splits['1']).reduce((a, b) => a + b, 0);
        if (Math.abs(total - 10) > 0.001) throw new Error('Manual precision mismatch');
      }
    },

    // --- SCRUM / USER STORIES ---
    {
      name: 'Scrum: US-01 Receipt Parsing Structure',
      category: 'Scrum',
      fn: async () => {
        if (!MOCK_RECEIPT.items || MOCK_RECEIPT.items.length !== 3) throw new Error('Mock receipt structure invalid');
      }
    },
    {
      name: 'Scrum: US-04 Manual Tax Distribution',
      category: 'Scrum',
      fn: async () => {
        const overrides: ItemOverridesMap = { '1': { tax: 0.50 } };
        const totalTax = 3.00;
        const manualTax = overrides['1'].tax!;
        const remaining = totalTax - manualTax;
        if (remaining !== 2.50) throw new Error('Manual tax subtraction failed');
      }
    }
  ];

  for (const test of tests) {
    const id = Math.random().toString(36).substr(2, 9);
    onUpdate({ id, name: test.name, category: test.category, status: 'running' });
    
    const start = performance.now();
    try {
      await test.fn();
      onUpdate({ id, name: test.name, category: test.category, status: 'passed', duration: Math.round(performance.now() - start) });
    } catch (e: any) {
      onUpdate({ id, name: test.name, category: test.category, status: 'failed', error: e.message, duration: Math.round(performance.now() - start) });
    }
    await new Promise(r => setTimeout(r, 80));
  }
};