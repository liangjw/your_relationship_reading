import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const b=await chromium.launch({headless:true,channel:'msedge'});
try {
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage();
 await p.goto('http://localhost:4173/');await p.locator('[data-gender="male"]').click();
 await p.locator('[data-choice]').first().click();await p.waitForTimeout(550);
 assert.equal(await p.locator('.round-number b').textContent(),'02');
 await p.locator('[data-choice]').first().dispatchEvent('click',{detail:2,bubbles:true});await p.waitForTimeout(500);
 assert.equal(await p.locator('.round-number b').textContent(),'02');
 await p.locator('[data-choice]').first().click();await p.waitForTimeout(550);
 assert.equal(await p.locator('.round-number b').textContent(),'03');
 assert.equal(await p.locator('.reveal-panel,.inner-thought,.scene-context,[data-action="next"]').count(),0);
 console.log('Final click review PASS: double-click tail ignored after guard; normal single click advances; no intermediate explanation.');
 await c.close();
} finally {await b.close();}
