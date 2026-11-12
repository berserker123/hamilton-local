const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:4186/');
  if (await p.locator('html').getAttribute('lang') !== 'zh-CN') await p.getByTestId('lang').click();
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => { const r = s => { const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height),r:Math.round(b.right),btm:Math.round(b.bottom),text:e.textContent}; }; return { label:r('.v22-scene-label'), hero:r('.sb-hero'), loc:r('.sb-hero-location'), weather:r('.sb-hero-weather') }; });
  console.log(JSON.stringify(info));
  await p.screenshot({ path: 'C:/Users/zifan/AppData/Local/Temp/hl25b/hero-label.png' });
  await b.close();
})();
