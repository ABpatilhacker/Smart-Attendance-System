/* =====================
   BASIC DATA (JSON)
===================== */
const students = [
  { roll: 1, name: "Aarav" },
  { roll: 2, name: "Ishaan" },
  { roll: 3, name: "Kabir" },
  { roll: 4, name: "Rohan" },
  { roll: 5, name: "Vihaan" }
];

let attendance = {};
const today = new Date().toISOString().split("T")[0];

/* =====================
   INIT
===================== */
document.getElementById("recordDate").value = today;
loadAttendanceTable();
loadProfile();
updateDashboard();
renderChart();

/* =====================
   SIDEBAR FIX (FINAL)
===================== */
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // ⛔ stop document click
  sidebar.classList.toggle("open");
});

sidebar.addEventListener("click", (e) => {
  e.stopPropagation(); // ⛔ clicking inside sidebar won't close it
});

document.addEventListener("click", () => {
  sidebar.classList.remove("open"); // ✅ click outside closes sidebar
});

/* =====================
   NAVIGATION (KEEP)
===================== */
function navigate(id) {
  document.querySelectorAll("section").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
  sidebar.classList.remove("open"); // ✅ close after navigation
}

/* =====================
   ATTENDANCE TABLE
===================== */
function loadAttendanceTable() {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  students.sort((a,b)=>a.roll-b.roll).forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.roll}</td>
      <td>${s.name}</td>
      <td>
        <button class="present-btn" onclick="mark(${s.roll},'P',this)">P</button>
        <button class="absent-btn" onclick="mark(${s.roll},'A',this)">A</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function mark(roll, status, btn) {
  attendance[roll] = status;

  const buttons = btn.parentElement.querySelectorAll("button");
  buttons.forEach(b => b.classList.remove("active"));

  btn.classList.add("active");
}

/* =====================
   SAVE ATTENDANCE
===================== */
function saveAttendance() {
  localStorage.setItem(today, JSON.stringify(attendance));

  document.querySelectorAll("#attendanceTable button").forEach(b => {
    b.disabled = true;
    b.style.opacity = "0.5";
  });

  updateDashboard();
  renderChart();
  alert("Attendance Saved Successfully ✔");
}

/* =====================
   RECORDS
===================== */
function loadRecord() {
  const date = document.getElementById("recordDate").value;
  const data = JSON.parse(localStorage.getItem(date)) || {};
  const body = document.getElementById("recordBody");

  body.innerHTML = "";
  students.forEach(s => {
    body.innerHTML += `
      <tr>
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td>${data[s.roll] || "-"}</td>
      </tr>
    `;
  });
}

/* =====================
   DEFAULTERS
===================== */
function loadDefaulters() {
  const body = document.getElementById("defaulterBody");
  body.innerHTML = "";

  students.forEach(s => {
    let total = 0, present = 0;

    for (let k in localStorage) {
      const d = JSON.parse(localStorage.getItem(k));
      if (d && d[s.roll]) {
        total++;
        if (d[s.roll] === "P") present++;
      }
    }

    const percent = total ? Math.round((present/total)*100) : 0;
    if (percent < 75) {
      body.innerHTML += `
        <tr>
          <td>${s.roll}</td>
          <td>${s.name}</td>
          <td>${percent}%</td>
        </tr>
      `;
    }
  });
}

/* =====================
   DASHBOARD
===================== */
function updateDashboard() {
  document.getElementById("totalStudents").innerText = students.length;

  const todayData = JSON.parse(localStorage.getItem(today)) || {};
  const present = Object.values(todayData).filter(v=>v==="P").length;
  const percent = students.length ? Math.round((present/students.length)*100) : 0;

  document.getElementById("todayAttendance").innerText = percent + "%";
  loadDefaulters();
}

/* =====================
   CHART
===================== */
function renderChart() {
  const ctx = document.getElementById("attendanceChart");
  const data = JSON.parse(localStorage.getItem(today)) || {};

  let p=0,a=0;
  Object.values(data).forEach(v=>v==="P"?p++:a++);

  new Chart(ctx,{
    type:"doughnut",
    data:{
      labels:["Present","Absent"],
      datasets:[{
        data:[p,a],
        backgroundColor:["#22c55e","#ef4444"]
      }]
    }
  });
}

/* =====================
   PROFILE
===================== */
function loadProfile() {
  teacherName.value = localStorage.getItem("tname") || "Prof. Rahul Sharma";
  teacherEmail.value = "teacher@college.edu";
  document.getElementById("welcomeText").innerText =
    "Welcome, " + teacherName.value;
}

function saveProfile() {
  localStorage.setItem("tname", teacherName.value);
  document.getElementById("welcomeText").innerText =
    "Welcome, " + teacherName.value;
  alert("Profile Updated ✔");
}

/* =====================
   LOGOUT
===================== */
function logout() {
  alert("Logged out");
}
