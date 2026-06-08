// ═══════════════════════════════════════════════════════════════
//  renderer_fixes.js — Hilfsfunktionen (homeCity, Fahrrad, EP)
// ═══════════════════════════════════════════════════════════════

// ── findRecoveryCity ──────────────────────────────────────────
// Findet nächste Stadt wenn Spieler besiegt wird
function findRecoveryCity(zoneId){
  var mainZones=WORLD.filter(function(z){
    return z.type==="city"||z.type==="route"||z.type==="dungeon"||z.type==="sea"||z.type==="gym";
  });
  var ci=mainZones.findIndex(function(z){return z.id===zoneId;});
  for(var i=ci;i>=0;i--){
    if(mainZones[i].type==="city"||i===0)return mainZones[i].id;
  }
  return "alabastia";
}

// ── Fahrrad-Speed ─────────────────────────────────────────────
// Halbiert Tick-Zeit auf Routen wenn Fahrrad vorhanden
function getEffectiveTickMs(){
  if(!STATE)return STAGE_TICK_MS;
  var zone=getZone(STATE.currentZoneId);
  if(!zone||zone.type==="city")return STAGE_TICK_MS;
  var hasFahrrad=STATE.items&&(STATE.items["fahrrad"]||0)>0;
  return hasFahrrad?Math.floor(STAGE_TICK_MS/2):STAGE_TICK_MS;
}

// ── EP-Teiler ─────────────────────────────────────────────────
// applyXP-Patch: wenn EP-Teiler vorhanden, erhält ganzes Team XP
(function patchApplyXP(){
  if(typeof applyXP!=="function")return;
  var _orig=applyXP;
  applyXP=function(pkmn,xp,killedDexId){
    var msgs=_orig(pkmn,xp,killedDexId)||[];
    if(!STATE||!(STATE.items&&STATE.items["ep_teiler"]>0))return msgs;
    // Alle anderen lebenden Party-Mitglieder erhalten anteilig XP
    STATE.party.forEach(function(p){
      if(p===pkmn||p.currentHP<=0)return;
      var share=Math.floor(xp*0.5); // 50% für Bench-Pokémon
      var extra=_orig(p,share,killedDexId)||[];
      extra.forEach(function(m){msgs.push("[EP-Teiler] "+m);});
    });
    return msgs;
  };
})();

// ── healPartyFully ────────────────────────────────────────────
// Falls noch nicht definiert
if(typeof healPartyFully==="undefined"){
  function healPartyFully(){
    if(!STATE||!STATE.party)return;
    STATE.party.forEach(function(p){
      p.currentHP=p.maxHP;p.status=null;p.statusTurns=0;
      if(p.pp&&p.moves)p.moves.forEach(function(m){p.pp[m]=ppMax(m);});
    });
    updateHUD();
  }
}

// ── homeCity Patch (Ohnmacht-Recovery) ───────────────────────
// Wird von onBattleEnd in renderer_patch.js genutzt
// findRecoveryCity ist oben definiert
