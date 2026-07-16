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
// Ditambahkan parameter student_id (opsional) agar log bisa difilter per siswa untuk fitur "Riwayat Data Siswa"
function log(user, action, detail, student_id=null){
  const db = readDB();
  db.activity_logs.push({id:nextId(db.activity_logs), user_id:user?.id || null, user_name:user?.name || "Guest", role:user?.role || "guest", action, detail, student_id, timestamp:new Date().toISOString()});
  writeDB(db);
}
function joinStudent(db,s){ const c=db.classes.find(x=>x.id===s.class_id); return {...s, class_name:c?c.name:"-"}; }
function joinClass(db,c){ const t=db.teachers.find(x=>x.id===c.homeroom_teacher_id); return {...c, homeroom_teacher_name:t?t.name:"-"}; }
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
  res.json({roles:db.roles, teachers:db.teachers, classes:db.classes.map(c=>joinClass(db,c)), subjects:db.subjects, students:db.students.map(s=>joinStudent(db,s))});
});

// ===================== STUDENTS =====================
app.get("/api/students",auth(["admin","kepala","guru","bk","wali","siswa","orangtua"]),(req,res)=>{
  const db=readDB();
  let data=db.students.map(s=>joinStudent(db,s));
  if(["siswa","orangtua"].includes(req.user.role)) data=data.filter(s=>s.id===req.user.student_id);
  res.json(data);
});
app.post("/api/students",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const item={id:nextId(db.students), nis:req.body.nis, name:req.body.name, class_id:Number(req.body.class_id), status:req.body.status || "Aktif", parent_name:req.body.parent_name || "-"};
  db.students.push(item); writeDB(db); log(req.user,"CREATE_STUDENT","Menambah siswa "+item.name, item.id);
  res.json(joinStudent(db,item));
});
// BARU: Ubah data siswa (fitur #2 dan #6 - kelola status, karena status ikut diubah lewat sini)
app.put("/api/students/:id",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  const idx=db.students.findIndex(s=>s.id===id);
  if(idx===-1) return res.status(404).json({message:"Siswa tidak ditemukan."});
  db.students[idx]={
    ...db.students[idx],
    nis: req.body.nis ?? db.students[idx].nis,
    name: req.body.name ?? db.students[idx].name,
    class_id: req.body.class_id!==undefined ? Number(req.body.class_id) : db.students[idx].class_id,
    status: req.body.status ?? db.students[idx].status,
    parent_name: req.body.parent_name ?? db.students[idx].parent_name,
  };
  writeDB(db); log(req.user,"UPDATE_STUDENT","Mengubah data siswa "+db.students[idx].name, id);
  res.json(joinStudent(db,db.students[idx]));
});
app.delete("/api/students/:id",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  const target=db.students.find(s=>s.id===id);
  db.students=db.students.filter(s=>s.id!==id);
  writeDB(db); log(req.user,"DELETE_STUDENT","Menghapus siswa "+(target?target.name:("ID "+id)), id);
  res.json({success:true});
});
// BARU: Import data siswa dari CSV (fitur #7). Frontend mengirim array baris hasil parsing CSV.
app.post("/api/students/import",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  let count = 0;
  const importedIds = [];
  rows.forEach(r=>{
    if(!r.nis || !r.name) return;
    const cls = db.classes.find(c=>c.name && r.class_name && c.name.toLowerCase()===String(r.class_name).toLowerCase());
    const item = {
      id: nextId(db.students),
      nis: r.nis,
      name: r.name,
      class_id: cls ? cls.id : (db.classes[0] ? db.classes[0].id : null),
      status: r.status || "Aktif",
      parent_name: r.parent_name || "-"
    };
    db.students.push(item);
    importedIds.push(item.id);
    count++;
  });
  writeDB(db);
  log(req.user,"IMPORT_STUDENTS",`Import ${count} siswa dari CSV`);
  res.json({success:true, count, importedIds});
});
// BARU: Export data siswa ke CSV (fitur #8)
app.get("/api/students/export",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const header = "NIS,Nama,Kelas,Status,Orang Tua";
  const esc = v => `"${String(v ?? "-").replace(/"/g,'""')}"`;
  const lines = db.students.map(s=>{
    const c = db.classes.find(x=>x.id===s.class_id);
    return [s.nis, s.name, c?c.name:"-", s.status, s.parent_name].map(esc).join(",");
  });
  const csv = [header, ...lines].join("\n");
  log(req.user,"EXPORT_STUDENTS","Mengekspor data siswa ke CSV");
  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition","attachment; filename=data-siswa.csv");
  res.send(csv);
});
// BARU: Riwayat perubahan data satu siswa (fitur #9)
app.get("/api/students/:id/history",auth(["admin","kepala","wali"]),(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  const data = db.activity_logs.filter(l=>l.student_id===id).slice().reverse();
  res.json(data);
});

// ===================== CLASSES & WALI KELAS =====================
// BARU: Kelola data kelas + wali kelas (fitur #4 dan #5)
app.get("/api/classes",auth(["admin","kepala","guru","bk","wali"]),(req,res)=>{
  const db=readDB();
  res.json(db.classes.map(c=>joinClass(db,c)));
});
app.post("/api/classes",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const item={id:nextId(db.classes), name:req.body.name, homeroom_teacher_id: req.body.homeroom_teacher_id ? Number(req.body.homeroom_teacher_id) : null};
  db.classes.push(item); writeDB(db); log(req.user,"CREATE_CLASS","Menambah kelas "+item.name);
  res.json(joinClass(db,item));
});
app.put("/api/classes/:id",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  const idx=db.classes.findIndex(c=>c.id===id);
  if(idx===-1) return res.status(404).json({message:"Kelas tidak ditemukan."});
  db.classes[idx]={
    ...db.classes[idx],
    name: req.body.name ?? db.classes[idx].name,
    homeroom_teacher_id: req.body.homeroom_teacher_id!==undefined ? (req.body.homeroom_teacher_id ? Number(req.body.homeroom_teacher_id) : null) : db.classes[idx].homeroom_teacher_id
  };
  writeDB(db); log(req.user,"UPDATE_CLASS","Mengubah data kelas "+db.classes[idx].name);
  res.json(joinClass(db,db.classes[idx]));
});
app.delete("/api/classes/:id",auth(["admin"]),(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  const used = db.students.some(s=>s.class_id===id);
  if(used) return res.status(400).json({message:"Kelas masih dipakai oleh siswa, tidak bisa dihapus."});
  const target = db.classes.find(c=>c.id===id);
  db.classes=db.classes.filter(c=>c.id!==id);
  writeDB(db); log(req.user,"DELETE_CLASS","Menghapus kelas "+(target?target.name:("ID "+id)));
  res.json({success:true});
});

app.get("/api/journals",auth(["admin","kepala","guru","wali"]),(req,res)=>{
  const db=readDB();
  let data=db.teaching_journals.map(j=>joinJournal(db,j));
  if(req.user.role==="guru") data=data.filter(j=>j.teacher_id===req.user.teacher_id);
  res.json(data.reverse()); // fitur #9: riwayat ditampilkan terbaru lebih dulu
});
app.post("/api/journals",auth(["admin","guru"]),(req,res)=>{
  const db=readDB();
  const item={id:nextId(db.teaching_journals), teacher_id:req.user.role==="guru"?req.user.teacher_id:Number(req.body.teacher_id), class_id:Number(req.body.class_id), subject_id:Number(req.body.subject_id), date:req.body.date, material:req.body.material, method:req.body.method, notes:req.body.notes || "-"};
  db.teaching_journals.push(item); writeDB(db); log(req.user,"CREATE_JOURNAL","Mengisi jurnal mengajar kelas ID "+item.class_id);
  res.json(joinJournal(db,item));
});
// BARU: Rekap jurnal per guru dan per kelas (fitur #10)
app.get("/api/journals/recap",auth(["admin","kepala","guru","wali"]),(req,res)=>{
  const db=readDB();
  const perTeacher = db.teachers.map(t=>{
    const j = db.teaching_journals.filter(x=>x.teacher_id===t.id);
    return {teacher_id:t.id, teacher_name:t.name, total:j.length};
  }).filter(x=>x.total>0);
  const perClass = db.classes.map(c=>{
    const j = db.teaching_journals.filter(x=>x.class_id===c.id);
    return {class_id:c.id, class_name:c.name, total:j.length};
  });
  res.json({perTeacher, perClass});
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
  db.bk_cases.push(item); writeDB(db); log(req.user,"CREATE_BK_CASE","Mencatat kasus BK ("+item.case_type+") untuk siswa ID "+item.student_id, item.student_id);
  res.json(joinCase(db,item));
});
// BARU: Ubah/lengkapi catatan BK (mis. menambah/mengubah tindak lanjut & status setelah kasus dibuat) (fitur #6)
app.put("/api/bk/:id",auth(["admin","bk"]),(req,res)=>{
  const db=readDB();
  const id=Number(req.params.id);
  const idx=db.bk_cases.findIndex(b=>b.id===id);
  if(idx===-1) return res.status(404).json({message:"Data BK tidak ditemukan."});
  db.bk_cases[idx]={
    ...db.bk_cases[idx],
    date: req.body.date ?? db.bk_cases[idx].date,
    case_type: req.body.case_type ?? db.bk_cases[idx].case_type,
    description: req.body.description ?? db.bk_cases[idx].description,
    follow_up: req.body.follow_up ?? db.bk_cases[idx].follow_up,
    status: req.body.status ?? db.bk_cases[idx].status,
  };
  writeDB(db);
  log(req.user,"UPDATE_BK_CASE","Mengubah catatan BK untuk siswa ID "+db.bk_cases[idx].student_id, db.bk_cases[idx].student_id);
  res.json(joinCase(db,db.bk_cases[idx]));
});
// BARU: Riwayat pembinaan satu siswa (fitur #7). Dipakai bersama fitur "Cari data siswa" (fitur #2) di frontend.
app.get("/api/bk/student/:studentId",auth(["admin","kepala","bk","wali","siswa","orangtua"]),(req,res)=>{
  const db=readDB();
  const sid=Number(req.params.studentId);
  if(["siswa","orangtua"].includes(req.user.role) && req.user.student_id!==sid) return res.status(403).json({message:"Akses ditolak."});
  const data = db.bk_cases.filter(b=>b.student_id===sid).map(b=>joinCase(db,b)).reverse();
  res.json(data);
});
// BARU: Rekap kasus BK per siswa dan per kelas (fitur #8)
app.get("/api/bk/recap",auth(["admin","kepala","bk","wali"]),(req,res)=>{
  const db=readDB();
  const countBy = cases => ({
    total: cases.length,
    konseling: cases.filter(x=>x.case_type==="Konseling").length,
    pelanggaran: cases.filter(x=>x.case_type==="Pelanggaran").length,
    prestasi: cases.filter(x=>x.case_type==="Prestasi").length,
    tindak_lanjut: cases.filter(x=>x.case_type==="Tindak Lanjut").length,
  });
  const perStudent = db.students.map(s=>{
    const c = db.classes.find(x=>x.id===s.class_id);
    const cases = db.bk_cases.filter(b=>b.student_id===s.id);
    return {student_id:s.id, student_name:s.name, class_name:c?c.name:"-", ...countBy(cases)};
  }).filter(x=>x.total>0);
  const perClass = db.classes.map(c=>{
    const studentIds = db.students.filter(s=>s.class_id===c.id).map(s=>s.id);
    const cases = db.bk_cases.filter(b=>studentIds.includes(b.student_id));
    return {class_id:c.id, class_name:c.name, ...countBy(cases)};
  });
  res.json({perStudent, perClass});
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
