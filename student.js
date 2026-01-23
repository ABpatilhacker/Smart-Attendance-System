let currentUser = null;
let currentClassId = "";
let selectedSubjectId = "";
let attendanceChart = null;

/* ================= AUTH ================= */
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "index.html";
  currentUser = user;

  db.ref("students/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) return logout();

    currentClassId = snap.val().classId;
    loadDashboard();
    loadSubjects();
  });
});

/* ================= DASHBOARD ================= */
function loadDashboard() {
  db.ref("classes/" + currentClassId).once("value").then(snap => {
    document.getElementById("classCount").innerText = Object.keys(snap.val().subjects || {}).length;
  });
}

/* ================= SUBJECTS ================= */
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const classList = document.getElementById("classList");

  select.innerHTML = `<option value="">Select Subject</option>`;
  classList.innerHTML = "";

  db.ref("classes/" + currentClassId + "/subjects").once("value").then(snap => {
    snap.forEach(sub => {
      const id = sub.key;
      const name = sub.val().name;

      /* dropdown */
      select.innerHTML += `<option value="${id}">${name}</option>`;

      /* class card */
      classList.innerHTML += `
        <div class="card" onclick="openSubject('${id}')">
          <h3>${name}</h3>
          <p>View Attendance</p>
        </div>`;
    });
  });
}

function openSubject(id) {
  selectedSubjectId = id;
  document.getElementById("subjectSelect").value = id;
  showSection("attendance");
  loadSubjectAttendance();
}

/* ================= ATTENDANCE ================= */
function loadSubjectAttendance() {
  selectedSubjectId = document.getElementById("subjectSelect").value;
  if (!selectedSubjectId) return;

  const body = document.getElementById("attendanceTableBody");
  body.innerHTML = `<tr><td colspan="2">Loading...</td></tr>`;

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`)
    .once("value")
    .then(snap => {
      body.innerHTML = "";
      let present = 0, total = 0;
      let labels = [], values = [];

      snap.forEach(dateSnap => {
        const status = dateSnap.val()[currentUser.uid] || "-";
        if (status !== "-") {
          total++;
          if (status === "P") present++;
        }

        body.innerHTML += `
          <tr>
            <td>${dateSnap.key}</td>
            <td class="${status === 'P' ? 'present' : status === 'A' ? 'absent' : ''}">
              ${status}
            </td>
          </tr>`;

        labels.push(dateSnap.key);
        values.push(status === "P" ? 1 : 0);
      });

      const percent = total ? ((present / total) * 100).toFixed(1) : 0;
      document.getElementById("attendancePercent").innerText = percent + "%";

      drawChart(labels, values);
    });
}

/* ================= CHART ================= */
function drawChart(labels, data) {
  const ctx = document.getElementById("attendanceChart");
  if (attendanceChart) attendanceChart.destroy();

  attendanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Attendance",
        data,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.25)",
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      scales: {
        y: {
          ticks: {
            callback: v => v ? "Present" : "Absent"
          },
          min: 0,
          max: 1
        }
      }
    }
  });
}

/* ================= UI ================= */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ================= LOGOUT ================= */
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}
