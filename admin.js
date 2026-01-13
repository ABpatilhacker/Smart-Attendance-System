const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const view = document.getElementById("view");

// Data storage (in-memory)
let teachers = [
  { id: 1, name: "John Doe", email: "john@example.com", subject: "Math" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", subject: "Physics" }
];

let students = [
  { id: 1, name: "Alice", email: "alice@example.com", class: "BCA FY" },
  { id: 2, name: "Bob", email: "bob@example.com", class: "BCA SY" }
];

function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

function logout() {
  alert("Logged out");
  window.location.href = "login.html";
}

/* DASHBOARD */
function loadDashboard() {
  closeSidebar();
  view.innerHTML = `
    <h2>Overview</h2>
    <p style="opacity:.7;margin-bottom:20px">Quick summary</p>

    <div class="cards">
      <div class="card">
        <div class="card-icon">👨‍🏫</div>
        <p>Total Teachers</p>
        <h2 class="count" data-target="${teachers.length}">0</h2>
      </div>

      <div class="card">
        <div class="card-icon">👩‍🎓</div>
        <p>Total Students</p>
        <h2 class="count" data-target="${students.length}">0</h2>
      </div>

      <div class="card">
        <div class="card-icon">🏫</div>
        <p>Total Classes</p>
        <h2 class="count" data-target="8">0</h2>
      </div>

      <div class="card">
        <div class="card-icon">📊</div>
        <p>Avg Attendance</p>
        <h2 class="count" data-target="92">0</h2>
      </div>
    </div>

    <div class="activity">
      <h3>Recent Activity</h3>
      <ul>
        <li>👨‍🏫 Teacher added</li>
        <li>🏫 New class created</li>
        <li>✅ Attendance updated</li>
        <li>👩‍🎓 Student approved</li>
      </ul>
    </div>
  `;
  animateCounters();
}

/* TEACHERS */
function loadTeachers() {
  closeSidebar();
  view.innerHTML = `
    <h2>Teachers</h2>
    <p style="opacity:.7;margin-bottom:15px">Add / Edit teachers here</p>
    <button class="primary" onclick="showAddTeacherForm()">➕ Add Teacher</button>
    <div id="teachers-list" style="margin-top:20px"></div>
  `;
  renderTeachers();
}

function renderTeachers() {
  const list = document.getElementById("teachers-list");
  if (!teachers.length) {
    list.innerHTML = "<p>No teachers added yet.</p>";
    return;
  }
  let html = `<table style="width:100%;border-collapse:collapse">
    <tr style="background:#eef2ff">
      <th style="padding:8px;text-align:left;">Name</th>
      <th style="padding:8px;text-align:left;">Email</th>
      <th style="padding:8px;text-align:left;">Subject</th>
      <th style="padding:8px;text-align:left;">Actions</th>
    </tr>`;
  teachers.forEach(t => {
    html += `<tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:8px">${t.name}</td>
      <td style="padding:8px">${t.email}</td>
      <td style="padding:8px">${t.subject}</td>
      <td style="padding:8px">
        <button onclick="editTeacher(${t.id})">✏️ Edit</button>
        <button onclick="deleteTeacher(${t.id})">🗑️ Delete</button>
      </td>
    </tr>`;
  });
  html += "</table>";
  list.innerHTML = html;
}

function showAddTeacherForm() {
  const list = document.getElementById("teachers-list");
  list.innerHTML = `
    <h3>Add New Teacher</h3>
    <form id="teacher-form">
      <input type="text" placeholder="Name" id="tname" required><br><br>
      <input type="email" placeholder="Email" id="temail" required><br><br>
      <input type="text" placeholder="Subject" id="tsubject" required><br><br>
      <button type="submit" class="primary">Add Teacher</button>
    </form>
  `;
  document.getElementById("teacher-form").onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById("tname").value;
    const email = document.getElementById("temail").value;
    const subject = document.getElementById("tsubject").value;
    teachers.push({ id: Date.now(), name, email, subject });
    loadTeachers();
  };
}

function editTeacher(id) {
  const t = teachers.find(t => t.id === id);
  const list = document.getElementById("teachers-list");
  list.innerHTML = `
    <h3>Edit Teacher</h3>
    <form id="teacher-form">
      <input type="text" placeholder="Name" id="tname" value="${t.name}" required><br><br>
      <input type="email" placeholder="Email" id="temail" value="${t.email}" required><br><br>
      <input type="text" placeholder="Subject" id="tsubject" value="${t.subject}" required><br><br>
      <button type="submit" class="primary">Save Changes</button>
    </form>
  `;
  document.getElementById("teacher-form").onsubmit = function(e) {
    e.preventDefault();
    t.name = document.getElementById("tname").value;
    t.email = document.getElementById("temail").value;
    t.subject = document.getElementById("tsubject").value;
    loadTeachers();
  };
}

function deleteTeacher(id) {
  if(confirm("Are you sure you want to delete this teacher?")) {
    teachers = teachers.filter(t => t.id !== id);
    renderTeachers();
  }
}

/* STUDENTS */
function loadStudents() {
  closeSidebar();
  view.innerHTML = `
    <h2>Students</h2>
    <p style="opacity:.7;margin-bottom:15px">Add / Edit students here</p>
    <button class="primary" onclick="showAddStudentForm()">➕ Add Student</button>
    <div id="students-list" style="margin-top:20px"></div>
  `;
  renderStudents();
}

function renderStudents() {
  const list = document.getElementById("students-list");
  if (!students.length) {
    list.innerHTML = "<p>No students added yet.</p>";
    return;
  }
  let html = `<table style="width:100%;border-collapse:collapse">
    <tr style="background:#eef2ff">
      <th style="padding:8px;text-align:left;">Name</th>
      <th style="padding:8px;text-align:left;">Email</th>
      <th style="padding:8px;text-align:left;">Class</th>
      <th style="padding:8px;text-align:left;">Actions</th>
    </tr>`;
  students.forEach(s => {
    html += `<tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:8px">${s.name}</td>
      <td style="padding:8px">${s.email}</td>
      <td style="padding:8px">${s.class}</td>
      <td style="padding:8px">
        <button onclick="editStudent(${s.id})">✏️ Edit</button>
        <button onclick="deleteStudent(${s.id})">🗑️ Delete</button>
      </td>
    </tr>`;
  });
  html += "</table>";
  list.innerHTML = html;
}

function showAddStudentForm() {
  const list = document.getElementById("students-list");
  list.innerHTML = `
    <h3>Add New Student</h3>
    <form id="student-form">
      <input type="text" placeholder="Name" id="sname" required><br><br>
      <input type="email" placeholder="Email" id="semail" required><br><br>
      <input type="text" placeholder="Class" id="sclass" required><br><br>
      <button type="submit" class="primary">Add Student</button>
    </form>
  `;
  document.getElementById("student-form").onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById("sname").value;
    const email = document.getElementById("semail").value;
    const studentClass = document.getElementById("sclass").value;
    students.push({ id: Date.now(), name, email, class: studentClass });
    loadStudents();
  };
}

function editStudent(id) {
  const s = students.find(s => s.id === id);
  const list = document.getElementById("students-list");
  list.innerHTML = `
    <h3>Edit Student</h3>
    <form id="student-form">
      <input type="text" placeholder="Name" id="sname" value="${s.name}" required><br><br>
      <input type="email" placeholder="Email" id="semail" value="${s.email}" required><br><br>
      <input type="text" placeholder="Class" id="sclass" value="${s.class}" required><br><br>
      <button type="submit" class="primary">Save Changes</button>
    </form>
  `;
  document.getElementById("student-form").onsubmit = function(e) {
    e.preventDefault();
    s.name = document.getElementById("sname").value;
    s.email = document.getElementById("semail").value;
    s.class = document.getElementById("sclass").value;
    loadStudents();
  };
}

function deleteStudent(id) {
  if(confirm("Are you sure you want to delete this student?")) {
    students = students.filter(s => s.id !== id);
    renderStudents();
  }
}

/* CLASSES */
function loadClasses() {
  closeSidebar();
  view.innerHTML = `<h2>Classes</h2><p>Manage classes here</p>`;
}

/* COUNTER ANIMATION */
function animateCounters() {
  document.querySelectorAll(".count").forEach(counter => {
    counter.innerText = "0";
    const target = +counter.dataset.target;
    const step = Math.max(1, target / 40);
    const update = () => {
      const current = +counter.innerText;
      if (current < target) {
        counter.innerText = Math.ceil(current + step);
        setTimeout(update, 25);
      } else {
        counter.innerText = target;
      }
    };
    update();
  });
}

/* Default load */
loadDashboard();