const auth = firebase.auth();
const database = firebase.database();

function logout() {
  auth.signOut().then(()=>location.href="index.html");
}

function loadAttendance() {
  const uid = auth.currentUser.uid;
  const content = document.getElementById("content");
  content.innerHTML = "<h2>My Attendance</h2>";

  database.ref("classes").once("value").then(snapshot => {
    snapshot.forEach(cls => {
      cls.child("subjects").forEach(sub => {
        const attendance = sub.child("attendance");
        let total = 0, present = 0;

        attendance.forEach(date => {
          if(date.child(uid).exists()) {
            total++;
            if(date.child(uid).val() === "present") present++;
          }
        });

        if(total > 0) {
          const percent = Math.round((present/total)*100);
          const p = document.createElement("p");
          p.textContent = `${cls.key} - ${sub.key}: ${percent}%`;
          content.appendChild(p);
        }
      });
    });
  });
}
