import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildRounds} from '../game-data.js';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[];
fs.mkdirSync('artifacts',{recursive:true});
try{for(const gender of ['male','female']){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('heart-decoder-solo-v7'))),overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.goto('http://localhost:4173');assert.equal(await page.locator('button').count(),2);assert.equal(await page.locator('nav').count(),0);assert.equal(await page.locator('a').count(),0);if(gender==='male')await page.screenshot({path:'artifacts/v7-intro-mobile.png',fullPage:true});
 await page.locator(`[data-gender="${gender}"]`).click();assert.equal(await page.locator('[data-choice]').count(),4);if(gender==='male')await page.screenshot({path:'artifacts/v7-game-mobile.png',fullPage:true});
 const rounds=buildRounds(gender,0);
 for(let id=1;id<=30;id++){
  assert.equal((await stored()).index,id-1);assert.equal(await page.locator('[data-choice]').count(),4);assert.equal(await page.locator('.scene-context,.inner-thought,.reveal-panel,[data-action="next"],.scene-science').count(),0);assert.equal(await page.locator('.comic-prop').count(),1);
  if(gender==='male'&&[6,16,29].includes(id))await page.screenshot({path:`artifacts/v7-mood-${id}.png`,fullPage:true});
  const pick=gender==='male'?(rounds[id-1].correct??0):id%4;
  if(id===1)await page.locator(`[data-choice="${pick}"]`).dblclick();else await page.locator(`[data-choice="${pick}"]`).click();
  await page.waitForFunction(n=>n===30?!!document.querySelector('.personality-card'):document.querySelector('.round-number b')?.textContent===String(n+1).padStart(2,'0'),id);
  const r=await stored();assert.equal(r.index,id);assert.equal(r.answers.length,id);assert.equal(r.draft,null);
  if(id===1){await page.reload();assert.equal(await page.locator('.round-number b').textContent(),'02');assert.equal(await page.locator('.reveal-panel').count(),0);}
 }
 assert.equal((await stored()).finished,true);assert.equal(await overflow(),false);await page.reload();await page.locator('.personality-card').waitFor();assert.equal(await page.locator('[data-review]').count(),30);
 assert.equal(await page.locator('.axis-values>span').count(),3);assert.equal(await page.locator('[data-personality]').count(),12);assert.equal(await page.locator('.all-attributes .metric').count(),8);assert.equal(await page.locator('.hidden-attributes article').count(),3);
 await page.locator('.report-archive>summary').click();await page.locator('[data-review="2"]>summary').click();assert.ok((await page.locator('[data-review="2"] .inner-thought').textContent()).includes(rounds[1].thought));await page.locator('[data-review="2"] .scene-science>summary').click();assert.ok((await page.locator('[data-review="2"] .scene-science').textContent()).includes('效应量未知'));await page.locator('.report-archive>summary').click();
 await page.screenshot({path:`artifacts/v7-report-${gender}.png`,fullPage:true});
 if(gender==='male'){
  assert.ok((await page.locator('.score-line').textContent()).includes('100'));assert.equal(await page.locator('.personality-card').getAttribute('data-type'),'observer');await page.locator('[data-action="share"]').click();await page.locator('.poster').waitFor();assert.equal(await page.locator('.poster').evaluate(i=>i.naturalWidth),750);assert.equal(await page.locator('.poster').evaluate(i=>i.naturalHeight),1360);assert.equal(await page.locator('.poster').getAttribute('data-type'),'observer');assert.equal(await page.locator('.poster').getAttribute('data-score'),'100');
  const link=await page.locator('#share-link').inputValue();assert.equal(new URL(link).search,'?from=report');const data=await page.locator('.poster').evaluate(async img=>{const blob=await(await fetch(img.src)).blob();return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob);});});fs.writeFileSync('artifacts/v7-share-card.png',Buffer.from(data,'base64'));
  const pending=page.waitForEvent('download');await page.locator('[download]').click();assert.ok((await pending).suggestedFilename().endsWith('.png'));await page.locator('[data-action="close"]').click();
  const friend=await browser.newContext(),fp=await friend.newPage();await fp.goto(link);assert.equal(await fp.locator('[data-gender]').count(),2);assert.equal(await fp.locator('.personality-card').count(),0);await friend.close();
 }
 for(const width of [320,360,430,768,1280]){await page.setViewportSize({width,height:844});assert.equal(await overflow(),false,`report ${width}`);}
 await page.locator('[data-action="replay"]').click();await page.locator(`[data-gender="${gender}"]`).click();assert.equal((await stored()).edition,1);assert.equal((await stored()).answers.length,0);
 for(const width of [320,360,430,768,1280]){await page.setViewportSize({width,height:844});assert.equal(await overflow(),false,`play ${width}`);}
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForTimeout(700);await context.setOffline(true);await page.reload();assert.equal(await page.locator('[data-choice]').count(),4);await page.locator('[data-choice]').first().click();await page.waitForFunction(()=>document.querySelector('.round-number b')?.textContent==='02');await context.setOffline(false);await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/v7-qa.json',JSON.stringify({passed:true,errors,checked:['opposite gender routes','60 one-tap scenes','no narrative context paragraphs','no mid-game analysis or next confirmation','double-tap guard','atomic progress resume','final report all 30 scene interpretations','research only in report','share image download','fresh visitor entry','alternate replay','320–1280 px','offline direct advance']},null,2));console.log('V7 direct flow QA passed, both routes.');
}finally{await browser.close();}
