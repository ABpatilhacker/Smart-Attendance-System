const auth = firebase.auth();
const database = firebase.database();

function logout() {
  auth.signOut().then(()=>location.href="index.html");
}

auth.onAuthStateChanged(user => {
  if(!user) location.href="login.html";
});

function loadClasses() {
  const uid = auth.currentUser.uid;
  const content = document.getElementById("content");
  content.innerHTML = "<h2>My Classes</h2>";

  database.ref("classes").once("value").then(snapshot => {
    snapshot.forEach(cls => {
      const className = cls.key;
      cls.child("subjects").forEach(sub => {
        if(sub.val().teacherId === uid) {
          const btn = document.createElement("button");
          btn.className = "btn primary";
          btn.textContent = className + " - " + sub.key;
          btn.onclick = () => markAttendance(className, sub.key);
          content.appendChild(btn);
        }
      });
    });
  });
}

function markAttendance(className, subject) {
  const content = document.getElementById("content");
  content.innerHTML = `<h2>${className} - ${subject}</h2><ul id="student-list"></ul>`;

  const list = document.getElementById("student-list");

  database.ref(`classes/${className}/subjects/${subject}/students`)
    .once("value").then(students => {
      students.forEach(stu => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${stu.key}</span>
          <div class="attendance-btns">
            <button class="present" onclick="saveAttendance('${className}','${subject}','${stu.key}','present')">Present</button>
            <button class="absent" onclick="saveAttendance('${className}','${subject}','${stu.key}','absent')">Absent</button>
          </div>`;
        list.appendChild(li);
      });
    });
}

function saveAttendance(className, subject, studentId, status) {
  const date = new Date().toISOString().slice(0,10);
  database.ref(`classes/${className}/subjects/${subject}/attendance/${date}/${studentId}`).set(status);
}
