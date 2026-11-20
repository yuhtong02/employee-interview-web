'use strict';
(()=>{
 const button=document.getElementById('connectBackend'),status=document.getElementById('connectionStatus'),label=document.getElementById('connectionLabel'),slot=document.getElementById('frameSlot'),host=document.getElementById('applicationHost'),panel=document.getElementById('connectionPanel');
 let channel=null,frame=null,source=null,sourceOrigin=null,timer=null;
 const googleOrigin=o=>typeof o==='string'&&/^https:\/\/(?:script\.googleusercontent\.com|[a-z0-9-]+\.googleusercontent\.com)$/.test(o);
 function close(message){clearTimeout(timer);source=null;sourceOrigin=null;channel=null;if(frame)frame.remove();frame=null;host.hidden=true;panel.hidden=false;button.disabled=false;status.textContent=message;label.textContent='服務尚未開放';}
 window.addEventListener('message',event=>{
  const d=event.data;if(!frame||!channel||!googleOrigin(event.origin)||!event.source||!d||typeof d!=='object'||d.channel!==channel)return;
  if(d.type==='HR_PAGES_STATUS'&&d.status==='NOT_OPEN'){close('正式後端尚未開放登入。名冊匯入與資料儲存目前不可使用，請勿輸入私人資料。');return;}
  if(d.type==='HR_PAGES_HELLO'){
   if(source&&source!==event.source)return;source=event.source;sourceOrigin=event.origin;
   event.source.postMessage({type:'HR_PAGES_ACCEPT',channel},event.origin);return;
  }
  if(d.type==='HR_PAGES_READY'&&source===event.source&&sourceOrigin===event.origin){clearTimeout(timer);host.hidden=false;panel.hidden=true;label.textContent='登入介面已連線，請依系統驗證';}
 });
 button.addEventListener('click',()=>{
  if(window.top!==window.self){close('請直接開啟公司網站入口。');return;}
  const endpoint=window.HR_PAGES_BACKEND?.webAppUrl;
  if(typeof endpoint!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,256}\/exec$/.test(endpoint)){close('正式服務尚未完成連線設定。');return;}
  clearTimeout(timer);if(frame)frame.remove();source=null;sourceOrigin=null;
  channel=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  frame=document.createElement('iframe');frame.title='鈺通營造員工面談系統';frame.referrerPolicy='no-referrer';frame.src=endpoint+'?pagesChannel='+channel;slot.replaceChildren(frame);host.hidden=true;button.disabled=true;status.textContent='正在確認安全連線；目前尚未登入，也尚未儲存任何資料。';
  // Loading an iframe is not evidence of backend readiness or authentication.
  timer=setTimeout(()=>close('尚未建立安全連線。可能需要公司 Google 授權，或後端尚未完成部署／開放；登入、匯入與儲存仍不可使用。'),20000);
 });
})();
