// ----- GLOBAL REFS -----
const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const mainView = document.getElementById("main-view");

let currentTeacher = null;

// ----- SIDEBAR TOGGLE -----
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ----- LOGOUT -----
function logout() {
  auth.signOut().then(()=>location.href="login.html");
}

// ----- AUTH STATE -----
auth.onAuthStateChanged(user=>{
  if(!user) location.href="login.html";
  currentTeacher = user.uid;
  setTeacherName();
  showDashboard();
});

// ----- SET TEACHER NAME -----
function setTeacherName(){
  db.ref(`users/${currentTeacher}`).once("value").then(snap=>{
    document.getElementById("teacher-name").textContent = snap.val().name;
  });
}

// ----- TOAST -----
function showToast(msg,type="success"){
  const toast = document.createElement("div");
  toast.className=`toast ${type}`;
  toast.textContent=msg;
  document.body.appendChild(toast);
  setTimeout(()=>toast.classList.add("show"),50);
  setTimeout(()=>{toast.classList.remove("show");setTimeout(()=>toast.remove(),300)},2000);
}

// ----- DASHBOARD OVERVIEW -----
function showDashboard(){
  closeSidebar();
  mainView.innerHTML=`
    <h2>Dashboard Overview</h2>
    <div class="card-grid" id="overview-cards"></div>
  `;
  const cards=document.getElementById("overview-cards");
  db.ref(`users/${currentTeacher}/assignments`).once("value").then(snap=>{
    const classSet=new Set();
    const subjectSet=new Set();
    let totalStudents=0;
    snap.forEach(a=>{
      const [classId, subjectId]=a.key.split("_");
      classSet.add(classId);
      subjectSet.add(subjectId);
      db.ref(`classes/${classId}/students`).once("value").then(ss=>{
        totalStudents+=ss.size||0;
        if(a.key===snap.keys().pop()){
          const kpis=[
            {title:"Total Classes",value:classSet.size},
            {title:"Total Subjects",value:subjectSet.size},
            {title:"Total Students",value:totalStudents}
          ];
          kpis.forEach(k=>{
            const card=document.createElement("div");
            card.className="card overview-card";
            card.innerHTML=`<h3>${k.title}</h3><p>${k.value}</p>`;
            cards.appendChild(card);
          });
        }
      });
    });
  });
}

// ----- SHOW ATTENDANCE -----
function showAttendance(){
  closeSidebar();
  mainView.innerHTML=`<h2>Mark Attendance</h2><div id="attendance-classes"></div>`;
  const cont=document.getElementById("attendance-classes");

  db.ref(`users/${currentTeacher}/assignments`).once("value").then(snap=>{
    const classes=[];
    snap.forEach(a=>{
      const [classId, subjectId]=a.key.split("_");
      if(!classes.find(c=>c.classId===classId)) classes.push({classId, subjectId});
    });

    classes.forEach(c=>{
      db.ref(`classes/${c.classId}`).once("value").then(csnap=>{
        const cls=csnap.val();
        const card=document.createElement("div");
        card.className="card";
        card.innerHTML=`
          <h3>${cls.name}</h3>
          <p>Subject: ${cls.subjects["subject1"]}</p>
          <label>Date: <input type="date" id="att-date-${c.classId}" value="${new Date().toISOString().split("T")[0]}"></label>
          <div id="student-list-${c.classId}"></div>
          <button onclick="markAttendance('${c.classId}','${c.subjectId}')">Save Attendance</button>
        `;
        cont.appendChild(card);

        const listDiv=document.getElementById(`student-list-${c.classId}`);
        const today=new Date().toISOString().split("T")[0];
        db.ref(`classes/${c.classId}/students`).once("value").then(ssnap=>{
          ssnap.forEach(s=>{
            db.ref(`users/${s.key}`).once("value").then(usnap=>{
              const stu=usnap.val();
              const sel=document.createElement("select");
              sel.id=`status-${c.classId}-${s.key}`;
              sel.innerHTML=`<option value="present">Present</option><option value="absent">Absent</option>`;
              sel.onchange=()=>highlightCard(c.classId,s.key);
              const div=document.createElement("div");
              div.className="card student-card";
              div.id=`card-${c.classId}-${s.key}`;
              div.innerHTML=`<h4>${stu.name}</h4><p>${stu.email}</p>`;
              div.appendChild(sel);
              listDiv.appendChild(div);
            });
          });
        });
      });
    });
  });
}

// ----- HIGHLIGHT CARD -----
function highlightCard(classId,stuId){
  const card=document.getElementById(`card-${classId}-${stuId}`);
  const status=document.getElementById(`status-${classId}-${stuId}`).value;
  if(status==="present"){card.classList.add("ok-attendance");card.classList.remove("low-attendance");}
  else{card.classList.add("low-attendance");card.classList.remove("ok-attendance");}
}

// ----- MARK ATTENDANCE -----
function markAttendance(classId,subjectId){
  const date=document.getElementById(`att-date-${classId}`).value;
  if(!date) return showToast("Select date!","error");
  db.ref(`classes/${classId}/students`).once("value").then(snap=>{
    snap.forEach(s=>{
      const status=document.getElementById(`status-${classId}-${s.key}`).value;
      db.ref(`classes/${classId}/attendance/${date}/${s.key}`).set(status);
      highlightCard(classId,s.key);
    });
    showToast("Attendance saved!");
  });
}

// ----- SHOW DEFAULTERS -----
function showDefaulters(){
  closeSidebar();
  mainView.innerHTML=`<h2>Defaulters</h2><div class="card-grid" id="defaulters-list"></div>`;
  db.ref(`users/${currentTeacher}/assignments`).once("value").then(snap=>{
    const defList=document.getElementById("defaulters-list");
    snap.forEach(a=>{
      const [classId,subjectId]=a.key.split("_");
      db.ref(`classes/${classId}/students`).once("value").then(ssnap=>{
        ssnap.forEach(s=>{
          db.ref(`classes/${classId}/attendance`).once("value").then(asnap=>{
            const totalDays=Object.keys(asnap.val()||{}).length||1;
            let presentCount=0;
            Object.values(asnap.val()).forEach(d=>{if(d[s.key]==="present") presentCount++;});
            const percent=Math.round((presentCount/totalDays)*100);
            if(percent<75){
              db.ref(`users/${s.key}`).once("value").then(usnap=>{
                const stu=usnap.val();
                const card=document.createElement("div");
                card.className="card student-card low-attendance";
                card.innerHTML=`<h4>${stu.name}</h4><p>Attendance: ${percent}%</p>`;
                defList.appendChild(card);
              });
            }
          });
        });
      });
    });
  });
}

// ----- SHOW PROFILE -----
function showProfile(){
  closeSidebar();
  db.ref(`users/${currentTeacher}`).once("value").then(snap=>{
    const t=snap.val();
    mainView.innerHTML=`
      <h2>My Profile</h2>
      <div class="card">
        <p><strong>Name:</strong> ${t.name}</p>
        <p><strong>Email:</strong> ${t.email}</p>
        <p><strong>Assigned Classes & Subjects:</strong></p>
        <ul>${Object.keys(t.assignments||{}).map(k=>`<li>${k.replace("_"," - ")}</li>`).join("")}</ul>
      </div>
    `;
  });
}
