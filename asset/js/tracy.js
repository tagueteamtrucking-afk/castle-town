const el = (id)=>document.getElementById(id);
const preview = el('preview');

el('generate').onclick = ()=>{
  const g = preview.getContext('2d'); g.clearRect(0,0,preview.width,preview.height);
  g.fillStyle='#0e0e1a'; g.fillRect(0,0,preview.width,preview.height);
  g.fillStyle='#9bd'; g.font='16px ui-sans-serif'; g.fillText('Preview (mock)', 12, 24);
  wrap(g, (el('prompt').value||'[no prompt]').slice(0,220), 12, 50, preview.width-24, 18);
  const file = el('refImg').files?.[0];
  if (file){ const img = new Image(); img.onload=()=>{ g.globalAlpha=.25; g.drawImage(img, preview.width-160, preview.height-120, 150, 110); g.globalAlpha=1; }; img.src=URL.createObjectURL(file); }
};
el('exportAvatar').onclick = ()=>alert('Pipeline: 1) Generate refs 2) Block-out in Ready Player Me / VRoid 3) Refine in Blender 4) Export VRM/GLB 5) Validate in Nina’s Lab.');
el('exportOBJ').onclick = ()=>{
  const payload = {
    time:new Date().toISOString(),
    prompt:el('prompt').value,
    outType:el('outType').value,
    guidance:Number(el('guidance').value),
    steps:Number(el('steps').value),
    p3d:el('p3d').value
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const a = Object.assign(document.createElement('a'), {href:URL.createObjectURL(blob), download:'tracy_request.json'}); a.click();
};

function wrap(g, text, x, y, maxW, lh){ const words=text.split(' '); let line=''; for(let n=0;n<words.length;n++){ const test=line+words[n]+' '; if(g.measureText(test).width>maxW&&n>0){ g.fillText(line,x,y); line=words[n]+' '; y+=lh; } else line=test; } g.fillText(line,x,y); }
