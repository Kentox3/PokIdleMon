// ═══════════════════════════════════════════════════════════════
//  renderer.js — CSS Side-Scroller + Kampf-Visualisierung
// ═══════════════════════════════════════════════════════════════

var SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
var SPRITE_BACK = SPRITE_BASE + "back/";

function spriteUrl(dexId, back) {
  return (back ? SPRITE_BACK : SPRITE_BASE) + dexId + ".png";
}

// ── Zone-Hintergrund setzen ────────────────────────────────────
function renderZoneBg(zone) {
  if (!zone) return;
  var scene = document.getElementById("sceneView");
  if (!scene) return;
  scene.style.background = "linear-gradient(180deg," + zone.bgSky + " 0%," + zone.bgSky + " 50%," + zone.bgMid + " 70%," + zone.bgGround + " 100%)";
  var ground = document.getElementById("sceneGround");
  if (ground) ground.style.background = zone.bgGround;
}

// ── Spieler-Party ────────────────────────────────────────────
function renderPlayerSprites() {
  var container = document.getElementById("playerSprites");
  if (!container || !STATE) return;
  container.innerHTML = "";
  var alive = STATE.party.filter(function(p) { return p.currentHP > 0; }).slice(0, 3);
  alive.forEach(function(p, i) {
    var pd = PKMN[p.dexId];
    var div = document.createElement("div");
    div.className = "walker" + (i === 0 ? " walker-lead" : " walker-follow");
    div.style.zIndex = 10 - i;
    div.style.transform = "translateX(" + (i * -28) + "px)";
    var hpPct = Math.max(0, Math.round(p.currentHP / p.maxHP * 100));
    div.innerHTML =
      "<img src='" + spriteUrl(p.dexId, true) + "' alt='" + (pd ? pd.name : "") + "' onerror='this.src=\"" + spriteUrl(p.dexId, false) + "\"'>" +
      (i === 0 ? "<div class='walker-hpbar'><div class='walker-hpfill' style='width:" + hpPct + "%;background:" + hpColor(p.currentHP, p.maxHP) + "'></div></div>" : "");
    container.appendChild(div);
  });
}

// ── Gegner-Sprite ─────────────────────────────────────────────
function renderEnemySprite(enemy, visible) {
  var container = document.getElementById("enemySprite");
  if (!container) return;
  if (!enemy || !visible) {
    container.innerHTML = "";
    container.style.opacity = "0";
    return;
  }
  var pd = PKMN[enemy.dexId];
  var name = pd ? pd.name : "?";
  var typeHtml = pd ? pd.types.map(function(t) {
    return "<span class='type-badge' style='background:" + (TYPE_COLORS[t] || "#aaa") + "'>" + t + "</span>";
  }).join("") : "";
  container.style.opacity = "1";
  container.innerHTML =
    "<div class='enemy-info'>" +
      "<div class='enemy-nameline'>" + name + " <span class='enemy-lv'>Lv." + enemy.level + "</span>" + typeHtml + "</div>" +
      "<div class='enemy-hprow'>" +
        "<div class='enemy-hpbar'><div class='enemy-hpfill' id='enemyHpFill' style='width:" + Math.max(0, Math.round(enemy.currentHP / enemy.maxHP * 100)) + "%;background:" + hpColor(enemy.currentHP, enemy.maxHP) + "'></div></div>" +
        "<span class='enemy-hptxt' id='enemyHpTxt'>" + enemy.currentHP + "/" + enemy.maxHP + "</span>" +
      "</div>" +
      (enemy.status ? "<span class='status-badge status-" + enemy.status + "'>" + statusText(enemy.status) + "</span>" : "") +
    "</div>" +
    "<img class='enemy-img enemy-appear' src='" + spriteUrl(enemy.dexId, false) + "' alt='" + name + "'>";
}

function updateEnemyHp(enemy) {
  var fill = document.getElementById("enemyHpFill");
  var txt  = document.getElementById("enemyHpTxt");
  if (!enemy) return;
  if (fill) { fill.style.width = Math.max(0, Math.round(enemy.currentHP / enemy.maxHP * 100)) + "%"; fill.style.background = hpColor(enemy.currentHP, enemy.maxHP); }
  if (txt)  txt.textContent = enemy.currentHP + "/" + enemy.maxHP;
}

function updatePlayerHp() {
  var player = getActivePkmn();
  if (!player) return;
  var fill = document.querySelector(".walker-hpfill");
  if (fill) { fill.style.width = Math.max(0, Math.round(player.currentHP / player.maxHP * 100)) + "%"; fill.style.background = hpColor(player.currentHP, player.maxHP); }
}

// ── Kampf-UI ──────────────────────────────────────────────────
function showBattleUI(enemy) {
  var ui = document.getElementById("battlePanel");
  if (ui) ui.classList.add("battle-active");
  renderMoveButtons();
  updateCatchButton(enemy);
}

function hideBattleUI() {
  var ui = document.getElementById("battlePanel");
  if (ui) ui.classList.remove("battle-active");
  var mb = document.getElementById("moveButtons");
  if (mb) mb.innerHTML = "";
  var cb = document.getElementById("catchBtn");
  if (cb) cb.style.display = "none";
}

function renderMoveButtons() {
  var container = document.getElementById("moveButtons");
  if (!container) return;
  var player = getActivePkmn();
  if (!player) { container.innerHTML = ""; return; }
  container.innerHTML = "";
  player.moves.forEach(function(mid) {
    var move = MOVES[mid];
    if (!move) return;
    var btn = document.createElement("button");
    btn.className = "move-btn";
    btn.style.borderColor = TYPE_COLORS[move.type] || "#888";
    btn.innerHTML =
      "<span class='move-name'>" + move.name + "</span>" +
      "<span class='move-type' style='background:" + (TYPE_COLORS[move.type] || "#888") + "'>" + move.type + "</span>" +
      "<span class='move-pwr'>" + (move.pwr > 0 ? move.pwr + "Stk" : "Status") + "</span>";
    btn.onclick = function() { onMoveClick(mid); };
    container.appendChild(btn);
  });
}

function updateCatchButton(enemy) {
  var btn = document.getElementById("catchBtn");
  if (!btn || !enemy) return;
  var canCatch = BATTLE && BATTLE.canCatch && !BATTLE.over;
  btn.style.display = canCatch ? "block" : "none";
  var lowHP = enemy.currentHP <= Math.floor(enemy.maxHP * 0.5);
  if (lowHP && canCatch) btn.classList.add("catch-ready");
  else btn.classList.remove("catch-ready");
}

// ── Battle-Log ─────────────────────────────────────────────────
function appendBattleLog(lines) {
  var log = document.getElementById("battleLog");
  if (!log) return;
  if (typeof lines === "string") lines = [lines];
  lines.forEach(function(line) {
    if (!line) return;
    var p = document.createElement("p");
    p.textContent = line;
    log.appendChild(p);
    // Max 30 Zeilen im Log
    while (log.children.length > 30) log.removeChild(log.firstChild);
  });
  log.scrollTop = log.scrollHeight;
}

function clearBattleLog() {
  var log = document.getElementById("battleLog");
  if (log) log.innerHTML = "";
}

// ── Etappen-Info ──────────────────────────────────────────────
function renderStageInfo() {
  if (!STATE) return;
  var zone = getZone(STATE.currentZoneId);
  if (!zone) return;
  var zEl = document.getElementById("zoneName");
  var sEl = document.getElementById("stageInfo");
  if (zEl) zEl.textContent = zone.name;
  if (sEl) {
    var icon = { route:"🌿", dungeon:"🕳️", city:"🏙️", gym:"⚔️", sea:"🌊" }[zone.type] || "📍";
    sEl.textContent = icon + " Etappe " + STATE.currentStage + " / " + zone.stageCount;
  }
  var bar = document.getElementById("stageProgressFill");
  if (bar) bar.style.width = Math.round((STATE.currentStage - 1) / zone.stageCount * 100) + "%";
}

// ── Hilfsfunktionen ────────────────────────────────────────────
function hpColor(current, max) {
  var pct = max > 0 ? current / max : 0;
  if (pct > 0.5) return "#44cc44";
  if (pct > 0.25) return "#ffbb22";
  return "#ee4444";
}

function statusText(s) {
  return { burn:"BRN", poison:"GIF", paralysis:"LAH", sleep:"SCH", freeze:"EIS", confuse:"VWR" }[s] || s.toUpperCase().slice(0,3);
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, ms) {
  var zone = document.getElementById("toastZone");
  if (!zone) { console.log("[Toast]", msg); return; }
  var el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(function() {
    el.classList.add("toast-fade");
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
  }, ms || 2500);
}

// ── XP-Popup ──────────────────────────────────────────────────
function showXPPopup(xpAmount) {
  var el = document.getElementById("xpPopup");
  if (!el) return;
  el.textContent = "+" + xpAmount + " EP";
  el.style.opacity = "1";
  el.style.transform = "translateY(-30px)";
  setTimeout(function() { el.style.opacity = "0"; el.style.transform = "translateY(-60px)"; }, 1800);
}
