// patch.js — Überschreibt fastTravelTo aus app.js
// Sicherheitscheck: nur Städte erlaubt
function fastTravelTo(zoneId) {
  if(!STATE) return;
  if(BATTLE&&!BATTLE.over){showToast("Im Kampf nicht möglich!"); return;}
  if(!isZoneVisited(zoneId)){showToast("Noch nicht besucht!"); return;}
  var zone=getZone(zoneId);
  if(!zone||zone.type!=="city"){showToast("Schnellreise nur zu Städten möglich!"); return;}
  clearInterval(STAGE_INTERVAL); clearInterval(BATTLE_INTERVAL);
  _waitingForInput=false; _inCity=false; _animRunning=false;
  hideBattleUI(); renderEnemySprite(null,false);
  STATE.currentZoneId=zoneId; STATE.currentStage=1;
  renderZoneBg(zone);
  renderStageInfo(); renderPlayerSprites(); renderWorldTab();
  saveGame(); showToast("✈ Schnellreise nach "+zone.name+"!");
  switchTab("World"); startStageLoop();
}
