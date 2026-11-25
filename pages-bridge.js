'use strict';
(()=>{
 const button=document.getElementById('connectBackend'),status=document.getElementById('connectionStatus'),label=document.getElementById('connectionLabel'),slot=document.getElementById('frameSlot'),host=document.getElementById('applicationHost'),panel=document.getElementById('connectionPanel');
 // Static copy of the GAS login form, usable at once while the GAS document loads in the background.
 const parts=[...document.querySelectorAll('[data-static-login]')],shell=parts.length?{set hidden(v){for(const p of parts)p.hidden=v},get hidden(){return parts[0].hidden}}:null,form=document.getElementById('employeeLogin'),nameInput=document.getElementById('lookupName'),passwordInput=document.getElementById('lookupPassword'),loginStatus=document.getElementById('loginStatus'),resetLink=document.getElementById('resetLink'),submit=form?.querySelector('button[type=submit]');
 let channel=null,frame=null,source=null,sourceOrigin=null,timer=null,acceptTimer=null,connected=false,pending=null,submitLabel=null;
 const googleOrigin=o=>typeof o==='string'&&/^https:\/\/(?:script\.googleusercontent\.com|[a-z0-9-]+\.googleusercontent\.com)$/.test(o);
 // Check live descendants, not a detached frame's retained parent reference.
 function belongs(peer){if(!frame?.contentWindow)return false;const queue=[frame.contentWindow],seen=new Set();for(let i=0;i<queue.length&&i<48;i++){const w=queue[i];if(w===peer)return true;if(seen.has(w))continue;seen.add(w);try{for(let j=0;j<Math.min(w.length,16);j++)queue.push(w[j]);}catch{}}return false;}
 function stopTimers(){clearTimeout(timer);clearTimeout(acceptTimer);timer=acceptTimer=null;}
 function waiting(on){if(!submit)return;if(on){if(!submitLabel)submitLabel=[...submit.childNodes];const spin=document.createElement('span');spin.className='hr-login-spinner';spin.setAttribute('aria-hidden','true');submit.replaceChildren(spin,document.createTextNode('連線中…'));submit.classList.add('hr-login-busy');submit.setAttribute('aria-busy','true');submit.disabled=true;form.setAttribute('aria-busy','true');}else if(submitLabel){submit.replaceChildren(...submitLabel);submitLabel=null;submit.classList.remove('hr-login-busy');submit.removeAttribute('aria-busy');submit.disabled=false;form.removeAttribute('aria-busy');}}
 function reveal(){host.hidden=false;panel.hidden=true;if(shell)shell.hidden=true;label.textContent='登入介面已連線，請依系統驗證';}
 function close(message,closed=false){stopTimers();connected=false;pending=null;waiting(false);if(passwordInput)passwordInput.value='';source=null;sourceOrigin=null;channel=null;if(frame)frame.remove();frame=null;host.hidden=true;if(shell)shell.hidden=true;panel.hidden=false;panel.className='entry-error';button.disabled=false;button.hidden=false;status.textContent=message;label.textContent=closed?'登入服務暫時無法使用':'登入頁面無法載入';}
 function accept(){if(!source||!sourceOrigin||connected)return;source.postMessage({type:'HR_PAGES_ACCEPT',channel},sourceOrigin);clearTimeout(acceptTimer);const attempt=channel;acceptTimer=setTimeout(()=>{if(channel===attempt&&!connected)accept();},400);}
 // Hand a submitted static form to the GAS login form over the verified channel only, then show the GAS page,
 // which runs the unchanged login request, lockout, MFA and error messages.
 function deliver(){if(!connected||!pending||!source)return;const p=pending;pending=null;
  source.postMessage(p.type==='HR_PAGES_LOGIN'?{type:p.type,channel,name:p.name,password:p.password}:{type:p.type,channel},sourceOrigin);
  waiting(false);reveal();}
 window.addEventListener('message',event=>{
  const d=event.data;if(!frame||!channel||!googleOrigin(event.origin)||!event.source||!d||typeof d!=='object'||d.channel!==channel||!belongs(event.source))return;
  if(d.type==='HR_PAGES_STATUS'&&(d.status==='NOT_OPEN'||d.status==='LOAD_FAILED')){if(source&&source!==event.source&&belongs(source))return;close(d.status==='NOT_OPEN'?'登入服務暫時無法使用。請稍後重新載入；若仍有問題，請聯絡系統管理員。':'登入介面未能啟動，請按重新載入；若持續失敗，請聯絡系統管理員。',d.status==='NOT_OPEN');return;}
  if(d.type==='HR_PAGES_HELLO'){
   if(connected){if(source===event.source&&sourceOrigin===event.origin)source.postMessage({type:'HR_PAGES_ACCEPT',channel},sourceOrigin);return;}
   if(source&&source!==event.source&&belongs(source))return;
   source=event.source;sourceOrigin=event.origin;accept();return;
  }
  if(d.type==='HR_PAGES_READY'&&source===event.source&&sourceOrigin===event.origin){
   connected=true;stopTimers();source.postMessage({type:'HR_PAGES_READY_ACK',channel},sourceOrigin);
   // A GAS release without the hand-off reports no page: show it as before. A restored session opens the app.
   if(d.page==='login'&&shell&&form){if(pending)deliver();}else{pending=null;waiting(false);if(passwordInput)passwordInput.value='';reveal();}
  }
 });
 if(form)form.addEventListener('submit',e=>{e.preventDefault();if(pending||!channel)return;const name=nameInput.value.trim(),password=passwordInput.value;
  if(!name||!password){loginStatus.textContent='請輸入姓名及密碼。';return;}
  loginStatus.textContent='';pending={type:'HR_PAGES_LOGIN',name:nameInput.value,password};passwordInput.value='';
  if(connected)deliver();else waiting(true);});
 if(resetLink)resetLink.addEventListener('click',e=>{e.preventDefault();if(pending||!channel)return;pending={type:'HR_PAGES_RESET'};if(connected)deliver();else waiting(true);});
 function connect(){
  if(button.disabled&&frame)return;
  if(window.top!==window.self){close('請直接開啟公司網站入口。');return;}
  const endpoint=window.HR_PAGES_BACKEND?.webAppUrl;
  if(typeof endpoint!=='string'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,256}\/exec$/.test(endpoint)){close('正式服務尚未完成連線設定。');return;}
  stopTimers();if(frame)frame.remove();source=null;sourceOrigin=null;connected=false;pending=null;waiting(false);
  channel=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  const attempt=channel;frame=document.createElement('iframe');frame.title='鈺通營造員工面談暨考績管理系統';frame.referrerPolicy='no-referrer';frame.onerror=()=>{if(channel===attempt&&!connected)close('Google 登入頁面載入失敗，請確認網路及公司 Google 帳號，再按重新載入。');};frame.src=endpoint+'?pagesChannel='+channel;
  host.hidden=true;button.disabled=true;button.hidden=true;label.textContent='正在確認安全連線';status.textContent='正在載入登入頁面…';
  if(shell&&form){shell.hidden=false;panel.hidden=true;}else{panel.hidden=false;panel.className='entry-loading';}
  timer=setTimeout(()=>{if(channel===attempt&&!connected)close(source?'安全連線確認未完成，請按重新載入。':'Google 登入頁面尚未回應，請確認網路及公司指定的 Google 帳號，再按重新載入。');},45000);
  slot.replaceChildren(frame);
 }
 button.addEventListener('click',connect);connect();
})();
