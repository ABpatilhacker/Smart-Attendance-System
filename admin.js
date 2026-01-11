const auth = firebase.auth();
const db = firebase.database();

/* SIDEBAR */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/* DASHBOARD */
function showDashboard() {
  document.getElementById("content").innerHTML = `
    <div class="card">
      <h2>Welcome Admin 👋</h2>
      <p>Use sidebar to manage system.</p>
    </div>
  `;
}

/* =======================
   PENDING APPROVALS
======================= */
function showPending() {
  const content = document.getElementById("content");
  content.innerHTML = `<h2>Pending Approvals</h2><ul id="pendingList"></ul>`;

  db.ref("users").once("value").then(snapshot => {
    snapshot.forEach(user => {
      if (user.val().status === "pending") {
        const li = document.createElement("li");
        li.innerHTML = `
          ${user.val().name} (${user.val().role})
          <button class="btn" onclick="approveUser('${user.key}')">Approve</button>
        `;
        document.getElementById("pendingList").appendChild(li);
      }
    });
  });
}

function approveUser(uid) {
  db.ref("users/" + uid + "/status").set("approved");
  alert("User approved");
  showPending();
}

/* =======================
   TEACHERS
======================= */
function showTeachers() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Teachers</h2>
    <input id="tname" placeholder="Teacher Name">
    <input id="temail" placeholder="Teacher Email">
    <button class="btn" onclick="addTeacher()">Add Teacher</button>
    <ul id="teacherList"></ul>
  `;
  loadTeachers();
}

function addTeacher() {
  const name = tname.value;
  const email = temail.value;
  if (!name || !email) return alert("Fill all fields");

  const ref = db.ref("teachers").push();
  ref.set({ name, email });
  alert("Teacher added");
  loadTeachers();
}

function loadTeachers() {
  const list = document.getElementById("teacherList");
  if (!list) return;
  list.innerHTML = "";

  db.ref("teachers").once("value").then(snap => {
    snap.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t.val().name;
      list.appendChild(li);
    });
  });
}

/* =======================
   CLASSES + SUBJECTS
======================= */
function showClasses() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Assign Class</h2>
    <input id="className" placeholder="Class Name">
    <input id="subjectName" placeholder="Subject">
    <select id="teacherSelect"></select>
    <button class="btn" onclick="assignClass()">Assign</button>
    <ul id="classList"></ul>
  `;

  loadTeacherDropdown();
  loadClasses();
}

function loadTeacherDropdown() {
  const select = document.getElementById("teacherSelect");
  select.innerHTML = "";

  db.ref("teachers").once("value").then(snap => {
    snap.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.key;
      opt.textContent = t.val().name;
      select.appendChild(opt);
    });
  });
}

function assignClass() {
  const cls = className.value;
  const sub = subjectName.value;
  const tid = teacherSelect.value;

  if (!cls || !sub) return alert("Fill all fields");

  db.ref(`teacherClasses/${tid}/${cls}`).set({ subject: sub });
  alert("Class Assigned");
  loadClasses();
}

function loadClasses() {
  const list = document.getElementById("classList");
  if (!list) return;
  list.innerHTML = "";

  db.ref("teacherClasses").once("value").then(snap => {
    snap.forEach(t => {
      t.forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.key} - ${c.val().subject}`;
        list.appendChild(li);
      });
    });
  });
    }
