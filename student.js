/********************************
 🔥 GLOBAL STATE
*********************************/
let currentUser = null;
let currentClassId = "";
let selectedSubjectId = "";
let attendanceChart = null;

/********************************
 🔐 AUTH (FIXED – NO AUTO LOGOUT)
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  db.ref("students/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) {
      logout();
      return;
    }

    currentClassId = snap.val().classId;

    loadDashboard();
    loadSubjects();
  });
});

/********************************
 📊 DASHBOARD
*********************************/
function loadDashboard() {
  db.ref("classes/" + currentClassId).once("value").then(snap => {
    const data = snap.val() || {};
    const subjectCount = Object.keys(data.subjects || {}).length;

    document.getElementById("classCount").innerText = subjectCount;
  });
}

/********************************
 📚 SUBJECTS / CLASSES PAGE
*********************************/
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const classList = document.getElementById("classList");

  select.innerHTML = `<option value="">Select Subject</option>`;
  classList.innerHTML = "";

  db.ref("classes/" + currentClassId + "/subjects").once("value").then(snap => {
    snap.forEach(sub => {
      const id = sub.key;
      const name = sub.val().name;

      // dropdown
      select.innerHTML += `<option value="${id}">${name}</option>`;

      // subject card
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${name}</h3>
        <p>View Attendance</p>
      `;
      card.onclick = () => openSubject(id);

      classList.appendChild(card);
    });
  });
}

function openSubject(id) {
  selectedSubjectId = id;
  document.getElementById("subjectSelect").value = id;
  showSection("attendance");
  loadSubjectAttendance();
}

/********************************
 📝 ATTENDANCE (DATE WISE + %)
*********************************/
function loadSubjectAttendance() {
  selectedSubjectId = document.getElementById("subjectSelect").value;
  if (!selectedSubjectId) return;

  const body = document.getElementById("attendanceTableBody");
  body.innerHTML = `<tr><td colspan="2">Loading...</td></tr>`;

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`)
    .once("value")
    .then(snap => {
      body.innerHTML = "";

      let present = 0;
      let total = 0;
      let labels = [];
      let values = [];

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
          </tr>
        `;

        labels.push(dateSnap.key);
        values.push(status === "P" ? 1 : 0);
      });

      const percent = total ? ((present / total) * 100).toFixed(1) : 0;
      document.getElementById("attendancePercent").innerText = percent + "%";

      drawChart(labels, values);
    });
}

/********************************
 📈 ATTENDANCE CHART
*********************************/
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
        backgroundColor: "rgba(37,99,235,0.25)",
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            stepSize: 1,
            callback: v => (v === 1 ? "Present" : "Absent")
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/********************************
 📂 UI – SIDEBAR (FULL FIX)
*********************************/
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

/* Close sidebar on navigation */
function showSection(id) {
  document.querySelectorAll(".section").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");

  closeSidebar();
}

/* Close sidebar on outside click */
document.addEventListener("click", e => {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.querySelector(".menu-btn");

  if (
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    !menuBtn.contains(e.target)
  ) {
    closeSidebar();
  }
});

/* Prevent sidebar self-close */
document.getElementById("sidebar")?.addEventListener("click", e => {
  e.stopPropagation();
});

/********************************
 🚪 LOGOUT
*********************************/
function logout() {
  auth.signOut().then(() => {
    location.href = "index.html";
  });
}
