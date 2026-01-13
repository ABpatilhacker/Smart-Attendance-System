console.log("teacher.js loaded");

const auth = window.auth;
const db = window.db;

// Overlay & sidebar
const overlay = document.createElement("div");
overlay.className = "overlay";
document.body.appendChild(overlay);

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  overlay.classList.toggle("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  overlay.classList.remove("show");
}

overlay.addEventListener("click", closeSidebar);

// Handle sidebar menu clicks
function handleMenu(type) {
  closeSidebar();
  if(type === 'dashboard') showDashboard();
  if(type === 'classes') showClasses();
  if(type === 'attendance') showAttendance();
  if(type === 'defaulters') showDefaulters();
}

// Logout
function logout() {
  auth.signOut().then(() => location.href='login.html');
}

// Dashboard Overview
function showDashboard() {
  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="card">
      <h3>📊 Dashboard Overview</h3>
      <p>Total Classes Assigned: <span id="total-classes">0</span></p>
      <p>Total Students: <span id="total-students">0</span></p>
      <p>Attendance Today: <span id="attendance-today">0%</span></p>
    </div>
  `;

  // Fetch stats
  const uid = auth.currentUser.uid;
  db.ref("teachers/"+uid+"/subjects").once("value").then(snap => {
    const classes = snap.val() || {};
    document.getElementById("total-classes").textContent = Object.keys(classes).length;

    let totalStudents = 0;
    Object.keys(classes).forEach(cls => {
      totalStudents += Object.keys(classes[cls].students || {}).length;
    });
    document.getElementById("total-students").textContent = totalStudents;

    const today = new Date().toISOString().split("T")[0];
    let attended = 0, total = 0;
    Object.keys(classes).forEach(cls => {
      const students = classes[cls].students || {};
      total += Object.keys(students).length;
      Object.keys(students).forEach(sid => {
        db.ref("teachers/"+uid+"/subjects/"+cls+"/students/"+sid+"/attendance/"+today)
          .once("value").then(snap => {
            if(snap.val() === "present") attended++;
            const percent = total ? Math.round((attended/total)*100) : 0;
            document.getElementById("attendance-today").textContent = percent+"%";
          });
      });
    });
  });
}

// Classes & Students
function showClasses() {
  const view = document.getElementById("view");
  view.innerHTML = `<h2>Classes & Students</h2><div id="class-list"></div>`;

  const uid = auth.currentUser.uid;
  db.ref("teachers/"+uid+"/subjects").once("value").then(snap => {
    const classes = snap.val() || {};
    const container = document.getElementById("class-list");
    container.innerHTML = "";
    Object.keys(classes).forEach(cls => {
      const div = document.createElement("div");
      div.className = "card";
      const students = classes[cls].students || {};
      div.innerHTML = `
        <h3>${cls}</h3>
        <p>Students: ${Object.keys(students).length}</p>
        <ul>${Object.values(students).map(s=>`<li>${s.name}</li>`).join("")}</ul>
      `;
      container.appendChild(div);
    });
  });
}

// Attendance marking
function showAttendance() {
  const view = document.getElementById("view");
  const uid = auth.currentUser.uid;
  db.ref("teachers/"+uid+"/subjects").once("value").then(snap => {
    const classes = snap.val() || {};
    let html = "<h2>Mark Attendance</h2>";
    Object.keys(classes).forEach(cls => {
      const students = classes[cls].students || {};
      html += `<h3>${cls}</h3><table border="1" style="width:100%;margin-bottom:20px;">
        <tr><th>Name</th><th>Mark</th></tr>`;
      Object.keys(students).forEach(sid => {
        html += `<tr>
          <td>${students[sid].name}</td>
          <td>
            <button onclick="markAttendance('${cls}','${sid}','present')">✅ Present</button>
            <button onclick="markAttendance('${cls}','${sid}','absent')">❌ Absent</button>
          </td>
        </tr>`;
      });
      html += "</table>";
    });
    view.innerHTML = html;
  });
}

// Mark attendance function
function markAttendance(cls, sid, status) {
  const uid = auth.currentUser.uid;
  const today = new Date().toISOString().split("T")[0];
  db.ref(`teachers/${uid}/subjects/${cls}/students/${sid}/attendance/${today}`).set(status);
  alert(`Marked ${status} for ${cls} - ${sid}`);
}

// Defaulter list
function showDefaulters() {
  const view = document.getElementById("view");
  view.innerHTML = `<h2>Defaulters (Attendance < 75%)</h2>
    <input type="date" id="start-date"> to <input type="date" id="end-date">
    <button onclick="loadDefaulters()">Filter</button>
    <div id="defaulter-list"></div>`;
}

function loadDefaulters() {
  const uid = auth.currentUser.uid;
  const start = document.getElementById("start-date").value;
  const end = document.getElementById("end-date").value;
  const listDiv = document.getElementById("defaulter-list");
  listDiv.innerHTML = "";

  db.ref("teachers/"+uid+"/subjects").once("value").then(snap => {
    const classes = snap.val() || {};
    Object.keys(classes).forEach(cls => {
      const students = classes[cls].students || {};
      Object.keys(students).forEach(sid => {
        db.ref(`teachers/${uid}/subjects/${cls}/students/${sid}/attendance`).once("value").then(attSnap=>{
          const attendance = attSnap.val() || {};
          let presentCount = 0, totalCount = 0;
          Object.keys(attendance).forEach(date=>{
            if(!start || !end || (date>=start && date<=end)){
              totalCount++;
              if(attendance[date]==="present") presentCount++;
            }
          });
          const percent = totalCount?Math.round((presentCount/totalCount)*100):100;
          if(percent<75){
            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `<strong>${students[sid].name}</strong> - ${percent}% attendance in ${cls}`;
            listDiv.appendChild(div);
          }
        });
      });
    });
  });
}

// Load dashboard by default after login
auth.onAuthStateChanged(user => {
  if(user) showDashboard();
  else location.href="login.html";
});