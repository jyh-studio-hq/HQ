/* ════════════════════════════════════
   1. 核心資料庫 (全域變數宣告)
   ════════════════════════════════════ */
const LNY_WEEKS = { 2026: 8, 2027: 5, 2028: 4, 2029: 7, 2030: 5 };
let AXIS = [], TOTAL_WK = 0, TODAY_WK = 0, TODAY_F = 0;
let hiddenMonths = {}, hiddenGrps = {}, hiddenSts = { done: false, active: false, pending: false };
let printRange = { sy: 0, sm: 0, ey: 0, em: 0, active: false };
const DEMO_TODAY = new Date();

let groups = [
  { id: 'g1', name: '01. 建築設計', color: '#2C5282' },
  { id: 'g2', name: '02. 公設燈光', color: '#718096' },
  { id: 'g3', name: '03. 審查程序', color: '#111111' },
  { id: 'g4', name: '04. 細部設計', color: '#4A5568' },
  { id: 'g5', name: '05. 工程進度', color: '#2D3748' }
];

const COLORS = ['#2C5282','#3182CE','#2B6CB0','#4299E1','#2F855A','#38A169','#276749','#48BB78','#C05621','#DD6B20','#9C4221','#ED8936','#9B2C2C','#C53030','#742A2A','#F56565','#111111','#4A5568','#2D3748','#718096','#553C9A','#6B46C1','#44337A','#805AD5'];
const CNAMES = ['藍圖深藍','藍圖藍','海軍藍','淺鋼藍','冷杉綠','草灰綠','深墨綠','淺灰綠','紅磚橘','工業橘','深褐橘','淺亮橘','警告紅','標記紅','暗血紅','淺玫紅','純黑','鐵灰','碳灰','銀灰','深邃紫','工業紫','暗夜紫','淺灰紫'];

const SC = {
  done: { bg: 'var(--done-bg)', br: 'var(--done-br)', tx: 'var(--done-tx)' },
  active: { bg: 'var(--active-bg)', br: 'var(--active-br)', tx: 'var(--active-tx)' },
  pending: { bg: 'var(--pend-bg)', br: 'var(--pend-br)', tx: 'var(--pend-tx)' }
};

let tasks = [
  {id:1,grp:'g1',name:'產品定位',unit:'設計部',start:0,end:4,status:'done',ms:false,dateS:'2026-01-05',dateE:'2026-01-25'},
  {id:2,grp:'g1',name:'平面設計',unit:'設計部',start:0,end:8,status:'done',ms:false,dateS:'2026-01-05',dateE:'2026-02-22'},
  {id:3,grp:'g1',name:'立面設計',unit:'設計部',start:0,end:6,status:'done',ms:false,dateS:'2026-01-05',dateE:'2026-02-08'},
  {id:4,grp:'g1',name:'景觀設計',unit:'設計部',start:8,end:20,status:'active',ms:false,dateS:'2026-02-23',dateE:'2026-05-17'},
  {id:5,grp:'g1',name:'結構、機電整合',unit:'設計部',start:4,end:16,status:'active',ms:false,dateS:'2026-01-26',dateE:'2026-04-19'},
  {id:6,grp:'g1',name:'綠建築專章檢討',unit:'設計部',start:8,end:20,status:'pending',ms:false,dateS:'2026-02-23',dateE:'2026-05-17'},
  {id:7,grp:'g1',name:'地質鑽探、測量',unit:'工務',start:2,end:8,status:'done',ms:false,dateS:'2026-01-12',dateE:'2026-02-22'},
  {id:8,grp:'g2',name:'公設室內設計',unit:'設計部',start:20,end:36,status:'pending',ms:false,dateS:'2026-05-18',dateE:'2026-09-06'},
  {id:9,grp:'g2',name:'燈光設計',unit:'設計部',start:20,end:32,status:'pending',ms:false,dateS:'2026-05-18',dateE:'2026-08-09'},
  {id:10,grp:'g3',name:'建照圖及都審報告書製作',unit:'Wallace',start:8,end:20,status:'active',ms:false,dateS:'2026-02-23',dateE:'2026-05-17'},
  {id:11,grp:'g3',name:'都市設計審議 .A',unit:'Wallace',start:12,end:24,status:'active',ms:false,dateS:'2026-03-23',dateE:'2026-06-14'},
  {id:12,grp:'g3',name:'都審核准 .A',unit:'Wallace',start:24,end:25,status:'pending',ms:true,dateS:'2026-06-15',dateE:'2026-06-21'},
  {id:13,grp:'g3',name:'建照審查 .A',unit:'法務',start:20,end:36,status:'pending',ms:false,dateS:'2026-05-18',dateE:'2026-09-06'},
  {id:14,grp:'g3',name:'建照核發 .A',unit:'法務',start:36,end:37,status:'pending',ms:true,dateS:'2026-09-07',dateE:'2026-09-13'},
  {id:15,grp:'g3',name:'拆除執照',unit:'法務',start:28,end:40,status:'pending',ms:false,dateS:'2026-07-13',dateE:'2026-10-04'},
  {id:16,grp:'g4',name:'施工圖繪製整理',unit:'設計部',start:24,end:48,status:'pending',ms:false,dateS:'2026-06-15',dateE:'2026-11-29'},
  {id:17,grp:'g5',name:'拆除工程',unit:'工務',start:40,end:52,status:'pending',ms:false,dateS:'2026-10-05',dateE:'2026-12-27'},
  {id:18,grp:'g5',name:'結構體施工',unit:'工務',start:48,end:84,status:'pending',ms:false,dateS:'2026-11-30',dateE:'2027-08-22'},
  {id:19,grp:'g5',name:'室內裝修',unit:'工務',start:80,end:112,status:'pending',ms:false,dateS:'2027-07-26',dateE:'2028-03-15'},
  {id:20,grp:'g5',name:'竣工交屋',unit:'Wallace',start:116,end:117,status:'pending',ms:true,dateS:'2028-04-13',dateE:'2028-04-19'},
];

let nextId = 100, dragState = null;
let notes = [''];
let editId = null;
let editDeps = [];
let showDepsFlag = true;

/* ════════════════════════════════════
   2. 系統防護機制 (安全策略)
   ════════════════════════════════════ */
setTimeout(console.log.bind(console, '%c版權所有 © JEN-YUAN HSUEH ARCHITECTS\n未經授權請勿盜用本排程系統原始碼。', 'color:#C53030; font-size:24px; font-weight:bold; background:#FFF2F2; padding:20px; border:2px solid #C53030; border-radius:8px;'), 1000);

document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', function(e) {
  if(e.keyCode === 123) { e.preventDefault(); return false; } // F12
  if((e.ctrlKey || e.metaKey) && e.keyCode === 83) { e.preventDefault(); return false; } // Ctrl+S
  if((e.ctrlKey || e.metaKey) && e.keyCode === 85) { e.preventDefault(); return false; } // Ctrl+U
  if((e.ctrlKey || e.metaKey) && e.keyCode === 80) { e.preventDefault(); return false; } // Ctrl+P
  if(e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; } // 檢查/主控台
});

/* ════════════════════════════════════
   3. 本地儲存 (LocalStorage) 管理
   ════════════════════════════════════ */
const LS_KEY = 'gantt_data_v1';
let saveTimeout;

function getState() {
  return {
    _copyright: "This schedule was generated by JEN-YUAN HSUEH ARCHITECTS system.",
    title: document.getElementById('projectTitle').value, docDate: document.getElementById('docDate').value,
    startYear: document.getElementById('cfgStartYear').value, numYears: document.getElementById('cfgYears').value,
    groups, tasks, notes, hiddenMonths, printRange, hiddenGrps, hiddenSts
  };
}

function applyState(s) {
  if(!s) return;
  if(s.title) document.getElementById('projectTitle').value = s.title;
  if(s.docDate) document.getElementById('docDate').value = s.docDate;
  if(s.startYear) document.getElementById('cfgStartYear').value = s.startYear;
  if(s.numYears) document.getElementById('cfgYears').value = s.numYears;
  if(s.groups) groups = s.groups; if(s.tasks) tasks = s.tasks; if(s.notes) notes = s.notes;
  if(s.hiddenMonths) Object.assign(hiddenMonths, s.hiddenMonths);
  if(s.printRange) Object.assign(printRange, s.printRange);
  if(s.hiddenGrps) Object.assign(hiddenGrps, s.hiddenGrps);
  if(s.hiddenSts) Object.assign(hiddenSts, s.hiddenSts);
  
  // 當匯入完成後，確保 UI 也同步更新
  if(typeof syncGrpSel === 'function') syncGrpSel();
  if(typeof rebuildAxis === 'function') rebuildAxis();
  if(typeof renderNotes === 'function') renderNotes();
}

function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => { try{ localStorage.setItem(LS_KEY, JSON.stringify(getState())); } catch(e){} }, 500);
}

// 供排程主控台在 window.onload 時呼叫
function initStorage() {
  const _saved = localStorage.getItem(LS_KEY);
  if(_saved){
    try{
      const _s = JSON.parse(_saved);
      applyState(_s);
    } catch(e){}
  }
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(getState(), null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  const title = document.getElementById('projectTitle').value.replace(/\s+/g,'_').replace(/[^\w\u4e00-\u9fff]/g,'') || 'gantt';
  a.href = URL.createObjectURL(blob);
  a.download = `${title}_${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(a.href);
}

function importJSON(evt){
  const file = evt.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try{ const s = JSON.parse(e.target.result); applyState(s); autoSave(); alert('✓ 載入成功'); }
    catch(err){ alert('載入失敗：JSON 格式有誤'); }
  };
  reader.readAsText(file); evt.target.value = '';
}

function clearStorage(){
  if(!confirm('確定要清除瀏覽器暫存的資料嗎？\n（目前畫面上的內容不受影響，下次開啟才會回到預設值）')) return;
  try{ localStorage.removeItem(LS_KEY); alert('✓ 暫存已清除。下次重新開啟頁面將回到預設值。'); }
  catch(e){ alert('清除失敗：' + e.message); }
}