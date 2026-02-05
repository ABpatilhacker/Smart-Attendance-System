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
const teacherProfile = $("teacherProfile");

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

    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  });
});

/***********************
 📊 DASHBOARD COUNTS
************************/
db.ref("classes").on("value", s => {
  if (classCount) animateCount(classCount, s.numChildren());
});

db.ref("users").on("value", s => {
  let t = 0, st = 0;
  s.forEach(u => {
    if (u.val().approved) {
      if (u.val().role === "teacher") t++;
      if (u.val().role === "student") st++;
    }
  });
  if (teacherCount) animateCount(teacherCount, t);
  if (studentCount) animateCount(studentCount, st);
});

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
  confirmModal("Reject User", "Reject this user?", () => {
    db.ref("users/" + uid).remove()
      .then(() => toast("Rejected ❌"));
  });
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
            <button class="danger" onclick="deleteClass('${c.key}')">🗑️</button>
          </div>
        </li>`;
    });
  });
}

/***********************
 ✏️ EDIT CLASS FIX
************************/
function saveClassEdit(id) {
  const input = document.getElementById("editClassName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return toast("Invalid name");

  db.ref("classes/" + id).update({ name })
    .then(() => {
      toast("Class updated");
      closePanel("classPanel");
    });
}

/***********************
 ⚙️ SETTINGS
************************/
function loadSettings() {
  if (!minAttendance) return;
  db.ref("settings").once("value").then(s => {
    minAttendance.value = s.val()?.minAttendance || 75;
  });
}

/***********************
 🧭 UI HELPERS
************************/
function toggleSidebar() {
  const sb = document.querySelector(".sidebar");
  if (sb) sb.classList.toggle("active");
}

/***********************
 🔔 SAFE COUNT ANIMATION
************************/
function animateCount(el, target) {
  if (!el) return;
  let start = 0;
  const step = Math.max(1, Math.floor(target / 30));

  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.innerText = target;
      clearInterval(timer);
    } else {
      el.innerText = start;
    }
  }, 20);
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
