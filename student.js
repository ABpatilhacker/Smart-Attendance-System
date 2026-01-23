/*********************************
 🔐 AUTH CHECK
*********************************/
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

    const student = snap.val();

    document.getElementById("studentName").innerText = student.name;
    document.getElementById("dashName").innerText = student.name;

    loadDashboard(user.uid, student.classId);
    loadClasses(user.uid, student.classId);
  });
});

/*********************************
 📌 SIDEBAR
*********************************/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
}

/*********************************
 🚪 LOGOUT
*********************************/
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/*********************************
 📊 DASHBOARD
*********************************/
function loadDashboard(uid, classId) {
  if (!classId) return;

  db.ref("classes/" + classId).once("value").then(clsSnap => {
    const cls = clsSnap.val();
    const subjects = cls.subjects || {};

    document.getElementById("classCount").innerText =
      Object.keys(subjects).length;

    let present = 0;
    let total = 0;

    db.ref("attendance/" + classId).once("value").then(attSnap => {
      attSnap.forEach(subSnap => {
        subSnap.forEach(dateSnap => {
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
}

/*********************************
 🏫 CLASSES
*********************************/
function loadClasses(uid, classId) {
  if (!classId) return;

  db.ref("classes/" + classId).once("value").then(clsSnap => {
    const cls = clsSnap.val();
    const container = document.getElementById("classList");
    container.innerHTML = "";

    Object.keys(cls.subjects || {}).forEach(subjectId => {
      const subject = cls.subjects[subjectId];

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${subject.name}</h3>
        <p>Subject</p>
      `;

      card.onclick = () => {
        showSection("attendance");
        loadAttendance(uid, classId, subjectId, subject.name);
      };

      container.appendChild(card);
    });
  });
}

/*********************************
 📅 ATTENDANCE RECORDS (FIXED)
*********************************/
function loadAttendance(uid, classId, subjectId, subjectName) {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

  db.ref(`attendance/${classId}/${subjectId}`).once("value").then(attSnap => {
    if (!attSnap.exists()) {
      tbody.innerHTML = "<tr><td colspan='3'>No records found</td></tr>";
      return;
    }

    tbody.innerHTML = "";

    attSnap.forEach(dateSnap => {
      const status = dateSnap.val()[uid] || "-";

      tbody.innerHTML += `
        <tr>
          <td>${dateSnap.key}</td>
          <td>${subjectName}</td>
          <td class="${
            status === "P" ? "present" :
            status === "A" ? "absent" : ""
          }">${status}</td>
        </tr>
      `;
    });
  });
}
