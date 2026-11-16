const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { openDatabase } = require("./db.cjs");

const SUPABASE_URL = "https://weqzvfpzuybyuvruumae.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcXp2ZnB6dXlieXV2cnV1bWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjE2NTYsImV4cCI6MjEwMTQzNzY1Nn0.v2O9FOtlO5naESuOPsVU-u2Q8ha7SY2IS97vblmD2Cg";
const EXAM_PACKAGE_PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEAmKpEBmIhtJccyjm3fX9hrPUtTyrsTBMStqLPstNZSq0=";
const DEMO_EXAM_PACKAGE_PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEA9FeS0qi0SSKrMvFxeW4t1aX7mD7MCOPoi/4udt/zbZs=";

let db;
let dbError = null;
let mainWindow;
let supervisorUnlockedUntil = 0;
const now = () => new Date().toISOString();
const safeText = (value,max=180) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const requireDb = () => { if (!db) throw new Error(dbError || "Local database is unavailable."); return db; };
const audit = (eventType,attemptId=null,metadata={}) => requireDb().prepare("INSERT INTO audit_events (id,attempt_id,event_type,occurred_at,metadata_json) VALUES (?,?,?,?,?)").run(crypto.randomUUID(),attemptId,eventType,now(),JSON.stringify(metadata));

function createWindow() {
  mainWindow = new BrowserWindow({
    width:1440,height:940,minWidth:1000,minHeight:700,backgroundColor:"#07172d",
    title:"Imagemakers CBT",
    webPreferences:{preload:path.join(__dirname,"preload.cjs"),contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  mainWindow.removeMenu();
  if (app.isPackaged) mainWindow.loadFile(path.join(__dirname,"../dist/index.html"));
  else mainWindow.loadURL("http://127.0.0.1:5173");
  mainWindow.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith("https://")) shell.openExternal(url);return {action:"deny"};});
  mainWindow.webContents.on("will-navigate",(event,url)=>{
    const allowed = app.isPackaged ? url.startsWith("file://") : url.startsWith("http://127.0.0.1:5173");
    if(!allowed) event.preventDefault();
  });
}

function packageRow(examId) {
  const row = requireDb().prepare("SELECT * FROM exam_packages WHERE exam_id=? ORDER BY version DESC LIMIT 1").get(examId);
  if (!row) throw new Error("The selected exam is not available on this device.");
  return row;
}
function loadAttempt(attemptId,admissionNumber) {
  const database = requireDb();
  const attempt = database.prepare("SELECT * FROM attempts WHERE id=? AND admission_number=?").get(attemptId,admissionNumber);
  if (!attempt) throw new Error("This attempt does not belong to the supplied admission number.");
  if (attempt.status !== "in_progress") throw new Error("This attempt is already finalised.");
  const previousObserved = Date.parse(attempt.last_observed_at || attempt.started_at);
  if (Number.isFinite(previousObserved) && Date.now() < previousObserved - 30000) database.prepare("UPDATE attempts SET clock_warning=1 WHERE id=?").run(attemptId);
  database.prepare("UPDATE attempts SET last_observed_at=? WHERE id=?").run(now(),attemptId);
  if (Date.now() >= Date.parse(attempt.deadline_at)) {
    finishAttempt(attempt.id,"expired");
    throw new Error("The examination time has ended. Your attempt has been finalised.");
  }
  const pkg = packageRow(attempt.exam_id);
  const payload = JSON.parse(pkg.payload_json);
  const answers = Object.fromEntries(database.prepare("SELECT question_id,selected_option_id FROM answers WHERE attempt_id=?").all(attempt.id).map(x=>[x.question_id,x.selected_option_id]));
  return {
    attempt:{id:attempt.id,startedAt:attempt.started_at,deadlineAt:attempt.deadline_at,status:attempt.status},
    exam:{id:pkg.exam_id,title:pkg.title,subject:pkg.subject,className:pkg.class_name || payload.className || pkg.class_id,armName:pkg.arm_name || payload.armName || "",durationSeconds:pkg.duration_seconds,instructions:payload.instructions || ""},
    questions:payload.questions.map(q=>({id:q.id,prompt:q.prompt,options:q.options,points:q.points || 1})),
    answers
  };
}

function finishAttempt(attemptId,status="submitted") {
  const database = requireDb();
  const attempt = database.prepare("SELECT * FROM attempts WHERE id=?").get(attemptId);
  if (!attempt || attempt.status !== "in_progress") return attempt;
  const pkg = packageRow(attempt.exam_id);
  const payload = JSON.parse(pkg.payload_json);
  const answers = Object.fromEntries(database.prepare("SELECT question_id,selected_option_id FROM answers WHERE attempt_id=?").all(attemptId).map(x=>[x.question_id,x.selected_option_id]));
  let keys = database.prepare("SELECT question_id,correct_option_id,points FROM demo_answer_keys WHERE exam_id=?").all(attempt.exam_id);
  if (!keys.length && pkg.answer_key_encrypted) {
    const decrypted = safeStorage.decryptString(Buffer.from(pkg.answer_key_encrypted,"base64"));
    keys = JSON.parse(decrypted).map(k=>({question_id:k.questionId,correct_option_id:k.correctOptionId,points:k.points||1}));
  }
  let score = null;
  let totalPoints = null;
  if (keys.length === payload.questions.length && keys.length > 0) {
    score = 0;
    totalPoints = 0;
    for (const key of keys) {
      totalPoints += Number(key.points || 1);
      if (answers[key.question_id] === key.correct_option_id) score += Number(key.points || 1);
    }
  }
  const submittedAt = status === "expired" ? attempt.deadline_at : now();
  const hash = crypto.createHash("sha256").update(JSON.stringify({attemptId,examId:attempt.exam_id,studentId:attempt.student_id,answers,submittedAt})).digest("hex");
  const transaction = database.transaction(() => {
    database.prepare("UPDATE attempts SET status=?,submitted_at=?,score=?,total_points=?,payload_hash=?,sync_status='pending' WHERE id=? AND status='in_progress'")
      .run(status,submittedAt,score,totalPoints,hash,attemptId);
    if (!attempt.is_demo) database.prepare("INSERT OR IGNORE INTO sync_queue (attempt_id,payload_hash,queued_at) VALUES (?,?,?)").run(attemptId,hash,submittedAt);
    audit(status === "expired" ? "attempt_expired" : "attempt_submitted",attemptId,{scoredOffline:score !== null});
  });
  transaction();
  return database.prepare("SELECT * FROM attempts WHERE id=?").get(attemptId);
}

function recoverInterruptedAttempts() {
  const database = requireDb();
  const active = database.prepare("SELECT id,deadline_at,last_observed_at FROM attempts WHERE status='in_progress'").all();
  let expired = 0;
  for (const attempt of active) {
    const previousObserved = Date.parse(attempt.last_observed_at || attempt.deadline_at);
    if (Number.isFinite(previousObserved) && Date.now() < previousObserved - 30000) database.prepare("UPDATE attempts SET clock_warning=1 WHERE id=?").run(attempt.id);
    database.prepare("UPDATE attempts SET last_observed_at=? WHERE id=?").run(now(),attempt.id);
    if (Date.now() >= Date.parse(attempt.deadline_at)) { finishAttempt(attempt.id,"expired"); expired++; }
  }
  audit("application_recovered",null,{expiredAttempts:expired,activeAttempts:active.length-expired});
  return {checked:active.length,expired,resumable:active.length-expired};
}

function registerIpc() {
  ipcMain.handle("app:status",()=>{
    try {
      const database = requireDb();
      const integrity = database.pragma("integrity_check",{simple:true});
      return {version:app.getVersion(),platform:process.platform,database:integrity==="ok"?"ready":"error",integrity,online:false};
    } catch(error) { return {version:app.getVersion(),platform:process.platform,database:"error",error:error.message}; }
  });
  ipcMain.handle("app:diagnostics",()=>{
    const database = requireDb();
    const integrity = database.pragma("integrity_check",{simple:true});
    const counts = {
      exams:database.prepare("SELECT COUNT(*) n FROM exam_packages").get().n,
      activeAttempts:database.prepare("SELECT COUNT(*) n FROM attempts WHERE status='in_progress'").get().n,
      completedAttempts:database.prepare("SELECT COUNT(*) n FROM attempts WHERE status IN ('submitted','expired')").get().n,
      pendingSync:database.prepare("SELECT COUNT(*) n FROM sync_queue").get().n
    };
    return {integrity,databasePath:path.join(app.getPath("userData"),"data","imagemakers-cbt.sqlite"),journalMode:database.pragma("journal_mode",{simple:true}),counts};
  });
  ipcMain.handle("app:recover",()=>recoverInterruptedAttempts());
  ipcMain.handle("station:get-active-exam",()=>({examId:requireDb().prepare("SELECT value FROM local_meta WHERE key='active_exam_id'").get()?.value||""}));
  ipcMain.handle("station:set-active-exam",(_event,examId)=>{
    if(!safeText(examId)) throw new Error("Choose a valid exam.");
    const exists=requireDb().prepare("SELECT 1 FROM exam_packages WHERE exam_id=?").get(examId);
    if(!exists) throw new Error("That exam is not available on this station.");
    requireDb().prepare("INSERT INTO local_meta (key,value) VALUES ('active_exam_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(examId);
    audit("station_exam_selected",null,{examId});
    return {examId};
  });
  const staffSessionPath = path.join(app.getPath("userData"),"staff-session.bin");
  const readStaffSession = () => {
    if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(staffSessionPath)) return null;
    try { return JSON.parse(safeStorage.decryptString(fs.readFileSync(staffSessionPath))); } catch { return null; }
  };
  const writeStaffSession = (session) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error("Windows secure credential storage is unavailable on this account.");
    fs.writeFileSync(staffSessionPath,safeStorage.encryptString(JSON.stringify(session)),{mode:0o600});
  };
  const authRequest = async (grant,body) => {
    const response=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type="+grant,{
      method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_PUBLISHABLE_KEY},
      body:JSON.stringify(body)
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.msg||data.message||data.error_description||"Staff sign-in failed.");
    return data;
  };
  const validStaffSession = async () => {
    let session=readStaffSession();
    if(!session?.access_token) throw new Error("Sign in with an authorised school staff account before synchronising.");
    if(Number(session.expires_at||0)*1000 < Date.now()+60000) {
      if(!session.refresh_token) throw new Error("Staff session expired. Sign in again.");
      const refreshed=await authRequest("refresh_token",{refresh_token:session.refresh_token});
      session={...refreshed,expires_at:refreshed.expires_at||Math.floor(Date.now()/1000)+refreshed.expires_in};
      writeStaffSession(session);
    }
    return session;
  };
  ipcMain.handle("auth:status",()=>{
    const session=readStaffSession();
    return {signedIn:!!session?.access_token,email:session?.user?.email||"",expiresAt:session?.expires_at||null};
  });
  ipcMain.handle("auth:sign-in",async(_event,email,password)=>{
    if(!safeText(email,254)||!safeText(password,256)) throw new Error("Enter your school staff email and password.");
    const session=await authRequest("password",{email:email.trim(),password});
    writeStaffSession({...session,expires_at:session.expires_at||Math.floor(Date.now()/1000)+session.expires_in});
    return {signedIn:true,email:session.user?.email||email.trim()};
  });
  ipcMain.handle("auth:sign-out",()=>{
    try{if(fs.existsSync(staffSessionPath))fs.unlinkSync(staffSessionPath);}catch{}
    return {signedOut:true};
  });
  ipcMain.handle("sync:run",async()=>{
    const database=requireDb();
    const session=await validStaffSession();
    const rows=database.prepare("SELECT a.*,p.package_hash,p.payload_json FROM sync_queue q JOIN attempts a ON a.id=q.attempt_id JOIN exam_packages p ON p.exam_id=a.exam_id AND p.version=a.exam_version WHERE a.is_demo=0 AND a.status IN ('submitted','expired') ORDER BY q.queued_at LIMIT 25").all();
    if(!rows.length) return {synced:0,failed:0,pending:0,message:"No real school attempts are waiting to sync."};
    const attempts=rows.map((attempt)=>{
      const payload=JSON.parse(attempt.payload_json);
      const answers={};
      for(const answer of database.prepare("SELECT question_id,selected_option_id FROM answers WHERE attempt_id=?").all(attempt.id)){
        const question=payload.questions.find(q=>q.id===answer.question_id);
        const index=question?.options?.findIndex(o=>o.id===answer.selected_option_id);
        if(question&&index>=0)answers[answer.question_id]=index;
      }
      const canonical={attemptId:attempt.id,examId:attempt.exam_id,studentId:attempt.student_id,examVersion:attempt.exam_version,packageHash:attempt.package_hash,startedAt:attempt.started_at,deadlineAt:attempt.deadline_at,submittedAt:attempt.submitted_at,answers};
      const payloadHash=crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
      return {...canonical,admissionNumber:attempt.admission_number,payloadHash,clockWarning:!!attempt.clock_warning};
    });
    try{
      const response=await fetch(SUPABASE_URL+"/functions/v1/cbt-sync",{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_PUBLISHABLE_KEY,"Authorization":"Bearer "+session.access_token},
        body:JSON.stringify({attempts})
      });
      const body=await response.json();
      if(!response.ok) throw new Error(body.error||"The school sync service rejected this batch.");
      let synced=0,failed=0;
      for(const item of body.results||[]){
        if(item.success){
          database.prepare("UPDATE attempts SET sync_status='synced',score=?,total_points=? WHERE id=?").run(item.score,item.totalPoints,item.attemptId);
          database.prepare("DELETE FROM sync_queue WHERE attempt_id=?").run(item.attemptId);
          synced++;
        }else{
          database.prepare("UPDATE attempts SET sync_status='failed' WHERE id=?").run(item.attemptId);
          database.prepare("UPDATE sync_queue SET retry_count=retry_count+1,last_error_code=? WHERE attempt_id=?").run(String(item.error||"sync_failed").slice(0,80),item.attemptId);
          failed++;
        }
      }
      audit("sync_batch_completed",null,{synced,failed});
      return {synced,failed,pending:database.prepare("SELECT COUNT(*) n FROM sync_queue").get().n};
    }catch(error){
      for(const attempt of rows){
        database.prepare("UPDATE attempts SET sync_status='failed' WHERE id=?").run(attempt.id);
        database.prepare("UPDATE sync_queue SET retry_count=retry_count+1,last_error_code=? WHERE attempt_id=?").run("network_or_server_error",attempt.id);
      }
      throw new Error(error.message||"Sync failed. Attempts remain safely stored on this computer.");
    }
  });
  ipcMain.handle("packages:list",()=>requireDb().prepare("SELECT id,exam_id,title,subject,class_id,class_name,arm_id,arm_name,opens_at,closes_at,duration_seconds,version,imported_at,is_demo FROM exam_packages ORDER BY is_demo DESC,class_id,arm_name,subject").all());
  ipcMain.handle("sync:queue",()=>({pending:requireDb().prepare("SELECT COUNT(*) AS pending FROM sync_queue").get().pending,items:requireDb().prepare("SELECT attempt_id,queued_at,retry_count,last_error_code FROM sync_queue ORDER BY queued_at").all()}));
  ipcMain.handle("exam:preview",(_event,examId)=>{
    if(!safeText(examId)) throw new Error("Invalid exam selection.");
    const row=packageRow(examId),p=JSON.parse(row.payload_json);
    return {id:row.exam_id,title:row.title,subject:row.subject,classId:row.class_id,className:row.class_name||p.className||row.class_id,armId:row.arm_id||p.armId||"",armName:row.arm_name||p.armName||"",opensAt:row.opens_at,closesAt:row.closes_at,durationSeconds:row.duration_seconds,questionCount:p.questions.length,isDemo:!!row.is_demo,instructions:p.instructions||""};
  });
  ipcMain.handle("packages:import",async()=>{
    const picked=await dialog.showOpenDialog(mainWindow,{title:"Import a school exam package",properties:["openFile"],filters:[{name:"Exam package (JSON)",extensions:["imexam","json"]}]});
    if(picked.canceled||!picked.filePaths[0]) return {cancelled:true};
    try {
      const raw=fs.readFileSync(picked.filePaths[0],"utf8");
      if(Buffer.byteLength(raw,"utf8")>20*1024*1024) throw new Error("Package exceeds the 20 MB safety limit.");
      const envelope=JSON.parse(raw);
      if(!envelope.payload||!safeText(envelope.signature,2048)) throw new Error("The package must be a signed JSON envelope.");
      const canonical=JSON.stringify(envelope.payload);
      const packageHash=crypto.createHash("sha256").update(canonical).digest("hex");
      if(envelope.packageHash!==packageHash) throw new Error("The package hash does not match its contents.");
      const p=envelope.payload;
      const isDemoPackage=p.demoPackage===true;
      if(isDemoPackage && (p.schoolId!=="imagemakers-demo" || !String(p.examId||"").startsWith("demo-"))) throw new Error("Demo package identity is invalid.");
      const trustedKey=isDemoPackage?DEMO_EXAM_PACKAGE_PUBLIC_KEY_B64:EXAM_PACKAGE_PUBLIC_KEY_B64;
      const publicKey=crypto.createPublicKey({key:Buffer.from(trustedKey,"base64"),format:"der",type:"spki"});
      if(!crypto.verify(null,Buffer.from(canonical),publicKey,Buffer.from(envelope.signature,"base64"))) throw new Error("The package signature is invalid.");
      if(p.schemaVersion!==1||!safeText(p.id)||!safeText(p.schoolId)||!safeText(p.sessionId)||!safeText(p.examId)||!safeText(p.title)||!safeText(p.subject)||!safeText(p.classId)||!Array.isArray(p.questions)||!Array.isArray(p.candidates)) throw new Error("Package structure is not supported.");
      if(p.questions.length<1||p.questions.length>500||p.candidates.length<1||p.candidates.length>1000||!Number.isInteger(p.durationSeconds)||p.durationSeconds<60) throw new Error("Package limits or duration are invalid.");
      for(const q of p.questions) {
        if(!safeText(q.id)||!safeText(q.prompt,5000)||!Array.isArray(q.options)||q.options.length<2||q.options.length>6||q.options.some(o=>!safeText(o.id)||!safeText(o.text,1000))) throw new Error("A question is malformed.");
        if("correctOptionId" in q||"answerKey" in q||"correctAnswer" in q) throw new Error("Correct answers must not be in candidate question data.");
      }
      if(!Array.isArray(p.answerKey)||p.answerKey.length!==p.questions.length) throw new Error("The signed package is missing its separate marking key.");
      for(const key of p.answerKey) if(!safeText(key.questionId)||!safeText(key.correctOptionId,8)||!Number.isFinite(Number(key.points||1))||!p.questions.some(q=>q.id===key.questionId&&q.options.some(o=>o.id===key.correctOptionId))) throw new Error("The package marking key is invalid.");
      for(const c of p.candidates) if(!safeText(c.studentId)||!safeText(c.admissionNumber,40)||!safeText(c.displayName,120)||!safeText(c.classId,80)) throw new Error("Candidate roster is malformed.");
      if(!safeStorage.isEncryptionAvailable()) throw new Error("Windows secure storage is unavailable; the marking key cannot be protected on this account.");
      const answerKeyEncrypted=safeStorage.encryptString(JSON.stringify(p.answerKey)).toString("base64");
      const storedPayload={...p};delete storedPayload.answerKey;
      const database=requireDb(),hash=crypto.createHash("sha256").update(canonical).digest("hex");
      const insert=database.transaction(()=>{
        database.prepare("INSERT INTO exam_packages (id,school_id,session_id,exam_id,version,title,subject,class_id,opens_at,closes_at,duration_seconds,package_hash,imported_at,payload_json,arm_id,arm_name,is_demo,answer_key_encrypted) VALUES (@id,@schoolId,@sessionId,@examId,@version,@title,@subject,@classId,@opensAt,@closesAt,@durationSeconds,@hash,@importedAt,@json,@armId,@armName,@isDemo,@answerKeyEncrypted) ON CONFLICT(exam_id,version) DO NOTHING").run({
          id:p.id,schoolId:p.schoolId,sessionId:p.sessionId,examId:p.examId,version:p.version||1,title:p.title,subject:p.subject,classId:p.classId,
          opensAt:p.opensAt,closesAt:p.closesAt,durationSeconds:p.durationSeconds,hash,importedAt:now(),json:JSON.stringify(storedPayload),armId:p.armId||null,armName:p.armName||null,isDemo:isDemoPackage?1:0,answerKeyEncrypted
        });
        const add=database.prepare("INSERT OR IGNORE INTO candidate_roster (exam_id,student_id,admission_number,display_name,class_id,class_name,arm_id,arm_name,is_demo) VALUES (?,?,?,?,?,?,?,?,?)");
        p.candidates.forEach(c=>add.run(p.examId,c.studentId,c.admissionNumber,c.displayName,c.classId,c.className||null,c.armId||null,c.armName||null,isDemoPackage?1:0));
      });
      insert();
      audit("exam_package_imported",null,{examId:p.examId,version:p.version||1});
      return {imported:true,title:p.title,examId:p.examId,hash};
    } catch(error) { return {error:error.message||"Package import failed."}; }
  });
  ipcMain.handle("candidate:lookup",(_event,examId,admissionNumber)=>{
    if(!safeText(examId)||!safeText(admissionNumber,40)) throw new Error("Enter a valid admission number.");
    const row=requireDb().prepare("SELECT display_name,class_name,arm_name,is_demo FROM candidate_roster WHERE exam_id=? AND upper(admission_number)=upper(?)").get(examId,admissionNumber.trim());
    if(!row) throw new Error("That admission number is not on the selected exam roster.");
    return {name:row.display_name,className:row.class_name||"",armName:row.arm_name||"",demo:!!row.is_demo};
  });
  ipcMain.handle("attempt:start",(_event,examId,admissionNumber,candidateName)=>{
    if(!safeText(examId)||!safeText(admissionNumber,40)||!safeText(candidateName,120)) throw new Error("Enter your admission number and confirm your name.");
    const database=requireDb(),pkg=packageRow(examId),p=JSON.parse(pkg.payload_json);
    const candidate=database.prepare("SELECT * FROM candidate_roster WHERE exam_id=? AND upper(admission_number)=upper(?)").get(examId,admissionNumber.trim());
    if(!candidate) throw new Error("Candidate not found for this exam. Check the admission number and selected class/arm.");
    if(candidate.display_name.trim().toLowerCase()!==candidateName.trim().toLowerCase()) throw new Error("The name does not match this admission number. Ask the supervisor for help.");
    const time=Date.now();
    if(time<Date.parse(pkg.opens_at)||time>Date.parse(pkg.closes_at)) throw new Error("This examination is outside its permitted start window.");
    const active=database.prepare("SELECT id,deadline_at FROM attempts WHERE exam_id=? AND student_id=? AND status='in_progress'").get(examId,candidate.student_id);
    if(active) return loadAttempt(active.id,candidate.admission_number);
    const completed=database.prepare("SELECT id,status,score,total_points,submitted_at FROM attempts WHERE exam_id=? AND student_id=? AND status IN ('submitted','expired')").get(examId,candidate.student_id);
    if(completed) throw new Error("This candidate already has a finalised attempt for this examination.");
    const deadline=Math.min(time+pkg.duration_seconds*1000,Date.parse(pkg.closes_at));
    const id=crypto.randomUUID();
    database.prepare("INSERT INTO attempts (id,exam_id,exam_version,student_id,started_at,deadline_at,status,admission_number,candidate_name,class_name,arm_name,is_demo,last_observed_at) VALUES (?,?,?,?,?,?,'in_progress',?,?,?,?,?,?)")
      .run(id,examId,pkg.version,candidate.student_id,new Date(time).toISOString(),new Date(deadline).toISOString(),candidate.admission_number,candidate.display_name,candidate.class_name||p.className||pkg.class_id,candidate.arm_name||p.armName||"",candidate.is_demo?1:0,new Date(time).toISOString());
    audit("attempt_started",id,{examId,isDemo:!!candidate.is_demo});
    return loadAttempt(id,candidate.admission_number);
  });
  ipcMain.handle("attempt:resume",(_event,attemptId,admissionNumber)=>loadAttempt(attemptId,admissionNumber));
  ipcMain.handle("attempt:answer",(_event,attemptId,admissionNumber,questionId,optionId)=>{
    const database=requireDb(),attempt=database.prepare("SELECT * FROM attempts WHERE id=? AND admission_number=?").get(attemptId,admissionNumber);
    if(!attempt||attempt.status!=="in_progress") throw new Error("This attempt is no longer editable.");
    if(Date.now()>=Date.parse(attempt.deadline_at)){finishAttempt(attemptId,"expired");throw new Error("Time is up. Your attempt has been submitted.");}
    const p=JSON.parse(packageRow(attempt.exam_id).payload_json);
    const q=p.questions.find(x=>x.id===questionId);
    if(!q||!q.options.some(x=>x.id===optionId)) throw new Error("Invalid question or answer option.");
    const previousObserved = Date.parse(attempt.last_observed_at || attempt.started_at);
    const clockMovedBack = Number.isFinite(previousObserved) && Date.now() < previousObserved - 30000;
    database.prepare("UPDATE attempts SET last_observed_at=?,clock_warning=CASE WHEN ? THEN 1 ELSE clock_warning END WHERE id=?").run(now(),clockMovedBack?1:0,attemptId);
    database.prepare("INSERT INTO answers (attempt_id,question_id,selected_option_id,updated_at) VALUES (?,?,?,?) ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option_id=excluded.selected_option_id,updated_at=excluded.updated_at").run(attemptId,questionId,optionId,now());
    return {saved:true,questionId};
  });
  ipcMain.handle("attempt:submit",(_event,attemptId,admissionNumber)=>{
    const attempt=requireDb().prepare("SELECT * FROM attempts WHERE id=? AND admission_number=?").get(attemptId,admissionNumber);
    if(!attempt) throw new Error("Attempt not found for this candidate.");
    if(attempt.status==="in_progress") finishAttempt(attemptId,Date.now()>=Date.parse(attempt.deadline_at)?"expired":"submitted");
    return resultFor(attemptId,admissionNumber);
  });
  ipcMain.handle("attempt:result",(_event,attemptId,admissionNumber)=>resultFor(attemptId,admissionNumber));
  ipcMain.handle("supervisor:pin-status",()=>({configured:!!requireDb().prepare("SELECT value FROM local_meta WHERE key='supervisor_pin_hash'").get()}));
  ipcMain.handle("supervisor:set-pin",(_event,pin)=>{
    if(!/^\d{6}$/.test(String(pin))) throw new Error("Choose a six-digit supervisor PIN.");
    const database=requireDb();
    if(database.prepare("SELECT value FROM local_meta WHERE key='supervisor_pin_hash'").get()) throw new Error("A supervisor PIN is already configured. Contact the station administrator to reset it.");
    const salt=crypto.randomBytes(16).toString("hex"),hash=crypto.scryptSync(String(pin),salt,64).toString("hex");
    database.prepare("INSERT INTO local_meta (key,value) VALUES ('supervisor_pin_salt',?),('supervisor_pin_hash',?)").run(salt,hash);
    supervisorUnlockedUntil=Date.now()+300000;
    return {configured:true};
  });
  ipcMain.handle("supervisor:unlock",(_event,pin)=>{
    const database=requireDb(),salt=database.prepare("SELECT value FROM local_meta WHERE key='supervisor_pin_salt'").get();
    const stored=database.prepare("SELECT value FROM local_meta WHERE key='supervisor_pin_hash'").get();
    if(!salt||!stored) throw new Error("Set up a supervisor PIN first.");
    const candidate=crypto.scryptSync(String(pin),salt.value,64);
    if(!crypto.timingSafeEqual(candidate,Buffer.from(stored.value,"hex"))) throw new Error("Incorrect supervisor PIN.");
    supervisorUnlockedUntil=Date.now()+300000;
    return {unlocked:true,expiresInSeconds:300};
  });
  ipcMain.handle("supervisor:results",()=>{
    if(Date.now()>supervisorUnlockedUntil) throw new Error("Supervisor session expired. Unlock again.");
    return requireDb().prepare("SELECT exam_id,candidate_name,admission_number,class_name,arm_name,score,total_points,status,sync_status,submitted_at,is_demo FROM attempts WHERE status IN ('submitted','expired') ORDER BY submitted_at DESC").all();
  });
  ipcMain.handle("supervisor:lock",()=>{supervisorUnlockedUntil=0;return {locked:true};});
}

function resultFor(attemptId,admissionNumber) {
  const row=requireDb().prepare("SELECT id,exam_id,candidate_name,admission_number,class_name,arm_name,score,total_points,status,sync_status,submitted_at,is_demo FROM attempts WHERE id=? AND admission_number=? AND status IN ('submitted','expired')").get(attemptId,admissionNumber);
  if(!row) throw new Error("No final result exists for this candidate yet.");
  const pkg=packageRow(row.exam_id);
  return {attemptId:row.id,examTitle:pkg.title,subject:pkg.subject,candidateName:row.candidate_name,admissionNumber:row.admission_number,className:row.class_name,armName:row.arm_name,score:row.score,totalPoints:row.total_points,status:row.status,syncStatus:row.sync_status,submittedAt:row.submitted_at,demo:!!row.is_demo};
}

app.whenReady().then(()=>{
  try { db=openDatabase(app.getPath("userData")); recoverInterruptedAttempts(); }
  catch(error) { dbError=error.message||"Unable to open the local SQLite database."; }
  registerIpc();
  createWindow();
});
app.on("window-all-closed",()=>{if(process.platform!=="darwin") app.quit();});
app.on("before-quit",()=>{if(db){try{db.pragma("wal_checkpoint(TRUNCATE)");db.close();}catch{}}});
