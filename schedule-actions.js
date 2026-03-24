/* ════════════════════════════════════
   1. 互動功能 (UI 面板與選單)
   ════════════════════════════════════ */
function togglePanel(id){document.getElementById(id).classList.toggle('show');}

function toggleFs(st) {
  hiddenSts[st] = !hiddenSts[st];
  document.getElementById('fs_' + st).className = 'f-tag' + (hiddenSts[st] ? ' off' : '');
  render();
}

function buildColorSelect(sid,sel){
  const el=document.getElementById(sid);el.innerHTML='';
  COLORS.forEach((c,i)=>el.innerHTML+=`<option value="${c}"${c===sel?' selected':''}>${CNAMES[i]}</option>`);
}

function syncGrpSel(){
  const el = document.getElementById('eGrp');
  const cur = el ? el.value : '';
  if(el){ el.innerHTML = ''; groups.forEach(g => el.innerHTML += `<option value="${g.id}"${cur===g.id?' selected':''}>${g.name}</option>`); }
  const fw = document.getElementById('fgWrap');
  if(fw){
    fw.innerHTML = '';
    groups.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'f-tag' + (hiddenGrps[g.id] ? ' off' : '');
      btn.textContent = g.name;
      btn.onclick = () => { hiddenGrps[g.id] = !hiddenGrps[g.id]; btn.className = 'f-tag' + (hiddenGrps[g.id] ? ' off' : ''); render(); };
      fw.appendChild(btn);
    });
  }
}

/* ════════════════════════════════════
   2. Notes 說明區塊管理
   ════════════════════════════════════ */
function renderNotes(){
  const body=document.getElementById('notesBody');body.innerHTML='';
  notes.forEach((n,i)=>{
    const row=document.createElement('div');row.className='note-row';
    row.innerHTML=`<div class="note-num">${String(i+1).padStart(2,'0')}</div>
      <input class="note-input" value="${n.replace(/"/g,'&quot;')}" placeholder="輸入說明內容…" oninput="notes[${i}]=this.value;autoSave()">
      <button class="btn btn-red no-print" onclick="removeNote(${i})" style="margin:4px 6px;padding:2px 6px;font-size:10px;flex-shrink:0;border:none;">✕</button>`;
    body.appendChild(row);
  });
}
function addNote(){notes.push('');renderNotes();autoSave();}
function removeNote(i){notes.splice(i,1);if(!notes.length)notes=[''];renderNotes();autoSave();}

/* ════════════════════════════════════
   3. 任務排程拖曳邏輯
   ════════════════════════════════════ */
function startDrag(e,id,wi){
  const t=tasks.find(x=>x.id===id);if(!t||t.ms)return;
  dragState=wi<t.start||wi>=t.end ? {id,mode:'ext',anchor:wi} : {id,mode:'mv',anchor:wi,os:t.start,oe:t.end};
  e.preventDefault();
}
function moveDrag(e,id,wi){
  if(!dragState||dragState.id!==id)return;
  const t=tasks.find(x=>x.id===id);if(!t)return;
  if(dragState.mode==='ext'){
    const newStart=Math.min(dragState.anchor,wi);
    const newEnd=Math.max(dragState.anchor,wi)+1;
    if(t.start===newStart&&t.end===newEnd) return;
    t.start=newStart; t.end=newEnd;
  }else{
    const d=wi-dragState.anchor;
    let ns=dragState.os+d,ne=dragState.oe+d;
    if(ns<0){ns=0;ne=dragState.oe-dragState.os;}
    if(ne>TOTAL_WK){ne=TOTAL_WK;ns=TOTAL_WK-(dragState.oe-dragState.os);}
    if(t.start===ns&&t.end===ne) return;
    t.start=ns;t.end=ne;
  }
  const t2=tasks.find(x=>x.id===dragState.id);
  if(t2){t2.dateS=wkIdxToDateStr(t2.start);t2.dateE=wkIdxToDateStr(Math.max(0,t2.end-1));}
  render();
}
document.addEventListener('mouseup',()=>{dragState=null;});

/* ════════════════════════════════════
   4. 任務編輯與彈窗 (Modal)
   ════════════════════════════════════ */
function dateToWk(){
  const ds=document.getElementById('eDateS').value, de=document.getElementById('eDateE').value;
  const si=ds?dateToWkIdx(ds):-1, ei=de?dateToWkIdx(de):-1;
  let hint='';
  if(si>=0) hint+=`起：${wkLabel(si)}`;
  if(ei>=0) hint+=(hint?' ─ ':' 迄：')+wkLabel(ei);
  if(si>=0&&ei>=0) hint+=`（共 ${ei-si+1} 週）`;
  document.getElementById('dateHint').textContent=hint;
}
function openEdit(id){
  const t=tasks.find(x=>x.id===id);if(!t)return;
  editId=id;syncGrpSel();
  document.getElementById('mTitle').textContent='編輯任務 EDIT TASK';
  document.getElementById('eName').value=t.name;
  document.getElementById('eGrp').value=t.grp;
  document.getElementById('eUnit').value=t.unit||'';
  document.getElementById('eSt').value=t.status;
  document.getElementById('eDateS').value=t.dateS||wkIdxToDateStr(t.start);
  document.getElementById('eDateE').value=t.dateE||wkIdxToDateStr(Math.max(0,t.end-1));
  document.getElementById('eMi').value=t.ms?'1':t.imp?'2':'0';
  document.getElementById('btnDel').style.display='';
  editDeps=t.deps?JSON.parse(JSON.stringify(t.deps)):[];
  buildDepSelTask(t.id);
  renderDepList();
  dateToWk();
  document.getElementById('modal').classList.add('open');
}
function openAdd(){
  editId=null;syncGrpSel();
  document.getElementById('mTitle').textContent='新增任務 ADD TASK';
  document.getElementById('eName').value='';
  document.getElementById('eUnit').value='';
  document.getElementById('eSt').value='pending';
  document.getElementById('eDateS').value='';
  document.getElementById('eDateE').value='';
  document.getElementById('eMi').value='0';
  document.getElementById('btnDel').style.display='none';
  document.getElementById('dateHint').textContent='';
  editDeps=[];
  buildDepSelTask(null);
  renderDepList();
  document.getElementById('modal').classList.add('open');
}
function closeMod(){document.getElementById('modal').classList.remove('open');}

function saveTask(){
  const name=document.getElementById('eName').value.trim();
  if(!name){alert('請輸入任務名稱');return;}
  const ds=document.getElementById('eDateS').value, de=document.getElementById('eDateE').value;
  if(!ds||!de){alert('請輸入開始與結束日期');return;}
  const si=dateToWkIdx(ds), ei=dateToWkIdx(de)+1;
  if(si<0||ei<=si){alert('日期範圍有誤，請確認結束日期晚於開始日期');return;}
  if(editId){
    const t=tasks.find(x=>x.id===editId);
    t.name=name;t.grp=document.getElementById('eGrp').value;
    t.unit=document.getElementById('eUnit').value.trim();
    t.status=document.getElementById('eSt').value;
    t.start=si;t.end=ei; t.ms=document.getElementById('eMi').value==='1'; t.imp=document.getElementById('eMi').value==='2';
    t.dateS=ds;t.dateE=de; t.deps=JSON.parse(JSON.stringify(editDeps));
  }else{
    tasks.push({id:nextId++,grp:document.getElementById('eGrp').value, name,unit:document.getElementById('eUnit').value.trim(), start:si,end:ei,status:document.getElementById('eSt').value, ms:document.getElementById('eMi').value==='1', imp:document.getElementById('eMi').value==='2', dateS:ds,dateE:de, deps:JSON.parse(JSON.stringify(editDeps))});
  }
  closeMod();render();
}
function delTask(){
  if(!editId)return;
  if(!confirm('確定刪除此任務？'))return;
  tasks=tasks.filter(x=>x.id!==editId);
  closeMod();render();
}
document.getElementById('modal').addEventListener('click',function(e){if(e.target===this)closeMod();});

/* ════════════════════════════════════
   5. 群組管理與排序
   ════════════════════════════════════ */
let _grpBackup=[];
function openGrpMgr(){
  _grpBackup=JSON.parse(JSON.stringify(groups));
  renderGrpList(); buildColorSelect('newGrpColor',COLORS[0]);
  document.getElementById('newGrpSwatch').style.background=COLORS[0];
  document.getElementById('grpModal').classList.add('open');
}
function cancelGrpMgr(){ groups=_grpBackup; document.getElementById('grpModal').classList.remove('open'); syncGrpSel();render(); }
function closeGrpMgr(){document.getElementById('grpModal').classList.remove('open');syncGrpSel();render();}

function renderGrpList(){
  const el=document.getElementById('grpList');el.innerHTML='';
  groups.forEach((g,i)=>{
    const row=document.createElement('div');row.className='grp-item';
    row.innerHTML=`<div style="display:flex;flex-direction:column;gap:2px;margin-right:2px"><button onclick="moveGrp(${i},-1)" style="padding:0 4px;font-size:9px;border:1px solid #ccc;background:#fff;cursor:pointer;line-height:1.4" ${i===0?'disabled':''}>▲</button><button onclick="moveGrp(${i},1)"  style="padding:0 4px;font-size:9px;border:1px solid #ccc;background:#fff;cursor:pointer;line-height:1.4" ${i===groups.length-1?'disabled':''}>▼</button></div><div class="grp-swatch" id="gsw_${i}" style="background:${g.color}"></div><input type="text" value="${g.name}" onchange="groups[${i}].name=this.value" style="flex:1"><select id="gsel_${i}" style="width:95px" onchange="groups[${i}].color=this.value;document.getElementById('gsw_${i}').style.background=this.value"></select><button class="btn btn-red" onclick="removeGrp('${g.id}')" style="padding:4px 8px;font-size:10px;border:none;">刪除</button>`;
    el.appendChild(row); buildColorSelect(`gsel_${i}`,g.color);
  });
}
function moveGrp(i,dir){
  const j=i+dir; if(j<0||j>=groups.length) return;
  [groups[i],groups[j]]=[groups[j],groups[i]]; renderGrpList();
}
function moveTask(e, id, dir) {
  e.stopPropagation();
  const idx = tasks.findIndex(t => t.id === id); if (idx === -1) return;
  const targetGrp = tasks[idx].grp;
  const grpTasks = tasks.filter(t => t.grp === targetGrp);
  const inGrpIdx = grpTasks.findIndex(t => t.id === id);
  if (dir === -1 && inGrpIdx === 0) return;
  if (dir === 1 && inGrpIdx === grpTasks.length - 1) return;
  const neighbor = grpTasks[inGrpIdx + dir];
  const neighborIdx = tasks.findIndex(t => t.id === neighbor.id);
  [tasks[idx], tasks[neighborIdx]] = [tasks[neighborIdx], tasks[idx]];
  render();
}
function addGrp(){
  const name=document.getElementById('newGrpName').value.trim(), color=document.getElementById('newGrpColor').value;
  if(!name){alert('請輸入群組名稱');return;}
  groups.push({id:'g'+Date.now(),name,color});
  document.getElementById('newGrpName').value='';
  renderGrpList(); syncGrpSel();
}
function removeGrp(gid){
  if(tasks.some(t=>t.grp===gid)){alert('此群組尚有任務，請先更改任務群組');return;}
  groups=groups.filter(g=>g.id!==gid);renderGrpList();
}

/* ════════════════════════════════════
   6. 匯出邏輯 (PDF 列印 & Excel 產出)
   ════════════════════════════════════ */
function doPrint(){window.print();}

function exportExcel(){
  if(typeof XLSX==='undefined'){alert('Excel 模組載入中，請稍候再試');return;}
  const wb=XLSX.utils.book_new();
  const rows=[['任務','負責單位','群組','狀態','開始日期','結束日期','起始週','結束週','總週數']];
  groups.forEach(grp=>{
    const gt=tasks.filter(t=>t.grp===grp.id);if(!gt.length)return;
    rows.push([`── ${grp.name} ──`,'','','','','','','','']);
    gt.forEach(t=>{
      const sm2={done:'已完成',active:'進行中',pending:'待辦'};
      rows.push([t.name,t.unit||'',grp.name,t.ms?'里程碑':sm2[t.status], t.dateS||'',t.dateE||'',wkLabel(t.start),wkLabel(t.end-1),t.end-t.start]);
    });
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:28},{wch:12},{wch:12},{wch:8},{wch:12},{wch:12},{wch:16},{wch:16},{wch:8}];
  XLSX.utils.book_append_sheet(wb,ws,'工作進度表');
  const nr=[['說明']];notes.forEach((n,i)=>nr.push([`${i+1}. ${n}`]));
  const wsN=XLSX.utils.aoa_to_sheet(nr); wsN['!cols']=[{wch:60}];
  XLSX.utils.book_append_sheet(wb,wsN,'說明');
  const axR=[['週序號','年份','ISO週次','月份','週一日期']];
  AXIS.forEach((a,i)=>axR.push([i+1,a.y,a.isoW,a.m,a.date.toLocaleDateString('zh-TW')]));
  const wsA=XLSX.utils.aoa_to_sheet(axR); wsA['!cols']=[{wch:8},{wch:6},{wch:10},{wch:6},{wch:14}];
  XLSX.utils.book_append_sheet(wb,wsA,'週次對照表');
  XLSX.writeFile(wb,`工作進度表_${document.getElementById('projectTitle').value.replace(/\s+/g,'_')}.xlsx`);
}