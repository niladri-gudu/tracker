# 🎨 DESIGN.md — Aesthetic System & UI Design Tokens

## 🌌 Core Aesthetic Philosophy
This application utilizes a refined, **Minimalist "Zen-Warm" Theme**. The design is dark-mode-first, high-contrast, text-heavy, and component-light. It uses soft, rounded container geometries and explicit borders rather than messy background drop-shadows or gradients. 

* **Primary Mood:** Sleek, tactical, personal, and highly polished.
* **Component Layering:** To combat nested element clutter (div under div), layout hierarchy is maintained purely via subtle shifts in structural border values, soft rounding, and clean spacing. No unnecessary structural wrappers.

---

## 🎨 Theme Tokens (Tailwind Mapping)

Every layout element must conform strictly to these semantic spaces:

### 🌗 Color Spaces
| Token Name | Tailwinds Class Match | UI System Application |
| :--- | :--- | :--- |
| **Background** | `bg-[#09090b]` / `zinc-950` | Primary application canvas |
| **Surface** | `bg-[#141417]` / `zinc-900/70` | Secondary component block, card body, or data rows |
| **Border** | `border-[#27272a]` / `zinc-800` | Clean structural borders (No heavy shadows) |
| **Text Primary** | `text-[#fafafa]` / `zinc-50` | Primary high-contrast typography strings |
| **Text Muted** | `text-[#a1a1aa]` / `zinc-400` | Secondary metadata labels, logs, and context tags |
| **Accent Positive**| `text-[#10b981]` / `emerald-500`| Incomes, safe budget status indicators |
| **Accent Negative**| `text-[#ef4444]` / `red-500` | Expenses, over-budget indicators, system failures |

### 📐 Geometry & Radius Rules
To prevent hard, sharp corners and make the interface feel modern and personal:
* **Cards & Main Containers:** Use **`rounded-xl`** (`12px`).
* **Nested Form Fields / Buttons:** Use **`rounded-lg`** (`8px`).
* **Micro Elements (Badges/Avatars):** Use **`rounded-md`** (`6px`) or `rounded-full`.

---

## 📱 Mobile-First Layout Rules

### 🎯 Touch-Targets & Interactive Surfaces
* All interactive surfaces (buttons, inputs, transaction list items) must meet a minimum size boundary of **`44x44px`** for easy single-thumb invocation.
* **Feedback:** Every active tap requires immediate visual confirmation using a smooth background transition (`transition-colors duration-200 active:bg-zinc-800`).

### 📐 Anti-Clutter Layout Hierarchy (Avoiding Div Soup)
* **Flatten the Structure:** Do not create wrappers around wrappers. Use Tailwind utility combinations like `flex flex-col gap-2 p-4 border border-zinc-800 rounded-xl bg-zinc-900/50` directly on the primary layout data element.
* **Data Feeds:** Infinity-scrolling lists must be grouped cleanly. Use soft `rounded-xl` containers to house list segments, with interior individual items divided by simple `border-b border-zinc-800 last:border-0` lines.

### 🔏 Data Insertion & Micro-Overlays
* **Modals & Drawers:** Data entry happens via bottom-sheets sliding fluidly from the viewport base. Sheets must utilize a top radius (`rounded-t-2xl`) and feature a soft backdrop blur layer (`backdrop-blur-sm bg-zinc-950/60`) to keep focus centered.
* **Context-Aware Inputs:** Inputs must automatically trigger dedicated mobile keyboard alignments (`inputMode="decimal"` for numbers).