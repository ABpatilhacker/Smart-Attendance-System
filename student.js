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

function updatePercent(percent) {
  const attendancePercent = document.getElementById("attendancePercent");
  if (!attendancePercent) return;
  attendancePercent.innerText = percent + "%";
}
/* 🔔 Minimum attendance realtime */
db.ref("settings/minimumAttendance").on("value", s => {
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
    loadDashboard();
    loadSubjects();
  });
});
function calculateOverallAttendance() {
  let present = 0, total = 0;

  db.ref("attendance/" + currentClassId).once("value").then(snap => {
    snap.forEach(subject =>
      subject.forEach(date => {
        const st = date.val()[currentUser.uid];
        if (st) {
          total++;
          if (st === "P") present++;
        }
      })
    );

    const percent = total ? Math.round((present / total) * 100) : 0;
    updatePercent(percent);
    showDefaulterAlert(percent);
  });
}

/* 📊 DASHBOARD */
function loadDashboard() {
  
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
  let present = 0, total = 0;
  const labels = [], data = [];

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`)
    .once("value")
    .then(snap => {

      if (!snap.exists()) {
        attendanceTableBody.innerHTML =
          `<tr><td colspan="2">No attendance recorded</td></tr>`;
        return;
      }

      // ✅ Sort dates properly
      const dates = Object.keys(snap.val()).sort();

      dates.forEach(date => {
        const status = snap.val()[date][currentUser.uid] || "-";

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
              ${status === "P" ? "Present" : status === "A" ? "Absent" : "-"}
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

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}/${date}`)
    .once("value")
    .then(snap => {
      if (!snap.exists()) {
        attendanceTableBody.innerHTML =
          `<tr><td colspan="2">No record for selected date</td></tr>`;
        return;
      }

      const status = snap.val()[currentUser.uid];

      attendanceTableBody.innerHTML = `
        <tr>
          <td>${new Date(date).toDateString()}</td>
          <td class="${status === "P" ? "present" : "absent"}">
            ${status === "P" ? "Present" : "Absent"}
          </td>
        </tr>
      `;
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
  } else {
    btn.innerText = "🌙";
  }
  }
