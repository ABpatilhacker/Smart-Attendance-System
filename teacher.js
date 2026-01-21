/***********************
 🔥 FIREBASE CONFIG
************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/***********************
 🔐 AUTH CHECK
************************/
let teacherId = null;
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "login.html";
  else {
    teacherId = user.uid;
    loadTeacherInfo();
    loadClasses();
  }
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

/***********************
 SIDEBAR TOGGLE
************************/
const sidebar = document.getElementById("sidebar");
function toggleSidebar() { sidebar.classList.toggle("open"); }
document.addEventListener("click", e => {
  if (!sidebar.contains(e.target) && !e.target.classList.contains("menu-btn")) {
    sidebar.classList.remove("open");
  }
});

/***********************
 PAGE ROUTING
************************/
function openSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const section = document.getElementById(id);
  if(section) section.classList.add("active");
}

/***********************
 TEACHER INFO
************************/
function loadTeacherInfo() {
  db.ref("users/" + teacherId).once("value").then(snap => {
    const t = snap.val();
    document.getElementById("teacherNameDisplay").innerText = t.name;
    document.getElementById("profileName").value = t.name;
    document.getElementById("profileEmail").value = t.email;
  });
}

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  if(!name) return toast("Name cannot be empty ⚠️");
  db.ref("users/" + teacherId).update({name}).then(() => toast("Profile updated ✅"));
}

/***********************
 CLASSES & SUBJECTS
************************/
function loadClasses() {
  const classSelect = document.getElementById("attendanceClass");
  const classCards = document.getElementById("classCards");
  if(classSelect) classSelect.innerHTML = "";
  if(classCards) classCards.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(c => {
      const classData = c.val();
      const classId = c.key;

      // Fill class select for attendance
      if(classSelect){
        const opt = document.createElement("option");
        opt.value = classId;
        opt.textContent = classData.name;
        classSelect.appendChild(opt);
      }

      // Class cards
      if(classCards){
        const card = document.createElement("div");
        card.className = "card ripple";
        card.innerHTML = `<h3>${classData.name}</h3><p>Click to take attendance</p>`;
        card.onclick = () => { openSection('attendance'); document.getElementById("attendanceClass").value=classId; loadAttendanceSubjects(); };
        classCards.appendChild(card);
      }
    });
    loadAttendanceSubjects();
  });
}

// Load subjects assigned to this teacher for the selected class
function loadAttendanceSubjects() {
  const classId = document.getElementById("attendanceClass").value;
  const subSelect = document.getElementById("attendanceSubject");
  subSelect.innerHTML = "";
  if(!classId) return;

  db.ref("classes/" + classId + "/subjects").once("value").then(snap=>{
    snap.forEach(s=>{
      if(s.val().teacherId === teacherId){
        const opt = document.createElement("option");
        opt.value = s.key;
        opt.textContent = s.val().name;
        subSelect.appendChild(opt);
      }
    });
  });
}

/***********************
 ATTENDANCE TABLE
************************/
let attendanceState = {}; // key=studentId, value='present'/'absent'

function loadAttendanceTable() {
  const classId = document.getElementById("attendanceClass").value;
  const subjectId = document.getElementById("attendanceSubject").value;
  if(!classId || !subjectId) return toast("Select class and subject ⚠️");

  db.ref("classes/" + classId + "/students").once("value").then(snap=>{
    const wrapper = document.getElementById("attendanceTableWrapper");
    wrapper.innerHTML = "";

    const table = document.createElement("table");
    table.innerHTML = `<tr><th>Roll No</th><th>Name</th><th>Present</th><th>Absent</th></tr>`;
    attendanceState = {};

    let students = [];
    snap.forEach(s => students.push({id:s.key,...s.val()}));
    students.sort((a,b)=>a.roll-b.roll);

    students.forEach(s=>{
      attendanceState[s.id] = null;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td><button class="primary" onclick="markAttendance('${s.id}','present',this)">✔️</button></td>
        <td><button class="primary" onclick="markAttendance('${s.id}','absent',this)">❌</button></td>
      `;
      table.appendChild(tr);
    });

    const saveBtn = document.createElement("button");
    saveBtn.className="primary";
    saveBtn.textContent="Save Attendance";
    saveBtn.onclick=()=>saveAttendance(classId,subjectId);
    wrapper.appendChild(table);
    wrapper.appendChild(saveBtn);
  });
}

function markAttendance(studentId,state,btn){
  attendanceState[studentId] = state;
  // Color buttons
  const tr = btn.closest('tr');
  tr.querySelectorAll('button').forEach(b=>b.style.background="#ddd");
  if(state==='present') tr.children[2].style.background="#4caf50";
  if(state==='absent') tr.children[3].style.background="#f44336";
}

function saveAttendance(classId,subjectId){
  const date = new Date().toISOString().split('T')[0];
  Object.keys(attendanceState).forEach(sid=>{
    const val = attendanceState[sid];
    if(val) db.ref(`attendance/${classId}/${subjectId}/${date}/${sid}`).set(val);
  });
  toast("Attendance saved ✅");
  loadDefaulters();
  loadAttendanceRecords();
}

/***********************
 DEFAULTERS
************************/
function loadDefaulters(){
  const wrapper = document.getElementById("defaulterTableWrapper");
  wrapper.innerHTML = "";

  db.ref(`classes`).once("value").then(cSnap=>{
    let table = document.createElement("table");
    table.innerHTML="<tr><th>Class</th><th>Student</th><th>Subject</th><th>Attendance %</th></tr>";

    cSnap.forEach(c=>{
      const classId=c.key;
      const students=c.val().students||{};
      const subjects=c.val().subjects||{};

      Object.keys(students).forEach(sid=>{
        Object.keys(subjects).forEach(subid=>{
          db.ref(`attendance/${classId}/${subid}`).once("value").then(snap=>{
            let total=0,present=0;
            snap.forEach(d=>{
              const status=d.val()[sid];
              if(status){total++; if(status==='present') present++;}
            });
            const percent= total? Math.round((present/total)*100):100;
            if(percent<75){
              const tr=document.createElement("tr");
              tr.innerHTML=`<td>${c.val().name}</td><td>${students[sid].name}</td><td>${subjects[subid].name}</td><td>${percent}%</td>`;
              table.appendChild(tr);
            }
          });
        });
      });
    });
    wrapper.appendChild(table);
  });
}

/***********************
 ATTENDANCE RECORDS
************************/
function loadAttendanceRecords(){
  const classId = document.getElementById("attendanceClass").value;
  const subjectId = document.getElementById("attendanceSubject").value;
  const date = document.getElementById("recordDate")?.value;

  if(!classId || !subjectId || !date) return;

  db.ref(`attendance/${classId}/${subjectId}/${date}`).once("value").then(snap=>{
    const wrapper = document.getElementById("recordsTableWrapper");
    wrapper.innerHTML="";
    const table = document.createElement("table");
    table.innerHTML="<tr><th>Student</th><th>Status</th></tr>";

    snap.forEach(s=>{
      const tr = document.createElement("tr");
      tr.innerHTML=`<td>${s.key}</td><td>${s.val()}</td>`;
      table.appendChild(tr);
    });
    wrapper.appendChild(table);
  });
}

/***********************
 TOAST
************************/
function toast(msg){
  const t=document.createElement("div");
  t.className="toast";
  t.innerText=msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add("show"),100);
  setTimeout(()=> t.classList.remove("show"),3000);
  setTimeout(()=> t.remove(),3500);
    }
let attendanceChart;

function renderAttendanceChart(classId, subjectId, date) {
  if(!classId || !subjectId || !date) return;

  db.ref(`attendance/${classId}/${subjectId}/${date}`).once("value").then(snap=>{
    let present = 0, absent = 0;

    snap.forEach(s=>{
      if(s.val() === 'present') present++;
      else if(s.val() === 'absent') absent++;
    });

    const ctx = document.getElementById("attendanceChart").getContext("2d");

    if(attendanceChart) attendanceChart.destroy();

    attendanceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Absent'],
        datasets: [{
          data: [present, absent],
          backgroundColor: [
            'rgba(72, 239, 128, 0.8)', // Green with transparency
            'rgba(255, 99, 132, 0.8)'  // Red with transparency
          ],
          borderColor: [
            'rgba(72, 239, 128, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 10,
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels:{color:'#fff', font:{size:14}} },
          tooltip: { enabled:true, backgroundColor:'#000', titleColor:'#fff', bodyColor:'#fff' }
        },
        cutout: '70%',
        animation: { animateScale: true, animateRotate: true },
      }
    });

    // Glow effect using CSS filter
    document.getElementById("attendanceChart").style.filter = "drop-shadow(0px 0px 15px rgba(72,239,128,0.7))";
  });
}

// Call this function whenever date/class/subject changes in records section
document.getElementById("recordDate").addEventListener("change", ()=>{
  const classId = document.getElementById("attendanceClass").value;
  const subjectId = document.getElementById("attendanceSubject").value;
  const date = document.getElementById("recordDate").value;
  renderAttendanceChart(classId, subjectId, date);
});
