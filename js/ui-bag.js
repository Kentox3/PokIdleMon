function rendereTascheScreen() {
  var container = document.getElementById("bagList"); if (!container || !STATE) return;
  container.innerHTML = "";

  var kategorien = [
    { titel:"Items",       filter: d => !d.einmalig && d.typ && ["heilung","status","beleben","ball"].includes(d.typ) },
    { titel:"Spezial",     filter: d => d.einmalig },
    { titel:"TMs",         filter: d => d.typ === "tm" },
    { titel:"VMs",         filter: d => d.typ === "vm" },
    { titel:"Schluessel",  filter: d => d.typ === "schluessel" },
    { titel:"Steine",      filter: d => d.typ === "stein" },
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
      var schaltbar = istSpeziell && ["fahrrad_tempo","ep_teiler"].includes(def.effekt);
      var istMaschine = def.typ === "tm" || def.typ === "vm";
      var aktiv = schaltbar && itemAktiv(id);
      row.innerHTML =
        `<div class="bag-icon-wrap"><img src="${ITEM_BASE}${id.replace(/_/g,'-')}.png" class="bag-item-sprite" onerror="this.style.display='none'"></div>` +
        `<div class="bag-info"><b>${def.name||id}</b>` + (def.beschr ? `<br><small>${def.beschr}</small>` : "") +
          (istMaschine && MOVES[def.attacke] ? `<br><small>${MOVES[def.attacke].name} beibringen</small>` : "") +
          (schaltbar ? `<br><small class="bag-aktiv">${aktiv ? "Aktiv" : "Inaktiv"}</small>` : "") +
        `</div>` +
        (istMaschine ? `<span class="bag-anzahl">x${anzahl}</span><button onclick="oeffneMaschinenDialog('${id}')">Beibringen</button>` :
          schaltbar ? `<button onclick="toggleAktivesItem('${id}')">${aktiv ? "Deaktivieren" : "Aktivieren"}</button>` :
          istSpeziell ? `<div class="bag-spezial-badge">Besitzt</div>` :
          `<span class="bag-anzahl">x${anzahl}</span>` +
          (["heilung","status","beleben"].includes(def.typ) ? `<button onclick="benutzeItem('${id}')">Nutzen</button>` : "")
        );
      container.appendChild(row);
    });
  });

  if (!gefunden) container.innerHTML = `<p class="bag-leer">Tasche leer</p>`;
}

window.toggleAktivesItem = function(itemId) {
  if (!STATE || !(STATE.items[itemId] > 0)) { zeigToast("Item nicht vorhanden!"); return; }
  var def = ITEM_DEFS[itemId] || {};
  if (!["fahrrad_tempo","ep_teiler"].includes(def.effekt)) {
    zeigToast("Dieses Item kann nicht aktiviert werden.");
    return;
  }
  var wirdAktiv = !itemAktiv(itemId);
  setzeItemAktiv(itemId, wirdAktiv);
  zeigToast((def.name || itemId) + (wirdAktiv ? " aktiviert!" : " deaktiviert!"));
  rendereTascheScreen();
  speichern();
};

window.benutzeItem = function(itemId) {
  if (!STATE || !(STATE.items[itemId]>0)) { zeigToast("Keine mehr!"); return; }
  var spieler = aktivePkmn(); if (!spieler) { zeigToast("Kein aktives Pokemon!"); return; }
  var def = ITEM_DEFS[itemId]||{}, name = (getPkmn(spieler.dexId)||{}).name||"Pokemon";
  if (def.typ === "heilung" && Number.isFinite(Number(def.heilung))) {
    if (spieler.kp >= spieler.maxKP) { zeigToast("KP bereits voll!"); return; }
    spieler.kp = Math.min(spieler.maxKP, spieler.kp + Number(def.heilung));
    STATE.items[itemId]--;
    zeigToast(name + ": " + (def.name||itemId) + " benutzt!");
    rendereTascheScreen(); rendereTeamScreen(); aktualisiereSpielerKP(); speichern();
    return;
  }
  switch (itemId) {
    case "potion":      if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=Math.min(spieler.maxKP,spieler.kp+20); break;
    case "superpotion": if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=Math.min(spieler.maxKP,spieler.kp+50); break;
    case "hyperpotion": if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=Math.min(spieler.maxKP,spieler.kp+200); break;
    case "maxpotion":   if(spieler.kp>=spieler.maxKP){zeigToast("KP bereits voll!");return;} spieler.kp=spieler.maxKP; break;
    case "fullrestore": spieler.kp=spieler.maxKP; spieler.status=null; spieler.statusRunden=0; spieler.attacken.forEach(id=>{spieler.ap[id]=apMax(id);}); break;
    case "fullheal":    spieler.status=null; spieler.statusRunden=0; break;
    case "antidote":    if(spieler.status!=="vergiftung"){zeigToast("Nicht vergiftet!");return;} spieler.status=null; break;
    case "awakening":   if(spieler.status!=="schlaf"){zeigToast("Schlaeft nicht!");return;} spieler.status=null; spieler.statusRunden=0; break;
    case "paralysheal": if(spieler.status!=="laehme"){zeigToast("Nicht gelaehmt!");return;} spieler.status=null; break;
    case "revive": {
      var ko = STATE.party.find(p=>p.kp<=0);
      if(!ko){zeigToast("Kein K.O. Pokemon!");return;}
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

function maschinenPokemonName(p) {
  var pd = getPkmn(p && p.dexId);
  return (p && p.nick) || (pd && pd.name) || "Pokemon";
}

function pokemonKannMaschineLernen(p, def) {
  if (!p || !def || !Array.isArray(def.kompatibel)) return false;
  return def.kompatibel.includes(Number(p.dexId));
}

function istVmAttacke(moveId) {
  return Object.keys(ITEM_DEFS || {}).some(id => {
    var d = ITEM_DEFS[id];
    return d && d.typ === "vm" && d.attacke === moveId;
  });
}

function maschinenModal() {
  var modal = document.getElementById("machineModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "machineModal";
  modal.className = "machine-modal";
  document.body.appendChild(modal);
  return modal;
}

window.schliesseMaschinenDialog = function() {
  var modal = document.getElementById("machineModal");
  if (modal) modal.style.display = "none";
};

window.oeffneMaschinenDialog = function(itemId) {
  if (!STATE || !(STATE.items[itemId] > 0)) { zeigToast("Item nicht vorhanden!"); return; }
  var def = ITEM_DEFS[itemId] || {};
  var move = MOVES[def.attacke];
  if (!move) { zeigToast("Attacke fehlt in den Daten."); return; }
  if (def.typ === "vm" && def.benoetigtOrden && !(STATE.ordenIds || []).includes(def.benoetigtOrden)) {
    zeigToast("Der passende Orden fehlt noch.");
    return;
  }

  var modal = maschinenModal();
  var party = STATE.party || [];
  var rows = party.map((p, idx) => {
    reparierePkmnInst(p);
    var pd = getPkmn(p.dexId) || {};
    var kann = pokemonKannMaschineLernen(p, def);
    var kennt = (p.attacken || []).includes(def.attacke);
    var disabled = (!kann || kennt) ? " disabled" : "";
    var label = kennt ? "Kennt sie" : kann ? "Auswaehlen" : "Nicht kompatibel";
    return `<button class="machine-party-row"${disabled} onclick="waehleMaschinenPokemon('${itemId}',${idx})">` +
      `<span><b>${maschinenPokemonName(p)}</b><small>Lv. ${p.level} - ${(pd.typen || []).join("/")}</small></span>` +
      `<em>${label}</em>` +
    `</button>`;
  }).join("");

  modal.innerHTML =
    `<div class="machine-panel">` +
      `<div class="machine-head"><b>${def.name}</b><button onclick="schliesseMaschinenDialog()">x</button></div>` +
      `<div class="machine-move">${move.name} - ${move.typ} - ${move.staerke || 0} Staerke - ${move.ap} AP</div>` +
      `<div class="machine-list">${rows || "<p>Kein Pokemon im Team.</p>"}</div>` +
    `</div>`;
  modal.style.display = "flex";
};

window.waehleMaschinenPokemon = function(itemId, partyIndex) {
  var def = ITEM_DEFS[itemId] || {};
  var p = STATE && STATE.party && STATE.party[partyIndex];
  if (!p || !pokemonKannMaschineLernen(p, def)) { zeigToast("Dieses Pokemon kann die Attacke nicht lernen."); return; }
  reparierePkmnInst(p);
  if ((p.attacken || []).includes(def.attacke)) { zeigToast("Attacke bereits bekannt."); return; }

  if ((p.attacken || []).length < 4) {
    lerneMaschinenAttacke(itemId, partyIndex, null);
    return;
  }

  var modal = maschinenModal();
  var move = MOVES[def.attacke] || {};
  var rows = (p.attacken || []).map(oldId => {
    var old = MOVES[oldId] || { name: oldId };
    var disabled = istVmAttacke(oldId) ? " disabled" : "";
    var label = istVmAttacke(oldId) ? "VM bleibt" : "Ersetzen";
    return `<button class="machine-party-row"${disabled} onclick="lerneMaschinenAttacke('${itemId}',${partyIndex},'${oldId}')">` +
      `<span><b>${old.name}</b><small>${old.typ || "-"} - ${old.ap || 0} AP</small></span><em>${label}</em>` +
    `</button>`;
  }).join("");

  modal.innerHTML =
    `<div class="machine-panel">` +
      `<div class="machine-head"><b>${maschinenPokemonName(p)} lernt ${move.name}</b><button onclick="schliesseMaschinenDialog()">x</button></div>` +
      `<div class="machine-move">Welche Attacke soll vergessen werden?</div>` +
      `<div class="machine-list">${rows}</div>` +
    `</div>`;
};

window.lerneMaschinenAttacke = function(itemId, partyIndex, ersetzenId) {
  var def = ITEM_DEFS[itemId] || {};
  var move = MOVES[def.attacke];
  var p = STATE && STATE.party && STATE.party[partyIndex];
  if (!p || !move || !(STATE.items[itemId] > 0)) return;
  reparierePkmnInst(p);
  if (!pokemonKannMaschineLernen(p, def)) { zeigToast("Nicht kompatibel."); return; }
  if ((p.attacken || []).includes(def.attacke)) { zeigToast("Attacke bereits bekannt."); return; }

  if (ersetzenId) {
    if (istVmAttacke(ersetzenId)) { zeigToast("VM-Attacken koennen nicht vergessen werden."); return; }
    var idx = p.attacken.indexOf(ersetzenId);
    if (idx < 0) return;
    delete p.ap[ersetzenId];
    p.attacken[idx] = def.attacke;
  } else {
    if (p.attacken.length >= 4) return;
    p.attacken.push(def.attacke);
  }

  if (!p.ap) p.ap = {};
  p.ap[def.attacke] = apMax(def.attacke);
  if (def.typ === "tm") STATE.items[itemId] = Math.max(0, (STATE.items[itemId] || 0) - 1);
  zeigToast(maschinenPokemonName(p) + " lernt " + move.name + "!");
  schliesseMaschinenDialog();
  rendereTascheScreen();
  rendereTeamScreen();
  rendereAttackenButtons();
  speichern();
};
