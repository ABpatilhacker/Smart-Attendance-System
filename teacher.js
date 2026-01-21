/* ===============================
   DATA (JSON STYLE)
================================ */
const students = [
  { roll: 1, name: "Aarav" },
  { roll: 2, name: "Ishaan" },
  { roll: 3, name: "Kabir" },
  { roll: 4, name: "Rohan" },
  { roll: 5, name: "Vihaan" }
];

let attendanceData = {};
let today = new Date().toISOString().split("T")[0];

/* ===============================
   INIT
================================ */
document.getElementById("recordDate").value = today;
loadAttendanceTable();
updateDashboard();
loadProfile();
renderChart();

/* ===============================
   SIDEBAR
================================ */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

document.body.addEventListener("click", e => {
  if (!e.target.closest("aside") && !e.target.closest(".topbar button")) {
    document.getElementById("sidebar").classList.remove("open");
  }
});

/* ===============================
   NAVIGATION
================================ */
function openSection(id) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
}

/* ===============================
   ATTENDANCE
================================ */
function loadAttendanceTable() {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  students.sort((a, b) => a.roll - b.roll).forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.roll}</td>
      <td>${s.name}</td>
      <td><button class="present" onclick="mark('${s.roll}','P',this)">Present</button></td>
      <td><button class="absent" onclick="mark('${s.roll}','A',this)">Absent</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function mark(roll, status, btn) {
  attendanceData[roll] = status;
  btn.parentElement.parentElement
    .querySelectorAll("button")
    .forEach(b => b.style.opacity = "0.4");
  btn.style.opacity = "1";
}

function saveAttendance() {
  localStorage.setItem(today, JSON.stringify(attendanceData));
  alert("Attendance Saved Successfully ✔");
  updateDashboard();
  renderChart();
}

/* ===============================
   RECORDS
================================ */
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
      </tr>`;
  });
}

/* ===============================
   DEFAULTERS
================================ */
function loadDefaulters() {
  const body = document.getElementById("defaulterBody");
  body.innerHTML = "";

  students.forEach(s => {
    let total = 0, present = 0;
    for (let key in localStorage) {
      const d = JSON.parse(localStorage.getItem(key));
      if (d && d[s.roll]) {
        total++;
        if (d[s.roll] === "P") present++;
      }
    }
    const percent = total ? Math.round((present / total) * 100) : 0;
    if (percent < 75) {
      body.innerHTML += `
        <tr>
          <td>${s.roll}</td>
          <td>${s.name}</td>
          <td>${percent}%</td>
        </tr>`;
    }
  });
}

/* ===============================
   DASHBOARD
================================ */
function updateDashboard() {
  document.getElementById("totalClasses").innerText = 1;
  document.getElementById("totalStudents").innerText = students.length;

  const todayData = JSON.parse(localStorage.getItem(today)) || {};
  let present = Object.values(todayData).filter(v => v === "P").length;
  let percent = students.length ? Math.round((present / students.length) * 100) : 0;
  document.getElementById("todayAttendance").innerText = percent + "%";

  loadDefaulters();
}

/* ===============================
   CHART
================================ */
function renderChart() {
  const ctx = document.getElementById("attendanceChart");
  let present = 0, absent = 0;

  const data = JSON.parse(localStorage.getItem(today)) || {};
  Object.values(data).forEach(v => v === "P" ? present++ : absent++);

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [present, absent],
        backgroundColor: ["#16a34a", "#dc2626"]
      }]
    }
  });
}

/* ===============================
   PROFILE
================================ */
function loadProfile() {
  document.getElementById("teacherName").value =
    localStorage.getItem("tname") || "Prof. Rahul Sharma";
  document.getElementById("teacherEmail").value =
    localStorage.getItem("temail") || "teacher@college.edu";
}

function saveProfile() {
  localStorage.setItem("tname", teacherName.value);
  alert("Profile Updated ✔");
}

function changePhoto(e) {
  const reader = new FileReader();
  reader.onload = () => profilePic.src = reader.result;
  reader.readAsDataURL(e.target.files[0]);
}

/* ===============================
   LOGOUT
================================ */
function logout() {
  alert("Logged Out");
                   }
