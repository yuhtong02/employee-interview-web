'use strict';
(()=>{
 const button=document.getElementById('connectBackend'),status=document.getElementById('connectionStatus'),label=document.getElementById('connectionLabel'),slot=document.getElementById('frameSlot'),host=document.getElementById('applicationHost'),panel=document.getElementById('connectionPanel');
 let channel=null,frame=null,source=null,sourceOrigin=null,timer=null;
 const googleOrigin=o=>typeof o==='string'&&/^https:\/\/(?:script\.googleusercontent\.com|[a-z0-9-]+\.googleusercontent\.com)$/.test(o);
 function close(message,closed=false){clearTimeout(timer);source=null;sourceOrigin=null;channel=null;if(frame)frame.remove();frame=null;host.hidden=true;panel.hidden=false;panel.className='entry-error';button.disabled=false;button.hidden=false;status.textContent=message;label.textContent=closed?'登入服務暫時無法使用':'登入頁面無法載入';}
 window.addEventListener('message',event=>{
  const d=event.data;if(!frame||!channel||!googleOrigin(event.origin)||!event.source||!d||typeof d!=='object'||d.channel!==channel)return;
  if(d.type==='HR_PAGES_STATUS'&&d.status==='NOT_OPEN'){if(source&&source!==event.source)return;close('登入服務暫時無法使用。請稍後重新載入；若仍有問題，請聯絡系統管理員。',true);return;}
  if(d.type==='HR_PAGES_HELLO'){
   if(source&&source!==event.source)return;source=event.source;sourceOrigin=event.origin;
   event.source.postMessage({type:'HR_PAGES_ACCEPT',channel},event.origin);return;
  }
  if(d.type==='HR_PAGES_READY'&&source===event.source&&sourceOrigin===event.origin){clearTimeout(timer);host.hidden=false;panel.hidden=true;label.textContent='登入介面已連線，請依系統驗證';}
 });
 function connect(){
  if(button.disabled&&frame)return;
  if(window.top!==window.self){close('請直接開啟公司網站入口。');return;}
  const endpoint=window.HR_PAGES_BACKEND?.webAppUrl;
  if(typeof endpoint!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,256}\/exec$/.test(endpoint)){close('正式服務尚未完成連線設定。');return;}
  clearTimeout(timer);if(frame)frame.remove();source=null;sourceOrigin=null;
  channel=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  frame=document.createElement('iframe');frame.title='鈺通營造員工面談暨考績管理系統';frame.referrerPolicy='no-referrer';frame.src=endpoint+'?pagesChannel='+channel;slot.replaceChildren(frame);host.hidden=true;panel.hidden=false;panel.className='entry-loading';button.disabled=true;button.hidden=true;label.textContent='正在確認安全連線';status.textContent='正在載入登入頁面…';
  // Loading an iframe is not evidence of backend readiness or authentication.
  const attempt=channel;
  timer=setTimeout(()=>{if(channel===attempt)close('登入頁面載入逾時。請確認網路連線及公司指定的 Google 帳號，再按「重新載入」。');},45000);
 }
 button.addEventListener('click',connect);
 connect();
})();
