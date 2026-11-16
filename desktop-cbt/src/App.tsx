import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, BookOpenCheck, Check, CheckCircle2, ChevronRight, Clock3, CloudUpload, FileDown, Flag, HardDrive, Laptop, LockKeyhole, LogOut, RefreshCw, ShieldCheck, Wifi, WifiOff } from "lucide-react";

type View = "overview"|"supervisor"|"candidate"|"taking"|"result"|"results"|"diagnostics";
const mins = (n:number) => Math.max(0,Math.floor(n/60)).toString().padStart(2,"0")+":"+Math.max(0,n%60).toString().padStart(2,"0");

export default function App() {
  const [view,setView] = useState<View>("overview");
  const [status,setStatus] = useState<any>(null);
  const [diagnostics,setDiagnostics] = useState<any>(null);
  const [queue,setQueue] = useState<any>({pending:0,items:[]});
  const [packages,setPackages] = useState<ExamPackage[]>([]);
  const [selected,setSelected] = useState<ExamPackage|null>(null);
  const [activeExamId,setActiveExamId] = useState("");
  const [candidateName,setCandidateName] = useState("");
  const [admission,setAdmission] = useState("");
  const [session,setSession] = useState<ExamSession|null>(null);
  const [result,setResult] = useState<ExamResult|null>(null);
  const [questionIndex,setQuestionIndex] = useState(0);
  const [flaggedQuestions,setFlaggedQuestions] = useState<string[]>([]);
  const [remaining,setRemaining] = useState(0);
  const [saving,setSaving] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [pin,setPin] = useState("");
  const [pinConfigured,setPinConfigured] = useState(false);
  const [supervisorUnlocked,setSupervisorUnlocked] = useState(false);
  const [results,setResults] = useState<any[]>([]);
  const [busy,setBusy] = useState(false);
  const [staffAuth,setStaffAuth] = useState<any>({signedIn:false});
  const [staffEmail,setStaffEmail] = useState("");
  const [staffPassword,setStaffPassword] = useState("");
  const [syncBusy,setSyncBusy] = useState(false);
  const submitLock = useRef(false);

  const refresh = useCallback(async () => {
    const [s,p,q,d,a,auth] = await Promise.all([window.cbt.getStatus(),window.cbt.listPackages(),window.cbt.getQueue(),window.cbt.getDiagnostics(),window.cbt.getActiveExam(),window.cbt.getStaffAuthStatus()]);
    setStatus({...s,online:navigator.onLine});setPackages(p);setQueue(q);setDiagnostics(d);setActiveExamId(a?.examId||"");setStaffAuth(auth);
    const pinState=await window.cbt.supervisorPinStatus();setPinConfigured(!!pinState.configured);
  },[]);
  useEffect(()=>{refresh().catch(e=>setError(e.message||"Unable to read the local CBT database."));},[refresh]);
  useEffect(()=>{
    const update=()=>setStatus((s:any)=>s?{...s,online:navigator.onLine}:s);
    window.addEventListener("online",update);window.addEventListener("offline",update);
    return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};
  },[]);

  const selectedQuestion = session?.questions[questionIndex];
  const answeredCount = useMemo(()=>session?Object.values(session.answers).filter(Boolean).length:0,[session]);
  const assignedExam = packages.find(p=>p.exam_id===activeExamId) || null;

  const chooseExam = async (exam:ExamPackage) => {
    setError("");setSelected(exam);
    try { const p=await window.cbt.getExamPreview(exam.exam_id);setSelected({...exam,...p}); }
    catch(e:any){setError(e.message||"Could not open this exam.");}
  };
  const begin = async () => {
    if(!selected) return;
    setBusy(true);setError("");
    try {
      const found=await window.cbt.lookupCandidate(selected.exam_id,admission.trim());
      if(found.name.toLowerCase()!==candidateName.trim().toLowerCase()) throw new Error("The name does not match this admission number. Ask the supervisor to verify your details.");
      submitLock.current=false;
      const s=await window.cbt.startAttempt(selected.exam_id,admission.trim(),candidateName.trim());
      setSession(s);setQuestionIndex(0);setFlaggedQuestions([]);setRemaining(Math.max(0,Math.ceil((Date.parse(s.attempt.deadlineAt)-Date.now())/1000)));
      setView("taking");setNotice("Your answers are saved on this computer as you work.");
    } catch(e:any){setError(e.message||"Unable to start this examination.");}
    finally{setBusy(false);}
  };
  const save = async (optionId:string) => {
    if(!session||!selectedQuestion||saving) return;
    setSaving(true);setError("");
    try {
      await window.cbt.saveAnswer(session.attempt.id,admission.trim(),selectedQuestion.id,optionId);
      setSession(s=>s?{...s,answers:{...s.answers,[selectedQuestion.id]:optionId}}:s);
    } catch(e:any){setError(e.message||"Answer could not be saved. Do not close the app; contact the supervisor.");}
    finally{setSaving(false);}
  };
  const submit = useCallback(async () => {
    if(!session||submitLock.current) return;
    submitLock.current=true;setSubmitting(true);setError("");
    try {
      const r=await window.cbt.submitAttempt(session.attempt.id,admission.trim());
      setResult(r);setView("result");setSession(null);
    } catch(e:any){setError(e.message||"Submission failed. Contact the supervisor before closing the app.");submitLock.current=false;}
    finally{setSubmitting(false);}
  },[session,admission]);
  useEffect(()=>{
    if(view!=="taking"||!session) return;
    const tick=()=>setRemaining(Math.max(0,Math.ceil((Date.parse(session.attempt.deadlineAt)-Date.now())/1000)));
    tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer);
  },[view,session]);
  useEffect(()=>{if(view==="taking"&&remaining===0&&session&&!submitLock.current) void submit();},[view,remaining,session,submit]);

  const importPackage = async () => {
    setBusy(true);setError("");
    try {const r=await window.cbt.importPackage();if(r.error)setError(r.error);else if(r.imported){setNotice("Exam package verified and imported.");await refresh();}}
    catch(e:any){setError(e.message||"Package import failed.");}finally{setBusy(false);}
  };
  const supervisorUnlock = async () => {
    setError("");
    try {
      if(!pinConfigured) await window.cbt.setSupervisorPin(pin);
      else await window.cbt.unlockSupervisor(pin);
      setSupervisorUnlocked(true);setPin("");setResults(await window.cbt.getResults());
      setView("results");
    } catch(e:any){setError(e.message||"Supervisor verification failed.");}
  };
  const lockSupervisor = async () => {await window.cbt.lockSupervisor();setSupervisorUnlocked(false);setResults([]);setView("overview");};
  const setActive = async () => {
    if(!selected) return;
    try {await window.cbt.setActiveExam(selected.exam_id);setActiveExamId(selected.exam_id);setNotice("Supervisor selected "+selected.title+" for this station.");}
    catch(e:any){setError(e.message||"Could not assign this exam to the station.");}
  };
  const refreshResults = async () => {try{setResults(await window.cbt.getResults());}catch(e:any){setError(e.message||"Unable to load results.");}};
  const diagnosticRefresh = async () => {try{const d=await window.cbt.getDiagnostics();const r=await window.cbt.recover();setDiagnostics(d);setNotice("Recovery check complete: "+r.resumable+" resumable, "+r.expired+" expired.");await refresh();}catch(e:any){setError(e.message||"Diagnostics failed.");}};
  const signInForSync = async () => {setBusy(true);setError("");try{const auth=await window.cbt.signInStaff(staffEmail,staffPassword);setStaffAuth(auth);setStaffPassword("");setNotice("Staff sync session opened for "+auth.email+".");}catch(e:any){setError(e.message||"Staff sign-in failed.");}finally{setBusy(false);}};
  const signOutSync = async () => {await window.cbt.signOutStaff();setStaffAuth({signedIn:false});setNotice("Staff sync session closed.");};
  const runSync = async () => {setSyncBusy(true);setError("");try{const r=await window.cbt.syncAttempts();setNotice("Sync complete: "+r.synced+" accepted, "+r.failed+" failed, "+r.pending+" still pending.");await refresh();}catch(e:any){setError(e.message||"Sync failed. Local attempts have been retained.");}finally{setSyncBusy(false);}};

  if(view==="taking"&&session&&selectedQuestion) return <main className="exam-room">
    <header className="exam-top"><div className="school-brand"><span className="brand-icon">i</span><div><b>IMAGEMAKERS CBT</b><small>{session.exam.className} · {session.exam.armName} · {session.exam.subject}</small></div></div><div className={"timer "+(remaining<60?"urgent":remaining<300?"warning":"")}><Clock3 size={18}/><span>{mins(remaining)}</span><small>TIME LEFT</small></div></header>
    <section className="exam-heading"><div><span className="eyebrow">SUPERVISED OBJECTIVE EXAMINATION</span><h1>{session.exam.title}</h1><p>{session.exam.instructions}</p></div><div className="candidate-chip"><b>{candidateName}</b><span>{admission}</span></div></section>
    <div className="progress-track" aria-label={answeredCount+" of "+session.questions.length+" questions answered"}><span style={{width:(answeredCount/session.questions.length*100)+"%"}}/></div>
    <section className="question-layout"><aside className="question-map"><div className="map-title"><b>Questions</b><span>{answeredCount}/{session.questions.length} answered</span></div><div className="question-grid">{session.questions.map((q,i)=><button key={q.id} className={(i===questionIndex?"current ":"")+(session!.answers[q.id]?"answered ":"")+(flaggedQuestions.includes(q.id)?"flagged":"")} onClick={()=>setQuestionIndex(i)} aria-label={"Question "+(i+1)+(session!.answers[q.id]?", answered":"")+(flaggedQuestions.includes(q.id)?", flagged for review":"")}>{i+1}</button>)}</div><div className="map-legend"><span><i className="dot current-dot"/> Current</span><span><i className="dot answered-dot"/> Answered</span><span><i className="dot flagged-dot"/> Review</span></div></aside>
      <article className="question-card" key={selectedQuestion.id}><div className="question-meta"><span>QUESTION {questionIndex+1} OF {session.questions.length}</span><span>{selectedQuestion.points} mark{selectedQuestion.points===1?"":"s"}</span></div><h2>{selectedQuestion.prompt}</h2><div className="option-list">{selectedQuestion.options.map((o,i)=><button key={o.id} className={"option "+(session!.answers[selectedQuestion.id]===o.id?"chosen":"")} onClick={()=>save(o.id)} disabled={saving||submitting}><span className="option-letter">{String.fromCharCode(65+i)}</span><span>{o.text}</span>{session!.answers[selectedQuestion.id]===o.id&&<Check size={18}/>}</button>)}</div><div className="question-footer"><button className="secondary" onClick={()=>setQuestionIndex(i=>Math.max(0,i-1))} disabled={questionIndex===0}><ArrowLeft size={16}/> Previous</button><span>{saving?"Saving answer…":"Answers save automatically"}</span><button className={"flag-button "+(flaggedQuestions.includes(selectedQuestion.id)?"flagged":"")} onClick={()=>setFlaggedQuestions(current=>current.includes(selectedQuestion.id)?current.filter(id=>id!==selectedQuestion.id):[...current,selectedQuestion.id])}><Flag size={14}/>{flaggedQuestions.includes(selectedQuestion.id)?"Flagged":"Flag for review"}</button>{questionIndex<session.questions.length-1?<button className="primary" onClick={()=>setQuestionIndex(i=>Math.min(session!.questions.length-1,i+1))}>Next <ArrowRight size={16}/></button>:<button className="submit" onClick={()=>void submit()} disabled={submitting}>{submitting?"Submitting…":"Submit examination"}</button>}</div>{error&&<div className="error">{error}</div>}</article>
    </section><footer className="exam-footer"><span><ShieldCheck size={14}/> Your answers are stored locally and linked to your admission number.</span><span>Do not close this application during the examination.</span></footer>
  </main>;

  return <main className="app-shell">
    <aside className="rail"><div className="brand-mark">i</div><div className="rail-line"/><button className={view==="overview"?"active":""} title="Overview" onClick={()=>setView("overview")}><Laptop/></button><button className={view==="supervisor"?"active":""} title="Supervisor" onClick={()=>{setView("supervisor");setSelected(null);}}><BookOpenCheck/></button><button className={view==="diagnostics"?"active":""} title="Diagnostics" onClick={()=>setView("diagnostics")}><Activity/></button><button className={view==="results"?"active":""} title="Results" onClick={()=>{setView("results");setError("");}}><ShieldCheck/></button></aside>
    <section className="workspace"><header className="topbar"><div className="crumb"><span>IMAGEMAKERS</span><ChevronRight size={13}/><b>OFFLINE CBT PLATFORM</b></div><div className="top-actions"><span className="build-label">WINDOWS EXAM STATION · v{status?.version||"0.1.0"}</span><span className={"connection "+(status?.online?"online":"offline")}>{status?.online?<Wifi size={14}/>:<WifiOff size={14}/>} {status?.online?"Online":"Offline ready"}</span></div></header>
      <div className="content">
        {view==="overview"&&<><section className="hero"><div><div className="eyebrow"><span className="pulse-dot"/> OFFLINE EXAM ENVIRONMENT</div><h1>Focused minds.<br/><em>Fair examinations.</em></h1><p>A dedicated examination platform for Imagemakers. Staff select the exam; each candidate signs in with their admission number and completes their own timed assessment.</p><div className="hero-meta"><span><ShieldCheck size={15}/> Candidate-specific sessions</span><span><HardDrive size={15}/> Local-first storage</span></div></div><div className="hero-art"><div className="orbit"/><div className="orb-core"><BookOpenCheck size={48}/></div><div className="float-card">AUTO-SAVE <CheckCircle2 size={14}/></div></div></section>
          <div className="section-heading"><div><span className="eyebrow muted">EXAM ROOM</span><h2>Station overview</h2></div><button className="subtle-button" onClick={()=>void refresh()}><RefreshCw size={14}/> Refresh</button></div>
          <section className="stat-grid"><article className="stat-card"><HardDrive/><span>LOCAL DATABASE</span><strong>{status?.database==="ready"?"Healthy":"Needs attention"}</strong><small>{diagnostics?.integrity||"Checking integrity"}</small></article><article className="stat-card"><BookOpenCheck/><span>AVAILABLE EXAMS</span><strong>{packages.length}</strong><small>Including demo assessments</small></article><article className="stat-card"><CloudUpload/><span>SYNC QUEUE</span><strong>{queue.pending||0} pending</strong><small>Awaiting authenticated sync</small></article><article className="stat-card"><Activity/><span>DEVICE</span><strong>{status?.platform==="win32"?"Windows":"Desktop"}</strong><small>SQLite local storage</small></article></section>
          <section className="panel"><div className="panel-head"><div><span className="eyebrow muted">SUPERVISOR ASSIGNED</span><h2>{assignedExam?"Station exam selected":"No exam selected yet"}</h2></div><button className="subtle-button" onClick={()=>setView("supervisor")}>Supervisor controls <ChevronRight size={14}/></button></div>{assignedExam?<div className="active-exam"><div><b>{assignedExam.title}</b><span>{assignedExam.class_name||assignedExam.class_id} · {assignedExam.arm_name||"All arms"} · {assignedExam.subject} · {Math.round(assignedExam.duration_seconds/60)} minutes</span></div><button className="primary" onClick={()=>{void chooseExam(assignedExam).then(()=>setView("candidate"));}}>Candidate sign in <ArrowRight size={16}/></button></div>:<div className="empty-state"><BookOpenCheck size={30}/><b>Waiting for the supervisor</b><p>Choose an exam from the supervisor controls before candidates begin. Demo exams are already available for Primary 1–3, Ruby and Sapphire, and three subjects.</p><button className="primary" onClick={()=>setView("supervisor")}>Open supervisor controls</button></div>}</section>
          <div className="notice-row"><ShieldCheck size={15}/><span>{notice||"DEMO EXAMS are practice data only. Do not use demo candidates for real school records."}</span></div>
        </>}
        {view==="supervisor"&&<section className="panel page-panel"><div className="page-heading"><div><span className="eyebrow muted">STAFF CONTROL</span><h2>Choose an examination</h2><p>Select the exam, class, arm and subject that the candidates in this room are about to sit.</p></div><button className="subtle-button" onClick={()=>void importPackage()} disabled={busy}><FileDown size={15}/> Import signed package</button></div><div className="exam-list">{packages.map(p=><button key={p.id} className={"exam-row "+(selected?.exam_id===p.exam_id?"selected":"")} onClick={()=>void chooseExam(p)}><span className="exam-row-icon"><BookOpenCheck size={18}/></span><span className="exam-row-copy"><b>{p.title}</b><small>{p.class_name||p.class_id} · {p.arm_name||"All arms"} · {p.subject} · {Math.round(p.duration_seconds/60)} min</small></span>{p.is_demo?<span className="demo-tag">DEMO</span>:<span className="version-tag">v{p.version}</span>}{selected?.exam_id===p.exam_id&&<CheckCircle2 size={17}/>}</button>)}</div>{selected&&<div className="selection-box"><div><b>{selected.title}</b><span>{selected.class_name||selected.class_id} · {selected.arm_name||"All arms"} · {selected.subject}</span><small>{selected.is_demo?"Demo data — do not record as official school results.":"Verified imported package."} · {Math.round(selected.duration_seconds/60)} minutes</small></div><button className="primary" onClick={()=>void setActive()}>Set as active exam <Check size={15}/></button></div>}</section>}
        {view==="candidate"&&<section className="panel candidate-panel"><button className="back-link" onClick={()=>setView("overview")}><ArrowLeft size={15}/> Back to station</button><span className="eyebrow muted">CANDIDATE CHECK-IN</span><h2>{selected?.title||"Examination sign-in"}</h2><p>{selected?.class_name||selected?.class_id} · {selected?.arm_name||"Assigned arm"} · {selected?.subject} · {Math.round((selected?.duration_seconds||0)/60)} minutes</p><div className="candidate-form"><label>Admission number<input value={admission} onChange={e=>setAdmission(e.target.value.toUpperCase())} placeholder="e.g. IMS/2026/001" autoComplete="off"/></label><label>Full name<input value={candidateName} onChange={e=>setCandidateName(e.target.value)} placeholder="Enter your registered name" autoComplete="off"/></label><div className="candidate-note"><LockKeyhole size={16}/> Your admission number and name must match the authorised exam roster. You can resume an unfinished attempt after restarting the application.</div><button className="primary full" onClick={()=>void begin()} disabled={busy||!admission.trim()||!candidateName.trim()}>{busy?"Checking candidate…":"Confirm identity and start exam"} <ArrowRight size={16}/></button></div></section>}
        {view==="result"&&result&&<section className="panel result-panel"><div className="result-icon"><CheckCircle2 size={34}/></div><span className="eyebrow muted">EXAMINATION SUBMITTED</span><h2>{result.score===null?"Your attempt has been saved":"Your result"}</h2><p>{result.candidateName} · {result.admissionNumber}</p>{result.score!==null?<div className="score"><strong>{result.score}</strong><span>/ {result.totalPoints} marks</span></div>:<div className="pending-score">Score will be confirmed by the school server when this attempt synchronises.</div>}<div className="result-details"><span>{result.examTitle}</span><span>{result.className} · {result.armName} · {result.subject}</span><span>{result.demo?"DEMO RESULT":"Official package"} · {result.syncStatus==="synced"?"Synced":"Pending synchronisation"}</span></div><button className="primary" onClick={()=>{setResult(null);setSelected(null);setView("overview");void refresh();}}>Return to station</button></section>}
        {view==="diagnostics"&&<section className="panel page-panel"><div className="page-heading"><div><span className="eyebrow muted">LOCAL SYSTEM</span><h2>Database diagnostics and recovery</h2><p>Check SQLite integrity, review stored attempts and recover timed-out sessions. Active attempts retain their original deadline.</p></div><button className="primary" onClick={()=>void diagnosticRefresh()}><RefreshCw size={15}/> Run recovery check</button></div><div className="diagnostic-grid"><div><span>INTEGRITY CHECK</span><b className={diagnostics?.integrity==="ok"?"good":"warn"}>{diagnostics?.integrity||"Unknown"}</b></div><div><span>EXAM PACKAGES</span><b>{diagnostics?.counts?.exams??"—"}</b></div><div><span>ACTIVE ATTEMPTS</span><b>{diagnostics?.counts?.activeAttempts??"—"}</b></div><div><span>COMPLETED ATTEMPTS</span><b>{diagnostics?.counts?.completedAttempts??"—"}</b></div><div><span>PENDING SYNC</span><b>{diagnostics?.counts?.pendingSync??"—"}</b></div><div><span>JOURNAL MODE</span><b>{diagnostics?.journalMode||"—"}</b></div></div><div className="path-note"><HardDrive size={16}/><span>{diagnostics?.databasePath||"Database path unavailable"}</span></div><div className="notice-row"><ShieldCheck size={15}/> Recovery uses the saved deadline. The exam timer does not restart when Windows or the app restarts.</div><div className="sync-auth-panel"><div><span className="eyebrow muted">SECURE SCHOOL CONNECTION</span><h3>Synchronise completed exams</h3><p>Only authorised teacher/admin accounts can upload completed real-school attempts. Demo attempts never leave this computer.</p></div>{staffAuth.signedIn?<div className="sync-signed-in"><span>Signed in as <b>{staffAuth.email}</b></span><div><button className="primary" onClick={()=>void runSync()} disabled={syncBusy||!queue.pending}>{syncBusy?"Synchronising…":"Sync pending attempts"} <CloudUpload size={15}/></button><button className="subtle-button" onClick={()=>void signOutSync()}>Sign out</button></div></div>:<div className="sync-login"><input value={staffEmail} onChange={e=>setStaffEmail(e.target.value)} type="email" placeholder="School staff email" autoComplete="username"/><input value={staffPassword} onChange={e=>setStaffPassword(e.target.value)} type="password" placeholder="Staff password" autoComplete="current-password"/><button className="primary" onClick={()=>void signInForSync()} disabled={busy||!staffEmail.trim()||!staffPassword}> {busy?"Signing in…":"Sign in to sync"} </button></div>}</div></section>}
        {view==="results"&&<section className="panel page-panel"><div className="page-heading"><div><span className="eyebrow muted">RESTRICTED STAFF VIEW</span><h2>Results management</h2><p>Candidate results are hidden until a supervisor unlocks this station. This local PIN is specific to this Windows installation.</p></div>{supervisorUnlocked&&<button className="subtle-button" onClick={()=>void lockSupervisor()}><LogOut size={14}/> Lock</button>}</div>{!supervisorUnlocked?<div className="pin-box"><b>{pinConfigured?"Supervisor sign in":"Set up supervisor PIN"}</b><p>{pinConfigured?"Enter the six-digit station PIN to view results.":"Create a six-digit PIN. Keep it with authorised staff; do not share it with candidates."}</p><input value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,6))} type="password" inputMode="numeric" placeholder="6-digit PIN" maxLength={6}/><button className="primary" onClick={()=>void supervisorUnlock()} disabled={pin.length!==6}>{pinConfigured?"Unlock results":"Save supervisor PIN"}</button></div>:<><div className="results-toolbar"><b>{results.length} finalised attempts</b><button className="subtle-button" onClick={()=>void refreshResults()}><RefreshCw size={14}/> Refresh</button></div><div className="results-table"><div className="result-row header"><span>Candidate</span><span>Class / Arm</span><span>Exam / Subject</span><span>Score</span><span>Sync</span></div>{results.map((r,i)=><div className="result-row" key={r.exam_id+"-"+r.admission_number+"-"+i}><span><b>{r.candidate_name}</b><small>{r.admission_number}</small></span><span>{r.class_name} / {r.arm_name}</span><span>{r.exam_id}<small>{r.is_demo?"DEMO":"School package"}</small></span><span>{r.score===null?"Pending":r.score+" / "+r.total_points}</span><span>{r.sync_status}</span></div>)}</div></>}</section>}
        {error&&view!=="taking"&&<div className="error">{error}</div>}
        <footer className="app-footer"><span>IMAGEMAKERS NURSERY & PRIMARY SCHOOL · IMPARTING WISDOM AND MORALS</span><span>OFFLINE-FIRST EXAM STATION</span></footer>
      </div>
    </section>
  </main>;
}
