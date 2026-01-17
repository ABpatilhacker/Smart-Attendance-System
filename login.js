function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      firebase.database().ref("users/" + uid).once("value")
        .then((snap) => {

          if (!snap.exists()) {
            alert("User data not found in database.\nAsk admin to add you.");
            firebase.auth().signOut();
            return;
          }

          const user = snap.val();

          // ✅ ROLE ONLY (NO APPROVAL CONFUSION)
          switch (user.role) {
            case "admin":
              window.location.href = "admin.html";
              break;

            case "teacher":
              window.location.href = "teacher.html";
              break;

            case "student":
              window.location.href = "student.html";
              break;

            default:
              alert("Invalid role");
              firebase.auth().signOut();
          }
        });
    })
    .catch(err => {
      alert(err.message);
    });
}
