function rendereTeamScreen() {
  var container = document.getElementById("teamList"); if (!container || !STATE) return;
  container.innerHTML = "";
  var n = STATE.party.length;

  STATE.party.forEach((p, idx) => {
    reparierePkmnInst(p);
    var pd = getPkmn(p.dexId), name = p.nick || (pd ? pd.name : "?");
    var shiny = !!p.shiny;
    var kpPct = Math.max(0, Math.round(p.kp / p.maxKP * 100));
    var xpPct = Math.min(100, Math.round(p.xp / p.xpBis * 100));
    var entwicklung = !!p.entwickeltSich;

    var card = document.createElement("div");
    card.className = "team-card" + (p.kp <= 0 ? " team-ko" : "") + (entwicklung ? " team-evo-bereit" : "") + (shiny ? " team-shiny" : "");
    card.innerHTML =
      `<img class="team-sprite${shiny?" sprite-shiny":""}" src="${spriteFallback(p.dexId,shiny)}" onerror="this.style.opacity=0">` +
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
// Evolution overlay restored from IdleV2 style.
var _evoAnimationLaeuft = false;

function schliesseEvoOverlay(overlay) {
  if (!overlay) return;
  overlay.classList.add("evo-fadeout");
  setTimeout(function() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    _evoAnimationLaeuft = false;
  }, 450);
}

function zeigeEvoAnimation(altDexId, neuDexId, altName, neuName, shiny, anwenden) {
  var overlay = document.createElement("div");
  overlay.id = "evoOverlay";
  overlay.innerHTML =
    `<div class="evo-screen">` +
      `<div class="evo-label" id="evoLabel">${altName} entwickelt sich...</div>` +
      `<div class="evo-sprites">` +
        `<img id="evoFrom" class="evo-sprite${shiny ? " evo-shiny" : ""}" src="${spriteFallback(altDexId, shiny)}">` +
        `<img id="evoTo" class="evo-sprite evo-sprite-hidden${shiny ? " evo-shiny" : ""}" src="${spriteFallback(neuDexId, shiny)}">` +
      `</div>` +
      `<div class="evo-stats" id="evoStats" hidden></div>` +
      `<button class="evo-close" id="evoClose" hidden>Weiter</button>` +
      `<div class="evo-flash-overlay" id="evoFlash"></div>` +
    `</div>`;
  document.body.appendChild(overlay);

  var fromEl = document.getElementById("evoFrom");
  var toEl = document.getElementById("evoTo");
  var label = document.getElementById("evoLabel");
  var flash = document.getElementById("evoFlash");
  var stats = document.getElementById("evoStats");
  var close = document.getElementById("evoClose");
  var pulse = 0;

  function pulsiere() {
    if (pulse >= 7) {
      flash.style.transition = "opacity .35s";
      flash.style.opacity = "1";
      setTimeout(wechsel, 360);
      return;
    }
    flash.style.transition = "opacity .16s";
    flash.style.opacity = (pulse % 2 === 0) ? ".85" : "0";
    pulse++;
    setTimeout(pulsiere, 170);
  }

  function wechsel() {
    fromEl.classList.add("evo-sprite-hidden");
    toEl.classList.remove("evo-sprite-hidden");
    setTimeout(function() {
      flash.style.transition = "opacity .45s";
      flash.style.opacity = "0";
      label.textContent = "Herzlichen Glueckwunsch!";
    }, 90);
    setTimeout(fertig, 650);
  }

  function fertig() {
    var p = anwenden();
    label.innerHTML = `${altName} hat sich zu <b>${neuName}</b> entwickelt!`;
    if (p) {
      stats.innerHTML =
        `<div class="evo-stat"><span>KP</span><b>${p.maxKP}</b></div>` +
        `<div class="evo-stat"><span>Ang</span><b>${p.ang}</b></div>` +
        `<div class="evo-stat"><span>Vert</span><b>${p.vert}</b></div>` +
        `<div class="evo-stat"><span>Init</span><b>${p.init}</b></div>`;
      stats.hidden = false;
    }
    close.hidden = false;
    close.onclick = function() { schliesseEvoOverlay(overlay); };
    setTimeout(function() { if (overlay.parentNode) schliesseEvoOverlay(overlay); }, 2600);
  }

  setTimeout(pulsiere, 600);
}

window.triggerEvolution = function(idx) {
  var p = STATE.party[idx]; if (!p || !p.entwickeltSich) return;
  if (_evoAnimationLaeuft) return;
  _evoAnimationLaeuft = true;
  var altName = p.nick || (getPkmn(p.dexId)||{}).name || "?";
  var altId = p.dexId;
  var neuId = p.entwickeltSich;
  var neuPd = getPkmn(neuId);
  var shiny = !!p.shiny;
  if (!neuPd) { _evoAnimationLaeuft = false; return; }

  zeigeEvoAnimation(altId, neuId, altName, neuPd.name || "?", shiny, function() {
    var oldMax = p.maxKP || 1;
    p.dexId = neuId; p.entwickeltSich = null;
    var ivs = p.ivs || {}, evs = p.evs || {};
    p.maxKP = berechneKP(neuPd.kp, p.level, ivs.kp || 0, evs.kp || 0);
    p.kp = Math.min(p.maxKP, Math.max(1, (p.kp || 1) + (p.maxKP - oldMax)));
    p.ang = berechneStat(neuPd.ang, p.level, ivs.ang || 0, evs.ang || 0);
    p.vert = berechneStat(neuPd.vert, p.level, ivs.vert || 0, evs.vert || 0);
    p.spAng = berechneStat(neuPd.spAng, p.level, ivs.spez || 0, evs.spez || 0);
    p.spVert = berechneStat(neuPd.spVert, p.level, ivs.spez || 0, evs.spez || 0);
    p.init = berechneStat(neuPd.init, p.level, ivs.init || 0, evs.init || 0);
    if (STATE.gefangen) STATE.gefangen[neuId] = true;
    if (STATE.gesehen) STATE.gesehen[neuId] = true;
    speichern();
    rendereTeamScreen();
    rendereSpielerSprites();
    zeigToast("Entwicklung abgeschlossen: " + altName + " -> " + (neuPd.name || "?"), 3500);
    return p;
  });
};
