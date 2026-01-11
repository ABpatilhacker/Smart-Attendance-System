console.log("login.js loaded");

document.addEventListener("DOMContentLoaded", () => {

  // ===== LOGIN =====
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");

  if (!loginBtn || !signupBtn) {
    alert("Buttons not found. Check IDs in HTML.");
    return;
  }

  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((cred) => {
        const uid = cred.user.uid;

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
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          alert("User not found. Please Sign Up first.");
        } else {
          alert(err.message);
        }
      });
  });

  // ===== SIGN UP =====
  signupBtn.addEventListener("click", () => {
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const role = document.getElementById("signup-role").value;

    if (!name || !email || !password) {
      alert("Fill all fields");
      return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((cred) => {
        const uid = cred.user.uid;

        firebase.database().ref("users/" + uid).set({
          name,
          email,
          role,
          status: "pending"   // admin approval
        });

        alert("Signup successful. Wait for admin approval.");
      })
      .catch((err) => alert(err.message));
  });

});
