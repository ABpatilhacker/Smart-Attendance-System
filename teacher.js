/**************** FIREBASE *****************/
firebase.initializeApp({
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89"
});

const auth = firebase.auth();
const db = firebase.database();
let currentUser;
let attendanceData = {};

/**************** AUTH *****************/
auth.onAuthStateChanged(u => {
  if (!u) location.href = "login.html";
  currentUser = u;
  loadDashboard();
  loadProfile();
});

/**************** UI *****************/
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
function openSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

/**************** DASHBOARD *****************/
function loadDashboard() {
  db.ref("users").once("value", snap => {
    let students = 0;
    snap.forEach(u => u.val().role === "student" && students++);
    document.getElementById("totalStudents").innerText = students;
  });

  db.ref("classes").once("value", snap => {
    document.getElementById("totalClasses").innerText = snap.numChildren();
  });

  renderChart();
}

function renderChart() {
  new Chart(document.getElementById("attendanceChart"), {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [80, 20],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    }
  });
}

/**************** ATTENDANCE *****************/
db.ref("classes").on("value", snap => {
  classSelect.innerHTML = "<option>Select Class</option>";
  snap.forEach(c => {
    classSelect.innerHTML += `<option value="${c.key}">${c.val().name}</option>`;
  });
});

classSelect.onchange = () => {
  attendanceTable.innerHTML = "";
  db.ref("users").once("value", snap => {
    snap.forEach(u => {
      const s = u.val();
      if (s.role === "student") {
        attendanceData[u.key] = "P";
        attendanceTable.innerHTML += `
          <tr>
            <td>${s.roll}</td>
            <td>${s.name}</td>
            <td>
              <button class="status-btn present" onclick="toggleStatus(this,'${u.key}')">P</button>
            </td>
          </tr>`;
      }
    });
  });
};

function toggleStatus(btn, uid) {
  if (attendanceData[uid] === "P") {
    attendanceData[uid] = "A";
    btn.className = "status-btn absent";
    btn.innerText = "A";
  } else {
    attendanceData[uid] = "P";
    btn.className = "status-btn present";
    btn.innerText = "P";
  }
}

function saveAttendance() {
  const date = new Date().toISOString().split("T")[0];
  db.ref("attendance/" + date).set(attendanceData)
    .then(() => alert("Attendance Saved"));
}

/**************** PROFILE *****************/
function loadProfile() {
  db.ref("users/" + currentUser.uid).once("value", snap => {
    const u = snap.val();
    profileCard.innerHTML = `
      <h3>${u.name}</h3>
      <p><strong>Email:</strong> ${u.email}</p>
      <p><strong>Role:</strong> Teacher</p>
    `;
  });
}

function logout() {
  auth.signOut();
}
