/******** FIREBASE ********/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

let currentClass = "fybca";
let attendanceData = {};
let chart;

/******** AUTH ********/
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  else {
    document.getElementById("welcomeText").innerText =
      "Welcome, " + (user.displayName || "Teacher");
    loadStudents();
  }
});

/******** SIDEBAR ********/
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
document.getElementById("menuBtn").onclick = () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
};
overlay.onclick = () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
};

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

/******** STUDENTS ********/
function loadStudents() {
  db.ref("users").once("value", snap => {
    const students = [];
    snap.forEach(s => {
      if (s.val().role === "student" && s.val().class === currentClass) {
        students.push(s.val());
      }
    });
    students.sort((a,b) => a.roll - b.roll);
    renderAttendance(students);
  });
}

function renderAttendance(students) {
  const body = document.getElementById("attendanceBody");
  body.innerHTML = "";
  students.forEach(s => {
    body.innerHTML += `
      <tr>
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td>
          <button class="att-btn present" onclick="mark('${s.roll}','P',this)">P</button>
          <button class="att-btn absent" onclick="mark('${s.roll}','A',this)">A</button>
        </td>
      </tr>`;
  });
}

function mark(roll, status, btn) {
  attendanceData[roll] = status;
  btn.parentElement.querySelectorAll("button").forEach(b => b.style.opacity = "0.4");
  btn.style.opacity = "1";
}

/******** SAVE ********/
function saveAttendance() {
  const date = new Date().toISOString().split("T")[0];
  db.ref(`attendance/${currentClass}/${date}`).set(attendanceData);
  document.querySelector(".save-btn").classList.add("saved");
  renderChart();
}

/******** CHART ********/
function renderChart() {
  const p = Object.values(attendanceData).filter(v => v === "P").length;
  const a = Object.values(attendanceData).filter(v => v === "A").length;
  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("donutChart"), {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [p, a],
        backgroundColor: ["#16a34a", "#dc2626"]
      }]
    },
    options: { cutout: "70%" }
  });
}

/******** CALENDAR ********/
function loadCalendarAttendance() {
  const date = document.getElementById("calendarDate").value;
  db.ref(`attendance/${currentClass}/${date}`).once("value", snap => {
    document.getElementById("calendarResult").innerText =
      snap.exists() ? JSON.stringify(snap.val(), null, 2) : "No record";
  });
}

/******** DEFAULTERS ********/
function loadDefaulters() {
  db.ref(`attendance/${currentClass}`).once("value", snap => {
    const count = {};
    snap.forEach(d => {
      Object.entries(d.val()).forEach(([r,v]) => {
        if (!count[r]) count[r] = {p:0,t:0};
        count[r].t++;
        if (v === "P") count[r].p++;
      });
    });
    const body = document.getElementById("defaulterBody");
    body.innerHTML = "";
    Object.entries(count).forEach(([r,v]) => {
      const pct = Math.round((v.p/v.t)*100);
      if (pct < 75) {
        body.innerHTML += `<tr><td>${r}</td><td>-</td><td>${pct}%</td></tr>`;
      }
    });
  });
}

/******** LOGOUT ********/
function logout() {
  auth.signOut().then(() => location.href = "login.html");
    }
