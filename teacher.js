/******************** FIREBASE CONFIG ********************/
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

let currentTeacherId = null;
let attendanceData = {};
let attendanceChart;

/******************** AUTH CHECK ********************/
auth.onAuthStateChanged(user => {
  if(!user) window.location.href="login.html";
  else currentTeacherId=user.uid, loadTeacherInfo(), loadClasses();
});

/******************** SIDEBAR ********************/
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('active'); }
window.addEventListener('click', e=>{ if(!e.target.closest('#sidebar') && !e.target.closest('.menu-btn')) document.getElementById('sidebar').classList.remove('active'); });

function openSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/******************** LOGOUT ********************/
function logout(){ auth.signOut().then(()=>window.location.href="login.html"); }

/******************** TEACHER INFO ********************/
function loadTeacherInfo(){
  db.ref("users/"+currentTeacherId).once("value").then(snap=>{
    const t = snap.val();
    document.getElementById('teacherWelcome').innerText=`Welcome, ${t.name}`;
    document.getElementById('profileName').innerText=t.name;
    document.getElementById('profileEmail').innerText=t.email;
  });
}

/******************** CLASSES ********************/
function loadClasses(){
  const classSelect = document.getElementById('attendanceClass');
  const recordClassSelect = document.getElementById('recordClass');
  db.ref('classes').once('value').then(snap=>{
    classSelect.innerHTML=''; recordClassSelect.innerHTML='';
    snap.forEach(c=>{
      const opt1=document.createElement('option');
      const opt2=document.createElement('option');
      opt1.value=c.key; opt1.textContent=c.val().name;
      opt2.value=c.key; opt2.textContent=c.val().name;
      classSelect.appendChild(opt1); recordClassSelect.appendChild(opt2);
    });
    loadSubjects();
  });
}

/******************** SUBJECTS ********************/
function loadSubjects(){
  const classId=document.getElementById('attendanceClass').value;
  const subjectSelect=document.getElementById('attendanceSubject');
  const recordSubjectSelect=document.getElementById('recordSubject');
  subjectSelect.innerHTML=''; recordSubjectSelect.innerHTML='';
  db.ref(`classes/${classId}/subjects`).once('value').then(snap=>{
    snap.forEach(s=>{
      const tId=s.val().teacherId;
      if(tId===currentTeacherId){
        const opt=document.createElement('option'); opt.value=s.key; opt.textContent=s.val().name;
        subjectSelect.appendChild(opt);
        const opt2=document.createElement('option'); opt2.value=s.key; opt2.textContent=s.val().name;
        recordSubjectSelect.appendChild(opt2);
      }
    });
  });
}

/******************** ATTENDANCE ********************/
function loadAttendance(){
  const classId=document.getElementById('attendanceClass').value;
  const subjectId=document.getElementById('attendanceSubject').value;
  const date=document.getElementById('attendanceDate').value;
  const tbody=document.querySelector('#attendanceTable tbody'); tbody.innerHTML='';
  attendanceData={};

  db.ref('users').orderByChild('classId').equalTo(classId).once('value').then(snap=>{
    const students=[]; snap.forEach(s=>{ const u=s.val(); if(u.role==='student'){students.push(u);}});
    students.sort((a,b)=>a.roll-b.roll);
    students.forEach(s=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${s.roll}</td>
        <td>${s.name}</td>
        <td>
          <button class="attendance-btn attendance-present" onclick="markAttendance('${s.roll}','present',this)">P</button>
          <button class="attendance-btn attendance-absent" onclick="markAttendance('${s.roll}','absent',this)">A</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function markAttendance(roll,status,btn){
  attendanceData[roll]=status;
  const parent=btn.parentElement; parent.querySelectorAll('button').forEach(b=>b.classList.remove('attendance-selected'));
  btn.classList.add('attendance-selected');
}

function saveAttendance(){
  const classId=document.getElementById('attendanceClass').value;
  const subjectId=document.getElementById('attendanceSubject').value;
  const date=document.getElementById('attendanceDate').value;
  const ref=db.ref(`attendance/${classId}/${subjectId}/${date}`);
  Object.keys(attendanceData).forEach(r=>ref.child(r).set(attendanceData[r]));
  toast("✅ Attendance Saved!");
}

/******************** RECORD CHART ********************/
function renderAttendanceChart(){
  const classId=document.getElementById('recordClass').value;
  const subjectId=document.getElementById('recordSubject').value;
  const date=document.getElementById('recordDate').value;
  if(!classId || !subjectId || !date) return;

  db.ref(`attendance/${classId}/${subjectId}/${date}`).once('value').then(snap=>{
    let present=0,absent=0;
    snap.forEach(s=>{ s.val()==='present'?present++:absent++; });

    const ctx=document.getElementById('attendanceChart').getContext('2d');
    if(attendanceChart) attendanceChart.destroy();

    attendanceChart=new Chart(ctx,{
      type:'doughnut',
      data:{labels:['Present','Absent'],datasets:[{data:[present,absent],backgroundColor:['rgba(72,239,128,0.85)','rgba(255,99,132,0.85)'],borderColor:['rgba(72,239,128,1)','rgba(255,99,132,1)'],borderWidth:3,hoverOffset:15}]},
      options:{responsive:true,cutout:'70%',plugins:{legend:{position:'bottom',labels:{color:'#fff',font:{size:14,weight:'600'}}},tooltip:{enabled:true,backgroundColor:'#000',titleColor:'#fff',bodyColor:'#fff'}},animation:{animateScale:true,animateRotate:true}}
    });
    document.getElementById('attendanceChart').style.filter="drop-shadow(0px 0px 20px rgba(72,239,128,0.7))";
  });
}

document.getElementById('recordClass').addEventListener('change',renderAttendanceChart);
document.getElementById('recordSubject').addEventListener('change',renderAttendanceChart);
document.getElementById('recordDate').addEventListener('change',renderAttendanceChart);

/******************** TOAST ********************/
function toast(msg){
  const t=document.createElement('div'); t.className='toast'; t.innerText=msg;
  document.body.appendChild(t); setTimeout(()=>t.classList.add('show'),100); setTimeout(()=>t.classList.remove('show'),3000); setTimeout(()=>t.remove(),3500);
}
