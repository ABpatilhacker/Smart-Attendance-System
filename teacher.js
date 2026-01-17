const auth = window.auth;
const db = window.db;

const sidebar = document.getElementById("sidebar");
const overlay = document.querySelector(".overlay");
const sections = document.querySelectorAll(".section");

let currentTeacher = null;
let attendanceData = {};
let currentClassId = null;
let currentSubjectId = null;

// ----------------- Sidebar -----------------
function toggleSidebar() {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}
overlay.addEventListener("click", closeSidebar);

// ----------------- Logout -----------------
function logout() {
  auth.signOut().then(()=>location.href="login.html");
}

// ----------------- Auth -----------------
auth.onAuthStateChanged(user=>{
  if(!user) location.href="login.html";
  currentTeacher=user.uid;
  db.ref("users/"+currentTeacher).once("value").then(snap=>{
    const t=snap.val();
    document.getElementById("teacherName").innerText=t.name;
    document.getElementById("teacherGreeting").innerText=t.name;
    loadDashboard();
    loadClasses();
  });
});

// ----------------- Section switch -----------------
function showSection(id){
  sections.forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("pageTitle").innerText=id.charAt(0).toUpperCase()+id.slice(1);
  closeSidebar();
}

// ----------------- Dashboard -----------------
function loadDashboard(){
  db.ref("classes").once("value").then(snap=>{
    let classCount=0, studentCount=0, subjectCount=0;
    snap.forEach(c=>{
      const cls=c.val();
      for(let subj in cls.subjects){
        if(cls.subjects[subj].teacherId===currentTeacher){
          classCount++;
          subjectCount++;
          studentCount+=Object.keys(cls.students||{}).length;
        }
      }
    });
    document.getElementById("classCount").innerText=classCount;
    document.getElementById("studentCount").innerText=studentCount;
    document.getElementById("subjectCount").innerText=subjectCount;
  });
}

// ----------------- Classes -----------------
function loadClasses(){
  const classList=document.getElementById("classList");
  classList.innerHTML="";
  db.ref("classes").once("value").then(snap=>{
    snap.forEach(c=>{
      const cls=c.val();
      for(let subj in cls.subjects){
        if(cls.subjects[subj].teacherId===currentTeacher){
          const card=document.createElement("div");
          card.className="card";
          card.innerText=cls.name+" ("+cls.subjects[subj].name+")";
          card.onclick=()=>openClass(cls,subj);
          classList.appendChild(card);
        }
      }
    });
  });
}

// ----------------- Attendance -----------------
function openClass(cls, subj){
  showSection('attendance');
  currentClassId=cls.id;
  currentSubjectId=subj;
  document.getElementById("attendanceDate").value=new Date().toISOString().split('T')[0];
  loadAttendance();
}

function loadAttendance(){
  const date=document.getElementById("attendanceDate").value;
  const wrapper=document.getElementById("attendanceTableWrapper");
  wrapper.innerHTML="";
  if(!currentClassId || !currentSubjectId) return;
  db.ref(`classes/${currentClassId}/students`).once("value").then(stuSnap=>{
    const students=stuSnap.val()||{};
    db.ref(`attendance/${currentClassId}/${currentSubjectId}/${date}`).once("value").then(attSnap=>{
      attendanceData=attSnap.val()||{};
      const table=document.createElement("table");
      table.className="attendance-table";
      table.innerHTML="<tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th></tr>";
      for(let sid in students){
        const s=students[sid];
        const tr=document.createElement("tr");
        tr.innerHTML=`<td>${s.roll}</td><td>${s.name}</td>
        <td><button class="present ${attendanceData[sid]==='P'?'selected':''}" onclick="markAttendance('${sid}','P',this)">P</button></td>
        <td><button class="absent ${attendanceData[sid]==='A'?'selected':''}" onclick="markAttendance('${sid}','A',this)">A</button></td>`;
        table.appendChild(tr);
      }
      wrapper.appendChild(table);
    });
  });
}

function markAttendance(sid,val,btn){
  const tr=btn.parentElement.parentElement;
  tr.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected");
  attendanceData[sid]=val;
}

function submitAttendance(){
  const date=document.getElementById("attendanceDate").value;
  if(!currentClassId || !currentSubjectId) return alert("Select a class and subject");
  db.ref(`attendance/${currentClassId}/${currentSubjectId}/${date}`).set(attendanceData)
    .then(()=>alert("Attendance submitted!"));
}

// ----------------- Analytics -----------------
function loadAnalytics(){
  const chartCanvas=document.getElementById("attendanceChart").getContext('2d');
  db.ref("classes").once("value").then(cSnap=>{
    const labels=[], presentData=[], absentData=[], defaulters=[];
    const minAtt=75;
    document.getElementById("minAttendanceAnalytics").innerText=minAtt;
    cSnap.forEach(c=>{
      const cls=c.val();
      for(let subj in cls.subjects){
        if(cls.subjects[subj].teacherId===currentTeacher){
          labels.push(cls.subjects[subj].name);
          const students=cls.students||{};
          let total=Object.keys(students).length;
          let present=0, absent=0;
          for(let sid in students){
            const sAtt=(cls.attendance?.[subj]?.[new Date().toISOString().split('T')[0]]||{})[sid];
            if(sAtt==='P') present++;
            else absent++;
            // Defaulter check
            const attCount=present/(total||1)*100;
            if(attCount<minAtt) defaulters.push(students[sid].name);
          }
          presentData.push(present);
          absentData.push(absent);
        }
      }
    });
    new Chart(chartCanvas,{
      type:'bar',
      data:{labels:labels,datasets:[
        {label:'Present',data:presentData,backgroundColor:'#2ecc71'},
        {label:'Absent',data:absentData,backgroundColor:'#e74c3c'}
      ]},
      options:{responsive:true,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true}}}
    });
    const defList=document.getElementById("defaulterList");
    defList.innerHTML="";
    defaulters.forEach(d=>{defList.innerHTML+="<li>"+d+"</li>"});
  });
}
loadAnalytics();
