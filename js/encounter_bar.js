// ═══════════════════════════════════════════════════════════════
//  encounter_bar.js — Ladebar für Begegnungen auf Routen
//
//  Zeigt einen Balken der sich über STAGE_TICK_MS füllt.
//  Leuchtet grün bei wilden Pokémon, rot bei Trainern auf.
// ═══════════════════════════════════════════════════════════════

// ── Bar-Elemente ──────────────────────────────────────────────
function _eb() { return document.getElementById("ebWrap"); }
function _ebF(){ return document.getElementById("ebFill"); }
function _ebI(){ return document.getElementById("ebIcon"); }

// ── Bar starten (Etappen-Tick beginnt) ───────────────────────
function ebStart() {
  var wrap=_eb(), fill=_ebF(), icon=_ebI();
  if(!wrap||!fill) return;
  wrap.style.opacity="1";
  // Icon zurücksetzen
  if(icon){ icon.textContent=""; icon.className="eb-icon"; icon.style.opacity="0"; }
  // Balken: sofort auf 0 zurück, dann linear füllen
  fill.style.transition="none";
  fill.style.width="0%";
  fill.style.background="";
  fill.style.boxShadow="";
  void fill.offsetWidth; // reflow erzwingen
  fill.style.transition="width "+STAGE_TICK_MS+"ms linear";
  fill.style.width="100%";
}

// ── Begegnung aufleuchten lassen ──────────────────────────────
function ebHit(type) {
  var fill=_ebF(), icon=_ebI(), wrap=_eb();
  if(!fill) return;
  // Sofort auf 100% und Farbe je nach Typ
  fill.style.transition="width 0.12s ease-out";
  fill.style.width="100%";
  if(type==="wild"){
    fill.style.background="linear-gradient(90deg,#10b981,#6ee7b7)";
    fill.style.boxShadow="0 0 8px rgba(16,185,129,0.8)";
    if(icon){ icon.textContent="⚡"; }
  } else {
    fill.style.background="linear-gradient(90deg,#ef4444,#fca5a5)";
    fill.style.boxShadow="0 0 8px rgba(239,68,68,0.8)";
    if(icon){ icon.textContent="⚔️"; }
  }
  if(icon){
    icon.style.opacity="1";
    icon.className="eb-icon eb-hit";
  }
  if(wrap) wrap.style.opacity="1";
}

// ── Bar verstecken ────────────────────────────────────────────
function ebHide() {
  var wrap=_eb(), fill=_ebF(), icon=_ebI();
  if(wrap) wrap.style.opacity="0";
  if(fill){ fill.style.transition="none"; fill.style.width="0%"; }
  if(icon){ icon.textContent=""; icon.style.opacity="0"; }
}

// ══════════════════════════════════════════════════════════════
//  PATCHES
// ══════════════════════════════════════════════════════════════

// processStage → ebStart() bei jeder Etappe auf Route/Dungeon
(function patchProcessStage(){
  if(typeof processStage!=="function"){ setTimeout(patchProcessStage,200); return; }
  var _orig=processStage;
  processStage=function(){
    if(STATE&&!_waitingForInput&&!_inCity){
      var z=getZone(STATE.currentZoneId);
      if(z&&z.type!=="city"&&z.type!=="building") ebStart();
    }
    _orig();
  };
})();

// startBattle → ebHit je nach Kampftyp
(function patchStartBattle(){
  if(typeof startBattle!=="function"){ setTimeout(patchStartBattle,200); return; }
  var _orig=startBattle;
  startBattle=function(type, data){
    ebHit(type==="wild"?"wild":"trainer");
    return _orig(type, data);
  };
})();

// goToCity → ebHide (Stadteingang)
(function patchGoToCity(){
  if(typeof goToCity!=="function"){ setTimeout(patchGoToCity,200); return; }
  var _orig=goToCity;
  goToCity=function(cityId){
    ebHide();
    return _orig(cityId);
  };
})();
