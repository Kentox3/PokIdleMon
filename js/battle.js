// ═══════════════════════════════════════════════════════════════
//  battle.js — Gen-1-Kampfsystem
// ═══════════════════════════════════════════════════════════════

var BATTLE = null;

// ══════════════════════════════════════════════════════════════
//  GESCHLECHT
// ══════════════════════════════════════════════════════════════
var GENDER_RATIO = {
  1:0.125,2:0.125,3:0.125,4:0.125,5:0.125,6:0.125,7:0.125,8:0.125,9:0.125,
  113:1.0,115:1.0,124:1.0,
  106:0.0,107:0.0,128:0.0,
  81:null,82:null,100:null,101:null,120:null,121:null,
  132:null,137:null,144:null,145:null,146:null,150:null,151:null,
};
function generateGender(dexId){
  if(GENDER_RATIO.hasOwnProperty(dexId)){var r=GENDER_RATIO[dexId];if(r===null)return null;return Math.random()<r?"F":"M";}
  return Math.random()<0.5?"F":"M";
}
function genderSymbol(gender){
  if(gender==="M")return "<span class='gender-m'>♂</span>";
  if(gender==="F")return "<span class='gender-f'>♀</span>";
  return "";
}

// ══════════════════════════════════════════════════════════════
//  SCHADEN
// ══════════════════════════════════════════════════════════════
function calcDamage(attacker,defender,moveId){
  var move=MOVES[moveId];
  if(!move||move.pwr===0)return{damage:0,typeEff:1,crit:false};
  var atkPd=PKMN[attacker.dexId],defPd=PKMN[defender.dexId];
  var defTypes=defPd?defPd.types:["Normal"];
  var atkStat=isPhysical(move.type)?attacker.atk:attacker.spa;
  var defStat=isPhysical(move.type)?defender.def:defender.spd;
  if(BATTLE){
    if(attacker===getActivePkmn()){if(BATTLE.playerAtk&&isPhysical(move.type))atkStat=BATTLE.playerAtk;if(BATTLE.playerSpa&&!isPhysical(move.type))atkStat=BATTLE.playerSpa;}
    if(attacker===BATTLE.enemy&&BATTLE.enemyAtk&&isPhysical(move.type))atkStat=BATTLE.enemyAtk;
    if(defender===BATTLE.enemy&&BATTLE.enemyDef&&isPhysical(move.type))defStat=BATTLE.enemyDef;
  }
  var dmg=Math.floor(((2*attacker.level/5+2)*move.pwr*atkStat/defStat)/50+2);
  if(atkPd&&atkPd.types.indexOf(move.type)>=0)dmg=Math.floor(dmg*1.5);
  var typeEff=getTypeEffectiveness(move.type,defTypes);
  dmg=Math.floor(dmg*typeEff);
  dmg=Math.floor(dmg*(217+Math.floor(Math.random()*39))/255);
  var critChance=Math.min(255,Math.floor(move.highCrit?attacker.spe/2:attacker.spe/8));
  var isCrit=Math.floor(Math.random()*256)<critChance;
  if(isCrit)dmg=Math.floor(dmg*2);
  if(move.hits){var hits=move.hits[0]+Math.floor(Math.random()*(move.hits[1]-move.hits[0]+1));dmg*=hits;}
  return{damage:Math.max(1,dmg),typeEff:typeEff,crit:isCrit};
}

// ══════════════════════════════════════════════════════════════
//  PP-PRÜFUNG
// ══════════════════════════════════════════════════════════════
function hasPP(p){if(!p.pp)return true;return p.moves.some(function(m){return(p.pp[m]||0)>0;});}
function moveHasPP(p,mid){if(!p.pp)return true;return(p.pp[mid]||0)>0;}
function consumePP(p,mid){if(!p.pp||mid==="struggle")return;p.pp[mid]=Math.max(0,(p.pp[mid]||0)-1);}

// ══════════════════════════════════════════════════════════════
//  EFFEKT-BESCHREIBUNG (für einzeilige Kampflog-Meldungen)
// ══════════════════════════════════════════════════════════════
function effectDesc(effType){
  var map={
    "burn":"🔥 Verbrennt!","poison":"☠️ Vergiftet!","paralysis":"⚡ Gelähmt!",
    "sleep":"💤 Schläft ein!","freeze":"🧊 Eingefroren!",
    "heal50":"💚 HP erholt!","fullheal":"💚 Vollständig erholt!",
    "drain":"Energie entzogen.",
    "atk+1":"Angriff ↑","atk+2":"Angriff ↑↑",
    "def+1":"Abwehr ↑","def+2":"Abwehr ↑↑",
    "spa+1":"Sp.Ang. ↑","spa+2":"Sp.Ang. ↑↑",
    "spe+2":"Initiative ↑↑","eva+1":"Ausweichen ↑",
    "atk-1":"Geg. Angriff ↓","def-1":"Geg. Abwehr ↓",
    "spe-1":"Geg. Initiative ↓","acc-1":"Geg. Genauigkeit ↓",
  };
  return map[effType]||"";
}

// ══════════════════════════════════════════════════════════════
//  EFFEKT ANWENDEN — gibt kurzen Zusatztext zurück (wird inline
//  an die Angriffsmeldung gehängt, kein eigener Log-Eintrag)
// ══════════════════════════════════════════════════════════════
function applyEffect(target,move){
  var eff=move.effect;if(!eff)return "";
  var chance=eff.chance!==undefined?eff.chance:1.0;
  if(Math.random()>chance)return "";
  switch(eff.type){
    case "burn":      if(!target.status){target.status="burn";return "🔥 Verbrennung!";} break;
    case "poison":    if(!target.status){target.status="poison";return "☠️ Vergiftet!";} break;
    case "paralysis": if(!target.status){target.status="paralysis";return "⚡ Gelähmt!";} break;
    case "sleep":     if(!target.status){target.status="sleep";target.statusTurns=2+Math.floor(Math.random()*3);return "💤 Eingeschlafen!";} break;
    case "freeze":    if(!target.status){target.status="freeze";return "🧊 Eingefroren!";} break;
    case "heal50":    target.currentHP=Math.min(target.maxHP,target.currentHP+Math.floor(target.maxHP/2));return "💚 HP erholt!";
    case "fullheal":  target.currentHP=target.maxHP;target.status=null;target.statusTurns=0;return "💚 Vollständig erholt!";
    case "drain":     target.currentHP=Math.max(0,target.currentHP-Math.floor(target.maxHP*0.1));break;
    case "atk-1":     if(target===BATTLE.enemy)BATTLE.enemyAtk=Math.floor((BATTLE.enemyAtk||target.atk)*0.75);return "Angriff ↓";
    case "def-1":     if(target===BATTLE.enemy)BATTLE.enemyDef=Math.floor((BATTLE.enemyDef||target.def)*0.75);return "Abwehr ↓";
    case "spe-1":     if(target===BATTLE.enemy)BATTLE.enemySpe=Math.floor((BATTLE.enemySpe||target.spe)*0.75);return "Initiative ↓";
    case "def+1":     BATTLE.playerDef=Math.floor((BATTLE.playerDef||target.def)*1.25);return "Abwehr ↑";
    case "spa+1":     BATTLE.playerSpa=Math.floor((BATTLE.playerSpa||target.spa)*1.25);return "Sp.Ang. ↑";
    case "atk+2":     BATTLE.playerAtk=Math.floor((BATTLE.playerAtk||target.atk)*1.5);return "Angriff ↑↑";
  }
  return "";
}

function applyStatusDamage(pkmn){
  if(!pkmn||!pkmn.status)return null;
  var pd=PKMN[pkmn.dexId],name=pd?pd.name:"?";
  if(pkmn.status==="burn"||pkmn.status==="poison"){
    var dmg=Math.max(1,Math.floor(pkmn.maxHP/16));
    pkmn.currentHP=Math.max(0,pkmn.currentHP-dmg);
    return (pkmn.status==="burn"?"🔥 ":"☠️ ")+name+" leidet! (-"+dmg+" HP)";
  }
  if(pkmn.status==="sleep"){
    pkmn.statusTurns=(pkmn.statusTurns||1)-1;
    if(pkmn.statusTurns<=0){pkmn.status=null;return "☀️ "+name+" ist aufgewacht!";}
    return "💤 "+name+" schläft...";
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
//  AUTO-MOVE (KI)
// ══════════════════════════════════════════════════════════════
function autoPickMove(attacker,defender){
  var defPd=PKMN[defender.dexId],atkPd=PKMN[attacker.dexId];
  var defTypes=defPd?defPd.types:["Normal"];
  var hpPct=attacker.currentHP/attacker.maxHP,eHpPct=defender.currentHP/defender.maxHP;
  var isTrainerFight=BATTLE&&BATTLE.isTrainer;
  var usable=attacker.moves.filter(function(m){return moveHasPP(attacker,m);});
  if(!usable.length)return "struggle";
  var best=null,bestScore=-Infinity;
  usable.forEach(function(mid){
    var move=MOVES[mid];if(!move)return;
    var score=0,acc=(move.acc||100)/100;
    if(move.pwr>0){
      var eff=getTypeEffectiveness(move.type,defTypes);if(eff===0)return;
      score=move.pwr*eff*acc;
      if(atkPd&&atkPd.types.indexOf(move.type)>=0)score*=1.5;
      if(eff>=2)score*=1.1;if(move.highCrit)score*=1.1;
      if(move.priority&&eHpPct<0.35)score*=1.4;
      if(move.effect){var et=move.effect.type,ec=move.effect.chance||1;
        if(!defender.status){if(et==="burn"||et==="poison")score+=15*ec;if(et==="paralysis")score+=20*ec;if(et==="sleep"||et==="freeze")score+=30*ec;}
        if(et==="spe-1"||et==="atk-1")score+=10*ec;}
    }else{
      var eff2=move.effect;if(!eff2)return;var et2=eff2.type;
      if((et2==="sleep"||et2==="paralysis")&&!defender.status){score=90*acc;if(!isTrainerFight&&BATTLE&&BATTLE.canCatch)score+=30;if(eHpPct<0.25)score=5;}
      else if((et2==="poison"||et2==="burn")&&!defender.status){score=55*acc;if(eHpPct<0.25)score=5;}
      else if(et2==="heal50"||et2==="fullheal"){score=hpPct<0.35?100:hpPct<0.6?40:0;}
      else if(et2==="atk+2"||et2==="atk+1"){score=eHpPct>0.5?35:0;}
      else if(et2==="def+1"||et2==="def+2"){score=hpPct<0.5?20:5;}
      else if(et2==="spe+2"){score=15;}else if(et2==="spe-1"){score=!defender.status?30*acc:0;}
      else if(et2==="atk-1"){score=25*acc;}
    }
    if(score>bestScore){bestScore=score;best=mid;}
  });
  if(!best)best=usable.find(function(m){return MOVES[m]&&MOVES[m].pwr>0;})||usable[0]||"struggle";
  return best;
}

// ══════════════════════════════════════════════════════════════
//  BATTLE STARTEN
// ══════════════════════════════════════════════════════════════
function startBattle(type,data){
  STATE.party.forEach(function(p){p._faintAnnounced=false;});
  var enemyPkmn,queue=[];
  if(type==="wild"){
    enemyPkmn=data;
    if(enemyPkmn.gender===undefined)enemyPkmn.gender=generateGender(enemyPkmn.dexId);
  }else{
    queue=data.party.map(function(e){return createPkmnInstance(e.dexId,e.lv);});
    enemyPkmn=queue.shift();
  }
  BATTLE={type:type,trainerData:type!=="wild"?data:null,enemy:enemyPkmn,enemyQueue:queue,
    canFlee:type==="wild",canCatch:type==="wild",autoFight:true,over:false,result:null,
    xpGained:0,moneyGained:0,isTrainer:type!=="wild",playerMoveQueued:null};
  return BATTLE;
}

// ══════════════════════════════════════════════════════════════
//  SPIELER-ATTACKE — EINZEILER
//
//  Format: "Name → Attacke: 15 Schaden! Sehr effektiv!"
//          "Name → Härtner: Abwehr ↑"
//          "Name schläft..."
// ══════════════════════════════════════════════════════════════
function doPlayerAttack(moveId){
  if(!BATTLE||BATTLE.over)return[];
  var player=getActivePkmn();if(!player)return[];
  if(!player.pp)player.pp=initPP(player.moves);
  var pd=PKMN[player.dexId],log=[],name=pd?pd.name:"?";

  // ── Status-Blockaden (eigene Zeile — wichtige Events) ───────
  if(player.status==="sleep"){
    player.statusTurns=(player.statusTurns||1)-1;
    if(player.statusTurns<=0){player.status=null;log.push("☀️ "+name+" ist aufgewacht!");}
    else{log.push("💤 "+name+" schläft...");return log;}
  }
  if(player.status==="paralysis"&&Math.random()<0.25){
    log.push("⚡ "+name+" ist voll gelähmt!");return log;
  }
  if(player.status==="freeze"){
    if(Math.random()<0.2){player.status=null;log.push("🧊→☀️ "+name+" ist aufgetaut!");}
    else{log.push("🧊 "+name+" ist eingefroren!");return log;}
  }

  // ── Move-Auswahl ────────────────────────────────────────────
  if(!hasPP(player)){moveId="struggle";}
  else if(moveId!=="struggle"&&!moveHasPP(player,moveId)){
    moveId="struggle";
    log.push("Keine AP! "+name+" setzt Kräftemessen ein.");
  }

  consumePP(player,moveId);
  var move=MOVES[moveId]||MOVES["tackle"];

  // ── Einzeiler aufbauen ───────────────────────────────────────
  var line=name+" → "+move.name+": ";

  // Miss
  if(move.acc&&move.acc<100&&Math.random()>move.acc/100){
    log.push(line+"Daneben!");return log;
  }

  if(move.pwr>0){
    // Angriff mit Schaden
    var res=calcDamage(player,BATTLE.enemy,moveId);
    BATTLE.enemy.currentHP=Math.max(0,BATTLE.enemy.currentHP-res.damage);
    line+=res.damage+" Schaden!";
    if(res.crit)line+=" Volltreffer!";
    if(res.typeEff>1)line+=" ✨ Sehr effektiv!";
    else if(res.typeEff<1&&res.typeEff>0)line+=" 😐 Wenig effektiv...";
    else if(res.typeEff===0)line+=" Keine Wirkung!";
    // Nebenwirkung inline
    var ef=applyEffect(BATTLE.enemy,move);if(ef)line+=" "+ef;
    // Rückstoß
    if(moveId==="struggle"){
      var recoil=Math.max(1,Math.floor(player.maxHP/4));
      player.currentHP=Math.max(0,player.currentHP-recoil);
      line+=" Rückstoß: -"+recoil+" HP!";
    }
  }else{
    // Status-Attacke: Beschreibung des Effekts
    var eff=move.effect;
    if(eff){
      var desc=effectDesc(eff.type);
      if(eff.target==="self"||eff.type.indexOf("+")>=0){
        // Buff auf sich selbst
        var selfEf=applyEffect(player,move);
        line+=selfEf||desc||"...";
      }else{
        // Debuff / Status auf Gegner
        if(eff.acc!==undefined&&eff.acc<100&&Math.random()>eff.acc/100){
          line+="Daneben!";
        }else{
          var foeEf=applyEffect(BATTLE.enemy,move);
          line+=foeEf||desc||"...";
        }
      }
    }else{line+="...";}
  }

  log.push(line);
  return log;
}

// ══════════════════════════════════════════════════════════════
//  GEGNER-ATTACKE — EINZEILER
//
//  Format: "Gegner → Attacke: 8 Schaden!"
//          "Gegner → Schlafpulver: 💤 Eingeschlafen!"
// ══════════════════════════════════════════════════════════════
function doEnemyAttack(){
  if(!BATTLE||BATTLE.over)return[];
  var player=getActivePkmn();if(!player)return[];
  var enemy=BATTLE.enemy,epd=PKMN[enemy.dexId],log=[],ename=epd?epd.name:"?";

  // ── Status-Blockaden ─────────────────────────────────────────
  if(enemy.status==="sleep"){
    enemy.statusTurns=(enemy.statusTurns||1)-1;
    if(enemy.statusTurns<=0){enemy.status=null;log.push("☀️ "+ename+" ist aufgewacht!");}
    else{log.push("💤 "+ename+" schläft...");return log;}
  }
  if(enemy.status==="paralysis"&&Math.random()<0.25){log.push("⚡ "+ename+" ist voll gelähmt!");return log;}
  if(enemy.status==="freeze"){
    if(Math.random()<0.2){enemy.status=null;log.push("🧊→☀️ "+ename+" ist aufgetaut!");}
    else{log.push("🧊 "+ename+" ist eingefroren!");return log;}
  }

  var moveId=autoPickMove(enemy,player);
  consumePP(enemy,moveId);
  var move=MOVES[moveId]||MOVES["tackle"];
  var line=ename+" → "+move.name+": ";

  // Miss
  if(move.acc&&move.acc<100&&Math.random()>move.acc/100){
    log.push(line+"Daneben!");return log;
  }

  if(move.pwr>0){
    var res=calcDamage(enemy,player,moveId);
    player.currentHP=Math.max(0,player.currentHP-res.damage);
    line+=res.damage+" Schaden!";
    if(res.crit)line+=" Volltreffer!";
    var ef=applyEffect(player,move);if(ef)line+=" "+ef;
    if(moveId==="struggle"){var recoil=Math.max(1,Math.floor(enemy.maxHP/4));enemy.currentHP=Math.max(0,enemy.currentHP-recoil);}
  }else{
    var eff2=move.effect;
    if(eff2){
      var desc2=effectDesc(eff2.type);
      var foeEf2=applyEffect(player,move);
      line+=foeEf2||desc2||"...";
    }else{line+="...";}
  }

  log.push(line);
  return log;
}

// ══════════════════════════════════════════════════════════════
//  KAMPF-ENDE CHECK
// ══════════════════════════════════════════════════════════════
function checkBattleEnd(){
  if(!BATTLE||BATTLE.over)return null;
  var log=[],active=getActivePkmn();
  var ps=applyStatusDamage(active);if(ps)log.push(ps);
  var es=applyStatusDamage(BATTLE.enemy);if(es)log.push(es);
  if(BATTLE.enemy.currentHP<=0){
    var epd=PKMN[BATTLE.enemy.dexId];
    var xp=calcXPGain(active?active.level:1,BATTLE.enemy.level,epd?epd.baseXP:50,BATTLE.isTrainer);
    BATTLE.xpGained+=xp;
    if(active)gainEVs(active,BATTLE.enemy.dexId);
    log.push("💥 "+(epd?epd.name:"?")+" wurde besiegt!");
    if(BATTLE.enemyQueue&&BATTLE.enemyQueue.length>0){
      BATTLE.enemy=BATTLE.enemyQueue.shift();
      var np=PKMN[BATTLE.enemy.dexId];
      log.push("Trainer schickt "+(np?np.name:"?")+" Lv."+BATTLE.enemy.level+"!");
      return{log:log,over:false};
    }
    BATTLE.over=true;BATTLE.result="win";
    BATTLE.moneyGained=BATTLE.trainerData?BATTLE.trainerData.reward||0:Math.max(1,Math.floor(BATTLE.enemy.level/2));
    log.push("🏆 Kampf gewonnen! +"+xp+" EP");
    return{log:log,over:true,result:"win"};
  }
  var justFainted=STATE.party.find(function(p){return p.currentHP<=0&&!p._faintAnnounced;});
  if(justFainted){
    justFainted._faintAnnounced=true;
    var fpd=PKMN[justFainted.dexId];
    log.push("😵 "+(fpd?fpd.name:"?")+" ist K.O.!");
    var nextAlive=STATE.party.find(function(p){return p.currentHP>0;});
    if(!nextAlive){BATTLE.over=true;BATTLE.result="lose";log.push("Alle Pokémon sind K.O. — du verlierst das Bewusstsein...");return{log:log,over:true,result:"lose"};}
    log.push("Auf! "+(PKMN[nextAlive.dexId]?PKMN[nextAlive.dexId].name:"?")+" kämpft weiter!");
    return{log:log,over:false,playerSwitched:true};
  }
  return{log:log,over:false};
}

// ══════════════════════════════════════════════════════════════
//  FANGEN
// ══════════════════════════════════════════════════════════════
function doCatchAttempt(ballType){
  if(!BATTLE||!BATTLE.canCatch||BATTLE.over)return{caught:false,log:["Kann nicht fangen!"]};
  var count=STATE.items[ballType]||0;
  if(count<=0)return{caught:false,log:["Kein "+(ITEM_DEFS&&ITEM_DEFS[ballType]?ITEM_DEFS[ballType].name:ballType)+" mehr!"]};
  STATE.items[ballType]=count-1;
  var caught=tryCatch(BATTLE.enemy,ballType);
  var epd=PKMN[BATTLE.enemy.dexId],name=epd?epd.name:"?";
  if(caught){
    BATTLE.over=true;BATTLE.result="catch";
    var copy=JSON.parse(JSON.stringify(BATTLE.enemy));
    copy.iid=genIid();
    if(copy.gender===undefined)copy.gender=generateGender(copy.dexId);
    fixPkmn(copy);
    if(!STATE.caught)STATE.caught={};if(!STATE.seen)STATE.seen={};
    STATE.caught[copy.dexId]=true;STATE.seen[copy.dexId]=true;
    var added=addToParty(copy);if(!added)addToBox(copy);
    return{caught:true,log:["✅ "+name+" wurde gefangen!"],pkmn:copy,toParty:added};
  }
  return{caught:false,log:["❌ "+name+" bricht aus!"]};
}

// ── Item im Kampf ─────────────────────────────────────────────
function useBattleItem(itemKey){
  if(!BATTLE||BATTLE.over||!STATE)return false;
  if(!STATE.items[itemKey]||STATE.items[itemKey]<=0){showToast("Kein "+(ITEM_DEFS&&ITEM_DEFS[itemKey]?ITEM_DEFS[itemKey].name:itemKey)+"!");return false;}
  var player=getActivePkmn();if(!player)return false;
  var pd=PKMN[player.dexId],name=pd?pd.name:"Pokémon",used=false;
  switch(itemKey){
    case "potion":      if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;}player.currentHP=Math.min(player.maxHP,player.currentHP+20);used=true;break;
    case "superpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;}player.currentHP=Math.min(player.maxHP,player.currentHP+50);used=true;break;
    case "hyperpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;}player.currentHP=Math.min(player.maxHP,player.currentHP+200);used=true;break;
    case "maxpotion":   if(player.currentHP>=player.maxHP){showToast("HP voll!");return false;}player.currentHP=player.maxHP;used=true;break;
    case "fullrestore": player.currentHP=player.maxHP;player.status=null;player.statusTurns=0;player.moves.forEach(function(m){if(player.pp)player.pp[m]=ppMax(m);});used=true;break;
    case "fullheal":    player.status=null;player.statusTurns=0;used=true;break;
    case "antidote":    if(player.status!=="poison"){showToast("Nicht vergiftet!");return false;}player.status=null;used=true;break;
    case "awakening":   if(player.status!=="sleep"){showToast("Schläft nicht!");return false;}player.status=null;player.statusTurns=0;used=true;break;
    case "paralysheal": if(player.status!=="paralysis"){showToast("Nicht gelähmt!");return false;}player.status=null;used=true;break;
    case "revive":{var fainted=STATE.party.find(function(p){return p.currentHP<=0;});if(!fainted){showToast("Kein K.O. Pokémon!");return false;}fainted.currentHP=Math.floor(fainted.maxHP/2);fainted._faintAnnounced=false;used=true;appendBattleLog((PKMN[fainted.dexId]?PKMN[fainted.dexId].name:"?")+" wurde belebt!");break;}
    default:showToast("Hier nicht nutzbar.");return false;
  }
  if(used){STATE.items[itemKey]--;var def=ITEM_DEFS?ITEM_DEFS[itemKey]:null;appendBattleLog("🎒 "+name+" nutzt "+(def?def.name:itemKey)+"!");updatePlayerHp();renderPlayerSprites();saveGame();}
  return used;
}

function doFlee(){if(!BATTLE||!BATTLE.canFlee)return false;BATTLE.over=true;BATTLE.result="flee";return true;}
