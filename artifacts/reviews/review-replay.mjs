import {createRequire} from 'node:module';
import {buildRounds} from '../../game-data.js';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Mayn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {for(const gender of ['male','female']){
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage();
 await p.goto('http://localhost:4173/');await p.locator(`[data-gender=${gender}]`).click();
 const baseline=buildRounds(gender,0);for(let id=1;id<=30;id++){await p.locator(`[data-choice="${baseline[id-1].correct??0}"]`).click();await p.locator('[data-action=next]').click();}
 await p.locator('[data-action=replay]').click();await p.locator(`[data-gender=${gender}]`).click();
 const cases=buildRounds(gender,1),proof=[];
 for(let id=1;id<=29;id++){
  if(await p.locator('.inner-thought').count())throw Error('Thought leaked before prediction');
  if([1,2,3,4,5,11,20,28,29].includes(id))proof.push({id,context:await p.locator('.scene-context').textContent(),prompt:await p.locator('.decision h2').textContent(),changed:baseline[id-1].context!==cases[id-1].context,answerChanged:baseline[id-1].correct!==cases[id-1].correct});
  await p.locator(`[data-choice="${cases[id-1].correct}"]`).click();await p.locator('[data-action=next]').click();
 }
 console.log(JSON.stringify({gender,replayEdition:1,proof}));await c.close();
}}finally{await browser.close();}
