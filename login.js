console.log("login.js loaded");

// ---------- LOGIN ----------
document.getElementById("login-btn").onclick = function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;

      db.ref("users/" + uid).once("value").then(snap => {
        if (!snap.exists()) {
          alert("User record not found");
          auth.signOut();
          return;
        }

        const user = snap.val();

        if (user.status !== "approved") {
          alert("Your account is not approved by admin");
          auth.signOut();
          return;
        }

        if (user.role === "admin") location.href = "admin.html";
        else if (user.role === "teacher") location.href = "teacher.html";
        else location.href = "student.html";
      });
    })
    .catch(err => alert(err.message));
};

// ---------- SIGN UP ----------
document.getElementById("signup-btn").onclick = function () {
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const role = document.getElementById("signup-role").value;

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      const uid = cred.user.uid;

      const status = role === "admin" ? "approved" : "pending";

      db.ref("users/" + uid).set({
        name: name,
        email: email,
        role: role,
        status: status
      });

      alert("Signup successful. Wait for admin approval.");
      auth.signOut();
    })
    .catch(err => alert(err.message));
};
