/* ===========================================================
   Fantasy Castle Town — Main JS (iPad-friendly)
   Renders into #town-canvas (or #plaza-canvas if present).
   =========================================================== */

const CANVAS = (() => {
  const a = document.getElementById("town-canvas");
  const b = document.getElementById("plaza-canvas");
  return a || b || null;
})();

const LOG = document.getElementById("log");
function logLine(level, ...args){
  if (!LOG) return;
  const line = `[${level}] ${args.map(x=>typeof x==="string"?x:JSON.stringify(x)).join(" ")}`;
  LOG.textContent += line + "\n"; LOG.scrollTop = LOG.scrollHeight;
}
["log","warn","error"].forEach(k=>{
  const orig = console[k].bind(console);
  console[k] = (...a)=>{ orig(...a); logLine(k, ...a); };
});

/* If your site already provides a loader, we use that */
let __engineProvidedLoad = (typeof loadCharacter === "function") ? loadCharacter : null;

/* Fallback scene */
const FB = { scene:null, renderer:null, camera:null, avatars:{}, clock:null, ground:null };

function initSceneIfNeeded() {
  if (!CANVAS || FB.scene) return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas: CANVAS, antialias:true, alpha:true, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const wrap = CANVAS.parentElement || document.body;
  function resize(){
    const w = wrap.clientWidth || window.innerWidth;
    const h = Math.max(380, Math.round(w * 0.56));
    renderer.setSize(w, h, false);
    if (FB.camera){ FB.camera.aspect = w/h; FB.camera.updateProjectionMatrix(); }
  }

  // Scene + Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16/9, 0.1, 200);
  camera.position.set(0, 1.6, 10);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 10, 6);
  scene.add(sun);

  // “Town square” ground (matte disk) + sky dome
  const groundGeo = new THREE.CircleGeometry(18, 64);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x202532, roughness: 0.95, metalness: 0.0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2; ground.position.y = -0.01; scene.add(ground);

  const skyGeo = new THREE.SphereGeometry(80, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x111423, side: THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo, skyMat); scene.add(sky);

  // Subtle rim lights for game-y feel
  const rimL = new THREE.DirectionalLight(0x9a7bff, 0.4); rimL.position.set(-6, 3, -4); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0x5ee1ff, 0.35); rimR.position.set(6, 4, 5); scene.add(rimR);

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    Object.values(FB.avatars).forEach(a => { if (a.vrm) a.vrm.update(dt); });
    renderer.render(scene, camera);
  }
  window.addEventListener("resize", resize);
  resize(); animate();

  FB.scene = scene; FB.camera = camera; FB.renderer = renderer; FB.clock = clock; FB.ground = ground;

  // Helpers exposed globally
  window.setCharacterPosition = function(name, x,y,z){ const a=FB.avatars[name]; if(a&&a.obj) a.obj.position.set(x,y,z); };
  window.clearCharacters = function(){ Object.values(FB.avatars).forEach(a=>{ if(a&&a.obj) FB.scene.remove(a.obj); }); FB.avatars={}; };
  window.focusCameraOnPlaza = function(){ FB.camera.position.set(0,1.8,12); FB.camera.lookAt(0,1.5,0); };
}

async function fallbackLoadCharacter(name, vrmPath) {
  initSceneIfNeeded();
  if (!FB.scene) { console.warn("No scene available."); return; }
  if (FB.avatars[name]) return;

  try {
    const loader = new THREE.GLTFLoader();
    const gltf = await new Promise((res, rej)=> loader.load(vrmPath, res, undefined, rej));
    const vrm = await THREE.VRM.from(gltf);
    const obj = vrm.scene;
    obj.rotation.y = Math.PI;            // face camera
    obj.position.set( (Object.keys(FB.avatars).length%5 - 2)*2.2, 0, Math.floor(Object.keys(FB.avatars).length/5)*2.2 - 1.8 );
    FB.scene.add(obj);
    FB.avatars[name] = { vrm, obj };
  } catch (e) {
    console.error("VRM load failed:", vrmPath, e.message || e);
  }
}

/* Public loader */
window.loadCharacter = async function(name, vrmPath, label){
  try{
    if (__engineProvidedLoad) return __engineProvidedLoad(name, vrmPath, label);
    return await fallbackLoadCharacter(name, vrmPath);
  }catch(e){ console.error("loadCharacter error:", e); }
};

/* Summon all */
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
  setTimeout(()=>{ if (typeof focusCameraOnPlaza==="function") focusCameraOnPlaza(); }, 1200);
};

/* Auto-init scene and show something immediately */
document.addEventListener("DOMContentLoaded", async ()=>{
  if (CANVAS) {
    initSceneIfNeeded();
    // Auto-load Stella so the viewer isn't empty
    try { await loadCharacter("stella","asset/models/stella.vrm","Observatory & Apothecary"); }
    catch(e){ console.warn("Autoload failed:", e); }
  }
});
