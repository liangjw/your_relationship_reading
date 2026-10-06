import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const b=await chromium.launch({headless:true,channel:'msedge'});
try{
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage();
 const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('heart-decoder-solo-v7')));
 const click=async pick=>{await p.locator(`[data-choice="${pick}"]`).click();await p.waitForTimeout(480);};
 await p.goto('http://localhost:4173/');await p.locator('[data-gender="male"]').click();const initial=await state();
 await click(0);await p.locator('[data-action="back"]').click();assert.equal((await state()).answers.length,1);assert.equal(await p.locator('.previous-label').textContent(),'上次选择');
 await p.reload();assert.equal(await p.locator('.round-number b').textContent(),'01');await p.locator('[data-action="back"]').click();assert.equal(await p.locator('[data-gender]').count(),2);await p.reload();assert.equal(await p.locator('[data-gender]').count(),2);
 await p.locator('[data-gender="male"]').click();assert.equal((await state()).seed,initial.seed);assert.equal((await state()).edition,initial.edition);await click(1);assert.equal((await state()).answers[0].pick,1);
 for(let id=2;id<=29;id++)await click(0);
 assert.equal(await p.locator('.round-number b').textContent(),'30');const original=await state();assert.equal(original.answers.length,29);
 await p.locator('[data-action="back"]').click();await p.locator('[data-action="back"]').click();assert.equal(await p.locator('.round-number b').textContent(),'28');assert.equal((await state()).answers.length,29);
 const preserved=JSON.stringify((await state()).answers[28]);await click(2);assert.equal((await state()).answers[27].pick,2);assert.equal(JSON.stringify((await state()).answers[28]),preserved);assert.equal(await p.locator('.personality-card').count(),0);await click(1);assert.equal(await p.locator('.round-number b').textContent(),'30');assert.equal(await p.locator('.personality-card').count(),0);await click(0);assert.equal(await p.locator('.personality-card').count(),1);
 assert.equal((await state()).answers.length,30);assert.ok((await state()).answers[27].revised);await c.close();
 const old={version:6,gender:'male',seed:'old-q25-review',edition:0,index:30,finished:true,draft:null,currentTiming:null,answers:Array.from({length:30},(_,i)=>({id:i+1,pick:0,assessmentVersion:1,spentMs:2000}))};
 const oc=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await oc.addInitScript(v=>localStorage.setItem('heart-decoder-solo-v6',JSON.stringify(v)),old);const op=await oc.newPage();await op.goto('http://localhost:4173/');
 const migrated=await op.evaluate(()=>JSON.parse(localStorage.getItem('heart-decoder-solo-v7')));assert.equal(await op.locator('.round-number b').textContent(),'25');assert.equal(migrated.answers[24].pick,null);assert.equal(migrated.answers.length,30);assert.equal(await op.locator('.personality-card').count(),0);assert.equal((await op.locator('body').textContent()).includes('育儿'),false);
 await oc.close();console.log('V7 navigation audit PASS: back/reload/entry edition, replacement with later records preserved, final-only report, replaced-Q25 migration.');
}finally{await b.close();}
