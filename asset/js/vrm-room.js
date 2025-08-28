// v3 — iPad/Safari friendly VRM room bootstrapper with strong framing + cache-busting logs
const VER="0.152.2";
const THREE_URL = `https://esm.sh/three@${VER}`;
const ORBIT_URL = `https://esm.sh/three@${VER}/examples/jsm/controls/OrbitControls.js`;
const GLTF_URL  = `https://esm.sh/three@${VER}/examples/jsm/loaders/GLTFLoader.js`;
const VRM_URL   = `https://esm.sh/@pixiv/three-vrm@2.0.7?deps=three@${VER}`;

const T = await import(THREE_URL);
const { OrbitControls } = await import(ORBIT_URL);
const { GLTFLoader }   = await import(GLTF_URL);
const VRM = await import(VRM_URL);

const body = document.body;
const modelURL = body.dataset.model;                 // e.g. ../asset/models/abbey.vrm
const roomType = (body.dataset.room || "").toLowerCase(); // e.g. 'vault','palace','dojo'
const titleTxt = body.dataset.title || document.title;
const bg = (body.dataset.bg || "#0b0f16,#0a0e1a").split(",");
document.title = titleTxt;

const hud = document.getElementById("hud");
const log = (m,c="")=>{ const d=document.createElement("div"); if(c)d.className=c; d.innerHTML=m; hud.appendChild(d); hud.scrollTop=hud.scrollHeight; };

log(`Boot v3 • three@${VER} / three-vrm@2.0.7 • model: <code>${(modelURL||'—')}</code>`,"");

const canvas = document.getElementById("scene");
const R = new T.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:"high-performance" });
R.setPixelRatio(Math.min(1.5, window.devicePixelRatio||1));
R.setSize(innerWidth, innerHeight);
R.outputColorSpace = T.SRGBColorSpace;

const S = new T.Scene();
const C = new T.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 1200);
C.position.set(0, 1.7, 3.8);
const ctl = new OrbitControls(C, R.domElement);
ctl.target.set(0,1.5,0); ctl.enableDamping = true;

document.documentElement.style.height="100%";
document.body.style.height="100%";
document.body.style.background = `radial-gradient(60% 45% at 50% 15%, rgba(255,255,255,.06), rgba(0,0,0,0)), linear-gradient(180deg, ${bg[0]} 0%, ${bg[1]} 100%)`;

S.add(new T.HemisphereLight(0xffffff, 0x223344, 0.9));
const sun = new T.DirectionalLight(0xffffff, 1.05); sun.position.set(4,7,3); S.add(sun);

const ground = new T.Mesh(new T.CircleGeometry(5.2, 72), new T.MeshStandardMaterial({ color:0x141721, metalness:.06, roughness:.94 }));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; S.add(ground);

// ---------- Camera helpers (guarantee visibility) ----------
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

// ---------- Procedural scenery ----------
function addScenery(type){
  const std = (color, m=.1, r=.9)=> new T.MeshStandardMaterial({ color, metalness:m, roughness:r });
  const add = (m)=>{ m.receiveShadow = m.castShadow = false; S.add(m); };

  switch(type){
    case "vault": {
      for(let i=0;i<18;i++){
        const g = Math.random()<.5 ? new T.CylinderGeometry(.12,.12,.2+Math.random()*.5,16) : new T.BoxGeometry(.2,.12,.2);
        const m = std([0xffd86b,0xf6c244,0xd7b98b][i%3], .3, .5);
        const c = new T.Mesh(g,m);
        c.position.set((Math.random()-.5)*2.6, .06, (Math.random()-.5)*2.2-0.6);
        add(c);
      } break;
    }
    case "mansion": {
      const wall = new T.Mesh(new T.PlaneGeometry(2.2,1.1), std(0x102238,.05,.25));
      wall.position.set(0,1.0,-1.4); add(wall);
      for(let i=0;i<6;i++){ const bar=new T.Mesh(new T.PlaneGeometry(1.8,0.06), std(0x2aa4ff,.1,.5)); bar.position.set(0,1.35 - i*0.2,-1.39); add(bar); }
      break;
    }
    case "museum": {
      for(let i=-1;i<=1;i++){ const p=new T.Mesh(new T.CylinderGeometry(.22,.22,.5,24), std(0x403046,.15,.8)); p.position.set(i*0.9, .25, -0.9); add(p); }
      break;
    }
    case "influencer": {
      for(let i=-1;i<=1;i++){ const scr=new T.Mesh(new T.PlaneGeometry(0.9,0.55), std(0x1a1020,.1,.4)); scr.position.set(i*1.0,1.1,-1.3); add(scr); }
      const neon=new T.Mesh(new T.TorusGeometry(1.2,.03,8,60), std(0xff77aa,.5,.2)); neon.position.y=1.4; add(neon); break;
    }
    case "lab": {
      for(let i=0;i<4;i++){ const pipe=new T.Mesh(new T.CylinderGeometry(.05,.05,1.4,12), std(0x0e2635,.6,.35)); pipe.position.set(-1.2+i*0.8,0.7,-1.1); add(pipe); }
      const coil=new T.Mesh(new T.TorusGeometry(.5,.07,12,60), std(0x79d0ff,.3,.35)); coil.rotation.x=Math.PI/2; coil.position.set(0,0.7,1.1); add(coil); break;
    }
    case "relay": {
      const mast=new T.Mesh(new T.CylinderGeometry(.06,.06,2.1,12), std(0x24374a,.3,.6)); mast.position.set(0,1.05,-0.9); add(mast);
      [0.4,0.75,1.1].forEach(h=>{ const dish=new T.Mesh(new T.TorusGeometry(.35,.02,8,50), std(0xb8dcff,.1,.4)); dish.position.set(0,h+0.2,-0.9); add(dish); }); break;
    }
    case "compliance": {
      for(let r=0;r<3;r++){ const shelf=new T.Mesh(new T.BoxGeometry(2.2,.08,.4), std(0x142123,.1,.8)); shelf.position.set(0,0.35+r*.42,-1.2); add(shelf);
        for(let i=0;i<6;i++){ const binder=new T.Mesh(new T.BoxGeometry(.18,.28,.08), std(0x9fead1,.05,.6)); binder.position.set(-1.0+i*0.4, 0.46+r*.42, -1.2); add(binder); } }
      break;
    }
    case "judge": { const bench=new T.Mesh(new T.BoxGeometry(2.2,.8,.5), std(0x1b2230,.2,.6)); bench.position.set(0,.4,-1.2); add(bench); break; }
    case "restaurant": {
      for(let i=-1;i<=1;i++){ const ttop=new T.Mesh(new T.CylinderGeometry(.35,.35,.06,18), std(0x4d3520,.1,.8));
        const leg=new T.Mesh(new T.CylinderGeometry(.06,.08,.55,12), std(0x3a2a1a,.2,.6));
        ttop.position.set(i*0.9,.43,0.2); leg.position.set(i*0.9,.2,0.2); add(ttop); add(leg); } break; }
    case "dojo": {
      for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){ const tatami=new T.Mesh(new T.PlaneGeometry(.9,.5), std(0x262a1d,.05,.95));
        tatami.rotation.x=-Math.PI/2; tatami.position.set(x*.95,0.002,z*.55); add(tatami); } break; }
    case "observatory": {
      const scope=new T.Mesh(new T.CylinderGeometry(.05,.08,1.1,16), std(0x223044,.3,.6)); scope.rotation.z=-0.6; scope.position.set(0.5,0.8,0.6); add(scope);
      const dome=new T.Mesh(new T.SphereGeometry(1.2,24,18,0,Math.PI*2,0,Math.PI/2), std(0x1a2333,.2,.7)); dome.position.set(-0.6,1.2,-0.6); add(dome); break; }
    case "cathedral": {
      [0xd8c0ff,0xa5d6ff,0xff9bc0].forEach((c,i)=>{ const pane=new T.Mesh(new T.PlaneGeometry(.4,1.0), std(c,.05,.2));
        pane.position.set(-1.1+i*1.1,1.1,-1.25); S.add(pane); }); break; }
    case "library": {
      for(let i=-1;i<=1;i++){ const shelf=new T.Mesh(new T.BoxGeometry(1.2,1.2,.3), std(0x23301c,.1,.85)); shelf.position.set(i*0.9,0.65,-1.2); add(shelf);
        for(let b=0;b<8;b++){ const book=new T.Mesh(new T.BoxGeometry(.16,.24,.05), std([0xd0f0b0,0xa5d6ff,0xffc58a][b%3],.05,.5));
          book.position.set(i*0.9-0.48+b*0.12, 0.2+Math.random()*0.8, -1.06); add(book); } } break; }
  }
}

// ---------- Load VRM ----------
const loader = new GLTFLoader();
try{
  if(!modelURL){ log("❌ No model URL provided in data-model","err"); }
  else{
    const head = await fetch(modelURL,{method:"HEAD",cache:"no-store"});
    if(!head.ok){ log(`❌ Missing model: <code>${modelURL}</code> (${head.status})`,"err"); }
    else{
      const gltf = await new Promise((res,rej)=>loader.load(modelURL, res, undefined, rej));
      const vrm = await VRM.VRM.from(gltf);
      vrm.scene.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; o.castShadow=false; o.receiveShadow=false; }});
      S.add(vrm.scene);
      fitToObject(vrm.scene, 1.32);
      log(`✅ Loaded <b>${modelURL.split('/').pop()}</b>`,"ok");
    }
  }
}catch(e){ log(`❌ Load error: ${e?.message||e}`,"err"); }

// ---------- Scenery ----------
addScenery(roomType);

// ---------- Resize / animate ----------
addEventListener("resize", ()=>{ C.aspect=innerWidth/innerHeight; C.updateProjectionMatrix(); R.setSize(innerWidth,innerHeight); }, {passive:true});
(function loop(){ ctl.update(); R.render(S,C); requestAnimationFrame(loop); })();
