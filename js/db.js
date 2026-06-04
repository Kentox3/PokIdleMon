// ══════════════════════════════════════════════════════
//  db.js — Firebase (compat API, kein ES-Modul)
// ══════════════════════════════════════════════════════

var firebaseConfig = {
  apiKey:            "AIzaSyCse7ZqdinNvdIE81aLlrM-T9mhmLQbfNM",
  authDomain:        "kinderpunkte.firebaseapp.com",
  databaseURL:       "https://kinderpunkte-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "kinderpunkte",
  storageBucket:     "kinderpunkte.firebasestorage.app",
  messagingSenderId: "692809846345",
  appId:             "1:692809846345:web:7f768feca0a0a5f7ee3998"
};

var _idleApp = (firebase.apps || []).find(function(a) { return a.name === "idlev2"; });
var _app = _idleApp || firebase.initializeApp(firebaseConfig, "idlev2");
var _db  = firebase.database(_app);

var DB_PREFIX = "IdleV2";
var playerPath = function(id)  { return DB_PREFIX + "/players/"  + id; };
var acctPath   = function(key) { return DB_PREFIX + "/accounts/" + key; };

function dbGet(p) {
  return _db.ref(p).get().then(function(snap) { return snap.val(); });
}
function dbSet(p, v) { return _db.ref(p).set(v); }
function dbUpd(p, v) { return _db.ref(p).update(v); }

// Krypto-Helfer
function buf2hex(buf) {
  return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2,"0"); }).join("");
}
function hex2buf(hex) {
  var a = new Uint8Array(hex.length / 2);
  for (var i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i*2, 2), 16);
  return a;
}
function hashPassword(pw, saltHex) {
  var enc  = new TextEncoder();
  var salt = saltHex ? hex2buf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  return crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"])
    .then(function(km) {
      return crypto.subtle.deriveBits({ name:"PBKDF2", salt:salt, iterations:120000, hash:"SHA-256" }, km, 256);
    })
    .then(function(bits) { return { salt: buf2hex(salt), hash: buf2hex(bits) }; });
}
function emailToKey(email) {
  var enc = new TextEncoder();
  return crypto.subtle.digest("SHA-256", enc.encode(email.toLowerCase().trim()))
    .then(function(buf) { return buf2hex(buf).slice(0, 32); });
}

window.dbGet        = dbGet;
window.dbSet        = dbSet;
window.dbUpd        = dbUpd;
window.hashPassword = hashPassword;
window.emailToKey   = emailToKey;
window.playerPath   = playerPath;
window.acctPath     = acctPath;

window._firebaseReady = true;
document.dispatchEvent(new Event("firebaseReady"));
