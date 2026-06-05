// ═══════════════════════════════════════════════════════════════
//  world.js — Kanto Welt-Struktur (Gen-1-getreu)
// ═══════════════════════════════════════════════════════════════

var WORLD = [

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ALABASTIA (Pallet Town)                                 ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"alabastia", type:"city", name:"Alabastia",
    bgGround:"#90b860", bgSky:"#aadaff", bgMid:"#b0c880", showInMap:true,
    buildings:["alabastia_lab"],
    exits:[{ id:"route1", label:"Route 1 Nord", desc:"Richtung Vertania City", direction:"north" }],
    cityRival:{ name:"Gary", reward:100, sprite:"rival", flagId:"rival_pallet_beaten",
      dialogBefore:"Hey! Ich bin Gary Oak! Der weltbeste Trainer werde ich sein!",
      dialogAfter:"Nicht schlecht… aber das war erst der Anfang!" }
  },
  {
    id:"alabastia_lab", type:"building", buildingType:"lab",
    name:"Labor Prof. Eiche", parentCity:"alabastia", showInMap:false,
    features:[
      { type:"heal", label:"Pokémon heilen", desc:"Prof. Eiche heilt dein Team vollständig." },
      { type:"lore", id:"oak_speech", label:"Mit Prof. Eiche sprechen",
        desc:"Er erklärt dir die Welt der Pokémon.",
        text:"Das Pokémon-Universum birgt viele Geheimnisse. Reise durch Kanto, fange Pokémon und trage sie in den Pokédex ein!" }
    ]
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 1                                                 ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route1", type:"route", name:"Route 1",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:10, showInMap:true,
    wildPokemon:[
      { dexId:16, minLv:2, maxLv:4, weight:55 },
      { dexId:19, minLv:2, maxLv:4, weight:45 },
    ],
    trainers:[
      { stage:5, name:"Jungtrainer Timm", party:[{dexId:16,lv:3},{dexId:19,lv:3}], reward:60 },
    ],
    terminus:{ exits:[{ id:"viridian_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  VERTANIA CITY (Viridian City)                           ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"viridian_city", type:"city", name:"Vertania City",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0", showInMap:true,
    buildings:["viridian_pokecenter","viridian_pokemart"],
    exits:[
      { id:"route2",       label:"Route 2 Nord",    desc:"Richtung Marmoria City", direction:"north" },
      { id:"route22",      label:"Route 22 West",   desc:"Optionaler Bereich — Rival lauert!", direction:"west" },
      { id:"viridian_gym", label:"Vertania Arena",  desc:"Giovanni – Erdorden", type:"gym",
        condition:{ minBadges:7 }, lockedMsg:"Giovanni: Komm wieder, wenn du 7 andere Orden besitzt!" }
    ]
  },
  {
    id:"viridian_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Vertania", parentCity:"viridian_city", showInMap:false,
    features:[
      { type:"npc_trade", id:"trade_viridian",
        npcName:"Händler Kurt", npcSprite:"youngster",
        give:19, get:29,
        text:"Ich suche ein Rattata für mein Nidoran♀ – machst du mit?",
        flagId:"trade_viridian_done" }
    ]
  },
  {
    id:"viridian_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Vertania", parentCity:"viridian_city", showInMap:false,
    shopItems:[
      { id:"pokeball",  name:"Pokéball",  cost:200, desc:"Fanghilfe" },
      { id:"potion",    name:"Trank",     cost:300, desc:"+20 HP" },
      { id:"antidote",  name:"Gegengift", cost:100, desc:"Heilt Gift" },
    ]
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 2 + VERTANIA WALD                                 ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route2", type:"route", name:"Route 2",
    bgGround:"#60a040", bgSky:"#87ceeb", bgMid:"#80b860",
    stageCount:8, showInMap:true,
    wildPokemon:[
      { dexId:16, minLv:3, maxLv:5, weight:35 },
      { dexId:19, minLv:3, maxLv:5, weight:30 },
      { dexId:10, minLv:3, maxLv:4, weight:20 },
      { dexId:13, minLv:3, maxLv:4, weight:15 },
    ],
    trainers:[
      { stage:4, name:"Jungtrainerin Lisa", party:[{dexId:19,lv:4}], reward:80 },
    ],
    terminus:{ exits:[{ id:"viridian_forest" }] }
  },
  {
    id:"viridian_forest", type:"dungeon", name:"Vertania-Wald",
    bgGround:"#2a6a2a", bgSky:"#1a4a1a", bgMid:"#3a8a3a",
    stageCount:15, showInMap:true,
    wildPokemon:[
      { dexId:10, minLv:3, maxLv:7, weight:25 },
      { dexId:13, minLv:3, maxLv:7, weight:25 },
      { dexId:11, minLv:4, maxLv:7, weight:15 },
      { dexId:14, minLv:4, maxLv:7, weight:15 },
      { dexId:16, minLv:3, maxLv:5, weight:13 },
      { dexId:25, minLv:3, maxLv:6, weight:7  },
    ],
    trainers:[
      { stage:3,  name:"Käfersammler Ben",   party:[{dexId:10,lv:4}], reward:80 },
      { stage:8,  name:"Käfersammler Felix", party:[{dexId:13,lv:5},{dexId:10,lv:5}], reward:120 },
      { stage:12, name:"Käfersammler Max",   party:[{dexId:14,lv:6},{dexId:11,lv:6}], reward:150 },
    ],
    terminus:{ exits:[{ id:"route3_west" }] }
  },
  {
    id:"route3_west", type:"route", name:"Route 3 West",
    bgGround:"#70b060", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:5, showInMap:true,
    wildPokemon:[
      { dexId:21, minLv:6, maxLv:8, weight:40 },
      { dexId:39, minLv:6, maxLv:8, weight:35 },
      { dexId:27, minLv:5, maxLv:8, weight:25 },
    ],
    trainers:[
      { stage:3, name:"Jungtrainer Chris", party:[{dexId:21,lv:7}], reward:120 },
    ],
    terminus:{ exits:[{ id:"pewter_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  MARMORIA CITY (Pewter City)                             ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"pewter_city", type:"city", name:"Marmoria City",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0", showInMap:true,
    buildings:["pewter_pokecenter","pewter_pokemart","pewter_museum"],
    exits:[
      { id:"pewter_gym",   label:"Marmoria Arena", desc:"Rocco – Steinorden", type:"gym" },
      { id:"route3_east",  label:"Route 3 Ost",    desc:"Richtung Rotes Gebirge → Azuria City", direction:"east",
        condition:{ minBadges:1 }, lockedMsg:"Du solltest zuerst die Arena herausfordern!" }
    ]
  },
  {
    id:"pewter_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Marmoria", parentCity:"pewter_city", showInMap:false
    // kein Tausch hier
  },
  {
    id:"pewter_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Marmoria", parentCity:"pewter_city", showInMap:false,
    shopItems:[
      { id:"pokeball",  name:"Pokéball",  cost:200, desc:"Fanghilfe" },
      { id:"potion",    name:"Trank",     cost:300, desc:"+20 HP" },
      { id:"antidote",  name:"Gegengift", cost:100, desc:"Heilt Gift" },
      { id:"escape",    name:"Fluchtweg", cost:550, desc:"Flieht aus Höhlen" },
    ]
  },
  {
    id:"pewter_museum", type:"building", buildingType:"museum",
    name:"Marmoria Museum", parentCity:"pewter_city", showInMap:false, entryFee:50,
    features:[
      { type:"lore", id:"museum_exhibit_1", label:"Urzeitausstellung",
        desc:"Ausgestellte Fossilien und Dinosaurier-Pokémon.",
        text:"In Glasvitrinen sind versteinerte Überreste prähistorischer Pokémon ausgestellt. Ein Schild besagt: 'Diese Pokémon lebten vor über 300 Millionen Jahren!'" },
      { type:"lore", id:"museum_exhibit_2", label:"Mondstein-Ausstellung",
        desc:"Meteoriten und Mondsteine.",
        text:"Im hinteren Bereich sind Mondsteine ausgestellt, die aus dem Weltraum stammen sollen. Gerüchten zufolge kann man damit bestimmte Pokémon entwickeln." }
    ]
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  MARMORIA ARENA                                          ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"pewter_gym", type:"gym", name:"Marmoria Arena",
    bgGround:"#808080", bgSky:"#a09080", bgMid:"#909090",
    stageCount:5, showInMap:false, wildPokemon:[],
    trainers:[
      { stage:2, name:"Arenakämpfer Rex", party:[{dexId:74,lv:10}], reward:200 },
      { stage:4, name:"Arenakämpfer Dan", party:[{dexId:74,lv:10},{dexId:74,lv:11}], reward:300 },
    ],
    gymLeader:{
      stage:5, name:"Rocco", title:"Arenaleiter",
      badge:"Steinmedaille", badgeId:"stone",
      party:[{dexId:74,lv:12},{dexId:95,lv:14}],
      reward:1400, winText:"Rocco: Du hast verdient gewonnen! Die Steinmedaille ist dein!"
    },
    terminus:{ exits:[{ id:"pewter_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 3 OST → ROTES GEBIRGE → ROUTE 4                  ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route3_east", type:"route", name:"Route 3",
    bgGround:"#70b060", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:12, showInMap:true,
    wildPokemon:[
      { dexId:21, minLv:6,  maxLv:10, weight:35 },
      { dexId:29, minLv:6,  maxLv:9,  weight:20 },
      { dexId:32, minLv:6,  maxLv:9,  weight:15 },
      { dexId:39, minLv:6,  maxLv:9,  weight:15 },
      { dexId:27, minLv:6,  maxLv:9,  weight:8  },
      { dexId:35, minLv:7,  maxLv:9,  weight:7  },
    ],
    trainers:[
      { stage:3,  name:"Jungtrainerin Anna", party:[{dexId:21,lv:8}], reward:160 },
      { stage:7,  name:"Wanderer Ben",       party:[{dexId:29,lv:9},{dexId:32,lv:9}], reward:200 },
      { stage:11, name:"Jungtrainer Karl",   party:[{dexId:21,lv:10},{dexId:39,lv:9}], reward:240 },
    ],
    terminus:{ exits:[{ id:"mt_moon" }] }
  },
  {
    id:"mt_moon", type:"dungeon", name:"Rotes Gebirge",
    bgGround:"#5a5060", bgSky:"#2a2040", bgMid:"#4a4055",
    stageCount:20, showInMap:true,
    wildPokemon:[
      { dexId:41, minLv:6,  maxLv:11, weight:45 },
      { dexId:74, minLv:8,  maxLv:12, weight:25 },
      { dexId:46, minLv:7,  maxLv:12, weight:15 },
      { dexId:35, minLv:8,  maxLv:12, weight:9  },
      { dexId:27, minLv:7,  maxLv:10, weight:6  },
    ],
    trainers:[
      { stage:4,  name:"Team Rocket",       party:[{dexId:41,lv:11},{dexId:41,lv:11}], reward:220 },
      { stage:8,  name:"Team Rocket",       party:[{dexId:74,lv:12},{dexId:41,lv:12}], reward:280 },
      { stage:12, name:"Geologe Stefan",    party:[{dexId:74,lv:11},{dexId:46,lv:11},{dexId:74,lv:11}], reward:350 },
      { stage:16, name:"Team Rocket",       party:[{dexId:41,lv:13},{dexId:46,lv:13}], reward:350 },
      { stage:19, name:"Forscher Joachim",  party:[{dexId:74,lv:12},{dexId:35,lv:10},{dexId:74,lv:12}], reward:400 },
    ],
    terminus:{ exits:[{ id:"route4" }] }
  },
  {
    id:"route4", type:"route", name:"Route 4",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c860",
    stageCount:8, showInMap:true,
    wildPokemon:[
      { dexId:21, minLv:10, maxLv:15, weight:30 },
      { dexId:19, minLv:10, maxLv:14, weight:25 },
      { dexId:20, minLv:13, maxLv:16, weight:15 },
      { dexId:27, minLv:11, maxLv:15, weight:15 },
      { dexId:23, minLv:11, maxLv:15, weight:10 },
      { dexId:35, minLv:10, maxLv:14, weight:5  },
    ],
    trainers:[
      { stage:4, name:"Jungtrainer Philipp", party:[{dexId:21,lv:14},{dexId:27,lv:14}], reward:350 },
    ],
    terminus:{ exits:[{ id:"cerulean_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  AZURIA CITY (Cerulean City) — GABELUNG                  ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"cerulean_city", type:"city", name:"Azuria City",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0", showInMap:true,
    buildings:["cerulean_pokecenter","cerulean_pokemart"],
    exits:[
      { id:"cerulean_gym", label:"Azuria Arena",   desc:"Misty – Kaskadenorden", type:"gym" },
      { id:"route5_6",     label:"Route 5 Süd",    desc:"Unterirdischer Tunnel → Zinnia City", direction:"south",
        condition:{ minBadges:2 }, lockedMsg:"Du brauchst zuerst die Kaskadenmedaille!" },
      { id:"route9",       label:"Route 9 Ost",    desc:"Rotes Felsgebirge → Lavendeldorf (Abkürzung!)", direction:"east",
        condition:{ minBadges:2 }, lockedMsg:"Du brauchst zuerst die Kaskadenmedaille!" },
    ]
  },
  {
    id:"cerulean_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Azuria", parentCity:"cerulean_city", showInMap:false,
    features:[
      { type:"npc_trade", id:"trade_cerulean",
        npcName:"Tauscherin Anna", npcSprite:"lass",
        give:60, get:54,
        text:"Ich würde liebend gerne ein Enton für mein Poliwag tauschen!",
        flagId:"trade_cerulean_done" }
    ]
  },
  {
    id:"cerulean_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Azuria", parentCity:"cerulean_city", showInMap:false,
    shopItems:[
      { id:"pokeball",    name:"Pokéball",  cost:200, desc:"Fanghilfe" },
      { id:"superball",   name:"Superball", cost:600, desc:"Bessere Fangchance" },
      { id:"potion",      name:"Trank",     cost:300, desc:"+20 HP" },
      { id:"superpotion", name:"Supertrank",cost:700, desc:"+50 HP" },
      { id:"antidote",    name:"Gegengift", cost:100, desc:"Heilt Gift" },
    ]
  },
  {
    id:"cerulean_gym", type:"gym", name:"Azuria Arena",
    bgGround:"#2060c0", bgSky:"#80b0f0", bgMid:"#4080e0",
    stageCount:5, showInMap:false, wildPokemon:[],
    trainers:[
      { stage:2, name:"Schwimmerin Lena", party:[{dexId:60,lv:15},{dexId:60,lv:15}], reward:400 },
      { stage:4, name:"Schwimmer Niko",   party:[{dexId:54,lv:16},{dexId:72,lv:16}], reward:500 },
    ],
    gymLeader:{
      stage:5, name:"Misty", title:"Arenaleiterin",
      badge:"Kaskadenmedaille", badgeId:"cascade",
      party:[{dexId:120,lv:18},{dexId:121,lv:21}],
      reward:2100, winText:"Misty: Das war ein fairer Kampf! Nimm die Kaskadenmedaille!"
    },
    terminus:{ exits:[{ id:"cerulean_city" }] }
  },

  // ── Weg A: Route 5-6 → Zinnia City ──────────────────────────
  {
    id:"route5_6", type:"route", name:"Route 5–6 + Untergrundtunnel",
    bgGround:"#78b060", bgSky:"#87ceeb", bgMid:"#98c880",
    stageCount:12, showInMap:true,
    wildPokemon:[
      { dexId:52, minLv:13, maxLv:17, weight:25 },
      { dexId:56, minLv:13, maxLv:17, weight:20 },
      { dexId:16, minLv:13, maxLv:16, weight:15 },
      { dexId:17, minLv:15, maxLv:17, weight:10 },
      { dexId:43, minLv:13, maxLv:16, weight:12 },
      { dexId:69, minLv:13, maxLv:16, weight:10 },
      { dexId:63, minLv:14, maxLv:17, weight:5  },
      { dexId:39, minLv:13, maxLv:16, weight:3  },
    ],
    trainers:[
      { stage:3,  name:"Jungtrainerin Sarah", party:[{dexId:52,lv:15}], reward:450 },
      { stage:7,  name:"Jugendlicher Jan",    party:[{dexId:56,lv:16},{dexId:16,lv:16}], reward:550 },
      { stage:10, name:"Jungtrainer Leo",     party:[{dexId:52,lv:17},{dexId:43,lv:17}], reward:650 },
    ],
    waypoints:[
      { atStage:6, type:"rival_fight", flagId:"rival_route5_beaten",
        rivalName:"Gary", rivalLevel:16,
        party:[{dexId:17,lv:18},{dexId:25,lv:15}],
        reward:500,
        dialogBefore:"Gary: Ich wusste, dass du hierherkommen würdest! Zeig mir, was du kannst!" }
    ],
    terminus:{ exits:[{ id:"vermilion_city" }] }
  },

  // ── Weg B: Route 9 → Rock Tunnel → Lavendeldorf ──────────────
  {
    id:"route9", type:"route", name:"Route 9",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:10, showInMap:true,
    wildPokemon:[
      { dexId:19, minLv:13, maxLv:17, weight:30 },
      { dexId:21, minLv:14, maxLv:18, weight:25 },
      { dexId:23, minLv:12, maxLv:16, weight:20 },
      { dexId:46, minLv:13, maxLv:17, weight:15 },
      { dexId:74, minLv:15, maxLv:18, weight:10 },
    ],
    trainers:[
      { stage:4, name:"Supernerd Egon",  party:[{dexId:100,lv:15}], reward:550 },
      { stage:8, name:"Wanderer Klaus",  party:[{dexId:23,lv:17},{dexId:19,lv:17}], reward:650 },
    ],
    terminus:{ exits:[{ id:"rock_tunnel" }] }
  },
  {
    id:"rock_tunnel", type:"dungeon", name:"Rotes Felsgebirge",
    bgGround:"#3a3050", bgSky:"#1a1030", bgMid:"#2a2040",
    stageCount:15, showInMap:true,
    wildPokemon:[
      { dexId:41, minLv:15, maxLv:20, weight:40 },
      { dexId:74, minLv:14, maxLv:19, weight:25 },
      { dexId:95, minLv:15, maxLv:20, weight:20 },
      { dexId:66, minLv:15, maxLv:18, weight:10 },
      { dexId:104,minLv:15, maxLv:18, weight:5  },
    ],
    trainers:[
      { stage:4,  name:"Bergsteigerin Petra", party:[{dexId:74,lv:16},{dexId:95,lv:16}], reward:600 },
      { stage:9,  name:"Bergsteiger Otto",    party:[{dexId:41,lv:17},{dexId:41,lv:17},{dexId:74,lv:17}], reward:700 },
      { stage:13, name:"Bergsteigerin Hilde", party:[{dexId:95,lv:18},{dexId:66,lv:18}], reward:800 },
    ],
    terminus:{ exits:[{ id:"route10_south" }] }
  },
  {
    id:"route10_south", type:"route", name:"Route 10 Süd",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:8, showInMap:true,
    wildPokemon:[
      { dexId:100,minLv:16, maxLv:20, weight:40 },
      { dexId:81, minLv:15, maxLv:19, weight:35 },
      { dexId:21, minLv:15, maxLv:18, weight:25 },
    ],
    trainers:[
      { stage:4, name:"Jungtrainer Rudi", party:[{dexId:81,lv:18}], reward:680 },
    ],
    terminus:{ exits:[{ id:"lavender_town" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ZINNIA CITY (Vermilion City)                            ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"vermilion_city", type:"city", name:"Zinnia City",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0", showInMap:true,
    buildings:["vermilion_pokecenter","vermilion_pokemart","ss_anne"],
    exits:[
      // ── ZERSCHNEIDER-GATE (Gen-1-getreu) ──────────────────────
      // Busch vor der Arena → braucht VM01 Zerschneider + Kaskadenmedaille
      { id:"vermilion_gym", label:"Zinnia Arena", desc:"Mysto – Donnerorden", type:"gym",
        condition:{ hasItem:"hm_cut", hasBadge:"cascade" },
        lockedMsg:"Ein Busch versperrt den Eingang! Hol VM01 Zerschneider von der S.S. Anne und benutze ihn (braucht Kaskadenmedaille)." },
      { id:"route11_12", label:"Route 11 Ost", desc:"Richtung Lavendeldorf", direction:"east",
        condition:{ minBadges:3 }, lockedMsg:"Du solltest zuerst die Arena besiegen!" }
    ]
  },
  {
    id:"vermilion_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Zinnia", parentCity:"vermilion_city", showInMap:false,
    features:[
      { type:"npc_trade", id:"trade_vermilion",
        npcName:"Tauscher Max", npcSprite:"youngster",
        give:21, get:83,
        text:"Mein Wunderbra ist einsam ohne Freunde! Gibst du mir dein Habitak dafür?",
        flagId:"trade_vermilion_done" }
    ]
  },
  {
    id:"vermilion_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Zinnia", parentCity:"vermilion_city", showInMap:false,
    shopItems:[
      { id:"superball",   name:"Superball",       cost:600, desc:"Bessere Fangchance" },
      { id:"superpotion", name:"Supertrank",      cost:700, desc:"+50 HP" },
      { id:"awakening",   name:"Weckflöte",       cost:250, desc:"Heilt Schlaf" },
      { id:"paralysheal", name:"Paraheilmittel",  cost:200, desc:"Heilt Lähmung" },
    ]
  },
  // ── S.S. Anne — gibt VM01 Zerschneider ────────────────────────
  {
    id:"ss_anne", type:"building", buildingType:"special",
    name:"S.S. Anne", parentCity:"vermilion_city", showInMap:false,
    features:[
      { type:"rival_fight_ship", id:"ss_anne_rival",
        label:"Gary herausfordern (S.S. Anne)",
        flagId:"rival_ssanne_beaten",
        desc:"Gary wartet im Kapitänszimmer!",
        rivalLevel:20,
        party:[{dexId:17,lv:22},{dexId:28,lv:20},{dexId:25,lv:18}],
        reward:800 },
      // ── GIVE_HM: Zerschneider vom Kapitän ─────────────────
      { type:"give_hm",
        id:"ssanne_give_cut",
        label:"VM01 Zerschneider erhalten",
        desc:"Der Kapitän bedankt sich und lehrt dir Cut!",
        item:"hm_cut",
        flagId:"got_hm_cut",
        condition:{ eventFlag:"rival_ssanne_beaten" },
        lockedMsg:"Besiege zuerst Gary, um den Kapitän zu befreien!" }
    ]
  },

  {
    id:"vermilion_gym", type:"gym", name:"Zinnia Arena",
    bgGround:"#808050", bgSky:"#e0e000", bgMid:"#c0c060",
    stageCount:5, showInMap:false, wildPokemon:[],
    trainers:[
      { stage:2, name:"Soldat Klaus",  party:[{dexId:81,lv:21}], reward:600 },
      { stage:4, name:"Soldat Werner", party:[{dexId:25,lv:22},{dexId:100,lv:22}], reward:750 },
    ],
    gymLeader:{
      stage:5, name:"Mysto", title:"Arenaleiter",
      badge:"Donnermedaille", badgeId:"thunder",
      party:[{dexId:100,lv:21},{dexId:100,lv:21},{dexId:26,lv:24}],
      reward:2400, winText:"Mysto: Ausgezeichnet! Hier, die Donnermedaille!"
    },
    terminus:{ exits:[{ id:"vermilion_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 11-12 → LAVENDELDORF                              ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route11_12", type:"route", name:"Route 11–12",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:14, showInMap:true,
    wildPokemon:[
      { dexId:21, minLv:13, maxLv:20, weight:30 },
      { dexId:96, minLv:11, maxLv:17, weight:20 },
      { dexId:23, minLv:12, maxLv:20, weight:20 },
      { dexId:27, minLv:13, maxLv:20, weight:15 },
      { dexId:19, minLv:13, maxLv:18, weight:10 },
      { dexId:20, minLv:16, maxLv:22, weight:5  },
    ],
    trainers:[
      { stage:4,  name:"Supernerd Egon",   party:[{dexId:96,lv:18}], reward:600 },
      { stage:8,  name:"Jungtrainer Eric", party:[{dexId:21,lv:20},{dexId:23,lv:19}], reward:750 },
      { stage:12, name:"Jungtrainer Lars", party:[{dexId:21,lv:21},{dexId:96,lv:21}], reward:900 },
    ],
    terminus:{ exits:[{ id:"lavender_town" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  LAVENDELDORF (Lavender Town) — KNOTENPUNKT              ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"lavender_town", type:"city", name:"Lavendeldorf",
    bgGround:"#6a5880", bgSky:"#9080a0", bgMid:"#7a6890", showInMap:true,
    buildings:["lavender_pokecenter","lavender_pokemart"],
    exits:[
      { id:"pokemon_tower", label:"Pokémon-Turm",   desc:"Verlorene Pokémon… und Team Rocket!", direction:"building" },
      { id:"route7_8",      label:"Route 7-8 West", desc:"Unterirdischer Tunnel → Prismania City", direction:"west" },
    ]
  },
  {
    id:"lavender_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Lavendeldorf", parentCity:"lavender_town", showInMap:false,
    features:[
      { type:"npc_trade", id:"trade_lavender",
        npcName:"Geisterin Mona", npcSprite:"channeler",
        give:92, get:93,
        text:"Tausch mir dein Gastly gegen meinen Haunter… wenn du dich traust!",
        flagId:"trade_lavender_done" }
    ]
  },
  {
    id:"lavender_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Lavendeldorf", parentCity:"lavender_town", showInMap:false,
    shopItems:[
      { id:"superball",   name:"Superball",  cost:600,  desc:"Bessere Fangchance" },
      { id:"superpotion", name:"Supertrank", cost:700,  desc:"+50 HP" },
      { id:"revive",      name:"Beleber",    cost:1500, desc:"Belebt K.O. Pokémon" },
    ]
  },
  {
    id:"pokemon_tower", type:"dungeon", name:"Pokémon-Turm",
    bgGround:"#4a3850", bgSky:"#2a1830", bgMid:"#3a2840",
    stageCount:18, showInMap:true,
    wildPokemon:[
      { dexId:92,  minLv:15, maxLv:25, weight:45 },
      { dexId:93,  minLv:18, maxLv:27, weight:30 },
      { dexId:104, minLv:15, maxLv:25, weight:25 },
    ],
    trainers:[
      { stage:3,  name:"Channelerin Hilda",  party:[{dexId:92,lv:22}], reward:800 },
      { stage:7,  name:"Channelerin Maja",   party:[{dexId:92,lv:23},{dexId:92,lv:23}], reward:950 },
      { stage:11, name:"Channelerin Petra",  party:[{dexId:93,lv:24}], reward:1000 },
      { stage:15, name:"Team Rocket",        party:[{dexId:93,lv:25},{dexId:104,lv:25}], reward:1100 },
    ],
    waypoints:[
      { atStage:18, type:"rival_fight", flagId:"rival_tower_beaten",
        rivalName:"Gary", rivalLevel:25,
        party:[{dexId:18,lv:26},{dexId:65,lv:24},{dexId:28,lv:24},{dexId:22,lv:24}],
        reward:1500,
        dialogBefore:"Gary: Was hast DU hier verloren?! Das ist mein Revier!" }
    ],
    terminus:{ exits:[{ id:"lavender_town" }] }
  },
  {
    id:"route7_8", type:"route", name:"Route 7–8 + Untergrundtunnel",
    bgGround:"#60a850", bgSky:"#87ceeb", bgMid:"#80b860",
    stageCount:12, showInMap:true,
    wildPokemon:[
      { dexId:17, minLv:18, maxLv:24, weight:25 },
      { dexId:52, minLv:18, maxLv:24, weight:20 },
      { dexId:53, minLv:22, maxLv:26, weight:8  },
      { dexId:43, minLv:18, maxLv:23, weight:15 },
      { dexId:44, minLv:21, maxLv:25, weight:10 },
      { dexId:58, minLv:18, maxLv:24, weight:12 },
      { dexId:37, minLv:18, maxLv:24, weight:10 },
    ],
    trainers:[
      { stage:4, name:"Pokémon-Fan Julia", party:[{dexId:52,lv:22}], reward:900 },
      { stage:8, name:"Kampfmädchen Emma", party:[{dexId:17,lv:24},{dexId:58,lv:22}], reward:1100 },
    ],
    terminus:{ exits:[{ id:"celadon_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  PRISMANIA CITY (Celadon City)                           ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"celadon_city", type:"city", name:"Prismania City",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0", showInMap:true,
    buildings:["celadon_pokecenter","celadon_dept_store"],
    exits:[
      { id:"celadon_gym",  label:"Prismania Arena",   desc:"Erika – Regenbodenorden", type:"gym" },
      { id:"route16_18",   label:"Bicycle Road West", desc:"Fahrradstraße → Pokérosia City", direction:"west",
        condition:{ minBadges:4 }, lockedMsg:"Du solltest zuerst Erika besiegen!" }
    ]
  },
  {
    id:"celadon_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Prismania", parentCity:"celadon_city", showInMap:false,
    features:[
      { type:"npc_trade", id:"trade_celadon",
        npcName:"Händler Lio", npcSprite:"youngster",
        give:52, get:53,
        text:"Mein Snobilikat ist weg! Gibst du mir dein Mauzi?",
        flagId:"trade_celadon_done" }
    ]
  },
  {
    id:"celadon_dept_store", type:"building", buildingType:"pokemart",
    name:"Prismaniakaufhaus", parentCity:"celadon_city", showInMap:false,
    features:[
      { type:"lore", id:"dept_store_info", label:"Stockwerk-Übersicht",
        desc:"Das größte Kaufhaus in Kanto!",
        text:"EG: Rezeption | 1.OG: Items | 2.OG: Kampfitems | 3.OG: TMs | Dachgarten: Erfrischungen" }
    ],
    shopItems:[
      { id:"superball",   name:"Superball",  cost:600,  desc:"Bessere Fangchance" },
      { id:"hyperball",   name:"Hyperball",  cost:1200, desc:"Beste Fangchance" },
      { id:"hyperpotion", name:"Hypertrank", cost:1200, desc:"+200 HP" },
      { id:"revive",      name:"Beleber",    cost:1500, desc:"Belebt K.O. Pokémon" },
      { id:"fullheal",    name:"Vollheiler", cost:600,  desc:"Heilt alle Status" },
    ]
  },
  {
    id:"celadon_gym", type:"gym", name:"Prismania Arena",
    bgGround:"#408040", bgSky:"#80e080", bgMid:"#60c060",
    stageCount:5, showInMap:false, wildPokemon:[],
    trainers:[
      { stage:2, name:"Jugendliche Petra", party:[{dexId:43,lv:28},{dexId:69,lv:28}], reward:1000 },
      { stage:4, name:"Schönheit Sandra",  party:[{dexId:70,lv:30},{dexId:44,lv:30}], reward:1300 },
    ],
    gymLeader:{
      stage:5, name:"Erika", title:"Arenaleiterin",
      badge:"Regenbodenmedaille", badgeId:"rainbow",
      party:[{dexId:70,lv:29},{dexId:114,lv:24},{dexId:71,lv:29}],
      reward:2900, winText:"Erika: Du kämpfst mit wunderbarer Entschlossenheit! Die Regenbodenmedaille ist dein!"
    },
    terminus:{ exits:[{ id:"celadon_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BICYCLE ROAD (Route 16-18) → POKÉROSIA                 ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route16_18", type:"route", name:"Fahrradroute 16–18",
    bgGround:"#78b060", bgSky:"#87ceeb", bgMid:"#98c080",
    stageCount:15, showInMap:true,
    wildPokemon:[
      { dexId:21, minLv:20, maxLv:26, weight:30 },
      { dexId:19, minLv:20, maxLv:25, weight:25 },
      { dexId:22, minLv:22, maxLv:27, weight:20 },
      { dexId:20, minLv:24, maxLv:28, weight:15 },
      { dexId:84, minLv:22, maxLv:27, weight:10 },
    ],
    trainers:[
      { stage:5,  name:"Biker Ralf",    party:[{dexId:22,lv:25},{dexId:22,lv:25}], reward:1200 },
      { stage:10, name:"Biker Wolfgang",party:[{dexId:22,lv:27},{dexId:84,lv:27}], reward:1500 },
      { stage:13, name:"Biker Thomas",  party:[{dexId:21,lv:28},{dexId:21,lv:28},{dexId:22,lv:28}], reward:1800 },
    ],
    terminus:{ exits:[{ id:"fuchsia_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  POKÉROSIA CITY (Fuchsia City) — KNOTENPUNKT             ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"fuchsia_city", type:"city", name:"Pokérosia City",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0", showInMap:true,
    buildings:["fuchsia_pokecenter","fuchsia_pokemart","safari_zone"],
    exits:[
      { id:"fuchsia_gym",  label:"Pokérosia Arena", desc:"Koga – Seelenorden", type:"gym" },
      // ── SURFER-GATE (Gen-1-getreu): braucht VM03 + Seelenmedaille ──
      { id:"route19_20",   label:"Route 19-20 Süd", desc:"Surfen → Eiskap-Inseln → Zinnoberinsel", direction:"south",
        condition:{ hasItem:"hm_surf", hasBadge:"soul" },
        lockedMsg:"Du brauchst VM03 Surfer (aus der Safari Zone) und die Seelenmedaille von Koga!" },
      { id:"route15",      label:"Route 15 Ost",    desc:"Richtung Saffronia City", direction:"east",
        condition:{ minBadges:5 }, lockedMsg:"Du brauchst die Seelenmedaille!" }
    ]
  },
  {
    id:"fuchsia_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Pokérosia", parentCity:"fuchsia_city", showInMap:false,
    features:[
      { type:"npc_trade", id:"trade_fuchsia",
        npcName:"Safarihändler", npcSprite:"gentleman",
        give:83, get:128,
        text:"Ich gebe dir einen Tauros für dein Wunderbra – Safari-Tausch!",
        flagId:"trade_fuchsia_done" }
    ]
  },
  {
    id:"fuchsia_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Pokérosia", parentCity:"fuchsia_city", showInMap:false,
    shopItems:[
      { id:"hyperball",   name:"Hyperball",  cost:1200, desc:"Beste Fangchance" },
      { id:"hyperpotion", name:"Hypertrank", cost:1200, desc:"+200 HP" },
      { id:"maxpotion",   name:"MaxTrank",   cost:2500, desc:"Volle HP" },
      { id:"fullheal",    name:"Vollheiler", cost:600,  desc:"Heilt alle Status" },
      { id:"revive",      name:"Beleber",    cost:1500, desc:"Belebt K.O. Pokémon" },
    ]
  },
  // ── Safari Zone — gibt VM03 Surfer ──────────────────────────
  {
    id:"safari_zone", type:"building", buildingType:"special",
    name:"Safari Zone", parentCity:"fuchsia_city", showInMap:false,
    features:[
      { type:"lore", id:"safari_intro", label:"Safari Zone betreten",
        desc:"Seltene Pokémon in freier Wildbahn.",
        text:"Der Wächter: 'Herzlich willkommen! Hier leben die seltensten Pokémon Kantos. Du brauchst spezielle Erlaubnis, um sie zu fangen.'" },
      // ── GIVE_HM: Surfer vom Safarizonen-Wächter ──────────────
      { type:"give_hm",
        id:"safari_give_surf",
        label:"VM03 Surfer erhalten",
        desc:"Der Wächter gibt dir Surfer als Dankeschön für deine Hilfe!",
        item:"hm_surf",
        flagId:"got_hm_surf",
        condition:{ hasBadge:"soul" },
        lockedMsg:"Du brauchst erst die Seelenmedaille von Koga, um Surfer zu erhalten!" }
    ]
  },
  {
    id:"fuchsia_gym", type:"gym", name:"Pokérosia Arena",
    bgGround:"#506050", bgSky:"#8090a0", bgMid:"#607060",
    stageCount:5, showInMap:false, wildPokemon:[],
    trainers:[
      { stage:2, name:"Ninja-Schüler Kai",  party:[{dexId:41,lv:34},{dexId:41,lv:34}], reward:1500 },
      { stage:4, name:"Ninja-Schüler Ryuu", party:[{dexId:42,lv:36},{dexId:109,lv:36}], reward:1900 },
    ],
    gymLeader:{
      stage:5, name:"Koga", title:"Arenaleiter",
      badge:"Seelenmedaille", badgeId:"soul",
      party:[{dexId:109,lv:37},{dexId:109,lv:37},{dexId:42,lv:36},{dexId:110,lv:39}],
      reward:3900, winText:"Koga: Ein würdiger Gegner! Hier ist die Seelenmedaille!"
    },
    terminus:{ exits:[{ id:"fuchsia_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 15 → SAFFRONIA CITY                              ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route15", type:"route", name:"Route 15",
    bgGround:"#78b060", bgSky:"#87ceeb", bgMid:"#98c080",
    stageCount:10, showInMap:true,
    wildPokemon:[
      { dexId:17, minLv:22, maxLv:28, weight:30 },
      { dexId:53, minLv:22, maxLv:28, weight:25 },
      { dexId:57, minLv:24, maxLv:30, weight:20 },
      { dexId:55, minLv:25, maxLv:30, weight:15 },
      { dexId:83, minLv:22, maxLv:28, weight:10 },
    ],
    trainers:[
      { stage:4, name:"Kampfmädchen Tina",  party:[{dexId:53,lv:26},{dexId:55,lv:26}], reward:1500 },
      { stage:8, name:"Pokémon-Fan Werner", party:[{dexId:17,lv:28},{dexId:57,lv:28}], reward:1800 },
    ],
    terminus:{ exits:[{ id:"saffron_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SAFFRONIA CITY (Saffron City)                           ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"saffron_city", type:"city", name:"Saffronia City",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0", showInMap:true,
    buildings:["saffron_pokecenter","saffron_pokemart","silph_co"],
    exits:[
      { id:"saffron_gym",  label:"Saffronia Arena", desc:"Sabrina – Sumpforden", type:"gym" },
      { id:"route19_20",   label:"Route 17-18 Süd + Meer", desc:"Richtung Zinnoberinsel", direction:"south",
        condition:{ hasItem:"hm_surf", hasBadge:"soul" },
        lockedMsg:"Du brauchst VM03 Surfer und die Seelenmedaille!" }
    ]
  },
  {
    id:"saffron_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Saffronia", parentCity:"saffron_city", showInMap:false
  },
  {
    id:"saffron_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Saffronia", parentCity:"saffron_city", showInMap:false,
    shopItems:[
      { id:"hyperball",   name:"Hyperball", cost:1200, desc:"Beste Fangchance" },
      { id:"maxpotion",   name:"MaxTrank",  cost:2500, desc:"Volle HP" },
      { id:"fullrestore", name:"Komplett",  cost:3000, desc:"HP + Status" },
      { id:"revive",      name:"Beleber",   cost:1500, desc:"Belebt K.O. Pokémon" },
    ]
  },
  {
    id:"silph_co", type:"building", buildingType:"special",
    name:"Silph AG", parentCity:"saffron_city", showInMap:false,
    features:[
      { type:"rival_fight_ship", id:"silph_rival",
        label:"Gary in der Silph AG bekämpfen",
        flagId:"rival_silph_beaten",
        desc:"Gary hat sich in der Silph AG eingenistet.",
        rivalLevel:38,
        party:[{dexId:18,lv:40},{dexId:65,lv:38},{dexId:28,lv:38},{dexId:22,lv:38},{dexId:9,lv:42}],
        reward:2500 },
      { type:"lore", id:"silph_ceo", label:"Mit Silph-Präsident sprechen",
        desc:"Er bedankt sich und gibt dir ein besonderes Geschenk.",
        flagId:"silph_president_met",
        text:"Präsident: 'Du hast uns gerettet! Als Dankeschön möchte ich dir den Meisterball schenken — er fängt jeden Pokémon ohne zu scheitern!' +1 Meisterball erhalten!" }
    ]
  },
  {
    id:"saffron_gym", type:"gym", name:"Saffronia Arena",
    bgGround:"#505080", bgSky:"#8080c0", bgMid:"#6060a0",
    stageCount:5, showInMap:false, wildPokemon:[],
    trainers:[
      { stage:2, name:"Psycho-Trainer Otto",  party:[{dexId:63,lv:35},{dexId:64,lv:35}], reward:2000 },
      { stage:4, name:"Psycho-Trainer Hanna", party:[{dexId:96,lv:38},{dexId:97,lv:38}], reward:2800 },
    ],
    gymLeader:{
      stage:5, name:"Sabrina", title:"Arenaleiterin",
      badge:"Sumpfmedaille", badgeId:"marsh",
      party:[{dexId:63,lv:38},{dexId:64,lv:37},{dexId:65,lv:43},{dexId:96,lv:43}],
      reward:4300, winText:"Sabrina: Ich... habe verloren. Hier ist die Sumpfmedaille."
    },
    terminus:{ exits:[{ id:"saffron_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 19-20 + EISKAP → ZINNOBERINSEL                   ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route19_20", type:"sea", name:"Route 19–20 + Eiskap-Inseln",
    bgGround:"#2050c0", bgSky:"#80b0e0", bgMid:"#3060d0",
    stageCount:15, showInMap:true,
    wildPokemon:[
      { dexId:72,  minLv:25, maxLv:32, weight:55 },
      { dexId:73,  minLv:30, maxLv:38, weight:15 },
      { dexId:118, minLv:20, maxLv:30, weight:15 },
      { dexId:120, minLv:25, maxLv:33, weight:10 },
      { dexId:90,  minLv:25, maxLv:33, weight:5  },
    ],
    trainers:[
      { stage:5,  name:"Schwimmer Marco",  party:[{dexId:72,lv:28},{dexId:72,lv:28}], reward:1800 },
      { stage:10, name:"Schwimmerin Gina", party:[{dexId:73,lv:32},{dexId:120,lv:32}], reward:2200 },
      { stage:13, name:"Taucher Fritz",    party:[{dexId:73,lv:35},{dexId:118,lv:33}], reward:2800 },
    ],
    terminus:{ exits:[{ id:"cinnabar_island" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ZINNOBERINSEL (Cinnabar Island)                         ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"cinnabar_island", type:"city", name:"Zinnoberinsel",
    bgGround:"#808060", bgSky:"#f05020", bgMid:"#c06040", showInMap:true,
    buildings:["cinnabar_pokecenter","cinnabar_pokemart","cinnabar_lab"],
    exits:[
      { id:"cinnabar_gym",   label:"Zinnoberinsel Arena", desc:"Brand – Hitzeorden", type:"gym" },
      { id:"route21_return", label:"Route 21 Nord (Surf)", desc:"Richtung Alabastia → Vertania City", direction:"north",
        condition:{ hasItem:"hm_surf", minBadges:7 },
        lockedMsg:"Du brauchst VM03 Surfer und die Hitzemedaille!" }
    ]
  },
  {
    id:"cinnabar_pokecenter", type:"building", buildingType:"pokecenter",
    name:"Pokémon Center Zinnoberinsel", parentCity:"cinnabar_island", showInMap:false,
    features:[
      { type:"npc_trade", id:"trade_cinnabar",
        npcName:"Forscher Leo", npcSprite:"gentleman",
        give:109, get:58,
        text:"Ich tausche einen Fukano für dein Smogon – ein wissenschaftlicher Tausch!",
        flagId:"trade_cinnabar_done" }
    ]
  },
  {
    id:"cinnabar_pokemart", type:"building", buildingType:"pokemart",
    name:"Pokémart Zinnoberinsel", parentCity:"cinnabar_island", showInMap:false,
    shopItems:[
      { id:"hyperball",   name:"Hyperball", cost:1200, desc:"Beste Fangchance" },
      { id:"maxpotion",   name:"MaxTrank",  cost:2500, desc:"Volle HP" },
      { id:"fullrestore", name:"Komplett",  cost:3000, desc:"HP + Status" },
      { id:"revive",      name:"Beleber",   cost:1500, desc:"Belebt K.O. Pokémon" },
    ]
  },
  {
    id:"cinnabar_lab", type:"building", buildingType:"special",
    name:"Pokémon Labor Zinnoberinsel", parentCity:"cinnabar_island", showInMap:false,
    features:[
      { type:"fossil_revival", id:"fossil_revival",
        label:"Fossil wiederbeleben",
        desc:"Gib ein Fossil ab — erhalte ein urzeitliches Pokémon!",
        fossils:[
          { item:"old_amber",    itemName:"Altes Bernstein",  result:142, resultName:"Aerodactyl" },
          { item:"dome_fossil",  itemName:"Kuppelfossil",     result:140, resultName:"Kabuto" },
          { item:"helix_fossil", itemName:"Spiralenfossil",   result:138, resultName:"Omanyte" },
        ]
      },
      { type:"lore", id:"lab_doctor", label:"Mit Dr. Fuji sprechen",
        desc:"Er erzählt dir von seinen Forschungen.",
        text:"Dr. Fuji: 'Mit dieser Technologie kann ich aus fossiler DNS urzeitliche Pokémon wiederbeleben! Es ist ein wissenschaftliches Wunder… aber auch eine große Verantwortung.'" }
    ]
  },
  {
    id:"cinnabar_gym", type:"gym", name:"Zinnoberinsel Arena",
    bgGround:"#a04000", bgSky:"#ff6020", bgMid:"#c05010",
    stageCount:5, showInMap:false, wildPokemon:[],
    trainers:[
      { stage:2, name:"Brand-Fan Nico",  party:[{dexId:126,lv:40},{dexId:77,lv:40}], reward:2000 },
      { stage:4, name:"Brand-Fan Maria", party:[{dexId:78,lv:42},{dexId:126,lv:42}], reward:2500 },
    ],
    gymLeader:{
      stage:5, name:"Brand", title:"Arenaleiter",
      badge:"Hitzemedaille", badgeId:"volcano",
      party:[{dexId:58,lv:42},{dexId:77,lv:40},{dexId:78,lv:42},{dexId:59,lv:47}],
      reward:4700, winText:"Brand: Bravo! Du hast mich mit Feuer und Leidenschaft besiegt! Die Hitzemedaille ist dein!"
    },
    terminus:{ exits:[{ id:"cinnabar_island" }] }
  },

  // Route 21 Rückreise
  {
    id:"route21_return", type:"sea", name:"Route 21 – Rückkehr",
    bgGround:"#2050c0", bgSky:"#80b0e0", bgMid:"#3060d0",
    stageCount:10, showInMap:true,
    wildPokemon:[
      { dexId:72,  minLv:30, maxLv:40, weight:50 },
      { dexId:73,  minLv:32, maxLv:42, weight:25 },
      { dexId:131, minLv:30, maxLv:38, weight:15 },
      { dexId:130, minLv:35, maxLv:45, weight:10 },
    ],
    trainers:[
      { stage:5, name:"Surfer Kai", party:[{dexId:73,lv:38},{dexId:131,lv:36}], reward:3000 },
    ],
    terminus:{ exits:[{ id:"viridian_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 22 (optionaler Bereich, Badge-Gate)               ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route22", type:"route", name:"Route 22",
    bgGround:"#70a050", bgSky:"#87ceeb", bgMid:"#80b060",
    stageCount:10, showInMap:true,
    wildPokemon:[
      { dexId:29, minLv:3,  maxLv:8,  weight:25 },
      { dexId:32, minLv:3,  maxLv:8,  weight:25 },
      { dexId:56, minLv:5,  maxLv:10, weight:20 },
      { dexId:21, minLv:4,  maxLv:8,  weight:15 },
      { dexId:19, minLv:3,  maxLv:8,  weight:10 },
      { dexId:25, minLv:3,  maxLv:8,  weight:5  },
    ],
    trainers:[
      { stage:3, name:"Jungtrainer Alex", party:[{dexId:29,lv:6},{dexId:32,lv:6}], reward:120 },
    ],
    waypoints:[
      { atStage:5, type:"rival_fight", flagId:"rival_route22_beaten",
        rivalName:"Gary", rivalLevel:9,
        party:[{dexId:16,lv:9}],
        reward:180,
        dialogBefore:"Gary: Oooh! Du hast also meine Spur verfolgt! Ich trainiere hier für die Liga!" }
    ],
    terminus:{
      exits:[{
        id:"route23",
        condition:{ minBadges:8 },
        lockedMsg:"Wächter: Dieser Weg führt zur Siegerstraße. Du brauchst alle 8 Kanto-Orden!",
        fallback:"viridian_city",
        fallbackMsg:"Der Wächter lässt dich nicht passieren. Du kehrst nach Vertania City zurück."
      }]
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  VERTANIA ARENA (Giovanni, 7 Orden)                      ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"viridian_gym", type:"gym", name:"Vertania Arena",
    bgGround:"#808060", bgSky:"#a0a080", bgMid:"#909070",
    stageCount:5, showInMap:false, wildPokemon:[],
    minBadges:7,
    trainers:[
      { stage:2, name:"Trainer Clyde", party:[{dexId:111,lv:44},{dexId:74,lv:44}], reward:2500 },
      { stage:4, name:"Trainer Bruce", party:[{dexId:28,lv:46},{dexId:76,lv:46}], reward:3000 },
    ],
    gymLeader:{
      stage:5, name:"Giovanni", title:"Arenaleiter & Boss",
      badge:"Erdmedaille", badgeId:"earth",
      party:[{dexId:111,lv:45},{dexId:28,lv:55},{dexId:76,lv:50},{dexId:31,lv:53}],
      reward:5500, winText:"Giovanni: Ich… muss mich ergeben. Du hast alle 8 Orden verdient!"
    },
    terminus:{ exits:[{ id:"viridian_city" }] }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  ROUTE 23 → SIEGERSTRASSE → LIGA                        ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id:"route23", type:"route", name:"Route 23",
    bgGround:"#70a050", bgSky:"#87ceeb", bgMid:"#80b060",
    stageCount:8, showInMap:true,
    wildPokemon:[
      { dexId:22, minLv:35, maxLv:45, weight:30 },
      { dexId:30, minLv:35, maxLv:40, weight:20 },
      { dexId:33, minLv:35, maxLv:40, weight:20 },
      { dexId:27, minLv:30, maxLv:40, weight:15 },
      { dexId:111,minLv:35, maxLv:45, weight:10 },
      { dexId:112,minLv:40, maxLv:50, weight:5  },
    ],
    trainers:[
      { stage:3, name:"Pokémon-Fan Otto",  party:[{dexId:30,lv:42},{dexId:95,lv:42}], reward:3500 },
      { stage:6, name:"Wanderer Klaus",    party:[{dexId:28,lv:45},{dexId:57,lv:43}], reward:4000 },
    ],
    terminus:{ exits:[{ id:"victory_road" }] }
  },
  {
    id:"victory_road", type:"dungeon", name:"Siegerstraße",
    bgGround:"#3a3050", bgSky:"#1a1030", bgMid:"#2a2040",
    stageCount:20, showInMap:true,
    wildPokemon:[
      { dexId:74,  minLv:42, maxLv:58, weight:22 },
      { dexId:75,  minLv:42, maxLv:58, weight:18 },
      { dexId:41,  minLv:42, maxLv:55, weight:15 },
      { dexId:42,  minLv:45, maxLv:58, weight:12 },
      { dexId:95,  minLv:42, maxLv:58, weight:12 },
      { dexId:105, minLv:40, maxLv:55, weight:12 },
      { dexId:67,  minLv:40, maxLv:55, weight:9  },
    ],
    trainers:[
      { stage:4,  name:"Trainer Max",    party:[{dexId:75,lv:48},{dexId:105,lv:48}], reward:3500 },
      { stage:9,  name:"Trainer Peter",  party:[{dexId:95,lv:50},{dexId:112,lv:50}], reward:4500 },
      { stage:14, name:"Trainer Stefan", party:[{dexId:75,lv:52},{dexId:112,lv:52},{dexId:42,lv:52}], reward:5500 },
    ],
    waypoints:[
      { atStage:18, type:"rival_fight", flagId:"rival_victory_road_beaten",
        rivalName:"Gary", rivalLevel:55,
        party:[{dexId:18,lv:56},{dexId:22,lv:54},{dexId:28,lv:54},{dexId:65,lv:54},{dexId:55,lv:54},{dexId:9,lv:58}],
        reward:8000,
        dialogBefore:"Gary: Da bist du ja! Ich warte schon auf dich! Keiner wird mich aufhalten — am wenigsten du!" }
    ],
    terminus:{ exits:[{ id:"elite_four" }] }
  },
  {
    id:"elite_four", type:"gym", name:"Pokémon-Liga",
    bgGround:"#2a2040", bgSky:"#0a0820", bgMid:"#1a1030",
    stageCount:5, showInMap:true, wildPokemon:[],
    trainers:[
      { stage:1, name:"Agathe (Elite Vier)",    isBoss:true, party:[{dexId:131,lv:54},{dexId:124,lv:56},{dexId:87,lv:54},{dexId:91,lv:56},{dexId:124,lv:58}], reward:5800 },
      { stage:2, name:"Bruno (Elite Vier)",     isBoss:true, party:[{dexId:95,lv:53},{dexId:106,lv:55},{dexId:107,lv:55},{dexId:95,lv:53},{dexId:68,lv:58}], reward:5800 },
      { stage:3, name:"Agathe II (Elite Vier)", isBoss:true, party:[{dexId:92,lv:54},{dexId:93,lv:56},{dexId:94,lv:58},{dexId:93,lv:56},{dexId:94,lv:60}], reward:6000 },
      { stage:4, name:"Siegfried (Elite Vier)", isBoss:true, party:[{dexId:147,lv:56},{dexId:148,lv:58},{dexId:130,lv:58},{dexId:148,lv:58},{dexId:149,lv:62}], reward:6200 },
    ],
    gymLeader:{
      stage:5, name:"Blau", title:"Champion",
      badge:"Champion", badgeId:"champion",
      party:[{dexId:18,lv:63},{dexId:55,lv:61},{dexId:28,lv:59},{dexId:65,lv:63},{dexId:112,lv:61},{dexId:6,lv:65}],
      reward:15000, winText:"🏆 CHAMPION! Du hast alle Elite Vier und Champion Blau besiegt — DU bist der neue Kanto-Champion!"
    },
    terminus:{ exits:[{ id:"alabastia" }] }
  }

];

function getZone(id) {
  return WORLD.find(function(z) { return z.id === id; }) || null;
}
function getMainZones() {
  return WORLD.filter(function(z) { return z.type !== "building"; });
}
var START_ZONE = "alabastia";
var START_STAGE = 1;
