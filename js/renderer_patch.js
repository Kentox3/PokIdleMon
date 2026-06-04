
// ══════════════════════════════════════════════════════════════
// renderer_patch.js — Überschreibt Funktionen aus renderer.js
// ══════════════════════════════════════════════════════════════

// ── Shiny-Sprite-URLs ─────────────────────────────────────────
var SD_SHINY_FRONT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/";
var SD_SHINY_BACK  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/shiny/";
var PNG_SHINY      = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/";
var PNG_SHINY_BACK = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/";

function spriteUrl(dexId, back, shiny) {
  if (shiny) return (back ? SD_SHINY_BACK : SD_SHINY_FRONT) + dexId + ".gif";
  var SD_F = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
  var SD_B = SD_F + "back/";
  return (back ? SD_B : SD_F) + dexId + ".gif";
}
function spriteFallback(dexId, back, shiny) {
  if (shiny) return (back ? PNG_SHINY_BACK : PNG_SHINY) + dexId + ".png";
  var PNG_F = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
  var PNG_B = PNG_F + "back/";
  return (back ? PNG_B : PNG_F) + dexId + ".png";
}

// ── Hintergrundbild-Cache ─────────────────────────────────────
var _bgImageCache = {};

function renderZoneBg(zone) {
  if (!zone) return;
  if (_sceneAnimId) cancelAnimationFrame(_sceneAnimId);
  getSceneCanvas(); if (!_sceneCtx) return;
  _sceneT = 0;

  var zoneIdx = WORLD ? WORLD.findIndex(function(z) { return z.id === zone.id; }) : -1;
  var imgKey  = zoneIdx + 1;

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
      _sceneCtx.drawImage(cached, 0, 0, _sceneCanvas.width, _sceneCanvas.height);
      return;
    }
    try { drawFn(); } catch(e) {}
    _sceneT++;
    _sceneAnimId = requestAnimationFrame(loop);
  }
  loop();
}

// ── Gegner-Sprite mit Shiny-Support ──────────────────────────
function renderEnemySprite(enemy, visible) {
  var container = document.getElementById("enemySprite"); if (!container) return;
  if (!enemy || !visible) { container.innerHTML = ""; container.style.opacity = "0"; return; }

  var pd = PKMN[enemy.dexId], name = pd ? pd.name : "?";
  var shiny = !!enemy.shiny;
  var displayName = (shiny ? "✨ " : "") + name;

  var typeHtml = pd ? pd.types.map(function(t) {
    return "<span class='type-badge' style='background:" + (TYPE_COLORS[t] || "#aaa") + "'>" + t + "</span>";
  }).join("") : "";

  container.style.opacity = "1";
  container.className = shiny ? "enemy-shiny" : "";

  container.innerHTML =
    "<div class='enemy-info'>" +
      "<div class='enemy-nameline'>" + displayName +
        " <span class='enemy-lv'>Lv." + enemy.level + "</span>" + typeHtml +
      "</div>" +
      "<div class='enemy-hprow'>" +
        "<div class='enemy-hpbar'><div class='enemy-hpfill' id='enemyHpFill' style='width:" +
          Math.max(0, Math.round(enemy.currentHP / enemy.maxHP * 100)) + "%;background:" +
          hpColor(enemy.currentHP, enemy.maxHP) + "'></div></div>" +
        "<span class='enemy-hptxt' id='enemyHpTxt'>" + enemy.currentHP + "/" + enemy.maxHP + "</span>" +
      "</div>" +
      (enemy.status ? "<span class='status-badge status-" + enemy.status + "'>" + statusText(enemy.status) + "</span>" : "") +
    "</div>" +
    "<img class='enemy-img enemy-appear" + (shiny ? " shiny-sprite" : "") + "' " +
      "src='" + spriteUrl(enemy.dexId, false, shiny) + "' " +
      "alt='" + displayName + "' " +
      "onerror='this.src=\"" + spriteFallback(enemy.dexId, false, shiny) + "\"'>";
}

// ── Spieler-Sprite: Lead + Shiny ─────────────────────────────
function renderPlayerSprites() {
  var container = document.getElementById("playerSprites");
  if (!container || !STATE) return;
  container.innerHTML = "";

  var lead = STATE.party.find(function(p) { return p.currentHP > 0; });
  if (!lead) return;

  var pd    = PKMN[lead.dexId];
  var shiny = !!lead.shiny;
  var div   = document.createElement("div");
  div.className = "walker walker-lead" + (shiny ? " walker-shiny" : "");

  var hpPct = Math.max(0, Math.round(lead.currentHP / lead.maxHP * 100));
  div.innerHTML =
    "<img class='walker-sprite" + (shiny ? " shiny-sprite" : "") + "' " +
      "src='" + spriteUrl(lead.dexId, true, shiny) + "' " +
      "alt='" + (pd ? pd.name : "?") + "' " +
      "onerror='this.src=\"" + spriteFallback(lead.dexId, true, shiny) + "\"'>" +
    "<div class='walker-hpbar'>" +
      "<div class='walker-hpfill' style='width:" + hpPct + "%;background:" + hpColor(lead.currentHP, lead.maxHP) + "'></div>" +
    "</div>";

  container.appendChild(div);
}

// ── Tab-System mit Pokédex ────────────────────────────────────
function switchTab(tabName) {
  ["World","Team","Bag","Map","Dex"].forEach(function(t) {
    var btn  = document.getElementById("tab"  + t);
    var view = document.getElementById("view" + t);
    if (btn)  btn.classList.toggle("active", t === tabName);
    if (view) view.style.display = (t === tabName) ? "block" : "none";
  });
  if (tabName === "Team")  renderTeamScreen();
  if (tabName === "Bag")   renderBagScreen();
  if (tabName === "Map")   renderMapScreen();
  if (tabName === "World") renderWorldTab();
  if (tabName === "Dex")   renderPokedexScreen();
}
function onTabWorld(){ switchTab("World"); }
function onTabTeam() { switchTab("Team");  }
function onTabBag()  { switchTab("Bag");   }
function onTabMap()  { switchTab("Map");   }
function onTabDex()  { switchTab("Dex");   }

// ── Wilder Kampf: Seen-Tracking + Shiny-Ankündigung ──────────
function triggerWildBattle(wildPkmn) {
  clearInterval(STAGE_INTERVAL); _waitingForInput = true;
  var epd  = PKMN[wildPkmn.dexId];
  var name = epd ? epd.name : "?";

  // ── Pokédex: als gesehen markieren ──
  if (STATE) {
    if (!STATE.seen) STATE.seen = {};
    STATE.seen[wildPkmn.dexId] = true;
  }

  startBattle("wild", wildPkmn);
  renderEnemySprite(BATTLE.enemy, true); showBattleUI(BATTLE.enemy); clearBattleLog();

  if (wildPkmn.shiny) {
    appendBattleLog("✨✨✨ Ein SCHILLERNDES " + name + " erscheint! ✨✨✨");
    showToast("✨ Schillerndes " + name + "! ✨", 6000);
  } else {
    appendBattleLog("Ein wildes " + name + " Lv." + wildPkmn.level + " taucht auf!");
  }

  if (BATTLE.autoFight) startBattleLoop();
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

  var actions     = document.getElementById("battleActions");
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
