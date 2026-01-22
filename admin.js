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
  if (!user) window.location.href = "login.html";
  else {
    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  }
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

/* ======================================================
   🧭 SIDEBAR TOGGLE (NEW – SAFE ADDITION)
   DOES NOT TOUCH FIREBASE OR DATA LOGIC
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      if (overlay) overlay.classList.toggle("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
});

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
 🟡 APPROVAL DASHBOARD
************************/
function loadApprovals() {
  const list = document.getElementById("pendingList");
  if (!list) return;

  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    let hasPending = false;

    snap.forEach(child => {
      const u = child.val();
      const uid = child.key;

      if (u.approved === false) {
        hasPending = true;
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

    if (!hasPending) list.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true })
    .then(() => toast("User approved ✅"));
}

function rejectUser(uid) {
  if (!confirm("Are you sure you want to reject this user?")) return;
  db.ref("users/" + uid).remove()
    .then(() => toast("User rejected ❌"));
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
      li.className = "class-card";
      li.innerHTML = `
        <strong>${c.val().name}</strong>
        <button onclick="openClassDetails('${c.key}')">View Details</button>
      `;
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
  if (!name) return toast("Enter class name ⚠️");

  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({ name, subjects: {}, students: {} })
    .then(() => {
      document.getElementById("className").value = "";
      toast("Class added successfully ✅");
    });
}

/***********************
 🌟 TOAST MESSAGE
************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 100);
  setTimeout(() => t.classList.remove("show"), 3000);
  setTimeout(() => t.remove(), 3500);
}
