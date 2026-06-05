
// ══════════════════════════════════════════════════════════════
// renderer_patch.js — Überschreibt Funktionen aus renderer.js
// ══════════════════════════════════════════════════════════════

// ── updateEnemyHp — FEHLT in renderer.js, hier definiert ─────
// Ohne diese Funktion friert jeder Kampf ein (ReferenceError)
function updateEnemyHp(enemy) {
  if (!enemy) return;
  var fill = document.getElementById("enemyHpFill");
  var txt  = document.getElementById("enemyHpTxt");
  if (fill) {
    fill.style.width      = Math.max(0, Math.round(enemy.currentHP / enemy.maxHP * 100)) + "%";
    fill.style.background = hpColor(enemy.currentHP, enemy.maxHP);
  }
  if (txt) txt.textContent = enemy.currentHP + "/" + enemy.maxHP;
}

// ── renderMoveButtons — PP-aware, zeigt verbleibende AP ───────
// Überschreibt die Version in renderer.js die kein PP zeigt
function renderMoveButtons() {
  var container = document.getElementById("moveButtons"); if (!container) return;
  var player = getActivePkmn(); if (!player) { container.innerHTML = ""; return; }
  container.innerHTML = "";
  player.moves.forEach(function(mid) {
    var move = MOVES[mid]; if (!move) return;
    var pp      = player.pp ? (player.pp[mid] !== undefined ? player.pp[mid] : move.pp) : move.pp;
    var ppMax   = move.pp;
    var ppEmpty = (pp <= 0);
    var col     = (typeof TYPE_COLORS !== "undefined" && TYPE_COLORS[move.type]) ? TYPE_COLORS[move.type] : "#888";
    var btn = document.createElement("button");
    btn.className = "move-btn" + (ppEmpty ? " move-btn-empty" : "");
    btn.style.borderColor = ppEmpty ? "#444" : col;
    btn.style.opacity     = ppEmpty ? "0.45" : "1";
    btn.innerHTML =
      "<span class='move-name'>" + move.name + "</span>" +
      "<span class='move-type' style='background:" + (ppEmpty ? "#444" : col) + "'>" + move.type + "</span>" +
      "<span class='move-pwr'>" + (move.pwr > 0 ? move.pwr + "Stk" : "Status") + "</span>" +
      "<span class='move-pp" + (ppEmpty ? " move-pp-empty" : (pp <= Math.ceil(ppMax / 4) ? " move-pp-low" : "")) + "'>" + pp + "/" + ppMax + "AP</span>";
    // Klick: auch 0-PP-Moves sind wählbar (führt zu Struggle über battle.js-Logik)
    btn.onclick = (function(m) { return function() { onMoveClick(m); }; })(mid);
    container.appendChild(btn);
  });
}

