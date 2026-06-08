// ═══════════════════════════════════════════════════════════════
//  renderer.js — Sprites, FX, Battle-UI
// ═══════════════════════════════════════════════════════════════

var SD_FRONT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
var SD_BACK  = SD_FRONT + "back/";
var PNG_FRONT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
var PNG_BACK  = PNG_FRONT + "back/";

// ══════════════════════════════════════════════════════════════
//  TYPE_COLORS + Deutsche Typ-Namen
//  (wird von renderMoveButtons, renderPlayerSprites,
//   renderEnemySprite und anderen Funktionen verwendet)
// ══════════════════════════════════════════════════════════════
var TYPE_COLORS = {
  Normal:   "#a8a77a",
  Fire:     "#ee8130",
  Water:    "#6390f0",
  Electric: "#f7d02c",
  Grass:    "#7ac74c",
  Ice:      "#96d9d6",
  Fighting: "#c22e28",
  Poison:   "#a33ea1",
  Ground:   "#e2bf65",
  Flying:   "#a98ff3",
  Psychic:  "#f95587",
  Bug:      "#a6b91a",
  Rock:     "#b6a136",
  Ghost:    "#735797",
  Dragon:   "#6f35fc",
  Dark:     "#705746",
  Steel:    "#b7b7ce",
};

// Deutsche Typ-Namen für die Anzeige in den Move-Buttons
var TYPE_NAMES_DE = {
  Normal:   "Normal",
  Fire:     "Feuer",
  Water:    "Wasser",
  Electric: "Elektro",
  Grass:    "Pflanze",
  Ice:      "Eis",
  Fighting: "Kampf",
  Poison:   "Gift",
  Ground:   "Boden",
  Flying:   "Flug",
  Psychic:  "Psycho",
  Bug:      "Käfer",
  Rock:     "Gestein",
  Ghost:    "Geist",
  Dragon:   "Drachen",
  Dark:     "Unlicht",
  Steel:    "Stahl",
};

function typeColor(type){ return TYPE_COLORS[type] || "#888"; }
function typeName(type) { return TYPE_NAMES_DE[type] || type; }

function spriteUrl(dexId, back, shiny) {
  var base = back ? (shiny ? SD_BACK.replace("/back/","/back/shiny/") : SD_BACK) : (shiny ? SD_FRONT+"shiny/" : SD_FRONT);
  return base + dexId + ".gif";
}
function spriteFallback(dexId, back, shiny) {
  var base = back ? PNG_BACK : PNG_FRONT;
  return base + (shiny ? "shiny/" : "") + dexId + ".png";
}

// ── Canvas-Szenen ─────────────────────────────────────────────
var _sceneCanvas=null,_sceneCtx=null,_sceneAnimId=null,_sceneT=0;

function getSceneCanvas(){var view=document.getElementById("sceneView");if(!view)return null;if(!_sceneCanvas){_sceneCanvas=document.createElement("canvas");_sceneCanvas.id="sceneCv";_sceneCanvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:1";view.insertBefore(_sceneCanvas,view.firstChild);_sceneCtx=_sceneCanvas.getContext("2d");}_sceneCanvas.width=view.clientWidth||480;_sceneCanvas.height=view.clientHeight||220;return _sceneCanvas;}

function renderZoneBg(zone){if(!zone)return;if(_sceneAnimId)cancelAnimationFrame(_sceneAnimId);getSceneCanvas();if(!_sceneCtx)return;_sceneT=0;var drawFn;if(zone.type==="sea")drawFn=function(){drawSea(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};else if(zone.type==="gym"||zone.type==="building")drawFn=function(){drawGym(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};else if(zone.type==="city")drawFn=function(){drawCity(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};else if(zone.type==="dungeon"){if(zone.id.indexOf("forest")>=0)drawFn=function(){drawForest(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};else if(zone.id==="pokemon_tower")drawFn=function(){drawTower(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};else drawFn=function(){drawCave(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};}else drawFn=function(){drawRoute(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT,zone);};function loop(){try{drawFn();}catch(e){}_sceneT++;_sceneAnimId=requestAnimationFrame(loop);}loop();}

function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}

function drawRoute(c,W,H,t,zone){var sky=(zone&&zone.bgSky)||"#87ceeb",gnd=(zone&&zone.bgGround)||"#5aaa2a",mid=(zone&&zone.bgMid)||"#70b050";var grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,sky);grad.addColorStop(0.55,sky);grad.addColorStop(0.75,mid);grad.addColorStop(1,gnd);c.fillStyle=grad;c.fillRect(0,0,W,H);px(c,0,H*0.58,W,H*0.42,gnd);px(c,0,H*0.7,W,H*0.3,"#3a7a12");px(c,W*0.38,H*0.58,W*0.14,H*0.42,"#c8a878");[[0.04,0.22,1.2],[0.15,0.25,1.0],[0.72,0.22,1.3],[0.85,0.24,1.1],[0.92,0.23,1.0]].forEach(function(tr){drawTree(c,tr[0]*W,tr[1]*H,tr[2]);});[[0.06,0.1,1],[0.38,0.08,0.8],[0.72,0.12,1.1]].forEach(function(cl){drawCloud(c,cl[0]*W+Math.sin(t*0.005)*8,cl[1]*H,cl[2]);});}
function drawTree(c,x,y,s){s=s||1;var tw=20*s,th=42*s;px(c,x+tw*0.3,y+th*0.67,tw*0.4,th*0.33,"#6b3a1f");c.fillStyle="#2d5a1b";c.fillRect(x,y+th*0.4,tw,th*0.35);c.fillRect(x+tw*0.1,y+th*0.2,tw*0.8,th*0.28);c.fillRect(x+tw*0.25,y,tw*0.5,th*0.25);}
function drawBush(c,x,y){c.fillStyle="#3a7a22";c.fillRect(x,y+8,20,10);c.fillRect(x+3,y,14,12);}
function drawCloud(c,x,y,s){s=s||1;c.fillStyle="rgba(255,255,255,0.85)";[[0,0,20,10],[10,-8,24,12],[28,-2,20,10],[6,6,36,8]].forEach(function(d){c.fillRect(x+d[0]*s,y+d[1]*s,d[2]*s,d[3]*s);});}
function drawForest(c,W,H,t){px(c,0,0,W,H,"#0d1a08");for(var i=0;i<6;i++){c.fillStyle="rgba(160,255,80,"+(0.04+Math.sin(t*0.03+i)*0.015)+")";c.fillRect(60+i*70,0,14,H);}px(c,0,H*0.72,W,H*0.28,"#1a3a08");for(var j=0;j<8;j++){var tx=j*68-10;px(c,tx+10,H*0.28,10,H*0.5,"#3d1f0a");c.fillStyle=["#0d2208","#162e0a","#0a1a06"][j%3];c.fillRect(tx,H*0.1,30,H*0.42);c.fillRect(tx+3,H*0.05,24,H*0.2);c.fillRect(tx+7,0,16,H*0.1);}for(var k=0;k<5;k++)drawTree(c,30+k*90,H*0.38,1.1);}
function drawCave(c,W,H,t){px(c,0,0,W,H,"#1a1820");px(c,0,H*0.75,W,H*0.25,"#2a2530");c.fillStyle="#2d2830";for(var i=0;i<14;i++){var sx=6+i*36,sh=18+Math.sin(i*1.7)*13;c.beginPath();c.moveTo(sx,0);c.lineTo(sx+10,0);c.lineTo(sx+5,sh);c.closePath();c.fill();}[W*0.12,W*0.38,W*0.62,W*0.88].forEach(function(tx){var ty=H*0.48;px(c,tx,ty,6,28,"#5a3a18");var fi=Math.sin(t*0.15+tx)*3;c.fillStyle="#ff8800";c.fillRect(tx-4+fi,ty-16,14,18);});}
function drawTower(c,W,H,t){px(c,0,0,W,H,"#0a080f");for(var i=0;i<4;i++){c.fillStyle="rgba(100,60,180,"+(0.06+Math.sin(t*0.05+i)*0.03)+")";c.fillRect(0,H*0.2+i*H*0.2,W,30);}px(c,0,H*0.75,W,H*0.25,"#120a18");}
function drawCity(c,W,H,t){var sg=c.createLinearGradient(0,0,0,H);sg.addColorStop(0,"#7aadca");sg.addColorStop(0.6,"#a8ccdd");sg.addColorStop(1,"#c0d8e0");c.fillStyle=sg;c.fillRect(0,0,W,H);px(c,0,H*0.73,W,H*0.27,"#9a8878");[[0,50,68,90,"#8899aa"],[68,35,78,110,"#99aacc"],[146,44,58,100,"#7788aa"],[204,25,88,115,"#aabbcc"],[292,50,68,95,"#8899bb"],[360,40,58,105,"#99aabb"],[418,30,62,115,"#7799cc"]].forEach(function(b){px(c,b[0],b[1],b[2],b[3],b[4]);});drawTree(c,W*0.06,H*0.44,0.9);drawTree(c,W*0.88,H*0.43,0.9);}
function drawGym(c,W,H,t){var gg=c.createLinearGradient(0,0,0,H);gg.addColorStop(0,"#2a1040");gg.addColorStop(1,"#4a2060");c.fillStyle=gg;c.fillRect(0,0,W,H);px(c,0,H*0.75,W,H*0.25,"#2a1535");}
function drawSea(c,W,H,t){var ss=c.createLinearGradient(0,0,0,H);ss.addColorStop(0,"#1a5fa0");ss.addColorStop(0.5,"#2a7fc0");ss.addColorStop(1,"#3a9de0");c.fillStyle=ss;c.fillRect(0,0,W,H);px(c,0,H*0.4,W,H*0.6,"#1a5090");for(var wl=0;wl<5;wl++){var wy=H*0.42+wl*H*0.11,amp=7-wl,wlen=80+wl*20;c.fillStyle="rgba("+(20+wl*15)+","+(100+wl*20)+","+(180+wl*10)+",0.55)";c.beginPath();c.moveTo(0,wy);for(var wx=0;wx<=W;wx+=4){c.lineTo(wx,wy+Math.sin(wx/wlen+t*(5-wl)*0.06)*amp);}c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fill();}}

// ══════════════════════════════════════════════════════════════
//  ANGRIFFS-ANIMATIONEN
// ══════════════════════════════════════════════════════════════
var _fxCanvas=null,_fxCtx=null;
var TYPE_FX_MAP={"Normal":{col:"#a8a77a",glow:"#fff"},"Fire":{col:"#ee8130",glow:"#ffa060"},"Water":{col:"#6390f0",glow:"#90b8ff"},"Electric":{col:"#f7d02c",glow:"#ffe060"},"Grass":{col:"#7ac74c",glow:"#a0e070"},"Ice":{col:"#96d9d6",glow:"#c0f0ee"},"Fighting":{col:"#c22e28",glow:"#f06060"},"Poison":{col:"#a33ea1",glow:"#d070d0"},"Ground":{col:"#e2bf65",glow:"#f0d890"},"Flying":{col:"#a98ff3",glow:"#c0b0ff"},"Psychic":{col:"#f95587",glow:"#ffaabb"},"Bug":{col:"#a6b91a",glow:"#c8e030"},"Rock":{col:"#b6a136",glow:"#d8c060"},"Ghost":{col:"#735797",glow:"#a080c0"},"Dragon":{col:"#6f35fc",glow:"#a070ff"},"Dark":{col:"#705746",glow:"#a08070"},"Steel":{col:"#b7b7ce",glow:"#d0d0e8"}};

function getFxCanvas(){var view=document.getElementById("sceneView");if(!view)return null;if(!_fxCanvas){_fxCanvas=document.createElement("canvas");_fxCanvas.id="fxCanvas";_fxCanvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:25;pointer-events:none";view.appendChild(_fxCanvas);_fxCtx=_fxCanvas.getContext("2d");}_fxCanvas.width=view.clientWidth||480;_fxCanvas.height=view.clientHeight||220;return _fxCanvas;}
function clearFxCanvas(){if(_fxCtx&&_fxCanvas)_fxCtx.clearRect(0,0,_fxCanvas.width,_fxCanvas.height);}

function doAttackAnimation(moveType,fromPlayer,onHit,onDone){
  var cv=getFxCanvas();if(!cv){if(onHit)onHit();setTimeout(function(){if(onDone)onDone();},100);return;}
  var c=_fxCtx,W=cv.width,H=cv.height;
  var fx=TYPE_FX_MAP[moveType]||TYPE_FX_MAP["Normal"];
  var playerX=W*0.22,playerY=H*0.52,enemyX=W*0.72,enemyY=H*0.38;
  var srcX=fromPlayer?playerX:enemyX,srcY=fromPlayer?playerY:enemyY;
  var dstX=fromPlayer?enemyX:playerX,dstY=fromPlayer?enemyY:playerY;
  var FLIGHT_MS=320,IMPACT_MS=280,startTime=null,hitCalled=false,doneCalled=false;
  function loop(ts){
    if(!startTime)startTime=ts;var elapsed=ts-startTime;c.clearRect(0,0,W,H);
    if(elapsed<FLIGHT_MS){
      var p=elapsed/FLIGHT_MS,ease=p<0.5?2*p*p:-1+(4-2*p)*p;
      var cx2=srcX+(dstX-srcX)*ease,cy2=srcY+(dstY-srcY)*ease-Math.sin(p*Math.PI)*30;
      var size=8+Math.sin(p*Math.PI)*4;var dg=c.createRadialGradient(cx2,cy2,0,cx2,cy2,size);dg.addColorStop(0,fx.glow);dg.addColorStop(0.6,fx.col);dg.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=dg;c.beginPath();c.arc(cx2,cy2,size,0,Math.PI*2);c.fill();
      requestAnimationFrame(loop);
    }else{
      if(!hitCalled){hitCalled=true;if(onHit)onHit();}
      var ip=(elapsed-FLIGHT_MS)/IMPACT_MS;
      if(ip<=1){
        var ease2=ip<0.5?2*ip*ip:-1+(4-2*ip)*ip,fade=1-ip;c.globalAlpha=fade;
        var dg2=c.createRadialGradient(dstX,dstY,0,dstX,dstY,ease2*40);dg2.addColorStop(0,fx.glow);dg2.addColorStop(0.5,fx.col);dg2.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=dg2;c.beginPath();c.arc(dstX,dstY,ease2*40,0,Math.PI*2);c.fill();
        if(ip<0.2){c.globalAlpha=(0.2-ip)/0.2*0.3;c.fillStyle=fx.glow;c.fillRect(0,0,W,H);}c.globalAlpha=1;
        requestAnimationFrame(loop);
      }else{c.clearRect(0,0,W,H);if(!doneCalled){doneCalled=true;if(onDone)onDone();}}
    }
  }
  requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════════════════════
//  SPIELER-SPRITES
// ══════════════════════════════════════════════════════════════
function renderPlayerSprites(){
  var container=document.getElementById("playerSprites");if(!container||!STATE)return;
  container.innerHTML="";
  var lead=STATE.party.find(function(p){return p.currentHP>0;});
  if(!lead)return;
  var pd=PKMN[lead.dexId],shiny=!!lead.shiny;
  var name=lead.nick||(pd?pd.name:"?");
  var hpPct=Math.max(0,Math.round(lead.currentHP/lead.maxHP*100));
  var xpPct=Math.min(100,Math.round(lead.xp/lead.xpToNext*100));
  var gender=lead.gender;
  var genderHtml=gender==="M"?"<span class='gender-m'>♂</span>":gender==="F"?"<span class='gender-f'>♀</span>":"";
  var typeHtml=(pd?pd.types.map(function(t){return "<span class='type-badge type-badge-sm' style='background:"+typeColor(t)+"'>"+typeName(t)+"</span>";}).join(""):"");
  var statusHtml=lead.status?"<span class='status-badge status-"+lead.status+"'>"+statusText(lead.status)+"</span>":"";
  var div=document.createElement("div");
  div.className="walker walker-lead"+(shiny?" walker-shiny":"");
  div.innerHTML=
    "<img class='walker-sprite"+(shiny?" shiny-sprite":"")+"' src='"+spriteUrl(lead.dexId,true,shiny)+"' onerror='this.src=\""+spriteFallback(lead.dexId,true,shiny)+"\"'>"+
    "<div class='walker-info'>"+
      "<div class='walker-nameline'><b>"+(shiny?"✨":"")+name+"</b>"+genderHtml+"<span class='walker-lv'>Lv."+lead.level+"</span>"+statusHtml+"</div>"+
      "<div class='walker-types'>"+typeHtml+"</div>"+
      "<div class='walker-hprow'><div class='walker-hpbar'><div class='walker-hpfill' style='width:"+hpPct+"%;background:"+hpColor(lead.currentHP,lead.maxHP)+"'></div></div><span class='walker-hptxt'>"+lead.currentHP+"/"+lead.maxHP+"</span></div>"+
      "<div class='walker-xprow'><div class='walker-xpbar'><div class='walker-xpfill' style='width:"+xpPct+"%'></div></div><span class='walker-xptxt'>EP</span></div>"+
    "</div>";
  container.appendChild(div);
}

// ══════════════════════════════════════════════════════════════
//  GEGNER-SPRITE
// ══════════════════════════════════════════════════════════════
function renderEnemySprite(enemy,visible){
  var container=document.getElementById("enemySprite");if(!container)return;
  if(!enemy||!visible){container.innerHTML="";container.style.opacity="0";return;}
  var pd=PKMN[enemy.dexId],name=pd?pd.name:"?";
  var typeHtml=pd?pd.types.map(function(t){return "<span class='type-badge type-badge-sm' style='background:"+typeColor(t)+"'>"+typeName(t)+"</span>";}).join(""):"";
  var gender=enemy.gender;
  var genderHtml=gender==="M"?"<span class='gender-m'>♂</span>":gender==="F"?"<span class='gender-f'>♀</span>":"";
  container.style.opacity="1";
  container.innerHTML=
    "<div class='enemy-info'>"+
      "<div class='enemy-nameline'>"+name+genderHtml+" <span class='enemy-lv'>Lv."+enemy.level+"</span>"+typeHtml+"</div>"+
      "<div class='enemy-hprow'><div class='enemy-hpbar'><div class='enemy-hpfill' id='enemyHpFill' style='width:"+Math.max(0,Math.round(enemy.currentHP/enemy.maxHP*100))+"%;background:"+hpColor(enemy.currentHP,enemy.maxHP)+"'></div></div><span class='enemy-hptxt' id='enemyHpTxt'>"+enemy.currentHP+"/"+enemy.maxHP+"</span></div>"+
      (enemy.status?"<span class='status-badge status-"+enemy.status+"'>"+statusText(enemy.status)+"</span>":"")+
    "</div>"+
    "<img class='enemy-img enemy-appear' src='"+spriteUrl(enemy.dexId,false)+"' onerror='this.src=\""+spriteFallback(enemy.dexId,false)+"\"'>";
}

function updateEnemyHp(enemy){var fill=document.getElementById("enemyHpFill"),txt=document.getElementById("enemyHpTxt");if(!enemy)return;if(fill){fill.style.width=Math.max(0,Math.round(enemy.currentHP/enemy.maxHP*100))+"%";fill.style.background=hpColor(enemy.currentHP,enemy.maxHP);}if(txt)txt.textContent=enemy.currentHP+"/"+enemy.maxHP;}
function updatePlayerHp(){var p=getActivePkmn();if(!p)return;var fill=document.querySelector(".walker-hpfill");if(fill){fill.style.width=Math.max(0,Math.round(p.currentHP/p.maxHP*100))+"%";fill.style.background=hpColor(p.currentHP,p.maxHP);}var txt=document.querySelector(".walker-hptxt");if(txt)txt.textContent=p.currentHP+"/"+p.maxHP;var xpF=document.querySelector(".walker-xpfill");if(xpF)xpF.style.width=Math.min(100,Math.round(p.xp/p.xpToNext*100))+"%";var tv=document.getElementById("viewTeam");if(tv&&tv.style.display!=="none"&&typeof renderTeamScreen==="function")renderTeamScreen();}

function renderTrainerPortrait(name,url2){hideTrainerPortrait();var scene=document.getElementById("sceneView");if(!scene)return;var div=document.createElement("div");div.id="trainerPortrait";div.style.cssText="position:absolute;right:8px;top:8px;z-index:20;text-align:center";div.innerHTML="<img src='"+url2+"' style='width:52px;height:52px;image-rendering:pixelated;display:block;margin:0 auto;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.6)' onerror='this.parentNode.remove()'><div style='font-size:9px;color:#fff;background:rgba(0,0,0,.65);border-radius:3px;padding:1px 4px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px'>"+name+"</div>";scene.appendChild(div);}
function hideTrainerPortrait(){var el=document.getElementById("trainerPortrait");if(el&&el.parentNode)el.parentNode.removeChild(el);}

// ══════════════════════════════════════════════════════════════
//  KAMPF-UI
// ══════════════════════════════════════════════════════════════
function showBattleUI(enemy){
  var ui=document.getElementById("battlePanel");if(ui)ui.classList.add("battle-active");
  renderMoveButtons();
  renderCatchBalls(BATTLE&&BATTLE.canCatch&&!BATTLE.over);
}
function hideBattleUI(){
  var ui=document.getElementById("battlePanel");if(ui)ui.classList.remove("battle-active");
  var mb=document.getElementById("moveButtons");if(mb)mb.innerHTML="";
  renderCatchBalls(false);hideTrainerPortrait();clearFxCanvas();
}

// ══════════════════════════════════════════════════════════════
//  MOVE-BUTTONS
//  FIX: TYPE_COLORS jetzt definiert, PP-Werte als Integer
//       Typ-Name auf Deutsch angezeigt (kein "Bug" mehr)
// ══════════════════════════════════════════════════════════════
function renderMoveButtons(){
  var container=document.getElementById("moveButtons");if(!container)return;
  var player=getActivePkmn();if(!player){container.innerHTML="";return;}
  container.innerHTML="";
  if(!player.pp)player.pp=initPP(player.moves);
  var allEmpty=!hasPP(player);

  player.moves.forEach(function(mid){
    var move=MOVES[mid];if(!move)return;
    // PP als saubere Integer — kein Stk oder sonstiger Müll
    var curPP=Math.max(0, parseInt(player.pp[mid], 10) || 0);
    var maxPP=Math.max(1, parseInt(ppMax(mid), 10) || 10);
    var noPP=curPP<=0&&!allEmpty;
    var col=noPP?"#333":typeColor(move.type);
    var btn=document.createElement("button");
    btn.className="move-btn"+(noPP?" move-btn-empty":"");
    btn.disabled=noPP;
    btn.style.borderColor=noPP?"#444":col;
    btn.innerHTML=
      "<span class='move-name'>"+move.name+"</span>"+
      "<span class='move-type' style='background:"+col+"'>"+typeName(move.type)+"</span>"+
      "<span class='move-pp "+(curPP===0?"move-pp-empty":curPP<=Math.floor(maxPP/4)?"move-pp-low":"")+"'>"+curPP+"/"+maxPP+"</span>";
    if(!noPP)(function(m){btn.onclick=function(){onMoveClick(m);};})(mid);
    container.appendChild(btn);
  });

  if(allEmpty){
    var sb=document.createElement("button");
    sb.className="move-btn move-btn-struggle";
    sb.innerHTML="<span class='move-name'>Kräftemessen</span><span class='move-type' style='background:#888'>Normal</span>";
    sb.onclick=function(){onMoveClick("struggle");};
    container.appendChild(sb);
  }
}

// ══════════════════════════════════════════════════════════════
//  CATCH-BALLS
// ══════════════════════════════════════════════════════════════
function renderCatchBalls(visible){
  var container=document.getElementById("catchBalls");if(!container)return;
  container.innerHTML="";
  if(!visible||!STATE||!BATTLE||!BATTLE.canCatch||BATTLE.over)return;
  ["pokeball","superball","hyperball","masterball"].forEach(function(type){
    var count=STATE.items[type]||0;if(count<=0)return;
    var btn=document.createElement("button");btn.className="ball-btn";
    btn.title=(ITEM_DEFS&&ITEM_DEFS[type]?ITEM_DEFS[type].name:type)+" (x"+count+")";
    var imgUrl=(typeof BALL_SPRITES!=="undefined"&&BALL_SPRITES[type])?BALL_SPRITES[type]:"";
    btn.innerHTML=(imgUrl?"<img src='"+imgUrl+"' width='24' height='24' onerror='this.style.display=\"none\"'>":"⚪")+"<span class='ball-count'>"+count+"</span>";
    btn.onclick=(function(t){return function(){onCatchClick(t);};})(type);
    container.appendChild(btn);
  });
}
function updateCatchButton(enemy){renderCatchBalls(BATTLE&&BATTLE.canCatch&&!BATTLE.over);}

// ══════════════════════════════════════════════════════════════
//  BALL-ANIMATION
// ══════════════════════════════════════════════════════════════
function throwBallAnimation(ballType,callback){
  var scene=document.getElementById("sceneView");
  var bUrl=(typeof BALL_SPRITES!=="undefined"&&BALL_SPRITES)?BALL_SPRITES[ballType]:null;
  if(!scene||!bUrl){if(callback)callback();return;}
  var img=document.createElement("img");img.src=bUrl;
  img.style.cssText="position:absolute;width:28px;height:28px;image-rendering:pixelated;z-index:50;pointer-events:none";
  scene.appendChild(img);
  var start=null,W=scene.clientWidth||480,H=scene.clientHeight||220;
  var sx=W*0.22,sy=H*0.55,ex=W*0.68,ey=H*0.38;
  function step(ts){
    if(!start)start=ts;var p=Math.min((ts-start)/500,1);
    var e=p<0.5?2*p*p:-1+(4-2*p)*p;
    img.style.left=(sx+(ex-sx)*e)+"px";img.style.top=(sy+(ey-sy)*e-H*0.20*Math.sin(p*Math.PI))+"px";
    img.style.transform="rotate("+(p*540)+"deg)";
    if(p<1){requestAnimationFrame(step);return;}
    img.style.transform="rotate(0deg)";
    var w=0,wd=1,wi=setInterval(function(){w++;wd=-wd;img.style.transform="rotate("+(wd*12)+"deg)";if(w>=5){clearInterval(wi);img.style.transform="rotate(0deg)";setTimeout(function(){if(img.parentNode)img.parentNode.removeChild(img);if(callback)callback();},150);}},140);
  }
  requestAnimationFrame(step);
}

// ── Diverses ──────────────────────────────────────────────────
function appendBattleLog(lines){var log=document.getElementById("battleLog");if(!log)return;if(typeof lines==="string")lines=[lines];lines.forEach(function(line){if(!line)return;var p=document.createElement("p");p.textContent=line;log.appendChild(p);while(log.children.length>35)log.removeChild(log.firstChild);});log.scrollTop=log.scrollHeight;}
function clearBattleLog(){var l=document.getElementById("battleLog");if(l)l.innerHTML="";}
function renderStageInfo(){if(!STATE)return;var zone=getZone(STATE.currentZoneId);if(!zone)return;var zEl=document.getElementById("zoneName"),sEl=document.getElementById("stageInfo");if(zEl)zEl.textContent=zone.name;if(sEl){var icon={route:"🌿",dungeon:"🕳️",city:"🏙️",gym:"⚔️",sea:"🌊"}[zone.type]||"📍";sEl.textContent=icon+" Etappe "+STATE.currentStage+" / "+zone.stageCount;}var bar=document.getElementById("stageProgressFill");if(bar)bar.style.width=Math.round((STATE.currentStage-1)/zone.stageCount*100)+"%";}
function hpColor(cur,max){var p=max>0?cur/max:0;return p>0.5?"#44cc44":p>0.25?"#ffbb22":"#ee4444";}
function statusText(s){return{burn:"BRN",poison:"GIF",paralysis:"LAH",sleep:"SCH",freeze:"EIS",confuse:"VWR"}[s]||(s||"").toUpperCase().slice(0,3);}
function showToast(msg,ms){var z=document.getElementById("toastZone");if(!z)return;var el=document.createElement("div");el.className="toast";el.textContent=msg;z.appendChild(el);setTimeout(function(){el.classList.add("toast-fade");setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},400);},ms||2500);}
function showXPPopup(xp){var el=document.getElementById("xpPopup");if(!el)return;el.textContent="+"+xp+" EP";el.style.opacity="1";el.style.transform="translateY(-30px)";setTimeout(function(){el.style.opacity="0";el.style.transform="translateY(-60px)";},1800);}
