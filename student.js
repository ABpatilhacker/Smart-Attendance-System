/******************************
 🔥 AUTH CHECK
******************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "student") {
      alert("Access denied");
      auth.signOut();
      return;
    }

    const data = snap.val();
    document.getElementById("studentNameTop").innerText = data.name;
    document.getElementById("dashName").innerText = data.name;

    loadDashboard(user.uid);
    loadClasses(user.uid);
  });
});

/******************************
 📌 SIDEBAR
******************************/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

document.addEventListener("click", e => {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.querySelector(".menu-btn");
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/******************************
 🚪 LOGOUT
******************************/
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/******************************
 📊 DASHBOARD
******************************/
function loadDashboard(uid) {
  db.ref("users/" + uid).once("value").then(userSnap => {
    const student = userSnap.val();
    const classId = student.classId;
    if (!classId) return;

    db.ref("classes/" + classId).once("value").then(clsSnap => {
      const cls = clsSnap.val();
      if (!cls) return;

      document.getElementById("classCount").innerText =
        Object.keys(cls.subjects || {}).length;

      let present = 0, total = 0;

      db.ref("attendance").once("value").then(attSnap => {
        attSnap.forEach(subjectSnap => {
          subjectSnap.forEach(dateSnap => {
            const status = dateSnap.val()[uid];
            if (status) {
              total++;
              if (status === "P") present++;
            }
          });
        });

        const percent = total ? ((present / total) * 100).toFixed(1) : 0;
        document.getElementById("attendancePercent").innerText = percent + "%";
      });
    });
  });
}

/******************************
 🏫 CLASSES
******************************/
function loadClasses(uid) {
  db.ref("users/" + uid).once("value").then(userSnap => {
    const classId = userSnap.val().classId;
    if (!classId) return;

    db.ref("classes/" + classId).once("value").then(clsSnap => {
      const cls = clsSnap.val();
      const container = document.getElementById("classList");
      container.innerHTML = "";

      Object.keys(cls.subjects || {}).forEach(subId => {
        const sub = cls.subjects[subId];

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${sub.name}</h3>
          <p>Subject</p>
        `;

        card.onclick = () => {
          showSection("attendance");
          loadAttendance(uid, classId, subId);
        };

        container.appendChild(card);
      });
    });
  });
}

/******************************
 📅 ATTENDANCE
******************************/
function loadAttendance(uid, classId, subjectId) {
  const body = document.querySelector("#attendanceTable tbody");
  body.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

  db.ref(`attendance/${classId}/${subjectId}`).once("value").then(attSnap => {
    if (!attSnap.exists()) {
      body.innerHTML = "<tr><td colspan='3'>No attendance records</td></tr>";
      return;
    }

    body.innerHTML = "";

    attSnap.forEach(dateSnap => {
      const status = dateSnap.val()[uid] || "-";
      body.innerHTML += `
        <tr>
          <td>${dateSnap.key}</td>
          <td>${subjectId}</td>
          <td class="${status === "P" ? "present" : status === "A" ? "absent" : ""}">
            ${status}
          </td>
        </tr>
      `;
    });
  });
}
