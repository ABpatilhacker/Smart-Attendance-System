/*********************************
 🔥 GLOBAL STATE
**********************************/
let currentUser = null;
let currentClassId = "";
let selectedSubjectKey = "";
let attendanceChart = null;

/*********************************
 🔐 AUTH
**********************************/
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  db.ref("users/" + user.uid).on("value", snap => {
    if (!snap.exists()) {
      auth.signOut();
      location.href = "index.html";
      return;
    }

    const u = snap.val();

    if (u.role !== "student") {
      auth.signOut();
      location.href = "index.html";
      return;
    }

    currentClassId = u.classId;
    loadDashboard();
    loadSubjects();
  });
});

/*********************************
 📊 DASHBOARD (REALTIME)
**********************************/
function loadDashboard() {
  db.ref(`classes/${currentClassId}/subjects`).on("value", snap => {
    document.getElementById("classCount").innerText =
      snap.exists() ? snap.numChildren() : 0;
  });

  calculateOverallAttendance();
}

/*********************************
 📚 SUBJECTS
**********************************/
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const list = document.getElementById("classList");

  select.innerHTML = `<option value="">Select Subject</option>`;
  list.innerHTML = "";

  db.ref(`classes/${currentClassId}/subjects`).on("value", snap => {
    select.innerHTML = `<option value="">Select Subject</option>`;
    list.innerHTML = "";

    snap.forEach(sub => {
      const sid = sub.key;
      const name = sub.val().name;
      const key = `${currentClassId}_${sid}`;

      select.innerHTML += `<option value="${key}">${name}</option>`;

      list.innerHTML += `
        <div class="card glow" onclick="openSubject('${key}')">
          <h3>${name}</h3>
          <p>View Attendance</p>
        </div>`;
    });
  });
}

function openSubject(key) {
  selectedSubjectKey = key;
  document.getElementById("subjectSelect").value = key;
  showSection("attendance");
  loadSubjectAttendance();
}

/*********************************
 📝 SUBJECT ATTENDANCE (REALTIME)
**********************************/
function loadSubjectAttendance() {
  selectedSubjectKey = document.getElementById("subjectSelect").value;
  if (!selectedSubjectKey) return;

  const body = document.getElementById("attendanceTableBody");
  body.innerHTML = `<tr><td colspan="2">Loading...</td></tr>`;

  db.ref(`attendance/${selectedSubjectKey}`).on("value", snap => {
    body.innerHTML = "";

    let present = 0;
    let total = 0;
    let labels = [];
    let values = [];

    if (!snap.exists()) {
      body.innerHTML = `<tr><td colspan="2">No records</td></tr>`;
      updatePercent(0);
      drawChart([], []);
      return;
    }

    snap.forEach(dateSnap => {
      const status = dateSnap.val()[currentUser.uid] || "-";

      if (status !== "-") {
        total++;
        if (status === "P") present++;
      }

      body.innerHTML += `
        <tr>
          <td>${dateSnap.key}</td>
          <td class="${status === "P" ? "present" : status === "A" ? "absent" : ""}">
            ${status}
          </td>
        </tr>`;

      labels.push(dateSnap.key);
      values.push(status === "P" ? 1 : 0);
    });

    const percent = total ? ((present / total) * 100).toFixed(1) : 0;
    updatePercent(percent);
    drawChart(labels, values);
  });
}

/*********************************
 📈 OVERALL ATTENDANCE %
**********************************/
function calculateOverallAttendance() {
  db.ref("attendance").on("value", snap => {
    let present = 0;
    let total = 0;

    snap.forEach(subSnap => {
      if (!subSnap.key.startsWith(currentClassId + "_")) return;

      subSnap.forEach(dateSnap => {
        const v = dateSnap.val()[currentUser.uid];
        if (v) {
          total++;
          if (v === "P") present++;
        }
      });
    });

    const percent = total ? ((present / total) * 100).toFixed(1) : 0;
    updatePercent(percent);
  });
}

function updatePercent(val) {
  document.getElementById("attendancePercent").innerText = val + "%";
}

/*********************************
 📊 CHART
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
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.3)",
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
 🧭 UI
**********************************/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");

  if (id === "dashboard") {
    setTimeout(() => {
      if (attendanceChart) attendanceChart.resize();
    }, 200);
  }
}

/*********************************
 🚪 LOGOUT
**********************************/
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}
