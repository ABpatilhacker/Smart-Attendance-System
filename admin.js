firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  firebase.database().ref("users/" + user.uid).once("value")
    .then(snap => {
      if (!snap.exists() || snap.val().role !== "admin") {
        alert("Access Denied");
        firebase.auth().signOut();
        window.location.href = "login.html";
      } else {
        loadDashboard();
        loadClasses();
        loadTeachers();
        loadStudents();
        loadSettings();
      }
    });
});

const db = firebase.database();

/* DASHBOARD */
function loadDashboard() {
  let teacherCount = 0;
  let studentCount = 0;

  db.ref("users").once("value", snap => {
    snap.forEach(u => {
      if (u.val().role === "teacher") teacherCount++;
      if (u.val().role === "student") studentCount++;
    });

    document.getElementById("teacherCount").innerText = teacherCount;
    document.getElementById("studentCount").innerText = studentCount;
  });

  db.ref("classes").once("value", snap => {
    document.getElementById("classCount").innerText = snap.numChildren();
  });
}

/* CLASSES */
function addClass() {
  const name = document.getElementById("className").value.trim();
  if (!name) return alert("Enter class name");

  db.ref("classes").push({ name });
  document.getElementById("className").value = "";
}

function loadClasses() {
  const classList = document.getElementById("classList");
  const classSelect = document.getElementById("studentClass");

  db.ref("classes").on("value", snap => {
    classList.innerHTML = "";
    classSelect.innerHTML = "<option value=''>Select Class</option>";

    snap.forEach(c => {
      classList.innerHTML += `<li>${c.val().name}</li>`;
      classSelect.innerHTML += `<option value="${c.key}">${c.val().name}</option>`;
    });
  });
}

/* TEACHERS */
function loadTeachers() {
  const list = document.getElementById("teacherList");

  db.ref("users").orderByChild("role").equalTo("teacher")
    .on("value", snap => {
      list.innerHTML = "";
      snap.forEach(t => {
        list.innerHTML += `<li>👨‍🏫 ${t.val().name}</li>`;
      });
    });
}

/* STUDENTS */
function loadStudents() {
  const list = document.getElementById("studentList");

  db.ref("users").orderByChild("role").equalTo("student")
    .on("value", snap => {
      list.innerHTML = "";
      snap.forEach(s => {
        list.innerHTML += `<li>🎓 ${s.val().name} (Roll ${s.val().roll})</li>`;
      });
    });
}

/* SETTINGS */
function loadSettings() {
  db.ref("settings/minAttendance").once("value", snap => {
    document.getElementById("minAttendance").value = snap.val() || 75;
  });
}

function saveSettings() {
  const val = Number(document.getElementById("minAttendance").value);
  if (!val) return alert("Enter valid percentage");

  db.ref("settings/minAttendance").set(val);
  alert("Settings saved");
}

function logout() {
  firebase.auth().signOut().then(() => location.href = "login.html");
}
