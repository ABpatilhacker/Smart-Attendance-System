/******** FIREBASE ********/
firebase.initializeApp({
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89"
});
const auth=firebase.auth(),db=firebase.database();

/******** AUTH ********/
auth.onAuthStateChanged(u=>{
  if(!u)location.href="login.html";
  loadDashboard();loadClasses();loadTeachers();loadApprovals();loadSettings();
});

/******** NAV ********/
function nav(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

/******** SIDEBAR ********/
function toggleSidebar(){document.body.classList.toggle("sidebar-open")}
function closeSidebar(){document.body.classList.remove("sidebar-open")}

/******** DASHBOARD ********/
function loadDashboard(){
  db.ref("classes").on("value",s=>classCount.innerText=s.numChildren());
  db.ref("users").on("value",s=>{
    let t=0,st=0;
    s.forEach(u=>{
      if(u.val().approved){
        if(u.val().role==="teacher")t++;
        if(u.val().role==="student")st++;
      }
    });
    teacherCount.innerText=t;
    studentCount.innerText=st;
  });
}

/******** CLASSES ********/
function loadClasses(){
  db.ref("classes").on("value",s=>{
    classList.innerHTML="";
    s.forEach(c=>{
      classList.innerHTML+=`
      <li>
        <b>${c.val().name}</b>
        <div class="actions">
          <button onclick="openClass('${c.key}')">View</button>
        </div>
      </li>`;
    });
  });
}

function openClass(id){
  db.ref("classes/"+id).once("value",s=>{
    classPanel.innerHTML=`
      <h2>${s.val().name}</h2>
      <button onclick="closePanel()">Close</button>`;
    openPanel(classPanel);
  });
}

/******** TEACHERS ********/
function loadTeachers(){
  db.ref("users").on("value",s=>{
    teacherList.innerHTML="";
    s.forEach(u=>{
      if(u.val().role==="teacher"&&u.val().approved){
        teacherList.innerHTML+=`
        <li>
          ${u.val().name}
          <div class="actions">
            <button onclick="openTeacher('${u.key}')">View</button>
          </div>
        </li>`;
      }
    });
  });
}

function openTeacher(uid){
  db.ref("users/"+uid).once("value",s=>{
    teacherPanel.innerHTML=`
      <h2>${s.val().name}</h2>
      <p>${s.val().email}</p>
      <button onclick="closePanel()">Close</button>`;
    openPanel(teacherPanel);
  });
}

/******** APPROVALS ********/
function loadApprovals(){
  db.ref("users").on("value",s=>{
    pendingList.innerHTML="";
    s.forEach(u=>{
      if(u.val().approved===false){
        pendingList.innerHTML+=`
        <li>
          ${u.val().email}
          <div class="actions">
            <button onclick="approve('${u.key}')">Approve</button>
            <button onclick="reject('${u.key}')">Reject</button>
          </div>
        </li>`;
      }
    });
  });
}
function approve(id){db.ref("users/"+id).update({approved:true});toast("Approved")}
function reject(id){db.ref("users/"+id).remove();toast("Rejected")}

/******** SETTINGS ********/
function loadSettings(){
  db.ref("settings/minAttendance").once("value",s=>{
    if(s.exists())minAttendance.value=s.val();
  });
}
function saveSettings(){
  db.ref("settings").update({minAttendance:+minAttendance.value});
  toast("Saved");
}

/******** UI ********/
function openPanel(p){
  p.classList.add("active");
  overlay.style.display="block";
  document.body.classList.add("panel-open");
}
function closePanel(){
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  overlay.style.display="none";
  document.body.classList.remove("panel-open");
}

function logout(){auth.signOut().then(()=>location.href="login.html")}

function toast(t){
  const d=document.createElement("div");
  d.className="toast";d.innerText=t;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),3000);
}
