# Task v2: make everything BELOW the hero match the hero (Hamilton Local v6 cinematic)
Owner feedback: "根据首屏向下设计详情页面，你给我看的整体页面不协调". The hero is good — DO NOT change the hero (header/nav/hero section) except minor shared tokens. Everything below currently looks like a generic site: dense white card grids, saturated red/yellow/green bin chips, small text, cramped spacing (see refs/v1-desktop-full.png). Redesign every section below the hero, plus the credits modal, weather popup and any detail views, so the page is one continuous cinematic scroll.
Rules: edit src/App.tsx, src/styles.css, tailwind.config.js only. Keep ALL content, data, links, both languages (zh/en) and functionality (tabs, search, filters, modals, data-testid attributes) unchanged. No new npm packages, no builds, no git. JSX must stay valid; every class you use must be defined (Tailwind utilities or styles.css).

## Visual language (sampled from hero photo)
- Palette tokens: dusk gold #C8A46A / #E6CFA0, moss green #4E6B4A / #2F4A3A, mist grey #E7E6E1 / #CFCFC8, deep warm charcoal #1E1D1A / #2A2824, light ink on dark rgba(255,255,255,.86).
- Typography: section titles big Noto Serif SC (clamp 2.25rem–4rem, weight 600/900) mixed with a light Noto Sans SC 300 line, like the hero. Eyebrow small uppercase tracking-[0.3em]. Body text 16–17px, line-height 1.8. Never tiny 12px text for important info.
- Surfaces: frosted glass (dark bands: bg-white/8–12, backdrop-blur-xl, border white/15; light bands: bg-white/45–55, backdrop-blur, border black/6). Radius 28px for panels, rounded-full for pills/tags/buttons, exactly like the hero pills. No hard white boxes, no hard shadows; soft shadows only.
- Tags/chips: glass pills only. Bin colours (red/yellow/green/blue etc.) become a small muted dot (8px) or a very soft tint — never saturated blocks. Status/badges likewise muted.
- Generous whitespace: section padding ~ py-28 to py-40 desktop, py-20 mobile. Max width ~1200px.

## Section rhythm (alternate dark image bands and light misty bands, joined by soft gradients – no hard edges)
Available images in public/photos (use path ./photos/NAME): hero-train.webp, hero-dusk.webp, band-tools.webp (misty golden suburban street), band-market.webp (warm produce baskets), band-urgent.webp (misty blue river city at dusk), plus existing place photos.
1. 实用工具箱 (tools: bins / transport / urgent tabs): DARK band, full-width background band-tools.webp with dark charcoal overlay gradient; big serif title; the tabs as glass pill segmented control; content on one large frosted-glass panel; bin schedule shown as calm rows with muted dots.
2. The existing river/photo feature: integrate as cinematic interlude or merge.
3. 亚超指南 (supermarkets): LIGHT misty band (mist grey → warm off-white gradient) with a full-width image header strip/band using band-market.webp (fades into the mist). Fewer, larger cards: 2 columns desktop, generous padding, glass-light style, hairline borders, glass pill tags, actions as ghost pills.
4. Dusk interlude band (hero-dusk.webp) – keep, refine.
5. 周末遛娃 (weekend places): DARK band (charcoal with subtle moss/gold aurora glow). Larger image-led cards (2 columns desktop, 1 mobile): photo fills top with rounded 28px, gradient overlay, title in serif over the photo or below in light text; glass filter pills.
6. 急诊/就医 info (wherever it lives – urgent tab or section): give it band-urgent.webp atmosphere, calm and reassuring, important numbers big and readable.
7. Footer: dark charcoal with faint image or gradient continuation, glass pill links, matches nav.
Between bands use 120–200px soft gradients so dark→light transitions feel like mist, not a cut.

## Motion
Same as hero: BlurText for each section title (reuse existing component), Reveal staggered entrance for panels/cards, slow parallax on band images. Respect prefers-reduced-motion.

## Popups / detail views
Credits modal, weather popup, any detail/expanded card: frosted dark glass (bg-[#1E1D1A]/70 backdrop-blur-2xl, border white/15, radius 28px), serif title, glass pill close button, readable text. Backdrop: blurred dark scrim.

## Responsive
Mobile 390px: single column, no horizontal overflow, text ≥15px, panels with px-5, bands still image-backed.
When done, run your own static check (classes defined, JSX balanced) and summarize per section.
