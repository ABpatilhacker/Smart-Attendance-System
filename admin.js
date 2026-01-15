// ------------------- GLOBAL -------------------
const auth = firebase.auth();
const db = firebase.database();

const sidebar = document.getElementById("sidebar");
const mainView = document.querySelector(".main");
const overlay = document.createElement("div");
overlay.className = "overlay";
document.body.appendChild(overlay);

// ------------------- SIDEBAR -------------------
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

overlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
});

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("pageTitle").innerText =
    id.charAt(0).toUpperCase() + id.slice(1);
}

// ------------------- LOGOUT -------------------
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

// ------------------- AUTH STATE -------------------
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

// ------------------- TOAST -------------------
function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 50);
  setTimeout(() => { t.classList.remove("show"); setTimeout(()=>t.remove(), 300); }, 2000);
}

// ------------------- DASHBOARD -------------------
function loadDashboard() {
  db.ref("users").once("value", snap => {
    let teachers = 0, students = 0;
    snap.forEach(u=>{
      if(u.val().role==="teacher") teachers++;
      if(u.val().role==="student") students++;
    });
    document.getElementById("teacherCount").innerText = teachers;
    document.getElementById("studentCount").innerText = students;
  });

  db.ref("classes").once("value", s=>{
    document.getElementById("classCount").innerText = s.numChildren();
  });
}

// ------------------- CLASSES -------------------
function createClass() {
  const name = document.getElementById("className").value.trim();
  if(!name) return alert("Enter class name");
  db.ref("classes").push({ name, subjects:{}, students:{} }).then(()=>{
    document.getElementById("className").value = "";
    showToast("Class created!");
    loadClasses();
  });
}

function loadClasses() {
  const list = document.getElementById("classList");
  const select = document.getElementById("studentClass");
  db.ref("classes").on("value", snap=>{
    list.innerHTML = ""; select.innerHTML = "";
    snap.forEach(c=>{
      const val = c.val();
      list.innerHTML += `<li>${val.name} <button onclick="editClass('${c.key}')">Edit</button></li>`;
      select.innerHTML += `<option value="${c.key}">${val.name}</option>`;
    });
  });
}

function editClass(id) {
  db.ref("classes/" + id).once("value").then(snap=>{
    const cls = snap.val();
    const newName = prompt("Edit class name:", cls.name);
    if(newName) db.ref("classes/" + id + "/name").set(newName).then(()=>{
      showToast("Class updated!");
      loadClasses();
    });
  });
}

// ------------------- TEACHERS -------------------
function loadTeachers() {
  const list = document.getElementById("teacherList");
  db.ref("users").orderByChild("role").equalTo("teacher").on("value", snap=>{
    list.innerHTML = "";
    snap.forEach(t=>{
      list.innerHTML += `<li onclick="openTeacher('${t.key}')">${t.val().name}</li>`;
    });
  });
}

function openTeacher(id){
  db.ref("users/"+id).once("value").then(s=>{
    const t = s.val();
    const div = document.getElementById("teacherProfile");
    div.classList.remove("hidden");
    div.innerHTML = `<h3>${t.name}</h3>
      <p>Email: ${t.email}</p>
      <h4>Assign Subjects:</h4>
      <div id="assignSubjects"></div>`;

    // Load all classes & subjects
    db.ref("classes").once("value").then(classesSnap=>{
      const container = document.getElementById("assignSubjects");
      container.innerHTML = "";
      classesSnap.forEach(cSnap=>{
        const cls = cSnap.val();
        const clsId = cSnap.key;
        const subjects = cls.subjects || {};
        const clsDiv = document.createElement("div");
        clsDiv.innerHTML = `<strong>${cls.name}</strong><ul></ul>`;
        const ul = clsDiv.querySelector("ul");

        Object.keys(subjects).forEach(subId=>{
          const li = document.createElement("li");
          li.innerHTML = `${subjects[subId]} 
            <button onclick="assignSubject('${clsId}','${subId}','${id}')">Assign</button>`;
          ul.appendChild(li);
        });

        container.appendChild(clsDiv);
      });
    });
  });
}

function assignSubject(classId, subjectId, teacherId){
  db.ref(`classSubjects/${classId}/${subjectId}`).set({teacherId});
  db.ref(`users/${teacherId}/assignments/${classId}_${subjectId}`).set(true);
  showToast("Subject assigned!");
}

// ------------------- STUDENTS -------------------
function addStudent() {
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNo").value.trim();
  const cls = document.getElementById("studentClass").value;
  if(!name || !roll || !cls) return alert("Fill all fields");

  db.ref("students").push({ name, roll, classId: cls }).then(()=>{
    document.getElementById("studentName").value = "";
    document.getElementById("rollNo").value = "";
    showToast("Student added!");
    loadStudents();
  });
}

function loadStudents() {
  const list = document.getElementById("studentList");
  db.ref("students").on("value", snap=>{
    list.innerHTML = "";
    snap.forEach(s=>{
      const val = s.val();
      list.innerHTML += `<li>${val.name} (Roll ${val.roll})</li>`;
    });
  });
}

// ------------------- SETTINGS -------------------
function loadSettings() {
  db.ref("settings/minAttendance").once("value", s=>{
    document.getElementById("minAttendance").value = s.val() || 75;
  });
}

function saveSettings() {
  const v = Number(document.getElementById("minAttendance").value);
  db.ref("settings/minAttendance").set(v).then(()=> showToast("Settings saved!"));
    }
