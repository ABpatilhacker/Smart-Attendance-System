firebase.initializeApp({
  apiKey:"AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain:"smart-attendance-system-17e89.firebaseapp.com",
  databaseURL:"https://smart-attendance-system-17e89-default-rtdb.firebaseio.com"
});

const auth=firebase.auth();
const db=firebase.database();

let teacherId="",attendance={},currentClass="",currentSubject="";

auth.onAuthStateChanged(u=>{
  if(!u)location.href="login.html";
  teacherId=u.uid;
  loadAssignments();
});

const sidebar=document.getElementById("sidebar");
const overlay=document.getElementById("overlay");

menuBtn.onclick=()=>{
  sidebar.classList.add("open");
  overlay.classList.add("show");
};
overlay.onclick=()=>{sidebar.classList.remove("open");overlay.classList.remove("show")};

function openSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  sidebar.classList.remove("open");overlay.classList.remove("show");
}

function loadAssignments(){
  db.ref("classes").once("value").then(snap=>{
    const box=document.getElementById("assignedData");
    const classSel=document.getElementById("classSelect");
    box.innerHTML="";classSel.innerHTML="<option>Select Class</option>";

    snap.forEach(c=>{
      const subs=c.val().subjects||{};
      Object.values(subs).forEach(s=>{
        if(s.teacherId===teacherId){
          box.innerHTML+=`<p><b>${c.val().name}</b> – ${s.name}</p>`;
          classSel.innerHTML+=`<option value="${c.key}">${c.val().name}</option>`;
        }
      });
    });
  });
}

classSelect.onchange=()=>{
  currentClass=classSelect.value;
  subjectSelect.innerHTML="<option>Select Subject</option>";
  db.ref(`classes/${currentClass}/subjects`).once("value").then(snap=>{
    snap.forEach(s=>{
      if(s.val().teacherId===teacherId)
        subjectSelect.innerHTML+=`<option value="${s.key}">${s.val().name}</option>`;
    });
  });
};

subjectSelect.onchange=()=>{
  currentSubject=subjectSelect.value;
  loadStudents();
};

function loadStudents(){
  attendance={};
  attendanceBody.innerHTML="";
  db.ref("users").once("value").then(snap=>{
    const students=[];
    snap.forEach(u=>{
      if(u.val().role==="student"&&u.val().classId===currentClass)
        students.push(u.val());
    });
    students.sort((a,b)=>a.roll-b.roll);
    students.forEach(s=>{
      attendanceBody.innerHTML+=`
        <tr>
          <td>${s.roll}</td>
          <td>${s.name}</td>
          <td>
            <button class="att-btn present" onclick="mark(${s.roll},'P',this)">Present</button>
            <button class="att-btn absent" onclick="mark(${s.roll},'A',this)">Absent</button>
          </td>
        </tr>`;
    });
  });
}

function mark(r,s,b){
  attendance[r]=s;
  b.parentElement.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
}

function saveAttendance(){
  const date=new Date().toISOString().split("T")[0];
  db.ref(`attendance/${currentClass}/${currentSubject}/${date}`)
    .set(attendance)
    .then(()=>alert("Attendance saved successfully"));
}
