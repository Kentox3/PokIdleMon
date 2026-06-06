// ═══════════════════════════════════════════════════════════════
//  world_patch.js — WORLD-Korrekturen + neue Gebäude
// ═══════════════════════════════════════════════════════════════

(function applyWorldPatches() {

  // ── Route 22: Pikachu raus (korrekt nur im Vertania-Wald) ──
  var r22 = WORLD.find(function(z){return z.id==="route22";});
  if(r22 && r22.wildPokemon) {
    r22.wildPokemon = r22.wildPokemon.filter(function(p){return p.dexId!==25;});
    var hab = r22.wildPokemon.find(function(p){return p.dexId===21;});
    if(hab) hab.weight = 20;
  }

  // ── Fahrrad: Prismania Kaufhaus ────────────────────────────
  var dept = WORLD.find(function(z){return z.id==="celadon_dept_store";});
  if(dept && dept.shopItems) {
    if(!dept.shopItems.find(function(i){return i.id==="fahrrad";}))
      dept.shopItems.push({id:"fahrrad",name:"Fahrrad",cost:10000,desc:"2× Etappengeschwindigkeit"});
  }

  // ── EP-Teiler: Zinnia Pokémart ─────────────────────────────
  var vmart = WORLD.find(function(z){return z.id==="vermilion_pokemart";});
  if(vmart && vmart.shopItems) {
    if(!vmart.shopItems.find(function(i){return i.id==="ep_teiler";}))
      vmart.shopItems.push({id:"ep_teiler",name:"EP-Teiler",cost:5000,desc:"Ganzes Team erhält EP"});
  }

  // ══════════════════════════════════════════════════════════
  //  NEUE GEBÄUDE — Prismania City
  // ══════════════════════════════════════════════════════════

  // Spielhalle + Rocket HQ zu Prismania hinzufügen
  var celadon = WORLD.find(function(z){return z.id==="celadon_city";});
  if(celadon && celadon.buildings) {
    if(celadon.buildings.indexOf("celadon_game_corner")<0)
      celadon.buildings.push("celadon_game_corner");
    if(celadon.buildings.indexOf("rocket_hq")<0)
      celadon.buildings.push("rocket_hq");
  }

  // 🎰 SPIELHALLE
  WORLD.push({
    id:"celadon_game_corner", type:"building", buildingType:"game_corner",
    name:"Prismania Spielhalle", parentCity:"celadon_city", showInMap:false,
    coinRate:500,   // 500₽ = 100 Münzen
    features:[
      { type:"coin_buy", id:"coin_buy",
        label:"🪙 Spielmünzen kaufen",
        desc:"Tausche Pokédollar gegen Spielmünzen.",
        packs:[
          {coins:50,  cost:500,  label:"50 Münzen"},
          {coins:200, cost:1500, label:"200 Münzen"},
          {coins:500, cost:3000, label:"500 Münzen"},
        ]},
      { type:"coin_shop", id:"coin_shop",
        label:"🏪 Münzshop",
        desc:"Tausche Münzen gegen seltene Pokémon und Items!",
        items:[
          {id:"pkmn_scyther",  name:"Scyther",   cost:5500, dexId:123, desc:"Fliegendes Käfer-Pokémon"},
          {id:"pkmn_dratini",  name:"Dratini",   cost:4600, dexId:147, desc:"Seltenes Drachen-Pokémon"},
          {id:"pkmn_porygon",  name:"Porygon",   cost:9999, dexId:137, desc:"Digitales Pokémon"},
          {id:"pkmn_eevee_gc", name:"Evoli",     cost:6666, dexId:133, desc:"Evolutionspotential"},
        ]},
      { type:"rocket_switch", id:"rocket_switch",
        label:"🔴 Seltsamer Schalter...",
        desc:"Hinter einem Poster verbirgt sich ein Schalter. Drückst du ihn?",
        flagId:"rocket_switch_found",
        lockedMsg:"Du findest nichts Verdächtiges.",
        unlockedMsg:"KLICK! Eine geheime Treppe öffnet sich. Das Team Rocket HQ liegt darunter!"}
    ]
  });

  // 🏴 TEAM ROCKET HQ
  WORLD.push({
    id:"rocket_hq", type:"building", buildingType:"rocket_base",
    name:"Team Rocket HQ", parentCity:"celadon_city", showInMap:false,
    features:[
      { type:"rocket_floor", id:"rocket_f1",
        label:"⚡ 1. Etage — Rocket Grunts",
        desc:"Drei Rocket-Grunts bewachen den Eingang.",
        flagId:"rocket_f1_cleared",
        condition:{eventFlag:"rocket_switch_found"},
        lockedMsg:"Drücke zuerst den Schalter in der Spielhalle!",
        trainers:[
          {name:"Team Rocket Grunt ♂", party:[{dexId:23,lv:24},{dexId:88,lv:24}], reward:960},
          {name:"Team Rocket Grunt ♀", party:[{dexId:41,lv:25},{dexId:41,lv:25},{dexId:42,lv:26}], reward:1040},
          {name:"Team Rocket Grunt ♂", party:[{dexId:109,lv:26},{dexId:24,lv:26}], reward:1040},
        ]},
      { type:"rocket_floor", id:"rocket_f2",
        label:"⚡ 2. Etage — Rocket-Admins",
        desc:"Rocket-Admins bewachen die Silph-Orb.",
        flagId:"rocket_f2_cleared",
        condition:{eventFlag:"rocket_f1_cleared"},
        lockedMsg:"Besiege erst die Grunts auf Etage 1!",
        trainers:[
          {name:"Rocket Admin Archer",  party:[{dexId:42,lv:28},{dexId:110,lv:28},{dexId:89,lv:30}], reward:1500},
          {name:"Rocket Admin Ariana",  party:[{dexId:24,lv:28},{dexId:88,lv:29},{dexId:23,lv:30}], reward:1500},
        ]},
      { type:"rocket_floor", id:"rocket_boss",
        label:"💀 3. Etage — Giovanni!",
        desc:"Der Chef von Team Rocket erwartet dich!",
        flagId:"rocket_hq_cleared",
        condition:{eventFlag:"rocket_f2_cleared"},
        lockedMsg:"Die Admins blockieren den Weg. Besiege sie zuerst!",
        trainers:[
          {name:"Giovanni — Team Rocket Boss",
           party:[{dexId:111,lv:25},{dexId:27,lv:29},{dexId:31,lv:29},{dexId:112,lv:30}],
           reward:3000, isBoss:true}
        ]},
      { type:"give_item_hq", id:"silph_scope",
        label:"🔭 Silph-Fernglas finden",
        desc:"Das Silph-Fernglas liegt in einem Safe. Es ermöglicht Geister-Pokémon zu sehen!",
        item:"silph_scope",
        itemName:"Silph-Fernglas",
        flagId:"found_silph_scope",
        condition:{eventFlag:"rocket_hq_cleared"},
        lockedMsg:"Besiege erst Giovanni, dann kannst du den Safe öffnen!",
        text:"Du hast das Silph-Fernglas erhalten! Jetzt kannst du die Geister-Pokémon im Pokémon-Turm sehen."}
    ]
  });

  // ══════════════════════════════════════════════════════════
  //  NEUE GEBÄUDE — Lavendeldorf
  // ══════════════════════════════════════════════════════════

  var lavender = WORLD.find(function(z){return z.id==="lavender_town";});
  if(lavender && lavender.buildings) {
    if(lavender.buildings.indexOf("lavender_fujis_house")<0)
      lavender.buildings.push("lavender_fujis_house");
  }

  // 🏠 HAUS VON MR. FUJI
  WORLD.push({
    id:"lavender_fujis_house", type:"building", buildingType:"house",
    name:"Haus von Mr. Fuji", parentCity:"lavender_town", showInMap:false,
    features:[
      { type:"lore", id:"fuji_intro",
        label:"Mit Oma Küchlein sprechen",
        desc:"Sie kümmert sich um verlorene Pokémon.",
        text:"Oma Küchlein: 'Mr. Fuji war lange im Pokémon-Turm gefangen. Team Rocket hat die Geister gestört! Wenn du ihn rettest, wird er dir sicher danken…'" },
      { type:"gift_pokemon", id:"evoli_gift",
        label:"🎁 Evoli als Geschenk erhalten",
        desc:"Mr. Fuji gibt dir Evoli als Dankeschön.",
        dexId:133, level:25, nick:"Evoli",
        flagId:"evoli_received",
        condition:{eventFlag:"rocket_hq_cleared"},
        lockedMsg:"Mr. Fuji ist noch im Pokémon-Turm! Befreie ihn zuerst (besiege Team Rocket HQ).",
        text:"Mr. Fuji: 'Du hast das Team Rocket vertrieben und uns alle gerettet! Bitte nimm dieses Evoli als Zeichen meines Dankes. Es ist ein ganz besonderes Pokémon!'"}
    ]
  });

  // ══════════════════════════════════════════════════════════
  //  NEUE GEBÄUDE — Saffronia City
  // ══════════════════════════════════════════════════════════

  var saffron = WORLD.find(function(z){return z.id==="saffron_city";});
  if(saffron && saffron.buildings) {
    if(saffron.buildings.indexOf("saffron_dojo")<0)
      saffron.buildings.push("saffron_dojo");
  }

  // 🥊 KAMPFDOJO
  WORLD.push({
    id:"saffron_dojo", type:"building", buildingType:"dojo",
    name:"Kampfdojo Saffronia", parentCity:"saffron_city", showInMap:false,
    features:[
      { type:"lore", id:"dojo_intro",
        label:"Der Dojo-Meister spricht",
        desc:"Der Meister des Kampfstils fordert dich heraus.",
        text:"Dojo-Meister: 'Ich bin der Meister der Kampfkünste! Wer alle meine Schüler besiegt und mich selbst überwindet, erhält eines meiner Kampfpokémon als Beweis seiner Würde!'" },
      { type:"dojo_battle", id:"dojo_schueler",
        label:"⚔️ Schüler herausfordern",
        desc:"Besiege alle Schüler des Dojo!",
        flagId:"dojo_schueler_cleared",
        trainers:[
          {name:"Karateka Ken",   party:[{dexId:56,lv:35},{dexId:56,lv:35}], reward:1400},
          {name:"Karateka Ryo",   party:[{dexId:66,lv:36},{dexId:67,lv:36}], reward:1440},
          {name:"Karateka Bruno", party:[{dexId:106,lv:38},{dexId:107,lv:38}], reward:1900},
        ]},
      { type:"dojo_battle", id:"dojo_meister",
        label:"🏆 Dojo-Meister herausfordern",
        desc:"Besiege den Meister selbst!",
        flagId:"dojo_cleared",
        condition:{eventFlag:"dojo_schueler_cleared"},
        lockedMsg:"Besiege erst alle Schüler!",
        trainers:[
          {name:"Dojo-Meister Kyo",
           party:[{dexId:66,lv:37},{dexId:107,lv:40},{dexId:106,lv:40},{dexId:68,lv:43}],
           reward:4300, isBoss:true}
        ]},
      { type:"dojo_choice", id:"dojo_reward",
        label:"🎁 Kampfpokémon wählen",
        desc:"Wähle als Belohnung Hitmonchan oder Hitmonlee.",
        flagId:"dojo_reward_taken",
        condition:{eventFlag:"dojo_cleared"},
        lockedMsg:"Besiege zuerst den Dojo-Meister!",
        choices:[
          {dexId:106, name:"Kicklee",   level:25, label:"Kicklee (Hitmonlee)", desc:"Der Fuß-Kämpfer — hoher Angriff!"},
          {dexId:107, name:"Nockchan",  level:25, label:"Nockchan (Hitmonchan)", desc:"Der Faust-Kämpfer — hohe Verteidigung!"},
        ]}
    ]
  });

  // ══════════════════════════════════════════════════════════
  //  NEUE GEBÄUDE — Zinnoberinsel
  // ══════════════════════════════════════════════════════════

  var cinnabar = WORLD.find(function(z){return z.id==="cinnabar_island";});
  if(cinnabar && cinnabar.buildings) {
    if(cinnabar.buildings.indexOf("cinnabar_mansion")<0)
      cinnabar.buildings.push("cinnabar_mansion");
  }

  // 🏚️ POKÉMON HERRENHAUS
  WORLD.push({
    id:"cinnabar_mansion", type:"building", buildingType:"mansion",
    name:"Pokémon Herrenhaus", parentCity:"cinnabar_island", showInMap:false,
    features:[
      { type:"lore", id:"mansion_journal_1",
        label:"📖 Wissenschaftliches Tagebuch I",
        desc:"Ein altes Tagebuch liegt auf dem Boden.",
        text:"Tagebucheintrag: 'Es wurde entdeckt in Guyana, tief im Dschungel. Ein neues Pokémon wurde gefunden! Sein Körper ist weich wie Gelee. Es kann sich verwandeln. Ich werde es Mew nennen...'" },
      { type:"lore", id:"mansion_journal_2",
        label:"📖 Wissenschaftliches Tagebuch II",
        desc:"Ein weiteres Tagebuch — die Seiten sind angebrannt.",
        text:"Tagebucheintrag: 'Mew hat sich als Träger eines Embryos entpuppt. Das Experiment ist gelungen — Mewtu ist geboren! Aber es ist zu mächtig... zu gefährlich. Das Pokémon hat das Labor zerstört. Es ist geflohen...'" },
      { type:"mansion_battle", id:"mansion_grunts",
        label:"⚡ Team Rocket vertreiben",
        desc:"Rocket-Grunts haben das Herrenhaus besetzt!",
        flagId:"mansion_cleared",
        trainers:[
          {name:"Team Rocket Grunt", party:[{dexId:23,lv:38},{dexId:24,lv:40}], reward:1600},
          {name:"Team Rocket Grunt", party:[{dexId:88,lv:39},{dexId:89,lv:41}], reward:1640},
          {name:"Team Rocket Admin", party:[{dexId:42,lv:40},{dexId:110,lv:42},{dexId:89,lv:44}], reward:2200},
        ]},
      { type:"give_item_hq", id:"mansion_key",
        label:"🗝️ Geheimschlüssel finden",
        desc:"Der Schlüssel zur Zinnoberinsel-Arena liegt versteckt im Herrenhaus.",
        item:"secret_key",
        itemName:"Geheimschlüssel",
        flagId:"found_secret_key",
        condition:{eventFlag:"mansion_cleared"},
        lockedMsg:"Das Herrenhaus ist zu gefährlich. Vertreibe zuerst Team Rocket!",
        text:"Du hast den Geheimschlüssel gefunden! Damit kannst du nun die Zinnoberinsel-Arena betreten."}
    ]
  });

  // ══════════════════════════════════════════════════════════
  //  NEUE GEBÄUDE — Marmoria City
  // ══════════════════════════════════════════════════════════

  var pewter = WORLD.find(function(z){return z.id==="pewter_city";});
  if(pewter && pewter.buildings) {
    if(pewter.buildings.indexOf("pewter_old_school")<0)
      pewter.buildings.push("pewter_old_school");
  }

  // 🏫 TRAINER-SCHULE Marmoria
  WORLD.push({
    id:"pewter_old_school", type:"building", buildingType:"school",
    name:"Trainer-Schule Marmoria", parentCity:"pewter_city", showInMap:false,
    features:[
      { type:"lore", id:"school_basics",
        label:"📚 Kampf-Grundlagen lesen",
        desc:"Lerntafeln erklären die Kampfmechaniken.",
        text:"Tafel 1: Jedes Pokémon hat einen Typ. Typen sind stärker oder schwächer gegen andere Typen. Feuer ist stark gegen Pflanze — Wasser gegen Feuer — Pflanze gegen Wasser." },
      { type:"lore", id:"school_status",
        label:"📚 Status-Effekte lernen",
        desc:"Statusprobleme im Kampf erklärt.",
        text:"Tafel 2: Verbrennung und Gift verursachen schrittweise Schaden. Schlaf und Einfrieren verhindern Angriffe komplett. Lähmung hat 25% Chance, den Angriff zu blockieren." },
      { type:"lore", id:"school_exp",
        label:"📚 Erfahrungssystem verstehen",
        desc:"Wie Pokémon stärker werden.",
        text:"Tafel 3: Durch Siege sammeln Pokémon Erfahrungspunkte (EP). Bei genug EP steigen sie im Level. Höhere Level bedeuten bessere Statuswerte. Mit dem EP-Teiler erhält die gesamte Party EP!" }
    ]
  });

  // ══════════════════════════════════════════════════════════
  //  NEUE GEBÄUDE — Azuria City (Cerulean)
  // ══════════════════════════════════════════════════════════

  var cerulean = WORLD.find(function(z){return z.id==="cerulean_city";});
  if(cerulean && cerulean.buildings) {
    if(cerulean.buildings.indexOf("cerulean_bike_shop")<0)
      cerulean.buildings.push("cerulean_bike_shop");
  }

  // 🚲 FAHRRAD-SHOP Azuria
  WORLD.push({
    id:"cerulean_bike_shop", type:"building", buildingType:"shop",
    name:"Fahrrad-Shop Azuria", parentCity:"cerulean_city", showInMap:false,
    shopItems:[
      {id:"fahrrad", name:"Fahrrad", cost:10000, desc:"2× Etappengeschwindigkeit auf Routen"},
    ],
    features:[
      { type:"lore", id:"bike_shop_info",
        label:"Mit dem Händler sprechen",
        desc:"Er zeigt dir sein bestes Fahrrad.",
        text:"Fahrradhändler: 'Mit diesem Fahrrad erreichst du doppelte Geschwindigkeit auf Routen! Normalerweise kostet es 1.000.000₽ — aber für dich als Pokémon-Trainer mache ich einen Sonderpreis: 10.000₽!'"}
    ]
  });

})();
