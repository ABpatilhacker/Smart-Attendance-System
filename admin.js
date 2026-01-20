/***********************
 🔥 FIREBASE CONFIG
************************/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89",
  storageBucket: "smart-attendance-system-17e89.firebasestorage.app",
  messagingSenderId: "168700970246",
  appId: "1:168700970246:web:392156387db81e92544a87"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/***********************
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadStudents();
    loadSettings();
  }
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

/***********************
 📊 DASHBOARD COUNTS
************************/
function loadDashboard() {
  db.ref("classes").on("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });

  db.ref("users").on("value", snap => {
    let teachers = 0, students = 0;
    snap.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") teachers++;
        if (u.val().role === "student") students++;
      }
    });
    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });
}

/***********************
 🟡 APPROVALS
************************/
function loadApprovals() {
  const list = document.getElementById("pendingList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(child => {
      const u = child.val();
      if (u.approved === false) {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${u.name}</strong><br>
          <small>${u.email}</small><br>
          <button onclick="approveUser('${child.key}')">✅ Approve</button>
          <button onclick="rejectUser('${child.key}')">❌ Reject</button>
        `;
        list.appendChild(li);
      }
    });

    if (list.innerHTML === "") {
      list.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
    }
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true }).then(() => {
    alert("User approved ✅");
  });
}

function rejectUser(uid) {
  if (!confirm("Reject this user?")) return;
  db.ref("users/" + uid).remove().then(() => {
    alert("User rejected ❌");
  });
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  const list = document.getElementById("classList");
  const select = document.getElementById("studentClass");

  db.ref("classes").on("value", snap => {
    if (list) list.innerHTML = "";
    if (select) select.innerHTML = "";

    snap.forEach(c => {
      if (list) {
        const li = document.createElement("li");
        li.textContent = c.val().name;
        list.appendChild(li);
      }

      if (select) {
        const opt = document.createElement("option");
        opt.value = c.key;
        opt.textContent = c.val().name;
        select.appendChild(opt);
      }
    });
  });
}

function addClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return alert("Enter class name");

  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({ name }).then(() => {
    alert("Class added successfully 🎉");
    document.getElementById("className").value = "";
  });
}

/***********************
 👨‍🏫 TEACHERS
************************/
function loadTeachers() {
  const list = document.getElementById("teacherList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      if (u.val().role === "teacher" && u.val().approved) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${u.val().name}</strong><br>${u.val().email}`;
        list.appendChild(li);
      }
    });
  });
}

/***********************
 🎓 STUDENTS
************************/
function loadStudents() {
  const list = document.getElementById("studentList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      if (u.val().role === "student" && u.val().approved) {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${u.val().name}</strong>
          (Roll ${u.val().roll}) – ${u.val().email}
        `;
        list.appendChild(li);
      }
    });
  });
}

/***********************
 ⚙️ SETTINGS
************************/
function loadSettings() {
  const input = document.getElementById("minAttendance");
  if (!input) return;

  db.ref("settings/minAttendance").once("value", snap => {
    if (snap.exists()) input.value = snap.val();
  });
}

function saveSettings() {
  const val = document.getElementById("minAttendance").value;
  if (!val) return alert("Enter minimum attendance");

  db.ref("settings").update({ minAttendance: Number(val) }).then(() => {
    alert("Settings saved ✅");
  });
}

/***********************
 📱 SIDEBAR UX FIX
************************/
document.addEventListener("click", e => {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.querySelector(".menu-btn");

  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});
