
// ══════════════════════════════════════════════════════════════
// renderer_patch.js — Überschreibt Funktionen aus renderer.js
// ══════════════════════════════════════════════════════════════

// ── Hintergrundbild-Cache ─────────────────────────────────────
// Schlüssel = Zone-Index+1 (1.png, 2.png, ...)
// Werte: undefined = noch nicht versucht
//        'loading'  = lädt gerade
//        Image      = erfolgreich geladen
//        null       = nicht vorhanden → Canvas-Fallback
var _bgImageCache = {};

// ── renderZoneBg: Bild zuerst, Canvas als Fallback ────────────
function renderZoneBg(zone) {
  if (!zone) return;
  if (_sceneAnimId) cancelAnimationFrame(_sceneAnimId);
  getSceneCanvas(); if (!_sceneCtx) return;
  _sceneT = 0;

  // Zone-Index → Dateiname: 1.png, 2.png, ...
  var zoneIdx = WORLD ? WORLD.findIndex(function(z) { return z.id === zone.id; }) : -1;
  var imgKey  = zoneIdx + 1; // 1-basiert

  // Canvas-Zeichenfunktion als Fallback
  var drawFn;
  if      (zone.type === "sea")     drawFn = function(){ drawSea(_sceneCtx, _sceneCanvas.width, _sceneCanvas.height, _sceneT); };
  else if (zone.type === "gym")     drawFn = function(){ drawGym(_sceneCtx, _sceneCanvas.width, _sceneCanvas.height, _sceneT); };
  else if (zone.type === "city")    drawFn = function(){ drawCity(_sceneCtx, _sceneCanvas.width, _sceneCanvas.height, _sceneT); };
  else if (zone.type === "dungeon") {
    if (zone.id.indexOf("forest") >= 0)   drawFn = function(){ drawForest(_sceneCtx, _sceneCanvas.width, _sceneCanvas.height, _sceneT); };
    else if (zone.id === "pokemon_tower") drawFn = function(){ drawTower(_sceneCtx, _sceneCanvas.width, _sceneCanvas.height, _sceneT); };
    else                                  drawFn = function(){ drawCave(_sceneCtx, _sceneCanvas.width, _sceneCanvas.height, _sceneT); };
  }
  else drawFn = function(){ drawRoute(_sceneCtx, _sceneCanvas.width, _sceneCanvas.height, _sceneT, zone); };

  // Bild einmalig laden wenn noch nicht versucht
  if (_bgImageCache[imgKey] === undefined) {
    _bgImageCache[imgKey] = 'loading';
    var img = new Image();
    img.onload  = function() { _bgImageCache[imgKey] = img; };
    img.onerror = function() { _bgImageCache[imgKey] = null; };
    img.src = 'bg/' + imgKey + '.png';
  }

  function loop() {
    var cached = _bgImageCache[imgKey];

    if (cached && cached !== 'loading') {
      // Bild vorhanden → einmal zeichnen, kein Loop
      _sceneCtx.drawImage(cached, 0, 0, _sceneCanvas.width, _sceneCanvas.height);
      return;
    }

    // Fallback: animiertes Canvas
    try { drawFn(); } catch(e) {}
    _sceneT++;
    _sceneAnimId = requestAnimationFrame(loop);
  }

  loop();
}

// ── Spieler-Sprite: nur Lead, unverzerrtes GIF ────────────────
function renderPlayerSprites() {
  var container = document.getElementById("playerSprites");
  if (!container || !STATE) return;
  container.innerHTML = "";

  var lead = STATE.party.find(function(p) { return p.currentHP > 0; });
  if (!lead) return;

  var pd  = PKMN[lead.dexId];
  var div = document.createElement("div");
  div.className = "walker walker-lead";

  var hpPct = Math.max(0, Math.round(lead.currentHP / lead.maxHP * 100));
  div.innerHTML =
    "<img class='walker-sprite' " +
      "src='" + spriteUrl(lead.dexId, true) + "' " +
      "alt='" + (pd ? pd.name : "?") + "' " +
      "onerror='this.src=\"" + spriteFallback(lead.dexId, true) + "\"'>" +
    "<div class='walker-hpbar'>" +
      "<div class='walker-hpfill' style='width:" + hpPct + "%;background:" + hpColor(lead.currentHP, lead.maxHP) + "'></div>" +
    "</div>";

  container.appendChild(div);
}

// ── Battle-UI ─────────────────────────────────────────────────
function showBattleUI(enemy) {
  var ui = document.getElementById("battlePanel"); if (ui) ui.classList.add("battle-active");
  var ibtn = document.getElementById("itemBattleBtn"); if (ibtn) ibtn.style.display = "block";
  renderMoveButtons(); renderCatchBalls(false); updateCatchButton(enemy);
}
function hideBattleUI() {
  var ui = document.getElementById("battlePanel"); if (ui) ui.classList.remove("battle-active");
  var mb = document.getElementById("moveButtons"); if (mb) mb.innerHTML = "";
  var ibtn = document.getElementById("itemBattleBtn"); if (ibtn) ibtn.style.display = "none";
  renderCatchBalls(false); hideTrainerPortrait(); clearFxCanvas(); closeBattleItemPanel();
}

// ── Item-Panel im Kampf ───────────────────────────────────────
var BATTLE_USABLE_ITEMS = [
  "maxpotion","fullrestore","hyperpotion","superpotion","potion",
  "fullheal","antidote","awakening","paralysheal","revive"
];

function showBattleItemPanel() {
  if (document.getElementById("battleItemPanel")) { closeBattleItemPanel(); return; }
  if (!STATE || !ITEM_DEFS) return;

  var hasAny = BATTLE_USABLE_ITEMS.some(function(k) { return (STATE.items[k] || 0) > 0; });
  if (!hasAny) { showToast("Keine Items dabei!"); return; }

  var panel = document.createElement("div");
  panel.id = "battleItemPanel";
  panel.className = "battle-item-panel";
  panel.innerHTML =
    "<div class='bip-header'><span>🎒 Item wählen</span>" +
    "<button class='bip-close' onclick='closeBattleItemPanel()'>✕</button></div>" +
    "<div class='bip-grid' id='bipGrid'></div>";

  var actions = document.getElementById("battleActions");
  var moveButtons = document.getElementById("moveButtons");
  if (actions && moveButtons) actions.insertBefore(panel, moveButtons);

  var grid = document.getElementById("bipGrid");
  BATTLE_USABLE_ITEMS.forEach(function(key) {
    var count = STATE.items[key] || 0; if (count <= 0) return;
    var def = ITEM_DEFS[key]; if (!def) return;
    var player = getActivePkmn();
    var usable = true;
    if ((key==="potion"||key==="superpotion"||key==="hyperpotion"||key==="maxpotion") && player && player.currentHP >= player.maxHP) usable = false;
    if (key==="antidote"    && player && player.status !== "poison")    usable = false;
    if (key==="awakening"   && player && player.status !== "sleep")     usable = false;
    if (key==="paralysheal" && player && player.status !== "paralysis") usable = false;
    if (key==="fullheal"    && player && !player.status)                usable = false;
    if (key==="revive"      && !STATE.party.find(function(p) { return p.currentHP <= 0; })) usable = false;

    var btn = document.createElement("button");
    btn.className = "bip-item" + (usable ? "" : " bip-item-disabled");
    btn.disabled = !usable;
    btn.title = def.name + ": " + def.desc;
    btn.innerHTML =
      "<img src='" + (def.img || "") + "' class='bip-sprite' onerror='this.style.display=\"none\"'>" +
      "<span class='bip-name'>" + def.name + "</span>" +
      "<span class='bip-count'>x" + count + "</span>";
    if (usable) btn.onclick = (function(k) { return function() { useBattleItem(k); }; })(key);
    grid.appendChild(btn);
  });
}

function closeBattleItemPanel() {
  var el = document.getElementById("battleItemPanel");
  if (el && el.parentNode) el.parentNode.removeChild(el);
}
