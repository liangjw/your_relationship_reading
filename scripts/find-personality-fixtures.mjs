import fs from 'node:fs';
import {newRun,commitAnswer,makeReport} from '../game-core.js';
import {buildRounds} from '../game-data.js';
import {PERSONALITIES} from '../personality.js';
let state=7812026;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
const found=new Map();
function evaluate(gender,picks,spentMs){const r=newRun(gender,'fixture');picks.forEach((pick,i)=>commitAnswer(r,pick,i,spentMs));return makeReport(r);}
for(let sample=0;sample<60000&&found.size<12;sample++){
 const gender=sample%2?'male':'female',qs=buildRounds(gender),accuracy=random(),angle=Math.floor(random()*4),spentMs=sample%5===0?4000:14000,picks=qs.map(q=>q.correct===null?0:random()<accuracy?q.correct:random()<.65?q.angles.indexOf(angle):Math.floor(random()*4)),r=evaluate(gender,picks,spentMs);
 if(!found.has(r.type.id))found.set(r.type.id,{typeId:r.type.id,gender,picks,spentMs,score:r.score});
}
const missing=PERSONALITIES.filter(p=>!found.has(p.id)).map(p=>p.id),data=JSON.stringify({classifierVersion:'12-types-v1',fixtures:[...found.values()],missing},null,2);fs.writeFileSync('artifacts/personality-fixtures.json',data);fs.mkdirSync('tests/fixtures',{recursive:true});fs.writeFileSync('tests/fixtures/personality.json',data);
console.log(JSON.stringify({found:[...found.keys()],missing}));if(missing.length)process.exitCode=1;
