/* 일정관리 데이터: schedule.html과 첫 화면(index.html)이 함께 써요.
   일정·시간표를 고칠 때는 이 파일만 고치면 돼요. */
/* ▼ 분류: 이름과 색을 바꿀 수 있어요. */
const CATS={
  class:{name:'수업',c:'var(--orange)'},
  school:{name:'학교일정',c:'var(--blue)'},
  counsel:{name:'상담일정',c:'var(--green)'},
  personal:{name:'개인일정',c:'var(--purple)'},
  work:{name:'업무',c:'var(--navy)'},
  etc:{name:'기타',c:'var(--gray)'}
};
/* ▼ 고정 일정: 모든 컴퓨터에서 똑같이 보여요. 줄을 복사해서 고치면 추가돼요.
   start·end = 'YYYY-MM-DD', end는 여러 날일 때만 */
const FIXED=[
  {title:'진로설계 제작계획서 제출 확인',start:'2026-11-09',end:'2026-11-20',cat:'work',memo:'꿈it(잇)다 탐색 후 반별 제출 여부 점검'},
  {title:'진로설계 담임 1차 채점·우수작 취합',start:'2026-12-07',end:'2026-12-11',cat:'work'},
  {title:'진로설계 2차 채점·수상자 확정',start:'2026-12-14',end:'2026-12-18',cat:'work',memo:'진로상담부·학년부 심사, 20% 이내'},
  /* off:true = 이날 내 수업 못 함(출장·휴업) / last:{학년:교시} = 그 교시 후 하교 → 반별 일정과 겹치면 경고 */
  {title:'3학년 2차 지필평가',start:'2026-11-13',cat:'school',memo:'1·2·3학년 모두 3교시 후 하교',last:{1:3,2:3,3:3}},
  {title:'3학년 2차 지필평가',start:'2026-11-16',cat:'school',memo:'1학년 6교시 · 2학년 6교시 · 3학년 3교시 후 하교',last:{1:6,2:6,3:3}},
  {title:'3학년 2차 지필평가',start:'2026-11-17',cat:'school',memo:'1·2·3학년 모두 3교시 후 하교',last:{1:3,2:3,3:3}},
  {title:'전학년 4교시 후 하교',start:'2026-11-18',cat:'school',last:{1:4,2:4,3:4}},
  {title:'수능 (재량휴업)',start:'2026-11-19',cat:'school',off:true},
  {title:'출장: 진로연계교육 발표대회 심사',start:'2026-11-20',end:'2026-11-21',time:'종일',cat:'work',memo:'한경대 평택 인학관',off:true},
  {title:'교직원 자율동아리',start:'2026-11-25',cat:'school'},
  {title:'출장',start:'2026-11-26',cat:'work',off:true},
  {title:'고입 원서접수 (평준화)',start:'2026-12-04',end:'2026-12-10',time:'마감 12. 10. 17:00',cat:'school',memo:'3학년'},
  {title:'고입 배정대상자 발표',start:'2027-01-06',cat:'school',memo:'3학년'},
  {title:'고입 배정 학교 발표 (예정)',start:'2027-01-22',cat:'school',memo:'3학년'},
  {title:'고입 합격자 등록 기간',start:'2027-01-25',end:'2027-01-27',cat:'school',memo:'3학년'}
];

/* ===== 일정 고치기·지우기 (첫 화면과 일정관리 페이지가 함께 써요) =====
   고정 일정을 고치거나 지우면 이 브라우저에 따로 저장돼 위 목록 위에 덮어써요. '원래대로'로 되돌릴 수 있어요. */
const FIXED_BASE=FIXED.map(e=>({...e,fid:'f:'+e.start+':'+e.title}));
const SCHED={
  load(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  mine(){return this.load('schedule:events',[])},
  edits(){return this.load('schedule:fixedEdits',{})},
  refresh(){const ed=this.edits();FIXED.length=0;
    FIXED_BASE.forEach(b=>{const o=ed[b.fid];if(o&&o.deleted)return;FIXED.push(o?{...b,...o,fid:b.fid,edited:true}:{...b})})},
  find(key){return FIXED.find(e=>e.fid===key)||this.mine().find(e=>e.id===key)||null},
  saveEvent(ev,data){
    if(ev&&ev.fid){const ed=this.edits();ed[ev.fid]=data;this.save('schedule:fixedEdits',ed)}
    else{const m=this.mine(),x=ev&&m.find(y=>y.id===ev.id);
      if(x)Object.assign(x,data);else m.push({id:'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),...data});
      this.save('schedule:events',m)}
    this.refresh();
  },
  deleteEvent(ev){
    if(ev.fid){const ed=this.edits();ed[ev.fid]={deleted:true};this.save('schedule:fixedEdits',ed)}
    else this.save('schedule:events',this.mine().filter(y=>y.id!==ev.id));
    this.refresh();
  },
  resetFixed(fid){const ed=this.edits();delete ed[fid];this.save('schedule:fixedEdits',ed);this.refresh()}
};
SCHED.refresh();


/* ▼ 내 시간표: 요일(월~금)마다 교시 번호: '수업 이름'. 'x' = 수업 불가(비움 표시) */
const PERIODS=['09:15','10:10','11:05','12:00','13:40','14:35','15:30']; /* 1~7교시 시작 시각, 수업 45분 */
const TIMETABLE={
  1:{2:'107진로',4:'106진로'},
  2:{1:'x',3:'103진로',5:'101진로',6:'104진로'},
  3:{3:'108진로'},
  4:{1:'301창체',2:'102진로',4:'302창체',5:'x',6:'x',7:'x'},
  5:{4:'105진로'}
};
/* ▼ 반별 수업 계획: 반 코드는 시간표의 '101진로'에서 앞 숫자. week = 그 활동을 하는 주의 월요일
   처음 일정은 시간표에서 그 반의 진로 시간을 찾아 자동으로 잡혀요(달력·백업에 함께 반영). */
const CLASS_PLAN={
  key:'career-design',title:'진로설계',
  classes:['101','102','103','104','105','106','107','108'],
  steps:[
    {k:'plan',name:'제작계획서',week:'2026-11-09'},
    {k:'r1',name:'대회 1차시',week:'2026-11-23'},
    {k:'r2',name:'대회 2차시',week:'2026-11-30'}
  ]
};
/* 양력 고정 공휴일 (설날·추석 등 음력 공휴일은 직접 추가) */
const HOL={'01-01':'신정','03-01':'삼일절','05-05':'어린이날','06-06':'현충일','08-15':'광복절','10-03':'개천절','10-09':'한글날','12-25':'성탄절'};

/* ===== 수업(시간표) 고치기 =====
   매주 바꾸기 → 'schedule:ttEdits' {요일:{교시:'수업 이름' 또는 ''(수업 없음)}}
   이 날만 바꾸기 → 'schedule:classDay' {날짜:{교시:{name, memo, cancel}}} */
const TIMETABLE_BASE=JSON.parse(JSON.stringify(TIMETABLE));
Object.assign(SCHED,{
  ttEdits(){return this.load('schedule:ttEdits',{})},
  dayEdits(){return this.load('schedule:classDay',{})},
  topics(){return this.load('schedule:topics',{})},
  setTopic(ds,p,t){const tp=this.topics();tp[ds]=tp[ds]||{};if(t)tp[ds][p]=t;else delete tp[ds][p];if(!Object.keys(tp[ds]).length)delete tp[ds];this.save('schedule:topics',tp)},
  refreshTT(){const ed=this.ttEdits();
    for(const k of Object.keys(TIMETABLE))delete TIMETABLE[k];
    for(const d of [1,2,3,4,5,6,0]){const row={...(TIMETABLE_BASE[d]||{})};
      for(const [p,v] of Object.entries(ed[d]||{})){if(v==='')delete row[p];else row[p]=v}
      if(Object.keys(row).length)TIMETABLE[d]=row}},
  /* 그날 실제 시간표: {교시:{name, memo, cancel, dayEdited, weekEdited}} */
  dayTable(ds){const [y,m,d]=ds.split('-').map(Number),dow=new Date(y,m-1,d).getDay();
    const out={},base=TIMETABLE[dow]||{},we=(this.ttEdits()[dow])||{},de=this.dayEdits()[ds]||{};
    for(const p in base)out[p]={name:base[p],memo:'',cancel:false,weekEdited:p in we};
    for(const p in we)if(we[p]===''&&!out[p])out[p]=null;
    for(const [p,o] of Object.entries(de)){
      if(o.name==='')delete out[p];
      else out[p]={name:o.name??(out[p]&&out[p].name)??'',memo:o.memo||'',cancel:!!o.cancel,dayEdited:true,weekEdited:!!(out[p]&&out[p].weekEdited)}}
    for(const p in out)if(!out[p]||!out[p].name)delete out[p];
    const tp=this.topics()[ds]||{};for(const p in out)out[p].topic=tp[p]||'';
    return out},
  saveClass(ds,p,o,weekly){
    if(weekly){const [y,m,d]=ds.split('-').map(Number),dow=new Date(y,m-1,d).getDay();
      const ed=this.ttEdits();ed[dow]=ed[dow]||{};
      if((TIMETABLE_BASE[dow]||{})[p]===o.name||(!(TIMETABLE_BASE[dow]||{})[p]&&o.name===''))delete ed[dow][p];else ed[dow][p]=o.name;
      this.save('schedule:ttEdits',ed);this.refreshTT();this.clearClassDay(ds,p)}
    else{const de=this.dayEdits();de[ds]=de[ds]||{};de[ds][p]={name:o.name,memo:o.memo,cancel:o.cancel};this.save('schedule:classDay',de)}},
  clearClassDay(ds,p){const de=this.dayEdits();if(de[ds]){delete de[ds][p];if(!Object.keys(de[ds]).length)delete de[ds]}this.save('schedule:classDay',de)},
  resetWeekly(ds,p){const [y,m,d]=ds.split('-').map(Number),dow=new Date(y,m-1,d).getDay(),ed=this.ttEdits();
    if(ed[dow]){delete ed[dow][p];if(!Object.keys(ed[dow]).length)delete ed[dow]}this.save('schedule:ttEdits',ed);this.refreshTT()}
});
SCHED.refreshTT();

/* 수업 고치기 창 (첫 화면·일정관리 페이지 공용). onDone은 저장 뒤 화면을 다시 그리는 함수 */
function openClassEditor(ds,p,onDone){
  let dlg=document.getElementById('clsDlg');
  if(!dlg){
    const st=document.createElement('style');
    st.textContent='#clsDlg{border:0;border-radius:20px;padding:0;width:min(420px,calc(100vw - 24px));box-shadow:0 20px 50px rgba(29,43,83,.3);font-family:inherit}#clsDlg::backdrop{background:rgba(29,43,83,.45)}#clsDlg form{padding:18px}#clsDlg h3{margin:0 0 10px;font-size:20px;color:#1d2b53}#clsDlg h3 small{display:block;font-size:12px;color:#5b6275;font-weight:500;margin-top:2px}#clsDlg label.f{display:grid;gap:3px;margin-bottom:9px;font-size:13px;font-weight:700;color:#5b6275}#clsDlg input[type=text]{font:inherit;font-size:15px;border:1.5px solid #e3e6ee;border-radius:10px;padding:7px 10px;width:100%;box-sizing:border-box}#clsDlg .ck{display:flex;align-items:center;gap:7px;font-weight:700;font-size:14px;margin:4px 0 8px;cursor:pointer}#clsDlg .ck input{width:18px;height:18px;accent-color:#e63946}#clsDlg .ck.tw{font-size:13px;font-weight:500;color:#5b6275;margin-top:-4px}#clsDlg .ck.tw input{accent-color:#1f9d74;width:16px;height:16px}#clsDlg input[name=topic]{border-color:#bfe6d6;background:#f1faf6}#clsDlg .rg{display:flex;gap:6px;margin:4px 0 10px}#clsDlg .rg label{flex:1;border:1.5px solid #e3e6ee;border-radius:10px;padding:7px;text-align:center;font-size:14px;font-weight:700;cursor:pointer;color:#5b6275}#clsDlg .rg input{display:none}#clsDlg .rg label:has(input:checked){border-color:#1f9d74;background:#e3f5ee;color:#1f9d74}#clsDlg .bt{display:flex;gap:6px;flex-wrap:wrap}#clsDlg .bt .sp{flex:1}#clsDlg button{font:inherit;font-size:14px;font-weight:700;border-radius:999px;padding:6px 13px;border:1.5px solid #e3e6ee;background:#fff;color:#1d2b53;cursor:pointer}#clsDlg button.main{background:#1f9d74;border-color:#1f9d74;color:#fff}#clsDlg .hint{font-size:12px;color:#5b6275;margin:8px 0 0}';
    document.head.appendChild(st);
    dlg=document.createElement('dialog');dlg.id='clsDlg';
    dlg.innerHTML='<form><h3 id="clsT"></h3>'
      +'<label class="f">수업 주제<input type="text" name="topic" maxlength="60" placeholder="예) 진로설계 제작계획서 쓰기"></label>'
      +'<label class="ck tw"><input type="checkbox" name="topicWeek">이번 주 같은 학년 수업에도 같은 주제 넣기</label>'
      +'<label class="f">수업 이름 (비우면 이 시간 수업 없음)<input type="text" name="name" maxlength="20" list="clsNames" placeholder="예) 107진로"></label><datalist id="clsNames"></datalist>'
      +'<label class="f">메모<input type="text" name="memo" maxlength="60" placeholder="예) 담임 요청으로 교체, 보강"></label>'
      +'<label class="ck"><input type="checkbox" name="cancel">이 날 휴강 (수업 없음 표시)</label>'
      +'<div class="rg"><label><input type="radio" name="scope" value="day" checked>이 날만</label><label><input type="radio" name="scope" value="week">매주 이 시간</label></div>'
      +'<div class="bt"><button type="button" id="clsDay">이 날 원래대로</button><button type="button" id="clsWeek">매주 원래대로</button><span class="sp"></span><button type="button" id="clsCancel">취소</button><button type="submit" class="main">저장</button></div>'
      +'<p class="hint">주제는 그 날 수업에만 붙어요. 매주 이 시간을 고르면 시간표 자체가 바뀌어요. 반별 진로설계 일정은 일정관리의 반별 표에서 고쳐요.</p></form>';
    document.body.appendChild(dlg);
    const f=dlg.querySelector('form');
    f.addEventListener('change',e=>{if(e.target.name==='scope'){const w=f.querySelector('[name=scope]:checked').value==='week';f.cancel.disabled=w;f.memo.disabled=w;if(w)f.cancel.checked=false}});
    dlg.querySelector('#clsCancel').onclick=()=>dlg.close();
  }
  const f=dlg.querySelector('form'),[y,m,d]=ds.split('-').map(Number),dt=new Date(y,m-1,d);
  const cur=SCHED.dayTable(ds)[p]||{name:'',memo:'',cancel:false};
  const names=new Set();Object.values(TIMETABLE_BASE).forEach(r=>Object.values(r).forEach(v=>{if(v!=='x')names.add(v)}));
  dlg.querySelector('#clsNames').innerHTML=[...names].sort().map(v=>'<option value="'+v+'">').join('');
  dlg.querySelector('#clsT').innerHTML=(m)+'. '+d+'.('+'일월화수목금토'[dt.getDay()]+') '+p+'교시 수업<small>'+PERIODS[p-1]+' 시작'+(cur.dayEdited?' · 이 날 바꿈':'')+(cur.weekEdited?' · 매주 바꿈':'')+'</small>';
  f.topic.value=cur.topic||'';f.topicWeek.checked=false;
  f.name.value=cur.name==='x'?'':cur.name;f.memo.value=cur.memo||'';f.cancel.checked=!!cur.cancel;
  f.querySelector('[name=scope][value=day]').checked=true;f.cancel.disabled=false;f.memo.disabled=false;
  dlg.querySelector('#clsDay').hidden=!cur.dayEdited;dlg.querySelector('#clsWeek').hidden=!cur.weekEdited;
  f.onsubmit=e=>{e.preventDefault();const w=f.querySelector('[name=scope]:checked').value==='week';
    const name=f.name.value.trim(),memo=f.memo.value.trim(),cancel=f.cancel.checked,topic=f.topic.value.trim();
    const same=name===(cur.name==='x'?'':cur.name)&&(w||(memo===(cur.memo||'')&&cancel===!!cur.cancel));
    if(!same)SCHED.saveClass(ds,p,{name,memo,cancel},w);
    /* 주제 */
    SCHED.setTopic(ds,p,topic);
    if(f.topicWeek.checked){const g=((name||cur.name||'').match(/\d/)||[''])[0];
      const mon=new Date(y,m-1,d);mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
      for(let i=0;i<5;i++){const x=new Date(mon);x.setDate(mon.getDate()+i);
        const xs=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
        const tb=SCHED.dayTable(xs);for(const q in tb){const n=tb[q].name;if(n!=='x'&&g&&(n.match(/\d/)||[''])[0]===g)SCHED.setTopic(xs,+q,topic)}}}
    dlg.close();onDone&&onDone()};
  dlg.querySelector('#clsDay').onclick=()=>{SCHED.clearClassDay(ds,p);dlg.close();onDone&&onDone()};
  dlg.querySelector('#clsWeek').onclick=()=>{SCHED.resetWeekly(ds,p);dlg.close();onDone&&onDone()};
  dlg.showModal();f.name.focus();
}

/* ===== 하루 요약 (첫 화면 일정관리 카드에서 사용) ===== */
function scheduleDay(ds){
  const pad=n=>String(n).padStart(2,'0');
  const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
  const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
  const onDay=(e,d)=>d>=e.start&&d<=(e.end||e.start);
  const mine=load('schedule:events',[]),cp=load('schedule:plan:'+CLASS_PLAN.key,{});
  const evs=FIXED.concat(mine);
  const blocker=(p,grade)=>{
    if(HOL[ds.slice(5)])return HOL[ds.slice(5)];
    for(const e of evs){if(!onDay(e,ds))continue;if(e.off)return e.title;
      if(e.last&&e.last[grade]&&p>e.last[grade])return grade+'학년 '+e.last[grade]+'교시 후 하교'}
    return '';
  };
  /* 반별 수업 */
  const plans=[];
  CLASS_PLAN.classes.forEach(c=>CLASS_PLAN.steps.forEach(st=>{
    let def={date:st.week,p:1};
    outer:for(const d of [1,2,3,4,5]){const t=TIMETABLE[d]||{};for(const p in t){if(t[p].startsWith(c)){const x=parse(st.week);x.setDate(x.getDate()+d-1);def={date:iso(x),p:+p};break outer}}}
    const o=(cp[c]||{})[st.k]||{};
    plans.push({c,name:st.name,date:o.date||def.date,p:o.p||def.p,done:!!o.done});
  }));
  const t=SCHED.dayTable(ds);
  const classes=Object.keys(t).map(Number).sort((a,b)=>a-b).filter(p=>t[p].name!=='x').map(p=>{
    const o=t[p],name=o.name,grade=+((name.match(/\d/)||[1])[0]);
    const pl=plans.find(x=>x.date===ds&&x.p===p&&name.startsWith(x.c));
    return {p,start:PERIODS[p-1],name,memo:o.memo,topic:o.topic||'',edited:!!(o.dayEdited||o.weekEdited),blocked:o.cancel?'휴강'+(o.memo?': '+o.memo:''):blocker(p,grade),plan:pl?CLASS_PLAN.title+' '+pl.name+(pl.done?' ✓':''):''};
  });
  /* 시간표와 다른 교시로 옮긴 반별 수업도 수업에 포함 */
  plans.filter(x=>x.date===ds&&!classes.some(k=>k.p===x.p)).forEach(x=>classes.push({p:x.p,start:PERIODS[x.p-1],name:x.c+'진로',blocked:'',plan:CLASS_PLAN.title+' '+x.name+(x.done?' ✓':''),moved:true}));
  classes.sort((a,b)=>a.p-b.p);
  const events=evs.filter(e=>onDay(e,ds)).map(e=>({key:e.fid||e.id,title:e.title,time:e.time||'',cat:e.cat,memo:e.memo||''}));
  return {date:ds,holiday:HOL[ds.slice(5)]||'',classes,events};
}
