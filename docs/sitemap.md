# Sitemap and section routing

GitHub Pages publishes static files from the root of `main`. The build emits six crawlable documents: the homepage and `/living/`, `/weekend/`, `/kids/`, `/services/`, `/tools/`. Each section has its own directory and `index.html`, title, description, H1, introduction, canonical and Open Graph URL. Query parameters select tabs and filters; their canonical points to the section URL without the query.

`source/src/section-html.ts` emits useful HTML from the existing supermarket, events, playground, service-category, pet and tool records. The homepage links to all five sections. React replaces this static summary with the existing interactive UI. No JavaScript is needed to read the initial section content or discover its links. Places, venues and playgrounds remain directory cards or map markers, not individual HTTP pages, so the sitemap does not list them.

## Routing and assets

`section-navigation.ts` initializes routes from the pathname and query. Internal links have real paths and ordinary link semantics, including opening in another tab. Unmodified same-origin section clicks use `history.pushState`; `popstate` restores views on Back and Forward. Keyboard tabs and search use the same navigation function. All app assets use root-relative URLs, or paths relative to the root stylesheet.

Legacy `/#/living`, `/#/kids?tab=parties`, `/#/tools?tab=pay` and older aliases are translated with `history.replaceState`, preserving query values. Pet, toolbox and `whatson` aliases still work. Ordinary document anchors are retained. Direct section requests return their own HTML with HTTP 200; no rewrite is required. Unknown URLs receive GitHub Pages' HTTP 404 and a generated `404.html` with `noindex, follow` and links back to the guide. The 404 document is excluded from the sitemap.

## Generation and publication

Run `npm ci` and `npm run build` in `source/`. `build.mjs` bundles the app, emits section HTML and `404.html`, then runs `scripts/generate-sitemap.mjs`. The generator discovers actual HTML in `dist/` and writes both `dist/sitemap.xml` and `public/sitemap.xml`. `npm run sitemap` regenerates the sitemap from an existing build.

Publish the complete `dist/` output to the repository root, including the five directories and `404.html`. Source-only edits do not deploy on this site. Keep the root-level `CNAME` and other repository files. Do not delete the root directory to publish. The checked-in published and public sitemaps must match the build output.

The sitemap excludes `404.html`, noindex documents, pages whose canonical points elsewhere, fragments, tab/filter states and records without their own HTML page. `lastmod` comes from Git content history, not build times or filesystem timestamps. All six generated pages use the most recent commit affecting `source/index.html`, `source/src/` or `source/public/`, excluding sitemap and robots-only changes. This conservative shared mapping can advance all six dates when shared content changes. Other future static pages use `public/<output path>` unless their generator adds another mapping. Builds require Git history and tracked content. Commit source changes first, then rebuild and commit the published output separately so `lastmod` records the content commit.

## Verification

- `npm test`: unit and build-output tests, including HTML metadata/content, sitemap discovery and dates, pathname parsing and legacy links. Known pre-existing failure: `regional paging is bounded and expansion covers the reported omissions` requires the missing `out/research/party-venues-before-expansion.json` fixture.
- `npm run preview`: serves the actual `dist/` directory on `http://127.0.0.1:4179`, including directory indexes, trailing-slash redirects and the custom 404 document.
- With preview running, `node scripts/verify-section-routes.cjs <screenshot-directory>` checks all six raw HTML responses with curl, checks metadata and assets, exercises legacy links, History API navigation, Back/Forward, keyboard tabs and reloads, and captures desktop day/night plus mobile screenshots. It uses Playwright with installed Chrome. Local build validation blocks external analytics/map services; it does not re-verify third-party availability.

## Google Search Console after merge

Wait for GitHub Pages deployment. Open each of the five new paths directly and confirm HTTP 200, section-specific HTML, and its matching canonical. Confirm `https://hamiltonlocal.nz/sitemap.xml` lists exactly six URLs with `lastmod`, and robots.txt still references it. Submit or resubmit that sitemap in the correct Search Console property. Use URL Inspection's live test for each new section, verify its canonical, then request indexing. Use the clean section URLs rather than fragment or query URLs. Monitor sitemap processing and page indexing; submission does not guarantee indexing.

This follow-up includes and supersedes PR #21's sitemap implementation; merge this PR instead of merging both independently.

References: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
