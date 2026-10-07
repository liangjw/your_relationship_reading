import {SKILLS,CORE_AXES,ASSESSMENT_VERSION} from './assessment-data.js';
export const CLASSIFIER_VERSION='12-types-v1';
// Groups are display navigation for the matrix, never a first-stage classifier.
export const PERSONALITIES=[
 ['radar','情绪雷达型','Emotional Radar','❤️','情绪读取','敏感 · 细腻 · 情绪识别','细微的停顿，你也愿意认真听。','有时雷达亮了，只是TA今天很累。','你听见了沉默，也记得给它留一个问号。'],
 ['subtext','潜台词翻译官','Subtext Translator','💬','动机理解','语言 · 潜台词 · 语境','你会把一句话放回它发生的经历里。','翻译可以有多个版本，别急着当原文。','别人读一句话，你会多看一眼上下文。'],
 ['detective','行为侦探','Behavior Detective','🔍','动机理解','行动 · 细节 · 后续','你留意的是行动有没有接上话语。','一次没做到，也可能是当时真的做不到。','你不只听台词，也看下一场怎么演。'],
 ['rational','理性拆解者','Rational Decoder','🧠','动机理解','逻辑 · 情境 · 变量','你愿意把时间、任务和条件一起放进判断。','找到了办法，也别忘了问一句感受。','你的脑内有流程图，关系里也需要一句抱抱。'],
 ['empath','共情型玩家','Empathic Reader','🤝','情绪读取','代入 · 感受 · 理解','你常从对方的感受出发，尝试站近一点。','“我会这样”是入口，未必是TA的答案。','你愿意站在TA那边，也别忘了问TA站在哪。'],
 ['security','安全感侦测器','Security Reader','🛡️','关系判断','承诺 · 位置 · 边界','你留意关系位置、平等与可被拒绝的边界。','有时TA只是忙了，不是关系亮起红灯。','你在意“我们”，也记得让彼此保留“我”。'],
 ['realist','恋爱现实主义者','Relationship Realist','🏠','关系判断','生活 · 责任 · 长期','你能把钱、工作、家庭和时间放到同一张桌上。','计划很周全，浪漫也可以在预算里。','别人问爱不爱，你已经想好周末怎么买菜。'],
 ['romantic','浪漫解码者','Romantic Reader','💘','情绪读取','心动 · 邀约 · 仪式','你留意小愿望、暧昧信号和继续靠近的动作。','心动的画面好看，后续安排也值得看。','你看得见心动的细节，也要给现实留个座位。'],
 ['translator','性别思维翻译器','Gender Translator','🔄','动机理解','换视角 · 看经历 · 少预设','本局不同经历里，你会留意角色的具体线索。','理解一个角色，不等于掌握一种性别。','你愿意换个视角，而不是换一套性别剧本。'],
 ['stereotype','性别刻板印象型','Stereotype Thinker','🎭','关系判断','默认剧本 · 快速归类 · 待验证','熟悉的默认剧本，会让你很快形成一个猜测。','猜中的动机，也不能证明“男生／女生都这样”。','你的默认剧本很熟，这次试试让TA自己改台词。'],
 ['intuitive','直觉型读心者','Intuitive Reader','✨','情绪读取','第一感觉 · 节奏 · 判断','本局你较快做出判断，也接住了不少心声。','第一感觉可以很准，再问一句也不减分。','第一感觉先到了，确认这一步也别迟到。'],
 ['observer','异性观察家','Gender Observer','👁️','关系判断','综合 · 情境 · 个体','本局你在多个频道都接住了角色的具体经历。','这一局懂得多，现实仍要听本人说。','你没急着定义TA，你先认真看了这一幕。']
].map(([id,name,english,symbol,group,keywords,strength,blind,quote],index)=>({id,name,english,symbol,group,keywords,strength,blind,quote,number:index+1}));
const pct=(hits,total)=>total?Math.round(hits/total*100):null;
export function assess(rounds,answers){
 const graded=answers.filter(a=>rounds[a.id-1]?.correct!==null),skills=SKILLS.map(s=>{const items=graded.filter(a=>rounds[a.id-1].assessment.skills.includes(s.id)&&(s.id!=='behavior'||a.assessmentVersion===ASSESSMENT_VERSION)),matched=items.filter(a=>a.pick===rounds[a.id-1].correct);return {...s,hits:matched.length,total:items.length,value:pct(matched.length,items.length)};});
 const axes=CORE_AXES.map(axis=>{const available=skills.filter(s=>axis.skills.includes(s.id)&&s.total),value=available.length?Math.round(available.reduce((n,s)=>n+s.value,0)/available.length):null;return {...axis,value};});
 const probes=graded.filter(a=>a.assessmentVersion===ASSESSMENT_VERSION&&rounds[a.id-1].assessment.probe),bias=['gender_rule','self_same'].map((kind,i)=>{const selected=probes.filter(a=>rounds[a.id-1].assessment.probe[a.pick][0]===kind);return {id:i?'projection':'stereotype',label:i?'自我投射':'性别刻板印象',kind,count:selected.length,total:probes.length,value:pct(selected.length,probes.length),evidence:selected.slice(0,3)};});
 const timed=graded.filter(a=>!a.revised&&Number.isFinite(a.spentMs)&&a.spentMs>=800&&a.spentMs<=180000),fast=timed.filter(a=>a.spentMs<=8000),tempo={count:timed.length,fast:fast.length,fastRate:pct(fast.length,timed.length),medianMs:timed.length?[...timed].sort((a,b)=>a.spentMs-b.spentMs)[Math.floor(timed.length/2)].spentMs:null,eligible:timed.length>=20};
 const matches=graded.filter(a=>a.pick===rounds[a.id-1].correct),counter=graded.filter(a=>a.assessmentVersion===ASSESSMENT_VERSION&&rounds[a.id-1].assessment.contextFlex),counterHits=counter.filter(a=>a.pick===rounds[a.id-1].correct).length;
 const angleCounts=[0,1,2,3].map(angle=>graded.filter(a=>rounds[a.id-1].angles[a.pick]===angle).length),romanticItems=graded.filter(a=>rounds[a.id-1].assessment.romance),romantic=pct(romanticItems.filter(a=>a.pick===rounds[a.id-1].correct).length,romanticItems.length);
 return {version:CLASSIFIER_VERSION,skills,axes,bias,tempo,score:pct(matches.length,graded.length)||0,counter:{hits:counterHits,total:counter.length,value:pct(counterHits,counter.length)},angles:angleCounts.map(n=>pct(n,graded.length)||0),romantic};
}
const v=(a,id)=>a.skills.find(s=>s.id===id)?.value??50;
// Compound scores are product rules, not psychometric norms. Fixed order breaks ties.
export function classify(a){
 const emotion=v(a,'emotion'),motive=v(a,'motive'),subtext=v(a,'subtext'),behavior=v(a,'behavior'),security=v(a,'security'),longterm=v(a,'longterm'),feel=a.angles[0],practical=a.angles[1],safe=a.angles[2],space=a.angles[3],st=a.bias[0],pr=a.bias[1];
 const ranks=[
 ['radar',.45*emotion+.2*subtext+.35*feel],
 ['subtext',.5*subtext+.25*motive+.25*space],
 ['rational',.35*motive+.2*longterm+.45*practical],
 ['empath',.3*emotion+.2*security+.5*feel+(pr.value>=25?5:0)],
 ['security',.5*security+.15*motive+.35*safe],
 ['realist',.6*longterm+.15*motive+.25*practical],
 ['romantic',.55*(a.romantic??50)+.2*emotion+.25*feel]
 ];
 if(a.skills.find(s=>s.id==='behavior').total>=4)ranks.push(['detective',.55*behavior+.2*motive+.25*space]);
 if(a.counter.total>=8)ranks.push(['translator',.3*motive+.2*behavior+.2*subtext+.3*a.counter.value-(st.value??0)*.15-(pr.value??0)*.1]);
 // Special candidates require evidence, not just a fabricated low/high score.
 if(st.total>=6&&st.value>=50)ranks.push(['stereotype',100+st.value*.01]);
 if(a.tempo.eligible&&a.tempo.fastRate>=70&&a.score>=55)ranks.push(['intuitive',94+a.tempo.fastRate*.01]);
 if(a.score>=85&&a.axes.every(x=>x.value!==null&&x.value>=70)&&st.total>=6&&st.value<=25&&pr.value<=25)ranks.push(['observer',110+a.score*.01]);
 ranks.sort((x,y)=>y[1]-x[1]||PERSONALITIES.findIndex(p=>p.id===x[0])-PERSONALITIES.findIndex(p=>p.id===y[0]));const winner=ranks[0],type=PERSONALITIES.find(t=>t.id===winner[0]);
 return {type,ranks:ranks.map(([id,value])=>({id,value:Math.round(value*100)/100})),tie:ranks.length>1&&Math.abs(ranks[0][1]-ranks[1][1])<.0001,reason: type.id==='observer'?'多个能力频道与综合匹配都较高，且本局显式泛化／投射选择较少。':type.id==='stereotype'?`在${st.total}个判断依据场景中，${st.count}次选择了按性别泛化的理由。`:type.id==='intuitive'?`${a.tempo.count}幕有效计时里，${a.tempo.fast}幕在8秒内作答，且匹配分达到55。`:'综合能力、动机偏好与归因证据的组合最接近此固定类型。'};
}
