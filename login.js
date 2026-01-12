console.log("login.js loaded");

window.onload = function () {

  const loginBtn = document.getElementById("login-btn");

  loginBtn.onclick = function () {

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCred) => {

        const uid = userCred.user.uid;

        firebase.database().ref("users/" + uid).once("value")
          .then((snap) => {
            if (!snap.exists()) {
              alert("Role not assigned. Contact admin.");
              return;
            }

            const role = snap.val().role;

            if (role === "admin") location.href = "admin.html";
            else if (role === "teacher") location.href = "teacher.html";
            else if (role === "student") location.href = "student.html";
            else alert("Invalid role");
          });
      })
      .catch((err) => alert(err.message));
  };
};
