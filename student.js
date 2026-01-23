let currentUser = null;
let currentClassId = "";
let selectedSubjectId = "";
let attendanceChart = null;

/* AUTH */
auth.onAuthStateChanged(user => {
  if (!user) return location.href = "index.html";
  currentUser = user;

  db.ref("students/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) return;

    currentClassId = snap.val().classId;
    loadDashboard();
    loadSubjects();
  });
});

/* DASHBOARD */
function loadDashboard() {
  db.ref("subjects")
    .orderByChild("classId")
    .equalTo(currentClassId)
    .once("value")
    .then(snap => {
      document.getElementById("classCount").innerText = snap.numChildren();
    });

  calculateOverallAttendance();
}

/* SUBJECTS */
function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  const list = document.getElementById("classList");

  select.innerHTML = `<option value="">Select Subject</option>`;
  list.innerHTML = "";

  db.ref("subjects")
    .orderByChild("classId")
    .equalTo(currentClassId)
    .once("value")
    .then(snap => {
      snap.forEach(sub => {
        select.innerHTML += `<option value="${sub.key}">${sub.val().name}</option>`;
        list.innerHTML += `
          <div class="card" onclick="openSubject('${sub.key}')">
            <h3>${sub.val().name}</h3>
          </div>`;
      });
    });
}

function openSubject(id) {
  selectedSubjectId = id;
  document.getElementById("subjectSelect").value = id;
  showSection("attendance");
  loadSubjectAttendance();
}

/* ATTENDANCE */
function loadSubjectAttendance() {
  const body = document.getElementById("attendanceTableBody");
  body.innerHTML = "";

  db.ref(`attendance/${currentClassId}/${selectedSubjectId}`).once("value")
    .then(snap => {
      let present = 0, total = 0;
      let labels = [], values = [];

      snap.forEach(d => {
        const s = d.val()[currentUser.uid];
        if (s) {
          total++;
          if (s === "P") present++;
        }

        body.innerHTML += `
          <tr>
            <td>${d.key}</td>
            <td class="${s==='P'?'present':'absent'}">${s||'-'}</td>
          </tr>`;

        labels.push(d.key);
        values.push(s === "P" ? 1 : 0);
      });

      drawChart(labels, values);
    });
}

/* OVERALL % */
function calculateOverallAttendance() {
  let total = 0, present = 0;

  db.ref("attendance/" + currentClassId).once("value").then(subs => {
    subs.forEach(sub => {
      sub.forEach(d => {
        const s = d.val()[currentUser.uid];
        if (s) {
          total++;
          if (s === "P") present++;
        }
      });
    });

    document.getElementById("attendancePercent").innerText =
      total ? ((present/total)*100).toFixed(1)+"%" : "0%";
  });
}

/* CHART */
function drawChart(labels,data){
  if(attendanceChart) attendanceChart.destroy();
  attendanceChart = new Chart(document.getElementById("attendanceChart"),{
    type:"doughnut",
    data:{labels,datasets:[{data,backgroundColor:["#22c55e","#ef4444"]}]}
  });
}

/* UI */
function toggleSidebar(){
  document.getElementById("sidebar").classList.toggle("open");
}
function closeSidebar(){
  document.getElementById("sidebar").classList.remove("open");
}
function showSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  closeSidebar();
}

/* LOGOUT */
function logout(){
  auth.signOut().then(()=>location.href="index.html");
}
