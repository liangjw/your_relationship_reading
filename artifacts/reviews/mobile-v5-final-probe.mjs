import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const prior=JSON.parse(fs.readFileSync('artifacts/reviews/mobile-v5-fix-probe.json','utf8')),results={phone:prior.phone,doubleTap:[],legacy:prior.legacy,normalInput:[],provenance:{phone:'mobile-v5-fix-probe.json — same unchanged scene-stage.js/styles.css; 240 scenes passed',legacy:'mobile-v5-fix-probe.json — unchanged game-core.js and migration code; 3 states passed',doubleTap:'Fresh run after app.js click event.detail > 1 filter',normalInput:'Fresh real browser mouse/keyboard interaction'}};
const browser=await chromium.launch({headless:true,channel:'msedge'}),key='heart-decoder-solo-v4';
try{
for(const delay of [40,100,160,200,250,350])for(const choice of [0,1,2,3]){
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage();await p.goto('http://localhost:4173');await p.locator('[data-gender="male"]').click();await p.locator('[data-choice]').nth(choice).dblclick({delay});await p.waitForTimeout(500);const r=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);results.doubleTap.push({delay,choice,index:r.index});assert.equal(r.index,1);assert.equal(r.answers.length,1);await c.close();
}
for(const gender of ['male','female']){
 const c=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:4173');await p.locator(`[data-gender="${gender}"]`).click();
 await p.locator('[data-choice]').first().click();await p.waitForTimeout(500);assert.equal(await p.locator('[data-choice]:disabled').count(),0);assert.equal(await p.locator('.round-number b').textContent(),'02');
 await p.locator('[data-choice]').nth(1).click();await p.waitForTimeout(500);assert.equal(await p.locator('.round-number b').textContent(),'03');
 await p.locator('[data-choice]').nth(2).focus();await p.keyboard.press('Enter');await p.waitForTimeout(500);assert.equal(await p.locator('.round-number b').textContent(),'04');
 await p.locator('[data-choice]').nth(3).focus();await p.keyboard.press('Space');await p.waitForTimeout(500);assert.equal(await p.locator('.round-number b').textContent(),'05');
 const r=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(r.answers.length,4);assert.equal(r.index,4);assert.equal(r.draft,null);assert.deepEqual(errors,[]);results.normalInput.push({gender,index:r.index,mouse:'two single answers separated by 500ms',keyboard:'Enter and Space answered successive scenes',errors});await c.close();
}
console.log(JSON.stringify(results,null,2));fs.writeFileSync('artifacts/reviews/mobile-v5-final-probe.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
