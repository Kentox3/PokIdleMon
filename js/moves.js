// ═══════════════════════════════════════════════════════════════
//  moves.js — Attacken-Datenbank (Gen 1, korrekte deutsche Namen)
//  Quelle: pokemonexperte.de/rbg/attacken.php (originale Gen-1-Namen)
// ═══════════════════════════════════════════════════════════════
// Gen-1-Regel: Typ bestimmt physisch/speziell
// Physical: Normal,Fighting,Flying,Poison,Ground,Rock,Bug,Ghost
// Special:  Fire,Water,Grass,Electric,Ice,Psychic,Dragon

var PHYSICAL_TYPES = new Set(["Normal","Fighting","Flying","Poison","Ground","Rock","Bug","Ghost"]);

var MOVES = {
  // ── Kräftemessen (Struggle — Fallback wenn alle PP leer) ───
  struggle:        { name:"Kräftemessen",   type:"Normal",   pwr:50,  acc:100, pp:999, effect:null },

  // ══════════════════════════════════════════════════════════
  //  NORMAL – Angriff
  // ══════════════════════════════════════════════════════════
  tackle:          { name:"Tackle",          type:"Normal",   pwr:35,  acc:95,  pp:35, effect:null },
  kratzer:         { name:"Kratzer",         type:"Normal",   pwr:40,  acc:100, pp:35, effect:null },
  pfund:           { name:"Pfund",           type:"Normal",   pwr:40,  acc:100, pp:35, effect:null },
  //
  // Peck → Schnabel (korrekt: Flug-Typ)
  piks:            { name:"Schnabel",        type:"Flying",   pwr:35,  acc:100, pp:35, effect:null },
  //
  // Quick Attack → Ruckzuckhieb
  schnellangriff:  { name:"Ruckzuckhieb",   type:"Normal",   pwr:40,  acc:100, pp:30, effect:null, priority:1 },
  ruckzuckhieb:    { name:"Ruckzuckhieb",   type:"Normal",   pwr:40,  acc:100, pp:30, effect:null, priority:1 },
  //
  // Body Slam → Bodyslam (korrekter dt. Name)
  koerperrammler:  { name:"Bodyslam",        type:"Normal",   pwr:85,  acc:100, pp:15, effect:{type:"paralysis",chance:0.3} },
  //
  megahieb:        { name:"Megahieb",        type:"Normal",   pwr:80,  acc:85,  pp:20, effect:null },
  hyperstrahl:     { name:"Hyperstrahl",     type:"Normal",   pwr:150, acc:90,  pp:5,  effect:null },
  schlitzer:       { name:"Schlitzer",       type:"Normal",   pwr:70,  acc:100, pp:20, effect:null, highCrit:true },
  biss:            { name:"Biss",            type:"Normal",   pwr:60,  acc:100, pp:25, effect:{type:"flinch",chance:0.3} },
  stampfer:        { name:"Stampfer",        type:"Normal",   pwr:65,  acc:100, pp:20, effect:{type:"flinch",chance:0.3} },
  //
  // Wrap → Wickel
  einwickler:      { name:"Wickel",          type:"Normal",   pwr:15,  acc:85,  pp:20, effect:null },
  //
  platscher:       { name:"Platscher",       type:"Water",    pwr:40,  acc:100, pp:40, effect:null },
  //
  // Double Slap → Duplexhieb (für Piepi)
  dauerklaps:      { name:"Duplexhieb",      type:"Normal",   pwr:15,  acc:85,  pp:10, effect:null, hits:[2,5] },
  //
  raserei:         { name:"Raserei",         type:"Normal",   pwr:20,  acc:100, pp:20, effect:null },
  //
  // Skull Bash → Schädelwumme
  schaedelhieb:    { name:"Schädelwumme",    type:"Normal",   pwr:100, acc:100, pp:15, effect:null },
  //
  // Bone Club → Knochenkeule
  knochen:         { name:"Knochenkeule",    type:"Ground",   pwr:50,  acc:85,  pp:20, effect:{type:"flinch",chance:0.1} },
  //
  // Fury Swipes → Kratzfurie
  klauen:          { name:"Kratzfurie",      type:"Normal",   pwr:18,  acc:80,  pp:15, effect:null, hits:[2,5] },
  //
  hornattacke:     { name:"Hornattacke",     type:"Normal",   pwr:65,  acc:100, pp:25, effect:null },
  //
  // Leech Life → Blutsauger (für Zubat/Golbat/Paras)
  beissattacke:    { name:"Blutsauger",      type:"Bug",      pwr:20,  acc:100, pp:15, effect:{type:"drain"} },
  blutsauger:      { name:"Blutsauger",      type:"Bug",      pwr:20,  acc:100, pp:15, effect:{type:"drain"} },
  //
  // Comet Punch → Kometenhieb
  klinge:          { name:"Kometenhieb",     type:"Normal",   pwr:18,  acc:85,  pp:15, effect:null, hits:[2,5] },
  //
  // Egg Bomb → Eierbombe
  egg_bomb:        { name:"Eierbombe",       type:"Normal",   pwr:100, acc:75,  pp:10, effect:null },
  //
  // Fury Attack → Furienschlag
  wutangriff:      { name:"Furienschlag",    type:"Normal",   pwr:15,  acc:85,  pp:20, effect:null, hits:[2,5] },
  //
  // Bonemerang → Knochmerang
  knochenboomerang:{ name:"Knochmerang",     type:"Ground",   pwr:50,  acc:90,  pp:10, effect:null, hits:[2,2] },
  //
  zahltag:         { name:"Zahltag",         type:"Normal",   pwr:40,  acc:100, pp:20, effect:null },
  megakick:        { name:"Megakick",        type:"Normal",   pwr:120, acc:75,  pp:5,  effect:null },
  klammergriff:    { name:"Klammergriff",    type:"Normal",   pwr:55,  acc:85,  pp:30, effect:null },
  irrschlag:       { name:"Irrschlag",       type:"Normal",   pwr:70,  acc:100, pp:10, effect:null },
  kopfnuss:        { name:"Kopfnuß",         type:"Normal",   pwr:70,  acc:100, pp:15, effect:{type:"flinch",chance:0.3} },
  hyperzahn:       { name:"Hyperzahn",       type:"Normal",   pwr:80,  acc:90,  pp:15, effect:{type:"flinch",chance:0.1} },
  superzahn:       { name:"Superzahn",       type:"Normal",   pwr:0,   acc:90,  pp:10, effect:null },
  risikotackle:    { name:"Risikotackle",    type:"Normal",   pwr:120, acc:100, pp:15, effect:null },
  bodycheck:       { name:"Bodycheck",       type:"Normal",   pwr:90,  acc:85,  pp:20, effect:null },
  slam:            { name:"Slam",            type:"Normal",   pwr:80,  acc:75,  pp:20, effect:null },
  guillotine:      { name:"Guillotine",      type:"Normal",   pwr:0,   acc:30,  pp:5,  effect:null },
  hornbohrer:      { name:"Hornbohrer",      type:"Normal",   pwr:0,   acc:30,  pp:5,  effect:null },
  sternschauer:    { name:"Sternschauer",    type:"Normal",   pwr:60,  acc:100, pp:20, effect:null },
  drachenwut:      { name:"Drachenwut",      type:"Dragon",   pwr:0,   acc:100, pp:10, effect:null },

  // NORMAL – Status
  //
  // Growl → Knurrer
  knurrer:         { name:"Knurrer",         type:"Normal",   pwr:0,   acc:100, pp:40, effect:{type:"atk-1",target:"foe"} },
  //
  // Tail Whip → Rutenschlag
  schwanzwedler:   { name:"Rutenschlag",     type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"def-1",target:"foe"} },
  //
  // Leer → Silberblick
  starren:         { name:"Silberblick",     type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"def-1",target:"foe"} },
  //
  // Sand Attack → Sandwirbel
  sandwirbel:      { name:"Sandwirbel",      type:"Normal",   pwr:0,   acc:100, pp:15, effect:{type:"acc-1",target:"foe"} },
  //
  haertner:        { name:"Härtner",         type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"def+1",target:"self"} },
  wachstum:        { name:"Wachstum",        type:"Normal",   pwr:0,   acc:100, pp:40, effect:{type:"spa+1",target:"self"} },
  //
  // Minimize → Komprimator
  minimieren:      { name:"Komprimator",     type:"Normal",   pwr:0,   acc:100, pp:20, effect:{type:"eva+1",target:"self"} },
  //
  // Sing → Gesang
  singen:          { name:"Gesang",          type:"Normal",   pwr:0,   acc:55,  pp:15, effect:{type:"sleep",target:"foe"} },
  //
  // Recover → Regeneration
  regeneration:    { name:"Regeneration",    type:"Normal",   pwr:0,   acc:100, pp:20, effect:{type:"heal50",target:"self"} },
  //
  teleport:        { name:"Teleport",        type:"Psychic",  pwr:0,   acc:100, pp:20, effect:null },
  verwandlung:     { name:"Wandler",         type:"Normal",   pwr:0,   acc:100, pp:10, effect:null },
  metronom:        { name:"Metronom",        type:"Normal",   pwr:0,   acc:100, pp:10, effect:null },
  //
  // Swords Dance → Schwerttanz
  schwert:         { name:"Schwerttanz",     type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"atk+2",target:"self"} },
  swordsdance:     { name:"Schwerttanz",     type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"atk+2",target:"self"} },
  //
  // Selfdestruct → Finale
  selbstzerstoerer:{ name:"Finale",          type:"Normal",   pwr:130, acc:100, pp:5,  effect:{type:"selfdestruct"} },
  explosion:       { name:"Explosion",       type:"Normal",   pwr:170, acc:100, pp:5,  effect:{type:"selfdestruct"} },
  //
  rauchwolke:      { name:"Rauchwolke",      type:"Normal",   pwr:0,   acc:100, pp:20, effect:{type:"acc-1",target:"foe"} },
  doppelteam:      { name:"Doppelteam",      type:"Normal",   pwr:0,   acc:100, pp:15, effect:{type:"eva+1",target:"self"} },
  wirbelwind:      { name:"Wirbelwind",      type:"Normal",   pwr:0,   acc:100, pp:20, effect:null },
  schaufler:       { name:"Schaufler",       type:"Ground",   pwr:80,  acc:100, pp:10, effect:null },
  klingensturm:    { name:"Klingensturm",    type:"Normal",   pwr:80,  acc:100, pp:10, effect:null },
  meditation:      { name:"Meditation",      type:"Psychic",  pwr:0,   acc:100, pp:40, effect:{type:"atk+1",target:"self"} },
  schaerfer:       { name:"Schärfer",        type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"atk+1",target:"self"} },
  geduld:          { name:"Geduld",          type:"Normal",   pwr:0,   acc:100, pp:10, effect:null },
  delegator:       { name:"Delegator",       type:"Normal",   pwr:0,   acc:100, pp:10, effect:null },
  mimikry:         { name:"Mimikry",         type:"Normal",   pwr:0,   acc:100, pp:10, effect:null },
  superschall:     { name:"Superschall",     type:"Normal",   pwr:0,   acc:55,  pp:20, effect:{type:"confuse",target:"foe"} },
  kreideschrei:    { name:"Kreideschrei",    type:"Normal",   pwr:0,   acc:85,  pp:40, effect:{type:"def-1",target:"foe"} },
  //
  // Sonicboom → Ultraschall
  sonicwelle:      { name:"Ultraschall",     type:"Normal",   pwr:20,  acc:90,  pp:20, effect:null },
  schall:          { name:"Ultraschall",     type:"Normal",   pwr:20,  acc:90,  pp:20, effect:null },
  //
  reflektor:       { name:"Reflektor",       type:"Psychic",  pwr:0,   acc:100, pp:20, effect:{type:"def+1",target:"self"} },
  lichtschild:     { name:"Lichtschild",     type:"Psychic",  pwr:0,   acc:100, pp:30, effect:null },

  // ══════════════════════════════════════════════════════════
  //  FEUER
  // ══════════════════════════════════════════════════════════
  glut:            { name:"Glut",            type:"Fire",     pwr:40,  acc:100, pp:25, effect:{type:"burn",chance:0.1} },
  flammenwurf:     { name:"Flammenwurf",     type:"Fire",     pwr:95,  acc:100, pp:15, effect:{type:"burn",chance:0.1} },
  //
  // Fire Blast → Feuersturm
  feuerblitz:      { name:"Feuersturm",      type:"Fire",     pwr:120, acc:85,  pp:5,  effect:{type:"burn",chance:0.3} },
  //
  // Fire Spin → Feuerwirbel
  feuerring:       { name:"Feuerwirbel",     type:"Fire",     pwr:15,  acc:70,  pp:15, effect:null },
  //
  feuerschlag:     { name:"Feuerschlag",     type:"Fire",     pwr:75,  acc:100, pp:15, effect:{type:"burn",chance:0.1} },

  // ══════════════════════════════════════════════════════════
  //  WASSER
  // ══════════════════════════════════════════════════════════
  blubber:         { name:"Blubber",         type:"Water",    pwr:20,  acc:100, pp:30, effect:{type:"spe-1",chance:0.1} },
  aquaknarre:      { name:"Aquaknarre",      type:"Water",    pwr:40,  acc:100, pp:25, effect:null },
  //
  // BubbleBeam → Blubbstrahl
  blubberstrahl:   { name:"Blubbstrahl",     type:"Water",    pwr:65,  acc:100, pp:20, effect:{type:"spe-1",chance:0.1} },
  //
  surfer:          { name:"Surfer",          type:"Water",    pwr:95,  acc:100, pp:15, effect:null },
  //
  // Hydro Pump → Hydropumpe
  hydrokanone:     { name:"Hydropumpe",      type:"Water",    pwr:120, acc:80,  pp:5,  effect:null },
  //
  krabbhammer:     { name:"Krabbhammer",     type:"Water",    pwr:90,  acc:85,  pp:10, effect:null, highCrit:true },
  kaskade:         { name:"Kaskade",         type:"Water",    pwr:80,  acc:100, pp:15, effect:{type:"flinch",chance:0.2} },

  // ══════════════════════════════════════════════════════════
  //  PFLANZE
  // ══════════════════════════════════════════════════════════
  rankenhieb:      { name:"Rankenhieb",      type:"Grass",    pwr:35,  acc:100, pp:25, effect:null },
  rasierblatt:     { name:"Rasierblatt",     type:"Grass",    pwr:55,  acc:95,  pp:25, effect:null, highCrit:true },
  razorblatt:      { name:"Rasierblatt",     type:"Grass",    pwr:55,  acc:95,  pp:25, effect:null, highCrit:true },
  solarstrahl:     { name:"Solarstrahl",     type:"Grass",    pwr:120, acc:100, pp:10, effect:null, charge:true },
  megasauger:      { name:"Megasauger",      type:"Grass",    pwr:40,  acc:100, pp:15, effect:{type:"drain"} },
  absorber:        { name:"Absorber",        type:"Grass",    pwr:20,  acc:100, pp:20, effect:{type:"drain"} },
  engelsamen:      { name:"Engelsamen",      type:"Grass",    pwr:0,   acc:90,  pp:10, effect:{type:"drain"} },
  //
  // Sleep Powder → Schlafpuder ✓, Stun Spore → Stachelspore
  schlafpulver:    { name:"Schlafpuder",     type:"Grass",    pwr:0,   acc:75,  pp:15, effect:{type:"sleep",target:"foe"} },
  paralysipora:    { name:"Stachelspore",    type:"Grass",    pwr:0,   acc:75,  pp:30, effect:{type:"paralysis",target:"foe"} },
  giftpuder:       { name:"Giftpuder",       type:"Poison",   pwr:0,   acc:75,  pp:35, effect:{type:"poison",target:"foe"} },
  pilzspore:       { name:"Pilzspore",       type:"Grass",    pwr:0,   acc:100, pp:15, effect:{type:"sleep",target:"foe"} },
  blutsauger_g:    { name:"Blutsauger",      type:"Bug",      pwr:20,  acc:100, pp:15, effect:{type:"drain"} },

  // ══════════════════════════════════════════════════════════
  //  ELEKTRO
  // ══════════════════════════════════════════════════════════
  donnerschock:    { name:"Donnerschock",    type:"Electric", pwr:40,  acc:100, pp:30, effect:{type:"paralysis",chance:0.1} },
  donnerblitz:     { name:"Donnerblitz",     type:"Electric", pwr:95,  acc:100, pp:15, effect:{type:"paralysis",chance:0.1} },
  donner:          { name:"Donner",          type:"Electric", pwr:120, acc:70,  pp:10, effect:{type:"paralysis",chance:0.3} },
  donnerwelle:     { name:"Donnerwelle",     type:"Electric", pwr:0,   acc:100, pp:20, effect:{type:"paralysis",target:"foe"} },
  donnerschlag:    { name:"Donnerschlag",    type:"Electric", pwr:75,  acc:100, pp:15, effect:{type:"paralysis",chance:0.1} },

  // ══════════════════════════════════════════════════════════
  //  EIS
  // ══════════════════════════════════════════════════════════
  eisstrahl:       { name:"Eisstrahl",       type:"Ice",      pwr:95,  acc:100, pp:10, effect:{type:"freeze",chance:0.1} },
  blizzard:        { name:"Blizzard",        type:"Ice",      pwr:120, acc:70,  pp:5,  effect:{type:"freeze",chance:0.3} },
  aurorastrahl:    { name:"Aurorastrahl",    type:"Ice",      pwr:65,  acc:100, pp:20, effect:{type:"atk-1",chance:0.1} },
  //
  // Ice Punch → Eishieb
  eisschlag:       { name:"Eishieb",         type:"Ice",      pwr:75,  acc:100, pp:15, effect:{type:"freeze",chance:0.1} },
  //
  // Mist → Weißnebel
  mist:            { name:"Weißnebel",       type:"Ice",      pwr:0,   acc:100, pp:30, effect:null },
  dunkelnebel:     { name:"Dunkelnebel",     type:"Ice",      pwr:0,   acc:100, pp:30, effect:null },

  // ══════════════════════════════════════════════════════════
  //  PSYCHO
  // ══════════════════════════════════════════════════════════
  konfusion:       { name:"Konfusion",       type:"Psychic",  pwr:50,  acc:100, pp:25, effect:{type:"confuse",chance:0.1} },
  psych:           { name:"Psychokinese",    type:"Psychic",  pwr:90,  acc:100, pp:10, effect:{type:"spd-1",chance:0.1} },
  psystrahl:       { name:"Psystrahl",       type:"Psychic",  pwr:65,  acc:100, pp:20, effect:{type:"confuse",chance:0.1} },
  psywelle:        { name:"Psywelle",        type:"Psychic",  pwr:0,   acc:80,  pp:15, effect:null },
  hypnose:         { name:"Hypnose",         type:"Psychic",  pwr:0,   acc:60,  pp:20, effect:{type:"sleep",target:"foe"} },
  traumfresser:    { name:"Traumfresser",    type:"Psychic",  pwr:100, acc:100, pp:15, effect:null },
  //
  konfustrahl:     { name:"Konfustrahl",     type:"Ghost",    pwr:0,   acc:100, pp:10, effect:{type:"confuse",target:"foe"} },
  //
  agilitaet:       { name:"Agilität",        type:"Psychic",  pwr:0,   acc:100, pp:30, effect:{type:"spe+2",target:"self"} },
  amnesie:         { name:"Amnesie",         type:"Psychic",  pwr:0,   acc:100, pp:20, effect:{type:"spd+2",target:"self"} },
  barriere:        { name:"Barriere",        type:"Psychic",  pwr:0,   acc:100, pp:30, effect:{type:"def+2",target:"self"} },
  //
  // Rest → Erholung
  erholung:        { name:"Erholung",        type:"Psychic",  pwr:0,   acc:100, pp:10, effect:{type:"fullheal",target:"self"} },
  //
  teleport2:       { name:"Teleport",        type:"Psychic",  pwr:0,   acc:100, pp:20, effect:null },

  // ══════════════════════════════════════════════════════════
  //  GIFT
  // ══════════════════════════════════════════════════════════
  giftstachel:     { name:"Giftstachel",     type:"Poison",   pwr:15,  acc:100, pp:35, effect:{type:"poison",chance:0.3} },
  //
  // Acid → Säure
  saeureschwall:   { name:"Säure",           type:"Poison",   pwr:40,  acc:100, pp:30, effect:{type:"spd-1",chance:0.1} },
  //
  // Poison Gas → Giftwolke
  giftgas:         { name:"Giftwolke",       type:"Poison",   pwr:0,   acc:85,  pp:40, effect:{type:"poison",target:"foe"} },
  toxin:           { name:"Toxin",           type:"Poison",   pwr:0,   acc:90,  pp:10, effect:{type:"poison",target:"foe"} },
  //
  smog:            { name:"Smog",            type:"Poison",   pwr:20,  acc:70,  pp:20, effect:{type:"poison",chance:0.4} },
  schlammbad:      { name:"Schlammbad",      type:"Poison",   pwr:65,  acc:100, pp:20, effect:{type:"poison",chance:0.3} },
  saeured:         { name:"Säurepanzer",     type:"Poison",   pwr:0,   acc:100, pp:40, effect:{type:"def+2",target:"self"} },
  giftblick:       { name:"Giftblick",       type:"Normal",   pwr:0,   acc:75,  pp:30, effect:{type:"paralysis",target:"foe"} },

  // ══════════════════════════════════════════════════════════
  //  KÄFER
  // ══════════════════════════════════════════════════════════
  // Twineedle → Duonadel
  doppelnadler:    { name:"Duonadel",        type:"Bug",      pwr:25,  acc:100, pp:20, effect:{type:"poison",chance:0.2}, hits:[2,2] },
  //
  // Pin Missile → Nadelrakete
  nadelrakete:     { name:"Nadelrakete",     type:"Bug",      pwr:14,  acc:85,  pp:20, effect:null, hits:[2,5] },
  //
  // String Shot → Fadenschuß
  fadenschuss:     { name:"Fadenschuß",      type:"Bug",      pwr:0,   acc:95,  pp:40, effect:{type:"spe-1",target:"foe"} },
  faedenschuss:    { name:"Fadenschuß",      type:"Bug",      pwr:0,   acc:95,  pp:40, effect:{type:"spe-1",target:"foe"} },

  // ══════════════════════════════════════════════════════════
  //  BODEN / GESTEIN
  // ══════════════════════════════════════════════════════════
  erdbeben:        { name:"Erdbeben",        type:"Ground",   pwr:100, acc:100, pp:10, effect:null },
  //
  // Seismic Toss → Geowurf
  erdwurf:         { name:"Geowurf",         type:"Fighting", pwr:0,   acc:100, pp:20, effect:null },
  //
  // Rock Throw → Steinwurf
  felswurf:        { name:"Steinwurf",       type:"Rock",     pwr:50,  acc:65,  pp:15, effect:null },
  //
  // Rock Slide → Steinhagel
  steinschlag:     { name:"Steinhagel",      type:"Rock",     pwr:75,  acc:90,  pp:10, effect:{type:"flinch",chance:0.3} },
  //
  geofissur:       { name:"Geofissur",       type:"Ground",   pwr:0,   acc:30,  pp:5,  effect:null },

  // ══════════════════════════════════════════════════════════
  //  KAMPF
  // ══════════════════════════════════════════════════════════
  // Karate Chop → Karateschlag (Normal in Gen 1)
  karateschlag:    { name:"Karateschlag",    type:"Normal",   pwr:50,  acc:100, pp:25, effect:null, highCrit:true },
  doppelkick:      { name:"Doppelkick",      type:"Fighting", pwr:30,  acc:100, pp:30, effect:null, hits:[2,2] },
  //
  // Focus Energy → Energiefokus
  fokustreffer:    { name:"Energiefokus",    type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"crit+",target:"self"} },
  //
  konter:          { name:"Konter",          type:"Fighting", pwr:0,   acc:100, pp:20, effect:null },
  geowurf_k:       { name:"Geowurf",         type:"Fighting", pwr:0,   acc:100, pp:20, effect:null },
  sprungkick:      { name:"Sprungkick",      type:"Fighting", pwr:70,  acc:95,  pp:25, effect:null },
  turmkick:        { name:"Turmkick",        type:"Fighting", pwr:85,  acc:90,  pp:20, effect:null },
  fegekick:        { name:"Fegekick",        type:"Fighting", pwr:60,  acc:85,  pp:15, effect:{type:"flinch",chance:0.3} },
  fusskick:        { name:"Fußkick",         type:"Fighting", pwr:50,  acc:90,  pp:30, effect:{type:"flinch",chance:0.3} },
  ueberroller:     { name:"Überroller",      type:"Fighting", pwr:80,  acc:80,  pp:25, effect:null },

  // ══════════════════════════════════════════════════════════
  //  FLUG
  // ══════════════════════════════════════════════════════════
  // Gust → Windstoß
  windstoss:       { name:"Windstoß",        type:"Normal",   pwr:40,  acc:100, pp:35, effect:null },
  //
  fluegelschlag:   { name:"Flügelschlag",    type:"Flying",   pwr:35,  acc:100, pp:35, effect:null },
  bohrschnabel:    { name:"Bohrschnabel",    type:"Flying",   pwr:80,  acc:100, pp:20, effect:null },
  fluegel:         { name:"Fliegen",         type:"Flying",   pwr:70,  acc:95,  pp:15, effect:null },
  spiegeltrick:    { name:"Spiegeltrick",    type:"Normal",   pwr:0,   acc:100, pp:20, effect:null },
  himmelsfeger:    { name:"Himmelsfeger",    type:"Flying",   pwr:140, acc:90,  pp:5,  effect:null, charge:true },
  brueller:        { name:"Brüller",         type:"Normal",   pwr:0,   acc:100, pp:20, effect:null },
  wirbelwind2:     { name:"Wirbelwind",      type:"Normal",   pwr:0,   acc:100, pp:20, effect:null },

  // ══════════════════════════════════════════════════════════
  //  GEIST
  // ══════════════════════════════════════════════════════════
  // Lick → Schlecker
  zungenangriff:   { name:"Schlecker",       type:"Ghost",    pwr:20,  acc:100, pp:30, effect:{type:"paralysis",chance:0.3} },
  //
  // Night Shade → Nachtnebel
  nachtschatten:   { name:"Nachtnebel",      type:"Ghost",    pwr:0,   acc:100, pp:15, effect:null },

  // ══════════════════════════════════════════════════════════
  //  WASSER (Status/Diverse)
  // ══════════════════════════════════════════════════════════
  // Withdraw → Panzerschutz
  ausharren:       { name:"Panzerschutz",    type:"Water",    pwr:0,   acc:100, pp:40, effect:{type:"def+1",target:"self"} },
  //
  // Clamp → Klammer
  klammern:        { name:"Klammer",         type:"Water",    pwr:35,  acc:75,  pp:10, effect:null },
};

// ── Gen-1 Typ-Chart ──────────────────────────────────────────
var TYPE_CHART = {
  Normal:   { Rock:0.5, Ghost:0 },
  Fire:     { Fire:0.5, Water:0.5, Grass:2, Ice:2, Bug:2, Rock:0.5, Dragon:0.5 },
  Water:    { Fire:2, Water:0.5, Grass:0.5, Ground:2, Rock:2, Dragon:0.5 },
  Grass:    { Fire:0.5, Water:2, Grass:0.5, Poison:0.5, Ground:2, Flying:0.5, Bug:0.5, Rock:2, Dragon:0.5 },
  Electric: { Water:2, Grass:0.5, Electric:0.5, Ground:0, Flying:2, Dragon:0.5 },
  Ice:      { Water:0.5, Grass:2, Ice:0.5, Ground:2, Flying:2, Dragon:2 },
  Fighting: { Normal:2, Ice:2, Poison:0.5, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:2, Ghost:0 },
  Poison:   { Grass:2, Poison:0.5, Ground:0.5, Bug:2, Rock:0.5, Ghost:0.5 },
  Ground:   { Fire:2, Electric:2, Grass:0.5, Poison:2, Flying:0, Bug:0.5, Rock:2 },
  Flying:   { Grass:2, Electric:0.5, Fighting:2, Bug:2, Rock:0.5 },
  Psychic:  { Fighting:2, Poison:2, Psychic:0.5, Ghost:0 },
  Bug:      { Fire:0.5, Grass:2, Fighting:0.5, Flying:0.5, Psychic:2, Ghost:0.5 },
  Rock:     { Fire:2, Ice:2, Fighting:0.5, Ground:0.5, Flying:2, Bug:2 },
  Ghost:    { Normal:0, Psychic:0 },
  Dragon:   { Dragon:2 },
};

function getTypeEffectiveness(atkType, defTypes) {
  var mult = 1;
  defTypes.forEach(function(dt) {
    var chart = TYPE_CHART[atkType];
    if (chart && chart[dt] !== undefined) mult *= chart[dt];
  });
  return mult;
}

function isPhysical(type) { return PHYSICAL_TYPES.has(type); }
