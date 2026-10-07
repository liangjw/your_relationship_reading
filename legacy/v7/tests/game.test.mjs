import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRounds,optionOrder} from '../game-data.js';
import {STORAGE_KEY,newRun,loadRun,select,next,commitAnswer,previous,makeReport} from '../game-core.js';
import {stageFor,sceneMarkup} from '../scene-stage.js';
function complete(gender,pick,edition=0){const r=newRun(gender,'test',edition),qs=buildRounds(gender,edition);for(let i=0;i<30;i++)commitAnswer(r,typeof pick==='function'?pick(qs[i],i):pick,i,14000);return r;}
test('both single-player routes cover all 30 proposal topics and one prediction per scene',()=>{for(const gender of ['male','female']){const qs=buildRounds(gender),r=newRun(gender,'x');assert.equal(qs.length,30);assert.equal(qs[0].target.gender,gender==='male'?'female':'male');assert.deepEqual(qs.map(q=>q.id),Array.from({length:30},(_,i)=>i+1));assert.equal(next(r),false);assert.equal(select(r,7),false);for(let i=0;i<30;i++){assert.equal(select(r,0),true);assert.equal(select(r,1),false);assert.equal(next(r),true);}assert.equal(r.finished,true);assert.equal(r.answers.length,30);assert.equal(select(r,0),false);assert.equal(next(r),false);}});
test('60 authored cases bind evidence, hidden motives, option semantics and sources',()=>{for(const gender of ['male','female'])for(const q of buildRounds(gender)){assert.equal(q.choices.length,4);assert.deepEqual([...q.angles].sort(),[0,1,2,3]);assert.ok(q.thought&&q.explanation&&q.source&&q.context);assert.equal(q.context.includes('{P}'),false);assert.equal(q.chat.some(c=>c[1]===q.thought),false);assert.equal(q.id===30,q.correct===null);}const a=buildRounds('male'),b=buildRounds('female');assert.equal(a.filter((q,i)=>q.context!==b[i].context).length,30);assert.ok(a.some((q,i)=>q.correct!==b[i].correct));});
test('replay changes all situations, has differing motives, and restores the chosen edition',()=>{const a=buildRounds('male',0),b=buildRounds('male',1);assert.equal(a.filter((q,i)=>q.context!==b[i].context).length,30);assert.ok(a.filter((q,i)=>q.correct!==b[i].correct).length>=20);const r=newRun('female','x',3);assert.deepEqual(loadRun({getItem:()=>JSON.stringify(r)}),r);});
test('score and biggest misconception use actual character answers and per-option tags',()=>{for(const gender of ['male','female']){const best=makeReport(complete(gender,q=>q.correct??3)),worstRun=complete(gender,q=>q.correct===null?0:(q.correct+1)%4),worst=makeReport(worstRun);assert.equal(best.score,100);assert.equal(best.hits,29);assert.equal(best.closing,3);assert.equal(worst.score,0);assert.equal(worst.perception.reduce((s,p)=>s+p.count,0),29);assert.equal(worst.metrics.reduce((s,m)=>s+m.total,0),29);assert.equal('selfPersonality' in best,false);assert.ok(worst.misconception.count>0);const q=buildRounds(gender)[worst.misconception.example.id-1];assert.notEqual(q.angles[q.correct],q.angles[worst.misconception.example.pick]);assert.equal(best.misconception,null);}});
test('all twelve fixed types are reachable from actual complete answers; option position cannot change them',()=>{const {fixtures,missing}=JSON.parse(fs.readFileSync(new URL('fixtures/personality.json',import.meta.url)));assert.deepEqual(missing,[]);const types=new Set();for(const f of fixtures){const r=newRun(f.gender,'test');f.picks.forEach((pick,i)=>commitAnswer(r,pick,i,f.spentMs));const report=makeReport(r);assert.equal(report.type.id,f.typeId);types.add(report.type.id);r.seed='another-order';assert.equal(makeReport(r).type.id,f.typeId);}assert.equal(types.size,12);const positions=new Set();for(let id=1;id<=30;id++){const a=optionOrder('test',id);assert.deepEqual([...a].sort(),[0,1,2,3]);assert.deepEqual(a,optionOrder('test',id));positions.add(a.indexOf(0));}assert.equal(positions.size,4);});
test('only coherent single-choice states resume; previous flows and damaged records are ignored',()=>{const r=newRun('female','x'),read=x=>loadRun({getItem:key=>key===STORAGE_KEY?JSON.stringify(x):null});assert.deepEqual(read(r),r);select(r,2);assert.deepEqual(read(r),r);next(r);assert.deepEqual(read(r),r);for(const bad of [{...r,version:3},{...r,edition:-1},{...r,gender:'unknown'},{...r,index:30},{...r,draft:99},{...r,answers:[{id:2,pick:0}]},{...r,finished:true}])assert.equal(read(bad),null);assert.equal(loadRun({getItem:()=>'{bad'}),null);});
test('one tap commits and advances; a stale scene event cannot answer the next scene',()=>{const r=newRun('male','x');assert.equal(commitAnswer(r,99,0),false);for(let i=0;i<30;i++){assert.equal(commitAnswer(r,0,i),true);assert.equal(r.index,i+1);assert.equal(r.draft,null);assert.equal(commitAnswer(r,1,i),false);assert.equal(r.answers.length,i+1);}assert.equal(r.finished,true);assert.equal(commitAnswer(r,1,30),false);});
test('all 60 stage views omit narration, hidden motives, explanations and extra next steps',()=>{const esc=s=>String(s);for(const gender of ['male','female'])for(const q of buildRounds(gender)){const r=newRun(gender,'x');r.index=q.id-1;const s=stageFor(q),html=sceneMarkup(q,r,{esc,chapter:'test',order:[0,1,2,3],sceneArt:()=>'<div class="comic-art"></div>'});assert.ok(s.kind&&s.title);assert.equal(html.includes(q.context),false);assert.equal(html.includes(q.thought),false);assert.equal(html.includes(q.explanation),false);assert.equal(html.includes('scene-context'),false);assert.equal(html.includes('reveal-panel'),false);assert.equal(html.includes('data-action="next"'),false);assert.equal((html.match(/data-choice=/g)||[]).length,4);}});

test('backtracking preserves later choices, replaces records, invalidates report and excludes revisited timing',()=>{
 const r=complete('male',q=>q.correct??0),old=r.answers.map(a=>({...a}));
 assert.equal(previous(r,30),true);assert.equal(r.finished,false);assert.equal(r.index,29);assert.equal(r.answers.length,30);assert.equal(previous(r,30),false);
 for(let n=29;n>0;n--)assert.equal(previous(r,n),true);
 assert.equal(r.index,0);assert.equal(previous(r),false);assert.equal(r.answers.length,30);assert.deepEqual(loadRun({getItem:key=>key===STORAGE_KEY?JSON.stringify(r):null}),r);
 commitAnswer(r,(old[0].pick+1)%4,0,1000);assert.equal(r.answers[0].pick,(old[0].pick+1)%4);assert.equal(r.answers[1].pick,old[1].pick);
 for(let n=1;n<30;n++)commitAnswer(r,old[n].pick,n,1000);
 assert.equal(r.finished,true);assert.equal(r.answers.length,30);assert.equal(makeReport(r).hits,28);assert.equal(makeReport(r).assessment.tempo.count,0);
});
test('v6 migration invalidates only replaced Q25 and retains the remaining answer records',()=>{
 const old={...complete('male',q=>q.correct??0),version:6},r=loadRun({getItem:key=>key==='heart-decoder-solo-v6'?JSON.stringify(old):null});
 assert.equal(r.version,7);assert.equal(r.index,24);assert.equal(r.finished,false);assert.equal(r.answers[24].pick,null);assert.equal(r.answers.length,30);assert.deepEqual(r.answers.slice(25),old.answers.slice(25));
 assert.deepEqual(loadRun({getItem:key=>key===STORAGE_KEY?JSON.stringify(r):null}),r);
 const qs=buildRounds(r.gender,r.edition);for(let n=24;n<30;n++)commitAnswer(r,qs[n].correct??0,n,14000);
 assert.equal(makeReport(r).score,100);
});
test('all runtime cases, reports and evidence omit fertility topics',()=>{
 for(const g of ['male','female'])for(const q of buildRounds(g))assert.equal(/育儿|托育|生育|夜间照护|有孩子/.test(JSON.stringify([q,stageFor(q)])),false);
});
test('old Q25 selected but not submitted cannot become an answer for its replacement',()=>{
 const r=newRun('male','old');for(let n=0;n<24;n++)commitAnswer(r,0,n);r.version=4;r.draft=2;
 const migrated=loadRun({getItem:key=>key==='heart-decoder-solo-v4'?JSON.stringify(r):null});
 assert.equal(migrated.index,24);assert.equal(migrated.draft,null);assert.equal(migrated.answers.length,24);assert.equal(migrated.contentUpdated,true);
});
