// ═══════════════════════════════════════════════════════════════
//  battle.js — Kampfsystem (nativ mit dt. Stat/Typ-Namen)
// ═══════════════════════════════════════════════════════════════

var KAMPF = null;

// ── Kampf starten ─────────────────────────────────────────────
function kampfStarten(modus, gegnerData) {
  var gegner = null;

  if (modus === "wild") {
    gegner = erstelleGegnerWild(gegnerData);
    KAMPF = {
      modus:     "wild",
      gegner:    gegner,
      kannFangen: true,
      kannFliehen: true,
      istTrainer: false,
      trainerDaten: null,
      xpGewonnen: 0,
      vorbei:    false,
    };
  } else if (modus === "trainer" || modus === "gym" || modus === "rival" || modus === "champion") {
    gegner = erstelleGegnerTrainer(gegnerData);
    KAMPF = {
      modus:     modus,
      gegner:    gegner,
      trainerDaten: gegnerData,
      kannFangen:  false,
      kannFliehen: modus === "trainer",
      istTrainer:  true,
      trainerParty: (gegnerData.team || []).slice(),
      trainerIndex: 0,
      xpGewonnen:   0,
      vorbei:       false,
    };
  }
  return KAMPF;
}

// ── Gegner aus Wild-Daten ─────────────────────────────────────
function erstelleGegnerWild(wildData) {
  var inst = createPkmnInst(wildData.dexId, wildData.level);
  if (!inst) return null;
  inst.shiny = !!wildData.shiny;
  return inst;
}

// ── Gegner aus Trainer-Team ───────────────────────────────────
function erstelleGegnerTrainer(trainerData) {
  var erster = (trainerData.team || [])[0];
  if (!erster) return null;
  return createPkmnInst(erster.id, erster.lv);
}

// ── Schaden berechnen ─────────────────────────────────────────
function berechneSchaden(angreifer, verteidiger, moveId) {
  var move = MOVES[moveId];
  if (!move || move.staerke === 0) return 0;

  var pd = getPkmn(verteidiger.dexId);
  var eff = pd ? getEffektivitaet(move.typ, pd.typen) : 1;
  if (eff === 0) return 0;

  // Physisch vs. Speziell (Gen 1: nach Typ)
  var physisch = ["Normal","Kampf","Flug","Gift","Boden","Gestein","Käfer","Geist"].includes(move.typ);
  var angWert  = physisch ? angreifer.ang   : angreifer.spAng;
  var vertWert = physisch ? verteidiger.vert : verteidiger.spVert;

  var basis = Math.floor((2 * angreifer.level / 5 + 2) * move.staerke * angWert / vertWert / 50) + 2;

  // STAB
  var angrPd = getPkmn(angreifer.dexId);
  if (angrPd && angrPd.typen && angrPd.typen.includes(move.typ)) basis = Math.floor(basis * 1.5);

  // Effektivität
  basis = Math.floor(basis * eff);

  // Kritischer Treffer
  var krit = move.hoheKrit ? Math.random() < 0.25 : Math.random() < 0.0625;
  if (krit) basis = Math.floor(basis * 2);

  // Zufalls-Faktor (85-100%)
  basis = Math.floor(basis * (0.85 + Math.random() * 0.15));

  return { schaden: Math.max(1, basis), krit, eff };
}

// ── Angriff ausführen ─────────────────────────────────────────
function fuehreAngriffAus(angreifer, verteidiger, moveId) {
  var meldungen = [];
  var move = MOVES[moveId];
  if (!move) return ["Unbekannte Attacke!"];

  var aName = angreifer.nick || (getPkmn(angreifer.dexId)||{}).name || "?";
  var vName = verteidiger.nick || (getPkmn(verteidiger.dexId)||{}).name || "?";

  // AP abziehen
  if (moveId !== "struggle" && angreifer.ap[moveId] > 0) angreifer.ap[moveId]--;

  // Treffer-Check
  var trefferChance = (move.genau || 100) / 100;
  if (Math.random() > trefferChance) {
    meldungen.push(aName + " → " + move.name + ": Daneben!");
    return meldungen;
  }

  // Status-Attacken
  if (move.staerke === 0) {
    var effText = wendeStatusEffektAn(move.effekt, angreifer, verteidiger);
    meldungen.push(aName + " → " + move.name + ": " + (effText || ""));
    return meldungen;
  }

  // Schaden
  var res = berechneSchaden(angreifer, verteidiger, moveId);
  if (!res || res.schaden === 0) {
    meldungen.push(aName + " → " + move.name + ": Keine Wirkung!");
    return meldungen;
  }

  verteidiger.kp = Math.max(0, verteidiger.kp - res.schaden);

  var effHinweis = res.eff >= 2 ? " ✨ Sehr effektiv!" : res.eff === 0 ? " Keine Wirkung." : res.eff < 1 ? " Nicht sehr effektiv." : "";
  var kritHinweis = res.krit ? " Volltreffer!" : "";
  meldungen.push(aName + " → " + move.name + ": " + res.schaden + " Schaden!" + kritHinweis + effHinweis);

  // Zusatzeffekt
  if (move.effekt && move.effekt.typ && res.eff > 0) {
    var eText = wendeStatusEffektAn(move.effekt, angreifer, verteidiger);
    if (eText) meldungen.push(eText);
  }

  return meldungen;
}

// ── Status-Effekte ────────────────────────────────────────────
function wendeStatusEffektAn(effekt, angreifer, ziel) {
  if (!effekt) return "";
  var aName = angreifer.nick || (getPkmn(angreifer.dexId)||{}).name || "?";
  var zName = ziel.nick || (getPkmn(ziel.dexId)||{}).name || "?";
  var target = effekt.ziel === "selbst" ? angreifer : ziel;
  var chance = effekt.chance || 1.0;

  if (Math.random() > chance) return "";

  switch (effekt.typ) {
    case "verbrennung":
      if (!target.status) { target.status = "verbrennung"; return zName + " wurde verbrannt!"; }
      break;
    case "vergiftung":
      if (!target.status) { target.status = "vergiftung"; return zName + " wurde vergiftet!"; }
      break;
    case "laehme":
      if (!target.status) { target.status = "laehme"; return zName + " ist gelähmt!"; }
      break;
    case "schlaf":
      if (!target.status) { target.status = "schlaf"; target.statusRunden = 2 + Math.floor(Math.random()*3); return zName + " schläft ein!"; }
      break;
    case "einfriere":
      if (!target.status) { target.status = "einfriere"; return zName + " wurde eingefroren!"; }
      break;
    case "verwirre":
      return zName + " ist verwirrt!";
    case "ang_minus":
      target.ang = Math.floor(target.ang * 0.8); return zName + " → Angriff ↓";
    case "vert_minus":
      target.vert = Math.floor(target.vert * 0.8); return zName + " → Abwehr ↓";
    case "init_minus":
      target.init = Math.floor(target.init * 0.8); return zName + " → Initiative ↓";
    case "ang_plus":
      target.ang = Math.floor(target.ang * 1.25); return aName + " → Angriff ↑";
    case "ang_plus2":
      target.ang = Math.floor(target.ang * 1.5); return aName + " → Angriff ↑↑";
    case "vert_plus":
      target.vert = Math.floor(target.vert * 1.25); return aName + " → Abwehr ↑";
    case "vert_plus2":
      target.vert = Math.floor(target.vert * 1.5); return aName + " → Abwehr ↑↑";
    case "spang_plus2":
      target.spAng = Math.floor(target.spAng * 1.5); return aName + " → Sp.Angriff ↑↑";
    case "init_plus2":
      target.init = Math.floor(target.init * 1.5); return aName + " → Initiative ↑↑";
    case "heile_50":
      var geheilt = Math.floor(target.maxKP / 2);
      target.kp = Math.min(target.maxKP, target.kp + geheilt);
      return aName + " erholt sich! (+" + geheilt + " KP)";
    case "heile_voll":
      target.kp = target.maxKP; target.status = null;
      return aName + " schläft und erholt sich vollständig!";
    case "sog":
      var gesaugt = Math.floor(Math.max(1, ziel.kp * 0.25));
      ziel.kp = Math.max(0, ziel.kp - gesaugt);
      angreifer.kp = Math.min(angreifer.maxKP, angreifer.kp + gesaugt);
      return aName + " saugt " + gesaugt + " KP!";
    case "selbstzerstoerung":
      angreifer.kp = 0; return aName + " opfert sich!";
    case "genau_minus":
      return zName + " → Genauigkeit ↓";
  }
  return "";
}

// ── Status-Schaden am Rundenanfang ────────────────────────────
function statusSchaden(pkmn) {
  if (!pkmn || !pkmn.status) return null;
  var name = pkmn.nick || (getPkmn(pkmn.dexId)||{}).name || "?";
  switch (pkmn.status) {
    case "verbrennung":
      var schaden = Math.floor(pkmn.maxKP / 8);
      pkmn.kp = Math.max(0, pkmn.kp - schaden);
      return name + " leidet unter der Verbrennung! (-" + schaden + " KP)";
    case "vergiftung":
      var schaden2 = Math.floor(pkmn.maxKP / 8);
      pkmn.kp = Math.max(0, pkmn.kp - schaden2);
      return name + " leidet unter der Vergiftung! (-" + schaden2 + " KP)";
    case "schlaf":
      pkmn.statusRunden--;
      if (pkmn.statusRunden <= 0) { pkmn.status = null; return name + " wacht auf!"; }
      return name + " schläft tief und fest.";
    case "laehme":
      if (Math.random() < 0.25) return name + " ist gelähmt und kann nicht angreifen!";
      return null;
    case "einfriere":
      if (Math.random() < 0.2) { pkmn.status = null; return name + " taut auf!"; }
      return name + " ist eingefroren!";
  }
  return null;
}

// ── KI: beste Attacke wählen ──────────────────────────────────
function waehleKIAttacke(angreifer, verteidiger) {
  var pd = getPkmn(verteidiger.dexId);
  var verfuegbar = (angreifer.attacken || []).filter(id => (angreifer.ap[id] || 0) > 0);
  if (!verfuegbar.length) return "struggle";

  var beste = verfuegbar[0];
  var besteWert = -1;
  verfuegbar.forEach(id => {
    var move = MOVES[id];
    if (!move || move.staerke === 0) return;
    var eff = pd ? getEffektivitaet(move.typ, pd.typen) : 1;
    var wert = move.staerke * eff;
    if (wert > besteWert) { besteWert = wert; beste = id; }
  });
  return beste;
}

// ── Kampfende prüfen ─────────────────────────────────────────
function vergebeXPFuerBesiegtenGegner(spieler) {
  var pd = getPkmn(KAMPF.gegner.dexId);
  var bxp = pd ? pd.basisXP : 50;
  var xp = berechneXPGewinn(spieler.level, KAMPF.gegner.level, bxp, KAMPF.istTrainer);
  KAMPF.xpGewonnen += xp;
  var xpMeldungen = [];
  var aktiveXP = xp;

  if (itemAktiv("ep_teiler") && STATE.party && STATE.party.length > 1) {
    var empfaenger = STATE.party.filter(p => p && p.kp > 0 && p.level < 100);
    if (empfaenger.length > 1) {
      var kampfAnteil = Math.floor(xp / 2);
      var teamPool = xp - kampfAnteil;
      var teamAnteil = Math.floor(teamPool / empfaenger.length);
      var rest = teamPool - (teamAnteil * empfaenger.length);

      aktiveXP = kampfAnteil + teamAnteil + rest;
      xpMeldungen.push("EP-Teiler verteilt " + teamPool + " EP im Team.");
      xpMeldungen = xpMeldungen.concat(vergebeXP(spieler, aktiveXP, KAMPF.gegner.dexId));

      empfaenger.forEach(p => {
        if (p === spieler) return;
        xpMeldungen = xpMeldungen.concat(vergebeXP(p, teamAnteil, KAMPF.gegner.dexId));
      });
    } else {
      xpMeldungen = vergebeXP(spieler, xp, KAMPF.gegner.dexId);
    }
  } else {
    xpMeldungen = vergebeXP(spieler, xp, KAMPF.gegner.dexId);
  }

  if (pd) { STATE.gesehen[KAMPF.gegner.dexId] = true; }
  return { xp: aktiveXP, xpGesamt: xp, xpMeldungen: xpMeldungen };
}

function pruefeKampfende() {
  if (!KAMPF || KAMPF.vorbei) return null;
  var spieler = aktivePkmn();

  // Spieler besiegt
  if (!spieler || spieler.kp <= 0) {
    KAMPF.vorbei = true;
    return { ergebnis: "niederlage" };
  }

  // Gegner besiegt
  if (KAMPF.gegner.kp <= 0) {
    var xpErgebnis = vergebeXPFuerBesiegtenGegner(spieler);

    // Trainer: nächstes Pokémon?
    if (KAMPF.istTrainer) {
      KAMPF.trainerIndex++;
      var naechstes = KAMPF.trainerParty[KAMPF.trainerIndex];
      if (naechstes) {
        KAMPF.gegner = createPkmnInst(naechstes.id, naechstes.lv);
        return {
          ergebnis: "naechstes",
          neuerGegner: KAMPF.gegner,
          xp: xpErgebnis.xp,
          xpMeldungen: xpErgebnis.xpMeldungen
        };
      }
    }
    KAMPF.vorbei = true;
    return { ergebnis: "sieg", xp: xpErgebnis.xp, xpMeldungen: xpErgebnis.xpMeldungen };
  }
  return null;
}

// ── Flucht ────────────────────────────────────────────────────
function versucheFlucht() {
  if (!KAMPF || !KAMPF.kannFliehen) return false;
  KAMPF.vorbei = true;
  return true;
}
