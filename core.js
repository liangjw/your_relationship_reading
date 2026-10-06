import {QUESTIONS,DIMENSIONS} from './data.js';
export const VERSION=1;
export function dayKey(date=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function dailyIds(day=dayKey()){const offset=hash(day)%30;return [0,11,22].map(x=>(offset+x)%30+1);}
export function variant(seed,id){return hash(`${seed}:${id}`)%2;}
export function newState(){return {version:VERSION,coins:0,unlocked:[],history:[],days:[],rewards:[],favorites:[],session:null,events:[],sound:false};}
export function loadState(storage){try{const s=JSON.parse(storage.getItem('heart-decoder-v1'));if(s?.version!==VERSION||!Array.isArray(s.history)||!Array.isArray(s.unlocked)||!Number.isFinite(s.coins))return newState();return {...newState(),...s};}catch{return newState();}}
export function summarize(answers){
 const valid=answers.filter(a=>!a.skip);const scored=valid.filter(a=>Number.isInteger(a.blind));
 const hits=scored.filter(a=>a.guess===QUESTIONS.find(q=>q.id===a.id)?.correct[a.variant]).length;
 const changed=scored.filter(a=>a.blind!==a.guess).length;
 // Deliberately an in-game practice index based on selected response actions, not a psychometric scale.
 const vectors=[[90,95,80,75,90],[70,55,90,55,80],[55,80,60,85,55]];
 const withReply=valid.filter(a=>Number.isInteger(a.reply));
 const dimensions=DIMENSIONS.map(([key,label],i)=>({key,label,value:withReply.length?Math.round(withReply.reduce((sum,a)=>sum+vectors[a.reply][i],0)/withReply.length):null}));
 const votes=[0,0,0];withReply.forEach(a=>votes[a.reply]++);
 const type=withReply.length?['直球沟通派','留白观察派','行动解决派'][votes.indexOf(Math.max(...votes))]:'还在认识自己';
 return {count:valid.length,scored:scored.length,hits,changed,accuracy:scored.length?Math.round(hits/scored.length*100):null,dimensions,type};
}
export function compare(a,b){const pairs=a.filter(x=>!x.skip).map(x=>[x,b.find(y=>y.id===x.id&&!y.skip)]).filter(([,y])=>y);return {count:pairs.length,aHits:pairs.filter(([x,y])=>x.partner===y.self).length,bHits:pairs.filter(([x,y])=>y.partner===x.self).length,same:pairs.filter(([x,y])=>x.self===y.self).length};}
export function encodeInvite(session,answers){const p={v:VERSION,ids:session.ids,seed:session.seed,a:answers.map(x=>x.skip?{id:x.id,skip:true}:{id:x.id,self:x.self,partner:x.partner})};return btoa(JSON.stringify(p));}
export function decodeInvite(value){try{if(!value||value.length>5000)return null;const p=JSON.parse(atob(value));if(p.v!==VERSION||typeof p.seed!=='string'||p.seed.length>80||!Array.isArray(p.ids)||p.ids.length<1||p.ids.length>5||new Set(p.ids).size!==p.ids.length||!p.ids.every(id=>Number.isInteger(id)&&QUESTIONS.some(q=>q.id===id&&id<=30))||!Array.isArray(p.a)||p.a.length!==p.ids.length)return null;
 for(let i=0;i<p.ids.length;i++){const x=p.a[i],q=QUESTIONS.find(q=>q.id===x.id);if(x.id!==p.ids[i]||(x.skip!==true&&![x.self,x.partner].every(y=>Number.isInteger(y)&&y>=0&&y<q.options.length)))return null;}return p;}catch{return null;}}
export function complete(state,session){const summary=summarize(session.answers);const eligible=summary.count>0;const key=session.mode==='daily'?`daily:${session.day}`:session.key;const reward=eligible&&!state.rewards.includes(key);if(reward){state.coins+=10;state.rewards.push(key);}if(session.mode==='daily'&&eligible&&!state.days.includes(session.day))state.days.push(session.day);const entry={id:session.uid,key:session.key,title:session.title,at:new Date().toISOString(),mode:session.mode,answers:session.answers,summary,duo:session.duo||null,reward:reward?10:0};if(!state.history.some(x=>x.id===session.uid))state.history.unshift(entry);state.history=state.history.slice(0,80);state.session=null;return entry;}
export function streak(days,today=dayKey()){const set=new Set(days);let count=0;const d=new Date(today+'T12:00:00+08:00');if(!set.has(today))d.setUTCDate(d.getUTCDate()-1);while(set.has(dayKey(d))){count++;d.setUTCDate(d.getUTCDate()-1);}return count;}
