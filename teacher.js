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
 🌍 GLOBAL STATE
*********************************/
let currentTeacher = null;
let selectedSubjectKey = "";
let attendanceData = {};
let chart = null;

/********************************
 ⚙️ GLOBAL SETTINGS (REALTIME)
*********************************/
let MIN_ATTENDANCE = 75;

db.ref("settings/minimumAttendance").on("value", snap => {
  if (snap.exists()) {
    MIN_ATTENDANCE = Number(snap.val());
    loadDefaulters();
    loadChart();
  }
});

/********************************
 🔐 AUTH CHECK
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  currentTeacher = user;
  loadTeacherInfo();
  loadSubjects();
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

  const section = document.getElementById(id);
  section.classList.add("active");

  sidebar.classList.remove("open");
  overlay.classList.remove("show");

  // 🔥 FIX: redraw chart when dashboard opens
  if (id === "dashboard") {
    setTimeout(loadChart, 200);
  }
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
  recordSubjectSelect.innerHTML = `<option value="">-- Select --</option>`;
  defaulterSubjectSelect.innerHTML = `<option value="">-- Select Subject --</option>`;
  classListContainer.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(cls => {
      const c = cls.val();

      Object.entries(c.subjects || {}).forEach(([sid, sub]) => {
        if (sub.teacherId === currentTeacher.uid) {
          const key = `${cls.key}_${sid}`;
          const label = `${c.name} - ${sub.name}`;

          subjectSelect.innerHTML += `<option value="${key}">${label}</option>`;
          recordSubjectSelect.innerHTML += `<option value="${key}">${label}</option>`;
          defaulterSubjectSelect.innerHTML += `<option value="${key}">${label}</option>`;

          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `<h3>${c.name}</h3><p>${sub.name}</p>`;
          card.onclick = () => {
            subjectSelect.value = key;
            selectedSubjectKey = key;
            openSection("attendance");
            loadAttendanceTable();
            loadChart();
          };
          classListContainer.appendChild(card);
        }
      });
    });
  });
}
// Auto select first subject for chart
if (!selectedSubjectKey && subjectSelect.options.length > 1) {
  selectedSubjectKey = subjectSelect.options[1].value;
  subjectSelect.value = selectedSubjectKey;
  loadChart();
}
/********************************
 📝 ATTENDANCE
*********************************/
function loadAttendanceTable() {
  selectedSubjectKey = subjectSelect.value;
  attendanceBody.innerHTML = "";
  attendanceData = {};

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
      .then(users => {
        const students = [];

        users.forEach(u => {
          const d = u.val();
          if (d.role === "student") students.push({ uid: u.key, ...d });
        });

        students.sort((a, b) => (a.roll || 0) - (b.roll || 0));

        students.forEach(s => {
          const status = attendanceData[s.uid] || "";
          const tr = document.createElement("tr");

          tr.innerHTML = `
            <td>${s.roll}</td>
            <td>${s.name}</td>
            <td>
              <button class="att-btn present ${status === "P" ? "active" : ""}"
                onclick="markAttendance('${s.uid}','P',this)">P</button>
              <button class="att-btn absent ${status === "A" ? "active" : ""}"
                onclick="markAttendance('${s.uid}','A',this)">A</button>
            </td>
          `;
          attendanceBody.appendChild(tr);
        });

        loadChart();
      });
  });
}

function markAttendance(uid, status, btn) {
  attendanceData[uid] = status;
  btn.parentElement.querySelectorAll(".att-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function saveAttendance() {
  if (!selectedSubjectKey) return toast("Select subject ⚠️");
  const today = new Date().toISOString().split("T")[0];

  db.ref(`attendance/${selectedSubjectKey}/${today}`)
    .set(attendanceData)
    .then(() => {
      toast("Attendance saved ✅");
      loadDefaulters();
      loadChart();
    });
}

/********************************
 📅 RECORDS
*********************************/
function onRecordSubjectChange() {
  selectedSubjectKey = recordSubjectSelect.value;
  recordBody.innerHTML = "";
  loadAttendanceRecords();
  loadChart();
}

function loadAttendanceRecords() {
  recordBody.innerHTML = "";
  const date = calendar.value;
  if (!date || !selectedSubjectKey) return;

  db.ref(`attendance/${selectedSubjectKey}/${date}`).once("value")
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
 ⚠️ DEFAULTERS
*********************************/
function onDefaulterSubjectChange() {
  selectedSubjectKey = defaulterSubjectSelect.value;
  loadDefaulters();
  loadChart();
}

function loadDefaulters() {
  if (!selectedSubjectKey) return;
  defaulterBody.innerHTML = "";

  db.ref(`attendance/${selectedSubjectKey}`).once("value").then(attSnap => {
    const days = attSnap.val() || {};

    db.ref("users").once("value").then(users => {
      users.forEach(u => {
        const d = u.val();
        if (d.role !== "student") return;

        let total = 0, present = 0;

        Object.values(days).forEach(day => {
          if (day[u.key]) {
            total++;
            if (day[u.key] === "P") present++;
          }
        });

        if (!total) return;

        const percent = Math.round((present / total) * 100);

        if (percent < MIN_ATTENDANCE) {
          defaulterBody.innerHTML += `
            <tr>
              <td>${d.roll}</td>
              <td>${d.name}</td>
              <td>${percent}%</td>
            </tr>`;
        }
      });
    });
  });
}

/********************************
 📊 DONUT CHART
*********************************/
function loadChart() {
  if (!selectedSubjectKey) return;

  const ctx = document.getElementById("attendanceChart");
  if (!ctx || typeof Chart === "undefined") return;

  const today = new Date().toISOString().split("T")[0];

  db.ref(`attendance/${selectedSubjectKey}/${today}`).once("value").then(snap => {
    const data = snap.val() || {};
    let p = 0, a = 0;

    Object.values(data).forEach(v => {
      if (v === "P") p++;
      if (v === "A") a++;
    });

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Present", "Absent"],
        datasets: [{
          data: [p, a],
          backgroundColor: ["#22c55e", "#ef4444"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  });
}

/********************************
 🍞 TOAST
*********************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast show";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/********************************
 🌗 THEME
*********************************/
function toggleTheme() {
  document.body.classList.toggle("light");
                                                  }
