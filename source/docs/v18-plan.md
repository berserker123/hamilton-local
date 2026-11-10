# Hamilton Local v18 implementation plan

**Goal:** Implement `../PROMPT.txt` as a local preview, retaining v17 behavior.
**Architecture:** A static, source-backed venue JSON feeds a focused React component. Reuse the existing agenda region chips and compact rows. No new runtime dependency or network data loading.
**Tech stack:** Existing React 18, TypeScript, esbuild, Tailwind, Node tests and local Playwright Chromium.
**Spec:** `../../PROMPT.txt`; visual reference `../../ref/landing-page-design-SKILL.md`.

## Constraints and decisions

- Work in the supplied standalone copy; it has no Git repository. No publish or push.
- Default Hamilton; five requested regions; four venue types; allow combined filters, empty state and reset.
- Official evidence for every venue. Unpublished prices and ages remain explicitly unconfirmed. Do not equate admission with a party package.
- Preserve existing source and photo hashes except the narrow App integration and appended styles.
- Local preview binds 127.0.0.1:4179. Browser plugin not available; use user-authorized Playwright and F:/Bo/ms-playwright Chromium.

## Tasks

- [x] Research official Hamilton and Waikato sources; merge verified records into `src/party-venues.json`; generate `../out/research/party-venues-sources.md` with field-level evidence and pending items.
- [x] Test `filterPartyVenues(items, region, type)` with combined filters, all regions, no match and unknown types. Implement `src/party-data.ts` and `src/PartyVenues.tsx`; integrate only the parties route and append scoped CSS.
- [x] Add data integrity tests (counts, unique identities, official sources, required fields). Run `npm test` and `npm run build`.
- [x] Update local preview port; adapt v17 QA to compare the supplied baseline; add party route desktop/mobile, region/type/reset, English, keyboard, direct link, pending metadata and no-overflow checks. Run `npm run qa` and inspect screenshots.
- [x] Check all discovered external links for actual 404s, reporting restricted or unverified results distinctly. Write Chinese `../RESULT.md` with counts, lists, sources, uncertainty, regression evidence, preview URL and two key screenshots.

## Review focus

Crossing region and type filters may yield zero results: show a clear empty state and usable reset. Long bilingual names, addresses and prices must wrap at 390px. Switching language must retain selection. Link validation must distinguish HTTP blocking/timeouts from a verified page. Existing map tile network failure must retain its list and directions. Re-run the original v17 interactions on the same preview.

## Progress

- Read UTF-8 task source and existing components. Research delegated by region under web-access skill guidance.

- Final: 28 venues (14/4/3/2/5). npm ci repaired copied dependency omissions; npm test 6/6; npm run build passed; npm run qa passed at both viewports, with zero normal console/page/HTTP errors.
- 161 external URLs: 156 reachable, 5 HTTP403, zero detected 404/410/soft404; restricted pages reported separately.
- Fresh read-only reviewer found no important issues and independently reran all 6 unit tests. RESULT.md written with links, unknowns, source evidence, regression table and key screenshots.
