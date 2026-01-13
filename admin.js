if (!window.firebase) {
  alert("Firebase not loaded");
}
// Firebase
// USE THESE (from firebase.js)
const auth = window.auth;
const db = window.db;

// Overlay & Sidebar toggle
const overlay = document.querySelector(".overlay");
const sidebar = document.getElementById("sidebar");

function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

overlay.addEventListener("click", closeSidebar);

// Sidebar menu click handler
function handleMenu(type) {
  closeSidebar();

  if(type === "dashboard") showDashboard();
  if(type === "pending") showPending();
  if(type === "teachers") showTeachers();
  if(type === "classes") showClasses();
}

// Logout
function logout() {
  auth.signOut().then(()=> location.href="login.html");
}

// Dashboard view
function showDashboard() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <h2>📊 Dashboard Overview</h2>
    <div class="cards-container">
      <div class="card card-purple">
        <div class="card-icon">👨‍🏫</div>
        <div class="card-info">
          <h3 id="total-teachers">0</h3>
          <p>Teachers</p>
        </div>
      </div>
      <div class="card card-blue">
        <div class="card-icon">🧑‍🎓</div>
        <div class="card-info">
          <h3 id="total-students">0</h3>
          <p>Students</p>
        </div>
      </div>
      <div class="card card-orange">
        <div class="card-icon">⏳</div>
        <div class="card-info">
          <h3 id="total-pending">0</h3>
          <p>Pending Approvals</p>
        </div>
      </div>
      <div class="card card-green">
        <div class="card-icon">🏫</div>
        <div class="card-info">
          <h3 id="total-classes">0</h3>
          <p>Classes</p>
        </div>
      </div>
    </div>
  `;

  // Load data from Firebase
  db.ref("users").once("value").then((snap) => {
    let teachers = 0, students = 0, pending = 0;
    snap.forEach((u) => {
      const user = u.val();
      if (user.role === "teacher") teachers++;
      if (user.role === "student") students++;
      if (user.status === "pending") pending++;
    });
    document.getElementById("total-teachers").textContent = teachers;
    document.getElementById("total-students").textContent = students;
    document.getElementById("total-pending").textContent = pending;
  });

  db.ref("classes").once("value").then((snap) => {
    document.getElementById("total-classes").textContent = snap.numChildren();
  });
}

  // Fetch counts from Firebase
  database.ref("teachers").once("value").then(snap=>{
    document.getElementById("total-teachers").textContent = snap.numChildren();
  });
  database.ref("students").once("value").then(snap=>{
    document.getElementById("total-students").textContent = snap.numChildren();
  });
  database.ref("classes").once("value").then(snap=>{
    document.getElementById("total-classes").textContent = snap.numChildren();
  });
}

// Pending approvals
function showPending() {
  const view = document.getElementById("view");

  view.innerHTML = `
    <div class="card">
      <h2>⏳ Pending Approvals</h2>
      <p class="subtitle">Approve teachers and students before they can access the system</p>
      <ul id="pending-list" class="pending-list"></ul>
    </div>
  `;

  const list = document.getElementById("pending-list");

  db.ref("users").once("value").then((snap) => {
    list.innerHTML = "";

    let found = false;

    snap.forEach((u) => {
      const user = u.val();
      if (user.status === "pending") {
        found = true;

        const li = document.createElement("li");
        li.className = "pending-item";
        li.innerHTML = `
          <div>
            <strong>${user.name}</strong>
            <span class="role-badge ${user.role}">${user.role}</span>
            <div class="email">${user.email}</div>
          </div>
          <button class="btn primary" onclick="approveUser('${u.key}')">
            ✅ Approve
          </button>
        `;
        list.appendChild(li);
      }
    });

    if (!found) {
      list.innerHTML = `<p class="empty">🎉 No pending approvals</p>`;
    }
  });
}
// Teachers view
function showTeachers() {
  document.getElementById("view").innerHTML = `
    <div class="activity">
      <h3>👨‍🏫 Teachers</h3>
      <input type="text" id="teacher-name" placeholder="Teacher Name">
      <input type="email" id="teacher-email" placeholder="Teacher Email">
      <button class="primary" onclick="addTeacher()">Add Teacher</button>
      <ul id="teacher-list"></ul>
    </div>
  `;
  loadTeachers();
}

function addTeacher() {
  const name = document.getElementById("teacher-name").value;
  const email = document.getElementById("teacher-email").value;
  if(!name || !email) return alert("Fill all fields");

  const ref = database.ref("teachers").push();
  ref.set({name,email,subjects:{}});
  alert("Teacher added!");
  loadTeachers();
}

function loadTeachers() {
  const list = document.getElementById("teacher-list");
  list.innerHTML = '';
  database.ref("teachers").once("value").then(snap=>{
    snap.forEach(t=>{
      const li = document.createElement("li");
      li.textContent = t.val().name + " (" + t.val().email + ")";
      list.appendChild(li);
    });
  });
}

// Classes view
function showClasses() {
  document.getElementById("view").innerHTML = `
    <div class="activity">
      <h3>🏫 Classes & Subjects</h3>
      <input type="text" id="class-name" placeholder="Class Name">
      <input type="text" id="subject-name" placeholder="Subject Name">
      <select id="teacher-select"><option value="">Select Teacher</option></select>
      <button class="primary" onclick="addClassSubject()">Add Class</button>
      <ul id="class-list"></ul>
    </div>
  `;
  loadTeachersDropdown();
  loadClasses();
}

function loadTeachersDropdown() {
  const select = document.getElementById("teacher-select");
  select.innerHTML = '<option value="">Select Teacher</option>';
  database.ref("teachers").once("value").then(snap=>{
    snap.forEach(t=>{
      const option = document.createElement("option");
      option.value = t.key;
      option.textContent = t.val().name;
      select.appendChild(option);
    });
  });
}

function addClassSubject() {
  const classname = document.getElementById("class-name").value;
  const subjectname = document.getElementById("subject-name").value;
  const teacherId = document.getElementById("teacher-select").value;
  if(!classname || !subjectname || !teacherId) return alert("Fill all fields");

  database.ref("teachers/"+teacherId+"/subjects/"+classname).set({subject:subjectname,students:{}});
  alert("Class & Subject assigned!");
  loadClasses();
}

function loadClasses() {
  const list = document.getElementById("class-list");
  list.innerHTML = '';
  database.ref("teachers").once("value").then(snap=>{
    snap.forEach(t=>{
      const teacher = t.val();
      const li = document.createElement("li");
      li.textContent = teacher.name + ': ';
      const subjects = teacher.subjects || {};
      const text = Object.keys(subjects).map(cls=>cls + ' ('+subjects[cls].subject+')').join(', ');
      li.textContent += text;
      list.appendChild(li);
    });
  });
}
function approveUser(uid) {
  if (!confirm("Approve this user?")) return;

  db.ref("users/" + uid + "/status").set("approved").then(() => {
    showPending();
  });
}
// Load dashboard by default
showDashboard();
