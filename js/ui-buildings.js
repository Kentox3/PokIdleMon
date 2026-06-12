function zeigGebaeude(gebaeude, zone) {
  var container = document.getElementById("viewWorld"); if (!container) return;
  var backAction = (zone.typ === "stadt" || zone.typ === "wachposten")
    ? `rendereStadtHub(getZone('${zone.id}'))`
    : `rendereWeltTab()`;
  var html = `<div class="gebaeude-view">` +
    `<div class="gebaeude-header"><button onclick="${backAction}">← Zurück</button><h3>${gebaeude.name||"?"}</h3></div>`;

  (gebaeude.features || []).forEach(feat => {
    var getan = !!feat.flagId && flagGesetzt(feat.flagId);
    var gesperrt = feat.bedingung && !checkBedingung(feat.bedingung, STATE);
    html += `<div class="feat-section">`;
    html += `<div class="feat-titel">${feat.label}</div>`;
    if (feat.beschr) html += `<div class="feat-beschr">${feat.beschr}</div>`;
    if (getan) {
      html += `<div class="feat-fertig">✅ Erledigt</div>`;
    } else if (gesperrt) {
      html += `<div class="feat-gesperrt">🔒 ${feat.gesperrtText||"Gesperrt"}</div>`;
    } else {
      var onclick = `window._claimFeat('${gebaeude._id||""}','${feat.id}','${zone.id}')`;
      html += `<button class="feat-btn" onclick="${onclick}">${feat.typ==="lore"?"💬 Lesen":"✅ Einlösen"}</button>`;
    }
    html += `</div>`;
  });
  html += `</div>`;
  container.innerHTML = html;

  window._claimFeat = function(gebId, featId, zoneId) {
    var bld = BUILDINGS[gebId] ? { _id: gebId, ...BUILDINGS[gebId] } : null; if (!bld) return;
    var feat = (bld.features||[]).find(f => f.id === featId); if (!feat) return;
    if (feat.flagId && flagGesetzt(feat.flagId)) return;
    if (feat.bedingung && !checkBedingung(feat.bedingung, STATE)) { zeigToast(feat.gesperrtText||"Gesperrt"); return; }

    switch (feat.typ) {
      case "zone_reise":
        navigiereZu(feat.targetZone);
        break;
      case "schalter":
        setzeFlag(feat.flagId);
        speichern();
        zeigToast(feat.freigeschaltetText || feat.text || "Klick!", 3000);
        zeigGebaeude(bld, getZone(zoneId));
        break;
      case "rival_fight":
        triggereRivalKampf(getZone(zoneId), feat);
        break;
      case "lore":
        zeigDialog(feat.text||"...", () => {
          if (feat.flagId) { setzeFlag(feat.flagId); speichern(); }
          zeigGebaeude(bld, getZone(zoneId));
        });
        break;
      case "item_geschenk":
        STATE.items[feat.item] = (STATE.items[feat.item]||0)+1;
        setzeFlag(feat.flagId); speichern();
        zeigToast("🎁 " + (feat.itemName||feat.item) + " erhalten!", 3000);
        if (feat.text) zeigDialog(feat.text, () => zeigGebaeude(bld, getZone(zoneId)));
        else zeigGebaeude(bld, getZone(zoneId));
        break;
      case "pokemon_geschenk":
        var neuPkmn = createPkmnInst(feat.dexId, feat.level||5);
        if (feat.nick) neuPkmn.nick = feat.nick;
        if (!inParty(neuPkmn)) inBox(neuPkmn);
        STATE.gefangen[feat.dexId] = true; STATE.gesehen[feat.dexId] = true;
        setzeFlag(feat.flagId); speichern();
        zeigToast("🎁 " + (getPkmn(feat.dexId)||{}).name + " erhalten!", 3000);
        if (feat.text) zeigDialog(feat.text, () => zeigGebaeude(bld, getZone(zoneId)));
        else zeigGebaeude(bld, getZone(zoneId));
        break;
      default:
        if (feat.text) zeigDialog(feat.text, () => zeigGebaeude(bld, getZone(zoneId)));
        else zeigGebaeude(bld, getZone(zoneId));
    }
  };
}

window.zeigGebaeudeById = function(gebaeudeId, zoneId) {
  var zone = getZone(zoneId);
  var gebaeude = zone && zone._gebaeudeDaten
    ? zone._gebaeudeDaten.find(b => b._id === gebaeudeId)
    : null;
  if (gebaeude && zone) zeigGebaeude(gebaeude, zone);
};
