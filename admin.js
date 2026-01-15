auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "admin") {
      alert("Access denied");
      auth.signOut();
    } else {
      document.getElementById("adminName").innerText = snap.val().name;
      loadDashboard();
      loadClasses();
      loadTeachers();
      loadStudents();
      loadSettings();
    }
  });
});

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("pageTitle").innerText =
    id.charAt(0).toUpperCase() + id.slice(1);
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

/* DASHBOARD */
function loadDashboard() {
  db.ref("users").once("value", snap => {
    let t=0,s=0;
    snap.forEach(u=>{
      if(u.val().role==="teacher") t++;
      if(u.val().role==="student") s++;
    });
    document.getElementById("teacherCount").innerText=t;
    document.getElementById("studentCount").innerText=s;
  });

  db.ref("classes").once("value", s=>{
    document.getElementById("classCount").innerText = s.numChildren();
  });
}

/* CLASSES */
function createClass() {
  const name = document.getElementById("className").value;
  if(!name) return alert("Enter class name");
  db.ref("classes").push({ name });
}

function loadClasses() {
  const list=document.getElementById("classList");
  const select=document.getElementById("studentClass");
  db.ref("classes").on("value", snap=>{
    list.innerHTML=""; select.innerHTML="";
    snap.forEach(c=>{
      list.innerHTML+=`<li>${c.val().name}</li>`;
      select.innerHTML+=`<option value="${c.key}">${c.val().name}</option>`;
    });
  });
}

/* TEACHERS */
function loadTeachers() {
  const list=document.getElementById("teacherList");
  db.ref("users").orderByChild("role").equalTo("teacher")
  .on("value", snap=>{
    list.innerHTML="";
    snap.forEach(t=>{
      list.innerHTML+=
        `<li onclick="openTeacher('${t.key}')">${t.val().name}</li>`;
    });
  });
}

function openTeacher(id) {
  db.ref("users/"+id).once("value", snap=>{
    const t=snap.val();
    document.getElementById("teacherProfile").classList.remove("hidden");
    document.getElementById("teacherProfile").innerHTML=
      `<h3>${t.name}</h3>
       <p>Email: ${t.email}</p>
       <p>Assignments: ${Object.keys(t.assignments||{}).length}</p>`;
  });
}

/* STUDENTS */
function addStudent() {
  const name=document.getElementById("studentName").value;
  const roll=document.getElementById("rollNo").value;
  const cls=document.getElementById("studentClass").value;
  if(!name||!roll||!cls) return alert("Fill all");

  db.ref("students").push({ name, roll, classId: cls });
}

function loadStudents() {
  const list=document.getElementById("studentList");
  db.ref("students").on("value", snap=>{
    list.innerHTML="";
    snap.forEach(s=>{
      list.innerHTML+=
        `<li>${s.val().name} (Roll ${s.val().roll})</li>`;
    });
  });
}

/* SETTINGS */
function loadSettings() {
  db.ref("settings/minAttendance").once("value", s=>{
    document.getElementById("minAttendance").value = s.val() || 75;
  });
}

function saveSettings() {
  const v=document.getElementById("minAttendance").value;
  db.ref("settings/minAttendance").set(Number(v));
  alert("Saved");
}