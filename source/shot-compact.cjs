const { chromium } = require('playwright');
const css = ".ia-place .ia-place-figure{position:relative;margin:0!important}.ia-place .ia-photo-credit{position:absolute!important;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);color:#ddd;opacity:0;transition:opacity .2s;pointer-events:none}.ia-place .ia-place-figure:hover .ia-photo-credit{opacity:1}.ia-place .ia-place-photo{max-height:none!important}.ia-place-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))!important;gap:16px!important;align-items:start!important}\n.ia-place{border-radius:16px!important;height:auto!important}\n.ia-place .ia-place-photo{aspect-ratio:16/9!important;height:auto!important;max-height:150px!important;overflow:hidden}\n.ia-place .ia-place-photo img{height:100%!important;width:100%!important;object-fit:cover!important}\n.ia-place .ia-photo-credit{font-size:10px!important;padding:2px 10px!important}\n.ia-place .ia-place-body{padding:12px 14px 12px!important;gap:6px!important}\n.ia-place .ia-place-body h3{font-size:17px!important;line-height:1.3!important;margin:2px 0!important}\n.ia-place .ia-secondary-name{font-size:12px!important;margin:0!important}\n.ia-place .ia-highlights{display:none!important}\n.ia-place .ia-place-body \u003e p:not([class]){font-size:13px!important;line-height:1.5!important;margin:4px 0!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.ia-place .sb-icon-line{font-size:12px!important;margin:2px 0!important;min-height:0!important}\n.ia-place .ia-kicker{font-size:11px!important}\n.ia-place .ia-place-footer{padding-top:8px!important;margin-top:6px!important}\n.ia-place .ia-place-footer a,.ia-place .ia-place-footer button{font-size:12px!important;padding:4px 10px!important;min-height:0!important}";
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const [name, extra] of [['after',css]]) {
    await p.goto('http://127.0.0.1:4186/?v=' + name + '#/living?tab=places');
    const c = p.locator('#everyday-places [data-place-id]').first(); await c.waitFor();
    if (await p.locator('html').getAttribute('lang') !== 'zh-CN') await p.getByTestId('lang').click();
    if (extra) await p.addStyleTag({ content: extra });
    await p.evaluate(() => Promise.all([...document.images].map(i => { i.loading='eager'; return i.decode().catch(()=>{}); })));
    await c.evaluate(el => el.scrollIntoView({ block: 'start' })); await p.mouse.wheel(0,-60); await p.waitForTimeout(500);
    console.log(name, JSON.stringify(await c.evaluate(el => el.getBoundingClientRect().height)));
    await p.screenshot({ path: 'C:/Users/zifan/AppData/Local/Temp/hl25b/compact-' + name + '.png' });
  }
  await b.close();
})();