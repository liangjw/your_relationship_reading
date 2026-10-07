// Optional production integration. Empty configuration performs no network requests.
const endpoint=document.querySelector('meta[name="wechat-signature-endpoint"]')?.content;
export async function setupWeChatShare({title,desc,link,imgUrl}){
 if(!endpoint||!/MicroMessenger/i.test(navigator.userAgent))return false;
 try{
  const api=new URL(endpoint,location.href);if(api.origin!==location.origin)throw Error('Signature endpoint must be same origin');
  const response=await fetch(`${api.href}?url=${encodeURIComponent(location.href.split('#')[0])}`,{credentials:'same-origin'});
  if(!response.ok)throw Error('WeChat signature unavailable');
  const config=await response.json();for(const field of ['appId','timestamp','nonceStr','signature'])if(!config[field])throw Error('Invalid signature config');
  if(!window.wx)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://res.wx.qq.com/open/js/jweixin-1.6.0.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
  window.wx.config({debug:false,...config,jsApiList:['updateAppMessageShareData','updateTimelineShareData']});
  await new Promise((resolve,reject)=>{window.wx.ready(resolve);window.wx.error(reject);});
  window.wx.updateAppMessageShareData({title,desc,link,imgUrl});window.wx.updateTimelineShareData({title,link,imgUrl});return true;
 }catch(error){console.warn('微信分享未启用：',error.message);return false;}
}
