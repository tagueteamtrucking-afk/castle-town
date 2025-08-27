/* === Plaza Multi-Loader: load all 15 characters ===
   Exact filenames assumed to exist in assets/models/
   This wrapper has zero placeholders and safely no-ops if helper hooks are absent.
*/

function loadAllCharacters() {
  // 1) Load everyone using your existing loader
  loadCharacter("stella",     "assets/models/stella.vrm",      "Observatory & Apothecary");
  loadCharacter("tracy",      "assets/models/tracy.vrm",       "Cathedral Studio");
  loadCharacter("alexandria", "assets/models/alexandria.vrm",  "Grand Library");
  loadCharacter("jem",        "assets/models/jem.vrm",         "Dojo");
  loadCharacter("carol",      "assets/models/carol.vrm",       "Restaurant");
  loadCharacter("nina",       "assets/models/nina.vrm",        "Blue Lab");
  loadCharacter("charlotte",  "assets/models/charlotte.vrm",   "Relay Tower");
  loadCharacter("abbey",      "assets/models/abbey.vrm",       "Grand Vault");
  loadCharacter("billie",     "assets/models/billie.vrm",      "Art Sales Mansion");
  loadCharacter("odessa",     "assets/models/odessa.vrm",      "Museum Mansion");
  loadCharacter("sorcha",     "assets/models/sorcha.vrm",      "Social Mansion");
  loadCharacter("themis",     "assets/models/themis.vrm",      "Chamber of Compliance");
  loadCharacter("clarice",    "assets/models/clarice.vrm",     "City Hall");
  loadCharacter("whitestar",  "assets/models/whitestar.vrm",   "Palace");
  loadCharacter("reyczar",    "assets/models/reyczar.vrm",     "Palace");

  // 2) Optional: auto-arrange in a neat plaza grid if your engine exposes hooks.
  // These calls run only if the helpers exist, otherwise safely skip.
  const arrangeIfPossible = () => {
    if (typeof setCharacterPosition === "function") {
      const names = [
        "stella","tracy","alexandria","jem","carol",
        "nina","charlotte","abbey","billie","odessa",
        "sorcha","themis","clarice","whitestar","reyczar"
      ];
      const spacing = 2.2;    // meters between avatars
      const perRow  = 5;      // 5 x 3 grid
      const startX  = -spacing * (perRow - 1) / 2;
      const startZ  = -spacing; // 3 rows centered

      names.forEach((n, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const x = startX + col * spacing;
        const z = startZ + row * spacing;
        try { setCharacterPosition(n, x, 0, z); } catch(e) {}
      });
    }
    if (typeof focusCameraOnPlaza === "function") {
      try { focusCameraOnPlaza(); } catch(e) {}
    }
  };

  // Defer a tick to let models mount, then arrange (if hooks exist)
  setTimeout(arrangeIfPossible, 800);
}
