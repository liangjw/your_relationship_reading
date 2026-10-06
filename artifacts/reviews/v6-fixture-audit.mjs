import fs from 'node:fs';
import assert from 'node:assert/strict';
import {newRun,commitAnswer,makeReport} from '../../game-core.js';
const {fixtures}=JSON.parse(fs.readFileSync(new URL('../../tests/fixtures/personality.json',import.meta.url)));
const summary=[];
for(const f of fixtures){const r=newRun(f.gender,'review-fixture');f.picks.forEach((pick,i)=>commitAnswer(r,pick,i,f.spentMs));const report=makeReport(r);assert.equal(report.type.id,f.typeId);summary.push({type:report.name,score:report.score,strong:report.abilityStrong.label,skills:report.assessment.skills.map(s=>[s.id,s.value]),bias:report.assessment.bias.map(b=>[b.id,b.value]),reason:report.classification.reason});}
assert.equal(new Set(summary.map(s=>s.type)).size,12);
console.log(JSON.stringify(summary,null,2));
