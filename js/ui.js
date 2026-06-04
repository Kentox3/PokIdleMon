// ═══════════════════════════════════════════════════════════════
//  ui.js — Starter, Team, Map, Stadt, Encounter-Rates, Handel
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
  escape:      { name:"Fluchtweg",   desc:"Aus Dungeon",           img: ITEM_BASE+"escape-rope.png" },
};

// Trainer-Sprites-Mapping (Pokémon Showdown)
var TRAINER_SPRITES = {
  youngster:   PS_TRAINER + "youngster.png",
  lass:        PS_TRAINER + "lass.png",
  hiker:       PS_TRAINER + "hiker.png",
  biker:       PS_TRAINER + "biker.png",
  swimmer_m:   PS_TRAINER + "swimmer-m.png",
  swimmer_f:   PS_TRAINER + "swimmer-f.png",
  rocket_m:    PS_TRAINER + "team-rocket-grunt-m.png",
  rocket_f:    PS_TRAINER + "team-rocket-grunt-f.png",
  ninja:       PS_TRAINER + "ninja-boy.png",
  channeler:   PS_TRAINER + "channeler.png",
  supernerd:   PS_TRAINER + "super-nerd.png",
  beauty:      PS_TRAINER + "beauty.png",
  poke_fan_f:  PS_TRAINER + "poke-fan-f.png",
  poke_fan_m:  PS_TRAINER + "poke-fan-m.png",
  rival:       PS_TRAINER + "rival2.png",
  cooltrainer: PS_TRAINER + "cooltrainer-m.png",
  gentleman:   PS_TRAINER + "gentleman.png",
  blackbelt:   PS_TRAINER + "black-belt.png",
  // Gym-Leader
  brock:    PS_TRAINER + "brock.png",
  misty:    PS_TRAINER + "misty.png",
  surge:    PS_TRAINER + "lt-surge.png",
  erika:    PS_TRAINER + "erika.png",
  koga:     PS_TRAINER + "koga.png",
  sabrina:  PS_TRAINER + "sabrina.png",
  blaine:   PS_TRAINER + "blaine.png",
  giovanni: PS_TRAINER + "giovanni.png",
  agatha:   PS_TRAINER + "agatha.png",
  bruno:    PS_TRAINER + "bruno.png",
  lance:    PS_TRAINER + "lance.png",
  blue:     PS_TRAINER + "blue.png",
};

// Trainer-Name → Sprite
function getTrainerSprite(trainer) {
  if (!trainer) return TRAINER_SPRITES.youngster;
  var n = trainer.name || "";
  if (trainer.isRival)                   return TRAINER_SPRITES.rival;
  if (n.includes("Team Rocket"))         return Math.random()<0.5 ? TRAINER_SPRITES.rocket_m : TRAINER_SPRITES.rocket_f;
  if (n.includes("Jungtrainerin"))       return TRAINER_SPRITES.lass;
  if (n.includes("Jungtrainer"))         return TRAINER_SPRITES.youngster;
  if (n.includes("Wanderer"))            return TRAINER_SPRITES.hiker;
  if (n.includes("Geologe") || n.includes("Forscher")) return TRAINER_SPRITES.gentleman;
  if (n.includes("Biker"))              return TRAINER_SPRITES.biker;
  if (n.includes("Schwimmerin"))         return TRAINER_SPRITES.swimmer_f;
  if (n.includes("Schwimmer"))           return TRAINER_SPRITES.swimmer_m;
  if (n.includes("Taucher"))             return TRAINER_SPRITES.swimmer_m;
  if (n.includes("Soldat"))             return TRAINER_SPRITES.cooltrainer;
  if (n.includes("Ninja"))              return TRAINER_SPRITES.ninja;
  if (n.includes("Channelerin"))         return TRAINER_SPRITES.channeler;
  if (n.includes("Supernerd"))           return TRAINER_SPRITES.supernerd;
  if (n.includes("Schönheit"))           return TRAINER_SPRITES.beauty;
  if (n.includes("Kampfmädchen"))        return TRAINER_SPRITES.swimmer_f;
  if (n.includes("Pokémon-Fan"))         return TRAINER_SPRITES.poke_fan_f;
  if (n.includes("Jugendliche"))         return TRAINER_SPRITES.lass;
  if (n.includes("Jugendlicher"))        return TRAINER_SPRITES.youngster;
  if (n.includes("Arenakämpfer"))        return TRAINER_SPRITES.cooltrainer;
  if (n.includes("Elite"))              return TRAINER_SPRITES.cooltrainer;
  return TRAINER_SPRITES.youngster;
}

function getGymLeaderSprite(name) {
  var map = { "Rocco":"brock","Misty":"misty","Mysto":"surge","Erika":"erika",
              "Koga":"koga","Sabrina":"sabrina","Brand":"blaine","Giovanni":"giovanni",
              "Blau":"blue","Agathe":"agatha","Bruno":"bruno","Siegfried":"lance" };
  return TRAINER_SPRITES[map[name]] || TRAINER_SPRITES.cooltrainer;
}

// ── NPC-Handelsangebote ───────────────────────────────────────
var NPC_TRADES = {
  viridian_city:   { npcName:"Händler Kurt",   give:19,  get:29,  sprite: PS_TRAINER+"lass.png",      text:"Ich gebe dir mein Nidoran♀ für dein Rattata!" },
  cerulean_city:   { npcName:"Tauscherin Anna", give:60,  get:54,  sprite: PS_TRAINER+"lass.png",      text:"Poliwag gegen Enton? Abgemacht!" },
  vermilion_city:  { npcName:"Tauscher Max",    give:25,  get:100, sprite: PS_TRAINER+"youngster.png", text:"Mein Voltobal für dein Pikachu – Deal?" },
  lavender_town:   { npcName:"Geisterin Mona",  give:92,  get:93,  sprite: PS_TRAINER+"channeler.png", text:"Gastly gegen Haunter... wenn du dich traust!" },
  celadon_city:    { npcName:"Händler Lio",     give:52,  get:53,  sprite: PS_TRAINER+"youngster.png", text:"Mein Snobilikat für dein Mauzi?" },
  fuchsia_city:    { npcName:"Safarihändler",   give:111, get:29,  sprite: PS_TRAINER+"gentleman.png", text:"Rihornior für Nidoran♀ – ein Angebot!" },
  cinnabar_island: { npcName:"Forscher Leo",    give:109, get:58,  sprite: PS_TRAINER+"gentleman.png", text:"Smogon gegen Fukano – Wissenschaft!" },
};

// ── Starter-Auswahl ───────────────────────────────────────────
function showStarterScreen() {
  var starters = [
    { dexId:1,  name:"Bisasam",  typ:"Pflanze/Gift", color:"#78C850", emoji:"🌱" },
    { dexId:4,  name:"Glumanda", typ:"Feuer",         color:"#F08030", emoji:"🔥" },
    { dexId:7,  name:"Schiggy",  typ:"Wasser",        color:"#6890F0", emoji:"💧" },
  ];
  var grid = document.getElementById("starterGrid"); if (!grid) return;
  grid.innerHTML = "";
  starters.forEach(function(s) {
    var card = document.createElement("div");
    card.className="starter-card"; card.style.borderColor=s.color;
    card.innerHTML=
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+s.dexId+".png' alt='"+s.name+"'>"+
      "<div class='starter-name'>"+s.name+"</div>"+
      "<div class='starter-type' style='background:"+s.color+"'>"+s.emoji+" "+s.typ+"</div>";
    card.onclick=function(){
      var ni=document.getElementById("trainerName");
      onStarterChosen(ni?(ni.value.trim()||"Trainer"):"Trainer", s.dexId);
    };
    grid.appendChild(card);
  });
}

// ── World-Tab: Route-Info + Encounter-Rates ───────────────────
function renderWorldTab() {
  var container = document.getElementById("viewWorld"); if (!container||!STATE) return;
  var zone = getZone(STATE.currentZoneId); if (!zone) return;

  // Stadt: city-view wird von renderCityView() befüllt
  if (zone.type === "city" && _inCity) return; // bereits gerendert

  var icon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";
  var html = "<div class='zone-info-panel'>";
  html += "<div class='zone-info-header'>"+icon+" <b>"+zone.name+"</b></div>";

  // Wildpokémon mit Encounter-Wahrscheinlichkeit
  if (zone.wildPokemon && zone.wildPokemon.length > 0) {
    var total = zone.wildPokemon.reduce(function(s,e){return s+e.weight;},0);
    html += "<div class='encounter-section'><div class='encounter-title'>🎲 Wilde Pokémon</div>";
    // Sortiert nach Häufigkeit
    var sorted = zone.wildPokemon.slice().sort(function(a,b){return b.weight-a.weight;});
    sorted.forEach(function(entry) {
      var pd = PKMN[entry.dexId];
      var pct = Math.round(entry.weight/total*100);
      var name = pd ? pd.name : "Unbekannt";
      var rarity = pct>=30?"🟢 Häufig":pct>=15?"🟡 Selten":pct>=8?"🟠 Rar":"🔴 Sehr rar";
      html += "<div class='encounter-row'>"+
        "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+entry.dexId+".png' class='enc-sprite' onerror='this.style.opacity=0'>"+
        "<div class='enc-info'><span class='enc-name'>"+name+"</span> <span class='enc-lv'>Lv."+entry.minLv+"–"+entry.maxLv+"</span></div>"+
        "<div class='enc-right'><div class='enc-bar-wrap'><div class='enc-bar' style='width:"+Math.min(100,pct*2)+"%'></div></div>"+
        "<span class='enc-pct'>"+pct+"%</span></div>"+
        "</div>";
    });
    html += "</div>";
  }

  // Trainer auf dieser Route
  if (zone.trainers && zone.trainers.length > 0) {
    html += "<div class='trainer-section'><div class='encounter-title'>⚔️ Trainer</div>";
    zone.trainers.forEach(function(t) {
      var defeated = isTrainerDefeated(zone.id, t.stage);
      var spr = getTrainerSprite(t);
      html += "<div class='trainer-row "+(defeated?"trainer-defeated":"")+"'>"+
        "<img src='"+spr+"' class='trainer-mini-sprite' onerror='this.style.display=\"none\"'>"+
        "<div class='trainer-row-info'><b>"+(t.isRival?"⚡ Rival: ":"")+t.name+"</b>"+
        "<span class='trainer-stage'> (Etappe "+t.stage+")</span></div>"+
        "<span class='trainer-status'>"+(defeated?"✓":"⚔️")+"</span>"+
        "</div>";
    });
    html += "</div>";
  }

  // Gym-Leader
  if (zone.gymLeader) {
    var gl=zone.gymLeader, defeated=isTrainerDefeated(zone.id,gl.stage);
    var glSpr=getGymLeaderSprite(gl.name);
    html += "<div class='trainer-section'><div class='encounter-title'>🏅 Arenaleiter</div>"+
      "<div class='trainer-row gym-leader-row "+(defeated?"trainer-defeated":"")+"'>"+
      "<img src='"+glSpr+"' class='trainer-mini-sprite'>"+
      "<div class='trainer-row-info'><b>"+gl.name+"</b><br><small>"+gl.badge+"</small></div>"+
      "<span class='trainer-status'>"+(defeated?"🏅":"⚔️")+"</span>"+
      "</div></div>";
  }

  html += "</div>";
  container.innerHTML = html;
}

// ── Stadt-Ansicht ─────────────────────────────────────────────
function renderCityView(zone) {
  var container = document.getElementById("viewWorld"); if (!container) return;
  var npc = zone.id ? NPC_TRADES[zone.id] : null;
  var npcHtml = "";
  if (npc) {
    var givePd=PKMN[npc.give], getPd=PKMN[npc.get];
    npcHtml = "<div class='city-npc'>"+
      "<img src='"+npc.sprite+"' class='npc-portrait' onerror='this.style.display=\"none\"'>"+
      "<div class='npc-bubble'><b>"+npc.npcName+":</b> "+npc.text+"</div>"+
      "<div class='npc-trade'>"+
        "<div class='trade-pkmn'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+(npc.give)+".png'><span>"+(givePd?givePd.name:"?")+"</span></div>"+
        "<span class='trade-arrow'>⇆</span>"+
        "<div class='trade-pkmn'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+(npc.get)+".png'><span>"+(getPd?getPd.name:"?")+"</span></div>"+
      "</div>"+
      "<button class='city-btn trade-btn' onclick='doNPCTrade(\""+zone.id+"\")'>Tauschen</button>"+
    "</div>";
  }

  container.innerHTML =
    "<div class='city-view'>"+
      "<div class='city-header'>"+
        "<div class='city-title'>🏙️ "+zone.name+"</div>"+
        "<div class='city-subtitle'>Du hast die Stadt erreicht — dein Team wurde geheilt!</div>"+
      "</div>"+
      "<div class='city-services'>"+
        "<div class='city-service'>"+
          "<div class='service-icon'>🏥</div>"+
          "<div class='service-name'>Pokémon-Center</div>"+
          "<div class='service-desc'>Team vollständig geheilt!</div>"+
          "<button class='city-btn' onclick='healInCity()'>Nochmal heilen</button>"+
        "</div>"+
        (zone.shopItems&&zone.shopItems.length>0?
        "<div class='city-service'>"+
          "<div class='service-icon'>🛒</div>"+
          "<div class='service-name'>Shop</div>"+
          "<div class='service-desc'>Kaufe Items mit deinem Geld</div>"+
          "<button class='city-btn' onclick='showCityShop(getZone(STATE.currentZoneId))'>Shop öffnen</button>"+
        "</div>":"")
      +"</div>"+
      npcHtml+
      "<button class='city-continue-btn' onclick='continueFromCity()'>➡ Weiter reisen</button>"+
    "</div>";
  switchTab("World");
}

function healInCity() {
  healPartyFully(); renderPlayerSprites(); updateHUD();
  showToast("Team vollständig geheilt! 💚");
}

// ── NPC-Handel ────────────────────────────────────────────────
function doNPCTrade(zoneId) {
  var npc = NPC_TRADES[zoneId]; if (!npc||!STATE) return;
  var giveIdx = STATE.party.findIndex(function(p){ return p.dexId===npc.give&&p.currentHP>0; });
  if (giveIdx<0) {
    var pd=PKMN[npc.give]; showToast("Du brauchst "+(pd?pd.name:"das Pokémon")+" zum Tauschen!"); return;
  }
  var givePd=PKMN[npc.give], getPd=PKMN[npc.get];
  var traded=STATE.party.splice(giveIdx,1)[0];
  var received=createPkmnInstance(npc.get, traded.level);
  received.nick=(getPd?getPd.name:"?")+" (getauscht)";
  addToParty(received)||(addToBox(received),showToast(received.nick+" → Box!"));
  showToast("✨ Getauscht: "+(givePd?givePd.name:"?")+" → "+(getPd?getPd.name:"?")+"!");
  // NPC-Eintrag entfernen damit nicht 2x
  NPC_TRADES[zoneId]._done=true;
  saveGame(); renderTeamScreen(); renderCityView(getZone(zoneId));
}

// ── Team-Screen ───────────────────────────────────────────────
function renderTeamScreen() {
  var container=document.getElementById("teamList"); if(!container||!STATE) return;
  container.innerHTML="";
  STATE.party.forEach(function(p,idx) {
    var pd=PKMN[p.dexId], name=pd?pd.name:"?";
    var hpPct=Math.round(p.currentHP/p.maxHP*100);
    var xpPct=Math.min(100,Math.round(p.xp/p.xpToNext*100));
    var card=document.createElement("div");
    card.className="team-card"+(p.currentHP<=0?" team-fainted":"");
    card.innerHTML=
      "<img class='team-sprite' src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+p.dexId+".png' alt='"+name+"'>"+
      "<div class='team-info'>"+
        "<div class='team-nameline'><b>"+(p.nick||name)+"</b> <span class='team-lv'>Lv."+p.level+"</span>"+
          (p.status?"<span class='status-badge status-"+p.status+"'>"+statusText(p.status)+"</span>":"")+
        "</div>"+
        "<div class='team-types'>"+(pd?pd.types.map(function(t){return "<span class='type-badge' style='background:"+(TYPE_COLORS[t]||"#aaa")+"'>"+t+"</span>";}).join(""):"")+"</div>"+
        "<div class='team-hprow'><div class='team-hpbar'><div class='team-hpfill' style='width:"+Math.max(0,hpPct)+"%;background:"+hpColor(p.currentHP,p.maxHP)+"'></div></div> <span class='team-hptxt'>"+p.currentHP+"/"+p.maxHP+"</span></div>"+
        "<div class='team-xprow'><div class='team-xpbar'><div class='team-xpfill' style='width:"+xpPct+"%'></div></div> <span class='team-xptxt'>"+p.xp+"/"+p.xpToNext+" EP</span></div>"+
        "<div class='team-moves'>"+p.moves.map(function(m){var mv=MOVES[m];return mv?"<span class='mini-move' style='border-color:"+(TYPE_COLORS[mv.type]||"#888")+"'>"+mv.name+"</span>":"";}).join("")+"</div>"+
      "</div>"+
      "<div class='team-actions'>"+
        "<button onclick='setLeadPkmn("+idx+")'"+( idx===0?" disabled":"")+">⬆ Lead</button>"+
        "<button onclick='sendToBox("+idx+")'>📦 Box</button>"+
      "</div>";
    container.appendChild(card);
  });
  var boxSection=document.getElementById("boxPreview");
  if (boxSection) {
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

function setLeadPkmn(idx) { if(!STATE||idx===0) return; STATE.party.unshift(STATE.party.splice(idx,1)[0]); renderTeamScreen(); saveGame(); }
function sendToBox(idx) {
  if(!STATE||STATE.party.length<=1){showToast("Mindestens 1 Pokémon!"); return;}
  var p=STATE.party.splice(idx,1)[0]; addToBox(p); renderTeamScreen(); saveGame();
  showToast((PKMN[p.dexId]?PKMN[p.dexId].name:"?")+" → Box");
}
function recallFromBox(idx) {
  if(!STATE||STATE.party.length>=6){showToast("Party voll!"); return;}
  var p=STATE.box.splice(idx,1)[0]; STATE.party.push(p); renderTeamScreen(); saveGame();
  showToast((PKMN[p.dexId]?PKMN[p.dexId].name:"?")+" → Party");
}

// ── Bag-Screen ────────────────────────────────────────────────
function renderBagScreen() {
  var container=document.getElementById("bagList"); if(!container||!STATE) return;
  container.innerHTML=""; var hasItems=false;
  Object.keys(ITEM_DEFS).forEach(function(key) {
    var count=STATE.items[key]||0; if(count<=0) return;
    hasItems=true;
    var def=ITEM_DEFS[key], row=document.createElement("div"); row.className="bag-item";
    row.innerHTML=
      "<div class='bag-icon-wrap'><img src='"+(def.img||"")+"' class='bag-item-sprite' onerror='this.style.display=\"none\"'></div>"+
      "<div class='bag-info'><b>"+def.name+"</b><br><small>"+def.desc+"</small></div>"+
      "<span class='bag-count'>x"+count+"</span>"+
      "<button onclick='useItem(\""+key+"\")'>Nutzen</button>";
    container.appendChild(row);
  });
  if (!hasItems) container.innerHTML="<p style='color:#888;text-align:center;padding:20px'>Tasche leer</p>";
}

function useItem(itemKey) {
  if(!STATE||!STATE.items[itemKey]||STATE.items[itemKey]<=0){showToast("Keine mehr!"); return;}
  var player=getActivePkmn(); if(!player){showToast("Kein aktives Pokémon!"); return;}
  var pd=PKMN[player.dexId], name=pd?pd.name:"Pokémon";
  switch(itemKey) {
    case "potion":      if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=Math.min(player.maxHP,player.currentHP+20); break;
    case "superpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=Math.min(player.maxHP,player.currentHP+50); break;
    case "hyperpotion": if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=Math.min(player.maxHP,player.currentHP+200); break;
    case "maxpotion":   if(player.currentHP>=player.maxHP){showToast("HP voll!");return;} player.currentHP=player.maxHP; break;
    case "fullrestore": player.currentHP=player.maxHP; player.status=null; player.statusTurns=0; break;
    case "fullheal":    player.status=null; player.statusTurns=0; break;
    case "antidote":    if(player.status!=="poison")   {showToast("Nicht vergiftet!");return;} player.status=null; break;
    case "awakening":   if(player.status!=="sleep")    {showToast("Schläft nicht!");return;} player.status=null; player.statusTurns=0; break;
    case "paralysheal": if(player.status!=="paralysis"){showToast("Nicht gelähmt!");return;} player.status=null; break;
    case "revive": {
      var fainted=STATE.party.find(function(p){return p.currentHP<=0;});
      if(!fainted){showToast("Kein K.O. Pokémon!");return;}
      fainted.currentHP=Math.floor(fainted.maxHP/2); fainted._faintAnnounced=false;
      showToast((PKMN[fainted.dexId]?PKMN[fainted.dexId].name:"?")+" belebt!");
      STATE.items[itemKey]--; renderBagScreen(); renderTeamScreen(); saveGame(); return;
    }
    default: showToast("Kann hier nicht benutzt werden."); return;
  }
  STATE.items[itemKey]--;
  showToast(name+": "+(ITEM_DEFS[itemKey]?ITEM_DEFS[itemKey].name:itemKey)+" benutzt!");
  renderBagScreen(); renderTeamScreen(); updatePlayerHp(); saveGame();
}

// ── Catch-Balls ────────────────────────────────────────────────
function renderCatchBalls(visible) {
  var container=document.getElementById("catchBalls"); if(!container) return;
  container.innerHTML="";
  if (!visible||!STATE) return;
  ["pokeball","superball","hyperball","masterball"].forEach(function(type) {
    var count=STATE.items[type]||0; if(count<=0) return;
    var btn=document.createElement("button");
    btn.className="ball-btn";
    btn.title=(ITEM_DEFS[type]?ITEM_DEFS[type].name:type)+" (x"+count+")";
    btn.innerHTML=
      "<img src='"+(BALL_SPRITES[type]||"")+"' width='24' height='24' onerror='this.replaceWith(document.createTextNode(\"⚪\"))'>"+
      "<span class='ball-count'>x"+count+"</span>";
    btn.onclick=function(){ onCatchClick(type); };
    container.appendChild(btn);
  });
}

// ── Map-Screen mit Schnellreise ────────────────────────────────
function renderMapScreen() {
  var container=document.getElementById("mapList"); if(!container||!STATE) return;
  container.innerHTML="";
  var currentIdx=WORLD.findIndex(function(z){return z.id===STATE.currentZoneId;});
  WORLD.forEach(function(zone,idx) {
    var isCurrent=(zone.id===STATE.currentZoneId);
    var isVisited=isZoneVisited(zone.id);
    var isUnlocked=idx<=currentIdx;
    var row=document.createElement("div");
    row.className="map-zone"+(isCurrent?" map-current":isVisited?" map-visited map-unlocked":isUnlocked?" map-unlocked":" map-locked");
    var icon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";
    var badge=zone.gymLeader&&isUnlocked?"<span class='map-badge'>"+(STATE.badgeIds.indexOf(zone.gymLeader.badgeId)>=0?"🏅":"⬜")+"</span>":"";
    var travelBtn=isVisited&&!isCurrent
      ?"<button class='map-travel-btn' onclick='fastTravelTo(\""+zone.id+"\")'>✈ Reisen</button>"
      :"";
    row.innerHTML=icon+" "+zone.name+
      (isCurrent?" <span class='map-here'>📍 Hier</span>":"")+
      badge+travelBtn;
    container.appendChild(row);
  });
  // Medaillen
  var br=document.getElementById("badgeRow");
  if(br) br.innerHTML=["stone","cascade","thunder","rainbow","soul","marsh","volcano","earth"].map(function(b){
    return "<span class='badge-icon"+(STATE.badgeIds.indexOf(b)>=0?" badge-earned":"")+"'>🏅</span>";
  }).join("");
}

// ── HUD ───────────────────────────────────────────────────────
function updateHUD() {
  if(!STATE) return;
  var m=document.getElementById("hudMoney"); if(m) m.textContent=STATE.money+" ₽";
  var b=document.getElementById("hudBadges"); if(b) b.textContent=STATE.badges+"/8 🏅";
  var p=document.getElementById("hudPlayer"); if(p) p.textContent=STATE.name;
}

// ── Shop ──────────────────────────────────────────────────────
function showCityShop(zone) {
  if(!zone||!zone.shopItems) return;
  var popup=document.getElementById("shopPopup"); if(popup) popup.style.display="flex";
  var list=document.getElementById("shopItemList"); if(!list) return;
  list.innerHTML="";
  zone.shopItems.forEach(function(item) {
    var canAfford=STATE.money>=item.cost;
    var def=ITEM_DEFS[item.id];
    var row=document.createElement("div"); row.className="shop-row";
    row.innerHTML=
      (def&&def.img?"<img src='"+def.img+"' width='28' height='28' style='image-rendering:pixelated;margin-right:8px' onerror='this.style.display=\"none\"'>":"")+
      "<div class='shop-info'><b>"+item.name+"</b> – "+item.desc+"</div>"+
      "<div class='shop-price'>"+item.cost+" ₽</div>"+
      "<button "+(canAfford?"":"disabled")+" onclick='buyItem(\""+item.id+"\","+item.cost+")'>Kaufen</button>";
    list.appendChild(row);
  });
}

function closeShop() { var p=document.getElementById("shopPopup"); if(p) p.style.display="none"; }

function buyItem(itemId, cost) {
  if(!STATE||STATE.money<cost){showToast("Kein Geld!"); return;}
  STATE.money-=cost;
  STATE.items[itemId]=(STATE.items[itemId]||0)+1;
  updateHUD();
  var zone=getZone(STATE.currentZoneId); if(zone) showCityShop(zone);
  saveGame(); showToast((ITEM_DEFS[itemId]?ITEM_DEFS[itemId].name:itemId)+" gekauft!");
}

function closeGymPopup(){ var p=document.getElementById("gymPopup"); if(p) p.style.display="none"; }

function showOfflineReward(awaySeconds) {
  if(awaySeconds<60) return;
  var modal=document.getElementById("offlineModal"), msg=document.getElementById("offlineMsg");
  if(!modal||!msg) return;
  var h=Math.floor(awaySeconds/3600), m=Math.floor((awaySeconds%3600)/60);
  msg.textContent="Du warst "+(h>0?h+"h ":"")+m+"m weg!";
  modal.style.display="flex";
}

function closeOfflineModal(){ var m=document.getElementById("offlineModal"); if(m) m.style.display="none"; }
