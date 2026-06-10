// ═══════════════════════════════════════════════════════════════
//  ui.js — Team, Tasche, Karte, HUD, Stadt-Hub, Starter
//  Nativ: verbindungen, kp/ang/vert, deutsche Typ-Namen
// ═══════════════════════════════════════════════════════════════

var ITEM_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/";
var PKM_ART   = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

// ══════════════════════════════════════════════════════════════
//  STARTER-WAHL
// ══════════════════════════════════════════════════════════════
function zeigStarterWahl() {
  zeigScreen("starterScreen");
  var grid = document.getElementById("starterGrid"); if (!grid) return;
  grid.innerHTML = "";
  var starters = [
    { dexId:1,  name:"Bisasam",  typ:"Pflanze/Gift", farbe:"#78C850", emoji:"🌱" },
    { dexId:4,  name:"Glumanda", typ:"Feuer",         farbe:"#F08030", emoji:"🔥" },
    { dexId:7,  name:"Schiggy",  typ:"Wasser",        farbe:"#6890F0", emoji:"💧" },
  ];
  starters.forEach(s => {
    var card = document.createElement("div");
    card.className = "starter-card";
    card.style.borderColor = s.farbe;
    card.innerHTML =
      `<img src="${PKM_ART}${s.dexId}.png" alt="${s.name}">` +
      `<div class="starter-name">${s.name}</div>` +
      `<div class="starter-typ" style="background:${s.farbe}">${s.emoji} ${s.typ}</div>`;
    card.onclick = () => {
      var ni = document.getElementById("trainerName"), name = ni ? ni.value.trim() : "";
      if (!name) { if(ni){ni.focus();ni.style.borderColor="#ef4444";} return; }
      if(ni) ni.style.borderColor = "";
      onStarterGewaehlt(name, s.dexId);
    };
    grid.appendChild(card);
  });
  var ni = document.getElementById("trainerName");
  if (ni) ni.oninput = () => { if(ni.value.trim()) ni.style.borderColor = ""; };
}

// ══════════════════════════════════════════════════════════════
//  HUD
// ══════════════════════════════════════════════════════════════
function aktualisiereHUD() {
  if (!STATE) return;
  var geld   = document.getElementById("hudGeld");
  var orden  = document.getElementById("hudOrden");
  var player = document.getElementById("hudSpieler");
  if (geld)   geld.textContent   = (STATE.geld || 0) + " ₽";
  if (orden)  orden.textContent  = (STATE.orden || 0) + "/8 🏅";
  if (player) player.textContent = STATE.name || "";
}

// ══════════════════════════════════════════════════════════════
//  WELT-TAB (Route/Dungeon-Info)
// ══════════════════════════════════════════════════════════════
function rendereWeltTab() {
  var container = document.getElementById("viewWorld"); if (!container || !STATE) return;
  var zone = getZone(STATE.zone); if (!zone) return;
  if (zone.typ === "stadt" || zone.typ === "wachposten") return;

  var icon = {route:"🌿",dungeon:"🕳️",see:"🌊",gym:"⚔️"}[zone.typ] || "📍";
  var html = '<div class="zone-info-panel"><div class="zone-info-header">' + icon + ' <b>' + zone.name + '</b></div>';

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

  html += '</div>';
  container.innerHTML = html;
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
  vollHeilen();
  rendereSpielerSprites();
  aktualisiereHUD();
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
function zeigShop(zone, gebaeude) {
  var popup = document.getElementById("shopPopup"); if (!popup) return;
  popup.style.display = "flex";
  var list = document.getElementById("shopItemList"); if (!list) return;
  list.innerHTML = "";
  var items = gebaeude.stock || zone._shopItems || [];
  if (items.length === 0) { list.innerHTML = "<p>Keine Items verfügbar.</p>"; return; }
  items.forEach(item => {
    var def = ITEM_DEFS[item.id] || {};
    var kannKaufen = (STATE.geld || 0) >= item.preis;
    var row = document.createElement("div"); row.className = "shop-row";
    row.innerHTML =
      `<div class="shop-info"><b>${item.name || def.name || item.id}</b></div>` +
      `<div class="shop-preis">${item.preis} ₽</div>` +
      `<button ${kannKaufen ? "" : "disabled"} onclick="kaufeItem('${item.id}',${item.preis},this)">Kaufen</button>`;
    list.appendChild(row);
  });
}
window.schliesseShop = function() { var p=document.getElementById("shopPopup");if(p)p.style.display="none"; };
window.kaufeItem = function(itemId, preis, btn) {
  if (!STATE || (STATE.geld||0) < preis) { zeigToast("Nicht genug Geld!"); return; }
  var def = ITEM_DEFS[itemId] || {};
  if (def.einmalig && (STATE.items[itemId]||0) > 0) { zeigToast((def.name||itemId) + " bereits vorhanden!"); return; }
  STATE.geld -= preis;
  STATE.items[itemId] = (STATE.items[itemId]||0) + 1;
  aktualisiereHUD();
  if (btn && btn.parentNode) {
    if ((STATE.geld||0) < preis) btn.disabled = true;
  }
  zeigToast((def.name||itemId) + " erhalten!");
  speichern();
};

// ══════════════════════════════════════════════════════════════
//  GEBÄUDE-ANSICHT (Features)
// ══════════════════════════════════════════════════════════════
function zeigGebaeude(gebaeude, zone) {
  var container = document.getElementById("viewWorld"); if (!container) return;
  var html = `<div class="gebaeude-view">` +
    `<div class="gebaeude-header"><button onclick="rendereStadtHub(getZone('${zone.id}'))">← Zurück</button><h3>${gebaeude.name||"?"}</h3></div>`;

  (gebaeude.features || []).forEach(feat => {
    var getan = flagGesetzt(feat.flagId);
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
    var bld = BUILDINGS[gebId]; if (!bld) return;
    var feat = (bld.features||[]).find(f => f.id === featId); if (!feat) return;
    if (flagGesetzt(feat.flagId)) return;
    if (feat.bedingung && !checkBedingung(feat.bedingung, STATE)) { zeigToast(feat.gesperrtText||"Gesperrt"); return; }

    switch (feat.typ) {
      case "lore":
        zeigDialog(feat.text||"...", () => { setzeFlag(feat.flagId); speichern(); zeigGebaeude(bld, getZone(zoneId)); });
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

function zeigDialog(text, callback) {
  var overlay = document.createElement("div"); overlay.className = "dialog-overlay";
  overlay.innerHTML =
    `<div class="dialog-box">` +
    `<div class="dialog-text">${text.replace(/\n/g,"<br>")}</div>` +
    `<button class="dialog-ok" id="dialogOkBtn">OK</button>` +
    `</div>`;
  document.body.appendChild(overlay);
  document.getElementById("dialogOkBtn").onclick = () => {
    document.body.removeChild(overlay);
    if (callback) callback();
  };
}

// ══════════════════════════════════════════════════════════════
//  TEAM-SCREEN
// ══════════════════════════════════════════════════════════════
function rendereTeamScreen() {
  var container = document.getElementById("teamList"); if (!container || !STATE) return;
  container.innerHTML = "";
  var n = STATE.party.length;

  STATE.party.forEach((p, idx) => {
    var pd = getPkmn(p.dexId), name = p.nick || (pd ? pd.name : "?");
    var shiny = !!p.shiny;
    var kpPct = Math.max(0, Math.round(p.kp / p.maxKP * 100));
    var xpPct = Math.min(100, Math.round(p.xp / p.xpBis * 100));
    var entwicklung = !!p.entwickeltSich;

    var card = document.createElement("div");
    card.className = "team-card" + (p.kp <= 0 ? " team-ko" : "") + (entwicklung ? " team-evo-bereit" : "") + (shiny ? " team-shiny" : "");
    card.innerHTML =
      `<img class="team-sprite${shiny?" sprite-shiny":""}" src="${spriteUrl(p.dexId,false,shiny)}" onerror="this.src='${spriteFallback(p.dexId,shiny)}'">` +
      `<div class="team-info">` +
        `<div class="team-nameline">` +
          `<b>${shiny?"✨":""}${name}</b>` +
          `<span class="team-lv">Lv.${p.level}</span>` +
          (shiny ? `<span class="team-shiny-badge">✨ Shiny</span>` : "") +
          (p.status ? `<span class="status-badge status-${p.status}">${statusText(p.status)}</span>` : "") +
          (idx === 0 ? `<span class="team-lead">★ Lead</span>` : "") +
          (entwicklung ? `<span class="team-evo-badge">✨ Entwicklung!</span>` : "") +
        `</div>` +
        `<div class="team-typen">${pd ? pd.typen.map(t=>`<span class="typ-badge" style="background:${typFarbe(t)}">${t}</span>`).join("") : ""}</div>` +
        `<div class="team-hprow"><div class="team-hpbar"><div class="team-hpfill" style="width:${kpPct}%;background:${kpFarbe(p.kp,p.maxKP)}"></div></div><span class="team-hptxt">${p.kp}/${p.maxKP}</span></div>` +
        `<div class="team-xprow"><div class="team-xpbar"><div class="team-xpfill" style="width:${xpPct}%"></div></div><span class="team-xptxt">EP ${p.xp}/${p.xpBis}</span></div>` +
        `<div class="team-attacken">${(p.attacken||[]).map(id=>{var m=MOVES[id];return m?`<span class="mini-move" style="border-color:${typFarbe(m.typ)}">${m.name}</span>`:"";}).join("")}</div>` +
        (entwicklung ?
          `<button class="team-evo-btn" onclick="triggerEvolution(${idx})">` +
          `<img src="${spriteFallback(p.entwickeltSich,false)}" class="team-evo-vorschau">` +
          `✨ Zu ${(getPkmn(p.entwickeltSich)||{}).name||"?"} entwickeln!</button>` : "") +
      `</div>` +
      `<div class="team-aktionen">` +
        `<button class="team-akt-sm" ${idx===0?"disabled":""} onclick="partyHoch(${idx})" title="Nach oben">↑</button>` +
        `<button class="team-akt-sm" ${idx===n-1?"disabled":""} onclick="partyRunter(${idx})" title="Nach unten">↓</button>` +
        `<button class="team-akt-sm" ${idx===0?"disabled":""} onclick="setzeLeadPkmn(${idx})" title="Als Lead">★</button>` +
        `<button class="team-akt-sm${_inStadt?"":" team-akt-deakt"}" ` +
          (_inStadt ? `onclick="inBoxLegen(${idx})" title="In Box"` : `disabled title="Nur in Städten"`) +
          `>📦</button>` +
      `</div>`;
    container.appendChild(card);
  });

  // Box-Vorschau
  var boxVorschau = document.getElementById("boxPreview");
  if (boxVorschau) {
    if (!STATE.box || STATE.box.length === 0) {
      boxVorschau.innerHTML = `<p class="box-leer">Box ist leer</p>`;
    } else {
      boxVorschau.innerHTML = STATE.box.map((p,i) => {
        var pd = getPkmn(p.dexId), shiny = !!p.shiny;
        var click = _inStadt ? `onclick="ausBoxHolen(${i})"` : `onclick="zeigToast('Nur in Städten möglich!')" style="cursor:not-allowed"`;
        return `<div class="box-mini${shiny?" box-mini-shiny":""}" ${click}>` +
          (shiny ? `<div class="box-shiny-star">✨</div>` : "") +
          `<img src="${spriteFallback(p.dexId,shiny)}" onerror="this.style.opacity=0">` +
          `<div class="box-mini-label">${pd?pd.name:"?"} Lv.${p.level}${p.shiny?" ✨":""}</div>` +
          (!_inStadt ? `<div class="box-mini-sperr">🔒</div>` : "") +
          `</div>`;
      }).join("");
    }
  }

  if (!_inStadt) {
    var hinweis = document.createElement("div"); hinweis.className = "box-hinweis";
    hinweis.textContent = "🔒 Box-Wechsel nur in Pokécentern möglich";
    container.appendChild(hinweis);
  }
}

// ── Party-Operationen ─────────────────────────────────────────
window.setzeLeadPkmn = function(idx) { if(!STATE||idx===0)return; STATE.party.unshift(STATE.party.splice(idx,1)[0]); rendereTeamScreen(); rendereSpielerSprites(); speichern(); };
window.partyHoch  = function(idx) { if(!STATE||idx<=0)return; var t=STATE.party[idx];STATE.party[idx]=STATE.party[idx-1];STATE.party[idx-1]=t; if(idx===1)rendereSpielerSprites(); rendereTeamScreen(); speichern(); };
window.partyRunter= function(idx) { if(!STATE||idx>=STATE.party.length-1)return; var t=STATE.party[idx];STATE.party[idx]=STATE.party[idx+1];STATE.party[idx+1]=t; if(idx===0)rendereSpielerSprites(); rendereTeamScreen(); speichern(); };
window.inBoxLegen = function(idx) {
  if(!_inStadt){zeigToast("📦 Nur in Städten möglich!");return;}
  if(!STATE||STATE.party.length<=1){zeigToast("Mindestens 1 Pokémon in der Party!");return;}
  var p=STATE.party.splice(idx,1)[0]; inBox(p);
  if(idx===0)rendereSpielerSprites(); rendereTeamScreen(); speichern();
  zeigToast((getPkmn(p.dexId)||{}).name + (p.shiny?" ✨":"") + " → Box");
};
window.ausBoxHolen= function(idx) {
  if(!_inStadt){zeigToast("📦 Nur in Städten möglich!");return;}
  if(!STATE||STATE.party.length>=6){zeigToast("Party ist voll! (max. 6)");return;}
  var p=STATE.box.splice(idx,1)[0]; STATE.party.push(p);
  rendereTeamScreen(); speichern();
  zeigToast((getPkmn(p.dexId)||{}).name + (p.shiny?" ✨":"") + " → Party");
};

// ── Evolution ─────────────────────────────────────────────────
window.triggerEvolution = function(idx) {
  var p = STATE.party[idx]; if (!p || !p.entwickeltSich) return;
  var altName = p.nick || (getPkmn(p.dexId)||{}).name || "?";
  var neuId   = p.entwickeltSich;
  var neuPd   = getPkmn(neuId);
  // Stats neu berechnen
  p.dexId = neuId; p.entwickeltSich = null;
  var ivs=p.ivs, evs=p.evs;
  p.maxKP = berechneKP(neuPd.kp, p.level, ivs.kp, evs.kp);
  p.kp    = Math.min(p.kp, p.maxKP);
  p.ang   = berechneStat(neuPd.ang,   p.level, ivs.ang,  evs.ang);
  p.vert  = berechneStat(neuPd.vert,  p.level, ivs.vert, evs.vert);
  p.spAng = berechneStat(neuPd.spAng, p.level, ivs.spez, evs.spez);
  p.spVert= berechneStat(neuPd.spVert,p.level, ivs.spez, evs.spez);
  p.init  = berechneStat(neuPd.init,  p.level, ivs.init, evs.init);
  STATE.gefangen[neuId] = true; STATE.gesehen[neuId] = true;
  speichern();
  zeigToast("✨ " + altName + " → " + (neuPd.name||"?") + "!", 3500);
  rendereTeamScreen(); rendereSpielerSprites();
};

// ══════════════════════════════════════════════════════════════
//  TASCHE
// ══════════════════════════════════════════════════════════════
function rendereTascheScreen() {
  var container = document.getElementById("bagList"); if (!container || !STATE) return;
  container.innerHTML = "";

  var kategorien = [
    { titel:"💊 Items",       filter: d => !d.einmalig && d.typ && ["heilung","status","beleben","ball"].includes(d.typ) },
    { titel:"⭐ Spezial",     filter: d => d.einmalig },
    { titel:"📀 VMs",         filter: d => d.typ === "vm" },
    { titel:"🗝️ Schlüssel",  filter: d => d.typ === "schluessel" },
    { titel:"🪨 Steine",      filter: d => d.typ === "stein" },
  ];

  var gefunden = false;
  kategorien.forEach(kat => {
    var keys = Object.keys(STATE.items||{}).filter(id => {
      var anz = STATE.items[id]; if (!anz || anz <= 0) return false;
      var def = ITEM_DEFS[id]; if (!def) return false;
      return kat.filter(def);
    });
    if (keys.length === 0) return;
    gefunden = true;
    var header = document.createElement("div"); header.className = "bag-section-header"; header.textContent = kat.titel;
    container.appendChild(header);
    keys.forEach(id => {
      var def = ITEM_DEFS[id] || {}, anzahl = STATE.items[id] || 0;
      var row = document.createElement("div"); row.className = "bag-item";
      var istSpeziell = def.einmalig && anzahl > 0;
      row.innerHTML =
        `<div class="bag-icon-wrap"><img src="${ITEM_BASE}${id.replace(/_/g,'-')}.png" class="bag-item-sprite" onerror="this.style.display='none'"></div>` +
        `<div class="bag-info"><b>${def.name||id}</b>` + (def.beschr ? `<br><small>${def.beschr}</small>` : "") +
          (istSpeziell && def.beschr ? `<br><small class="bag-aktiv">✅ Aktiv</small>` : "") +
        `</div>` +
        (istSpeziell ? `<div class="bag-spezial-badge">Aktiv</div>` :
          `<span class="bag-anzahl">x${anzahl}</span>` +
          (["heilung","status","beleben"].includes(def.typ) ? `<button onclick="benutzeItem('${id}')">Nutzen</button>` : "")
        );
      container.appendChild(row);
    });
  });

  if (!gefunden) container.innerHTML = `<p class="bag-leer">Tasche leer</p>`;
}

window.benutzeItem = function(itemId) {
  if (!STATE || !(STATE.items[itemId]>0)) { zeigToast("Keine mehr!"); return; }
  var spieler = aktivePkmn(); if (!spieler) { zeigToast("Kein aktives Pokémon!"); return; }
  var def = ITEM_DEFS[itemId]||{}, name = (getPkmn(spieler.dexId)||{}).name||"Pokémon";
  switch (itemId) {
    case "potion":      if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=Math.min(spieler.maxKP,spieler.kp+20); break;
    case "superpotion": if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=Math.min(spieler.maxKP,spieler.kp+50); break;
    case "hyperpotion": if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=Math.min(spieler.maxKP,spieler.kp+200); break;
    case "maxpotion":   if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=spieler.maxKP; break;
    case "fullrestore": spieler.kp=spieler.maxKP; spieler.status=null; spieler.statusRunden=0; spieler.attacken.forEach(id=>{spieler.ap[id]=apMax(id);}); break;
    case "fullheal":    spieler.status=null; spieler.statusRunden=0; break;
    case "antidote":    if(spieler.status!=="vergiftung"){zeigToast("Nicht vergiftet!");return;} spieler.status=null; break;
    case "awakening":   if(spieler.status!=="schlaf"){zeigToast("Schläft nicht!");return;} spieler.status=null; spieler.statusRunden=0; break;
    case "paralysheal": if(spieler.status!=="laehme"){zeigToast("Nicht gelähmt!");return;} spieler.status=null; break;
    case "revive": {
      var ko = STATE.party.find(p=>p.kp<=0);
      if(!ko){zeigToast("Kein K.O. Pokémon!");return;}
      ko.kp=Math.floor(ko.maxKP/2);
      zeigToast((getPkmn(ko.dexId)||{}).name+" belebt!");
      STATE.items[itemId]--; rendereTascheScreen(); rendereTeamScreen(); speichern(); return;
    }
    default: zeigToast("Hier nicht verwendbar."); return;
  }
  STATE.items[itemId]--;
  zeigToast(name + ": " + (def.name||itemId) + " benutzt!");
  rendereTascheScreen(); rendereTeamScreen(); aktualisiereSpielerKP(); speichern();
};

// ══════════════════════════════════════════════════════════════
//  KARTE
// ══════════════════════════════════════════════════════════════
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
  var hatFliegen = STATE.items && (STATE.items["hm_fly"]||0) > 0;
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

function triggereMewtu(zone, wp) {
  var wildData = { dexId: wp.dexId||150, level: wp.level||70, shiny: false };
  zeigToast(wp.text || "MEWTU taucht auf!", 2500);
  setzeFlag(wp.flagId);
  _wartetAufInput = false;
  setTimeout(() => { triggereWildKampf(wildData, zone); }, 2600);
}
