function rendereKarte() {
  var container = document.getElementById("mapList"); if (!container || !STATE) return;
  container.innerHTML = "";

  // Orden-Leiste
  var br = document.getElementById("badgeRow");
  if (br) {
    var bids = ["stone","cascade","thunder","rainbow","soul","marsh","volcano","earth"];
    br.innerHTML = bids.map(b =>
      `<span class="badge-icon${STATE.ordenIds&&STATE.ordenIds.includes(b)?" badge-earned":""}">🏅</span>`
    ).join("");
  }

  // Standort
  var cur = getZone(STATE.zone);
  if (cur) {
    var d = document.createElement("div"); d.className = "map-standort";
    var zi = {route:"🌿",dungeon:"🕳️",see:"🌊",wachposten:"🚧",stadt:"🏙️",gym:"⚔️"}[cur.typ]||"📍";
    d.innerHTML = `<b>📍 Hier:</b> ${zi} <b>${cur.name}</b>${cur.etappen?" — Etappe "+STATE.etappe+"/"+cur.etappen:""}`;
    container.appendChild(d);
  }

  // Schnellreise (VM02 Fliegen)
  var hatFliegen = STATE.items && (STATE.items["hm02"]||0) > 0;
  var flyHdr = document.createElement("div"); flyHdr.className = "map-section-title"; flyHdr.style.marginTop="14px";
  if (hatFliegen) {
    flyHdr.textContent = "✈️ Schnellreise (VM02 Fliegen)";
    container.appendChild(flyHdr);
    var besuchtStaedte = WORLD.filter(z => z.typ==="stadt" && zonenBesucht(z.id) && z.id!==STATE.zone);
    if (besuchtStaedte.length) {
      var grid = document.createElement("div"); grid.className = "city-travel-grid";
      besuchtStaedte.forEach(z => {
        var btn = document.createElement("button"); btn.className = "city-travel-btn";
        btn.textContent = "🏙️ " + z.name;
        btn.onclick = () => schnellReiseTo(z.id);
        grid.appendChild(btn);
      });
      container.appendChild(grid);
    }
  } else {
    flyHdr.textContent = "✈️ Schnellreise";
    container.appendChild(flyHdr);
    var hint = document.createElement("div"); hint.className = "map-fly-hint";
    hint.innerHTML = "🔒 Kein VM02 Fliegen.<br>Zu finden auf <b>Route 16</b> westlich von Prismania City.";
    container.appendChild(hint);
  }

  // Kanto-Fortschritt
  var ph = document.createElement("div"); ph.className = "map-section-title"; ph.style.marginTop="14px";
  ph.textContent = "🗺️ Kanto-Fortschritt"; container.appendChild(ph);

  var besucht = 0, gesamt = 0;
  WORLD.forEach(zone => {
    if (zone.typ === "wachposten") return;
    gesamt++;
    if (zonenBesucht(zone.id)) besucht++;
    var isCur = zone.id === STATE.zone, isVis = zonenBesucht(zone.id);
    var row = document.createElement("div");
    row.className = "map-zone map-compact" + (isCur?" map-current":isVis?" map-unlocked":" map-locked");
    var zi2 = {route:"🌿",dungeon:"🕳️",see:"🌊",wachposten:"🚧",stadt:"🏙️",gym:"⚔️"}[zone.typ]||"📍";
    var ordenHtml = zone.boss && isVis
      ? `<span class="map-orden">${(STATE.ordenIds||[]).includes(zone.boss.ordenId)?"🏅":"⬜"}</span>`
      : "";
    row.innerHTML = zi2 + " " + zone.name +
      (isCur ? ` <span class="map-hier">← hier</span>` : "") +
      (!isVis ? `<span class="map-gesperrt">🔒</span>` : "") +
      ordenHtml;
    container.appendChild(row);
  });

  var prog = document.createElement("div"); prog.className = "map-fortschritt";
  prog.textContent = `Erkundet: ${besucht} / ${gesamt} Gebiete`;
  container.appendChild(prog);
}

// ══════════════════════════════════════════════════════════════
//  FOSSIL-WAHL / RELAXO / WAYPOINT-UIs
// ══════════════════════════════════════════════════════════════
