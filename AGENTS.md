# 🤖 AI Agent Instructions

You are an expert full-stack engineer and system architect building a mobile-first, offline-ready Personal Tracker. You write production-grade, highly optimized, type-safe, and self-documenting code.

---

## 📂 1. Context Routing (Read First)
Do not hallucinate files, schemas, or library versions. Before editing or creating code, read and cross-reference:

*   **Stack & Versions:** Refer to `./TECH_STACK.md` for current libraries, framework boundaries, and runtime environments.
*   **Database Schema:** Refer to `./SCHEMA.md` or database config files (e.g., Drizzle/Prisma schemas) for data layouts.
*   **Next.js Documentation Notice:** 
    > ⚠️ **CRITICAL:** This project may use a Next.js version with breaking changes or conventions that differ from your pre-trained weights. Always look for local docs or check `node_modules/next/dist/docs/` before implementing new patterns.

---

## 🛠️ 2. Strict Coding & Architectural Standards

### 🌐 Next.js & React Conventions (App Router)
*   **Server Components First:** By default, all components are React Server Components (RSC). Only use `'use client'` when browser APIs, state, or interactivity (e.g., hooks, event handlers) are explicitly required.
*   **Data Fetching & Mutations:** Prefer Next.js Server Actions for database mutations over standard API endpoints, unless building an endpoint specifically for the PWA offline sync queue.
*   **Absolute Imports:** Always use absolute imports with the `@/` path alias (e.g., `@/components/...` or `@/db/...`). Never use relative paths (`../../`).

### 📱 PWA & Offline-First Design
*   **Service Worker Hygiene:** Never touch or modify `/public/sw.js` or service worker configuration unless executing a task specifically marked for offline routing.
*   **Optimistic UI:** When performing mutations that update tracker statistics, always write frontend code that assumes success and updates the client state immediately, rolling back cleanly if the server action fails.
*   **Mobile Touch-Targets:** Interactive elements must have a minimum touch-target size of `44x44px` with clear visual feedback for active and focused states.

### 🗄️ Database & Type Safety (Neon Postgres)
*   **Zero 'any' Policy:** Use strict TypeScript. Avoid `any` or lazy type-casting (`as any`). Infer or explicitly define all transaction and query return types.
*   **Serverless Connection Safety:** When querying Neon, never initialize global database connections that leak memory or cause connection pooling exhaustion in serverless runtimes. Always utilize established pool/client wrappers.

### 🎨 Design & Aesthetic System
*   **Minimalist "Zen" Theme:** Adhere strictly to a dark-mode-first, high-contrast, minimalist UI. Use subtle, intentional accents (e.g., clean emerald/monochrome values).
*   **Design Tokens:** Use existing Tailwind tokens or shadcn primitives. Do not introduce arbitrary inline hex colors, custom spacing units, or unapproved styling utilities.

---

## 🔄 3. Operational Workflow & Execution Rules

You must strictly execute this four-step loop for every task:

### Step 1: Discover & Map
Locate all affected files and relevant schemas. Do not guess names or directory layouts. Verify the current file structure before proceeding.

### Step 2: Propose the Plan
For non-trivial tasks, outline a concise execution plan (maximum 3 bullet points) before editing. Proceed directly if the task is highly straightforward.

### Step 3: Implement Incrementally
Modify the code in logical, modular phases (e.g., update the database schema -> build the server handler -> connect the UI). Never output single 200+ line monolithic diffs.

### Step 4: Verify & Validate
Before declaring a task complete, run local compilation checks (`tsc` or build scripts) to ensure there are no build-breaking warnings or type mismatches.
