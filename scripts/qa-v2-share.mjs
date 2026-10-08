import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {INVITE_TITLE,INVITE_TEXT} from '../backend/presentation/share.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.GAME_URL||'http://localhost:4176';
const output=process.env.SHARE_QA_DIR||'artifacts/v2-review/share';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],runs=[];
try {
  for (const mode of ['copy','wechat','denied','native','cancel','native-error']) {
    const width=mode==='copy'?320:mode==='native'?430:390;
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',...(mode==='wechat'?{userAgent:'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.50'}:{})});
    await context.addInitScript(({mode})=>{
      window.shareCalls=[];
      window.copiedInvites=[];
      Object.defineProperty(navigator,'share',{configurable:true,value:mode.startsWith('native')||mode==='cancel'?async data=>{
        window.shareCalls.push(data);
        if(mode==='cancel')throw new DOMException('Cancelled','AbortError');
        if(mode==='native-error')throw new DOMException('Blocked','NotAllowedError');
      }:undefined});
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{
        if(mode==='denied')throw new DOMException('Blocked','NotAllowedError');
        window.copiedInvites.push(text);
      }}});
    },{mode});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const ready=()=>page.waitForFunction(()=>document.querySelector('.entry-share')&&!document.querySelector('#app[aria-busy="true"]'));
    await page.goto(base);await ready();
    assert(!/\bV2\b/i.test(await page.title()));
    assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'),INVITE_TITLE);
    assert.equal(await page.locator('meta[name="twitter:title"]').getAttribute('content'),INVITE_TITLE);
    const before=await page.evaluate(()=>fetch('/api/game').then(r=>r.json()));
    assert.equal(before.share.title,INVITE_TITLE);assert.equal(before.share.text,INVITE_TEXT);
    assert(!before.share.poster);
    assert.equal(await page.locator('[data-action="start"]').count(),2);
    assert.equal(await page.locator('.entry-share').evaluate(b=>b.getBoundingClientRect().height>=44),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    if(mode==='copy')await page.screenshot({path:output+'/entry-320.png',fullPage:true});
    await page.locator('.entry-share').click();
    if(mode==='native'||mode==='cancel') {
      await page.waitForFunction(()=>window.shareCalls.length===1);
      const [payload]=await page.evaluate(()=>window.shareCalls);
      assert.equal(payload.title,INVITE_TITLE);
      assert.equal(payload.text,INVITE_TEXT);
      assert.equal(payload.url,'https://dramame.ai/?from=invite');
      assert.equal(await page.locator('#share-dialog').isVisible(),false);
    } else {
      await page.locator('#share-dialog').waitFor({state:'visible'});
      const invite=await page.locator('#share-copy').inputValue();
      assert(invite.includes(INVITE_TITLE));assert(invite.endsWith('https://dramame.ai/?from=invite'));
      if(mode==='wechat')assert((await page.locator('#share-hint').innerText()).includes('右上角'));
      assert.equal(await page.locator('#share-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth),true);
      if(mode==='copy')await page.screenshot({path:output+'/invite-320.png',fullPage:true});
      await page.locator('#copy-invite').click();
      if(mode==='denied') {
        await page.waitForFunction(()=>document.querySelector('#share-hint').textContent.includes('长按复制'));
        assert.equal(await page.locator('#share-copy').evaluate(t=>t.selectionEnd-t.selectionStart),invite.length);
        await page.locator('#close-share').click();
      } else {
        await page.locator('#share-dialog').waitFor({state:'hidden'});
        assert.deepEqual(await page.evaluate(()=>window.copiedInvites),[invite]);
      }
    }
    const after=await page.evaluate(()=>fetch('/api/game').then(r=>r.json()));
    assert.equal(after.screen,'entry');assert.equal(after.revision,before.revision);
    // Exercise report sharing with an actual complete run once.
    if(mode==='native') {
      await page.locator('[data-gender="male"]').click();
      for(let i=0;i<20;i++) {
        await page.waitForFunction(()=>document.querySelector('[data-question-id]')&&!document.querySelector('#app[aria-busy="true"]'));
        await page.waitForTimeout(560);
        await page.locator('[data-pick="0"]').click();
      }
      await page.locator('.personality-card').waitFor();
      const role=await page.locator('.personality-card h2').innerText();
      await page.locator('[data-ui="share"]').click();
      await page.waitForFunction(()=>window.shareCalls.length===2);
      const [,payload]=await page.evaluate(()=>window.shareCalls);
      assert(payload.title.includes(role));assert(!/\bV2\b/i.test(payload.title));
      assert.equal(payload.url,'https://dramame.ai/?from=report');
      await page.locator('[data-ui="poster"]').click();
      await page.locator('#poster-dialog').waitFor({state:'visible'});
      await page.locator('#poster-image').evaluate(image=>image.decode());
      assert.equal(await page.locator('#poster-image').evaluate(image=>`${image.naturalWidth}x${image.naturalHeight}`),'750x1360');
      await page.locator('#close-poster').click();
    }
    runs.push({mode,width,passed:true});await context.close();console.log('PASS',mode,width);
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(output+'/browser.json',JSON.stringify({passed:true,url:base,runs,errors,verifiedAt:new Date().toISOString()},null,2));
} finally {await browser.close();}
