let currentClass = null;
let currentSubject = null;
let attendanceData = {};

auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (snap.val().role !== "teacher") {
      alert("Access denied");
      auth.signOut();
    }
    document.getElementById("teacherName").innerText = snap.val().name;
    loadDashboard(user.uid);
    loadClasses(user.uid);
  });
});

function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

function openSection(id) {
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("pageTitle").innerText = id.charAt(0).toUpperCase()+id.slice(1);
  closeSidebar();
}

/* DASHBOARD */
function loadDashboard(uid) {
  db.ref("users/"+uid+"/assignments").once("value", snap=>{
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

/* CLASSES */
function loadClasses(uid) {
  const container = document.getElementById("classCards");
  db.ref("users/"+uid+"/assignments").once("value", snap=>{
    container.innerHTML="";
    snap.forEach(a=>{
      const [classId, subjectId] = a.key.split("_");
      db.ref("classes/"+classId).once("value", cls=>{
        container.innerHTML += `
          <div class="class-card" onclick="openAttendance('${classId}','${subjectId}')">
            <h3>${cls.val().name}</h3>
            <p>Subject: ${subjectId.toUpperCase()}</p>
          </div>`;
      });
    });
  });
}

/* ATTENDANCE */
function openAttendance(classId, subjectId) {
  currentClass = classId;
  currentSubject = subjectId;
  openSection("attendance");
  document.getElementById("attendanceTitle").innerText =
    `Attendance – ${classId.toUpperCase()} (${subjectId.toUpperCase()})`;

  const table = document.getElementById("attendanceTable");
  table.innerHTML="";
  attendanceData={};

  db.ref(`classes/${classId}/students`).once("value", snap=>{
    snap.forEach(s=>{
      attendanceData[s.key] = "P";
      table.innerHTML += `
        <tr>
          <td>${s.val().roll}</td>
          <td>${s.val().name}</td>
          <td>
            <button class="status-btn present"
              onclick="toggleStatus(this,'${s.key}')">Present</button>
          </td>
        </tr>`;
    });
  });
}

function toggleStatus(btn, id) {
  if (attendanceData[id] === "P") {
    attendanceData[id] = "A";
    btn.className = "status-btn absent";
    btn.innerText = "Absent";
  } else {
    attendanceData[id] = "P";
    btn.className = "status-btn present";
    btn.innerText = "Present";
  }
}

function saveAttendance() {
  const date = document.getElementById("attendanceDate").value;
  if (!date) return alert("Select date");

  db.ref(`attendance/${currentClass}/${currentSubject}/${date}`)
    .set(attendanceData);

  alert("Attendance saved successfully ✅");
}

function logout() {
  auth.signOut().then(()=>location.href="index.html");
}
