/**************** FIREBASE ****************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let teacherId = "";
let classId = "defaultClass";
let attendanceData = {};

/**************** AUTH ****************/
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "login.html";
  teacherId = user.uid;
  loadTeacher();
  loadStudents();
});

/**************** UI ****************/
function openSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

/**************** SIDEBAR ****************/
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

document.getElementById("menuBtn").onclick = () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
};

overlay.onclick = closeSidebar;

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

/**************** LOAD TEACHER ****************/
function loadTeacher() {
  db.ref("users/" + teacherId).once("value").then(snap => {
    document.getElementById("welcomeText").innerText =
      "Welcome, " + snap.val().name;
  });
}

/**************** STUDENTS ****************/
function loadStudents() {
  db.ref("users").once("value").then(snap => {
    const students = [];
    snap.forEach(s => {
      if (s.val().role === "student") students.push(s.val());
    });

    students.sort((a, b) => a.roll - b.roll);
    const body = document.getElementById("attendanceBody");
    body.innerHTML = "";

    students.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td>
          <button class="present" onclick="mark('${s.roll}','P',this)">P</button>
          <button class="absent" onclick="mark('${s.roll}','A',this)">A</button>
        </td>`;
      body.appendChild(tr);
    });
  });
}

function mark(roll, status, btn) {
  attendanceData[roll] = status;
  btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/**************** SAVE ****************/
function saveAttendance() {
  const date = new Date().toISOString().split("T")[0];
  db.ref(`attendance/${classId}/${date}`).set(attendanceData).then(() => {
    alert("Attendance Saved");
    attendanceData = {};
  });
}

/**************** RECORD VIEW ****************/
function loadRecord() {
  const date = document.getElementById("recordDate").value;
  const body = document.getElementById("recordBody");
  body.innerHTML = "";

  db.ref(`attendance/${classId}/${date}`).once("value").then(snap => {
    snap.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.key}</td><td>-</td><td>${s.val()}</td>`;
      body.appendChild(tr);
    });
  });
}

/**************** DEFAULTERS ****************/
function loadDefaulters() {
  // Hook ready – attendance % logic already compatible
}

/**************** LOGOUT ****************/
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}
