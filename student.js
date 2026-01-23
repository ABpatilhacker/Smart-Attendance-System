let currentUser = null;
let currentClassId = "";
let selectedSubjectId = "";
let attendanceChart = null;
const MIN_ATTENDANCE = 75;

/* ================= AUTH ================= */
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "index.html";
  currentUser = user;

  db.ref("students/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) return;
    document.getElementById("studentName").innerText = snap.val().name;
    currentClassId = snap.val().classId;
    loadDashboard();
    loadSubjects();
  });
});

/* ================= SIDEBAR ================= */
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

menuBtn.onclick = () => sidebar.classList.toggle("open");

document.addEventListener("click", e => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

/* ================= UI ================= */
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  sidebar.classList.remove("open");
}

/* ================= DASHBOARD ================= */
function loadDashboard() {
  db.ref("classes/" + currentClassId + "/subjects").once("value").then(snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

/* ================= SUBJECTS ================= */
function loadSubjects() {
  const list = document.getElementById("classList");
  const select = document.getElementById("subjectSelect");
  list.innerHTML = "";
  select.innerHTML = `<option value="">Select Subject</option>`;

  db.ref("classes/" + currentClassId + "/subjects").once("value").then(snap => {
    snap.forEach(sub => {
      const id = sub.key;
      const name = sub.val().name;

      list.innerHTML += `
        <div class="card" onclick="openSubject('${id}')">
          <h3>${name}</h3>
          <p>View Attendance</p>
        </div>`;

      select.innerHTML += `<option value="${id}">${name}</option>`;
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
  const body = document.getElementById("attendanceTableBody");
  selectedSubjectId = document.getElementById("subjectSelect").value;
  if (!selectedSubjectId) return;

  body.innerHTML = `<tr><td colspan="2">Loading...</td></tr>`;

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`).once("value").then(snap => {
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
          <td class="${status === 'P' ? 'present' : status === 'A' ? 'absent' : ''}">${status}</td>
        </tr>`;

      labels.push(dateSnap.key);
      values.push(status === "P" ? 1 : 0);
    });

    const percent = total ? ((present / total) * 100).toFixed(1) : 0;
    document.getElementById("attendancePercent").innerText = percent + "%";
    drawChart(labels, values);
    checkAndSendWarning(selectedSubjectId, percent);
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
        y: { min: 0, max: 1 }
      }
    }
  });
}

/* ================= WARNING ================= */
function checkAndSendWarning(subjectId, percent) {
  if (percent >= MIN_ATTENDANCE) return;

  const ref = db.ref(`students/${currentUser.uid}/warnings/${subjectId}`);
  ref.once("value").then(snap => {
    if (snap.exists()) return;

    db.ref(`messages/${currentUser.uid}`).push({
      from: "System",
      text: `⚠️ Attendance Alert: ${percent}% (Minimum ${MIN_ATTENDANCE}%)`,
      time: Date.now(),
      read: false
    });

    ref.set(true);
  });
}

/* ================= LOGOUT ================= */
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}
