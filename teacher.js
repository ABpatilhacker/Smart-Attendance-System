let currentClass, currentSubject, selectedDate;
let studentCache = {};

auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";

  db.ref("users/"+user.uid).once("value").then(snap=>{
    document.getElementById("teacherName").innerText =
      "👨‍🏫 " + snap.val().name;
    loadAssignments(user.uid);
  });
});

function loadAssignments(uid){
  const box = document.getElementById("subjectList");
  box.innerHTML = "";

  db.ref(`users/${uid}/assignments`).once("value").then(snap=>{
    snap.forEach(a=>{
      const [cid,sid] = a.key.split("_");
      db.ref(`classes/${cid}`).once("value").then(c=>{
        const div = document.createElement("div");
        div.className="card";
        div.innerHTML=`
          <h4>${c.val().subjects[sid]}</h4>
          <p>${c.val().name}</p>
          <button onclick="openAttendance('${cid}','${sid}')">
            Take Attendance
          </button>`;
        box.appendChild(div);
      });
    });
  });
}

function openAttendance(cid,sid){
  currentClass=cid;
  currentSubject=sid;
  selectedDate=new Date().toISOString().split("T")[0];

  document.getElementById("attendanceSection").style.display="block";
  document.getElementById("datePicker").value=selectedDate;
  document.getElementById("datePicker").onchange=e=>{
    selectedDate=e.target.value;
    loadStudents();
  };

  loadStudents();
}

function loadStudents(){
  const box=document.getElementById("studentCards");
  box.innerHTML="";
  studentCache={};

  db.ref(`classes/${currentClass}/students`).once("value").then(snap=>{
    snap.forEach(s=>{
      studentCache[s.key]=s.val();
      box.innerHTML+=`
        <div class="student" id="stu-${s.key}">
          <span>${s.val().roll} - ${s.val().name}</span>
          <input type="checkbox" checked data-id="${s.key}">
        </div>`;
    });
    loadAnalytics();
  });
}

function saveAttendance(){
  let present=0;
  let total=Object.keys(studentCache).length;
  const data={};

  document.querySelectorAll("input[type=checkbox]").forEach(c=>{
    data[c.dataset.id]=c.checked;
    if(c.checked) present++;
  });

  const percent=Math.round((present/total)*100);

  db.ref(`attendance/${currentClass}/${currentSubject}/${selectedDate}`)
    .set(data);

  db.ref(`adminNotifications`).push({
    msg:`Attendance saved (${percent}%)`,
    time:Date.now()
  });

  alert("Attendance Saved");
  loadAnalytics();
}

function loadAnalytics(){
  const box=document.getElementById("analytics");
  box.innerHTML=`
    <div>Present %</div>
    <div>Absent %</div>
    <div>Defaulters</div>
  `;
}

function exportCSV(){
  let csv="Roll,Name,Present\n";
  document.querySelectorAll("input[type=checkbox]").forEach(c=>{
    const s=studentCache[c.dataset.id];
    csv+=`${s.roll},${s.name},${c.checked}\n`;
  });

  const blob=new Blob([csv]);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="attendance.csv";
  a.click();
}

function logout(){
  auth.signOut();
  location.href="login.html";
    }
