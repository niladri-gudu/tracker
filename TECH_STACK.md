# 🛠️ Tech Stack & Architecture Boundaries

This document defines the strict versioning, architecture constraints, and library boundaries for the Money Tracker PWA. All newly introduced components, API designs, and utilities must align with these parameters.

---

## 📦 1. Core Framework & Runtime
*   **Framework:** Next.js 14+ (App Router)
    *   *RSC First:* Server Components by default.
    *   *Mutations:* Next.js Server Actions with strict error boundaries and optimistic UI updates.
*   **Runtime:** Node.js 20+ (LTS) / Edge-compatible where possible.
*   **Language:** TypeScript (Strict Mode enabled, zero `any` or lax type assertions).

---

## 🗄️ 2. Database & Data Layer
*   **Database:** Neon Postgres (Serverless Postgres)
*   **ORM:** Drizzle ORM (`drizzle-orm`)
    *   *Driver:* `@neondatabase/serverless` (utilizing HTTP/WebSockets connection pooling for serverless performance).
    *   *Migration CLI:* `drizzle-kit` for automated migrations and schema synchronization.
*   **Connection Policy:** Never initialize global db clients outside of the dedicated wrapper (`@/db/index.ts`). Ensure connections scale-to-zero cleanly.

---

## 📱 3. PWA & Offline Capability
*   **PWA Wrapper:** `@ducanh2912/next-pwa`
    *   *Configuration:* Strict caching strategies for static assets and CDN routes.
    *   *Offline Fallback:* Dynamic offline fallback page and persistent local IndexedDB queue for mutations.
*   **Local Storage Sync:** TanStack Query (React Query)
    *   Used for caching, pre-fetching, and handling client-side state synchronization.
    *   Persists cache to IndexedDB/localStorage for instant offline boot-up.

---

## 🎨 4. Frontend & Design System
*   **CSS Framework:** Tailwind CSS (v3/v4 utility-first approach).
*   **Primitives:** shadcn/ui (Radix UI under the hood).
*   **Icons:** `lucide-react` (subsetted or dynamic imports to keep bundle sizes minimal).
*   **Forms & Validation:** `react-hook-form` paired with `zod` for type-safe runtime validations.

---

## 🔒 5. Authentication & Identity
*   **Service:** Auth.js (NextAuth.js v5) or custom session token middleware.
*   **Pattern:** JWT sessions persisted in secure, HttpOnly, SameSite=Strict cookies to make offline authorization checkouts efficient.
