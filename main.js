import { createClient } from "@supabase/supabase-js";
import "./style.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const LANGS = [
["auto","Auto detect"],["en","English"],["rw","Kinyarwanda"],["fr","Français"],["sw","Kiswahili"],
["es","Español"],["pt","Português"],["de","Deutsch"],["it","Italiano"],["ar","العربية"],
["zh","中文"],["ja","日本語"],["ko","한국어"],["hi","हिन्दी"],["ru","Русский"],
["tr","Türkçe"],["nl","Nederlands"],["pl","Polski"],["uk","Українська"],["am","አማርኛ"],
["yo","Yorùbá"],["zu","isiZulu"],["xh","isiXhosa"],["ha","Hausa"],["ig","Igbo"],
["so","Soomaali"],["sw","Kiswahili"],["el","Ελληνικά"],["he","עברית"],["th","ไทย"],
["vi","Tiếng Việt"],["id","Bahasa Indonesia"],["ms","Bahasa Melayu"],["bn","বাংলা"],
["ta","தமிழ்"],["te","తెలుగు"],["ur","اردو"],["fa","فارسی"]
];

let state = { page:"call", user:null, callLang:"en", voice:"normal", recording:false, callActive:false, messages:[], groups:[] };

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function langOptions(selected="en") { return LANGS.map(([v,n])=>`<option value="${v}" ${v===selected?"selected":""}>${n}</option>`).join(""); }

function app() {
  document.body.innerHTML = `
  <div class="app">
    <header><div class="brand"><span class="logo">V</span><div><b>Votranse</b><small>Voice Translator</small></div></div>
      <button id="settings" class="icon">⚙</button></header>
    <main id="main"></main>
    <nav>
      <button data-page="chat">💬<span>Chat</span></button>
      <button data-page="call" class="active">📞<span>Call</span></button>
      <button data-page="group">👥<span>Group</span></button>
      <button data-page="profile">👤<span>Profile</span></button>
    </nav>
    <div id="toast"></div>
  </div>`;
  document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{state.page=b.dataset.page; render()});
  $("#settings").onclick=permissions;
  render();
  initAuth();
}

async function initAuth(){
  if(!supabase){state.user={id:"demo",phone:"Demo mode"}; render(); return;}
  const {data:{session}}=await supabase.auth.getSession();
  state.user=session?.user || null; render();
  supabase.auth.onAuthStateChange((_e,s)=>{state.user=s?.user||null;render()});
}

function render(){
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===state.page));
  $("#main").innerHTML = state.page==="call"?callPage():
    state.page==="chat"?chatPage():state.page==="group"?groupPage():profilePage();
  bindPage();
}

function callPage(){
 return `<section class="page call-page">
   <div class="hero"><span class="status-dot"></span><span>${state.callActive?"Call in progress":"Ready to translate your voice"}</span></div>
   <div class="person"><div class="avatar">P</div><h2>${state.callActive?"People 1":"Voice Call"}</h2><p>${state.callActive?"Connected":"Select a contact or enter a phone number"}</p></div>
   <div class="phone-row"><input id="phone" inputmode="tel" placeholder="+250 7xx xxx xxx"><button id="startCall">Call</button></div>
   <div class="controls">
     <button class="${state.callActive?'on':''}" id="add">➕<span>Add call</span></button>
     <button id="mute">🎙️<span>Mute</span></button>
     <button id="keypad">⌨️<span>Keypad</span></button>
     <button id="record" class="${state.recording?'on':''}">⏺️<span>Record</span></button>
   </div>
   <div class="translate-card">
     <div class="card-title">Select Language <span>Call only</span></div>
     <label>Your language<select id="myLang">${langOptions("rw")}</select></label>
     <label>Other person's language<select id="callLang">${langOptions(state.callLang)}</select></label>
     <div class="magic"><div><b>✨ Magic Voice</b><small>Change the voice you hear</small></div>
       <select id="voice"><option value="normal">Original</option><option value="soft">Soft voice</option><option value="deep">Deep voice</option></select>
     </div>
     <button class="primary" id="speak">🎤 Speak & Translate</button>
     <div id="translation" class="translation">Translation will appear here.</div>
   </div>
   ${state.callActive?'<button class="hang" id="hang">End Call</button>':''}
 </section>`;
}

function chatPage(){
 return `<section class="page"><div class="section-head"><div><h1>Chat</h1><p>Messages</p></div><button class="round">＋</button></div>
 <div class="search"><input id="chatSearch" placeholder="Search messages or phone number"></div>
 <div class="empty"><div>💬</div><h2>Your conversations</h2><p>Start a chat using a phone number.</p>
 <button class="primary" id="newChat">New chat</button></div>
 </section>`;
}
function groupPage(){
 return `<section class="page"><div class="section-head"><div><h1>Group</h1><p>Talk with people in your groups</p></div><button class="round" id="newGroup">＋</button></div>
 <div class="group-list"><div class="group"><div class="avatar">G</div><div><b>My first group</b><small>Add members by phone number</small></div><span>›</span></div></div>
 <button class="primary wide" id="contacts">📇 Choose contacts</button></section>`;
}
function profilePage(){
 const phone=state.user?.phone || "";
 return `<section class="page"><div class="profile-top"><div class="avatar big">V</div><h1>Profile</h1><p>${esc(phone||"Not signed in")}</p></div>
 <div class="list"><button id="edit">✏️ <span>Edit profile</span>›</button><button id="share">🔗 <span>Share profile</span>›</button><button id="permission">🔐 <span>Permissions</span>›</button><button id="logout">🚪 <span>${state.user?.id==="demo"?"Sign in":"Sign out"}</span>›</button></div>
 <div class="note">Share profile can be sent to WhatsApp, Waxtix, Facebook, Instagram and other apps using your device share menu.</div></section>`;
}

function bindPage(){
 $("#startCall")?.addEventListener("click",()=>{state.callActive=true; toast("Call started"); render()});
 $("#hang")?.addEventListener("click",()=>{state.callActive=false; toast("Call ended"); render()});
 $("#record")?.addEventListener("click",()=>{state.recording=!state.recording; toast(state.recording?"Recording started":"Recording stopped"); render()});
 $("#callLang")?.addEventListener("change",e=>state.callLang=e.target.value);
 $("#voice")?.addEventListener("change",e=>{state.voice=e.target.value;toast("Magic Voice: "+e.target.options[e.target.selectedIndex].text)});
 $("#speak")?.addEventListener("click",speechTranslate);
 $("#newChat")?.addEventListener("click",()=>newChat());
 $("#newGroup")?.addEventListener("click",()=>toast("Group creation screen ready"));
 $("#contacts")?.addEventListener("click",requestContacts);
 $("#permission")?.addEventListener("click",permissions);
 $("#share")?.addEventListener("click",shareProfile);
 $("#edit")?.addEventListener("click",editProfile);
 $("#logout")?.addEventListener("click",async()=>{if(supabase&&state.user?.id!=="demo")await supabase.auth.signOut();else state.user=null;render()});
}

async function speechTranslate(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){toast("Voice recognition is not supported by this browser.");return}
 const r=new SR(); r.lang=$("#myLang")?.value==="rw"?"rw-RW":$("#myLang")?.value||"en-US"; r.interimResults=false;
 r.onstart=()=>toast("Listening…");
 r.onerror=()=>toast("Microphone/voice recognition error");
 r.onresult=async e=>{
   const text=e.results[0][0].transcript;
   $("#translation").textContent=`${text} → ${langName(state.callLang)} translation`;
   try{
     const translated=await translate(text,r.lang.split("-")[0],state.callLang);
     $("#translation").textContent=translated;
     speak(translated,state.callLang);
   }catch{toast("Translation service is not configured yet.");}
 };
 r.start();
}
async function translate(text,from,to){
 if(from===to) return text;
 const url=import.meta.env.VITE_TRANSLATION_URL;
 if(!url) return `[${langName(to)}] ${text}`;
 const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:text,source:from,target:to,format:"text"})});
 if(!res.ok) throw new Error("translation");
 const d=await res.json(); return d.translatedText||d.translation||text;
}
function speak(text,lang){
 if(!speechSynthesis)return;
 const u=new SpeechSynthesisUtterance(text); u.lang=lang==="rw"?"rw-RW":lang;
 u.rate=state.voice==="deep"?.8:state.voice==="soft"?.95:1; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function langName(code){return LANGS.find(x=>x[0]===code)?.[1]||code}
async function newChat(){const phone=prompt("Enter phone number");if(phone)toast("Chat with "+phone+" is ready")}
async function requestContacts(){
 if(!("contacts" in navigator)){toast("Contact picker is not supported on this browser.");return}
 try{const c=await navigator.contacts.select(["name","tel"],{multiple:true});toast(`${c.length} contact(s) selected`)}catch{toast("Contacts permission was cancelled.")}
}
async function permissions(){
 try{await navigator.mediaDevices?.getUserMedia({audio:true});}catch{}
 try{await navigator.geolocation?.getCurrentPosition(()=>{},()=>{});}catch{}
 toast("Microphone, contacts and location permissions can be allowed by your device/browser.");
}
async function shareProfile(){
 if(navigator.share){await navigator.share({title:"Votranse profile",text:"Connect with me on Votranse."})}
 else navigator.clipboard?.writeText(location.href).then(()=>toast("Profile link copied"));
}
function editProfile(){const name=prompt("Display name"); if(name)toast("Profile name saved locally")}
function toast(s){const t=$("#toast");if(!t)return;t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
app();
