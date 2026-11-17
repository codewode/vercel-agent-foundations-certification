# Ship It Shop — Vercel Agent Foundations Certification

A Next.js e-commerce application featuring autonomous **Customer Shopping** and **Store Admin** agents built with the **Vercel AI SDK 7**, **AI Elements**, **Vercel AI Gateway**, **Vercel Workflows**, and **Vercel Sandbox**.

The application talks to the live **Vercel Swag Store API** for product catalogs, cart mutations, customer order returns, inventory, support tickets, and sales analytics.

---

## Table of Contents
- [Architecture & Implemented Agents](#architecture--implemented-agents)
  - [1. Customer Shopping Agent](#1-customer-shopping-agent)
  - [2. Store Admin Agent](#2-store-admin-agent)
- [Tech Stack](#tech-stack)
- [Getting Started & Setup](#getting-started--setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [Data Layer & Security](#data-layer--security)
  - [Generative UI & Presentation](#generative-ui--presentation)
  - [Vercel Sandbox Computation](#vercel-sandbox-computation)
  - [Durable Workflows](#durable-workflows)
  - [Mobile Responsiveness](#mobile-responsiveness)
- [Testing & Verification Guide](#testing--verification-guide)
- [Deployment](#deployment)

---

## Architecture & Implemented Agents

```
                        ┌────────────────────────────────────────────────────────┐
                        │                   Vercel AI Gateway                    │
                        └───────────────────▲─────────────────▲──────────────────┘
                                            │                 │
                                    (OIDC / API Key)   (OIDC / API Key)
                                            │                 │
┌───────────────────────────────────────────┴───┐   ┌─────────┴──────────────────────────────────────┐
│        Customer Shopping Agent                │   │           Store Admin Agent                    │
│   (Storefront Chat Sidebar /?chat=open)       │   │           (/admin Dashboard)                   │
├───────────────────────────────────────────────┤   ├────────────────────────────────────────────────┤
│ • Product Discovery (searchProducts)          │   │ • Support Tickets Triage (getSupportTickets)   │
│ • Dynamic Categories (getAllCategories)       │   │ • Returns History (getReturnsHistory)          │
│ • Rich Inspection (getProductDetails)         │   │ • Live Stock Inquiries (getInventoryStock)     │
│ • Multi-Step Returns (returnOrder)            │   │ • Revenue & Sales (getSalesAnalytics)          │
│ • Generative UI Cards (Product Cards & Grid)  │   │ • Isolated Computation (Vercel Sandbox bash)   │
│ • Durable Return Workflow (return-flow.ts)    │   │ • Persistent Sandbox Memory (save/getMemory)   │
└───────────────────────┬───────────────────────┘   └─────────┬──────────────────────────────────────┘
                        │                                     │
                        ▼                                     ▼
                ┌────────────────────────────────────────────────────────┐
                │          Vercel Swag Store Backend API                 │
                │     (Protected by Deployment Protection Secret)        │
                └────────────────────────────────────────────────────────┘
```

### 1. Customer Shopping Agent
- **Interface**: Storefront chat sidebar (accessed via the robot icon in the header navigation).
- **Capabilities**:
  - `searchProducts`: Searches the catalog by query text and category filter.
  - `getAllCategories`: Discovers current store categories dynamically from backend store data.
  - `getProductDetails`: Fetches full product descriptions, image assets, pricing, and live inventory status.
  - `returnOrder`: Multi-step returns pipeline that verifies the order, notifies the customer, pre-authorizes the refund, and submits the return.
- **Generative UI**: Renders tool results as interactive product cards, 2-column product grids, and formal return receipts directly inside the chat conversation stream.

### 2. Store Admin Agent
- **Interface**: Gated employee dashboard at `/admin` (Demo password: `letmeinadminagent`).
- **Capabilities**:
  - `getSupportTickets`: Parameterized retrieval of support tickets with status, priority, category, assignee, and date range filters.
  - `getReturnsHistory`: Inspection of historical customer returns with decision badges and refund totals.
  - `getInventoryStock`: Real-time stock querying with low-stock alerts (1–5 units) and pagination.
  - `getSalesAnalytics`: Revenue and sales metrics aggregated by date range and optional product filter.
  - `bash` (Vercel Sandbox): Executes calculations and joins over fetched store data in an isolated execution environment. Includes smart normalization for bare Python and Node.js scripts.
  - `saveMemory` & `getMemory`: Reads and updates persistent memory files stored inside the sandbox filesystem across sessions.
- **Guardrails**: Read-only back-office access; prevents claiming false inventory mutations or unresolved ticket resolutions. Suppresses raw LaTeX formulas in favor of clean Markdown tables.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) with [React 19](https://react.dev/)
- **AI & Agent Orchestration**:
  - [Vercel AI SDK 7](https://ai-sdk.dev/) (`ai`, `@ai-sdk/react`, `@ai-sdk/workflow`)
  - [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) (`@vercel/sandbox`)
  - [Vercel Workflows](https://workflow-sdk.dev) (`workflow`)
- **UI & Styling**:
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/) (New-York neutral style)
  - [Streamdown](https://github.com/streamdown/streamdown) (Markdown & syntax rendering)
  - [Lucide React](https://lucide.dev/) (Icons)
- **Package Manager**: [pnpm](https://pnpm.io) (v10)
- **Language**: TypeScript 5.7 (Strict mode)

---

## Getting Started & Setup

### Prerequisites
- **Node.js**: `22.0.0` or higher
- **pnpm**: `9.0.0` or higher
- **Vercel CLI** (optional for local OIDC pull): `npm install --global vercel`

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd vercel-agent-foundations-certification
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Ensure `.env.local` contains `BYPASS_SECRET` and authentication for Vercel AI Gateway:

```env
# Required: Deployment protection bypass secret for the Swag Store API
BYPASS_SECRET=your_store_bypass_secret_here

# Required for Local AI Gateway Access (Choose Option A or Option B):
# Option A: Pulled automatically via Vercel CLI (refreshed every 12h)
VERCEL_OIDC_TOKEN=your_pulled_oidc_token

# Option B: Persistent AI Gateway API Key from Vercel Dashboard
AI_GATEWAY_API_KEY=your_ai_gateway_api_key
```

To automatically pull the OIDC token using the Vercel CLI:
```bash
vercel login
vercel link
vercel env pull .env.local
```

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Storefront**: [http://localhost:3000](http://localhost:3000) (Click the robot icon in the top right header to open the shopping agent).
- **Admin Agent**: [http://localhost:3000/admin](http://localhost:3000/admin) (Log in with password: `letmeinadminagent`).

---

## Environment Variables

| Variable | Required | Context | Description |
|---|:---:|---|---|
| `BYPASS_SECRET` | **Yes** | Server-side only | Vercel Deployment Protection bypass secret. Transmitted as `x-vercel-protection-bypass` on all store API requests. Never expose to client bundles. |
| `VERCEL_OIDC_TOKEN` | Optional* | Server-side only | OpenID Connect token generated by Vercel for authenticating AI Gateway requests. (*Auto-provisioned on Vercel deployments; pulled locally via `vercel env pull`). |
| `AI_GATEWAY_API_KEY` | Optional* | Server-side only | Persistent API key for Vercel AI Gateway. Used as an alternative to `VERCEL_OIDC_TOKEN` for local development or custom gateway setups. |
| `API_BASE_URL` | No | Server-side only | Base URL for the Swag Store API. Defaults to `https://vercel-agentic-swag-store-api.vercel.app/api`. |
| `NEXT_PUBLIC_SITE_URL` | No | Client & Server | Canonical site URL used for metadata and OpenGraph tags. Defaults to `http://localhost:3000`. |

---

## Project Structure

```
.
├── app/
│   ├── (store)/                     # Storefront route group (public)
│   │   ├── layout.tsx               # Storefront layout (CartProvider + SidebarProvider)
│   │   ├── page.tsx                 # / — Homepage (Static, revalidate 60s)
│   │   ├── search/                  # /search — Search page (Dynamic)
│   │   └── products/[param]/        # /products/:idOrSlug — Product detail (SSG)
│   ├── admin/                       # Back-office admin routes (gated)
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # /admin — Admin agent chat dashboard
│   │   └── login/                   # /admin/login — Demo auth login form
│   ├── api/
│   │   ├── chat/
│   │   │   ├── route.ts             # POST /api/chat — Customer shopping agent stream
│   │   │   └── [id]/stream/route.ts # POST/GET /api/chat/:id/stream — Stream recovery
│   │   └── admin/chat/
│   │       └── route.ts             # POST /api/admin/chat — Admin agent stream with memory
│   ├── layout.tsx                   # Synchronous root layout & interactive-widget viewport
│   └── globals.css                  # Tailwind tokens, safe area utilities & animations
│
├── components/
│   ├── agent-chat.tsx               # Customer shopping chat component (useChat + AI Elements)
│   ├── admin-agent-chat.tsx         # Admin operational chat component (useChat + Suggestions)
│   ├── generative-ui.tsx            # Generative UI cards (Product grids, details, return receipts)
│   ├── admin-generative-ui.tsx      # Admin presentation (Sandbox terminal cards, ticket/stock tables)
│   ├── agent-sidebar.tsx            # Right off-canvas slideover sidebar for shopping chat
│   ├── agent-panel-sync.tsx         # Syncs ?chat=open URL param without RSC de-optimization
│   ├── cart-*.tsx                   # Client cart provider, drawer sheet, and counter button
│   ├── ai-elements/                 # AI Elements chat primitives (Conversation, Message, PromptInput)
│   └── ui/                          # shadcn/ui components
│
├── lib/
│   ├── api.ts                       # Typed Swag Store API client (server-only with bypass)
│   ├── types.ts                     # TypeScript domain models and schemas
│   ├── tools.ts                     # AI SDK tools (searchProducts, returnOrder, bash, memory, etc.)
│   ├── agent.ts                     # ToolLoopAgent definitions & instructions for both agents
│   ├── sandbox.ts                   # Vercel Sandbox manager with smart script normalizer & fallback
│   ├── format.ts                    # formatPrice() — formats API integer cents to currency
│   ├── cart-token.ts                # httpOnly cart_token cookie helpers
│   ├── cart-actions.ts              # Server Actions for cart mutations (revalidateTag('cart'))
│   ├── admin-auth.ts                # Demo admin auth constants (password: letmeinadminagent)
│   └── workflows/
│       ├── return-flow.ts           # Durable order return pipeline ('use workflow' & 'use step')
│       ├── chat-flow.ts             # Durable shopping chat workflow with WorkflowAgent
│       └── admin-chat-flow.ts       # Durable admin chat workflow with WorkflowAgent
│
├── AGENTS.md                        # Essential developer & agent instructions
├── CLAUDE.md                        # Claude Code guidelines
├── package.json
└── tsconfig.json
```

---

## How It Works

### Data Layer & Security
- **Server-Side Isolation**: All calls to the Swag Store API occur strictly on the server in Server Components, Server Actions, or Route Handlers.
- **Price Format in Cents**: The Swag Store API handles all monetary numbers in integer cents ($25.00 is stored as `2500`). `formatPrice(cents, currency)` in [`lib/format.ts`](lib/format.ts:1) is used universally.
- **Cart Management**: Cart state is tied to a UUID stored in an `httpOnly` `cart_token` cookie with a 30-day expiration.
- **Synchronous Root Layout**: [`app/layout.tsx`](app/layout.tsx:1) remains synchronous so static pages (`/`) and SSG routes (`/products/[param]`) are pre-rendered at build time.

### Generative UI & Presentation
- In [`components/generative-ui.tsx`](components/generative-ui.tsx:1), tool invocations emit structured UI components directly in the stream:
  - `searchProducts` → `<ProductSearchResultsGrid />` with image thumbnails, category tags, formatted prices, and product page links.
  - `getProductDetails` → `<ProductDetailCard />` with high-resolution imagery, description, live stock indicator, and view button.
  - `returnOrder` → `<ReturnConfirmationCard />` with order identifier, return status, and pre-authorized refund total.

### Vercel Sandbox Computation
- In [`lib/sandbox.ts`](lib/sandbox.ts:1), the admin `bash` tool utilizes `@vercel/sandbox` to run isolated computations for calculating product return rates, top sellers, and low-stock analysis.
- **Script Normalizer**: Automatically detects and normalizes bare Python (`returns = {...}`) and Node.js code snippets into executable subshell commands (`python3 -c "..."` / `node -e "..."`), preventing shell syntax errors.
- **Interactive Feedback**: Renders `<SandboxExecutionCard />` in the admin chat displaying the executed code, duration in milliseconds, exit code, and live stdout/stderr.
- **Persistent Memory**: Reads and writes memory notes (`/tmp/admin_memory.txt` in sandbox, with local fallback) that are injected into the admin agent prompt at the start of each conversation.

### Durable Workflows
- In [`lib/workflows/return-flow.ts`](lib/workflows/return-flow.ts:1), order returns are managed through step functions (`lookupOrderStep`, `notifyCustomerStep`, `preauthorizeRefundStep`, `submitReturnStep`) marked with `'use step'` so completed side-effects are never duplicated upon workflow retries.
- In [`lib/workflows/admin-chat-flow.ts`](lib/workflows/admin-chat-flow.ts:1), long-running admin tasks execute through `WorkflowAgent`.

### Mobile Responsiveness
- [`app/layout.tsx`](app/layout.tsx:6) exports `viewport: Viewport = { interactiveWidget: "resizes-content" }`, preventing the on-screen software keyboard on mobile devices (iOS Safari / Android Chrome) from covering the chat input.
- Chat input containers feature safe-area padding (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`) and auto-scroll into view on focus.

---

## Testing & Verification Guide

### 1. Typecheck and Production Build

```bash
# Run strict TypeScript validation
pnpm tsc --noEmit

# Run Next.js production build
pnpm build
```

Both commands should complete with zero errors.

### 2. Testing the Customer Shopping Agent
1. Open [`http://localhost:3000`](http://localhost:3000).
2. Open the chat by clicking the robot icon in the header navigation.
3. **Product Search**:
   - Query: *"Show me the store mugs"*
   - Result: Displays `<ProductSearchResultsGrid />` with product photos, titles, prices, and links.
4. **Product Details & Stock**:
   - Query: *"Tell me more about the Vercel Zip Hoodie and check its stock"*
   - Result: Displays `<ProductDetailCard />` with rich description and stock availability badge.
5. **Order Return**:
   - Query: *"I want to return order 11111 because it arrived defective"*
   - Result: Executes order lookup, customer notification, pre-authorization, and displays `<ReturnConfirmationCard />`.

### 3. Testing the Store Admin Agent
1. Open [`http://localhost:3000/admin`](http://localhost:3000/admin) and sign in with password `letmeinadminagent`.
2. **Operational Queries**:
   - Click suggestion: *"Show me low-stock items"*
   - Result: Displays `<InventoryStockCard />` with items having 1–5 units remaining.
3. **Sandbox Calculation**:
   - Query: *"What is the return rate for each product across all completed returns and total orders?"*
   - Result: The agent queries back-office data, runs a computation script in Vercel Sandbox, displays the dark terminal card with execution time, and provides clean Markdown percentages.
4. **Persistent Memory**:
   - Query: *"Remember that pen_001 is being discontinued next quarter."*
   - Result: Confirms memory is saved to sandbox storage.
   - Query in new message: *"What items are being discontinued?"*
   - Result: Recalls the saved context.

---

## Deployment

### Deploying to Vercel

```bash
git add .
git commit -m "Deploy Vercel Ship Shop store and admin agents"
git push origin main
```

Or deploy directly using the Vercel CLI:

```bash
vercel --prod
```

### Vercel Dashboard Settings
In your Vercel Project Settings (`Settings → Environment Variables`), verify:
- `BYPASS_SECRET`: Pre-populated secret from your starter deployment.
- `API_BASE_URL`: (Optional) Defaults to `https://vercel-agentic-swag-store-api.vercel.app/api`.
- When deployed on Vercel, requests to the AI Gateway are authenticated automatically via OIDC.
