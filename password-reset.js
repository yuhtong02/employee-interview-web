'use strict';
(()=>{
 const login=document.getElementById('employeeLogin');if(!login)return;
 if(!document.getElementById('hrResetDialogStyle')){const style=document.createElement('style');style.id='hrResetDialogStyle';style.textContent=[
  '.hr-reset-dialog{--hr-reset-green:#2f6b4f;--hr-reset-green-dark:#24543e;--hr-reset-green-soft:#e7efe9;--hr-reset-beige:#f8f3e6;--hr-reset-line:#d8cdb4;box-sizing:border-box;width:min(92vw,560px);max-width:92vw;max-height:calc(100vh - 32px);overflow:auto;margin:auto;padding:28px 32px;border:0;border-radius:18px;background:var(--hr-reset-beige);color:#2a2a2a;box-shadow:0 20px 50px rgba(28,52,40,.28);font:inherit;line-height:1.6}',
  '.hr-reset-dialog::backdrop{background:rgba(28,40,34,.45)}',
  '.hr-reset-dialog *{box-sizing:border-box}',
  '.hr-reset-dialog h2{margin:0 0 6px;color:var(--hr-reset-green);font-size:1.4rem;line-height:1.3}',
  '.hr-reset-dialog>p{margin:0 0 18px}',
  '.hr-reset-dialog form{display:grid;gap:8px;margin:0 0 14px}',
  '.hr-reset-dialog form[hidden]{display:none}',
  '.hr-reset-dialog label{font-weight:600;color:var(--hr-reset-green-dark)}',
  '.hr-reset-dialog input+label{margin-top:10px}',
  '.hr-reset-dialog input{width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--hr-reset-line);border-radius:10px;background:#fff;color:inherit;font:inherit;transition:border-color .15s,box-shadow .15s}',
  '.hr-reset-dialog input:focus{border-color:var(--hr-reset-green);outline:none}',
  '.hr-reset-dialog input:focus-visible{box-shadow:0 0 0 3px rgba(47,107,79,.3)}',
  '.hr-reset-dialog button{min-height:44px;padding:10px 18px;border:1px solid var(--hr-reset-green);border-radius:10px;background:var(--hr-reset-green);color:#fff;font:inherit;font-weight:600;cursor:pointer;transition:background-color .15s,color .15s,opacity .15s}',
  '.hr-reset-dialog button:hover:not(:disabled){background:var(--hr-reset-green-dark);border-color:var(--hr-reset-green-dark)}',
  '.hr-reset-dialog button:disabled{opacity:.55;cursor:not-allowed}',
  '.hr-reset-dialog button:focus-visible{outline:3px solid var(--hr-reset-green);outline-offset:2px}',
  '.hr-reset-dialog form>button[type=submit]{margin-top:10px}',
  '.hr-reset-dialog .hr-reset-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}',
  '.hr-reset-dialog .hr-reset-actions button{flex:1 1 160px}',
  '.hr-reset-dialog #resetResend,.hr-reset-dialog button.secondary{background:#fff;color:var(--hr-reset-green)}',
  '.hr-reset-dialog #resetResend{min-width:min(100%,16em);font-variant-numeric:tabular-nums}',
  '.hr-reset-dialog #resetResend:hover:not(:disabled),.hr-reset-dialog button.secondary:hover:not(:disabled){background:var(--hr-reset-green-soft);color:var(--hr-reset-green-dark)}',
  '.hr-reset-dialog button.secondary{width:100%}',
  '.hr-reset-dialog #resetStatus{min-height:1.6em;margin:0 0 14px;color:var(--hr-reset-green-dark)}',
  '@media (max-width:600px){.hr-reset-dialog{padding:22px 18px;border-radius:14px}.hr-reset-dialog .hr-reset-actions{flex-direction:column}.hr-reset-dialog .hr-reset-actions button{flex:none;width:100%}}',
  '@media (prefers-reduced-motion:reduce){.hr-reset-dialog,.hr-reset-dialog *,.hr-reset-dialog::backdrop{transition:none!important;animation:none!important}}'
 ].join('');document.head.append(style);}
 const link=document.createElement('a');link.href='#password-reset';link.textContent='忘記密碼？';login.after(link);
 const dialog=document.createElement('dialog');dialog.className='hr-reset-dialog';dialog.setAttribute('aria-labelledby','resetTitle');
 dialog.innerHTML='<h2 id="resetTitle">忘記密碼</h2><p>最高人事及一般人事可使用已綁定的信箱重設密碼。</p><form id="resetEmailForm"><label for="resetEmail">已綁定的 Email</label><input id="resetEmail" type="email" autocomplete="email" required maxlength="254"><button type="submit">寄送驗證碼</button></form><form id="resetCodeForm" hidden><label for="resetCode">信箱收到的 6 位數驗證碼</label><input id="resetCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required><div class="hr-reset-actions" role="group" aria-label="驗證碼操作"><button type="submit">驗證</button><button id="resetResend" type="button" disabled>重新寄送（請稍候 60 秒）</button></div></form><form id="resetPasswordForm" hidden><label for="resetNewPassword">新密碼（4～20 字元）</label><input id="resetNewPassword" type="password" autocomplete="new-password" minlength="4" maxlength="20" required><label for="resetConfirmPassword">確認新密碼</label><input id="resetConfirmPassword" type="password" autocomplete="new-password" minlength="4" maxlength="20" required><button type="submit">確認重設密碼</button></form><p id="resetStatus" role="status" aria-live="polite"></p><button id="resetClose" type="button" class="secondary">返回登入</button>';
 document.body.append(dialog);const $=id=>dialog.querySelector('#'+id),forms=['resetEmailForm','resetCodeForm','resetPasswordForm'],resendWaiting='重新寄送（請稍候 60 秒）';let requestToken=null,resetToken=null,email='',generation=0,timer=null,busy=false,busyGeneration=0,current='resetEmailForm';
 function focusStage(){if(dialog.hidden)return;const scope=current?$(current):null,active=document.activeElement;if(scope&&scope.contains(active)&&!active.disabled)return;(scope?scope.querySelector('input'):$('resetClose'))?.focus();}
 function stage(id){current=id;for(const f of forms)$(f).hidden=f!==id;focusStage();}
 function resetResend(){const resend=$('resetResend');resend.disabled=true;resend.textContent=resendWaiting;}
 function cooldown(g,seconds=60){if(g!==generation)return;const resend=$('resetResend');resend.disabled=true;resend.textContent='重新寄送（請稍候 '+seconds+' 秒）';timer=setTimeout(()=>{timer=null;if(g!==generation)return;if(seconds>1)cooldown(g,seconds-1);else{resend.disabled=false;resend.textContent='重新寄送';}},1000);}
 function clear(){generation++;clearTimeout(timer);timer=null;requestToken=resetToken=null;email='';resetResend();for(const input of dialog.querySelectorAll('input'))input.value='';for(const f of forms){$(f).querySelector('button[type=submit]').disabled=busy;$(f).removeAttribute('aria-busy');}}
 function close(){clear();dialog.close?.();dialog.hidden=true;link.focus();}
 $('resetClose').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 link.onclick=event=>{event.preventDefault();clear();stage('resetEmailForm');$('resetStatus').textContent=busy?'上一個請求仍在處理中，完成後即可重新申請。':'';dialog.hidden=false;if(dialog.showModal&&!dialog.open)dialog.showModal();$('resetEmail').focus();};
 async function call(action,body){const r=await fetch('/api/portal/password-reset/'+action,{method:'POST',body:JSON.stringify({...body,operationId:crypto.randomUUID()})});let d;try{d=await r.json();}catch{throw Error('連線未能確認，請稍後再試。');}if(!r.ok){if(d.code==='PASSWORD_POLICY')throw Error('密碼需 4～20 字元，不可包含姓名、常見弱密碼或同字元重複。');if(d.code==='PASSWORD_CONFIRMATION_REQUIRED')throw Error('兩次新密碼必須一致。');throw Error('無法完成驗證；請確認代碼及有效期限，稍後再試。');}return d;}
 async function work(form,message,action){if(busy)return;busy=true;const g=busyGeneration=generation,button=form.querySelector('button[type=submit]');button.disabled=true;form.setAttribute('aria-busy','true');$('resetStatus').textContent=message;try{await action(g);}catch(error){if(g===generation)$('resetStatus').textContent=error.message;}finally{busy=false;if(g===generation){button.disabled=false;form.removeAttribute('aria-busy');focusStage();}else if(!dialog.hidden){for(const f of forms)$(f).querySelector('button[type=submit]').disabled=false;$('resetStatus').textContent='前次請求已結束，可重新申請。';}}}
 async function send(g){const d=await call('request',{email});if(g!==generation)return;requestToken=d.requestToken;resetToken=null;$('resetCode').value='';resetResend();clearTimeout(timer);stage('resetCodeForm');$('resetStatus').textContent='若信箱符合帳號及寄送條件，將收到驗證碼。有效期限五分鐘，請勿轉交他人。';cooldown(g);}
 $('resetEmailForm').onsubmit=event=>{event.preventDefault();if(!busy)email=$('resetEmail').value.trim();work(event.target,'正在處理，請勿重複點選。',send);};
 $('resetResend').onclick=()=>{if(busy)return;const g=generation;resetResend();work($('resetCodeForm'),'正在處理，請稍候。',send).finally(()=>{if(g===generation&&current==='resetCodeForm'&&!timer){$('resetResend').disabled=false;$('resetResend').textContent='重新寄送';}});};
 $('resetCodeForm').onsubmit=event=>{event.preventDefault();work(event.target,'正在驗證…',async g=>{const code=$('resetCode').value;try{const d=await call('verify',{requestToken,code});if(g!==generation)return;if(d.verified!==true||typeof d.resetToken!=='string')throw Error('無法確認驗證結果，請重新申請。');resetToken=d.resetToken;stage('resetPasswordForm');$('resetStatus').textContent='驗證成功，請在五分鐘內設定新密碼。';}finally{if(g===generation)$('resetCode').value='';}});};
 $('resetPasswordForm').onsubmit=event=>{event.preventDefault();if(busy)return;if($('resetNewPassword').value!==$('resetConfirmPassword').value){$('resetStatus').textContent='兩次新密碼必須一致。';return;}work(event.target,'正在安全儲存新密碼…',async g=>{try{const d=await call('complete',{resetToken,newPassword:$('resetNewPassword').value,confirmPassword:$('resetConfirmPassword').value});if(g!==generation)return;if(d.changed!==true)throw Error('尚無法確認重設完成，請稍後再試。');resetToken=requestToken=null;stage(null);$('resetStatus').textContent='密碼已重設，舊登入已撤銷。請返回登入，使用原姓名與新密碼。';}finally{if(g===generation){$('resetNewPassword').value='';$('resetConfirmPassword').value='';}}});};
 dialog.hidden=true;
})();
