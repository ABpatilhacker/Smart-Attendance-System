const auth = window.auth;
const db = window.db;

auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  loadTeachers();
  loadStudents();
  loadClasses();
});

function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ---------- LOAD TEACHERS ----------
function loadTeachers() {
  const select = document.getElementById("teacher-select");
  select.innerHTML = "";

  db.ref("users").orderByChild("role").equalTo("teacher").once("value")
    .then(snap => {
      snap.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.key;
        opt.textContent = t.val().name;
        select.appendChild(opt);
      });
    });
}

// ---------- CREATE CLASS ----------
function createClass() {
  const name = document.getElementById("class-name").value;
  const teacherId = document.getElementById("teacher-select").value;
  if (!name || !teacherId) return alert("Fill all fields");

  const ref = db.ref("classes").push();
  ref.set({
    name,
    teacherId,
    subjects: {},
    students: {}
  });

  db.ref(`users/${teacherId}/classes/${ref.key}`).set(true);
  alert("Class created!");
  loadClasses();
}

// ---------- LOAD CLASSES ----------
function loadClasses() {
  const list = document.getElementById("class-list");
  const classSelect = document.getElementById("class-select");
  const studentClass = document.getElementById("student-class-select");

  list.innerHTML = "";
  classSelect.innerHTML = "";
  studentClass.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(c => {
      const cls = c.val();

      list.innerHTML += `
        <div class="class-card">
          <strong>${cls.name}</strong><br>
          Subjects: ${Object.values(cls.subjects || {}).join(", ")}
        </div>
      `;

      [classSelect, studentClass].forEach(sel => {
        const opt = document.createElement("option");
        opt.value = c.key;
        opt.textContent = cls.name;
        sel.appendChild(opt);
      });
    });
  });
}

// ---------- ADD SUBJECT ----------
function addSubject() {
  const classId = document.getElementById("class-select").value;
  const subject = document.getElementById("subject-name").value;
  if (!subject) return alert("Enter subject");

  db.ref(`classes/${classId}/subjects`).push(subject);
  alert("Subject added!");
  loadClasses();
}

// ---------- LOAD STUDENTS ----------
function loadStudents() {
  const select = document.getElementById("student-select");
  select.innerHTML = "";

  db.ref("users").orderByChild("role").equalTo("student").once("value")
    .then(snap => {
      snap.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.key;
        opt.textContent = s.val().name;
        select.appendChild(opt);
      });
    });
}

// ---------- ASSIGN STUDENT ----------
function assignStudent() {
  const classId = document.getElementById("student-class-select").value;
  const studentId = document.getElementById("student-select").value;

  db.ref(`classes/${classId}/students/${studentId}`).set(true);
  alert("Student assigned!");
}
