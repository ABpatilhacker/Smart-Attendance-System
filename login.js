console.log("login.js loaded");

// ---------- LOGIN ----------
document.getElementById("login-btn").onclick = function () {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  window.auth
    .signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      // Get user data
      window.db.ref("users/" + uid).once("value").then((snap) => {
        if (!snap.exists()) {
          alert("User data missing. Contact admin.");
          return;
        }

        const data = snap.val();

        // Admin approval check
        if (data.status === "pending") {
          alert("Your account is pending admin approval.");
          window.auth.signOut();
          return;
        }

        // Role-based redirect
        if (data.role === "admin") {
          location.href = "admin.html";
        } else if (data.role === "teacher") {
          location.href = "teacher.html";
        } else if (data.role === "student") {
          location.href = "student.html";
        } else {
          alert("Invalid role");
        }
      });
    })
    .catch((err) => {
      if (err.code === "auth/user-not-found") {
        alert("User not found. Please Sign Up.");
      } else {
        alert(err.message);
      }
    });
};

// ---------- SIGN UP ----------
document.getElementById("signup-btn").onclick = function () {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const role = document.getElementById("signup-role").value;

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  window.auth
    .createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      // Save user data (PENDING APPROVAL)
      window.db.ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        status: role === "admin" ? "approved" : "pending",
        createdAt: Date.now()
      });

      alert("Signup successful! Wait for admin approval.");
      window.auth.signOut();
    })
    .catch((err) => alert(err.message));
};
