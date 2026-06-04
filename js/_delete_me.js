// ═══════════════════════════════════════════════════════════════
//  renderer.js — Animierte Sprites (X/Y GIF) + Angriffs-FX
// ═══════════════════════════════════════════════════════════════

// ── Sprite-URLs ───────────────────────────────────────────────
var SD_FRONT       = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/";
var SD_BACK        = SD_FRONT + "back/";
var SD_SHINY_FRONT = SD_FRONT + "shiny/";
var SD_SHINY_BACK  = SD_BACK  + "shiny/";
var PNG_FRONT      = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
var PNG_BACK       = PNG_FRONT + "back/";
var PNG_SHINY      = PNG_FRONT + "shiny/";
var PNG_SHINY_BACK = PNG_BACK  + "shiny/";

function spriteUrl(dexId, back, shiny) {
  if (shiny) return (back ? SD_SHINY_BACK : SD_SHINY_FRONT) + dexId + ".gif";
  return (back ? SD_BACK : SD_FRONT) + dexId + ".gif";
}
function spriteFallback(dexId, back, shiny) {
  if (shiny) return (back ? PNG_SHINY_BACK : PNG_SHINY) + dexId + ".png";
  return (back ? PNG_BACK : PNG_FRONT) + dexId + ".png";
}
