const auth = firebase.auth();
const db = firebase.database();

let teacherId;
let currentClass;

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
  if (page === "dashboard") showDashboard();
  if (page === "classes") showClasses();
  if (page === "defaulters") showDefaulters();
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";
  teacherId = user.uid;

  db.ref("users/" + teacherId).once("value").then(snap => {
    teacherName.innerText = snap.val().name;
    showDashboard();
  });
});

/* DASHBOARD */
function showDashboard() {
  pageTitle.innerText = "Dashboard";
  db.ref("users/" + teacherId + "/assignments").once("value").then(snap => {
    content.innerHTML = `
      <div class="grid">
        <div class="card">📚 Classes<br><h2>${snap.numChildren()}</h2></div>
        <div class="card">🎓 Students<br><h2>Auto</h2></div>
        <div class="card">📅 Attendance<br><h2>Live</h2></div>
      </div>
    `;
  });
}

/* CLASSES */
function showClasses() {
  pageTitle.innerText = "My Classes";
  let html = `<div class="grid">`;

  db.ref("users/" + teacherId + "/assignments").once("value").then(snap => {
    snap.forEach(a => {
      const [classId, subject] = a.key.split("_");
      db.ref("classes/" + classId).once("value").then(c => {
        html += `
          <div class="card">
            <h3>${c.val().name}</h3>
            <p>Subject: ${subject}</p>
            <button onclick="openClass('${classId}')">Take Attendance</button>
          </div>
        `;
        content.innerHTML = html + "</div>";
      });
    });
  });
}

/* OPEN CLASS */
function openClass(classId) {
  currentClass = classId;
  pageTitle.innerText = "Attendance";

  const date = new Date().toISOString().split("T")[0];

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    let rows = "";
    snap.forEach(s => {
      rows += `
        <tr>
          <td>${s.val().roll}</td>
          <td>${s.val().name}</td>
          <td>
            <button class="status-btn present" onclick="setStatus('${s.key}','present')">P</button>
            <button class="status-btn absent" onclick="setStatus('${s.key}','absent')">A</button>
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

let attendance = {};

function setStatus(id, status) {
  attendance[id] = status;
}

/* SAVE */
function saveAttendance(date) {
  for (let id in attendance) {
    db.ref(`classes/${currentClass}/attendance/${date}/${id}`).set(attendance[id]);
  }
  alert("✅ Attendance saved successfully");
  showClasses();
}

/* DEFAULTERS */
function showDefaulters() {
  pageTitle.innerText = "Defaulters";
  content.innerHTML = `
    <div class="card">
      <h3>Defaulters Section</h3>
      <p>Auto-calculated based on minimum attendance (admin controlled)</p>
    </div>
  `;
}
