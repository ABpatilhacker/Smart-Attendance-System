const auth = firebase.auth();
const db = firebase.database();

auth.onAuthStateChanged(user => {
  if (!user) {
    location.href = "index.html";
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists() || snap.val().role !== "student") {
      alert("Access denied");
      auth.signOut();
      return;
    }

    const s = snap.val();
    document.getElementById("studentName").innerText = s.name;
    document.getElementById("studentRoll").innerText = "Roll No: " + s.roll;

    loadAttendance(user.uid, s.classId);
  });
});

function loadAttendance(studentId, classId) {
  let total = 0;
  let present = 0;
  const table = document.getElementById("attendanceTable");

  db.ref("attendance/" + classId).once("value").then(snap => {
    table.innerHTML = "";

    snap.forEach(subject => {
      let subTotal = 0;
      let subPresent = 0;

      subject.forEach(date => {
        if (date.val()[studentId]) {
          subTotal++;
          if (date.val()[studentId] === "P") subPresent++;
        }
      });

      total += subTotal;
      present += subPresent;

      const percent = subTotal ? Math.round((subPresent / subTotal) * 100) : 0;

      table.innerHTML += `
        <tr>
          <td>${subject.key}</td>
          <td>${subPresent}</td>
          <td>${subTotal}</td>
          <td>${percent}%</td>
        </tr>`;
    });

    const overall = total ? Math.round((present / total) * 100) : 0;
    document.getElementById("attendancePercent").innerText = overall + "%";

    if (overall < 75) {
      document.getElementById("defaulterBox").style.display = "block";
    }
  });
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}
