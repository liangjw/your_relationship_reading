import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {QUESTIONS} from '../../backend/content/bank.mjs';
import {newSession,applyAction} from '../../backend/domain/session.mjs';
import {present} from '../../backend/presentation/views.mjs';
import {sceneArt} from '../../backend/presentation/scene-art.mjs';
import {radarValues,radarMarkup} from '../../backend/presentation/radar.mjs';
test('Every current PRD scene has distinct artwork and context provenance',()=>{
 const manifest=JSON.parse(fs.readFileSync('artwork/question-scenes/manifest.json'));
 assert.equal(manifest.length,40);
 const hashes=new Set();
 for(const q of QUESTIONS){const art=sceneArt(q),record=manifest.find(m=>m.id===q.id);assert.equal(record.context,q.context);assert.equal(record.src,art.src);const hash=createHash('sha256').update(fs.readFileSync('frontend'+art.src)).digest('hex');assert.equal(hash,record.sha256);hashes.add(hash);}
 assert.equal(hashes.size,40);
});
test('Radar has consistent outward polarity and does not invent missing values',()=>{
 const metrics=Array.from({length:6},(_,i)=>({label:'D'+i,value:i===5?20:80,lowerIsBetter:i===5}));
 assert.deepEqual(radarValues(metrics).map(m=>m.radarValue),[80,80,80,80,80,80]);
 assert.equal(radarValues(metrics)[5].radarLabel,'性别校准');
 metrics[5].value=null;const markup=radarMarkup(metrics);assert(!markup.includes('class="radar-shape"'));assert.equal((markup.match(/class="radar-point"/g)||[]).length,5);assert(markup.includes('未评估'));
});
test('Scene motion metadata changes on navigation without exposing future answers or reports',()=>{
 const s=newSession();applyAction(s,{action:'start',gender:'male',revision:s.revision},0);
 const first=present(s,'https://example.com');assert.equal(first.motion.kind,'scene');assert.equal(first.motion.preload.length,2);assert(first.motion.preload.every(url=>/^\/assets\/scenes\/F\d{2}\.webp$/.test(url)));assert(!first.html.includes('observation-radar'));assert(!first.share);
 applyAction(s,{action:'answer',questionId:s.questions[0].id,pick:0,revision:s.revision},10000);
 const second=present(s,'https://example.com');assert.notEqual(first.motion.key,second.motion.key);assert(!second.html.includes(s.questions[2].context));
});
