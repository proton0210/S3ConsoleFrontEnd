# Marketing claims and customer validation

Reviewed September 5, 2026 against desktop source v2.7.12. This is an internal evidence record, not measured customer ROI.

## Claims and evidence

| Topic | Publishable statement | Evidence and boundaries |
|---|---|---|
| URL uploads | Buckets handles downloading and uploading, with resume support | Desktop `urlUploadService.ts` / `stageUrlUpload`, called by `index.ts`: local spool before upload; disk and both network legs required; source resume depends on validators and range support |
| SSO | Integrated IAM Identity Center and profile workflows | Desktop `ssoAuth.ts`, `ssoIPCHandlers.ts`, `cliLoginService.ts`; do not claim exclusivity |
| Cyberduck SSO | Direct IAM Identity Center support in 9.5+, plus AWS CLI credentials | https://docs.cyberduck.io/protocols/s3/ reviewed September 5, 2026 |
| S3 Browser SSO | Built-in SSO flow | https://s3browser.com/amazon-s3-via-sso-single-sign-on.aspx reviewed September 5, 2026 |
| Recovery | Reconstruct and restore using retained history | Desktop `timeTravelService.ts`: cap is 200,000 scanned version/delete-marker entries; refuse incomplete bulk restores; permanently deleted history cannot be recovered |
| Scanner | Sampled findings for review | Desktop `piiScannerService.ts`: defaults 5,000 objects, 1 MiB sampled each, skip above 50 MiB; optional ACL checks; false negatives/positives possible |
| Inventory | Query imported reports locally | Desktop `inventoryIngestService.ts`: CSV/Parquet imports; not live object state; report generation and imports can incur AWS charges |
| Cost | Estimates and billed-data views have different coverage | Standard-tier estimate excludes other charges; Cost Explorer needs permissions, reporting time and tags for bucket attribution |
| Drop Zones | Upload pages backed by signed S3 POST policies | Desktop `dropZonesService.ts`: multiple type choices and file count are page-only checks; saved signed pages are not revoked by deleting the hosted page |
| Windows | Website routes users to Microsoft Store | `src/app/downloads/page.tsx`; this does not establish signing of separate GitHub installers |

Check each comparison row against current primary vendor documentation before expanding it. A version number or missing documentation is not proof that all competitors lack a feature. Do not change an article's publication date when updating it; update lastModified instead.

## Positioning and pricing

Target hypothesis: consultants and small platform teams who manage S3 across accounts every week. Validate this hypothesis with paying users before treating it as established demand.

Current individual pricing remains $9/month, $79/year, and $149 lifetime; Team is $99/seat/year with a three-seat minimum. No pricing or existing entitlement change is included in this work. Lifetime receipts are one-time cash, not MRR. Low hosting costs do not eliminate support and maintenance costs.

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
