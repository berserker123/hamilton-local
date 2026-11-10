# v9 preview implementation plan

Goal: apply TASK.md and verified-newstore.json to the local React preview.
Architecture: retain existing data, hash routes, glass cards and OutLink allowlist. Use a dedicated map anchor on the new store only. Reuse the weekend teaser photo CSS for all five teasers.
Spec: ../TASK.md and ../verified-newstore.json (read completely as UTF-8).

Constraints: source edits inside work only; screenshots in ../out/shots; final ../RESULT.md. No git, publishing, network, dependencies, or edits to other sites.

- [ ] Adapt existing offline Chrome/CDP capture checks for v9, then confirm they reject the old preview.
- [ ] Update nav/breadcrumb to 首页; bilingual supermarket headings and teaser mentions; set both Green Patch zhName values to 绿盈超市.
- [ ] Add verified The Base record with supplied phone/hours/address/sources and a store-specific map anchor. Derive totals from records (6 total, 5 checked, 1 pending).
- [ ] Add existing market/gardens/urgent/tools photos to homepage teasers with the weekend gradient treatment. Preserve credits disclosure.
- [ ] Run work/build.cmd; run offline Chrome QA in ZH/EN, desktop/mobile and responsive widths. Capture required four screenshots and teaser closeup.
- [ ] Visually inspect screenshots, review scope and record evidence/limitations in ../RESULT.md.

Review focus: branch distinction and Borman uncertainty; exact map URL confined to the new card; all sources retained as text; long bilingual names/mobile wrapping; unchanged empty states and existing link allowlist.

Execution: native implementation in this session, using the user's supplied specification and preview-only authorization. No git-based workflow or added unit tests for copy/style changes; reuse the existing rendered integration checks.
