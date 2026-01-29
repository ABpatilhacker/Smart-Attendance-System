/*********************************
 🔥 GLOBAL STATE
**********************************/
let currentUser = null;
let currentClassId = "";
let selectedSubjectId = "";
let attendanceChart = null;

/*********************************
/*********************************
 🔐 AUTH – FINAL & STABLE
**********************************/

// 🔥 REQUIRED: persist login across refresh / mobile / hosting
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(err => console.error("Auth persistence error:", err));

auth.onAuthStateChanged(user => {
  // ❌ Not logged in → go to login
  if (!user) {
    location.replace("index.html");
    return;
  }

  // ✅ Logged in
  currentUser = user;

  // 🔐 Verify student record ONCE (no logout loop)
  db.ref("students/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) {
      // User exists in auth but not in DB
      auth.signOut();
      location.replace("index.html");
      return;
    }

    // ✅ Safe to proceed
    currentClassId = snap.val().classId;

    loadDashboard();
    loadSubjects();
  });
});
/*********************************
 📊 DASHBOARD (REALTIME)
**********************************/
function loadDashboard() {
  // Subjects count
  db.ref("classes/" + currentClassId + "/subjects").on("value", snap => {
    document.getElementById("classCount").innerText =
      snap.exists() ? snap.numChildren() : 0;
  });

  // Overall attendance %
  calculateOverallAttendance();
}

/*********************************
 📚 SUBJECTS (REALTIME)
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
      const id = sub.key;
      const name = sub.val().name;

      // Dropdown
      select.innerHTML += `<option value="${id}">${name}</option>`;

      // Card
      list.innerHTML += `
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

/*********************************
 📝 SUBJECT ATTENDANCE (REALTIME)
**********************************/
function loadSubjectAttendance() {
  selectedSubjectId = document.getElementById("subjectSelect").value;
  if (!selectedSubjectId) return;

  const body = document.getElementById("attendanceTableBody");
  body.innerHTML = `<tr><td colspan="2">Loading...</td></tr>`;

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`)
    .on("value", snap => {
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
  db.ref("attendance/" + currentClassId).on("value", snap => {
    let present = 0;
    let total = 0;

    snap.forEach(subjectSnap => {
      subjectSnap.forEach(dateSnap => {
        const status = dateSnap.val()[currentUser.uid];
        if (status) {
          total++;
          if (status === "P") present++;
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
 📊 CHART (REALTIME SAFE)
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
            callback: v => v === 1 ? "Present" : "Absent"
          }
        }
      }
    }
  });
}

/*********************************
 🧭 UI (SIDEBAR FIXED)
**********************************/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

document.addEventListener("click", e => {
  const sidebar = document.getElementById("sidebar");
  const btn = document.querySelector(".menu-btn");

  if (
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    !btn.contains(e.target)
  ) {
    sidebar.classList.remove("open");
  }
});

function showSection(id) {
  document.querySelectorAll(".section").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
}

/*********************************
 🚪 LOGOUT (SAFE)
**********************************/
function logout() {
  auth.signOut().then(() => location.href = "index.html");
    }
