import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import * as THREE_VRM from 'https://unpkg.com/@pixiv/three-vrm@2.0.5/lib/three-vrm.module.js';

const voiceSel = document.getElementById('voice');
const styleSel = document.getElementById('style');
const minsInput = document.getElementById('mins');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const soundList = document.getElementById('soundList');
const stopAudioBtn = document.getElementById('stopAudio');

let synth = window.speechSynthesis;
let utter; let playing=[];

function fillVoices(){
  const vs = synth.getVoices();
  voiceSel.innerHTML = '';
  vs.forEach(v => {
    const o = document.createElement('option');
    o.value = v.name; o.textContent = `${v.name} (${v.lang})`;
    voiceSel.appendChild(o);
  });
  const preferred = vs.find(v => /female|samantha|victoria|ava|zira|sara/i.test(v.name));
  if (preferred) voiceSel.value = preferred.name;
}
fillVoices();
if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = fillVoices;

startBtn.onclick = ()=>{
  stopSpeech();
  const minutes = Math.max(3, Math.min(45, parseInt(minsInput.value||10,10)));
  const script = buildScript(styleSel.value, minutes);
  utter = new SpeechSynthesisUtterance(script);
  const chosen = synth.getVoices().find(v => v.name === voiceSel.value);
  if (chosen) utter.voice = chosen;
  utter.rate = 1.0; utter.pitch = 1.0;
  synth.speak(utter);
};
stopBtn.onclick = stopSpeech;
function stopSpeech(){ try { synth.cancel(); } catch {} }

function buildScript(style, minutes){
  const blocks = {
    breath:`Welcome. ${minutes}-minute breath meditation. Sit comfortably… Inhale through the nose…`,
    body:`We’ll scan the body slowly from crown to toes, releasing tension…`,
    nlp:`We’ll anchor calm with a gentle touch on thumb and forefinger as you breathe…`,
    gateway:`Gentle hemi-sync style focus: broaden awareness, then rest on a single tone…`,
    yoga:`Gentle flow: mountain → fold → half lift → table → baby cobra → child’s pose…`,
    hypno:`Imagine a staircase of ten steps… with each step you relax twice as deeply…`
  };
  return (blocks[style]||blocks.breath) + ` …When ready, open your eyes.`;
}

// Sounds
const TRACKS = [
  { name:'Crystal Bowls 1', file:'../assets/audio/stella/bowls-1.mp3' },
  { name:'Ocean',          file:'../assets/audio/stella/ocean.mp3' }
];
soundList.innerHTML = '';
TRACKS.forEach(t=>{
  const b = document.createElement('button'); b.className='btn';
  b.textContent = '▶ '+t.name; b.onclick = ()=>{ const a=new Audio(t.file); a.loop=true; a.play(); playing.push(a); };
  soundList.appendChild(b);
});
stopAudioBtn.onclick = ()=>{ playing.forEach(a=>{try{a.pause();}catch{}}); playing=[]; };

// VRM viewer
const canvas = document.getElementById('vrmCanvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
resize(); window.addEventListener('resize', resize);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth/(canvas.height||1), 0.1, 100);
camera.position.set(0,1.4,2.1);
const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0,1.3,0); controls.enableDamping = true;
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const dir=new THREE.DirectionalLight(0xffffff,1.1); dir.position.set(1,1.5,1.2); scene.add(dir);

const loader = new GLTFLoader(); loader.register(p=>new THREE_VRM.VRMLoaderPlugin(p));
loader.load('../assets/models/white_star.vrm', (gltf)=>{
  const vrm = gltf.userData.vrm; THREE_VRM.VRMUtils.removeUnnecessaryJoints(vrm.scene);
  vrm.scene.rotation.y = Math.PI; scene.add(vrm.scene);
  const clock = new THREE.Clock();
  (function loop(){ const dt=clock.getDelta(); vrm.update(dt); controls.update(); renderer.render(scene,camera); requestAnimationFrame(loop); })();
}, undefined, e=>console.error('VRM load failed', e));

function resize(){
  const w = canvas.clientWidth || (window.innerWidth-32); const h = canvas.height || 360;
  renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
}
