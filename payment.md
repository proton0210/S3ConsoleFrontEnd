**Overview**
- **Goal:** Create a DodoPayments checkout session on the server, redirect the user to the hosted checkout, and handle the return on a status page to mark the user as paid.
- **Approach:** Minimal server route that calls Dodo’s HTTP API directly, plus a client button that calls this route and redirects using the returned `checkout_url`.
- **SDK:** Not required. The Dodo API Key is optional; the route works without it. If provided, it is added as a Bearer token header.

**Key Files**
- `src/app/api/dodo/create-checkout/route.ts`
- `src/app/downloads/page.tsx`
- `src/app/payment-status/page.tsx`

**Environment**
- `DODO_API_KEY` (optional): If set, sent as `Authorization: Bearer <key>`.
- `DODO_PRODUCT_ID` (optional): Default product used by the server route if the client does not pass one.
- `NEXT_PUBLIC_APP_URL` (recommended): Used to construct `return_url` for Dodo to bring the user back to the app (falls back to request origin).

**Server: Create Checkout Session**
- Path: `src/app/api/dodo/create-checkout/route.ts`
- What it does:
  - Accepts `POST` with JSON body `{ productId?: string; quantity?: number }`.
  - Builds `product_cart` and posts to `https://live.dodopayments.com/checkouts`.
  - Sets `return_url` to `<APP_URL>/payment-status`.
  - Returns `{ success, checkout_url, session_id }`.
- Notes:
  - If `DODO_API_KEY` is present, the `Authorization` header is added; otherwise the request proceeds without it (per Dodo docs).
  - You can set a default product via `DODO_PRODUCT_ID`.

Example request:
- `POST /api/dodo/create-checkout`
- Body:
  - `{ "productId": "pdt_HAAaTSsGKpgkDFzHYprZM", "quantity": 1 }`
- Response:
  - `{ "success": true, "checkout_url": "https://…", "session_id": "…" }`

**Client: Start Checkout**
- Path: `src/app/downloads/page.tsx`
- Purchase button behavior:
  - Calls `/api/dodo/create-checkout` with product and quantity.
  - On success, redirects the browser to `checkout_url` (Dodo hosted page).
  - Shows a “Processing Payment” overlay while starting.

Snippet (core logic used on click):
- Calls `fetch('/api/dodo/create-checkout', { method: 'POST', body: JSON.stringify({ productId, quantity }) })`.
- On response, `window.location.href = data.checkout_url`.

**Status Page**
- Path: `src/app/payment-status/page.tsx`
- Structure:
  - The page is a client component wrapped in `<Suspense>` to satisfy Next.js requirements for `useSearchParams`.
  - Reads `status` from the URL (`succeeded | failed | processing`) to show UI.
  - When `status === 'succeeded'`, it:
    - Loads the current user with `GET /api/user-data`.
    - Calls `POST /api/payment-success` with `{ email, name }` to flip the user to paid in DynamoDB and send a confirmation email.
    - Triggers a small confetti animation and refreshes user data.

Important: If Dodo does not append a `status` query parameter on your return URL, you can either:
- Add `?status=succeeded` (or the value you want) to the `return_url` you send in the server route, or
- Adjust the status page to not depend on this param and instead poll/verify by `session_id` via a separate server endpoint.

**Replicate in Another Project**
- Minimal steps:
  - Add the server route file `src/app/api/dodo/create-checkout/route.ts` (copy as-is, or adapt the pathing).
  - Add a purchase button that calls this route and redirects to `checkout_url`.
  - Add a return page at `/payment-status` to handle the redirect and update your database/user state.
  - Configure environment variables in `.env.local`:
    - `NEXT_PUBLIC_APP_URL=https://your-app-domain`
    - `DODO_API_KEY=` (optional)
    - `DODO_PRODUCT_ID=` (optional)

**Testing Locally**
- Create a session via curl:
  - `curl -X POST http://localhost:3000/api/dodo/create-checkout -H "Content-Type: application/json" -d '{"productId":"pdt_HAAaTSsGKpgkDFzHYprZM","quantity":1}'`
- Expected JSON includes `checkout_url`. Paste it into the browser to test the hosted checkout.
- After checkout, you should land on `/payment-status`.

**Customization**
- **Products:** Switch the product via the button payload or `DODO_PRODUCT_ID`.
- **Quantity:** Pass any integer ≥ 1 in the POST body.
- **Return URL:** Update the route to use a different path or to add your own query params (e.g., `?status=succeeded`).
- **SDK Option:** If you prefer the official SDK, instantiate it on the server and call its `checkouts`/`payments` API instead of a raw `fetch`. The surrounding flow remains identical.

**Security Notes**
- Do not trust client-only success signals for critical state changes. Webhooks are the most reliable approach to mark a payment as finalized.
- If/when using webhooks, verify the signature per Dodo docs and update your DB server-side, then render the status page using DB truth.
- Keep API keys server-side only; our route already references them from server env.

**Troubleshooting**
- **No `checkout_url` returned:**
  - Check the server logs and the HTTP status from Dodo.
  - If your account requires auth, set `DODO_API_KEY`.
- **Status page always shows “processing”:**
  - Ensure your return URL receives `?status=succeeded` or adjust the page to not require it.
- **Wrong return URL:**
  - Set `NEXT_PUBLIC_APP_URL` or correct the origin used on the server route.
- **Different environments:**
  - The example posts to `https://live.dodopayments.com/checkouts`. If you use a test/sandbox, adjust per Dodo docs or use their SDK with `environment` set to test.

**Where To Change Things**
- **Change default product:** `src/app/api/dodo/create-checkout/route.ts`
- **Modify button/UX:** `src/app/downloads/page.tsx`
- **Change success logic/UI:** `src/app/payment-status/page.tsx`

