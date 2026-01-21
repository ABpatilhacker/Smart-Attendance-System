/********************************
 🔥 FIREBASE INIT
*********************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.appspot.com",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/********************************
 🌐 GLOBAL STATE
*********************************/
let currentTeacher = null;
let selectedSubjectKey = null;
let attendanceData = {};

/********************************
 🔐 AUTH CHECK
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
  } else {
    currentTeacher = user;
    loadTeacherInfo();
    loadSubjects();
    loadChart();
  }
});

/********************************
 📂 SIDEBAR + ROUTES
*********************************/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

function openSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (window.innerWidth < 768) toggleSidebar();
}

/********************************
 👋 TEACHER INFO
*********************************/
function loadTeacherInfo() {
  db.ref("users/" + currentTeacher.uid).once("value").then(snap => {
    const d = snap.val();
    document.getElementById("welcomeCard").innerText = `Welcome 👋 ${d.name}`;
    document.getElementById("profileName").value = d.name;
    document.getElementById("profileEmail").value = d.email;
  });
}

/********************************
 📚 LOAD SUBJECTS + CLASSES
*********************************/
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const container = document.getElementById("classListContainer");
  select.innerHTML = `<option value="">-- Select Subject --</option>`;
  container.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(cls => {
      const c = cls.val();
      for (let s in c.subjects || {}) {
        if (c.subjects[s].teacherId === currentTeacher.uid) {
          const key = `${cls.key}_${s}`;

          select.innerHTML += `
            <option value="${key}">
              ${c.name} – ${c.subjects[s].name}
            </option>`;

          const card = document.createElement("div");
          card.className = "card";
          card.onclick = () => {
            openSection("attendance");
            document.getElementById("subjectSelect").value = key;
            loadAttendanceTable();
          };
          card.innerHTML = `
            <h3>${c.name}</h3>
            <p>${c.subjects[s].name}</p>
          `;
          container.appendChild(card);
        }
      }
    });
  });
}

/********************************
 📝 LOAD ATTENDANCE TABLE
*********************************/
function loadAttendanceTable() {
  const body = document.getElementById("attendanceBody");
  body.innerHTML = "";
  attendanceData = {};

  selectedSubjectKey = document.getElementById("subjectSelect").value;
  if (!selectedSubjectKey) return;

  const classId = selectedSubjectKey.split("_")[0];

  db.ref("users")
    .orderByChild("classId")
    .equalTo(classId)
    .once("value")
    .then(snap => {
      let students = [];
      snap.forEach(s => {
        if (s.val().role === "student") {
          students.push({ ...s.val(), uid: s.key });
        }
      });

      students.sort((a, b) => a.roll - b.roll);

      students.forEach(stu => {
        attendanceData[stu.uid] = null;
        body.innerHTML += `
          <tr>
            <td>${stu.roll}</td>
            <td>${stu.name}</td>
            <td>
              <button class="att-btn present"
                onclick="markAttendance('${stu.uid}','P',this)">Present</button>
              <button class="att-btn absent"
                onclick="markAttendance('${stu.uid}','A',this)">Absent</button>
            </td>
          </tr>
        `;
      });
    });
}

/********************************
 ✅ MARK ATTENDANCE
*********************************/
function markAttendance(uid, status, btn) {
  attendanceData[uid] = status;
  const parent = btn.parentElement;
  parent.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  btn.style.background =
    status === "P" ? "#22c55e" : "#ef4444";
}

/********************************
 💾 SAVE ATTENDANCE
*********************************/
function saveAttendance() {
  if (!selectedSubjectKey) return toast("Select subject ⚠️");

  for (let k in attendanceData) {
    if (!attendanceData[k]) return toast("Mark all students ⚠️");
  }

  const date = new Date().toISOString().split("T")[0];
  db.ref(`attendance/${selectedSubjectKey}/${date}`)
    .set(attendanceData)
    .then(() => {
      toast("Attendance Saved Successfully ✅");
      loadChart();
    });
}

/********************************
 📊 DASHBOARD CHART
*********************************/
let chart;
function loadChart() {
  const ctx = document.getElementById("attendanceChart");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [80, 20],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    },
    options: {
      cutout: "70%",
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/********************************
 📅 ATTENDANCE RECORD (DATE WISE)
*********************************/
function loadAttendanceRecord() {
  const date = document.getElementById("recordDate").value;
  const body = document.getElementById("recordBody");
  body.innerHTML = "";

  if (!date || !selectedSubjectKey) return;

  db.ref(`attendance/${selectedSubjectKey}/${date}`)
    .once("value")
    .then(snap => {
      snap.forEach(s => {
        body.innerHTML += `
          <tr>
            <td>${s.key}</td>
            <td>${s.val() === "P" ? "Present" : "Absent"}</td>
          </tr>
        `;
      });
    });
}

/********************************
 ⚠️ DEFAULTER LOGIC (REAL)
*********************************/
function loadDefaulters() {
  const body = document.getElementById("defaulterBody");
  body.innerHTML = "";

  if (!selectedSubjectKey) return;

  db.ref(`attendance/${selectedSubjectKey}`)
    .once("value")
    .then(snap => {
      const stats = {};

      snap.forEach(day => {
        day.forEach(s => {
          stats[s.key] ??= { total: 0, present: 0 };
          stats[s.key].total++;
          if (s.val() === "P") stats[s.key].present++;
        });
      });

      for (let uid in stats) {
        const perc = Math.round(
          (stats[uid].present / stats[uid].total) * 100
        );
        if (perc < 75) {
          body.innerHTML += `
            <tr>
              <td>${uid}</td>
              <td>${perc}%</td>
            </tr>
          `;
        }
      }
    });
}

/********************************
 🍞 TOAST
*********************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 100);
  setTimeout(() => t.remove(), 3000);
                          }
/********************************
 ✨ UI POLISH ADDITIONS
*********************************/

/* Ripple effect on click */
document.addEventListener("click", e => {
  const target = e.target.closest("button, .card, li");
  if (!target) return;

  const ripple = document.createElement("span");
  ripple.className = "ripple";
  target.appendChild(ripple);

  const rect = target.getBoundingClientRect();
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;

  setTimeout(() => ripple.remove(), 600);
});

/* Sidebar active item */
document.querySelectorAll(".sidebar ul li").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".sidebar ul li")
      .forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

/* Better success feedback after save */
const originalSaveAttendance = saveAttendance;
saveAttendance = function () {
  originalSaveAttendance();
  setTimeout(() => {
    document.querySelectorAll(".att-btn.active").forEach(b => {
      b.style.boxShadow = "0 0 15px rgba(34,197,94,0.7)";
    });
  }, 300);
};
