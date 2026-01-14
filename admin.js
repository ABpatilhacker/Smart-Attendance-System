const auth = firebase.auth();
const db = firebase.database();

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

overlay.onclick = toggleSidebar;

function scrollTo(id) {
  toggleSidebar();
  document.getElementById(id).scrollIntoView({behavior:"smooth"});
}

function logout() {
  auth.signOut().then(() => location.href="login.html");
}

auth.onAuthStateChanged(user => {
  if (!user) location.href="login.html";
  loadData();
});

function loadData() {
  db.ref("classes").on("value", s => {
    document.getElementById("kClasses").innerText = s.numChildren();
    loadClassDropdowns(s);
    loadClassList(s);
  });

  db.ref("users").on("value", s => {
    let t=0, st=0;
    s.forEach(u=>{
      if(u.val().role==="teacher") t++;
      if(u.val().role==="student") st++;
    });
    document.getElementById("kTeachers").innerText=t;
    document.getElementById("kStudents").innerText=st;
    loadStudents(s);
  });
}

function createClass() {
  const name=document.getElementById("className").value;
  if(!name) return alert("Enter class name");
  db.ref("classes").push({name});
}

function addSubject() {
  const c=document.getElementById("subjectClass").value;
  const s=document.getElementById("subjectName").value;
  if(!c||!s) return;
  db.ref(`classes/${c}/subjects`).push(s);
}

function assignStudent() {
  const c=document.getElementById("assignClass").value;
  const s=document.getElementById("assignStudentId").value;
  db.ref(`classes/${c}/students/${s}`).set(true);
}

function loadClassDropdowns(snap){
  ["subjectClass","assignClass"].forEach(id=>{
    const el=document.getElementById(id);
    el.innerHTML="";
    snap.forEach(c=>{
      el.innerHTML+=`<option value="${c.key}">${c.val().name}</option>`;
    });
  });
}

function loadStudents(snap){
  const el=document.getElementById("assignStudentId");
  el.innerHTML="";
  snap.forEach(u=>{
    if(u.val().role==="student"){
      el.innerHTML+=`<option value="${u.key}">${u.val().name}</option>`;
    }
  });
}

function loadClassList(snap){
  const el=document.getElementById("classList");
  el.innerHTML="";
  snap.forEach(c=>{
    el.innerHTML+=`<p>📌 ${c.val().name}</p>`;
  });
}
