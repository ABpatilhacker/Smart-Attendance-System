firebase.initializeApp({
  apiKey:"AIzaSyB3ytMC77uaEwdqmXgr1t-PN0z3qV_Dxi8",
  authDomain:"smart-attendance-system-17e89.firebaseapp.com",
  databaseURL:"https://smart-attendance-system-17e89-default-rtdb.firebaseio.com"
});

const auth=firebase.auth(),db=firebase.database();
let uid="",attendance={},cls="",sub="";

auth.onAuthStateChanged(u=>{
  if(!u)location.href="login.html";
  uid=u.uid;
  db.ref("users/"+uid).once("value").then(s=>{
    welcomeText.innerText="Welcome, "+s.val().name;
    profileName.value=s.val().name;
    profileEmail.value=s.val().email;
  });
  loadClasses();
});

menuBtn.onclick=()=>{sidebar.classList.add("open");overlay.classList.add("show")}
overlay.onclick=()=>{sidebar.classList.remove("open");overlay.classList.remove("show")}

function openSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  sidebar.classList.remove("open");overlay.classList.remove("show");
}

function loadClasses(){
  db.ref("classes").once("value").then(s=>{
    classSelect.innerHTML="<option>Select Class</option>";
    recordClass.innerHTML="<option>Select Class</option>";
    s.forEach(c=>{
      classSelect.innerHTML+=`<option value="${c.key}">${c.val().name}</option>`;
      recordClass.innerHTML+=`<option value="${c.key}">${c.val().name}</option>`;
    });
  });
}

classSelect.onchange=()=>{
  cls=classSelect.value;
  subjectSelect.innerHTML="<option>Select Subject</option>";
  db.ref(`classes/${cls}/subjects`).once("value").then(s=>{
    s.forEach(x=>{
      if(x.val().teacherId===uid)
        subjectSelect.innerHTML+=`<option value="${x.key}">${x.val().name}</option>`;
    });
  });
};

subjectSelect.onchange=()=>{sub=subjectSelect.value;loadStudents()}

function loadStudents(){
  attendance={};
  attendanceBody.innerHTML="";
  db.ref("users").once("value").then(s=>{
    let arr=[];
    s.forEach(u=>{
      if(u.val().role==="student"&&u.val().classId===cls)arr.push(u.val());
    });
    arr.sort((a,b)=>a.roll-b.roll);
    arr.forEach(st=>{
      attendanceBody.innerHTML+=`
      <tr>
        <td>${st.roll}</td>
        <td>${st.name}</td>
        <td>
          <button onclick="mark(${st.roll},'P',this)">P</button>
          <button onclick="mark(${st.roll},'A',this)">A</button>
        </td>
      </tr>`;
    });
  });
}

function mark(r,v,b){
  attendance[r]=v;
  b.parentElement.querySelectorAll("button").forEach(x=>x.style.opacity=.5);
  b.style.opacity=1;
}

function saveAttendance(){
  const d=new Date().toISOString().split("T")[0];
  db.ref(`attendance/${cls}/${sub}/${d}`).set(attendance).then(()=>{
    toast.classList.add("show");
    setTimeout(()=>toast.classList.remove("show"),3000);
  });
}

recordDate.onchange=()=>loadRecords();
recordSubject.onchange=()=>loadRecords();
recordClass.onchange=()=>loadRecords();

function loadRecords(){
  if(!recordClass.value||!recordSubject.value||!recordDate.value)return;
  recordBody.innerHTML="";
  db.ref(`attendance/${recordClass.value}/${recordSubject.value}/${recordDate.value}`)
    .once("value").then(s=>{
      s.forEach(r=>{
        recordBody.innerHTML+=`<tr><td>${r.key}</td><td>${r.val()}</td></tr>`;
      });
    });
}

function saveProfile(){
  db.ref("users/"+uid+"/name").set(profileName.value);
}
