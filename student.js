const auth = firebase.auth();
const db = firebase.database();

const sidebar = document.getElementById("sidebar");
const studentNameEl = document.getElementById("studentName");

function toggleSidebar() {
  sidebar.classList.toggle("open");
}
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("pageTitle").innerText = id.charAt(0).toUpperCase() + id.slice(1);
  sidebar.classList.remove("open"); // auto close on click
}

// Logout
function logout(){ auth.signOut().then(()=>location.href="index.html"); }

// Auth state
auth.onAuthStateChanged(user=>{
  if(!user) location.href="index.html";
  db.ref("users/"+user.uid).once("value").then(snap=>{
    if(!snap.exists() || snap.val().role!=="student"){ alert("Access Denied"); auth.signOut(); }
    studentNameEl.innerText = snap.val().name;
    loadDashboard(user.uid);
    loadAttendance(user.uid);
  });
});

// Load Dashboard
function loadDashboard(uid){
  db.ref("users/"+uid).once("value").then(snap=>{
    const student = snap.val();
    const classId = student.classId;
    db.ref("classes/"+classId+"/subjects").once("value").then(subSnap=>{
      const subjects = subSnap.val();
      const labels = [], data = [];
      for(let sub in subjects){
        labels.push(subjects[sub].name);
        db.ref(`attendance/${classId}/${sub}`).once("value").then(attSnap=>{
          let total = 0, present=0;
          attSnap.forEach(dateSnap=>{
            if(dateSnap.hasChild(uid)){
              total++;
              if(dateSnap.child(uid).val()==="P") present++;
            }
          });
          data.push(total?Math.round(present/total*100):0);
          if(data.length===labels.length){
            // Chart
            new Chart(document.getElementById('subjectChart').getContext('2d'),{
              type:'bar',
              data:{labels, datasets:[{label:'Attendance %',data,color:'#2980b9',backgroundColor:'#3498db'}]},
              options:{responsive:true,scales:{y:{beginAtZero:true,max:100}}}
            });
          }
        });
      }
    });
  });
}

// Load Attendance Table & Calendar
function loadAttendance(uid){
  db.ref("users/"+uid).once("value").then(snap=>{
    const student = snap.val();
    const classId = student.classId;
    db.ref("classes/"+classId+"/subjects").once("value").then(subSnap=>{
      const subjects = subSnap.val();
      const tbody = document.querySelector("#attendanceTable tbody");
      tbody.innerHTML="";
      const calendarEl = document.getElementById("calendar");
      calendarEl.innerHTML="";
      for(let sub in subjects){
        db.ref(`attendance/${classId}/${sub}`).once("value").then(attSnap=>{
          attSnap.forEach(dateSnap=>{
            const date = dateSnap.key;
            const status = dateSnap.child(uid).exists()?dateSnap.child(uid).val():"A";
            // Table
            tbody.innerHTML += `<tr>
              <td>${date}</td>
              <td>${subjects[sub].name}</td>
              <td>${status==="P"?"Present":"Absent"}</td>
            </tr>`;
            // Calendar
            const div = document.createElement("div");
            div.innerText = date.split("-")[2]; // day
            div.className = status==="P"?"present":"absent";
            calendarEl.appendChild(div);
          });
        });
      }
    });
  });
    }
