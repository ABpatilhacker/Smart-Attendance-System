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
let currentUID = "";
let teacherClasses = {};

/******** AUTH ********/
auth.onAuthStateChanged(user => {
  if (!user) location.href = "login.html";
  currentUID = user.uid;
  loadTeacher(user.uid);
});

/******** UI ********/
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("pageTitle").innerText =
    id.charAt(0).toUpperCase() + id.slice(1);
}

function logout() {
  auth.signOut().then(() => location.href = "login.html");
}

/******** LOAD DATA ********/
function loadTeacher(uid) {
  db.ref("users/" + uid).once("value").then(snap => {
    const t = snap.val();
    document.getElementById("teacherName").innerText = t.name;
    document.getElementById("pName").innerText = t.name;
    document.getElementById("pEmail").innerText = t.email;
  });

  loadClasses();
}

function loadClasses() {
  db.ref("classes").once("value").then(snap => {
    let classCount = 0, subjectCount = 0, studentCount = 0;
    const classCards = document.getElementById("classCards");
    const subjectCards = document.getElementById("subjectCards");
    const select = document.getElementById("classSelect");

    classCards.innerHTML = "";
    subjectCards.innerHTML = "";
    select.innerHTML = "";

    snap.forEach(c => {
      let hasSubject = false;
      let subs = [];

      for (let s in c.val().subjects || {}) {
        if (c.val().subjects[s].teacherId === currentUID) {
          hasSubject = true;
          subs.push(c.val().subjects[s].name);
          subjectCount++;
        }
      }

      if (hasSubject) {
        classCount++;
        teacherClasses[c.key] = c.val().name;

        classCards.innerHTML += `
          <div class="class-card">
            <h3>${c.val().name}</h3>
            <div class="badge">${subs.length} Subjects</div>
          </div>`;

        subs.forEach(sub =>
          subjectCards.innerHTML += `
            <div class="subject-card">
              <h4>${sub}</h4>
              <p>${c.val().name}</p>
            </div>`
        );

        select.innerHTML += `<option value="${c.key}">${c.val().name}</option>`;
      }

      studentCount += Object.keys(c.val().students || {}).length;
    });

    document.getElementById("classCount").innerText = classCount;
    document.getElementById("subjectCount").innerText = subjectCount;
    document.getElementById("studentCount").innerText = studentCount;

    document.getElementById("pClasses").innerText = Object.values(teacherClasses).join(", ");
  });

  loadStudents();
}

function loadStudents() {
  document.getElementById("classSelect").onchange = function () {
    const cid = this.value;
    const tbody = document.getElementById("studentTable");
    tbody.innerHTML = "";

    db.ref("users").once("value").then(snap => {
      snap.forEach(u => {
        const s = u.val();
        if (s.role === "student" && s.classId === cid) {
          tbody.innerHTML += `
            <tr onclick="openStudent('${s.name}','${s.roll}','${teacherClasses[cid]}','${s.email}')">
              <td>${s.roll}</td>
              <td>${s.name}</td>
              <td>${s.email}</td>
            </tr>`;
        }
      });
    });
  };
}

/******** STUDENT PANEL ********/
function openStudent(name, roll, cls, email) {
  document.getElementById("sName").innerText = name;
  document.getElementById("sRoll").innerText = roll;
  document.getElementById("sClass").innerText = cls;
  document.getElementById("sEmail").innerText = email;
  document.getElementById("studentPanel").classList.add("active");
}

function closeStudent() {
  document.getElementById("studentPanel").classList.remove("active");
}
