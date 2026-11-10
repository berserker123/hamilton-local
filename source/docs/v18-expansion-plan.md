# Hamilton Local v18 venue expansion

**Goal:** Execute `../../PROMPT.txt`: systematically expand the existing 28 records, preserve the supplied site, and deliver a checked local preview.
**Architecture:** Keep the source-backed JSON and existing React rows. Add creative and mobile-service filters; give newly covered towns their own region chips. Cap each regional list at eight records with an accessible show-more toggle.
**Tech stack:** Existing React, esbuild, Node tests and Playwright; no new dependencies.
**Spec:** `../../PROMPT.txt`; design reference `../../ref/landing-page-design-SKILL.md`.

## Constraints and decisions

- Work in the explicitly supplied standalone `work` directory; no publishing or git push.
- Keep all 28 existing identities unless evidence requires correction; merge multiple activities at the same business.
- Verify party/hire suitability and location with official sources. Discovery directories are leads, not proof. Unknown price, age, address or arrangements remain explicitly unconfirmed.
- Services require an official Hamilton/Waikato service-area statement; suppress misleading directions for businesses that travel to the customer.
- Preserve App integration, old stylesheet prefix, inherited data and image hashes; keep Hamilton as default.
- Public web search is available. Browser plugin is absent and personal CDP is not configured; use public search/fetch for research and user-authorized local Playwright for QA.

## Tasks

- [ ] Save the existing 28 records as the expansion baseline. Research all requested activity families and towns; record inclusions, exclusions and gaps with official URLs.
- [ ] Merge evidence-backed additions, add specific region/type options and eight-row pagination. Validate unique identities, supported classifications, service areas, mixed filters and page reset.
- [ ] Rebuild `dist`; run the existing regression QA updated for capped lists, expansion and mobile services. Overwrite requested desktop/mobile screenshots, inspect them, and review console errors.
- [ ] Audit all rendered and source URLs, repair actual dead links, and distinguish inaccessible pages from successful checks. Rewrite Chinese `../../RESULT.md` with totals, new records, Timezone/The Peak decisions, uncertainty and verification evidence.

## Review focus

Filtering after expanding must reset pagination; unknown service addresses must not create fake map destinations; English labels must preserve selection; all-region lists must remain grouped; the original hero, teaser locks, urgent wording, merchant order, festival exclusivity, footer and playground map must pass the inherited checks.

## Progress

- Initial inspection: full UTF-8 request recovered from PROMPT.txt. Existing 28 records and regression scripts found. Current The Peak page provides different prices from its old PDF: use the current HTML page.
