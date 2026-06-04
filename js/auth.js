// ════════════════════════════════════════════════
//  auth.js — Login / Registrierung
//  FIX: Kein hidden-Attribut mehr, direkt display:none setzen
// ════════════════════════════════════════════════

function hideEl(id)   { var el = document.getElementById(id); if (el) el.style.display = "none"; }
function showEl(id, d){ var el = document.getElementById(id); if (el) el.style.display = d || "flex"; }

document.addEventListener("firebaseReady", function () {
  var status = document.getElementById("loadStatus");
  if (status) status.textContent = "Prüfe Session...";

  var uid  = localStorage.getItem("idlev2_uid");
  var name = localStorage.getItem("idlev2_name");

  if (uid && name) {
    // Session gefunden → Lade-Screen bleibt kurz sichtbar, dann weiter
    hideEl("authScreen");
    document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid:uid, name:name } }));
    return;
  }

  // Kein Spielstand → Auth-Screen zeigen
  hideEl("loadScreen");
  showEl("authScreen", "flex");
});

function showAuthTab(tab) {
  var lf = document.getElementById("loginForm");
  var rf = document.getElementById("registerForm");
  if (lf) lf.style.display = tab === "login"    ? "block" : "none";
  if (rf) rf.style.display = tab === "register" ? "block" : "none";
  var tl = document.getElementById("tabLogin");
  var tr = document.getElementById("tabRegister");
  if (tl) tl.classList.toggle("active", tab === "login");
  if (tr) tr.classList.toggle("active", tab === "register");
  var msg = document.getElementById("authMsg");
  if (msg) msg.textContent = "";
}

function setMsg(txt, ok) {
  var el = document.getElementById("authMsg");
  if (!el) return;
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
        hideEl("authScreen");
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
            hideEl("authScreen");
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
