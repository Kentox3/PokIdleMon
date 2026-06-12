var _angelAuswahl = "angel";
var _angelWurfLaeuft = false;

function angelStatus() {
  var zone = STATE && getZone(STATE.zone);
  if (KAMPF && !KAMPF.vorbei) return { kann: false, grund: "Erst Kampf beenden." };
  if (!zone || !zone.wasser || !zone.wasser.angeln) return { kann: false, grund: "Kein Angelplatz." };
  var hatAngel = Object.keys(zone.wasser.angeln).some(typ => {
    var cfg = zone.wasser.angeln[typ];
    var item = cfg.item || typ;
    return STATE.items && STATE.items[item] > 0;
  });
  if (!hatAngel) return { kann: false, grund: "Keine Angel im Inventar." };
  return { kann: true, grund: "" };
}

function aktualisiereAngelTabStatus() {
  var btn = document.getElementById("tabAngeln");
  if (!btn || !STATE) return;
  var status = angelStatus();
  btn.disabled = !status.kann;
  btn.dataset.reason = status.grund || "";
  btn.classList.toggle("tab-disabled", !status.kann);
  btn.title = status.grund || "Angeln";
}

function rendereAngelTab() {
  aktualisiereAngelTabStatus();
  var container = document.getElementById("fishingContent"); if (!container || !STATE) return;
  var zone = getZone(STATE.zone);
  var status = angelStatus();
  if (!zone || !zone.wasser || !zone.wasser.angeln) {
    container.innerHTML = '<div class="fishing-panel fishing-disabled"><div class="fishing-title">Angeln</div><div class="fishing-note">Hier gibt es keinen Angelplatz.</div></div>';
    return;
  }

  var typen = ["angel", "profiangel", "superangel"].filter(t => zone.wasser.angeln[t]);
  if (!typen.includes(_angelAuswahl)) _angelAuswahl = typen[0] || "angel";
  var cfgAktiv = zone.wasser.angeln[_angelAuswahl];
  var besitztAktiv = cfgAktiv && STATE.items && STATE.items[cfgAktiv.item || _angelAuswahl] > 0;
  var kannAuswerfen = status.kann && besitztAktiv && !_angelWurfLaeuft;
  var namen = { angel: "Angel", profiangel: "Profiangel", superangel: "Superangel" };

  var html = '<div class="fishing-panel' + (status.kann ? '' : ' fishing-disabled') + '">' +
    '<div class="fishing-title">' + (zone.wasser.label || "Angelplatz") + '</div>' +
    '<div class="fishing-zone">' + zone.name + '</div>' +
    '<div class="fishing-rods">';

  typen.forEach(typ => {
    var cfg = zone.wasser.angeln[typ];
    var item = cfg.item || typ;
    var def = ITEM_DEFS[item] || {};
    var besitzt = STATE.items && STATE.items[item] > 0;
    html += '<button class="fishing-rod-btn' + (_angelAuswahl === typ ? ' selected' : '') + '" ' +
      (besitzt && !_angelWurfLaeuft ? 'onclick="setzeAngelAuswahl(' + JSON.stringify(typ) + ')"' : 'disabled') + '>' +
      '<span>' + (def.name || namen[typ] || typ) + '</span>' +
      '<small>' + (besitzt ? ((cfg.begegnung || 100) + '% Bisschance') : 'Nicht im Inventar') + '</small>' +
      '</button>';
  });

  html += '</div>' +
    '<button class="fishing-cast-btn" ' + (kannAuswerfen ? 'onclick="wirfAngelAus()"' : 'disabled') + '>' +
      (_angelWurfLaeuft ? 'Warten...' : 'Angel auswerfen') +
    '</button>' +
    (!status.kann ? '<div class="fishing-note">' + status.grund + '</div>' : '') +
    '</div>';
  container.innerHTML = html;
}

window.setzeAngelAuswahl = function(angelTyp) {
  _angelAuswahl = angelTyp;
  rendereAngelTab();
};

window.wirfAngelAus = function() {
  starteAngeln(_angelAuswahl);
};

window.starteAngeln = function(angelTyp) {
  var zone = getZone(STATE.zone);
  var cfg = zone && zone.wasser && zone.wasser.angeln && zone.wasser.angeln[angelTyp];
  if (!cfg) { zeigToast("Hier kannst du damit nicht angeln."); return; }
  if (KAMPF && !KAMPF.vorbei) { zeigToast("Erst Kampf beenden."); return; }
  var item = cfg.item || angelTyp;
  if (!STATE.items || !(STATE.items[item] > 0)) {
    var def = ITEM_DEFS[item] || {};
    zeigToast("Du brauchst " + (def.name || item) + "!");
    return;
  }

  clearInterval(STAGE_INTERVALL);
  clearInterval(KAMPF_INTERVALL);
  if (typeof setzeAngelSzene === "function") setzeAngelSzene(true);
  _angelWurfLaeuft = true;
  _wartetAufInput = true;
  rendereAngelTab();
  zeigToast("Du wirfst die Angel aus...", 1200);

  setTimeout(function() {
    if (Math.random() >= ((cfg.begegnung || 100) / 100)) {
      zeigToast("Nichts hat angebissen.", 1800);
      _angelWurfLaeuft = false;
      _wartetAufInput = false;
      if (zone.typ === "stadt" || zone.typ === "wachposten") stadtBetreten(zone);
      else stufenLoopStarten();
      rendereAngelTab();
      return;
    }

    var wild = rollPkmnAusTabelle(cfg.pokemon);
    if (!wild) {
      zeigToast("Hier beisst gerade nichts an.", 1800);
      _angelWurfLaeuft = false;
      _wartetAufInput = false;
      if (zone.typ === "stadt" || zone.typ === "wachposten") stadtBetreten(zone);
      else stufenLoopStarten();
      rendereAngelTab();
      return;
    }
    _angelWurfLaeuft = false;
    rendereAngelTab();
    triggereWildKampf(wild, zone);
  }, 900);
};
