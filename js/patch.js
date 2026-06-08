// ── Rad-Coupon zu ITEM_DEFS hinzufügen ───────────────────────
// (wird in ui.js gepatcht, da wir ui.js nicht jedes Mal komplett
//  neu schreiben wollen)
(function patchItemDefs(){
  if(typeof ITEM_DEFS === "undefined") return;
  if(!ITEM_DEFS.rad_coupon) {
    ITEM_DEFS.rad_coupon = {
      name:  "Rad-Coupon",
      desc:  "Gutschein für ein kostenloses Fahrrad beim Fahrradladen in Azuria City.",
      img:   "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/bicycle.png",
      isKey: true
    };
  }
})();
