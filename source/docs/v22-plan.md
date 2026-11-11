# Hamilton Local v22 implementation plan

Goal: extend the existing top-right pull cord in this preview copy, preserving locked content and dark styling.

Architecture: keep PullCord unchanged; extend usePageExperience and add a single dismissible result surface. Derive picks from existing JSON and share the directory category labels with App. Decorative layers ignore pointer events. Fixed result cards alone receive input. CSS handles motion, with fade-only reduced motion.

- [x] Snapshot v21 content and photos; add failing journey/data selection tests.
- [x] Verify seven Commons source captions, dimensions, author and free licence; inspect downloaded originals and window crops; add WebP assets and credits.
- [x] Add shuffle bags, dated family event filtering, directory selection and tool picks using existing content only.
- [x] Add snowflakes and ticket/book/toolbox result surfaces; test dismissal, focus, route cleanup and rapid pulls.
- [x] Build, run existing tests and updated regression QA; desktop/mobile all routes and subtabs; check all local resources.
- [x] Capture requested screenshots/WebM files, inspect frames, append Chinese v22 RESULT, leave loopback preview on 4183.

Review focus: shuffle boundary repeats; expired events; category hidden on another tab; keyboard focus after dismissal; route changes during effects. No push, publication, dependency upgrades or edits outside this v22 copy.

Ruling: execute in the user-specified work directory. The detailed user brief supplies the design and authorizes implementation without a further approval gate.

Completion evidence: ../../out/qa-v22.json (14 groups, 32 states, 60 assets, zero errors); ../../out/video-verification-v22.json (five videos fully decoded); ../../RESULT.md (Chinese v22 appendix). Independent reviewer findings fixed and rechecked.
