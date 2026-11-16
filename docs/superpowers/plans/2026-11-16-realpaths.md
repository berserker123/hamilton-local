# Real paths implementation plan

**Goal:** Execute `brief-realpaths.md` on `realpaths-v2` without publishing or changing visible content.

**Architecture:** Reuse PR #9's shared route manifest, History API navigation, and build-time HTML generation approach, using only current labels, tabs, assets and content. Keep the existing shell and styles. Canonical URLs end with `/`; the existing `weekend` state maps to `/whatson/`.

**Spec:** `brief-realpaths.md`; `docs/DESIGN-RULES.md`.

## Constraints and review focus

- Preserve CNAME, README, all visual styles, current data, bilingual controls and both themes.
- Preserve legacy tool/pet/festival aliases, search and anchor parameters, and display options.
- Native anchor links, modified clicks, external links and browser history must retain their normal behavior.
- Every section and tab needs HTML metadata and a sitemap entry; nested assets must load on a static host.
- Copy only generated deployment files to the root; never push or modify main.

## Tasks

- [x] Add failing tests for route mapping, legacy redirects, metadata rendering and sitemap coverage.
- [x] Create `source/src/site-routes.mjs` as the shared manifest and route/metadata helpers; preserve `tool-navigation.ts` compatibility exports.
- [x] Add `source/src/navigate.ts`; update App route reading, links, navigation events and metadata, preserving DOM/content. Update affected old URL assertions.
- [x] Generate HTML and sitemap in `source/build.mjs`, retain the current shell via template substitution, and copy generated deployment files. Make `source/preview.cjs` model static directory indexes and the 404 shell.
- [x] Build and run the full test suite; only the documented party-venues fixture failure is allowed.
- [x] Use Playwright Edge against port 4193 at 1440 and 390 widths: direct paths, old hashes, history, language, themes and asset/console checks. Compare home plus three tabs with live hash equivalents, in both themes. Save evidence outside the repo as specified.
- [x] Run the repository visual regression check, inspect the final diff and request an independent review. Commit the implementation, then write and commit `RESULT-realpaths.md` with its implementation hash and caveats.

## Progress

- Baseline: 70/71 tests passed; allowed `regional paging is bounded and expansion covers the reported omissions` fails because `out/research/party-venues-before-expansion.json` is absent.
- PR #9 fetched and inspected as reference only. It contains outdated tabs/copy/styles; none will be restored.

- Implemented the shared current route manifest and generated 31 canonical pages. No historical content or styles restored.
- Verified RED -> GREEN for route tests, section-to-default-tab metadata, preview options and fallback noindex.
- Final npm suite: 74/75 passed, only the same authorized missing party-venues fixture failure.
- Edge QA: 62 direct loads, 18 old hashes, desktop/mobile history, keyboard navigation, language, theme, assets, 404 fallback; no runtime errors.
- Live parity: 16/16 screenshot pairs pixel-identical, full visible text identical.
- Pre-change HEAD parity: 148 pairs over all pages and six section footers in both themes at 1440/390; 142 exact, maximum mean RGB difference 0.0000213/255. Full visible text identical.
- Independent source review: no Critical/Important findings. Minor preview-option persistence finding fixed and verified; no deferred minors.
- Repository baseline runner requires unavailable bundled Chromium and Pillow. Equivalent Edge captures differ from the stored baseline (including platform font rendering); baseline left unchanged. Live and same-browser pre-change comparisons establish no change from this round.
- Deployment files verified byte-for-byte against dist; CNAME, README and app.css unchanged. Only requested implementation and report commits will be made; no push/merge.
