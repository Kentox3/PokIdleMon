function rendereWeltTab() {
  var container = document.getElementById("viewWorld"); if (!container || !STATE) return;
  var zone = getZone(STATE.zone); if (!zone) return;
  if (zone.typ === "stadt" || zone.typ === "wachposten") return;

  var icon = {route:"🌿",dungeon:"🕳️",see:"🌊",gym:"⚔️"}[zone.typ] || "📍";
  var html = '<div class="zone-info-panel"><div class="zone-info-header">' + icon + ' <b>' + zone.name + '</b></div>';

  if (typeof istLineareReiseZone === "function" && istLineareReiseZone(zone)) {
    var links = zone.verbindungen[0], rechts = zone.verbindungen[1];
    var zielId = STATE.routeZiel || (STATE.richtung === "rueckwaerts" ? links.zoneId : rechts.zoneId);
    var linksAktiv = zielId === links.zoneId;
    var rechtsAktiv = zielId === rechts.zoneId;
    html += '<div class="route-dir-bar">' +
      '<button type="button" class="route-dir-btn ' + (linksAktiv ? "active" : "") + '" data-route-target="' + links.zoneId + '" title="Richtung wechseln">← <span>' + (links.label || links.zoneId) + '</span></button>' +
      '<button type="button" class="route-dir-btn ' + (rechtsAktiv ? "active" : "") + '" data-route-target="' + rechts.zoneId + '" title="Richtung wechseln"><span>' + (rechts.label || rechts.zoneId) + '</span> →</button>' +
      '</div>';
  }

  if (zone.wildePkmn && zone.wildePkmn.length > 0) {
    var total = zone.wildePkmn.reduce((s,e) => s + e.rate, 0);
    html += '<div class="encounter-section"><div class="encounter-title">🎲 Wilde Pokémon (' + zone.begegnung + '% Chance)</div>';
    zone.wildePkmn.slice().sort((a,b) => b.rate - a.rate).forEach(e => {
      var pd = getPkmn(e.id), pct = Math.round(e.rate / total * 100);
      var sprUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + e.id + '.png';
      html += '<div class="encounter-row">' +
        '<img src="' + sprUrl + '" class="enc-sprite" onerror="this.style.opacity=0">' +
        '<div class="enc-info"><span class="enc-name">' + (pd ? pd.name : "?") + '</span> <span class="enc-lv">Lv.' + e.lvMin + '-' + e.lvMax + '</span></div>' +
        '<div class="enc-right"><div class="enc-bar-wrap"><div class="enc-bar" style="width:' + Math.min(100,pct*2) + '%"></div></div><span class="enc-pct">' + pct + '%</span></div>' +
        '</div>';
    });
    html += '</div>';
  }

  if (zone.trainer && zone.trainer.length > 0) {
    html += '<div class="trainer-section"><div class="encounter-title">⚔️ Trainer</div>';
    zone.trainer.forEach(t => {
      var besiegt = trainerBesiegt(zone.id, t.etappe);
      html += '<div class="trainer-row ' + (besiegt ? "trainer-besiegt" : "") + '">' +
        '<div class="trainer-row-info"><b>' + (t.isRival ? "⚡ Rival: " : "") + t.name + '</b><span class="trainer-etappe"> (Etappe ' + t.etappe + ')</span></div>' +
        '<span class="trainer-status">' + (besiegt ? "✓" : "⚔️") + '</span>' +
        '</div>';
    });
    html += '</div>';
  }

  if (zone.boss) {
    var bossBesiegt = trainerBesiegt(zone.id, "boss");
    html += '<div class="trainer-section"><div class="encounter-title">🏅 Arenaleiter</div>' +
      '<div class="trainer-row ' + (bossBesiegt ? "trainer-besiegt" : "") + '">' +
      '<div class="trainer-row-info"><b>' + zone.boss.name + '</b><span class="trainer-etappe"> (Etappe ' + zone.boss.etappe + ')</span></div>' +
      '<span class="trainer-status">' + (bossBesiegt ? "✓" : "🏅") + '</span>' +
      '</div></div>';
  }

  if (zone._gebaeudeDaten && zone._gebaeudeDaten.length > 0) {
    html += '<div class="trainer-section"><div class="encounter-title">🏠 Orte</div>';
    zone._gebaeudeDaten.forEach(b => {
      if (b.typ === "heilen") return;
      var onclick = "zeigGebaeudeById(" + JSON.stringify(b._id) + "," + JSON.stringify(zone.id) + ")";
      html += '<div class="trainer-row" onclick="' + onclick + '" style="cursor:pointer">' +
        '<div class="trainer-row-info"><b>' + gebaeudeName(b) + '</b></div>' +
        '<span class="trainer-status">→</span>' +
        '</div>';
    });
    html += '</div>';
  }

  if (zone.verbindungen && zone.verbindungen.length > 0) {
    html += '<div class="trainer-section"><div class="encounter-title">🗺️ Wege</div>';
    zone.verbindungen.forEach(v => {
      var ziel = getZone(v.zoneId);
      var gesperrt = v.bedingung && !checkBedingung(v.bedingung, STATE);
      var onclick = gesperrt ? "" : ' onclick="verbindungBetreten(' + JSON.stringify(v.zoneId) + ')" style="cursor:pointer"';
      html += '<div class="trainer-row ' + (gesperrt ? "trainer-besiegt" : "") + '"' + onclick + '>' +
        '<div class="trainer-row-info"><b>' + (v.label || (ziel ? ziel.name : v.zoneId)) + '</b>' +
        (gesperrt ? '<span class="trainer-etappe"> - ' + (v.gesperrtText || "Gesperrt").replace("{badges}", STATE.orden || 0) + '</span>' : '') +
        '</div><span class="trainer-status">' + (gesperrt ? "🔒" : "→") + '</span></div>';
    });
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
  container.querySelectorAll(".route-dir-btn[data-route-target]").forEach(function(btn) {
    btn.addEventListener("click", function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      routeRichtungWaehlen(btn.dataset.routeTarget);
    });
  });
}

function rendereStadtHub(zone) {
  var container = document.getElementById("viewWorld"); if (!container || !zone) return;
  container.innerHTML = "";

  var div = document.createElement("div");
  div.className = "city-hub";

  var header = document.createElement("div");
  header.className = "city-hub-header";
  header.innerHTML = '<h3>' + zone.name + '</h3>';
  div.appendChild(header);

  if (zone._gebaeudeDaten && zone._gebaeudeDaten.length > 0) {
    var heal = zone._gebaeudeDaten.find(b => b.typ === "heilen");
    if (heal) {
      var healCard = document.createElement("div");
      healCard.className = "hub-exit-card";
      healCard.innerHTML = '<div class="hub-exit-label">' + gebaeudeName(heal) + '</div><div class="hub-exit-desc">Team heilen</div>';
      healCard.onclick = () => heilenUndRendere(zone);
      div.appendChild(healCard);
    }

    var gebSection = document.createElement("div");
    gebSection.className = "hub-section";
    gebSection.innerHTML = '<div class="hub-section-title">🏪 Gebäude</div>';
    zone._gebaeudeDaten.forEach(b => {
      if (b.typ === "heilen") return;
      var card = document.createElement("div");
      card.className = "hub-exit-card";
      card.innerHTML = '<div class="hub-exit-label">' + gebaeudeName(b) + '</div>';
      if (b.typ === "shop" || b._shopItems) {
        card.innerHTML += '<div class="hub-exit-desc">Pokémart</div>';
        card.onclick = () => zeigShop(zone, b);
      } else if (b.typ === "gym") {
        var ziel = getZone(b.targetZone);
        var erledigt = !!(b.completedFlag && flagGesetzt(b.completedFlag) && !b.rechallenge);
        var gesperrt = !!(b.bedingung && !checkBedingung(b.bedingung, STATE));
        card.className += (erledigt ? " hub-exit-besiegt" : "") + (gesperrt ? " hub-exit-gesperrt" : "");
        card.innerHTML += '<div class="hub-exit-desc">' + (erledigt ? (b.completedText || "Arena abgeschlossen") : (ziel ? ziel.name : "Arena")) + '</div>';
        if (gesperrt) card.innerHTML += '<div class="hub-gesperrt-text">🔒 ' + (b.gesperrtText || "Gesperrt").replace("{badges}", STATE.orden || 0) + '</div>';
        if (!erledigt && !gesperrt && b.targetZone) card.onclick = () => navigiereZu(b.targetZone);
      } else if (b.typ === "komplex" && b.features) {
        card.innerHTML += '<div class="hub-exit-desc">' + b.features.length + ' Features</div>';
        card.onclick = () => zeigGebaeude(b, zone);
      } else {
        card.onclick = () => zeigGebaeude(b, zone);
      }
      gebSection.appendChild(card);
    });
    div.appendChild(gebSection);
  }

  var ausgaenge = (zone.verbindungen || []).filter(v => {
    var ziel = getZone(v.zoneId);
    return ziel && ziel.typ !== "stadt" && ziel.typ !== "wachposten";
  });
  var wachposten = (zone.verbindungen || []).filter(v => {
    var ziel = getZone(v.zoneId);
    return ziel && ziel.typ === "wachposten";
  });

  var allExits = [...ausgaenge, ...wachposten];
  if (allExits.length > 0) {
    var exitSection = document.createElement("div");
    exitSection.className = "hub-section";
    exitSection.innerHTML = '<div class="hub-section-title">🗺️ Reisen</div>';
    var exitGrid = document.createElement("div");
    exitGrid.className = "hub-exits";

    allExits.forEach(v => {
      var gesperrt = v.bedingung && !checkBedingung(v.bedingung, STATE);
      var card = document.createElement("div");
      card.className = "hub-exit-card" + (gesperrt ? " hub-exit-gesperrt" : "");
      var richtungPfeil = {nord:"↑",sued:"↓",ost:"→",west:"←",mitte:"⬤",nordwest:"↖"}[v.richtung] || "→";
      card.innerHTML = '<div class="hub-exit-label">' + richtungPfeil + ' ' + v.label + '</div>' +
        (gesperrt ? '<div class="hub-gesperrt-text">🔒 ' + (v.gesperrtText || "Gesperrt").replace("{badges}", STATE.orden || 0) + '</div>' : "");
      if (!gesperrt) card.onclick = () => verbindungBetreten(v.zoneId);
      exitGrid.appendChild(card);
    });
    exitSection.appendChild(exitGrid);
    div.appendChild(exitSection);
  }

  container.appendChild(div);
}

function heilenUndRendere(zone) {
  if (STATE && zone && zone.id) STATE.respawnZone = zone.id;
  vollHeilen();
  rendereSpielerSprites();
  aktualisiereHUD();
  speichern();
  zeigToast("💚 Team vollständig geheilt!");
  rendereStadtHub(zone);
}

function gebaeudeName(b) {
  var icons = { heilen:"🏥", shop:"🛒", lore:"💬", komplex:"🏛️", gym:"⚔️" };
  return (icons[b.typ] || "🏠") + " " + (b.name || "Gebäude");
}

// ══════════════════════════════════════════════════════════════
//  SHOP
// ══════════════════════════════════════════════════════════════
