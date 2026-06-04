// ── Fangen ────────────────────────────────────────────────────
function doCatchAttempt(ballType) {
  if (!BATTLE || !BATTLE.canCatch || BATTLE.over) return { caught:false, log:["Kann nicht fangen!"] };
  if (!STATE.items[ballType] || STATE.items[ballType] <= 0) return { caught:false, log:["Kein " + ballType + "!"] };
  STATE.items[ballType]--;
  var caught = tryCatch(BATTLE.enemy, ballType);
  var epd = PKMN[BATTLE.enemy.dexId], name = epd?epd.name:"?";
  if (caught) {
    BATTLE.over = true; BATTLE.result = "catch";
    var copy = JSON.parse(JSON.stringify(BATTLE.enemy));
    copy.iid = genIid();
    fixPkmn(copy);
    // ── Pokédex: als gefangen + gesehen markieren ──
    if (STATE) {
      if (!STATE.caught) STATE.caught = {};
      if (!STATE.seen)   STATE.seen   = {};
      STATE.caught[copy.dexId] = true;
      STATE.seen[copy.dexId]   = true;
    }
    var added = addToParty(copy);
    if (!added) addToBox(copy);
    return { caught:true, log:[name+" wurde gefangen!"], pkmn:copy, toParty:added };
  }
  return { caught:false, log:[name+" bricht aus!"] };
}
