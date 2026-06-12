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
      var ni = document.getElementById("trainerName");
      var name = ni ? ni.value.trim() : "";
      if (!name) name = localStorage.getItem("pokidlemon_name") || "";
      if (!name) { if(ni){ni.focus();ni.style.borderColor="#ef4444";} return; }
      if(ni) ni.style.borderColor = "";
      onStarterGewaehlt(name, s.dexId);
    };
    grid.appendChild(card);
  });
  var ni = document.getElementById("trainerName");
  if (ni && !ni.value.trim()) ni.value = localStorage.getItem("pokidlemon_name") || "";
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
