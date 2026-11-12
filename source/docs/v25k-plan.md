# v25k implementation plan

Specification: `../../PROMPT-v25k.txt`.

- [x] Add failing rendered-component tests for category-only cards and bundle isolation.
- [x] Archive the original pet JSON unchanged in `src/_hidden/pets-listings-v25.json`; keep only six category records in the active JSON.
- [x] Render six compact equal-size dark cards, with Chinese then English, paw icon, recruitment status and feedback buttons tagged `宠物指南-<category>` with business enquiry selected.
- [x] Audit footer credits and all bundled sources for pet merchant content. Preserve unrelated orchard records pending clarification about the shared place name Newstead.
- [x] Update superseded merchant expectations; build, run all unit tests and maintained QA suites plus dedicated v25k interaction checks.
- [x] Capture desktop (1280) and mobile (390) screenshots on port 4186, inspect images, write `../RESULT-v25k.md`.

Use the existing React components and feedback context. No publishing, pushing, new dependencies, or glow effects. This directory is a standalone project without Git metadata; work stays here.

Verification: build passed; 50 unit tests passed; all 16 behavioral QA suites passed. Literal Newstead grep remains an explicit exception (five unrelated orchard occurrences); all pet merchant details have zero hits.
