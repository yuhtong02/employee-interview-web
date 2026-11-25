'use strict';
// Static Pages login copy handed to the unchanged GAS login form over the verified channel.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const pagesRoot=process.env.PAGES_ROOT||path.resolve(__dirname,'..');
const google='https://script.googleusercontent.com',pagesOrigin='https://yuhtong02.github.io';

function pages(){
 const events={},elements={},outgoing=[],timers=[];let nonce=0;
 const node=(id,extra={})=>(elements[id]={id,hidden:false,disabled:false,textContent:'',value:'',childNodes:[],attrs:{},classList:{add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener:(n,f)=>events[id+':'+n]=f,replaceChildren(...c){this.childNodes=c;if(id==='frameSlot')this.frame=c[0]},...extra});
 for(const id of ['connectBackend','connectionStatus','connectionLabel','frameSlot','applicationHost','connectionPanel','staticLogin','lookupName','lookupPassword','loginStatus','resetLink'])node(id);
 const submit=node('submit',{childNodes:['登入']});node('employeeLogin',{querySelector:()=>submit});
 const win={HR_PAGES_BACKEND:{webAppUrl:'https://script.google.com/macros/s/SYNTHETIC_DEPLOYMENT_REFERENCE_0123456789/exec'},addEventListener:(n,f)=>events[n]=f};win.top=win;win.self=win;
 const context={window:win,document:{getElementById:id=>id==='staticLogin'?null:elements[id],querySelectorAll:q=>q==='[data-static-login]'?[elements.staticLogin]:[],createElement:t=>t==='iframe'?{contentWindow:{length:0},remove(){this.removed=true}}:{setAttribute(){},className:''},createTextNode:t=>t},crypto:{getRandomValues:a=>a.fill(++nonce)},Uint8Array,Array,clearTimeout:()=>{},setTimeout:f=>{timers.push(f);return timers.length}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(pagesRoot,'pages-bridge.js'),'utf8'),context);
 const frame=elements.frameSlot.frame,channel=frame.src.split('pagesChannel=')[1],source={postMessage:(data,origin)=>outgoing.push({data,origin})};frame.contentWindow[0]=source;frame.contentWindow.length=1;
 const msg=(type,extra={},origin=google,s=source)=>events.message({origin,source:s,data:{type,channel,...extra}});
 const submitForm=(name,password)=>{elements.lookupName.value=name;elements.lookupPassword.value=password;let prevented=false;events['employeeLogin:submit']({preventDefault(){prevented=true}});return prevented};
 return {elements,events,outgoing,timers,channel,source,msg,submitForm,submit};
}
const connect=(x,page='login')=>{x.msg('HR_PAGES_HELLO');x.msg('HR_PAGES_READY',{page})};

test('static login is usable immediately; the GAS frame loads hidden in the background',()=>{const x=pages();assert.equal(x.elements.staticLogin.hidden,false);assert.equal(x.elements.connectionPanel.hidden,true);assert.equal(x.elements.applicationHost.hidden,true);assert.ok(x.elements.frameSlot.frame.src.includes('pagesChannel='));});

test('submit before the secure connection waits, then hands off once to the verified source only',()=>{const x=pages();
 assert.equal(x.submitForm('測試人事','Synthetic-4821'),true);assert.equal(x.elements.lookupPassword.value,'','password cleared from the static page at once');assert.equal(x.submit.disabled,true);assert.equal(x.outgoing.length,0);
 x.msg('HR_PAGES_HELLO');assert.deepEqual(x.outgoing.map(o=>o.data.type),['HR_PAGES_ACCEPT']);
 x.msg('HR_PAGES_READY',{page:'login'});const login=x.outgoing.filter(o=>o.data.type==='HR_PAGES_LOGIN');
 assert.equal(login.length,1);assert.equal(login[0].origin,google);assert.deepEqual({...login[0].data},{type:'HR_PAGES_LOGIN',channel:x.channel,name:'測試人事',password:'Synthetic-4821'});
 assert.equal(x.elements.applicationHost.hidden,false);assert.equal(x.elements.staticLogin.hidden,true);
 x.msg('HR_PAGES_READY',{page:'login'});assert.equal(x.outgoing.filter(o=>o.data.type==='HR_PAGES_LOGIN').length,1,'repeated READY never resends credentials');});

test('submit after the connection hands off immediately; empty fields stay on the static page',()=>{const x=pages();connect(x);assert.equal(x.elements.applicationHost.hidden,true,'login page stays the static copy until used');
 x.submitForm('','');assert.equal(x.outgoing.filter(o=>o.data.type==='HR_PAGES_LOGIN').length,0);assert.match(x.elements.loginStatus.textContent,/姓名及密碼/);
 x.submitForm('測試員工','Synthetic-4821');assert.equal(x.outgoing.filter(o=>o.data.type==='HR_PAGES_LOGIN').length,1);assert.equal(x.elements.applicationHost.hidden,false);});

test('forgot-password opens the GAS reset dialog without sending any credential',()=>{const x=pages();connect(x);x.events['resetLink:click']({preventDefault(){}});const last=x.outgoing.at(-1).data;assert.deepEqual({...last},{type:'HR_PAGES_RESET',channel:x.channel});assert.equal(x.elements.applicationHost.hidden,false);});

test('restored session or an older GAS release shows the GAS page and drops any typed password',()=>{for(const page of ['app',undefined]){const x=pages();x.submitForm('測試員工','Synthetic-4821');x.msg('HR_PAGES_HELLO');x.msg('HR_PAGES_READY',page?{page}:{});assert.equal(x.outgoing.filter(o=>o.data.type==='HR_PAGES_LOGIN').length,0);assert.equal(x.elements.applicationHost.hidden,false);assert.equal(x.submit.disabled,false);}});

test('untrusted origin, wrong channel or a sibling frame never receives credentials',()=>{const x=pages();x.submitForm('測試員工','Synthetic-4821');
 const evil={postMessage:(d,o)=>x.outgoing.push({data:d,origin:o,evil:true})};
 x.msg('HR_PAGES_HELLO',{},'https://script.googleusercontent.com.evil.example');x.events.message({origin:google,source:x.source,data:{type:'HR_PAGES_HELLO',channel:'wrong'}});x.msg('HR_PAGES_HELLO',{},google,evil);x.msg('HR_PAGES_READY',{page:'login'},google,evil);
 assert.equal(x.outgoing.length,0);x.msg('HR_PAGES_HELLO');x.msg('HR_PAGES_READY',{page:'login'});assert.ok(x.outgoing.every(o=>!o.evil&&o.origin===google));});

test('timeout with a pending login discards the password and shows retry',()=>{const x=pages();x.submitForm('測試員工','Synthetic-4821');x.timers[0]();assert.equal(x.elements.connectionPanel.hidden,false);assert.equal(x.elements.connectBackend.hidden,false);assert.equal(x.elements.staticLogin.hidden,true);
 x.msg('HR_PAGES_HELLO');x.msg('HR_PAGES_READY',{page:'login'});assert.equal(x.outgoing.filter(o=>o.data.type==='HR_PAGES_LOGIN').length,0);
 x.events['connectBackend:click']();assert.equal(x.elements.staticLogin.hidden,false);assert.equal(x.submit.disabled,false);});


