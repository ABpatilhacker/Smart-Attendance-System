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
const db = firebase.database();
const auth = firebase.auth();

/* AUTH */
auth.onAuthStateChanged(u => {
  if (!u) location.href = "login.html";
  loadDashboard();
  loadClasses();
  loadTeachers();
  loadStudents();
  loadApprovals();
});

/* UI */
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
function openSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

/* DASHBOARD */
function loadDashboard() {
  db.ref("classes").on("value", s => classCount.innerText = s.numChildren());
  db.ref("users").on("value", s => {
    let t=0, st=0;
    s.forEach(u=>{
      if(u.val().approved){
        if(u.val().role==="teacher") t++;
        if(u.val().role==="student") st++;
      }
    });
    teacherCount.innerText=t;
    studentCount.innerText=st;
  });
}

/* CLASSES */
function loadClasses(){
  db.ref("classes").on("value", snap=>{
    classList.innerHTML="";
    snap.forEach(c=>{
      const card=document.createElement("div");
      card.className="card";
      card.innerHTML=`<h3>${c.val().name}</h3>`;
      card.onclick=()=>openClass(c.key,c.val());
      classList.appendChild(card);
    });
  });
}

function openClass(id,data){
  const panel=document.getElementById("classDetails");
  panel.classList.remove("hidden");
  panel.innerHTML=`<h3>${data.name}</h3>
  <p>Subjects:</p>
  <ul>${Object.values(data.subjects||{}).map(s=>`<li>${s.name}</li>`).join("")}</ul>
  <p onclick="openStudents('${id}')"><b>Students: ${Object.keys(data.students||{}).length}</b></p>`;
}

/* TEACHERS */
function loadTeachers(){
  db.ref("users").on("value",snap=>{
    teacherList.innerHTML="";
    snap.forEach(u=>{
      if(u.val().role==="teacher" && u.val().approved){
        const card=document.createElement("div");
        card.className="card";
        card.innerHTML=`<h3>${u.val().name}</h3>`;
        card.onclick=()=>openTeacher(u.key,u.val());
        teacherList.appendChild(card);
      }
    });
  });
}

function openTeacher(id,data){
  teacherProfile.classList.remove("hidden");
  teacherProfile.innerHTML=`
    <h3>${data.name}</h3>
    <p>${data.email}</p>
    <p>Department: ${data.department||"-"}</p>`;
}

/* STUDENTS */
function loadStudents(){
  db.ref("users").on("value",snap=>{
    studentList.innerHTML="";
    snap.forEach(u=>{
      if(u.val().role==="student" && u.val().approved){
        const card=document.createElement("div");
        card.className="card";
        card.innerHTML=`<h3>${u.val().name}</h3>`;
        card.onclick=()=>openStudent(u.val());
        studentList.appendChild(card);
      }
    });
  });
}

function openStudents(classId){
  openSection("students");
}

function openStudent(data){
  studentProfile.classList.remove("hidden");
  studentProfile.innerHTML=`
    <h3>${data.name}</h3>
    <p>Email: ${data.email}</p>
    <p>Roll: ${data.roll}</p>
    <p>Class: ${data.classId}</p>`;
}

/* APPROVALS */
function loadApprovals(){
  db.ref("users").on("value",snap=>{
    pendingList.innerHTML="";
    snap.forEach(u=>{
      if(!u.val().approved){
        const card=document.createElement("div");
        card.className="card";
        card.innerHTML=`
          <h3>${u.val().name}</h3>
          <button onclick="approveUser('${u.key}')">Approve</button>`;
        pendingList.appendChild(card);
      }
    });
  });
}

function approveUser(id){
  db.ref("users/"+id).update({approved:true});
}

/* SETTINGS */
function saveSettings(){
  db.ref("settings").update({
    minAttendance: Number(minAttendance.value)
  });
}
