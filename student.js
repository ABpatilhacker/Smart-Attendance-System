let currentUser, currentClassId, selectedSubjectId;
let attendanceChart = null;
let MIN_ATTENDANCE = 75;
let alertTimer = null;

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

/* 📊 DASHBOARD */
function loadDashboard() {
  calculateOverallAttendance();
  calculateMonthlySummary();
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

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`).on("value", snap => {
    let p = 0, t = 0;
    let labels = [], values = [];

    attendanceTableBody.innerHTML = "";

    snap.forEach(d => {
      const st = d.val()[currentUser.uid];
      if (st) {
        t++;
        if (st === "P") p++;
      }
      labels.push(d.key);
      values.push(st === "P" ? 1 : 0);

      attendanceTableBody.innerHTML += `
        <tr>
          <td>${d.key}</td>
          <td class="${st === "P" ? "present" : "absent"}">${st || "-"}</td>
        </tr>`;
    });

    const percent = t ? Math.round((p / t) * 100) : 0;
    attendancePercent.innerText = percent + "%";
    showPrediction(p, t);
    drawChart(labels, values);
    showLiveAlert(percent < MIN_ATTENDANCE, percent);
  });
}

/* 📈 OVERALL */
function calculateOverallAttendance() {
  db.ref("attendance/" + currentClassId).on("value", snap => {
    let p = 0, t = 0;
    snap.forEach(s =>
      s.forEach(d => {
        const st = d.val()[currentUser.uid];
        if (st) {
          t++;
          if (st === "P") p++;
        }
      })
    );
    attendancePercent.innerText = t ? Math.round((p / t) * 100) + "%" : "0%";
  });
}

/* 📅 MONTHLY */
function calculateMonthlySummary() {
  const m = new Date().getMonth();
  let p = 0, t = 0;

  db.ref("attendance/" + currentClassId).once("value").then(snap => {
    snap.forEach(s =>
      s.forEach(d => {
        const dt = new Date(d.key);
        const st = d.val()[currentUser.uid];
        if (st && dt.getMonth() === m) {
          t++;
          if (st === "P") p++;
        }
      })
    );
    monthlySummary.innerText = `${p}/${t}`;
  });
}

/* 🔮 PREDICTION */
function showPrediction(p, t) {
  let miss = 0;
  while (((p / (t + miss)) * 100) >= MIN_ATTENDANCE) miss++;
  predictionText.innerText = `Can miss ${Math.max(0, miss - 1)} classes`;
}

/* 🔔 ALERT */
function showLiveAlert(show, percent) {
  if (!liveAlert) return;
  if (alertTimer) clearTimeout(alertTimer);

  if (show) {
    liveAlert.innerText = `⚠ Attendance ${percent}% (Minimum ${MIN_ATTENDANCE}%)`;
    liveAlert.classList.add("show");
    alertTimer = setTimeout(() => liveAlert.classList.remove("show"), 5000);
  } else {
    liveAlert.classList.remove("show");
  }
}

/* 📊 CHART */
function drawChart(labels, data) {
  if (attendanceChart) attendanceChart.destroy();
  attendanceChart = new Chart(attendanceChartEl || attendanceChart, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        fill: true,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.2)",
        tension: 0.4
      }]
    },
    options: { responsive: true }
  });
}

/* 📄 PDF */
function exportPDF() {
  const pdf = new jspdf.jsPDF();
  pdf.text("Attendance Report", 14, 15);
  pdf.save("attendance.pdf");
}
