// ===== AUTH & INITIALIZATION =====
auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html"; // redirect if not logged in

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "student") {
      alert("Access denied");
      auth.signOut();
    } else {
      document.getElementById("studentNameTop").innerText = snap.val().name;
      loadDashboard(user.uid);
      loadClasses(user.uid);
      loadAttendance(user.uid);
    }
  });
});

// ===== SIDEBAR =====
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open");
}

// Close sidebar when clicking outside or selecting an option
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

// ===== LOGOUT =====
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

// ===== DASHBOARD =====
function loadDashboard(uid) {
  // Get assigned classes for student
  db.ref("students/" + uid).once("value").then(snap => {
    const clsId = snap.val().classId;
    db.ref("classes/" + clsId).once("value").then(clsSnap => {
      const classData = clsSnap.val();
      const totalStudents = Object.keys(classData.students || {}).length;
      document.getElementById("dashboardClassName").innerText = classData.name;
      document.getElementById("dashboardTotalStudents").innerText = totalStudents;

      // Attendance percentage
      const subjects = classData.subjects || {};
      let attendanceSum = 0, count = 0;
      const studentRoll = uid;

      Object.keys(subjects).forEach(subjId => {
        db.ref(`attendance/${clsId}/${subjId}`).once("value").then(attSnap => {
          let present = 0, total = 0;
          attSnap.forEach(dateSnap => {
            const att = dateSnap.val()[studentRoll];
            if (att) {
              total++;
              if (att === "P") present++;
            }
          });
          if(total) {
            attendanceSum += (present/total)*100;
            count++;
          }
          const avg = count ? (attendanceSum/count).toFixed(1) : 0;
          document.getElementById("dashboardAttendance").innerText = avg + "%";
        });
      });
    });
  });
}

// ===== CLASSES =====
function loadClasses(uid) {
  db.ref("students/" + uid).once("value").then(snap => {
    const clsId = snap.val().classId;
    db.ref("classes/" + clsId).once("value").then(clsSnap => {
      const classData = clsSnap.val();
      const container = document.getElementById("classesList");
      container.innerHTML = "";

      Object.keys(classData.subjects || {}).forEach(subjId => {
        const subject = classData.subjects[subjId];
        container.innerHTML += `<div class="class-card" onclick="showAttendance('${clsId}','${subjId}')">
          <h3>${subject.name}</h3>
          <p>Teacher: ${subject.teacherId}</p>
        </div>`;
      });
    });
  });
}

// ===== ATTENDANCE =====
function loadAttendance(uid) {
  const table = document.getElementById("attendanceTableBody");
  table.innerHTML = "<tr><td colspan='3'>Select a class/subject</td></tr>";
}

function showAttendance(classId, subjectId) {
  const table = document.getElementById("attendanceTableBody");
  table.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

  db.ref(`classes/${classId}/students`).once("value").then(stuSnap => {
    const students = stuSnap.val();
    db.ref(`attendance/${classId}/${subjectId}`).once("value").then(attSnap => {
      const dates = Object.keys(attSnap.val() || {});
      table.innerHTML = "";

      Object.keys(students).forEach(sid => {
        const student = students[sid];
        let row = `<tr><td>${student.roll}</td><td>${student.name}</td><td>`;
        dates.forEach(date => {
          const status = attSnap.val()[date][sid] || "-";
          row += `<span class="${status==='P'?'present':status==='A'?'absent':'-'}">${status}</span> `;
        });
        row += "</td></tr>";
        table.innerHTML += row;
      });
    });
  });
}

// ===== CHARTS =====
function loadChart(classId, subjectId) {
  // You can integrate Chart.js here for student attendance visualization
  // Example: Attendance % over last 30 days
                               }
