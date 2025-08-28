// vrm-room.js — v5 (iPad tuned, three-vrm v2 style)
// Loads .vrm using GLTFLoader + VRMLoaderPlugin and always frames the avatar.

const VER = "0.152.2";
const THREE_URL = `https://esm.sh/three@${VER}`;
const ORBIT_URL = `https://esm.sh/three@${VER}/examples/jsm/controls/OrbitControls.js`;
const GLTF_URL  = `https://esm.sh/three@${VER}/examples/jsm/loaders/GLTFLoader.js`;
const VRM_URL   = `https://esm.sh/@pixiv/three-vrm@2.0.7?deps=three@${VER}`;

const T = await import(THREE_URL);
const { OrbitControls } = await import(ORBIT_URL);
const { GLTFLoader }   = await import(GLTF_URL);

// v2 API: use VRMLoaderPlugin (no VRM.from)
const { VRMLoaderPlugin /*, VRMUtils */ } = await import(VRM_URL);

const body = document.body;
const modelURL = body.dataset.model;                       // ../asset/models/abbey.vrm?v=5
const roomType = (body.dataset.room || "").toLowerCase();
const titleTxt = body.dataset.title || document.title;
const bg = (body.dataset.bg || "#0b0f16,#0a0e1a").split(",");
document.title = titleTxt;

// HUD
const hud = document.getElementById("hud");
const log = (m,c="")=>{ const d=document.createElement("div"); if(c)d.className=c; d.innerHTML=m; hud.appendChild(d); hud.scrollTop=hud.scrollHeight; };
log(`Boot v5 • three@${VER} • three-vrm@2 • model: <code>${modelURL||"—"}</code>`);

// Renderer / Scene / Camera (iPad-safe DPR)
const canvas = document.getElementById("scene");
const R = new T.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:"high-performance" });
R.setPixelRatio(1.0); // iPad safety
R.setSize(innerWidth, innerHeight);
R.outputColorSpace = T.SRGBColorSpace;

const S = new T.Scene();
const C = new T.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 1200);
C.position.set(0,1.7,3.8);
const ctl = new OrbitControls(C, R.domElement);
ctl.target.set(0,1.5,0); ctl.enableDamping = true;

// Background
document.documentElement.style.height="100%";
document.body.style.height="100%";
document.body.style.background =
  `radial-gradient(60% 45% at 50% 15%, rgba(255,255,255,.06), rgba(0,0,0,0)),
   linear-gradient(180deg, ${bg[0]} 0%, ${bg[1]} 100%)`;

// Lights + ground
S.add(new T.HemisphereLight(0xffffff, 0x223344, 0.9));
const sun = new T.DirectionalLight(0xffffff, 1.05); sun.position.set(4,7,3); S.add(sun);
const ground = new T.Mesh(new T.CircleGeometry(5.2, 72),
  new T.MeshStandardMaterial({ color:0x141721, metalness:.06, roughness:.94 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; S.add(ground);

// Camera framing (guarantee visibility)
const fitToObject=(obj, margin=1.28)=>{
  const b=new T.Box3().setFromObject(obj), s=b.getSize(new T.Vector3());
  if(s.y>0){ const norm=1.7/s.y; obj.scale.setScalar(Math.min(3.0, Math.max(0.2, norm))); }
  const b2=new T.Box3().setFromObject(obj), s2=b2.getSize(new T.Vector3()), c2=b2.getCenter(new T.Vector3());
  const maxDim=Math.max(s2.x,s2.y,s2.z)||1;
  const fov= C.fov*(Math.PI/180);
  const dist= (maxDim/Math.tan(fov/2))*margin;
  C.position.set(c2.x, c2.y + s2.y*0.15, c2.z + dist);
  ctl.target.copy(c2); C.lookAt(c2);
};

// Minimal scenery (others reuse same file)
function addScenery(type){
  const add = m=>{ m.receiveShadow=m.castShadow=false; S.add(m); };
  const mat = (c,m=.1,r=.9)=> new T.MeshStandardMaterial({color:c,metalness:m,roughness:r});
  if(type==="vault"){
    for(let i=0;i<18;i++){
      const g=Math.random()<.5?new T.CylinderGeometry(.12,.12,.2+Math.random()*.5,16):new T.BoxGeometry(.2,.12,.2);
      const m=mat([0xffd86b,0xf6c244,0xd7b98b][i%3],.3,.5);
      const c=new T.Mesh(g,m); c.position.set((Math.random()-.5)*2.6,.06,(Math.random()-.5)*2.2-0.6); add(c);
    }
  }
}

// --- Load VRM via GLTFLoader + VRMLoaderPlugin ---
const loader = new GLTFLoader();
loader.register((parser)=> new VRMLoaderPlugin(parser));  // << key line

try{
  if(!modelURL){ log("❌ No model URL in data-model","err"); }
  else{
    const head = await fetch(modelURL,{method:"HEAD",cache:"no-store"});
    log(`HEAD ${head.status} — <code>${modelURL}</code>`);
    if(!head.ok){ log(`❌ Missing model: <code>${modelURL}</code>`,"err"); }
    else{
      const gltf = await new Promise((res,rej)=> loader.load(modelURL, res, undefined, rej));
      // three-vrm v2 attaches the VRM instance here:
      const vrm = gltf.userData?.vrm;
      if(!vrm){ throw new Error("No VRM instance on gltf.userData.vrm"); }
      vrm.scene.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; o.castShadow=false; o.receiveShadow=false; }});
      S.add(vrm.scene);
      fitToObject(vrm.scene, 1.32);
      log(`✅ Loaded <b>${new URL(modelURL, location.href).href}</b>`,"ok");
    }
  }
}catch(e){ log(`❌ Load error: ${e?.message||e}`,"err"); }

// Scenery + animate
addScenery(roomType);
addEventListener("resize", ()=>{ C.aspect=innerWidth/innerHeight; C.updateProjectionMatrix(); R.setSize(innerWidth,innerHeight); }, {passive:true});
(function loop(){ ctl.update(); R.render(S,C); requestAnimationFrame(loop); })();
