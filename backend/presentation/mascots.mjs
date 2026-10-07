export const MASCOTS = [
  ['情绪雷达型','耳机小狐狸'],
  ['潜台词翻译官','气泡小兔子'],
  ['行为侦探','侦探小猫'],
  ['理性拆解者','拼图小浣熊'],
  ['共情型玩家','抱抱水豚'],
  ['安全感侦测器','撑伞小企鹅'],
  ['恋爱现实主义者','记账小仓鼠'],
  ['浪漫解码者','送花小鹿'],
  ['性别思维翻译器','传话小水獭'],
  ['性别刻板印象型','撕标签小刺猬'],
  ['直觉型读心者','闪电小黄鸡'],
  ['异性观察家','望远镜小猫头鹰'],
].map(([type,character],i)=>({id:'type-'+String(i+1).padStart(2,'0'),type,character,src:'/assets/mascot-type-'+String(i+1).padStart(2,'0')+'.webp'}));
export function mascotFor(typeId){const mascot=MASCOTS.find(m=>m.id===typeId);if(!mascot)throw new Error('Unknown personality mascot');return mascot;}
