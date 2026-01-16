const auth = firebase.auth();
const db = firebase.database();

let teacherId = null;
let currentClass = null;

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/* AUTH */
auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";
  teacherId = user.uid;

  db.ref("users/" + teacherId).once("value").then(snap => {
    document.getElementById("teacherName").innerText = snap.val().name;
    showDashboard();
  });
});

/* DASHBOARD */
function showDashboard() {
  document.getElementById("pageTitle").innerText = "Dashboard";
  db.ref("users/" + teacherId + "/assignments").once("value").then(snap => {
    const totalClasses = snap.numChildren();
    document.getElementById("view").innerHTML = `
      <div class="card-grid">
        <div class="card">📚 Classes<br><b>${totalClasses}</b></div>
        <div class="card">🎓 Students<br><b>Auto</b></div>
        <div class="card">📊 Attendance<br><b>Live</b></div>
      </div>
    `;
  });
}

/* CLASSES */
function showClasses() {
  document.getElementById("pageTitle").innerText = "My Classes";
  let html = `<div class="card-grid">`;

  db.ref("users/" + teacherId + "/assignments").once("value").then(snap => {
    snap.forEach(a => {
      const [classId, subject] = a.key.split("_");
      db.ref("classes/" + classId).once("value").then(clsSnap => {
        html += `
          <div class="card">
            <h3>${clsSnap.val().name}</h3>
            <p>Subject: ${subject}</p>
            <button onclick="openClass('${classId}')">Open</button>
          </div>
        `;
        document.getElementById("view").innerHTML = html + "</div>";
      });
    });
  });
}

/* OPEN CLASS */
function openClass(classId) {
  currentClass = classId;
  const date = new Date().toISOString().split("T")[0];

  db.ref(`classes/${classId}/students`).once("value").then(snap => {
    let html = `<h2>Mark Attendance (${date})</h2><div class="card">`;
    snap.forEach(s => {
      html += `
        <div class="student">
          ${s.val().name} (Roll ${s.val().roll})
          <select id="att-${s.key}">
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      `;
    });
    html += `<button onclick="saveAttendance('${date}')">Save Attendance</button></div>`;
    document.getElementById("view").innerHTML = html;
  });
}

/* SAVE ATTENDANCE */
function saveAttendance(date) {
  db.ref(`classes/${currentClass}/students`).once("value").then(snap => {
    snap.forEach(s => {
      const status = document.getElementById(`att-${s.key}`).value;
      db.ref(`classes/${currentClass}/attendance/${date}/${s.key}`).set(status);
    });
    alert("Attendance Saved!");
  });
}

/* DEFAULTERS */
function showDefaulters() {
  document.getElementById("pageTitle").innerText = "Defaulters";
  document.getElementById("view").innerHTML = `<p>Defaulters logic auto from attendance %</p>`;
                                             }
