firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/* AUTH */
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "login.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
      return;
    }
    loadDashboard();
    loadClasses();
    loadTeachers();
    loadApprovals();
    loadSettings();
  });
});

function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/* DASHBOARD */
function loadDashboard() {
  db.ref("classes").on("value", s => classCount.innerText = s.numChildren());

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

/* CLASSES */
function loadClasses() {
  db.ref("classes").on("value", snap => {
    classList.innerHTML = "";
    snap.forEach(c => {
      classList.innerHTML += `
        <li>
          <strong>${c.val().name}</strong>
          <div class="actions">
            <button onclick="openClassPanel('${c.key}')">View</button>
            <button class="danger" onclick="deleteClass('${c.key}')">Delete</button>
          </div>
        </li>`;
    });
  });
}

function addClass() {
  const name = className.value.trim();
  if (!name) return toast("Enter class name");
  const id = name.toLowerCase().replace(/\s+/g, "");
  db.ref("classes/" + id).set({ name, students:{}, subjects:{} })
    .then(() => toast("Class added"));
}

function openClassPanel(id) {
  db.ref("classes/" + id).once("value").then(s => {
    classPanel.innerHTML = `<h2>${s.val().name}</h2><pre>${JSON.stringify(s.val(),null,2)}</pre>`;
    openPanel("classPanel");
  });
}

function deleteClass(id) {
  confirmModal("Delete class", "Are you sure?", () =>
    db.ref("classes/" + id).remove().then(() => toast("Deleted"))
  );
}

/* TEACHERS */
function loadTeachers() {
  db.ref("users").on("value", snap => {
    teacherList.innerHTML = "";
    snap.forEach(u => {
      const d = u.val();
      if (d.role === "teacher" && d.approved) {
        teacherList.innerHTML += `
          <li>
            <span>${d.name}<br><small>${d.email}</small></span>
            <div class="actions">
              <button onclick="openTeacherPanel('${u.key}')">View</button>
            </div>
          </li>`;
      }
    });
  });
}

function addTeacher() {
  teacherProfile.innerHTML = `
    <h2>Add Teacher</h2>
    <input id="tName" placeholder="Name">
    <input id="tEmail" placeholder="Email">
    <input id="tPass" type="password" placeholder="Password">
    <button onclick="createTeacher()">Create</button>`;
  openPanel("teacherProfile");
}

function createTeacher() {
  auth.createUserWithEmailAndPassword(tEmail.value, tPass.value)
    .then(r => db.ref("users/"+r.user.uid).set({
      name:tName.value,email:tEmail.value,role:"teacher",approved:true
    }))
    .then(()=>{toast("Teacher created");closeAllPanels();});
}

/* APPROVALS */
function loadApprovals() {
  db.ref("users").on("value", snap => {
    pendingList.innerHTML = "";
    snap.forEach(u => {
      if (u.val().approved === false) {
        pendingList.innerHTML += `
          <li>
            ${u.val().name}
            <button onclick="approveUser('${u.key}')">Approve</button>
          </li>`;
      }
    });
  });
}

function approveUser(uid) {
  db.ref("users/"+uid).update({approved:true}).then(()=>toast("Approved"));
}

/* SETTINGS */
function loadSettings() {
  db.ref("settings/minAttendance").once("value", s =>
    minAttendance.value = s.val() || 75
  );
}

function saveSettings() {
  db.ref("settings").update({minAttendance:Number(minAttendance.value)})
    .then(()=>toast("Saved"));
}

/* UI */
function toggleSidebar(){document.body.classList.toggle("sidebar-open");}
function nav(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}
function closeSidebar(){document.body.classList.remove("sidebar-open");}

/* PANELS */
function openPanel(id){
  document.getElementById(id).classList.add("active-panel");
  panelOverlay.classList.add("show");
}
function closeAllPanels(){
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active-panel"));
  panelOverlay.classList.remove("show");
}

/* MODAL + TOAST */
function confirmModal(t,m,cb){
  modalTitle.innerText=t;modalText.innerText=m;modal.classList.add("show");
  modalOk.onclick=()=>{closeModal();cb();}
}
function closeModal(){modal.classList.remove("show");}
function toast(msg){
  const t=document.createElement("div");
  t.className="toast";t.innerText=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
          }
