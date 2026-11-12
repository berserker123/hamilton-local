const { chromium } = require('playwright');
const glow = `.ia-place{position:relative;isolation:auto;overflow:visible!important}
.ia-place::before{content:"";position:absolute;inset:8%;z-index:-1;border-radius:24px;background:radial-gradient(circle at 50% 45%, #c9a55a 0%, #8a6a2c 55%, transparent 80%);filter:blur(60px);opacity:.3;pointer-events:none}
.ia-place-grid{position:relative;z-index:0;overflow:visible!important}`;
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const [name, extra] of [['before',''],['glow',glow]]) {
    await p.goto('http://127.0.0.1:4186/?v=' + name + '#/living?tab=places');
    const c = p.locator('#everyday-places [data-place-id]').first(); await c.waitFor();
    if (await p.locator('html').getAttribute('lang') !== 'zh-CN') await p.getByTestId('lang').click();
    if (extra) await p.addStyleTag({ content: extra });
    await p.evaluate(() => Promise.all([...document.images].map(i => { i.loading='eager'; return i.decode().catch(()=>{}); })));
    await c.evaluate(el => el.scrollIntoView({ block: 'start' })); await p.mouse.wheel(0,-80); await p.waitForTimeout(600);
    await p.screenshot({ path: 'C:/Users/zifan/AppData/Local/Temp/hl25b/glow-' + name + '.png' });
  }
  await b.close();
})();
