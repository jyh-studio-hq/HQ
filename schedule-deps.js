/* ════════════════════════════════════
   SVG 關聯線引擎 (極簡直角與細線版)
   ════════════════════════════════════ */

function toggleDeps(){
  showDepsFlag = !showDepsFlag;
  const btn = document.getElementById('btnToggleDeps');
  if(btn) btn.style.opacity = showDepsFlag ? '1' : '0.45';
  drawDeps();
}

function buildDepSelTask(selfId){
  const sel = document.getElementById('depSelTask');
  if(!sel) return;
  sel.innerHTML = '<option value="">選擇前置任務…</option>';
  tasks.forEach(t=>{
    if(t.id === selfId) return;
    sel.innerHTML += `<option value="${t.id}">${t.name}</option>`;
  });
}

function renderDepList(){
  const el = document.getElementById('depList');
  if(!el) return;
  el.innerHTML = '';
  if(!editDeps.length){
    el.innerHTML='<div style="font-size:10px;color:#9CA3AF;padding:2px">尚無關聯</div>';
    return;
  }
  editDeps.forEach((d,i)=>{
    const t = tasks.find(x=>x.id===d.id);
    const name = t ? t.name : '(已刪除)';
    const row = document.createElement('div');
    row.className = 'grp-item';
    row.style.cssText = 'padding: 4px 8px; border-bottom: 1px dashed var(--border);';
    row.innerHTML = `
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px" title="${name}">${name}</span>
      <span style="background:${d.type==='FS'?'#FED7D7':'#EBF8FF'};color:${d.type==='FS'?'#C53030':'#63B3ED'};
        padding:1px 6px;font-size:10px;font-weight:700;flex-shrink:0;border-radius:2px;">${d.type}</span>
      <span onclick="removeDep(${i})" style="cursor:pointer;color:#E53E3E;font-size:14px;padding:0 3px;flex-shrink:0;line-height:1" title="移除">×</span>`;
    el.appendChild(row);
  });
}

function addDep(){
  const idVal = document.getElementById('depSelTask').value;
  const id = parseInt(idVal);
  const type = document.getElementById('depSelType').value;
  if(!idVal){ alert('請選擇前置任務'); return; }
  if(editDeps.find(d=>d.id===id)){ alert('此任務已加入'); return; }
  editDeps.push({id, type});
  renderDepList();
}

function removeDep(i){
  editDeps.splice(i,1);
  renderDepList();
}

function drawDeps(){
  const svg = document.getElementById('depSvg');
  if(!svg) return;
  [...svg.querySelectorAll('.dep-arrow')].forEach(el=>el.remove());
  if(!showDepsFlag) return;

  const outer = document.getElementById('go');
  const tbl = outer ? outer.querySelector('table') : null;
  if(!tbl) return;

  const pEl = outer.parentElement;
  const pRect = pEl.getBoundingClientRect();
  const sx = outer.scrollLeft;
  const sy = outer.scrollTop;

  function getBarPos(taskId){
    const t = tasks.find(x=>x.id===taskId);
    if(!t) return null;
    const tr = tbl.querySelector(`tr[data-id="${taskId}"]`);
    if(!tr) return null;
    const allTds = [...tr.querySelectorAll('td.td-wk')];
    const sTd = allTds.find(td=>parseInt(td.dataset.wi)===t.start);
    const eTd = allTds.find(td=>parseInt(td.dataset.wi)===(t.end-1)) || sTd;
    if(!sTd) return null;
    const sr = sTd.getBoundingClientRect();
    const er = eTd.getBoundingClientRect();
    const trR = tr.getBoundingClientRect();
    return {
      x1: sr.left  - pRect.left + sx,
      x2: er.right - pRect.left + sx,
      y : trR.top  - pRect.top  + sy + trR.height * 0.5,
    };
  }

  tasks.forEach(t=>{
    if(!t.deps || !t.deps.length) return;
    const to = getBarPos(t.id);
    if(!to) return;
    t.deps.forEach(dep=>{
      const from = getBarPos(dep.id);
      if(!from) return;
      
      const type = dep.type || 'FS';
      const color   = type==='FS' ? '#E53E3E' : '#63B3ED'; 
      const markerId= type==='FS' ? 'arrowhead-fs' : 'arrowhead-ss';

      let d;
      let startX = type === 'FS' ? from.x2 : from.x1;
      let targetX = to.x1;

      if (Math.abs(startX - targetX) < 4) {
        const dy = to.y > from.y ? -10 : 10;
        d = `M${startX},${from.y} L${startX},${to.y + dy}`;
      } else {
        const gap = startX < targetX ? -2 : 2; 
        d = `M${startX},${from.y} L${startX},${to.y} L${targetX + gap},${to.y}`;
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', color);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-width', '1.0'); 
      path.setAttribute('stroke-dasharray', '3,2'); 
      path.setAttribute('stroke-linejoin', 'round'); 
      path.setAttribute('marker-end', `url(#${markerId})`);
      path.classList.add('dep-arrow');
      svg.appendChild(path);
    });
  });

  const tbR = tbl.getBoundingClientRect();
  svg.setAttribute('width',  tbR.width  + sx);
  svg.setAttribute('height', tbR.height + sy);
}