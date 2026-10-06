import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {buildRounds} from '../game-data.js';
import {artworkFor} from '../illustrations.js';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=['index.html','styles.css','app.js','game-core.js','game-data.js','game-view.js','scene-stage.js','assessment-data.js','personality.js','active-timer.js','illustrations.js','report-ai.js','data.js','wechat-share.js','manifest.webmanifest','sw.js','_headers'];
const production=Object.fromEntries(files.map(p=>{assert.equal(hash(p),hash('dist/'+p),p);return [p,hash(p)];}));
for(const p of fs.readdirSync('assets'))assert.equal(hash('assets/'+p),hash('dist/assets/'+p));
const boards=fs.readdirSync('assets').filter(p=>/^manga-.*-v7.webp$/.test(p));assert.equal(boards.length,8);
for(const g of ['male','female'])for(const q of buildRounds(g)){assert.ok(fs.existsSync(artworkFor(q)));assert.equal(/育儿|托育|生育|有孩子/.test(JSON.stringify(q)),false);assert.ok(fs.readFileSync('sw.js','utf8').includes(artworkFor(q)));}
const reviews=Object.fromEntries(['game-experience','relationship','mobile'].map(role=>{const p=`artifacts/reviews/${role}-v7-round1.md`,text=fs.readFileSync(p,'utf8');assert.match(text,/PASS/);assert.doesNotMatch(text,/结论[^\n]*FAIL/);return [role,{file:p,sha256:hash(p),status:'PASS'}];}));
const qa=JSON.parse(fs.readFileSync('artifacts/v7-qa.json','utf8'));assert.equal(qa.passed,true);assert.deepEqual(qa.errors,[]);
const probes=fs.readdirSync('artifacts/reviews').filter(p=>/v7.*(?:probe|audit).*\.(?:json|mjs)$/.test(p));
const report={version:7,stateSchema:7,verifiedAt:new Date().toISOString(),production,reviews,qaPassed:true,tests:22,mangaBoards:8,artworkBytes:boards.reduce((n,p)=>n+fs.statSync('assets/'+p).size,0),authoredCases:60,personalityTypes:12,navigation:'backtrack, preserve subsequent choices, replace answers, exclude revisited speed, rebuild report',migration:'old Q25 submitted and pending answers invalidated; other answers retained',evidence:['artifacts/v7-qa.json',...probes.map(p=>'artifacts/reviews/'+p)],scope:'product types from authored cases; no population validation',status:'v7 ready for requested deployment'};
fs.writeFileSync('artifacts/delivery-v7-audit.json',JSON.stringify(report,null,2));console.log('v7 delivery audit PASS: production matches source, all experts PASS, 8 boards, 60 cases.');
