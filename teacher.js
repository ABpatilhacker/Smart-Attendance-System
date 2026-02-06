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
 🌍 GLOBAL STATE (FINAL)
*********************************/
let currentTeacher = null;
let selectedSubjectKey = "";
let attendanceData = {};
let chart = null;

/********************************
 🔐 AUTH CHECK
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "login.html";
  currentTeacher = user;
  loadTeacherInfo();
  loadSubjects();
  loadChart();
});

/********************************
 🚪 LOGOUT
*********************************/
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/********************************
 📂 SIDEBAR
*********************************/
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

function openSection(id) {
  document.querySelectorAll(".section").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id)?.classList.add("active");
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

/********************************
 👋 TEACHER INFO
*********************************/
function loadTeacherInfo() {
  db.ref("users/" + currentTeacher.uid).once("value").then(snap => {
    const d = snap.val();
    welcomeCard.innerText = `Welcome 👋 ${d.name}`;
    profileName.value = d.name;
    profileEmail.value = d.email;
  });
}

function saveProfile() {
  const name = profileName.value.trim();
  if (!name) return toast("Name required ⚠️");

  db.ref("users/" + currentTeacher.uid)
    .update({ name })
    .then(() => toast("Profile updated ✅"));
}

/********************************
 📚 LOAD CLASSES + SUBJECTS
*********************************/
function loadSubjects() {
  subjectSelect.innerHTML = `<option value="">-- Select --</option>`;
  classListContainer.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(cls => {
      const c = cls.val();
      Object.entries(c.subjects || {}).forEach(([sid, sub]) => {
        if (sub.teacherId === currentTeacher.uid) {
          const key = `${cls.key}_${sid}`;

          subjectSelect.innerHTML += `
            <option value="${key}">
              ${c.name} - ${sub.name}
            </option>`;

          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `<h3>${c.name}</h3><p>${sub.name}</p>`;
          card.onclick = () => {
            selectedSubjectKey = key;
            subjectSelect.value = key;
            openSection("attendance");
            loadAttendanceTable();
          };
          classListContainer.appendChild(card);
        }
      });
    });
  });
}

/********************************
 📝 ATTENDANCE (ROLL SORT FIXED)
*********************************/
function loadAttendanceTable() {
  selectedSubjectKey = subjectSelect.value;
  attendanceBody.innerHTML = "";
  if (!selectedSubjectKey) return;

  const [classId] = selectedSubjectKey.split("_");
  const today = new Date().toISOString().split("T")[0];

  db.ref(`attendance/${selectedSubjectKey}/${today}`).on("value", snap => {
    attendanceData = snap.val() || {};
    attendanceBody.innerHTML = "";

    db.ref("users")
      .orderByChild("classId")
      .equalTo(classId)
      .once("value")
      .then(snap => {
        let students = [];
        snap.forEach(s => {
          const d = s.val();
          if (d.role === "student") {
            students.push({ ...d, uid: s.key });
          }
        });

        // 🔥 FIX: roll number sort
        students.sort((a, b) => Number(a.roll) - Number(b.roll));

        students.forEach(stu => {
          const status = attendanceData[stu.uid] || "";
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${stu.roll}</td>
            <td>${stu.name}</td>
            <td>
              <button class="att-btn present ${status==="P"?"active":""}"
                onclick="markAttendance('${stu.uid}','P',this)">P</button>
              <button class="att-btn absent ${status==="A"?"active":""}"
                onclick="markAttendance('${stu.uid}','A',this)">A</button>
            </td>`;
          attendanceBody.appendChild(tr);
        });

        loadDefaulters(); // realtime
      });
  });
}

function markAttendance(uid, status, btn) {
  attendanceData[uid] = status;
  btn.parentElement.querySelectorAll(".att-btn")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  loadDefaulters();
}

function saveAttendance() {
  if (!selectedSubjectKey) return toast("Select subject ⚠️");
  const today = new Date().toISOString().split("T")[0];

  db.ref(`attendance/${selectedSubjectKey}/${today}`)
    .set(attendanceData)
    .then(() => toast("Attendance saved ✅"));
}

/********************************
 📅 RECORDS (AUTO LOAD)
*********************************/
function loadAttendanceRecords() {
  recordBody.innerHTML = "";
  if (!calendar.value || !selectedSubjectKey) return;

  db.ref(`attendance/${selectedSubjectKey}/${calendar.value}`).once("value")
    .then(snap => {
      if (!snap.exists()) {
        recordBody.innerHTML = `<tr><td colspan="3">No record</td></tr>`;
        return;
      }

      Object.entries(snap.val()).forEach(([uid, val]) => {
        db.ref("users/" + uid).once("value").then(s => {
          const d = s.val();
          recordBody.innerHTML += `
            <tr>
              <td>${d.roll}</td>
              <td>${d.name}</td>
              <td>${val}</td>
            </tr>`;
        });
      });
    });
}

/********************************
 ⚠️ DEFAULTERS (REALTIME)
*********************************/
function loadDefaulters() {
  if (!selectedSubjectKey) return;
  defaulterBody.innerHTML = "";
  const min = Number(localStorage.getItem("minAttendance")) || 75;

  db.ref(`attendance/${selectedSubjectKey}`).once("value").then(attSnap => {
    const days = attSnap.val() || {};

    db.ref("users").once("value").then(users => {
      users.forEach(u => {
        const d = u.val();
        if (d.role !== "student") return;

        let t=0,p=0;
        Object.values(days).forEach(day => {
          if (day[u.key]) {
            t++; if (day[u.key]==="P") p++;
          }
        });

        if (!t) return;
        const percent = Math.round((p/t)*100);
        if (percent < min) {
          defaulterBody.innerHTML += `
            <tr>
              <td>${d.roll}</td>
              <td>${d.name}</td>
              <td>${100 - percent}%</td>
            </tr>`;
        }
      });
    });
  });
}

/********************************
 📊 DONUT CHART (RESPONSIVE SAFE)
*********************************/
function loadChart() {
  const ctx = attendanceChart;
  if (!ctx || typeof Chart === "undefined") return;
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [70, 30],
        backgroundColor: ["#4ade80", "#f87171"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/********************************
 🍞 TOAST (FIXED)
*********************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => t.classList.remove("show"), 2500);
  setTimeout(() => t.remove(), 3000);
}

/********************************
 🌗 THEME
*********************************/
function toggleTheme() {
  document.body.classList.toggle("light");
}
