// ════════════════════════════════════════════════
//  auth.js — Login mit Nutzername + 6-stelliger PIN
// ════════════════════════════════════════════════

function hideEl(id)    { var el = document.getElementById(id); if (el) el.style.display = "none"; }
function showEl(id, d) { var el = document.getElementById(id); if (el) el.style.display = d || "block"; }

function auth_init() {
  var status = document.getElementById("loadStatus");
  if (status) status.textContent = "Prüfe Session...";
  var uid  = localStorage.getItem("pokidlemon_uid");
  var name = localStorage.getItem("pokidlemon_name");
  if (uid && name) {
    hideEl("authScreen");
    document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid:uid, name:name } }));
    return;
  }
  hideEl("loadScreen");
  showEl("authScreen", "flex");
}

function switchToRegister() { hideEl("loginCard"); showEl("registerCard","block"); var i=document.getElementById("regUsername");if(i)i.focus(); }
function switchToLogin()    { hideEl("registerCard"); showEl("loginCard","block"); var i=document.getElementById("loginUsername");if(i)i.focus(); }

function setLoginMsg(txt,ok){ var el=document.getElementById("loginMsg");if(!el)return;el.textContent=txt;el.style.color=ok?"#22c55e":"#ef4444"; }
function setRegMsg(txt,ok)  { var el=document.getElementById("registerMsg");if(!el)return;el.textContent=txt;el.style.color=ok?"#22c55e":"#ef4444"; }

function usernameToKey(username) {
  var enc=new TextEncoder();
  return crypto.subtle.digest("SHA-256",enc.encode(username.toLowerCase().trim()))
    .then(buf=>Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,32));
}
function buf2hex(buf){return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");}
function hex2buf(hex){var a=new Uint8Array(hex.length/2);for(var i=0;i<a.length;i++)a[i]=parseInt(hex.substr(i*2,2),16);return a;}

function hashPIN(pin,saltHex){
  var enc=new TextEncoder();
  var salt=saltHex?hex2buf(saltHex):crypto.getRandomValues(new Uint8Array(16));
  return crypto.subtle.importKey("raw",enc.encode(String(pin)),"PBKDF2",false,["deriveBits"])
    .then(km=>crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"},km,256))
    .then(bits=>({salt:buf2hex(salt),hash:buf2hex(bits)}));
}

function doLogin(){
  var username=(document.getElementById("loginUsername").value||"").trim();
  var pin=(document.getElementById("loginPin").value||"").trim();
  if(!username||!pin){setLoginMsg("Bitte alle Felder ausfüllen.");return;}
  if(!/^\d{6}$/.test(pin)){setLoginMsg("PIN muss genau 6 Ziffern haben.");return;}
  setLoginMsg("Anmelden…",true);
  usernameToKey(username).then(key=>dbHole(acctPath(key))).then(acct=>{
    if(!acct){setLoginMsg("Nutzername nicht gefunden.");return;}
    return hashPIN(pin,acct.salt).then(res=>{
      if(res.hash!==acct.hash){setLoginMsg("Falsche PIN.");return;}
      var dname=acct.displayName||username;
      localStorage.setItem("pokidlemon_uid",acct.uid);
      localStorage.setItem("pokidlemon_name",dname);
      hideEl("authScreen");
      document.dispatchEvent(new CustomEvent("gameReady",{detail:{uid:acct.uid,name:dname}}));
    });
  }).catch(e=>setLoginMsg("Fehler: "+e.message));
}

function doRegister(){
  var username=(document.getElementById("regUsername").value||"").trim();
  var pin=(document.getElementById("regPin").value||"").trim();
  var pin2=(document.getElementById("regPin2").value||"").trim();
  if(!username||!pin||!pin2){setRegMsg("Bitte alle Felder ausfüllen.");return;}
  if(username.length<3||username.length>16){setRegMsg("Nutzername: 3–16 Zeichen.");return;}
  if(!/^\d{6}$/.test(pin)){setRegMsg("PIN muss genau 6 Ziffern haben.");return;}
  if(pin!==pin2){setRegMsg("PINs stimmen nicht überein.");return;}
  setRegMsg("Konto wird erstellt…",true);
  usernameToKey(username).then(key=>
    dbHole(acctPath(key)).then(existing=>{
      if(existing){setRegMsg("Nutzername bereits vergeben.");throw new Error("EXISTS");}
      return hashPIN(pin).then(hashed=>{
        var uid="u"+Date.now()+Math.random().toString(36).substr(2,5);
        return dbSetze(acctPath(key),{uid,displayName:username,salt:hashed.salt,hash:hashed.hash,created:Date.now()})
          .then(()=>{
            localStorage.setItem("pokidlemon_uid",uid);
            localStorage.setItem("pokidlemon_name",username);
            hideEl("authScreen");
            document.dispatchEvent(new CustomEvent("gameReady",{detail:{uid,name:username,isNew:true}}));
          });
      });
    })
  ).catch(e=>{if(e.message!=="EXISTS")setRegMsg("Fehler: "+e.message);});
}

function pinOnly(el){el.value=el.value.replace(/\D/g,"").slice(0,6);}

function doLogout(){
  if(typeof speichern==="function")speichern();
  localStorage.removeItem("pokidlemon_uid");
  localStorage.removeItem("pokidlemon_name");
  window.location.reload();
}
