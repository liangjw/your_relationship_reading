// Visible props are diegetic: messages, tickets, calendars and physical actions.
// No narrator explains a character's motive during the game.
const STAGES=[
 [1,['file','10:24 · 客户消息',['方案_v7.pdf','批注：再调整一版']],['note','今晚待交稿',['23:00 截止','□ 草图 1　□ 草图 2　□ 草图 3']]],
 [2,['history','昨天的聊天',['{P}：胃有点不舒服。']],['timecard','本周打卡',['周一　22:30','周二　23:10','周三　22:45','周四　23:20','周五　22:50']]],
 [3,['file','18:00 · 工作群',['会议进行中','附件 +3　新文件 +2']],['history','散步前的聊天',['我：刚才吵得有点凶。','运动记录：步行32分钟']]],
 [4,['calendar','前三个周末',['订票：{N}','预约：{N}','路线：{N}']],['alarm','周日早晨',['07:00　已关闭','08:00　已关闭']]],
 [5,['file','项目文件夹',['方案_v1 → v2 → v3']],['objects','朋友圈配图',['奖牌　冰敷袋']]],
 [6,['group','12:15 · 项目交接',['产品　设计　开发　运营']],['history','上次聚餐的聊天',['我：你到底和谁一起？','{P}：上次也为这件事吵过。'],'输入框里的字删了三次。']],
 [7,['ticket','周末电影',['3排　or　5排','选座中']],['photo','相册 · 2019',['一张旧合照'],'指尖停了两秒。']],
 [8,['notification','前任 · 新消息',['最近过得不好。','尚未回复']],['parcel','快递便签',['物品：相机','收件地址：已填写']]],
 [9,['note','你们的旧便签',['联系边界：一起说清','约定日期：去年春天']],['history','虚构案例 · 消息截屏',['08:37　把开心事先发给另一个人']]],
 [10,['file','桌边的文件',['修改方案','同事署名　昨晚更新']],['notification','锁屏通知',['昨晚谢谢你。'],'手机留在手里，没有离开沙发。']],
 [11,['bill','晚餐账单',['合计 ¥428.00']],['history','上周的微信',['我：下次一起看展？','{P}：最近忙，谢谢你。']]],
 [12,['budget','两张工资单',['年收入　50万 / 20万']],['calendar','周末安排',['旅行　待定','月度预算　已更新']]],
 [13,['allocation','择偶预算 · 100分',['稳定　32','忠诚　28','外貌　10','其他　30']],['allocation','择偶预算 · 100分',['好奇　35','幽默　25','稳定　15','其他　25']]],
 [14,['parcel','桌边的小盒子',['对方送的小物件','待归还']],['ticket','小型演出',['周六　19:30','待订票']]],
 [15,['ticket','展览链接',['周六　14:00','时间被圈了出来']],['history','之前的消息',['上周：“有空出来。”','周二：“有空再约。”']]],
 [16,['draft','输入中',['你总是……','已删除']],['ticket','明早的车票',['07:10 出发'],'揉了揉太阳穴。']],
 [17,['calendar','共享日历 · 新增',['明晚 20:00']],['sticker','你们常用的表情',['伸出爪子的小猫']]],
 [18,['note','桌边的纸',['①　→　②　→　③'],'笔尖已经在纸上画开。'],['objects','桌边的杯子',[],'指尖沿着杯口转了几圈。']],
 [19,['objects','桌边',['凉掉的茶　合上的待办本']],['printer','打印队列',['答辩材料.pdf','状态：卡纸','明早 09:00 使用']]],
 [20,['gesture','客厅',[],'靠近半步，又停下来。'],['gesture','门边',[],'眼眶红了，没有挡住门。']],
 [21,['note','纸上写着',['城市：杭州 / 成都','住哪里：＿＿','时间：＿＿']],['notification','家庭群 · 12条新消息',['“什么时候定日子？”','消息免打扰']]],
 [22,['budget','看房预算',['首付　月供　装修','备用金：被圈了两遍']],['plan','装修平面图',['客厅　卧室　厨房']]],
 [23,['history','刚才 · 过年去哪',['我：今年想去我家过。','{N}的父母：还是回来过吧。']],['history','刚才 · 饭桌上',['“做这行，能有什么前途？”']]],
 [24,['budget','电脑里的表格',['高铁费用　见面次数','请假天数']],['objects','行李箱旁',['你常用的那只杯子'],'放进去，又拿了出来。']],
 [25,['note','纸上的几行字',['采购　清洁','预约维修　负责人：＿＿']],['calendar','两个工作日历',['周六：两人都出差','交房 / 搬家：周六']]],
 [26,['calendar','晚餐清单',['这周六　取消','下个周末　取消']],['notification','周末出行名单',['我　新朋友A　新朋友B']]],
 [27,['ticket','旧电影 · 重映',['放映票 × 2','上个月：“想在影院看一次。”']],['objects','通勤包侧袋',['一把轻巧的折叠伞','上周 我：“又忘带伞，淋雨了。”']]],
 [28,['post','朋友圈',['一个人也挺好的。','10分钟后：已删除']],['ticket','周末车票',['乘客：1人','已出票']]],
 [29,['draft','输入中',['以后都……','已删除']],['history','三天前的聊天',['“我们就到这里吧。”'],'钥匙放回了桌上。']],
 [30,['metro','末班地铁',['23:51　下一站']],['metro','末班地铁',['23:51　下一站']]]
];
export function stageFor(q){const [kind,title,lines,beat='']=STAGES[q.id-1][q.variant+1],sub=s=>s.replaceAll('{P}',q.target.pronoun).replaceAll('{N}',q.target.name);let chat=q.chat;
 if(q.id===20&&q.variant===1)chat=[['我','今天先走了。'],...chat];
 return {kind,title:sub(title),lines:lines.map(sub),beat:sub(beat),chat};}

export function sceneMarkup(q,run,{sceneArt,esc,chapter,order}){const t=q.target,s=stageFor(q);
 const prop=`<div class="comic-prop prop-${s.kind}" role="img" aria-label="${esc([s.title,...s.lines].join('，'))}"><span class="prop-heading">${esc(s.title)}</span>${s.kind==='group'?'<div class="prop-people" aria-hidden="true"><i></i><i></i><i></i><i></i></div>':''}${s.kind==='sticker'?'<svg class="cat-sticker" viewBox="0 0 80 52" aria-hidden="true"><path d="M21 35V13l10 7q9-5 18 0l10-7v22q-2 12-19 12T21 35Z" fill="#fff8ec" stroke="currentColor" stroke-width="2"/><path d="M32 30v2m16-2v2m-13 6q5 5 10 0M59 40q15-10 13-18" fill="none" stroke="currentColor" stroke-width="2"/></svg>':''}${s.lines.map(line=>`<div class="prop-line">${esc(line)}</div>`).join('')}${s.kind==='gesture'?'<span class="gesture-dots" aria-hidden="true">· · ·</span>':''}</div>`;
 return `<header class="play-header"><button class="back-button" data-action="back" data-scene="${q.id}">${run.index===0?'← 返回入口':'← 上一题'}</button><span class="chapter-tag">${esc(chapter)}</span><span class="round-number"><b>${String(q.id).padStart(2,'0')}</b><span> / 30</span></span></header><div class="level-track" aria-label="已完成 ${run.index} 幕，共30幕">${Array.from({length:30},(_,i)=>`<i class="${i<run.index?'done':i===run.index?'current':''}"></i>`).join('')}</div><div class="route-label"><span>${esc(t.name)}</span><span>${esc(t.detail)}</span></div><section class="story-panel" aria-label="${esc(q.title)}"><div class="stage-illustration">${sceneArt(q)}</div>${prop}${s.beat?`<p class="action-beat">${esc(s.beat)}</p>`:''}<div class="chat">${s.chat.map(([who,text])=>who==='镜头'?`<div class="chat-time">${esc(text)}</div>`:`<div class="message ${who==='我'?'mine':''}"><span class="avatar">${esc(who==='我'?'我':t.pronoun)}</span><div class="bubble">${esc(text)}</div></div>`).join('')}</div></section><section class="decision"><h2>${esc(q.prompt)}</h2><div class="choices">${order.map(pick=>`<button class="choice${run.answers[run.index]?.pick===pick?' previous-choice':''}" data-previous="${run.answers[run.index]?.pick===pick}" data-choice="${pick}" data-scene="${q.id}"><span class="choice-dot" aria-hidden="true"></span><span class="choice-copy"><span>${esc(q.choices[pick])}${run.answers[run.index]?.pick===pick?'<i class="previous-label">上次选择</i>':''}</span>${q.bases?`<small>${esc(q.bases[pick].text)}</small>`:''}</span><span class="choice-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></section>`;
}
