// ── Hintergrund-Rendering ─────────────────────────────────────
var _bgImageCache={}, _gymIndexMap=null;

// Städte → benannte BG-Dateien
var CITY_BG_MAP = {
  alabastia:       "Alabastia.png",
  viridian_city:   "VertaniaCity.png",
  pewter_city:     "MamoriaCity.png",
  cerulean_city:   "AzuriaCity.png",
  vermilion_city:  "OraniaCity.png",
  lavender_town:   "LavandiaCity.png",
  celadon_city:    "PrismaniaCity.png",
  fuchsia_city:    "FuchsaniaCity.png",
  saffron_city:    "SafroniaCity.png",
  cinnabar_island: "Zinnoberinsel.png",
};

function _getGymImgKey(zone){
  if(!_gymIndexMap){_gymIndexMap={};var n=0;WORLD.forEach(function(z){if(z.type==="gym"){n++;_gymIndexMap[z.id]="gym"+n;}});}
  return _gymIndexMap[zone.id]||null;
}

function renderZoneBg(zone){
  if(!zone)return;
  if(_sceneAnimId)cancelAnimationFrame(_sceneAnimId);
  getSceneCanvas();if(!_sceneCtx)return; _sceneT=0;

  // Dateiname bestimmen
  var bgFile = null;
  if(CITY_BG_MAP[zone.id]) bgFile = CITY_BG_MAP[zone.id];
  else if(zone.type==="gym"){var k=_getGymImgKey(zone); if(k) bgFile=k+".png";}

  var cacheKey = bgFile || String((WORLD?WORLD.findIndex(function(z){return z.id===zone.id;}):0)+1);

  var drawFn;
  if(zone.type==="sea")                        drawFn=function(){drawSea(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="gym"||zone.type==="building") drawFn=function(){drawGym(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="city")                  drawFn=function(){drawCity(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  else if(zone.type==="dungeon"){
    if(zone.id.indexOf("forest")>=0)            drawFn=function(){drawForest(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else if(zone.id==="pokemon_tower")           drawFn=function(){drawTower(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
    else                                         drawFn=function(){drawCave(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT);};
  }
  else drawFn=function(){drawRoute(_sceneCtx,_sceneCanvas.width,_sceneCanvas.height,_sceneT,zone);};

  if(_bgImageCache[cacheKey]===undefined){
    _bgImageCache[cacheKey]='loading';
    var img=new Image();
    img.onload=function(){_bgImageCache[cacheKey]=img;};
    img.onerror=function(){_bgImageCache[cacheKey]=null;};
    img.src='bg/'+(bgFile||cacheKey+'.png');
  }

  function loop(){
    var c=_bgImageCache[cacheKey];
    if(c&&c!=='loading'){
      _sceneCtx.drawImage(c,0,0,_sceneCanvas.width,_sceneCanvas.height);
      return;
    }
    try{drawFn();}catch(e){}
    _sceneT++;_sceneAnimId=requestAnimationFrame(loop);
  }
  loop();
}
