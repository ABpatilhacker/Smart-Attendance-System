function login() {
  alert("Login button clicked ✅");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log(email, password);

  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((cred) => {
      alert("Firebase login success ✅");

      const uid = cred.user.uid;
      firebase.database().ref("users/" + uid).once("value")
        .then((snap) => {
          if (!snap.exists()) {
            alert("User not found in database ❌");
            return;
          }

          const role = snap.val().role;
          alert("Role: " + role);

          if (role === "admin") location.href = "admin.html";
          if (role === "teacher") location.href = "teacher.html";
          if (role === "student") location.href = "student.html";
        });
    })
    .catch(err => {
      alert(err.message);
    });
}
