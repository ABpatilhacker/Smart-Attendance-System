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
 🌍 GLOBAL STATE (SINGLE SOURCE)
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
 📂 SIDEBAR
*********************************/
function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("open");
  document.getElementById("overlay")?.classList.toggle("show");
}

function openSection(id) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active")
  );

  document.getElementById(id)?.classList.add("active");

  if (document.getElementById("sidebar")?.classList.contains("open")) {
    toggleSidebar();
  }
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

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();
  if (!name) return toast("Name required ⚠️");

  db.ref("users/" + currentTeacher.uid)
    .update({ name })
    .then(() => toast("Profile Updated ✅"));
}

/********************************
 📚 LOAD SUBJECTS + CLASS CARDS
*********************************/
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const classBox = document.getElementById("classListContainer");

  select.innerHTML = `<option value="">-- Select Subject --</option>`;
  classBox.innerHTML = "";

  db.ref("classes").once("value").then(snap => {
    snap.forEach(cls => {
      const c = cls.val();

      Object.keys(c.subjects || {}).forEach(subId => {
        const sub = c.subjects[subId];

        if (sub.teacherId === currentTeacher.uid) {
          const key = `${cls.key}_${subId}`;

          select.innerHTML += `
            <option value="${key}">
              ${c.name} - ${sub.name}
            </option>
          `;

          const card = document.createElement("div");
          card.className = "card";
          card.onclick = () => {
            selectedSubjectKey = key;
            select.value = key;
            openSection("attendance");
            loadAttendanceTable();
            loadDefaulters();
          };
          card.innerHTML = `<h3>${c.name}</h3><p>${sub.name}</p>`;
          classBox.appendChild(card);
        }
      });
    });
  });
}

/********************************
 🔄 SUBJECT CHANGE
*********************************/
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("subjectSelect").addEventListener("change", e => {
    selectedSubjectKey = e.target.value;
    document.getElementById("attendanceSection").style.display =
      selectedSubjectKey ? "block" : "none";

    if (selectedSubjectKey) {
      loadAttendanceTable();
      loadDefaulters();
    }
  });
});

/********************************
 📝 ATTENDANCE TABLE (REAL-TIME)
*********************************/
function loadAttendanceTable() {
  if (!selectedSubjectKey) return;

  const body = document.getElementById("attendanceBody");
  body.innerHTML = "";

  const [classId] = selectedSubjectKey.split("_");
  const today = new Date().toISOString().split("T")[0];

  db.ref(`attendance/${selectedSubjectKey}/${today}`).on("value", snap => {
    attendanceData = snap.val() || {};
    body.innerHTML = "";

    db.ref("users")
      .orderByChild("classId")
      .equalTo(classId)
      .once("value")
      .then(stSnap => {
        let students = [];

        stSnap.forEach(s => {
          const d = s.val();
          if (d.role === "student") students.push({ ...d, uid: s.key });
        });

        students.sort((a, b) => a.roll - b.roll);

        students.forEach(stu => {
          const status = attendanceData[stu.uid] || "";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${stu.roll}</td>
            <td>${stu.name}</td>
            <td>
              <button class="att-btn present ${status === "P" ? "active" : ""}"
                onclick="markAttendance('${stu.uid}','P',this)">P</button>
              <button class="att-btn absent ${status === "A" ? "active" : ""}"
                onclick="markAttendance('${stu.uid}','A',this)">A</button>
            </td>`;
          body.appendChild(tr);
        });
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

/********************************
 💾 SAVE ATTENDANCE
*********************************/
function saveAttendance() {
  if (!selectedSubjectKey) return toast("Select subject ⚠️");

  const today = new Date().toISOString().split("T")[0];
  db.ref(`attendance/${selectedSubjectKey}/${today}`)
    .set(attendanceData)
    .then(() => toast("Attendance Saved ✅"));
}

/********************************
 📅 ATTENDANCE RECORDS
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

      Object.keys(data).forEach(uid => {
        db.ref("users/" + uid).once("value").then(s => {
          const d = s.val();
          body.innerHTML += `
            <tr>
              <td>${d.roll}</td>
              <td>${d.name}</td>
              <td>${data[uid]}</td>
            </tr>`;
        });
      });
    });
}

/********************************
 ⚠️ DEFAULTERS (REAL-TIME)
*********************************/
function loadDefaulters() {
  if (!selectedSubjectKey) return;

  const list = document.getElementById("defaulterList");
  list.innerHTML = "";

  const min = Number(localStorage.getItem("minAttendance")) || 75;

  db.ref(`attendance/${selectedSubjectKey}`).once("value").then(attSnap => {
    const allDays = attSnap.val() || {};

    db.ref("users").once("value").then(uSnap => {
      uSnap.forEach(s => {
        const stu = s.val();
        const uid = s.key;
        if (stu.role !== "student") return;

        let total = 0, present = 0;

        Object.values(allDays).forEach(day => {
          if (day[uid]) {
            total++;
            if (day[uid] === "P") present++;
          }
        });

        if (!total) return;

        const percent = Math.round((present / total) * 100);
        if (percent < min) {
          list.innerHTML += `
            <li><strong>${stu.name}</strong><span>${percent}%</span></li>`;
        }
      });
    });
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
 🌗 THEME
*********************************/
function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem("theme",
    document.body.classList.contains("light") ? "light" : "dark");
}

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
}
