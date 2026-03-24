/* ════════════════════════════════════
   1. 時間軸運算邏輯
   ════════════════════════════════════ */
function isoW1Mon(y){
  const jan4=new Date(y,0,4),dow=jan4.getDay()||7;
  const d=new Date(jan4);d.setDate(jan4.getDate()-(dow-1));return d;
}
function getIsoWeek(d){
  const thu=new Date(d);thu.setDate(d.getDate()+3);
  const w1=isoW1Mon(thu.getFullYear());
  return{y:thu.getFullYear(),w:Math.round((thu-w1)/604800000)+1};
}
function dateToWkIdx(dateStr){
  if(!dateStr||!AXIS.length) return -1;
  const d=new Date(dateStr+'T00:00:00');
  for(let i=0;i<AXIS.length;i++){
    const nx=new Date(AXIS[i].date);nx.setDate(nx.getDate()+7);
    if(d>=AXIS[i].date&&d<nx) return i;
  }
  return d<AXIS[0].date?0:AXIS.length-1;
}
function wkIdxToDateStr(wi){
  if(wi<0||wi>=AXIS.length) return '';
  const d=AXIS[wi].date;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDateShort(str){
  if(!str) return '';
  const p=str.split('-'); return `${parseInt(p[1])}/${parseInt(p[2])}`;
}
function wkLabel(wi){
  if(wi<0||wi>=AXIS.length) return '—';
  const a=AXIS[wi];return `${a.y} W${String(a.isoW).padStart(2,'0')}`;
}
function isColHidden(wi){
  if(wi<0||wi>=AXIS.length) return true;
  const a=AXIS[wi];
  if(hiddenMonths[`${a.y}-${a.m}`]) return true;
  if(printRange.active){
    const ym=a.y*100+a.m,s=printRange.sy*100+printRange.sm,e=printRange.ey*100+printRange.em;
    if(ym<s||ym>e) return true;
  }
  return false;
}

/* ════════════════════════════════════
   2. 介面建立邏輯 (面板與選單)
   ════════════════════════════════════ */
function rebuildAxis(){
  const startYear=parseInt(document.getElementById('cfgStartYear').value)||2026;
  const numYears=Math.max(1,Math.min(10,parseInt(document.getElementById('cfgYears').value)||3));
  AXIS=[];
  const axStart=isoW1Mon(startYear), endYear=startYear+numYears-1;
  const lastDay=new Date(endYear,11,28);
  const {y:lY,w:lW}=getIsoWeek(lastDay);
  const axEnd=new Date(isoW1Mon(lY)); axEnd.setDate(axEnd.getDate()+(lW-1)*7+6);
  let d=new Date(axStart);
  while(d<=axEnd){
    const {y,w}=getIsoWeek(d);
    AXIS.push({date:new Date(d),y,isoW:w,m:d.getMonth()+1,isYrFirst:w===1,isLNY:(LNY_WEEKS[y]===w)});
    d.setDate(d.getDate()+7);
  }
  TOTAL_WK=AXIS.length; TODAY_WK=0;
  for(let i=0;i<AXIS.length;i++){
    const nx=new Date(AXIS[i].date);nx.setDate(nx.getDate()+7);
    if(DEMO_TODAY>=AXIS[i].date&&DEMO_TODAY<nx){TODAY_WK=i;break;}
  }
  TODAY_F=(DEMO_TODAY-AXIS[TODAY_WK].date)/604800000;
  const a0=AXIS[0],aL=AXIS[AXIS.length-1];
  document.getElementById('cfgAxisLabel').textContent=`　共 ${TOTAL_WK} 週（${a0.y} W${a0.isoW} ─ ${aL.y} W${aL.isoW}）`;
  document.getElementById('subLine').textContent=`時程區間：${a0.y} 年 W${a0.isoW} ─ ${aL.y} 年 W${aL.isoW}`;
  buildMonGrid(startYear,numYears); buildPrSelectors(startYear,numYears); render();
}

const MON_NAMES=['01月','02月','03月','04月','05月','06月','07月','08月','09月','10月','11月','12月'];
function buildMonGrid(sy,ny){
  const wrap=document.getElementById('monGridWrap');wrap.innerHTML='';
  for(let y=sy;y<sy+ny;y++){
    const yd=document.createElement('div');yd.style.cssText='margin-bottom:.6rem';
    const lb=document.createElement('div');
    lb.style.cssText='font-size:11px;color:var(--yr-tx);font-weight:700;margin-bottom:4px; font-family: var(--font-mono);';
    lb.textContent=`[ ${y} ]`;yd.appendChild(lb);
    const gr=document.createElement('div');gr.className='mon-grid';
    for(let m=1;m<=12;m++){
      const key=`${y}-${m}`; const btn=document.createElement('button');
      btn.className='mon-toggle'+(hiddenMonths[key]?' hidden':''); btn.textContent=MON_NAMES[m-1];
      btn.onclick=()=>{hiddenMonths[key]=!hiddenMonths[key];btn.className='mon-toggle'+(hiddenMonths[key]?' hidden':'');render();};
      gr.appendChild(btn);
    }
    yd.appendChild(gr);wrap.appendChild(yd);
  }
}

function buildPrSelectors(sy,ny){
  const ey=sy+ny-1;
  ['prSY','prEY'].forEach((id,ie)=>{
    const el=document.getElementById(id);const cur=parseInt(el.value)||0; el.innerHTML='';
    for(let y=sy;y<=ey;y++) el.innerHTML+=`<option value="${y}"${(cur||ie?ey:sy)===y?' selected':''}>${y}</option>`;
  });
  ['prSM','prEM'].forEach((id,ie)=>{
    const el=document.getElementById(id);
    if(!el.innerHTML) for(let m=1;m<=12;m++) el.innerHTML+=`<option value="${m}">${m} 月</option>`;
    if(!el.value) el.value=ie?'12':'1';
  });
  printRange={sy,sm:1,ey,em:12,active:false};
}
function applyPrintRange(){
  const sy=parseInt(document.getElementById('prSY').value), sm=parseInt(document.getElementById('prSM').value);
  const ey=parseInt(document.getElementById('prEY').value), em=parseInt(document.getElementById('prEM').value);
  if(sy>ey||(sy===ey&&sm>em)){document.getElementById('prPreview').textContent='⚠ 起始月份不可晚於結束月份';return;}
  printRange={sy,sm,ey,em,active:true};
  let cnt=0;
  for(let wi=0;wi<AXIS.length;wi++){
    const a=AXIS[wi],ym=a.y*100+a.m;
    if(ym>=sy*100+sm&&ym<=ey*100+em&&!hiddenMonths[`${a.y}-${a.m}`]) cnt++;
  }
  const hint=cnt<=25?'（A3 單頁舒適）':cnt<=32?'（A3 可接受）':cnt<=40?'（A3 偏擠）':'（建議分頁）';
  document.getElementById('prPreview').innerHTML=`範圍：<b>${sy}-${String(sm).padStart(2,'0')} ─ ${ey}-${String(em).padStart(2,'0')}</b>　共 <b>${cnt} 週</b>　<span style="color:var(--text3)">${hint}</span>`;
  render();
}
function cancelPrintRange(){
  printRange.active=false;
  document.getElementById('prPreview').innerHTML='已恢復顯示全部。';
  render();
}

/* ════════════════════════════════════
   3. 核心繪製區 (Render) 與防護機制
   ════════════════════════════════════ */
function render(){
  if(!AXIS.length) return;

  // [系統防護機制：版權與宣告強制覆寫校驗]
  try {
    const _a = document.querySelector('meta[name="author"]');
    if (!_a || _a.content !== 'JEN-YUAN HSUEH ARCHITECTS') throw 'err';
    const _c = document.getElementById('copyText');
    if (!_c) throw 'err';
    _c.innerHTML = 'COPYRIGHT &copy; 2026 JEN-YUAN HSUEH ARCHITECTS │ 薛仁淵建築師事務所 開發';
  } catch(e) { 
    document.body.innerHTML = '<h2 style="padding:50px;text-align:center;font-family:sans-serif;color:#C53030;">SYSTEM ERROR<br><span style="font-size:14px;color:#333;">Unauthorized HTML Source Modification</span></h2>';
    return; 
  }

  const fo=document.getElementById('fo').value.trim().toLowerCase();
  const hasStFilter = hiddenSts.done || hiddenSts.active || hiddenSts.pending;

  const monSpans=[];
  for(let wi=0;wi<TOTAL_WK;wi++){
    if(isColHidden(wi)) continue;
    const a=AXIS[wi],key=`${a.y}-${a.m}`;
    if(!monSpans.length||monSpans[monSpans.length-1].key!==key) monSpans.push({key,y:a.y,m:a.m,cnt:1});
    else monSpans[monSpans.length-1].cnt++;
  }
  const yrSpans=[];
  monSpans.forEach(ms=>{
    if(!yrSpans.length||yrSpans[yrSpans.length-1].y!==ms.y) yrSpans.push({y:ms.y,cols:ms.cnt});
    else yrSpans[yrSpans.length-1].cols+=ms.cnt;
  });
  const visWks=[];
  for(let wi=0;wi<TOTAL_WK;wi++) if(!isColHidden(wi)) visWks.push(wi);
  const totalVisCols=monSpans.reduce((a,b)=>a+b.cnt,0);

  let h='<thead><tr><th class="th-task" rowspan="3" style="font-size:11px; letter-spacing:0.1em;">ITEM 任務項目</th><th class="th-unit" rowspan="3" style="font-size:10px">PIC 單位</th>';
  yrSpans.forEach(yr=>h+=`<th class="th-yr" colspan="${yr.cols}">${yr.y}</th>`);
  h+='</tr><tr>';
  monSpans.forEach(ms=>h+=`<th class="th-mon" colspan="${ms.cnt}">${String(ms.m).padStart(2,'0')}</th>`);
  h+='</tr><tr>';
  for(let vi=0;vi<visWks.length;vi++){
    const a=AXIS[visWks[vi]];
    let cls=a.isYrFirst?'th-wk yr-start':'th-wk';
    if(a.isLNY) cls+=' lny-col';
    h+=`<th class="${cls}" title="${a.isLNY?'農曆春節休假週':''}">${a.isoW}</th>`;
  }
  h+='</tr></thead><tbody>';

  groups.forEach(grp=>{
    if(hiddenGrps[grp.id]) return;
    const gt=tasks.filter(t=> t.grp===grp.id && !hiddenSts[t.status] && (!fo||(t.unit||'').toLowerCase().includes(fo)) );
    if(!gt.length && (hasStFilter || fo)) return;

    h+=`<tr class="grp-row"><td colspan="${totalVisCols+2}"><div class="grp-sticky" style="position:sticky;left:12px;width:max-content;z-index:20;">${grp.name}</div></td></tr>`;
    gt.forEach(t=>{
      const st=SC[t.status];
      h+=`<tr data-id="${t.id}">`;
      h += `<td class="td-task" title="${t.name}"><span class="task-sort-btns no-print"><span class="sort-btn" onclick="moveTask(event, ${t.id}, -1)">▲</span><span class="sort-btn" onclick="moveTask(event, ${t.id}, 1)">▼</span></span><span onclick="openEdit(${t.id})">${t.name}</span></td>`;
      h+=`<td class="td-unit" title="${t.unit||''}">${t.unit||'—'}</td>`;
      const taskVis=visWks.filter(wi=>wi>=t.start&&wi<t.end);
      const taskVisSpan=taskVis.length;
      let barDone=false;
      for(let vi=0;vi<visWks.length;vi++){
        const wi=visWks[vi];
        const a=AXIS[wi];
        let tcls=a.isYrFirst?'td-wk yr-start':'td-wk';
        if(a.isLNY) tcls+=' lny-col';
        h+=`<td class="${tcls}" data-wi="${wi}" onmousedown="startDrag(event,${t.id},${wi})" onmouseenter="moveDrag(event,${t.id},${wi})">`;
        if(t.ms&&wi===t.end-1){
          const msDate=t.dateS?fmtDateShort(t.dateS):'';
          h+=`<div class="ms-diamond" style="background:var(--ms)" title="${t.name}（${msDate}）"></div>`;
          if(msDate) h+=`<div class="ms-date">${msDate}</div>`;
        } else if(!t.ms&&wi>=t.start&&wi<t.end){
            const isVF=!barDone;
            const isVL=vi===visWks.length-1||visWks[vi+1]>=t.end;
            const ds=t.dateS?fmtDateShort(t.dateS):'';
            const de=t.dateE?fmtDateShort(t.dateE):'';
            const showDates=taskVisSpan>=3; 

            if(isVF){
              barDone=true;
              const lp=1;
              const wPct=`calc(${taskVisSpan * 100}% + ${taskVisSpan - 1}px)`;
              const impOutline=t.imp?`outline:1.5px solid var(--imp-outline); outline-offset: -1.5px;`:'';
              const showName=taskVisSpan>=8;

              let inner='';
              if(showName) inner+=`<span class="bar-name">${t.name}</span>`;
              h+=`<div class="bar" style="left:${lp}px;width:${wPct};background:${st.bg};color:${st.tx};${impOutline}" title="${t.name}（${ds||'?'}─${de||'?'}）">${inner}</div>`;

              if(showDates&&ds){
                h+=`<div style="position:absolute;top:50%;transform:translateY(-50%);left:4px;height:18px;display:flex;align-items:center;font-family:var(--font-mono);font-size:8px;font-weight:700;color:${st.tx};pointer-events:none;z-index:3;opacity:.9">${ds}</div>`;
              }
            }
            if(isVL&&de&&showDates){
              h+=`<div style="position:absolute;top:50%;transform:translateY(-50%);right:4px;height:18px;display:flex;align-items:center;font-family:var(--font-mono);font-size:8px;font-weight:700;color:${st.tx};pointer-events:none;z-index:3;opacity:.9">${de}</div>`;
            }
        }
        if(wi===TODAY_WK) h+=`<div class="today-line" style="left:${Math.round(TODAY_F*100)}%"></div>`;
        h+='</td>';
      }
      h+='</tr>';
    });
  });
  h+='</tbody>';
  document.getElementById('gt').innerHTML=h;
  
  // 渲染完成後觸發後續動作
  updateSticky();
  if (typeof drawDeps === 'function') drawDeps();
  if (typeof autoSave === 'function') autoSave();
}

// 凍結欄位捲動同步
function updateSticky(){
  const outer=document.getElementById('go'), tbl=outer?outer.querySelector('table'):null;
  if(!tbl) return;
  const sx=outer.scrollLeft;
  tbl.querySelectorAll('td.td-task,th.th-task,td.td-unit,th.th-unit').forEach(el=>{ el.style.transform=`translateX(${sx}px)`; });
  if(typeof drawDeps === 'function') drawDeps();
}

// 綁定捲動事件
document.addEventListener('DOMContentLoaded', () => {
  const _go = document.getElementById('go');
  if(_go) _go.addEventListener('scroll', updateSticky, {passive:true});
});