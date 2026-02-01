firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.database();

/* AUTH */
auth.onAuthStateChanged(u=>{
  if(!u)location.href="login.html";
  else{
    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  }
});

/* LOGOUT */
function logout(){
  auth.signOut().then(()=>location.href="login.html");
}

/* DASHBOARD */
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

/* APPROVALS */
function loadApprovals(){
  if(!pendingList)return;
  db.ref("users").on("value",snap=>{
    pendingList.innerHTML="";
    snap.forEach(u=>{
      if(u.val().approved===false){
        pendingList.innerHTML+=`
        <li>
          <div>
            <strong>${u.val().name}</strong><br>
            <small>${u.val().email}</small>
          </div>
          <div class="actions">
            <button onclick="approveUser('${u.key}')">Approve</button>
            <button class="danger" onclick="rejectUser('${u.key}')">Reject</button>
          </div>
        </li>`;
      }
    });
  });
}
function approveUser(uid){db.ref("users/"+uid).update({approved:true})}
function rejectUser(uid){db.ref("users/"+uid).remove()}

/* CLASSES */
function loadClasses(){
  classList.innerHTML="";
  db.ref("classes").on("value",snap=>{
    classList.innerHTML="";
    snap.forEach(c=>{
      classList.innerHTML+=`
      <li>
        <strong>${c.val().name}</strong>
        <div class="actions">
          <button onclick="openClassDetails('${c.key}')">View</button>
          <button class="danger" onclick="deleteClass('${c.key}')">Delete</button>
        </div>
      </li>`;
    });
  });
}
function addClass(){
  if(!className.value)return;
  const id=className.value.toLowerCase().replace(/\s/g,"");
  db.ref("classes/"+id).set({name:className.value,subjects:{},students:{}});
  className.value="";
}
function deleteClass(id){db.ref("classes/"+id).remove()}

/* TEACHERS */
function loadTeachers(){
  teacherList.innerHTML="";
  db.ref("users").on("value",snap=>{
    teacherList.innerHTML="";
    snap.forEach(u=>{
      if(u.val().role==="teacher"&&u.val().approved){
        teacherList.innerHTML+=`
        <li>
          <span>${u.val().name}</span>
          <div class="actions">
            <button onclick="openTeacherProfile('${u.key}')">View</button>
            <button class="danger" onclick="deleteTeacher('${u.key}')">Delete</button>
          </div>
        </li>`;
      }
    });
  });
}
function addTeacher(){
  if(!teacherName.value||!teacherEmail.value)return;
  const id=db.ref("users").push().key;
  db.ref("users/"+id).set({
    name:teacherName.value,
    email:teacherEmail.value,
    role:"teacher",
    approved:true
  });
  teacherName.value="";
  teacherEmail.value="";
}
function deleteTeacher(uid){db.ref("users/"+uid).remove()}
function openTeacherProfile(uid){
  db.ref("users/"+uid).once("value",s=>{
    teacherProfile.innerHTML=`
      <h2>${s.val().name}</h2>
      <p>${s.val().email}</p>
      <button onclick="closePanel('teacherProfile')">Close</button>`;
    openPanel("teacherProfile");
  });
}

/* SETTINGS */
function loadSettings(){
  db.ref("settings/minAttendance").once("value",s=>{
    if(s.exists())minAttendance.value=s.val();
  });
}
function saveSettings(){
  db.ref("settings").update({minAttendance:Number(minAttendance.value)});
}

/* UI */
function toggleSidebar(){document.body.classList.toggle("sidebar-open")}
function closeSidebar(){document.body.classList.remove("sidebar-open")}
function nav(id){showPage(id);closeSidebar()}
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* PANEL */
function openPanel(id){
  document.getElementById(id).classList.add("active-panel");
}
function closePanel(id){
  document.getElementById(id).classList.remove("active-panel");
}

/* MODAL */
function closeModal(){modal.classList.remove("show")}
