// ═══════════════════════════════════════════════════════════════
//  world_patch.js — WORLD-Korrekturen + neue Gebäude + Inhalte
// ═══════════════════════════════════════════════════════════════

(function applyWorldPatches() {

  // ── Route 22: Pikachu raus ──────────────────────────────────
  var r22 = WORLD.find(function(z){return z.id==="route22";});
  if(r22 && r22.wildPokemon) {
    r22.wildPokemon = r22.wildPokemon.filter(function(p){return p.dexId!==25;});
    var hab = r22.wildPokemon.find(function(p){return p.dexId===21;});
    if(hab) hab.weight = 20;
  }

  // ── EP-Teiler: Zinnia Pokémart ─────────────────────────────
  var vmart = WORLD.find(function(z){return z.id==="vermilion_pokemart";});
  if(vmart && vmart.shopItems && !vmart.shopItems.find(function(i){return i.id==="ep_teiler";}))
    vmart.shopItems.push({id:"ep_teiler",name:"EP-Teiler",cost:5000,desc:"Ganzes Team erhält EP"});

  // ══════════════════════════════════════════════════════════
  //  🚲 POKÉMON FAN-KLUB — Zinnia City
  //
  //  Quelle PDF S.2: "Wenn du dem Mann von über der Pokemon
  //  Arena dir etwas erzählen lässt, bekommst du einen
  //  Rad-Coupon. Hebe ihn gut auf."
  //
  //  → Rad-Coupon → Fahrradladen Azuria → Fahrrad gratis
  // ══════════════════════════════════════════════════════════
  var vermilion = WORLD.find(function(z){return z.id==="vermilion_city";});
  if(vermilion) {
    if(!vermilion.buildings) vermilion.buildings = [];
    if(vermilion.buildings.indexOf("vermilion_fan_club")<0)
      vermilion.buildings.push("vermilion_fan_club");
  }
  if(!WORLD.find(function(z){return z.id==="vermilion_fan_club";})) {
    WORLD.push({
      id:"vermilion_fan_club", type:"building", buildingType:"house",
      name:"Pokémon Fan-Klub Zinnia", parentCity:"vermilion_city", showInMap:false,
      features:[
        { type:"lore", id:"fan_club_intro",
          label:"Im Fan-Klub umherschauen",
          desc:"Trainer schwärmen über ihre Pokémon.",
          text:"Fan 1: 'Ich LIEBE Rapidash! Kein schöneres Pokémon in ganz Kanto!'\nFan 2: 'Raticate ist einfach unschlagbar, er hat schon so viel für mich getan!'\nPräsident: 'Ah, ein neuer Besucher! Setz dich, ich erzähle dir von meinem wunderbaren Flegmon...'" },
        // Rad-Coupon vom Präsidenten (kein Abzeichen nötig)
        { type:"give_item_hq",
          id:"rad_coupon_gift",
          label:"🚲 Rad-Coupon erhalten",
          desc:"Hör dem Präsidenten geduldig zu — er schenkt dir etwas Besonderes!",
          item:"rad_coupon",
          itemName:"Rad-Coupon",
          flagId:"got_rad_coupon",
          lockedMsg:"",  // kein lock — immer verfügbar
          text:"Präsident: '...und so hat mein treues Flegmon den Angelwettbewerb gewonnen! Ah! Du hast mir so geduldig zugehört! Als kleines Dankeschön — hier ist ein Rad-Coupon! Im Fahrradladen in Azuria City tauschst du ihn gegen ein Fahrrad ein. Kostenlos!'" }
      ]
    });
  }

  // ══════════════════════════════════════════════════════════
  //  🚲 FAHRRAD-SHOP AZURIA
  //
  //  Gen-1-getreu: Coupon einlösen → Fahrrad GRATIS
  //  Fallback: ohne Coupon für 10.000₽ kaufbar
  // ══════════════════════════════════════════════════════════
  var cerulean = WORLD.find(function(z){return z.id==="cerulean_city";});
  if(cerulean) {
    if(!cerulean.buildings) cerulean.buildings = [];
    if(cerulean.buildings.indexOf("cerulean_bike_shop")<0)
      cerulean.buildings.push("cerulean_bike_shop");
    // Nord-Exit: Nugget-Brücke
    if(!cerulean.exits.find(function(e){return e.id==="route24_25";})) {
      cerulean.exits.push({
        id:"route24_25", label:"Route 24-25 Nord (Nugget-Brücke)",
        desc:"Fünf Trainer und ein Rocket warten auf dich!",
        direction:"north"
      });
    }
    // Nordwest-Exit: Cerulean Cave
    if(!cerulean.exits.find(function(e){return e.id==="cerulean_cave";})) {
      cerulean.exits.push({
        id:"cerulean_cave", label:"⚠️ Unbekannte Höhle",
        desc:"Wissenschaftler sagen, hier wohnt ein legendäres Pokémon...",
        direction:"northwest",
        condition:{ minBadges:8 },
        lockedMsg:"Wissenschaftler: 'Zutritt verboten! Hole alle 8 Orden!'"
      });
    }
    if(cerulean.buildings.indexOf("cerulean_bills_house")<0)
      cerulean.buildings.push("cerulean_bills_house");
  }
  if(!WORLD.find(function(z){return z.id==="cerulean_bike_shop";})) {
    WORLD.push({
      id:"cerulean_bike_shop", type:"building", buildingType:"shop",
      name:"Fahrrad-Shop Azuria", parentCity:"cerulean_city", showInMap:false,
      // Fallback: kaufen ohne Coupon
      shopItems:[
        { id:"fahrrad", name:"Fahrrad", cost:10000, desc:"2× Etappengeschwindigkeit" }
      ],
      features:[
        // Empfang
        { type:"lore", id:"bike_info",
          label:"Mit dem Händler sprechen",
          desc:"Er erklärt das Fahrrad und den Coupon.",
          text:"Händler: 'Willkommen! Unser Fahrrad verdoppelt deine Geschwindigkeit auf Routen! Hast du einen Rad-Coupon vom Pokémon Fan-Klub in Zinnia City? Den tausche ich gerne 1:1 gegen ein brandneues Fahrrad — kostenlos! Ohne Coupon kostet es 10.000₽.'" },
        // ── Coupon-Einlösung (Gen-1-getreu, gratis) ──────
        { type:"give_item_hq",
          id:"fahrrad_coupon_exchange",
          label:"🚲 Rad-Coupon einlösen (gratis!)",
          desc:"Tausche deinen Rad-Coupon gegen ein Fahrrad.",
          item:"fahrrad",
          itemName:"Fahrrad",
          flagId:"got_fahrrad",
          condition:{ hasItem:"rad_coupon" },
          lockedMsg:"Du hast keinen Rad-Coupon. Besuche den Pokémon Fan-Klub in Zinnia City — der Präsident dort gibt ihn dir nach einem Gespräch!",
          text:"Händler: 'Ein Rad-Coupon! Ausgezeichnet! Hier ist dein nagelneuenes Fahrrad — natürlich kostenlos!'" }
      ]
    });
  }

  // 🌉 NUGGET-BRÜCKE (Route 24-25)
  if(!WORLD.find(function(z){return z.id==="route24_25";})) {
    WORLD.push({
      id:"route24_25", type:"route",
      name:"Nugget-Brücke (Route 24–25)",
      bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c870",
      stageCount:12, showInMap:true,
      wildPokemon:[
        { dexId:63, minLv:10, maxLv:15, weight:25 },
        { dexId:43, minLv:10, maxLv:15, weight:20 },
        { dexId:69, minLv:10, maxLv:14, weight:20 },
        { dexId:16, minLv:10, maxLv:14, weight:15 },
        { dexId:10, minLv:10, maxLv:13, weight:10 },
        { dexId:72, minLv:10, maxLv:14, weight:10 },
      ],
      trainers:[
        { stage:2, name:"Jungtrainer Stefan",  party:[{dexId:16,lv:11},{dexId:19,lv:11}], reward:220 },
        { stage:3, name:"Jungtrainerin Lisa",  party:[{dexId:43,lv:12}], reward:240 },
        { stage:4, name:"Jungtrainer Franz",   party:[{dexId:63,lv:12},{dexId:16,lv:12}], reward:300 },
        { stage:5, name:"Jugendlicher Moritz", party:[{dexId:72,lv:12},{dexId:43,lv:13}], reward:350 },
        { stage:6, name:"Jungtrainerin Petra", party:[{dexId:63,lv:14},{dexId:69,lv:13}], reward:380 },
        { stage:7, name:"Team Rocket Gruntz",  party:[{dexId:23,lv:14},{dexId:69,lv:14}], reward:280 },
      ],
      waypoints:[
        { atStage:7, type:"event", flagId:"nugget_received", money:5000,
          message:"Team Rocket: 'Beweise deinen Wert!' — Du besiegst ihn! Er drückt dir ein goldenes Nugget in die Hand (5000₽ wert)!"},
        { atStage:10, type:"rival_fight", flagId:"rival_nugget_beaten",
          rivalName:"Gary", rivalLevel:14,
          party:[{dexId:17,lv:16},{dexId:63,lv:14}], reward:500,
          dialogBefore:"Gary: Wow, du schaffst es sogar über die Brücke! Na gut, ich muss auch trainieren!"}
      ],
      terminus:{ exits:[{ id:"cerulean_city" }] }
    });
  }

  // 🏠 BILLS HAUS
  if(!WORLD.find(function(z){return z.id==="cerulean_bills_house";})) {
    WORLD.push({
      id:"cerulean_bills_house", type:"building", buildingType:"house",
      name:"Bills Haus (Küstenhaus)", parentCity:"cerulean_city", showInMap:false,
      features:[
        { type:"lore", id:"bills_intro", label:"Bill ansprechen", desc:"Bill ist Pokémon-Forscher.",
          text:"Bill: 'Oh! Ein Trainer! Ich bin Bill — Pokémon-Forscher! Ich habe versehentlich mit dem Teleporter experimentiert...'" },
        { type:"bill_rescue", id:"bill_help", label:"🔬 Bill befreien",
          desc:"Aktiviere den Teleporter!", flagId:"bill_rescued",
          text:"Bill: 'Danke! Als Dankeschön bekommst du das S.S. Anne Ticket!'" }
      ]
    });
  }

  // ══════════════════════════════════════════════════════════
  //  MONDBERG — FOSSIL-WAHL
  // ══════════════════════════════════════════════════════════
  var mtMoon = WORLD.find(function(z){return z.id==="mt_moon";});
  if(mtMoon) {
    if(!mtMoon.waypoints) mtMoon.waypoints = [];
    if(!mtMoon.waypoints.find(function(w){return w.flagId==="mt_moon_fossil_chosen";})) {
      mtMoon.waypoints.push({
        atStage:19, type:"fossil_choice", flagId:"mt_moon_fossil_chosen",
        text:"Team Rocket flieht und lässt zwei Fossilien zurück! Wähle eines:",
        choices:[
          { item:"dome_fossil",  itemName:"Kuppelfossil",   desc:"Führt zu Kabuto",   dexId:140 },
          { item:"helix_fossil", itemName:"Spiralenfossil", desc:"Führt zu Amonitas", dexId:138 },
        ]
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  CERULEAN CAVE — Mewtu
  // ══════════════════════════════════════════════════════════
  if(!WORLD.find(function(z){return z.id==="cerulean_cave";})) {
    WORLD.push({
      id:"cerulean_cave", type:"dungeon", name:"Unbekannte Höhle",
      bgGround:"#1a1820", bgSky:"#0a0810", bgMid:"#2a2030",
      stageCount:15, showInMap:true,
      wildPokemon:[
        { dexId:63,  minLv:46, maxLv:55, weight:25 },{ dexId:79, minLv:46, maxLv:55, weight:20 },
        { dexId:74,  minLv:46, maxLv:55, weight:15 },{ dexId:41, minLv:46, maxLv:55, weight:15 },
        { dexId:66,  minLv:46, maxLv:55, weight:10 },{ dexId:112,minLv:50, maxLv:60, weight:8  },
        { dexId:31,  minLv:50, maxLv:58, weight:4  },{ dexId:34, minLv:50, maxLv:58, weight:3  },
      ],
      trainers:[],
      waypoints:[{ atStage:15, type:"mewtu_encounter", flagId:"mewtu_fought",
        mewtoDexId:150, mewtuLevel:70,
        message:"Die Höhle endet an einem großen Wasser... MEWTU taucht auf!",
        hintMsg:"Meisterball aus der Silph AG empfohlen! Catchrate: 3"}],
      terminus:{ exits:[{ id:"cerulean_city" }] }
    });
  }

  // ══════════════════════════════════════════════════════════
  //  RELAXO #1 — Route 12 (route7_8)
  // ══════════════════════════════════════════════════════════
  var r7 = WORLD.find(function(z){return z.id==="route7_8";});
  if(r7) {
    if(!r7.waypoints) r7.waypoints = [];
    if(!r7.waypoints.find(function(w){return w.flagId==="relaxo_route12_cleared";}))
      r7.waypoints.push({atStage:7,type:"relaxo_block",flagId:"relaxo_route12_cleared",
        relaxoDexId:143,relaxoLevel:30,needsItem:"pokefloete",
        blockedMsg:"Ein riesiges Relaxo liegt mitten auf dem Weg! Pokéflöte von Mr. Fuji nötig…",
        wakeMsg:"Du spielst die Pokéflöte... ♪♫ Das Relaxo springt auf — Angriff!"});
  }

  // ══════════════════════════════════════════════════════════
  //  RELAXO #2 — Fahrradroute 16-18
  // ══════════════════════════════════════════════════════════
  var r16 = WORLD.find(function(z){return z.id==="route16_18";});
  if(r16) {
    if(!r16.waypoints) r16.waypoints = [];
    if(!r16.waypoints.find(function(w){return w.flagId==="relaxo_route16_cleared";}))
      r16.waypoints.push({atStage:8,type:"relaxo_block",flagId:"relaxo_route16_cleared",
        relaxoDexId:143,relaxoLevel:30,needsItem:"pokefloete",
        blockedMsg:"Relaxo schläft auf der Fahrradstraße! Pokéflöte von Mr. Fuji nötig.",
        wakeMsg:"Du spielst die Pokéflöte... ♪♫ Das Relaxo öffnet die Augen!"});
  }

  // ══════════════════════════════════════════════════════════
  //  MR. FUJI — Pokéflöte + Evoli
  // ══════════════════════════════════════════════════════════
  var fuji = WORLD.find(function(z){return z.id==="lavender_fujis_house";});
  if(!fuji) {
    var lavender = WORLD.find(function(z){return z.id==="lavender_town";});
    if(lavender&&lavender.buildings&&lavender.buildings.indexOf("lavender_fujis_house")<0)
      lavender.buildings.push("lavender_fujis_house");
    WORLD.push({id:"lavender_fujis_house",type:"building",buildingType:"house",name:"Haus von Mr. Fuji",parentCity:"lavender_town",showInMap:false,features:[]});
    fuji=WORLD.find(function(z){return z.id==="lavender_fujis_house";});
  }
  if(fuji){
    if(!fuji.features)fuji.features=[];
    if(!fuji.features.find(function(f){return f.id==="fuji_intro";}))
      fuji.features.unshift({type:"lore",id:"fuji_intro",label:"Mit Oma Küchlein sprechen",desc:"Sie kümmert sich um verlorene Pokémon.",text:"Oma Küchlein: 'Mr. Fuji war im Pokémon-Turm eingesperrt! Reise dorthin und befreie ihn.'"});
    if(!fuji.features.find(function(f){return f.id==="pokefloete_gift";}))
      fuji.features.push({type:"give_item_hq",id:"pokefloete_gift",label:"🎵 Pokéflöte erhalten",desc:"Mr. Fuji gibt dir die Pokéflöte.",item:"pokefloete",itemName:"Pokéflöte",flagId:"got_pokefloete",condition:{eventFlag:"rival_tower_beaten"},lockedMsg:"Besiege erst Gary im Pokémon-Turm!",text:"Mr. Fuji: 'Diese Flöte weckt schlafende Relaxo auf!'"});
    if(!fuji.features.find(function(f){return f.id==="evoli_gift";}))
      fuji.features.push({type:"gift_pokemon",id:"evoli_gift",label:"🎁 Evoli erhalten",desc:"Mr. Fuji schenkt dir ein besonderes Evoli.",dexId:133,level:25,nick:"Evoli",flagId:"evoli_received",condition:{eventFlag:"rocket_hq_cleared"},lockedMsg:"Befreie erst die Spielhalle!",text:"Mr. Fuji: 'Hier ist das Evoli!'"});
  }

  // ══════════════════════════════════════════════════════════
  //  PRISMANIA CITY — Spielhalle + Rocket HQ
  // ══════════════════════════════════════════════════════════
  var celadon = WORLD.find(function(z){return z.id==="celadon_city";});
  if(celadon&&celadon.buildings){
    if(celadon.buildings.indexOf("celadon_game_corner")<0)celadon.buildings.push("celadon_game_corner");
    if(celadon.buildings.indexOf("rocket_hq")<0)celadon.buildings.push("rocket_hq");
  }
  if(!WORLD.find(function(z){return z.id==="celadon_game_corner";}))
    WORLD.push({id:"celadon_game_corner",type:"building",buildingType:"game_corner",name:"Prismania Spielhalle",parentCity:"celadon_city",showInMap:false,features:[
      {type:"coin_buy",id:"coin_buy",label:"🪙 Spielmünzen kaufen",desc:"Tausche Pokédollar gegen Spielmünzen.",packs:[{coins:50,cost:500,label:"50 Münzen"},{coins:200,cost:1500,label:"200 Münzen"},{coins:500,cost:3000,label:"500 Münzen"}]},
      {type:"coin_shop",id:"coin_shop",label:"🏪 Münzshop",desc:"Tausche Münzen gegen seltene Pokémon!",items:[{id:"pkmn_scyther",name:"Scyther",cost:5500,dexId:123,desc:"Selten!"},{id:"pkmn_dratini",name:"Dratini",cost:4600,dexId:147,desc:"Drachen-Pokémon!"},{id:"pkmn_porygon",name:"Porygon",cost:9999,dexId:137,desc:"Sehr selten!"},{id:"pkmn_eevee_gc",name:"Evoli",cost:6666,dexId:133,desc:"Evolutionspotential"}]},
      {type:"rocket_switch",id:"rocket_switch",label:"🔴 Seltsamer Schalter...",desc:"Hinter einem Poster verbirgt sich ein Schalter.",flagId:"rocket_switch_found",unlockedMsg:"KLICK! Geheimtreppe öffnet sich ins Team Rocket HQ!"}
    ]});
  if(!WORLD.find(function(z){return z.id==="rocket_hq";}))
    WORLD.push({id:"rocket_hq",type:"building",buildingType:"rocket_base",name:"Team Rocket HQ",parentCity:"celadon_city",showInMap:false,features:[
      {type:"rocket_floor",id:"rocket_f1",label:"⚡ 1. Etage — Grunts",desc:"Drei Rocket-Grunts.",flagId:"rocket_f1_cleared",condition:{eventFlag:"rocket_switch_found"},lockedMsg:"Drücke den Schalter!",trainers:[{name:"Team Rocket Grunt ♂",party:[{dexId:23,lv:24},{dexId:88,lv:24}],reward:960},{name:"Team Rocket Grunt ♀",party:[{dexId:41,lv:25},{dexId:42,lv:26}],reward:1040},{name:"Team Rocket Grunt ♂",party:[{dexId:109,lv:26},{dexId:24,lv:26}],reward:1040}]},
      {type:"rocket_floor",id:"rocket_f2",label:"⚡ 2. Etage — Admins",desc:"Rocket-Admins.",flagId:"rocket_f2_cleared",condition:{eventFlag:"rocket_f1_cleared"},lockedMsg:"Besiege erst Etage 1!",trainers:[{name:"Rocket Admin Archer",party:[{dexId:42,lv:28},{dexId:110,lv:28},{dexId:89,lv:30}],reward:1500},{name:"Rocket Admin Ariana",party:[{dexId:24,lv:28},{dexId:88,lv:29},{dexId:23,lv:30}],reward:1500}]},
      {type:"rocket_floor",id:"rocket_boss",label:"💀 3. Etage — Giovanni!",desc:"Der Chef wartet.",flagId:"rocket_hq_cleared",condition:{eventFlag:"rocket_f2_cleared"},lockedMsg:"Besiege erst die Admins!",trainers:[{name:"Giovanni — Team Rocket Boss",party:[{dexId:111,lv:25},{dexId:27,lv:29},{dexId:31,lv:29},{dexId:112,lv:30}],reward:3000,isBoss:true}]},
      {type:"give_item_hq",id:"silph_scope",label:"🔭 Silph-Fernglas finden",desc:"In einem Safe.",item:"silph_scope",itemName:"Silph-Fernglas",flagId:"found_silph_scope",condition:{eventFlag:"rocket_hq_cleared"},lockedMsg:"Besiege erst Giovanni!",text:"Silph-Fernglas erhalten!"}
    ]});

  // ── Kampfdojo Saffronia ─────────────────────────────────────
  var saffron=WORLD.find(function(z){return z.id==="saffron_city";});
  if(saffron&&saffron.buildings&&saffron.buildings.indexOf("saffron_dojo")<0)saffron.buildings.push("saffron_dojo");
  if(!WORLD.find(function(z){return z.id==="saffron_dojo";}))
    WORLD.push({id:"saffron_dojo",type:"building",buildingType:"dojo",name:"Kampfdojo Saffronia",parentCity:"saffron_city",showInMap:false,features:[
      {type:"lore",id:"dojo_intro",label:"Der Dojo-Meister spricht",desc:"Er fordert dich heraus.",text:"Dojo-Meister: 'Wer alle meine Schüler und mich besiegt, erhält ein Kampfpokémon!'"},
      {type:"dojo_battle",id:"dojo_schueler",label:"⚔️ Schüler herausfordern",desc:"Besiege alle!",flagId:"dojo_schueler_cleared",trainers:[{name:"Karateka Ken",party:[{dexId:56,lv:35},{dexId:56,lv:35}],reward:1400},{name:"Karateka Ryo",party:[{dexId:66,lv:36},{dexId:67,lv:36}],reward:1440},{name:"Karateka Bruno",party:[{dexId:106,lv:38},{dexId:107,lv:38}],reward:1900}]},
      {type:"dojo_battle",id:"dojo_meister",label:"🏆 Dojo-Meister herausfordern",desc:"Besiege den Meister!",flagId:"dojo_cleared",condition:{eventFlag:"dojo_schueler_cleared"},lockedMsg:"Erst alle Schüler!",trainers:[{name:"Dojo-Meister Kyo",party:[{dexId:66,lv:37},{dexId:107,lv:40},{dexId:106,lv:40},{dexId:68,lv:43}],reward:4300,isBoss:true}]},
      {type:"dojo_choice",id:"dojo_reward",label:"🎁 Kampfpokémon wählen",desc:"Kicklee oder Nockchan.",flagId:"dojo_reward_taken",condition:{eventFlag:"dojo_cleared"},lockedMsg:"Erst den Meister besiegen!",choices:[{dexId:106,name:"Kicklee",level:25,label:"Kicklee",desc:"Hoher Angriff!"},{dexId:107,name:"Nockchan",level:25,label:"Nockchan",desc:"Hohe Verteidigung!"}]}
    ]});

  // ── Pokémon Herrenhaus Zinnoberinsel ────────────────────────
  var cinnabar=WORLD.find(function(z){return z.id==="cinnabar_island";});
  if(cinnabar&&cinnabar.buildings&&cinnabar.buildings.indexOf("cinnabar_mansion")<0)cinnabar.buildings.push("cinnabar_mansion");
  if(!WORLD.find(function(z){return z.id==="cinnabar_mansion";}))
    WORLD.push({id:"cinnabar_mansion",type:"building",buildingType:"mansion",name:"Pokémon Herrenhaus",parentCity:"cinnabar_island",showInMap:false,features:[
      {type:"lore",id:"mansion_journal_1",label:"📖 Tagebuch I",desc:"Altes Tagebuch.",text:"'...Ein neues Pokémon wurde gefunden — ich nenne es Mew...'"},
      {type:"lore",id:"mansion_journal_2",label:"📖 Tagebuch II",desc:"Angebranntes Tagebuch.",text:"'...Mewtu ist geboren! Es ist zu mächtig und geflohen...'"},
      {type:"mansion_battle",id:"mansion_grunts",label:"⚡ Team Rocket vertreiben",desc:"Rocket-Grunts!",flagId:"mansion_cleared",trainers:[{name:"Team Rocket Grunt",party:[{dexId:23,lv:38},{dexId:24,lv:40}],reward:1600},{name:"Team Rocket Grunt",party:[{dexId:88,lv:39},{dexId:89,lv:41}],reward:1640},{name:"Team Rocket Admin",party:[{dexId:42,lv:40},{dexId:110,lv:42},{dexId:89,lv:44}],reward:2200}]},
      {type:"give_item_hq",id:"mansion_key",label:"🗝️ Geheimschlüssel finden",desc:"Öffnet die Arena.",item:"secret_key",itemName:"Geheimschlüssel",flagId:"found_secret_key",condition:{eventFlag:"mansion_cleared"},lockedMsg:"Erst Team Rocket vertreiben!",text:"Geheimschlüssel gefunden!"}
    ]});

  // ── Trainer-Schule Marmoria ─────────────────────────────────
  var pewter=WORLD.find(function(z){return z.id==="pewter_city";});
  if(pewter&&pewter.buildings&&pewter.buildings.indexOf("pewter_old_school")<0)pewter.buildings.push("pewter_old_school");
  if(!WORLD.find(function(z){return z.id==="pewter_old_school";}))
    WORLD.push({id:"pewter_old_school",type:"building",buildingType:"school",name:"Trainer-Schule Marmoria",parentCity:"pewter_city",showInMap:false,features:[
      {type:"lore",id:"school_basics",label:"📚 Kampf-Grundlagen",desc:"Typen erklärt.",text:"Feuer > Pflanze > Wasser > Feuer."},
      {type:"lore",id:"school_status",label:"📚 Status-Effekte",desc:"Was tun sie?",text:"Verbrennung/Gift: Schaden. Schlaf: kein Angriff. Lähmung: 25% blockiert."},
      {type:"lore",id:"school_exp",label:"📚 EP & Items",desc:"Erfahrung & Items.",text:"Mit EP-Teiler erhält das ganze Team EP! Fahrrad verdoppelt Etappentempo."}
    ]});

})();
