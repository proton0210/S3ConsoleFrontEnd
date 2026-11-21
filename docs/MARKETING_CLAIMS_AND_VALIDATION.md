# Marketing claims and customer validation

Reviewed September 5, 2026 against desktop source v2.7.12. This is an internal evidence record, not measured customer ROI.

## Claims and evidence

| Topic | Publishable statement | Evidence and boundaries |
|---|---|---|
| URL uploads | Buckets handles downloading and uploading, with resume support | Desktop `urlUploadService.ts` / `stageUrlUpload`, called by `index.ts`: local spool before upload; disk and both network legs required; source resume depends on validators and range support |
| SSO | Integrated IAM Identity Center and profile workflows | Desktop `ssoAuth.ts`, `ssoIPCHandlers.ts`, `cliLoginService.ts`; do not claim exclusivity |
| Recovery | Reconstruct and restore using retained history | Desktop `timeTravelService.ts`: cap is 200,000 scanned version/delete-marker entries; refuse incomplete bulk restores; permanently deleted history cannot be recovered |
| Scanner | Sampled findings for review | Desktop `piiScannerService.ts`: defaults 5,000 objects, 1 MiB sampled each, skip above 50 MiB; optional ACL checks; false negatives/positives possible |
| Inventory | Query imported reports locally | Desktop `inventoryIngestService.ts`: CSV/Parquet imports; not live object state; report generation and imports can incur AWS charges |
| Cost | Estimates and billed-data views have different coverage | Standard-tier estimate excludes other charges; Cost Explorer needs permissions, reporting time and tags for bucket attribution |
| Drop Zones | Upload pages backed by signed S3 POST policies | Desktop `dropZonesService.ts`: multiple type choices and file count are page-only checks; saved signed pages are not revoked by deleting the hosted page |
| Windows | Website routes users to Microsoft Store | `src/app/downloads/page.tsx`; this does not establish signing of separate GitHub installers |

Positioning (September 26, 2026): the website does not compare Buckets with other products. Do not name other clients, publish comparison tables, or add "vs" / "alternative" pages or keywords; describe what Buckets does and the value it brings. Retired /vs/* URLs permanently redirect to the homepage. Do not change an article's publication date when updating it; update lastModified instead.

Positioning update (October 13, 2026, pending owner sign-off): market-gap plan item D4 reverses the September 26 rule for five head-to-head blog posts: `content/buckets-vs-{cyberduck,cs-browser,transmit,aws-console,sandcrab}.mdx`, linked from `best-s3-desktop-client-2026`. The rules for them:
- Every competitor fact must come from the plan's cited sources (vendor pages, public issue trackers).
- Every page shows "Verified 13 Oct 2026" and has a "Choose <competitor> if…" section.
- Where we could not verify a competitor capability, the page says "see the vendor's documentation" instead of claiming it is absent.
- The retired `/vs/*` redirects are unchanged.

If the owner keeps the September rule, delete those five files and the "Comparing Buckets with other tools" section. Re-verify competitor prices before changing lastModified.

Desktop telemetry (October 13, 2026): the unused `posthog-js` dependency was removed from the desktop app. The Trust Center's "No telemetry in the desktop app" section lists every desktop network connection and is enforced by `check:trust-center`. Keep the claim scoped to the desktop app; this website uses Google Analytics and Reddit and X conversion pixels.

Homepage hero (November 21, 2026): the first screen no longer has one fixed headline. The headline rotates with the pains described below, one per slide. Rules for the headlines:
- Two lines, each at most about 23 characters, so neither wraps at any screen width; the last words of line two carry the accent colour.
- A headline states the outcome and must stay true with the fix line under it: "Roll the bucket back past the bad deploy" needs versioning (the fix line says so), "Grep every bucket from one box" searches object keys within one account and is not regular-expression search, "Debug a 403 without the guesswork" is what Auth Doctor reports, not a guarantee of a cause.
- Do not say "one click" for a restore; Time Travel has a review step.
- No other S3 client is named, so the September 26 rule still holds.
- Fixed line under the product name (owner decision, November 21, 2026): "More productive than the CLI". This is a positioning claim, not a measured result; the "Instead of" command on each slide is the support for it. Do not attach a number (hours, percent, "10x") without a measured study, per the rule on assumed savings below.
- `NEXT_PUBLIC_HERO_VARIANT` is retired. `hero_download_clicked` now carries `wow`, the id of the slide showing when the button was clicked.

Homepage hero pains (November 21, 2026, replaces the pain reel section): the pains now rotate inside the hero (`hero-pains.tsx`). Per slide a headline, one pain and its fix show together, and beside them the real screenshot for that fix is framed on the control, the cursor clicks it and an outcome chip appears. A slide lasts 3.5 seconds. Rules for it:
- Each line must be readable in that time: about ten words.
- One motion per side: the text fades as one block, and the picture has only the cursor click and the outcome.
- The moves are animated screenshots, not recordings of the app. Do not call them videos or recordings.
- Every outcome chip repeats a figure visible in its screenshot (sample data) and the picture is captioned "Shown with the app's sample data". Change the chip if the screenshot changes.
- Savings are "estimated"; search is "every bucket in the account" (cross-account search is a separate reviewed scan); Time Travel says it needs versioning.
- It names no other S3 client.
- Audience (November 21, 2026): the hero is written for developers. The eyebrow reads "The S3 desktop client for developers", the pains are ones met at a terminal, and each slide shows "Instead of" with the command it replaces.
- Every "Instead of" command must be a real, runnable form of an AWS CLI or shell command, shortened only with placeholders (`b`, `key`, `prod`, `…`). It shows what a developer would reach for; it is not claimed to be a complete equivalent of the feature.
- "One click" is allowed on the presign slide only: copying the URI, the ARN and creating a presigned URL are each one button in the inspector.
- The AI-agents slide names Claude Code and Cursor as MCP clients, as the Tour already does. Do not imply a partnership or endorsement.
- The Drop Zones slide was dropped from the hero as a consultant use case; Drop Zones is still covered in the Tour.
- The click box on each screenshot is measured from the screenshot's pixels (`box` in `hero-pains.tsx`). Re-measure it whenever a screenshot is replaced; do not place it by eye.
- It pauses on hover and focus, has a Pause button, and shows each slide's end state without motion for visitors who ask for reduced motion.
- `/?wow=<id>` opens on one slide and stays there, for outreach links. Ids: agents, auth-doctor, time-travel, search, presign, folder-move, money-leaks.
- `wow-reel.tsx` is no longer used on the homepage.

## Positioning and pricing

Target hypothesis: consultants and small platform teams who manage S3 across accounts every week. Validate this hypothesis with paying users before treating it as established demand.

Current individual pricing (updated September 25, 2026) is $5/month, $49/year, and $99 lifetime; Team is $49/seat/year (the Yearly price per seat, repriced October 5, 2026 from $99) with a three-seat minimum. Existing entitlement behavior is unchanged. Lifetime receipts are one-time cash, not MRR. Low hosting costs do not eliminate support and maintenance costs.

Do not publish assumed hours saved, guaranteed recovery time, avoided-incident savings, or a fixed return on investment. If illustrating a calculation, label every input as hypothetical. Prefer measured results with context and customer permission.

## Customer validation protocol

1. Recruit 5–10 people with a recurring S3 task. Record role, task, frequency, current tool and baseline effort; avoid storing credentials or sensitive object names.
2. Observe the same task in Buckets. Include setup, review, retries and failures in the measurement.
3. Ask whether they will pay the advertised price. Record actual paid conversion separately from stated interest.
4. Check whether the workflow is still used at days 30 and 60, and why users stop.
5. Report cohort sizes, observation dates and limitations. Publish a named case study only with permission.

Track installation success, first successful transfer, repeated weekly use and trial-to-paid conversion with defined denominators. Use customer sessions and existing permitted data first; this change adds no desktop telemetry, analytics events, or customer outreach.

## Work outside the frontend

- Desktop release owner: configure Windows publisher signing and timestamping, verify final installer/application signatures, fail public direct-download releases on failed verification, and check clean-machine installation and updates. Signing credentials/provider setup are required; a website statement cannot complete this work.
- Desktop product owner: prioritize authentication, transfers and data safety; validate which advanced workflows paying users use before expanding them. Website progressive disclosure does not change desktop navigation or recovery behavior.
- Frontend deployment owner: use the existing Amplify pipeline. Required Clerk, licensing and billing configuration must be available for a full build and authenticated preview. Do not replace authentication with a development bypass.
- Public metadata: `NEXT_PUBLIC_PRODUCT_DESCRIPTION` overrides the source fallback. Review that non-secret Amplify setting for the same claims before release; suggested copy: "Buckets by ServerlessCreed is a desktop client for Amazon S3 and compatible storage on Mac, Windows, and Linux. Browse buckets, transfer files, share links, and manage AWS accounts. Free 14-day trial, no credit card."
