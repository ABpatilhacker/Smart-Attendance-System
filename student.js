/*********************************
 🔥 GLOBAL
**********************************/
let currentUser, currentClassId, selectedSubjectId;
let attendanceChart = null;
let MIN_ATTENDANCE = 75;

/*********************************
 🔁 MIN ATTENDANCE (REALTIME)
**********************************/
db.ref("settings/minimumAttendance").on("value", s => {
  if (s.exists()) MIN_ATTENDANCE = Number(s.val());
});

/*********************************
 🔐 AUTH
**********************************/
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

/*********************************
 📊 DASHBOARD
**********************************/
function loadDashboard() {
  calculateOverallAttendance();
  calculateMonthlySummary();
}

/*********************************
 📚 SUBJECTS
**********************************/
function loadSubjects() {
  const select = subjectSelect;
  classList.innerHTML = "";
  select.innerHTML = `<option value="">Select Subject</option>`;

  db.ref("classes/" + currentClassId + "/subjects").on("value", snap => {
    snap.forEach(s => {
      select.innerHTML += `<option value="${s.key}">${s.val().name}</option>`;
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

/*********************************
 📝 SUBJECT ATTENDANCE
**********************************/
function loadSubjectAttendance() {
  selectedSubjectId = subjectSelect.value;
  if (!selectedSubjectId) return;

  attendanceTableBody.innerHTML = "";

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`)
    .on("value", snap => {
      let present = 0, total = 0;
      const labels = [], data = [];

      attendanceTableBody.innerHTML = "";

      snap.forEach(day => {
        const st = day.val()[currentUser.uid];
        if (st) {
          total++;
          if (st === "P") present++;
        }

        labels.push(day.key);
        data.push(st === "P" ? 1 : 0);

        attendanceTableBody.innerHTML += `
          <tr>
            <td>${day.key}</td>
            <td class="${st === "P" ? "present" : "absent"}">${st || "-"}</td>
          </tr>`;
      });

      const percent = total ? Math.round((present / total) * 100) : 0;
      updatePercent(percent);
      showPrediction(present, total);
      drawChart(labels, data);
      showDefaulterAlert(percent);
    });
}

/*********************************
 📈 OVERALL %
**********************************/
function calculateOverallAttendance() {
  db.ref("attendance/" + currentClassId).on("value", snap => {
    let p = 0, t = 0;
    snap.forEach(sub =>
      sub.forEach(d => {
        const st = d.val()[currentUser.uid];
        if (st) {
          t++;
          if (st === "P") p++;
        }
      })
    );
    updatePercent(t ? Math.round((p / t) * 100) : 0);
  });
}

function updatePercent(v) {
  attendancePercent.innerText = v + "%";
}

/*********************************
 📅 MONTHLY SUMMARY
**********************************/
function calculateMonthlySummary() {
  const now = new Date();
  let p = 0, t = 0;

  db.ref("attendance/" + currentClassId).once("value").then(snap => {
    snap.forEach(sub =>
      sub.forEach(d => {
        const dt = new Date(d.key);
        const st = d.val()[currentUser.uid];
        if (st && dt.getMonth() === now.getMonth()) {
          t++;
          if (st === "P") p++;
        }
      })
    );
    monthlySummary.innerText = `${p}/${t} (${t ? Math.round((p/t)*100) : 0}%)`;
  });
}

/*********************************
 🔮 PREDICTION
**********************************/
function showPrediction(present, total) {
  let miss = 0;
  while (((present / (total + miss)) * 100) >= MIN_ATTENDANCE) miss++;
  predictionText.innerText = `Can miss ${Math.max(miss - 1, 0)} classes`;
}

/*********************************
 ⚠ LIVE ALERT
**********************************/
function showDefaulterAlert(percent) {
  if (percent < MIN_ATTENDANCE) {
    toast("⚠ Attendance below minimum!");
  }
}

/*********************************
 📊 CHART
**********************************/
function drawChart(labels, values) {
  if (attendanceChart) attendanceChart.destroy();
  attendanceChart = new Chart(attendanceChartEl, {
    type: "line",
    data: { labels, datasets: [{ data: values, fill: true }] },
    options: { responsive: true }
  });
}

/*********************************
 📄 PDF EXPORT
**********************************/
function exportPDF() {
  const pdf = new jspdf.jsPDF();
  pdf.text("Attendance Report", 14, 15);
  pdf.save("attendance.pdf");
}
