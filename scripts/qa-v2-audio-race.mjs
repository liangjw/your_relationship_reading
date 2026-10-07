import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.GAME_URL||'http://localhost:4175',browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.addInitScript(()=>{window.injectAudioError=null;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this.id==='bgm'&&window.injectAudioError){const name=window.injectAudioError;window.injectAudioError=null;return Promise.reject(new DOMException('Injected media interruption',name));}return play.call(this);};});
 await page.goto(base);await page.locator('[data-gender]').first().waitFor();
 await page.evaluate(()=>window.injectAudioError='AbortError');await page.locator('#sound').click();await page.waitForTimeout(150);
 assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true','Track interruption must not mute user sound preference');
 await page.locator('#sound').click();
 await page.evaluate(()=>window.injectAudioError='NotAllowedError');await page.locator('#sound').click();await page.waitForTimeout(150);
 assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false','Actual autoplay refusal must return to mute');
 await page.locator('#sound').click();await page.waitForFunction(()=>!document.querySelector('#bgm').paused&&document.querySelector('#bgm').readyState>=2);
 assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 fs.writeFileSync('artifacts/v2-review/effects/audio-race.json',JSON.stringify({passed:true,url:base,abortPreservesSound:true,autoplayRefusalMutes:true,userRetry:true,verifiedAt:new Date().toISOString()},null,2));
 console.log('PASS audio race: abort preserves preference, autoplay refusal mutes, user retry plays');
}finally{await browser.close();}
