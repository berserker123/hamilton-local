# v22b feedback plan

Add an isolated feedback provider, native modal dialog, fixed launcher and footer card. Reuse the current language and dark palette. Add correction links to place cards and each section, capturing its label and current URL. Preserve existing data, photos, modules and controls; only integrate through App.tsx and append scoped CSS.

1. Write and run failing tests for validation, payload, honeypot, preview mailto and submission failures.
2. Add feedback-config.ts (one PENDING key), feedback-model.ts and Feedback.tsx. Add accessible focus management, all dismissal paths, responsive collision avoidance and reduced motion.
3. Build and run unit tests. Playwright desktop/mobile: routes, language, validation, keyboard, preview email, mocked API success/error/retry, collisions, and resources. Preserve the production PENDING config; inject a test-only config into an intercepted QA bundle for network tests.
4. Compare original source/public hashes, run existing v22 regression QA, capture four requested screenshots, append Chinese RESULT notes, restart loopback preview on 4183 and leave running. No push or deployment.
