/***********************
 FIREBASE CONFIG
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
 AUTH
************************/
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  else {
    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  }
});

/***********************
 UI HELPERS
************************/
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function openPanel(id) {
  document.getElementById(id).classList.add("active-panel");
  document.body.classList.add("panel-open");
}

function closePanel(id) {
  document.getElementById(id).classList.remove("active-panel");
  document.body.classList.remove("panel-open");
}

/***********************
 LOGOUT
************************/
function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/***********************
 DASHBOARD
************************/
function loadDashboard() {
  db.ref("classes").on("value", s => {
    document.getElementById("classCount").innerText = s.numChildren();
  });

  db.ref("users").on("value", s => {
    let t = 0, st = 0;
    s.forEach(u => {
      if (u.val().approved) {
        if (u.val().role === "teacher") t++;
        if (u.val().role === "student") st++;
      }
    });
    teacherCount.innerText = t;
    studentCount.innerText = st;
  });
}

/***********************
 CLASSES
************************/
function loadClasses() {
  const list = document.getElementById("classList");
  db.ref("classes").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(c => {
      list.innerHTML += `
        <li>
          <strong>${c.val().name}</strong>
          <div class="actions">
            <button onclick="openClassDetails('${c.key}')">View</button>
            <button onclick="deleteClass('${c.key}')">🗑</button>
          </div>
        </li>
      `;
    });
  });
}

function addClass() {
  const name = className.value.trim();
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g,"");
  db.ref("classes/"+id).set({ name });
}

/***********************
 TEACHERS
************************/
function loadTeachers() {
  const list = document.getElementById("teacherList");
  db.ref("users").on("value", snap => {
    list.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        list.innerHTML += `
          <li>
            ${d.email}
            <div class="actions">
              <button onclick="openTeacherProfile('${u.key}')">View</button>
              <button onclick="deleteTeacher('${u.key}')">🗑</button>
            </div>
          </li>
        `;
      }
    });
  });
}

function addTeacher() {
  db.ref("users").push({
    name: teacherName.value,
    email: teacherEmail.value,
    role: "teacher",
    approved: true
  });
}

/***********************
 PANELS
************************/
function openTeacherProfile(uid) {
  db.ref("users/"+uid).once("value").then(s => {
    teacherProfile.innerHTML = `
      <h3>${s.val().name}</h3>
      <p>${s.val().email}</p>
      <button onclick="closePanel('teacherProfile')">Close</button>
    `;
    openPanel("teacherProfile");
  });
}

function openClassDetails(id) {
  db.ref("classes/"+id).once("value").then(s => {
    classPanel.innerHTML = `
      <h3>${s.val().name}</h3>
      <p>Class ID: ${id}</p>
      <button onclick="closePanel('classPanel')">Close</button>
    `;
    openPanel("classPanel");
  });
}

/***********************
 DELETE
************************/
function deleteClass(id) {
  if (confirm("Delete class?")) db.ref("classes/"+id).remove();
}

function deleteTeacher(id) {
  if (confirm("Delete teacher?")) db.ref("users/"+id).remove();
      }
