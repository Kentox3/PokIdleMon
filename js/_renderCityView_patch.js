// ── Stadt-Ansicht ─────────────────────────────────────────────
function renderCityView(zone) {
  var container = document.getElementById("viewWorld"); if (!container) return;
  var npc = zone.id ? NPC_TRADES[zone.id] : null;
  var npcHtml = "";
  if (npc && !npc._done) {
    var givePd = PKMN[npc.give], getPd = PKMN[npc.get];
    npcHtml =
      "<div class='city-npc'>" +
        "<img src='" + npc.sprite + "' class='npc-portrait' onerror='this.style.display=\"none\"'>" +
        "<div class='npc-bubble'><b>" + npc.npcName + ":</b> " + npc.text + "</div>" +
        "<div class='npc-trade'>" +
          "<div class='trade-pkmn'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + npc.give + ".png'><span>" + (givePd?givePd.name:"?") + "</span></div>" +
          "<span class='trade-arrow'>⇆</span>" +
          "<div class='trade-pkmn'><img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + npc.get + ".png'><span>" + (getPd?getPd.name:"?") + "</span></div>" +
        "</div>" +
        "<button class='city-btn trade-btn' onclick='doNPCTrade(\"" + zone.id + "\")'>Tauschen</button>" +
      "</div>";
  }

  // ── Gary/Rival-Block (nur wenn Zone cityRival hat) ──────────
  var rivalHtml = "";
  if (zone.cityRival) {
    var rivalKey = zone.id + "_rival";
    var rivalDefeated = isTrainerDefeated(rivalKey, 0);
    var rivalSpr = (typeof TRAINER_SPRITES !== "undefined" && TRAINER_SPRITES[zone.cityRival.sprite])
      ? TRAINER_SPRITES[zone.cityRival.sprite]
      : "";

    rivalHtml =
      "<div class='city-rival-block " + (rivalDefeated ? "city-rival-done" : "") + "'>" +
        "<div class='city-rival-inner'>" +
          (rivalSpr ? "<img src='" + rivalSpr + "' class='city-rival-portrait' onerror='this.style.display=\"none\"'>" : "") +
          "<div class='city-rival-text'>" +
            (rivalDefeated
              ? "<b>" + zone.cityRival.name + ":</b> \"Du bist gar nicht schlecht... aber beim nächsten Mal schlage ich dich!\"<br><small>✅ Besiegt</small>"
              : "<b>" + zone.cityRival.name + ":</b> \"Hey! Ich bin " + zone.cityRival.name + "! Ich werde der weltbeste Pokémon-Trainer! Du kannst mich nicht aufhalten!\"") +
          "</div>" +
        "</div>" +
        (!rivalDefeated
          ? "<button class='city-btn city-rival-btn' onclick='triggerCityRival(getZone(\"" + zone.id + "\"))'>⚔️ Gegen " + zone.cityRival.name + " kämpfen!</button>"
          : "") +
      "</div>";
  }

  // ── "Weiter"-Button nur zeigen wenn kein Rival mehr wartet ──
  var rivalPending = zone.cityRival && !isTrainerDefeated(zone.id + "_rival", 0);
  var continueHtml = rivalPending
    ? "<button class='city-continue-btn city-continue-disabled' disabled title='Besiege zuerst " + (zone.cityRival ? zone.cityRival.name : "den Rivalen") + "!'>🔒 Zuerst kämpfen!</button>"
    : "<button class='city-continue-btn' onclick='continueFromCity()'>➡ Weiter reisen</button>";

  container.innerHTML =
    "<div class='city-view'>" +
      "<div class='city-header'>" +
        "<div class='city-title'>🏙️ " + zone.name + "</div>" +
        "<div class='city-subtitle'>" +
          (zone.cityRival && !isTrainerDefeated(zone.id + "_rival", 0)
            ? "Dein Rival " + zone.cityRival.name + " wartet auf dich!"
            : "Du hast die Stadt erreicht – dein Team wurde geheilt!") +
        "</div>" +
      "</div>" +
      rivalHtml +
      "<div class='city-services'>" +
        "<div class='city-service'>" +
          "<div class='service-icon'>🏥</div>" +
          "<div class='service-name'>Pokémon-Center</div>" +
          "<div class='service-desc'>Team vollständig geheilt!</div>" +
          "<button class='city-btn' onclick='healInCity()'>Nochmal heilen</button>" +
        "</div>" +
        (zone.shopItems && zone.shopItems.length > 0
          ? "<div class='city-service'>" +
              "<div class='service-icon'>🛒</div>" +
              "<div class='service-name'>Shop</div>" +
              "<div class='service-desc'>Kaufe Items mit deinem Geld</div>" +
              "<button class='city-btn' onclick='showCityShop(getZone(STATE.currentZoneId))'>Shop öffnen</button>" +
            "</div>"
          : "") +
      "</div>" +
      npcHtml +
      continueHtml +
    "</div>";

  switchTab("World");
}
