// ═══════════════════════════════════════════════════════════════
//  moves.js — Attacken-Datenbank (Gen 1, Deutsche Namen)
// ═══════════════════════════════════════════════════════════════
// Gen-1-Regel: Typ bestimmt physisch/speziell
// Physical: Normal,Fighting,Flying,Poison,Ground,Rock,Bug,Ghost
// Special:  Fire,Water,Grass,Electric,Ice,Psychic,Dragon

var PHYSICAL_TYPES = new Set(["Normal","Fighting","Flying","Poison","Ground","Rock","Bug","Ghost"]);

var MOVES = {
  // ── Struggle (Fallback wenn alle PP leer) ──────────────────
  struggle:        { name:"Kräftemessen",   type:"Normal",   pwr:50,  acc:100, pp:999, effect:null },

  // ── Normal – Angriff ──────────────────────────────────────
  tackle:          { name:"Tackle",          type:"Normal",   pwr:35,  acc:95,  pp:35, effect:null },
  kratzer:         { name:"Kratzer",         type:"Normal",   pwr:40,  acc:100, pp:35, effect:null },
  pfund:           { name:"Pfund",           type:"Normal",   pwr:40,  acc:100, pp:35, effect:null },
  piks:            { name:"Pikser",          type:"Normal",   pwr:35,  acc:100, pp:35, effect:null },
  schnellangriff:  { name:"Schnellangriff",  type:"Normal",   pwr:40,  acc:100, pp:30, effect:null, priority:1 },
  ruckzuckhieb:    { name:"Ruckzuckhieb",    type:"Normal",   pwr:40,  acc:100, pp:30, effect:null, priority:1 },
  koerperrammler:  { name:"Körperrammler",   type:"Normal",   pwr:85,  acc:100, pp:15, effect:{type:"paralysis",chance:0.3} },
  megahieb:        { name:"Megahieb",        type:"Normal",   pwr:80,  acc:85,  pp:20, effect:null },
  hyperstrahl:     { name:"Hyperstrahl",     type:"Normal",   pwr:150, acc:90,  pp:5,  effect:null },
  schlitzer:       { name:"Schlitzer",       type:"Normal",   pwr:70,  acc:100, pp:20, effect:null, highCrit:true },
  biss:            { name:"Biss",            type:"Normal",   pwr:60,  acc:100, pp:25, effect:{type:"flinch",chance:0.3} },
  stampfer:        { name:"Stampfer",        type:"Normal",   pwr:65,  acc:100, pp:20, effect:{type:"flinch",chance:0.3} },
  einwickler:      { name:"Einwickler",      type:"Normal",   pwr:15,  acc:85,  pp:20, effect:null },
  platscher:       { name:"Platscher",       type:"Normal",   pwr:40,  acc:100, pp:40, effect:null },
  dauerklaps:      { name:"Dauerklaps",      type:"Normal",   pwr:15,  acc:85,  pp:10, effect:null, hits:[2,5] },
  raserei:         { name:"Raserei",         type:"Normal",   pwr:20,  acc:100, pp:20, effect:null },
  schaedelhieb:    { name:"Schädelhieb",     type:"Normal",   pwr:100, acc:100, pp:15, effect:null, highCrit:true },
  knochen:         { name:"Knochen",         type:"Normal",   pwr:50,  acc:100, pp:35, effect:null },
  klauen:          { name:"Klauenhieb",      type:"Normal",   pwr:18,  acc:80,  pp:15, effect:null, hits:[2,5] },
  hornattacke:     { name:"Hornattacke",     type:"Normal",   pwr:65,  acc:100, pp:25, effect:null },
  beissattacke:    { name:"Beißattacke",     type:"Normal",   pwr:35,  acc:100, pp:35, effect:null },
  klinge:          { name:"Klinge",          type:"Normal",   pwr:55,  acc:100, pp:25, effect:null },
  schnelligkeit:   { name:"Schnelligkeit",   type:"Normal",   pwr:35,  acc:100, pp:35, effect:null },
  windhose:        { name:"Windhose",        type:"Normal",   pwr:40,  acc:85,  pp:15, effect:null },
  kamikazeangriff: { name:"Kamikaze",        type:"Normal",   pwr:120, acc:100, pp:5,  effect:null },
  klaps:           { name:"Klaps",           type:"Normal",   pwr:40,  acc:100, pp:35, effect:null },
  schwatzangriff:  { name:"Schwatzangriff",  type:"Normal",   pwr:40,  acc:100, pp:20, effect:null },
  zahltag:         { name:"Zahltag",         type:"Normal",   pwr:40,  acc:100, pp:20, effect:null },
  egg_bomb:        { name:"Eierwurf",        type:"Normal",   pwr:100, acc:75,  pp:10, effect:null },
  wutangriff:      { name:"Wutangriff",      type:"Normal",   pwr:18,  acc:85,  pp:20, effect:null, hits:[2,5] },
  knochenboomerang:{ name:"Knochenboomerang",type:"Ground",   pwr:50,  acc:90,  pp:10, effect:null, hits:[2,2] },
  // Normal – Status
  knurrer:         { name:"Knurrer",         type:"Normal",   pwr:0,   acc:100, pp:40, effect:{type:"atk-1",target:"foe"} },
  schwanzwedler:   { name:"Schwanzwedler",   type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"def-1",target:"foe"} },
  starren:         { name:"Starren",         type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"def-1",target:"foe"} },
  sandwirbel:      { name:"Sandwirbel",      type:"Normal",   pwr:0,   acc:100, pp:15, effect:{type:"acc-1",target:"foe"} },
  haertner:        { name:"Härtner",         type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"def+1",target:"self"} },
  wachstum:        { name:"Wachstum",        type:"Normal",   pwr:0,   acc:100, pp:40, effect:{type:"spa+1",target:"self"} },
  minimieren:      { name:"Minimieren",      type:"Normal",   pwr:0,   acc:100, pp:20, effect:{type:"eva+1",target:"self"} },
  singen:          { name:"Singen",          type:"Normal",   pwr:0,   acc:55,  pp:15, effect:{type:"sleep",target:"foe"} },
  regeneration:    { name:"Regeneration",    type:"Normal",   pwr:0,   acc:100, pp:20, effect:{type:"heal50",target:"self"} },
  teleport:        { name:"Teleport",        type:"Psychic",  pwr:0,   acc:100, pp:20, effect:null },
  verwandlung:     { name:"Verwandlung",     type:"Normal",   pwr:0,   acc:100, pp:10, effect:null },
  metronom:        { name:"Metronom",        type:"Normal",   pwr:0,   acc:100, pp:10, effect:null },
  schwert:         { name:"Schwertattacke",  type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"atk+2",target:"self"} },
  swordsdance:     { name:"Schwertattacke",  type:"Normal",   pwr:0,   acc:100, pp:30, effect:{type:"atk+2",target:"self"} },
  selbstzerstoerer:{ name:"Explosion",       type:"Normal",   pwr:170, acc:100, pp:5,  effect:{type:"selfdestruct"} },
  // Fire
  glut:            { name:"Glut",            type:"Fire",     pwr:40,  acc:100, pp:25, effect:{type:"burn",chance:0.1} },
  flammenwurf:     { name:"Flammenwurf",     type:"Fire",     pwr:95,  acc:100, pp:15, effect:{type:"burn",chance:0.1} },
  feuerblitz:      { name:"Feuerblitz",      type:"Fire",     pwr:120, acc:85,  pp:5,  effect:{type:"burn",chance:0.3} },
  feuerring:       { name:"Feuerring",       type:"Fire",     pwr:15,  acc:70,  pp:15, effect:null },
  // Water
  blubber:         { name:"Blubber",         type:"Water",    pwr:20,  acc:100, pp:30, effect:{type:"spe-1",chance:0.1} },
  aquaknarre:      { name:"Aquaknarre",      type:"Water",    pwr:40,  acc:100, pp:25, effect:null },
  blubberstrahl:   { name:"Blubberstrahl",   type:"Water",    pwr:65,  acc:100, pp:20, effect:{type:"spe-1",chance:0.1} },
  surfer:          { name:"Surfer",          type:"Water",    pwr:95,  acc:100, pp:15, effect:null },
  hydrokanone:     { name:"Hydrokanone",     type:"Water",    pwr:120, acc:80,  pp:5,  effect:null },
  krabbhammer:     { name:"Krabbhammer",     type:"Water",    pwr:90,  acc:85,  pp:10, effect:null, highCrit:true },
  // Grass
  rankenhieb:      { name:"Rankenhieb",      type:"Grass",    pwr:35,  acc:100, pp:25, effect:null },
  rasierblatt:     { name:"Rasierblatt",     type:"Grass",    pwr:55,  acc:95,  pp:25, effect:null, highCrit:true },
  razorblatt:      { name:"Rasierblatt",     type:"Grass",    pwr:55,  acc:95,  pp:25, effect:null, highCrit:true },
  solarstrahl:     { name:"Solarstrahl",     type:"Grass",    pwr:120, acc:100, pp:10, effect:null, charge:true },
  blutsauger:      { name:"Blutsauger",      type:"Bug",      pwr:20,  acc:100, pp:15, effect:{type:"drain"} },
  schlafpulver:    { name:"Schlafpulver",    type:"Grass",    pwr:0,   acc:75,  pp:15, effect:{type:"sleep",target:"foe"} },
  paralysipora:    { name:"Paralysipora",    type:"Grass",    pwr:0,   acc:75,  pp:30, effect:{type:"paralysis",target:"foe"} },
  giftpuder:       { name:"Giftpuder",       type:"Poison",   pwr:0,   acc:75,  pp:35, effect:{type:"poison",target:"foe"} },
  // Electric
  donnerschock:    { name:"Donnerschock",    type:"Electric", pwr:40,  acc:100, pp:30, effect:{type:"paralysis",chance:0.1} },
  donnerblitz:     { name:"Donnerblitz",     type:"Electric", pwr:95,  acc:100, pp:15, effect:{type:"paralysis",chance:0.1} },
  donner:          { name:"Donner",          type:"Electric", pwr:120, acc:70,  pp:10, effect:{type:"paralysis",chance:0.3} },
  donnerwelle:     { name:"Donnerwelle",     type:"Electric", pwr:0,   acc:100, pp:20, effect:{type:"paralysis",target:"foe"} },
  // Ice
  eisstrahl:       { name:"Eisstrahl",       type:"Ice",      pwr:95,  acc:100, pp:10, effect:{type:"freeze",chance:0.1} },
  blizzard:        { name:"Blizzard",        type:"Ice",      pwr:120, acc:70,  pp:5,  effect:{type:"freeze",chance:0.3} },
  aurorastrahl:    { name:"Aurorastrahl",    type:"Ice",      pwr:65,  acc:100, pp:20, effect:{type:"atk-1",chance:0.1} },
  eisschlag:       { name:"Eisschlag",       type:"Ice",      pwr:75,  acc:100, pp:15, effect:{type:"freeze",chance:0.1} },
  // Psychic
  konfusion:       { name:"Konfusion",       type:"Psychic",  pwr:50,  acc:100, pp:25, effect:{type:"confuse",chance:0.1} },
  psych:           { name:"Psychokinese",    type:"Psychic",  pwr:90,  acc:100, pp:10, effect:{type:"spd-1",chance:0.1} },
  hypnose:         { name:"Hypnose",         type:"Psychic",  pwr:0,   acc:60,  pp:20, effect:{type:"sleep",target:"foe"} },
  agilitaet:       { name:"Agilität",        type:"Psychic",  pwr:0,   acc:100, pp:30, effect:{type:"spe+2",target:"self"} },
  amnesie:         { name:"Amnesie",         type:"Psychic",  pwr:0,   acc:100, pp:20, effect:{type:"spd+2",target:"self"} },
  barriere:        { name:"Barriere",        type:"Psychic",  pwr:0,   acc:100, pp:30, effect:{type:"def+2",target:"self"} },
  erholung:        { name:"Erholung",        type:"Psychic",  pwr:0,   acc:100, pp:10, effect:{type:"fullheal",target:"self"} },
  // Poison
  giftstachel:     { name:"Giftstachel",     type:"Poison",   pwr:15,  acc:100, pp:35, effect:{type:"poison",chance:0.3} },
  saeureschwall:   { name:"Säureschwall",    type:"Poison",   pwr:40,  acc:100, pp:30, effect:{type:"spd-1",chance:0.1} },
  giftgas:         { name:"Giftgas",         type:"Poison",   pwr:0,   acc:85,  pp:40, effect:{type:"poison",target:"foe"} },
  smog:            { name:"Smog",            type:"Poison",   pwr:20,  acc:70,  pp:20, effect:{type:"poison",chance:0.4} },
  doppelnadler:    { name:"Doppelnadler",    type:"Bug",      pwr:25,  acc:100, pp:20, effect:{type:"poison",chance:0.2}, hits:[2,2] },
  // Ground / Rock
  erdbeben:        { name:"Erdbeben",        type:"Ground",   pwr:100, acc:100, pp:10, effect:null },
  erdwurf:         { name:"Erdwurf",         type:"Fighting", pwr:0,   acc:100, pp:20, effect:null },
  felswurf:        { name:"Felswurf",        type:"Rock",     pwr:50,  acc:65,  pp:15, effect:null },
  steinschlag:     { name:"Steinschlag",     type:"Rock",     pwr:75,  acc:90,  pp:10, effect:{type:"flinch",chance:0.3} },
  // Fighting
  karateschlag:    { name:"Karateschlag",    type:"Normal",   pwr:50,  acc:100, pp:25, effect:null, highCrit:true },
  doppelkick:      { name:"Doppelkick",      type:"Fighting", pwr:30,  acc:100, pp:30, effect:null, hits:[2,2] },
  fokustreffer:    { name:"Fokustreffer",    type:"Fighting", pwr:70,  acc:85,  pp:20, effect:null },
  // Flying
  windstoss:       { name:"Windstoss",       type:"Normal",   pwr:40,  acc:100, pp:35, effect:null },
  fluegelschlag:   { name:"Flügelschlag",    type:"Normal",   pwr:35,  acc:100, pp:35, effect:null },
  bohrschnabel:    { name:"Bohrschnabel",    type:"Flying",   pwr:80,  acc:100, pp:20, effect:null },
  fluegel:         { name:"Fliegen",         type:"Flying",   pwr:70,  acc:95,  pp:15, effect:null },
  // Bug
  fadenschuss:     { name:"Fadenschuss",     type:"Bug",      pwr:0,   acc:95,  pp:40, effect:{type:"spe-1",target:"foe"} },
  faedenschuss:    { name:"Fadenschuss",     type:"Bug",      pwr:0,   acc:95,  pp:40, effect:{type:"spe-1",target:"foe"} },
  // Ghost
  zungenangriff:   { name:"Zungenangriff",   type:"Ghost",    pwr:20,  acc:100, pp:30, effect:{type:"paralysis",chance:0.3} },
  nachtschatten:   { name:"Nachtschatten",   type:"Ghost",    pwr:0,   acc:100, pp:15, effect:null },
  // Water misc
  ausharren:       { name:"Ausharren",       type:"Water",    pwr:0,   acc:100, pp:40, effect:{type:"def+1",target:"self"} },
  klammern:        { name:"Klammern",        type:"Normal",   pwr:35,  acc:85,  pp:20, effect:null },
  mist:            { name:"Nebel",           type:"Ice",      pwr:0,   acc:100, pp:30, effect:null },
  sonicwelle:      { name:"Sonicwelle",      type:"Normal",   pwr:0,   acc:80,  pp:20, effect:null },
  schall:          { name:"Schallwelle",     type:"Normal",   pwr:40,  acc:100, pp:20, effect:null },
};

// Gen-1 Typ-Chart
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
