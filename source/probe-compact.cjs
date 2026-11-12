const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto('http://127.0.0.1:4186/#/living?tab=places');
  const c = p.locator('#everyday-places [data-place-id]').first(); await c.waitFor();
  console.log(await c.evaluate(el => [...el.querySelector('.ia-place-body').children].map(k => k.tagName+'.'+k.className+' h='+Math.round(k.getBoundingClientRect().height)+' disp='+getComputedStyle(k).display).join('\n')));
  console.log(await c.evaluate(el => { const f=el.querySelector('.ia-place-photo'); return 'photo '+f.getBoundingClientRect().width+' card '+el.getBoundingClientRect().width; }));
  await b.close();
})();