/********************************
 🔥 FIREBASE INIT
*********************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.appspot.com",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentTeacher = null;
let attendanceData = {};
let selectedSubjectKey = null;

/********************************
 🔐 AUTH CHECK
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentTeacher = user;
    loadTeacherInfo();
    loadSubjects();
    loadChart();
    loadDefaulters();
  }
});

/********************************
 🚪 LOGOUT
*********************************/
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/********************************
 📂 SIDEBAR + ROUTES
*********************************/
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

// Close sidebar when clicking a section option
function openSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  if(sidebar.classList.contains("open")) toggleSidebar();
}

/********************************
 👋 WELCOME + PROFILE
*********************************/
function loadTeacherInfo() {
  db.ref("users/" + currentTeacher.uid).once("value").then(snap => {
    const data = snap.val();
    document.getElementById("welcomeCard").innerText = `Welcome 👋 ${data.name}`;
    document.getElementById("profileName").value = data.name;
    document.getElementById("profileEmail").value = data.email;
  });
}

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  if(!name) return toast("Name required ⚠️");
  db.ref("users/" + currentTeacher.uid).update({ name })
    .then(() => toast("Profile updated ✅"))
    .then(loadTeacherInfo);
}

/********************************
 📚 LOAD SUBJECTS & CLASSES
*********************************/
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const classContainer = document.getElementById("classListContainer");
  select.innerHTML = `<option value="">-- Select --</option>`;
  classContainer.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(cls => {
      const c = cls.val();
      for (let s in c.subjects || {}) {
        if(c.subjects[s].teacherId === currentTeacher.uid) {
          const key = `${cls.key}_${s}`;
          select.innerHTML += `<option value="${key}">${c.name} – ${c.subjects[s].name}</option>`;
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `<h3>${c.name}</h3><p>${c.subjects[s].name}</p>`;
          card.onclick = () => openSection('attendance');
          classContainer.appendChild(card);
        }
      }
    });
  });
}

/********************************
 📝 ATTENDANCE TABLE
*********************************/
function loadAttendanceTable() {
  const body = document.getElementById("attendanceBody");
  body.innerHTML = "";
  attendanceData = {};
  selectedSubjectKey = document.getElementById("subjectSelect").value;
  if(!selectedSubjectKey) return;

  const [classId, subjectId] = selectedSubjectKey.split("_");
  db.ref("users").orderByChild("classId").equalTo(classId).once("value").then(snap => {
    let students = [];
    snap.forEach(s => {
      const d = s.val();
      if(d.role === "student") students.push({...d, uid: s.key});
    });
    students.sort((a,b) => a.roll - b.roll);
    students.forEach(stu => {
      attendanceData[stu.uid] = null;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${stu.roll}</td>
        <td>${stu.name}</td>
        <td class="attendance-buttons">
          <button class="present" onclick="markAttendance('${stu.uid}','P',this)">P</button>
          <button class="absent" onclick="markAttendance('${stu.uid}','A',this)">A</button>
        </td>
      `;
      body.appendChild(tr);
    });
  });
}

function markAttendance(uid, status, btn) {
  attendanceData[uid] = status;
  const parent = btn.parentElement;
  parent.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

/********************************
 💾 SAVE ATTENDANCE
*********************************/
function saveAttendance() {
  if(!selectedSubjectKey) return toast("Select subject ⚠️");
  const date = new Date().toISOString().split("T")[0];
  db.ref(`attendance/${selectedSubjectKey}/${date}`).set(attendanceData)
    .then(() => {
      toast("Attendance Saved ✔️");
      document.querySelectorAll(".att-btn").forEach(b => b.classList.remove("selected"));
      loadChart();
      loadDefaulters();
    });
}

/********************************
 📊 CHART
*********************************/
let chart;
function loadChart() {
  const ctx = document.getElementById("attendanceChart");
  if(!ctx) return;
  if(chart) chart.destroy();

  // Example: show 75% present, 25% absent (update from Firebase as needed)
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Present","Absent"],
      datasets: [{
        data: [75,25],
        backgroundColor: ["rgba(0,255,200,0.9)","rgba(255,80,80,0.9)"],
        borderWidth: 2
      }]
    },
    options: {
      cutout: "70%",
      plugins: { legend: { position: "bottom" } },
      animation: { animateRotate: true, animateScale: true }
    }
  });
}

/********************************
 ⚠️ DEFAULTERS
*********************************/
function loadDefaulters() {
  const body = document.getElementById("defaulterBody");
  body.innerHTML = "";
  // Sample logic: calculate defaulters (replace with actual Firebase calculation)
  body.innerHTML = `
    <tr><td>12</td><td>Rahul</td><td>42%</td></tr>
    <tr><td>18</td><td>Neha</td><td>38%</td></tr>
  `;
}

/********************************
 📅 ATTENDANCE RECORDS
*********************************/
function loadAttendanceRecords() {
  const date = document.getElementById("calendar").value;
  const body = document.getElementById("recordBody");
  body.innerHTML = "";
  if(!selectedSubjectKey || !date) return;

  db.ref(`attendance/${selectedSubjectKey}/${date}`).once("value").then(snap => {
    const data = snap.val() || {};
    for(let uid in data){
      body.innerHTML += `<tr>
        <td>${uid}</td>
        <td>${data[uid].name || uid}</td>
        <td>${data[uid]}</td>
      </tr>`;
    }
  });
}

/********************************
 🍞 TOAST
*********************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add("show"),100);
  setTimeout(()=> t.classList.remove("show"),2500);
  setTimeout(()=> t.remove(),3000);
}

// Close sidebar on clicking outside
document.getElementById("overlay").addEventListener("click", toggleSidebar);