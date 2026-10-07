import {buildRounds,DIMENSIONS,ANGLES} from './game-data.js';
import {assess,classify} from './personality.js';
export const STORAGE_KEY='heart-decoder-solo-v7';
export const validPick=n=>Number.isInteger(n)&&n>=0&&n<4;
export function newRun(gender,seed=String(Date.now()),edition=0){if(!['male','female'].includes(gender)||!Number.isInteger(edition)||edition<0)throw Error('Invalid route');return {version:7,gender,seed,edition,index:0,answers:[],draft:null,finished:false,currentTiming:null};}
export function loadRun(storage){try{
 const raw=storage.getItem(STORAGE_KEY)||storage.getItem('heart-decoder-solo-v6')||storage.getItem('heart-decoder-solo-v4'),r=JSON.parse(raw);
 if(![4,6,7].includes(r?.version)||!['male','female'].includes(r.gender)||typeof r.seed!=='string'||!Number.isInteger(r.edition)||r.edition<0||!Number.isInteger(r.index)||r.index<0||r.index>30||!Array.isArray(r.answers)||r.answers.length<r.index||r.answers.length>30||r.finished!==(r.index===30)||!(r.draft===null||validPick(r.draft))||(r.finished&&r.draft!==null))return null;
 for(let i=0;i<r.answers.length;i++){const a=r.answers[i];if(!a||a.id!==i+1||!(validPick(a.pick)||(r.version===7&&a.id===25&&a.pick===null))||(a.spentMs!==undefined&&a.spentMs!==null&&(!Number.isFinite(a.spentMs)||a.spentMs<0||a.spentMs>86400000))||(a.assessmentVersion!==undefined&&a.assessmentVersion!==1)||(a.revised!==undefined&&typeof a.revised!=='boolean'))return null;}
 if(r.answers.slice(0,r.index).some(a=>!validPick(a.pick))||(r.reviewed!==undefined&&(!Array.isArray(r.reviewed)||r.reviewed.some(id=>!Number.isInteger(id)||id<1||id>30)))||(r.atEntry!==undefined&&typeof r.atEntry!=='boolean')||(r.atEntry&&r.index!==0))return null;
 if(r.currentTiming!=null&&(r.currentTiming.index!==r.index||!Number.isFinite(r.currentTiming.ms)||r.currentTiming.ms<0||r.currentTiming.ms>86400000))return null;
 if(r.version!==7){if(r.version===4)r.answers=r.answers.map(({id,pick})=>({id,pick}));if(r.answers.length>=25||(r.index===24&&r.draft!==null)){if(r.answers.length>=25)r.answers[24]={id:25,pick:null};r.index=Math.min(r.index,24);r.finished=false;r.draft=null;r.contentUpdated=true;}r.version=7;r.currentTiming=null;}
 return r;
 }catch{return null;}}
export function select(r,pick){if(!r||r.finished||r.draft!==null||!validPick(pick))return false;r.draft=pick;return true;}
export function next(r,details={}){if(!r||r.finished||r.draft===null)return false;const old=r.answers[r.index];r.answers[r.index]={id:r.index+1,pick:r.draft,...details,...(old||r.reviewed?.includes(r.index+1)?{revised:true}:{})};r.index++;r.draft=null;r.currentTiming=null;r.finished=r.index===30;return true;}
export function previous(r,expectedIndex=r?.index){if(!r||r.index!==expectedIndex||r.index<=0||r.draft!==null)return false;r.reviewed=[...new Set([...(r.reviewed||[]),Math.min(r.index+1,30),r.index])];r.index--;r.finished=false;r.currentTiming=null;if(r.answers[r.index])r.answers[r.index].revised=true;return true;}
// Commit once and advance together; an event from an old scene cannot answer a new one.
export function commitAnswer(r,pick,expectedIndex,spentMs=null){if(!r||r.index!==expectedIndex||!select(r,pick))return false;return next(r,{assessmentVersion:1,spentMs:Number.isFinite(spentMs)&&spentMs>=0?Math.min(86400000,Math.round(spentMs)):null});}
export function makeReport(r){
 const rounds=buildRounds(r.gender,r.edition),answers=r.answers.filter((a,i)=>a.id===i+1&&validPick(a.pick)),graded=answers.filter(a=>a.id<30),matched=graded.filter(a=>a.pick===rounds[a.id-1].correct),score=graded.length?Math.round(matched.length/graded.length*100):0;
 const own=[0,1,2,3].map(angle=>graded.filter(a=>rounds[a.id-1].angles[a.pick]===angle).length),expected=[0,1,2,3].map(angle=>graded.filter(a=>{const q=rounds[a.id-1];return q.angles[q.correct]===angle;}).length),style=own.indexOf(Math.max(...own)),assessment=assess(rounds,answers),classification=classify(assessment),type=classification.type;
 const metrics=DIMENSIONS.map((label,i)=>{const items=graded.filter(a=>rounds[a.id-1].dimension===i),hits=items.filter(a=>a.pick===rounds[a.id-1].correct).length;return {label,hits,total:items.length,value:items.length?Math.round(hits/items.length*100):null};});
 const weak=[...metrics].filter(m=>m.total).sort((a,b)=>a.value-b.value)[0],strong=[...metrics].filter(m=>m.total).sort((a,b)=>b.value-a.value)[0];
 const misses=graded.filter(a=>a.pick!==rounds[a.id-1].correct),pairs=new Map();for(const a of misses){const q=rounds[a.id-1],key=q.angles[q.correct]+':'+q.angles[a.pick];if(!pairs.has(key))pairs.set(key,{from:ANGLES[q.angles[q.correct]],to:ANGLES[q.angles[a.pick]],count:0,example:a});pairs.get(key).count++;}
 const misconception=[...pairs.values()].sort((a,b)=>b.count-a.count)[0]||null,evidence=misconception?[misconception.example,...misses.filter(a=>a.id!==misconception.example.id).slice(0,1)]:matched.slice(0,1);
 const abilityStrong=[...assessment.skills].filter(s=>s.total).sort((a,b)=>b.value-a.value)[0],abilityWeak=[...assessment.skills].filter(s=>s.total).sort((a,b)=>a.value-b.value)[0];
 return {count:answers.length,total:graded.length,hits:matched.length,score,name:type.name,tagline:type.quote,style,code:type.english.toUpperCase(),type,assessment,classification,abilityStrong,abilityWeak,metrics,weak,strong,perception:own.map((count,i)=>({label:ANGLES[i],count,expected:expected[i]})),misconception,evidence,misses:misses.slice(0,3),balanced:own.filter(n=>n===Math.max(...own)).length>1,closing:answers.find(a=>a.id===30)?.pick??null};
}
