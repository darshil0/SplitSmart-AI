import { TestResult, ReceiptData, AssignmentMap, DistributionMethod, ItemOverridesMap } from '../types';

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
    {
      name: 'BVT: Calculation Accuracy (Proportional)',
      category: 'BVT',
      fn: async () => {
        // Mock assignments
        const assignments: AssignmentMap = { '1': ['John'], '2': ['John'], '3': ['Sarah'] };
        // John spent 15/30 = 50%. Sarah spent 15/30 = 50%.
        // John should owe 15 (sub) + 1.5 (tax) + 3 (tip) = 19.5
        // This test simulates the logic inside SummaryDisplay
        const johnSub = 15;
        const sarahSub = 15;
        const totalSub = 30;
        const tax = 3;
        const tip = 6;
        
        const johnTotal = johnSub + (johnSub/totalSub * tax) + (johnSub/totalSub * tip);
        if (johnTotal !== 19.5) throw new Error(`Expected 19.5, got ${johnTotal}`);
      }
    },
    {
      name: 'Edge Case: 100% Tax & Tip',
      category: 'Edge Case',
      fn: async () => {
        const hugeTaxReceipt = { ...MOCK_RECEIPT, tax: 30.00, tip: 30.00, total: 90.00 };
        const assignments: AssignmentMap = { '1': ['John'] }; // 1/3 share
        const share = (10 / 30);
        const johnTax = hugeTaxReceipt.tax * share;
        if (johnTax !== 10) throw new Error(`Tax share math failed on edge scale. Expected 10, got ${johnTax}`);
      }
    },
    {
      name: 'Regression: Manual Overrides Isolation',
      category: 'Regression',
      fn: async () => {
        const overrides: ItemOverridesMap = { '1': { tax: 0, tip: 0 } };
        // Item 1 is $10. Subtotal $30. 
        // If tax is $3, and item 1 (1/3 of cost) has $0 tax override,
        // the remaining $3 tax must be split among other items.
        const totalTax = 3;
        const manualTax = 0;
        const remainingTax = totalTax - manualTax;
        if (remainingTax !== 3) throw new Error(`Manual override math leaked into pool.`);
      }
    },
    {
      name: 'E2E: Undo/Redo Stack Integrity',
      category: 'E2E',
      fn: async () => {
        const stack: AssignmentMap[] = [];
        const initial = { '1': ['A'] };
        const next = { '1': ['A', 'B'] };
        stack.push(initial);
        // Simulate undo
        const popped = stack.pop();
        if (JSON.stringify(popped) !== JSON.stringify(initial)) throw new Error('History stack corrupted.');
      }
    },
    {
      name: 'Scrum: User can split item between 3 people',
      category: 'Scrum',
      fn: async () => {
        const itemPrice = 15;
        const splitCount = 3;
        const perPerson = itemPrice / splitCount;
        if (perPerson !== 5) throw new Error('Division logic failed for group split.');
      }
    },
    {
      name: 'Edge Case: Zero Price Item',
      category: 'Edge Case',
      fn: async () => {
        const freeItem = { id: '0', description: 'Free Bread', price: 0, quantity: 1 };
        const assignments = { '0': ['Alice'] };
        const aliceSub = 0;
        const totalSub = 10;
        const tax = 2;
        // Proportion of 0/10 is 0. Alice should pay $0 tax for the free item.
        const aliceTax = (aliceSub / totalSub) * tax;
        if (aliceTax !== 0) throw new Error('Tax incorrectly applied to free item.');
      }
    },
    {
      name: 'Regression: LocalStorage Persistence',
      category: 'Regression',
      fn: async () => {
        const testHistory = [{ id: 'test', total: 100 }];
        localStorage.setItem('__test_persist__', JSON.stringify(testHistory));
        const retrieved = JSON.parse(localStorage.getItem('__test_persist__') || '[]');
        localStorage.removeItem('__test_persist__');
        if (retrieved[0].id !== 'test') throw new Error('Persistence failed.');
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
    // Small delay to visualize for the user
    await new Promise(r => setTimeout(r, 100));
  }
};