// ═══════════════════════════════════════════════════════════════
//  renderer.js — Canvas-Szenen + Kampf-UI + Ball-Sprites + Portraits
// ═══════════════════════════════════════════════════════════════

var SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
var SPRITE_BACK = SPRITE_BASE + "back/";

function spriteUrl(dexId, back) {
  return (back ? SPRITE_BACK : SPRITE_BASE) + dexId + ".png";
}

// ── Canvas-Szenen-System ───────────────────────────────────────
var _sceneCanvas = null, _sceneCtx = null, _sceneAnimId = null, _sceneT = 0;

function getSceneCanvas() {
  var view = document.getElementById("sceneView");
  if (!view) return null;
  if (!_sceneCanvas) {
    _sceneCanvas = document.createElement("canvas");
    _sceneCanvas.id = "sceneCv";
    _sceneCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated";
    view.insertBefore(_sceneCanvas, view.firstChild);
    _sceneCtx = _sceneCanvas.getContext("2d");
  }
  _sceneCanvas.width  = view.clientWidth  || 480;
  _sceneCanvas.height = view.clientHeight || 220;
  return _sceneCanvas;
}

function renderZoneBg(zone) {
  if (!zone) return;
  if (_sceneAnimId) cancelAnimationFrame(_sceneAnimId);
  getSceneCanvas();
  if (!_sceneCtx) return;
  _sceneT = 0;
  var drawFn;
  if      (zone.type==="sea")     drawFn=function(){drawSea(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if (zone.type==="gym")     drawFn=function(){drawGym(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if (zone.type==="city")    drawFn=function(){drawCity(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if (zone.type==="dungeon") {
    if (zone.id.indexOf("forest")>=0) drawFn=function(){drawForest(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else if (zone.id==="pokemon_tower") drawFn=function(){drawTower(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else drawFn=function(){drawCave(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  }
  else drawFn=function(){drawRoute(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT,zone);};
  function loop(){try{drawFn();}catch(e){} _sceneT++; _sceneAnimId=requestAnimationFrame(loop);}
  loop();
}

// ── Hilfsfunktion ─────────────────────────────────────────────
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}

// ── ROUTE ─────────────────────────────────────────────────────
function drawRoute(c,W,H,t,zone){
  var sky=(zone&&zone.bgSky)||"#87ceeb",gnd=(zone&&zone.bgGround)||"#5aaa2a",mid=(zone&&zone.bgMid)||"#70b050";
  var grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,sky);grad.addColorStop(0.55,sky);grad.addColorStop(0.75,mid);grad.addColorStop(1,gnd);
  c.fillStyle=grad;c.fillRect(0,0,W,H);
  c.fillStyle="rgba(180,210,180,0.6)";[[0,50,70],[80,42,90],[170,48,80],[260,38,100],[360,45,90],[430,40,80]].forEach(function(m){c.beginPath();c.moveTo(m[0],m[1]);c.lineTo(m[0]+m[2]/2,m[1]-35);c.lineTo(m[0]+m[2],m[1]);c.closePath();c.fill();});
  px(c,0,H*0.58,W,H*0.42,gnd);px(c,0,H*0.7,W,H*0.3,"#3a7a12");
  px(c,W*0.38,H*0.58,W*0.14,H*0.42,"#c8a878");px(c,W*0.39,H*0.58,4,H*0.42,"#b09060");px(c,W*0.50,H*0.58,4,H*0.42,"#b09060");
  for(var i=0;i<W;i+=5){var h2=Math.sin(i*0.8+t*0.08)*4+6;c.fillStyle=i%10<5?"#4aaa22":"#3a8a18";c.fillRect(i,H*0.58-h2,3,h2);}
  [[0.04,0.22,1.2],[0.15,0.25,1.0],[0.72,0.22,1.3],[0.85,0.24,1.1],[0.92,0.23,1.0]].forEach(function(tr){drawTree(c,tr[0]*W,tr[1]*H,tr[2],H);});
  [[0.30,0.58],[0.55,0.56],[0.68,0.55]].forEach(function(b){drawBush(c,b[0]*W,b[1]*H);});
  ["#ff6688","#ffcc22","#ff88aa","#fff"].forEach(function(col,i){c.fillStyle=col;c.fillRect(50+i*70,H*0.54,4,4);c.fillRect(52+i*70,H*0.52,4,4);});
  [[0.06,0.1,1],[0.38,0.08,0.8],[0.72,0.12,1.1]].forEach(function(cl){drawCloud(c,cl[0]*W+Math.sin(t*0.005)*8,cl[1]*H,cl[2]);});
}
function drawTree(c,x,y,s){s=s||1;var tw=20*s,th=42*s;px(c,x+tw*0.3,y+th*0.67,tw*0.4,th*0.33,"#6b3a1f");c.fillStyle="#2d5a1b";c.fillRect(x,y+th*0.4,tw,th*0.35);c.fillRect(x+tw*0.1,y+th*0.2,tw*0.8,th*0.28);c.fillRect(x+tw*0.25,y,tw*0.5,th*0.25);c.fillStyle="#4a8a2d";c.fillRect(x+tw*0.1,y+th*0.22,tw*0.3,th*0.1);c.fillRect(x+tw*0.05,y+th*0.42,tw*0.35,th*0.12);}
function drawBush(c,x,y){c.fillStyle="#3a7a22";c.fillRect(x,y+8,20,10);c.fillRect(x+3,y,14,12);c.fillStyle="#5aaa32";c.fillRect(x+2,y+2,6,4);}
function drawCloud(c,x,y,s){s=s||1;c.fillStyle="rgba(255,255,255,0.85)";[[0,0,20,10],[10,-8,24,12],[28,-2,20,10],[6,6,36,8]].forEach(function(d){c.fillRect(x+d[0]*s,y+d[1]*s,d[2]*s,d[3]*s);});}

// ── FOREST ────────────────────────────────────────────────────
function drawForest(c,W,H,t){px(c,0,0,W,H,"#0d1a08");for(var i=0;i<6;i++){c.fillStyle="rgba(160,255,80,"+(0.04+Math.sin(t*0.03+i)*0.015)+")";c.fillRect(60+i*70,0,14,H);}px(c,0,H*0.72,W,H*0.28,"#1a3a08");px(c,0,H*0.80,W,H*0.20,"#142d06");for(var j=0;j<8;j++){var tx=j*68-10,dark=["#0d2208","#162e0a","#0a1a06"][j%3];px(c,tx+10,H*0.28,10,H*0.5,"#3d1f0a");c.fillStyle=dark;c.fillRect(tx,H*0.1,30,H*0.42);c.fillRect(tx+3,H*0.05,24,H*0.2);c.fillRect(tx+7,0,16,H*0.1);}for(var k=0;k<5;k++)drawTree(c,30+k*90,H*0.38,1.1);c.fillStyle="#2a1208";for(var r=0;r<8;r++)c.fillRect(r*60,H*0.73,8,15);for(var f=0;f<14;f++){var fx=40+f*32,fy=H*0.45+Math.sin(t*0.07+f*1.3)*30;c.fillStyle="rgba(180,255,100,"+(0.4+Math.sin(t*0.1+f)*0.45)+")";c.fillRect(fx|0,fy|0,3,3);}}

// ── CAVE ──────────────────────────────────────────────────────
function drawCave(c,W,H,t){px(c,0,0,W,H,"#1a1820");px(c,0,H*0.75,W,H*0.25,"#2a2530");px(c,0,H*0.80,W,H*0.20,"#1a1520");c.fillStyle="#2d2830";for(var i=0;i<14;i++){var sx=6+i*36,sh=18+Math.sin(i*1.7)*13;c.beginPath();c.moveTo(sx,0);c.lineTo(sx+10,0);c.lineTo(sx+5,sh);c.closePath();c.fill();}c.fillStyle="#252030";for(var j=0;j<11;j++){var jx=15+j*45,jh=12+Math.sin(j*2.1)*10;c.beginPath();c.moveTo(jx,H*0.78);c.lineTo(jx+12,H*0.78);c.lineTo(jx+6,H*0.78-jh);c.closePath();c.fill();}[W*0.12,W*0.38,W*0.62,W*0.88].forEach(function(tx){var ty=H*0.48;px(c,tx,ty,6,28,"#5a3a18");var fi=Math.sin(t*0.15+tx)*3;c.fillStyle="#ff8800";c.fillRect(tx-4+fi,ty-16,14,18);c.fillStyle="#ffcc00";c.fillRect(tx-1+fi,ty-12,8,12);c.fillStyle="#fff";c.fillRect(tx+1+fi,ty-9,4,6);var gr=c.createRadialGradient(tx+3,ty-5,2,tx+3,ty-5,42);gr.addColorStop(0,"rgba(255,160,0,0.22)");gr.addColorStop(1,"rgba(255,100,0,0)");c.fillStyle=gr;c.fillRect(tx-40,ty-48,86,90);});c.fillStyle="rgba(140,100,255,0.55)";[[W*0.15,H*0.7],[W*0.42,H*0.72],[W*0.78,H*0.69]].forEach(function(cr){for(var k=0;k<4;k++){c.beginPath();c.moveTo(cr[0]+k*7,cr[1]);c.lineTo(cr[0]+k*7+4,cr[1]);c.lineTo(cr[0]+k*7+2,cr[1]-14-k*2);c.closePath();c.fill();}});}

// ── TOWER ─────────────────────────────────────────────────────
function drawTower(c,W,H,t){px(c,0,0,W,H,"#0a080f");for(var i=0;i<4;i++){var gy=H*0.2+i*H*0.2+Math.sin(t*0.04+i)*8;c.fillStyle="rgba(100,60,180,"+(0.06+Math.sin(t*0.05+i)*0.03)+")";c.fillRect(0,gy,W,30);}px(c,0,H*0.75,W,H*0.25,"#120a18");c.fillStyle="#1a0f22";for(var j=0;j<6;j++)c.fillRect(0,H*0.76+j*7,W,4);c.fillStyle="rgba(60,30,90,0.5)";for(var k=0;k<6;k++)c.fillRect(k*90,0,10,H*0.76);for(var f=0;f<8;f++){var ox=40+f*58+Math.sin(t*0.04+f)*20,oy=H*0.3+Math.sin(t*0.06+f*1.4)*35,alpha=0.3+Math.sin(t*0.08+f)*0.25;c.fillStyle="rgba(180,120,255,"+alpha+")";c.fillRect(ox|0,oy|0,8,8);}[W*0.1,W*0.35,W*0.65,W*0.9].forEach(function(cx){var cy=H*0.6;px(c,cx,cy,4,16,"#eee");c.fillStyle="#ffaa00";c.fillRect(cx+1,cy-8,2,10);var cg=c.createRadialGradient(cx+2,cy-4,1,cx+2,cy-4,20);cg.addColorStop(0,"rgba(255,180,0,0.2)");cg.addColorStop(1,"rgba(255,100,0,0)");c.fillStyle=cg;c.fillRect(cx-18,cy-24,40,40);});}

// ── CITY ──────────────────────────────────────────────────────
function drawCity(c,W,H,t){var sg=c.createLinearGradient(0,0,0,H);sg.addColorStop(0,"#7aadca");sg.addColorStop(0.6,"#a8ccdd");sg.addColorStop(1,"#c0d8e0");c.fillStyle=sg;c.fillRect(0,0,W,H);px(c,0,H*0.73,W,H*0.27,"#9a8878");for(var y=H*0.75|0;y<H;y+=8){var off=((y/8|0)%2===0)?0:6;for(var bx2=off;bx2<W;bx2+=14){px(c,bx2,y,12,6,"#8a7868");px(c,bx2,y,12,1,"#aaa898");}}[[0,50,68,90,"#8899aa"],[68,35,78,110,"#99aacc"],[146,44,58,100,"#7788aa"],[204,25,88,115,"#aabbcc"],[292,50,68,95,"#8899bb"],[360,40,58,105,"#99aabb"],[418,30,62,115,"#7799cc"]].forEach(function(b){px(c,b[0],b[1],b[2],b[3],b[4]);for(var wy=b[1]+10;wy<b[1]+b[3]-10;wy+=18){for(var wx=b[0]+6;wx<b[0]+b[2]-6;wx+=16){var lit=((wy/18|0)+(wx/16|0))%4===0;px(c,wx,wy,8,10,lit?"#ffee88":"#cce8ff");px(c,wx,wy,8,1,"#aad8ff");}}px(c,b[0],b[1],b[2],5,"#667799");});px(c,W*0.41,H*0.35,W*0.18,H*0.38,"#ff9999");px(c,W*0.41,H*0.35,W*0.18,8,"#cc6666");px(c,W*0.43,H*0.32,W*0.14,12,"#ff6666");px(c,W*0.45,H*0.48,W*0.10,H*0.18,"#fff");px(c,W*0.46,H*0.49,W*0.08,H*0.14,"#ff4444");drawTree(c,W*0.06,H*0.44,0.9);drawTree(c,W*0.88,H*0.43,0.9);[W*0.25,W*0.75].forEach(function(lx){px(c,lx,H*0.45,4,H*0.3,"#666");c.fillStyle="#eecc00";c.fillRect(lx-6,H*0.43,16,8);var lg=c.createRadialGradient(lx+2,H*0.47,2,lx+2,H*0.47,30);lg.addColorStop(0,"rgba(255,230,100,0.25)");lg.addColorStop(1,"rgba(255,230,100,0)");c.fillStyle=lg;c.fillRect(lx-28,H*0.3,60,60);});}

// ── GYM ───────────────────────────────────────────────────────
function drawGym(c,W,H,t){var gg=c.createLinearGradient(0,0,0,H);gg.addColorStop(0,"#2a1040");gg.addColorStop(1,"#4a2060");c.fillStyle=gg;c.fillRect(0,0,W,H);for(var fy=H*0.72|0;fy<H;fy+=10){for(var fx=(fy/10|0)%2===0?0:5;fx<W;fx+=20){px(c,fx,fy,18,8,fy%20===0?"#2a1545":"#221035");}}[0.06,0.24,0.48,0.72,0.90].forEach(function(p2){var pg=c.createLinearGradient(p2*W,0,(p2*W+20),0);pg.addColorStop(0,"#4a2a6a");pg.addColorStop(0.5,"#6a3a8a");pg.addColorStop(1,"#3a1a5a");c.fillStyle=pg;c.fillRect(p2*W,H*0.15,20,H*0.6);px(c,p2*W,H*0.15,20,6,"#8a5aaa");px(c,p2*W,H*0.72,20,6,"#8a5aaa");});[0.22,0.50,0.78].forEach(function(bx,i){var pulse=Math.sin(t*0.12+i*2)*0.28;var bg=c.createLinearGradient(bx*W,0,bx*W,H);bg.addColorStop(0,"rgba(180,100,255,0)");bg.addColorStop(0.5,"rgba(180,100,255,"+(0.18+pulse)+")");bg.addColorStop(1,"rgba(180,100,255,0)");c.fillStyle=bg;c.fillRect(bx*W-5,0,10,H);});var sg2=c.createRadialGradient(W/2,H*0.75,10,W/2,H*0.75,120);sg2.addColorStop(0,"rgba(255,200,100,0.18)");sg2.addColorStop(1,"rgba(200,100,255,0)");c.fillStyle=sg2;c.fillRect(W/2-120,H*0.4,240,120);for(var s=0;s<22;s++){var sx=Math.sin(s*137)*220+240,sy=Math.sin(s*97)*40+30;c.fillStyle="rgba(255,220,255,"+(0.5+Math.sin(t*0.05+s)*0.4)+")";c.fillRect(sx|0,sy|0,2,2);}[[W*0.12,H*0.2],[W*0.82,H*0.2]].forEach(function(bn){px(c,bn[0],bn[1],28,55,"#6a1a8a");px(c,bn[0]+4,bn[1]+8,20,7,"#ff88ff");px(c,bn[0]+4,bn[1]+20,20,7,"#ff88ff");px(c,bn[0]+4,bn[1]+32,20,7,"#ff88ff");});}

// ── SEA ───────────────────────────────────────────────────────
function drawSea(c,W,H,t){var ss=c.createLinearGradient(0,0,0,H);ss.addColorStop(0,"#1a5fa0");ss.addColorStop(0.5,"#2a7fc0");ss.addColorStop(1,"#3a9de0");c.fillStyle=ss;c.fillRect(0,0,W,H);c.fillStyle="rgba(255,255,200,0.12)";c.fillRect(W*0.38,H*0.4,W*0.24,H);px(c,0,H*0.4,W,H*0.6,"#1a5090");for(var wl=0;wl<5;wl++){var wy2=H*0.42+wl*H*0.11,spd=(5-wl)*0.06,amp=7-wl,wlen=80+wl*20;c.fillStyle="rgba("+(20+wl*15)+","+(100+wl*20)+","+(180+wl*10)+",0.55)";c.beginPath();c.moveTo(0,wy2);for(var wx2=0;wx2<=W;wx2+=4){c.lineTo(wx2,wy2+Math.sin(wx2/wlen+t*spd)*amp+Math.cos(wx2/40+t*spd*0.7)*2);}c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fill();}c.fillStyle="rgba(255,255,255,0.38)";for(var fc=0;fc<7;fc++){var fcx=(fc*88+t*2)%W,fcy=H*0.44+Math.sin(fc*1.3+t*0.03)*22;c.fillRect(fcx,fcy,28+Math.sin(t*0.1+fc)*10,3);}[W*0.1,W*0.78,W*0.92].forEach(function(rx){px(c,rx,H*0.65,32,28,"#445566");px(c,rx+3,H*0.62,26,10,"#334455");c.fillStyle="rgba(255,255,255,0.28)";c.fillRect(rx,H*0.65,32,3);});for(var bb=0;bb<9;bb++){var bx=28+bb*52,by2=H*0.75-((t*0.5+bb*30)%(H*0.3));c.fillStyle="rgba(200,230,255,"+(0.25+Math.sin(t*0.1+bb)*0.2)+")";c.fillRect(bx|0,by2|0,4,4);}[[0.17,0.15],[0.42,0.22],[0.74,0.12]].forEach(function(sg3,i){var gx=sg3[0]*W+Math.sin(t*0.04+i)*8,gy3=sg3[1]*H;c.fillStyle="rgba(255,255,255,0.9)";c.beginPath();c.arc(gx,gy3,3,Math.PI,0);c.fill();c.beginPath();c.arc(gx+9,gy3,3,Math.PI,0);c.fill();});}

// ── Spieler-Sprites ───────────────────────────────────────────
function renderPlayerSprites() {
  var container=document.getElementById("playerSprites"); if(!container||!STATE) return;
  container.innerHTML="";
  STATE.party.filter(function(p){return p.currentHP>0;}).slice(0,3).forEach(function(p,i){
    var pd=PKMN[p.dexId], div=document.createElement("div");
    div.className="walker"+(i===0?" walker-lead":" walker-follow");
    div.style.zIndex=10-i;
    div.style.transform="translateX("+(i*-28)+"px)";
    var hpPct=Math.max(0,Math.round(p.currentHP/p.maxHP*100));
    div.innerHTML=
      "<img src='"+spriteUrl(p.dexId,true)+"' alt='"+(pd?pd.name:"?")+"' onerror='this.src=\""+spriteUrl(p.dexId,false)+"\"'>"+
      (i===0?"<div class='walker-hpbar'><div class='walker-hpfill' style='width:"+hpPct+"%;background:"+hpColor(p.currentHP,p.maxHP)+"'></div></div>":"");
    container.appendChild(div);
  });
}

// ── Gegner-Sprite ─────────────────────────────────────────────
function renderEnemySprite(enemy,visible){
  var container=document.getElementById("enemySprite"); if(!container) return;
  if(!enemy||!visible){container.innerHTML="";container.style.opacity="0";return;}
  var pd=PKMN[enemy.dexId],name=pd?pd.name:"?";
  var typeHtml=pd?pd.types.map(function(t2){return "<span class='type-badge' style='background:"+(TYPE_COLORS[t2]||"#aaa")+"'>"+t2+"</span>";}).join(""):"";
  container.style.opacity="1";
  container.innerHTML=
    "<div class='enemy-info'><div class='enemy-nameline'>"+name+" <span class='enemy-lv'>Lv."+enemy.level+"</span>"+typeHtml+"</div>"+
    "<div class='enemy-hprow'><div class='enemy-hpbar'><div class='enemy-hpfill' id='enemyHpFill' style='width:"+Math.max(0,Math.round(enemy.currentHP/enemy.maxHP*100))+"%;background:"+hpColor(enemy.currentHP,enemy.maxHP)+"'></div></div>"+
    "<span class='enemy-hptxt' id='enemyHpTxt'>"+enemy.currentHP+"/"+enemy.maxHP+"</span></div>"+
    (enemy.status?"<span class='status-badge status-"+enemy.status+"'>"+statusText(enemy.status)+"</span>":"")+"</div>"+
    "<img class='enemy-img enemy-appear' src='"+spriteUrl(enemy.dexId,false)+"' alt='"+name+"'>";
}

function updateEnemyHp(enemy){
  var fill=document.getElementById("enemyHpFill"),txt=document.getElementById("enemyHpTxt"); if(!enemy) return;
  if(fill){fill.style.width=Math.max(0,Math.round(enemy.currentHP/enemy.maxHP*100))+"%";fill.style.background=hpColor(enemy.currentHP,enemy.maxHP);}
  if(txt) txt.textContent=enemy.currentHP+"/"+enemy.maxHP;
}
function updatePlayerHp(){
  var p=getActivePkmn(); if(!p) return;
  var fill=document.querySelector(".walker-hpfill");
  if(fill){fill.style.width=Math.max(0,Math.round(p.currentHP/p.maxHP*100))+"%";fill.style.background=hpColor(p.currentHP,p.maxHP);}
}

// ── Trainer-Portrait im Kampf ─────────────────────────────────
function renderTrainerPortrait(name, spriteUrl2) {
  // Existierendes Portrait entfernen
  hideTrainerPortrait();
  var scene = document.getElementById("sceneView"); if(!scene) return;
  var div = document.createElement("div");
  div.id = "trainerPortrait";
  div.style.cssText = "position:absolute;left:8px;bottom:36px;z-index:20;text-align:center;animation:portrait-in .3s ease-out;";
  div.innerHTML =
    "<img src='"+spriteUrl2+"' style='width:64px;height:64px;image-rendering:pixelated;display:block' onerror='this.parentNode.remove()'>"+
    "<div style='font-size:9px;color:#fff;background:rgba(0,0,0,.6);border-radius:3px;padding:1px 4px;max-width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>"+name+"</div>";
  scene.appendChild(div);
}

function hideTrainerPortrait() {
  var el = document.getElementById("trainerPortrait");
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

// ── Kampf-UI ──────────────────────────────────────────────────
function showBattleUI(enemy){
  var ui=document.getElementById("battlePanel"); if(ui) ui.classList.add("battle-active");
  renderMoveButtons();
  renderCatchBalls(false);   // reset erst
  updateCatchButton(enemy);
}

function hideBattleUI(){
  var ui=document.getElementById("battlePanel"); if(ui) ui.classList.remove("battle-active");
  var mb=document.getElementById("moveButtons"); if(mb) mb.innerHTML="";
  renderCatchBalls(false);
  hideTrainerPortrait();
}

function renderMoveButtons(){
  var container=document.getElementById("moveButtons"); if(!container) return;
  var player=getActivePkmn(); if(!player){container.innerHTML=""; return;}
  container.innerHTML="";
  player.moves.forEach(function(mid){
    var move=MOVES[mid]; if(!move) return;
    var btn=document.createElement("button"); btn.className="move-btn";
    btn.style.borderColor=TYPE_COLORS[move.type]||"#888";
    btn.innerHTML="<span class='move-name'>"+move.name+"</span><span class='move-type' style='background:"+(TYPE_COLORS[move.type]||"#888")+"'>"+move.type+"</span><span class='move-pwr'>"+(move.pwr>0?move.pwr+"Stk":"Status")+"</span>";
    btn.onclick=function(){onMoveClick(mid);};
    container.appendChild(btn);
  });
}

// ── Ball-Buttons (ruft renderCatchBalls aus ui.js) ────────────
function updateCatchButton(enemy){
  if(!enemy) return;
  var canCatch=BATTLE&&BATTLE.canCatch&&!BATTLE.over;
  var lowHP=enemy.currentHP<=Math.floor(enemy.maxHP*0.5);
  if(typeof renderCatchBalls==="function") renderCatchBalls(canCatch&&lowHP);
}

// ── Pokéball-Wurf-Animation ───────────────────────────────────
function throwBallAnimation(ballType,callback){
  var scene=document.getElementById("sceneView");
  var bUrl=(typeof BALL_SPRITES!=="undefined")?BALL_SPRITES[ballType]:null;
  if(!scene||!bUrl){if(callback)callback(); return;}
  var img=document.createElement("img"); img.src=bUrl;
  img.style.cssText="position:absolute;width:28px;height:28px;image-rendering:pixelated;z-index:50;pointer-events:none;";
  scene.appendChild(img);
  var startTime=null,duration=600;
  var W=scene.clientWidth||480,H=scene.clientHeight||220;
  var sx=W*0.22,sy=H*0.55,ex=W*0.68,ey=H*0.40;
  function step(ts){
    if(!startTime)startTime=ts;
    var p=Math.min((ts-startTime)/duration,1);
    var e=p<0.5?2*p*p:-1+(4-2*p)*p;
    img.style.left=(sx+(ex-sx)*e)+"px";
    img.style.top=(sy+(ey-sy)*e-H*0.20*Math.sin(p*Math.PI))+"px";
    img.style.transform="rotate("+(p*720)+"deg)";
    if(p<1){requestAnimationFrame(step); return;}
    img.style.transform="rotate(0deg)";
    var w=0,wd=1;
    var wi=setInterval(function(){w++;wd=-wd;img.style.transform="rotate("+(wd*15)+"deg)";
      if(w>=6){clearInterval(wi);img.style.transform="rotate(0deg)";
        setTimeout(function(){if(img.parentNode)img.parentNode.removeChild(img);if(callback)callback();},200);}},150);
  }
  requestAnimationFrame(step);
}

// ── Battle-Log ─────────────────────────────────────────────────
function appendBattleLog(lines){
  var log=document.getElementById("battleLog"); if(!log) return;
  if(typeof lines==="string") lines=[lines];
  lines.forEach(function(line){if(!line)return;var p=document.createElement("p");p.textContent=line;log.appendChild(p);while(log.children.length>35)log.removeChild(log.firstChild);});
  log.scrollTop=log.scrollHeight;
}
function clearBattleLog(){var l=document.getElementById("battleLog");if(l)l.innerHTML="";}

// ── Stage-Info ─────────────────────────────────────────────────
function renderStageInfo(){
  if(!STATE) return; var zone=getZone(STATE.currentZoneId); if(!zone) return;
  var zEl=document.getElementById("zoneName"),sEl=document.getElementById("stageInfo");
  if(zEl) zEl.textContent=zone.name;
  if(sEl){var icon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";sEl.textContent=icon+" Etappe "+STATE.currentStage+" / "+zone.stageCount;}
  var bar=document.getElementById("stageProgressFill");if(bar)bar.style.width=Math.round((STATE.currentStage-1)/zone.stageCount*100)+"%";
}

// ── Farben & Status ────────────────────────────────────────────
function hpColor(cur,max){var p=max>0?cur/max:0;return p>0.5?"#44cc44":p>0.25?"#ffbb22":"#ee4444";}
function statusText(s){return{burn:"BRN",poison:"GIF",paralysis:"LAH",sleep:"SCH",freeze:"EIS",confuse:"VWR"}[s]||(s||"").toUpperCase().slice(0,3);}

// ── Toast & XP-Popup ──────────────────────────────────────────
function showToast(msg,ms){var z=document.getElementById("toastZone");if(!z)return;var el=document.createElement("div");el.className="toast";el.textContent=msg;z.appendChild(el);setTimeout(function(){el.classList.add("toast-fade");setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},400);},ms||2500);}
function showXPPopup(xp){var el=document.getElementById("xpPopup");if(!el)return;el.textContent="+"+xp+" EP";el.style.opacity="1";el.style.transform="translateY(-30px)";setTimeout(function(){el.style.opacity="0";el.style.transform="translateY(-60px)";},1800);}
