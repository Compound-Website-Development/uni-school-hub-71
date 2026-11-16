const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const BANKS = {
  Mathematics: [
    ["What is 7 + 5?",["10","11","12","13"],2],["What is half of 18?",["7","8","9","10"],2],
    ["Which number is even?",["5","9","12","15"],2],["How many sides has a triangle?",["2","3","4","5"],1],
    ["What is 4 × 3?",["7","10","12","14"],2],["What is 20 − 8?",["10","11","12","13"],2],
    ["Which is the largest number?",["16","61","26","41"],1],["How many minutes are in one hour?",["30","45","60","90"],2]
  ],
  English: [
    ["Choose the correctly spelt word.",["Becaus","Because","Becose","Beacause"],1],["Which word is a noun?",["Quickly","Run","Teacher","Beautiful"],2],
    ["Choose the opposite of 'early'.",["Soon","Late","Fast","First"],1],["Which punctuation ends a question?",["Full stop","Comma","Question mark","Colon"],2],
    ["Choose the plural of 'child'.",["Childs","Childes","Children","Childrens"],2],["Which word is a verb?",["Sing","Blue","Soft","Table"],0],
    ["Complete: She ___ to school every day.",["go","goes","going","gone"],1],["Which is a proper noun?",["city","school","Lagos","river"],2]
  ],
  "Basic Science": [
    ["Which organ pumps blood around the body?",["Lungs","Heart","Brain","Kidney"],1],["Which of these is a source of light?",["Stone","Sun","Chair","Book"],1],
    ["Plants make food mainly in their…",["Roots","Flowers","Leaves","Fruits"],2],["Which animal is a mammal?",["Lizard","Frog","Goat","Fish"],2],
    ["Water freezes into…",["Steam","Ice","Smoke","Sand"],1],["Which sense organ helps us hear?",["Eye","Ear","Nose","Tongue"],1],
    ["The Earth moves around the…",["Moon","Mars","Sun","Clouds"],2],["Which material is attracted by a magnet?",["Wood","Plastic","Iron","Paper"],2]
  ]
};

function ensureColumn(db, table, name, definition) {
  const columns = db.prepare("PRAGMA table_info(" + table + ")").all().map((c) => c.name);
  if (!columns.includes(name)) db.exec("ALTER TABLE " + table + " ADD COLUMN " + name + " " + definition);
}

function openDatabase(userData) {
  const dir = path.join(userData, "data");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const db = new Database(path.join(dir, "imagemakers-cbt.sqlite"), { timeout: 5000 });
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.pragma("foreign_keys = ON");
  db.pragma("secure_delete = ON");
  db.pragma("busy_timeout = 5000");
  db.exec("CREATE TABLE IF NOT EXISTS exam_packages (id TEXT PRIMARY KEY, school_id TEXT NOT NULL, session_id TEXT NOT NULL, exam_id TEXT NOT NULL, version INTEGER NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, class_id TEXT NOT NULL, opens_at TEXT NOT NULL, closes_at TEXT NOT NULL, duration_seconds INTEGER NOT NULL, package_hash TEXT NOT NULL, imported_at TEXT NOT NULL, payload_json TEXT NOT NULL, UNIQUE(exam_id, version))");
  db.exec("CREATE TABLE IF NOT EXISTS candidate_roster (exam_id TEXT NOT NULL, student_id TEXT NOT NULL, admission_number TEXT NOT NULL, display_name TEXT NOT NULL, class_id TEXT NOT NULL, PRIMARY KEY(exam_id, student_id))");
  db.exec("CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, exam_id TEXT NOT NULL, exam_version INTEGER NOT NULL, student_id TEXT NOT NULL, started_at TEXT NOT NULL, deadline_at TEXT NOT NULL, submitted_at TEXT, status TEXT NOT NULL CHECK(status IN ('in_progress','submitted','expired')), sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','failed')), clock_warning INTEGER NOT NULL DEFAULT 0, payload_hash TEXT)");
  db.exec("CREATE TABLE IF NOT EXISTS answers (attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE, question_id TEXT NOT NULL, selected_option_id TEXT, updated_at TEXT NOT NULL, PRIMARY KEY(attempt_id, question_id))");
  db.exec("CREATE TABLE IF NOT EXISTS sync_queue (attempt_id TEXT PRIMARY KEY REFERENCES attempts(id), payload_hash TEXT, retry_count INTEGER NOT NULL DEFAULT 0, last_error_code TEXT, queued_at TEXT NOT NULL)");
  db.exec("CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, attempt_id TEXT, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, metadata_json TEXT NOT NULL DEFAULT '{}')");
  db.exec("CREATE TABLE IF NOT EXISTS demo_answer_keys (exam_id TEXT NOT NULL, question_id TEXT NOT NULL, correct_option_id TEXT NOT NULL, points REAL NOT NULL DEFAULT 1, PRIMARY KEY(exam_id, question_id))");
  db.exec("CREATE TABLE IF NOT EXISTS local_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  for (const [column, definition] of [["class_name","TEXT"],["arm_id","TEXT"],["arm_name","TEXT"],["is_demo","INTEGER NOT NULL DEFAULT 0"]]) ensureColumn(db,"candidate_roster",column,definition);
  for (const [column, definition] of [["class_name","TEXT"],["arm_id","TEXT"],["arm_name","TEXT"],["is_demo","INTEGER NOT NULL DEFAULT 0"],["answer_key_encrypted","TEXT"]]) ensureColumn(db,"exam_packages",column,definition);
  for (const [column, definition] of [["score","REAL"],["total_points","REAL"],["admission_number","TEXT"],["candidate_name","TEXT"],["class_name","TEXT"],["arm_name","TEXT"],["is_demo","INTEGER NOT NULL DEFAULT 0"],["last_observed_at","TEXT"]]) ensureColumn(db,"attempts",column,definition);
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt_per_candidate_exam ON attempts(exam_id,student_id) WHERE status='in_progress'");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS one_final_attempt_per_candidate_exam ON attempts(exam_id,student_id) WHERE status IN ('submitted','expired')");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS roster_admission_per_exam ON candidate_roster(exam_id,admission_number)");
  db.exec("CREATE INDEX IF NOT EXISTS attempts_exam_status ON attempts(exam_id,status,submitted_at)");
  seedDemoExams(db);
  return db;
}

function seedDemoExams(db) {
  if (db.prepare("SELECT COUNT(*) AS n FROM exam_packages WHERE is_demo=1").get().n) return;
  const opens = new Date(Date.now()-86400000*30).toISOString();
  const closes = new Date(Date.now()+86400000*365).toISOString();
  const classes = [{id:"primary-1",name:"Primary 1",code:"P1"},{id:"primary-2",name:"Primary 2",code:"P2"},{id:"primary-3",name:"Primary 3",code:"P3"}];
  const arms = [{id:"ruby",name:"Ruby",code:"R"},{id:"sapphire",name:"Sapphire",code:"S"}];
  const names = ["Ada Okafor","Daniel Bello","Mary James","Samuel Musa"];
  const subjects = Object.keys(BANKS);
  const insertPackage = db.prepare("INSERT INTO exam_packages (id,school_id,session_id,exam_id,version,title,subject,class_id,opens_at,closes_at,duration_seconds,package_hash,imported_at,payload_json,arm_id,arm_name,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)");
  const insertCandidate = db.prepare("INSERT INTO candidate_roster (exam_id,student_id,admission_number,display_name,class_id,class_name,arm_id,arm_name,is_demo) VALUES (?,?,?,?,?,?,?,?,1)");
  const insertKey = db.prepare("INSERT INTO demo_answer_keys (exam_id,question_id,correct_option_id,points) VALUES (?,?,?,1)");
  const insert = db.transaction(() => {
    for (const cls of classes) for (const arm of arms) for (const subject of subjects) {
      const examId = "demo-" + cls.code.toLowerCase() + "-" + arm.code.toLowerCase() + "-" + subject.toLowerCase().replace(/[^a-z]+/g,"-");
      const packageId = examId + "-v1";
      const bank = BANKS[subject];
      const questions = bank.map((row,index) => ({id:examId+"-q"+(index+1),prompt:row[0],options:row[1].map((text,i)=>({id:String.fromCharCode(65+i),text})),points:1}));
      const payload = {schemaVersion:1,id:packageId,schoolId:"imagemakers-demo",sessionId:"demo-session",examId,version:1,title:"Demo "+subject+" Assessment",subject,classId:cls.id,className:cls.name,armId:arm.id,armName:arm.name,opensAt:opens,closesAt:closes,durationSeconds:600,instructions:"DEMO ONLY — answer all questions. You may move backwards and change an answer before submitting.",questions,candidates:[]};
      const hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      insertPackage.run(packageId,"imagemakers-demo","demo-session",examId,1,payload.title,subject,cls.id,opens,closes,600,hash,new Date().toISOString(),JSON.stringify(payload),arm.id,arm.name);
      questions.forEach((q,index)=>insertKey.run(examId,q.id,String.fromCharCode(65+bank[index][2])));
      names.forEach((name,i)=>{
        const admission = "DEMO-"+cls.code+"-"+arm.code+"-"+String(i+1).padStart(3,"0");
        const studentId = "demo-student-"+cls.code+"-"+arm.code+"-"+String(i+1);
        insertCandidate.run(examId,studentId,admission,name,cls.id,cls.name,arm.id,arm.name);
      });
    }
  });
  insert();
}
module.exports = { openDatabase, seedDemoExams };
