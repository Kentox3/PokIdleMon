// ═══════════════════════════════════════════════════════════════
//  ui.js — Screen-Management, Starter-Auswahl, Team, Map, Shop
// ═══════════════════════════════════════════════════════════════

// ── Screen-Wechsel ────────────────────────────────────────────
function showScreen(id) {
  ["starterScreen","gameScreen","loadScreen","authScreen"].forEach(function(sid) {
    var el = document.getElementById(sid);
    if (el) el.hidden = (sid !== id);
  });
}

function switchTab(tabName) {
  ["tabWorld","tabTeam","tabBag","tabMap"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle("active", id === "tab" + tabName);
  });
  ["viewWorld","viewTeam","viewBag","viewMap"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = (id !== "view" + tabName);
  });
  if (tabName === "Team") renderTeamScreen();
  if (tabName === "Bag")  renderBagScreen();
  if (tabName === "Map")  renderMapScreen();
}

// ── Starter-Auswahl ───────────────────────────────────────────
function showStarterScreen() {
  showScreen("starterScreen");
  var starters = [
    { dexId:1,  name:"Bisasam",  type:"Pflanze", color:"#78C850", emoji:"🌱" },
    { dexId:4,  name:"Glumanda", type:"Feuer",   color:"#F08030", emoji:"🔥" },
    { dexId:7,  name:"Schiggy",  type:"Wasser",  color:"#6890F0", emoji:"💧" },
  ];
  var grid = document.getElementById("starterGrid");
  if (!grid) return;
  grid.innerHTML = "";
  starters.forEach(function(s) {
    var card = document.createElement("div");
    card.className = "starter-card";
    card.style.borderColor = s.color;
    card.innerHTML =
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" + s.dexId + ".png' alt='" + s.name + "'>" +
      "<div class='starter-name'>" + s.name + "</div>" +
      "<div class='starter-type' style='background:" + s.color + "'>" + s.emoji + " " + s.type + "</div>";
    card.onclick = function() { onStarterSelect(s.dexId, s.name); };
    grid.appendChild(card);
  });
}

function onStarterSelect(dexId, name) {
  // Name-Eingabe lesen
  var nameInput = document.getElementById("trainerName");
  var trainerName = nameInput ? (nameInput.value.trim() || "Trainer") : "Trainer";
  if (typeof onStarterChosen === "function") onStarterChosen(trainerName, dexId);
}

// ── Team-Screen ───────────────────────────────────────────────
function renderTeamScreen() {
  var container = document.getElementById("teamList");
  if (!container || !STATE) return;
  container.innerHTML = "";
  STATE.party.forEach(function(p, idx) {
    var pd = PKMN[p.dexId];
    var name = pd ? pd.name : "?";
    var hpPct = Math.round(p.currentHP / p.maxHP * 100);
    var card = document.createElement("div");
    card.className = "team-card" + (p.currentHP <= 0 ? " team-fainted" : "");
    card.innerHTML =
      "<img class='team-sprite' src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + p.dexId + ".png' alt='" + name + "'>" +
      "<div class='team-info'>" +
        "<div class='team-nameline'><b>" + (p.nick || name) + "</b> <span class='team-lv'>Lv." + p.level + "</span>" + (p.status ? "<span class='status-badge status-" + p.status + "'>" + statusText(p.status) + "</span>" : "") + "</div>" +
        "<div class='team-types'>" + (pd ? pd.types.map(function(t) { return "<span class='type-badge' style='background:" + (TYPE_COLORS[t] || "#aaa") + "'>" + t + "</span>"; }).join("") : "") + "</div>" +
        "<div class='team-hprow'><div class='team-hpbar'><div class='team-hpfill' style='width:" + Math.max(0, hpPct) + "%;background:" + hpColor(p.currentHP, p.maxHP) + "'></div></div> <span class='team-hptxt'>" + p.currentHP + "/" + p.maxHP + "</span></div>" +
        "<div class='team-xprow'><div class='team-xpbar'><div class='team-xpfill' style='width:" + Math.min(100, Math.round(p.xp / p.xpToNext * 100)) + "%'></div></div> <span class='team-xptxt'>" + p.xp + "/" + p.xpToNext + " EP</span></div>" +
        "<div class='team-moves'>" + p.moves.map(function(m) { var mv = MOVES[m]; return mv ? "<span class='mini-move' style='border-color:" + (TYPE_COLORS[mv.type] || "#888") + "'>" + mv.name + "</span>" : ""; }).join("") + "</div>" +
      "</div>" +
      "<div class='team-actions'>" +
        "<button onclick='setLeadPkmn(" + idx + ")' " + (idx === 0 ? "disabled" : "") + ">⬆ Lead</button>" +
        "<button onclick='sendToBox(" + idx + ")'>📦 Box</button>" +
      "</div>";
    container.appendChild(card);
  });

  // Box-Vorschau
  var boxSection = document.getElementById("boxPreview");
  if (boxSection) {
    if (STATE.box.length === 0) {
      boxSection.innerHTML = "<p style='color:#888;text-align:center'>Box ist leer</p>";
    } else {
      boxSection.innerHTML = STATE.box.map(function(p, i) {
        var pd = PKMN[p.dexId];
        return "<div class='box-mini' onclick='recallFromBox(" + i + ")'>" +
          "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + p.dexId + ".png'>" +
          "<div>" + (pd ? pd.name : "?") + " Lv." + p.level + "</div>" +
          "</div>";
      }).join("");
    }
  }
}

function setLeadPkmn(idx) {
  if (!STATE || idx === 0) return;
  var p = STATE.party.splice(idx, 1)[0];
  STATE.party.unshift(p);
  renderTeamScreen();
  saveGame();
}

function sendToBox(idx) {
  if (!STATE || STATE.party.length <= 1) { showToast("Du brauchst mindestens ein Pokémon!"); return; }
  var p = STATE.party.splice(idx, 1)[0];
  addToBox(p);
  renderTeamScreen();
  saveGame();
  showToast(PKMN[p.dexId] ? PKMN[p.dexId].name + " in Box gelegt." : "In Box gelegt.");
}

function recallFromBox(idx) {
  if (!STATE || STATE.party.length >= 6) { showToast("Party ist voll!"); return; }
  var p = STATE.box.splice(idx, 1)[0];
  STATE.party.push(p);
  renderTeamScreen();
  saveGame();
  showToast((PKMN[p.dexId] ? PKMN[p.dexId].name : "?") + " zu Party hinzugefügt.");
}

// ── Bag-Screen ─────────────────────────────────────────────────
function renderBagScreen() {
  var container = document.getElementById("bagList");
  if (!container || !STATE) return;
  var itemDefs = {
    pokeball:   { name:"Pokéball",     desc:"Normaler Pokéball",     emoji:"⚪" },
    superball:  { name:"Superball",    desc:"Bessere Fangchance",    emoji:"🔵" },
    hyperball:  { name:"Hyperball",    desc:"Beste Fangchance",      emoji:"🟣" },
    potion:     { name:"Trank",        desc:"+20 HP",                emoji:"🧪" },
    superpotion:{ name:"Supertrank",   desc:"+50 HP",                emoji:"💊" },
    hyperpotion:{ name:"Hypertrank",   desc:"+200 HP",               emoji:"💉" },
    maxpotion:  { name:"MaxTrank",     desc:"Volle HP",              emoji:"✨" },
    antidote:   { name:"Gegengift",    desc:"Heilt Gift",            emoji:"🟢" },
    awakening:  { name:"Weckflöte",    desc:"Heilt Schlaf",          emoji:"🔔" },
    paralysheal:{ name:"Paraheilm.",   desc:"Heilt Lähmung",         emoji:"⚡" },
    fullheal:   { name:"Vollheiler",   desc:"Alle Status heilen",    emoji:"💚" },
    fullrestore:{ name:"Komplett",     desc:"HP + alle Status",      emoji:"🌟" },
    revive:     { name:"Beleber",      desc:"Belebt K.O. Pokémon",   emoji:"❤️‍🔥" },
    escape:     { name:"Fluchtweg",    desc:"Aus Dungeon fliehen",   emoji:"🏃" },
  };
  container.innerHTML = "";
  var hasItems = false;
  Object.keys(itemDefs).forEach(function(key) {
    var count = STATE.items[key] || 0;
    if (count <= 0) return;
    hasItems = true;
    var def = itemDefs[key];
    var row = document.createElement("div");
    row.className = "bag-item";
    row.innerHTML =
      "<span class='bag-emoji'>" + def.emoji + "</span>" +
      "<div class='bag-info'><b>" + def.name + "</b><br><small>" + def.desc + "</small></div>" +
      "<span class='bag-count'>x" + count + "</span>" +
      "<button onclick='useItem(\"" + key + "\")'>Nutzen</button>";
    container.appendChild(row);
  });
  if (!hasItems) container.innerHTML = "<p style='color:#888;text-align:center;padding:20px'>Tasche ist leer</p>";
}

function useItem(itemKey) {
  if (!STATE || !STATE.items[itemKey] || STATE.items[itemKey] <= 0) { showToast("Kein " + itemKey + " mehr!"); return; }
  var player = getActivePkmn();
  if (!player) { showToast("Kein aktives Pokémon!"); return; }
  var pd = PKMN[player.dexId];
  var name = pd ? pd.name : "Pokémon";
  switch (itemKey) {
    case "potion":     if (player.currentHP >= player.maxHP) { showToast("HP schon voll!"); return; } player.currentHP = Math.min(player.maxHP, player.currentHP + 20); break;
    case "superpotion":if (player.currentHP >= player.maxHP) { showToast("HP schon voll!"); return; } player.currentHP = Math.min(player.maxHP, player.currentHP + 50); break;
    case "hyperpotion":if (player.currentHP >= player.maxHP) { showToast("HP schon voll!"); return; } player.currentHP = Math.min(player.maxHP, player.currentHP + 200); break;
    case "maxpotion":  if (player.currentHP >= player.maxHP) { showToast("HP schon voll!"); return; } player.currentHP = player.maxHP; break;
    case "fullrestore":player.currentHP = player.maxHP; player.status = null; player.statusTurns = 0; break;
    case "fullheal":   player.status = null; player.statusTurns = 0; break;
    case "antidote":   if (player.status !== "poison") { showToast("Nicht vergiftet!"); return; } player.status = null; break;
    case "awakening":  if (player.status !== "sleep")  { showToast("Schläft nicht!"); return; } player.status = null; player.statusTurns = 0; break;
    case "paralysheal":if (player.status !== "paralysis") { showToast("Nicht gelähmt!"); return; } player.status = null; break;
    case "revive":
      var fainted = STATE.party.find(function(p) { return p.currentHP <= 0; });
      if (!fainted) { showToast("Kein K.O. Pokémon!"); return; }
      fainted.currentHP = Math.floor(fainted.maxHP / 2);
      var fpd = PKMN[fainted.dexId];
      showToast((fpd ? fpd.name : "?") + " wurde belebt!");
      STATE.items[itemKey]--;
      renderBagScreen();
      renderTeamScreen();
      saveGame();
      return;
    default: showToast("Kann das hier nicht nutzen."); return;
  }
  STATE.items[itemKey]--;
  showToast(name + ": " + itemKey + " genutzt!");
  renderBagScreen();
  renderTeamScreen();
  updatePlayerHp();
  saveGame();
}

// ── Map-Screen ─────────────────────────────────────────────────
function renderMapScreen() {
  var container = document.getElementById("mapList");
  if (!container || !STATE) return;
  container.innerHTML = "";
  var currentIdx = WORLD.findIndex(function(z) { return z.id === STATE.currentZoneId; });
  WORLD.forEach(function(zone, idx) {
    var row = document.createElement("div");
    var isCurrentZone = (zone.id === STATE.currentZoneId);
    var isUnlocked = idx <= currentIdx;
    row.className = "map-zone" + (isCurrentZone ? " map-current" : "") + (isUnlocked ? " map-unlocked" : " map-locked");
    var typeEmoji = { route:"🌿", dungeon:"🕳️", city:"🏙️", gym:"⚔️", sea:"🌊" }[zone.type] || "📍";
    row.innerHTML = typeEmoji + " " + zone.name +
      (isCurrentZone ? " <span class='map-here'>← Hier</span>" : "") +
      (zone.gymLeader && isUnlocked ? "<span class='map-badge'>" + (STATE.badgeIds.indexOf(zone.gymLeader.badgeId) >= 0 ? "🏅" : "⬜") + "</span>" : "");
    container.appendChild(row);
  });

  // Medaillen-Anzeige
  var badgeRow = document.getElementById("badgeRow");
  if (badgeRow) {
    var badges = ["stone","cascade","thunder","rainbow","soul","marsh","volcano","earth"];
    badgeRow.innerHTML = badges.map(function(b) {
      return "<span class='badge-icon" + (STATE.badgeIds.indexOf(b) >= 0 ? " badge-earned" : "") + "'>🏅</span>";
    }).join("");
  }
}

// ── Haupt-HUD aktualisieren ────────────────────────────────────
function updateHUD() {
  if (!STATE) return;
  var moneyEl = document.getElementById("hudMoney");
  if (moneyEl) moneyEl.textContent = STATE.money + " ₽";
  var badgesEl = document.getElementById("hudBadges");
  if (badgesEl) badgesEl.textContent = STATE.badges + "/8 🏅";
  var playerEl = document.getElementById("hudPlayer");
  if (playerEl) playerEl.textContent = STATE.name;
}

// ── Shop-Popup ─────────────────────────────────────────────────
function showCityShop(zone) {
  var popup = document.getElementById("shopPopup");
  if (!popup || !zone.shopItems) return;
  popup.hidden = false;
  var list = document.getElementById("shopItemList");
  if (!list) return;
  list.innerHTML = "";
  zone.shopItems.forEach(function(item) {
    var canAfford = STATE.money >= item.cost;
    var row = document.createElement("div");
    row.className = "shop-row";
    row.innerHTML =
      "<div class='shop-info'><b>" + item.name + "</b> – " + item.desc + "</div>" +
      "<div class='shop-price'>" + item.cost + " ₽</div>" +
      "<button " + (canAfford ? "" : "disabled") + " onclick='buyItem(\"" + item.id + "\"," + item.cost + ")'>Kaufen</button>";
    list.appendChild(row);
  });
}

function closeShop() {
  var popup = document.getElementById("shopPopup");
  if (popup) popup.hidden = true;
}

function buyItem(itemId, cost) {
  if (!STATE || STATE.money < cost) { showToast("Kein Geld!"); return; }
  STATE.money -= cost;
  if (!STATE.items[itemId]) STATE.items[itemId] = 0;
  STATE.items[itemId]++;
  updateHUD();
  // Shop neu rendern
  var zone = getZone(STATE.currentZoneId);
  if (zone) showCityShop(zone);
  saveGame();
  showToast(itemId + " gekauft! (" + cost + " ₽)");
}

// ── Gym-Leader-Dialog ──────────────────────────────────────────
function showGymLeaderBattle(gymLeader) {
  var popup = document.getElementById("gymPopup");
  if (!popup) return;
  popup.hidden = false;
  var content = document.getElementById("gymContent");
  if (!content) return;
  content.innerHTML =
    "<div class='gym-header'>" +
      "<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + gymLeader.party[gymLeader.party.length-1].dexId + ".png' class='gym-leader-sprite'>" +
      "<div><h3>" + gymLeader.name + "</h3><p>" + gymLeader.title + "</p></div>" +
    "</div>" +
    "<p>Team: " + gymLeader.party.map(function(p) { var pd = PKMN[p.dexId]; return (pd ? pd.name : "?") + " Lv." + p.lv; }).join(", ") + "</p>" +
    "<p>Medaille: <b>" + gymLeader.badge + "</b></p>" +
    "<button onclick='closeGymPopup(); startGymFight()'>⚔️ Kämpfen!</button>";
}

function closeGymPopup() {
  var popup = document.getElementById("gymPopup");
  if (popup) popup.hidden = true;
}

// ── Offline-Belohnungs-Modal ───────────────────────────────────
function showOfflineReward(awaySeconds) {
  if (awaySeconds < 60) return;
  var modal = document.getElementById("offlineModal");
  var msg   = document.getElementById("offlineMsg");
  if (!modal || !msg) return;
  var hours = Math.floor(awaySeconds / 3600);
  var mins  = Math.floor((awaySeconds % 3600) / 60);
  var timeStr = hours > 0 ? hours + "h " + mins + "m" : mins + "m";
  msg.textContent = "Du warst " + timeStr + " weg. Deine Pokémon haben Erfahrung gesammelt!";
  modal.hidden = false;
}

function closeOfflineModal() {
  var modal = document.getElementById("offlineModal");
  if (modal) modal.hidden = true;
}

// ── XP-Gewinn anzeigen ────────────────────────────────────────
function showXPPopup(xpAmount) {
  var el = document.getElementById("xpPopup");
  if (!el) return;
  el.textContent = "+" + xpAmount + " EP";
  el.style.opacity = "1";
  el.style.transform = "translateY(-30px)";
  setTimeout(function() { el.style.opacity = "0"; el.style.transform = "translateY(-60px)"; }, 1800);
}
