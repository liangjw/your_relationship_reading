import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {questionsFor} from '../backend/content/bank.mjs';
import {newSession,applyAction} from '../backend/domain/session.mjs';
import {reportData,present} from '../backend/presentation/views.mjs';
import {poster} from '../backend/presentation/poster.mjs';
import {mascotFor} from '../backend/presentation/mascots.mjs';
import fixtures from '../tests/v2/type-fixtures.json' with {type:'json'};
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.GAME_URL||'http://localhost:4175',output='artifacts/v2-review/personalities';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'}), page=await browser.newPage({viewport:{width:390,height:844}}), cards=[],results=[];
const forbidden=/待中国样本校准|研究方向试玩基准|加权方向吻合度|非真实准确率|PRD证据等级|AI服务未启用/;
try{
for(const [id,f] of Object.entries(fixtures).sort()){
 const s=newSession();applyAction(s,{action:'start',gender:f.gender,revision:s.revision},0);s.answers=f.answers;s.screen='report';s.index=19;
 const r=reportData(s);assert.equal(r.type.id,id);const html=present(s,base,r).html;assert(!forbidden.test(html));assert(!html.includes('personality-symbol'));
 const card=html.match(/<section class="personality-card"[\s\S]*?<\/section>/)[0];cards.push(card);
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await page.setContent(`<base href="${base}/"><link rel="stylesheet" href="/styles.css">${html}`);await page.locator('.personality-character').evaluate(i=>i.decode());assert.equal(await page.locator('.personality-character').getAttribute('src'),mascotFor(id).src);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===320&&id==='type-02')await page.screenshot({path:output+'/report-320.png',fullPage:true});}
 const svg=poster(r,base);assert(!forbidden.test(svg));assert(svg.includes('data:image/webp;base64,'));
 const png=await page.evaluate(async svg=>{const i=new Image();i.src=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);const px=x.getImageData(230,316,290,290).data;let colored=0;for(let k=0;k<px.length;k+=4)if(Math.abs(px[k]-240)+Math.abs(px[k+1]-226)+Math.abs(px[k+2]-226)>60)colored++;return {width:c.width,height:c.height,colored,png:c.toDataURL('image/png').split(',')[1]};},svg);
 assert.equal(png.width,750);assert.equal(png.height,1360);assert(png.colored>5000,'Mascot missing from PNG '+id);fs.writeFileSync(output+'/'+id+'-poster.png',Buffer.from(png.png,'base64'));results.push({id,widths:[320,390],poster:'750x1360',mascotPixels:png.colored});
}
await page.setViewportSize({width:1170,height:1600});await page.setContent(`<base href="${base}/"><link rel="stylesheet" href="/styles.css"><style>body{padding:24px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.personality-card{align-self:start}</style>${cards.join('')}`);await page.locator('.personality-character').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:output+'/all-12.png',fullPage:true});
// Verify actual workerd session and client-generated share PNG after a complete run.
await page.setViewportSize({width:390,height:844});await page.goto(base);const ready=()=>page.waitForFunction(()=>!document.querySelector('#app[aria-busy="true"]')&&document.querySelector('[data-action]'));await ready();await page.locator('[data-gender="male"]').click();await ready();
for(const q of questionsFor('male')){await page.waitForTimeout(520);const pick=q.benchmark.optionDistances.indexOf(Math.min(...q.benchmark.optionDistances));await page.locator(`[data-pick="${pick}"]`).click();await ready();}
await page.locator('.summon-dialog').waitFor({state:'detached',timeout:5000});await page.locator('.personality-character').evaluate(i=>i.decode());assert(!forbidden.test(await page.locator('#app').textContent()));await page.locator('[data-ui="poster"]').click();await page.locator('#poster-dialog').waitFor({state:'visible'});await page.locator('#poster-image').evaluate(i=>i.decode());assert.equal(await page.locator('#poster-image').evaluate(i=>i.naturalWidth),750);await page.screenshot({path:output+'/live-share.png',fullPage:true});
fs.writeFileSync(output+'/verification.json',JSON.stringify({passed:true,base,results,liveClient:true,verifiedAt:new Date().toISOString()},null,2));console.log('PASS: 12 characters, 24 mobile reports, 12 embedded share PNGs, actual 20-question workerd flow');
}finally{await browser.close();}
