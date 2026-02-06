/*********************************
 🔥 GLOBAL STATE
**********************************/
let currentUser = null;
let currentClassId = "";
let selectedSubjectId = "";
let attendanceChart = null;
let MIN_ATTENDANCE = 75;

/*********************************
 🔁 MIN ATTENDANCE (REALTIME)
**********************************/
db.ref("settings/minimumAttendance").on("value", snap => {
  if (snap.exists()) {
    MIN_ATTENDANCE = Number(snap.val());
  }
});

/*********************************
 🔐 AUTH CHECK
**********************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) {
      auth.signOut();
      location.href = "index.html";
      return;
    }

    const data = snap.val();

    if (data.role !== "student") {
      auth.signOut();
      location.href = "index.html";
      return;
    }

    currentClassId = data.classId;

    loadDashboard();
    loadSubjects();
  });
});

/*********************************
 📊 DASHBOARD
**********************************/
function loadDashboard() {
  // Subjects count
  db.ref("classes/" + currentClassId + "/subjects").on("value", snap => {
    document.getElementById("classCount").innerText =
      snap.exists() ? snap.numChildren() : 0;
  });

  calculateOverallAttendance();
  calculateMonthlySummary();
}

/*********************************
 📚 SUBJECTS
**********************************/
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const list = document.getElementById("classList");

  select.innerHTML = `<option value="">Select Subject</option>`;
  list.innerHTML = "";

  db.ref("classes/" + currentClassId + "/subjects").on("value", snap => {
    select.innerHTML = `<option value="">Select Subject</option>`;
    list.innerHTML = "";

    snap.forEach(sub => {
      const subjectId = sub.key;
      const subjectName = sub.val().name;

      // Dropdown
      select.innerHTML += `<option value="${subjectId}">${subjectName}</option>`;

      // Card
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>${subjectName}</h3><p>View Attendance</p>`;
      card.onclick = () => openSubject(subjectId, subjectName);
      list.appendChild(card);
    });
  });
}

function openSubject(id, name) {
  selectedSubjectId = id;
  document.getElementById("subjectSelect").value = id;

  document.getElementById("metaSubject").innerText = name;
  document.getElementById("metaClass").innerText = currentClassId;

  showSection("attendance");
  loadSubjectAttendance();
}

/*********************************
 📝 SUBJECT ATTENDANCE (ERP STYLE)
**********************************/
function loadSubjectAttendance() {
  const select = document.getElementById("subjectSelect");
  selectedSubjectId = select.value;

  if (!selectedSubjectId) return;

  const tbody = document.getElementById("attendanceTableBody");
  tbody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`)
    .on("value", snap => {

      tbody.innerHTML = "";

      let present = 0;
      let total = 0;
      const labels = [];
      const values = [];

      if (!snap.exists()) {
        tbody.innerHTML = `<tr><td colspan="3">No attendance records</td></tr>`;
        updateMeta(0);
        drawChart([], []);
        return;
      }

      snap.forEach(day => {
        const date = day.key;
        const status = day.val()[currentUser.uid] || "-";

        if (status !== "-") {
          total++;
          if (status === "P") present++;
        }

        labels.push(date);
        values.push(status === "P" ? 1 : 0);

        const d = new Date(date);
        const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });

        tbody.innerHTML += `
          <tr>
            <td>${date}</td>
            <td>${dayName}</td>
            <td class="${status === "P" ? "status-present" : status === "A" ? "status-absent" : ""}">
              ${status}
            </td>
          </tr>`;
      });

      const percent = total ? Math.round((present / total) * 100) : 0;
      updateMeta(percent);
      showPrediction(present, total);
      drawChart(labels, values);
    });
}

/*********************************
 📈 OVERALL ATTENDANCE %
**********************************/
function calculateOverallAttendance() {
  db.ref("attendance/" + currentClassId).on("value", snap => {
    let present = 0;
    let total = 0;

    snap.forEach(subject =>
      subject.forEach(day => {
        const status = day.val()[currentUser.uid];
        if (status) {
          total++;
          if (status === "P") present++;
        }
      })
    );

    const percent = total ? Math.round((present / total) * 100) : 0;
    document.getElementById("attendancePercent").innerText = percent + "%";
  });
}

/*********************************
 📅 MONTHLY SUMMARY
**********************************/
function calculateMonthlySummary() {
  const now = new Date();
  let present = 0;
  let total = 0;

  db.ref("attendance/" + currentClassId).once("value").then(snap => {
    snap.forEach(subject =>
      subject.forEach(day => {
        const d = new Date(day.key);
        const status = day.val()[currentUser.uid];

        if (status && d.getMonth() === now.getMonth()) {
          total++;
          if (status === "P") present++;
        }
      })
    );

    document.getElementById("monthlySummary").innerText =
      total ? `${present}/${total} (${Math.round((present / total) * 100)}%)` : "--";
  });
}

/*********************************
 🔮 ATTENDANCE PREDICTION
**********************************/
function showPrediction(present, total) {
  let miss = 0;
  while (((present / (total + miss)) * 100) >= MIN_ATTENDANCE) miss++;

  document.getElementById("predictionText").innerText =
    `Can miss ${Math.max(miss - 1, 0)} classes`;
}

/*********************************
 🧾 META INFO
**********************************/
function updateMeta(percent) {
  document.getElementById("metaPercent").innerText = percent + "%";
  document.getElementById("metaStatus").innerText =
    percent >= MIN_ATTENDANCE ? "Safe" : "At Risk";
}

/*********************************
 📊 CHART (ERP STYLE)
**********************************/
function drawChart(labels, data) {
  const ctx = document.getElementById("attendanceChart");
  if (!ctx) return;

  if (attendanceChart) attendanceChart.destroy();

  attendanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Attendance",
        data,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.15)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            callback: v => v === 1 ? "Present" : "Absent"
          }
        }
      }
    }
  });
}

/*********************************
 📄 PDF EXPORT
**********************************/
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.text("Attendance Report", 14, 16);
  pdf.text(`Student: ${currentUser.email}`, 14, 26);
  pdf.text(`Class: ${currentClassId}`, 14, 36);

  pdf.save("attendance-report.pdf");
}

/*********************************
 🚪 LOGOUT
**********************************/
function logout() {
  auth.signOut().then(() => location.href = "index.html");
     }
