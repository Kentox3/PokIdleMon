// ═══════════════════════════════════════════════════════════════
//  engine.js — Gen-1-getreue Mechanik: IVs, PP, EVs, Stats
// ═══════════════════════════════════════════════════════════════

var STATE = null;
var _iidCounter = 0;

function genIid() { return "p" + (++_iidCounter) + "_" + Date.now(); }

function evBonus(ev) {
  ev = ev || 0;
  return Math.floor(Math.min(255, Math.ceil(Math.sqrt(ev))) / 4);
}
function calcHP(base, level, iv, ev) {
  iv = (iv !== undefined && iv !== null) ? iv : 8; ev = ev || 0;
  return Math.max(1, Math.floor((base + iv) * 2 * level / 100) + level + 10 + evBonus(ev));
}
function calcStat(base, level, iv, ev) {
  iv = (iv !== undefined && iv !== null) ? iv : 8; ev = ev || 0;
  return Math.max(1, Math.floor((base + iv) * 2 * level / 100) + 5 + evBonus(ev));
}
function generateIVs() {
  var atk=Math.floor(Math.random()*16), def=Math.floor(Math.random()*16),
      spe=Math.floor(Math.random()*16), spc=Math.floor(Math.random()*16);
  return { hp:(atk%2)*8+(def%2)*4+(spe%2)*2+(spc%2), atk:atk, def:def, spe:spe, spc:spc };
}
function initEVs() { return { hp:0, atk:0, def:0, spe:0, spc:0 }; }
function initPP(moves) {
  var pp={};
  try { (moves||[]).forEach(function(mid){ pp[mid]=(typeof MOVES!=="undefined"&&MOVES[mid])?MOVES[mid].pp:10; }); } catch(e){}
  return pp;
}
function ppMax(moveId) {
  try { return (typeof MOVES!=="undefined"&&MOVES[moveId])?MOVES[moveId].pp:10; } catch(e){ return 10; }
}
function getLearnedMoves(dexId, level) {
  var pd=PKMN[dexId]; if(!pd) return ["tackle"];
  var learned=[]; pd.moves.forEach(function(e){ if(e[0]<=level) learned.push(e[1]); });
  var unique=[]; learned.reverse().forEach(function(m){ if(unique.indexOf(m)<0&&(typeof MOVES!=="undefined")&&MOVES[m]) unique.push(m); });
  var result=unique.slice(0,4).reverse(); if(result.length===0) result=["tackle"];
  return result;
}

function fixPkmn(p) {
  if(!p) return p;
  try {
    if(!p.ivs){
      p.ivs=generateIVs(); var pd=PKMN[p.dexId];
      if(pd){ var ev=p.evs||initEVs();
        p.maxHP=calcHP(pd.hp,p.level,p.ivs.hp,ev.hp); p.currentHP=Math.min(p.currentHP||1,p.maxHP);
        p.atk=calcStat(pd.atk,p.level,p.ivs.atk,ev.atk); p.def=calcStat(pd.def,p.level,p.ivs.def,ev.def);
        p.spa=calcStat(pd.spa,p.level,p.ivs.spc,ev.spc); p.spd=calcStat(pd.spd,p.level,p.ivs.spc,ev.spc);
        p.spe=calcStat(pd.spe,p.level,p.ivs.spe,ev.spe);
      }
    }
    if(!p.evs) p.evs=initEVs();
    if(!p.pp)  p.pp=initPP(p.moves||[]);
    if(p.shiny===undefined)         p.shiny=false;
    if(p.readyToEvolve===undefined) p.readyToEvolve=null;
    if(!p.moves||p.moves.length===0) p.moves=["tackle"];
    (p.moves||[]).forEach(function(mid){ try{ if(p.pp[mid]===undefined) p.pp[mid]=ppMax(mid); }catch(e){ p.pp[mid]=10; } });
  } catch(e){ console.warn("[fixPkmn]",e,p); }
  return p;
}

function createPkmnInstance(dexId, level) {
  var pd=PKMN[dexId]; if(!pd) return null;
  var ivs=generateIVs(), evs=initEVs(), moves=getLearnedMoves(dexId,level);
  var maxHP=calcHP(pd.hp,level,ivs.hp,0);
  return {
    iid:genIid(), dexId:dexId, nick:"", level:level, xp:0, xpToNext:xpForLevel(level+1),
    currentHP:maxHP, maxHP:maxHP,
    atk:calcStat(pd.atk,level,ivs.atk,0), def:calcStat(pd.def,level,ivs.def,0),
    spa:calcStat(pd.spa,level,ivs.spc,0), spd:calcStat(pd.spd,level,ivs.spc,0),
    spe:calcStat(pd.spe,level,ivs.spe,0),
    ivs:ivs, evs:evs, moves:moves, pp:initPP(moves),
    status:null, statusTurns:0, shiny:false, readyToEvolve:null,
  };
}

function xpForLevel(level){ return level*level*level; }

function calcXPGain(playerLevel,enemyLevel,baseXP,isTrainer){
  var base=Math.floor((baseXP*enemyLevel)/7);
  if(isTrainer) base=Math.floor(base*1.5);
  var diff=playerLevel-enemyLevel;
  if(diff>5) base=Math.floor(base*Math.max(0.1,1-(diff-5)*0.1));
  return Math.max(1,base);
}

function gainEVs(pkmnInst,enemyDexId){
  try{
    var epd=PKMN[enemyDexId]; if(!epd) return;
    if(!pkmnInst.evs) pkmnInst.evs=initEVs();
    pkmnInst.evs.hp =Math.min(65535,(pkmnInst.evs.hp ||0)+epd.hp);
    pkmnInst.evs.atk=Math.min(65535,(pkmnInst.evs.atk||0)+epd.atk);
    pkmnInst.evs.def=Math.min(65535,(pkmnInst.evs.def||0)+epd.def);
    pkmnInst.evs.spe=Math.min(65535,(pkmnInst.evs.spe||0)+epd.spe);
    pkmnInst.evs.spc=Math.min(65535,(pkmnInst.evs.spc||0)+Math.max(epd.spa||0,epd.spd||0));
  }catch(e){}
}

function applyXP(pkmnInst,xpGained,enemyDexId){
  var msgs=[];
  try{
    if(!pkmnInst.ivs) fixPkmn(pkmnInst);
    pkmnInst.xp+=xpGained;
    if(enemyDexId) gainEVs(pkmnInst,enemyDexId);
    while(pkmnInst.xp>=pkmnInst.xpToNext&&pkmnInst.level<100){
      pkmnInst.xp-=pkmnInst.xpToNext; pkmnInst.level++;
      var pd=PKMN[pkmnInst.dexId], ivs=pkmnInst.ivs||generateIVs(), evs=pkmnInst.evs||initEVs();
      pkmnInst.ivs=ivs; pkmnInst.evs=evs;
      var newHP=calcHP(pd.hp,pkmnInst.level,ivs.hp,evs.hp);
      pkmnInst.currentHP=Math.min(pkmnInst.currentHP+(newHP-pkmnInst.maxHP),newHP);
      pkmnInst.maxHP=newHP;
      pkmnInst.atk=calcStat(pd.atk,pkmnInst.level,ivs.atk,evs.atk);
      pkmnInst.def=calcStat(pd.def,pkmnInst.level,ivs.def,evs.def);
      pkmnInst.spa=calcStat(pd.spa,pkmnInst.level,ivs.spc,evs.spc);
      pkmnInst.spd=calcStat(pd.spd,pkmnInst.level,ivs.spc,evs.spc);
      pkmnInst.spe=calcStat(pd.spe,pkmnInst.level,ivs.spe,evs.spe);
      pkmnInst.xpToNext=xpForLevel(pkmnInst.level+1);
      pd.moves.forEach(function(entry){
        if(entry[0]===pkmnInst.level&&MOVES[entry[1]]){
          if(pkmnInst.moves.indexOf(entry[1])<0){
            if(pkmnInst.moves.length>=4){ var dr=pkmnInst.moves.shift(); if(pkmnInst.pp) delete pkmnInst.pp[dr]; }
            pkmnInst.moves.push(entry[1]);
            if(!pkmnInst.pp) pkmnInst.pp={};
            pkmnInst.pp[entry[1]]=ppMax(entry[1]);
            msgs.push((pkmnInst.nick||pd.name)+" lernt "+MOVES[entry[1]].name+"!");
          }
        }
      });
      msgs.push((pkmnInst.nick||pd.name)+" ist jetzt Level "+pkmnInst.level+"!");
      // readyToEvolve statt Auto-Evolution
      if(pd.evo && pd.evLv && pkmnInst.level >= pd.evLv && !pkmnInst.readyToEvolve) {
        pkmnInst.readyToEvolve = pd.evo;
        msgs.push("✨ "+(pkmnInst.nick||pd.name)+" ist bereit zur Entwicklung!");
      }
    }
  }catch(e){ console.warn("[applyXP]",e); }
  return msgs;
}

function tryCatch(enemyInst,ballType){
  var pd=PKMN[enemyInst.dexId], catchRate=pd?pd.catchRate:45;
  var ballMult={pokeball:1,superball:1.5,hyperball:2,masterball:255}[ballType]||1;
  if(ballType==="masterball") return true;
  var hpFactor=(enemyInst.maxHP*3-enemyInst.currentHP*2)/(enemyInst.maxHP*3);
  var statusMult=(enemyInst.status==="sleep"||enemyInst.status==="freeze")?2:enemyInst.status?1.5:1;
  var eff=Math.max(1,Math.min(255,Math.floor(catchRate*hpFactor*ballMult*statusMult)));
  return Math.floor(Math.random()*256)<eff;
}

// ══════════════════════════════════════════════════════════════
//  NEUES SPIEL
// ══════════════════════════════════════════════════════════════
function initNewGame(uid, trainerName, starterDexId) {
  var starter = createPkmnInstance(starterDexId, 5);
  STATE = {
    uid: uid, name: trainerName, starter: starterDexId,
    party: [starter], box: [],
    items: { pokeball:5, superball:0, hyperball:0, potion:3, superpotion:0 },
    money: 1000, badges: 0, badgeIds: [],
    defeatedTrainers: {},
    visitedZones: { "alabastia": true },
    currentZoneId: "alabastia",
    currentStage: 1,
    seen: {}, caught: {},
    eventFlags: {},
    currentBuilding: null,
    lastSeen: Date.now(), version: 5,
  };
  STATE.caught[starterDexId] = true;
  STATE.seen[starterDexId]   = true;
  return STATE;
}

// ── Spielstand laden ─────────────────────────────────────────
function loadGameState(uid, savedState) {
  try {
    STATE = savedState; STATE.uid = uid;
    if(!STATE.items)            STATE.items={pokeball:5};
    if(!STATE.badgeIds)         STATE.badgeIds=[];
    if(!STATE.defeatedTrainers) STATE.defeatedTrainers={};
    if(!STATE.visitedZones)     STATE.visitedZones={};
    if(!STATE.seen)             STATE.seen={};
    if(!STATE.caught)           STATE.caught={};
    if(!STATE.party)            STATE.party=[];
    if(!STATE.box)              STATE.box=[];
    if(!STATE.eventFlags)       STATE.eventFlags={};
    if(!STATE.currentBuilding)  STATE.currentBuilding=null;

    STATE.party.forEach(function(p){ try{ fixPkmn(p); }catch(e){ console.warn("[load] party:",e); } });
    STATE.box.forEach(function(p){   try{ fixPkmn(p); }catch(e){ console.warn("[load] box:",e);   } });

    STATE.party.forEach(function(p){ if(p&&p.dexId){ STATE.caught[p.dexId]=true; STATE.seen[p.dexId]=true; } });
    STATE.box.forEach(function(p){   if(p&&p.dexId){ STATE.caught[p.dexId]=true; STATE.seen[p.dexId]=true; } });

    var mainZones = WORLD.filter(function(z) { return z.type !== "building"; });
    var curIdx = mainZones.findIndex(function(z){ return z.id===STATE.currentZoneId; });
    if(curIdx<0){ STATE.currentZoneId="alabastia"; STATE.currentStage=1; curIdx=0; }
    for(var vi=0;vi<=curIdx;vi++){
      try{ STATE.visitedZones[mainZones[vi].id]=true; }catch(e){}
    }
    STATE.currentBuilding = null;

  } catch(e) {
    console.error("[loadGameState]",e);
    if(!STATE) STATE=savedState||{}; STATE.uid=uid;
    if(!STATE.party)        STATE.party=[];
    if(!STATE.box)          STATE.box=[];
    if(!STATE.items)        STATE.items={pokeball:5};
    if(!STATE.seen)         STATE.seen={};
    if(!STATE.caught)       STATE.caught={};
    if(!STATE.eventFlags)   STATE.eventFlags={};
    if(!STATE.currentBuilding) STATE.currentBuilding=null;
    if(!STATE.currentZoneId){ STATE.currentZoneId="alabastia"; STATE.currentStage=1; }
    if(!STATE.visitedZones)  STATE.visitedZones={"alabastia":true};
  }
  var now=Date.now(), away=Math.min((now-(STATE.lastSeen||now))/1000,8*3600);
  STATE.lastSeen=now;
  return { state:STATE, awaySeconds:Math.floor(away) };
}

// ── Event-Flags ───────────────────────────────────────────────
function isEventFlagSet(flagId) {
  if(!flagId||!STATE||!STATE.eventFlags) return false;
  return !!STATE.eventFlags[flagId];
}
function setEventFlag(flagId) {
  if(!flagId||!STATE) return;
  if(!STATE.eventFlags) STATE.eventFlags={};
  STATE.eventFlags[flagId] = true;
}

// ── Condition-Check ───────────────────────────────────────────
function checkExitCondition(cond) {
  if(!cond||!STATE) return true;
  if(cond.minBadges && STATE.badges < cond.minBadges) return false;
  if(cond.hasBadge  && STATE.badgeIds.indexOf(cond.hasBadge)<0) return false;
  if(cond.hasItem   && (!STATE.items[cond.hasItem]||STATE.items[cond.hasItem]<=0)) return false;
  if(cond.eventFlag && !isEventFlagSet(cond.eventFlag)) return false;
  return true;
}

// ── Rival-Starter ─────────────────────────────────────────────
function getRivalStarterDexId() {
  var map = { 1:4, 4:7, 7:1 };
  return map[STATE ? STATE.starter : 4] || 4;
}

function getActivePkmn(){ if(!STATE) return null; return STATE.party.find(function(p){ return p.currentHP>0; })||null; }
function getPartyAlive(){ if(!STATE) return 0; return STATE.party.filter(function(p){ return p.currentHP>0; }).length; }

function healPartyFully(){
  if(!STATE) return;
  STATE.party.forEach(function(p){
    try{ fixPkmn(p); p.currentHP=p.maxHP; p.status=null; p.statusTurns=0; p._faintAnnounced=false;
      if(!p.pp) p.pp=initPP(p.moves||[]); p.moves.forEach(function(mid){ p.pp[mid]=ppMax(mid); }); }catch(e){}
  });
}

function addToBox(pkmnInst){ if(!STATE.box) STATE.box=[]; STATE.box.push(pkmnInst); if(STATE.box.length>240) STATE.box.shift(); }
function addToParty(pkmnInst){ if(!STATE.party) STATE.party=[]; if(STATE.party.length<6){ STATE.party.push(pkmnInst); return true; } return false; }

function getWildPokemon(zone){
  if(!zone.wildPokemon||zone.wildPokemon.length===0) return null;
  var total=zone.wildPokemon.reduce(function(s,e){ return s+e.weight; },0), roll=Math.random()*total, cum=0;
  for(var i=0;i<zone.wildPokemon.length;i++){
    cum+=zone.wildPokemon[i].weight;
    if(roll<cum){ var e=zone.wildPokemon[i], lv=e.minLv+Math.floor(Math.random()*(e.maxLv-e.minLv+1));
      var p=createPkmnInstance(e.dexId,lv); p.shiny=Math.random()<(1/250); return p; }
  }
  return null;
}

function getTrainerAtStage(zone,stage){ if(!zone.trainers) return null; return zone.trainers.find(function(t){ return t.stage===stage; })||null; }
function isGymLeaderStage(zone,stage){ return zone.gymLeader&&zone.gymLeader.stage===stage; }
function isTrainerDefeated(zoneId,stage){ return !!(STATE.defeatedTrainers&&STATE.defeatedTrainers[zoneId+":"+stage]); }
function markTrainerDefeated(zoneId,stage){ if(!STATE.defeatedTrainers) STATE.defeatedTrainers={}; STATE.defeatedTrainers[zoneId+":"+stage]=true; }
function markZoneVisited(zoneId){ if(!STATE.visitedZones) STATE.visitedZones={}; STATE.visitedZones[zoneId]=true; }
function isZoneVisited(zoneId){ return !!(STATE.visitedZones&&STATE.visitedZones[zoneId]); }

function saveGame(){
  if(!STATE||!STATE.uid) return;
  if(!window.dbSet||!window.playerPath) return;
  STATE.lastSeen=Date.now();
  dbSet(playerPath(STATE.uid),STATE).catch(function(e){ console.warn("[saveGame]",e); });
}

// ══════════════════════════════════════════════════════════════
//  findRecoveryCity — korrekte Ohnmacht-Zielstadt ermitteln
//
//  PROBLEM: Der WORLD-Array ist nicht geografisch sortiert.
//  Route22 steht nach Zinnoberinsel im Array → Rückwärtslauf
//  findet falsche Stadt. Diese Funktion prüft zuerst homeCity.
// ══════════════════════════════════════════════════════════════
function findRecoveryCity(zoneId) {
  // 1. Explizite homeCity-Angabe hat Priorität (für Umwege wie Route 22)
  var zone = getZone(zoneId);
  if(zone && zone.homeCity) return zone.homeCity;

  // 2. Rückwärtslauf durch Hauptzonen (exkl. Gebäude)
  var mainZones = WORLD.filter(function(z){
    return z.type==="city" || z.type==="route" ||
           z.type==="dungeon" || z.type==="sea" || z.type==="gym";
  });
  var ci = mainZones.findIndex(function(z){ return z.id === zoneId; });
  if(ci < 0) return "alabastia";
  for(var i = ci; i >= 0; i--) {
    if(mainZones[i].type === "city") return mainZones[i].id;
  }
  return "alabastia";
}
