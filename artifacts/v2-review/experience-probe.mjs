import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({headless:true,channel:'msedge'});
const results=[];
try {
 for(const delay of [150,250,350,500]) {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  const ready=()=>page.waitForFunction(()=>!document.querySelector('#app[aria-busy="true"]')&&document.querySelector('[data-action]'));
  await page.goto('http://localhost:4174');await ready();
  await page.locator('[data-gender="male"]').click();await ready();
  await page.locator('.choice').first().dblclick({delay});
  await page.waitForTimeout(700);await ready();
  const index=await page.locator('.round-number b').textContent();
  const r={delay,index,expected:'02',passed:index==='02'};results.push(r);console.log(JSON.stringify(r));
  if(!r.passed)await page.screenshot({path:`artifacts/v2-review/double-click-${delay}.png`,fullPage:true});
  await context.close();
 }
 fs.writeFileSync('artifacts/v2-review/experience-probe.json',JSON.stringify({results,verifiedAt:new Date().toISOString()},null,2));
} finally {await browser.close();}
