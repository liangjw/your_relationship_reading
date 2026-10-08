export const INVITE_TITLE = 'TA说「没事」，你听懂了几层意思？';
export const INVITE_TEXT = '20幕生活小剧场，测测你是懂TA，还是脑补大师。玩完解锁你的专属角色卡！';

export function invitation(publicUrl) {
  return {title:INVITE_TITLE,text:INVITE_TEXT,url:publicUrl+'/?from=invite'};
}

export function reportShare(publicUrl, report) {
  return {
    title:`我抽到了「${report.type.name}」！你是懂TA，还是脑补大师？`,
    text:report.type.quote+' 20幕生活小剧场，来看看你会解锁哪张角色卡。',
    url:publicUrl+'/?from=report',
    poster:'/api/poster.svg',
    filename:'我的异性理解人格.png'
  };
}
