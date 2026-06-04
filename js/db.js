// ══════════════════════════════════════════════════════
//  db.js — Firebase (compat API) — PokIdleMon
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

var _app = (firebase.apps || []).find(function(a){ return a.name==="pokidlemon"; })
        || firebase.initializeApp(firebaseConfig, "pokidlemon");
var _db  = firebase.database(_app);

var DB_PREFIX  = "PokIdleMon";
var playerPath = function(id)  { return DB_PREFIX + "/players/"  + id; };
var acctPath   = function(key) { return DB_PREFIX + "/accounts/" + key; };

function dbGet(p)    { return _db.ref(p).get().then(function(s){ return s.val(); }); }
function dbSet(p, v) { return _db.ref(p).set(v); }
function dbUpd(p, v) { return _db.ref(p).update(v); }

window.dbGet      = dbGet;
window.dbSet      = dbSet;
window.dbUpd      = dbUpd;
window.playerPath = playerPath;
window.acctPath   = acctPath;

window._firebaseReady = true;
document.dispatchEvent(new Event("firebaseReady"));
