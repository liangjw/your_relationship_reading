import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRounds,optionOrder} from '../../game-data.js';
import {newRun,commitAnswer,makeReport,previous,loadRun,STORAGE_KEY} from '../../game-core.js';
import {sceneMarkup,stageFor} from '../../scene-stage.js';
import {reportMarkup} from '../../game-view.js';
import {sceneIllustration} from '../../illustrations.js';
const helpers={sceneArt:sceneIllustration,esc:s=>String(s),logo:()=>'',icon:()=>''};
const forbidden=/生育|育儿|托育|夜间照护|有孩子|怀孕|孕期/;
const summary=[];
for(const gender of ['male','female'])for(const edition of [0,1]){
 const r=newRun(gender,'independent-v7-content-audit',edition),rounds=buildRounds(gender,edition);
 for(const q of rounds){
  const stage=stageFor(q),html=sceneMarkup(q,r,{...helpers,chapter:'审查',order:optionOrder(r.seed,q.id)});
  assert.ok(!html.includes(q.thought),'midgame thought '+q.id);
  assert.ok(!html.includes(q.explanation),'midgame explanation '+q.id);
  assert.ok(!html.includes('scene-science'),'midgame research '+q.id);
  assert.ok(!forbidden.test(JSON.stringify(q)+html),'fertility topic '+q.id);
  if(q.id===25){assert.equal(q.correct,q.variant===0?0:1);assert.ok(stage.lines.some(s=>q.variant===0?s.includes('负责人'):s.includes('两人都出差')));}
  assert.ok(commitAnswer(r,q.correct??0,q.id-1,14000));
 }
 const report=makeReport(r),html=reportMarkup(report,r,helpers);
 assert.equal(report.hits,29);assert.equal(report.type.id,'observer');
 assert.equal((html.match(/data-review=/g)||[]).length,30);
 assert.equal((html.match(/class="scene-science"/g)||[]).length,29);
 assert.ok(!forbidden.test(html));
 assert.ok(html.includes('data-scene="31"'));
 for(const q of rounds)assert.ok(html.includes(q.thought)&&html.includes(q.explanation),'missing archive '+q.id);
 const old={...structuredClone(r),version:6};
 const migrated=loadRun({getItem:key=>key==='heart-decoder-solo-v6'?JSON.stringify(old):null});
 assert.equal(migrated.index,24);assert.equal(migrated.answers[24].pick,null);
 assert.deepEqual(migrated.answers.slice(0,24),old.answers.slice(0,24));
 assert.deepEqual(migrated.answers.slice(25),old.answers.slice(25));
 for(let n=24;n<30;n++)assert.ok(commitAnswer(migrated,rounds[n].correct??0,n,14000));
 assert.equal(makeReport(migrated).score,100);
 assert.ok(!forbidden.test(reportMarkup(makeReport(migrated),migrated,helpers)));
 assert.ok(previous(r,30));
 while(r.index>24)assert.ok(previous(r,r.index));
 const wrong=(rounds[24].correct+1)%4;
 assert.ok(commitAnswer(r,wrong,24,1000));
 for(let n=25;n<30;n++)assert.ok(commitAnswer(r,rounds[n].correct??0,n,1000));
 assert.equal(r.answers.length,30);assert.equal(makeReport(r).hits,28);
 assert.ok(makeReport(r).evidence.some(a=>a.id===25));
 assert.ok(loadRun({getItem:key=>key===STORAGE_KEY?JSON.stringify(r):null}));
 summary.push({gender,edition,variant25:rounds[24].variant,archives:30,score:report.score,afterRevisionHits:makeReport(r).hits});
}
const {fixtures}=JSON.parse(fs.readFileSync(new URL('../personality-fixtures.json',import.meta.url),'utf8'));
for(const f of fixtures){const r=newRun(f.gender,'v7-fixture-audit');f.picks.forEach((p,i)=>assert.ok(commitAnswer(r,p,i,f.spentMs)));assert.equal(makeReport(r).type.id,f.typeId);}
console.log(JSON.stringify({passed:true,combinations:summary,legalSyntheticTypeFixtures:fixtures.length},null,2));
