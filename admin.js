const auth = firebase.auth();
const database = firebase.database();

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/* ================= DASHBOARD ================= */
function showDashboard() {
  document.getElementById("content").innerHTML = `
    <h2>Admin Dashboard</h2>
    <p>Manage teachers, students, classes & subjects</p>
  `;
}

/* ================= TEACHERS ================= */
function showTeachers() {
  document.getElementById("content").innerHTML = `
    <h2>Teachers</h2>
    <input id="tname" placeholder="Teacher Name">
    <input id="temail" placeholder="Email">
    <button class="btn primary" onclick="addTeacher()">Add Teacher</button>
    <ul id="teacherList"></ul>
  `;
  loadTeachers();
}

function addTeacher() {
  const name = tname.value.trim();
  const email = temail.value.trim();
  if (!name || !email) return alert("Fill all fields");

  const id = database.ref("teachers").push().key;

  database.ref("teachers/" + id).set({
    name,
    email,
    classes: {}
  });

  alert("Teacher Added");
  loadTeachers();
}

function loadTeachers() {
  const list = document.getElementById("teacherList");
  if (!list) return;
  list.innerHTML = "";

  database.ref("teachers").once("value", snap => {
    snap.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t.val().name + " (" + t.val().email + ")";
      list.appendChild(li);
    });
  });
}

/* ================= STUDENTS ================= */
function showStudents() {
  document.getElementById("content").innerHTML = `
    <h2>Students</h2>
    <input id="sname" placeholder="Student Name">
    <input id="sroll" placeholder="Roll Number">
    <input id="sclass" placeholder="Class">
    <button class="btn primary" onclick="addStudent()">Add Student</button>
    <ul id="studentList"></ul>
  `;
  loadStudents();
}

function addStudent() {
  const name = sname.value.trim();
  const roll = sroll.value.trim();
  const cls = sclass.value.trim();
  if (!name || !roll || !cls) return alert("Fill all fields");

  const id = database.ref("students").push().key;

  database.ref("students/" + id).set({
    name,
    roll,
    class: cls,
    attendance: {}
  });

  alert("Student Added");
  loadStudents();
}

function loadStudents() {
  const list = document.getElementById("studentList");
  if (!list) return;
  list.innerHTML = "";

  database.ref("students").once("value", snap => {
    snap.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s.val().name + " (" + s.val().class + ")";
      list.appendChild(li);
    });
  });
}

/* ================= CLASSES ================= */
function showClasses() {
  document.getElementById("content").innerHTML = `
    <h2>Assign Class & Subject</h2>
    <input id="classname" placeholder="Class">
    <input id="subjectname" placeholder="Subject">
    <select id="teacherSelect"></select>
    <button class="btn primary" onclick="assignClass()">Assign</button>
  `;
  loadTeacherDropdown();
}

function loadTeacherDropdown() {
  const select = document.getElementById("teacherSelect");
  select.innerHTML = "<option value=''>Select Teacher</option>";

  database.ref("teachers").once("value", snap => {
    snap.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.key;
      opt.textContent = t.val().name;
      select.appendChild(opt);
    });
  });
}

function assignClass() {
  const cls = classname.value.trim();
  const subject = subjectname.value.trim();
  const teacherId = teacherSelect.value;

  if (!cls || !subject || !teacherId) return alert("Fill all fields");

  database.ref(`teachers/${teacherId}/classes/${cls}`).set({
    subject
  });

  alert("Class Assigned");
}
