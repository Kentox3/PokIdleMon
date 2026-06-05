    btn.title = def.name+": "+def.desc;
    btn.innerHTML = "<img src='"+(def.img||"")+"' class='bip-sprite' onerror='this.style.display=\"none\"'><span class='bip-name'>"+def.name+"</span><span class='bip-count'>x"+count+"</span>";
    if(usable) btn.onclick = (function(k){ return function(){ useBattleItem(k); }; })(key);
    grid.appendChild(btn);
  });
}
function closeBattleItemPanel() { var el=document.getElementById("battleItemPanel"); if(el&&el.parentNode) el.parentNode.removeChild(el); }

// ── onBattleEnd Override — mit returnToCity (Gary-Kampf) ─────
function onBattleEnd(result) {
  clearInterval(BATTLE_INTERVAL); _animRunning=false; hideTrainerPortrait();

  // Rival-Kampf in der Stadt → zurück zur Stadtansicht, Stage NICHT vorrücken
  if (result==="win" && BATTLE.trainerData && BATTLE.trainerData.returnToCity) {
    setTimeout(function(){
      var xp=BATTLE.xpGained||0, msgs=[];
      STATE.party.forEach(function(p){ if(p.currentHP>0) applyXP(p,xp).forEach(function(m){ msgs.push(m); }); });
      msgs.forEach(function(m){ appendBattleLog(m); });
      if(xp>0) showXPPopup(xp);
      if(BATTLE.moneyGained>0){ STATE.money+=BATTLE.moneyGained; appendBattleLog("+"+BATTLE.moneyGained+" ₽!"); updateHUD(); }
      markTrainerDefeated(BATTLE.trainerData.rivalKey||(BATTLE.trainerData.cityZoneId+"_rival"),0);
      saveGame();
      setTimeout(function(){
        hideBattleUI(); renderEnemySprite(null,false);
        _waitingForInput=true; _inCity=true;
        var zone=getZone(BATTLE.trainerData.cityZoneId); if(zone) renderCityView(zone);
      }, 1500);
    }, 500);
    return;
  }

  if(result==="win"){
    setTimeout(function(){
      var xp=BATTLE.xpGained||0, msgs=[], eid=BATTLE.enemy?BATTLE.enemy.dexId:null;
      STATE.party.forEach(function(p){ if(p.currentHP>0) applyXP(p,xp,eid).forEach(function(m){ msgs.push(m); }); });
      msgs.forEach(function(m){ appendBattleLog(m); });
      if(xp>0) showXPPopup(xp);
      if(BATTLE.moneyGained>0){ STATE.money+=BATTLE.moneyGained; appendBattleLog("+"+BATTLE.moneyGained+" ₽!"); updateHUD(); }
      if(BATTLE.type==="gym"){
        var zone=getZone(STATE.currentZoneId);
        if(zone&&zone.gymLeader){ var gl=zone.gymLeader;
          if(STATE.badgeIds.indexOf(gl.badgeId)<0){ STATE.badges++; STATE.badgeIds.push(gl.badgeId);
            appendBattleLog("🏅 "+gl.winText); showToast("🏅 "+gl.badge+" erhalten!",4000); updateHUD(); }
        }
      }
      markTrainerDefeated(STATE.currentZoneId,STATE.currentStage); saveGame();
      setTimeout(function(){ hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
        renderPlayerSprites(); advanceStage(); startStageLoop(); },2500);
    },500);
  } else if(result==="catch"||result==="flee"){
    appendBattleLog(result==="flee"?"Du bist geflohen!":"Pokémon gefangen!"); saveGame();
    setTimeout(function(){ hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
      renderPlayerSprites(); advanceStage(); startStageLoop(); },1800);
  } else {
    clearInterval(STAGE_INTERVAL);
    setTimeout(function(){ showBlackout(function(){
      healPartyFully(); STATE.party.forEach(function(p){ p._faintAnnounced=false; });
      var ci=WORLD.findIndex(function(z){ return z.id===STATE.currentZoneId; });
      for(var i=ci;i>=0;i--){ if(WORLD[i].type==="city"||i===0){ STATE.currentZoneId=WORLD[i].id; STATE.currentStage=1; break; } }
      saveGame(); hideBattleUI(); renderEnemySprite(null,false); _waitingForInput=false;
      var zn=getZone(STATE.currentZoneId); if(zn) renderZoneBg(zn);
      renderStageInfo(); renderPlayerSprites(); renderWorldTab();
      showToast("Du bist in "+(zn?zn.name:"einer Stadt")+" aufgewacht! Team geheilt.",4000);
      startStageLoop();
    }); },600);
  }
}
