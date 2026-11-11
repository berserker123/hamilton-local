const {chromium}=require('playwright'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe'});try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});await p.goto('http://127.0.0.1:4182/#/living');await p.getByTestId('page-cord').waitFor();await p.waitForTimeout(900);
 for(let i=0;i<4;i++)await p.getByTestId('page-cord').click();await p.waitForTimeout(2200);await p.mouse.move(1,1);await p.screenshot({path:path.resolve(__dirname,'../out/shots/living-spring.png')});
 await p.setViewportSize({width:390,height:844});await p.reload();await p.getByTestId('page-cord').waitFor();await p.waitForTimeout(1100);await p.getByTestId('page-cord').click();await p.getByTestId('page-cord').click();await p.waitForTimeout(2200);await p.mouse.move(1,1);await p.screenshot({path:path.resolve(__dirname,'../out/shots/living-mobile.png')});
 console.log('Stable spring and mobile autumn evidence captured.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
