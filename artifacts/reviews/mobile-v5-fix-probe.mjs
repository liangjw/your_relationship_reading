import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
import {newRun,select,next} from '../../game-core.js';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'}),results={phone:[],doubleTap:[],legacy:[]};
const key='heart-decoder-solo-v4';
try{
for(const width of [320,360,390,430])for(const gender of ['male','female']){
 const ctx=await browser.newContext({viewport:{width,height:740},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:4173');await p.locator(`[data-gender="${gender}"]`).click();let minTap=Infinity,maxHeight=0,minProp=Infinity,minBody=Infinity,maxPropOverflow=0;
 for(let i=0;i<30;i++){
  assert.equal(await p.locator('[data-choice]').count(),4);assert.equal(await p.evaluate(()=>scrollY),0);assert.equal(await p.locator('[data-action="next"],.reveal-panel,.scene-context,.inner-thought,.scene-science').count(),0);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  minBody=Math.min(minBody,...await p.locator('.prop-line').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize)))); maxPropOverflow=Math.max(maxPropOverflow,await p.locator('.stage-illustration').evaluate(e=>e.querySelector('.comic-prop').getBoundingClientRect().bottom-e.getBoundingClientRect().bottom)); minTap=Math.min(minTap,...await p.locator('[data-choice]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height)));maxHeight=Math.max(maxHeight,await p.evaluate(()=>document.documentElement.scrollHeight));minProp=Math.min(minProp,...await p.locator('.prop-line,.prop-heading').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize))));
  await p.locator('[data-choice]').nth(3).click();await p.waitForFunction(n=>n===30?!!document.querySelector('.personality-card'):document.querySelector('.round-number b')?.textContent===String(n+1).padStart(2,'0'),i+1);
  const state=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(state.index,i+1);assert.equal(state.answers.length,i+1);assert.equal(state.draft,null);
  if(i===0){await p.reload();assert.equal(await p.locator('.round-number b').textContent(),'02');}
 }
 assert.equal(await p.locator('[data-review]').count(),30);await p.locator('.report-archive>summary').click();for(let id=1;id<=30;id++){await p.locator(`[data-review="${id}"]>summary`).click();assert.ok((await p.locator(`[data-review="${id}"]`).textContent()).includes('内心独白'));await p.locator(`[data-review="${id}"]>summary`).click();}await p.locator('.report-archive>summary').click();
 await p.locator('[data-action="share"]').click();await p.locator('.modal').waitFor();const close=await p.locator('[data-action="close"]').boundingBox();assert.equal(close.width,44);assert.equal(close.height,44);await p.locator('[data-action="copy"]').click();await p.locator('[data-action="close"]').click();
 await p.locator('[data-action="replay"]').click();await p.locator(`[data-gender="${gender}"]`).click();await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForTimeout(700);await ctx.setOffline(true);await p.reload();await p.locator('[data-choice]').first().click();await p.waitForFunction(()=>document.querySelector('.round-number b')?.textContent==='02');await ctx.setOffline(false);
 assert.deepEqual(errors,[]);results.phone.push({width,gender,minTap,minProp,minBody,maxPropOverflow,maxHeight,offline:true,errors});await ctx.close();
}
for(const delay of [40,100,160,200,250,350])for(const choice of [0,1,2,3]){
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await ctx.newPage();await p.goto('http://localhost:4173');await p.locator('[data-gender="male"]').click();await p.locator('[data-choice]').nth(choice).dblclick({delay});await p.waitForTimeout(350);const state=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);results.doubleTap.push({delay,choice,index:state.index});await ctx.close();
}
for(const index of [0,6,29]){const ctx=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true}),p=await ctx.newPage(),r=newRun('female','legacy',0);for(let i=0;i<index;i++){select(r,1);next(r);}select(r,2);await p.addInitScript(({key,r})=>localStorage.setItem(key,JSON.stringify(r)),{key,r});await p.goto('http://localhost:4173');const state=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(state.index,index+1);assert.equal(state.draft,null);assert.equal(await p.locator('.reveal-panel').count(),0);results.legacy.push({before:index,after:state.index,finished:state.finished});await ctx.close();}
console.log(JSON.stringify(results,null,2));fs.writeFileSync('artifacts/reviews/mobile-v5-fix-probe.json',JSON.stringify(results,null,2));
}finally{await browser.close();}

