firebase.auth().signInWithEmailAndPassword(email, password)
.then(cred => {
  const uid = cred.user.uid;
  return firebase.database().ref("users/" + uid).once("value");
})
.then(snapshot => {
  if (!snapshot.exists()) {
    alert("User data not found");
    return;
  }

  const role = snapshot.val().role;

  if (role === "admin") location.href = "admin.html";
  else if (role === "teacher") location.href = "teacher.html";
  else if (role === "student") location.href = "student.html";
  else alert("Invalid role");
});
