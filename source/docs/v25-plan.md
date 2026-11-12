# v25 implementation

Scope: PROMPT.txt A–F. Extend the supplied v24c React/TypeScript site locally; no publication or push.

- [x] Separate card photo credits, bottom-aligned actions and secondary correction link. Add details from existing official URLs. Exclude Magical Bridge outside playgrounds; remove repeated place IDs.
- [x] Add Local Living Stays and Pets tabs, anchors and homepage sub-item links. Keep existing section order, preview records, theme, feedback and effects. One Pets name constant.
- [x] Add a separate U-Pick group to Everyday outings. Preserve original source records. Seasons require official evidence; otherwise `待确认`. No new images.
- [x] Add five verified featured playgrounds, star markers, badges and a filter that composes with existing filters. Preserve unknown-field feedback.
- [x] Restore genuine historical QA baselines from v24. Adapt only version-specific App hash and preview port. Add v25 interaction/layout/data QA, run build, unit tests and all seven requested suites.
- [x] Inspect seven screenshots and write a short RESULT.md with source audit tables, naming options, featured reasons and test evidence.

Architecture: data-only research files feed a small LocalDirectories component. Existing PlaceGrid and PlaygroundMap receive targeted changes. Existing records and protected configuration remain byte-identical.

Checks: Chinese/English at 1440/390/320; aligned row footers; every details link; no duplicate Magical Bridge cards; navigable new tabs/anchors; feature filter/reset/popups; no scores in stay cards; zero console/page/HTTP errors.

Ruling: user supplied detailed implementation authorization; proceed without a new approval gate. Research delegated as explicitly encouraged by web-access skill. Personal-browser setup is unnecessary because user specified local Playwright.

Review: independent review found only unknown-label wording; corrected to PROMPT.txt labels. All requested suites pass.
