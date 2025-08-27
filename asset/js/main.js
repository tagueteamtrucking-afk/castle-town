/* ===========================================================
   Fantasy Castle Town — Main JS
   - Safe, drop-in file.
   - If your engine already defines loadCharacter/scene, those will be used.
   - Otherwise, we initialize a minimal Three.js + VRM scene on the Plaza page.
   =========================================================== */

/* -----------------------
   Detect Plaza environment
------------------------ */
const IS_PLAZA = typeof document !== "undefined" && !!document.getElementById("plaza-canvas");

/* -----------------------
   Engine hooks (stubs)
------------------------ */
// If a prior engine provided these, we will NOT override them.
let __engineProvidedLoad = typeof loadCharacter === "function" ? loadCharacter : null;

// Keep a local registry for fallback scene
const Fallback = {
  scene: null,
  renderer: null,
  camera: null,
  clock: null,
  mixer: null,
  avatars: {},  // name -> { vrm, obj3d }
  loading: false
};

/* -----------------------
   Fallback Scene (Plaza)
------------------------ */
function initFallbackSceneIfNeeded() {
  if (!IS_PLAZA || Fallback.scene) return;

  const canvas = document.getElementById("plaza-canvas");
  const wrap   = document.getElementById("plaza-canvas-wrap");
  if (!canvas || !wrap) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(wrap.clientWidth, Math.max(380, Math.round(wrap.clientWidth * 0.56)));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 1.5, 8);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(5, 8, 6);
  scene.add(dir);

  // Ground Grid (simple visual anchor)
  const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
  grid.position.y = -0.01;
  scene.add(grid);

  const clock = new THREE.Clock();

  function onResize() {
    const w = wrap.clientWidth;
    const h = Math.max(380, Math.round(w * 0.56));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  (function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    Object.values(Fallback.avatars).forEach(a => {
      if (a.vrm) a.vrm.update(dt);
    });
    renderer.render(scene, camera);
  })();

  // Save
  Fallback.scene = scene;
  Fallback.renderer = renderer;
  Fallback.camera = camera;
  Fallback.clock = clock;

  // Expose helpers used by loader
  window.setCharacterPosition = function(name, x, y, z) {
    const a = Fallback.avatars[name];
    if (a && a.obj3d) a.obj3d.position.set(x, y, z);
  };
  window.clearCharacters = function() {
    Object.entries(Fallback.avatars).forEach(([name, a]) => {
      if (a && a.obj3d) {
        Fallback.scene.remove(a.obj3d);
      }
    });
    Fallback.avatars = {};
  };
  window.focusCameraOnPlaza = function() {
    Fallback.camera.position.set(0, 1.6, 10);
    Fallback.camera.lookAt(0, 1.4, 0);
  };
}

/* -----------------------
   Fallback loadCharacter
------------------------ */
async function fallbackLoadCharacter(name, vrmPath /*, label */) {
  initFallbackSceneIfNeeded();
  if (!Fallback.scene) {
    console.warn("Fallback scene unavailable; cannot load VRM.");
    return;
  }

  // Avoid duplicate add
  if (Fallback.avatars[name]) return;

  const loader = new THREE.GLTFLoader();
  loader.crossOrigin = "anonymous";

  const gltf = await new Promise((resolve, reject) => {
    loader.load(
      vrmPath,
      (g) => resolve(g),
      undefined,
      (e) => reject(e)
    );
  });

  // Convert to VRM
  const vrm = await THREE.VRM.from(gltf);
  const obj = vrm.scene;
  obj.rotation.y = Math.PI; // face camera
  Fallback.scene.add(obj);

  Fallback.avatars[name] = { vrm, obj3d: obj };
}

/* -----------------------------------------------------------
   Public loadCharacter (uses engine if available; else fallback)
------------------------------------------------------------ */
window.loadCharacter = async function(name, vrmPath, label) {
  try {
    if (__engineProvidedLoad) {
      // Use the site’s real loader
      return __engineProvidedLoad(name, vrmPath, label);
    } else {
      // Use minimal fallback (Plaza page only)
      return await fallbackLoadCharacter(name, vrmPath, label);
    }
  } catch (e) {
    console.error("loadCharacter error:", e);
  }
};

/* -----------------------------------------------------------
   Multi-loader (Plaza “Summon All 15”)
------------------------------------------------------------ */
window.loadAllCharacters = function() {
  const list = [
    ["stella",     "assets/models/stella.vrm",      "Observatory & Apothecary"],
    ["tracy",      "assets/models/tracy.vrm",       "Cathedral Studio"],
    ["alexandria", "assets/models/alexandria.vrm",  "Grand Library"],
    ["jem",        "assets/models/jem.vrm",         "Dojo"],
    ["carol",      "assets/models/carol.vrm",       "Restaurant"],
    ["nina",       "assets/models/nina.vrm",        "Blue Lab"],
    ["charlotte",  "assets/models/charlotte.vrm",   "Relay Tower"],
    ["abbey",      "assets/models/abbey.vrm",       "Grand Vault"],
    ["billie",     "assets/models/billie.vrm",      "Art Sales Mansion"],
    ["odessa",     "assets/models/odessa.vrm",      "Museum Mansion"],
    ["sorcha",     "assets/models/sorcha.vrm",      "Social Mansion"],
    ["themis",     "assets/models/themis.vrm",      "Chamber of Compliance"],
    ["clarice",    "assets/models/clarice.vrm",     "City Hall"],
    ["whitestar",  "assets/models/whitestar.vrm",   "Palace"],
    ["reyczar",    "assets/models/reyczar.vrm",     "Palace"]
  ];

  // Load in sequence with a tiny stagger so UI stays responsive
  list.forEach((row, i) => {
    setTimeout(() => loadCharacter(row[0], row[1], row[2]), i * 120);
  });

  // Arrange into a neat grid if helpers exist
  setTimeout(() => {
    if (typeof setCharacterPosition === "function") {
      const spacing = 2.2, perRow = 5, startX = -spacing * (perRow - 1) / 2, startZ = -spacing;
      list.forEach((row, idx) => {
        const r = Math.floor(idx / perRow), c = idx % perRow;
        const x = startX + c * spacing, z = startZ + r * spacing;
        try { setCharacterPosition(row[0], x, 0, z); } catch(_) {}
      });
    }
    if (typeof focusCameraOnPlaza === "function") {
      try { focusCameraOnPlaza(); } catch(_) {}
    }
  }, 1200);
};

/* -----------------------------------------------------------
   Tiny quality-of-life helpers (optional)
------------------------------------------------------------ */
window.clearCharacters = window.clearCharacters || function() {
  console.warn("clearCharacters(): no engine or fallback scene available.");
};
window.setCharacterPosition = window.setCharacterPosition || function() {};
window.focusCameraOnPlaza = window.focusCameraOnPlaza || function() {};
