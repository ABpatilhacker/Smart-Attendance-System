const subjectSelect = document.getElementById("subjectSelect");
const classList = document.getElementById("classList");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const attendancePercent = document.getElementById("attendancePercent");
const monthlySummary = document.getElementById("monthlySummary");
const predictionText = document.getElementById("predictionText");

let currentUser, currentClassId, selectedSubjectId;
let attendanceChart = null;
let MIN_ATTENDANCE = 75;
let alertTimer = null;
let subjectAttendanceRef = null;

function updatePercent(percent) {
  const attendancePercent = document.getElementById("attendancePercent");
  if (!attendancePercent) return;
  attendancePercent.innerText = percent + "%";
}
/* 🔔 Minimum attendance realtime */
db.ref("settings/minAttendance").on("value", s => {
  if (s.exists()) MIN_ATTENDANCE = Number(s.val());
});

/* 🔐 AUTH */
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "index.html";

  currentUser = user;
  db.ref("users/" + user.uid).once("value").then(snap => {
    const u = snap.val();
    if (!u || u.role !== "student") return auth.signOut();
    currentClassId = u.classId;
    loadSubjects();
loadDashboard();
  });
});
function calculateOverallAttendance() {

  let present = 0;
  let total = 0;

  db.ref("attendance").on("value", snap => {

    present = 0;
    total = 0;

    if (!snap.exists()) {
      updatePercent(0);
      return;
    }

    // Get student roll once
    db.ref("users/" + currentUser.uid).once("value").then(userSnap => {

      const roll = userSnap.val().roll;

      snap.forEach(subjectSnap => {

        // 🔥 VERY IMPORTANT FILTER
        if (!subjectSnap.key.startsWith(currentClassId + "_")) return;

        subjectSnap.forEach(dateSnap => {

          const dayData = dateSnap.val() || {};

          // Try UID first
          let status = dayData[currentUser.uid];

          // If not found → try roll (old data)
          if (!status) {
            status = dayData[roll];
          }

          // Convert old format
          if (status === "present") status = "P";
          if (status === "absent") status = "A";

          if (status) {
            total++;
            if (status === "P") present++;
          }

        });

      });

      const percent = total
        ? Math.round((present / total) * 100)
        : 0;

      updatePercent(percent);
      showDefaulterAlert(percent);

    });

  });
}

/* 📊 DASHBOARD */
function loadDashboard() {
  calculateOverallAttendance();
}

/* 📚 SUBJECTS */
function loadSubjects() {
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  classList.innerHTML = "";

  db.ref("classes/" + currentClassId + "/subjects").on("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
    snap.forEach(s => {
      subjectSelect.innerHTML += `<option value="${s.key}">${s.val().name}</option>`;
      classList.innerHTML += `
        <div class="card" onclick="openSubject('${s.key}')">
          <h3>${s.val().name}</h3>
          <p>View Attendance</p>
        </div>`;
    });
  });
}

function openSubject(id) {
  selectedSubjectId = id;
  subjectSelect.value = id;
  showSection("attendance");
  loadSubjectAttendance();
}

/* 📝 SUBJECT ATTENDANCE */
function loadSubjectAttendance() {

  selectedSubjectId = subjectSelect.value;
  if (!selectedSubjectId) return;

  attendanceTableBody.innerHTML = "";
  let present = 0;
  let total = 0;
  const labels = [];
  const data = [];

  // Remove old listener
  if (subjectAttendanceRef) subjectAttendanceRef.off();

  subjectAttendanceRef =
  db.ref(`attendance/${currentClassId}_${selectedSubjectId}`);

  subjectAttendanceRef.on("value", snap => {

    attendanceTableBody.innerHTML = "";
    present = 0;
    total = 0;
    labels.length = 0;
    data.length = 0;

    if (!snap.exists()) {
      attendanceTableBody.innerHTML =
        `<tr><td colspan="2">No attendance recorded</td></tr>`;
      updatePercent(0);
      return;
    }

    const dates = Object.keys(snap.val()).sort();

    // 🔥 Get student roll once
    db.ref("users/" + currentUser.uid).once("value").then(userSnap => {

      const roll = userSnap.val().roll;

      dates.forEach(date => {

        const dayData = snap.val()[date] || {};

        // Try UID first (new format)
        let status = dayData[currentUser.uid];

        // If not found → try roll (old format)
        if (!status) {
          status = dayData[roll];
        }

        // Convert old values
        if (status === "present") status = "P";
        if (status === "absent") status = "A";

        status = status || "-";

        if (status !== "-") {
          total++;
          if (status === "P") present++;
        }

        labels.push(date);
        data.push(status === "P" ? 1 : 0);

        attendanceTableBody.innerHTML += `
          <tr>
            <td>${new Date(date).toDateString()}</td>
            <td class="${status === "P" ? "present" : "absent"}">
              ${status === "P" ? "Present" :
                status === "A" ? "Absent" : "-"}
            </td>
          </tr>
        `;
      });

      const percent = total
        ? Math.round((present / total) * 100)
        : 0;

      updatePercent(percent);
      drawChart(labels, data);
      showDefaulterAlert(percent);

    });

  });
}
// ✅ THIS LINE
function showDefaulterAlert(percent) {
  const banner = document.getElementById("alertBanner");
  if (!banner) return;

  if (percent < MIN_ATTENDANCE) {
    banner.classList.add("show");
  } else {
    banner.classList.remove("show");
  }
}

function closeAlert() {
  const banner = document.getElementById("alertBanner");
  if (banner) banner.classList.remove("show");
}

/* 📊 CHART */
function drawChart(labels, data) {
  const ctx = document.getElementById("attendanceChartEl");
  if (!ctx) return;

  if (attendanceChart) attendanceChart.destroy();

  attendanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Attendance",
        data,
        fill: true,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.2)",
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

/* 📄 PDF */
function exportPDF() {
  const pdf = new jspdf.jsPDF();
  pdf.text("Attendance Report", 14, 15);
  pdf.save("attendance.pdf");
}
    
function filterByDate() {

  const date = document.getElementById("dateFilter").value;
  if (!date || !selectedSubjectId) return;

  attendanceTableBody.innerHTML = "";

db.ref(`attendance/${currentClassId}_${selectedSubjectId}/${date}`)
    .once("value")
    .then(snap => {

      if (!snap.exists()) {
        attendanceTableBody.innerHTML =
          `<tr><td colspan="2">No record for selected date</td></tr>`;
        return;
      }

      // 🔥 Get student roll once
      db.ref("users/" + currentUser.uid).once("value").then(userSnap => {

        const roll = userSnap.val().roll;
        const dayData = snap.val() || {};

        // Try UID first
        let status = dayData[currentUser.uid];

        // If not found → try roll (old format)
        if (!status) {
          status = dayData[roll];
        }

        // Convert old values
        if (status === "present") status = "P";
        if (status === "absent") status = "A";

        status = status || "-";

        attendanceTableBody.innerHTML = `
          <tr>
            <td>${new Date(date).toDateString()}</td>
            <td class="${status === "P" ? "present" : "absent"}">
              ${status === "P" ? "Present" :
                status === "A" ? "Absent" : "-"}
            </td>
          </tr>
        `;
      });

    });
}
function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
  function toggleTheme() {
  document.body.classList.toggle("dark");

  const btn = document.querySelector(".theme-btn");

  if (document.body.classList.contains("dark")) {
    btn.innerText = "☀";
    localStorage.setItem("theme","dark");
  } else {
    btn.innerText = "🌙";
    localStorage.setItem("theme","light");
  }
}

/* Load saved theme */
window.addEventListener("load", () => {
  const saved = localStorage.getItem("theme");
  const btn = document.querySelector(".theme-btn");

  if (saved === "dark") {
    document.body.classList.add("dark");
    btn.innerText = "☀";
  }
});
