const auth = firebase.auth();
const db = firebase.database();

let teacherId, currentClass, currentSubject;
let attendance = {};

function toggleSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

function navigate(page) {
  closeSidebar();
  if (page === "dashboard") loadDashboard();
  if (page === "classes") loadClasses();
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";
  teacherId = user.uid;

  db.ref("users/" + teacherId).once("value").then(snap => {
    teacherName.innerText = snap.val().name;
    loadDashboard();
  });
});

/* DASHBOARD */
function loadDashboard() {
  pageTitle.innerText = "Dashboard";
  content.innerHTML = `
    <div class="grid">
      <div class="card" onclick="loadClasses()">📚 Classes</div>
      <div class="card" onclick="loadClasses()">🧑‍🎓 Students</div>
      <div class="card" onclick="loadClasses()">📅 Attendance</div>
    </div>
  `;
}

/* CLASSES */
function loadClasses() {
  pageTitle.innerText = "My Classes";
  let html = `<div class="grid">`;

  db.ref("users/" + teacherId + "/assignments").once("value").then(snap => {
    snap.forEach(a => {
      const [classId, subject] = a.key.split("_");
      db.ref("classes/" + classId).once("value").then(c => {
        html += `
          <div class="card" onclick="openClass('${classId}','${subject}')">
            <h3>${c.val().name}</h3>
            <p>Subject: ${subject}</p>
          </div>
        `;
        content.innerHTML = html + `</div>`;
      });
    });
  });
}

/* OPEN CLASS */
function openClass(classId, subject) {
  currentClass = classId;
  currentSubject = subject;
  pageTitle.innerText = subject + " - Attendance";

  const date = new Date().toISOString().split("T")[0];
  attendance = {};

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    let rows = "";
    snap.forEach(s => {
      rows += `
        <tr>
          <td>${s.val().roll}</td>
          <td>${s.val().name}</td>
          <td>
            <button class="status-btn present" onclick="setStatus('${s.key}',this,'present')">P</button>
            <button class="status-btn absent" onclick="setStatus('${s.key}',this,'absent')">A</button>
          </td>
        </tr>
      `;
    });

    content.innerHTML = `
      <table>
        <tr><th>Roll</th><th>Name</th><th>Status</th></tr>
        ${rows}
      </table>
      <button class="save-btn" onclick="saveAttendance('${date}')">Save Attendance</button>
    `;
  });
}

function setStatus(id, btn, status) {
  const parent = btn.parentElement;
  parent.querySelectorAll(".status-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  attendance[id] = status;
}

function saveAttendance(date) {
  for (let id in attendance) {
    db.ref(`classes/${currentClass}/attendance/${date}/${id}`).set(attendance[id]);
  }
  alert("Attendance saved successfully");
  loadClasses();
}
