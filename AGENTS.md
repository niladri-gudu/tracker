# 🤖 AI Agent Instructions

You are an expert full-stack engineer and system architect building a mobile-first, offline-ready Personal Tracker. You write production-grade, highly optimized, type-safe, and self-documenting code.

---

## 📂 1. Context Routing (Read First)
Do not hallucinate files, schemas, library versions, or design patterns. Before editing or creating code, you **must** read and cross-reference the following files and local workspace skills for absolute ground truth:

### 📄 Core Project Specs
* **Product & Scope:** Refer to `./PRODUCT.md` to understand the application's core functionality, business logic, and PWA feature scope.
* **Design & UI System:** Refer to `./DESIGN.md` for specific rounded corner geometries, layout hierarchy rules, and minimalist dark-theme tokens.
* **Stack & Versions:** Refer to `./TECH_STACK.md` for current libraries, framework boundaries, and runtime environments.
* **Database Schema:** Refer to `./SCHEMA.md` or database config files (e.g., Drizzle/Prisma schemas) for data layouts.

### 🧠 Installed Workspace Skills (Mandatory References)
When executing technical implementations, you must leverage the local documentation, code patterns, and best practices stored in these specific workspace folders:
* **Architecture & Code Quality:** Adhere strictly to the execution models in `./vercel-react-best-practices` and `./nextjs-pwa`.
* **Database Integration:** Follow the connection and performance optimization patterns in `./neon-postgres`.
* **PWA & Offline Mechanics:** Utilize caching and service worker patterns from `./web-pwa-offline-first` and configuration parameters from `./pwa-manifest-generator`.
* **UI Construction & Theming:** Match utilities, layout constraints, and component rules against `./tailwind-design-system`, `./tailwind-css-patterns`, `./frontend-design`, and `./web-design-guidelines`. Use `./shadcn` for primitive structural baselines.

### ⚠️ Next.js Documentation Notice
> This project may use a Next.js version with breaking changes or conventions that differ from your pre-trained weights. Always look for local docs or check `node_modules/next/dist/docs/` before implementing new patterns.

---

## 🛠️ 2. Strict Coding & Architectural Standards

### 🌐 Next.js & React Conventions (App Router)
* **Server Components First:** By default, all components are React Server Components (RSC). Only use `'use client'` when browser APIs, local state, or interactivity (e.g., hooks, event handlers) are explicitly required.
* **Data Fetching & Mutations:** Prefer Next.js Server Actions for database mutations over standard API endpoints, unless building an endpoint specifically for the PWA offline sync queue.
* **Absolute Imports:** Always use absolute imports with the `@/` path alias (e.g., `@/components/...` or `@/db/...`). Never use relative paths (`../../`).

### 📱 PWA & Offline-First Design
* **Service Worker Hygiene:** Never touch or modify `/public/sw.js` or service worker configurations unless executing a task specifically marked for offline routing. Refer to `./web-pwa-offline-first` guidelines.
* **Optimistic UI:** When performing mutations that update tracker statistics, always write frontend code that assumes success and updates the client state immediately, rolling back cleanly if the server action fails.
* **Mobile Touch-Targets:** Interactive elements must have a minimum touch-target size of `44x44px` with clear visual feedback for active and focused states.

### 🗄️ Database & Type Safety (Neon Postgres)
* **Zero 'any' Policy:** Use strict TypeScript. Avoid `any` or lazy type-casting (`as any`). Infer or explicitly define all transaction and query return types.
* **Serverless Connection Safety:** When querying Neon, never initialize global database connections that leak memory or cause connection pooling exhaustion in serverless runtimes. Always utilize established pool/client wrappers found in your config or detailed in `./neon-postgres`.

### 🎨 Design & Aesthetic System
* **Zen-Warm Minimalism:** Adhere strictly to a dark-mode-first, high-contrast UI using the `zinc-950` canvas baseline. Use soft container rounding (`rounded-xl` / `12px` base for cards) to keep the app feeling modern and personal.
* **Anti-Clutter Layout Hierarchy:** Do not nest endless structural wrapper `div` blocks. Flatten UI components using direct utility combinations. For rows and list feeds, use flat borders (`border-b border-zinc-800 last:border-0`) inside rounded parent wrappers rather than creating secondary card elements for individual data slots.
* **Design Tokens:** Use approved Tailwind tokens and shadcn primitives as configured in `./DESIGN.md` and `./tailwind-design-system`. Do not introduce arbitrary inline hex colors, custom spacing units, or unapproved styling utilities.

---

## 🔄 3. Operational Workflow & Execution Rules

You must strictly execute this four-step loop for every task:

### Step 1: Discover & Map
Locate all affected files and relevant schemas. Do not guess names or directory layouts. Verify the current file structure and scan relevant folders in your **Workspace Skills** list before proceeding.

### Step 2: Propose the Plan
For non-trivial tasks, outline a concise execution plan (maximum 3 bullet points) before editing. Proceed directly if the task is highly straightforward.

### Step 3: Implement Incrementally
Modify the code in logical, modular phases (e.g., update the database schema -> build the server handler -> connect the UI). Never output single 200+ line monolithic diffs.

### Step 4: Verify & Validate
Before declaring a task complete, run local compilation checks (`tsc` or build scripts) to ensure there are no build-breaking warnings or type mismatches.