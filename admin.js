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
let currentAdmin = null;

/********************************
 🔐 AUTH CHECK
*********************************/
auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    const u = snap.val();
    if (!u || u.role !== "admin") {
      auth.signOut();
      location.href = "index.html";
      return;
    }

    currentAdmin = user;
    loadDashboard();
    loadClasses();
    loadTeachers();
    loadApprovals();
    loadSettings();
  });
});

/********************************
 🚪 LOGOUT
*********************************/
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/********************************
 📂 SIDEBAR NAV
*********************************/
function nav(id) {
  document.querySelectorAll(".page").forEach(p =>
    p.style.display = "none"
  );
  document.getElementById(id).style.display = "block";
}

nav("dashboard");

/********************************
 📊 DASHBOARD COUNTS
*********************************/
function loadDashboard() {
  // Classes
  db.ref("classes").on("value", snap => {
    document.getElementById("classCount").innerText =
      snap.exists() ? snap.numChildren() : 0;
  });

  // Teachers & Students
  db.ref("users").on("value", snap => {
    let t = 0, s = 0;
    snap.forEach(u => {
      if (u.val().role === "teacher") t++;
      if (u.val().role === "student") s++;
    });
    document.getElementById("teacherCount").innerText = t;
    document.getElementById("studentCount").innerText = s;
  });
}

/********************************
 🏫 CLASSES
*********************************/
function loadClasses() {
  const list = document.getElementById("classList");
  list.innerHTML = "";

  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      const li = document.createElement("li");
      li.innerText = c.val().name;
      list.appendChild(li);
    });
  });
}

function addClass() {
  const input = document.getElementById("className");
  const name = input.value.trim();
  if (!name) return showModal("Error", "Class name required");

  db.ref("classes").push({
    name,
    createdAt: Date.now()
  });

  input.value = "";
}

/********************************
 👨‍🏫 TEACHERS LIST
*********************************/
function loadTeachers() {
  const list = document.getElementById("teacherList");
  list.innerHTML = "";

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher") {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${d.name}</strong><span>${d.email}</span>`;
        list.appendChild(li);
      }
    });
  });
}

/********************************
 ✅ APPROVALS
*********************************/
function loadApprovals() {
  const list = document.getElementById("pendingList");
  list.innerHTML = "";

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.approved === false) {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${d.name}</strong>
          <button onclick="approveUser('${u.key}')">Approve</button>
        `;
        list.appendChild(li);
      }
    });
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true });
}

/********************************
 ⚙ SETTINGS (REALTIME SYNC)
*********************************/
function loadSettings() {
  db.ref("settings/minimumAttendance").on("value", snap => {
    if (snap.exists()) {
      document.getElementById("minAttendance").value = snap.val();
    }
  });
}

function saveSettings() {
  const val = Number(document.getElementById("minAttendance").value);
  if (val < 1 || val > 100) {
    showModal("Error", "Enter value between 1–100");
    return;
  }

  db.ref("settings/minimumAttendance").set(val);
  showModal("Saved", "Minimum attendance updated");
}

/********************************
 🪟 MODAL
*********************************/
function showModal(title, text) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalText").innerText = text;
  document.getElementById("modal").style.display = "flex";

  document.getElementById("modalOk").onclick = () =>
    document.getElementById("modal").style.display = "none";
}
