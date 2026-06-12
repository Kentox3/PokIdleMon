// ═══════════════════════════════════════════════════════════════
//  app.js — Hauptcontroller: Navigation, Kampf-Loop, Tabs
// ═══════════════════════════════════════════════════════════════

var STAGE_INTERVALL = null;
var KAMPF_INTERVALL = null;
var STAGE_TICK_MS   = 5000;
var KAMPF_TICK_MS   = 2200;
var _wartetAufInput = false;
var _inStadt        = false;
var _animLaeuft     = false;
var _autoKampf      = true;
var _offlineModalCallback = null;

// ── Spiel starten ─────────────────────────────────────────────
document.addEventListener("dataReady", function() { auth_init(); });

document.addEventListener("gameReady", function(e) {
  var d = e.detail;
  if (d.isNew) { zeigStarterWahl(); return; }
  dbHole(spielerPfad(d.uid)).then(function(gespeichert) {
    if (!gespeichert || !gespeichert.party || gespeichert.party.length === 0) {
      zeigStarterWahl(); return;
    }
    var res = ladeSpiel(d.uid, gespeichert);
    spielStarten(res.wegSekunden);
  }).catch(function() { zeigStarterWahl(); });
});

if (typeof loadAllData === "function") loadAllData();

function istLineareReiseZone(zone) {
  return !!(zone && zone.etappen && ["route", "dungeon", "see"].includes(zone.typ) && (zone.verbindungen || []).length === 2);
}

function routenZielVerbindung(zone) {
  if (!istLineareReiseZone(zone)) return null;
  return (zone.verbindungen || [])[STATE.richtung === "rueckwaerts" ? 0 : 1] || null;
}

function bereiteLineareRouteVor(zone, vonZoneId) {
  if (!istLineareReiseZone(zone)) {
    STATE.richtung = null;
    STATE.routeZiel = null;
    STATE.etappe = 1;
    return;
  }
  var verbindungen = zone.verbindungen || [];
  if (vonZoneId === verbindungen[1].zoneId) {
    STATE.richtung = "rueckwaerts";
    STATE.routeZiel = verbindungen[0].zoneId;
    STATE.etappe = zone.etappen;
  } else {
    STATE.richtung = "vorwaerts";
    STATE.routeZiel = verbindungen[1].zoneId;
    STATE.etappe = 1;
  }
}

window.routeRichtungWaehlen = function(zielZoneId) {
  if (!STATE) return;
  var zone = getZone(STATE.zone);
  if (!istLineareReiseZone(zone)) return;
  var verbindungen = zone.verbindungen || [];
  if (zielZoneId === verbindungen[0].zoneId) {
    if (STATE.etappe <= 1) { navigiereZu(verbindungen[0].zoneId); return; }
    STATE.richtung = "rueckwaerts";
    STATE.routeZiel = verbindungen[0].zoneId;
  } else if (zielZoneId === verbindungen[1].zoneId) {
    if (STATE.etappe >= zone.etappen) { navigiereZu(verbindungen[1].zoneId); return; }
    STATE.richtung = "vorwaerts";
    STATE.routeZiel = verbindungen[1].zoneId;
  } else {
    return;
  }
  rendereStufenInfo();
  if (typeof rendereWeltTab === "function") rendereWeltTab();
  speichern();
};

function onStarterGewaehlt(trainerName, starterDexId) {
  var uid = localStorage.getItem("pokidlemon_uid") || ("u" + Date.now());
  neuesSpiel(uid, trainerName, starterDexId);
  zeigToast("Du hast " + ((getPkmn(starterDexId)||{}).name||"?") + " als Starter gewählt!");
  speichern();
  spielStarten(0);
}

function spielStarten(wegSekunden) {
  zeigScreen("gameScreen");
  aktualisiereHUD();
  if (STATE.zone === "route3_west") STATE.zone = "route2_north";
  if (STATE.prevZone === "route3_west") STATE.prevZone = "route2_north";
  markiereBesucht(STATE.zone);
  var zone = getZone(STATE.zone);
  if (!zone) { STATE.zone = "alabastia"; STATE.etappe = 1; zone = getZone("alabastia"); }
  if (!zone) { console.error("[app] Alabastia nicht in WORLD – world.json geladen?"); return; }
  if (istLineareReiseZone(zone) && !STATE.richtung) bereiteLineareRouteVor(zone, STATE.prevZone);
  rendereZoneBg(zone);
  rendereSpielerSprites();
  rendereStufenInfo();
  var starteAktuelleZone = function() {
    if (zone.typ === "stadt" || zone.typ === "wachposten") stadtBetreten(zone);
    else stufenLoopStarten();
  };
  if (wegSekunden > 60) {
    clearInterval(STAGE_INTERVALL);
    clearInterval(KAMPF_INTERVALL);
    _wartetAufInput = true;
    zeigOfflineBonus(wegSekunden, starteAktuelleZone);
  } else {
    starteAktuelleZone();
  }
  _updateAutoKampfBtn();
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
}

// ── Navigation ────────────────────────────────────────────────
function navigiereZu(zoneId) {
  clearInterval(STAGE_INTERVALL);
  clearInterval(KAMPF_INTERVALL);
  if (typeof setzeAngelSzene === "function") setzeAngelSzene(false);
  _wartetAufInput = false; _inStadt = false; _animLaeuft = false;
  STATE.gebaeude = null;
  versteckeKampfUI();
  rendereGegnerSprite(null, false);
  var vorigeZone = STATE.zone || null;
  STATE.zone = zoneId; STATE.etappe = 1;
  STATE.prevZone = vorigeZone;
  markiereBesucht(zoneId);
  var zone = getZone(zoneId);
  if (zone) bereiteLineareRouteVor(zone, vorigeZone);
  if (zone && zone.manualBattle) { _autoKampf = false; _updateAutoKampfBtn(); }
  if (zone) rendereZoneBg(zone);
  rendereSpielerSprites();
  rendereStufenInfo();
  speichern();
  if (zone && (zone.typ === "stadt" || zone.typ === "wachposten")) {
    stadtBetreten(zone);
  } else {
    wechsleTab("Welt");
    rendereWeltTab();
    stufenLoopStarten();
  }
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
}

function stadtBetreten(zone) {
  clearInterval(STAGE_INTERVALL);
  clearInterval(KAMPF_INTERVALL);
  if (typeof setzeAngelSzene === "function") setzeAngelSzene(false);
  _wartetAufInput = true; _inStadt = true; _animLaeuft = false;
  if (zone && zone.typ === "stadt") STATE.respawnZone = zone.id;
  STATE.gebaeude = null;
  versteckeKampfUI();
  rendereGegnerSprite(null, false);
  if (!trainerBesiegt(zone.id, "eingang")) {
    markiereTrainerBesiegt(zone.id, "eingang");
    vollHeilen();
    rendereSpielerSprites();
    aktualisiereHUD();
  }
  wechsleTab("Welt");
  rendereStadtHub(zone);
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  speichern();
  STAGE_INTERVALL = setInterval(verarbeiteEtappe, STAGE_TICK_MS);
}

window.verbindungBetreten = function(zoneId) {
  var aktuelleZone = getZone(STATE.zone);
  var verb = aktuelleZone && aktuelleZone.verbindungen
    ? aktuelleZone.verbindungen.find(v => v.zoneId === zoneId) : null;
  if (verb && verb.bedingung && !checkBedingung(verb.bedingung, STATE)) {
    zeigToast((verb.gesperrtText || "Gesperrt!").replace("{badges}", STATE.orden || 0), 4000);
    return;
  }
  navigiereZu(zoneId);
};

// ── Stufen-Loop ───────────────────────────────────────────────
function stufenLoopStarten() {
  clearInterval(STAGE_INTERVALL);
  clearInterval(KAMPF_INTERVALL);
  if (typeof setzeAngelSzene === "function") setzeAngelSzene(false);
  _wartetAufInput = false; _inStadt = false; _animLaeuft = false;
  STATE.gebaeude = null;
  versteckeKampfUI();
  rendereGegnerSprite(null, false);
  var ms = (typeof getEffektivenTick === "function") ? getEffektivenTick() : STAGE_TICK_MS;
  var zone = getZone(STATE.zone);
  if (zone && zone.manualBattle) { _autoKampf = false; _updateAutoKampfBtn(); }
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  if (zone && zone.typ !== "stadt" && zone.typ !== "wachposten" && typeof rendereWeltTab === "function") {
    rendereWeltTab();
  }
  STAGE_INTERVALL = setInterval(verarbeiteEtappe, ms);
}

function verarbeiteEtappe() {
  if (!STATE || _wartetAufInput) return;
  var zone = getZone(STATE.zone);
  if (!zone) return;

  if (zone.typ === "stadt" || zone.typ === "wachposten") {
    clearInterval(STAGE_INTERVALL);
    markiereBesucht(zone.id);
    stadtBetreten(zone);
    return;
  }

  // Waypoints
  if (zone.waypoints) {
    var wp = zone.waypoints.find(w =>
      w.etappe === STATE.etappe &&
      waypointNochOffen(w) &&
      waypointAktiv(w)
    );
    if (wp) {
      switch (wp.typ) {
        case "rival_fight":     triggereRivalKampf(zone, wp); return;
        case "fossil_choice":   clearInterval(STAGE_INTERVALL); _wartetAufInput=true; rendereFossilWahl(zone, wp); return;
        case "story_gate":
          zeigToast(wp.text || "Der Weg ist versperrt.", 4000);
          STATE.etappe = Math.max(1, (wp.zurueckEtappe || wp.etappe - 1));
          rendereStufenInfo();
          speichern();
          return;
        case "relaxo_block":    clearInterval(STAGE_INTERVALL); _wartetAufInput=true; rendereRelaxoBlock(zone, wp); return;
        case "mewtu_encounter":
        case "legendary_encounter":
          clearInterval(STAGE_INTERVALL); _wartetAufInput=true; triggereLegendary(zone, wp); return;
        case "hm_geschenk":
          STATE.items[wp.item] = (STATE.items[wp.item]||0) + 1;
          setzeFlag(wp.flagId); zeigToast("📀 " + wp.itemName + " erhalten!", 4000); speichern(); break;
        case "event":
          if (wp.geld) { STATE.geld += wp.geld; aktualisiereHUD(); }
          if (wp.item) STATE.items[wp.item] = (STATE.items[wp.item]||0) + 1;
          (wp.setFlags || []).forEach(setzeFlag);
          setzeFlag(wp.flagId); if (wp.text) zeigToast(wp.text, 4000); speichern(); break;
      }
    }
  }

  // Trainer
  var trainer = zone.trainer && zone.trainer.find(t =>
    t.etappe === STATE.etappe &&
    (!t.bedingung || checkBedingung(t.bedingung, STATE))
  );
  if (trainer && !trainerBesiegt(zone.id, STATE.etappe)) {
    triggereTrainerKampf(trainer, zone); return;
  }

  // Gym-Boss
  if (zone.boss && zone.boss.etappe === STATE.etappe && !trainerBesiegt(zone.id, "boss")) {
    triggereGymBoss(zone); return;
  }

  // Wild encounter (rate check here, rollWildPkmn hat keinen eigenen check)
  if (zone.wildePkmn && zone.wildePkmn.length > 0 && Math.random() < (zone.begegnung / 100)) {
    var wild = rollWildPkmn(zone);
    if (wild) { triggereWildKampf(wild, zone); return; }
  }

  naechsteEtappe(zone);
}

function waypointAktiv(wp) {
  if (wp.blockWenn && checkBedingung(wp.blockWenn, STATE)) return false;
  if (wp.bedingung && !checkBedingung(wp.bedingung, STATE)) return false;
  return true;
}

function waypointNochOffen(wp) {
  if (!wp) return false;
  if (wp.typ === "legendary_encounter" || wp.typ === "mewtu_encounter") {
    if (STATE.gefangen && STATE.gefangen[wp.dexId]) return false;
    var respawns = STATE.legendaryRespawns || {};
    var respawnAt = Number(respawns[wp.flagId] || 0);
    return !respawnAt || Date.now() >= respawnAt;
  }
  return !flagGesetzt(wp.flagId);
}

function planeLegendaryRespawn(flagId) {
  if (!flagId || !STATE) return;
  if (!STATE.legendaryRespawns) STATE.legendaryRespawns = {};
  STATE.legendaryRespawns[flagId] = Date.now() + 24 * 60 * 60 * 1000;
}

function clearLegendaryRespawn(flagId) {
  if (!flagId || !STATE || !STATE.legendaryRespawns) return;
  delete STATE.legendaryRespawns[flagId];
}

function naechsteEtappe(zone) {
  var rueckwaerts = istLineareReiseZone(zone) && STATE.richtung === "rueckwaerts";
  STATE.etappe += rueckwaerts ? -1 : 1;
  rendereStufenInfo();
  if (rueckwaerts ? STATE.etappe < 1 : STATE.etappe > zone.etappen) {
    if (zone.typ === "gym" && zone.returnTo) { navigiereZu(zone.returnTo); return; }
    if (istLineareReiseZone(zone)) {
      var zielLinear = routenZielVerbindung(zone);
      if (zielLinear && zielLinear.bedingung && !checkBedingung(zielLinear.bedingung, STATE)) {
        STATE.etappe = rueckwaerts ? 1 : zone.etappen;
        zeigToast((zielLinear.gesperrtText || "Gesperrt!").replace("{badges}", STATE.orden || 0), 4000);
        return;
      }
      if (zielLinear) { navigiereZu(zielLinear.zoneId); return; }
    }
    STATE.etappe = 1;
    var verbindungen = zone.verbindungen || [];
    var autoNextId   = zone.autoNext && zone.autoNext[STATE.prevZone || ""];
    var ziel = autoNextId ? verbindungen.find(v => v.zoneId === autoNextId) : null;
    if (ziel && ziel.bedingung && !checkBedingung(ziel.bedingung, STATE)) ziel = null;
    if (!ziel) {
      var moegliche = verbindungen.filter(v =>
        v.zoneId !== STATE.prevZone && (!v.bedingung || checkBedingung(v.bedingung, STATE))
      );
      ziel = moegliche[0] || verbindungen.find(v => v.zoneId !== STATE.prevZone) || verbindungen[0];
    }
    if (ziel && ziel.bedingung && !checkBedingung(ziel.bedingung, STATE)) {
      zeigToast((ziel.gesperrtText || "Gesperrt!").replace("{badges}", STATE.orden || 0), 4000);
      return;
    }
    if (ziel) navigiereZu(ziel.zoneId);
  }
}

// ── Kampf-Trigger ─────────────────────────────────────────────
function triggereWildKampf(wildData, zone) {
  clearInterval(STAGE_INTERVALL);
  _wartetAufInput = true;
  kampfStarten("wild", wildData);
  // GUARD: Wenn Pokémon-Daten nicht geladen, Kampf überspringen
  if (!KAMPF || !KAMPF.gegner) {
    console.warn("[app] Wild-Begegnung: kein Gegner (pokemon.json geladen?)");
    _wartetAufInput = false;
    stufenLoopStarten();
    return;
  }
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  STATE.gesehen[wildData.dexId] = true;
  rendereGegnerSprite(KAMPF.gegner, true);
  zeigKampfUI(KAMPF.gegner);
  clearKampfLog();
  var pd = getPkmn(wildData.dexId);
  fuegeKampfLogHinzu("Ein wildes " + (pd ? pd.name : "#" + wildData.dexId) + " Lv." + wildData.level +
    " erscheint!" + (wildData.shiny ? " ✨ Shiny!" : ""));
  if (_autoKampf) kampfLoopStarten();
}

function rivalStarterLinie() {
  var starter = STATE && STATE.starter;
  if (starter === 4) return "squirtle";
  if (starter === 7) return "bulbasaur";
  return "charmander";
}

function rivalTeamFuerProfil(profile) {
  var linie = rivalStarterLinie();
  var teams = {
    oak_lab: {
      belohnung: 175,
      common: [],
      charmander: [{ id: 4, lv: 5 }],
      squirtle: [{ id: 7, lv: 5 }],
      bulbasaur: [{ id: 1, lv: 5 }]
    },
    route22_early: {
      belohnung: 280,
      common: [{ id: 16, lv: 9 }],
      charmander: [{ id: 4, lv: 8 }],
      squirtle: [{ id: 7, lv: 8 }],
      bulbasaur: [{ id: 1, lv: 8 }]
    },
    cerulean: {
      belohnung: 595,
      common: [{ id: 17, lv: 18 }, { id: 63, lv: 15 }, { id: 19, lv: 15 }],
      charmander: [{ id: 4, lv: 17 }],
      squirtle: [{ id: 7, lv: 17 }],
      bulbasaur: [{ id: 1, lv: 17 }]
    },
    ss_anne: {
      belohnung: 1300,
      common: [{ id: 17, lv: 19 }, { id: 20, lv: 16 }, { id: 64, lv: 18 }],
      charmander: [{ id: 5, lv: 20 }],
      squirtle: [{ id: 8, lv: 20 }],
      bulbasaur: [{ id: 2, lv: 20 }]
    },
    pokemon_tower: {
      belohnung: 1625,
      common: [{ id: 17, lv: 25 }],
      charmander: [{ id: 130, lv: 23 }, { id: 102, lv: 22 }, { id: 64, lv: 20 }, { id: 5, lv: 25 }],
      squirtle: [{ id: 58, lv: 23 }, { id: 102, lv: 22 }, { id: 64, lv: 20 }, { id: 8, lv: 25 }],
      bulbasaur: [{ id: 130, lv: 23 }, { id: 58, lv: 22 }, { id: 64, lv: 20 }, { id: 2, lv: 25 }]
    },
    silph: {
      belohnung: 2600,
      common: [{ id: 18, lv: 37 }],
      charmander: [{ id: 130, lv: 38 }, { id: 102, lv: 35 }, { id: 65, lv: 35 }, { id: 6, lv: 40 }],
      squirtle: [{ id: 58, lv: 38 }, { id: 102, lv: 35 }, { id: 65, lv: 35 }, { id: 9, lv: 40 }],
      bulbasaur: [{ id: 130, lv: 38 }, { id: 58, lv: 35 }, { id: 65, lv: 35 }, { id: 3, lv: 40 }]
    },
    route22_late: {
      belohnung: 3445,
      common: [{ id: 18, lv: 47 }, { id: 111, lv: 45 }],
      charmander: [{ id: 102, lv: 45 }, { id: 130, lv: 47 }, { id: 65, lv: 50 }, { id: 6, lv: 53 }],
      squirtle: [{ id: 58, lv: 45 }, { id: 102, lv: 47 }, { id: 65, lv: 50 }, { id: 9, lv: 53 }],
      bulbasaur: [{ id: 130, lv: 45 }, { id: 58, lv: 47 }, { id: 65, lv: 50 }, { id: 3, lv: 53 }]
    },
    champion: {
      belohnung: 6435,
      common: [{ id: 18, lv: 61 }, { id: 65, lv: 59 }, { id: 112, lv: 61 }],
      charmander: [{ id: 103, lv: 61 }, { id: 130, lv: 63 }, { id: 6, lv: 65 }],
      squirtle: [{ id: 59, lv: 61 }, { id: 103, lv: 63 }, { id: 9, lv: 65 }],
      bulbasaur: [{ id: 130, lv: 61 }, { id: 59, lv: 63 }, { id: 3, lv: 65 }]
    }
  };
  var def = teams[profile] || teams.route22_early;
  return {
    belohnung: def.belohnung,
    team: (def.common || []).concat(def[linie] || [])
  };
}

function rivalTrainerDaten(profile, extra) {
  var daten = rivalTeamFuerProfil(profile);
  var trainer = Object.assign({}, extra || {});
  trainer.name = trainer.name || "Gary";
  trainer.isRival = true;
  trainer.belohnung = daten.belohnung;
  trainer.team = daten.team;
  return trainer;
}

function triggereTrainerKampf(trainer, zone) {
  clearInterval(STAGE_INTERVALL);
  _wartetAufInput = true;
  var trainerDaten = trainer.rivalProfile
    ? rivalTrainerDaten(trainer.rivalProfile, trainer)
    : trainer;
  kampfStarten("trainer", trainerDaten);
  if (!KAMPF || !KAMPF.gegner) {
    console.warn("[app] Trainer-Kampf: kein Gegner (pokemon.json geladen?)");
    markiereTrainerBesiegt(zone.id, trainer.etappe);
    _wartetAufInput = false;
    stufenLoopStarten();
    return;
  }
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  var pd = getPkmn(KAMPF.gegner.dexId);
  rendereGegnerSprite(KAMPF.gegner, true);
  zeigKampfUI(KAMPF.gegner);
  clearKampfLog();
  fuegeKampfLogHinzu((trainerDaten.isRival ? "Rival " : "") + trainerDaten.name + " fordert dich heraus!");
  fuegeKampfLogHinzu("Er schickt " + (pd ? pd.name : "?") + " Lv." + KAMPF.gegner.level + "!");
  if (_autoKampf) kampfLoopStarten();
}

function triggereGymBoss(zone) {
  clearInterval(STAGE_INTERVALL);
  _wartetAufInput = true;
  var gl = zone.boss;
  kampfStarten("gym", {
    name: gl.name, team: gl.team,
    belohnung: gl.belohnung, _ordenId: gl.ordenId, _orden: gl.orden,
    _itemBelohnung: gl.itemBelohnung,
    _arenaZone: zone.id, _completedFlag: zone.completedFlag, _returnTo: zone.returnTo
  });
  if (!KAMPF || !KAMPF.gegner) {
    console.warn("[app] Gym-Boss: kein Gegner (pokemon.json geladen?)");
    markiereTrainerBesiegt(zone.id, "boss");
    _wartetAufInput = false;
    stufenLoopStarten();
    return;
  }
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  var pd = getPkmn(KAMPF.gegner.dexId);
  rendereGegnerSprite(KAMPF.gegner, true);
  zeigKampfUI(KAMPF.gegner);
  clearKampfLog();
  fuegeKampfLogHinzu("⚔️ Arenaleiter " + gl.name + " tritt an!");
  fuegeKampfLogHinzu("Er schickt " + (pd ? pd.name : "?") + " Lv." + KAMPF.gegner.level + "!");
  if (_autoKampf) kampfLoopStarten();
}

function triggereRivalKampf(zone, wp) {
  clearInterval(STAGE_INTERVALL);
  _wartetAufInput = true;
  kampfStarten("rival", rivalTrainerDaten(wp.rivalProfile || "route22_early", { _flagId: wp.flagId }));
  if (!KAMPF || !KAMPF.gegner) {
    setzeFlag(wp.flagId);
    _wartetAufInput = false;
    stufenLoopStarten();
    return;
  }
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  if (wp.text) fuegeKampfLogHinzu(wp.text);
  rendereGegnerSprite(KAMPF.gegner, true);
  zeigKampfUI(KAMPF.gegner);
  if (_autoKampf) kampfLoopStarten();
}

// ── Auto-Kampf-Loop ───────────────────────────────────────────
function kampfLoopStarten() {
  clearInterval(KAMPF_INTERVALL);
  KAMPF_INTERVALL = setInterval(function() {
    if (!_animLaeuft) fuehreAutoKampfRunde();
  }, KAMPF_TICK_MS);
}

function fuehreAutoKampfRunde() {
  if (!KAMPF || KAMPF.vorbei || _animLaeuft) { clearInterval(KAMPF_INTERVALL); return; }
  var spieler = aktivePkmn(); if (!spieler) return;
  _animLaeuft = true;
  clearInterval(KAMPF_INTERVALL);

  var moveId = waehleKIAttacke(spieler, KAMPF.gegner);
  var move = MOVES[moveId] || { typ: "Normal" };

  fuehreAngriffAnimation(move.typ, true, function() {
    fuehreAngriffAus(spieler, KAMPF.gegner, moveId).forEach(m => fuegeKampfLogHinzu(m));
    aktualisiereGegnerKP(KAMPF.gegner);
    aktualisiereSpielerKP();
  }, function() {
    var ende = pruefeKampfende();
    if (ende) { _animLaeuft = false; kampfBeenden(ende); return; }
    var gMoveId = waehleKIAttacke(KAMPF.gegner, spieler);
    fuehreAngriffAnimation((MOVES[gMoveId]||{typ:"Normal"}).typ, false, function() {
      fuehreAngriffAus(KAMPF.gegner, spieler, gMoveId).forEach(m => fuegeKampfLogHinzu(m));
      aktualisiereSpielerKP(); rendereSpielerSprites();
    }, function() {
      var ende2 = pruefeKampfende();
      if (ende2) { _animLaeuft = false; kampfBeenden(ende2); return; }
      if (!KAMPF.vorbei) rendereGegnerSprite(KAMPF.gegner, true);
      _animLaeuft = false;
      if (KAMPF && !KAMPF.vorbei && _autoKampf) kampfLoopStarten();
    });
  });
}

window.onAttackeKlick = function(moveId) {
  if (!KAMPF || KAMPF.vorbei || _animLaeuft) return;
  clearInterval(KAMPF_INTERVALL);
  _animLaeuft = true;
  var spieler = aktivePkmn(); if (!spieler) { _animLaeuft = false; return; }
  fuehreAngriffAnimation((MOVES[moveId]||{typ:"Normal"}).typ, true, function() {
    fuehreAngriffAus(spieler, KAMPF.gegner, moveId).forEach(t => fuegeKampfLogHinzu(t));
    aktualisiereGegnerKP(KAMPF.gegner); aktualisiereSpielerKP();
  }, function() {
    var ende = pruefeKampfende();
    if (ende) { _animLaeuft = false; kampfBeenden(ende); return; }
    var gMoveId = waehleKIAttacke(KAMPF.gegner, spieler);
    fuehreAngriffAnimation((MOVES[gMoveId]||{typ:"Normal"}).typ, false, function() {
      fuehreAngriffAus(KAMPF.gegner, spieler, gMoveId).forEach(t => fuegeKampfLogHinzu(t));
      aktualisiereSpielerKP(); rendereSpielerSprites();
    }, function() {
      var ende2 = pruefeKampfende();
      if (ende2) { _animLaeuft = false; kampfBeenden(ende2); return; }
      rendereAttackenButtons();
      _animLaeuft = false;
      if (KAMPF && !KAMPF.vorbei && _autoKampf) kampfLoopStarten();
    });
  });
};

window.onBallKlick = function(ballTyp) {
  if (!KAMPF || KAMPF.vorbei || KAMPF.fangLaeuft || _animLaeuft || !KAMPF.kannFangen) return;
  if (!(STATE.items[ballTyp] > 0)) { zeigToast("Keine " + ((ITEM_DEFS[ballTyp]||{}).name||ballTyp) + " mehr!"); return; }
  clearInterval(KAMPF_INTERVALL);
  KAMPF.fangLaeuft = true;
  _animLaeuft = true;
  rendereWurfBaelle(false);
  STATE.items[ballTyp]--;
  werfeBallAnimation(ballTyp, function() {
    if (!KAMPF || KAMPF.vorbei) return;
    if (versucheFangen(KAMPF.gegner, ballTyp)) {
      KAMPF.vorbei = true;
      KAMPF.kannFangen = false;
      KAMPF.fangLaeuft = false;
      var neuPkmn = KAMPF.gegner;
      var pd = getPkmn(neuPkmn.dexId);
      STATE.gefangen[neuPkmn.dexId] = true; STATE.gesehen[neuPkmn.dexId] = true;
      fuegeKampfLogHinzu("🎉 " + (pd ? pd.name : "?") + (neuPkmn.shiny ? " ✨" : "") + " gefangen!");
      var ziel = inParty(neuPkmn) ? "Team" : (inBox(neuPkmn) ? "Box" : "");
      if (typeof rendereTeamScreen === "function") rendereTeamScreen();
      if (typeof rendereSpielerSprites === "function") rendereSpielerSprites();
      zeigToast((pd ? pd.name : "?") + " gefangen!" + (ziel ? " → " + ziel : ""), 3000);
      _animLaeuft = false;
      rendereWurfBaelle(false);
      kampfBeenden({ ergebnis: "gefangen" });
    } else {
      KAMPF.fangLaeuft = false;
      fuegeKampfLogHinzu("Oh! " + ((getPkmn(KAMPF.gegner.dexId)||{}).name||"?") + " hat sich befreit!");
      var gMoveId = waehleKIAttacke(KAMPF.gegner, aktivePkmn());
      fuehreAngriffAnimation((MOVES[gMoveId]||{typ:"Normal"}).typ, false, function() {
        fuehreAngriffAus(KAMPF.gegner, aktivePkmn(), gMoveId).forEach(t => fuegeKampfLogHinzu(t));
        aktualisiereSpielerKP();
      }, function() {
        var ende = pruefeKampfende();
        if (ende) { _animLaeuft = false; kampfBeenden(ende); return; }
        rendereWurfBaelle(true); _animLaeuft = false;
        if (_autoKampf) kampfLoopStarten();
      });
    }
  });
};

window.onFluchtKlick = function() {
  if (!KAMPF || KAMPF.vorbei) { zeigToast("Flucht nicht möglich!"); return; }
  if (!versucheFlucht()) { zeigToast("Flucht nicht möglich!"); return; }
  clearInterval(KAMPF_INTERVALL); _animLaeuft = false;
  kampfBeenden({ ergebnis: "flucht" });
};

// ── Kampf beenden ─────────────────────────────────────────────
function kampfBeenden(ende) {
  clearInterval(KAMPF_INTERVALL); _animLaeuft = false;
  if (!ende) return;
  switch (ende.ergebnis) {
    case "sieg":
      if (ende.xpMeldungen) ende.xpMeldungen.forEach(m => fuegeKampfLogHinzu(m));
      if (ende.xp) zeigXPPopup(ende.xp);
      if (KAMPF.istTrainer) {
        if (KAMPF.trainerDaten && KAMPF.trainerDaten.belohnung) {
          STATE.geld += KAMPF.trainerDaten.belohnung;
          fuegeKampfLogHinzu("+" + KAMPF.trainerDaten.belohnung + " ₽!");
          aktualisiereHUD();
        }
        if (KAMPF.trainerDaten && KAMPF.trainerDaten._flagId) {
          setzeFlag(KAMPF.trainerDaten._flagId);
        }
        if (KAMPF.trainerDaten && KAMPF.trainerDaten._ordenId) {
          var ordenId = KAMPF.trainerDaten._ordenId;
          if (!STATE.ordenIds.includes(ordenId)) {
            STATE.ordenIds.push(ordenId); STATE.orden = STATE.ordenIds.length;
            if (KAMPF.trainerDaten._itemBelohnung) {
              var itemId = KAMPF.trainerDaten._itemBelohnung;
              STATE.items[itemId] = (STATE.items[itemId] || 0) + 1;
              fuegeKampfLogHinzu("TM erhalten: " + ((ITEM_DEFS[itemId] || {}).name || itemId));
            }
            fuegeKampfLogHinzu("🏅 " + KAMPF.trainerDaten._orden + " erhalten!"); aktualisiereHUD();
          }
          if (KAMPF.trainerDaten._arenaZone) markiereTrainerBesiegt(KAMPF.trainerDaten._arenaZone, "boss");
          if (KAMPF.trainerDaten._completedFlag) setzeFlag(KAMPF.trainerDaten._completedFlag);
        } else {
          markiereTrainerBesiegt(STATE.zone, STATE.etappe);
        }
      } else if (KAMPF.legendary && KAMPF.legendary.flagId) {
        planeLegendaryRespawn(KAMPF.legendary.flagId);
        fuegeKampfLogHinzu("Das legendäre Pokémon verschwindet. Es kann in 24 Stunden erneut erscheinen.");
      }
      rendereSpielerSprites(); speichern();
      setTimeout(function() {
        versteckeKampfUI(); rendereGegnerSprite(null, false); _wartetAufInput = false;
        var curZone = getZone(STATE.zone);
        if (KAMPF.trainerDaten && KAMPF.trainerDaten._returnTo) { navigiereZu(KAMPF.trainerDaten._returnTo); return; }
        if (curZone && (curZone.typ === "stadt" || curZone.typ === "wachposten")) {
          stadtBetreten(curZone);
        } else {
          var alteZoneId = STATE.zone;
          naechsteEtappe(curZone);
          var neueZone = getZone(STATE.zone);
          if (STATE.zone === alteZoneId && neueZone && neueZone.typ !== "stadt" && neueZone.typ !== "wachposten") {
            stufenLoopStarten();
          }
        }
      }, 2500);
      break;
    case "niederlage":
      if (KAMPF.legendary && KAMPF.legendary.flagId) {
        planeLegendaryRespawn(KAMPF.legendary.flagId);
      }
      fuegeKampfLogHinzu("💀 K.O.! In der Heilstation aufgewacht...");
      rendereSpielerSprites(); speichern();
      setTimeout(function() {
        versteckeKampfUI(); rendereGegnerSprite(null, false);
        vollHeilen(); STATE.etappe = 1;
  var ziel = (STATE.respawnZone && getZone(STATE.respawnZone)) ? STATE.respawnZone : "alabastia";
  navigiereZu(ziel);
      }, 3000);
      break;
    case "gefangen":
      if (KAMPF.legendary && KAMPF.legendary.flagId) {
        setzeFlag(KAMPF.legendary.flagId);
        clearLegendaryRespawn(KAMPF.legendary.flagId);
      }
      speichern();
      setTimeout(function() {
        versteckeKampfUI(); rendereGegnerSprite(null, false); _wartetAufInput = false;
        var curZone = getZone(STATE.zone);
        if (curZone && (curZone.typ === "stadt" || curZone.typ === "wachposten")) stadtBetreten(curZone);
        else stufenLoopStarten();
      }, 1500);
      break;
    case "flucht":
      if (KAMPF.legendary && KAMPF.legendary.flagId) {
        planeLegendaryRespawn(KAMPF.legendary.flagId);
        speichern();
      }
      setTimeout(function() {
        versteckeKampfUI(); rendereGegnerSprite(null, false); _wartetAufInput = false;
        var curZone = getZone(STATE.zone);
        if (curZone && (curZone.typ === "stadt" || curZone.typ === "wachposten")) stadtBetreten(curZone);
        else stufenLoopStarten();
      }, 1500);
      break;
    case "naechstes":
      if (ende.xpMeldungen) ende.xpMeldungen.forEach(m => fuegeKampfLogHinzu(m));
      if (ende.xp) zeigXPPopup(ende.xp);
      fuegeKampfLogHinzu("Trainer schickt " + ((getPkmn(KAMPF.gegner.dexId)||{}).name||"?") + " Lv." + KAMPF.gegner.level + "!");
      rendereGegnerSprite(KAMPF.gegner, true); aktualisiereGegnerKP(KAMPF.gegner);
      if (_autoKampf) kampfLoopStarten();
      break;
  }
}

// ── Auto/Manuell ──────────────────────────────────────────────
function _updateAutoKampfBtn() {
  var btn = document.getElementById("autoKampfBtn");
  if (btn) btn.textContent = _autoKampf ? "⚡ Auto" : "✋ Manuell";
}
window.toggleAutoKampf = function() {
  _autoKampf = !_autoKampf; _updateAutoKampfBtn();
  if (_autoKampf && KAMPF && !KAMPF.vorbei && !_animLaeuft) kampfLoopStarten();
  else clearInterval(KAMPF_INTERVALL);
};

// ── Schnellreise ──────────────────────────────────────────────
window.schnellReiseTo = function(zoneId) {
  if (!STATE) return;
  if (KAMPF && !KAMPF.vorbei) { zeigToast("Im Kampf nicht möglich!"); return; }
  if (!(STATE.items["hm02"] > 0)) { zeigToast("✈️ Schnellreise erfordert VM02 Fliegen!", 3500); return; }
  if (!zonenBesucht(zoneId)) { zeigToast("Diese Stadt noch nicht besucht!"); return; }
  navigiereZu(zoneId);
  zeigToast("✈️ Fliege nach " + ((getZone(zoneId)||{}).name||zoneId) + "!", 3000);
};

// ── Tabs ──────────────────────────────────────────────────────
window.onTabWelt   = function() { wechsleTab("Welt"); };
window.onTabAngeln = function() {
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  var btn = document.getElementById("tabAngeln");
  if (btn && btn.disabled) { zeigToast(btn.dataset.reason || "Hier kannst du gerade nicht angeln."); return; }
  wechsleTab("Angeln");
};
window.onTabTeam   = function() { wechsleTab("Team"); };
window.onTabTasche = function() { wechsleTab("Tasche"); };
window.onTabKarte  = function() { wechsleTab("Karte"); rendereKarte(); };
window.onTabDex    = function() { wechsleTab("Dex"); };

// ── Hilfsfunktionen ───────────────────────────────────────────
function getEffektivenTick() {
  if (!STATE) return STAGE_TICK_MS;
  var zone = getZone(STATE.zone);
  if (!zone || zone.typ === "stadt" || zone.typ === "gym") return STAGE_TICK_MS;
  return itemAktiv("fahrrad") ? Math.floor(STAGE_TICK_MS / 2) : STAGE_TICK_MS;
}

function zeigOfflineBonus(sekunden, onClose) {
  var modal = document.getElementById("offlineModal");
  var msg   = document.getElementById("offlineMsg");
  if (!modal || !msg) return;
  _offlineModalCallback = typeof onClose === "function" ? onClose : null;
  var h = Math.floor(sekunden / 3600), m = Math.floor((sekunden % 3600) / 60);
  msg.textContent = "Du warst " + (h > 0 ? h + "h " : "") + m + "m weg!";
  modal.style.display = "flex";
}
window.schliesseOfflineModal = function() {
  var m = document.getElementById("offlineModal"); if (m) m.style.display = "none";
  var cb = _offlineModalCallback;
  _offlineModalCallback = null;
  if (cb) {
    _wartetAufInput = false;
    cb();
  }
};
