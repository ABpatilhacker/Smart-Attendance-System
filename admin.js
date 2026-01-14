const auth = window.auth;
const db = window.db;

/* ---------- UI ---------- */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.querySelector(".overlay").classList.toggle("active");
}

function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/* ---------- DASHBOARD ---------- */
function showDashboard() {
  document.getElementById("view").innerHTML = `
    <div class="cards">
      <div class="card blue">👨‍🏫 Teachers <span id="tCount">0</span></div>
      <div class="card purple">🎓 Students <span id="sCount">0</span></div>
      <div class="card green">🏫 Classes <span id="cCount">0</span></div>
    </div>
  `;

  db.ref("users").once("value", snap => {
    let t=0,s=0;
    snap.forEach(u=>{
      if(u.val().role==="teacher" && u.val().status==="approved") t++;
      if(u.val().role==="student" && u.val().status==="approved") s++;
    });
    document.getElementById("tCount").innerText=t;
    document.getElementById("sCount").innerText=s;
  });

  db.ref("classes").once("value", snap=>{
    document.getElementById("cCount").innerText=snap.exists()?snap.numChildren():0;
  });
}

/* ---------- APPROVAL ---------- */
function showPending() {
  document.getElementById("view").innerHTML = `<h2>Pending Approvals</h2><div id="list"></div>`;
  const list = document.getElementById("list");

  db.ref("users").once("value").then(snap=>{
    list.innerHTML="";
    snap.forEach(u=>{
      const user=u.val();
      if(user.status==="pending"){
        list.innerHTML+=`
          <div class="row">
            <b>${user.name}</b> (${user.role})
            <button onclick="approve('${u.key}')">Approve</button>
          </div>`;
      }
    });
  });
}

function approve(uid){
  if(!confirm("Approve user?")) return;
  db.ref("users/"+uid+"/status").set("approved").then(showPending);
}

/* ---------- CLASSES ---------- */
function showClasses(){
  document.getElementById("view").innerHTML=`
    <h2>Create Class</h2>
    <input id="className" placeholder="Class Name">
    <button onclick="addClass()">Create</button>
    <div id="classList"></div>
  `;
  loadClasses();
}

function addClass(){
  const name=document.getElementById("className").value;
  if(!name) return alert("Enter class");
  db.ref("classes").push({name});
  document.getElementById("className").value="";
  loadClasses();
}

function loadClasses(){
  const box=document.getElementById("classList");
  db.ref("classes").once("value",snap=>{
    box.innerHTML="";
    snap.forEach(c=>{
      box.innerHTML+=`<div class="row">🏫 ${c.val().name}</div>`;
    });
  });
}

/* ---------- TEACHERS ---------- */
function showTeachers(){
  document.getElementById("view").innerHTML="<h2>Teachers</h2><div id='tList'></div>";
  const tList=document.getElementById("tList");

  db.ref("users").once("value",snap=>{
    tList.innerHTML="";
    snap.forEach(u=>{
      const user=u.val();
      if(user.role==="teacher" && user.status==="approved"){
        tList.innerHTML+=`<div class="row">👨‍🏫 ${user.name}</div>`;
      }
    });
  });
}

/* ---------- INIT ---------- */
auth.onAuthStateChanged(user=>{
  if(!user) location.href="login.html";
  else showDashboard();
});