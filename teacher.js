/******** FIREBASE ********/
const firebaseConfig = {
  apiKey: "AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain: "smart-attendance-system-17e89.firebaseapp.com",
  databaseURL: "https://smart-attendance-system-17e89-default-rtdb.firebaseio.com",
  projectId: "smart-attendance-system-17e89"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let teacherId = "";
let attendanceData = {};
const classId = "defaultClass";

/******** AUTH ********/
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "login.html";
  teacherId = user.uid;
  loadTeacher();
  loadStudents();
  loadDefaulters();
});

/******** UI ********/
function openSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

/******** SIDEBAR ********/
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

document.getElementById("menuBtn").onclick = () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
};

overlay.onclick = closeSidebar;

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

/******** TEACHER INFO ********/
function loadTeacher() {
  db.ref("users/" + teacherId).once("value").then(snap => {
    document.getElementById("welcomeText").innerText =
      "Welcome, " + snap.val().name;
  });

  // Assigned classes & subjects
  db.ref("classes").once("value").then(snap => {
    const box = document.createElement("div");
    box.className = "info-box";
    box.innerHTML = "<h3>Assigned Classes & Subjects</h3>";

    snap.forEach(c => {
      const subjects = c.val().subjects || {};
      Object.values(subjects).forEach(s => {
        if (s.teacherId === teacherId) {
          box.innerHTML += `<p><strong>${c.val().name}</strong> – ${s.name}</p>`;
        }
      });
    });

    document.getElementById("dashboard").prepend(box);
  });
}

/******** STUDENTS ********/
function loadStudents() {
  db.ref("users").once("value").then(snap => {
    const students = [];
    snap.forEach(s => {
      if (s.val().role === "student") students.push(s.val());
    });

    students.sort((a,b) => a.roll - b.roll);

    const body = document.getElementById("attendanceBody");
    body.innerHTML = "";

    students.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td>
          <button class="att-btn present-btn" onclick="mark(${s.roll},'P',this)">Present</button>
          <button class="att-btn absent-btn" onclick="mark(${s.roll},'A',this)">Absent</button>
        </td>`;
      body.appendChild(tr);
    });
  });
}

function mark(roll,status,btn){
  attendanceData[roll]=status;
  btn.parentElement.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}

/******** SAVE ********/
function saveAttendance(){
  const date = new Date().toISOString().split("T")[0];
  db.ref(`attendance/${classId}/${date}`).set(attendanceData).then(()=>{
    document.querySelectorAll(".att-btn").forEach(b=>b.style.opacity=.6);
    attendanceData={};
    alert("Attendance saved successfully");
    loadDefaulters();
  });
}

/******** DEFAULTERS ********/
function loadDefaulters(){
  const body = document.getElementById("defaulterBody");
  body.innerHTML="";

  db.ref(`attendance/${classId}`).once("value").then(snap=>{
    const count={};

    snap.forEach(d=>{
      Object.entries(d.val()).forEach(([roll,status])=>{
        if(!count[roll]) count[roll]={p:0,t:0};
        count[roll].t++;
        if(status==="P") count[roll].p++;
      });
    });

    Object.entries(count).forEach(([roll,v])=>{
      const perc = Math.round((v.p/v.t)*100);
      if(perc<75){
        const tr=document.createElement("tr");
        tr.innerHTML=`<td>${roll}</td><td>-</td><td>${perc}%</td>`;
        body.appendChild(tr);
      }
    });
  });
}

/******** LOGOUT ********/
function logout(){
  auth.signOut().then(()=>location.href="login.html");
}
