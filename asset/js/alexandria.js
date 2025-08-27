const el = (id)=>document.getElementById(id);
el('run').onclick = ()=>{
  const r = Number(el('roll').value||10);
  const tone = r>=15?'A fortunate twist favors the heroes.': r>=10?'Balanced path with risk and reward.': r>=5?'Complications arise, testing resolve.':'A dire setback reshapes the plan.';
  el('scene').value =
`[Scene Start]
Cast: ${el('chars').value||'(fill characters)'}
Villain: ${el('villain').value||'(fill villain)'}
Hook: ${el('hook').value||'(fill hook)'}
Dice: d20=${r}

${tone}

[Beat 1] …
[Beat 2] …
[Cliffhanger] …`;
};
