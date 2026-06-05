// ═══════════════════════════════════════════════════════════════
//  world.js — Kanto Welt-Struktur
//  Encounter-Mix aus Rot + Blau + Gelb Edition
// ═══════════════════════════════════════════════════════════════

var WORLD = [
  // ══ 0. ALABASTIA ══════════════════════════════════════════
  {
    id:"alabastia", name:"Alabastia", type:"city",
    bgGround:"#90b860", bgSky:"#aadaff", bgMid:"#b0c880",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal"],
    cityRival:{ name:"Gary", reward:100, sprite:"rival" },
    next:"route1"
  },
  // ══ 1. ROUTE 1 ════════════════════════════════════════════
  {
    id:"route1", name:"Route 1", type:"route",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:10,
    wildPokemon:[
      { dexId:16, minLv:2, maxLv:4, weight:55 },
      { dexId:19, minLv:2, maxLv:4, weight:45 },
    ],
    trainers:[
      { stage:5, name:"Jungtrainer Timm", party:[{dexId:16,lv:3},{dexId:19,lv:3}], reward:60 },
    ],
    next:"viridian_city"
  },
  // ══ 2. VERTANIA CITY ══════════════════════════════════════
  {
    id:"viridian_city", name:"Vertania City", type:"city",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"pokeball", name:"Pokéball", cost:200, desc:"Normale Fanghilfe" },
      { id:"potion",   name:"Trank",    cost:300, desc:"+20 HP" },
      { id:"antidote", name:"Gegengift",cost:100, desc:"Heilt Gift" },
    ],
    next:"route22_west"
  },
  // ══ 3. ROUTE 22 (WEST) ════════════════════════════════════
  {
    id:"route22_west", name:"Route 22 (West)", type:"route",
    bgGround:"#78a848", bgSky:"#87ceeb", bgMid:"#98b868",
    stageCount:5,
    wildPokemon:[
      { dexId:29, minLv:2, maxLv:5, weight:35 },
      { dexId:32, minLv:2, maxLv:5, weight:35 },
      { dexId:56, minLv:2, maxLv:4, weight:20 },
      { dexId:21, minLv:3, maxLv:5, weight:10 },
    ],
    trainers:[],
    next:"route2"
  },
  // ══ 4. ROUTE 2 ════════════════════════════════════════════
  {
    id:"route2", name:"Route 2", type:"route",
    bgGround:"#60a040", bgSky:"#87ceeb", bgMid:"#80b860",
    stageCount:10,
    wildPokemon:[
      { dexId:16, minLv:3, maxLv:5, weight:40 },
      { dexId:19, minLv:3, maxLv:5, weight:35 },
      { dexId:10, minLv:3, maxLv:4, weight:15 },
      { dexId:13, minLv:3, maxLv:4, weight:10 },
    ],
    trainers:[
      { stage:4, name:"Jungtrainerin Lisa", party:[{dexId:19,lv:4}], reward:80 },
      { stage:8, name:"Wanderer Karl",      party:[{dexId:16,lv:5},{dexId:19,lv:4}], reward:100 },
    ],
    next:"viridian_forest"
  },
  // ══ 5. VERTANIA-WALD ══════════════════════════════════════
  {
    id:"viridian_forest", name:"Vertania-Wald", type:"dungeon",
    bgGround:"#2a6a2a", bgSky:"#1a4a1a", bgMid:"#3a8a3a",
    stageCount:15,
    wildPokemon:[
      { dexId:10, minLv:3, maxLv:7, weight:25 },
      { dexId:13, minLv:3, maxLv:7, weight:25 },
      { dexId:11, minLv:4, maxLv:7, weight:15 },
      { dexId:14, minLv:4, maxLv:7, weight:15 },
      { dexId:16, minLv:3, maxLv:5, weight:15 },
      { dexId:25, minLv:3, maxLv:6, weight:5  },
    ],
    trainers:[
      { stage:3,  name:"Jungtrainer Ben",   party:[{dexId:10,lv:4}], reward:80 },
      { stage:8,  name:"Jungtrainer Felix", party:[{dexId:13,lv:5},{dexId:10,lv:5}], reward:120 },
      { stage:12, name:"Jungtrainer Max",   party:[{dexId:14,lv:6},{dexId:11,lv:6}], reward:150 },
    ],
    next:"pewter_city"
  },
  // ══ 6. MARMORIA CITY ══════════════════════════════════════
  {
    id:"pewter_city", name:"Marmoria City", type:"city",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"pokeball",  name:"Pokéball",  cost:200, desc:"Fanghilfe" },
      { id:"potion",    name:"Trank",     cost:300, desc:"+20 HP" },
      { id:"antidote",  name:"Gegengift", cost:100, desc:"Heilt Gift" },
      { id:"escape",    name:"Fluchtweg", cost:550, desc:"Flieht aus Höhlen" },
    ],
    next:"pewter_gym"
  },
  // ══ 7. MARMORIA ARENA ═════════════════════════════════════
  {
    id:"pewter_gym", name:"Marmoria Arena", type:"gym",
    bgGround:"#808080", bgSky:"#a09080", bgMid:"#909090",
    stageCount:5, wildPokemon:[],
    trainers:[
      { stage:2, name:"Arenakämpfer Rex", party:[{dexId:74,lv:10}], reward:200 },
      { stage:4, name:"Arenakämpfer Dan", party:[{dexId:74,lv:10},{dexId:74,lv:11}], reward:300 },
    ],
    gymLeader:{
      stage:5, name:"Rocco", title:"Arenaleiter",
      badge:"Steinmedaille", badgeId:"stone",
      party:[{dexId:74,lv:12},{dexId:95,lv:14}],
      reward:1400, winText:"Du hast die Steinmedaille erhalten!"
    },
    next:"route3"
  },
  // ══ 8. ROUTE 3 ════════════════════════════════════════════
  {
    id:"route3", name:"Route 3", type:"route",
    bgGround:"#70b060", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:12,
    wildPokemon:[
      { dexId:21, minLv:6,  maxLv:10, weight:35 },
      { dexId:29, minLv:6,  maxLv:9,  weight:20 },
      { dexId:32, minLv:6,  maxLv:9,  weight:15 },
      { dexId:39, minLv:6,  maxLv:9,  weight:15 },
      { dexId:27, minLv:6,  maxLv:9,  weight:8  },
      { dexId:52, minLv:7,  maxLv:10, weight:4  },
      { dexId:56, minLv:7,  maxLv:10, weight:3  },
    ],
    trainers:[
      { stage:3,  name:"Jungtrainerin Anna",  party:[{dexId:21,lv:8}], reward:160 },
      { stage:6,  name:"Wanderer Ben",        party:[{dexId:29,lv:9},{dexId:32,lv:9}], reward:200 },
      { stage:9,  name:"Jungtrainer Chris",   party:[{dexId:21,lv:10},{dexId:21,lv:10}], reward:250 },
      { stage:12, name:"Rivalenkampf",        party:[{dexId:21,lv:12},{dexId:39,lv:10},{dexId:4,lv:12}], reward:500, isRival:true },
    ],
    next:"mt_moon"
  },
  // ══ 9. ROTES GEBIRGE ══════════════════════════════════════
  {
    id:"mt_moon", name:"Rotes Gebirge", type:"dungeon",
    bgGround:"#5a5060", bgSky:"#2a2040", bgMid:"#4a4055",
    stageCount:20,
    wildPokemon:[
      { dexId:41, minLv:6,  maxLv:11, weight:45 },
      { dexId:74, minLv:8,  maxLv:12, weight:25 },
      { dexId:46, minLv:7,  maxLv:12, weight:15 },
      { dexId:35, minLv:8,  maxLv:12, weight:9  },
      { dexId:27, minLv:7,  maxLv:10, weight:6  },
    ],
    trainers:[
      { stage:4,  name:"Team Rocket",      party:[{dexId:41,lv:11},{dexId:41,lv:11}], reward:220 },
      { stage:8,  name:"Team Rocket",      party:[{dexId:74,lv:12},{dexId:41,lv:12}], reward:280 },
      { stage:12, name:"Geologe Stefan",   party:[{dexId:74,lv:11},{dexId:46,lv:11},{dexId:74,lv:11}], reward:350 },
      { stage:16, name:"Team Rocket",      party:[{dexId:41,lv:13},{dexId:46,lv:13}], reward:350 },
      { stage:19, name:"Forscher Joachim", party:[{dexId:74,lv:12},{dexId:35,lv:10},{dexId:74,lv:12}], reward:400 },
    ],
    next:"route4"
  },
  // ══ 10. ROUTE 4 ═══════════════════════════════════════════
  {
    id:"route4", name:"Route 4", type:"route",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c860",
    stageCount:8,
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
      { stage:7, name:"Jungtrainer Simon",   party:[{dexId:21,lv:15},{dexId:21,lv:15}], reward:400 },
    ],
    next:"cerulean_city"
  },
  // ══ 11. AZURIA CITY ═══════════════════════════════════════
  {
    id:"cerulean_city", name:"Azuria City", type:"city",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"pokeball",    name:"Pokéball",  cost:200, desc:"Fanghilfe" },
      { id:"superball",   name:"Superball", cost:600, desc:"Bessere Fangchance" },
      { id:"potion",      name:"Trank",     cost:300, desc:"+20 HP" },
      { id:"superpotion", name:"Supertrank",cost:700, desc:"+50 HP" },
      { id:"antidote",    name:"Gegengift", cost:100, desc:"Heilt Gift" },
    ],
    next:"cerulean_gym"
  },
  // ══ 12. AZURIA ARENA ══════════════════════════════════════
  {
    id:"cerulean_gym", name:"Azuria Arena", type:"gym",
    bgGround:"#2060c0", bgSky:"#80b0f0", bgMid:"#4080e0",
    stageCount:5, wildPokemon:[],
    trainers:[
      { stage:2, name:"Schwimmerin Lena", party:[{dexId:60,lv:15},{dexId:60,lv:15}], reward:400 },
      { stage:4, name:"Schwimmer Niko",   party:[{dexId:54,lv:16},{dexId:72,lv:16}], reward:500 },
    ],
    gymLeader:{
      stage:5, name:"Misty", title:"Arenaleiterin",
      badge:"Kaskadenmedaille", badgeId:"cascade",
      party:[{dexId:120,lv:18},{dexId:121,lv:21}],
      reward:2100, winText:"Du hast die Kaskadenmedaille!"
    },
    next:"route5"
  },
  // ══ 13. ROUTE 5–6 ═════════════════════════════════════════
  {
    id:"route5", name:"Route 5–6", type:"route",
    bgGround:"#78b060", bgSky:"#87ceeb", bgMid:"#98c880",
    stageCount:12,
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
      { stage:3,  name:"Jungtrainerin Sarah",  party:[{dexId:52,lv:15}], reward:450 },
      { stage:7,  name:"Jugendlicher Jan",      party:[{dexId:56,lv:16},{dexId:16,lv:16}], reward:550 },
      { stage:10, name:"Jungtrainer Christoph", party:[{dexId:52,lv:17},{dexId:43,lv:17}], reward:650 },
    ],
    next:"vermilion_city"
  },
  // ══ 14. ZINNIA CITY ═══════════════════════════════════════
  {
    id:"vermilion_city", name:"Zinnia City", type:"city",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"superball",   name:"Superball",      cost:600, desc:"Bessere Fangchance" },
      { id:"superpotion", name:"Supertrank",     cost:700, desc:"+50 HP" },
      { id:"awakening",   name:"Weckflöte",      cost:250, desc:"Heilt Schlaf" },
      { id:"paralysheal", name:"Paraheilmittel", cost:200, desc:"Heilt Lähmung" },
    ],
    next:"vermilion_gym"
  },
  // ══ 15. ZINNIA ARENA ══════════════════════════════════════
  {
    id:"vermilion_gym", name:"Zinnia Arena", type:"gym",
    bgGround:"#808050", bgSky:"#e0e000", bgMid:"#c0c060",
    stageCount:5, wildPokemon:[],
    trainers:[
      { stage:2, name:"Soldat Klaus",  party:[{dexId:81,lv:21}], reward:600 },
      { stage:4, name:"Soldat Werner", party:[{dexId:25,lv:22},{dexId:100,lv:22}], reward:750 },
    ],
    gymLeader:{
      stage:5, name:"Mysto", title:"Arenaleiter",
      badge:"Donnermedaille", badgeId:"thunder",
      party:[{dexId:100,lv:21},{dexId:100,lv:21},{dexId:26,lv:24}],
      reward:2400, winText:"Du hast die Donnermedaille!"
    },
    next:"route11"
  },
  // ══ 16. ROUTE 11–12 ═══════════════════════════════════════
  {
    id:"route11", name:"Route 11–12", type:"route",
    bgGround:"#70b050", bgSky:"#87ceeb", bgMid:"#90c870",
    stageCount:14,
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
    next:"lavender_town"
  },
  // ══ 17. LAVENDELDORF ══════════════════════════════════════
  {
    id:"lavender_town", name:"Lavendeldorf", type:"city",
    bgGround:"#6a5880", bgSky:"#9080a0", bgMid:"#7a6890",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"superball",   name:"Superball",  cost:600,  desc:"Bessere Fangchance" },
      { id:"superpotion", name:"Supertrank", cost:700,  desc:"+50 HP" },
      { id:"revive",      name:"Beleber",    cost:1500, desc:"Belebt K.O. Pokémon" },
    ],
    next:"pokemon_tower"
  },
  // ══ 18. POKÉMON-TURM ══════════════════════════════════════
  {
    id:"pokemon_tower", name:"Pokémon-Turm", type:"dungeon",
    bgGround:"#4a3850", bgSky:"#2a1830", bgMid:"#3a2840",
    stageCount:18,
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
      { stage:18, name:"Rivalenkampf II",    party:[{dexId:22,lv:25},{dexId:23,lv:23},{dexId:7,lv:25}], reward:1500, isRival:true },
    ],
    next:"route7"
  },
  // ══ 19. ROUTE 7–8 ═════════════════════════════════════════
  {
    id:"route7", name:"Route 7–8", type:"route",
    bgGround:"#60a850", bgSky:"#87ceeb", bgMid:"#80b860",
    stageCount:12,
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
      { stage:4,  name:"Pokémon-Fan Julia", party:[{dexId:52,lv:22}], reward:900 },
      { stage:8,  name:"Kampfmädchen Emma", party:[{dexId:17,lv:24},{dexId:58,lv:22}], reward:1100 },
      { stage:11, name:"Jungtrainer Felix", party:[{dexId:22,lv:26},{dexId:44,lv:25}], reward:1400 },
    ],
    next:"celadon_city"
  },
  // ══ 20. PRISMANIA CITY ════════════════════════════════════
  {
    id:"celadon_city", name:"Prismania City", type:"city",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"superball",   name:"Superball",  cost:600,  desc:"Bessere Fangchance" },
      { id:"hyperball",   name:"Hyperball",  cost:1200, desc:"Beste Fangchance" },
      { id:"hyperpotion", name:"Hypertrank", cost:1200, desc:"+200 HP" },
      { id:"revive",      name:"Beleber",    cost:1500, desc:"Belebt K.O. Pokémon" },
    ],
    next:"celadon_gym"
  },
  // ══ 21. PRISMANIA ARENA ═══════════════════════════════════
  {
    id:"celadon_gym", name:"Prismania Arena", type:"gym",
    bgGround:"#408040", bgSky:"#80e080", bgMid:"#60c060",
    stageCount:5, wildPokemon:[],
    trainers:[
      { stage:2, name:"Jugendliche Petra", party:[{dexId:43,lv:28},{dexId:69,lv:28}], reward:1000 },
      { stage:4, name:"Schönheit Sandra",  party:[{dexId:70,lv:30},{dexId:44,lv:30}], reward:1300 },
    ],
    gymLeader:{
      stage:5, name:"Erika", title:"Arenaleiterin",
      badge:"Regenbodenmedaille", badgeId:"rainbow",
      party:[{dexId:70,lv:29},{dexId:114,lv:24},{dexId:71,lv:29}],
      reward:2900, winText:"Du hast die Regenbodenmedaille!"
    },
    next:"route16"
  },
  // ══ 22. FAHRRADROUTE 16–18 ════════════════════════════════
  {
    id:"route16", name:"Fahrradroute 16–18", type:"route",
    bgGround:"#78b060", bgSky:"#87ceeb", bgMid:"#98c080",
    stageCount:15,
    wildPokemon:[
      { dexId:21, minLv:20, maxLv:26, weight:30 },
      { dexId:19, minLv:20, maxLv:25, weight:25 },
      { dexId:22, minLv:22, maxLv:27, weight:20 },
      { dexId:20, minLv:24, maxLv:28, weight:15 },
      { dexId:84, minLv:22, maxLv:27, weight:10 },
    ],
    trainers:[
      { stage:5,  name:"Biker Ralf",     party:[{dexId:22,lv:25},{dexId:22,lv:25}], reward:1200 },
      { stage:10, name:"Biker Wolfgang", party:[{dexId:22,lv:27},{dexId:84,lv:27}], reward:1500 },
      { stage:13, name:"Biker Thomas",   party:[{dexId:21,lv:28},{dexId:21,lv:28},{dexId:22,lv:28}], reward:1800 },
    ],
    next:"fuchsia_city"
  },
  // ══ 23. POKÉROSIA CITY ════════════════════════════════════
  {
    id:"fuchsia_city", name:"Pokérosia City", type:"city",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"hyperball",   name:"Hyperball",  cost:1200, desc:"Beste Fangchance" },
      { id:"hyperpotion", name:"Hypertrank", cost:1200, desc:"+200 HP" },
      { id:"maxpotion",   name:"MaxTrank",   cost:2500, desc:"Volle HP" },
      { id:"fullheal",    name:"Vollheiler", cost:600,  desc:"Heilt alle Status" },
      { id:"revive",      name:"Beleber",    cost:1500, desc:"Belebt K.O. Pokémon" },
    ],
    next:"fuchsia_gym"
  },
  // ══ 24. POKÉROSIA ARENA ═══════════════════════════════════
  {
    id:"fuchsia_gym", name:"Pokérosia Arena", type:"gym",
    bgGround:"#506050", bgSky:"#8090a0", bgMid:"#607060",
    stageCount:5, wildPokemon:[],
    trainers:[
      { stage:2, name:"Ninja-Schüler Kai",  party:[{dexId:41,lv:34},{dexId:41,lv:34}], reward:1500 },
      { stage:4, name:"Ninja-Schüler Ryuu", party:[{dexId:42,lv:36},{dexId:109,lv:36}], reward:1900 },
    ],
    gymLeader:{
      stage:5, name:"Koga", title:"Arenaleiter",
      badge:"Seelenmedaille", badgeId:"soul",
      party:[{dexId:109,lv:37},{dexId:109,lv:37},{dexId:42,lv:36},{dexId:110,lv:39}],
      reward:3900, winText:"Du hast die Seelenmedaille!"
    },
    next:"route19"
  },
  // ══ 25. ROUTE 19–21 (MEER) ════════════════════════════════
  {
    id:"route19", name:"Route 19–21 (Meer)", type:"sea",
    bgGround:"#2050c0", bgSky:"#80b0e0", bgMid:"#3060d0",
    stageCount:15,
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
    next:"cinnabar_island"
  },
  // ══ 26. ZINNOBERINSEL ═════════════════════════════════════
  {
    id:"cinnabar_island", name:"Zinnoberinsel", type:"city",
    bgGround:"#808060", bgSky:"#f05020", bgMid:"#c06040",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"hyperball",   name:"Hyperball", cost:1200, desc:"Beste Fangchance" },
      { id:"maxpotion",   name:"MaxTrank",  cost:2500, desc:"Volle HP" },
      { id:"fullrestore", name:"Komplett",  cost:3000, desc:"HP + Status" },
      { id:"revive",      name:"Beleber",   cost:1500, desc:"Belebt K.O. Pokémon" },
    ],
    next:"cinnabar_gym"
  },
  // ══ 27. ZINNOBERINSEL ARENA ═══════════════════════════════
  {
    id:"cinnabar_gym", name:"Zinnoberinsel Arena", type:"gym",
    bgGround:"#a04000", bgSky:"#ff6020", bgMid:"#c05010",
    stageCount:5, wildPokemon:[],
    trainers:[
      { stage:2, name:"Brand-Fan Nico",  party:[{dexId:126,lv:40},{dexId:77,lv:40}], reward:2000 },
      { stage:4, name:"Brand-Fan Maria", party:[{dexId:78,lv:42},{dexId:126,lv:42}], reward:2500 },
    ],
    gymLeader:{
      stage:5, name:"Brand", title:"Arenaleiter",
      badge:"Hitzemedaille", badgeId:"volcano",
      party:[{dexId:58,lv:42},{dexId:77,lv:40},{dexId:78,lv:42},{dexId:59,lv:47}],
      reward:4700, winText:"Du hast die Hitzemedaille!"
    },
    next:"saffron_city"
  },
  // ══ 28. SAFFRONIA CITY ════════════════════════════════════
  {
    id:"saffron_city", name:"Saffronia City", type:"city",
    bgGround:"#808080", bgSky:"#87ceeb", bgMid:"#b0b0b0",
    stageCount:1, wildPokemon:[], trainers:[],
    services:["heal","shop"],
    shopItems:[
      { id:"hyperball",   name:"Hyperball", cost:1200, desc:"Beste Fangchance" },
      { id:"maxpotion",   name:"MaxTrank",  cost:2500, desc:"Volle HP" },
      { id:"fullrestore", name:"Komplett",  cost:3000, desc:"HP + Status" },
      { id:"revive",      name:"Beleber",   cost:1500, desc:"Belebt K.O. Pokémon" },
    ],
    next:"saffron_gym"
  },
  // ══ 29. SAFFRONIA ARENA ═══════════════════════════════════
  {
    id:"saffron_gym", name:"Saffronia Arena", type:"gym",
    bgGround:"#505080", bgSky:"#8080c0", bgMid:"#6060a0",
    stageCount:5, wildPokemon:[],
    trainers:[
      { stage:2, name:"Psycho-Trainer Otto",  party:[{dexId:63,lv:35},{dexId:64,lv:35}], reward:2000 },
      { stage:4, name:"Psycho-Trainer Hanna", party:[{dexId:96,lv:38},{dexId:97,lv:38}], reward:2800 },
    ],
    gymLeader:{
      stage:5, name:"Sabrina", title:"Arenaleiterin",
      badge:"Sumpfmedaille", badgeId:"marsh",
      party:[{dexId:63,lv:38},{dexId:64,lv:37},{dexId:65,lv:43},{dexId:96,lv:43}],
      reward:4300, winText:"Du hast die Sumpfmedaille!"
    },
    next:"route22"
  },
  // ══ 30. ROUTE 22–23 ═══════════════════════════════════════
  {
    id:"route22", name:"Route 22–23", type:"route",
    bgGround:"#70a050", bgSky:"#87ceeb", bgMid:"#80b060",
    stageCount:15,
    wildPokemon:[
      { dexId:21, minLv:3,  maxLv:5,  weight:20 },
      { dexId:19, minLv:3,  maxLv:5,  weight:15 },
      { dexId:29, minLv:4,  maxLv:8,  weight:10 },
      { dexId:32, minLv:4,  maxLv:8,  weight:10 },
      { dexId:56, minLv:5,  maxLv:10, weight:10 },
      { dexId:22, minLv:30, maxLv:45, weight:15 },
      { dexId:30, minLv:30, maxLv:40, weight:8  },
      { dexId:33, minLv:30, maxLv:40, weight:7  },
      { dexId:27, minLv:25, maxLv:40, weight:5  },
    ],
    trainers:[
      { stage:4,  name:"Rivalenkampf III", party:[{dexId:22,lv:40},{dexId:24,lv:39},{dexId:54,lv:40},{dexId:4,lv:43}], reward:3000, isRival:true },
      { stage:9,  name:"Pokémon-Fan Otto",  party:[{dexId:30,lv:42},{dexId:95,lv:42}], reward:3500 },
      { stage:13, name:"Wanderer Klaus",    party:[{dexId:28,lv:45},{dexId:57,lv:43}], reward:4000 },
    ],
    next:"viridian_gym"
  },
  // ══ 31. VERTANIA ARENA — 7/8 Orden nötig ═════════════════
  {
    id:"viridian_gym", name:"Vertania Arena", type:"gym",
    bgGround:"#808060", bgSky:"#a0a080", bgMid:"#909070",
    stageCount:5, wildPokemon:[],
    minBadges: 7,   // ← Giovanni erst mit 7 anderen Orden
    trainers:[
      { stage:2, name:"Trainer Clyde", party:[{dexId:111,lv:44},{dexId:74,lv:44}], reward:2500 },
      { stage:4, name:"Trainer Bruce", party:[{dexId:28,lv:46},{dexId:76,lv:46}], reward:3000 },
    ],
    gymLeader:{
      stage:5, name:"Giovanni", title:"Arenaleiter & Boss",
      badge:"Erdmedaille", badgeId:"earth",
      party:[{dexId:111,lv:45},{dexId:28,lv:55},{dexId:76,lv:50},{dexId:31,lv:53}],
      reward:5500, winText:"Alle 8 Medaillen! Zur Pokémon-Liga!"
    },
    next:"victory_road"
  },
  // ══ 32. SIEGERSTRASSE ═════════════════════════════════════
  {
    id:"victory_road", name:"Siegerstraße", type:"dungeon",
    bgGround:"#3a3050", bgSky:"#1a1030", bgMid:"#2a2040",
    stageCount:20,
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
      { stage:18, name:"Rivalenkampf IV",party:[{dexId:22,lv:53},{dexId:55,lv:53},{dexId:28,lv:54},{dexId:65,lv:55},{dexId:6,lv:58}], reward:8000, isRival:true },
    ],
    next:"elite_four"
  },
  // ══ 33. POKÉMON-LIGA ══════════════════════════════════════
  {
    id:"elite_four", name:"Pokémon-Liga", type:"gym",
    bgGround:"#2a2040", bgSky:"#0a0820", bgMid:"#1a1030",
    stageCount:5, wildPokemon:[],
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
      reward:15000, winText:"🏆 Du bist Pokémon-Champion!"
    },
    next:null
  }
];

function getZone(id) {
  return WORLD.find(function(z) { return z.id === id; }) || null;
}

var START_ZONE  = "alabastia";
var START_STAGE = 1;
