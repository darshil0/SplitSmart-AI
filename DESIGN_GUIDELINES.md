# SplitSmart AI Design Guidelines

## 1. Visual Identity
- **Primary Color**: Indigo (`#4f46e5`) - Used for primary actions, branding, and highlights.
- **Secondary Color**: Slate (`#64748b`) - Used for secondary text and neutral elements.
- **Accent Colors**: 
  - Success: Emerald (`#10b981`)
  - Warning: Amber (`#f59e0b`)
  - Danger: Rose (`#f43f5e`)
- **Backgrounds**: 
  - Main: Gray-50 (`#f8fafc`)
  - Cards: White (`#ffffff`) with subtle border (`border-slate-200`)

## 2. Typography
- **Font Family**: 'Inter', sans-serif (Variable weight)
- **Scale**:
  - H1: 24px, Bold, Tracking-tight
  - H2: 20px, Semibold
  - Body: 14px, Regular
  - Caption: 12px, Medium (Uppercase for headers)

## 3. Spacing & Radius
- **Base Unit**: 4px
- **Containers**: `p-6` (24px)
- **Corners**: `rounded-2xl` (16px) for main cards, `rounded-lg` (8px) for buttons/inputs.
- **Shadows**: Soft `shadow-sm` (0 1px 2px 0 rgb(0 0 0 / 0.05)) for depth.

## 4. Components
- **Buttons**:
  - Primary: Indigo background, white text, hover state with slight scale.
  - Ghost: Transparent background, slate text, indigo hover.
- **Cards**: Minimalist with `backdrop-blur` where applicable. 1px solid border.
- **Inputs**: Slate-100 background, transition to indigo border on focus.

## 5. Mobile Strategy
- **Layout**: Switch from 2-column split-screen (desktop) to a Tabbed Navigation system (mobile).
- **Tabs**: "Receipt", "Assistant", and "Total".
- **Interaction**: Large touch targets (min 44px).
