const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentClass = "";
let attendanceData = {};

auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  else {
    document.getElementById("welcomeName").innerText = "Welcome, Teacher";
    loadClasses();
  }
});

function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

function go(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

function loadClasses() {
  const sel = document.getElementById("classSelect");
  db.ref("classes").once("value").then(snap => {
    sel.innerHTML = "";
    snap.forEach(c => {
      sel.innerHTML += `<option value="${c.key}">${c.val().name}</option>`;
    });
    currentClass = sel.value;
    loadStudents();
  });
}

function loadStudents() {
  currentClass = classSelect.value;
  attendanceBody.innerHTML = "";
  attendanceData = {};

  db.ref(`classes/${currentClass}/students`).once("value").then(snap => {
    const students = [];
    snap.forEach(s => students.push({ id: s.key, ...s.val() }));
    students.sort((a,b)=>a.roll-b.roll);

    students.forEach(s => {
      attendanceBody.innerHTML += `
        <tr>
          <td>${s.roll}</td>
          <td>${s.name}</td>
          <td>
            <button class="present-btn" onclick="mark('${s.id}','present',this)">P</button>
            <button class="absent-btn" onclick="mark('${s.id}','absent',this)">A</button>
          </td>
        </tr>`;
    });
  });
}

function mark(id, status, btn) {
  btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  attendanceData[id] = status;
}

function saveAttendance() {
  const date = new Date().toISOString().split("T")[0];
  db.ref(`attendance/${currentClass}/${date}`).set(attendanceData)
    .then(()=>alert("Attendance Saved"));
}
