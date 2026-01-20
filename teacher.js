const firebaseConfig = { /* SAME CONFIG */ };
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

let attendanceData = {};
let today = new Date().toISOString().split("T")[0];

auth.onAuthStateChanged(user=>{
  if(!user) location.href="login.html";
  loadStudents();
  loadProfile();
});

function loadStudents(){
  db.ref("users").once("value",snap=>{
    let students=[];
    snap.forEach(u=>{
      if(u.val().role==="student"){
        students.push(u.val());
      }
    });
    students.sort((a,b)=>a.roll-b.roll);

    const table=document.getElementById("attendanceTable");
    table.innerHTML="";
    students.forEach(s=>{
      table.innerHTML+=`
      <tr>
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td><button onclick="mark('${s.roll}','P')" class="present">P</button></td>
        <td><button onclick="mark('${s.roll}','A')" class="absent">A</button></td>
      </tr>`;
    });

    document.getElementById("totalStudents").innerText=students.length;
  });
}

function mark(roll,status){
  attendanceData[roll]=status;
}

function saveAttendance(){
  db.ref("attendance/"+today).set(attendanceData);
  alert("Attendance Saved");
}

function loadAttendanceByDate(){
  const d=document.getElementById("recordDate").value;
  db.ref("attendance/"+d).once("value",snap=>{
    document.getElementById("recordView").innerText=JSON.stringify(snap.val(),null,2);
  });
}

function loadProfile(){
  const u=auth.currentUser;
  db.ref("users/"+u.uid).once("value",s=>{
    teacherName.value=s.val().name;
    teacherEmail.value=s.val().email;
  });
}

function saveProfile(){
  db.ref("users/"+auth.currentUser.uid).update({
    name: teacherName.value
  });
  alert("Profile Updated");
}

function toggleSidebar(){
  document.getElementById("sidebar").classList.toggle("open");
}
function closeSidebar(){
  document.getElementById("sidebar").classList.remove("open");
}
function openSection(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function logout(){
  auth.signOut();
}
