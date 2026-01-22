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

/********************************
 🔐 AUTH CHECK
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentTeacher = user;
    loadTeacherInfo();
    loadSubjects();
    loadChart();
  }
});

/********************************
 🚪 LOGOUT
*********************************/
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

/********************************
 📂 SIDEBAR FIX (IMPORTANT)
*********************************/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

function openSection(id) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  // Close sidebar ONLY if open (mobile fix)
  if (document.getElementById("sidebar").classList.contains("open")) {
    toggleSidebar();
  }
}

/********************************
 👋 TEACHER INFO
*********************************/
function loadTeacherInfo() {
  db.ref("users/" + currentTeacher.uid).once("value").then(snap => {
    const data = snap.val();
    document.getElementById("welcomeCard").innerText =
      `Welcome 👋 ${data.name}`;
    document.getElementById("profileName").value = data.name;
    document.getElementById("profileEmail").value = data.email;
  });
}

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  if (!name) return toast("Name required ⚠️");

  db.ref("users/" + currentTeacher.uid).update({ name })
    .then(() => toast("Profile Updated ✅"));
}

/********************************
 📚 LOAD SUBJECTS + CLASS CARDS
*********************************/
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const classContainer = document.getElementById("classListContainer");

  select.innerHTML = `<option value="">-- Select --</option>`;
  classContainer.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(cls => {
      const c = cls.val();
      for (let s in c.subjects || {}) {
        if (c.subjects[s].teacherId === currentTeacher.uid) {
          const key = `${cls.key}_${s}`;

          select.innerHTML += `
            <option value="${key}">
              ${c.name} - ${c.subjects[s].name}
            </option>
          `;

          const card = document.createElement("div");
          card.className = "card";
          card.onclick = () => {
            openSection("attendance");
            select.value = key;
            loadAttendanceTable();
          };
          card.innerHTML = `
            <h3>${c.name}</h3>
            <p>${c.subjects[s].name}</p>
          `;
          classContainer.appendChild(card);
        }
      }
    });
  });
}

/********************************
 📝 ATTENDANCE TABLE (FIXED)
*********************************/
function loadAttendanceTable() {
  const body = document.getElementById("attendanceBody");
  body.innerHTML = "";
  attendanceData = {};

  selectedSubjectKey = document.getElementById("subjectSelect").value;
  if (!selectedSubjectKey) return;

  const classId = selectedSubjectKey.split("_")[0];

  db.ref("users").orderByChild("classId").equalTo(classId).once("value")
    .then(snap => {
      let students = [];
      snap.forEach(s => {
        const d = s.val();
        if (d.role === "student") {
          students.push({ ...d, uid: s.key });
        }
      });

      students.sort((a, b) => a.roll - b.roll);

      students.forEach(stu => {
        attendanceData[stu.uid] = "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${stu.roll}</td>
          <td>${stu.name}</td>
          <td>
            <button class="att-btn present"
              onclick="markAttendance('${stu.uid}','P',this)">P</button>
            <button class="att-btn absent"
              onclick="markAttendance('${stu.uid}','A',this)">A</button>
          </td>
        `;
        body.appendChild(tr);
      });
    });
}

/********************************
 ✅ MARK ATTENDANCE (COLOR FIX)
*********************************/
function markAttendance(uid, status, btn) {
  attendanceData[uid] = status;

  const buttons = btn.parentElement.querySelectorAll("button");
  buttons.forEach(b => b.classList.remove("active"));

  btn.classList.add("active");
}

/********************************
 💾 SAVE ATTENDANCE (WORKING)
*********************************/
function saveAttendance() {
  if (!selectedSubjectKey) return toast("Select Subject ⚠️");

  const date = new Date().toISOString().split("T")[0];

  db.ref(`attendance/${selectedSubjectKey}/${date}`)
    .set(attendanceData)
    .then(() => {
      toast("Attendance Saved ✅");
      loadChart();
    });
}

/********************************
 📅 ATTENDANCE RECORDS (FIXED)
*********************************/
function loadAttendanceRecords() {
  const date = document.getElementById("calendar").value;
  const body = document.getElementById("recordBody");
  body.innerHTML = "";

  if (!date || !selectedSubjectKey) return;

  db.ref(`attendance/${selectedSubjectKey}/${date}`).once("value")
    .then(snap => {
      const data = snap.val();
      if (!data) {
        body.innerHTML = `<tr><td colspan="3">No record</td></tr>`;
        return;
      }

      for (let uid in data) {
        db.ref("users/" + uid).once("value").then(stuSnap => {
          const s = stuSnap.val();
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${s.roll}</td>
            <td>${s.name}</td>
            <td>${data[uid]}</td>
          `;
          body.appendChild(tr);
        });
      }
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
        backgroundColor: ["#00e5ff", "#ff5252"]
      }]
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

/********************************
 ⚠️ DEFAULTERS (STATIC SAFE)
*********************************/
function loadDefaulters() {
  const body = document.getElementById("defaulterBody");
  body.innerHTML = `
    <tr><td>12</td><td>Rahul</td><td>42%</td></tr>
    <tr><td>18</td><td>Neha</td><td>38%</td></tr>
  `;
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
  setTimeout(() => t.classList.remove("show"), 2500);
  setTimeout(() => t.remove(), 3000);
                                       }
