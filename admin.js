// ----- GLOBAL REFS -----
const auth = window.auth;
const db = window.db;
const mainView = document.getElementById("main-view");

// ----- LOGOUT -----
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

// ----- AUTH CHECK -----
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  showDashboard(); // load dashboard on login
});

// ----- COUNT-UP ANIMATION -----
function animateCount(element, target) {
  let count = 0;
  const step = Math.ceil(target / 100);
  const interval = setInterval(() => {
    count += step;
    if (count >= target) {
      count = target;
      clearInterval(interval);
    }
    element.textContent = count;
  }, 10);
}

// ----- LOAD KPIS -----
function loadKPIs() {
  const totalClassesCard = document.getElementById("total-classes");
  const totalTeachersCard = document.getElementById("total-teachers");
  const totalStudentsCard = document.getElementById("total-students");

  // Classes
  db.ref("classes").once("value").then(snapshot => {
    animateCount(totalClassesCard, snapshot.size || 0);
  });

  // Teachers
  db.ref("users").orderByChild("role").equalTo("teacher").once("value").then(snapshot => {
    animateCount(totalTeachersCard, snapshot.size || 0);
  });

  // Students
  db.ref("users").orderByChild("role").equalTo("student").once("value").then(snapshot => {
    animateCount(totalStudentsCard, snapshot.size || 0);
  });
}

// ----- DASHBOARD -----
function showDashboard() {
  mainView.innerHTML = `
    <h2>📊 Dashboard Overview</h2>
    <div class="kpi-cards">
      <div class="card" id="total-classes"><p>0</p><h4>Total Classes</h4></div>
      <div class="card" id="total-teachers"><p>0</p><h4>Total Teachers</h4></div>
      <div class="card" id="total-students"><p>0</p><h4>Total Students</h4></div>
    </div>

    <section class="admin-actions">
      <div class="card action-card">
        <h3>🏫 Create Class</h3>
        <input type="text" id="new-class-name" placeholder="Class Name (e.g. BCA FY)" />
        <select id="assign-teacher">
          <option value="">Select Teacher</option>
        </select>
        <button onclick="createClass()">Create Class</button>
      </div>

      <div class="card action-card">
        <h3>📘 Add Subject</h3>
        <select id="class-for-subject">
          <option value="">Select Class</option>
        </select>
        <input type="text" id="subject-name" placeholder="Subject Name" />
        <button onclick="addSubject()">Add Subject</button>
      </div>

      <div class="card action-card">
        <h3>👨‍🎓 Assign Student</h3>
        <select id="class-for-student"><option value="">Select Class</option></select>
        <select id="student-list"><option value="">Select Student</option></select>
        <button onclick="assignStudent()">Assign Student</button>
      </div>

      <div class="card action-card" id="all-classes">
        <h3>📋 All Classes</h3>
        <div id="classes-list"></div>
      </div>
    </section>
  `;

  populateTeachers();
  populateClasses();
  populateStudents();
  loadKPIs();
}

// ----- POPULATE TEACHERS -----
function populateTeachers() {
  db.ref("users").orderByChild("role").equalTo("teacher").once("value").then(snap => {
    const teacherSelect = document.getElementById("assign-teacher");
    teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    snap.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.key;
      opt.textContent = t.val().name;
      teacherSelect.appendChild(opt);
    });
  });
}

// ----- POPULATE CLASSES -----
function populateClasses() {
  db.ref("classes").once("value").then(snap => {
    const classSelect1 = document.getElementById("class-for-subject");
    const classSelect2 = document.getElementById("class-for-student");
    classSelect1.innerHTML = '<option value="">Select Class</option>';
    classSelect2.innerHTML = '<option value="">Select Class</option>';

    const classesList = document.getElementById("classes-list");
    classesList.innerHTML = "";

    snap.forEach(c => {
      const cls = c.val();
      // Dropdowns
      const opt1 = document.createElement("option");
      opt1.value = c.key;
      opt1.textContent = cls.name;
      classSelect1.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = c.key;
      opt2.textContent = cls.name;
      classSelect2.appendChild(opt2);

      // Display all classes
      const div = document.createElement("div");
      div.className = "class-item";
      div.innerHTML = `<b>${cls.name}</b> - Teacher: ${cls.teacherName || "N/A"} | Subjects: ${Object.values(cls.subjects || {}).join(", ")}`;
      classesList.appendChild(div);
    });
  });
}

// ----- POPULATE STUDENTS -----
function populateStudents() {
  db.ref("users").orderByChild("role").equalTo("student").once("value").then(snap => {
    const studentSelect = document.getElementById("student-list");
    studentSelect.innerHTML = '<option value="">Select Student</option>';
    snap.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.key;
      opt.textContent = s.val().name;
      studentSelect.appendChild(opt);
    });
  });
}

// ----- CREATE CLASS -----
function createClass() {
  const name = document.getElementById("new-class-name").value.trim();
  const teacherId = document.getElementById("assign-teacher").value;
  if (!name) return alert("Enter class name!");
  if (!teacherId) return alert("Select a teacher!");

  const newClassRef = db.ref("classes").push();
  newClassRef.set({
    name,
    teacher: teacherId,
    teacherName: document.getElementById("assign-teacher").selectedOptions[0].text,
    students: {},
    subjects: {}
  }).then(() => {
    alert("Class created!");
    populateClasses();
    document.getElementById("new-class-name").value = "";
  });
}

// ----- ADD SUBJECT -----
function addSubject() {
  const classId = document.getElementById("class-for-subject").value;
  const name = document.getElementById("subject-name").value.trim();
  if (!classId) return alert("Select class!");
  if (!name) return alert("Enter subject name!");

  const subjectRef = db.ref(`classes/${classId}/subjects`).push();
  subjectRef.set(name).then(() => {
    alert("Subject added!");
    document.getElementById("subject-name").value = "";
    populateClasses();
  });
}

// ----- ASSIGN STUDENT -----
function assignStudent() {
  const classId = document.getElementById("class-for-student").value;
  const studentId = document.getElementById("student-list").value;
  if (!classId) return alert("Select class!");
  if (!studentId) return alert("Select student!");

  db.ref(`classes/${classId}/students/${studentId}`).set(true).then(() => {
    alert("Student assigned!");
    populateClasses();
  });
      }
