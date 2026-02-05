/***********************
 🔥 FIREBASE INIT
************************/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/***********************
 🧩 SAFE DOM GETTER
************************/
const $ = id => document.getElementById(id);

/***********************
 🧩 DOM REFERENCES
************************/
const classCount = $("classCount");
const teacherCount = $("teacherCount");
const studentCount = $("studentCount");

const classList = $("classList");
const teacherList = $("teacherList");
const pendingList = $("pendingList");

const className = $("className");
const minAttendance = $("minAttendance");

const classPanel = $("classPanel");
const teacherPanel = $("teacherPanel");

const overlay = $("overlay");
const modal = $("modal");
const modalTitle = $("modalTitle");
const modalText = $("modalText");
const modalOk = $("modalOk");

/***********************
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "login.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
      return;
    }

    nav("dashboard");
    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  });
});

/***********************
 🚪 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/***********************
 🧭 SIDEBAR + NAV
************************/
function toggleSidebar() {
  $("sidebar").classList.toggle("open");
  overlay.classList.toggle("show");
}

function nav(id, btn) {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active")
  );
  $(id)?.classList.add("active");

  document.querySelectorAll(".sidebar button").forEach(b =>
    b.classList.remove("active")
  );
  if (btn) btn.classList.add("active");

  $("sidebar").classList.remove("open");
  overlay.classList.remove("show");
}

overlay.addEventListener("click", () => {
  $("sidebar").classList.remove("open");
  overlay.classList.remove("show");
  closeAllPanels();
});

/***********************
 📊 DASHBOARD
************************/
function loadDashboard() {
  db.ref("classes").on("value", s =>
    classCount && animateCount(classCount, s.numChildren())
  );

  db.ref("users").on("value", s => {
    let t = 0, st = 0;
    s.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") t++;
        if (u.val().role === "student") st++;
      }
    });
    teacherCount && animateCount(teacherCount, t);
    studentCount && animateCount(studentCount, st);
  });
}

/***********************
 🟡 APPROVALS
************************/
function loadApprovals() {
  if (!pendingList) return;

  db.ref("users").on("value", snap => {
    pendingList.innerHTML = "";
    let found = false;

    snap.forEach(u => {
      const d = u.val();
      if (d.approved === false) {
        found = true;
        pendingList.innerHTML += `
          <li>
            <strong>${d.name}</strong>
            <small>${d.email}</small>
            <div class="actions">
              <button onclick="approveUser('${u.key}')">Approve</button>
              <button class="danger" onclick="rejectUser('${u.key}')">Reject</button>
            </div>
          </li>`;
      }
    });

    if (!found)
      pendingList.innerHTML = "<p class='muted'>No pending approvals 🎉</p>";
  });
}

function approveUser(uid) {
  db.ref("users/" + uid).update({ approved: true })
    .then(() => toast("Approved ✅"));
}

function rejectUser(uid) {
  confirmModal("Reject User", "Reject this user?", () =>
    db.ref("users/" + uid).remove().then(() => toast("Rejected ❌"))
  );
}

/***********************
 🏫 CLASSES
************************/
function loadClasses() {
  if (!classList) return;

  db.ref("classes").on("value", snap => {
    classList.innerHTML = "";
    snap.forEach(c => {
      classList.innerHTML += `
        <li>
          <strong>${c.val().name}</strong>
          <div class="actions">
            <button onclick="openClassPanel('${c.key}')">View</button>
            <button onclick="editClassPanel('${c.key}')">✏️</button>
          </div>
        </li>`;
    });
  });
}

function addClass() {
  const name = className.value.trim();
  if (!name) return toast("Enter class name");

  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({ name, subjects: {}, students: {} })
    .then(() => {
      className.value = "";
      toast("Class added ✅");
    });
}

/***********************
 📘 CLASS PANEL
************************/
function openClassPanel(classId) {
  db.ref("classes/" + classId).once("value").then(snap => {
    const cls = snap.val();
    if (!cls) return toast("Class not found");

    classPanel.innerHTML = `
      <h2>${cls.name}</h2>
      <button onclick="closeAllPanels()">Close</button>
    `;
    openPanel(classPanel);
  });
}

/***********************
 👨‍🏫 TEACHERS
************************/
function loadTeachers() {
  if (!teacherList) return;

  db.ref("users").on("value", snap => {
    teacherList.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        teacherList.innerHTML += `
          <li>
            <strong>${d.name}</strong>
            <button onclick="openTeacherPanel('${u.key}')">View</button>
          </li>`;
      }
    });
  });
}

function openTeacherPanel(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const t = snap.val();
    teacherPanel.innerHTML = `
      <h2>${t.name}</h2>
      <p>${t.email}</p>
      <button onclick="closeAllPanels()">Close</button>
    `;
    openPanel(teacherPanel);
  });
}

/***********************
 ⚙ SETTINGS
************************/
function loadSettings() {
  db.ref("settings").once("value").then(s =>
    minAttendance.value = s.val()?.minAttendance || 75
  );
}

function saveSettings() {
  const v = Number(minAttendance.value);
  if (v < 0 || v > 100) return toast("Invalid value");
  db.ref("settings").update({ minAttendance: v })
    .then(() => toast("Settings saved"));
}

/***********************
 📦 PANELS
************************/
function openPanel(el) {
  overlay.classList.add("show");
  el.classList.add("active-panel");
}

function closeAllPanels() {
  overlay.classList.remove("show");
  document.querySelectorAll(".side-panel")
    .forEach(p => p.classList.remove("active-panel"));
}

/***********************
 ❓ MODAL
************************/
function confirmModal(title, text, cb) {
  modalTitle.innerText = title;
  modalText.innerText = text;
  modal.classList.add("show");
  modalOk.onclick = () => {
    modal.classList.remove("show");
    cb();
  };
}

/***********************
 🔔 TOAST
************************/
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/***********************
 🔢 COUNT ANIMATION
************************/
function animateCount(el, target) {
  let cur = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    cur += step;
    if (cur >= target) {
      el.innerText = target;
      clearInterval(timer);
    } else el.innerText = cur;
  }, 20);
}
