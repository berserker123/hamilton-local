const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const verification = JSON.parse(fs.readFileSync(path.join(root,'out/final-verification-v25.json'),'utf8'));
if (!verification.passed) throw new Error('Final verification is not complete');
const sections = ['stays','pets','upick','featured'].map(name => fs.readFileSync(path.join(root,'out/research-' + name + '-v25.md'),'utf8').trim());
const intro = `# v25

- Tidied card footers: small photo credits, aligned actions, separate correction links; details links on every outing card.
- Added Local Living tabs for eight stays and 22 pet listings, plus nine seasonal U-Pick farms under Everyday outings. Homepage links and section anchors work. No scores or new photos displayed.
- Added five featured playgrounds with gold stars, badges and a combined filter. Unknown-facility update forms remain intact; mobile popups scroll within the map.
- Preserved all original source records. Requested Magical Bridge removal leaves nine Everyday outings cards and six Family outings cards; its playground record remains. All other original cards remain.
- Preserved navigation order, bilingual place names, dark theme, hero window, cord effects, five quick tags, supermarket order/street views, regional events and Web3Forms key. No publication or push.
- Rename Pets through \`PETS_NAME\` in \`work/src/LocalDirectories.tsx\`.

`;
const tests = `

### Verification

Build and 22 unit tests pass. All seven browser suites pass: qa-existing-v23, qa-home-v23, qa-cord-status, qa-v23b, qa-v24b, qa-v24c and qa-v25. Zero console errors, page errors or HTTP/404 errors. Evidence: \`out/final-verification-v25.json\`.

Preview: http://127.0.0.1:4186. Local Playwright/Chromium, as requested. Chinese/English at 1440/390/320; historical suites also cover reduced motion, keyboard/touch, 844×300 landscape, protected assets and intercepted feedback submissions. No real feedback sent.

QA baselines were restored unchanged from v24. Version-specific updates: port 4186; Family outings count 7→6; v24c protects the unchanged Home/App implementation instead of the intentionally extended whole App file. Raw logs and JSON reports: \`out/\`.

Seven reviewed screenshots: \`out/shots/v25-{places-cards,kids-places,stays,pets,upick,playground-map,mobile}.png\`.
`;
fs.writeFileSync(path.join(root,'RESULT.md'), intro + sections.join('\n\n') + tests);
