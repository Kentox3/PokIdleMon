function rendereFossilWahl(zone, wp) {
  var container = document.getElementById("viewWorld"); if (!container) return;
  wechsleTab("Welt");
  var html = `<div class="waypoint-panel"><div class="waypoint-text">${wp.text}</div><div class="waypoint-wahl">`;
  wp.wahl.forEach(w => {
    var pd = getPkmn(w.dexId);
    html += `<div class="wahl-karte" onclick="wahlFossil('${zone.id}','${wp.flagId}','${w.item}','${w.itemName}','${w.dexId}')">` +
      `<img src="${spriteFallback(w.dexId,false)}" onerror="this.style.opacity=0">` +
      `<div class="wahl-name">${w.itemName}</div>` +
      `<div class="wahl-pkmn">→ ${pd?pd.name:"?"}</div>` +
      `</div>`;
  });
  html += `</div></div>`;
  container.innerHTML = html;
}
window.wahlFossil = function(zoneId, flagId, item, itemName, dexId) {
  STATE.items[item] = (STATE.items[item]||0)+1;
  setzeFlag(flagId);
  speichern();
  zeigToast("🦴 " + itemName + " erhalten!", 3000);
  _wartetAufInput = false;
  stufenLoopStarten();
  rendereWeltTab();
};

function rendereRelaxoBlock(zone, wp) {
  wechsleTab("Welt");
  var container = document.getElementById("viewWorld"); if (!container) return;
  var hatFloete = STATE.items && (STATE.items[wp.needsItem]||0) > 0;
  container.innerHTML = `<div class="waypoint-panel">` +
    `<div class="waypoint-text">${wp.blockedMsg}</div>` +
    (hatFloete ?
      `<button class="waypoint-btn" onclick="relaxoWecken('${zone.id}','${wp.flagId}',${wp.relaxoDexId||143},${wp.relaxoLevel||30})">🎵 Pokéflöte spielen!</button>` :
      `<div class="waypoint-gesperrt">Pokéflöte benötigt — von Mr. Fuji in Lavendeldorf</div>`) +
    `</div>`;
}
window.relaxoWecken = function(zoneId, flagId, dexId, level) {
  setzeFlag(flagId);
  var wildData = { dexId: dexId, level: level, shiny: Math.random()<1/250 };
  zeigToast("Relaxo wacht auf und greift an!", 2000);
  _wartetAufInput = false;
  setTimeout(() => { triggereWildKampf(wildData, getZone(zoneId)); }, 2100);
};

function triggereLegendary(zone, wp) {
  var wildData = {
    dexId: wp.dexId || 150,
    level: wp.level || 70,
    shiny: false,
    legendary: { flagId: wp.flagId, dexId: wp.dexId || 150 }
  };
  var pd = getPkmn(wildData.dexId);
  zeigToast(wp.text || ((pd ? pd.name : "Ein legendäres Pokémon") + " taucht auf!"), 2500);
  _autoKampf = false;
  if (typeof _updateAutoKampfBtn === "function") _updateAutoKampfBtn();
  _wartetAufInput = false;
  setTimeout(() => { triggereWildKampf(wildData, zone); }, 2600);
}

function triggereMewtu(zone, wp) {
  triggereLegendary(zone, wp);
}
