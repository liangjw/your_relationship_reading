import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {questionsFor} from '../backend/content/bank.mjs';
if (process.argv.includes('--personalities')) { await import('./qa-v2-personalities.mjs'); process.exit(0); }
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.GAME_URL||'http://localhost:4174';
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],runs=[];
fs.mkdirSync('artifacts/v2-review',{recursive:true});
try{for(const width of [320,375,390,430])for(const gender of ['male','female']){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>!document.querySelector('#app[aria-busy="true"]')&&document.querySelector('[data-action]'));
 await page.goto(base);await ready();await page.locator('.intro-comic img').evaluate(i=>i.decode());if(width===390&&gender==='male')await page.screenshot({path:'artifacts/v2-review/entry.png',fullPage:true});
 assert.equal(await page.locator('[data-gender]').count(),2);await page.locator(`[data-gender="${gender}"]`).click();await ready();const qs=questionsFor(gender);
 for(let i=0;i<20;i++){
  await page.waitForTimeout(520);
  const q=qs[i],pick=q.benchmark.optionDistances.indexOf(Math.min(...q.benchmark.optionDistances));assert.equal(await page.locator('.round-number b').textContent(),String(i+1).padStart(2,'0'));assert.equal(await page.locator('.choice').count(),4);assert.equal(await page.locator('.scene-review,.metric,.personality-card').count(),0);assert((await page.locator('.scene-context').textContent()).includes(q.context));assert((await page.locator(`[data-question-id="${q.id}"]`).count())===4);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(i===0){const order=await page.locator('.choice').evaluateAll(nodes=>nodes.map(n=>n.dataset.pick));await page.reload();await ready();assert.deepEqual(await page.locator('.choice').evaluateAll(nodes=>nodes.map(n=>n.dataset.pick)),order);}
  if(i===1){await page.locator('[data-action="back"]').click();await ready();assert.equal(await page.locator('.previous-label').count(),1);await page.waitForTimeout(520);await page.locator(`[data-pick="${qs[0].benchmark.optionDistances.indexOf(Math.min(...qs[0].benchmark.optionDistances))}"]`).click();await ready();assert.equal(await page.locator('.round-number b').textContent(),'02');await page.waitForTimeout(520);}
  if(width===390&&i===0&&gender==='male'){await page.locator('.manga-board').evaluate(i=>i.decode());await page.screenshot({path:'artifacts/v2-review/scene.png',fullPage:true});}
  if(i===2){await page.locator(`[data-pick="${pick}"]`).evaluate(b=>{b.click();b.click();});}else await page.locator(`[data-pick="${pick}"]`).click();await ready();
 }
 await page.locator('.personality-card').waitFor();assert.equal(await page.locator('.metric').count(),6);assert.equal(await page.locator('.scene-review').count(),20);assert.equal(await page.locator('.personality-card').getAttribute('data-type'),'type-12');assert(!/超过\d+%/.test(await page.locator('#app').textContent()));
 const before=await page.locator('.score-line b').innerText();await page.locator('[data-action="back"]').click();await ready();assert.equal(await page.locator('.round-number b').textContent(),'20');await page.waitForTimeout(520);
 if(gender==='female'){await page.locator('[data-action="back"]').click();await ready();await page.waitForTimeout(520);const previous=qs[18],worst=previous.benchmark.optionDistances.indexOf(Math.max(...previous.benchmark.optionDistances));await page.locator(`[data-pick="${worst}"]`).click();await ready();await page.waitForTimeout(520);}
 const last=qs[19],worst=last.benchmark.optionDistances.indexOf(Math.max(...last.benchmark.optionDistances));await page.locator(`[data-pick="${worst}"]`).click();await ready();const after=await page.locator('.score-line b').innerText();assert.notEqual(before,after);
 await page.reload();await ready();assert.equal(await page.locator('.score-line b').innerText(),after);await page.locator('[data-ui="poster"]').click();await page.locator('#poster-dialog').waitFor({state:'visible'});await page.locator('#poster-image').evaluate(i=>i.decode());assert.equal(await page.locator('#poster-image').evaluate(i=>[i.naturalWidth,i.naturalHeight].join('x')),'750x1360');
 if(width===390&&gender==='male'){await page.screenshot({path:'artifacts/v2-review/poster-dialog.png',fullPage:true});const data=await page.locator('#poster-image').evaluate(i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/png').split(',')[1];});fs.writeFileSync('artifacts/v2-review/poster.png',Buffer.from(data,'base64'));await page.locator('#close-poster').click();await page.screenshot({path:'artifacts/v2-review/report.png',fullPage:true});}
 if(await page.locator('#poster-dialog').isVisible())await page.locator('#close-poster').click();
 const fresh=await browser.newContext(),friend=await fresh.newPage();await friend.goto(base+'/?from=report');await friend.locator('[data-gender]').first().waitFor();assert.equal(await friend.locator('.personality-card').count(),0);await fresh.close();
 await page.locator('#sound').click();await page.waitForFunction(()=>Number.isFinite(document.querySelector('#bgm').duration)&&document.querySelector('#bgm').readyState>=2);const audioState=await page.locator('#bgm').evaluate(a=>({duration:a.duration,paused:a.paused,src:a.src}));assert(audioState.duration>=15&&audioState.duration<=30,JSON.stringify(audioState));await page.locator('#sound').click();await page.waitForFunction(()=>document.querySelector('#bgm').paused);
 runs.push({width,gender,scenes:20,reload:true,back:true,doubleTap:true,reportEdit:true,png:true,friend:true,audio:true});await context.close();console.log('PASS',width,gender);
}assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/v2-review/browser.json',JSON.stringify({passed:true,url:base,runs,errors,verifiedAt:new Date().toISOString()},null,2));}finally{await browser.close();}
