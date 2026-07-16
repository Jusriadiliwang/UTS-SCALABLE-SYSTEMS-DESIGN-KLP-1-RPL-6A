const state={user:JSON.parse(localStorage.getItem("ssd_user")||"null"),page:"dashboard",master:{},editingStudent:null,editingClass:null,editingBk:null,studentsCache:[],classesCache:[],bkCache:[]};
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
  setTitle("Dashboard", "SELAMAT DATANG DI SISTEM SEKOLAH .");
  const d = await api("/api/dashboard");
  content.innerHTML = `<div class="grid cols4"><div class="card stat"><h3>Total Siswa</h3><strong>${d.totalStudents}</strong></div><div class="card stat"><h3>Total Guru</h3><strong>${d.totalTeachers}</strong></div><div class="card stat"><h3>Jurnal</h3><strong>${d.totalJournals}</strong></div><div class="card stat"><h3>Kasus BK</h3><strong>${d.totalBkCases}</strong></div></div><div class="grid cols2"><div class="card"><h3>Modul Sistem</h3><ul><li>Jurnal Mengajar</li><li>Bimbingan Konseling</li><li>Data Kesiswaan</li><li>Manajemen Pengguna</li><li>Monitoring dan Logging</li></ul></div><div class="card"><h3>Aktivitas Terbaru</h3>${table(["Waktu", "User", "Aksi"], d.logs.map(l => row([new Date(l.timestamp).toLocaleString("id-ID"), l.user_name, `<span class="badge green">${l.action}</span>`])))}</div></div>`;
}

// ===================== DATA KESISWAAN =====================
async function students(){
  setTitle("Data Kesiswaan","Data utama siswa digunakan bersama oleh modul BK, jurnal, dan akademik.");
  const data = await api("/api/students");
  const can = state.user.role === "admin";
  state.studentsCache = data;
  let clist = [];
  if(can) clist = await api("/api/classes");
  state.classesCache = clist;
  content.innerHTML = `
    ${can ? classCard(clist) : ""}
    ${can ? studentForm(clist) : `<div class="notice">Role ${state.user.role} hanya dapat melihat data sesuai hak akses.</div>`}
    ${can ? importExportCard() : ""}
    <div class="card"><h3>Daftar Siswa</h3>${table(["NIS","Nama","Kelas","Status","Orang Tua","Aksi"],data.map(s=>row([
      s.nis,
      s.name,
      s.class_name,
      `<span class="badge">${s.status}</span>`,
      s.parent_name,
      can ? `<button onclick="editStudent(${s.id})">Edit</button> <button onclick="showHistory(${s.id})">Riwayat</button> <button class="danger" onclick="delStudent(${s.id})">Hapus</button>` : "-"
    ])))}</div>
    <div id="historyPanel"></div>
  `;
  if(can){ bindStudent(); bindClass(); bindImportExport(); }
}

// --- Tambah / Edit Siswa (fitur #1, #2, #6) ---
function studentForm(clist){
  const e = state.editingStudent;
  return `<div class="card"><h3>${e?"Edit Siswa":"Tambah Siswa"}</h3><form id="studentForm" class="formgrid">
    <div><label>NIS</label><input name="nis" required value="${e?e.nis:""}"></div>
    <div><label>Nama</label><input name="name" required value="${e?e.name:""}"></div>
    <div><label>Kelas</label><select name="class_id">${clist.map(c=>`<option value="${c.id}" ${e&&e.class_id===c.id?"selected":""}>${c.name}</option>`).join("")}</select></div>
    <div><label>Status</label><select name="status">${["Aktif","Pindah","Lulus","Keluar"].map(st=>`<option ${e&&e.status===st?"selected":""}>${st}</option>`).join("")}</select></div>
    <div class="full"><label>Orang Tua</label><input name="parent_name" value="${e?e.parent_name:""}"></div>
    <div class="full"><button>${e?"Update Siswa":"Simpan Siswa"}</button>${e?` <button type="button" onclick="cancelEditStudent()">Batal</button>`:""}</div>
  </form></div>`;
}
function bindStudent(){
  document.getElementById("studentForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const body = JSON.stringify(Object.fromEntries(new FormData(e.target)));
    try{
      if(state.editingStudent){
        await api("/api/students/"+state.editingStudent.id,{method:"PUT",body});
        state.editingStudent = null;
      } else {
        await api("/api/students",{method:"POST",body});
      }
      await loadMaster();
      students();
    }catch(err){ alert(err.message); }
  });
}
async function editStudent(id){
  state.editingStudent = state.studentsCache.find(x=>x.id===id) || null;
  await students();
  document.getElementById("studentForm")?.scrollIntoView({behavior:"smooth"});
}
function cancelEditStudent(){ state.editingStudent = null; students(); }
async function delStudent(id){
  if(confirm("Hapus siswa?")){
    try{ await api("/api/students/"+id,{method:"DELETE"}); await loadMaster(); students(); }
    catch(err){ alert(err.message); }
  }
}

// --- Riwayat Data Siswa (fitur #9) ---
async function showHistory(id){
  const s = state.studentsCache.find(x=>x.id===id);
  const data = await api(`/api/students/${id}/history`);
  historyPanel.innerHTML = `<div class="card"><h3>Riwayat: ${s?s.name:("ID "+id)}</h3>${table(["Waktu","Aksi","Detail","Oleh"],data.map(l=>row([new Date(l.timestamp).toLocaleString("id-ID"),l.action,l.detail,l.user_name])))}<button type="button" onclick="historyPanel.innerHTML=''">Tutup</button></div>`;
  historyPanel.scrollIntoView({behavior:"smooth"});
}

// --- Kelola Kelas & Wali Kelas (fitur #4, #5) ---
function classCard(clist){
  const e = state.editingClass;
  return `<div class="card"><h3>Kelola Kelas & Wali Kelas</h3>
  <form id="classForm" class="formgrid">
    <div><label>Nama Kelas</label><input name="name" required value="${e?e.name:""}"></div>
    <div><label>Wali Kelas</label><select name="homeroom_teacher_id"><option value="">- Pilih -</option>${(state.master.teachers||[]).map(t=>`<option value="${t.id}" ${e&&e.homeroom_teacher_id===t.id?"selected":""}>${t.name}</option>`).join("")}</select></div>
    <div class="full"><button>${e?"Update Kelas":"Simpan Kelas"}</button>${e?` <button type="button" onclick="cancelEditClass()">Batal</button>`:""}</div>
  </form>
  ${table(["Nama Kelas","Wali Kelas","Aksi"],clist.map(c=>row([c.name,c.homeroom_teacher_name||"-",`<button onclick="editClass(${c.id})">Edit</button> <button class="danger" onclick="delClass(${c.id})">Hapus</button>`])))}
  </div>`;
}
function bindClass(){
  document.getElementById("classForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const body = JSON.stringify(Object.fromEntries(new FormData(e.target)));
    try{
      if(state.editingClass){
        await api("/api/classes/"+state.editingClass.id,{method:"PUT",body});
        state.editingClass = null;
      } else {
        await api("/api/classes",{method:"POST",body});
      }
      await loadMaster();
      students();
    }catch(err){ alert(err.message); }
  });
}
async function editClass(id){
  state.editingClass = state.classesCache.find(x=>x.id===id) || null;
  await students();
  document.getElementById("classForm")?.scrollIntoView({behavior:"smooth"});
}
function cancelEditClass(){ state.editingClass = null; students(); }
async function delClass(id){
  if(confirm("Hapus kelas ini?")){
    try{ await api("/api/classes/"+id,{method:"DELETE"}); await loadMaster(); students(); }
    catch(err){ alert(err.message); }
  }
}

// --- Import / Export CSV (fitur #7, #8) ---
function importExportCard(){
  return `<div class="card"><h3>Import / Export Data Siswa</h3>
  <div class="formgrid">
    <div><label>Import dari CSV</label><input type="file" id="importFile" accept=".csv"></div>
    <div class="full"><button type="button" id="importBtn">Import CSV</button> <button type="button" id="exportBtn" class="gray">Export CSV</button></div>
  </div>
  <p>Format CSV: <code>NIS,Nama,Kelas,Status,Orang Tua</code> (baris pertama header, nama kelas harus sama persis dengan yang ada di sistem).</p>
  </div>`;
}
function bindImportExport(){
  document.getElementById("importBtn").onclick = async ()=>{
    const file = document.getElementById("importFile").files[0];
    if(!file) return alert("Pilih file CSV terlebih dahulu.");
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length);
    if(lines.length < 2) return alert("File CSV kosong atau tidak ada data.");
    const header = lines[0].split(",").map(x=>x.trim().toLowerCase());
    const rows = lines.slice(1).map(line=>{
      const cols = line.split(",").map(c=>c.trim());
      const obj = {};
      header.forEach((hd,i)=>{
        if(hd.includes("nis")) obj.nis = cols[i];
        else if(hd.includes("nama")) obj.name = cols[i];
        else if(hd.includes("kelas")) obj.class_name = cols[i];
        else if(hd.includes("status")) obj.status = cols[i];
        else if(hd.includes("orang")) obj.parent_name = cols[i];
      });
      return obj;
    });
    try{
      const res = await api("/api/students/import",{method:"POST",body:JSON.stringify({rows})});
      alert(`${res.count} siswa berhasil diimport.`);
      document.getElementById("importFile").value = "";
      await loadMaster();
      students();
    }catch(err){ alert(err.message); }
  };
  document.getElementById("exportBtn").onclick = async ()=>{
    try{
      const r = await fetch("/api/students/export",{headers:h()});
      if(!r.ok) throw new Error("Gagal mengekspor data.");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "data-siswa.csv"; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }catch(err){ alert(err.message); }
  };
}

async function journals(){
  setTitle("Jurnal Mengajar","Guru mengisi aktivitas pembelajaran.");
  const data = await api("/api/journals");
  const can = ["guru","admin"].includes(state.user.role);
  content.innerHTML = `
    ${can ? journalForm() : `<div class="notice">Role ${state.user.role} hanya dapat melihat rekap jurnal.</div>`}
    <div class="card"><h3>Rekap Jurnal</h3><button type="button" id="journalRekapBtn">Tampilkan Rekap per Guru & per Kelas</button><div id="journalRekapPanel"></div></div>
    <div class="card"><h3>Riwayat Jurnal</h3>${table(["Tanggal","Guru","Kelas","Mapel","Materi","Metode","Catatan"],data.map(j=>row([j.date,j.teacher_name,j.class_name,j.subject_name,j.material,j.method,j.notes])))}</div>
  `;
  if(can)bindJournal();
  bindJournalRekap();
}
function bindJournalRekap(){
  document.getElementById("journalRekapBtn").onclick = async ()=>{
    const r = await api("/api/journals/recap");
    journalRekapPanel.innerHTML = `
      <h4>Rekap per Guru</h4>
      ${table(["Guru","Total Jurnal"],r.perTeacher.map(t=>row([t.teacher_name,t.total])))}
      <h4>Rekap per Kelas</h4>
      ${table(["Kelas","Total Jurnal"],r.perClass.map(c=>row([c.class_name,c.total])))}
    `;
    journalRekapPanel.scrollIntoView({behavior:"smooth"});
  };
}
function journalForm(){return `<div class="card"><h3>Input Jurnal</h3><form id="journalForm" class="formgrid"><div><label>Kelas</label><select name="class_id">${state.master.classes.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select></div><div><label>Mapel</label><select name="subject_id">${state.master.subjects.map(s=>`<option value="${s.id}">${s.name}</option>`)}</select></div><div><label>Tanggal</label><input type="date" name="date" required></div><div><label>Metode</label><input name="method" required></div><div class="full"><label>Materi</label><textarea name="material" required></textarea></div><div class="full"><label>Catatan</label><textarea name="notes"></textarea></div><div class="full"><button>Simpan Jurnal</button></div></form></div>`}
function bindJournal(){
  document.getElementById("journalForm").addEventListener("submit", async e=>{
    e.preventDefault();
    await api("/api/journals",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
    journals()
  })
}
// ===================== BIMBINGAN KONSELING (BK) =====================
async function bk(){
  setTitle("Bimbingan Konseling","Data BK dibatasi berdasarkan role pengguna.");
  const data = await api("/api/bk");
  const can = ["bk","admin"].includes(state.user.role);
  state.bkCache = data;
  content.innerHTML = `
    ${can ? bkSearchCard() : ""}
    ${can ? bkForm() : `<div class="notice">Data BK bersifat sensitif dan akses dibatasi.</div>`}
    ${can ? `<div class="card"><h3>Rekap Kasus BK</h3><button type="button" id="rekapBtn">Tampilkan Rekap per Siswa & per Kelas</button><div id="rekapPanel"></div></div>` : ""}
    <div class="card"><h3>Riwayat BK (Semua)</h3>${table(["Tanggal","Siswa","Guru BK","Jenis","Deskripsi","Tindak Lanjut","Status","Aksi"],data.map(b=>row([
      b.date,b.student_name,b.teacher_name,b.case_type,b.description,b.follow_up,`<span class="badge">${b.status}</span>`,
      can ? `<button onclick="editBk(${b.id})">Edit</button>` : "-"
    ])))}</div>
    <div id="bkStudentHistory"></div>
  `;
  if(can){ bindBk(); bindBkSearch(); bindRekap(); }
}

// --- Cari Data Siswa + Riwayat Pembinaan (fitur #2, #7) ---
function bkSearchCard(){
  return `<div class="card"><h3>Cari Data Siswa</h3>
    <input type="text" id="bkSearchInput" placeholder="Ketik nama atau NIS siswa...">
    <div id="bkSearchResult"></div>
  </div>`;
}
function bindBkSearch(){
  document.getElementById("bkSearchInput").addEventListener("input", e=>{
    const q = e.target.value.trim().toLowerCase();
    const result = document.getElementById("bkSearchResult");
    if(!q){ result.innerHTML=""; return; }
    const matches = (state.master.students||[]).filter(s=>s.name.toLowerCase().includes(q) || String(s.nis).toLowerCase().includes(q));
    result.innerHTML = matches.length
      ? table(["NIS","Nama","Kelas","Aksi"], matches.map(s=>row([s.nis,s.name,s.class_name,`<button onclick="showBkStudentHistory(${s.id})">Lihat Riwayat Pembinaan</button>`])))
      : "<p>Siswa tidak ditemukan.</p>";
  });
}
async function showBkStudentHistory(id){
  const s = (state.master.students||[]).find(x=>x.id===id);
  const data = await api(`/api/bk/student/${id}`);
  bkStudentHistory.innerHTML = `<div class="card"><h3>Riwayat Pembinaan: ${s?s.name:("ID "+id)}</h3>${table(["Tanggal","Jenis","Deskripsi","Tindak Lanjut","Status"],data.map(b=>row([b.date,b.case_type,b.description,b.follow_up,`<span class="badge">${b.status}</span>`])))}<button type="button" onclick="bkStudentHistory.innerHTML=''">Tutup</button></div>`;
  bkStudentHistory.scrollIntoView({behavior:"smooth"});
}

// --- Input & Edit Catatan BK: Konseling, Pelanggaran, Prestasi, Tindak Lanjut (fitur #3, #4, #5, #6) ---
function bkForm(){
  const e = state.editingBk;
  const studentField = e
    ? `<input type="hidden" name="student_id" value="${e.student_id}"><input type="text" value="${e.student_name} - ${e.class_name||""}" disabled>`
    : `<select name="student_id">${state.master.students.map(s=>`<option value="${s.id}">${s.name} - ${s.class_name}</option>`)}</select>`;
  return `<div class="card"><h3>${e?"Edit Catatan BK":"Input Catatan BK"}</h3><form id="bkForm" class="formgrid">
    <div><label>Siswa</label>${studentField}</div>
    <div><label>Tanggal</label><input type="date" name="date" required value="${e?e.date:""}"></div>
    <div><label>Jenis</label><select name="case_type">${["Konseling","Pelanggaran","Prestasi","Tindak Lanjut"].map(ct=>`<option ${e&&e.case_type===ct?"selected":""}>${ct}</option>`).join("")}</select></div>
    <div><label>Status</label><select name="status">${["Dipantau","Selesai","Butuh Tindak Lanjut"].map(st=>`<option ${e&&e.status===st?"selected":""}>${st}</option>`).join("")}</select></div>
    <div class="full"><label>Deskripsi</label><textarea name="description" required>${e?e.description:""}</textarea></div>
    <div class="full"><label>Tindak Lanjut</label><textarea name="follow_up" required>${e?e.follow_up:""}</textarea></div>
    <div class="full"><button>${e?"Update Catatan":"Simpan BK"}</button>${e?` <button type="button" onclick="cancelEditBk()">Batal</button>`:""}</div>
  </form></div>`;
}
function bindBk(){
  document.getElementById("bkForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const body = JSON.stringify(Object.fromEntries(new FormData(e.target)));
    try{
      if(state.editingBk){
        await api("/api/bk/"+state.editingBk.id,{method:"PUT",body});
        state.editingBk = null;
      } else {
        await api("/api/bk",{method:"POST",body});
      }
      bk();
    }catch(err){ alert(err.message); }
  });
}
async function editBk(id){
  state.editingBk = state.bkCache.find(x=>x.id===id) || null;
  await bk();
  document.getElementById("bkForm")?.scrollIntoView({behavior:"smooth"});
}
function cancelEditBk(){ state.editingBk = null; bk(); }

// --- Rekap Kasus BK per Siswa / per Kelas (fitur #8) ---
function bindRekap(){
  document.getElementById("rekapBtn").onclick = async ()=>{
    const r = await api("/api/bk/recap");
    rekapPanel.innerHTML = `
      <h4>Rekap per Siswa</h4>
      ${table(["Siswa","Kelas","Total","Konseling","Pelanggaran","Prestasi","Tindak Lanjut"],r.perStudent.map(s=>row([s.student_name,s.class_name,s.total,s.konseling,s.pelanggaran,s.prestasi,s.tindak_lanjut])))}
      <h4>Rekap per Kelas</h4>
      ${table(["Kelas","Total","Konseling","Pelanggaran","Prestasi","Tindak Lanjut"],r.perClass.map(c=>row([c.class_name,c.total,c.konseling,c.pelanggaran,c.prestasi,c.tindak_lanjut])))}
    `;
    rekapPanel.scrollIntoView({behavior:"smooth"});
  };
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