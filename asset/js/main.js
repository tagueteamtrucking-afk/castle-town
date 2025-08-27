/* ===========================================================
   Fantasy Castle Town — Main JS (iPad-friendly)
   Uses your engine's loadCharacter if present; otherwise
   provides a Plaza fallback scene + loader.
   =========================================================== */

const IS_PLAZA = typeof document !== "undefined" && !!document.getElementById("plaza-canvas");

/* Simple on-page logger (handy on iPad without DevTools) */
(function () {
  const el = document.getElementById("log");
  if (!el) return;
  const write = (level, ...args) => {
    const line = `[${level}] ${args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}`;
    el.textContent += line + "\n";
    el.scrollTop = el.scrollHeight;
  };
  const origErr = console.error, origWarn = console.warn, origLog = console.log;
  console.error = (...a)=>{ origErr(...a); write("error", ...a); };
  console.warn  = (...a)=>{ origWarn(...a); write("warn ", ...a); };
  console.log   = (...a)=>{ origLog(...a);  write("log  ", ...a); };
})();

/* Engine hook (if your site already defines it, we won't override) */
let __engineProvidedLoad = (typeof loadCharacter === "function") ? loadCharacter : null;

/* Fallback scene store */
const FB = { scene:null, renderer:null, camera:null, avatars:{}, clock:null };

/* Init fallback Three.js scene (only on Plaza) */
function initFallbackSceneIfNeeded() {
  if (!IS_PLAZA || FB.scene) return;
  const wrap = document.getElementById("plaza-canvas-wrap");
  const canvas = document.getElementById("plaza-canvas");
  if (!wrap || !canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const size = () => {
    const w = wrap.clientWidth;
    const h = Math.max(380, Math.round(w * 0.56));
    renderer.setSize(w, h, false);
    if (FB.camera) { FB.camera.aspect = w/h; FB.camera.updateProjectionMatrix(); }
  };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16/9, 0.1, 100);
  camera.position.set(0, 1.6, 10);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2); dir.position.set(5,8,6); scene.add(dir);
  const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222); grid.position.y = -0.01; scene.add(grid);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    Object.values(FB.avatars).forEach(a => { if (a.vrm) a.vrm.update(dt); });
    renderer.render(scene, camera);
  }
  window.addEventListener("resize", size);
  size(); animate();

  FB.scene = scene; FB.renderer = renderer; FB.camera = camera; FB.clock = clock;

  // Expose helpers for grid & UI
  window.setCharacterPosition = function(name, x,y,z){ const a=FB.avatars[name]; if(a&&a.obj) a.obj.position.set(x,y,z); };
  window.clearCharacters = function(){ Object.values(FB.avatars).forEach(a=>{ if(a&&a.obj) FB.scene.remove(a.obj); }); FB.avatars={}; };
  window.focusCameraOnPlaza = function(){ FB.camera.position.set(0,1.6,10); FB.camera.lookAt(0,1.4,0); };
}

/* Fallback VRM load */
async function fallbackLoadCharacter(name, vrmPath) {
  initFallbackSceneIfNeeded();
  if (!FB.scene) { console.warn("No fallback scene available."); return; }
  if (FB.avatars[name]) return; // already loaded

  try {
    const loader = new THREE.GLTFLoader();
    const gltf = await new Promise((res, rej)=> loader.load(vrmPath, res, undefined, rej));
    const vrm = await THREE.VRM.from(gltf);
    const obj = vrm.scene;
    obj.rotation.y = Math.PI;
    FB.scene.add(obj);
    FB.avatars[name] = { vrm, obj };
  } catch (e) {
    console.error("VRM load failed:", vrmPath, e.message || e);
  }
}

/* Public loader — use engine if available, else fallback */
window.loadCharacter = async function(name, vrmPath, label){
  try {
    if (__engineProvidedLoad) return __engineProvidedLoad(name, vrmPath, label);
    return await fallbackLoadCharacter(name, vrmPath);
  } catch (e) { console.error("loadCharacter error:", e); }
};

/* Summon all 15 */
window.loadAllCharacters = function(){
  const list = [
    ["stella","asset/models/stella.vrm","Observatory & Apothecary"],
    ["tracy","asset/models/tracy.vrm","Cathedral Studio"],
    ["alexandria","asset/models/alexandria.vrm","Grand Library"],
    ["jem","asset/models/jem.vrm","Dojo"],
    ["carol","asset/models/carol.vrm","Restaurant"],
    ["nina","asset/models/nina.vrm","Blue Lab"],
    ["charlotte","asset/models/charlotte.vrm","Relay Tower"],
    ["abbey","asset/models/abbey.vrm","Grand Vault"],
    ["billie","asset/models/billie.vrm","Art Sales Mansion"],
    ["odessa","asset/models/odessa.vrm","Museum Mansion"],
    ["sorcha","asset/models/sorcha.vrm","Social Mansion"],
    ["themis","asset/models/themis.vrm","Chamber of Compliance"],
    ["clarice","asset/models/clarice.vrm","City Hall"],
    ["whitestar","asset/models/whitestar.vrm","Palace"],
    ["reyczar","asset/models/reyczar.vrm","Palace"]
  ];
  list.forEach((row,i)=> setTimeout(()=>loadCharacter(row[0],row[1],row[2]), i*120));

  // Arrange grid if helpers exist
  setTimeout(()=>{
    if (typeof setCharacterPosition === "function") {
      const spacing=2.2, perRow=5, startX=-spacing*(perRow-1)/2, startZ=-spacing;
      list.forEach((row,idx)=> {
        const r=Math.floor(idx/perRow), c=idx%perRow;
        setCharacterPosition(row[0], startX+c*spacing, 0, startZ+r*spacing);
      });
    }
    if (typeof focusCameraOnPlaza === "function") focusCameraOnPlaza();
  }, 1200);
};

// Auto-size canvas on first paint (iPad rotate)
document.addEventListener("visibilitychange", ()=> {
  if (document.visibilityState==="visible" && FB.renderer) {
    const wrap = document.getElementById("plaza-canvas-wrap");
    FB.renderer.setSize(wrap.clientWidth, Math.max(380, Math.round(wrap.clientWidth*0.56)), false);
  }
});
