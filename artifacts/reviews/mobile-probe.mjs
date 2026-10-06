import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
try {for(const width of [320,360,390,430])for(const gender of ['male','female']){
 const ctx=await browser.newContext({viewport:{width,height:740},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4173');
 const entry=await page.locator('[data-gender]').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,y:e.getBoundingClientRect().top})));
 await page.locator(`[data-gender="${gender}"]`).click();let maxScroll=0,maxHeight=0,minTap=Infinity;
 for(let i=0;i<30;i++){
  assert.equal(await page.locator('[data-choice]').count(),4);assert.equal(await page.evaluate(()=>scrollY),0,'scene resets to top');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const sizes=await page.locator('[data-choice]').evaluateAll(es=>es.map(e=>({h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width})));minTap=Math.min(minTap,...sizes.map(x=>x.h));maxHeight=Math.max(maxHeight,await page.evaluate(()=>document.documentElement.scrollHeight));
  await page.locator('[data-choice]').nth(3).click();assert.equal(await page.locator('[data-choice]').count(),0);
  const next=await page.locator('[data-action="next"]').boundingBox();assert.ok(next.y>=0&&next.y+next.height<=740,`next visibility ${width} ${gender} q${i+1}: ${JSON.stringify(next)}`);maxScroll=Math.max(maxScroll,await page.evaluate(()=>scrollY));
  if(i===4){await page.reload();assert.equal(await page.locator('[data-action="next"]').count(),1);}await page.locator('[data-action="next"]').click();
 }
 assert.equal(await page.locator('.personality-card').count(),1);await page.locator('[data-action="share"]').click();await page.locator('.modal').waitFor();assert.equal(await page.locator('.modal').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const closeSize=await page.locator('[data-action="close"]').boundingBox();assert.ok(closeSize.width>=44&&closeSize.height>=44);
 await page.locator('[data-action="copy"]').click();await page.locator('[data-action="close"]').click();assert.equal(await page.locator('.modal').count(),0);
 await page.evaluate(()=>localStorage.setItem('heart-decoder-solo-v4','{broken'));await page.reload();assert.equal(await page.locator('[data-gender]').count(),2);
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForTimeout(700);await ctx.setOffline(true);await page.reload();assert.equal(await page.locator('[data-gender]').count(),2);await page.locator(`[data-gender="${gender}"]`).click();assert.equal(await page.locator('[data-choice]').count(),4);await page.locator('[data-choice]').nth(0).click();await page.locator('[data-action="next"]').click();assert.equal(await page.locator('[data-choice]').count(),4);await ctx.setOffline(false);
 results.push({width,gender,minTap,closeTarget:closeSize.width,maxQuestionHeight:maxHeight,maxRevealScroll:maxScroll,offline:true,entry,errors});await ctx.close();
 }console.log(JSON.stringify(results,null,2));fs.writeFileSync('artifacts/reviews/mobile-probe.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
