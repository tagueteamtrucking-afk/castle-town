import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import * as THREE_VRM from 'https://unpkg.com/@pixiv/three-vrm@2.0.5/lib/three-vrm.module.js';
import { ROSTER } from './roster.js';

const rosterEl = document.getElementById('roster');
const loadBtn = document.getElementById('loadSelected');
const clearBtn = document.getElementById('clearAll');
const canvas = document.getElementById('plazaCanvas');

// Build checkboxes
rosterEl.innerHTML = ROSTER.map(r => `
  <label class="chk">
    <input type="checkbox" value="${r.key}"> ${r.name}
  </label>
`).join('');

// Three.js scene
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
resize(); window.addEventListener('resize', resize);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth/(canvas.height||1), 0.1, 200);
camera.position.set(0, 2.5, 7);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0); controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const dir = new THREE.DirectionalLight(0xffffff, 1.1); dir.position.set(3, 5, 3); scene.add(dir);

const loader = new GLTFLoader();
loader.register(parser => new THREE_VRM.VRMLoaderPlugin(parser));

let avatars = []; // {key, vrm, node}
function layoutCircle() {
  const n = avatars.length; if (!n) return;
  const radius = 3 + Math.min(5, n*0.3);
  avatars.forEach((a, i) => {
    const ang = (i / n) * Math.PI * 2;
    a.node.position.set(Math.cos(ang)*radius, 0, Math.sin(ang)*radius);
    a.node.lookAt(0, 1.3, 0);
  });
}

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

loadBtn.onclick = async ()=>{
  const selected = [...rosterEl.querySelectorAll('input:checked')].map(i=>i.value);
  // load any not loaded yet
  for (const key of selected) {
    if (avatars.find(a=>a.key===key)) continue;
    const info = ROSTER.find(r=>r.key===key);
    await loadVRM(info);
  }
  layoutCircle();
};

clearBtn.onclick = ()=>{
  avatars.forEach(a=>scene.remove(a.node));
  avatars = [];
};

async function loadVRM(info){
  return new Promise((resolve,reject)=>{
    loader.load(`assets/models/${info.file}`, (gltf)=>{
      const vrm = gltf.userData.vrm;
      THREE_VRM.VRMUtils.removeUnnecessaryJoints(vrm.scene);
      const node = vrm.scene;
      scene.add(node);
      avatars.push({key:info.key, vrm, node});
      resolve();
    }, undefined, (e)=>{ console.error(e); alert('Failed to load '+info.file); reject(e); });
  });
}

function resize(){
  const w = canvas.clientWidth || window.innerWidth - 32;
  const h = canvas.height || 500;
  renderer.setSize(w, h, false);
  camera.aspect = w/h; camera.updateProjectionMatrix();
}
