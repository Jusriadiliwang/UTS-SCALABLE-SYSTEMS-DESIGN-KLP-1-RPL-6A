const state={user:JSON.parse(localStorage.getItem("ssd_user")||"null"),page:"dashboard",master:{}};
const menus={admin:["dashboard","students","journals","bk","users","logs","architecture"],kepala:["dashboard","students","journals","bk","logs","architecture"],guru:["dashboard","students","journals","architecture"],bk:["dashboard","students","bk","architecture"],wali:["dashboard","students","journals","bk","architecture"],siswa:["dashboard","students","bk"],orangtua:["dashboard","students","bk"]};
const labels={dashboard:"Dashboard",students:"Data Kesiswaan",journals:"Jurnal Mengajar",bk:"Bimbingan Konseling",users:"Manajemen Pengguna",logs:"Monitoring & Logging",architecture:"Scalable Design"};
function h(){return {"Content-Type":"application/json","x-user-id":state.user?.id||""}}
async function api(url,opt={}){const r=await fetch(url,{...opt,headers:{...h(),...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Error");return d}
function setTitle(t,s){title.textContent=t;subtitle.textContent=s||""}
function row(cols){return "<tr>"+cols.map(c=>`<td>${c}</td>`).join("")+"</tr>"}
function table(head,rows){return `<div class="wrap"><table><thead><tr>${head.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.join(""):`<tr><td colspan="${head.length}">Belum ada data.</td></tr>`}</tbody></table></div>`}
async function loadMaster(){state.master=await api("/api/master")}
function renderMenu(){menu.innerHTML=(menus[state.user.role]||["dashboard"]).map(m=>`<button class="${state.page===m?"active":""}" onclick="render('${m}')">${labels[m]}</button>`).join("")}
async function showApp(){loginPage.classList.add("hidden");mainApp.classList.remove("hidden");userText.textContent=`${state.user.name} (${state.user.role})`;roleText.textContent="Role: "+state.user.role;await loadMaster();render("dashboard")}
function showLogin(){loginPage.classList.remove("hidden");mainApp.classList.add("hidden")}
async function render(p) {
  state.page = p;
  renderMenu();

  // Baris baru: Memberi tahu CSS modul apa yang sedang aktif
  document.body.setAttribute("data-modul", p);

  if(p === "dashboard") return dashboard();
  if(p === "students") return students();
  if(p === "journals") return journals();
  if(p === "bk") return bk();
  if(p === "users") return users();
  if(p === "logs") return logs();
  if(p === "architecture") return architecture();
}
async function dashboard() {
  setTitle("Dashboard", "Ringkasan sistem sekolah terintegrasi.");
  const d = await api("/api/dashboard");
  content.innerHTML = `<div class="grid cols4"><div class="card stat"><h3>Total Siswa</h3><strong>${d.totalStudents}</strong></div><div class="card stat"><h3>Total Guru</h3><strong>${d.totalTeachers}</strong></div><div class="card stat"><h3>Jurnal</h3><strong>${d.totalJournals}</strong></div><div class="card stat"><h3>Kasus BK</h3><strong>${d.totalBkCases}</strong></div></div><div class="grid cols2"><div class="card"><h3>Modul Sistem</h3><ul><li>Jurnal Mengajar</li><li>Bimbingan Konseling</li><li>Data Kesiswaan</li><li>Manajemen Pengguna</li><li>Monitoring dan Logging</li></ul></div><div class="card"><h3>Aktivitas Terbaru</h3>${table(["Waktu", "User", "Aksi"], d.logs.map(l => row([new Date(l.timestamp).toLocaleString("id-ID"), l.user_name, `<span class="badge green">${l.action}</span>`])))}</div></div>`;
}
async function students(){setTitle("Data Kesiswaan","Data utama siswa digunakan bersama oleh modul BK, jurnal, dan akademik.");const data=await api("/api/students");const can=state.user.role==="admin";content.innerHTML=`${can?studentForm():`<div class="notice">Role ${state.user.role} hanya dapat melihat data sesuai hak akses.</div>`}<div class="card"><h3>Daftar Siswa</h3>${table(["NIS","Nama","Kelas","Status","Orang Tua","Aksi"],data.map(s=>row([s.nis,s.name,s.class_name,`<span class="badge">${s.status}</span>`,s.parent_name,can?`<button class="danger" onclick="delStudent(${s.id})">Hapus</button>`:"-"])))}</div>`;if(can)bindStudent()}
function studentForm(){return `<div class="card"><h3>Tambah Siswa</h3><form id="studentForm" class="formgrid"><div><label>NIS</label><input name="nis" required></div><div><label>Nama</label><input name="name" required></div><div><label>Kelas</label><select name="class_id">${state.master.classes.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select></div><div><label>Status</label><select name="status"><option>Aktif</option><option>Pindah</option><option>Lulus</option><option>Keluar</option></select></div><div class="full"><label>Orang Tua</label><input name="parent_name"></div><div class="full"><button>Simpan Siswa</button></div></form></div>`}
function bindStudent(){
  document.getElementById("studentForm").addEventListener("submit", async e=>{
    e.preventDefault();
    await api("/api/students",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
    await loadMaster();
    students()
  })
}
async function delStudent(id){if(confirm("Hapus siswa?")){await api("/api/students/"+id,{method:"DELETE"});await loadMaster();students()}}
async function journals(){setTitle("Jurnal Mengajar","Guru mengisi aktivitas pembelajaran.");const data=await api("/api/journals");const can=["guru","admin"].includes(state.user.role);content.innerHTML=`${can?journalForm():`<div class="notice">Role ${state.user.role} hanya dapat melihat rekap jurnal.</div>`}<div class="card"><h3>Riwayat Jurnal</h3>${table(["Tanggal","Guru","Kelas","Mapel","Materi","Metode","Catatan"],data.map(j=>row([j.date,j.teacher_name,j.class_name,j.subject_name,j.material,j.method,j.notes])))}</div>`;if(can)bindJournal()}
function journalForm(){return `<div class="card"><h3>Input Jurnal</h3><form id="journalForm" class="formgrid"><div><label>Kelas</label><select name="class_id">${state.master.classes.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select></div><div><label>Mapel</label><select name="subject_id">${state.master.subjects.map(s=>`<option value="${s.id}">${s.name}</option>`)}</select></div><div><label>Tanggal</label><input type="date" name="date" required></div><div><label>Metode</label><input name="method" required></div><div class="full"><label>Materi</label><textarea name="material" required></textarea></div><div class="full"><label>Catatan</label><textarea name="notes"></textarea></div><div class="full"><button>Simpan Jurnal</button></div></form></div>`}
function bindJournal(){
  document.getElementById("journalForm").addEventListener("submit", async e=>{
    e.preventDefault();
    await api("/api/journals",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
    journals()
  })
}
async function bk(){setTitle("Bimbingan Konseling","Data BK dibatasi berdasarkan role pengguna.");const data=await api("/api/bk");const can=["bk","admin"].includes(state.user.role);content.innerHTML=`${can?bkForm():`<div class="notice">Data BK bersifat sensitif dan akses dibatasi.</div>`}<div class="card"><h3>Riwayat BK</h3>${table(["Tanggal","Siswa","Guru BK","Jenis","Deskripsi","Tindak Lanjut","Status"],data.map(b=>row([b.date,b.student_name,b.teacher_name,b.case_type,b.description,b.follow_up,`<span class="badge">${b.status}</span>`])))}</div>`;if(can)bindBK()}
function bkForm(){return `<div class="card"><h3>Input Catatan BK</h3><form id="bkForm" class="formgrid"><div><label>Siswa</label><select name="student_id">${state.master.students.map(s=>`<option value="${s.id}">${s.name} - ${s.class_name}</option>`)}</select></div><div><label>Tanggal</label><input type="date" name="date" required></div><div><label>Jenis</label><select name="case_type"><option>Konseling</option><option>Pelanggaran</option><option>Prestasi</option><option>Tindak Lanjut</option></select></div><div><label>Status</label><select name="status"><option>Dipantau</option><option>Selesai</option><option>Butuh Tindak Lanjut</option></select></div><div class="full"><label>Deskripsi</label><textarea name="description" required></textarea></div><div class="full"><label>Tindak Lanjut</label><textarea name="follow_up" required></textarea></div><div class="full"><button>Simpan BK</button></div></form></div>`}
function bindBK(){
  document.getElementById("bkForm").addEventListener("submit", async e=>{
    e.preventDefault();
    await api("/api/bk",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
    bk()
  })
}
async function users(){setTitle("Manajemen Pengguna","Admin mengelola akun dan role.");const data=await api("/api/users");content.innerHTML=`<div class="card"><h3>Tambah Akun</h3><form id="userForm" class="formgrid"><div><label>Nama</label><input name="name" required></div><div><label>Email</label><input type="email" name="email" required></div><div><label>Password</label><input name="password" value="password123"></div><div><label>Role</label><select name="role">${state.master.roles.map(r=>`<option value="${r.name}">${r.label}</option>`)}</select></div><div><label>Student ID</label><input type="number" name="student_id"></div><div><label>Teacher ID</label><input type="number" name="teacher_id"></div><div class="full"><button>Simpan Akun</button></div></form></div><div class="card"><h3>Daftar User</h3>${table(["Nama","Email","Role"],data.map(u=>row([u.name,u.email,`<span class="badge">${u.role}</span>`])))}</div>`;document.getElementById("userForm").addEventListener("submit",async e=>{e.preventDefault();await api("/api/users",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});users()})}
async function logs(){setTitle("Monitoring & Logging","Mencatat aktivitas pengguna dan perubahan data.");const data=await api("/api/logs");content.innerHTML=`<div class="card"><h3>Activity Log</h3>${table(["Waktu","Nama","Role","Aksi","Detail"],data.map(l=>row([new Date(l.timestamp).toLocaleString("id-ID"),l.user_name,l.role,l.action,l.detail])))}</div>`}
function architecture(){setTitle("Scalable System Design","Rancangan arsitektur, vCPU, scaling, keamanan, dan optimasi.");content.innerHTML=`<div class="card"><h3>Arsitektur</h3><div class="architecture">User / Browser
  ↓
Load Balancer / Nginx
  ↓
vCPU 1: Modul Jurnal Mengajar
vCPU 2: Modul BK
vCPU 3: Modul Data Kesiswaan
vCPU 4: Akademik & User Service
  ↓
API Gateway / Express API
  ↓
vCPU 5: Centralized Database
  ↓
vCPU 6: Backup, Monitoring, Logging</div></div><div class="grid cols2"><div class="card"><h3>Strategi Scaling</h3><ul><li>Horizontal scaling untuk modul yang ramai.</li><li>Vertical scaling untuk database server.</li><li>Caching data kelas, guru, mapel, dan jadwal.</li><li>Index pada student_id, teacher_id, class_id, subject_id.</li></ul></div><div class="card"><h3>Keamanan</h3><ul><li>Role-based access control.</li><li>Data BK dibatasi.</li><li>Activity log untuk audit.</li><li>Data dummy, bukan data asli.</li></ul></div></div>`}
loginForm.addEventListener("submit",async e=>{e.preventDefault();try{const d=await api("/api/login",{method:"POST",body:JSON.stringify({email:email.value,password:password.value})});state.user=d.user;localStorage.setItem("ssd_user",JSON.stringify(d.user));showApp()}catch(err){alert(err.message)}})
document.querySelectorAll(".demo button").forEach(b=>b.onclick=()=>{email.value=b.dataset.email;password.value="password123"})
logoutBtn.onclick=()=>{localStorage.removeItem("ssd_user");state.user=null;showLogin()}
state.user?showApp():showLogin()