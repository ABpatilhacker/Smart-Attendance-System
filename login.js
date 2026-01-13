console.log("login.js loaded");

// ---------- LOGIN ----------
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      db.ref("users/" + uid).once("value").then((snap) => {
        if (!snap.exists()) {
          alert("Account not found. Please sign up.");
          auth.signOut();
          return;
        }

        const user = snap.val();

        if (user.status !== "approved") {
          alert("Your account is pending admin approval.");
          auth.signOut();
          return;
        }

        // ROLE REDIRECT
        if (user.role === "admin") {
          location.href = "admin.html";
        } else if (user.role === "teacher") {
          location.href = "teacher.html";
        } else {
          location.href = "student.html";
        }
      });
    })
    .catch((err) => alert(err.message));
});

// ---------- SIGN UP ----------
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

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      const uid = cred.user.uid;

      // 👇 THIS IS THE IMPORTANT PART
      const status = role === "admin" ? "approved" : "pending";

      db.ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        status: status,
        createdAt: Date.now()
      });

      alert("Signup successful! Wait for admin approval.");
      auth.signOut();
    })
    .catch((err) => alert(err.message));
};
