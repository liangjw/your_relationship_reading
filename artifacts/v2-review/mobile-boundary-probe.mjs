import fs from 'node:fs';
import assert from 'node:assert/strict';
import {GameService} from '../../backend/services/game.mjs';
const db=new Map();let now=0,counter=0;
const svc=new GameService({get:async k=>structuredClone(db.get(k)),put:async(k,v)=>db.set(k,structuredClone(v))},{now:()=>now});
const call=(sid,body,origin='http://localhost')=>svc.handle(sid,new Request('http://localhost/api/action',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...body,requestId:body.requestId??'mobile-review-'+ ++counter})}));
const start=await call('review',{action:'start',gender:'male',revision:0});assert.equal(start.status,200);const rev=db.get('review').revision,q=db.get('review').questions[0];now=600;
const concurrent=await Promise.all([call('review',{action:'answer',questionId:q.id,pick:0,revision:rev}),call('review',{action:'answer',questionId:q.id,pick:1,revision:rev})]);assert.deepEqual(concurrent.map(r=>r.status),[200,409]);assert.equal(db.get('review').answers.length,1);
const tails=[];for(const elapsed of [40,100,160,200,250,350,499]){now=600+elapsed;const s=db.get('review'),r=await call('review',{action:'answer',questionId:s.questions[s.index].id,pick:0,revision:s.revision});assert.equal(r.status,425);assert.equal(db.get('review').index,1);tails.push({elapsed,status:r.status,index:1});}
now=1100;let s=db.get('review');const normal=await call('review',{action:'answer',questionId:s.questions[1].id,pick:0,revision:s.revision});assert.equal(normal.status,200);assert.equal(db.get('review').index,2);
const cross=await call('review',{action:'back',revision:db.get('review').revision},'https://other.example');assert.equal(cross.status,403);
const other=await call('other',{action:'start',gender:'female',revision:0});assert.equal(other.status,200);assert.equal(db.get('other').answers.length,0);assert.equal(db.get('review').answers.length,2);
const view=await normal.json();assert(!/optionDistances|benchmark|reasons.*generalization/.test(JSON.stringify(view)));
fs.writeFileSync('artifacts/v2-review/mobile-boundary.json',JSON.stringify({passed:true,kind:'Independent actual GameService with in-memory store and injected clock; not browser gestures',concurrentStatuses:concurrent.map(r=>r.status),tails,normalAt500:true,crossOrigin:cross.status,sessionIsolation:true,currentViewOnly:true,verifiedAt:new Date().toISOString()},null,2));
