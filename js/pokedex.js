// ═══════════════════════════════════════════════════════════════
//  pokedex.js — Pokédex: Sammeln, Infos, Fundorte, Attacken
// ═══════════════════════════════════════════════════════════════

// ── Typ-Farben (global, wird auch in renderer.js genutzt) ─────
var TYPE_COLORS = {
  Normal:"#a8a878",   Fire:"#f08030",   Water:"#6890f0",
  Grass:"#78c850",    Electric:"#f8d030",Ice:"#98d8d8",
  Fighting:"#c03028", Poison:"#a040a0", Ground:"#e0c068",
  Flying:"#a890f0",   Psychic:"#f85888",Bug:"#a8b820",
  Rock:"#b8a038",     Ghost:"#705898",  Dragon:"#7038f8",
  Dark:"#705848",     Steel:"#b8b8d0",  Fairy:"#f0b6bc",
};

// ── Encounter-Map (Zone → Pokémon) ────────────────────────────
var _encounterMap = null;

function getEncounterMap() {
  if (_encounterMap) return _encounterMap;
  _encounterMap = {};
  WORLD.forEach(function(zone) {
    (zone.wildPokemon || []).forEach(function(enc) {
      if (!_encounterMap[enc.dexId]) _encounterMap[enc.dexId] = [];
      _encounterMap[enc.dexId].push({
        name:  zone.name,
        type:  zone.type,
        minLv: enc.minLv,
        maxLv: enc.maxLv,
      });
    });
  });
  return _encounterMap;
}

// ── Party + Box als "gesehen & gefangen" eintragen ────────────
function syncPokedexFromPartyBox() {
  if (!STATE) return;
  if (!STATE.seen)   STATE.seen   = {};
  if (!STATE.caught) STATE.caught = {};
  STATE.party.forEach(function(p) {
    if (!p || !p.dexId) return;
    STATE.seen[p.dexId]   = true;
    STATE.caught[p.dexId] = true;
  });
  (STATE.box || []).forEach(function(p) {
    if (!p || !p.dexId) return;
    STATE.seen[p.dexId]   = true;
    STATE.caught[p.dexId] = true;
  });
}

// ═══════════════════════════════════════════════════════════════
//  POKÉDEX-SCREEN (Übersichtsgitter)
// ═══════════════════════════════════════════════════════════════
function renderPokedexScreen() {
  syncPokedexFromPartyBox();
  var container = document.getElementById("viewDex");
  if (!container || !STATE) return;

  var seen   = STATE.seen   || {};
  var caught = STATE.caught || {};
  var seenCount   = Object.keys(seen).length;
  var caughtCount = Object.keys(caught).length;

  var html =
    "<div class='dex-header'>" +
      "<div class='dex-counts'>" +
        "<span class='dex-count-item'>✅ <b>" + caughtCount + "</b>/151 gefangen</span>" +
        "<span class='dex-count-item'>👁 <b>" + seenCount   + "</b> gesehen</span>" +
      "</div>" +
      "<div class='dex-progress-bar'><div class='dex-progress-fill' style='width:" +
        Math.round(caughtCount/151*100) + "%'></div></div>" +
    "</div>" +
    "<div class='dex-grid'>";

  for (var i = 1; i <= 151; i++) {
    var pd = PKMN[i]; if (!pd) continue;
    var isSeen   = !!seen[i];
    var isCaught = !!caught[i];

    var cls = "dex-entry" +
      (isCaught ? " dex-caught" : isSeen ? " dex-seen" : " dex-unseen");

    var typeColor = pd.types && pd.types[0] ? (TYPE_COLORS[pd.types[0]] || "#888") : "#888";

    var spriteHtml;
    if (isSeen) {
      var sdUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/" + i + ".gif";
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
        "<div class='dex-num'>#" + String(i).padStart(3,"0") + "</div>" +
        spriteHtml +
        "<div class='dex-name'>" + (isSeen ? pd.name : "???") + "</div>" +
        (isCaught ? "<div class='dex-pokeball'>⚽</div>" : "") +
      "</div>";
  }

  html += "</div>";
  container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
//  POKÉDEX-DETAIL (Popup)
// ═══════════════════════════════════════════════════════════════
function showDexDetail(dexId) {
  var pd = PKMN[dexId]; if (!pd) return;
  if (!STATE) return;
  var seen   = STATE.seen   || {};
  var caught = STATE.caught || {};
  var isSeen   = !!seen[dexId];
  var isCaught = !!caught[dexId];

  if (!isSeen) { showToast("Noch nicht gesehen!"); return; }

  closeDexDetail(); // Altes schließen falls offen

  var encMap = getEncounterMap();
  var locations = encMap[dexId] || [];

  // ── Typ-Badges ──
  var typesHtml = (pd.types || []).map(function(t) {
    return "<span class='type-badge' style='background:" + (TYPE_COLORS[t]||"#888") + "'>" + t + "</span>";
  }).join(" ");

  // ── Basiswerte ──
  var stats = [
    { name:"KP",   val:pd.hp  },
    { name:"Ang",  val:pd.atk },
    { name:"Vert", val:pd.def },
    { name:"SpA",  val:pd.spa },
    { name:"SpV",  val:pd.spd },
    { name:"Init", val:pd.spe },
  ];
  var statsHtml = stats.map(function(s) {
    var pct = Math.min(100, Math.round(s.val / 180 * 100));
    var col = s.val >= 100 ? "#44cc44" : s.val >= 65 ? "#ffbb22" : "#ee4444";
    return "<div class='dex-stat-row'>" +
      "<span class='dex-stat-name'>" + s.name + "</span>" +
      "<span class='dex-stat-val'>" + s.val + "</span>" +
      "<div class='dex-stat-bar'><div class='dex-stat-fill' style='width:" + pct + "%;background:" + col + "'></div></div>" +
    "</div>";
  }).join("");

  // ── Fundorte ──
  var zoneIcon = { route:"🌿", dungeon:"🕳️", city:"🏙️", gym:"⚔️", sea:"🌊" };
  var locHtml = locations.length > 0
    ? "<div class='dex-loc-list'>" + locations.map(function(l) {
        return "<div class='dex-loc-row'>" +
          (zoneIcon[l.type]||"📍") + " " + l.name +
          " <span class='dex-loc-lv'>Lv." + l.minLv + "–" + l.maxLv + "</span>" +
        "</div>";
      }).join("") + "</div>"
    : "<div class='dex-empty'>Nicht in der Wildnis fangbar</div>";

  // ── Lernbare Attacken (nur wenn gefangen) ──
  var movesHtml;
  if (isCaught) {
    var allMoves = (pd.moves || []).map(function(entry) {
      var mv = MOVES[entry[1]]; if (!mv) return null;
      return { level:entry[0], id:entry[1], name:mv.name, type:mv.type, pwr:mv.pwr, pp:mv.pp };
    }).filter(Boolean);

    movesHtml = allMoves.length > 0
      ? "<div class='dex-move-list'>" +
          "<div class='dex-move-header'>" +
            "<span>Lv.</span><span>Attacke</span><span>Typ</span><span>Stk</span><span>AP</span>" +
          "</div>" +
          allMoves.map(function(m) {
            return "<div class='dex-move-row'>" +
              "<span class='dex-move-lv'>" + m.level + "</span>" +
              "<span class='dex-move-name'>" + m.name + "</span>" +
              "<span class='type-badge' style='background:" + (TYPE_COLORS[m.type]||"#888") + ";font-size:9px'>" + m.type + "</span>" +
              "<span class='dex-move-pwr'>" + (m.pwr > 0 ? m.pwr : "—") + "</span>" +
              "<span class='dex-move-pp'>" + m.pp + "</span>" +
            "</div>";
          }).join("") +
        "</div>"
      : "<div class='dex-empty'>Keine Attacken</div>";
  } else {
    movesHtml = "<div class='dex-empty dex-catch-hint'>🎒 Fange dieses Pokémon für Attacken-Details!</div>";
  }

  // ── Sprite ──
  var sdBase  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
  var pngBase = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
  var spriteSrc = sdBase + dexId + ".gif";
  var spriteFb  = pngBase + dexId + ".png";
  var spriteClass = "dex-detail-sprite" + (!isCaught ? " dex-silhouette" : "");

  // ── Shiny-Info ──
  var catchCount = 0;
  STATE.party.forEach(function(p){ if(p.dexId===dexId) catchCount++; });
  (STATE.box||[]).forEach(function(p){ if(p.dexId===dexId) catchCount++; });
  var hasShiny = false;
  STATE.party.concat(STATE.box||[]).forEach(function(p){ if(p.dexId===dexId && p.shiny) hasShiny=true; });

  // ── Overlay erstellen ──
  var overlay = document.createElement("div");
  overlay.id = "dexDetailOverlay";
  overlay.className = "dex-overlay";
  overlay.onclick = function(e) { if (e.target === overlay) closeDexDetail(); };

  overlay.innerHTML =
    "<div class='dex-detail-box'>" +

      // Header
      "<div class='dex-detail-header'>" +
        "<div class='dex-detail-titlerow'>" +
          "<span class='dex-detail-num'>#" + String(dexId).padStart(3,"0") + "</span>" +
          "<span class='dex-detail-name'>" + pd.name + (hasShiny?" ✨":"") + "</span>" +
          "<div>" + typesHtml + "</div>" +
        "</div>" +
        "<button class='dex-close-btn' onclick='closeDexDetail()'>✕</button>" +
      "</div>" +

      // Body: zwei Spalten
      "<div class='dex-detail-body'>" +

        // Linke Spalte: Sprite + Basiswerte
        "<div class='dex-detail-left'>" +
          "<div class='dex-sprite-box'>" +
            "<img class='" + spriteClass + "' src='" + spriteSrc + "'" +
              " onerror='this.src=\"" + spriteFb + "\"'>" +
            (catchCount > 0 ? "<div class='dex-catch-count'>x" + catchCount + " im Team/Box</div>" : "") +
          "</div>" +
          "<div class='dex-section-title'>📊 Basiswerte</div>" +
          "<div class='dex-stats'>" + statsHtml + "</div>" +
        "</div>" +

        // Rechte Spalte: Fundorte + Attacken
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
