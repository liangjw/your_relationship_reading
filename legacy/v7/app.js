import {sceneMarkup} from './scene-stage.js';
import {reportMarkup} from './game-view.js';
import {buildRounds,targetFor,CHAPTERS,optionOrder} from './game-data.js';
import {STORAGE_KEY,newRun,loadRun,commitAnswer,previous,next,makeReport} from './game-core.js';
import {setupWeChatShare} from './wechat-share.js';
import {createActiveTimer} from './active-timer.js';
import {sceneIllustration,coverIllustration} from './illustrations.js';
import {enhanceReport} from './report-ai.js';
const $=s=>document.querySelector(s),app=$('#app');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
let run=loadRun(storage);
if(run&&run.draft!==null){next(run);try{storage.setItem(STORAGE_KEY,JSON.stringify(run));}catch{}}
let screen=run?.atEntry?'intro':run?.finished?'report':run?'play':'intro',toastTimer,posterURL,dialogFocus,advancing=false;
const timer=createActiveTimer();
function beginTiming(){if(screen!=='play'||advancing||document.hidden)return;const current=run.currentTiming;timer.begin(run.index,current?.index===run.index?current.ms:0);}
function suspendTiming(){if(screen!=='play'||advancing)return;timer.pause();const state=timer.snapshot();if(state.index===run.index){run.currentTiming=state;save();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendTiming();else beginTiming();});
window.addEventListener('pagehide',suspendTiming);window.addEventListener('pageshow',beginTiming);
const paths={arrow:'M5 12h14m-6-6 6 6-6 6',share:'M12 16V3m-4 4 4-4 4 4 M5 12v9h14v-9',close:'m6 6 12 12 M6 18 18 6',play:'m8 4 12 8-12 8z'};
function icon(name){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';}
function save(){try{storage.setItem(STORAGE_KEY,JSON.stringify(run));}catch{toast('此浏览器暂不能保存进度，仍可继续玩。');}}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
function shell(content){document.body.dataset.screen=screen;document.body.dataset.mood=screen==='play'?(run.index<5?'cream':run.index<15?'rose':run.index<28?'plum':'light'):'cream';app.innerHTML='<main class="game-frame '+screen+' fade-in">'+content+'</main>';}
function logo(){return '<div class="game-logo"><b>心动译码<span>。</span></b><small>THE RELATIONSHIP ISSUE</small></div>';}
function personalityIcon(style){
 const accessory=['<path d="M38 53h23v17H38zM68 53h23v17H68zM61 59h7"/><path d="M101 21c-4-8-15-3-10 3l4 3v5M95 38v1"/>','<path d="m100 14-12 18h10l-7 17 21-23h-11z" fill="#f5d476"/>','<path d="M100 20q14-16 14 1-1 14-17 9M98 31l-5 10" fill="#9ab398"/>','<path d="M96 37s-17-10-16-19c1-9 12-10 16-3 5-7 16-6 16 3 0 9-16 19-16 19z" fill="#ec8166"/>'][style];
 return `<svg class="brain-character" viewBox="0 0 125 125" aria-hidden="true"><path d="M23 85c-15-1-19-20-9-28-7-12 0-26 14-27 2-13 18-20 29-12 13-12 29-4 30 8 17-1 26 15 20 29 12 11 7 30-10 34-5 17-23 19-34 10-11 11-31 7-35-6z" fill="#fff8ec"/><path d="M24 40q12-7 17 5M61 19v17M86 31q-10 4-10 13M19 63q10-2 14 8M88 86q-8-5-4-14" fill="none" stroke="#bca7d4"/><circle cx="49" cy="60" r="3" fill="#30332b"/><circle cx="79" cy="60" r="3" fill="#30332b"/><path d="M57 76q7 9 15 0" fill="none"/><path d="M34 72h9M86 72h9" stroke="#ec8166" stroke-width="4"/>${accessory}</svg>`;
}
function sceneArt(q){return sceneIllustration(q);}

function intro(){timer.reset();shell(`${logo()}<section class="intro-head"><span class="eyebrow">A PLAYABLE LOVE MAGAZINE / VOL. 01</span><h1>你真的<br>懂<em>异性</em>吗<span class="question-mark">？</span></h1><p>30个生活瞬间。<br>你听见一句话，还是没说出口的那一句？</p></section><div class="intro-comic">${coverIllustration()}<span class="cover-caption">“没事，你玩吧。”<br><i>真的没事，还是另有心声？</i></span></div><div class="intro-bottom"><h2 class="entry-question">我是</h2><div class="gender-entry"><button data-gender="male"><b>男性</b><small>走进她的生活瞬间 →</small></button><button data-gender="female"><b>女性</b><small>走进他的生活瞬间 →</small></button></div><div class="mini-tags"><span>约 5–8 分钟</span><span>12种理解人格</span><span>最后生成报告</span></div><p class="tiny-note">无需登录 · 单人体验 · 进度保存在本机<br>选择决定本局角色路线，也可按想体验的路线选择。</p></div>`);}
function play(){const q=buildRounds(run.gender,run.edition)[run.index];shell(sceneMarkup(q,run,{sceneArt,esc,chapter:CHAPTERS[Math.floor(run.index/5)],order:optionOrder(run.seed,q.id)}));if(!advancing)beginTiming();}
function report(){timer.reset();const result=makeReport(run),signature=JSON.stringify(run.answers);shell(reportMarkup(result,run,{logo,sceneArt,esc,icon}));enhanceReport(result,run).then(copy=>{if(screen!=='report'||run.seed!==copy.seed||JSON.stringify(run.answers)!==signature)return;for(const key of ['opening','closing']){const node=document.querySelector(`[data-report-copy="${key}"]`);if(node&&copy[key])node.textContent=copy[key];}});}
function render(){({intro,play,report}[screen]||intro)();}
function start(gender){timer.reset();if(!(run?.atEntry&&run.gender===gender)){run=newRun(gender,crypto.randomUUID?.()||String(Date.now()),run?.finished?run.edition+1:run?.edition||0);}delete run.atEntry;screen='play';save();render();window.scrollTo(0,0);}
function goBack(sceneId){if(advancing||!run||sceneId!==run.index+1)return;timer.reset();closeDialog();if(run.index===0){run.atEntry=true;run.currentTiming=null;run.reviewed=[...new Set([...(run.reviewed||[]),1])];screen='intro';}else if(previous(run)){screen='play';}save();render();window.scrollTo(0,0);}
function choose(pick,sceneId){
 if(advancing)return;const timing=timer.snapshot();if(!commitAnswer(run,pick,sceneId-1,timing.index===run.index?timing.ms:null))return;timer.reset();
 advancing=true;document.querySelectorAll('[data-choice],[data-action="back"]').forEach(b=>{b.disabled=true;if(b.dataset.choice!==undefined&&Number(b.dataset.choice)===pick)b.classList.add('picked');});
 save();setTimeout(()=>{
  screen=run.finished?'report':'play';render();window.scrollTo(0,0);
  if(run.finished){advancing=false;return;}
  const choices=$('.choices'),buttons=[...document.querySelectorAll('[data-choice],[data-action="back"]')];choices.dataset.transitioning='true';buttons.forEach(b=>b.disabled=true);
  setTimeout(()=>{buttons.forEach(b=>b.disabled=false);delete choices.dataset.transitioning;advancing=false;beginTiming();},310);
 },140);
}
function showDialog(content){dialogFocus=document.activeElement;$('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button class="modal-close" data-action="close" aria-label="关闭">${icon('close')}</button>${content}</section></div>`;document.body.style.overflow='hidden';$('.modal-close').focus();}
function closeDialog(){if(!$('#modal-root').innerHTML)return;$('#modal-root').innerHTML='';document.body.style.overflow='';dialogFocus?.focus();if(posterURL){URL.revokeObjectURL(posterURL);posterURL=null;}}
function shareURL(){const u=new URL(location.href);u.hash='';u.search='';u.searchParams.set('from','report');return u.href;}
function localAddress(){return ['localhost','127.0.0.1',''].includes(location.hostname)||location.protocol==='file:';}
async function copyLink(){try{await navigator.clipboard.writeText(shareURL());toast('已复制，发给朋友也来解码。');}catch{$('#share-link')?.focus();$('#share-link')?.select();toast('可以长按链接复制。');}}
function drawText(ctx,text,x,y,maxWidth,lineHeight){let line='';for(const char of text){if(ctx.measureText(line+char).width>maxWidth){if(/[。，！？、”」]/.test(char)){ctx.fillText(line+char,x,y);y+=lineHeight;line='';}else{ctx.fillText(line,x,y);y+=lineHeight;line=char;}}else line+=char;}if(line)ctx.fillText(line,x,y);return y;}
async function share(){
 if(!run?.finished)return;
 const r=makeReport(run),canvas=document.createElement('canvas');canvas.width=750;canvas.height=1360;const c=canvas.getContext('2d');
 c.fillStyle='#f8f4ec';c.fillRect(0,0,750,1360);c.fillStyle='#292423';c.font='28px serif';c.fillText('心动译码。',55,73);c.font='14px sans-serif';c.fillText('THE RELATIONSHIP ISSUE',427,70);c.strokeStyle='#bda8a0';c.lineWidth=1;c.beginPath();c.moveTo(55,95);c.lineTo(695,95);c.stroke();
 c.fillStyle='#893a4d';c.font='18px sans-serif';c.fillText('你的异性理解人格 / 12 TYPES',55,146);c.font='74px "Segoe UI Emoji",sans-serif';c.fillText(r.type.symbol,52,242);c.font='49px serif';c.fillStyle='#292423';c.fillText(r.name,55,315);c.font='18px sans-serif';c.fillStyle='#893a4d';c.fillText(r.code,55,356);c.font='20px sans-serif';c.fillStyle='#756963';c.fillText(r.type.keywords,55,401);
 c.fillStyle='#f0e2e2';c.fillRect(55,438,640,173);c.fillStyle='#6d394b';c.font='32px serif';drawText(c,'“'+r.tagline+'”',81,496,560,49);
 c.fillStyle='#292423';c.font='23px sans-serif';c.fillText('异性理解力',55,669);c.font='83px serif';c.fillStyle='#893a4d';c.fillText(String(r.score),55,764);c.font='22px sans-serif';c.fillText('/ 100',179,759);c.font='18px sans-serif';c.fillStyle='#756963';c.fillText(`${r.hits} / ${r.total} 幕与创作心声吻合`,302,746);
 for(let i=0;i<3;i++){const axis=r.assessment.axes[i],y=835+i*58;c.font='20px sans-serif';c.fillStyle='#756963';c.fillText(axis.label,55,y);c.fillStyle='#e5d8d0';c.fillRect(195,y-13,380,5);c.fillStyle='#a16573';c.fillRect(195,y-13,380*(axis.value??0)/100,5);c.font='26px serif';c.fillText(String(axis.value??'—'),619,y);}
 c.strokeStyle='#bda8a0';c.beginPath();c.moveTo(55,995);c.lineTo(695,995);c.stroke();c.fillStyle='#292423';c.font='28px serif';c.fillText('你会是哪一种理解人格？',55,1053);c.font='20px sans-serif';c.fillStyle='#756963';drawText(c,'30个生活瞬间，走进TA没说出口的心声。',55,1100,440,33);
 const url=shareURL();if(!localAddress()&&window.qrcode){const qr=window.qrcode(0,'M');qr.addData(url);qr.make();const n=qr.getModuleCount(),size=132/n;c.fillStyle='#fff';c.fillRect(537,1040,158,158);c.fillStyle='#292423';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))c.fillRect(550+x*size,1053+y*size,Math.ceil(size),Math.ceil(size));}
 c.font='17px sans-serif';c.fillStyle='#756963';c.fillText(localAddress()?'本机预览 · 发布后生成游戏二维码':'扫码也来测一次 · 无需登录',55,1195);c.font='16px sans-serif';c.fillText('固定产品类型 · 本局创作情境匹配，非心理诊断',55,1263);c.fillText('也许，我们没有想象中那么不同。',55,1300);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob){toast('分享卡生成失败，请重试。');return;}
 closeDialog();posterURL=URL.createObjectURL(blob);showDialog(`<h2 id="dialog-title">把这一面的你，发给TA。</h2><p>微信里可以长按图片保存，再发给朋友或朋友圈。</p><img class="poster" data-type="${r.type.id}" data-score="${r.score}" src="${posterURL}" alt="${esc(r.name)}，异性理解力${r.score}，人格分享卡"><div class="share-actions"><a class="game-cta" href="${posterURL}" download="心动译码-人格报告.png">保存图片</a><button class="secondary-button" id="native-share">分享图片</button></div><label class="share-label" for="share-link">朋友点开后，直接进入同一个单人游戏</label><input id="share-link" readonly value="${esc(url)}"><button class="secondary-button full" data-action="copy">复制游戏链接</button>${localAddress()?'<p class="micro-note">当前是本机预览。部署到公开HTTPS地址后，链接和二维码才能供外部朋友打开。</p>':''}`);
 $('#native-share').onclick=async()=>{const file=new File([blob],'heart-decoder.png',{type:'image/png'});try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'心动译码 · '+r.name});else toast('请长按图片保存，或使用保存图片按钮。');}catch(error){if(error.name!=='AbortError')toast('请保存图片后分享。');}};
}
document.addEventListener('click',event=>{const el=event.target.closest('button,a');if(!el)return;if(el.dataset.gender){start(el.dataset.gender);return;}if(el.dataset.action==='back'){if(event.detail>1)return;goBack(Number(el.dataset.scene));return;}if(el.dataset.choice!==undefined){if(event.detail>1)return;choose(Number(el.dataset.choice),Number(el.dataset.scene));return;}({share,close:closeDialog,copy:copyLink,replay:()=>{screen='intro';render();window.scrollTo(0,0);}}[el.dataset.action])?.();});
document.addEventListener('keydown',event=>{const dialog=$('.modal');if(!dialog)return;if(event.key==='Escape')closeDialog();if(event.key==='Tab'){const items=[...dialog.querySelectorAll('button,a,input')],first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){last.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first.focus();event.preventDefault();}}});
render();if(run?.contentUpdated){delete run.contentUpdated;save();toast('第25幕已换成新的生活情境，请重新作答。其余选择仍保留。');}setupWeChatShare({title:'你真的懂异性吗？',desc:'30幕漫画，猜异性心声，看看你有多懂TA。',link:shareURL(),imgUrl:new URL('assets/manga-cover-v7.webp',location.href).href});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
