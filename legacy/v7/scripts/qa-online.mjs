import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {buildRounds} from '../game-data.js';
const base=process.env.GAME_URL||'https://your-relationship-reading.fliedwolf.workers.dev';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['index.html','app.js','game-core.js','game-data.js','scene-stage.js','styles.css','sw.js',...fs.readdirSync('assets').filter(p=>/^manga-.*-v7.webp$/.test(p)).map(p=>'assets/'+p)];
await Promise.all(files.map(async p=>{const res=await fetch(base+'/'+p);assert.equal(res.status,200,p);assert.equal(sha(Buffer.from(await res.arrayBuffer())),sha(fs.readFileSync('dist/'+p)),p);}));
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('.intro-comic img').evaluate(img=>img.decode());await page.screenshot({path:'artifacts/v7-online-intro.png',fullPage:true});
 await page.locator('[data-gender="male"]').click();const rounds=buildRounds('male');
 for(let n=1;n<=30;n++){await page.locator('.manga-art img').evaluate(img=>img.decode());assert.equal(await page.locator('.scene-context,.reveal-panel').count(),0);await page.locator(`[data-choice="${rounds[n-1].correct??0}"]`).click();await page.waitForFunction(n=>n===30?!!document.querySelector('.personality-card'):document.querySelector('.round-number b')?.textContent===String(n+1).padStart(2,'0'),n);}
 assert.equal(await page.locator('.personality-card').getAttribute('data-type'),'observer');assert.equal(await page.locator('[data-review]').count(),30);
 await page.locator('[data-action="back"]').click();await page.locator('[data-choice="1"]').click();await page.locator('.personality-card').waitFor();
 await page.locator('[data-action="share"]').click();await page.locator('.poster').evaluate(img=>img.decode());assert.equal(await page.locator('.poster').getAttribute('data-score'),'100');const link=await page.locator('#share-link').inputValue();assert.equal(new URL(link).origin,base);assert.equal(new URL(link).search,'?from=report');assert.equal(await page.locator('.micro-note').filter({hasText:'本机预览'}).count(),0);await page.screenshot({path:'artifacts/v7-online-share.png',fullPage:true});
 const fresh=await browser.newContext(),friend=await fresh.newPage();await friend.goto(link);assert.equal(await friend.locator('[data-gender]').count(),2);await fresh.close();
 await page.locator('[data-action="close"]').click();await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await page.locator('.personality-card').waitFor();assert.equal(await page.locator('.personality-card').getAttribute('data-type'),'observer');await context.setOffline(false);assert.deepEqual(errors,[]);
 const result={passed:true,url:base,verifiedAt:new Date().toISOString(),filesMatched:files.length,images:8,completedScenes:30,report:true,backEdit:true,publicPoster:true,freshFriend:true,offline:true,errors};fs.writeFileSync('artifacts/v7-online-qa.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
