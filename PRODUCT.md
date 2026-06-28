# 📈 PRODUCT.md — Core Product & Feature Scope

## 🎯 Project Overview
The **Personal Money Tracker** is a mobile-first, offline-ready progressive web application (PWA) engineered for lightning-fast transaction logging and budget tracking. It is optimized for speed, terminal-like efficiency, and reliable performance on spotty mobile data connections through an offline-first cache strategy.

---

## 👥 Core User Personas
* **The Power Logger:** Needs to pull out their phone, log a cash transaction in under 3 seconds, and lock the screen immediately.
* **The Budget Optimizer:** Needs to track current category constraints cleanly without cognitive load or cluttered financial charts.

---

## 📋 Feature Scope & System Specs

### 1. Authentication & Onboarding
* **Requirements:** Secure onboarding via Web auth or clean authentication streams. 
* **Persistence:** Identity sessions must allow persistent offline initialization so users can launch the app and log data without an active network connection.

### 2. Multi-Account Ledger System
* **Requirements:** Track asset values across distinct payment methods (e.g., Cash, Bank Accounts, Credit Cards).
* **Transaction Flow:** Support three primary transaction types:
    * `income`: Adds funds directly to an account balance.
    * `expense`: Subtracts funds from an account balance.
    * `transfer`: Atomically shifts money out of a source account and into a destination account.

### 3. Smart Categories & Visual Visualizations
* **Requirements:** Classification mappings for every transaction. Every category must contain metadata configurations specifying a dedicated display icon (Lucide index pointer) and an aesthetic color attribute.

### 4. Dynamic Budget Limits
* **Requirements:** Strict calendar-month threshold tracking tied directly to categories. 
* **Rules:** Only one active budget record is permitted per user-category combination per billing month cycle.

### 5. PWA Synchronicity & Pipelined Queue
* **Requirements:** Transactions made offline must write immediately to local state storage (Optimistic UI) and queue up in a persistent transaction sync buffer. 
* **Reconciliation:** As soon as connectivity is restored, the queue must drain cleanly back into the server actions runtime without duplicating state tables.