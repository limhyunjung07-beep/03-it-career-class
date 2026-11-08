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
  const t=TIMETABLE[parse(ds).getDay()]||{};
  const classes=Object.keys(t).map(Number).sort((a,b)=>a-b).filter(p=>t[p]!=='x').map(p=>{
    const name=t[p],grade=+((name.match(/\d/)||[1])[0]);
    const pl=plans.find(x=>x.date===ds&&x.p===p&&name.startsWith(x.c));
    return {p,start:PERIODS[p-1],name,blocked:blocker(p,grade),plan:pl?CLASS_PLAN.title+' '+pl.name+(pl.done?' ✓':''):''};
  });
  /* 시간표와 다른 교시로 옮긴 반별 수업도 수업에 포함 */
  plans.filter(x=>x.date===ds&&!classes.some(k=>k.p===x.p)).forEach(x=>classes.push({p:x.p,start:PERIODS[x.p-1],name:x.c+'진로',blocked:'',plan:CLASS_PLAN.title+' '+x.name+(x.done?' ✓':''),moved:true}));
  classes.sort((a,b)=>a.p-b.p);
  const events=evs.filter(e=>onDay(e,ds)).map(e=>({key:e.fid||e.id,title:e.title,time:e.time||'',cat:e.cat,memo:e.memo||''}));
  return {date:ds,holiday:HOL[ds.slice(5)]||'',classes,events};
}
