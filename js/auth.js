// Simple login with username + 6 digit PIN.
// This is intentionally lightweight for a small private test group.

function hideEl(id) { var el = document.getElementById(id); if (el) el.style.display = "none"; }
function showEl(id, d) { var el = document.getElementById(id); if (el) el.style.display = d || "block"; }

function auth_init() {
  var status = document.getElementById("loadStatus");
  if (status) status.textContent = "Pruefe Session...";
  var uid = localStorage.getItem("pokidlemon_uid");
  var name = localStorage.getItem("pokidlemon_name");
  if (uid && name) {
    hideEl("authScreen");
    document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid: uid, name: name } }));
    return;
  }
  hideEl("loadScreen");
  showEl("authScreen", "flex");
}

function switchToRegister() {
  hideEl("loginCard");
  showEl("registerCard", "block");
  var i = document.getElementById("regUsername");
  if (i) i.focus();
}

function switchToLogin() {
  hideEl("registerCard");
  showEl("loginCard", "block");
  var i = document.getElementById("loginUsername");
  if (i) i.focus();
}

function setLoginMsg(txt, ok) {
  var el = document.getElementById("loginMsg");
  if (!el) return;
  el.textContent = txt;
  el.style.color = ok ? "#22c55e" : "#ef4444";
}

function setRegMsg(txt, ok) {
  var el = document.getElementById("registerMsg");
  if (!el) return;
  el.textContent = txt;
  el.style.color = ok ? "#22c55e" : "#ef4444";
}

function normalizeUsername(username) {
  return String(username || "").trim();
}

function accountKey(username) {
  return normalizeUsername(username).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function accountPath(username) {
  return DB_PREFIX + "/accounts/" + accountKey(username);
}

function validUsername(username) {
  return /^[a-zA-Z0-9_-]{3,16}$/.test(username);
}

function validPin(pin) {
  return /^\d{6}$/.test(pin);
}

function finishLogin(acct, username, isNew) {
  var displayName = acct.displayName || username;
  localStorage.setItem("pokidlemon_uid", acct.uid);
  localStorage.setItem("pokidlemon_name", displayName);
  hideEl("authScreen");
  document.dispatchEvent(new CustomEvent("gameReady", {
    detail: { uid: acct.uid, name: displayName, isNew: !!isNew }
  }));
}

function doLogin() {
  var username = normalizeUsername(document.getElementById("loginUsername").value);
  var pin = String(document.getElementById("loginPin").value || "").trim();
  if (!username || !pin) { setLoginMsg("Bitte alle Felder ausfuellen."); return; }
  if (!validPin(pin)) { setLoginMsg("PIN muss genau 6 Ziffern haben."); return; }

  setLoginMsg("Anmelden...", true);
  dbHole(accountPath(username)).then(function(acct) {
    if (!acct) { setLoginMsg("Nutzername nicht gefunden."); return; }
    if (String(acct.pin) !== pin) { setLoginMsg("Falsche PIN."); return; }
    finishLogin(acct, username, false);
  }).catch(function(e) {
    setLoginMsg("Fehler: " + e.message);
  });
}

function doRegister() {
  var username = normalizeUsername(document.getElementById("regUsername").value);
  var pin = String(document.getElementById("regPin").value || "").trim();
  var pin2 = String(document.getElementById("regPin2").value || "").trim();
  if (!username || !pin || !pin2) { setRegMsg("Bitte alle Felder ausfuellen."); return; }
  if (!validUsername(username)) { setRegMsg("Nutzername: 3-16 Zeichen, nur Buchstaben, Zahlen, _ oder -."); return; }
  if (!validPin(pin)) { setRegMsg("PIN muss genau 6 Ziffern haben."); return; }
  if (pin !== pin2) { setRegMsg("PINs stimmen nicht ueberein."); return; }

  setRegMsg("Konto wird erstellt...", true);
  dbHole(accountPath(username)).then(function(existing) {
    if (existing) { setRegMsg("Nutzername bereits vergeben."); return; }
    var uid = "u_" + accountKey(username);
    var acct = {
      uid: uid,
      displayName: username,
      username: username,
      pin: pin,
      authMode: "simple-pin",
      created: Date.now()
    };
    return dbSetze(accountPath(username), acct).then(function() {
      finishLogin(acct, username, true);
    });
  }).catch(function(e) {
    setRegMsg("Fehler: " + e.message);
  });
}

function pinOnly(el) {
  el.value = el.value.replace(/\D/g, "").slice(0, 6);
}

function doLogout() {
  if (typeof speichern === "function") speichern();
  localStorage.removeItem("pokidlemon_uid");
  localStorage.removeItem("pokidlemon_name");
  window.location.reload();
}
