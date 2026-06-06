// ═══════════════════════════════════════════════════════════════
//  ui.js — Starter, Team, Map, Bag, HUD
// ═══════════════════════════════════════════════════════════════

var ITEM_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/";
var PS_TRAINER = "https://play.pokemonshowdown.com/sprites/trainers/";

var BALL_SPRITES = {
  pokeball:   ITEM_BASE + "poke-ball.png",
  superball:  ITEM_BASE + "great-ball.png",
  hyperball:  ITEM_BASE + "ultra-ball.png",
  masterball: ITEM_BASE + "master-ball.png",
};

var ITEM_DEFS = {
  pokeball:    { name:"Pokéball",    desc:"Normaler Pokéball",     img: ITEM_BASE+"poke-ball.png" },
  superball:   { name:"Superball",   desc:"Bessere Fangchance",    img: ITEM_BASE+"great-ball.png" },
  hyperball:   { name:"Hyperball",   desc:"Beste Fangchance",      img: ITEM_BASE+"ultra-ball.png" },
  masterball:  { name:"Meisterball", desc:"Immer fangen",          img: ITEM_BASE+"master-ball.png" },
  potion:      { name:"Trank",       desc:"+20 HP",                img: ITEM_BASE+"potion.png" },
  superpotion: { name:"Supertrank",  desc:"+50 HP",                img: ITEM_BASE+"super-potion.png" },
  hyperpotion: { name:"Hypertrank",  desc:"+200 HP",               img: ITEM_BASE+"hyper-potion.png" },
  maxpotion:   { name:"MaxTrank",    desc:"Volle HP",              img: ITEM_BASE+"max-potion.png" },
  fullrestore: { name:"Komplett",    desc:"HP + Status",           img: ITEM_BASE+"full-restore.png" },
  antidote:    { name:"Gegengift",   desc:"Heilt Gift",            img: ITEM_BASE+"antidote.png" },
  awakening:   { name:"Weckflöte",   desc:"Heilt Schlaf",          img: ITEM_BASE+"awakening.png" },
  paralysheal: { name:"Paraheilm.", desc:"Heilt Lähmung",          img: ITEM_BASE+"paralyze-heal.png" },
  fullheal:    { name:"Vollheiler",  desc:"Alle Status",           img: ITEM_BASE+"full-heal.png" },
  revive:      { name:"Beleber",     desc:"Belebt K.O. Pokémon",  img: ITEM_BASE+"revive.png" },
  escape:      { name:"Fluchtweg",   desc:"Flieht aus Höhlen",     img: ITEM_BASE+"escape-rope.png" },
  old_amber:    { name:"Altes Bernstein", desc:"Schlüsselitem: Fossil", img: ITEM_BASE+"old-amber.png",    isKey:true },
  dome_fossil:  { name:"Kuppelfossil",    desc:"Schlüsselitem: Fossil", img: ITEM_BASE+"dome-fossil.png",  isKey:true },
  helix_fossil: { name:"Spiralenfossil",  desc:"Schlüsselitem: Fossil", img: ITEM_BASE+"helix-fossil.png", isKey:true },
  hm_cut:      { name:"VM01 Zerschneider", desc:"Schneidet Büsche frei. Braucht Kaskadenmedaille.",
                 img: ITEM_BASE+"hm01.png", isHM:true, hmType:"Normal",
                 lockedBy:"cascade", usageDesc:"Zinnia Arena-Eingang" },
  hm_fly:      { name:"VM02 Fliegen",      desc:"Fliegt zu besuchten Städten. Braucht Donnermedaille.",
                 img: ITEM_BASE+"hm02.png", isHM:true, hmType:"Flying",
                 lockedBy:"thunder", usageDesc:"Schnellreise (noch nicht aktiv)" },
  hm_surf:     { name:"VM03 Surfer",       desc:"Reist über Wasser. Braucht Seelenmedaille.",
                 img: ITEM_BASE+"hm03.png", isHM:true, hmType:"Water",
                 lockedBy:"soul", usageDesc:"Meerrouten (Route 19-20 etc.)" },
  hm_strength: { name:"VM04 Stärke",       desc:"Bewegt Felsbrocken. Braucht Seelenmedaille.",
                 img: ITEM_BASE+"hm04.png", isHM:true, hmType:"Normal",
                 lockedBy:"soul", usageDesc:"Siegerstraße (noch nicht aktiv)" },
  hm_flash:    { name:"VM05 Blitz",        desc:"Senkt Genauigkeit. Braucht Steinmedaille.",
                 img: ITEM_BASE+"hm05.png", isHM:true, hmType:"Normal",
                 lockedBy:"stone", usageDesc:"Rotes Felsgebirge (noch nicht aktiv)" },
};

var TRAINER_SPRITES = {
  youngster:   PS_TRAINER+"youngster.png",   lass:       PS_TRAINER+"lass.png",
  hiker:       PS_TRAINER+"hiker.png",        biker:      PS_TRAINER+"biker.png",
  swimmer_m:   PS_TRAINER+"swimmer-m.png",    swimmer_f:  PS_TRAINER+"swimmer-f.png",
  rocket_m:    PS_TRAINER+"team-rocket-grunt-m.png", rocket_f: PS_TRAINER+"team-rocket-grunt-f.png",
  ninja:       PS_TRAINER+"ninja-boy.png",    channeler:  PS_TRAINER+"channeler.png",
  supernerd:   PS_TRAINER+"super-nerd.png",   beauty:     PS_TRAINER+"beauty.png",
  poke_fan_f:  PS_TRAINER+"poke-fan-f.png",   rival:      PS_TRAINER+"rival2.png",
  cooltrainer: PS_TRAINER+"cooltrainer-m.png",gentleman:  PS_TRAINER+"gentleman.png",
  brock:    PS_TRAINER+"brock.png",    misty:   PS_TRAINER+"misty.png",
  surge:    PS_TRAINER+"lt-surge.png", erika:   PS_TRAINER+"erika.png",
  koga:     PS_TRAINER+"koga.png",     sabrina: PS_TRAINER+"sabrina.png",
  blaine:   PS_TRAINER+"blaine.png",   giovanni:PS_TRAINER+"giovanni.png",
  agatha:   PS_TRAINER+"agatha.png",   bruno:   PS_TRAINER+"bruno.png",
  lance:    PS_TRAINER+"lance.png",    blue:    PS_TRAINER+"blue.png",
};

function getTrainerSprite(trainer) {
  if (!trainer) return TRAINER_SPRITES.youngster;
  var n = trainer.name || "";
  if (trainer.isRival)              return TRAINER_SPRITES.rival;
  if (n.includes("Team Rocket"))    return Math.random()<0.5?TRAINER_SPRITES.rocket_m:TRAINER_SPRITES.rocket_f;
  if (n.includes("Jungtrainerin"))  return TRAINER_SPRITES.lass;
  if (n.includes("Jungtrainer"))    return TRAINER_SPRITES.youngster;
  if (n.includes("Wanderer"))       return TRAINER_SPRITES.hiker;
  if (n.includes("Geologe")||n.includes("Forscher")) return TRAINER_SPRITES.gentleman;
  if (n.includes("Biker"))          return TRAINER_SPRITES.biker;
  if (n.includes("Schwimmerin"))    return TRAINER_SPRITES.swimmer_f;
  if (n.includes("Schwimmer")||n.includes("Taucher")) return TRAINER_SPRITES.swimmer_m;
  if (n.includes("Soldat")||n.includes("Arenakämpfer")||n.includes("Elite")) return TRAINER_SPRITES.cooltrainer;
  if (n.includes("Ninja"))          return TRAINER_SPRITES.ninja;
  if (n.includes("Channelerin"))    return TRAINER_SPRITES.channeler;
  if (n.includes("Supernerd"))      return TRAINER_SPRITES.supernerd;
  if (n.includes("Schönheit"))      return TRAINER_SPRITES.beauty;
  if (n.includes("Pokémon-Fan"))    return TRAINER_SPRITES.poke_fan_f;
  if (n.includes("Jugendliche"))    return TRAINER_SPRITES.lass;
  if (n.includes("Jugendlicher"))   return TRAINER_SPRITES.youngster;
  return TRAINER_SPRITES.youngster;
}

function getGymLeaderSprite(name) {
  var map={"Rocco":"brock","Misty":"misty","Mysto":"surge","Erika":"erika",
           "Koga":"koga","Sabrina":"sabrina","Brand":"blaine","Giovanni":"giovanni",
           "Blau":"blue","Agathe":"agatha","Bruno":"bruno","Siegfried":"lance"};
  return TRAINER_SPRITES[map[name]] || TRAINER_SPRITES.cooltrainer;
}

// ══════════════════════════════════════════════════════════════
//  STARTER-AUSWAHL
// ══════════════════════════════════════════════════════════════
function showStarterScreen() {
  var starters=[
    {dexId:1, name:"Bisasam",  typ:"Pflanze/Gift",color:"#78C850",emoji:"🌱"},
    {dexId:4, name:"Glumanda", typ:"Feuer",        color:"#F08030",emoji:"🔥"},
    {dexId:7, name:"Schiggy",  typ:"Wasser",       color:"#6890F0",emoji:"💧"},
  ];
  var grid=document.getElementById("starterGrid"); if(!grid) return;
  grid.innerHTML="";
  starters.forEach(function(s){
    var card=document.createElement("div"); card.className="starter-card"; card.style.borderColor=s.color;
    card.innerHTML=
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+s.dexId+".png' alt='"+s.name+"'>"+
      "<div class='starter-name'>"+s.name+"</div>"+
      "<div class='starter-type' style='background:"+s.color+"'>"+s.emoji+" "+s.typ+"</div>";
    card.onclick=function(){
      var ni=document.getElementById("trainerName");
      var name=ni?ni.value.trim():"";
      var msg=document.getElementById("starterNameMsg");
      if(!name){
        if(ni){ni.focus();ni.style.borderColor="#ef4444";ni.style.boxShadow="0 0 0 2px rgba(239,68,68,.4)";}
        if(msg) msg.textContent="⚠️ Bitte zuerst deinen Trainer-Namen eingeben!";
        return;
      }
      if(ni){ni.style.borderColor="";ni.style.boxShadow="";}
      if(msg) msg.textContent="";
      onStarterChosen(name, s.dexId);
    };
    grid.appendChild(card);
  });
  var ni=document.getElementById("trainerName");
  if(ni) ni.oninput=function(){
    if(ni.value.trim()){
      ni.style.borderColor="";ni.style.boxShadow="";
      var msg=document.getElementById("starterNameMsg");
      if(msg) msg.textContent="";
    }
  };
}

// ── World-Tab ─────────────────────────────────────────────────
function renderWorldTab() {
  var container=document.getElementById("viewWorld"); if(!container||!STATE) return;
  var zone=getZone(STATE.currentZoneId); if(!zone) return;
  if(zone.type==="city"&&_inCity) return;

  var icon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";
  var html="<div class='zone-info-panel'><div class='zone-info-header'>"+icon+" <b>"+zone.name+"</b></div>";
  if(zone.wildPokemon&&zone.wildPokemon.length>0){
    var total=zone.wildPokemon.reduce(function(s,e){return s+e.weight;},0);
    html+="<div class='encounter-section'><div class='encounter-title'>🎲 Wilde Pokémon</div>";
    zone.wildPokemon.slice().sort(function(a,b){return b.weight-a.weight;}).forEach(function(entry){
      var pd=PKMN[entry.dexId], pct=Math.round(entry.weight/total*100);
      html+="<div class='encounter-row'>"+
        "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+entry.dexId+".png' class='enc-sprite' onerror='this.style.opacity=0'>"+
        "<div class='enc-info'><span class='enc-name'>"+(pd?pd.name:"?")+"</span> <span class='enc-lv'>Lv."+entry.minLv+"–"+entry.maxLv+"</span></div>"+
        "<div class='enc-right'><div class='enc-bar-wrap'><div class='enc-bar' style='width:"+Math.min(100,pct*2)+"%'></div></div>"+
        "<span class='enc-pct'>"+pct+"%</span></div></div>";
    });
    html+="</div>";
  }
  if(zone.trainers&&zone.trainers.length>0){
    html+="<div class='trainer-section'><div class='encounter-title'>⚔️ Trainer</div>";
    zone.trainers.forEach(function(t){
      var defeated=isTrainerDefeated(zone.id,t.stage), spr=getTrainerSprite(t);
      html+="<div class='trainer-row "+(defeated?"trainer-defeated":"")+"'>"+
        "<img src='"+spr+"' class='trainer-mini-sprite' onerror='this.style.display=\"none\"'>"+
        "<div class='trainer-row-info'><b>"+(t.isRival?"⚡ Rival: ":"")+t.name+"</b><span class='trainer-stage'> (Etappe "+t.stage+")</span></div>"+
        "<span class='trainer-status'>"+(defeated?"✓":"⚔️")+"</span></div>";
    });
    html+="</div>";
  }
  if(zone.gymLeader){
    var gl=zone.gymLeader, defeated=isTrainerDefeated(zone.id,gl.stage), glSpr=getGymLeaderSprite(gl.name);
    html+="<div class='trainer-section'><div class='encounter-title'>🏅 Arenaleiter</div>"+
      "<div class='trainer-row gym-leader-row "+(defeated?"trainer-defeated":"")+"'>"+
      "<img src='"+glSpr+"' class='trainer-mini-sprite'>"+
      "<div class='trainer-row-info'><b>"+gl.name+"</b><br><small>"+gl.badge+"</small></div>"+
      "<span class='trainer-status'>"+(defeated?"🏅":"⚔️")+"</span></div></div>";
  }
  html+="</div>";
  container.innerHTML=html;
}

function renderCityView(zone) {
  var container=document.getElementById("viewWorld"); if(!container) return;
  container.innerHTML="<div class='city-view'><div class='city-header'><div class='city-title'>🏙️ "+zone.name+"</div></div></div>";
  if(typeof renderCityHub==="function") renderCityHub(zone);
}

function healInCity(){healPartyFully();renderPlayerSprites();updateHUD();showToast("Team vollständig geheilt! 💚");}

// ══════════════════════════════════════════════════════════════
//  TEAM-SCREEN — Realtime + Up/Down/Lead/Box Aktionen
// ══════════════════════════════════════════════════════════════
function renderTeamScreen() {
  var container=document.getElementById("teamList"); if(!container||!STATE) return;
  container.innerHTML="";
  var n=STATE.party.length;
  STATE.party.forEach(function(p,idx){
    var pd=PKMN[p.dexId],name=pd?pd.name:"?";
    var hpPct=Math.round(p.currentHP/p.maxHP*100),xpPct=Math.min(100,Math.round(p.xp/p.xpToNext*100));
    var card=document.createElement("div"); card.className="team-card"+(p.currentHP<=0?" team-fainted":"");
    card.innerHTML=
      "<img class='team-sprite' src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+p.dexId+".png' alt='"+name+"'>"+
      "<div class='team-info'>"+
        "<div class='team-nameline'><b>"+(p.nick||name)+"</b> <span class='team-lv'>Lv."+p.level+"</span>"+
          (p.status?"<span class='status-badge status-"+p.status+"'>"+statusText(p.status)+"</span>":"")+
          (idx===0?"<span class='team-lead-badge'>★ Lead</span>":"")+
        "</div>"+
        "<div class='team-types'>"+(pd?pd.types.map(function(t){return "<span class='type-badge' style='background:"+(TYPE_COLORS[t]||"#aaa")+"'>"+t+"</span>";}).join(""):"")+"</div>"+
        "<div class='team-hprow'><div class='team-hpbar'><div class='team-hpfill' style='width:"+Math.max(0,hpPct)+"%;background:"+hpColor(p.currentHP,p.maxHP)+"'></div></div> <span class='team-hptxt'>"+p.currentHP+"/"+p.maxHP+"</span></div>"+
        "<div class='team-xprow'><div class='team-xpbar'><div class='team-xpfill' style='width:"+xpPct+"%'></div></div> <span class='team-xptxt'>EP "+p.xp+"/"+p.xpToNext+"</span></div>"+
        "<div class='team-moves'>"+p.moves.map(function(m){var mv=MOVES[m];return mv?"<span class='mini-move' style='border-color:"+(TYPE_COLORS[mv.type]||"#888")+"'>"+mv.name+"</span>":"";}).join("")+"</div>"+
      "</div>"+
      "<div class='team-actions'>"+
        "<button class='team-act-sm' "+(idx===0?"disabled":"")+
          " onclick='movePartyUp("+idx+")' title='Nach oben'>↑</button>"+
        "<button class='team-act-sm' "+(idx===n-1?"disabled":"")+
          " onclick='movePartyDown("+idx+")' title='Nach unten'>↓</button>"+
        "<button class='team-act-sm' "+(idx===0?"disabled":"")+
          " onclick='setLeadPkmn("+idx+")' title='Als Lead setzen'>★</button>"+
        "<button class='team-act-sm' onclick='sendToBox("+idx+")' title='In Box senden'>📦</button>"+
      "</div>";
    container.appendChild(card);
  });
  // Box-Vorschau
  var boxSection=document.getElementById("boxPreview");
  if(boxSection){
    boxSection.innerHTML=STATE.box.length===0
      ?"<p style='color:#888;text-align:center;padding:12px'>Box ist leer</p>"
      :STATE.box.map(function(p,i){
        var pd=PKMN[p.dexId];
        return "<div class='box-mini' onclick='recallFromBox("+i+")'>"+
          "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+p.dexId+".png'>"+
          "<div>"+(pd?pd.name:"?")+" Lv."+p.level+"</div></div>";
      }).join("");
  }
}

// ── Party-Manipulations-Funktionen ────────────────────────────
function setLeadPkmn(idx){
  if(!STATE||idx===0) return;
  STATE.party.unshift(STATE.party.splice(idx,1)[0]);
  renderTeamScreen(); renderPlayerSprites(); saveGame();
}
function movePartyUp(idx){
  if(!STATE||idx<=0||idx>=STATE.party.length) return;
  var tmp=STATE.party[idx]; STATE.party[idx]=STATE.party[idx-1]; STATE.party[idx-1]=tmp;
  if(idx===1) renderPlayerSprites(); // Lead hat sich verändert
  renderTeamScreen(); saveGame();
}
function movePartyDown(idx){
  if(!STATE||idx<0||idx>=STATE.party.length-1) return;
  var tmp=STATE.party[idx]; STATE.party[idx]=STATE.party[idx+1]; STATE.party[idx+1]=tmp;
  if(idx===0) renderPlayerSprites(); // Lead hat sich verändert
  renderTeamScreen(); saveGame();
}
function sendToBox(idx){
  if(!STATE||STATE.party.length<=1){showToast("Mindestens 1 Pokémon!");return;}
  var p=STATE.party.splice(idx,1)[0]; addToBox(p);
  if(idx===0) renderPlayerSprites();
  renderTeamScreen(); saveGame();
  showToast((PKMN[p.dexId]?PKMN[p.dexId].name:"?")+" → Box");
}
function recallFromBox(idx){
  if(!STATE||STATE.party.length>=6){showToast("Party voll!");return;}
  var p=STATE.box.splice(idx,1)[0]; STATE.party.push(p);
  renderTeamScreen(); saveGame();
  showToast((PKMN[p.dexId]?PKMN[p.dexId].name:"?")+" → Party");
}

// ══════════════════════════════════════════════════════════════
//  BAG
// ══════════════════════════════════════════════════════════════
function renderBagScreen() {
  var container=document.getElementById("bagList"); if(!container||!STATE) return;
  container.innerHTML="";

  var hmKeys=Object.keys(ITEM_DEFS).filter(function(k){return ITEM_DEFS[k].isHM&&(STATE.items[k]||0)>0;});
  if(hmKeys.length>0){
    var hmHeader=document.createElement("div"); hmHeader.className="bag-section-header";
    hmHeader.innerHTML="📀 VM-Beutel"; container.appendChild(hmHeader);
    hmKeys.forEach(function(key){
      var def=ITEM_DEFS[key];
      var badgeOk=!def.lockedBy||(STATE.badgeIds&&STATE.badgeIds.indexOf(def.lockedBy)>=0);
      var typeColor=(typeof TYPE_COLORS!=="undefined"&&TYPE_COLORS[def.hmType])?TYPE_COLORS[def.hmType]:"#818cf8";
      var row=document.createElement("div"); row.className="bag-item bag-hm-item";
      row.innerHTML=
        "<div class='bag-hm-num'>"+key.replace("hm_","VM").toUpperCase()+"</div>"+
        "<div class='bag-hm-type' style='background:"+typeColor+"'>"+def.hmType+"</div>"+
        "<div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small><br><small class='bag-hm-usage'>🗺️ "+def.usageDesc+"</small></div>"+
        "<div class='bag-hm-status"+(badgeOk?"":" bag-hm-locked")+"'>"+(badgeOk?"✅ Aktiv":"🔒 Abzeichen fehlt")+"</div>";
      container.appendChild(row);
    });
  }

  var keyKeys=Object.keys(ITEM_DEFS).filter(function(k){return ITEM_DEFS[k].isKey&&!ITEM_DEFS[k].isHM&&(STATE.items[k]||0)>0;});
  if(keyKeys.length>0){
    var kiHeader=document.createElement("div"); kiHeader.className="bag-section-header";
    kiHeader.innerHTML="🗝️ Schlüsselitems"; container.appendChild(kiHeader);
    keyKeys.forEach(function(key){
      var def=ITEM_DEFS[key], count=STATE.items[key]||0;
      var row=document.createElement("div"); row.className="bag-item";
      row.innerHTML=
        "<div class='bag-icon-wrap'><img src='"+(def.img||"")+"' class='bag-item-sprite' onerror='this.style.display=\"none\"'></div>"+
        "<div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small></div>"+
        "<span class='bag-count'>x"+count+"</span>"+
        "<span style='font-size:11px;color:#555;padding:4px'>Schlüsselitem</span>";
      container.appendChild(row);
    });
  }

  var useableKeys=Object.keys(ITEM_DEFS).filter(function(k){
    return !ITEM_DEFS[k].isHM&&!ITEM_DEFS[k].isKey&&(STATE.items[k]||0)>0;
  });
  if(useableKeys.length>0){
    var regHeader=document.createElement("div"); regHeader.className="bag-section-header";
    regHeader.innerHTML="💊 Items"; container.appendChild(regHeader);
    useableKeys.forEach(function(key){
      var count=STATE.items[key]||0;
      var def=ITEM_DEFS[key], row=document.createElement("div"); row.className="bag-item";
      row.innerHTML=
        "<div class='bag-icon-wrap'><img src='"+(def.img||"")+"' class='bag-item-sprite' onerror='this.style.display=\"none\"'></div>"+
        "<div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small></div>"+
        "<span class='bag-count'>x"+count+"</span>"+
        "<button onclick='useItem(\""+key+"\")'>Nutzen</button>";
      container.appendChild(row);
    });
  }

  if(hmKeys.length===0&&keyKeys.length===0&&useableKeys.length===0){
    container.innerHTML="<p style='color:#888;text-align:center;padding:20px'>Tasche leer</p>";
  }
}

function useItem(itemKey){
  if(!STATE||!STATE.items[itemKey]||STATE.items[itemKey]<=0){showToast("Keine mehr!");return;}
  var player=getActivePkmn(); if(!player){showToast("Kein aktives Pokémon!");return;}
  var pd=PKMN[player.dexId],name=pd?pd.name:"Pokémon";
  switch(itemKey){
    case "potion":      if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=Math.min(player.maxHP,player.currentHP+20); break;
    case "superpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=Math.min(player.maxHP,player.currentHP+50); break;
    case "hyperpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=Math.min(player.maxHP,player.currentHP+200); break;
    case "maxpotion":   if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=player.maxHP; break;
    case "fullrestore": player.currentHP=player.maxHP;player.status=null;player.statusTurns=0; break;
    case "fullheal":    player.status=null;player.statusTurns=0; break;
    case "antidote":    if(player.status!=="poison")   {showToast("Nicht vergiftet!");return;} player.status=null; break;
    case "awakening":   if(player.status!=="sleep")    {showToast("Schläft nicht!");return;} player.status=null;player.statusTurns=0; break;
    case "paralysheal": if(player.status!=="paralysis"){showToast("Nicht gelähmt!");return;} player.status=null; break;
    case "revive":{
      var fainted=STATE.party.find(function(p){return p.currentHP<=0;});
      if(!fainted){showToast("Kein K.O. Pokémon!");return;}
      fainted.currentHP=Math.floor(fainted.maxHP/2);fainted._faintAnnounced=false;
      showToast((PKMN[fainted.dexId]?PKMN[fainted.dexId].name:"?")+" belebt!");
      STATE.items[itemKey]--;renderBagScreen();renderTeamScreen();saveGame();return;
    }
    default: showToast("Kann hier nicht benutzt werden.");return;
  }
  STATE.items[itemKey]--;
  showToast(name+": "+(ITEM_DEFS[itemKey]?ITEM_DEFS[itemKey].name:itemKey)+" benutzt!");
  renderBagScreen();renderTeamScreen();updatePlayerHp();saveGame();
}

// ── Catch-Balls ───────────────────────────────────────────────
function renderCatchBalls(visible){
  var container=document.getElementById("catchBalls"); if(!container) return;
  container.innerHTML="";
  if(!visible||!STATE) return;
  ["pokeball","superball","hyperball","masterball"].forEach(function(type){
    var count=STATE.items[type]||0; if(count<=0) return;
    var btn=document.createElement("button"); btn.className="ball-btn";
    btn.title=(ITEM_DEFS[type]?ITEM_DEFS[type].name:type)+" (x"+count+")";
    btn.innerHTML="<img src='"+(BALL_SPRITES[type]||"")+"' width='24' height='24' onerror='this.replaceWith(document.createTextNode(\"⚪\"))'><span class='ball-count'>x"+count+"</span>";
    btn.onclick=function(){onCatchClick(type);};
    container.appendChild(btn);
  });
}

// ── Karten-Screen ─────────────────────────────────────────────
function renderMapScreen() {
  var container=document.getElementById("mapList"); if(!container||!STATE) return;
  container.innerHTML="";
  var visitedCities=WORLD.filter(function(z){
    return z.type==="city" && isZoneVisited(z.id) && z.id!==STATE.currentZoneId;
  });
  var travelHeader=document.createElement("div"); travelHeader.className="map-section-title";
  travelHeader.textContent="✈ Schnellreise"; container.appendChild(travelHeader);
  if(visitedCities.length>0){
    var grid=document.createElement("div"); grid.className="city-travel-grid";
    visitedCities.forEach(function(zone){
      var btn=document.createElement("button"); btn.className="city-travel-btn";
      btn.innerHTML="🏙️ "+zone.name;
      btn.onclick=(function(zid){return function(){fastTravelTo(zid);};})(zone.id);
      grid.appendChild(btn);
    });
    container.appendChild(grid);
  } else {
    var noCity=document.createElement("p"); noCity.className="map-no-travel";
    noCity.textContent="Noch keine weiteren Städte freigeschaltet.";
    container.appendChild(noCity);
  }
  var curZone=getZone(STATE.currentZoneId);
  if(curZone){
    var curDiv=document.createElement("div"); curDiv.className="map-current-loc";
    var zIcon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[curZone.type]||"📍";
    curDiv.innerHTML="<b>📍 Du bist hier:</b> "+zIcon+" <b>"+curZone.name+"</b>"+(curZone.stageCount?" — Etappe "+STATE.currentStage+"/"+curZone.stageCount:"");
    container.appendChild(curDiv);
  }
  var br=document.getElementById("badgeRow");
  if(br) br.innerHTML=["stone","cascade","thunder","rainbow","soul","marsh","volcano","earth"].map(function(b){
    return "<span class='badge-icon"+(STATE.badgeIds.indexOf(b)>=0?" badge-earned":"")+"'>🏅</span>";
  }).join("");
  var progHeader=document.createElement("div"); progHeader.className="map-section-title"; progHeader.style.marginTop="14px";
  progHeader.textContent="🗺️ Kanto-Fortschritt"; container.appendChild(progHeader);
  WORLD.forEach(function(zone){
    if(zone.type==="building") return;
    var isCurrent=(zone.id===STATE.currentZoneId), isVisited=isZoneVisited(zone.id);
    var row=document.createElement("div");
    var cls="map-zone map-compact";
    if(isCurrent) cls+=" map-current"; else if(isVisited) cls+=" map-unlocked"; else cls+=" map-locked";
    row.className=cls;
    var zIcon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";
    var badgeHtml=zone.gymLeader&&isVisited?"<span class='map-badge'>"+(STATE.badgeIds.indexOf(zone.gymLeader.badgeId)>=0?"🏅":"⬜")+"</span>":"";
    row.innerHTML=zIcon+" "+zone.name+(isCurrent?" <span class='map-here'>← hier</span>":"")+(!isVisited?"<span style='margin-left:auto;color:#444;font-size:11px'>🔒</span>":"")+badgeHtml;
    container.appendChild(row);
  });
}

// ── HUD ───────────────────────────────────────────────────────
function updateHUD(){
  if(!STATE) return;
  var m=document.getElementById("hudMoney"); if(m) m.textContent=STATE.money+" ₽";
  var b=document.getElementById("hudBadges"); if(b) b.textContent=STATE.badges+"/8 🏅";
  var p=document.getElementById("hudPlayer"); if(p) p.textContent=STATE.name;
}

function showCityShop(zone){
  if(!zone||!zone.shopItems) return;
  var popup=document.getElementById("shopPopup"); if(popup) popup.style.display="flex";
  var list=document.getElementById("shopItemList"); if(!list) return;
  list.innerHTML="";
  zone.shopItems.forEach(function(item){
    var canAfford=STATE.money>=item.cost, def=ITEM_DEFS[item.id];
    var row=document.createElement("div"); row.className="shop-row";
    row.innerHTML=(def&&def.img?"<img src='"+def.img+"' width='28' height='28' style='image-rendering:pixelated;margin-right:8px' onerror='this.style.display=\"none\"'>":"")+
      "<div class='shop-info'><b>"+item.name+"</b> – "+item.desc+"</div>"+
      "<div class='shop-price'>"+item.cost+" ₽</div>"+
      "<button "+(canAfford?"":"disabled")+" onclick='buyItem(\""+item.id+"\","+item.cost+")'>Kaufen</button>";
    list.appendChild(row);
  });
}
function closeShop(){var p=document.getElementById("shopPopup");if(p)p.style.display="none";}
function buyItem(itemId,cost){
  if(!STATE||STATE.money<cost){showToast("Kein Geld!");return;}
  STATE.money-=cost; STATE.items[itemId]=(STATE.items[itemId]||0)+1;
  updateHUD(); var zone=getZone(STATE.currentZoneId); if(zone) showCityShop(zone);
  saveGame(); showToast((ITEM_DEFS[itemId]?ITEM_DEFS[itemId].name:itemId)+" gekauft!");
}
function closeGymPopup(){var p=document.getElementById("gymPopup");if(p)p.style.display="none";}
function showOfflineReward(awaySeconds){
  if(awaySeconds<60) return;
  var modal=document.getElementById("offlineModal"),msg=document.getElementById("offlineMsg");
  if(!modal||!msg) return;
  var h=Math.floor(awaySeconds/3600),m2=Math.floor((awaySeconds%3600)/60);
  msg.textContent="Du warst "+(h>0?h+"h ":"")+m2+"m weg!";
  modal.style.display="flex";
}
function closeOfflineModal(){var m=document.getElementById("offlineModal");if(m)m.style.display="none";}
