function loadAttendance(uid, cls, subject) {
  db.ref(`attendance/${cls}/${subject}`).once("value", snap => {
    let total = 0, present = 0;

    snap.forEach(day => {
      total++;
      if (day.val()[uid] === "P") present++;
    });

    document.getElementById("percent").innerText =
      ((present / total) * 100).toFixed(2) + "%";
  });
}function logout(){
  firebase.auth().signOut();
  location.href = "index.html";
}