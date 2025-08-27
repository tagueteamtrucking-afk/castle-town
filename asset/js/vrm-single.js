import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import * as THREE_VRM from 'https://unpkg.com/@pixiv/three-vrm@2.0.5/lib/three-vrm.module.js';
import { ROSTER } from './roster.js';

const params = new URLSearchParams(location.search);
const key = (params.get('assistant')||'').toLowerCase();
const info = ROSTER.find(r=>r.key===key) || ROSTER[0];

document.getElementById('title').textContent = info ? info.name : 'Character';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
resize(); window.addEventListener('resize', resize);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth/(canvas.height||1), 0.1, 100);
camera.position.set(0, 1.4, 2.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0); controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const dir = new THREE.DirectionalLight(0xffffff, 1.1); dir.position.set(1, 1.5, 1.2); scene.add(dir);

const loader = new GLTFLoader();
loader.register(parser => new THREE_VRM.VRMLoaderPlugin(parser));
loader.load(`../assets/models/${info.file}`, (gltf)=>{
  const vrm = gltf.userData.vrm;
  THREE_VRM.VRMUtils.removeUnnecessaryJoints(vrm.scene);
  vrm.scene.rotation.y = Math.PI;
  scene.add(vrm.scene);
  const clock = new THREE.Clock();
  (function loop(){
    const dt = clock.getDelta();
    vrm.update(dt); controls.update(); renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
}, undefined, (e)=>{ console.error(e); alert('VRM load failed: '+info.file); });

function resize(){
  const w = canvas.clientWidth || (window.innerWidth-32);
  const h = canvas.height || 420;
  renderer.setSize(w, h, false);
  camera.aspect = w/h; camera.updateProjectionMatrix();
}
