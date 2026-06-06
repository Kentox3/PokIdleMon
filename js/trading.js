// ═══════════════════════════════════════════════════════════════
//  trading.js — Spieler-Tauschsystem (Azuria City)
//
//  Vollständig eigenständig — koppelt sich per Patch an renderCityHub.
//  Nutzt Firebase unter PokIdleMon/trades/
//
//  Trade-Evolutionen (Gen 1):
//    Kadabra (64) → Alakazam (65)
//    Machoke (67) → Machamp  (68)
//    Graveler (75) → Golem   (76)
//    Haunter  (93) → Gengar  (94)
// ═══════════════════════════════════════════════════════════════

// ── Konfiguration ─────────────────────────────────────────────
var TRADE_EVOS   = { 64:65, 67:68, 75:76, 93:94 };
var TRADES_PATH  = "PokIdleMon/trades";
var TRADE_TTL_MS = 5 * 60 * 1000; // 5 Minuten → auto-cleanup
var POLL_MS      = 2000;           // Polling-Intervall

// ── Interner State ─────────────────────────────────────────────
var _tc = {
  tradeId:     null,   // aktueller Raum
  role:        null,   // "host" | "guest"
  poll:        null,   // setInterval-Handle
  overlay:     null,   // DOM-Overlay
  lastData:    null,   // letzter Firebase-Snapshot
  myPkmnIdx:   null,   // gewählter Party-Index
  chatSeen:    0,      // gesehene Chat-Nachrichten
};

// ── Firebase-Wrapper ────────────────────────────────────────────
function _tcGet(sub, cb) {
  var p = TRADES_PATH + (sub ? "/" + sub : "");
  dbGet(p).then(function(v){ cb(v); }).catch(function(){ cb(null); });
}
function _tcSet(sub, val)  { return dbSet(TRADES_PATH + "/" + sub, val); }
function _tcUpd(sub, val)  { return dbUpd(TRADES_PATH + "/" + sub, val); }
function _tcDel(sub)       { return dbSet(TRADES_PATH + "/" + sub, null); }

function _roomPath(sub) {
  return _tc.tradeId + (sub ? "/" + sub : "");
}

// ── Pokémon-Serialisierung für Firebase ─────────────────────────
function _serializePkmn(p) {
  if(!p) return null;
  var pd = PKMN[p.dexId];
  return {
    dexId: p.dexId, level: p.level,
    nick: p.nick || (pd ? pd.name : "?"),
    shiny: !!p.shiny, currentHP: p.currentHP, maxHP: p.maxHP,
  };
}

// ── City-Hub Patch: Button in Azuria City einhängen ─────────────
(function patchCityHub() {
  if(typeof renderCityHub !== "function") {
    setTimeout(patchCityHub, 150); return;
  }
  var _orig = renderCityHub;
  renderCityHub = function(zone) {
    _orig(zone);
    if(!zone || zone.id !== "cerulean_city") return;
    // Trade-Button in Hub-View injizieren
    var container = document.getElementById("viewWorld");
    if(!container) return;
    var existing = container.querySelector(".tc-hub-inject");
    if(existing) return; // Schon drin
    var wrapper = document.createElement("div");
    wrapper.className = "tc-hub-inject";
    wrapper.innerHTML =
      "<div class='hub-section-title' style='margin-top:12px'>🔄 Tausch-Center</div>" +
      "<button class='tc-hub-btn' onclick='openTradeCenter()'>🔄 Spieler-Tausch öffnen</button>";
    // Vor dem letzten Element einfügen (vor dem Ende des city-view div)
    var cityView = container.querySelector(".city-view");
    if(cityView) cityView.appendChild(wrapper);
    else container.appendChild(wrapper);
  };
})();

// ════════════════════════════════════════════════════════════════
//  OVERLAY MANAGEMENT
// ════════════════════════════════════════════════════════════════
function openTradeCenter() {
  _closeOverlay();
  _tc.overlay = document.createElement("div");
  _tc.overlay.id = "tcOverlay";
  _tc.overlay.className = "tc-overlay";
  document.body.appendChild(_tc.overlay);
  _showLobby();
}

function _closeOverlay() {
  _leaveCurrentTrade();
  var el = document.getElementById("tcOverlay");
  if(el && el.parentNode) el.parentNode.removeChild(el);
  _tc.overlay = null;
}

function _setContent(html) {
  var o = document.getElementById("tcOverlay"); if(!o) return;
  o.innerHTML =
    "<div class='tc-box'>" +
      "<div class='tc-header'><span class='tc-title'>🔄 Tausch-Center</span>" +
        "<button class='tc-close' onclick='_closeOverlay()'>✕</button></div>" +
      "<div class='tc-body' id='tcBody'>" + html + "</div>" +
    "</div>";
}

// ════════════════════════════════════════════════════════════════
//  LOBBY — Liste offener Räume
// ════════════════════════════════════════════════════════════════
function _showLobby() {
  _setContent("<div class='tc-loading'>Lade Räume...</div>");
  _loadLobby();
}

function _loadLobby() {
  _tcGet("", function(trades) {
    var now = Date.now();
    var open = [];
    if(trades) {
      Object.keys(trades).forEach(function(id) {
        var t = trades[id];
        if(!t || !t.host) return;
        // Nur "waiting" Räume zeigen, nicht zu alt, nicht eigener
        if(t.status !== "waiting") return;
        if(now - (t.createdAt || 0) > TRADE_TTL_MS) {
          _tcDel(id); return; // Cleanup alter Räume
        }
        if(t.host.uid === STATE.uid) return; // Eigenen nicht anzeigen
        open.push({ id: id, host: t.host, createdAt: t.createdAt });
      });
    }
    _renderLobby(open);
  });
}

function _renderLobby(rooms) {
  var myTrade = _tc.tradeId && _tc.role === "host";
  var html =
    "<button class='tc-btn tc-btn-primary' onclick='_createTrade()'>" +
      "✨ Eigenen Tausch eröffnen" +
    "</button>" +
    "<div class='tc-divider'>— oder beitreten —</div>" +
    "<div id='tcRoomList'>";

  if(rooms.length === 0) {
    html += "<div class='tc-empty'>Keine offenen Räume.<br>Eröffne deinen eigenen!</div>";
  } else {
    rooms.forEach(function(r) {
      var ago = Math.round((Date.now() - r.createdAt) / 1000);
      var agoStr = ago < 60 ? ago + "s" : Math.round(ago/60) + "m";
      html +=
        "<div class='tc-room-card'>" +
          "<div class='tc-room-info'>" +
            "<span class='tc-room-name'>👤 " + (r.host.name || "Unbekannt") + "</span>" +
            "<span class='tc-room-age'>vor " + agoStr + "</span>" +
          "</div>" +
          "<button class='tc-btn tc-btn-join' onclick='_joinTrade(\"" + r.id + "\")'>" +
            "Beitreten →" +
          "</button>" +
        "</div>";
    });
  }
  html += "</div><button class='tc-btn tc-btn-refresh' onclick='_showLobby()'>🔄 Aktualisieren</button>";
  _setContent(html);
}

// ════════════════════════════════════════════════════════════════
//  RAUM ERSTELLEN (Host)
// ════════════════════════════════════════════════════════════════
function _createTrade() {
  var tradeId = STATE.uid.replace(/[.#$/\[\]]/g, "_") + "_" + Date.now();
  var data = {
    status: "waiting",
    host: { uid: STATE.uid, name: STATE.name, pokemon: null, confirmed: false },
    guest: null,
    chat: {},
    createdAt: Date.now(),
  };
  _tc.tradeId = tradeId;
  _tc.role = "host";
  _tc.myPkmnIdx = null;
  _tc.chatSeen = 0;

  _tcSet(tradeId, data).then(function() {
    _startPolling();
    _renderWaiting();
  }).catch(function(e) {
    alert("Fehler beim Erstellen: " + e.message);
    _tc.tradeId = null; _tc.role = null;
  });
}

function _renderWaiting() {
  var html =
    "<div class='tc-waiting'>" +
      "<div class='tc-wait-anim'>⏳</div>" +
      "<div class='tc-wait-text'>Warte auf Mitspieler...</div>" +
      "<div class='tc-wait-sub'>Schicke einem Freund den Link zu Azuria City!</div>" +
    "</div>" +
    "<button class='tc-btn tc-btn-danger' onclick='_cancelTrade()'>Abbrechen</button>";
  _setContent(html);
}

function _cancelTrade() {
  if(_tc.tradeId) _tcDel(_tc.tradeId);
  _leaveCurrentTrade();
  _showLobby();
}

// ════════════════════════════════════════════════════════════════
//  RAUM BEITRETEN (Guest)
// ════════════════════════════════════════════════════════════════
function _joinTrade(tradeId) {
  // Erst prüfen ob noch frei
  _tcGet(tradeId, function(data) {
    if(!data || data.status !== "waiting") {
      alert("Dieser Raum ist nicht mehr verfügbar.");
      _showLobby(); return;
    }
    _tc.tradeId = tradeId;
    _tc.role = "guest";
    _tc.myPkmnIdx = null;
    _tc.chatSeen = 0;

    var updates = {};
    updates[tradeId + "/guest"] = { uid: STATE.uid, name: STATE.name, pokemon: null, confirmed: false };
    updates[tradeId + "/status"] = "selecting";
    dbUpd(TRADES_PATH, updates).then(function() {
      _startPolling();
      _renderTradeRoom(data);
    }).catch(function(e) {
      alert("Fehler beim Beitreten: " + e.message);
      _tc.tradeId = null; _tc.role = null;
    });
  });
}

// ════════════════════════════════════════════════════════════════
//  POLLING
// ════════════════════════════════════════════════════════════════
function _startPolling() {
  if(_tc.poll) clearInterval(_tc.poll);
  _tc.poll = setInterval(function() {
    if(!_tc.tradeId) return;
    _tcGet(_tc.tradeId, function(data) {
      if(!data) { _handlePartnerLeft(); return; }
      _tc.lastData = data;
      _onTradeUpdate(data);
    });
  }, POLL_MS);
}

function _onTradeUpdate(data) {
  var o = document.getElementById("tcOverlay"); if(!o) return;

  // Host wartet → Guest ist beigetreten?
  if(_tc.role === "host" && data.status === "selecting" && data.guest) {
    _tc.chatSeen = 0;
    _renderTradeRoom(data);
    return;
  }

  // In Tausch-Raum: Updates anwenden
  if(data.status === "selecting" || data.status === "both_confirmed") {
    _updateTradeRoomDynamic(data);
  }

  // Beide bestätigt → Tausch ausführen
  if(data.status === "both_confirmed") {
    var myData   = data[_tc.role];
    var partRole = _tc.role === "host" ? "guest" : "host";
    var partData = data[partRole];
    if(myData && myData.confirmed && partData && partData.confirmed) {
      // Kurz warten dann ausführen
      clearInterval(_tc.poll); _tc.poll = null;
      setTimeout(function() { _executeTrade(data); }, 800);
    }
  }

  // Abgeschlossen
  if(data.status === "complete") {
    clearInterval(_tc.poll); _tc.poll = null;
  }
}

function _handlePartnerLeft() {
  clearInterval(_tc.poll); _tc.poll = null;
  var o = document.getElementById("tcOverlay"); if(!o) return;
  var body = document.getElementById("tcBody"); if(!body) return;
  body.innerHTML =
    "<div class='tc-error'>Mitspieler hat den Raum verlassen.</div>" +
    "<button class='tc-btn tc-btn-primary' onclick='_showLobby()'>Zurück zur Lobby</button>";
  if(_tc.role === "host" && _tc.tradeId) _tcDel(_tc.tradeId);
  _tc.tradeId = null; _tc.role = null;
}

// ════════════════════════════════════════════════════════════════
//  TAUSCH-RAUM UI
// ════════════════════════════════════════════════════════════════
function _renderTradeRoom(data) {
  var myRole   = _tc.role;
  var partRole = myRole === "host" ? "guest" : "host";
  var myData   = data[myRole] || {};
  var partData = data[partRole] || {};

  var html =
    // ── Pokémon-Bereich ─────────────────────────────────────────
    "<div class='tc-trade-area'>" +
      "<div class='tc-trade-slot tc-mine'>" +
        "<div class='tc-slot-label'>Du (" + (STATE.name||"") + ")</div>" +
        _renderTradeSlot(myData.pokemon, true, myData.confirmed) +
      "</div>" +
      "<div class='tc-trade-arrow'>⇆</div>" +
      "<div class='tc-trade-slot tc-theirs'>" +
        "<div class='tc-slot-label'>" + (partData.name || "Partner") + "</div>" +
        _renderTradeSlot(partData.pokemon, false, partData.confirmed) +
      "</div>" +
    "</div>" +

    // ── Pokémon-Auswahl ──────────────────────────────────────────
    "<div class='tc-party-section'>" +
      "<div class='tc-section-title'>Dein Team — tippe zum Auswählen:</div>" +
      _renderPartyPicker() +
    "</div>" +

    // ── Bereit-Button ────────────────────────────────────────────
    "<div id='tcConfirmArea'>" +
      _renderConfirmBtn(myData, partData) +
    "</div>" +

    // ── Chat ─────────────────────────────────────────────────────
    "<div class='tc-chat-section'>" +
      "<div class='tc-section-title'>💬 Chat</div>" +
      "<div class='tc-chat-log' id='tcChatLog'>" +
        _renderChat(data.chat) +
      "</div>" +
      "<div class='tc-chat-input-row'>" +
        "<input id='tcChatInput' class='tc-chat-input' maxlength='80' placeholder='Nachricht...' " +
               "onkeydown='if(event.key===\"Enter\")_sendChat()'>" +
        "<button class='tc-btn tc-btn-small' onclick='_sendChat()'>Senden</button>" +
      "</div>" +
    "</div>" +

    "<button class='tc-btn tc-btn-danger' style='margin-top:8px' onclick='_leaveAndBack()'>Verlassen</button>";

  _setContent(html);

  // Chat ans Ende scrollen
  var log = document.getElementById("tcChatLog");
  if(log) log.scrollTop = log.scrollHeight;
}

function _renderTradeSlot(pokemon, isMe, confirmed) {
  if(!pokemon) {
    return "<div class='tc-slot-empty'>" + (isMe ? "Wähle ein Pokémon ↓" : "Noch nicht gewählt") + "</div>";
  }
  var pd = PKMN[pokemon.dexId];
  var name = pokemon.nick || (pd ? pd.name : "?");
  var evoTarget = TRADE_EVOS[pokemon.dexId];
  var evoPd = evoTarget ? PKMN[evoTarget] : null;
  return "<div class='tc-slot-filled" + (confirmed ? " tc-slot-confirmed" : "") + "'>" +
    "<img class='tc-slot-sprite' src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/" +
         pokemon.dexId + ".gif' onerror='this.src=\"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + pokemon.dexId + ".png\"'>" +
    "<div class='tc-slot-info'>" +
      "<b>" + (pokemon.shiny ? "✨ " : "") + name + "</b> Lv." + pokemon.level +
      (evoPd ? "<div class='tc-evo-hint'>→ " + evoPd.name + " durch Tausch!</div>" : "") +
    "</div>" +
    (confirmed ? "<div class='tc-confirmed-badge'>✅ Bereit</div>" : "") +
  "</div>";
}

function _renderPartyPicker() {
  if(!STATE || !STATE.party) return "";
  var html = "<div class='tc-party-grid'>";
  STATE.party.forEach(function(p, i) {
    var pd = PKMN[p.dexId];
    var sel = (_tc.myPkmnIdx === i);
    html +=
      "<div class='tc-party-card" + (sel ? " tc-party-selected" : "") +
           (p.currentHP <= 0 ? " tc-party-fainted" : "") + "'" +
           (p.currentHP > 0 ? " onclick='_selectPkmn(" + i + ")'" : "") + ">" +
        "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + p.dexId + ".png'" +
             " onerror='this.style.opacity=0'>" +
        "<div class='tc-party-name'>" + (p.nick||(pd?pd.name:"?")) + "</div>" +
        "<div class='tc-party-lv'>Lv." + p.level + "</div>" +
      "</div>";
  });
  return html + "</div>";
}

function _renderConfirmBtn(myData, partData) {
  var myPkmn = myData.pokemon;
  var myConf = myData.confirmed;
  var partConf = partData.confirmed;

  if(!myPkmn) {
    return "<button class='tc-btn tc-btn-confirm' disabled>✅ Tausch bestätigen</button>" +
           "<div class='tc-status-hint'>Wähle zuerst ein Pokémon</div>";
  }
  if(myConf && !partConf) {
    return "<button class='tc-btn tc-btn-confirm tc-btn-waiting' disabled>⏳ Warte auf Partner...</button>";
  }
  if(myConf && partConf) {
    return "<button class='tc-btn tc-btn-confirm tc-btn-go' disabled>⚡ Tausch startet...</button>";
  }
  return "<button class='tc-btn tc-btn-confirm' onclick='_confirmTrade()'>✅ Tausch bestätigen</button>" +
         "<div class='tc-status-hint'>" + (partConf ? "Partner ist bereit!" : "Warte auf Partner") + "</div>";
}

function _renderChat(chatObj) {
  if(!chatObj || Object.keys(chatObj).length === 0) {
    return "<div class='tc-chat-empty'>Noch keine Nachrichten</div>";
  }
  var msgs = [];
  Object.keys(chatObj).sort().forEach(function(k) {
    msgs.push(chatObj[k]);
  });
  _tc.chatSeen = msgs.length;
  return msgs.map(function(m) {
    var isMe = m.uid === STATE.uid;
    return "<div class='tc-chat-msg" + (isMe ? " tc-chat-me" : " tc-chat-them") + "'>" +
      (isMe ? "" : "<span class='tc-chat-name'>" + (m.name || "?") + ":</span> ") +
      "<span class='tc-chat-text'>" + _escHtml(m.text || "") + "</span>" +
    "</div>";
  }).join("");
}

function _escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Dynamische Updates (ohne kompletten Re-Render) ────────────
function _updateTradeRoomDynamic(data) {
  var myRole   = _tc.role;
  var partRole = myRole === "host" ? "guest" : "host";
  var myData   = data[myRole] || {};
  var partData = data[partRole] || {};

  // Partner-Slot updaten
  var slot = document.querySelector(".tc-theirs");
  if(slot) slot.innerHTML =
    "<div class='tc-slot-label'>" + (partData.name || "Partner") + "</div>" +
    _renderTradeSlot(partData.pokemon, false, partData.confirmed);

  // Meinen Slot (falls Pokemon schon gewählt)
  var mySlot = document.querySelector(".tc-mine");
  if(mySlot && myData.pokemon) mySlot.innerHTML =
    "<div class='tc-slot-label'>Du (" + (STATE.name||"") + ")</div>" +
    _renderTradeSlot(myData.pokemon, true, myData.confirmed);

  // Confirm-Button
  var confirmArea = document.getElementById("tcConfirmArea");
  if(confirmArea) confirmArea.innerHTML = _renderConfirmBtn(myData, partData);

  // Chat-Updates
  var log = document.getElementById("tcChatLog");
  if(log && data.chat) {
    var msgs = [];
    Object.keys(data.chat).sort().forEach(function(k) { msgs.push(data.chat[k]); });
    if(msgs.length > _tc.chatSeen) {
      // Neue Nachrichten
      log.innerHTML = _renderChat(data.chat);
      log.scrollTop = log.scrollHeight;
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  AKTIONEN
// ════════════════════════════════════════════════════════════════

// Pokémon auswählen
function _selectPkmn(partyIdx) {
  if(!_tc.tradeId) return;
  var p = STATE.party[partyIdx];
  if(!p || p.currentHP <= 0) { showToast("Nur KO-freie Pokémon wählbar!"); return; }

  _tc.myPkmnIdx = partyIdx;
  var serialized = _serializePkmn(p);

  // In Firebase speichern
  var upd = {};
  upd[_roomPath(_tc.role + "/pokemon")] = serialized;
  upd[_roomPath(_tc.role + "/confirmed")] = false; // Selektion resettet Bestätigung
  dbUpd(TRADES_PATH, upd);

  // Lokalen Slot updaten
  var mySlot = document.querySelector(".tc-mine");
  if(mySlot) {
    mySlot.innerHTML =
      "<div class='tc-slot-label'>Du (" + (STATE.name||"") + ")</div>" +
      _renderTradeSlot(serialized, true, false);
  }
  // Partyauswahl neu rendern
  var partyGrid = document.querySelector(".tc-party-grid");
  if(partyGrid) partyGrid.outerHTML = _renderPartyPicker();
}

// Tausch bestätigen
function _confirmTrade() {
  if(!_tc.tradeId || _tc.myPkmnIdx === null) return;
  var upd = {};
  upd[_roomPath(_tc.role + "/confirmed")] = true;
  upd[_roomPath("status")] = "both_confirmed";
  dbUpd(TRADES_PATH, upd).then(function() {
    var confirmArea = document.getElementById("tcConfirmArea");
    if(confirmArea) confirmArea.innerHTML =
      "<button class='tc-btn tc-btn-confirm tc-btn-waiting' disabled>⏳ Warte auf Partner...</button>";
  });
}

// Chat senden
function _sendChat() {
  var input = document.getElementById("tcChatInput");
  if(!input || !input.value.trim() || !_tc.tradeId) return;
  var text = input.value.trim().slice(0, 80);
  var key = Date.now() + "_" + Math.random().toString(36).slice(2,6);
  var msg = { uid: STATE.uid, name: STATE.name, text: text, ts: Date.now() };
  _tcSet(_roomPath("chat/" + key), msg);
  input.value = "";
}

function _leaveAndBack() {
  _leaveCurrentTrade();
  _showLobby();
}

function _leaveCurrentTrade() {
  if(_tc.poll) { clearInterval(_tc.poll); _tc.poll = null; }
  if(_tc.tradeId) {
    if(_tc.role === "host") {
      _tcDel(_tc.tradeId); // Raum löschen wenn Host geht
    } else if(_tc.role === "guest") {
      // Guest verlässt — Raum wieder öffnen
      var upd = {};
      upd[_tc.tradeId + "/guest"] = null;
      upd[_tc.tradeId + "/status"] = "waiting";
      dbUpd(TRADES_PATH, upd);
    }
  }
  _tc.tradeId   = null;
  _tc.role      = null;
  _tc.myPkmnIdx = null;
  _tc.lastData  = null;
  _tc.chatSeen  = 0;
}

// ════════════════════════════════════════════════════════════════
//  TAUSCH AUSFÜHREN
// ════════════════════════════════════════════════════════════════
function _executeTrade(data) {
  var myRole   = _tc.role;
  var partRole = myRole === "host" ? "guest" : "host";
  var mySerial   = data[myRole]   && data[myRole].pokemon;
  var partSerial = data[partRole] && data[partRole].pokemon;

  if(!mySerial || !partSerial) {
    _showTradeResult("Fehler: Kein Pokémon gewählt.", false);
    return;
  }

  // Mein Pokémon in der Party finden (anhand dexId + level)
  var myIdx = STATE.party.findIndex(function(p) {
    return p.dexId === mySerial.dexId && p.level === mySerial.level && p.currentHP > 0;
  });
  if(myIdx < 0) {
    _showTradeResult("Pokémon nicht mehr in der Party!", false);
    return;
  }

  var myPkmn = STATE.party[myIdx];
  var myOldName = myPkmn.nick || (PKMN[myPkmn.dexId] ? PKMN[myPkmn.dexId].name : "?");

  // Neues Pokémon erstellen (aus Partner-Daten)
  var newPkmn = createPkmnInstance(partSerial.dexId, partSerial.level);
  if(!newPkmn) { _showTradeResult("Pokémon konnte nicht erstellt werden.", false); return; }
  newPkmn.nick   = partSerial.nick || "";
  newPkmn.shiny  = !!partSerial.shiny;

  // Trade-Evolution prüfen
  var evoTarget = TRADE_EVOS[newPkmn.dexId];
  var evolved = false;
  var evoFromName = PKMN[newPkmn.dexId] ? PKMN[newPkmn.dexId].name : "?";
  var evoToName   = "";
  if(evoTarget) {
    applyEvolutionData(newPkmn, evoTarget); // aus evolution.js
    evolved = true;
    evoToName = PKMN[evoTarget] ? PKMN[evoTarget].name : "?";
    if(STATE.seen)  STATE.seen[evoTarget]  = true;
    if(STATE.caught)STATE.caught[evoTarget]= true;
  }

  // Tausch durchführen
  STATE.party.splice(myIdx, 1, newPkmn);
  if(STATE.seen)  STATE.seen[newPkmn.dexId]  = true;
  if(STATE.caught)STATE.caught[newPkmn.dexId]= true;

  // Firebase-Eintrag löschen (nach kurzer Verzögerung)
  var oldTradeId = _tc.tradeId;
  setTimeout(function() { _tcDel(oldTradeId); }, 3000);

  _tc.tradeId = null; _tc.role = null;

  saveGame();
  renderTeamScreen();
  renderPlayerSprites();

  // Ergebnis zeigen
  var resultMsg;
  if(evolved) {
    resultMsg = myOldName + " → <b style='color:#fde68a'>" + (PKMN[partSerial.dexId] ? PKMN[partSerial.dexId].name : "?") +
                "</b> und entwickelt sich zu <b style='color:#f59e0b'>✨ " + evoToName + "</b>!";
  } else {
    resultMsg = myOldName + " → <b style='color:#fde68a'>" + partSerial.nick + "</b> erfolgreich getauscht!";
  }
  _showTradeResult(resultMsg, true, evolved, newPkmn.dexId);
}

function _showTradeResult(msg, success, evolved, newDexId) {
  var spriteHtml = newDexId
    ? "<img class='tc-result-sprite' src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" + newDexId + ".png'>"
    : "";

  _setContent(
    "<div class='tc-result" + (success ? " tc-result-ok" : " tc-result-err") + "'>" +
      spriteHtml +
      "<div class='tc-result-icon'>" + (success ? (evolved ? "✨" : "🎉") : "❌") + "</div>" +
      "<div class='tc-result-msg'>" + msg + "</div>" +
    "</div>" +
    "<button class='tc-btn tc-btn-primary' onclick='_closeOverlay()'>Schließen</button>"
  );
}
