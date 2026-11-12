# v24b place labels

Use one dictionary and formatter for known town, suburb and region names. Apply at the shared translator and raw display fields, including map popups and filters. Keep data, filter values, routes, section order and locked features unchanged. Existing English labels remain English; unknown Chinese names remain unchanged.

- [x] Add regression tests for labels, existing bilingual text and English mode; confirm failure.
- [x] Implement formatter, cover raw fields, remove duplicate region subtitles and allow narrow layouts to wrap.
- [x] Build; run npm test and the four v24 QA commands. Check desktop/mobile labels, filters, console and HTTP responses; save requested screenshots.
- [x] Verify retained records/assets and write short RESULT-v24b.md. No publish or push.

Verification: 22 unit tests, all four historical QA commands and qa-v24b passed. Bilingual sweep covers 13 routes at 1440/390/320px. Zero console/page/HTTP errors. Eight existing display files changed; 83 other baseline files retained. Review found no important issues. An intermittent historical focus assertion passed unchanged, followed by a complete successful historical run.
