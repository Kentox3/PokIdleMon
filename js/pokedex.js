// ═══════════════════════════════════════════════════════════════
//  pokedex.js — Pokédex für neues System (dt. Stats, gesehen/gefangen)
// ═══════════════════════════════════════════════════════════════

// ── Encounter-Map aufbauen ────────────────────────────────────
var _encounterMap = null;

function getEncounterMap() {
  if (_encounterMap) return _encounterMap;
  _encounterMap = {};
  WORLD.forEach(function(zone) {
    (zone.wildePkmn || []).forEach(function(enc) {
      if (!_encounterMap[enc.id]) _encounterMap[enc.id] = [];
      _encounterMap[enc.id].push({
        name:  zone.name,
        typ:   zone.typ,
        lvMin: enc.lvMin,
        lvMax: enc.lvMax,
      });
    });
  });
  return _encounterMap;
}

// ── Party + Box in gesehen/gefangen eintragen ─────────────────
function syncPokedexFromPartyBox() {
  if (!STATE) return;
  if (!STATE.gesehen)  STATE.gesehen  = {};
  if (!STATE.gefangen) STATE.gefangen = {};
  STATE.party.forEach(function(p) {
    if (!p || !p.dexId) return;
    STATE.gesehen[p.dexId]  = true;
    STATE.gefangen[p.dexId] = true;
  });
  (STATE.box || []).forEach(function(p) {
    if (!p || !p.dexId) return;
    STATE.gesehen[p.dexId]  = true;
    STATE.gefangen[p.dexId] = true;
  });
}

// ═══════════════════════════════════════════════════════════════
//  ÜBERSICHTSGITTER
// ═══════════════════════════════════════════════════════════════
function renderPokedexScreen() {
  syncPokedexFromPartyBox();
  var container = document.getElementById("viewDex");
  if (!container || !STATE) return;

  var gesehen  = STATE.gesehen  || {};
  var gefangen = STATE.gefangen || {};
  var gesehenAnz  = Object.keys(gesehen).length;
  var gefangenAnz = Object.keys(gefangen).length;

  var html =
    "<div class='dex-header'>" +
      "<div class='dex-counts'>" +
        "<span class='dex-count-item'>⚽ <b>" + gefangenAnz + "</b>/151 gefangen</span>" +
        "<span class='dex-count-item'>👁 <b>" + gesehenAnz  + "</b> gesehen</span>" +
      "</div>" +
      "<div class='dex-progress-bar'><div class='dex-progress-fill' style='width:" +
        Math.round(gefangenAnz / 151 * 100) + "%'></div></div>" +
    "</div>" +
    "<div class='dex-grid'>";

  for (var i = 1; i <= 151; i++) {
    var pd = getPkmn(i); if (!pd) continue;
    var isSeen   = !!gesehen[i];
    var isCaught = !!gefangen[i];

    var cls = "dex-entry" +
      (isCaught ? " dex-caught" : isSeen ? " dex-seen" : " dex-unseen");

    var typeColor = pd.typen && pd.typen[0] ? (TYPE_COLORS[pd.typen[0]] || "#888") : "#888";

    var spriteHtml;
    if (isSeen) {
      var sdUrl  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/" + i + ".gif";
      var pngUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + i + ".png";
      spriteHtml = "<img src='" + sdUrl + "' class='dex-sprite" +
        (!isCaught ? " dex-silhouette" : "") +
        "' onerror='this.src=\"" + pngUrl + "\"'>";
    } else {
      spriteHtml = "<div class='dex-unknown'>?</div>";
    }

    html +=
      "<div class='" + cls + "' onclick='showDexDetail(" + i + ")'" +
        " style='border-color:" + (isCaught ? typeColor : "rgba(255,255,255,.1)") + "33'>" +
        "<div class='dex-num'>#" + String(i).padStart(3, "0") + "</div>" +
        spriteHtml +
        "<div class='dex-name'>" + (isSeen ? pd.name : "???") + "</div>" +
        (isCaught ? "<div class='dex-pokeball'>⚽</div>" : "") +
      "</div>";
  }

  html += "</div>";
  container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
//  DETAIL-POPUP
// ═══════════════════════════════════════════════════════════════
function showDexDetail(dexId) {
  var pd = getPkmn(dexId); if (!pd) return;
  if (!STATE) return;
  var isSeen   = !!(STATE.gesehen  || {})[dexId];
  var isCaught = !!(STATE.gefangen || {})[dexId];
  if (!isSeen) { zeigToast("Noch nicht gesehen!"); return; }

  closeDexDetail();

  var encMap    = getEncounterMap();
  var locations = encMap[dexId] || [];

  // Typ-Badges
  var typenHtml = (pd.typen || []).map(function(t) {
    return "<span class='type-badge' style='background:" + (TYPE_COLORS[t] || "#888") + "'>" + t + "</span>";
  }).join(" ");

  // Basiswerte (dt. Namen)
  var stats = [
    { name:"KP",    val: pd.kp     },
    { name:"Ang",   val: pd.ang    },
    { name:"Vert",  val: pd.vert   },
    { name:"SpAng", val: pd.spAng  },
    { name:"SpVert",val: pd.spVert },
    { name:"Init",  val: pd.init   },
  ];
  var statsHtml = stats.map(function(s) {
    var pct = Math.min(100, Math.round((s.val || 0) / 180 * 100));
    var col = s.val >= 100 ? "#44cc44" : s.val >= 65 ? "#ffbb22" : "#ee4444";
    return "<div class='dex-stat-row'>" +
      "<span class='dex-stat-name'>" + s.name + "</span>" +
      "<span class='dex-stat-val'>" + (s.val || 0) + "</span>" +
      "<div class='dex-stat-bar'><div class='dex-stat-fill' style='width:" + pct + "%;background:" + col + "'></div></div>" +
    "</div>";
  }).join("");

  // Fundorte
  var zoneIcon = { route:"🌿", dungeon:"🕳️", stadt:"🏙️", gym:"⚔️", see:"🌊", wachposten:"🚧" };
  var locHtml = locations.length > 0
    ? "<div class='dex-loc-list'>" + locations.map(function(l) {
        return "<div class='dex-loc-row'>" +
          (zoneIcon[l.typ] || "📍") + " " + l.name +
          " <span class='dex-loc-lv'>Lv." + l.lvMin + "–" + l.lvMax + "</span>" +
        "</div>";
      }).join("") + "</div>"
    : "<div class='dex-empty'>Nicht in der Wildnis fangbar</div>";

  // Attacken (dt. Felder)
  var movesHtml;
  if (isCaught) {
    var allMoves = (pd.attacken || []).map(function(entry) {
      var mv = MOVES[entry[1]]; if (!mv) return null;
      return { level: entry[0], id: entry[1], name: mv.name, typ: mv.typ, staerke: mv.staerke || 0, ap: mv.ap || 0 };
    }).filter(Boolean);

    movesHtml = allMoves.length > 0
      ? "<div class='dex-move-list'>" +
          "<div class='dex-move-header'>" +
            "<span>Lv.</span><span>Attacke</span><span>Typ</span><span>Stk</span><span>AP</span>" +
          "</div>" +
          allMoves.map(function(m) {
            return "<div class='dex-move-row'>" +
              "<span class='dex-move-lv'>"   + m.level + "</span>" +
              "<span class='dex-move-name'>" + m.name  + "</span>" +
              "<span class='type-badge' style='background:" + (TYPE_COLORS[m.typ]||"#888") + ";font-size:9px'>" + m.typ + "</span>" +
              "<span class='dex-move-pwr'>"  + (m.staerke > 0 ? m.staerke : "—") + "</span>" +
              "<span class='dex-move-pp'>"   + m.ap + "</span>" +
            "</div>";
          }).join("") +
        "</div>"
      : "<div class='dex-empty'>Keine Attacken</div>";
  } else {
    movesHtml = "<div class='dex-empty dex-catch-hint'>🎒 Fange dieses Pokémon für Attacken-Details!</div>";
  }

  // Sprite
  var sdBase  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
  var pngBase = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
  var spriteSrc   = sdBase  + dexId + ".gif";
  var spriteFallbk = pngBase + dexId + ".png";
  var spriteClass = "dex-detail-sprite" + (!isCaught ? " dex-silhouette" : "");

  // Anzahl im Besitz
  var catchCount = 0, hasShiny = false;
  STATE.party.concat(STATE.box || []).forEach(function(p) {
    if (p && p.dexId == dexId) { catchCount++; if (p.shiny) hasShiny = true; }
  });

  var overlay = document.createElement("div");
  overlay.id = "dexDetailOverlay";
  overlay.className = "dex-overlay";
  overlay.onclick = function(e) { if (e.target === overlay) closeDexDetail(); };

  overlay.innerHTML =
    "<div class='dex-detail-box'>" +
      "<div class='dex-detail-header'>" +
        "<div class='dex-detail-titlerow'>" +
          "<span class='dex-detail-num'>#" + String(dexId).padStart(3, "0") + "</span>" +
          "<span class='dex-detail-name'>" + pd.name + (hasShiny ? " ✨" : "") + "</span>" +
          "<div>" + typenHtml + "</div>" +
        "</div>" +
        "<button class='dex-close-btn' onclick='closeDexDetail()'>✕</button>" +
      "</div>" +
      "<div class='dex-detail-body'>" +
        "<div class='dex-detail-left'>" +
          "<div class='dex-sprite-box'>" +
            "<img class='" + spriteClass + "' src='" + spriteSrc + "' onerror='this.src=\"" + spriteFallbk + "\"'>" +
            (catchCount > 0 ? "<div class='dex-catch-count'>x" + catchCount + " im Besitz</div>" : "") +
          "</div>" +
          "<div class='dex-section-title'>📊 Basiswerte</div>" +
          "<div class='dex-stats'>" + statsHtml + "</div>" +
        "</div>" +
        "<div class='dex-detail-right'>" +
          "<div class='dex-section-title'>📍 Fundorte</div>" +
          locHtml +
          "<div class='dex-section-title' style='margin-top:12px'>⚔️ Attacken</div>" +
          movesHtml +
        "</div>" +
      "</div>" +
    "</div>";

  document.body.appendChild(overlay);
}

function closeDexDetail() {
  var el = document.getElementById("dexDetailOverlay");
  if (el && el.parentNode) el.parentNode.removeChild(el);
}
