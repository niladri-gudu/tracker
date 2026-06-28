# 🎨 DESIGN.md — Aesthetic System & UI Design Tokens

## 🌌 Core Aesthetic Philosophy
This application utilizes a strict, zero-bloat, **Minimalist "Zen" Theme**. The design is dark-mode-first, high-contrast, text-heavy, and component-light. It uses absolute structural lines instead of heavy background drop-shadows or gradients.

* **Primary Mood:** Sleek, tactical, terminal-inspired, and focused.
* **Accents:** Highly restrained. Colors are functional, used only to denote metrics, data classifications, or critical interactions.

---

## 🎨 Theme Tokens (Tailwind Mapping)

Every layout element must conform strictly to these semantic color spaces:

| Token Name | Tailwinds Class Match | UI System Application |
| :--- | :--- | :--- |
| **Background** | `bg-[#09090b]` / `zinc-950` | Primary app shell canvas |
| **Surface** | `bg-[#18181b]` / `zinc-900` | Secondary component block or card backing |
| **Border** | `border-[#27272a]` / `zinc-800` | Clean layout separation lines (No box-shadows) |
| **Text Primary** | `text-[#fafafa]` / `zinc-50` | High-contrast readability strings |
| **Text Muted** | `text-[#a1a1aa]` / `zinc-400` | Explanatory labels, timestamps, meta elements |
| **Accent Positive**| `text-[#10b981]` / `emerald-500`| Incomes, positive balances, budget safety margins |
| **Accent Negative**| `text-[#ef4444]` / `red-500` | Expenses, over-budget indicators, warning flags |

---

## 📱 Mobile-First Layout Rules

### 🎯 Touch-Targets & Interactive Surfaces
* All tap elements (buttons, inputs, chevron select lists) must conform to a minimum size constraint of **`44x44px`** to guarantee effortless single-hand thumb execution.
* Interactive primitives require a clear, instantaneous active highlight state (e.g., matching a subtle background tint change on tap).

### 📐 Navigation Framework
* **Mobile Form-Factor:** Fixed, rigid bottom-bar menu framework mapped to main product routes.
* **Desktop Breakpoint:** Left-docked static layout sidebar.
* **Data Feeds:** Infinity-scrolling list sheets separated with fine-line border divisions. No bloated spacing. 

### 🔏 Data Insertion Mechanics
* Modals and sheet dialog drawers sliding up from the base of the view-port are the preferred mechanism for quick manual entries. 
* Inputs must trigger context-aware mobile keyboard types automatically (`inputMode="decimal"` for value entries).