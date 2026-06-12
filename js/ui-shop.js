function zeigShop(zone, gebaeude) {
  var popup = document.getElementById("shopPopup"); if (!popup) return;
  popup.style.display = "flex";
  var list = document.getElementById("shopItemList"); if (!list) return;
  list.innerHTML = "";
  var items = gebaeude.stock || zone._shopItems || [];
  if (items.length === 0) { list.innerHTML = "<p>Keine Items verfügbar.</p>"; return; }
  items.forEach(item => {
    var def = ITEM_DEFS[item.id] || {};
    var kannKaufen = (STATE.geld || 0) >= item.preis;
    var row = document.createElement("div"); row.className = "shop-row";
    row.innerHTML =
      `<div class="shop-info"><b>${item.name || def.name || item.id}</b></div>` +
      `<div class="shop-preis">${item.preis} ₽</div>` +
      `<button ${kannKaufen ? "" : "disabled"} onclick="kaufeItem('${item.id}',${item.preis},this)">Kaufen</button>`;
    list.appendChild(row);
  });
}
window.schliesseShop = function() { var p=document.getElementById("shopPopup");if(p)p.style.display="none"; };
window.kaufeItem = function(itemId, preis, btn) {
  if (!STATE || (STATE.geld||0) < preis) { zeigToast("Nicht genug Geld!"); return; }
  var def = ITEM_DEFS[itemId] || {};
  if (def.einmalig && (STATE.items[itemId]||0) > 0) { zeigToast((def.name||itemId) + " bereits vorhanden!"); return; }
  STATE.geld -= preis;
  STATE.items[itemId] = (STATE.items[itemId]||0) + 1;
  aktualisiereHUD();
  if (btn && btn.parentNode) {
    if ((STATE.geld||0) < preis) btn.disabled = true;
  }
  zeigToast((def.name||itemId) + " erhalten!");
  speichern();
};

// ══════════════════════════════════════════════════════════════
//  GEBÄUDE-ANSICHT (Features)
// ══════════════════════════════════════════════════════════════
