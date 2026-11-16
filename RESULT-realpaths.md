# Real paths result

Completed on branch `realpaths-v2`, from `8980632`, in `F:\Bo\codex-work\hl-realpaths`.

Implementation commit: `b1db09c94ac4053e96962b31db41860fbd09ea3a`.
This report is recorded in a separate documentation commit so the implementation hash is exact.
No push, merge, publication, or changes to main were performed.

## Result

31 canonical paths are generated at build time, each with its own title, description, canonical URL, Open Graph and Twitter metadata. The current shell, content, styles and assets are retained. Every generated HTML file includes a root base URL. The root deployment files match source/dist byte-for-byte.

The shared route manifest drives the static pages, sitemap, route parsing and navigation. History API navigation supports back/forward and keyboard tabs. Old hash forms, tool/pet/festival aliases, queries and supported anchors redirect client-side using replacement history. The existing internal weekend state maps to /whatson/. CN/EN, day/night and cards/hero preview options continue to work. A 404 shell mounts the SPA; its noindex is removed when navigating to a recognized page.

CNAME, README.md, app.css and all content datasets are byte-for-byte unchanged from the starting commit. PR #9 was fetched and inspected for the manifest/History API/static-generation approach; no old content, styling or data was restored.

## Canonical paths

All paths below use the absolute origin https://hamiltonlocal.nz and appear in sitemap.xml. Each maps to its own index.html in both source/dist and the repository root.

- `/`
- `/tools/`
- `/tools/bins/`
- `/tools/urgent/`
- `/tools/bus/`
- `/tools/pay/`
- `/tools/checklist/`
- `/tools/gst/`
- `/tools/units/`
- `/tools/seasonal/`
- `/tools/other/`
- `/living/`
- `/living/grocers/`
- `/living/dining/`
- `/living/places/`
- `/living/upick/`
- `/living/stays/`
- `/living/blackfriday/`
- `/whatson/`
- `/whatson/picks/`
- `/whatson/markets/`
- `/kids/`
- `/kids/map/`
- `/kids/places/`
- `/kids/parties/`
- `/services/`
- `/services/home/`
- `/services/trades/`
- `/services/daily/`
- `/services/pets/`
- `/services/advisors/`

Additional generated file: `404.html` (excluded from the sitemap). robots.txt is unchanged and retains `Sitemap: https://hamiltonlocal.nz/sitemap.xml`.

## Verification

- `cd source; npm run build`: passed. 31 canonical pages plus 404/sitemap generated and copied with app.js/app.css into the root deploy layout.
- `cd source; npm test`: **74 passed, 1 failed, 75 total**. The sole failure is the allowed `party-venues: regional paging is bounded and expansion covers the reported omissions`, caused by the pre-existing missing `out/research/party-venues-before-expansion.json`. Baseline before this change was 70 passed / the same 1 failure.
- New route tests cover every section/tab and its old hash form, trailing slashes, old aliases, query/anchor/display-option preservation, metadata, sitemap and the 404 shell. Existing URL expectations were updated without weakening their content assertions.
- Preview: `PORT=4193 node preview.cjs`; Playwright `chromium.launch({channel:'msedge'})`; desktop 1440x900 and mobile 390x844.
- 62 direct document loads (all 31 paths at both widths): HTTP 200, correct route/tab/title/canonical, meaningful content, no framework overlay, no missing local assets.
- 18 legacy-link browser loads plus an additional runtime hashchange: correct new URL and selected content.
- At both widths: same-document navigation, back/forward, keyboard tabs, language toggle, persistent language/theme and 404 fallback passed. Separate regressions proved that section-to-default-tab metadata, preview options and 404-to-valid-page noindex handling work.
- Six sampled routes: no console warnings/errors or uncaught page errors. External analytics and map tiles were suppressed for deterministic QA where applicable.
- **Live visual comparison: 16/16 pairs pixel-identical**, with identical full visible text: home, tools/bins, living/blackfriday and services/advisors; day/night at both widths, compared with the live hash equivalents.
- **Pre-change commit comparison: 148/148 pairs passed** across all current pages and top-level section footers, both themes and widths. 142 pairs are exact; maximum mean RGB difference is 0.0000212663 on a 0?255 scale. Full visible text is identical. This comparison served the starting commit's original index/app.js from memory on local port 4194; it did not check out or modify main.
- Independent source review found no Critical/Important issues. Its minor preview-option persistence finding was fixed and verified. No deferred minors.
- `git diff --check` and root/dist deployment integrity checks passed.

## Evidence

All requested screenshots, verification scripts and logs are saved under:

`C:\Users\zifan\hl-shots-out\realpaths\`

- `qa-results.json`, `qa-run.log`: direct routes, hashes, interaction and live comparison checks.
- `*-preview.png` / `*-live.png`, `pixel-differences.json`: 16 live screenshot pairs.
- `head-parity/`, `head-parity-results.json`, `head-parity.log`: 148 pre-change screenshot pairs.
- `console-results.json`, `npm-test.log`: console check and full test output.
- `baseline-differences.json`: comparison with the repository's saved visual baseline.

## Caveats

- The stock `node qa/visual-regression.mjs check` cannot run unchanged here: its bundled Chromium executable is absent. An external copy using the requested Edge channel captured all 120 baseline views; the Python diff step also lacks Pillow. An equivalent Node image comparison found all 120 saved-baseline views above its 1.6 threshold, including clear platform font-rendering differences. The saved baseline was not changed. The live comparisons and same-browser comparison against the starting commit above independently establish no visual change from this task.
- GitHub Pages production responses remain untested because this is preview only. Actual Google indexing will occur only after an authorized deployment and subsequent crawling. Unknown paths return an HTTP 404 while displaying the SPA, as expected for the GitHub Pages fallback.
- The existing Browserslist data warning remains; no dependency versions were changed.
- User-provided brief/log files and local dependency/build/cache directories are left uncommitted. The preview server on port 4193 is left available for inspection.

## Files changed

- `404.html`
- `app.js`
- `docs/superpowers/plans/2026-11-16-realpaths.md`
- `index.html`
- `kids/index.html`
- `kids/map/index.html`
- `kids/parties/index.html`
- `kids/places/index.html`
- `living/blackfriday/index.html`
- `living/dining/index.html`
- `living/grocers/index.html`
- `living/index.html`
- `living/places/index.html`
- `living/stays/index.html`
- `living/upick/index.html`
- `services/advisors/index.html`
- `services/daily/index.html`
- `services/home/index.html`
- `services/index.html`
- `services/pets/index.html`
- `services/trades/index.html`
- `sitemap.xml`
- `source/build.mjs`
- `source/preview.cjs`
- `source/public/sitemap.xml`
- `source/src/App.tsx`
- `source/src/BlackFriday.tsx`
- `source/src/Feedback.tsx`
- `source/src/HomeGuide.tsx`
- `source/src/LocalDirectories.tsx`
- `source/src/Motion.tsx`
- `source/src/PageExperience.tsx`
- `source/src/PracticalTools.tsx`
- `source/src/card-style.ts`
- `source/src/cord-picks.ts`
- `source/src/home-guide-data.ts`
- `source/src/main.tsx`
- `source/src/navigate.ts`
- `source/src/site-routes.mjs`
- `source/src/tool-navigation.ts`
- `source/tests/home-guide.test.cjs`
- `source/tests/realpaths.test.cjs`
- `source/tests/service-advisors.test.cjs`
- `source/tests/tool-navigation.test.cjs`
- `tools/bins/index.html`
- `tools/bus/index.html`
- `tools/checklist/index.html`
- `tools/gst/index.html`
- `tools/index.html`
- `tools/other/index.html`
- `tools/pay/index.html`
- `tools/seasonal/index.html`
- `tools/units/index.html`
- `tools/urgent/index.html`
- `whatson/index.html`
- `whatson/markets/index.html`
- `whatson/picks/index.html`
- `RESULT-realpaths.md` (this report).
