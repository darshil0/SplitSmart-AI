# SplitSmart AI Test Case Documentation

## 1. Scrum / User Stories
| ID | User Story | Manual Test Steps | Expected Result |
|----|------------|-------------------|-----------------|
| US-01 | As a user, I want to upload a receipt and see its items. | 1. Click upload area. 2. Select image. 3. Wait for AI scan. | List shows correct items, prices, tax, and tip. |
| US-02 | As a user, I want to assign an item via chat. | 1. Type "Sarah had the Burger" in chat. 2. Press Enter. | "Sarah" badge appears on the Burger item in receipt view. |
| US-03 | As a user, I want to split a shared item. | 1. Open 'Split' modal on an item. 2. Select Alice, Bob, and Me. | Total for that item is divided by 3 in summary. |
| US-04 | As a user, I want to override tax for a specific item. | 1. Switch to 'Manual' distribution. 2. Enter $0 tax for a salad. | Salad's tax contribution becomes $0, others scale up. |

## 2. BVT (Build Verification Tests)
- **BVT-01: Happy Path Flow**: Complete receipt scan -> 2 Chat assignments -> 1 Manual split -> Save to History. Verify history entry reflects total and participants.
- **BVT-02: Total Integrity**: Sum of all person subtotals + shares must equal Grand Total exactly to 2 decimal places.

## 3. Edge Cases
- **EC-01: Zero Price Item**: Assign a "Free Water" item. Result: User pays $0 for item and $0 share of tax/tip (if proportional).
- **EC-02: Extreme Names**: Use a name with 50+ characters. Result: UI handles truncation/wrapping without breaking layout.
- **EC-03: Empty History**: Clear all history. Result: Display empty state placeholder correctly.
- **EC-04: Non-Standard Receipt**: Upload a picture of a cat. Result: AI returns meaningful error message ("Could not read receipt").

## 4. E2E (End-to-End)
- **E2E-01: Complete Session**: 
    1. Enter user name. 
    2. Upload receipt. 
    3. Use chat to assign 50% of items. 
    4. Manually split remaining items. 
    5. Undo the last split. 
    6. Change Tip distribution to EQUAL. 
    7. Save Split. 
    8. Check History for accuracy.

## 5. Regression
- **REG-01: Tax/Tip Recalculation**: After changing an item price, verify tax/tip proportions are updated automatically in the summary.
- **REG-02: Chat Context**: Ensure AI still remembers "Sarah" if she was mentioned in a message 3 turns ago.