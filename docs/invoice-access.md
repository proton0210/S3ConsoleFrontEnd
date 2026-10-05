# Billing and invoice access

`/account` opens billing. The desktop header, mobile menu and account navigation link to billing, invoices and team management. `/account/invoices` resolves available histories on the server and opens the existing Dodo customer portal only on an explicit click. It does not store invoice or portal-session URLs.

The verified Clerk session selects the account. Body email, customer ID and proposed admin roles are not authority. Personal rows must match the session's subject/email; team financial access requires the canonical TEAM owner email; any stored owner-subject binding must match. Team members (including callers claiming an admin role) cannot inherit billing access from a seat's customer ID. There is no separate billing-admin role in the established team model.

Expired, cancelled and Lifetime owners keep their own available history. Lifetime plus team owners can select either billing account. Dodo's customer portal is account-wide, including payment controls; these links do not filter invoices by product or personal/team label. If a customer ID is shared, the histories may be the same. Older/unmapped licenses show support guidance.

All billing scopes use the existing verified Clerk and canonical license/TEAM lookups; no new backend route is required.

Run `npm run test:invoices` for access and portal regression cases. Provider requests are mocked; tests do not create live portal sessions, send email, or charge money.
