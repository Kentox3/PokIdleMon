// ═══════════════════════════════════════════════════════════════
//  renderer.js — Sprites, Animationen, Kampf-UI
//  BG-Bilder aus bg/ wo vorhanden, Canvas-Fallback für den Rest
// ═══════════════════════════════════════════════════════════════

var PKM_URL  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
var SD_FRONT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
var SD_BACK  = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/";

function spriteUrl(dexId, ruecken, shiny) {
  var base = ruecken
    ? (shiny ? SD_BACK + "shiny/" : SD_BACK)
    : (shiny ? SD_FRONT + "shiny/" : SD_FRONT);
  return base + dexId + ".gif";
}
function spriteFallback(dexId, shiny) {
  return PKM_URL + (shiny ? "shiny/" : "") + dexId + ".png";
}
function typFarbe(typ) { return TYPE_COLORS[typ] || "#888"; }

// ── BG-Bilder: Zone-ID → Dateiname ───────────────────────────
var BG_MAP = {
  "alabastia":        "Alabastia.png",
  "viridian_city":    "VertaniaCity.png",
  "pewter_city":      "MamoriaCity.png",
  "cerulean_city":    "AzuriaCity.png",
  "vermilion_city":   "OraniaCity.png",
  "lavender_town":    "LavandiaCity.png",
  "celadon_city":     "PrismaniaCity.png",
  "fuchsia_city":     "FuchsaniaCity.png",
  "saffron_city":     "SafroniaCity.png",
  "cinnabar_island":  "Zinnoberinsel.png",
  "route1":           "Route1.png",
  "route2":           "Route2.png",
  "route3_west":      "Route3.png",
  "route3_east":      "Route3.png",
  "route4":           "Route4.png",
  "viridian_forest":  "VertaniaWald.png",
  // Alle anderen Zonen → Canvas-Fallback
};

// BG-Image-Cache: zone.id → HTMLImageElement (oder null wenn nicht vorhanden)
var _bgCache = {};

function _ladeBgBild(zoneId, callback) {
  if (_bgCache[zoneId] !== undefined) { callback(_bgCache[zoneId]); return; }
  var datei = BG_MAP[zoneId];
  if (!datei) { _bgCache[zoneId] = null; callback(null); return; }
  var img = new Image();
  img.onload  = function() { _bgCache[zoneId] = img; callback(img); };
  img.onerror = function() { _bgCache[zoneId] = null; callback(null); };
  img.src = "bg/" + datei;
}

// ── Canvas-Szene ──────────────────────────────────────────────
var _sceneCanvas = null, _sceneCtx = null, _sceneAnimId = null, _sceneT = 0;
var _bgImg = null; // aktuell geladenes BG-Bild

function rendereZoneBg(zone) {
  if (!zone) return;
  if (_sceneAnimId) cancelAnimationFrame(_sceneAnimId);
  var view = document.getElementById("sceneView"); if (!view) return;

  if (!_sceneCanvas) {
    _sceneCanvas = document.createElement("canvas");
    _sceneCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:1";
    view.insertBefore(_sceneCanvas, view.firstChild);
    _sceneCtx = _sceneCanvas.getContext("2d");
  }
  _sceneCanvas.width  = view.clientWidth  || 480;
  _sceneCanvas.height = view.clientHeight || 220;
  _sceneT = 0;
  _bgImg = null;

  _ladeBgBild(zone.id, function(img) {
    _bgImg = img; // null = kein Bild → Canvas-Fallback
    _startCanvasLoop(zone);
  });
}

function _startCanvasLoop(zone) {
  if (_sceneAnimId) cancelAnimationFrame(_sceneAnimId);
  var W = _sceneCanvas.width, H = _sceneCanvas.height;
  var c = _sceneCtx;

  // Welche Canvas-Fallback-Funktion?
  var fallbackFn;
  if      (zone.typ === "see")     fallbackFn = () => zeichneMeer(c, W, H, _sceneT);
  else if (zone.typ === "dungeon") fallbackFn = () => zeichneHoehle(c, W, H, _sceneT);
  else if (zone.typ === "gym")     fallbackFn = () => zeichneArena(c, W, H, _sceneT);
  else if (zone.typ === "stadt" || zone.typ === "wachposten")
                                   fallbackFn = () => zeichneStadt(c, W, H, _sceneT);
  else                             fallbackFn = () => zeichneRoute(c, W, H, _sceneT, zone);

  function loop() {
    if (_bgImg) {
      // BG-Bild: einmal zeichnen, dann Overlay-Effekte drüber
      c.drawImage(_bgImg, 0, 0, W, H);
      // Leichtes Zeit-Overlay (Tageszeit-Schimmer) — optional
      // c.fillStyle = "rgba(0,0,0,0)"; c.fillRect(0,0,W,H);
    } else {
      // Canvas-Fallback
      try { fallbackFn(); } catch(e) {}
    }
    _sceneT++;
    _sceneAnimId = requestAnimationFrame(loop);
  }
  loop();
}

// ── Canvas-Fallback-Zeichner ──────────────────────────────────
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}

function zeichneRoute(c,W,H,t){
  var g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#87ceeb");g.addColorStop(0.6,"#87ceeb");g.addColorStop(1,"#5aaa2a");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  px(c,0,H*0.58,W,H*0.42,"#5aaa2a");
  px(c,0,H*0.7,W,H*0.3,"#3a7a12");
  px(c,W*0.38,H*0.58,W*0.14,H*0.42,"#c8a878");
  [[0.04,0.22],[0.72,0.22],[0.88,0.24]].forEach(([x,y])=>zeichneBaum(c,x*W,y*H,1.1));
  [[0.06,0.10],[0.72,0.12]].forEach(([x,y])=>{
    var wx=x*W+Math.sin(t*0.005)*8;
    c.fillStyle="rgba(255,255,255,.8)";c.fillRect(wx,y*H,30,12);c.fillRect(wx+5,y*H-7,20,10);
  });
}

function zeichneHoehle(c,W,H,t){
  px(c,0,0,W,H,"#0a0810");px(c,0,H*0.75,W,H*0.25,"#1a1020");
  for(var i=0;i<12;i++){
    c.fillStyle="#1a1520";c.beginPath();
    c.moveTo(i*42,0);c.lineTo(i*42+10,0);c.lineTo(i*42+5,15+Math.sin(i*1.7)*10);
    c.closePath();c.fill();
  }
  [W*.12,W*.38,W*.62,W*.88].forEach(tx=>{
    px(c,tx,H*.5,5,26,"#5a3a18");
    c.fillStyle="#ff8800";
    c.fillRect(tx-3+Math.sin(t*.15+tx)*2,H*.5-14,12,16);
  });
}

function zeichneMeer(c,W,H,t){
  var g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#1a5fa0");g.addColorStop(1,"#3a9de0");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  px(c,0,H*.4,W,H*.6,"#1a5090");
  for(var i=0;i<5;i++){
    c.fillStyle=`rgba(${30+i*15},${100+i*20},${180+i*10},.5)`;
    var wy=H*.42+i*H*.11;
    c.beginPath();c.moveTo(0,wy);
    for(var x=0;x<=W;x+=4) c.lineTo(x,wy+Math.sin(x/80+t*(5-i)*.06)*(7-i));
    c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fill();
  }
}

function zeichneStadt(c,W,H,t){
  var g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#7aadca");g.addColorStop(1,"#c0d8e0");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  px(c,0,H*.73,W,H*.27,"#9a8878");
  [[0,50,68,90,"#8899aa"],[68,35,78,110,"#99aacc"],[204,25,88,115,"#aabbcc"],[360,40,58,105,"#8899bb"]]
    .forEach(b=>px(c,b[0],b[1],b[2],b[3],b[4]));
}

function zeichneArena(c,W,H,t){
  var g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#2a1040");g.addColorStop(1,"#4a2060");
  c.fillStyle=g;c.fillRect(0,0,W,H);
  px(c,0,H*.75,W,H*.25,"#2a1535");
}

function zeichneBaum(c,x,y,s){
  s=s||1;var tw=20*s,th=42*s;
  px(c,x+tw*.3,y+th*.67,tw*.4,th*.33,"#6b3a1f");
  c.fillStyle="#2d5a1b";
  c.fillRect(x,y+th*.4,tw,th*.35);
  c.fillRect(x+tw*.1,y+th*.2,tw*.8,th*.28);
  c.fillRect(x+tw*.25,y,tw*.5,th*.25);
}

// ── Angelszene ────────────────────────────────────────────────
function setzeAngelSzene(aktiv) {
  var view = document.getElementById("sceneView"); if (!view) return;
  view.classList.toggle("fishing-scene", !!aktiv);
  if (!aktiv) {
    var zone = getZone(STATE && STATE.zone);
    if (zone) rendereZoneBg(zone);
    return;
  }
  if (_sceneAnimId) cancelAnimationFrame(_sceneAnimId);
  if (!_sceneCanvas) {
    _sceneCanvas = document.createElement("canvas");
    _sceneCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:1";
    view.insertBefore(_sceneCanvas, view.firstChild);
    _sceneCtx = _sceneCanvas.getContext("2d");
  }
  _sceneCanvas.width  = view.clientWidth  || 480;
  _sceneCanvas.height = view.clientHeight || 220;
  _sceneT = 0;

  // Angelszene: BG-Bild wenn vorhanden + Angelruten-Overlay
  var zoneId = STATE && STATE.zone;
  _ladeBgBild(zoneId, function(img) {
    var c = _sceneCtx, W = _sceneCanvas.width, H = _sceneCanvas.height;
    function loop() {
      if (img) {
        c.drawImage(img, 0, 0, W, H);
        // Halbtransparentes Wasser-Overlay
        c.fillStyle = "rgba(26,80,144,.35)";
        c.fillRect(0, H * .58, W, H * .42);
      } else {
        zeichneMeer(c, W, H, _sceneT);
      }
      // Angelrute
      c.strokeStyle="#d7c08a"; c.lineWidth=4;
      c.beginPath(); c.moveTo(W*.18,H*.72); c.lineTo(W*.34,H*.34); c.stroke();
      // Schnur
      c.strokeStyle="rgba(255,255,255,.85)"; c.lineWidth=1;
      c.beginPath(); c.moveTo(W*.34,H*.34);
      c.lineTo(W*.58, H*.56 + Math.sin(_sceneT*.12)*4); c.stroke();
      // Schwimmer
      c.fillStyle="#f04f4f";
      c.beginPath(); c.arc(W*.58, H*.56 + Math.sin(_sceneT*.12)*4, 5, 0, Math.PI*2); c.fill();
      _sceneT++;
      _sceneAnimId = requestAnimationFrame(loop);
    }
    loop();
  });
}

// ── Angriffs-Animation ────────────────────────────────────────
var TYPE_FX = {
  Normal:{col:"#a8a77a",glow:"#fff"},    Feuer:{col:"#ee8130",glow:"#ffa060"},
  Wasser:{col:"#6390f0",glow:"#90b8ff"}, Elektro:{col:"#f7d02c",glow:"#ffe060"},
  Pflanze:{col:"#7ac74c",glow:"#a0e070"},Eis:{col:"#96d9d6",glow:"#c0f0ee"},
  Kampf:{col:"#c22e28",glow:"#f06060"},  Gift:{col:"#a33ea1",glow:"#d070d0"},
  Boden:{col:"#e2bf65",glow:"#f0d890"},  Flug:{col:"#a98ff3",glow:"#c0b0ff"},
  Psycho:{col:"#f95587",glow:"#ffaabb"},"Käfer":{col:"#a6b91a",glow:"#c8e030"},
  Gestein:{col:"#b6a136",glow:"#d8c060"},Geist:{col:"#735797",glow:"#a080c0"},
  Drachen:{col:"#6f35fc",glow:"#a070ff"},
};
var _fxCanvas = null, _fxCtx = null;

function holeFxCanvas() {
  var v = document.getElementById("sceneView"); if (!v) return null;
  if (!_fxCanvas) {
    _fxCanvas = document.createElement("canvas");
    _fxCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:25;pointer-events:none";
    v.appendChild(_fxCanvas);
    _fxCtx = _fxCanvas.getContext("2d");
  }
  _fxCanvas.width  = v.clientWidth  || 480;
  _fxCanvas.height = v.clientHeight || 220;
  return _fxCanvas;
}

function fuehreAngriffAnimation(moveTyp, vonSpieler, onTreffer, onFertig) {
  var cv = holeFxCanvas();
  if (!cv) { if (onTreffer) onTreffer(); setTimeout(() => { if (onFertig) onFertig(); }, 100); return; }
  var c = _fxCtx, W = cv.width, H = cv.height;
  var fx = TYPE_FX[moveTyp] || TYPE_FX["Normal"];
  var pX=W*.22, pY=H*.52, gX=W*.72, gY=H*.38;
  var srcX=vonSpieler?pX:gX, srcY=vonSpieler?pY:gY, dstX=vonSpieler?gX:pX, dstY=vonSpieler?gY:pY;
  var start=null, hitDone=false, fertigDone=false;
  function loop(ts) {
    if (!start) start = ts;
    var el = ts - start;
    c.clearRect(0, 0, W, H);
    if (el < 320) {
      var p=el/320, e=p<.5?2*p*p:-1+(4-2*p)*p;
      var cx=srcX+(dstX-srcX)*e, cy=srcY+(dstY-srcY)*e-Math.sin(p*Math.PI)*30;
      var dg=c.createRadialGradient(cx,cy,0,cx,cy,10);
      dg.addColorStop(0,fx.glow); dg.addColorStop(.6,fx.col); dg.addColorStop(1,"rgba(0,0,0,0)");
      c.fillStyle=dg; c.beginPath(); c.arc(cx,cy,10,0,Math.PI*2); c.fill();
      requestAnimationFrame(loop);
    } else {
      if (!hitDone) { hitDone=true; if (onTreffer) onTreffer(); }
      var ip=(el-320)/280;
      if (ip <= 1) {
        c.globalAlpha=1-ip;
        var dg2=c.createRadialGradient(dstX,dstY,0,dstX,dstY,ip*40);
        dg2.addColorStop(0,fx.glow); dg2.addColorStop(.5,fx.col); dg2.addColorStop(1,"rgba(0,0,0,0)");
        c.fillStyle=dg2; c.beginPath(); c.arc(dstX,dstY,ip*40,0,Math.PI*2); c.fill();
        c.globalAlpha=1;
        requestAnimationFrame(loop);
      } else {
        c.clearRect(0,0,W,H);
        if (!fertigDone) { fertigDone=true; if (onFertig) onFertig(); }
      }
    }
  }
  requestAnimationFrame(loop);
}

// ── Spieler-Sprite ────────────────────────────────────────────
function rendereSpielerSprites() {
  var container = document.getElementById("playerSprites");
  if (!container || !STATE) return;
  container.innerHTML = "";
  var lead = aktivePkmn(); if (!lead) return;
  var pd = getPkmn(lead.dexId), name = lead.nick || (pd ? pd.name : "?");
  var shiny = !!lead.shiny;
  var kpPct = Math.max(0, Math.round(lead.kp / lead.maxKP * 100));
  var xpPct = Math.min(100, Math.round(lead.xp / lead.xpBis * 100));
  var typenHtml = pd ? pd.typen.map(t =>
    `<span class="typ-badge typ-badge-sm" style="background:${typFarbe(t)}">${t}</span>`).join("") : "";
  var gescHtml = lead.geschlecht==="M" ? `<span class="geschlecht-m">♂</span>`
               : lead.geschlecht==="W" ? `<span class="geschlecht-w">♀</span>` : "";
  var statusHtml = lead.status ?
    `<span class="status-badge status-${lead.status}">${statusText(lead.status)}</span>` : "";
  var div = document.createElement("div");
  div.className = "walker walker-lead" + (shiny ? " walker-shiny" : "");
  div.innerHTML =
    `<img class="walker-sprite${shiny?" sprite-shiny":""}" src="${spriteUrl(lead.dexId,true,shiny)}" onerror="this.src='${spriteFallback(lead.dexId,shiny)}'">` +
    `<div class="walker-info">` +
      `<div class="walker-nameline"><b>${shiny?"✨":""} ${name}</b>${gescHtml}<span class="walker-lv">Lv.${lead.level}</span>${statusHtml}</div>` +
      `<div class="walker-typen">${typenHtml}</div>` +
      `<div class="walker-hprow"><div class="walker-hpbar"><div class="walker-hpfill" style="width:${kpPct}%;background:${kpFarbe(lead.kp,lead.maxKP)}"></div></div><span class="walker-hptxt">${lead.kp}/${lead.maxKP}</span></div>` +
      `<div class="walker-xprow"><div class="walker-xpbar"><div class="walker-xpfill" style="width:${xpPct}%"></div></div><span class="walker-xptxt">EP</span></div>` +
    `</div>`;
  container.appendChild(div);
}

// ── Gegner-Sprite ─────────────────────────────────────────────
function rendereGegnerSprite(gegner, sichtbar) {
  var container = document.getElementById("enemySprite"); if (!container) return;
  if (!gegner || !sichtbar) { container.innerHTML = ""; container.style.opacity = "0"; return; }
  var pd = getPkmn(gegner.dexId), name = pd ? pd.name : "?";
  var typenHtml = pd ? pd.typen.map(t =>
    `<span class="typ-badge typ-badge-sm" style="background:${typFarbe(t)}">${t}</span>`).join("") : "";
  var gescHtml = gegner.geschlecht==="M" ? `<span class="geschlecht-m">♂</span>`
               : gegner.geschlecht==="W" ? `<span class="geschlecht-w">♀</span>` : "";
  var kpPct = Math.max(0, Math.round(gegner.kp / gegner.maxKP * 100));
  container.style.opacity = "1";
  container.innerHTML =
    `<div class="enemy-info">` +
      `<div class="enemy-nameline">${name}${gescHtml} <span class="enemy-lv">Lv.${gegner.level}</span>${typenHtml}</div>` +
      `<div class="enemy-hprow"><div class="enemy-hpbar"><div class="enemy-hpfill" id="gegnerHpFill" style="width:${kpPct}%;background:${kpFarbe(gegner.kp,gegner.maxKP)}"></div></div><span class="enemy-hptxt" id="gegnerHpTxt">${gegner.kp}/${gegner.maxKP}</span></div>` +
      (gegner.status ? `<span class="status-badge status-${gegner.status}">${statusText(gegner.status)}</span>` : "") +
    `</div>` +
    `<img class="enemy-img enemy-appear" src="${spriteUrl(gegner.dexId,false,false)}" onerror="this.src='${spriteFallback(gegner.dexId,false)}'">`;
}

function aktualisiereGegnerKP(gegner) {
  var fill=document.getElementById("gegnerHpFill"), txt=document.getElementById("gegnerHpTxt");
  if (!gegner) return;
  if (fill) { fill.style.width=Math.max(0,Math.round(gegner.kp/gegner.maxKP*100))+"%"; fill.style.background=kpFarbe(gegner.kp,gegner.maxKP); }
  if (txt)  txt.textContent = gegner.kp + "/" + gegner.maxKP;
}
function aktualisiereSpielerKP() {
  var p = aktivePkmn(); if (!p) return;
  var fill=document.querySelector(".walker-hpfill"), txt=document.querySelector(".walker-hptxt");
  if (fill) { fill.style.width=Math.max(0,Math.round(p.kp/p.maxKP*100))+"%"; fill.style.background=kpFarbe(p.kp,p.maxKP); }
  if (txt)  txt.textContent = p.kp + "/" + p.maxKP;
  var xpF = document.querySelector(".walker-xpfill");
  if (xpF) xpF.style.width = Math.min(100,Math.round(p.xp/p.xpBis*100)) + "%";
}

// ── Attacken-Buttons ──────────────────────────────────────────
function rendereAttackenButtons() {
  var container = document.getElementById("moveButtons"); if (!container) return;
  var spieler = aktivePkmn(); if (!spieler) { container.innerHTML = ""; return; }
  container.innerHTML = "";
  if (!spieler.ap) spieler.ap = initAP(spieler.attacken || []);
  var alleAP = !hatAP(spieler);
  spieler.attacken.forEach(id => {
    var move = MOVES[id]; if (!move) return;
    var curAP = Math.max(0, parseInt(spieler.ap[id]) || 0);
    var maxAP = Math.max(1, apMax(id));
    var keinAP = curAP <= 0 && !alleAP;
    var col = keinAP ? "#333" : typFarbe(move.typ);
    var btn = document.createElement("button");
    btn.className = "move-btn" + (keinAP ? " move-btn-leer" : "");
    btn.disabled = keinAP;
    btn.style.borderColor = keinAP ? "#444" : col;
    btn.innerHTML =
      `<span class="move-name">${move.name}</span>` +
      `<span class="move-typ" style="background:${keinAP?"#333":col}">${move.typ}</span>` +
      `<span class="move-ap ${curAP===0?"move-ap-leer":curAP<=Math.floor(maxAP/4)?"move-ap-niedrig":""}">${curAP}/${maxAP}</span>`;
    if (!keinAP) btn.onclick = () => onAttackeKlick(id);
    container.appendChild(btn);
  });
  if (alleAP) {
    var sb = document.createElement("button");
    sb.className = "move-btn move-btn-struggle";
    var sm = MOVES["struggle"] || { name: "Kräftemessen" };
    sb.innerHTML = `<span class="move-name">${sm.name}</span><span class="move-typ" style="background:#888">Normal</span>`;
    sb.onclick = () => onAttackeKlick("struggle");
    container.appendChild(sb);
  }
}

// ── Wurfball-Buttons ──────────────────────────────────────────
function rendereWurfBaelle(sichtbar) {
  var container = document.getElementById("catchBalls"); if (!container) return;
  container.innerHTML = "";
  if (!sichtbar || !STATE || !KAMPF || !KAMPF.kannFangen || KAMPF.vorbei) return;
  var BALL_SPRITES = {
    pokeball:   "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
    superball:  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
    hyperball:  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
    masterball: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
  };
  ["pokeball","superball","hyperball","masterball"].forEach(typ => {
    var anzahl = STATE.items[typ] || 0; if (anzahl <= 0) return;
    var btn = document.createElement("button"); btn.className = "ball-btn";
    btn.innerHTML = `<img src="${BALL_SPRITES[typ]}" width="24" height="24" onerror="this.style.display='none'"><span class="ball-count">${anzahl}</span>`;
    btn.onclick = () => onBallKlick(typ);
    container.appendChild(btn);
  });
}

// ── Ball-Animation ────────────────────────────────────────────
function werfeBallAnimation(ballTyp, callback) {
  var BALLS = { pokeball:"poke-ball", superball:"great-ball", hyperball:"ultra-ball", masterball:"master-ball" };
  var url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${BALLS[ballTyp]||"poke-ball"}.png`;
  var scene = document.getElementById("sceneView");
  if (!scene) { if (callback) callback(); return; }
  var img = document.createElement("img"); img.src = url;
  img.style.cssText = "position:absolute;width:28px;height:28px;image-rendering:pixelated;z-index:50;pointer-events:none";
  scene.appendChild(img);
  var start=null, W=scene.clientWidth||480, H=scene.clientHeight||220;
  var sx=W*.22, sy=H*.55, ex=W*.68, ey=H*.38;
  function step(ts) {
    if (!start) start = ts;
    var p = Math.min((ts - start) / 500, 1);
    var e = p<.5 ? 2*p*p : -1+(4-2*p)*p;
    img.style.left = (sx+(ex-sx)*e)+"px";
    img.style.top  = (sy+(ey-sy)*e-H*.2*Math.sin(p*Math.PI))+"px";
    img.style.transform = `rotate(${p*540}deg)`;
    if (p < 1) { requestAnimationFrame(step); return; }
    var w=0, wd=1;
    var wi = setInterval(() => {
      w++; wd=-wd; img.style.transform=`rotate(${wd*12}deg)`;
      if (w >= 5) { clearInterval(wi); img.style.transform=""; setTimeout(() => { if (img.parentNode) img.parentNode.removeChild(img); if (callback) callback(); }, 150); }
    }, 140);
  }
  requestAnimationFrame(step);
}

// ── Kampf-UI ─────────────────────────────────────────────────
function zeigKampfUI(gegner) {
  var ui = document.getElementById("battlePanel"); if (ui) ui.classList.add("battle-active");
  rendereAttackenButtons();
  rendereWurfBaelle(KAMPF && KAMPF.kannFangen && !KAMPF.vorbei);
}
function versteckeKampfUI() {
  var ui = document.getElementById("battlePanel"); if (ui) ui.classList.remove("battle-active");
  var mb = document.getElementById("moveButtons"); if (mb) mb.innerHTML = "";
  rendereWurfBaelle(false);
}

// ── Kampf-Log ─────────────────────────────────────────────────
function fuegeKampfLogHinzu(zeilen) {
  var log = document.getElementById("battleLog"); if (!log) return;
  if (typeof zeilen === "string") zeilen = [zeilen];
  zeilen.forEach(z => {
    if (!z) return;
    var p = document.createElement("p"); p.textContent = z;
    log.appendChild(p);
    while (log.children.length > 40) log.removeChild(log.firstChild);
  });
  log.scrollTop = log.scrollHeight;
}
function clearKampfLog() { var l=document.getElementById("battleLog"); if(l) l.innerHTML=""; }

// ── HUD & Stufen ──────────────────────────────────────────────
function rendereStufenInfo() {
  if (!STATE) return;
  var zone = getZone(STATE.zone); if (!zone) return;
  var zEl = document.getElementById("zoneName"), sEl = document.getElementById("stageInfo");
  if (zEl) zEl.textContent = zone.name;
  if (sEl && zone.etappen) {
    var icon = {route:"🌿",dungeon:"🕳️",see:"🌊",wachposten:"🚧",stadt:"🏙️",gym:"⚔️"}[zone.typ] || "📍";
    sEl.textContent = icon + " Etappe " + STATE.etappe + " / " + zone.etappen;
  } else if (sEl) {
    sEl.textContent = "";
  }
  var bar = document.getElementById("stageProgressFill");
  if (bar && zone.etappen) bar.style.width = Math.round((STATE.etappe-1)/zone.etappen*100)+"%";
  else if (bar) bar.style.width = "0%";
}

// ── Helfer ────────────────────────────────────────────────────
function kpFarbe(kp, max) { var p=max>0?kp/max:0; return p>.5?"#44cc44":p>.25?"#ffbb22":"#ee4444"; }
function statusText(s) { return {verbrennung:"VBR",vergiftung:"GIF",laehme:"LÄH",schlaf:"SCH",einfriere:"EIS",verwirre:"VWR"}[s]||(s||"").slice(0,3).toUpperCase(); }

function zeigToast(text, ms) {
  var z = document.getElementById("toastZone"); if (!z) return;
  var el = document.createElement("div"); el.className="toast"; el.textContent=text;
  z.appendChild(el);
  setTimeout(() => { el.classList.add("toast-fade"); setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 400); }, ms || 2500);
}
function zeigXPPopup(xp) {
  var el=document.getElementById("xpPopup"); if(!el) return;
  el.textContent="+"+xp+" EP"; el.style.opacity="1"; el.style.transform="translateY(-30px)";
  setTimeout(()=>{ el.style.opacity="0"; el.style.transform="translateY(-60px)"; }, 1800);
}
function zeigScreen(id) {
  ["starterScreen","gameScreen","loadScreen","authScreen"].forEach(sid => {
    var el=document.getElementById(sid); if(el) el.style.display=(sid===id?"flex":"none");
  });
}
function wechsleTab(name) {
  var tabMap  = {"Welt":"viewWorld","Angeln":"viewFishing","Team":"viewTeam","Tasche":"viewBag","Karte":"viewMap","Dex":"viewDex"};
  var btnMap  = {"Welt":"tabWelt","Angeln":"tabAngeln","Team":"tabTeam","Tasche":"tabTasche","Karte":"tabKarte","Dex":"tabDex"};
  Object.values(tabMap).forEach(id => { var el=document.getElementById(id); if(el) el.style.display="none"; });
  Object.values(btnMap).forEach(id => { var el=document.getElementById(id); if(el) el.classList.remove("active"); });
  var view=document.getElementById(tabMap[name]), btn=document.getElementById(btnMap[name]);
  if (view) view.style.display="block";
  if (btn)  btn.classList.add("active");
  if (typeof aktualisiereAngelTabStatus === "function") aktualisiereAngelTabStatus();
  if (name==="Angeln")   rendereAngelTab();
  if (name==="Team")     rendereTeamScreen();
  if (name==="Tasche")   rendereTascheScreen();
  if (name==="Welt" && !_inStadt) rendereWeltTab();
}
