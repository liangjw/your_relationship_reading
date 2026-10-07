import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {questionsFor} from '../backend/content/bank.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.GAME_URL||'http://localhost:4175';
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9)||'artifacts/v2-review/effects';
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],runs=[];
fs.mkdirSync(output,{recursive:true});
try{for(const gender of process.argv.includes('--female-only')?['female']:['male','female']){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.played=[];window.playedElements=[];window.mediaErrors=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.played.push(this.src);window.playedElements.push(this);const src=this.src;return play.call(this).catch(e=>{window.mediaErrors.push({src,name:e.name});throw e;});};});
 const ready=()=>page.waitForFunction(()=>!document.querySelector('#app[aria-busy="true"]')&&document.querySelector('[data-action]'));
 await page.goto(base);await ready();assert.equal(await page.locator('#bgm').evaluate(a=>a.paused),true);
 if(gender==='female')await page.locator('#sound').click();
 await page.locator(`[data-gender="${gender}"]`).click();await ready();
 const qs=questionsFor(gender),images=[];
 for(let i=0;i<20;i++){
  const q=qs[i];await page.locator(`.story-panel[data-scene="${q.id}"]`).waitFor();await page.locator('.manga-board').evaluate(i=>i.decode());
  images.push(await page.locator('.manga-board').getAttribute('src'));assert.equal(images.at(-1),`/assets/scenes/${q.id}.webp`);
  assert.equal(await page.locator('.observation-radar,.personality-card').count(),0);
  await page.waitForTimeout(540);
  if(i===1){await page.locator('[data-action="back"]').click();await ready();assert.equal(await page.locator('.manga-board').getAttribute('src'),images[0]);assert.equal(await page.locator('.previous-label').count(),1);await page.waitForTimeout(540);await page.locator(`[data-pick="${qs[0].benchmark.optionDistances.indexOf(Math.min(...qs[0].benchmark.optionDistances))}"]`).click();await ready();await page.waitForTimeout(540);}
  if([0,7,12,16].includes(i))await page.screenshot({path:`${output}/${q.id}.png`,fullPage:true});
  const pick=q.benchmark.optionDistances.indexOf(Math.min(...q.benchmark.optionDistances));await page.locator(`[data-pick="${pick}"]`).click();await ready();
 }
 assert.equal(new Set(images).size,20);
 await page.locator('.summon-dialog[open]').waitFor();assert.equal(await page.locator('.summon-spark').count(),12);
 const card=page.locator('.summon-card');assert.equal(await card.evaluate(n=>getComputedStyle(n).animationName),'summon-spin');assert.equal(await card.evaluate(n=>parseFloat(getComputedStyle(n).animationDuration)),4.8);
 const first=await card.evaluate(n=>getComputedStyle(n).transform);await page.waitForTimeout(450);assert.notEqual(await card.evaluate(n=>getComputedStyle(n).transform),first);
 if(gender==='male'){await page.waitForTimeout(3700);await page.screenshot({path:output+'/reveal.png'});await page.locator('.summon-dialog').waitFor({state:'detached',timeout:6500});}
 else {await page.locator('.summon-skip').click();await page.locator('.summon-dialog').waitFor({state:'detached'});}
 assert.equal(await page.locator('.observation-radar .radar-point').count(),6);assert.equal(await page.locator('.observation-radar .radar-shape').count(),1);
 await page.locator('.observation-radar').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/radar-${gender}.png`});
 for(const width of [320,390,430]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 const played=await page.evaluate(()=>window.played);
 if(gender==='male')assert.equal(played.length,0);else for(const name of ['select','turn','reveal'])assert(played.some(src=>src.endsWith('/audio/'+name+'.wav')),name+' sound missing: '+JSON.stringify({played,errors:await page.evaluate(()=>window.mediaErrors)}));
 if(gender==='female'){await page.locator('#sound').click();assert(await page.evaluate(()=>window.playedElements.every(a=>a.paused)));}
 await page.reload();await ready();assert.equal(await page.locator('.summon-dialog').count(),0);
 await page.locator('[data-ui="poster"]').click();await page.locator('#poster-image').waitFor({state:'visible'});await page.locator('#poster-image').evaluate(i=>i.decode());
 const data=await page.locator('#poster-image').evaluate(i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/png').split(',')[1];});fs.writeFileSync(`${output}/poster-${gender}.png`,Buffer.from(data,'base64'));await page.locator('#close-poster').click();
 await page.setViewportSize({width:320,height:568});await page.locator('[data-action="back"]').click();await ready();await page.waitForTimeout(550);await page.locator('.choice').first().click();await ready();await page.locator('.summon-dialog[open]').waitFor();await page.waitForTimeout(4100);const bounds=await page.locator('.summon-skip').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=568);await page.screenshot({path:`${output}/reveal-320-${gender}.png`});await page.locator('.summon-skip').click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-action="back"]').click();await ready();await page.waitForTimeout(550);await page.locator('.choice').first().click();await ready();assert.equal(await page.locator('.summon-dialog').count(),0);
 runs.push({gender,uniqueScenes:20,back:true,reveal:gender==='male'?'auto':'skip',actualRotation:true,defaultMute:gender==='male',sound:gender==='female',radar:true,poster:true,refreshNoReplay:true,reducedMotion:true});await context.close();console.log('PASS effects',gender);
 }assert.deepEqual(errors,[]);fs.writeFileSync(output+'/browser.json',JSON.stringify({passed:true,url:base,runs,errors,verifiedAt:new Date().toISOString()},null,2));
}finally{await browser.close();}
