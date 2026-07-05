const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "data", "database.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readDB(){ return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); }
function writeDB(db){ fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8"); }
function nextId(arr){ return arr.length ? Math.max(...arr.map(x => Number(x.id) || 0)) + 1 : 1; }
function safeUser(user){ const {password, ...safe} = user; return safe; }

function getUser(req){
  const id = req.headers["x-user-id"];
  if(!id) return null;
  const db = readDB();
  return db.users.find(u => String(u.id) === String(id)) || null;
}
function auth(roles=[]){
  return (req,res,next)=>{
    const user = getUser(req);
    if(!user) return res.status(401).json({message:"Silakan login terlebih dahulu."});
    if(roles.length && !roles.includes(user.role)) return res.status(403).json({message:"Akses ditolak untuk role " + user.role});
    req.user = user;
    next();
  }
}
function log(user, action, detail){
  const db = readDB();
  db.activity_logs.push({id:nextId(db.activity_logs), user_id:user?.id || null, user_name:user?.name || "Guest", role:user?.role || "guest", action, detail, timestamp:new Date().toISOString()});
  writeDB(db);
}
function joinStudent(db,s){ const c=db.classes.find(x=>x.id===s.class_id); return {...s, class_name:c?c.name:"-"}; }
function joinJournal(db,j){
  const t=db.teachers.find(x=>x.id===j.teacher_id);
  const c=db.classes.find(x=>x.id===j.class_id);
  const s=db.subjects.find(x=>x.id===j.subject_id);
  return {...j, teacher_name:t?t.name:"-", class_name:c?c.name:"-", subject_name:s?s.name:"-"};
}
function joinCase(db,b){
  const s=db.students.find(x=>x.id===b.student_id);
  const t=db.teachers.find(x=>x.id===b.teacher_id);
  return {...b, student_name:s?s.name:"-", teacher_name:t?t.name:"-"};
}

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body;
  const db=readDB();
  const user=db.users.find(u=>u.email===email && u.password===password);
  if(!user) return res.status(401).json({message:"Email atau password salah."});
  log(user,"LOGIN","Pengguna masuk ke sistem");
  res.json({user:safeUser(user)});
});

app.get("/api/dashboard",auth(),(req,res)=>{
  const db=readDB();
  res.json({
    totalStudents:db.students.length,
    totalTeachers:db.teachers.length,
    totalJournals:db.teaching_journals.length,
    totalBkCases:db.bk_cases.length,
    totalUsers:db.users.length,
    logs:db.activity_logs.slice(-8).reverse()
  });
});

app.get("/api/master",auth(),(req,res)=>{
  const db=readDB();
  res.json({roles:db.roles, teachers:db.teachers, classes:db.classes, subjects:db.subjects, students:db.students.map(s=>joinStudent(db,s))});
});

app.get("/api/students",auth(["admin","kepala","guru","bk","wali","siswa","orangtua"]),(req,res)=>{
  const db=readDB();
  let data=db.students.map(s=>joinStudent(db,s));
  if(["siswa","orangtua"].includes(req.user.role)) data=data.filter(s=>s.id===req.user.student_id);
  res.json(data);
});
app.post("/api/students",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const item={id:nextId(db.students), nis:req.body.nis, name:req.body.name, class_id:Number(req.body.class_id), status:req.body.status || "Aktif", parent_name:req.body.parent_name || "-"};
  db.students.push(item); writeDB(db); log(req.user,"CREATE_STUDENT","Menambah siswa "+item.name);
  res.json(joinStudent(db,item));
});
app.delete("/api/students/:id",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  db.students=db.students.filter(s=>s.id!==id);
  writeDB(db); log(req.user,"DELETE_STUDENT","Menghapus siswa ID "+id);
  res.json({success:true});
});

app.get("/api/journals",auth(["admin","kepala","guru","wali"]),(req,res)=>{
  const db=readDB();
  let data=db.teaching_journals.map(j=>joinJournal(db,j));
  if(req.user.role==="guru") data=data.filter(j=>j.teacher_id===req.user.teacher_id);
  res.json(data);
});
app.post("/api/journals",auth(["admin","guru"]),(req,res)=>{
  const db=readDB();
  const item={id:nextId(db.teaching_journals), teacher_id:req.user.role==="guru"?req.user.teacher_id:Number(req.body.teacher_id), class_id:Number(req.body.class_id), subject_id:Number(req.body.subject_id), date:req.body.date, material:req.body.material, method:req.body.method, notes:req.body.notes || "-"};
  db.teaching_journals.push(item); writeDB(db); log(req.user,"CREATE_JOURNAL","Mengisi jurnal mengajar");
  res.json(joinJournal(db,item));
});

app.get("/api/bk",auth(["admin","kepala","bk","wali","siswa","orangtua"]),(req,res)=>{
  const db=readDB();
  let data=db.bk_cases.map(b=>joinCase(db,b));
  if(["siswa","orangtua"].includes(req.user.role)) data=data.filter(b=>b.student_id===req.user.student_id);
  res.json(data);
});
app.post("/api/bk",auth(["admin","bk"]),(req,res)=>{
  const db=readDB();
  const item={id:nextId(db.bk_cases), student_id:Number(req.body.student_id), teacher_id:req.user.role==="bk"?req.user.teacher_id:Number(req.body.teacher_id), date:req.body.date, case_type:req.body.case_type, description:req.body.description, follow_up:req.body.follow_up, status:req.body.status || "Dipantau"};
  db.bk_cases.push(item); writeDB(db); log(req.user,"CREATE_BK_CASE","Mencatat kasus BK");
  res.json(joinCase(db,item));
});

app.get("/api/users",auth(["admin"]),(req,res)=>{
  const db=readDB(); res.json(db.users.map(safeUser));
});
app.post("/api/users",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const item={id:nextId(db.users), name:req.body.name, email:req.body.email, password:req.body.password || "password123", role:req.body.role, student_id:req.body.student_id?Number(req.body.student_id):null, teacher_id:req.body.teacher_id?Number(req.body.teacher_id):null};
  db.users.push(item); writeDB(db); log(req.user,"CREATE_USER","Menambah akun "+item.email);
  res.json(safeUser(item));
});
app.get("/api/logs",auth(["admin","kepala"]),(req,res)=>{ const db=readDB(); res.json(db.activity_logs.slice().reverse()); });

app.listen(PORT,()=>console.log(`Web Sekolah Terintegrasi berjalan di http://localhost:${PORT}`));
