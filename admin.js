/***********************
 🔥 FIREBASE CONFIG
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
 🔐 AUTH CHECK
************************/
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "login.html";
  else {
    loadDashboard();
    loadApprovals();
    loadClasses();
    loadTeachers();
    loadSettings();
  }
});

/***********************
 🚪 LOGOUT
************************/
function logout() { auth.signOut().then(()=>window.location.href="login.html"); }

/***********************
 📊 DASHBOARD COUNTS
************************/
function loadDashboard(){
  db.ref("classes").on("value",snap=>document.getElementById("classCount").innerText=snap.numChildren());
  db.ref("users").on("value",snap=>{
    let teachers=0,students=0;
    snap.forEach(u=>{
      if(u.val().approved===true){
        if(u.val().role==="teacher") teachers++;
        if(u.val().role==="student") students++;
      }
    });
    document.getElementById("teacherCount").innerText=teachers;
    document.getElementById("studentCount").innerText=students;
  });
}

/***********************
 🟡 APPROVALS
************************/
function loadApprovals(){
  const list=document.getElementById("pendingList");
  if(!list) return;
  db.ref("users").on("value",snap=>{
    list.innerHTML="";
    let hasPending=false;
    snap.forEach(child=>{
      const u=child.val(); const uid=child.key;
      if(u.approved===false){
        hasPending=true;
        const li=document.createElement("li");
        li.className="approval-card";
        li.innerHTML=`
          <strong>${u.name}</strong><br>
          <small>${u.email}</small><br>
          <span class="badge">${u.role.toUpperCase()}</span><br><br>
          <button class="approve-btn" onclick="approveUser('${uid}')">✅ Approve</button>
          <button class="reject-btn" onclick="rejectUser('${uid}')">❌ Reject</button>
        `;
        list.appendChild(li);
      }
    });
    if(!hasPending) list.innerHTML="<p class='muted'>No pending approvals 🎉</p>";
  });
}
function approveUser(uid){db.ref("users/"+uid).update({approved:true}).then(()=>toast("User approved ✅"));}
function rejectUser(uid){if(!confirm("Are you sure?")) return; db.ref("users/"+uid).remove().then(()=>toast("User rejected ❌"));}

/***********************
 🏫 CLASSES
************************/
function loadClasses(){
  const list=document.getElementById("classList");
  const select=document.getElementById("studentClass");
  if(select) select.innerHTML="";
  db.ref("classes").on("value",snap=>{
    list.innerHTML="";
    snap.forEach(c=>{
      const li=document.createElement("li");
      li.className="class-card";
      li.innerHTML=`<strong>${c.val().name}</strong> <button onclick="openClassDetails('${c.key}')">View Details</button>`;
      list.appendChild(li);
      if(select){
        const opt=document.createElement("option");
        opt.value=c.key; opt.textContent=c.val().name;
        select.appendChild(opt);
      }
    });
  });
}

function addClass(){
  const name=document.getElementById("className").value.trim();
  if(!name) return toast("Enter class name ⚠️");
  const id=name.toLowerCase().replace(/\s+/g,"");
  db.ref("classes/"+id).set({name}).then(()=>{document.getElementById("className").value=""; toast("Class added ✅");});
}

function openClassDetails(classId){
  db.ref("classes/"+classId).once("value").then(snap=>{
    const c=snap.val();
    const panel=document.getElementById("classPanel");
    let subjectList="";
    for(let sub in c.subjects){
      const subData=c.subjects[sub];
      db.ref("users/"+subData.teacherId).once("value").then(tsnap=>{
        subjectList+=`<li>${subData.name} – ${tsnap.val().name}</li>`;
        panel.innerHTML=`
          <h3>${c.name} – Class Details</h3>
          <h4>Subjects</h4><ul>${subjectList || "<li>No subjects assigned</li>"}</ul>
          <h4>Students</h4><table border="1" cellpadding="8" cellspacing="0"><tr><th>Roll</th><th>Name</th></tr>${
            Object.values(c.students||{}).map(s=>`<tr onclick="openStudentProfile('${s.uid}')"><td>${s.roll}</td><td>${s.name}</td></tr>`).join("")
          }</table>
          <button onclick="closePanel('classPanel')">Close</button>
        `;
      });
    }
    panel.classList.add("active-panel");
  });
}

/***********************
 👨‍🏫 TEACHERS
************************/
function loadTeachers(){
  const list=document.getElementById("teacherList"); if(!list) return;
  db.ref("users").on("value",snap=>{
    list.innerHTML="";
    snap.forEach(u=>{
      const data=u.val();
      if(data.role==="teacher"&&data.approved===true){
        const li=document.createElement("li");
        li.className="teacher-card";
        li.innerHTML=`<strong>${data.email}</strong> <button onclick="openTeacherProfile('${u.key}')">View Profile</button>`;
        list.appendChild(li);
      }
    });
  });
}

function addTeacher(){
  const name=document.getElementById
