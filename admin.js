// ----- GLOBAL REFS -----
const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("view");

let currentAdmin = null;

// ----- SIDEBAR TOGGLE -----
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ----- LOGOUT -----
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ----- AUTH STATE -----
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  currentAdmin = user.uid;
  setAdminName();
  showDashboard(); // default view
});

// ----- SET ADMIN NAME -----
function setAdminName() {
  db.ref(`users/${currentAdmin}`).once("value").then(snap => {
    document.querySelector(".topbar h1").textContent = `Admin Dashboard - ${snap.val().name}`;
  });
}

// ----- TOAST -----
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ----- DASHBOARD OVERVIEW -----
function showDashboard() {
  closeSidebar();
  mainView.innerHTML = `<h2>Dashboard Overview</h2>
    <div class="card-grid" id="overview-cards"></div>
    <canvas id="attendanceChart" style="margin-top:30px;"></canvas>
  `;

  const cards = document.getElementById("overview-cards");

  db.ref("classes").once("value").then(classSnap => {
    const totalClasses = classSnap.size;
    let totalStudents = 0;
    let presentToday = 0;
    const today = new Date().toISOString().split("T")[0];

    classSnap.forEach(csnap => {
      const cls = csnap.val();
      const students = cls.students || {};
      totalStudents += Object.keys(students).length;

      const attendanceToday = cls.attendance?.[today] || {};
      Object.values(attendanceToday).forEach(s => {
        if (s === "present") presentToday++;
      });
    });

    // Create KPI cards
    const kpis = [
      { title: "Total Classes", value: totalClasses },
      { title: "Total Students", value: totalStudents },
      { title: "Attendance Today", value: totalStudents ? Math.round((presentToday/totalStudents)*100) + "%" : "0%" }
    ];

    kpis.forEach(k => {
      const card = document.createElement("div");
      card.className = "card overview-card";
      card.innerHTML = `<h3>${k.title}</h3><p>${k.value}</p>`;
      cards.appendChild(card);
    });

    // Chart.js Attendance Chart
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    const labels = [];
    const dataPresent = [];
    const dataAbsent = [];

    classSnap.forEach(csnap => {
      const cls = csnap.val();
      labels.push(cls.name);
      const students = cls.students || {};
      const attendanceToday = cls.attendance?.[today] || {};
      let present = 0, absent = 0;
      Object.keys(students).forEach(sid => {
        if(attendanceToday[sid]==="present") present++;
        else absent++;
      });
      dataPresent.push(present);
      dataAbsent.push(absent);
    });

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Present', data: dataPresent, backgroundColor: '#2ecc71' },
          { label: 'Absent', data: dataAbsent, backgroundColor: '#e74c3c' }
        ]
      },
      options: { responsive:true, plugins:{legend:{position:'top'}}, scales:{y:{beginAtZero:true}}}
    });
  });
}

// ----- SHOW PENDING APPROVALS -----
function showPending() {
  closeSidebar();
  mainView.innerHTML = `<h2>Pending Approvals</h2><div id="pending-list" class="card-grid"></div>`;

  db.ref("users").once("value").then(snap => {
    const list = document.getElementById("pending-list");
    list.innerHTML = "";
    snap.forEach(userSnap => {
      const user = userSnap.val();
      if(user.status === "pending") {
        const card = document.createElement("div");
        card.className = "card student-card";
        card.innerHTML = `
          <h4>${user.name}</h4>
          <p>Role: ${user.role}</p>
          <p>Email: ${user.email}</p>
          <button onclick="approveUser('${userSnap.key}')">✅ Approve</button>
          <button onclick="rejectUser('${userSnap.key}')">❌ Reject</button>
        `;
        list.appendChild(card);
      }
    });
  });
}

// ----- APPROVE / REJECT USER -----
function approveUser(uid) {
  if(!confirm("Approve this user?")) return;
  db.ref(`users/${uid}/status`).set("approved").then(()=>{
    showPending();
    showToast("User approved!");
  });
}

function rejectUser(uid) {
  if(!confirm("Reject this user?")) return;
  db.ref(`users/${uid}`).remove().then(()=>{
    showPending();
    showToast("User rejected!", "error");
  });
}

// ----- SHOW CLASSES -----
function showClasses() {
  closeSidebar();
  mainView.innerHTML = `<h2>Classes Management</h2>
    <button onclick="createClassForm()">➕ Create Class</button>
    <div id="classes-list" class="card-grid"></div>
  `;
  loadClasses();
}

// ----- LOAD CLASSES -----
function loadClasses() {
  db.ref("classes").once("value").then(snap=>{
    const list = document.getElementById("classes-list");
    list.innerHTML = "";
    snap.forEach(csnap=>{
      const cls = csnap.val();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${cls.name}</h3>
        <p>Teacher: <span id="teacher-${csnap.key}">${cls.teacher}</span></p>
        <p>Subjects: ${Object.values(cls.subjects||{}).join(", ")}</p>
        <button onclick="editClass('${csnap.key}')">✏️ Edit</button>
        <button onclick="deleteClass('${csnap.key}')">🗑️ Delete</button>
      `;
      list.appendChild(card);
    });
  });
}

// ----- CREATE CLASS FORM -----
function createClassForm() {
  mainView.innerHTML = `<h2>Create Class</h2>
    <div class="card">
      <label>Class Name: <input type="text" id="class-name" /></label><br><br>
      <label>Assign Teacher: 
        <select id="class-teacher"></select>
      </label><br><br>
      <label>Subjects (comma separated): <input type="text" id="class-subjects" /></label><br><br>
      <button onclick="createClass()">Create Class</button>
    </div>
  `;
  // Load teachers
  const select = document.getElementById("class-teacher");
  db.ref("users").once("value").then(snap=>{
    snap.forEach(u=>{
      const user = u.val();
      if(user.role==="teacher") {
        const option = document.createElement("option");
        option.value = u.key;
        option.textContent = user.name;
        select.appendChild(option);
      }
    });
  });
}

// ----- CREATE CLASS -----
function createClass() {
  const name = document.getElementById("class-name").value.trim();
  const teacher = document.getElementById("class-teacher").value;
  const subjects = document.getElementById("class-subjects").value.split(",").map(s=>s.trim());
  if(!name || !teacher || subjects.length===0) return showToast("Fill all fields!", "error");

  const newClassRef = db.ref("classes").push();
  const subjectsObj = {};
  subjects.forEach((s,i)=>subjectsObj["subject"+(i+1)] = s);

  newClassRef.set({name, teacher, subjects: subjectsObj, students:{}, attendance:{}})
    .then(()=>{
      // Add class to teacher
      db.ref(`users/${teacher}/classes/${newClassRef.key}`).set(true);
      showToast("Class created!");
      showClasses();
    });
}

// ----- DELETE CLASS -----
function deleteClass(classId) {
  if(!confirm("Delete this class?")) return;
  db.ref(`classes/${classId}`).remove().then(()=>{
    showClasses();
    showToast("Class deleted!", "error");
  });
}

// ----- SHOW TEACHERS -----
function showTeachers() {
  closeSidebar();
  mainView.innerHTML = `<h2>Teachers</h2><div id="teacher-list" class="card-grid"></div>`;
  db.ref("users").once("value").then(snap=>{
    const list = document.getElementById("teacher-list");
    snap.forEach(u=>{
      const user = u.val();
      if(user.role==="teacher") {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h4>${user.name}</h4>
          <p>Email: ${user.email}</p>
          <p>Classes: ${Object.keys(user.classes||{}).join(", ") || "None"}</p>
        `;
        list.appendChild(card);
      }
    });
  });
}