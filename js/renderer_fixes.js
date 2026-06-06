// trainer portrait → rechts oben (Gegner-Seite)
function renderTrainerPortrait(name, url2) {
  hideTrainerPortrait();
  var scene=document.getElementById("sceneView"); if(!scene) return;
  var div=document.createElement("div");
  div.id="trainerPortrait";
  div.style.cssText="position:absolute;right:8px;top:8px;z-index:20;text-align:center;animation:portrait-in .3s ease-out";
  div.innerHTML=
    "<img src='"+url2+"' style='width:52px;height:52px;image-rendering:pixelated;display:block;margin:0 auto;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.6)' onerror='this.parentNode.remove()'>"+
    "<div style='font-size:9px;color:#fff;background:rgba(0,0,0,.65);border-radius:3px;padding:1px 4px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px'>"+name+"</div>";
  scene.appendChild(div);
}
function hideTrainerPortrait() {
  var el=document.getElementById("trainerPortrait"); if(el&&el.parentNode)el.parentNode.removeChild(el);
}

// updatePlayerHp — HP-Text + XP + realtime Team-Tab
function updatePlayerHp(){
  var p=getActivePkmn(); if(!p) return;
  // HP-Balken
  var fill=document.querySelector(".walker-hpfill");
  if(fill){fill.style.width=Math.max(0,Math.round(p.currentHP/p.maxHP*100))+"%";fill.style.background=hpColor(p.currentHP,p.maxHP);}
  // HP-Text
  var txt=document.querySelector(".walker-hptxt");
  if(txt) txt.textContent=p.currentHP+"/"+p.maxHP;
  // XP-Balken
  var xpF=document.querySelector(".walker-xpfill");
  if(xpF) xpF.style.width=Math.min(100,Math.round(p.xp/p.xpToNext*100))+"%";
  // Realtime Team-Tab
  var tv=document.getElementById("viewTeam");
  if(tv&&tv.style.display!=="none"&&typeof renderTeamScreen==="function") renderTeamScreen();
}
