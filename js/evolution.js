// ═══════════════════════════════════════════════════════════════
//  evolution.js — Evolutions-Button + Overlay-Animation
// ═══════════════════════════════════════════════════════════════

var PNG_FRONT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
var PNG_FRONT_SHINY = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/";

// ── Prüfe alle Party-Pokémon auf ausstehende Evolutionen ─────
function checkPendingEvolutions() {
  if(!STATE||!STATE.party) return false;
  return STATE.party.some(function(p){ return !!p.readyToEvolve; });
}

// ── Haupt-Einstiegspunkt: Button im Team-Tab geklickt ────────
function triggerEvolution(partyIdx) {
  if(!STATE||!STATE.party) return;
  var pkmnInst = STATE.party[partyIdx];
  if(!pkmnInst||!pkmnInst.readyToEvolve) return;
  performEvolution(pkmnInst);
}

// ── Evolutions-Animation + Durchführung ──────────────────────
function performEvolution(pkmnInst) {
  if(!pkmnInst||!pkmnInst.readyToEvolve) return;

  var fromDexId = pkmnInst.dexId;
  var toDexId   = pkmnInst.readyToEvolve;
  var fromPd    = PKMN[fromDexId];
  var toPd      = PKMN[toDexId];
  var oldName   = pkmnInst.nick || (fromPd ? fromPd.name : "?");
  var newName   = toPd ? toPd.name : "?";
  var isShiny   = !!pkmnInst.shiny;

  var fromSrc = (isShiny ? PNG_FRONT_SHINY : PNG_FRONT) + fromDexId + ".png";
  var toSrc   = (isShiny ? PNG_FRONT_SHINY : PNG_FRONT) + toDexId   + ".png";

  // Pause Spielschleife
  clearInterval(STAGE_INTERVAL);
  clearInterval(BATTLE_INTERVAL);

  // Overlay erstellen
  var overlay = document.createElement("div");
  overlay.id = "evoOverlay";
  overlay.innerHTML =
    "<div class='evo-screen'>" +
      "<div class='evo-label' id='evoLabel'>"+oldName+" entwickelt sich...</div>" +
      "<div class='evo-sprites'>" +
        "<img id='evoFrom' class='evo-sprite"+(isShiny?" evo-shiny":"")+"' src='"+fromSrc+"'>"+
        "<img id='evoTo'   class='evo-sprite evo-sprite-hidden"+(isShiny?" evo-shiny":"")+"' src='"+toSrc+"'>"+
      "</div>" +
      "<div class='evo-flash-overlay' id='evoFlash'></div>" +
    "</div>";
  document.body.appendChild(overlay);

  var fromEl  = document.getElementById("evoFrom");
  var toEl    = document.getElementById("evoTo");
  var label   = document.getElementById("evoLabel");
  var flash   = document.getElementById("evoFlash");

  // ── Animation-Timeline ───────────────────────────────────────
  // 0.0s: Pokémon-Sprite erscheint (fade in)
  // 0.6s: Weißblitz-Pulse (3x) — klassischer Gen-1-Effekt
  // 2.0s: Weißblende → Neue Entwicklung erscheint
  // 2.8s: Glückwunsch-Text + neue Stats
  // 4.5s: Overlay schließt sich

  var pulseCount = 0;
  var maxPulses  = 6;

  function doPulse() {
    if(pulseCount >= maxPulses) {
      // Nach Pulsen: Großblende
      flash.style.transition = "opacity 0.4s";
      flash.style.opacity = "1";
      setTimeout(doSwap, 400);
      return;
    }
    flash.style.transition = "opacity 0.18s";
    flash.style.opacity = (pulseCount % 2 === 0) ? "0.85" : "0";
    pulseCount++;
    setTimeout(doPulse, 200);
  }

  function doSwap() {
    // Sprites tauschen
    fromEl.classList.add("evo-sprite-hidden");
    toEl.classList.remove("evo-sprite-hidden");
    // Flash ausblenden → neues Pokémon erscheint
    setTimeout(function() {
      flash.style.transition = "opacity 0.5s";
      flash.style.opacity = "0";
      label.textContent = "Herzlichen Glückwunsch!";
    }, 100);
    setTimeout(doComplete, 700);
  }

  function doComplete() {
    // Jetzt die eigentliche Evolution anwenden
    applyEvolutionData(pkmnInst, toDexId);

    // Text + Stats anzeigen
    var newPd = PKMN[toDexId];
    label.innerHTML =
      "<span class='evo-congrats'>"+(isShiny?"✨ ":"")+"</span>" +
      oldName + " hat sich zu <b>" + newName + "</b> entwickelt!";

    // Stats-Preview (klein darunter)
    if(newPd) {
      var statsDiv = document.createElement("div");
      statsDiv.className = "evo-stats";
      statsDiv.innerHTML =
        "<div class='evo-stat'><span>KP</span><b>"+pkmnInst.maxHP+"</b></div>"+
        "<div class='evo-stat'><span>Ang</span><b>"+pkmnInst.atk+"</b></div>"+
        "<div class='evo-stat'><span>Vert</span><b>"+pkmnInst.def+"</b></div>"+
        "<div class='evo-stat'><span>Init</span><b>"+pkmnInst.spe+"</b></div>";
      overlay.querySelector(".evo-screen").appendChild(statsDiv);
    }

    // Pokédex updaten
    if(STATE.seen)  STATE.seen[toDexId]  = true;
    if(STATE.caught)STATE.caught[toDexId]= true;

    renderTeamScreen();
    renderPlayerSprites();
    saveGame();

    // Auto-close nach 2.5s
    setTimeout(function() {
      overlay.classList.add("evo-fadeout");
      setTimeout(function() {
        if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
        // Spielschleife neu starten
        if(!_waitingForInput && !_inCity) startStageLoop();
        else STAGE_INTERVAL = setInterval(processStage, STAGE_TICK_MS);
        showToast("✨ "+newName+" bereit!", 3000);
      }, 600);
    }, 2500);
  }

  // Start nach kurzem Fade-in
  setTimeout(doPulse, 800);
}

// ── Evolution-Daten anwenden (Stats, Moves) ──────────────────
function applyEvolutionData(pkmnInst, toDexId) {
  var newPd = PKMN[toDexId]; if(!newPd) return;
  var ivs = pkmnInst.ivs || generateIVs();
  var evs = pkmnInst.evs || initEVs();
  var cm  = pkmnInst.moves.slice();
  var cp  = pkmnInst.pp ? JSON.parse(JSON.stringify(pkmnInst.pp)) : {};

  // Neue Attacken
  newPd.moves.forEach(function(entry) {
    if(entry[0] <= pkmnInst.level && MOVES[entry[1]]) {
      if(cm.indexOf(entry[1]) < 0) {
        if(cm.length >= 4) { var d2 = cm.shift(); delete cp[d2]; }
        cm.push(entry[1]);
        cp[entry[1]] = ppMax(entry[1]);
      }
    }
  });

  // Stats neu berechnen
  var newMaxHP = calcHP(newPd.hp, pkmnInst.level, ivs.hp, evs.hp);
  pkmnInst.currentHP = Math.min(pkmnInst.currentHP + (newMaxHP - pkmnInst.maxHP), newMaxHP);
  pkmnInst.maxHP = newMaxHP;
  pkmnInst.atk   = calcStat(newPd.atk, pkmnInst.level, ivs.atk, evs.atk);
  pkmnInst.def   = calcStat(newPd.def, pkmnInst.level, ivs.def, evs.def);
  pkmnInst.spa   = calcStat(newPd.spa, pkmnInst.level, ivs.spc, evs.spc);
  pkmnInst.spd   = calcStat(newPd.spd, pkmnInst.level, ivs.spc, evs.spc);
  pkmnInst.spe   = calcStat(newPd.spe, pkmnInst.level, ivs.spe, evs.spe);

  // dexId und Moves setzen, Flag löschen
  pkmnInst.dexId          = toDexId;
  pkmnInst.moves          = cm;
  pkmnInst.pp             = cp;
  pkmnInst.readyToEvolve  = null;
}
