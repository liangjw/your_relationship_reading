// Presentation effects only; scores, questions, types and progression stay on the server.
let enabled=false, revealDialog=null;
const cues=new Set();
const stopCues=()=>{for(const cue of cues)cue.pause();cues.clear();};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function configureEffects(value){enabled=value;if(!enabled)stopCues();}
export function playEffect(effect){
  if(!enabled||document.hidden||!effect)return;
  const cue=new Audio(effect.src);cue.volume=effect.volume??0.2;cues.add(cue);
  cue.addEventListener('ended',()=>cues.delete(cue),{once:true});
  cue.play().catch(()=>cues.delete(cue));
}
export function stopEffects(){stopCues();if(revealDialog?.open)revealDialog.close();}
export function turnScene(root,{back=false}={}){
  if(!root||reduced())return;
  root.classList.add(back?'scene-returning':'scene-arriving');
}
export function revealCard(card,effect){
  if(!card||reduced())return false;
  if(revealDialog?.open)revealDialog.close();
  const dialog=document.createElement('dialog');dialog.className='summon-dialog';dialog.setAttribute('aria-label','理解人格揭晓');
  dialog.innerHTML='<button class="summon-skip" type="button">跳过动画 →</button><p class="summon-caption" role="status">20幕线索，汇成了你的理解人格</p><div class="summon-arena"><div class="summon-halo" aria-hidden="true"></div><div class="summon-sparkles" aria-hidden="true">'+Array.from({length:12},(_,i)=>`<i class="summon-spark" style="--spark:${i}"></i>`).join('')+'</div><div class="summon-card" aria-hidden="true"><div class="summon-face summon-back"><b>♡</b><span>心动译码</span></div><div class="summon-face summon-front"></div></div><div class="summon-flash" aria-hidden="true"></div></div>';
  dialog.querySelector('.summon-front').append(card.cloneNode(true));document.body.append(dialog);
  if(typeof dialog.showModal!=='function'){dialog.remove();card.classList.add('card-revealed');return false;}
  revealDialog=dialog;
  let revealTimer;
  const finish=()=>{clearTimeout(revealTimer);dialog.remove();if(revealDialog===dialog)revealDialog=null;card.classList.add('card-revealed');card.tabIndex=-1;card.focus({preventScroll:true});};
  dialog.addEventListener('cancel',stopCues);
  dialog.addEventListener('close',finish,{once:true});dialog.querySelector('.summon-skip').addEventListener('click',()=>{stopCues();dialog.close();});
  dialog.showModal();playEffect(effect);revealTimer=setTimeout(()=>dialog.open&&dialog.close(),2800);return true;
}
