import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTIONS,CHAPTERS,PACKS,SOURCES} from '../data.js';
import {dayKey,dailyIds,variant,newState,loadState,summarize,compare,encodeInvite,decodeInvite,complete,streak} from '../core.js';
test('all 30 base scenarios and 6 expansion stories are complete, source-linked and have two valid branches',()=>{
 assert.equal(QUESTIONS.length,36);assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,36);
 assert.deepEqual(CHAPTERS.flatMap(c=>c.ids),Array.from({length:30},(_,i)=>i+1));
 assert.deepEqual(PACKS.flatMap(p=>p.ids),[31,32,33,34,35,36]);
 for(const q of QUESTIONS){assert.ok(q.options.length>=4);assert.equal(q.clues.length,2);assert.equal(q.motives.length,2);assert.notEqual(q.clues[0],q.clues[1]);for(const c of q.correct)assert.ok(c>=0&&c<q.options.length);assert.ok(SOURCES[q.source].url.startsWith('https://'));}
});
test('Shanghai dates and daily rotation are deterministic across timezones',()=>{
 assert.equal(dayKey(new Date('2026-10-06T16:01:00Z')),'2026-10-07');
 assert.deepEqual(dailyIds('2026-10-06'),dailyIds('2026-10-06'));assert.equal(new Set(dailyIds()).size,3);
 for(let i=0;i<100;i++){assert.ok([0,1].includes(variant('replay'+i,1)));}
 const seen=new Set();for(let i=1;i<=30;i++)dailyIds(`2026-10-${String(i).padStart(2,'0')}`).forEach(id=>seen.add(id));assert.ok(seen.size>=20);
});
test('skips are excluded, no answers or duo preferences produce no invented accuracy',()=>{
 const r=summarize([{id:1,skip:true},{id:2,self:2,partner:3}]);assert.equal(r.count,1);assert.equal(r.scored,0);assert.equal(r.accuracy,null);assert.equal(r.dimensions[0].value,null);
 const s=summarize([{id:1,variant:0,blind:0,guess:0,self:3,reply:0},{id:2,variant:1,blind:0,guess:1,self:1,reply:1}]);assert.equal(s.hits,2);assert.equal(s.changed,1);assert.equal(s.dimensions[1].value,75);assert.equal(s.type,'直球沟通派');
});
test('invites validate schema, exclude private notes and reject malformed or mismatched answers',()=>{
 const s={ids:[1,2,3],seed:'demo'};const a=s.ids.map(id=>({id,self:1,partner:2,note:'private',budget:[100,0,0,0,0]}));const token=encodeInvite(s,a);assert.ok(!atob(token).includes('private'));assert.ok(!atob(token).includes('budget'));assert.deepEqual(decodeInvite(token).ids,s.ids);
 assert.equal(decodeInvite('invalid###'),null);assert.equal(decodeInvite('a'.repeat(5001)),null);
 for(const p of [{v:1,ids:[1,1],seed:'x',a:[a[0],a[0]]},{v:1,ids:[1],seed:'x',a:[{id:1,self:99,partner:0}]},{v:1,ids:[1],seed:'x',a:[{id:2,self:0,partner:0}]},{v:1,ids:[31],seed:'x',a:[{id:31,self:0,partner:0}]}])assert.equal(decodeInvite(btoa(JSON.stringify(p))),null);
});
test('two-person comparison uses actual answers in both directions, not similarity as understanding',()=>{
 const c=compare([{id:1,self:0,partner:1},{id:2,skip:true}],[{id:1,self:1,partner:2},{id:2,self:2,partner:0}]);assert.deepEqual(c,{count:1,aHits:1,bHits:0,same:0});
});
test('chapter rewards and daily rewards cannot be repeatedly farmed; all-skipped earns none',()=>{
 const state=newState(),session={uid:'a',key:'signals',mode:'chapter',title:'t',answers:[{id:1,variant:0,blind:0,guess:0,reply:0,self:0}]};
 assert.equal(complete(state,session).reward,10);assert.equal(complete(state,{...session,uid:'b'}).reward,0);assert.equal(state.coins,10);
 assert.equal(complete(state,{...session,uid:'c',key:'other',answers:[{id:1,skip:true}]}).reward,0);
 assert.equal(complete(state,{...session,uid:'d',mode:'daily',day:'2026-10-06'}).reward,10);assert.equal(complete(state,{...session,uid:'e',mode:'daily',day:'2026-10-06'}).reward,0);assert.equal(state.days.length,1);
});
test('storage failure, corrupted data and streak around midnight are handled',()=>{
 assert.deepEqual(loadState({getItem:()=>'{broken'}),newState());assert.deepEqual(loadState({getItem:()=>{throw Error();}}),newState());
 assert.equal(streak(['2026-10-04','2026-10-05'],'2026-10-06'),2);assert.equal(streak(['2026-10-04','2026-10-05','2026-10-06'],'2026-10-06'),3);
 assert.equal(streak(['2026-10-01'],'2026-10-06'),0);
});
