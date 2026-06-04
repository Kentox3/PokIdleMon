// ════════════════════════════════════════════════
//  auth.js — Login / Registrierung
// ════════════════════════════════════════════════

document.addEventListener("firebaseReady", function () {
  document.getElementById("loadStatus").textContent = "Prüfe Session...";
  var uid  = localStorage.getItem("idlev2_uid");
  var name = localStorage.getItem("idlev2_name");
  if (uid && name) {
    document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid:uid, name:name } }));
    return;
  }
  document.getElementById("loadScreen").hidden = true;
  document.getElementById("authScreen").hidden = false;
});

function showAuthTab(tab) {
  document.getElementById("loginForm").hidden    = (tab !== "login");
  document.getElementById("registerForm").hidden = (tab !== "register");
  document.getElementById("tabLogin").classList.toggle("active",    tab === "login");
  document.getElementById("tabRegister").classList.toggle("active", tab === "register");
  document.getElementById("authMsg").textContent = "";
}

function setMsg(txt, ok) {
  var el = document.getElementById("authMsg");
  el.textContent = txt;
  el.style.color = ok ? "#22c55e" : "#ef4444";
}

function doLogin() {
  var email = document.getElementById("loginEmail").value.trim();
  var pw    = document.getElementById("loginPassword").value;
  if (!email || !pw) { setMsg("Bitte alle Felder ausfüllen."); return; }
  setMsg("Anmelden…", true);
  emailToKey(email).then(function(key) {
    return dbGet(acctPath(key));
  }).then(function(acct) {
    if (!acct) { setMsg("E-Mail nicht registriert."); return; }
    return hashPassword(pw, acct.salt).then(function(res) {
      if (res.hash !== acct.hash) { setMsg("Falsches Passwort."); return; }
      return dbGet(playerPath(acct.uid)).then(function(player) {
        var pname = (player && player.name) ? player.name : "Trainer";
        localStorage.setItem("idlev2_uid",  acct.uid);
        localStorage.setItem("idlev2_name", pname);
        document.getElementById("authScreen").hidden = true;
        document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid:acct.uid, name:pname } }));
      });
    });
  }).catch(function(e) { setMsg("Fehler: " + e.message); });
}

function doRegister() {
  var name  = document.getElementById("regName").value.trim();
  var email = document.getElementById("regEmail").value.trim();
  var pw    = document.getElementById("regPassword").value;
  if (!name || !email || !pw) { setMsg("Bitte alle Felder ausfüllen."); return; }
  if (name.length < 2 || name.length > 20) { setMsg("Name: 2–20 Zeichen."); return; }
  if (pw.length < 6) { setMsg("Passwort: min. 6 Zeichen."); return; }
  setMsg("Registrieren…", true);
  emailToKey(email).then(function(key) {
    return dbGet(acctPath(key)).then(function(existing) {
      if (existing) { setMsg("E-Mail bereits registriert."); throw new Error("EXISTS"); }
      return hashPassword(pw).then(function(hashed) {
        var uid = "u" + Date.now() + Math.random().toString(36).substr(2, 5);
        return dbSet(acctPath(key), { uid:uid, salt:hashed.salt, hash:hashed.hash, created:Date.now() })
          .then(function() {
            localStorage.setItem("idlev2_uid",  uid);
            localStorage.setItem("idlev2_name", name);
            document.getElementById("authScreen").hidden = true;
            document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid:uid, name:name, isNew:true } }));
          });
      });
    });
  }).catch(function(e) { if (e.message !== "EXISTS") setMsg("Fehler: " + e.message); });
}

function doLogout() {
  if (typeof saveGame === "function") saveGame();
  localStorage.removeItem("idlev2_uid");
  localStorage.removeItem("idlev2_name");
  window.location.reload();
}
