# Sitemap and routing

The site publishes static files from the root of `main` through GitHub Pages. React renders the guide in `index.html`; `source/src/App.tsx` reads `location.hash` and listens for `hashchange`. Sections use fragments such as `/#/living`, `/#/kids?tab=parties` and `/#/tools?tab=pay`. Places, venues and playgrounds are directory cards or map markers, not independent HTML pages. There is no separate article route or article generator.

Consequently, the complete sitemap currently has **one crawlable URL**, `https://hamiltonlocal.nz/`. Adding fragment URLs or invented `/living/` and `/places/<id>/` paths would not make those views independently indexable. The HTML canonical also points to the homepage. This change does not claim to solve the routing limitation.

## Generation and publication

Run `npm ci` and `npm run build` in `source/`. The build calls `scripts/generate-sitemap.mjs`, discovers actual HTML documents in `dist/`, and writes `dist/sitemap.xml` and `public/sitemap.xml`. `npm run sitemap` regenerates the sitemap from an existing build. Publish the complete `dist/` output to the repository root as usual, including `sitemap.xml`; source-only edits do not deploy on this site.

The generator excludes `404.html`, noindex documents and pages whose canonical points elsewhere. It never lists hash routes, search/filter states, external links or individual records without a real page. If the build later emits additional HTML pages, they are discovered automatically; their source is expected at `public/<output path>`. Add a source mapping if a future page generator uses another location.

`lastmod` comes from the most recent Git commit affecting page content. For the homepage, content includes `source/index.html`, `source/src/` (including imported JSON data), and deployed public assets. Sitemap and robots-only changes are excluded. Other static pages use their corresponding public HTML source. Build times and filesystem modification times are not used. Builds need Git history and tracked content; after committing content changes, rebuild before publishing. The checked-in public and published sitemaps must match the build output.

## Minimal follow-up for independent indexing

Keep the existing React UI and data. First emit static or prerendered HTML for the five section paths (`/living/`, `/weekend/`, `/kids/`, `/services/`, `/tools/`), including useful page content, distinct titles/descriptions and self-referencing canonicals. Put an `index.html` in each directory so GitHub Pages serves direct requests without a catch-all rewrite. Use root-relative asset URLs, update internal links and initialize the app from the pathname. Preserve old hash links as client-side redirects to the corresponding real paths. Add detail pages from the existing data only where a dedicated page is useful. Extend the sitemap source/date mapping alongside that generator. This is a separate routing change, not part of this PR.

## Google Search Console

After this PR is merged and GitHub Pages has deployed, verify the live sitemap contains `lastmod` and submit or resubmit `https://hamiltonlocal.nz/sitemap.xml` in the correct Search Console property. Inspect the homepage and request indexing if needed. No Search Console action can make hash views separate indexable pages. After real section/detail pages are published, submit the expanded sitemap and inspect representative direct URLs.

References: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
