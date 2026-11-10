# Task: redesign Hamilton Local (汉密尔顿生活指南) as "v6 cinematic"
You are editing a React + Tailwind single-page site. Files: src/App.tsx (all UI), src/styles.css, src/Logo.tsx, tailwind.config.js, index.html, src/places.json (data – do not change).
DO NOT run npm install or any build; do NOT use git. The build runs elsewhere (esbuild + tailwindcss v3, only deps: react, react-dom, lucide-react). Do NOT add new npm packages (no framer-motion/gsap) – implement motion in plain CSS + small React hooks (IntersectionObserver).
Keep ALL existing content, data, features, Chinese/English copy, language toggle, links and sources exactly. Only change visual design/layout/motion.

## Visual references (look at them): refs/ref-railroad.png, refs/ref-velorah.png
1. Railroad.ai: full-bleed photo through a train window; centred huge sans headline mixing weights (light + bold); small pill badge above headline; email-style pill input with button; glassmorphism nav pills (bg-white/10, backdrop-blur, white/20 border); white solid "Get Started" pill top-right.
2. Velorah: full-bleed dreamy painted illustration, big centred SERIF headline, minimal nav, ghost (outlined) CTA.

## Hero (most important)
- 100svh full-screen section, background image public/photos/hero-train.webp (path in built site: ./photos/hero-train.webp), object-cover, slight slow Ken-Burns scale (1.06 -> 1, 20s) and subtle parallax on scroll.
- Dark-to-transparent top gradient for nav legibility, and a bottom gradient fading smoothly into the page background colour (soft warm off-white #F6F3EE) so the hero melts into content.
- Top nav: logo + "Hamilton Local" left; centre a glass pill group with section links (垃圾回收 / 亚超 / 周末去处 / 就医 etc. – use the existing sections); right: language toggle as glass pill + white solid pill CTA.
- Centre: pill badge (e.g. "✦ 汉密尔顿 · 怀卡托 · 新西兰"), headline mixing Noto Serif SC (heavy) and Noto Sans SC light, e.g. line1 light sans "在汉密尔顿，" line2 serif bold "生活可以很从容". Use existing slogan copy if present. Subtitle in white/80. Then the existing search box restyled as a Railroad-style pill input (glass, rounded-full, white button inside) – keep its functionality. Below a ghost CTA (Velorah style) "开始探索 ↓".
- Headline entrance: React-Bits-style "BlurText" – split into characters, each animates from blur(10px) opacity 0 translateY(12px) to clear, staggered 40ms. Implement as a small <BlurText> component. Respect prefers-reduced-motion.
- Weather widget (existing) should sit as a small glass chip bottom-left of hero, NOT overlapping the headline.

## Below the hero
- Calm, premium, airy: bg #F6F3EE, ink #1F2A24, accent a deep Waikato green (#2F5D50) and warm gold (#C8A46A). Remove scrapbook stuff (tape, rotated polaroids, hard offset shadows, handwritten Long Cang font). Update tailwind.config.js palettes (teal/emerald scales are used throughout – remap them to green/gold tones), radii larger (lg 12px, xl 16px, 2xl 24px), soft shadows (0 10px 30px -12px rgba(0,0,0,.15)).
- Section headings: small uppercase letter-spaced eyebrow + Noto Serif SC heading.
- Cards: white/70 with backdrop-blur, hairline border black/5, rounded-2xl, hover lift.
- Scroll motion: a <Reveal> wrapper (IntersectionObserver) fading/rising sections in (opacity 0, translateY 24px -> 0, 700ms ease-out), stagger children. Reduced-motion safe.
- One mid-page cinematic band using public/photos/hero-dusk.webp (painted girl reading above clouds at dusk) full-width ~60vh with a centred serif quote/CTA (Velorah style) – e.g. before the weekend places section or before footer. Use existing copy where possible.
- Optional React-Bits-style subtle effect: a "ShinyText" sheen on the badge, or a soft animated gradient "Aurora" glow behind a section. Keep tasteful, max 3 effects total.
- Fonts: index.html Google Fonts load Noto Sans SC 300;400;500;700 and Noto Serif SC 600;900 (drop Long Cang). font-serif family in tailwind: "Noto Serif SC", serif.
- Fully responsive: on mobile, hide centre nav pills (use a compact glass menu button or horizontal scroll pills), headline ~ text-4xl, nothing overflows horizontally, hero text not covered by weather chip.
- Line-breaking for CJK: use `word-break: keep-all` / manual <br> so headlines don't orphan single characters.

## Inspiration notes
- motionsites.ai prompt style: role "award-winning designer", serif headline + clean sans body, generous spacing, staggered entrance animations, spring-like easing cubic-bezier(.22,1,.36,1).
- variant.com: avoid generic "AI slop" (no purple gradients); editorial whitespace, coherent palette.
- React Bits (reactbits.dev): BlurText, ShinyText, Aurora/soft background – reimplement lightweight versions yourself.
- design prompts: cinematic, atmospheric, glassmorphism, single strong focal hero.

When done, briefly list what you changed. Make sure TypeScript/JSX is syntactically valid (no unused imports that would break; esbuild is lenient about types).
