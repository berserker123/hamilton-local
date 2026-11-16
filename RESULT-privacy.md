# Privacy page result

Spec: `brief-privacy.md`. Base: `0db7f445eeadb84263c667e70db79743b2bfb5e3`, existing `privacy-page` worktree. Local preview and commit only.

## Implementation plan and progress

- [x] Read design rules and audit integrations before drafting copy.
- [x] Add a failing route/document/sitemap test, then extend shared routing without changing navigation order or legacy redirects.
- [x] Add bilingual policy in the existing section photo/scrim/content-panel layout; link beside the footer disclaimer.
- [x] Build (existing build copies generated files to the repository root), run tests, inspect desktop/mobile day/night and language/navigation behavior, capture screenshots, run regression checks.
- [x] Review scope, commit locally, record evidence and commit hash here.

Design: one dedicated policy component, existing `t(zh,en)` copy selection, shared route metadata, existing licensed Hamilton Gardens background and credits. Reuse section panel styling; scope any new typography rules to the policy. No new dependencies or services. The brief already specifies the design and execution, so no additional design approval is needed.

## Third-party service audit (before policy copy)

| Service / resource | Actual behavior and file evidence |
| --- | --- |
| Cloudflare Web Analytics | `source/index.html:30` injects `https://static.cloudflareinsights.com/beacon.min.js` only for `hamiltonlocal.nz` / `www.hamiltonlocal.nz`. No other analytics or advertising scripts found. Localhost preview does not activate the beacon. |
| Web3Forms | `source/src/feedback-config.ts:2` has a configured access key; `source/src/feedback-model.ts:70` posts JSON to `https://api.web3forms.com/submit`. `Feedback.tsx` collects required feedback type and message, optional name and email or WeChat. `feedbackPayload` additionally sends page URL and section, a botcheck boolean, subject, from_name, access_key, and replyto only if contact is an email. A filled honeypot prevents submission. On error the form offers a mailto fallback; the PENDING-only path is not the configured mode. |
| Email / Gmail | `source/src/ContactCard.tsx:4` exposes `adminhamiltonlocal@gmail.com` via mailto. Emails are user-initiated, not an embedded Gmail script. `feedback-model.ts:44` retains the existing `hello@hamiltonlocal.nz` mailto fallback. No mail delivery or retention settings can be inferred from the code. |
| OpenStreetMap tiles and Leaflet | `source/src/PlaygroundMap.tsx:92` requests `https://tile.openstreetmap.org/{z}/{x}/{y}.png` when the playground map mounts, including when users pan/zoom. Tile delivery exposes standard request data such as IP and requested map area to the tile provider. Leaflet is bundled locally (`source/package.json`, `source/build.mjs`); its CSS/icons are copied locally. No browser geolocation request found. |
| Google Maps and other external destinations | `App.tsx`, `PlaygroundMap.tsx`, `LocalDirectories.tsx`, `party-data.ts`, `cord-picks.ts` contain outbound Google Maps search/directions/street-view links. Business, event, retailer, council, transport, weather, school, fuel and source links are outbound links, not embedded services or live APIs. Destination sites have their own policies. |
| GitHub Pages / Cloudflare delivery | `source/build.mjs` explicitly generates GitHub Pages static documents; root `CNAME` specifies the site domain and `source/index.html` contains Cloudflare integration. Hosting via GitHub Pages and Cloudflare is supplied by the brief; runtime proxy/account configuration is not provable from source. Delivery/security can process IP addresses and standard technical request data. |
| Fonts | `source/src/styles.css:12-13` and `source/tailwind.config.js:34-36` declare font-family preferences and system fallbacks. No remote font stylesheet, @font-face download, Google Fonts or Adobe Fonts integration found. |
| Images and embedded content | Runtime photos, branding and icons use local paths (`App.tsx`, `Motion.tsx`, `experience-model.ts`, JSON photo records; copied by `source/build.mjs`). Wikimedia Commons, Pexels and licence URLs are attribution/source links, not runtime image hosts. No iframe, embedded video, social widget or remote image loader found. |
| Browser preferences (not a third party) | `source/index.html:2`, `source/src/App.tsx` read/write `hl-theme` and `hl-lang` in localStorage; App removes obsolete `hl-theme-v20`. These are browser preferences, not analytics storage. |

Official references checked: [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/), [Cloudflare documentation](https://developers.cloudflare.com/web-analytics/about/), [NZ Privacy Act principles](https://www.privacy.org.nz/privacy-principles/), [OPC complaints](https://www.privacy.org.nz/your-rights/making-a-complaint-to-the-privacy-commissioner/), [GitHub Pages IP logging](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection). Access/correction rights and a request for deletion will be distinguished; no unconditional statutory deletion right will be promised.

## Verification

- `cd source; npm run build`: PASS, 32 canonical pages. The existing build automatically copied `app.js`, `app.css`, `404.html`, `sitemap.xml` and all 32 generated `index.html` files to the repository root, including `privacy/index.html`. A byte comparison confirmed all 36 generated deployment files match `source/dist`; `source/public/sitemap.xml` also matches. Unchanged generated files therefore do not appear in the diff.
- `cd source; npm test`: 76 tests, 75 passed, 1 failed. The only failure is the explicitly allowed pre-existing `regional paging is bounded and expansion covers the reported omissions` in `party-venues.test.cjs`, caused by missing `out/research/party-venues-before-expansion.json`. Full log is in the screenshot directory as `test-results.txt`.
- `node --test tests/privacy.test.cjs tests/realpaths.test.cjs`: 5/5 PASS. The new test checks canonical path, route parsing, slashless and legacy privacy paths, unchanged navigation order, bilingual titles, generated title/canonical metadata and exactly one sitemap entry. Against the original route module from base HEAD, this test fails as expected (`'/' !== '/privacy/'`). Existing route test counts were updated from 31 to 32.
- Preview: `PORT=4186 node preview.cjs` from `source`, bound to `http://127.0.0.1:4186`. Browser plugin not available; used the brief's explicit `chromium.launch({channel:'msedge'})` workflow. Desktop 1440×1000 and mobile 390×844, day/night, Chinese/English: PASS for page identity, meaningful content, no framework overlay, no console errors, no horizontal overflow, language switching and metadata. Homepage footer link → privacy → back/forward and legacy tool/pet redirects: PASS. No third-party requests occurred on localhost privacy/home checks; no feedback was submitted.
- Visual inspection: frosted reading panel and existing licensed Daderot / CC0 garden background; headings sit on the existing dark scrim. Actual scrolled desktop/mobile captures confirm the photo continues through the 157px / 148px content-to-footer gap. Full-page Edge screenshots paint the fixed photo only in the initial viewport; this capture artifact is absent while scrolling. Supplemental transition screenshots show the actual continuous background.
- `node qa/visual-regression.mjs check`: the unmodified runner cannot launch because its configured Chromium headless-shell binary is absent. A temporary Edge adaptation captured all 120 baseline views outside the repository; its Python diff step also encountered missing Pillow. The same JPEG mean-difference calculation was then run with Playwright's bundled decoder. Stored baselines differ on all 120 views in this environment (including 24 intended footer captures); no baseline files were changed. A comparison with this worktree's original deployed bundles is recorded below to distinguish task regressions from the stored baseline/environment mismatch.
- Independent review: no outstanding findings. Compared 1,900 pre-existing route/query/hash cases against base HEAD with zero differences. The reviewer caught duplicate declarations introduced while extending the new test; these were removed, and the targeted and full suites were rerun with the results above.
- Original-bundle visual comparison: checked all 31 pre-existing canonical pages at 1440×1000 and 390×844 in day and night themes, 124 comparisons. All 124 are within the repository runner's existing mean RGB difference tolerance of 1.6; 111 are pixel-identical, maximum mean difference is 0.15811. There are no layout or content changes outside the intended footer link. Original `app.js` and `app.css` used for the comparison were byte-verified against base HEAD. The stricter exploratory comparison process exited 1 because ten captures exceeded its diagnostic threshold of 0.01, far below the repository's acceptance threshold; raw measurements and comparison pairs are retained in `base-comparison.json` and the screenshot directory. The 120 stored-baseline differences are therefore pre-existing/environment differences, not introduced by the privacy page.
- `git -c core.whitespace=cr-at-eol diff --check`: PASS, preserving existing mixed Windows line endings.

### Screenshots

Directory: `C:\Users\zifan\hl-shots-out\privacy\`.

Required full-page policy screenshots:

- `privacy-desktop-day.png` — 1440px, Chinese.
- `privacy-desktop-night.png` — 1440px, Chinese.
- `privacy-mobile-day.png` — 390px, Chinese.
- `privacy-mobile-night.png` — 390px, Chinese.

Required homepage footer screenshots (new link visible):

- `homepage-desktop-day-footer.png`.
- `homepage-mobile-night-footer.png`.

Supplemental full-page English screenshots: `privacy-desktop-day-en.png`, `privacy-desktop-night-en.png`, `privacy-mobile-day-en.png`, `privacy-mobile-night-en.png`.

Supplemental scrolling evidence: `review-desktop-transition.png`, `review-mobile-transition.png`.

Machine-readable UI checks: `verification.json`. Stored-baseline captures: `regression/{day,night}/{desktop,mobile}/*.jpg` (120 files); comparison: `baseline-comparison.json`. Original-bundle comparison: `base-comparison.json`; any nonidentical comparison pairs use `compare-before-*.png` / `compare-after-*.png`.

## Commit and changed files

Implementation commit: `c46ce32fe5057810cecd38e7014f5a0ac04e958d` (`feat: add bilingual privacy policy page and footer link`), on local branch `privacy-page`. This report is committed separately after the implementation so it can record the implementation's final hash. No push, merge or publication.

Changed files:

- `source/src/Privacy.tsx` — new bilingual policy component.
- `source/src/App.tsx` — privacy render branch, existing photo/credit reuse, footer link; navigation order unchanged.
- `source/src/site-routes.mjs` — real route and bilingual page metadata; existing build generates HTML and sitemap.
- `source/src/styles.css` — scoped policy panel/reading styles and footer-link styling.
- `source/tests/privacy.test.cjs` — new route/document/sitemap regression test.
- `source/tests/realpaths.test.cjs` — expected canonical page totals incremented.
- `privacy/index.html` — new generated static document.
- `app.js`, `app.css`, `sitemap.xml`, `source/public/sitemap.xml` — generated output.
- `RESULT-privacy.md` — service audit, implementation record and verification evidence.

Existing `brief-privacy.md` / `codex-privacy.log` are user inputs, left uncommitted. Dependencies installed locally with `npm ci --no-audit --no-fund` to enable the requested build; no package or lockfile change is committed. No new runtime services, assets or dependencies were added.

DONE
