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
      if (u.val().approved === true) {
        if (u.val().role === "teacher") teachers++;
        if (u.val().role === "student") students++;
      }
    });
    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });
}

/***********************
 🟡 APPROVAL DASHBOARD
************************/
function loadApprovals() {
  const list = document.getElementById("pendingList");
  list.innerHTML = "";

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(child => {
      const u = child.val();
      const uid = child.key;

      if (u.approved === false) {
        const li = document.createElement("li");
        li.className = "approval-card";

        li.innerHTML = `
          <strong>${u.name}</strong><br>
          <small>${u.email}</small><br>
          <span class="badge">${u.role.toUpperCase()}</span><br><br>
          <button class="approve-btn" onclick="approveUser('${uid}')">✅ Approve</button>
          <button class="reject-btn" onclick="rejectUser('${uid}')">❌ Reject</button>
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
  db.ref("users/" + uid).update({
    approved: true
  }).then(() => {
    alert("User approved successfully ✅");
  });
}

function rejectUser(uid) {
  if (!confirm("Are you sure you want to reject this user?")) return;

  db.ref("users/" + uid).remove().then(() => {
    alert("User rejected and removed ❌");
  });
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  const list = document.getElementById("classList");
  const select = document.getElementById("studentClass");
  if (select) select.innerHTML = "";

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c.val().name;
      list.appendChild(li);

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
  db.ref("classes/" + id).set({ name });

  document.getElementById("className").value = "";
}

/***********************
 👨‍🏫 TEACHERS
************************/
function loadTeachers() {
  const list = document.getElementById("teacherList");
  list.innerHTML = "";

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      if (u.val().role === "teacher" && u.val().approved === true) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${u.val().name}</strong> – ${u.val().email}`;
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
  list.innerHTML = "";

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      if (u.val().role === "student" && u.val().approved === true) {
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
  db.ref("settings/minAttendance").once("value", snap => {
    if (snap.exists()) {
      document.getElementById("minAttendance").value = snap.val();
    }
  });
}

function saveSettings() {
  const val = document.getElementById("minAttendance").value;
  if (!val) return alert("Enter minimum attendance");

  db.ref("settings").update({
    minAttendance: Number(val)
  }).then(() => {
    alert("Settings saved ✅");
  });
}
